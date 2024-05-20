const path = require("path")
const lodash = require("lodash")

const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { Disk } = require("jtree/products/Disk.node.js")

class ScrollSetCLI {
  constructor() {
    this.quickCache = {}
  }

  importCommand(filename) {
    // todo: add support for updating as well
    const processEntry = (node, index) => {
      const filename = node.get("filename")
      node.delete("filename")
      const target = path.join(__dirname, "concepts", filename)
      Disk.write(target, new TreeNode(Disk.read(target)).patch(node).toString())
      console.log(`Processed ${filename}`)
    }

    const extension = filename.split(".").pop()

    if (extension === "csv") TreeNode.fromCsv(Disk.read(filename)).forEach(processEntry)

    if (extension === "tsv") TreeNode.fromTsv(Disk.read(filename)).forEach(processEntry)

    if (extension === "tree") TreeNode.fromDisk(filename).forEach(processEntry)
  }

  get searchIndex() {
    if (!this.quickCache.searchIndex) this.quickCache.searchIndex = this.makeNameSearchIndex()
    return this.quickCache.searchIndex
  }

  makeFilePath(id) {
    return path.join(this.conceptsFolder, id.replace(".scroll", "") + ".scroll")
  }

  getTree(file) {
    return new TreeNode(Disk.read(this.makeFilePath(file.filename)))
  }

  setAndSave(file, measurementPath, measurementValue) {
    const tree = this.getTree(file)
    tree.set(measurementPath, measurementValue)
    return this.save(file, tree)
  }

  save(file, tree) {
    const dest = this.makeFilePath(file.filename)
    return Disk.write(dest, tree.toString())
  }

  makeNameSearchIndex(files = this.concepts.slice(0).reverse()) {
    const map = new Map()
    files.forEach(parsedConcept => {
      const id = parsedConcept.filename.replace(".scroll", "")
      this.makeNames(parsedConcept).forEach(name => map.set(name.toLowerCase(), parsedConcept))
    })
    return map
  }

  makeNames(concept) {
    return [concept.filename.replace(".scroll", ""), concept.id].filter(i => i)
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

  grammarFile = ""
  scrollSetName = "myScrollSet"

  get concepts() {
    return require(this.compiledConcepts)
  }

  buildGrammarFileCommand() {
    const code = `node_modules/scroll-cli/grammar/cellTypes.grammar
node_modules/scroll-cli/grammar/root.grammar
node_modules/scroll-cli/grammar/comments.grammar
node_modules/scroll-cli/grammar/blankLine.grammar
node_modules/scroll-cli/grammar/measures.grammar
node_modules/scroll-cli/grammar/import.grammar
node_modules/scroll-cli/grammar/errors.grammar
${this.grammarFile}`
      .trim()
      .split("\n")
      .map(filepath => Disk.read(path.join(__dirname, filepath)))
      .join("\n\n")
      .replace("catchAllParser catchAllParagraphParser", "catchAllParser errorParser")
      .replace(/^importOnly\n/gm, "")
      .replace(/^import .+/gm, "")
    Disk.write(path.join(__dirname, `${this.scrollSetName}.grammar`), code)
  }
}

module.exports = { ScrollSetCLI }
