import { Example, FeaturePrediction, FolderInterface } from "./Interfaces"
import { LanguagePageTemplate } from "./LanguagePage"

const { quickCache } = require("./quickCache")
const { TreeNode } = require("jtree/products/TreeNode.js")
const lodash = require("lodash")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeBaseFile } = require("jtree/products/treeBase.node.js")

const runtimeCsvProps = {}
const includeInCsv = <Type>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<Type>
): void => {
  runtimeCsvProps[propertyName] = ""
}

const getJoined = (node, keywords): string => {
  const words = keywords
    .map(word => node.get(word) || "")
    .filter(i => i)
    .join(" ")
    .split(" ")
  return lodash.uniq(words).join(" ")
}

const getFirst = (file, keywords): string => {
  const hit = keywords.find(keyWord => file.get(keyWord))
  return hit ? file.get(hit) : ""
}

// todo: move to grammar
const isLanguage = type => {
  const nonLanguages = {
    vm: true,
    linter: true,
    library: true,
    webApi: true,
    characterEncoding: true,
    cloud: true,
    editor: true,
    filesystem: true,
    feature: true,
    packageManager: true,
    os: true,
    application: true,
    framework: true,
    standard: true,
    hashFunction: true,
    compiler: true,
    decompiler: true,
    binaryExecutable: true,
    binaryDataFormat: true,
    equation: true,
    interpreter: true,
    computingMachine: true,
    dataStructure: true
  }

  return nonLanguages[type] ? false : true
}

// Todo: move to Grammar with an enum concept?
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
  id = this.getLine() // todo: upstream this to TreeBase.

  @includeInCsv
  get pldbId() {
    return this.id
  }

  get webPermalink() {
    return `https://pldb.com/languages/${this.permalink}`
  }

  get filePath() {
    return this._getFilePath()
  }

  get missingColumns() {
    return this.base.columnDocumentation
      .filter(col => col.Description !== "computed")
      .filter(col => !col.Column.includes("."))
      .filter(col => !this.has(col.Column))
  }

  get missingRecommendedColumns() {
    return this.missingColumns.filter(col => col.Recommended === true)
  }

  // todo:refactor columnDocumentation
  // @includeInCsv
  // get missingColumnsCount() {
  //   return this.missingColumns.length
  // }

  get domainName() {
    return this.get("domainName")
  }

  get factSponsors() {
    return this.getNode("factSponsors")
  }

  get permalink() {
    return this.id + ".html"
  }

  get link() {
    return `<a href="${this.permalink}">${this.title}</a>`
  }

  get subredditId() {
    return this.get("subreddit")
      ?.split("/")
      .pop()
  }

  @includeInCsv
  get bookCount() {
    const gr = this.getNode(`goodreads`)?.length
    const isbndb = this.getNode(`isbndb`)?.length
    let count = 0
    if (gr) count += gr - 1
    if (isbndb) count += isbndb - 1
    return count
  }

  @includeInCsv
  get paperCount() {
    const ss = this.getNode(`semanticScholar`)?.length

    let count = 0
    if (ss) count += ss - 1
    return count
  }

  @quickCache
  get lowercase() {
    return this.toString().toLowerCase()
  }

  @quickCache
  get lowercaseNames() {
    return this.names.map(name => name.toLowerCase())
  }

  @quickCache
  get lowercaseTitle() {
    return this.toString().toLowerCase()
  }

  @includeInCsv
  get hopl() {
    return this.get("hopl")?.replace(
      "https://hopl.info/showlanguage.prx?exp=",
      ""
    )
  }

  get filename() {
    return this.id + ".pldb"
  }

  get names() {
    return [
      this.id,
      this.title,
      this.get("standsFor"),
      this.get("githubLanguage"),
      this.wikipediaTitle,
      ...this.getAll("aka")
    ].filter(i => i)
  }

  get fileExtension() {
    return this.extensions.split(" ")[0]
  }

  get keywords() {
    const kw = this.get("keywords")
    return kw ? kw.split(" ") : []
  }

  get repo() {
    return getFirst(
      this,
      "gitRepo githubRepo gitlabRepo sourcehutRepo".split(" ")
    )
  }

  get repl() {
    return getFirst(this, "webRepl rijuRepl tryItOnline replit".split(" "))
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

  @includeInCsv
  get exampleCount() {
    return this.allExamples.length + this.featuresWithExamples.length
  }

  @quickCache
  get extendedFeaturesNode() {
    const { supersetOfFile } = this
    const featuresNode = this.getNode(`features`) ?? new TreeNode()
    return supersetOfFile
      ? supersetOfFile.extendedFeaturesNode.patch(featuresNode)
      : featuresNode
  }

  get featuresWithExamples() {
    return this.extendedFeaturesNode.filter(node => node.length)
  }

  get originCommunity(): string[] {
    const originCommunity = this.get("originCommunity")
    return originCommunity ? originCommunity.split(" && ") : []
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

  makeSimpleKeywordPrediction(theWord: string): FeaturePrediction {
    const { keywords } = this

    if (keywords.includes(theWord))
      return {
        value: true
      }
  }

  get hasWhileLoopsPrediction() {
    return this.makeSimpleKeywordPrediction("while")
  }

  get hasClassesPrediction() {
    return this.makeSimpleKeywordPrediction("class")
  }

  get hasConstantsPrediction() {
    return this.makeSimpleKeywordPrediction("const")
  }

  get hasExceptionsPrediction() {
    return this.makeSimpleKeywordPrediction("throw")
  }

  get hasSwitchPrediction() {
    return this.makeSimpleKeywordPrediction("switch")
  }

  get hasAccessModifiersPrediction() {
    return this.makeSimpleKeywordPrediction("public")
  }

  get hasInheritancePrediction() {
    return this.makeSimpleKeywordPrediction("extends")
  }

  get hasAsyncAwaitPrediction() {
    return this.makeSimpleKeywordPrediction("async")
  }

  get hasConditionalsPrediction() {
    return this.makeSimpleKeywordPrediction("if")
  }

  get hasFunctionsPrediction() {
    return (
      this.makeSimpleKeywordPrediction("function") ||
      this.makeSimpleKeywordPrediction("fun") ||
      this.makeSimpleKeywordPrediction("def")
    )
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

    this.findNodes("compilerExplorer example").forEach(node => {
      examples.push({
        code: node.childrenToString(),
        source: "Compiler Explorer",
        link: `https://godbolt.org/`
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

  getMostRecentInt(pathToSet: string): number {
    let set = this.getNode(pathToSet)
    if (!set) return 0
    set = set.toObject()
    const key = Math.max(...Object.keys(set).map(year => parseInt(year)))
    return parseInt(set[key])
  }

  @quickCache
  get title(): string {
    return this.get("title") || this.id
  }

  @quickCache
  get appeared(): number {
    const appeared = this.get("appeared")
    return appeared === undefined ? 0 : parseInt(appeared)
  }

  @quickCache
  get website(): string {
    return this.get("website")
  }

  @quickCache
  get type(): string {
    return this.get("type")
  }

  get isLanguage() {
    return isLanguage(this.get("type"))
  }

  get otherReferences() {
    return this.findNodes("reference").map(line => line.content)
  }

  get wikipediaTitle() {
    const wp = this.get("wikipedia")
    return wp ? wp.replace("https://en.wikipedia.org/wiki/", "").trim() : ""
  }

  @includeInCsv
  get numberOfUsers() {
    return this.base.predictNumberOfUsers(this)
  }

  @includeInCsv
  get numberOfRepos() {
    return this.get("githubLanguage repos")
  }

  @includeInCsv
  get numberOfJobs() {
    return this.base.predictNumberOfJobs(this)
  }

  get percentile() {
    return this.base.predictPercentile(this)
  }

  get supersetOfFile(): PLDBFile | undefined {
    const supersetOf = this.get("supersetOf")
    return supersetOf ? this.base.getFile(supersetOf) : undefined
  }

  @includeInCsv
  get languageRank() {
    return this.isLanguage ? this.base.getLanguageRank(this) : undefined
  }

  @includeInCsv
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

  @quickCache
  get typeName() {
    let { type } = this
    type = typeNames[type] || type
    return lodash.startCase(type).toLowerCase()
  }

  get base() {
    return this.parent as FolderInterface
  }

  _parsed
  get parsed() {
    if (!this._parsed) this._parsed = super.parsed
    return this._parsed
  }

  @includeInCsv
  @quickCache
  get factCount() {
    return this.parsed
      .getTopDownArray()
      .filter(node => node.shouldSerialize !== false).length
  }

  @quickCache
  get linksToOtherFiles() {
    return lodash.uniq(
      this.parsed
        .getTopDownArray()
        .filter(node => node.providesPermalinks)
        .map(node => node.getWordsFrom(1))
        .flat()
    )
  }

  doesLinkTo(id) {
    return this.linksToOtherFiles.includes(id)
  }

  updatePermalinks(oldId, newId) {
    this.parsed
      .getTopDownArray()
      .filter(node => node.providesPermalinks)
      .map(node =>
        node.setContent(
          node
            .getWordsFrom(1)
            .map(word => (word === oldId ? newId : word))
            .join(" ")
        )
      )
    this.setChildren(this.parsed.childrenToString())
    this.save()
  }

  @includeInCsv
  get lastActivity(): number {
    return lodash.max(
      this.parsed
        .findAllWordsWithCellType("yearCell")
        .map(word => parseInt(word.word))
    )
  }

  getAll(keyword) {
    return this.findNodes(keyword).map(i => i.content)
  }

  sort() {
    delete this._parsed
    this.setChildren(
      this.parsed
        .sortFromSortTemplate()
        .toString()
        .replace(/\n+$/g, "") + "\n"
    )
  }

  writeScrollFileIfChanged() {
    Disk.writeIfChanged(
      this.filePath,
      new LanguagePageTemplate(this).toScroll()
    )
  }

  prettifyAndSave() {
    this.sort()
    this.save()
    return this
  }
}

export { PLDBFile, runtimeCsvProps, isLanguage }
