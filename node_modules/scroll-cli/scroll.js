#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")

// Scroll Notation Includes
const { TreeNode } = require("scrollsdk/products/TreeNode.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { TreeFileSystem } = require("scrollsdk/products/TreeFileSystem.js")
const stumpParser = require("scrollsdk/products/stump.nodejs.js")
const packageJson = require("./package.json")

// Constants
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const PARSERS_FILE_EXTENSION = ".parsers"
// Todo: how to keep in sync with scroll files?
const scrollKeywords = {
  title: "title",
  description: "description",
  viewSourceUrl: "viewSourceUrl",
  downloadUrl: "downloadUrl",
  permalink: "permalink",
  canonicalUrl: "canonicalUrl",
  image: "image",
  date: "date",
  endSnippet: "endSnippet",
  groups: "groups",
  keyboardNav: "keyboardNav",
  replace: "replace",
  replaceJs: "replaceJs",
  replaceNodejs: "replaceNodejs",
  buildConcepts: "buildConcepts",
  buildMeasures: "buildMeasures",
  buildTxt: "buildTxt",
  buildHtml: "buildHtml",
  buildRss: "buildRss",
  import: "import",
  importOnly: "importOnly",
  baseUrl: "baseUrl",
  viewSourceBaseUrl: "viewSourceBaseUrl",
  openGraphImage: "openGraphImage",
  openGraph: "openGraph",
  git: "git",
  email: "email",
  rssFeedUrl: "rssFeedUrl"
}
const SVGS = {
  download: `<svg fill="#000000" xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve"><path d="M38.6,20.4c-1-6.5-6.7-11.5-13.5-11.5c-7.6,0-13.7,6.1-13.7,13.7c0,0.3,0,0.7,0.1,1c-5,0.4-8.9,4.6-8.9,9.6 c0,5.4,4.3,9.7,9.7,9.7h11.5c-0.8-0.8-8.1-8.1-8.1-8.1c-0.4-0.4-0.4-0.9,0-1.3l1.3-1.3c0.4-0.4,0.9-0.4,1.3,0l3.5,3.5 c0.4,0.4,1.1,0.1,1.1-0.4V21.8c0-0.4,0.5-0.9,1-0.9h1.9c0.5,0,0.9,0.4,0.9,0.9v13.4c0,0.6,0.8,0.8,1.1,0.4l3.5-3.5 c0.4-0.4,0.9-0.4,1.3,0l1.3,1.3c0.4,0.4,0.4,0.9,0,1.3L26,42.9h12.3v0c6.1-0.1,11-5.1,11-11.3C49.4,25.5,44.6,20.6,38.6,20.4z"/></svg>`, // <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
  git: `<svg xmlns="http://www.w3.org/2000/svg" width="92pt" height="92pt" viewBox="0 0 92 92"><path d="M90.156 41.965 50.036 1.848a5.913 5.913 0 0 0-8.368 0l-8.332 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.043 7.043 0 0 1 1.673 7.277l10.183 10.184a7.026 7.026 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.045 7.045 0 0 1-9.961 0 7.038 7.038 0 0 1-1.532-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.034 7.034 0 0 1 2.308-1.539V33.926a7.001 7.001 0 0 1-2.308-1.535 7.049 7.049 0 0 1-1.516-7.7L29.242 14.273 1.734 41.777a5.918 5.918 0 0 0 0 8.371L41.855 90.27a5.92 5.92 0 0 0 8.368 0l39.933-39.934a5.925 5.925 0 0 0 0-8.371"/></svg>`,
  email: `<svg viewBox="3 5 24 20" width="24" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 0, -289.0625)"><path style="opacity:1;stroke:none;stroke-width:0.49999997;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 5 5 C 4.2955948 5 3.6803238 5.3628126 3.3242188 5.9101562 L 14.292969 16.878906 C 14.696939 17.282876 15.303061 17.282876 15.707031 16.878906 L 26.675781 5.9101562 C 26.319676 5.3628126 25.704405 5 25 5 L 5 5 z M 3 8.4140625 L 3 23 C 3 24.108 3.892 25 5 25 L 25 25 C 26.108 25 27 24.108 27 23 L 27 8.4140625 L 17.121094 18.292969 C 15.958108 19.455959 14.041892 19.455959 12.878906 18.292969 L 3 8.4140625 z " transform="translate(0,289.0625)" id="rect4592"/></g></svg>`,
  home: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.7166 3.79541C12.2835 3.49716 11.7165 3.49716 11.2834 3.79541L4.14336 8.7121C3.81027 8.94146 3.60747 9.31108 3.59247 9.70797C3.54064 11.0799 3.4857 13.4824 3.63658 15.1877C3.7504 16.4742 4.05336 18.1747 4.29944 19.4256C4.41371 20.0066 4.91937 20.4284 5.52037 20.4284H8.84433C8.98594 20.4284 9.10074 20.3111 9.10074 20.1665V15.9754C9.10074 14.9627 9.90433 14.1417 10.8956 14.1417H13.4091C14.4004 14.1417 15.204 14.9627 15.204 15.9754V20.1665C15.204 20.3111 15.3188 20.4284 15.4604 20.4284H18.4796C19.0806 20.4284 19.5863 20.0066 19.7006 19.4256C19.9466 18.1747 20.2496 16.4742 20.3634 15.1877C20.5143 13.4824 20.4594 11.0799 20.4075 9.70797C20.3925 9.31108 20.1897 8.94146 19.8566 8.7121L12.7166 3.79541ZM10.4235 2.49217C11.3764 1.83602 12.6236 1.83602 13.5765 2.49217L20.7165 7.40886C21.4457 7.91098 21.9104 8.73651 21.9448 9.64736C21.9966 11.0178 22.0564 13.5119 21.8956 15.3292C21.7738 16.7067 21.4561 18.4786 21.2089 19.7353C20.9461 21.0711 19.7924 22.0001 18.4796 22.0001H15.4604C14.4691 22.0001 13.6655 21.1791 13.6655 20.1665V15.9754C13.6655 15.8307 13.5507 15.7134 13.4091 15.7134H10.8956C10.754 15.7134 10.6392 15.8307 10.6392 15.9754V20.1665C10.6392 21.1791 9.83561 22.0001 8.84433 22.0001H5.52037C4.20761 22.0001 3.05389 21.0711 2.79113 19.7353C2.54392 18.4786 2.22624 16.7067 2.10437 15.3292C1.94358 13.5119 2.00338 11.0178 2.05515 9.64736C2.08957 8.73652 2.55427 7.91098 3.28346 7.40886L10.4235 2.49217Z"/></svg>`
}
const CSV_FIELDS = ["date", "title", "permalink", "groups", "wordCount", "minutes"]
const unCamelCase = str => str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, match => match.toUpperCase())

class ScrollFileSystem extends TreeFileSystem {
  getScrollFile(filePath) {
    return this._getParsedFile(filePath, ScrollFile)
  }

  productCache = {}
  writeProduct(absolutePath, content) {
    this.productCache[absolutePath] = content
    return this.write(absolutePath, content)
  }

  parsedFiles = {} // Files parsed by a Tree Language Root Parser
  _getParsedFile(absolutePath, parser) {
    if (this.parsedFiles[absolutePath]) return this.parsedFiles[absolutePath]
    this.parsedFiles[absolutePath] = new parser(undefined, absolutePath, this)
    return this.parsedFiles[absolutePath]
  }

  folderCache = {}
  getScrollFilesInFolder(folderPath) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    if (this.folderCache[folderPath]) return this.folderCache[folderPath]
    const files = this.list(folderPath)
      .filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
      .map(filePath => this.getScrollFile(filePath))

    const sorted = lodash.sortBy(files, file => file.timestamp).reverse()
    sorted.forEach((file, index) => (file.timeIndex = index))
    this.folderCache[folderPath] = sorted
    return this.folderCache[folderPath]
  }
}

const removeBlanks = data => data.map(obj => Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== "")))
const escapeCommas = str => (typeof str === "string" && str.includes(",") ? `"${str}"` : str)
const defaultScrollParser = new TreeFileSystem().getParser(Disk.getFiles(path.join(__dirname, "parsers")).filter(file => file.endsWith(PARSERS_FILE_EXTENSION)))
const DefaultScrollParser = defaultScrollParser.parser // todo: remove?

// todo: groups is currently matching partial substrings
const getGroup = (groupName, files) => files.filter(file => file.buildsHtml && file.groups.includes(groupName))

const measureCache = new Map()
const parseMeasures = parser => {
  if (measureCache.get(parser)) return measureCache.get(parser)
  // Generate a fake program with one of every of the available parsers. Then parse it. Then we can easily access the meta data on the parsers
  const dummyProgram = new parser(
    parser.cachedHandParsersProgramRoot // is there a better method name than this?
      .filter(node => node.getLine().endsWith("Parser"))
      .map(node => node.get("crux") || node.getLine())
      .map(line => line.replace("Parser", ""))
      .join("\n")
  )
  // Delete any nodes that are not measures
  dummyProgram.filter(node => !node.isMeasure).forEach(node => node.destroy())
  dummyProgram.forEach(node => {
    // add nested measures
    Object.keys(node.definition.firstWordMapWithDefinitions).forEach(key => node.appendLine(key))
  })
  // Delete any nested nodes that are not measures
  dummyProgram.topDownArray.filter(node => !node.isMeasure).forEach(node => node.destroy())

  const measures = dummyProgram.topDownArray.map(node => {
    return {
      Name: node.measureName,
      Values: 0,
      Coverage: 0,
      Question: node.definition.description,
      Example: "",
      Type: "",
      Source: node.sourceDomain,
      //Definition: parsedProgram.root.file.filename + ":" + node.lineNumber
      SortIndex: node.sortIndex,
      IsComputed: node.isComputed,
      IsRequired: node.isMeasureRequired,
      IsConceptDelimiter: node.isConceptDelimiter,
      Crux: node.definition.get("crux")
    }
  })
  measureCache.set(parser, lodash.sortBy(measures, "SortIndex"))
  return measureCache.get(parser)
}

const getConcepts = parsed => {
  const concepts = []
  let currentConcept
  parsed.forEach(node => {
    if (node.isConceptDelimiter) {
      if (currentConcept) concepts.push(currentConcept)
      currentConcept = []
    }
    if (currentConcept && node.isMeasure) currentConcept.push(node)
  })
  if (currentConcept) concepts.push(currentConcept)
  return concepts
}

const addMeasureStats = (concepts, measures) => {
  return measures.map(measure => {
    let Type = false
    concepts.forEach(concept => {
      const value = concept[measure.Name]
      if (value === undefined || value === "") return
      measure.Values++

      if (!Type) {
        measure.Example = value.toString().replace(/\n/g, " ")
        measure.Type = typeof value
        Type = true
      }
    })
    measure.Coverage = Math.floor((100 * measure.Values) / concepts.length) + "%"
    return measure
  })
}

// note that this is currently global, assuming there wont be
// name conflicts in computed measures in a single scroll
const measureFnCache = {}
const computeMeasure = (parsedProgram, measureName, concept, concepts) => {
  if (!measureFnCache[measureName]) {
    // a bit hacky but works??
    const node = parsedProgram.appendLine(measureName)
    measureFnCache[measureName] = node.computeValue
    node.destroy()
  }
  return measureFnCache[measureName](concept, measureName, parsedProgram, concepts)
}

const parseConcepts = (parsedProgram, measures) => {
  // Todo: might be a perf/memory/simplicity win to have a "segment" method in ScrollSDK, where you could
  // virtually split a ScrollNode into multiple segments, and then query on those segments.
  // So we would "segment" on "id ", and then not need to create a bunch of new objects, and the original
  // already parsed lines could then learn about/access to their respective segments.
  const conceptDelimiter = measures.filter(measure => measure.IsConceptDelimiter)[0]
  if (!conceptDelimiter) return []
  const concepts = parsedProgram.split(conceptDelimiter.Crux || conceptDelimiter.Name)
  concepts.shift() // Remove the part before "id"
  return concepts.map(concept => {
    const row = {}
    measures.forEach(measure => {
      const measureName = measure.Name
      const measureKey = measure.Crux || measureName.replace(/_/g, " ")
      if (!measure.IsComputed) row[measureName] = concept.getNode(measureKey)?.measureValue ?? ""
      else row[measureName] = computeMeasure(parsedProgram, measureName, concept, concepts)
    })
    return row
  })
}

const arrayToCSV = (data, delimiter = ",") => {
  if (!data.length) return ""

  // Extract headers
  const headers = Object.keys(data[0])
  const csv = data.map(row =>
    headers
      .map(fieldName => {
        const fieldValue = row[fieldName]
        // Escape commas if the value is a string
        if (typeof fieldValue === "string" && fieldValue.includes(delimiter)) {
          return `"${fieldValue.replace(/"/g, '""')}"` // Escape double quotes and wrap in double quotes
        }
        return fieldValue
      })
      .join(delimiter)
  )
  csv.unshift(headers.join(delimiter)) // Add header row at the top
  return csv.join("\n")
}

class ScrollFile {
  constructor(originalScrollCode, absoluteFilePath = "", fileSystem = new ScrollFileSystem({})) {
    this.fileSystem = fileSystem
    if (originalScrollCode === undefined) originalScrollCode = absoluteFilePath ? fileSystem.read(absoluteFilePath) : ""

    this.filePath = absoluteFilePath
    this.filename = path.basename(this.filePath)
    this.folderPath = path.dirname(absoluteFilePath) + "/"

    // PASS 1: READ FULL FILE
    this.originalScrollCode = originalScrollCode

    // PASS 2: READ AND REPLACE IMPORTs
    let afterImportPass = originalScrollCode
    let parser = DefaultScrollParser
    if (absoluteFilePath) {
      const assembledFile = fileSystem.assembleFile(absoluteFilePath, defaultScrollParser.parsersCode)
      this.importOnly = assembledFile.isImportOnly
      afterImportPass = assembledFile.afterImportPass
      if (assembledFile.parser) parser = assembledFile.parser
    }

    // PASS 3: READ AND REPLACE VARIABLES. PARSE AND REMOVE VARIABLE DEFINITIONS THEN REPLACE REFERENCES.
    const afterVariablePass = this.evalVariables(afterImportPass, originalScrollCode, this.filePath)

    // PASS 4: READ WITH STD COMPILER OR CUSTOM COMPILER.
    this.afterVariablePass = afterVariablePass
    this.parser = parser
    this.scrollProgram = new parser(afterVariablePass)

    this.scrollProgram.setFile(this)
    this.timestamp = dayjs(this.scrollProgram.get(scrollKeywords.date) ?? fileSystem.getCTime(absoluteFilePath) ?? 0).unix()
    this.permalink = this.scrollProgram.get(scrollKeywords.permalink) || (this.filename ? this.filename.replace(SCROLL_FILE_EXTENSION, "") + ".html" : "")
  }

  formatAndSave() {
    const { originalScrollCode, formatted } = this

    if (originalScrollCode === formatted) return false
    this.fileSystem.write(this.filePath, formatted)
    return true
  }

  get absoluteLink() {
    return this.ensureAbsoluteLink(this.permalink)
  }

  getFileFromId(id) {
    return this.fileSystem.getScrollFile(path.join(this.folderPath, id + ".scroll"))
  }

  get allScrollFiles() {
    return this.fileSystem.getScrollFilesInFolder(this.folderPath)
  }

  toSearchTsvRow(relativePath = "") {
    const text = this.asTxt.replace(/(\t|\n)/g, " ").replace(/</g, "&lt;")
    return [this.title, relativePath + this.permalink, text, this.date, this.wordCount, this.minutes].join("\t")
  }

  // todo: clean up this naming pattern and add a parser instead of special casing 404.html
  get allHtmlFiles() {
    return this.allScrollFiles.filter(file => file.buildsHtml && file.permalink !== "404.html")
  }

  get buildsHtml() {
    const { permalink } = this
    return !this.importOnly && (permalink.endsWith(".html") || permalink.endsWith(".htm"))
  }

  _concepts
  get concepts() {
    if (this._concepts) return this._concepts
    this._concepts = parseConcepts(this.scrollProgram, this.measures)
    return this._concepts
  }

  _measures
  get measures() {
    if (this._measures) return this._measures
    this._measures = parseMeasures(this.parser)
    return this._measures
  }

  get tables() {
    return this.scrollProgram.filter(node => node.isTabularData && node.isFirst)
  }

  _formatConcepts(parsed) {
    const concepts = getConcepts(parsed)
    if (!concepts.length) return false

    // does a destructive sort in place on the parsed program
    concepts.forEach(concept => {
      let currentSection
      const newCode = lodash
        .sortBy(concept, ["sortIndex"])
        .map(node => {
          let newLines = ""
          const section = node.sortIndex.toString().split(".")[0]
          if (section !== currentSection) {
            currentSection = section
            newLines = "\n"
          }
          return newLines + node.toString()
        })
        .join("\n")

      concept.forEach((node, index) => (index ? node.destroy() : ""))
      concept[0].replaceNode(() => newCode)
    })
  }

  get formatted() {
    // Todo: think this through and create the best long term strategy. Perhaps sortIndex float is a universal property on Parsers.
    /* Current layout:
[importOnly?]
[topMatter*]

[measurements*]
[content*] */

    let formatted = this.originalScrollCode
    const parsed = new this.parser(formatted)
    let topMatter = []
    let importOnly = ""
    parsed
      .filter(node => node.isTopMatter)
      .forEach(node => {
        if (node.getLine() === scrollKeywords.importOnly) {
          importOnly = node.toString() + "\n" // Put importOnly first, if present
          return node.destroy()
        }
        topMatter.push(node.toString())
        node.destroy()
      })

    this._formatConcepts(parsed)
    let topMatterThenContent = importOnly + topMatter.sort().join("\n").trim() + "\n\n" + parsed.toString().trim()

    return (
      topMatterThenContent
        .trim() // Remove leading whitespace
        .replace(/(\S.*?)[  \t]*$/gm, "$1") // Trim trailing whitespace, except for lines that are *all* whitespace (in which case the whitespace may be semantic scroll notation)
        .replace(/\n\n\n+/g, "\n\n") // Maximum 2 newlines in a row
        .replace(/\n+$/, "") + "\n"
    ) // End Scroll files in a newline character POSIX style for better working with tools like git
  }

  _compileArray(filename, arr) {
    const parts = filename.split(".")
    const format = parts.pop()
    if (format === "json") return JSON.stringify(removeBlanks(arr), null, 2)
    if (format === "js") return `const ${parts[0]} = ` + JSON.stringify(removeBlanks(arr), null, 2)
    if (format === "csv") return arrayToCSV(arr)
    if (format === "tsv") return arrayToCSV(arr, "\t")
    if (format === "tree") return tree.toString()
    return tree.toString()
  }

  makeOrderByArr(str) {
    const part1 = str.split(" ")
    const part2 = part1.map(col => (col.startsWith("-") ? "desc" : "asc"))
    return [part1.map(col => col.replace(/^\-/, "")), part2]
  }

  compileConcepts(filename = "csv", sortBy = "") {
    if (!sortBy) return this._compileArray(filename, this.concepts)
    const orderBy = this.makeOrderByArr(sortBy)
    return this._compileArray(filename, lodash.orderBy(this.concepts, orderBy[0], orderBy[1]))
  }

  compileMeasures(filename = "csv", sortBy = "") {
    const withStats = addMeasureStats(this.concepts, this.measures)
    if (!sortBy) return this._compileArray(filename, withStats)
    const orderBy = this.makeOrderByArr(sortBy)
    return this._compileArray(filename, lodash.orderBy(withStats, orderBy[0], orderBy[1]))
  }

  evalVariables(code, originalScrollCode, absolutePath) {
    // note: the 2 variables above are not used in this method, but may be used in user eval code. (todo: cleanup)
    const regex = /^replace/gm
    if (!regex.test(code)) return code
    const tree = new TreeNode(code) // todo: this can be faster. a more lightweight tree class?
    // Process variables
    const varMap = {}
    tree
      .filter(node => {
        const parserWord = node.firstWord
        return parserWord === scrollKeywords.replace || parserWord === scrollKeywords.replaceJs || parserWord === scrollKeywords.replaceNodejs
      })
      .forEach(node => {
        let value = node.length ? node.childrenToString() : node.getWordsFrom(2).join(" ")
        const kind = node.firstWord
        if (kind === scrollKeywords.replaceJs) value = eval(value)
        if (kind === scrollKeywords.replaceNodejs) {
          const tempPath = this.filePath + ".js"
          if (Disk.exists(tempPath)) throw new Error(`Failed to write/require replaceNodejs snippet since '${tempPath}' already exists.`)
          try {
            Disk.write(tempPath, value)
            const results = require(tempPath)
            Object.keys(results).forEach(key => (varMap[key] = results[key]))
          } catch (err) {
            console.error(err)
          } finally {
            Disk.rm(tempPath)
          }
        } else varMap[node.getWord(1)] = value
        node.destroy() // Destroy definitions after eval
      })

    const keys = Object.keys(varMap)
    if (!keys.length) return code

    let codeAfterVariableSubstitution = tree.asString
    // Todo: speed up. build a template?
    Object.keys(varMap).forEach(key => (codeAfterVariableSubstitution = codeAfterVariableSubstitution.replace(new RegExp(key, "g"), varMap[key])))

    return codeAfterVariableSubstitution
  }

  get mtimeMs() {
    return this.fileSystem.getMTime(this.filePath)
  }

  SVGS = SVGS
  SCROLL_VERSION = SCROLL_VERSION
  importOnly = false
  filePath = ""

  compileStumpCode(code) {
    return new stumpParser(code).compile()
  }

  log(message) {}

  get git() {
    return this.get(scrollKeywords.git)
  }

  get email() {
    return this.get(scrollKeywords.email)
  }

  get downloadUrl() {
    return this.get(scrollKeywords.downloadUrl)
  }

  get date() {
    const date = this.get(scrollKeywords.date) || this.timestamp * 1000 || 0
    return dayjs(date).format(`MM/DD/YYYY`)
  }

  get year() {
    return dayjs(this.date).format(`YYYY`)
  }

  get wordCount() {
    return this.asTxt.match(/\b\w+\b/g).length
  }

  get minutes() {
    return (this.wordCount / 200).toFixed(1)
  }

  get hasKeyboardNav() {
    return this.scrollProgram.has(scrollKeywords.keyboardNav)
  }

  // Get the line number that the snippet should stop at.
  get endSnippetIndex() {
    // First if its hard coded, use that
    if (this.scrollProgram.has(scrollKeywords.endSnippet)) return this.scrollProgram.getNode(scrollKeywords.endSnippet).getIndex()
    // Next look for a dinkus
    const snippetBreak = this.scrollProgram.find(node => node.isDinkus)
    if (snippetBreak) return snippetBreak.getIndex()
    return -1
  }

  timeIndex = 0

  _nextAndPrevious(arr, index) {
    const nextIndex = index + 1
    const previousIndex = index - 1
    return {
      previous: arr[previousIndex] ?? arr[arr.length - 1],
      next: arr[nextIndex] ?? arr[0]
    }
  }

  // keyboard nav is always in the same folder. does not currently support cross folder
  isInKeyboardNavGroup(file) {
    return file.buildsHtml && file.hasKeyboardNav && file.groups.includes(this.primaryGroupName)
  }

  get linkToPrevious() {
    if (!this.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).previous
    while (!this.isInKeyboardNavGroup(file)) {
      file = this._nextAndPrevious(this.allScrollFiles, file.timeIndex).previous
    }
    return file.permalink
  }

  get linkToNext() {
    if (!this.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).next
    while (!this.isInKeyboardNavGroup(file)) {
      file = this._nextAndPrevious(this.allScrollFiles, file.timeIndex).next
    }
    return file.permalink
  }

  get canonicalUrl() {
    return this.get(scrollKeywords.canonicalUrl) || this.baseUrl + this.permalink
  }

  ensureAbsoluteLink(link) {
    if (link.includes("://")) return link
    return this.baseUrl + link.replace(/^\//, "")
  }

  get openGraphImage() {
    const openGraphImage = this.get(scrollKeywords.openGraphImage)
    if (openGraphImage !== undefined) return this.ensureAbsoluteLink(openGraphImage)

    const images = this.scrollProgram.findNodes(scrollKeywords.image)

    const hit = images.find(node => node.has(scrollKeywords.openGraph)) || this.scrollProgram.getNode(scrollKeywords.image)

    if (!hit) return ""

    return this.ensureAbsoluteLink(hit.content)
  }

  // todo: add an openGraph node type to define this stuff manually
  // Use the first paragraph for the description
  // todo: add a tree method version of get that gets you the first node. (actulaly make get return array?)
  // would speed up a lot.
  get description() {
    const program = this.scrollProgram
    const description = program.get(scrollKeywords.description)
    if (description) return description

    for (let node of program.getTopDownArrayIterator()) {
      if (node.constructor.name !== "printTitleParser" && node.doesExtend("paragraphParser")) return Utils.stripHtml(node.compile()).replace(/\n/g, " ").replace(/\"/g, "'").substr(0, 300)
    }
    return ""
  }

  get title() {
    const title = this.scrollProgram.get(scrollKeywords.title)
    if (title) return title
    else if (this.filename) return unCamelCase(this.filename.replace(SCROLL_FILE_EXTENSION, ""))
    return ""
  }

  get(parserWord) {
    return this.scrollProgram.get(parserWord)
  }

  has(parserWord) {
    return this.scrollProgram.has(parserWord)
  }

  get viewSourceUrl() {
    const viewSourceUrl = this.get(scrollKeywords.viewSourceUrl)
    if (viewSourceUrl) return viewSourceUrl

    const filename = path.basename(this.filePath)

    const viewSourceBaseUrl = this.get(scrollKeywords.viewSourceBaseUrl)
    return viewSourceBaseUrl ? viewSourceBaseUrl.replace(/\/$/, "") + "/" + filename : filename
  }

  get groups() {
    return this.scrollProgram.get(scrollKeywords.groups) || ""
  }

  get primaryGroupName() {
    return this.groups.split(" ")[0]
  }

  get primaryGroup() {
    return getGroup(this.primaryGroupName, this.allScrollFiles)
  }

  getFilesInGroupsForEmbedding(groupNames, limit) {
    if (!groupNames || !groupNames.length)
      return this.allHtmlFiles
        .filter(file => file !== this) // avoid infinite loops. todo: think this through better.
        .map(file => {
          return { file, relativePath: "" }
        })
        .slice(0, limit)
    let arr = []
    groupNames.forEach(name => {
      if (!name.includes("/"))
        return (arr = arr.concat(
          getGroup(name, this.allScrollFiles)
            .map(file => {
              return { file, relativePath: "" }
            })
            .slice(0, limit)
        ))
      const parts = name.split("/")
      const group = parts.pop()
      const relativePath = parts.join("/")
      const folderPath = path.join(this.folderPath, path.normalize(relativePath))
      const files = this.fileSystem.getScrollFilesInFolder(folderPath)
      const filtered = getGroup(group, files).map(file => {
        return { file, relativePath: relativePath + "/" }
      })

      arr = arr.concat(filtered.slice(0, limit))
    })

    return lodash.sortBy(arr, file => file.file.timestamp).reverse()
  }

  get viewSourceHtml() {
    return this.compileStumpCode(`p
 class scrollViewSource
 a View source
  href ${this.viewSourceUrl}`)
  }

  _compiledHtml = ""
  get asHtml() {
    if (!this._compiledHtml) {
      const { permalink, buildsHtml } = this
      const content = this.scrollProgram.compile().trim()
      // Don't add html tags to CSV feeds. A little hacky as calling a getter named _html_ to get _xml_ is not ideal. But
      // <1% of use case so might be good enough.
      const wrapWithHtmlTags = buildsHtml
      const bodyTag = this.scrollProgram.has("metaTags") ? "" : "<body>\n"
      this._compiledHtml = wrapWithHtmlTags ? `<!DOCTYPE html>\n<html lang="${this.lang}">\n${bodyTag}${content}\n</body>\n</html>` : content
    }
    return this._compiledHtml
  }

  get asTxt() {
    return (
      this.scrollProgram
        .map(node => {
          const text = node.compileTxt ? node.compileTxt() : ""
          if (text) return text + "\n"
          if (!node.getLine().length) return "\n"
          return ""
        })
        .join("")
        .replace(/<[^>]*>/g, "")
        .replace(/\n\n\n+/g, "\n\n") // Maximum 2 newlines in a row
        .trim() + "\n" // Always end in a newline, Posix style
    )
  }

  get asJs() {
    return this.scrollProgram.topDownArray
      .filter(node => node.compileJs)
      .map(node => node.compileJs())
      .join("\n")
      .trim()
  }

  get asRss() {
    return this.scrollProgram.compile().trim()
  }

  get asCss() {
    return this.scrollProgram.topDownArray
      .filter(node => node.compileCss)
      .map(node => node.compileCss())
      .join("\n")
      .trim()
  }

  build() {
    this.scrollProgram.forEach(node => (node.build ? node.build() : undefined))
  }

  // Without specifying the language hyphenation will not work.
  get lang() {
    return this.get("htmlLang") || "en"
  }

  // todo: rename publishedUrl? Or something to indicate that this is only for stuff on the web (not localhost)
  // BaseUrl must be provided for RSS Feeds and OpenGraph tags to work
  // maybe wwwBaseUrl?
  get baseUrl() {
    return (this.scrollProgram.get(scrollKeywords.baseUrl) ?? "").replace(/\/$/, "") + "/"
  }

  csvFields = CSV_FIELDS

  toCsv() {
    return CSV_FIELDS.map(field => escapeCommas(this[field]))
  }

  toRss() {
    const { title, canonicalUrl } = this
    return ` <item>
  <title>${title}</title>
  <link>${canonicalUrl}</link>
  <pubDate>${dayjs(this.timestamp * 1000).format("ddd, DD MMM YYYY HH:mm:ss ZZ")}</pubDate>
 </item>`
  }
}

class ScrollCli {
  CommandFnDecoratorSuffix = "Command"

  executeUsersInstructionsFromShell(args = [], userIsPipingInput = process.platform !== "win32" && fs.fstatSync(0).isFIFO()) {
    const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
    const commandName = `${command}${this.CommandFnDecoratorSuffix}`
    if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
    else if (command) this.log(`No command '${command}'. Running help command.`)
    else this.log(`No command provided. Running help command.`)
    return this.helpCommand()
  }

  _runCommandOnPipedStdIn(commandName) {
    let pipedData = ""
    process.stdin.on("readable", function () {
      pipedData += this.read() // todo: what's the lambda way to do this?
    })
    process.stdin.on("end", () => {
      const folders = pipedData
        .trim()
        .split("\n")
        .map(line => line.trim())
        .filter(line => fs.existsSync(line))

      folders.forEach(line => this[commandName](line))

      if (folders.length === 0)
        // Hacky to make sure this at least does something in all environments.
        // process.stdin.isTTY is not quite accurate for pipe detection
        this[commandName](process.cwd())
    })
  }

  silence() {
    this.verbose = false
    return this
  }

  verbose = true

  logIndent = 0
  log(message) {
    const indent = "    ".repeat(this.logIndent)
    if (this.verbose) console.log(indent + message)
    return message
  }

  get _allCommands() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(word => word.endsWith(this.CommandFnDecoratorSuffix))
      .sort()
  }

  async initCommand(cwd) {
    const standardDateFormat = `MM/DD/YYYY`
    const initFolder = {
      ".gitignore": `*.html
*.txt
feed.xml`,
      "header.scroll": `importOnly
import settings.scroll
metaTags
gazetteCss
pageHeader
buildTxt
buildHtml
`,
      "feed.scroll": `buildRss feed.xml

import settings.scroll
printFeed All
`,
      "footer.scroll": `pageFooter
`,
      "settings.scroll": `baseUrl https://scroll.pub/
email feedback@scroll.pub
git https://github.com/breck7/scroll
`,
      "helloWorld.scroll": `${scrollKeywords.date} ${dayjs().format(standardDateFormat)}
groups All
${scrollKeywords.title} Hello world

import header.scroll
printTitle

thinColumns 1

This is my first blog post using Scroll.

endColumns
import footer.scroll
`,
      "index.scroll": `description My thoughts about life and the world.
${scrollKeywords.title} My Blog

import header.scroll
printTitle
printSnippets All

import footer.scroll
`
    }

    this.log(`Initializing scroll in "${cwd}"`)
    Disk.writeObjectToDisk(cwd, initFolder)
    require("child_process").execSync("git init", { cwd })
    return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
  }

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  // Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
  resolvePath(folder = "") {
    return path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder))
  }

  getErrorsInFolder(folder) {
    const fileSystem = new ScrollFileSystem()
    const folderPath = Utils.ensureFolderEndsInSlash(folder)
    fileSystem.getScrollFilesInFolder(folderPath) // Init all parsers
    const parserErrors = fileSystem.parsers.map(parser => parser.getAllErrors().map(err => err.toObject())).flat()

    const scrollErrors = fileSystem
      .getScrollFilesInFolder(folderPath)
      .map(file =>
        file.scrollProgram.getAllErrors().map(err => {
          return { filename: file.filename, ...err.toObject() }
        })
      )
      .flat()

    return { parserErrors, scrollErrors }
  }

  testCommand(cwd) {
    const start = Date.now()
    const folder = this.resolvePath(cwd)
    const { parserErrors, scrollErrors } = this.getErrorsInFolder(folder)

    const seconds = (Date.now() - start) / 1000

    if (parserErrors.length) {
      this.log(``)
      this.log(`❌ ${parserErrors.length} parser errors in "${cwd}"`)
      this.log(new TreeNode(parserErrors).toFormattedTable(200))
      this.log(``)
    }
    if (scrollErrors.length) {
      this.log(``)
      this.log(`❌ ${scrollErrors.length} errors in "${cwd}"`)
      this.log(new TreeNode(scrollErrors).toFormattedTable(100))
      this.log(``)
    }
    if (!parserErrors.length && !scrollErrors.length) return this.log(`✅ 0 errors in "${cwd}". Tests took ${seconds} seconds.`)
    return `${parserErrors.length + scrollErrors.length} Errors`
  }

  formatCommand(cwd) {
    const fileSystem = new ScrollFileSystem()
    const folder = this.resolvePath(cwd)
    fileSystem.getScrollFilesInFolder(folder).forEach(file => (file.formatAndSave() ? this.log(`💾 formatted ${file.filename}`) : ""))
  }

  async buildCommand(cwd) {
    this.buildFilesInFolder(new ScrollFileSystem(), this.resolvePath(cwd))
    return this
  }

  _parserWordsRequiringExternals(parser) {
    // todo: could be cleaned up a bit
    if (!parser.parserWordsRequiringExternals) parser.parserWordsRequiringExternals = parser.cachedHandParsersProgramRoot.filter(node => node.copyFromExternal).map(node => node.getLine().replace("Parser", ""))
    return parser.parserWordsRequiringExternals
  }

  externalFilesCopied = {}
  _copyExternalFiles(file, folder, fileSystem) {
    // If this file uses a parser that has external requirements,
    // copy those from external folder into the destination folder.
    const parserWordsRequiringExternals = this._parserWordsRequiringExternals(file.parser)
    const { externalFilesCopied } = this
    if (!externalFilesCopied[folder]) externalFilesCopied[folder] = {}
    parserWordsRequiringExternals.forEach(word => {
      if (externalFilesCopied[folder][word]) return
      if (file.has(word)) {
        const node = file.scrollProgram.getNode(word)
        const externalFiles = node.copyFromExternal.split(" ")
        externalFiles.forEach(name => {
          const newPath = path.join(folder, name)
          fileSystem.writeProduct(newPath, Disk.read(path.join(__dirname, "external", name)))
          this.log(`💾 Copied external file needed by ${file.filename} to ${name}`)
        })
        externalFilesCopied[folder][word] = true
      }
    })
  }

  _buildConceptsAndMeasures(file, folder, fileSystem) {
    // If this proves useful maybe make slight adjustments to Scroll lang to be more imperative.
    if (!file.has(scrollKeywords.buildConcepts)) return
    const { permalink } = file
    file.scrollProgram.findNodes(scrollKeywords.buildConcepts).forEach(node => {
      const files = node.getWordsFrom(1)
      if (!files.length) files.push(permalink.replace(".html", ".tsv"))
      const sortBy = node.get("sortBy")
      files.forEach(link => {
        fileSystem.writeProduct(path.join(folder, link), file.compileConcepts(link, sortBy))
        this.log(`💾 Built concepts in ${file.filename} to ${link}`)
      })
    })

    if (!file.has(scrollKeywords.buildMeasures)) return
    file.scrollProgram.findNodes(scrollKeywords.buildMeasures).forEach(node => {
      const files = node.getWordsFrom(1)
      if (!files.length) files.push(permalink.replace(".html", ".tsv"))
      const sortBy = node.get("sortBy")
      files.forEach(link => {
        fileSystem.writeProduct(path.join(folder, link), file.compileMeasures(link, sortBy))
        this.log(`💾 Built measures in ${file.filename} to ${link}`)
      })
    })
  }

  _buildFileType(file, folder, fileSystem, extension) {
    const capitalized = lodash.capitalize(extension)
    const buildKeyword = "build" + capitalized
    if (!file.has(buildKeyword)) return
    const { permalink } = file
    const outputFiles = file.get(buildKeyword)?.split(" ") || [""]
    outputFiles.forEach(name => {
      const link = name || permalink.replace(".html", "." + extension)
      fileSystem.writeProduct(path.join(folder, link), file["as" + capitalized])
      this.log(`💾 Built ${link} from ${file.filename}`)
    })
  }

  buildFilesInFolder(fileSystem, folder = "/") {
    folder = Utils.ensureFolderEndsInSlash(folder)
    const start = Date.now()
    const files = fileSystem.getScrollFilesInFolder(folder)
    this.log(`Found ${files.length} scroll files in '${folder}'\n`)
    this.logIndent++
    files
      .filter(file => !file.importOnly)
      .forEach(file => {
        file.build()
        if (file.has(scrollKeywords.buildHtml)) this._copyExternalFiles(file, folder, fileSystem)
        this._buildFileType(file, folder, fileSystem, "html")
        this._buildFileType(file, folder, fileSystem, "rss")
        this._buildFileType(file, folder, fileSystem, "css")
        this._buildFileType(file, folder, fileSystem, "js")
        this._buildFileType(file, folder, fileSystem, "txt")
        this._buildConceptsAndMeasures(file, folder, fileSystem)
      })
    const seconds = (Date.now() - start) / 1000
    this.logIndent--
    this.log(``)
    const outputExtensions = Object.keys(fileSystem.productCache).map(filename => filename.split(".").pop())
    const buildStats = lodash.map(lodash.orderBy(lodash.toPairs(lodash.countBy(outputExtensions)), 1, "desc"), ([extension, count]) => ({ extension, count }))
    this.log(
      `⌛️ Read ${files.length} scroll files and wrote ${Object.keys(fileSystem.productCache).length} files (${buildStats.map(i => i.extension + ":" + i.count).join(" ")}) in ${seconds} seconds. Processed ${lodash.round(
        files.length / seconds
      )} scroll files per second\n`
    )

    return fileSystem.productCache
  }

  listCommand(cwd) {
    return this.findScrollsInDirRecursive(cwd)
  }

  findScrollsInDirRecursive(dir) {
    const folders = {}
    Disk.recursiveReaddirSync(dir, filename => {
      if (!filename.endsWith(SCROLL_FILE_EXTENSION)) return

      const folder = path.dirname(filename)
      if (!folders[folder]) {
        folders[folder] = {
          folder,
          scrollFileCount: 0
        }
        this.log(folder)
      }
      folders[folder].scrollFileCount++
    })

    return folders
  }

  helpCommand() {
    this.log(`\n📜 WELCOME TO SCROLL (v${SCROLL_VERSION})`)
    return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(this.CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
  }
}

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFile, ScrollCli, ScrollFileSystem, DefaultScrollParser }
