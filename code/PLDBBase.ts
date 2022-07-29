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
  rankSort,
  imemo,
  clearMemos
} from "./utils"

const path = require("path")
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
  token?: string
  yes: number
  no: number
  percentage: string
  psuedoExample: string
}

interface FeaturePrediction {
  value: boolean
  token?: string
  example?: string
}

interface Example {
  code: string
  source: string
  link: string
}

const databaseFolder = path.join(__dirname, "..", "database")

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

  get domainName() {
    return this.get("domainName")
  }

  get link() {
    return `<a href="${this.id}.html">${this.title}</a>`
  }

  get fileExtension() {
    return this.extensions.split(" ")[0]
  }

  get keywords() {
    const kw = this.get("keywords")
    return kw ? kw.split(" ") : []
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

  get lineCommentToken() {
    return this.get("lineCommentToken")
  }

  get langRankDebug() {
    const obj = this.base.getLanguageRankExplanation(this)
    return `TotalRank: ${obj.totalRank} Jobs: ${obj.jobsRank} Users: ${obj.usersRank} Facts: ${obj.factsRank} Links: ${obj.inboundLinksRank}`
  }

  get previousRanked() {
    return this.isLanguage
      ? this.base.getFileAtLanguageRank(this.languageRank - 1)
      : this.base.getFileAtRank(this.rank - 1)
  }

  get nextRanked() {
    return this.isLanguage
      ? this.base.getFileAtLanguageRank(this.languageRank + 1)
      : this.base.getFileAtRank(this.rank + 1)
  }

  get exampleCount() {
    return this.allExamples.length + this.featuresWithExamples.length
  }

  get featuresWithExamples() {
    const featuresTable = this.getNode(`features`)
    if (!featuresTable) return []
    return featuresTable.filter(node => node.length)
  }

  get corporateDevelopers(): string[] {
    return this.getAll("corporateDevelopers")
  }

  get creators(): string[] {
    return this.get("creators")?.split(" and ") ?? []
  }

  get hasBooleansPrediction(): FeaturePrediction {
    const { keywords } = this

    const pairs = ["true false", "TRUE FALSE", "True False"]

    let hit
    pairs.forEach(pair => {
      const parts = pair.split(" ")
      if (keywords.includes(parts[0]) && keywords.includes(parts[1]))
        hit = {
          value: true,
          token: pair
        }
    })

    if (hit) return hit

    const examples = this.allExamples.map(code => code.code)
    pairs.forEach(pair => {
      const parts = pair.split(" ")

      const hasTrue = examples.some(code => code.includes(parts[0]))
      const hasFalse = examples.some(code => code.includes(parts[1]))

      if (hasTrue && hasFalse)
        hit = {
          value: true,
          token: pair
        }
    })

    return hit
  }

  get hasImportsPrediction(): FeaturePrediction {
    const { keywords } = this

    const words = ["import", "include", "require"]

    for (let word of words) {
      if (keywords.includes(word)) {
        const example = this.allExamples.find(code => code.code.includes(word))

        if (example) {
          const exampleLine = example.code
            .split("\n")
            .filter(line => line.includes(word))[0]
          return {
            value: true,
            token: word,
            example: exampleLine
          }
        } else {
          console.log(`No example found for ${this.id}`)
        }
      }
    }
  }

  get hasWhileLoopsPrediction(): FeaturePrediction {
    const { keywords } = this

    if (keywords.includes("while"))
      return {
        value: true
      }
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

    this.findNodes("leachim6").forEach(node => {
      examples.push({
        code: node.getNode("example").childrenToString(),
        source: "hello-world",
        link:
          `https://github.com/leachim6/hello-world/blob/main/` +
          node.get("filepath")
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

  @imemo
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

  @imemo
  get title(): string {
    return this.get("title") || this.id
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

  @imemo
  get parsed() {
    return this.base.parsed.getNode(this.getWord(0))
  }

  @imemo
  get factCount() {
    return this.parsed.filter(node => node.shouldSerialize !== false).length
  }

  get linksToOtherFiles() {
    return this.parsed
      .findAllWordsWithCellType("permalinkCell")
      .map(word => word.word)
  }

  get lastActivity(): number {
    return lodash.max(
      this.parsed
        .findAllWordsWithCellType("yearCell")
        .map(word => parseInt(word.word))
    )
  }

  getAll(keyword) {
    return this.findNodes(keyword).map(i => i.getContent())
  }

  // todo: move upstream to TreeBase or Grammar
  prettify() {
    const str = this.base.prettifyContent(this.childrenToString())
    this.setChildren(str)
  }

  prettifyAndSave() {
    this.prettify()
    this.save()
    return this
  }
}

class PLDBBaseFolder extends TreeBaseFolder {
  static getBase() {
    return new (<any>PLDBBaseFolder)(
      undefined,
      path.join(databaseFolder, "things")
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

  @imemo
  get grammarProgramConstructor() {
    return new jtree.HandGrammarProgram(
      Disk.read(this._getDir() + "pldb.grammar")
    ).compileAndReturnRootConstructor()
  }

  @imemo
  get inboundLinks(): { [id: string]: string[] } {
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

    return inBoundLinks
  }

  get typesFile() {
    // Build the types file
    // interface pldbNode
    const gpc = this.grammarProgramConstructor
    const tsContent =
      "// Autogenerated from Grammar\n\n" +
      new gpc()
        .getDefinition()
        .toTypeScriptInterface()
        .replace("interface pldbNode", "export interface pldbNode")
    return tsContent
  }

  @imemo
  get searchIndex(): Map<string, string> {
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
    return map
  }

  searchForEntity(query: string) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return searchIndex.get(query) || searchIndex.get(getCleanedId(query))
  }

  searchForEntityByFileExtensions(extensions: string[] = []) {
    const { extensionsMap } = this
    const hit = extensions.find(ext => extensionsMap.has(ext))
    return extensionsMap.get(hit)
  }

  @imemo
  get extensionsMap() {
    const extensionsMap = new Map<string, string>()
    this.topLanguages
      .slice(0)
      .reverse()
      .forEach(file => {
        file.extensions
          .split(" ")
          .forEach(ext => extensionsMap.set(ext, file.id))
      })

    return extensionsMap
  }

  getFile(id: string): PLDBFile | undefined {
    if (id.includes("/")) id = Disk.getFileName(id).replace(".pldb", "")
    return this.getNode(this.dir + id + ".pldb")
  }

  @imemo
  get topLanguages(): PLDBFile[] {
    return lodash.sortBy(
      this.filter(lang => lang.isLanguage),
      "languageRank"
    )
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
      object.facts = file.factCount
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

  @imemo
  get rankings() {
    const files = this.getChildren()
    const ranks = this.calcRanks(files)
    const inverseRanks = makeInverseRanks(ranks)
    const languageRanks = this.calcRanks(files.filter(file => file.isLanguage))
    const inverseLanguageRanks = makeInverseRanks(languageRanks)
    const featureRanks = this.calcRanks(files.filter(file => file.isFeature))
    const inverseFeatureRanks = makeInverseRanks(featureRanks)

    return {
      ranks,
      inverseRanks,
      languageRanks,
      inverseLanguageRanks,
      featureRanks,
      inverseFeatureRanks
    }
  }

  private _getFileAtRank(rank: number, ranks: InverseRankings) {
    const count = Object.keys(ranks).length
    if (rank < 0) rank = count - 1
    if (rank >= count) rank = 0
    return this.getFile(ranks[rank].id)
  }

  @imemo
  get featuresMap(): Map<string, FeatureSummary> {
    const featuresMap = new Map<string, FeatureSummary>()
    this.topFeatures.forEach(feature => {
      featuresMap.set(feature.path, feature)
    })
    return featuresMap
  }

  clearMemos() {
    clearMemos(this)
  }

  @imemo
  get parsed() {
    return this.toProgram()
  }

  @imemo
  get topFeatures(): FeatureSummary[] {
    const files = this.featureFiles.map(file => {
      const name = file.id
      const positives = file.languagesWithThisFeature.length
      const negatives = file.languagesWithoutThisFeature.length
      const measurements = positives + negatives
      return {
        feature: file.get("title"),
        featureLink: `../languages/${name}.html`,
        aka: file.getAll("aka").join(" or "),
        path: file.get("featureKeyword"),
        token: file.get("tokenKeyword"),
        yes: positives,
        no: negatives,
        percentage:
          measurements < 100
            ? "-"
            : lodash.round((100 * positives) / measurements, 0) + "%",
        psuedoExample: (file.get("psuedoExample") || "")
          .replace(/\</g, "&lt;")
          .replace(/\|/g, "&#124;")
      }
    })

    const sorted = lodash.sortBy(files, "yes")
    sorted.reverse()

    return sorted
  }

  getFeatureAtRank(rank: number) {
    return this._getFileAtRank(rank, this.rankings.inverseFeatureRanks)
  }

  getFileAtLanguageRank(rank: number) {
    return this._getFileAtRank(rank, this.rankings.inverseLanguageRanks)
  }

  getFileAtRank(rank: number) {
    return this._getFileAtRank(rank, this.rankings.inverseRanks)
  }

  predictPercentile(file: PLDBFile) {
    const files = this.getChildren()
    const { ranks } = this.rankings
    return ranks[file.id].index / files.length
  }

  getLanguageRankExplanation(file: PLDBFile) {
    return this.rankings.languageRanks[file.id]
  }

  getFeatureRank(file: PLDBFile) {
    return this.rankings.featureRanks[file.id].index
  }

  get grammarPath() {
    return this.dir + "pldb.grammar"
  }

  getLanguageRank(file: PLDBFile) {
    return this.rankings.languageRanks[file.id].index
  }

  getRank(file: PLDBFile) {
    return this.rankings.ranks[file.id].index
  }

  makeId(title: string) {
    let id = getCleanedId(title)
    let newId = id
    if (!this.getFile(newId)) return newId

    newId = id + "-lang"
    if (!this.getFile(newId)) return newId

    throw new Error(
      `Already language with id: "${id}". Are you sure this is a new language? Perhaps update the title to something more unique, then update title back`
    )
  }

  createFile(content: string, id?: string) {
    if (id === undefined) {
      const title = new TreeNode(content).get("title")
      if (!title)
        throw new Error(`A "title" must be provided when creating a new file`)

      id = this.makeId(title)
    }
    const fullPath = path.join(this._getDir(), id + ".pldb")
    Disk.write(fullPath, content)
    return this.appendLineAndChildren(fullPath, content)
  }

  get exampleCounts() {
    const counts = new Map<string, number>()
    this.forEach(file => counts.set(file.id, file.exampleCount))
    return counts
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
    const { ranks } = this.rankings
    const { exampleCounts } = this
    // Add ranks
    objects.forEach(obj => {
      obj.rank = ranks[obj.id].index
      obj.exampleCount = exampleCounts.get(obj.id)
      obj.lastActivity = this.getFile(obj.id).lastActivity
    })

    return lodash.sortBy(objects, "rank")
  }

  get sortTemplate() {
    return Disk.read(path.join(databaseFolder, "sortTemplate.txt")).replace(
      /\n\n/,
      "\n"
    )
  }

  @imemo
  get sortIndices() {
    const sortIndices = new Map()
    this.sortTemplate.split("\n").forEach((word, index) => {
      sortIndices.set(word, index)
    })
    return sortIndices
  }

  @imemo
  get sortSections() {
    const sections = new Map()
    this.sortTemplate.split("#").forEach((section, sectionIndex) => {
      section.split("\n").forEach(word => {
        sections.set(word, sectionIndex)
      })
    })
    return sections
  }

  // todo: move upstream to TreeBase or Grammar
  prettifyContent(original: string) {
    const { sortIndices, sortSections } = this
    const noReturnChars = original.replace(/\r/g, "")
    const noBlankLines = noReturnChars
      .replace(/\n\n+/g, "\n")
      .replace(/\n$/, "")
    const programParser = this.grammarProgramConstructor
    const program = new programParser(noBlankLines)

    program.sort((nodeA, nodeB) => {
      const aIndex = sortIndices.get(nodeA.getFirstWord())
      const bIndex = sortIndices.get(nodeB.getFirstWord())
      if (aIndex === undefined) {
        console.error(`sortTemplate is missing "${nodeA.getFirstWord()}"`)
      }
      const a = aIndex ?? 1000
      const b = bIndex ?? 1000
      return a > b ? 1 : a < b ? -1 : nodeA.getLine() > nodeB.getLine()
    })

    // pad sections
    let currentSection = 0
    program.forEach(node => {
      const nodeSection = sortSections.get(node.getFirstWord())
      const sectionHasAdvanced = nodeSection > currentSection
      if (sectionHasAdvanced) {
        currentSection = nodeSection
        node.prependSibling("") // Put a blank line before this section
      }
    })

    return program.toString()
  }
}

export { PLDBBaseFolder, PLDBFile }
