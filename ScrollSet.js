const path = require("path")
const lodash = require("lodash")

const { TreeNode } = require("scrollsdk/products/TreeNode.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollFile, ScrollFileSystem } = require("scroll-cli")
const scrollFs = new ScrollFileSystem()

class ScrollSetCLI {
  constructor() {
    this.quickCache = {}
  }

  importCommand(filename) {
    const extension = filename.split(".").pop()

    if (extension === "csv") TreeNode.fromCsv(Disk.read(filename)).forEach(patch => this.patchAndSave(patch))

    if (extension === "tsv") TreeNode.fromTsv(Disk.read(filename)).forEach(patch => this.patchAndSave(patch))

    if (extension === "tree") TreeNode.fromDisk(filename).forEach(patch => this.patchAndSave(patch))
  }

  get searchIndex() {
    if (!this.quickCache.searchIndex) this.quickCache.searchIndex = this.makeNameSearchIndex()
    return this.quickCache.searchIndex
  }

  makeFilePath(id) {
    return path.join(this.conceptsFolder, id + ".scroll")
  }

  getTree(file) {
    return new TreeNode(Disk.read(this.makeFilePath(file.id)))
  }

  patchAndSave(patch) {
    const id = patch.get("id")
    patch.delete("id")
    const target = this.makeFilePath(id)
    if (!Disk.exists(target)) {
      console.log(`Now match for ${id}`)
      return
    }
    console.log(`Patching ${id}`)
    return new ScrollFile(new TreeNode(Disk.read(target)).patch(patch).toString(), target, scrollFs).formatAndSave()
  }

  setAndSave(file, measurementPath, measurementValue) {
    const tree = this.getTree(file)
    tree.set(measurementPath, measurementValue)
    return this.formatAndSave(file, tree)
  }

  formatAndSave(file, tree = this.getTree(file)) {
    const formatted = new ScrollFile(tree.toString(), this.makeFilePath(file.id), scrollFs).formatted
    // force a write
    return scrollFs.write(this.makeFilePath(file.id), formatted)
  }

  makeNameSearchIndex(files = this.concepts.slice(0).reverse()) {
    const map = new Map()
    files.forEach(parsedConcept =>
      this.makeNames(parsedConcept).forEach(name => map.set(name.toLowerCase(), parsedConcept))
    )
    return map
  }

  makeNames(concept) {
    return [concept.id]
  }

  searchForConcept(query) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return (
      searchIndex.get(query) || searchIndex.get(query.toLowerCase()) || searchIndex.get(Utils.titleToPermalink(query))
    )
  }

  searchForConceptCommand(query) {
    console.log(lodash.pickBy(this.searchForConcept(query), lodash.identity))
  }

  parsersFile = ""
  scrollSetName = "myScrollSet"

  get concepts() {
    return require(this.compiledConcepts)
  }

  async updateIdsCommand() {
    this.concepts.forEach(file => {
      const dest = path.join(this.conceptsFolder, file.filename)
      const tree = new TreeNode(Disk.read(dest))
      const newTree = tree.toString().replace(
        `import ../code/conceptPage.scroll
id `,
        `import ../code/conceptPage.scroll
id ${file.filename.replace(".scroll", "")}
name `
      )
      Disk.write(dest, newTree.toString())
    })
  }

  buildParsersFileCommand() {
    const code = `node_modules/scroll-cli/parsers/cellTypes.parsers
node_modules/scroll-cli/parsers/root.parsers
node_modules/scroll-cli/parsers/build.parsers
node_modules/scroll-cli/parsers/comments.parsers
node_modules/scroll-cli/parsers/blankLine.parsers
node_modules/scroll-cli/parsers/measures.parsers
node_modules/scroll-cli/parsers/import.parsers
node_modules/scroll-cli/parsers/errors.parsers
${this.parsersFile}`
      .trim()
      .split("\n")
      .map(filepath => Disk.read(path.join(__dirname, filepath)))
      .join("\n\n")
      .replace("catchAllParser catchAllParagraphParser", "catchAllParser errorParser")
      .replace(/^importOnly\n/gm, "")
      .replace(/^import .+/gm, "")
    Disk.write(path.join(__dirname, `${this.scrollSetName}.parsers`), code)
  }
}

module.exports = { ScrollSetCLI }
