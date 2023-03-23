#!/usr/bin/env node

/*
* To investigate slowdowns:
code
 node --cpu-prof --cpu-prof-name=test.cpuprofile ./code/PLDB.js testPerf
* Then:
- open a new Chrome tab
- open devtools
- click Performance
- click "Load Profile..."
- select your test.cpuprofile
*/

const path = require("path")
const numeral = require("numeral")
const lodash = require("lodash")
const dayjs = require("dayjs")

const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { shiftRight, removeReturnChars } = Utils
const { Disk } = require("jtree/products/Disk.node.js")
const { TrueBaseFolder, TrueBaseFile } = require("truebase/server/TrueBase.js")
const { TrueBaseServer } = require("truebase/server/TrueBaseServer.js")
const { ScrollFolder } = require("scroll-cli")

const baseFolder = path.join(__dirname, "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const siteFolder = path.join(baseFolder, "site")
const nodeModulesFolder = path.join(baseFolder, "node_modules")
const pagesDir = path.join(siteFolder, "pages")
const listsFolder = path.join(siteFolder, "lists")
const postsFolder = path.join(siteFolder, "posts")
const featuresFolder = path.join(siteFolder, "features")
const trueBasePagesFolder = path.join(siteFolder, "truebase")

const linkManyAftertext = links =>
  links.map((link, index) => `${index + 1}.`).join(" ") + // notice the dot is part of the link. a hack to make it more unique for aftertext matching.
  links.map((link, index) => `\n ${link} ${index + 1}.`).join("")

const cleanAndRightShift = str =>
  Utils.shiftRight(Utils.removeReturnChars(str), 1)

const makePrettyUrlLink = url => `<a href="${url}">${new URL(url).hostname}</a>`

const quickTree = (rows, header) => `pipeTable
 ${new TreeNode(rows).toDelimited("|", header, false).replace(/\n/g, "\n ")}`

const toCommaList = (arr, conjunction = "and") => {
  if (arr.length === 1) return arr[0]
  let last = arr.pop()
  return arr.join(", ") + ` ${conjunction} ${last}`
}

const currentYear = new Date().getFullYear()

const getJoined = (node, keywords) => {
  const words = keywords
    .map(word => node.get(word) || "")
    .filter(i => i)
    .join(" ")
    .split(" ")
  return lodash.uniq(words).join(" ")
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

class PLDBFile extends TrueBaseFile {
  get pldbId() {
    return this.id
  }

  get filePath() {
    return this._getFilePath()
  }

  get domainName() {
    return this.get("domainName")
  }

  get subredditId() {
    return this.get("subreddit")
      ?.split("/")
      .pop()
  }

  get bookCount() {
    if (this.quickCache.bookCount !== undefined)
      return this.quickCache.bookCount
    const gr = this.getNode(`goodreads`)?.length
    const isbndb = this.getNode(`isbndb`)?.length
    let count = 0
    if (gr) count += gr - 1
    if (isbndb) count += isbndb - 1
    this.quickCache.bookCount = count
    return count
  }

  get paperCount() {
    if (this.quickCache.paperCount !== undefined)
      return this.quickCache.paperCount
    const ss = this.getNode(`semanticScholar`)?.length

    let count = 0
    if (ss) count += ss - 1
    this.quickCache.paperCount = count
    return count
  }

  get hopl() {
    return this.get("hopl")?.replace(
      "https://hopl.info/showlanguage.prx?exp=",
      ""
    )
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
    return this.getOneOf(
      "gitRepo githubRepo gitlabRepo sourcehutRepo".split(" ")
    )
  }

  get repl() {
    return this.getOneOf("webRepl rijuRepl tryItOnline replit".split(" "))
  }

  get lineCommentToken() {
    return this.get("lineCommentToken")
  }

  get langRankDebug() {
    const obj = this.parent.getLanguageRankExplanation(this)
    return `TotalRank: ${obj.totalRank} Jobs: ${obj.jobsRank} Users: ${obj.usersRank} Facts: ${obj.factsRank} Links: ${obj.pageRankLinksRank}`
  }

  get previousRanked() {
    return this.isLanguage
      ? this.parent.getFileAtLanguageRank(this.languageRank - 1)
      : this.parent.getFileAtRank(this.rank - 1)
  }

  get nextRanked() {
    return this.isLanguage
      ? this.parent.getFileAtLanguageRank(this.languageRank + 1)
      : this.parent.getFileAtRank(this.rank + 1)
  }

  get exampleCount() {
    return this.allExamples.length + this.featuresWithExamples.length
  }

  get extendedFeaturesNode() {
    if (this.quickCache.extendedFeaturesNode)
      return this.quickCache.extendedFeaturesNode
    const { supersetOfFile } = this
    const featuresNode = this.getNode(`features`) ?? new TreeNode()
    this.quickCache.extendedFeaturesNode = supersetOfFile
      ? supersetOfFile.extendedFeaturesNode.patch(featuresNode)
      : featuresNode
    return this.quickCache.extendedFeaturesNode
  }

  get featuresWithExamples() {
    return this.extendedFeaturesNode.filter(node => node.length)
  }

  get originCommunity() {
    const originCommunity = this.get("originCommunity")
    return originCommunity ? originCommunity.split(" && ") : []
  }

  get creators() {
    return this.get("creators")?.split(" and ") ?? []
  }

  get hasBooleansPrediction() {
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

  get hasImportsPrediction() {
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

  makeSimpleKeywordPrediction(theWord) {
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

  get allExamples() {
    const examples = []

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

  getMostRecentInt(pathToSet) {
    let set = this.getNode(pathToSet)
    if (!set) return 0
    set = set.toObject()
    const key = Math.max(...Object.keys(set).map(year => parseInt(year)))
    return parseInt(set[key])
  }

  get appeared() {
    const appeared = this.get("appeared")
    return appeared === undefined ? 0 : parseInt(appeared)
  }

  get website() {
    return this.get("website")
  }

  get type() {
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

  get numberOfUsers() {
    if (this.quickCache.numberOfUsers === undefined)
      this.quickCache.numberOfUsers = this.parent.predictNumberOfUsers(this)
    return this.quickCache.numberOfUsers
  }

  get numberOfRepos() {
    return this.get("githubLanguage repos")
  }

  get numberOfJobs() {
    if (this.quickCache.numberOfJobs === undefined)
      this.quickCache.numberOfJobs = this.parent.predictNumberOfJobs(this)
    return this.quickCache.numberOfJobs
  }

  get percentile() {
    return this.parent.predictPercentile(this)
  }

  get supersetOfFile() {
    const supersetOf = this.get("supersetOf")
    return supersetOf ? this.parent.getFile(supersetOf) : undefined
  }

  get languageRank() {
    return this.isLanguage ? this.parent.getLanguageRank(this) : undefined
  }

  get rank() {
    if (this.quickCache.rank === undefined)
      this.quickCache.rank = this.parent.getRank(this)
    return this.quickCache.rank
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
    let { type } = this
    type = typeNames[type] || type
    return lodash.startCase(type).toLowerCase()
  }

  get lastActivity() {
    return lodash.max(
      this.parsed
        .findAllWordsWithCellType("yearCell")
        .map(word => parseInt(word.word))
    )
  }

  toScroll() {
    return new LanguagePageTemplate(this).toScroll()
  }
}

class LanguagePageTemplate {
  constructor(file) {
    this.file = file
    this.id = this.file.id
  }

  makeATag(id) {
    const file = this.file.parent.getFile(id)
    return `<a href="${file.permalink}">${file.title}</a>`
  }

  file
  id

  get trendingRepos() {
    const { file } = this
    const { title } = file
    const count = file.get(`$githubLanguage trendingProjectsCount`)
    if (parseInt(count) > 0) {
      const table = file.getNode("githubLanguage trendingProjects")
      const githubId = file.get("githubLanguage")

      if (!table) {
        console.log(`Error with ${this.id}`)
        return ""
      }

      const tree = TreeNode.fromSsv(table.childrenToString())
      tree.forEach(child => {
        child.set("repo", child.get("name"))
        child.set("repoLink", child.get("url"))
      })
      return `## Trending <a href="https://github.com/trending/${githubId}?since=monthly">${title} repos</a> on GitHub
commaTable
 ${cleanAndRightShift(
   tree.toDelimited(",", ["repo", "repoLink", "stars", "description"])
 )}
`
    }
    return ""
  }

  get semanticScholar() {
    const { file } = this
    const { title } = file
    const items = file.getNode(`semanticScholar`)
    if (!items) return ""

    if (items.content === "0") return ""

    const tree = TreeNode.fromDelimited(items.childrenToString(), "|")
    tree.forEach(child => {
      child.set(
        "titleLink",
        `https://www.semanticscholar.org/paper/${child.get("paperId")}`
      )
    })
    return `## Publications about ${title} from Semantic Scholar
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", [
     "title",
     "titleLink",
     "authors",
     "year",
     "citations",
     "influentialCitations"
   ])
 )}
`
  }

  get isbndb() {
    const { file } = this
    const { title } = file
    const isbndb = file.getNode(`isbndb`)
    if (!isbndb) return ""

    if (isbndb.content === "0") return ""

    const tree = TreeNode.fromDelimited(isbndb.childrenToString(), "|")
    tree.forEach(child => {
      child.set("titleLink", `https://isbndb.com/book/${child.get("isbn13")}`)
    })
    return `## Books about ${title} from ISBNdb
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", ["title", "titleLink", "authors", "year", "publisher"])
 )}
`
  }

  get goodreads() {
    const { file } = this
    const { title } = file
    const goodreads = file.getNode(`goodreads`) // todo: the goodreadsIds we have are wrong.
    if (!goodreads) return ""

    const tree = TreeNode.fromDelimited(goodreads.childrenToString(), "|")
    tree.forEach(child => {
      child.set(
        "titleLink",
        `https://www.goodreads.com/search?q=${child.get("title") +
          " " +
          child.get("author")}`
      )
    })
    return `## Books about ${title} on goodreads
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", [
     "title",
     "titleLink",
     "author",
     "year",
     "reviews",
     "ratings",
     "rating"
   ])
 )}
`
  }

  get publications() {
    const { file } = this
    const { title } = file
    const dblp = file.getNode(`dblp`)
    if (dblp && dblp.get("hits") !== "0") {
      const tree = TreeNode.fromDelimited(
        dblp.getNode("publications").childrenToString(),
        "|"
      )
      tree.forEach(child => {
        child.set(
          "titleLink",
          child.get("doi")
            ? `https://doi.org/` + child.get("doi")
            : child.get("url")
        )
      })
      return `## ${dblp.get(
        "hits"
      )} publications about ${title} on <a href="${file.get("dblp")}">DBLP</a>
pipeTable
 ${cleanAndRightShift(tree.toDelimited("|", ["title", "titleLink", "year"]))}
`
    }
    return ""
  }

  get featuresTable() {
    const { file } = this
    const featuresTable = file.extendedFeaturesNode
    if (!featuresTable.length) return ""

    const { featuresMap } = file.parent
    const { id } = file

    const table = new TreeNode()
    featuresTable.forEach(node => {
      const feature = featuresMap.get(node.getWord(0))
      if (!feature) {
        console.log(
          `warning: we need a features page for feature '${node.getWord(
            0
          )}' found in '${id}'`
        )
        return
      }

      const tokenPath = feature.token
      const supported = node.content === "true"

      table
        .appendLineAndChildren(
          `row`,
          `Feature ${feature.title}
FeatureLink ${feature.titleLink}
Supported ${
            supported
              ? `<span class="hasFeature">✓</span>`
              : `<span class="doesNotHaveFeature">X</span>`
          }
Token ${supported && tokenPath ? file.get(tokenPath) ?? "" : ""}
Example`
        )
        .touchNode("Example")
        .setChildren(node.childrenToString())
    })

    return `## Language <a href="../lists/features.html">features</a>

treeTable
 ${table
   .sortBy(["Supported", "Example"])
   .reverse()
   .toString()
   .replace(/\n/g, "\n ")}`
  }

  get hackerNewsTable() {
    const hnTable = this.file
      .getNode(`hackerNewsDiscussions`)
      ?.childrenToString()
    if (!hnTable) return ""

    const table = TreeNode.fromDelimited(hnTable, "|")
    table.forEach(row => {
      row.set(
        "titleLink",
        `https://news.ycombinator.com/item?id=${row.get("id")}`
      )
      row.set("date", dayjs(row.get("time")).format("MM/DD/YYYY"))
    })

    const delimited = table
      .toDelimited("|", ["title", "titleLink", "date", "score", "comments"])
      .replace(/\n/g, "\n ")
      .trim()
    return `## HackerNews discussions of ${this.file.title}

pipeTable
 ${delimited}`
  }

  get sourceUrl() {
    return `https://github.com/breck7/pldb/blob/main/things/${this.id}.pldb`
  }

  toScroll() {
    const { file } = this
    const { typeName, title, id } = file

    if (title.includes("%20")) throw new Error("bad space in title: " + title)

    return `import ../header.scroll
baseUrl https://pldb.com/truebase/
title ${title}

title ${title} - ${lodash.upperFirst(typeName)}
 hidden

html
 <a class="trueBaseThemePreviousItem" href="${this.prevPage}">&lt;</a>
 <a class="trueBaseThemeNextItem" href="${this.nextPage}">&gt;</a>

viewSourceUrl ${this.sourceUrl}

startColumns 4

<div class="trueBaseThemeQuickLinks">${this.quickLinks}</div>

${this.oneLiner}

${this.kpiBar}

${this.tryNowRepls}

${this.monacoEditor}

${this.image}

${this.descriptionSection}

${this.factsSection}

<br>

${this.exampleSection}

${this.funFactSection}

${this.keywordsSection}

endColumns

${this.featuresTable}

${this.trendingRepos}

${this.goodreads}

${this.isbndb}

${this.semanticScholar}

${this.publications}

${this.hackerNewsTable}

keyboardNav ${this.prevPage} ${this.nextPage}

import ../footer.scroll
`.replace(/\n\n\n+/g, "\n\n")
  }

  get image() {
    const { file } = this
    const { title } = file

    let image = file.get("screenshot")
    let caption = `A screenshot of the visual language ${title}.
  link ../lists/languages.html?filter=visual visual language`
    if (!image) {
      image = file.get("photo")
      caption = `A photo of ${title}.`
    }

    if (!image) return ""

    return `openGraphImage ${image}
image ${image.replace("https://pldb.com/", "../")}
 caption ${caption}`
  }

  get monacoEditor() {
    const { file } = this
    const monaco = file.get("monaco")
    if (!monaco) return ""

    const exampleToUse = file.allExamples.find(
      example => !example.code.includes("`")
    ) // our monaco code struggles with backticks for some reason.

    const example = exampleToUse ? exampleToUse.code.replace(/\n/g, "\n ") : ""

    return `monacoEditor ${monaco}
 ${example}`
  }

  get prevPage() {
    return this.file.previousRanked.permalink
  }

  get nextPage() {
    return this.file.nextRanked.permalink
  }

  get quickLinks() {
    const { file } = this

    // Sigh. After learning Material Designs realized
    // it's partially broken on purpose:
    // https://github.com/google/material-design-icons/issues/166
    const SVGS = {
      twitter: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
      reddit: `<svg role="img" width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 18.65625 4 C 16.558594 4 15 5.707031 15 7.65625 L 15 11.03125 C 12.242188 11.175781 9.742188 11.90625 7.71875 13.0625 C 6.945313 12.316406 5.914063 12 4.90625 12 C 3.816406 12 2.707031 12.355469 1.9375 13.21875 L 1.9375 13.25 L 1.90625 13.28125 C 1.167969 14.203125 0.867188 15.433594 1.0625 16.65625 C 1.242188 17.777344 1.898438 18.917969 3.03125 19.65625 C 3.023438 19.769531 3 19.882813 3 20 C 3 22.605469 4.574219 24.886719 6.9375 26.46875 C 9.300781 28.050781 12.488281 29 16 29 C 19.511719 29 22.699219 28.050781 25.0625 26.46875 C 27.425781 24.886719 29 22.605469 29 20 C 29 19.882813 28.976563 19.769531 28.96875 19.65625 C 30.101563 18.917969 30.757813 17.777344 30.9375 16.65625 C 31.132813 15.433594 30.832031 14.203125 30.09375 13.28125 L 30.0625 13.25 C 29.292969 12.386719 28.183594 12 27.09375 12 C 26.085938 12 25.054688 12.316406 24.28125 13.0625 C 22.257813 11.90625 19.757813 11.175781 17 11.03125 L 17 7.65625 C 17 6.675781 17.558594 6 18.65625 6 C 19.175781 6 19.820313 6.246094 20.8125 6.59375 C 21.65625 6.890625 22.75 7.21875 24.15625 7.3125 C 24.496094 8.289063 25.414063 9 26.5 9 C 27.875 9 29 7.875 29 6.5 C 29 5.125 27.875 4 26.5 4 C 25.554688 4 24.738281 4.535156 24.3125 5.3125 C 23.113281 5.242188 22.246094 4.992188 21.46875 4.71875 C 20.566406 4.402344 19.734375 4 18.65625 4 Z M 16 13 C 19.152344 13 21.964844 13.867188 23.9375 15.1875 C 25.910156 16.507813 27 18.203125 27 20 C 27 21.796875 25.910156 23.492188 23.9375 24.8125 C 21.964844 26.132813 19.152344 27 16 27 C 12.847656 27 10.035156 26.132813 8.0625 24.8125 C 6.089844 23.492188 5 21.796875 5 20 C 5 18.203125 6.089844 16.507813 8.0625 15.1875 C 10.035156 13.867188 12.847656 13 16 13 Z M 4.90625 14 C 5.285156 14 5.660156 14.09375 5.96875 14.25 C 4.882813 15.160156 4.039063 16.242188 3.53125 17.4375 C 3.277344 17.117188 3.125 16.734375 3.0625 16.34375 C 2.953125 15.671875 3.148438 14.976563 3.46875 14.5625 C 3.472656 14.554688 3.464844 14.539063 3.46875 14.53125 C 3.773438 14.210938 4.3125 14 4.90625 14 Z M 27.09375 14 C 27.6875 14 28.226563 14.210938 28.53125 14.53125 C 28.535156 14.535156 28.527344 14.558594 28.53125 14.5625 C 28.851563 14.976563 29.046875 15.671875 28.9375 16.34375 C 28.875 16.734375 28.722656 17.117188 28.46875 17.4375 C 27.960938 16.242188 27.117188 15.160156 26.03125 14.25 C 26.339844 14.09375 26.714844 14 27.09375 14 Z M 11 16 C 9.894531 16 9 16.894531 9 18 C 9 19.105469 9.894531 20 11 20 C 12.105469 20 13 19.105469 13 18 C 13 16.894531 12.105469 16 11 16 Z M 21 16 C 19.894531 16 19 16.894531 19 18 C 19 19.105469 19.894531 20 21 20 C 22.105469 20 23 19.105469 23 18 C 23 16.894531 22.105469 16 21 16 Z M 21.25 21.53125 C 20.101563 22.597656 18.171875 23.28125 16 23.28125 C 13.828125 23.28125 11.898438 22.589844 10.75 21.65625 C 11.390625 23.390625 13.445313 25 16 25 C 18.554688 25 20.609375 23.398438 21.25 21.53125 Z"/></svg>`,
      wikipedia: `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="98.05px" height="98.05px" viewBox="0 0 98.05 98.05" style="enable-background:new 0 0 98.05 98.05;" xml:space="preserve"><path d="M98.023,17.465l-19.584-0.056c-0.004,0.711-0.006,1.563-0.017,2.121c1.664,0.039,5.922,0.822,7.257,4.327L66.92,67.155 c-0.919-2.149-9.643-21.528-10.639-24.02l9.072-18.818c1.873-2.863,5.455-4.709,8.918-4.843l-0.01-1.968L55.42,17.489 c-0.045,0.499,0.001,1.548-0.068,2.069c5.315,0.144,7.215,1.334,5.941,4.508c-2.102,4.776-6.51,13.824-7.372,15.475 c-2.696-5.635-4.41-9.972-7.345-16.064c-1.266-2.823,1.529-3.922,4.485-4.004v-1.981l-21.82-0.067 c0.016,0.93-0.021,1.451-0.021,2.131c3.041,0.046,6.988,0.371,8.562,3.019c2.087,4.063,9.044,20.194,11.149,24.514 c-2.685,5.153-9.207,17.341-11.544,21.913c-3.348-7.43-15.732-36.689-19.232-44.241c-1.304-3.218,3.732-5.077,6.646-5.213 l0.019-2.148L0,17.398c0.005,0.646,0.027,1.71,0.029,2.187c4.025-0.037,9.908,6.573,11.588,10.683 c7.244,16.811,14.719,33.524,21.928,50.349c0.002,0.029,2.256,0.059,2.281,0.008c4.717-9.653,10.229-19.797,15.206-29.56 L63.588,80.64c0.005,0.004,2.082,0.016,2.093,0.007c7.962-18.196,19.892-46.118,23.794-54.933c1.588-3.767,4.245-6.064,8.543-6.194 l0.032-1.956L98.023,17.465z"/></svg>`
    }

    const links = {
      home: file.website,
      terminal: file.repl,
      code: file.repo,
      menu_book: file.get("documentation"),
      mail: file.get("emailList"),
      wikipedia: file.get(`wikipedia`),
      reddit: file.get("subreddit"),
      twitter: file.get("twitter"),
      edit: `/edit.html?id=${file.id}`
    }
    return Object.keys(links)
      .filter(key => links[key])
      .map(key =>
        SVGS[key]
          ? `<a href="${links[key]}">${SVGS[key]}</a>`
          : `<a href="${links[key]}" class="material-symbols-outlined">${key}</a>`
      )
      .join(" ")
  }

  get factsSection() {
    return this.facts.map(fact => `- ${fact}`).join("\n")
  }

  get oneLiner() {
    const { file } = this
    const { typeName, title, creators, appeared } = file
    const standsFor = file.get("standsFor")
    let akaMessage = standsFor ? `, aka ${standsFor},` : ""

    let creatorsStr = ""
    let creatorsLinks = ""
    if (creators.length) {
      creatorsStr = ` by ` + creators.join(" and ")
      creatorsLinks = creators
        .map(
          name =>
            ` link ../lists/creators.html#${lodash.camelCase(name)} ${name}`
        )
        .join("\n")
    }

    return `* ${title}${akaMessage} is ${Utils.getIndefiniteArticle(
      typeName
    )} ${this.typeLink}${
      appeared ? ` created in ${appeared}` : ""
    }${creatorsStr}.
 link ../lists/languages.html?filter=${appeared} ${appeared}
${creatorsLinks}
`
  }

  get typeLink() {
    return `<a href="../lists/languages.html?filter=${this.file.type}">${this.file.typeName}</a>`
  }

  get descriptionSection() {
    const { file } = this
    let description = ""
    const authoredDescription = file.get("description")
    const wikipediaSummary = file.get("wikipedia summary")
    const ghDescription = file.get("githubRepo description")
    const wpLink = file.get(`wikipedia`)
    if (wikipediaSummary)
      description =
        wikipediaSummary
          .split(". ")
          .slice(0, 3)
          .join(". ") +
        `. Read more on Wikipedia...\n ${wpLink} Read more on Wikipedia...`
    else if (authoredDescription) description = authoredDescription
    else if (ghDescription) description = ghDescription
    return `* ${description}`
  }

  get facts() {
    const { file } = this
    const { title, website } = file

    const facts = []
    if (website) facts.push(`${title} website\n ${website}`)

    const downloadPageUrl = file.get("downloadPageUrl")
    if (downloadPageUrl)
      facts.push(`${title} downloads page\n ${downloadPageUrl}`)

    const wikipediaLink = file.get("wikipedia")
    const wikiLink = wikipediaLink ? wikipediaLink : ""
    if (wikiLink) facts.push(`${title} Wikipedia page\n ${wikiLink}`)

    const githubRepo = file.getNode("githubRepo")
    if (githubRepo) {
      const stars = githubRepo.get("stars")
      const starMessage = stars
        ? ` and has ${numeral(stars).format("0,0")} stars`
        : ""
      facts.push(
        `${title} is developed on <a href="${githubRepo.getWord(
          1
        )}">GitHub</a>${starMessage}`
      )
    }

    const gitlabRepo = file.get("gitlabRepo")
    if (gitlabRepo) facts.push(`${title} on GitLab\n ${gitlabRepo}`)

    const documentationLinks = file.getAll("documentation")
    if (documentationLinks.length === 1)
      facts.push(`${title} docs\n ${documentationLinks[0]}`)
    else if (documentationLinks.length > 1)
      facts.push(
        `PLDB has ${
          documentationLinks.length
        } documentation sites for ${title}: ${documentationLinks
          .map(makePrettyUrlLink)
          .join(", ")}`
      )

    const specLinks = file.getAll("spec")
    if (specLinks.length === 1) facts.push(`${title} specs\n ${specLinks[0]}`)
    else if (specLinks.length > 1)
      facts.push(
        `PLDB has ${
          specLinks.length
        } specification sites for ${title}: ${specLinks
          .map(makePrettyUrlLink)
          .join(", ")}`
      )

    const emailListLinks = file.getAll("emailList")
    if (emailListLinks.length === 1)
      facts.push(`${title} mailing list\n ${emailListLinks[0]}`)
    else if (emailListLinks.length > 1)
      facts.push(
        `PLDB has ${
          emailListLinks.length
        } mailing list sites for ${title}: ${emailListLinks
          .map(makePrettyUrlLink)
          .join(", ")}`
      )

    const demoVideo = file.get("demoVideo")
    if (demoVideo) facts.push(`Video demo of ${title}\n ${demoVideo}`)

    const githubRepoCount = file.get("githubLanguage repos")
    if (githubRepoCount) {
      const url = `https://github.com/search?q=language:${file.get(
        "githubLanguage"
      )}`
      const repoCount = numeral(githubRepoCount).format("0,0")
      facts.push(
        `There are at least ${repoCount} ${title} repos on <a href="${url}">GitHub</a>`
      )
    }

    const supersetOf = file.supersetOfFile
    if (supersetOf) facts.push(`${title} is a superset of ${supersetOf.link}`)

    const { originCommunity } = file
    let originCommunityStr = ""
    if (originCommunity.length) {
      originCommunityStr = originCommunity
        .map(
          name =>
            `<a href="../lists/originCommunities.html#${lodash.camelCase(
              name
            )}">${name}</a>`
        )
        .join(" and ")
      facts.push(`${title} first developed in ${originCommunityStr}`)
    }

    const { numberOfJobs } = file
    const jobs = numberOfJobs > 10 ? numeral(numberOfJobs).format("0a") : ""
    if (jobs)
      facts.push(
        `PLDB estimates there are currently ${jobs} job openings for ${title} programmers.`
      )

    const { extensions } = file
    if (extensions)
      facts.push(
        `file extensions for ${title} include ${toCommaList(
          extensions.split(" ")
        )}`
      )

    const compilesTo = file.get("compilesTo")
    if (compilesTo)
      facts.push(
        `${title} compiles to ${compilesTo
          .split(" ")
          .map(link => this.makeATag(link))
          .join(" or ")}`
      )

    const writtenIn = file.get("writtenIn")
    if (writtenIn)
      facts.push(
        `${title} is written in ${writtenIn
          .split(" ")
          .map(link => this.makeATag(link))
          .join(" & ")}`
      )

    const twitter = file.get("twitter")
    if (twitter) facts.push(`${title} on Twitter\n ${twitter}`)

    const conferences = file.getNodesByGlobPath("conference")
    if (conferences.length) {
      facts.push(
        `Recurring conference about ${title}: ${conferences.map(
          tree => `<a href="${tree.getWord(1)}">${tree.getWordsFrom(2)}</a>`
        )}`
      )
    }

    const githubBigQuery = file.getNode("githubBigQuery")
    if (githubBigQuery) {
      const url = `https://api.github.com/search/repositories?q=language:${githubBigQuery.content}`
      const userCount = numeral(githubBigQuery.get("users")).format("0a")
      const repoCount = numeral(githubBigQuery.get("repos")).format("0a")
      facts.push(
        `The  Google BigQuery Public Dataset GitHub snapshot shows ${userCount} users using ${title} in ${repoCount} repos on <a href="${url}">GitHub</a>`
      )
    }

    const meetup = file.get("meetup")
    if (meetup) {
      const groupCount = numeral(file.get("meetup groupCount")).format("0,0")
      facts.push(
        `Check out the ${groupCount} <a href="${meetup}/">${title} meetup groups</a> on Meetup.com.`
      )
    }

    const firstAnnouncement = file.get("firstAnnouncement")
    const announcementMethod = file.get("announcementMethod")
    if (firstAnnouncement)
      facts.push(
        `<a href="${firstAnnouncement}">First announcement of</a> ${title}${
          announcementMethod ? " via " + announcementMethod : ""
        }`
      )

    const subreddit = file.get("subreddit")
    if (subreddit) {
      const peNum = numeral(
        file.getMostRecentInt("subreddit memberCount")
      ).format("0,0")
      facts.push(
        `There are ${peNum} members in the <a href="${subreddit}">${title} subreddit</a>`
      )
    }

    const pe = file.get("projectEuler")
    if (pe) {
      const peNum = numeral(
        file.getMostRecentInt("projectEuler memberCount")
      ).format("0,0")
      facts.push(
        `There are ${peNum} <a href="https://projecteuler.net/language=${pe}">Project Euler</a> users using ${title}`
      )
    }

    const soSurvey = file.getNode("stackOverflowSurvey 2021")
    if (soSurvey) {
      let fact = `In the 2021 StackOverflow <a href="https://insights.stackoverflow.com/survey">developer survey</a> ${title} programmers reported a median salary of $${numeral(
        soSurvey.get("medianSalary")
      ).format("0,0")}. `

      fact += `${lodash.round(
        parseFloat(soSurvey.get("percentageUsing")) * 100,
        2
      )}% of respondents reported using ${title}. `

      fact += `${numeral(soSurvey.get("users")).format(
        "0,0"
      )} programmers reported using ${title}, and ${numeral(
        soSurvey.get("fans")
      ).format("0,0")} said they wanted to use it`

      facts.push(fact)
    }

    const rosettaCode = file.get("rosettaCode")
    if (rosettaCode)
      facts.push(
        `Explore ${title} snippets on <a href="${rosettaCode}">Rosetta Code</a>`
      )

    const nativeLanguage = file.get("nativeLanguage")
    if (nativeLanguage)
      facts.push(
        `${title} is written with the native language of ${nativeLanguage}`
      )

    const gdb = file.get("gdbSupport")
    if (gdb)
      facts.push(
        `${title} is supported by the <a href="https://www.sourceware.org/gdb/">GDB</a>`
      )

    const hopl = file.get("hopl")
    if (hopl) facts.push(`${title} on HOPL\n ${hopl}`)

    const tiobe = file.get("tiobe")
    const tiobeRank = file.get("tiobe currentRank")
    if (tiobeRank)
      facts.push(
        `${title} ranks #${tiobeRank} in the <a href="https://www.tiobe.com/tiobe-index/">TIOBE Index</a>`
      )
    else if (tiobe)
      facts.push(
        `${title} appears in the <a href="https://www.tiobe.com/tiobe-index/">TIOBE Index</a>`
      )

    const esolang = file.get("esolang")
    if (esolang) facts.push(`${title} on Esolang\n ${esolang}`)

    const ubuntu = file.get("ubuntuPackage")
    if (ubuntu)
      facts.push(
        `${title} Ubuntu package\n https://packages.ubuntu.com/jammy/${ubuntu}`
      )

    const antlr = file.get("antlr")
    if (antlr)
      facts.push(
        `<a href="antlr.html">ANTLR</a> <a href="${antlr}">grammar</a> for ${title}`
      )

    // todo: handle multiple
    const lsp = file.get("languageServerProtocolProject")
    if (lsp)
      facts.push(
        `${title} <a href="language-server-protocol.html">LSP</a> <a href="${lsp}">implementation</a>`
      )

    const codeMirror = file.get("codeMirror")
    if (codeMirror)
      facts.push(
        `<a href="codemirror.html">CodeMirror</a> <a href="https://github.com/codemirror/codemirror5/tree/master/mode/${codeMirror}">package</a> for syntax highlighting ${title}`
      )

    const monaco = file.get("monaco")
    if (monaco)
      facts.push(
        `<a href="monaco.html">Monaco</a> <a href="https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages/${monaco}">package</a> for syntax highlighting ${title}`
      )

    const pygmentsHighlighter = file.get("pygmentsHighlighter")
    if (pygmentsHighlighter)
      facts.push(
        `<a href="pygments.html">Pygments</a> supports <a href="https://github.com/pygments/pygments/blob/master/pygments/lexers/${file.get(
          "pygmentsHighlighter filename"
        )}">syntax highlighting</a> for ${title}`
      )

    const linguist = file.get("linguistGrammarRepo")
    if (linguist)
      facts.push(
        `GitHub supports <a href="${linguist}" title="The package used for syntax highlighting by GitHub Linguist.">syntax highlighting</a> for ${title}`
      )

    const quineRelay = file.get("quineRelay")
    if (quineRelay)
      facts.push(
        `${title} appears in the <a href="https://github.com/mame/quine-relay">Quine Relay</a> project`
      )

    const jupyters = file.getAll("jupyterKernel")
    if (jupyters.length === 1)
      facts.push(
        `There is 1 <a href="jupyter-notebook.html">Jupyter</a> <a href="${jupyters[0]}">Kernel</a> for ${title}`
      )
    else if (jupyters.length > 1)
      facts.push(
        `PLDB has ${
          jupyters.length
        } <a href="jupyter-notebook.html">Jupyter</a> Kernels for ${title}: ${jupyters
          .map(makePrettyUrlLink)
          .join(", ")}`
      )

    const packageRepos = file.getAll("packageRepository")
    if (packageRepos.length === 1)
      facts.push(
        `There is a <a href="${packageRepos[0]}">central package repository</a> for ${title}`
      )
    else if (packageRepos.length > 1)
      facts.push(
        `There are ${
          packageRepos.length
        } central package repositories for ${title}: ${linkManyAftertext(
          packageRepos
        )}`
      )

    const annualReport = file.getAll("annualReportsUrl")

    if (annualReport.length >= 1)
      facts.push(`Annual Reports for ${title}\n ${annualReport[0]}`)

    const releaseNotes = file.getAll("releaseNotesUrl")

    if (releaseNotes.length >= 1)
      facts.push(`Release Notes for ${title}\n ${releaseNotes[0]}`)
    const officialBlog = file.getAll("officialBlogUrl")

    if (officialBlog.length >= 1)
      facts.push(`Official Blog page for ${title}\n ${officialBlog[0]}`)
    const eventsPage = file.getAll("eventsPageUrl")

    if (eventsPage.length >= 1)
      facts.push(`Events page for ${title}\n ${eventsPage[0]}`)

    const faqPage = file.getAll("faqPageUrl")

    if (faqPage.length >= 1)
      facts.push(`Frequently Asked Questions for ${title}\n ${faqPage[0]}`)

    const cheatSheetUrl = file.get("cheatSheetUrl")
    if (cheatSheetUrl) facts.push(`${title} cheat sheet\n ${cheatSheetUrl}`)

    const indeedJobs = file.getNode("indeedJobs")
    if (indeedJobs) {
      const query = file.get("indeedJobs")
      const jobCount = numeral(file.getMostRecentInt("indeedJobs")).format(
        "0,0"
      )
      facts.push(
        `Indeed.com has ${jobCount} matches for <a href="https://www.indeed.com/jobs?q=${query}">"${query}"</a>.`
      )
    }

    const domainRegistered = file.get("domainName registered")
    if (domainRegistered)
      facts.push(
        `<a href="${website}">${file.get(
          "domainName"
        )}</a> was registered in ${domainRegistered}`
      )

    const wpRelated = file.get("wikipedia related")
    const seeAlsoLinks = wpRelated ? wpRelated.split(" ") : []
    const related = file.get("related")
    if (related) related.split(" ").forEach(id => seeAlsoLinks.push(id))

    if (seeAlsoLinks.length)
      facts.push(
        "See also: " +
          `(${seeAlsoLinks.length} related languages)` +
          seeAlsoLinks.map(link => this.makeATag(link)).join(", ")
      )

    const { otherReferences } = file

    const semanticScholarReferences = otherReferences.filter(link =>
      link.includes("semanticscholar")
    )
    const nonSemanticScholarReferences = otherReferences.filter(
      link => !link.includes("semanticscholar")
    )

    if (semanticScholarReferences.length)
      facts.push(
        `Read more about ${title} on Semantic Scholar: ${linkManyAftertext(
          semanticScholarReferences
        )}`
      )
    if (nonSemanticScholarReferences.length)
      facts.push(
        `Read more about ${title} on the web: ${linkManyAftertext(
          nonSemanticScholarReferences
        )}`
      )

    facts.push(
      `HTML of this page generated by <a href="https://github.com/breck7/pldb/blob/main/code/LanguagePage.ts">LanguagePage.ts</a>`
    )
    return facts
  }

  get keywordsSection() {
    const keywords = this.file.get("keywords")
    if (!keywords) return ""
    return `## <a href="../lists/keywords.html?filter=${this.id}">Keywords</a> in ${this.file.title}
* ${keywords}`
  }

  get funFactSection() {
    return this.file
      .findNodes("funFact")
      .map(
        fact =>
          `codeWithHeader ${`<a href='${fact.content}'>Fun fact</a>`}:
 ${cleanAndRightShift(lodash.escape(fact.childrenToString()))}`
      )
      .join("\n\n")
  }

  get exampleSection() {
    return this.file.allExamples
      .map(
        example =>
          `codeWithHeader Example from ${
            !example.link
              ? example.source
              : `<a href='${example.link}'>` + example.source + "</a>"
          }:
 ${cleanAndRightShift(lodash.escape(example.code))}`
      )
      .join("\n\n")
  }

  get tryNowRepls() {
    const { file } = this

    const repls = []

    const webRepl = file.get("webRepl")
    if (webRepl) repls.push(`<a href="${webRepl}">Web</a>`)

    const rijuRepl = file.get("rijuRepl")
    if (rijuRepl) repls.push(`<a href="${rijuRepl}">Riju</a>`)

    const tryItOnline = file.get("tryItOnline")
    if (tryItOnline)
      repls.push(`<a href="https://tio.run/#${tryItOnline}">TIO</a>`)

    const replit = file.get("replit")
    if (replit) repls.push(`<a href="${replit}">Replit</a>`)

    if (!repls.length) return ""

    return `* Try now: ` + repls.join(" · ")
  }

  get kpiBar() {
    const { file } = this
    const {
      appeared,
      numberOfUsers,
      bookCount,
      paperCount,
      numberOfRepos,
      title,
      isLanguage,
      languageRank
    } = file
    const users =
      numberOfUsers > 10
        ? numberOfUsers < 1000
          ? numeral(numberOfUsers).format("0")
          : numeral(numberOfUsers).format("0.0a")
        : ""

    const lines = [
      isLanguage
        ? `#${languageRank + 1} <span title="${
            file.langRankDebug
          }">on PLDB</span>`
        : `#${file.rank + 1} on PLDB`,
      appeared ? `${currentYear - appeared} Years Old` : "",
      users
        ? `${users} <span title="Crude user estimate from a linear model.">Users</span>`
        : "",
      isLanguage
        ? `${bookCount} <span title="Books about or leveraging ${title}">Books</span>`
        : "",
      isLanguage
        ? `${paperCount} <span title="Academic publications about or leveraging ${title}">Papers</span>`
        : "",
      numberOfRepos
        ? `${numeral(numberOfRepos).format(
            "0a"
          )} <span title="${title} repos on GitHub.">Repos</span>`
        : ""
    ]
      .filter(i => i)
      .join("\n ")

    return `kpiTable
 ${lines}`
  }
}

// One feature maps to one grammar file that extends abstractFeatureNode
class Feature {
  constructor(node, base) {
    this.node = node
    this.base = base
    this.fileName = this.id + ".grammar"
    this.id = node.id.replace("Node", "")
  }

  id = ""
  fileName = ""

  get permalink() {
    return this.id + ".html"
  }

  get yes() {
    return this.languagesWithThisFeature.length
  }

  get no() {
    return this.languagesWithoutThisFeature.length
  }

  get percentage() {
    const { yes, no } = this
    const measurements = yes + no
    return measurements < 100
      ? "-"
      : lodash.round((100 * yes) / measurements, 0) + "%"
  }

  get aka() {
    return this.get("aka") // .join(" or "),
  }

  get token() {
    return this.get("tokenKeyword")
  }

  get titleLink() {
    return `../features/${this.permalink}`
  }

  get(word) {
    return this.node.getFrom(`string ${word}`)
  }

  get title() {
    return this.get("title") || this.id
  }

  get pseudoExample() {
    return (this.get("pseudoExample") || "")
      .replace(/\</g, "&lt;")
      .replace(/\|/g, "&#124;")
  }

  get references() {
    return (this.get("reference") || "").split(" ").filter(i => i)
  }

  get languagesWithThisFeature() {
    const { id } = this
    return this.base
      .getLanguagesWithFeatureResearched(id)
      .filter(file => file.extendedFeaturesNode.get(id) === "true")
  }

  get languagesWithoutThisFeature() {
    const { id } = this
    return this.base
      .getLanguagesWithFeatureResearched(id)
      .filter(file => file.extendedFeaturesNode.get(id) === "false")
  }

  get summary() {
    const {
      id,
      title,
      fileName,
      titleLink,
      aka,
      token,
      yes,
      no,
      percentage,
      pseudoExample
    } = this
    return {
      id,
      title,
      fileName,
      titleLink,
      aka,
      token,
      yes,
      no,
      measurements: yes + no,
      percentage,
      pseudoExample
    }
  }

  toScroll() {
    const { title, id, fileName, references, previous, next } = this

    const positives = this.languagesWithThisFeature
    const positiveText = `* Languages *with* ${title} include ${positives
      .map(file => `<a href="../truebase/${file.permalink}">${file.title}</a>`)
      .join(", ")}`

    const negatives = this.languagesWithoutThisFeature
    const negativeText = negatives.length
      ? `* Languages *without* ${title} include ${negatives
          .map(
            file => `<a href="../truebase/${file.permalink}">${file.title}</a>`
          )
          .join(", ")}`
      : ""

    const examples = positives
      .filter(file => file.extendedFeaturesNode.getNode(id).length)
      .map(file => {
        return {
          id: file.id,
          title: file.title,
          example: file.extendedFeaturesNode.getNode(id).childrenToString()
        }
      })
    const grouped = lodash.groupBy(examples, "example")
    const examplesText = Object.values(grouped)
      .map(group => {
        const links = group
          .map(hit => `<a href="../truebase/${hit.id}.html">${hit.title}</a>`)
          .join(", ")
        return `codeWithHeader Example from ${links}:
 ${shiftRight(removeReturnChars(lodash.escape(group[0].example)), 1)}`
      })
      .join("\n\n")

    let referencesText = ""
    if (references.length)
      referencesText = `* Read more about ${title} on the web: ${linkManyAftertext(
        references
      )}`

    let descriptionText = ""
    const description = this.node.get(`description`)
    if (description) descriptionText = `* This question asks: ${description}`

    return `import header.scroll

title ${title}

title ${title} - language feature
 hidden

html
 <a class="trueBaseThemePreviousItem" href="${previous.permalink}">&lt;</a>
 <a class="trueBaseThemeNextItem" href="${next.permalink}">&gt;</a>

viewSourceUrl https://github.com/breck7/pldb/blob/main/grammar/${fileName}

startColumns 4

${examplesText}

${positiveText}

${negativeText}

${descriptionText}

${referencesText}

* HTML of this page generated by Features.ts
 https://github.com/breck7/pldb/blob/main/code/Features.ts Features.ts

endColumns

keyboardNav ${previous.permalink} ${next.permalink}

import ../footer.scroll
`.replace(/\n\n\n+/g, "\n\n")
  }
}

const calcRanks = (folder, files) => {
  const { pageRankLinks } = folder
  let objects = files.map(file => {
    const id = file.id
    const object = {}
    object.id = id
    object.jobs = folder.predictNumberOfJobs(file)
    object.users = folder.predictNumberOfUsers(file)
    object.facts = file.factCount
    object.pageRankLinks = pageRankLinks[id].length
    return object
  })

  objects = rankSort(objects, "jobs")
  objects = rankSort(objects, "users")
  objects = rankSort(objects, "facts")
  objects = rankSort(objects, "pageRankLinks")

  objects.forEach((obj, rank) => {
    // Drop the item this does the worst on, as it may be a flaw in PLDB.
    const top3 = [
      obj.jobsRank,
      obj.usersRank,
      obj.factsRank,
      obj.pageRankLinksRank
    ]
    obj.totalRank = lodash.sum(lodash.sortBy(top3).slice(0, 3))
  })
  objects = lodash.sortBy(objects, ["totalRank"])

  const ranks = {}
  objects.forEach((obj, index) => {
    obj.index = index
    ranks[obj.id] = obj
  })
  return ranks
}

const rankSort = (objects, key) => {
  objects = lodash.sortBy(objects, [key])
  objects.reverse()
  let lastValue = objects[0][key]
  let lastRank = 0
  objects.forEach((obj, rank) => {
    const theValue = obj[key]
    if (lastValue === theValue) {
      // A tie
      obj[key + "Rank"] = lastRank
    } else {
      obj[key + "Rank"] = rank
      lastRank = rank
      lastValue = theValue
    }
  })
  return objects
}

const computeRankings = folder => {
  const ranks = calcRanks(folder, folder.getChildren())
  const inverseRanks = makeInverseRanks(ranks)
  const languageRanks = calcRanks(
    folder,
    folder.filter(file => file.isLanguage)
  )
  const inverseLanguageRanks = makeInverseRanks(languageRanks)

  return {
    ranks,
    inverseRanks,
    languageRanks,
    inverseLanguageRanks
  }
}

const makeInverseRanks = ranks => {
  const inverseRanks = {}
  Object.keys(ranks).forEach(id => {
    inverseRanks[ranks[id].index] = ranks[id]
  })
  return inverseRanks
}

class PLDBFolder extends TrueBaseFolder {
  computedColumnNames = `pldbId bookCount paperCount hopl exampleCount numberOfUsers numberOfRepos numberOfJobs languageRank rank factCount lastActivity`.split(
    " "
  )
  globalSortFunction = item => parseInt(item.rank)
  // todo: move these to .truebase settings file
  thingsViewSourcePath = `https://github.com/breck7/pldb/blob/main/things/`
  grammarViewSourcePath = `https://github.com/breck7/pldb/blob/main/grammar/`
  computedsViewSourcePath = `https://github.com/breck7/pldb/blob/main/code/PLDB.js`
  defaultColumnSortOrder = `title
appeared
type
pldbId
rank
languageRank
factCount
lastActivity
exampleCount
bookCount
paperCount
numberOfUsers
numberOfJobs
githubBigQuery.repos
creators
githubRepo
website
wikipedia`.split("\n")

  createParser() {
    return new TreeNode.Parser(PLDBFile)
  }

  get filesWithInvalidFilenames() {
    return this.filter(file => file.id !== Utils.titleToPermalink(file.id))
  }

  searchForEntity(query) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return (
      searchIndex.get(query) ||
      searchIndex.get(query.toLowerCase()) ||
      searchIndex.get(Utils.titleToPermalink(query))
    )
  }

  searchForEntityByFileExtensions(extensions = []) {
    const { extensionsMap } = this
    const hit = extensions.find(ext => extensionsMap.has(ext))
    return extensionsMap.get(hit)
  }

  get extensionsMap() {
    if (this.quickCache.extensionsMap) return this.quickCache.extensionsMap
    this.quickCache.extensionsMap = new Map()
    const extensionsMap = this.quickCache.extensionsMap
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

  get topLanguages() {
    if (!this.quickCache.topLanguages)
      this.quickCache.topLanguages = lodash.sortBy(
        this.filter(lang => lang.isLanguage),
        "languageRank"
      )
    return this.quickCache.topLanguages
  }

  predictNumberOfUsers(file) {
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
      "githubRepo forks": v => v * 3,
      annualReport: v => 1000
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

  predictNumberOfJobs(file) {
    return (
      Math.round(file.getMostRecentInt("linkedInSkill") * 0.01) +
      file.getMostRecentInt("indeedJobs")
    )
  }

  get rankings() {
    if (!this.quickCache.rankings)
      this.quickCache.rankings = computeRankings(this)
    return this.quickCache.rankings
  }

  _getFileAtRank(rank, ranks) {
    const count = Object.keys(ranks).length
    if (rank < 0) rank = count - 1
    if (rank >= count) rank = 0
    return this.getFile(ranks[rank].id)
  }

  getLanguagesWithFeatureResearched(id) {
    if (!this.quickCache.featureCache) this.quickCache.featureCache = {}
    if (this.quickCache.featureCache[id])
      return this.quickCache.featureCache[id]
    this.quickCache.featureCache[id] = this.topLanguages.filter(file =>
      file.extendedFeaturesNode.has(id)
    )
    return this.quickCache.featureCache[id]
  }

  get featuresMap() {
    if (this.quickCache.featuresMap) return this.quickCache.featuresMap
    this.quickCache.featuresMap = new Map()
    const featuresMap = this.quickCache.featuresMap
    this.topFeatures.forEach(feature => featuresMap.set(feature.id, feature))
    return featuresMap
  }

  get features() {
    if (!this.quickCache.features) {
      const allGrammarNodes = Object.values(
        this.nodeAt(0)
          .parsed.getDefinition()
          ._getProgramNodeTypeDefinitionCache()
      )

      const features = allGrammarNodes
        .filter(node => node.get("extends") === "abstractFeatureNode")
        .map(nodeDef => {
          const feature = new Feature(nodeDef, this)
          if (!feature.title) {
            throw new Error(`Feature ${nodeDef.toString()} has no title.`)
          }
          return feature
        })

      let previous = features[features.length - 1]
      features.forEach((feature, index) => {
        feature.previous = previous
        feature.next = features[index + 1]
        previous = feature
      })
      features[features.length - 1].next = features[0]

      this.quickCache.features = features
    }
    return this.quickCache.features
  }

  get topFeatures() {
    if (this.quickCache.topFeatures) return this.quickCache.topFeatures
    const { features } = this
    const sorted = lodash.sortBy(features, "yes")
    sorted.reverse()
    this.quickCache.topFeatures = sorted
    return sorted
  }

  getFileAtLanguageRank(rank) {
    return this._getFileAtRank(rank, this.rankings.inverseLanguageRanks)
  }

  getFileAtRank(rank) {
    return this._getFileAtRank(rank, this.rankings.inverseRanks)
  }

  predictPercentile(file) {
    const files = this.getChildren()
    const { ranks } = this.rankings
    return ranks[file.id].index / files.length
  }

  getLanguageRankExplanation(file) {
    return this.rankings.languageRanks[file.id]
  }

  getLanguageRank(file) {
    return this.rankings.languageRanks[file.id].index
  }

  getRank(file) {
    return this.rankings.ranks[file.id].index
  }

  get exampleCounts() {
    const counts = new Map()
    this.forEach(file => counts.set(file.id, file.exampleCount))
    return counts
  }

  groupByListValues(listColumnName, files = this.files, delimiter = " && ") {
    const values = {}
    files.forEach(file => {
      const value = file.get(listColumnName)
      if (!value) return
      value.split(delimiter).forEach(value => {
        if (!values[value]) values[value] = []
        values[value].push(file)
      })
    })
    return values
  }

  get keywordsOneHotCsv() {
    if (!this.quickCache.keywordsOneHotCsv)
      this.quickCache.keywordsOneHotCsv = new TreeNode(
        this.keywordsOneHot
      ).toCsv()
    return this.quickCache.keywordsOneHotCsv
  }

  get keywordsOneHot() {
    if (this.quickCache.keywordsOneHot) return this.quickCache.keywordsOneHot
    const { keywordsTable } = this
    const allKeywords = keywordsTable.rows.map(row => row.keyword)
    const langsWithKeywords = this.topLanguages.filter(file =>
      file.has("keywords")
    )
    const headerRow = allKeywords.slice()
    headerRow.unshift("pldbId")
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

  get keywordsTable() {
    if (this.quickCache.keywordsTable) return this.quickCache.keywordsTable
    const langsWithKeywords = this.topLanguages.filter(file =>
      file.has("keywords")
    )
    const langsWithKeywordsCount = langsWithKeywords.length

    const keywordsMap = {}
    langsWithKeywords.forEach(file => {
      file.keywords.forEach(keyword => {
        const keywordKey = "Q" + keyword // b.c. you cannot have a key "constructor" in JS objects.

        if (!keywordsMap[keywordKey])
          keywordsMap[keywordKey] = {
            keyword,
            ids: []
          }

        const row = keywordsMap[keywordKey]

        row.ids.push(file.id)
      })
    })

    const rows = Object.values(keywordsMap)
    rows.forEach(row => {
      row.count = row.ids.length
      row.langs = row.ids
        .map(id => {
          const file = this.getFile(id)
          return `<a href='../truebase/${file.permalink}'>${file.title}</a>`
        })
        .join(" ")
      row.frequency =
        Math.round(100 * lodash.round(row.count / langsWithKeywordsCount, 2)) +
        "%"
    })

    this.quickCache.keywordsTable = {
      langsWithKeywordsCount,
      rows: lodash.sortBy(rows, "count").reverse()
    }

    return this.quickCache.keywordsTable
  }
}

class PLDBServer extends TrueBaseServer {
  beforeListen() {
    this.serveFolderNested(
      "/monaco-editor",
      path.join(nodeModulesFolder, "monaco-editor")
    )
    // todo: cleanup
    this.addRedirects(this.app)
    super.beforeListen()
    return this
  }

  addRedirects(app) {
    // /languages => /truebase redirect
    app.get("/languages/:id", (req, res, next) =>
      res.status(302).redirect(`/truebase/${req.params.id}`)
    )

    const redirects = Disk.read(path.join(siteFolder, "redirects.txt"))
      .split("\n")
      .map(line => {
        const [oldUrl, newUrl] = line.split(" ")
        return {
          oldUrl,
          newUrl
        }
      })
    redirects.forEach(redirect =>
      app.get(`/${redirect.oldUrl}`, (req, res) =>
        res.status(301).redirect(redirect.newUrl)
      )
    )
  }

  listenProd() {
    this.gitOn = true
    return super.listenProd()
  }

  get keywordsImports() {
    const { rows, langsWithKeywordsCount } = this.folder.keywordsTable

    return {
      NUM_KEYWORDS: numeral(rows.length).format("0,0"),
      LANGS_WITH_KEYWORD_DATA: langsWithKeywordsCount,
      KEYWORDS_TABLE: quickTree(rows, [
        "keyword",
        "count",
        "frequency",
        "langs"
      ])
    }
  }

  warmTrueBasePages() {
    super.warmTrueBasePages()
    this.warmFeaturePagesCommand()
  }

  warmFeaturePagesCommand() {
    const { virtualFiles } = this
    const { siteFolder } = this.settings
    this.folder.features.forEach(
      feature =>
        (virtualFiles[
          siteFolder + `/features/${feature.id}.scroll`
        ] = feature.toScroll())
    )
  }

  get acknowledgementsImports() {
    const { sources } = this.folder
    let writtenIn = [
      "javascript",
      "nodejs",
      "html",
      "css",
      "treenotation",
      "scroll",
      "grammar",
      "python",
      "bash",
      "markdown",
      "json",
      "typescript",
      "png-format",
      "svg",
      "explorer",
      "gitignore"
    ].map(s => this.folder.getFile(this.folder.searchForEntity(s)))

    const npmPackages = Object.keys({
      ...require("../package.json").dependencies
    })
    npmPackages.sort()

    return {
      WRITTEN_IN_TABLE: lodash
        .sortBy(writtenIn, "rank")
        .map(file => `- ${file.title}\n link ../truebase/${file.permalink}`)
        .join("\n"),
      PACKAGES_TABLE: npmPackages
        .map(s => `- ${s}\n https://www.npmjs.com/package/${s}`)
        .join("\n"),
      SOURCES_TABLE: sources.map(s => `- ${s}\n https://${s}`).join("\n"),
      CONTRIBUTORS_TABLE: JSON.parse(
        Disk.read(path.join(pagesDir, "contributors.json"))
      )
        .filter(
          item =>
            item.login !== "codelani" &&
            item.login !== "breck7" &&
            item.login !== "pldbbot"
        )
        .map(item => `- ${item.login}\n ${item.html_url}`)
        .join("\n")
    }
  }

  warmCsvFiles() {
    super.warmCsvFiles()
    const { folder, virtualFiles } = this
    const { siteFolder } = this.settings
    const langPath = path.join(siteFolder, "languages.csv")
    virtualFiles[langPath] = folder.makeCsv(
      "langs.csv",
      new TreeNode(folder.objectsForCsv.filter(obj => isLanguage(obj.type)))
    )
  }

  get csvImports() {
    const { folder } = this
    return {
      LANG_COUNT: folder.topLanguages.length,
      APPROXIMATE_FACT_COUNT: numeral(folder.factCount).format("0,0a"),
      COL_COUNT: folder.colNamesForCsv.length,
      ENTITY_COUNT: folder.length,
      ENTITIES_FILE_SIZE_UNCOMPRESSED: numeral(
        folder.makeCsv("pldb.csv").length
      ).format("0.0b"),
      LANGS_FILE_SIZE_UNCOMPRESSED: numeral(
        folder.makeCsv("langs.csv").length
      ).format("0.0b"),
      COLUMN_METADATA_TABLE: quickTree(
        folder.columnsCsvOutput.columnsMetadataTree,
        folder.columnsCsvOutput.columnMetadataColumnNames
      )
    }
  }

  get top1000Imports() {
    const files = this.folder.topLanguages.map(file => {
      const appeared = file.get("appeared")
      const rank = file.languageRank + 1
      const type = file.get("type")
      const title = file.get("title")
      return {
        title,
        titleLink: `../truebase/${file.permalink}`,
        rank,
        type,
        appeared
      }
    })

    return {
      TOP_1000: quickTree(files.slice(0, 1000), [
        "title",
        "titleLink",
        "appeared",
        "type",
        "rank"
      ])
    }
  }

  get extensionsImports() {
    const files = this.folder
      .filter(file => file.extensions)
      .map(file => {
        return {
          name: file.title,
          nameLink: `../truebase/${file.permalink}`,
          rank: file.rank,
          extensions: file.extensions
        }
      })

    const allExtensions = new Set()
    files.forEach(file =>
      file.extensions.split(" ").forEach(ext => allExtensions.add(ext))
    )

    files.forEach(
      file => (file.numberOfExtensions = file.extensions.split(" ").length)
    )

    return {
      EXTENSION_COUNT: numeral(allExtensions.size).format("0,0"),
      TABLE: quickTree(lodash.sortBy(files, "rank"), [
        "name",
        "nameLink",
        "extensions",
        "numberOfExtensions"
      ]),
      LANG_WITH_DATA_COUNT: files.length
    }
  }

  get topFeaturesImports() {
    const { topFeatures } = this.folder
    const summaries = topFeatures
      .map(feature => feature.summary)
      .filter(feature => feature.measurements > 9)
    return {
      COUNT: numeral(summaries.length).format("0,0"),
      TABLE: quickTree(summaries, [
        "title",
        "titleLink",
        "pseudoExample",
        "yes",
        "no",
        "percentage"
      ])
    }
  }

  get allFeaturesImports() {
    const { topFeatures } = this.folder
    const summaries = topFeatures.map(feature => feature.summary)
    return {
      COUNT: numeral(summaries.length).format("0,0"),
      TABLE: quickTree(summaries, [
        "title",
        "titleLink",
        "pseudoExample",
        "yes",
        "no",
        "percentage"
      ])
    }
  }

  get originCommunitiesImports() {
    const files = lodash.sortBy(
      this.folder.filter(
        file => file.isLanguage && file.originCommunity.length
      ),
      "languageRank"
    )

    const entities = this.folder.groupByListValues("originCommunity", files)
    const rows = Object.keys(entities).map(name => {
      const group = entities[name]
      const languages = group
        .map(lang => `<a href='../truebase/${lang.id}.html'>${lang.title}</a>`)
        .join(" - ")
      const count = group.length
      const top = -Math.min(...group.map(lang => lang.languageRank))

      const wrappedName = `<a name='${lodash.camelCase(name)}' />${name}`

      return { name: wrappedName, languages, count, top }
    })
    const sorted = lodash.sortBy(rows, ["count", "top"])
    sorted.reverse()

    return {
      TABLE: quickTree(sorted, ["count", "name", "languages"]),
      COUNT: numeral(Object.values(entities).length).format("0,0")
    }
  }

  get creatorsImports() {
    const entities = this.folder.groupByListValues(
      "creators",
      this.folder.filter(file => file.isLanguage),
      " and "
    )
    const wikipediaLinks = new TreeNode(
      Disk.read(path.join(listsFolder, "creators.tree"))
    )

    const rows = Object.keys(entities).map(name => {
      const group = lodash.sortBy(entities[name], "languageRank")
      const person = wikipediaLinks.nodesThatStartWith(name)[0]
      const anchorTag = lodash.camelCase(name)

      return {
        name: !person
          ? `<a name='${anchorTag}' />${name}`
          : `<a name='${anchorTag}' href='https://en.wikipedia.org/wiki/${person.get(
              "wikipedia"
            )}'>${name}</a>`,
        languages: group
          .map(
            file => `<a href='../truebase/${file.permalink}'>${file.title}</a>`
          )
          .join(" - "),
        count: group.length,
        topRank: group[0].languageRank + 1
      }
    })

    return {
      TABLE: quickTree(lodash.sortBy(rows, "topRank"), [
        "name",
        "languages",
        "count",
        "topRank"
      ]),
      COUNT: numeral(Object.values(entities).length).format("0,0")
    }
  }

  async crawlGitHubCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have truecrawler project installed separateely.
    const { GitHubImporter } = require("../../truecrawler/github.com/GitHub.js")
    const importer = new GitHubImporter(this.folder)
    await importer.fetchAllRepoDataCommand()
    await importer.writeAllRepoDataCommand()
  }
}

const pldbFolder = new PLDBFolder().setSettings({
  grammarFolder: path.join(baseFolder, "grammar"),
  thingsFolder: path.join(baseFolder, "things")
})

const PLDB = new PLDBServer(path.join(baseFolder, "pldb.truebase"), pldbFolder)

module.exports = { PLDB }

if (!module.parent) Utils.runCommand(PLDB, process.argv[2], process.argv[3])
