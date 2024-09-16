const path = require("path")
const lodash = require("lodash")

const { Particle } = require("scrollsdk/products/Particle.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollFile, ScrollFileSystem } = require("./scroll.js")
const scrollFs = new ScrollFileSystem()

class ScrollSetCLI {
  constructor() {
    this.quickCache = {}
  }

  importCommand(filename) {
    const extension = filename.split(".").pop()

    if (extension === "csv") Particle.fromCsv(Disk.read(filename)).forEach(patch => this.patchAndSave(patch))

    if (extension === "tsv") Particle.fromTsv(Disk.read(filename)).forEach(patch => this.patchAndSave(patch))

    if (extension === "particles") Particle.fromDisk(filename).forEach(patch => this.patchAndSave(patch))
  }

  get searchIndex() {
    if (!this.quickCache.searchIndex) this.quickCache.searchIndex = this.makeNameSearchIndex()
    return this.quickCache.searchIndex
  }

  makeFilePath(id) {
    return path.join(this.conceptsFolder, id + ".scroll")
  }

  getParticle(file) {
    return new Particle(Disk.read(this.makeFilePath(file.id)))
  }

  patchAndSave(patch) {
    const id = patch.get("id")
    patch.delete("id")
    const target = this.makeFilePath(id)
    if (!Disk.exists(target)) {
      console.log(`No match for ${id}`)
      return
    }
    console.log(`Patching ${id}`)
    return new ScrollFile(new Particle(Disk.read(target)).patch(patch).toString(), target, scrollFs).formatAndSave()
  }

  setAndSave(file, measurementPath, measurementValue) {
    const particle = this.getParticle(file)
    particle.set(measurementPath, measurementValue)
    return this.formatAndSave(file, particle)
  }

  formatAndSave(file, particle = this.getParticle(file)) {
    const formatted = new ScrollFile(particle.toString(), this.makeFilePath(file.id), scrollFs).formatted
    // force a write
    return scrollFs.write(this.makeFilePath(file.id), formatted)
  }

  makeNameSearchIndex(files = this.concepts.slice(0).reverse()) {
    const map = new Map()
    files.forEach(parsedConcept => this.makeNames(parsedConcept).forEach(name => map.set(name.toLowerCase(), parsedConcept)))
    return map
  }

  makeNames(concept) {
    return [concept.id]
  }

  searchForConcept(query) {
    if (query === undefined || query === "" || !query.toLowerCase) return
    const { searchIndex } = this
    return searchIndex.get(query) || searchIndex.get(query.toLowerCase()) || searchIndex.get(Utils.titleToPermalink(query))
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
      const particle = new Particle(Disk.read(dest))
      const newParticle = particle.toString().replace(
        `import ../code/conceptPage.scroll
id `,
        `import ../code/conceptPage.scroll
id ${file.filename.replace(".scroll", "")}
name `
      )
      Disk.write(dest, newParticle.toString())
    })
  }

  // todo: can we use parsersBundle from scroll.js?
  buildParsersFileCommand() {
    const parserFilenames = `parsers/atomTypes.parsers
parsers/root.parsers
parsers/build.parsers
parsers/comments.parsers
parsers/blankLine.parsers
parsers/measures.parsers
parsers/import.parsers
parsers/errors.parsers`
      .split("\n")
      .map(filepath => path.join(__dirname, filepath))
    parserFilenames.push(this.parsersFile)

    const code = parserFilenames
      .map(Disk.read)
      .join("\n\n")
      .replace("catchAllParser catchAllParagraphParser", "catchAllParser errorParser")
      .replace(/^importOnly\n/gm, "")
      .replace(/^import .+/gm, "")
    Disk.write(path.join(this.baseFolder, `${this.scrollSetName}.parsers`), code)
  }
}

module.exports = { ScrollSetCLI }
