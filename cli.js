#! /usr/bin/env node

const path = require("path")
const numeral = require("numeral")
const lodash = require("lodash")
const dayjs = require("dayjs")

const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { shiftRight, removeReturnChars } = Utils
const { Disk } = require("jtree/products/Disk.node.js")

const baseFolder = path.join(__dirname)
const ignoreFolder = path.join(baseFolder, "ignore")
const pagesDir = path.join(baseFolder, "pages")
const listsFolder = path.join(baseFolder, "lists")
const conceptsFolder = path.join(baseFolder, "concepts")

class PLDBCli {
  constructor() {
    this.quickCache = {}
  }

  get keywordsOneHotCsv() {
    if (!this.quickCache.keywordsOneHotCsv) this.quickCache.keywordsOneHotCsv = new TreeNode(this.keywordsOneHot).asCsv
    return this.quickCache.keywordsOneHotCsv
  }

  get keywordsOneHot() {
    if (this.quickCache.keywordsOneHot) return this.quickCache.keywordsOneHot
    const { keywordsTable } = this
    const allKeywords = keywordsTable.rows.map(row => row.keyword)
    const langsWithKeywords = this.topLanguages.filter(file => file.has("keywords"))
    const headerRow = allKeywords.slice()
    headerRow.unshift("id")
    const rows = langsWithKeywords.map(file => {
      const row = [file.id]
      const keywords = new Set(file.keywords)
      allKeywords.forEach(keyword => {
        row.push(keywords.has(keyword) ? 1 : 0)
      })
      return row
    })
    rows.unshift(headerRow)
    this.quickCache.keywordsOneHot = rows
    return rows
  }

  // addRedirects(app) {
  //   // /languages => /truebase redirect
  //   app.get("/languages/:id", (req, res, next) => res.status(302).redirect(`/concepts/${req.params.id}`))

  //   const redirects = Disk.read(path.join(siteFolder, "redirects.txt"))
  //     .split("\n")
  //     .map(line => {
  //       const [oldUrl, newUrl] = line.split(" ")
  //       return {
  //         oldUrl,
  //         newUrl
  //       }
  //     })
  //   redirects.forEach(redirect =>
  //     app.get(`/${redirect.oldUrl}`, (req, res) => res.status(301).redirect(redirect.newUrl))
  //   )
  // }

  get pldb() {
    return require("./pldb.json")
  }

  async crawlGitHubCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have measurementscrawlers project installed separateely.
    const { GitHubImporter } = require("../measurementscrawlers/github.com/GitHub.js")
    const importer = new GitHubImporter(this.pldb, conceptsFolder)
    await importer.fetchAllRepoDataCommand()
    await importer.writeAllRepoDataCommand()
  }

  async crawlRedditPLCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have measurementscrawlers project installed separateely.
    const { RedditImporter } = require("../measurementscrawlers/reddit.com/Reddit.js")

    const importer = new RedditImporter(this.pldb, conceptsFolder)
    await importer.createFromAnnouncementsCommand()
  }

  async crawlGitsCommand() {
    const { GitStats } = require("./code/gitStats.js")
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have measurementscrawlers project installed separateely.
    const gitsFolder = path.join(ignoreFolder, "node_modules", "gits") // toss in a fake "node_modules" folder to avoid a "scroll list" scan. hacky i know.
    this.pldb.forEach(async file => {
      const { mainRepo } = file
      if (!mainRepo) return
      const targetFolder = path.join(gitsFolder, file.filename.replace(".scroll", ""))
      //if (Disk.exists(targetFolder)) return
      if (file.repoStats_files) return
      if (file.isFinished) return
      try {
        const gitStats = new GitStats(mainRepo, targetFolder)
        if (!Disk.exists(targetFolder)) gitStats.clone()

        const targetPath = path.join(conceptsFolder, file.filename)
        const tree = new TreeNode(Disk.read(targetPath))
        tree.touchNode("repoStats").setProperties(gitStats.summary)
        if (!tree.has("appeared")) tree.set("appeared", gitStats.firstCommit.toString())
        Disk.write(targetPath, tree.toString())
      } catch (err) {
        console.error(err, file.id)
      }
    })
  }

  get searchIndex() {
    if (!this.quickCache.searchIndex) this.quickCache.searchIndex = this.makeNameSearchIndex()
    return this.quickCache.searchIndex
  }

  makeFilePath(id) {
    return path.join(conceptsFolder, id.replace(".scroll", "") + ".scroll")
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

  makeNameSearchIndex(files = this.pldb.slice(0).reverse()) {
    const map = new Map()
    files.forEach(parsedConcept => {
      const id = parsedConcept.filename.replace(".scroll", "")
      this.makeNames(parsedConcept).forEach(name => map.set(name.toLowerCase(), parsedConcept))
    })
    return map
  }

  makeNames(concept) {
    return [
      concept.filename.replace(".scroll", ""),
      concept.id,
      concept.standsFor,
      concept.githubLanguage,
      concept.wikipediaTitle,
      concept.aka
    ].filter(i => i)
  }

  searchForConcept(query) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return (
      searchIndex.get(query) || searchIndex.get(query.toLowerCase()) || searchIndex.get(Utils.titleToPermalink(query))
    )
  }

  searchForConceptByFileExtensions(extensions = []) {
    const { extensionsMap } = this
    const hit = extensions.find(ext => extensionsMap.has(ext))
    return extensionsMap.get(hit)
  }

  get extensionsMap() {
    if (this.quickCache.extensionsMap) return this.quickCache.extensionsMap
    this.quickCache.extensionsMap = new Map()
    const extensionsMap = this.quickCache.extensionsMap
    this.concepts.forEach(concept => concept.extensions.split(" ").forEach(ext => extensionsMap.set(ext, concept.id)))

    return extensionsMap
  }

  buildGrammarFileCommand() {
    const code = `node_modules/scroll-cli/grammar/cellTypes.grammar
node_modules/scroll-cli/grammar/root.grammar
node_modules/scroll-cli/grammar/comments.grammar
node_modules/scroll-cli/grammar/blankLine.grammar
node_modules/scroll-cli/grammar/measures.grammar
node_modules/scroll-cli/grammar/import.grammar
node_modules/scroll-cli/grammar/errors.grammar
code/measures.scroll`
      .split("\n")
      .map(filepath => Disk.read(path.join(__dirname, filepath)))
      .join("\n\n")
      .replace("catchAllParser catchAllParagraphParser", "catchAllParser errorParser")
      .replace(/^importOnly\n/gm, "")
      .replace(/^import .+/gm, "")
    Disk.write(path.join(__dirname, "pldb.grammar"), code)
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
}

module.exports = { PLDBCli }

if (!module.parent) Utils.runCommand(new PLDBCli(), process.argv[2], process.argv[3])
