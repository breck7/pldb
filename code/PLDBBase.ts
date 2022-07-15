import { jtree } from "jtree"
import { pldbNodeKeywords } from "./types"
import {
  nodeToFlatObject,
  getJoined,
  getPrimaryKey,
  isLanguage,
  getCleanedId,
  makeInverseRanks,
  Ranking,
  Rankings,
  InverseRankings,
  rankSort
} from "./utils"

const lodash = require("lodash")
const { TreeNode } = jtree
const {
  TreeBaseFolder,
  TreeBaseFile
} = require("jtree/products/treeBase.node.js")
const { Disk } = require("jtree/products/Disk.node.js")

interface FeatureSummary {
  feature: string
  featureLink: string
  aka: string
  path: string
  languages: number
  psuedoExample: string
}

interface Example {
  code: string
  source: string
  link: string
}

const typeNames = new TreeNode(`application
assembly assembly language
binaryDataFormat
binaryExecutable binary executable format
bytecode bytecode format
characterEncoding
cloud cloud service
compiler
editor
esolang esoteric programming language
filesystem
framework
grammarLanguage
idl interface design language
interpreter
ir intermediate representation language
isa instruction set architecture
jsonFormat
library
linter
metalanguage
notation
os operating system
packageManager
feature language feature
pl programming language
plzoo minilanguage
protocol
queryLanguage
schema
standard
stylesheetLanguage
template template language
textData text data format
textMarkup text markup language
visual visual programming language
vm virtual machine
webApi
xmlFormat`).toObject()

class PLDBFile extends TreeBaseFile {
  get id() {
    return getPrimaryKey(this)
  }

  get link() {
    return `<a href="${this.id}.html">${this.title}</a>`
  }

  get fileExtension() {
    return this.extensions.split(" ")[0]
  }

  get featurePath() {
    return `features ${this.get("featureKeyword")}`
  }

  get previousRankedFeature() {
    return this.base.getFeatureAtRank(this.base.getFeatureRank(this) - 1)
  }

  get nextRankedFeature() {
    return this.base.getFeatureAtRank(this.base.getFeatureRank(this) + 1)
  }

  get previousRankedLanguage() {
    return this.base.getFileAtLanguageRank(this.languageRank - 1)
  }

  get nextRankedLanguage() {
    return this.base.getFileAtLanguageRank(this.languageRank + 1)
  }

  get lineCommentKeyword() {
    return this.get("lineCommentKeyword")
  }

  get langRankDebug() {
    const obj = this.base.getLanguageRankExplanation(this)
    return `TotalRank: ${obj.totalRank} Jobs: ${obj.jobsRank} Users: ${obj.usersRank} Facts: ${obj.factsRank} Links: ${obj.inboundLinksRank}`
  }

  get previousRanked() {
    return this.base.getFileAtRank(this.rank - 1)
  }

  get nextRanked() {
    return this.base.getFileAtRank(this.rank + 1)
  }

  get allExamples(): Example[] {
    const examples: Example[] = []

    this.findNodes("example").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "the web",
        link: ""
      })
    })

    this.findNodes("rijuRepl example").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "Riju",
        link: this.get("rijuRepl")
      })
    })

    this.findNodes("helloWorldCollection").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "the Hello World Collection",
        link: `http://helloworldcollection.de/#` + node.getWord(1)
      })
    })

    const linguist_url = this.get("linguistGrammarRepo")
    this.findNodes("linguistGrammarRepo example").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "Linguist",
        link: linguist_url
      })
    })

    this.findNodes("wikipedia example").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "Wikipedia",
        link: this.get("wikipedia")
      })
    })

    return examples
  }

  get _getLanguagesWithThisFeatureResearched() {
    const featureKeyword = this.get("featureKeyword")

    return this.base.topLanguages.filter(file =>
      file.getNode("features")?.has(featureKeyword)
    )
  }

  get languagesWithThisFeature() {
    const { featurePath } = this
    return this._getLanguagesWithThisFeatureResearched.filter(
      file => file.get(featurePath) === "true"
    )
  }

  get languagesWithoutThisFeature() {
    const { featurePath } = this
    return this._getLanguagesWithThisFeatureResearched.filter(
      file => file.get(featurePath) === "false"
    )
  }

  getMostRecentInt(pathToSet: string): number {
    let set = this.getNode(pathToSet)
    if (!set) return 0
    set = set.toObject()
    const key = Math.max(...Object.keys(set).map(year => parseInt(year)))
    return parseInt(set[key])
  }

  private _title: string

  get title() {
    if (!this._title) this._title = this.get("title") || this.id
    return this._title
  }

  get isLanguage() {
    return isLanguage(this.get("type"))
  }

  get otherReferences() {
    return this.findNodes("reference").map(line => line.getContent())
  }

  get isFeature() {
    return this.get("type") === "feature"
  }

  get wikipediaTitle() {
    const wp = this.get("wikipedia")
    return wp ? wp.replace("https://en.wikipedia.org/wiki/", "").trim() : ""
  }

  get numberOfUsers() {
    return this.base.predictNumberOfUsers(this)
  }

  get numberOfJobs() {
    return this.base.predictNumberOfJobs(this)
  }

  get percentile() {
    return this.base.predictPercentile(this)
  }

  get supersetFile(): PLDBFile | undefined {
    const supersetOf = this.get("supersetOf")
    return supersetOf ? this.base.getFile(supersetOf) : undefined
  }

  get languageRank() {
    return this.base.getLanguageRank(this)
  }

  get rank() {
    return this.base.getRank(this)
  }

  get extensions() {
    return getJoined(this, [
      "fileExtensions",
      "githubLanguage fileExtensions",
      "pygmentsHighlighter fileExtensions",
      "wikipedia fileExtensions"
    ])
  }

  get typeName() {
    let type = this.get("type")
    type = typeNames[type] || type
    return lodash.startCase(type).toLowerCase()
  }

  get base() {
    return this.getParent() as PLDBBaseFolder
  }

  get parsed() {
    return this.base.parsed.getNode(this.getWord(0))
  }

  get linksToOtherFiles() {
    return this.parsed
      .findAllWordsWithCellType("permalinkCell")
      .map(word => word.word)
  }

  getAll(keyword) {
    return this.findNodes(keyword).map(i => i.getContent())
  }

  // todo: move upstream to Grammar
  formatAndSave() {
    const original = this.childrenToString()
    const noBlankLines = original.replace(/\n\n+/g, "\n")
    const programParser = this.base.grammarProgramConstructor
    const program = new programParser(noBlankLines)

    program.sort((nodeA, nodeB) => {
      const a = nodeA.sortIndex ?? 0
      const b = nodeB.sortIndex ?? 0
      return a > b ? -1 : a < b ? 1 : nodeA.getLine() > nodeB.getLine()
    })

    // pad sections
    program
      .filter(node => node.padOnFormat)
      .forEach(node => {
        if (node.getPrevious().getLine() !== "") node.prependSibling("")
        if (node.getNext().getLine() !== "") node.appendSibling("")
      })

    this.setChildren(program.toString())
    this.save()
  }
}

class PLDBBaseFolder extends TreeBaseFolder {
  static getBase() {
    return new (<any>PLDBBaseFolder)(
      undefined,
      __dirname + "/../database/things/"
    ) as PLDBBaseFolder
  }

  get dir(): string {
    return this._getDir()
  }

  createParser() {
    return new TreeNode.Parser(PLDBFile)
  }

  get featureFiles(): PLDBFile[] {
    return this.filter(file => file.get("type") === "feature")
  }

  get grammarProgramConstructor() {
    if (!this._grammarProgramConstructor)
      this._grammarProgramConstructor = new jtree.HandGrammarProgram(
        Disk.read(this._getDir() + "pldb.grammar")
      ).compileAndReturnRootConstructor()

    return this._grammarProgramConstructor
  }

  _inboundLinks: { [id: string]: string[] }
  get inboundLinks() {
    if (this._inboundLinks) return this._inboundLinks

    const inBoundLinks = {}
    this.forEach(file => {
      inBoundLinks[file.id] = []
    })

    this.forEach(file => {
      file.linksToOtherFiles.forEach(link => {
        if (!inBoundLinks[link])
          console.error(
            `Broken permalink in '${file.id}': No language "${link}" found`
          )
        else inBoundLinks[link].push(file.id)
      })
    })

    this._inboundLinks = inBoundLinks
    return this._inboundLinks
  }

  get typesFile() {
    // Build the types file
    // interface pldbNode
    const gpc = this._grammarProgramConstructor
    const tsContent =
      "// Autogenerated from Grammar\n\n" +
      new gpc()
        .getDefinition()
        .toTypeScriptInterface()
        .replace("interface pldbNode", "export interface pldbNode")
    return tsContent
  }

  _searchIndex?: Map<string, string>
  get searchIndex() {
    if (this._searchIndex) return this._searchIndex
    const map = new Map()
    this.forEach(file => {
      const id = file.id
      map.set(file.id, id)
      map.set(file.title, id)
      const wp = file.wikipediaTitle
      if (wp) map.set(wp, id)
      const aka = file.getAll("aka")
      if (aka.length) aka.forEach(name => map.set(name.toLowerCase(), id))
    })
    this._searchIndex = map
    return this._searchIndex
  }

  searchForEntity(query: string) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return searchIndex.get(query) || searchIndex.get(getCleanedId(query))
  }

  getFile(id: string): PLDBFile | undefined {
    return this.getNode(this.dir + id + ".pldb")
  }

  private _topLangs: PLDBFile[]
  get topLanguages(): PLDBFile[] {
    if (!this._topLangs)
      this._topLangs = lodash.sortBy(
        this.filter(lang => lang.isLanguage),
        "languageRank"
      )
    return this._topLangs
  }

  predictNumberOfUsers(file: PLDBFile) {
    const mostRecents = [
      "linkedInSkill",
      "subreddit memberCount",
      "projectEuler members"
    ]
    const directs = ["meetup members", "githubRepo stars"]
    const customs = {
      wikipedia: v => 20,
      packageRepository: v => 1000, // todo: pull author number
      "wikipedia dailyPageViews": count => 100 * (parseInt(count) / 20), // say its 95% bot traffic, and 1% of users visit the wp page daily
      linguistGrammarRepo: c => 200, // According to https://github.com/github/linguist/blob/master/CONTRIBUTING.md, linguist indicates a min of 200 users.
      codeMirror: v => 50,
      website: v => 1,
      githubRepo: v => 1,
      "githubRepo forks": v => v * 3
    }

    return Math.round(
      lodash.sum(mostRecents.map(key => file.getMostRecentInt(key))) +
        lodash.sum(directs.map(key => parseInt(file.get(key) || 0))) +
        lodash.sum(
          Object.keys(customs).map(key => {
            const val = file.get(key)
            return val ? customs[key](val) : 0
          })
        )
    )
  }

  predictNumberOfJobs(file: PLDBFile) {
    return (
      Math.round(file.getMostRecentInt("linkedInSkill") * 0.01) +
      file.getMostRecentInt("indeedJobs")
    )
  }

  private calcRanks(files: PLDBFile[] = this.getChildren()) {
    const { inboundLinks } = this
    let objects = files.map(file => {
      const id = file.id
      const object: any = {}
      object.id = id
      object.jobs = this.predictNumberOfJobs(file)
      object.users = this.predictNumberOfUsers(file)
      object.facts = file.length
      object.inboundLinks = inboundLinks[id].length
      return object
    })

    objects = rankSort(objects, "jobs")
    objects = rankSort(objects, "users")
    objects = rankSort(objects, "facts")
    objects = rankSort(objects, "inboundLinks")

    objects.forEach((obj, rank) => {
      // Drop the item this does the worst on, as it may be a flaw in PLDB.
      const top3: number[] = [
        obj.jobsRank,
        obj.usersRank,
        obj.factsRank,
        obj.inboundLinksRank
      ]
      obj.totalRank = lodash.sum(lodash.sortBy(top3).slice(0, 3))
    })
    objects = lodash.sortBy(objects, ["totalRank"])

    const ranks: Rankings = {}
    objects.forEach((obj, index) => {
      obj.index = index
      ranks[obj.id] = obj as Ranking
    })
    return ranks
  }

  _ranks: Rankings
  _inverseRanks: InverseRankings
  _languageRanks: Rankings
  _inverseLanguageRanks: InverseRankings
  _featureRanks: Rankings
  _inverseFeatureRanks: InverseRankings
  _getRanks(files = this.getChildren()) {
    if (!this._ranks) {
      this._ranks = this.calcRanks(files)
      this._inverseRanks = makeInverseRanks(this._ranks)
      this._languageRanks = this.calcRanks(
        files.filter(file => file.isLanguage)
      )
      this._inverseLanguageRanks = makeInverseRanks(this._languageRanks)
      this._featureRanks = this.calcRanks(files.filter(file => file.isFeature))
      this._inverseFeatureRanks = makeInverseRanks(this._featureRanks)
    }
    return this._ranks
  }

  private _getFileAtRank(rank: number, ranks: InverseRankings) {
    const count = Object.keys(ranks).length
    if (rank < 0) rank = count - 1
    if (rank >= count) rank = 0
    return this.getFile(ranks[rank].id)
  }

  private _featuresMap = new Map<string, FeatureSummary>()
  get featuresMap() {
    if (!this._featuresMap.size)
      this.topFeatures.forEach(feature => {
        this._featuresMap.set(feature.path, feature)
      })
    return this._featuresMap
  }

  private _parsed: any
  get parsed() {
    if (!this._parsed) this._parsed = this.toProgram()
    return this._parsed
  }

  get topFeatures(): FeatureSummary[] {
    const files = this.featureFiles.map(file => {
      const name = file.id
      return {
        feature: file.get("title"),
        featureLink: `../languages/${name}.html`,
        aka: file.getAll("aka").join(" or "),
        path: file.get("featureKeyword"),
        languages: file.languagesWithThisFeature.length,
        psuedoExample: (file.get("psuedoExample") || "")
          .replace(/\</g, "&lt;")
          .replace(/\|/g, "&#124;")
      }
    })

    const sorted = lodash.sortBy(files, "languages")
    sorted.reverse()

    return sorted
  }

  getFeatureAtRank(rank: number) {
    return this._getFileAtRank(rank, this._inverseFeatureRanks)
  }

  getFileAtLanguageRank(rank: number) {
    return this._getFileAtRank(rank, this._inverseLanguageRanks)
  }

  getFileAtRank(rank: number) {
    return this._getFileAtRank(rank, this._inverseRanks)
  }

  predictPercentile(file: PLDBFile) {
    const files = this.getChildren()
    const ranks = this._getRanks(files)
    return ranks[file.id].index / files.length
  }

  getLanguageRankExplanation(file: PLDBFile) {
    return this._languageRanks[file.id]
  }

  getFeatureRank(file: PLDBFile) {
    this._getRanks()
    return this._featureRanks[file.id].index
  }

  get grammarPath() {
    return this.dir + "pldb.grammar"
  }

  getLanguageRank(file: PLDBFile) {
    this._getRanks()
    return this._languageRanks[file.id].index
  }

  getRank(file: PLDBFile) {
    return this._getRanks()[file.id].index
  }

  createFile(id: string, content: string) {
    Disk.write(this._getDir() + "/" + id + ".pldb", content)
  }

  toObjectsForCsv() {
    // todo: sort columns by importance
    const program = this.parsed
    program.getTopDownArray().forEach(node => {
      if (node.includeChildrenInCsv === false) node.deleteChildren()
      if (node.getNodeTypeId() === "blankLineNode") node.destroy()
    })
    program.forEach(node => {
      node.set("id", getPrimaryKey(node))
    })
    const objects = program.map(nodeToFlatObject)
    const ranks = this._getRanks()
    // Add ranks
    objects.forEach(obj => {
      obj.rank = ranks[obj.id].index
    })

    return lodash.sortBy(objects, "rank")
  }
}

export { PLDBBaseFolder, PLDBFile }
