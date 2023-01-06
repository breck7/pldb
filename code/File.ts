import { Example, FeaturePrediction, FolderInterface } from "./Interfaces"
import { getJoined, isLanguage, imemo } from "./utils"
import { jtree } from "jtree"
const { TreeNode } = jtree
const lodash = require("lodash")
const { TreeBaseFile } = require("jtree/products/treeBase.node.js")

const runtimeCsvProps = {}
const includeInCsv = <Type>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<Type>
): void => {
  runtimeCsvProps[propertyName] = ""
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

  @imemo
  get lowercase() {
    return this.toString().toLowerCase()
  }

  @imemo
  get lowercaseNames() {
    return this.names.map(name => name.toLowerCase())
  }

  @imemo
  get lowercaseTitle() {
    return this.toString().toLowerCase()
  }

  @includeInCsv
  get hoplId() {
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

  get featuresWithExamples() {
    const featuresTable = this.getNode(`features`)
    if (!featuresTable) return []
    return featuresTable.filter(node => node.length)
  }

  get originCommunity(): string[] {
    return this.getAll("originCommunity")
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

  @imemo
  get title(): string {
    return this.get("title") || this.id
  }

  @imemo
  get appeared(): number {
    const appeared = this.get("appeared")
    return appeared === undefined ? 0 : parseInt(appeared)
  }

  @imemo
  get website(): string {
    return this.get("website")
  }

  @imemo
  get type(): string {
    return this.get("type")
  }

  get isLanguage() {
    return isLanguage(this.get("type"))
  }

  get otherReferences() {
    return this.findNodes("reference").map(line => line.getContent())
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

  get supersetFile(): PLDBFile | undefined {
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

  @imemo
  get typeName() {
    let { type } = this
    type = typeNames[type] || type
    return lodash.startCase(type).toLowerCase()
  }

  get base() {
    return this.getParent() as FolderInterface
  }

  @imemo
  get parsed() {
    return super.parsed
  }

  @includeInCsv
  @imemo
  get factCount() {
    return this.parsed
      .getTopDownArray()
      .filter(node => node.shouldSerialize !== false).length
  }

  @imemo
  get linksToOtherFiles() {
    return lodash.uniq(
      this.parsed
        .getTopDownArray()
        .filter(node => node.providesPermalinks)
        .map(node => node.getWords().slice(1))
        .flat()
    )
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

export { PLDBFile, runtimeCsvProps }
