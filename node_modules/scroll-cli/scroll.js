#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")

// Particles Includes
const { Particle } = require("scrollsdk/products/Particle.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { ParticleFileSystem } = require("scrollsdk/products/ParticleFileSystem.js")
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
  permalink: "permalink",
  canonicalUrl: "canonicalUrl",
  image: "image",
  date: "date",
  endSnippet: "endSnippet",
  tags: "tags",
  keyboardNav: "keyboardNav",
  replace: "replace",
  replaceJs: "replaceJs",
  replaceNodejs: "replaceNodejs",
  buildConcepts: "buildConcepts",
  buildMeasures: "buildMeasures",
  buildTxt: "buildTxt",
  buildHtml: "buildHtml",
  buildPdf: "buildPdf",
  buildRss: "buildRss",
  import: "import",
  importOnly: "importOnly",
  baseUrl: "baseUrl",
  viewSourceBaseUrl: "viewSourceBaseUrl",
  openGraphImage: "openGraphImage",
  openGraph: "openGraph",
  email: "email",
  rssFeedUrl: "rssFeedUrl"
}
const SVGS = {
  git: `<svg xmlns="http://www.w3.org/2000/svg" width="92pt" height="92pt" viewBox="0 0 92 92"><path d="M90.156 41.965 50.036 1.848a5.913 5.913 0 0 0-8.368 0l-8.332 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.043 7.043 0 0 1 1.673 7.277l10.183 10.184a7.026 7.026 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.045 7.045 0 0 1-9.961 0 7.038 7.038 0 0 1-1.532-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.034 7.034 0 0 1 2.308-1.539V33.926a7.001 7.001 0 0 1-2.308-1.535 7.049 7.049 0 0 1-1.516-7.7L29.242 14.273 1.734 41.777a5.918 5.918 0 0 0 0 8.371L41.855 90.27a5.92 5.92 0 0 0 8.368 0l39.933-39.934a5.925 5.925 0 0 0 0-8.371"/></svg>`
}
const CSV_FIELDS = ["date", "year", "title", "permalink", "authors", "tags", "wordCount", "minutes"]
const unCamelCase = str => str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, match => match.toUpperCase())

const makeLodashOrderByParams = str => {
  const part1 = str.split(" ")
  const part2 = part1.map(col => (col.startsWith("-") ? "desc" : "asc"))
  return [part1.map(col => col.replace(/^\-/, "")), part2]
}

class ScrollFileSystem extends ParticleFileSystem {
  getScrollFile(filePath) {
    return this._getParsedFile(filePath, ScrollFile)
  }

  productCache = {}
  writeProduct(absolutePath, content) {
    this.productCache[absolutePath] = content
    return this.write(absolutePath, content)
  }

  parsedFiles = {}
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
const defaultScrollParser = new ParticleFileSystem().getParser(Disk.getFiles(path.join(__dirname, "parsers")).filter(file => file.endsWith(PARSERS_FILE_EXTENSION)))
const DefaultScrollParser = defaultScrollParser.parser // todo: remove?

// todo: tags is currently matching partial substrings
const getFilesWithTag = (tag, files) => files.filter(file => file.buildsHtml && file.tags.includes(tag))

const measureCache = new Map()
const parseMeasures = parser => {
  if (measureCache.get(parser)) return measureCache.get(parser)
  // Generate a fake program with one of every of the available parsers. Then parse it. Then we can easily access the meta data on the parsers
  const dummyProgram = new parser(
    Array.from(
      new Set(
        parser.cachedHandParsersProgramRoot // is there a better method name than this?
          .filter(particle => particle.getLine().endsWith("Parser") && !particle.getLine().startsWith("abstract"))
          .map(particle => particle.get("crux") || particle.getLine())
          .map(line => line.replace("Parser", ""))
      )
    ).join("\n")
  )
  // Delete any particles that are not measures
  dummyProgram.filter(particle => !particle.isMeasure).forEach(particle => particle.destroy())
  dummyProgram.forEach(particle => {
    // add nested measures
    Object.keys(particle.definition.firstWordMapWithDefinitions).forEach(key => particle.appendLine(key))
  })
  // Delete any nested particles that are not measures
  dummyProgram.topDownArray.filter(particle => !particle.isMeasure).forEach(particle => particle.destroy())
  const measures = dummyProgram.topDownArray.map(particle => {
    return {
      Name: particle.measureName,
      Values: 0,
      Coverage: 0,
      Question: particle.definition.description,
      Example: "",
      Type: particle.typeForWebForms,
      Source: particle.sourceDomain,
      //Definition: parsedProgram.root.file.filename + ":" + particle.lineNumber
      SortIndex: particle.sortIndex,
      IsComputed: particle.isComputed,
      IsRequired: particle.isMeasureRequired,
      IsConceptDelimiter: particle.isConceptDelimiter,
      Crux: particle.definition.get("crux")
    }
  })
  measureCache.set(parser, lodash.sortBy(measures, "SortIndex"))
  return measureCache.get(parser)
}

const getConcepts = parsed => {
  const concepts = []
  let currentConcept
  parsed.forEach(particle => {
    if (particle.isConceptDelimiter) {
      if (currentConcept) concepts.push(currentConcept)
      currentConcept = []
    }
    if (currentConcept && particle.isMeasure) currentConcept.push(particle)
  })
  if (currentConcept) concepts.push(currentConcept)
  return concepts
}

const addMeasureStats = (concepts, measures) =>
  measures.map(measure => {
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

// note that this is currently global, assuming there wont be
// name conflicts in computed measures in a single scroll
const measureFnCache = {}
const computeMeasure = (parsedProgram, measureName, concept, concepts) => {
  if (!measureFnCache[measureName]) {
    // a bit hacky but works??
    const particle = parsedProgram.appendLine(measureName)
    measureFnCache[measureName] = particle.computeValue
    particle.destroy()
  }
  return measureFnCache[measureName](concept, measureName, parsedProgram, concepts)
}

const parseConcepts = (parsedProgram, measures) => {
  // Todo: might be a perf/memory/simplicity win to have a "segment" method in ScrollSDK, where you could
  // virtually split a Particle into multiple segments, and then query on those segments.
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
      if (!measure.IsComputed) row[measureName] = concept.getParticle(measureKey)?.measureValue ?? ""
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
  constructor(codeAtStart, absoluteFilePath = "", fileSystem = new ScrollFileSystem({})) {
    this.fileSystem = fileSystem
    if (codeAtStart === undefined) codeAtStart = absoluteFilePath ? fileSystem.read(absoluteFilePath) : ""

    this.filePath = absoluteFilePath
    this.filename = path.basename(this.filePath)
    this.filenameNoExtension = this.filename.replace(SCROLL_FILE_EXTENSION, "")
    this.folderPath = path.dirname(absoluteFilePath) + "/"

    // PASS 1: READ FULL FILE
    this.codeAtStart = codeAtStart

    // PASS 2: READ AND REPLACE IMPORTs
    let codeAfterImportPass = codeAtStart
    let parser = DefaultScrollParser
    if (absoluteFilePath) {
      const assembledFile = fileSystem.assembleFile(absoluteFilePath, defaultScrollParser.parsersCode)
      this.importOnly = assembledFile.isImportOnly
      codeAfterImportPass = assembledFile.afterImportPass
      if (assembledFile.parser) parser = assembledFile.parser
    }
    this.codeAfterImportPass = codeAfterImportPass

    // PASS 3: READ AND REPLACE MACROS. PARSE AND REMOVE MACROS DEFINITIONS THEN REPLACE REFERENCES.
    const codeAfterMacroPass = this.evalMacros(codeAfterImportPass, codeAtStart, this.filePath)

    // PASS 4: READ WITH STD COMPILER OR CUSTOM COMPILER.
    this.codeAfterMacroPass = codeAfterMacroPass
    this.parser = parser
    this.scrollProgram = new parser(codeAfterMacroPass)

    this.scrollProgram.setFile(this)
    this.timestamp = dayjs(this.scrollProgram.get(scrollKeywords.date) ?? fileSystem.getCTime(absoluteFilePath) ?? 0).unix()
    this.permalink = this.scrollProgram.get(scrollKeywords.permalink) || (this.filename ? this.filenameNoExtension + ".html" : "")
  }

  // todo: speed this up and do a proper release. also could add more metrics like this.
  get lastCommitTime() {
    if (this._lastCommitTime === undefined) {
      try {
        this._lastCommitTime = require("child_process").execSync(`git log -1 --format="%at" -- "${this.filePath}"`).toString().trim()
      } catch (err) {
        this._lastCommitTime = 0
      }
    }
    return this._lastCommitTime
  }

  formatAndSave() {
    const { codeAtStart, formatted } = this

    if (codeAtStart === formatted) return false
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

  get parserIds() {
    return this.scrollProgram.topDownArray.map(particle => particle.definition.id)
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
    return this.scrollProgram.filter(particle => particle.isTabularData && particle.isFirst)
  }

  _formatConcepts(parsed) {
    const concepts = getConcepts(parsed)
    if (!concepts.length) return false

    // does a destructive sort in place on the parsed program
    concepts.forEach(concept => {
      let currentSection
      const newCode = lodash
        .sortBy(concept, ["sortIndex"])
        .map(particle => {
          let newLines = ""
          const section = particle.sortIndex.toString().split(".")[0]
          if (section !== currentSection) {
            currentSection = section
            newLines = "\n"
          }
          return newLines + particle.toString()
        })
        .join("\n")

      concept.forEach((particle, index) => (index ? particle.destroy() : ""))
      concept[0].replaceParticle(() => newCode)
    })
  }

  get formatted() {
    // Todo: think this through and create the best long term strategy. Perhaps sortIndex float is a universal property on Parsers.
    /* Current layout:
[importOnly?]
[topMatter*]

[measurements*]
[content*] */

    let formatted = this.codeAtStart
    const parsed = new this.parser(formatted)
    let topMatter = []
    let importOnly = ""
    parsed
      .filter(particle => particle.isTopMatter)
      .forEach(particle => {
        if (particle.getLine() === scrollKeywords.importOnly) {
          importOnly = particle.toString() + "\n" // Put importOnly first, if present
          return particle.destroy()
        }
        topMatter.push(particle.toString())
        particle.destroy()
      })

    this._formatConcepts(parsed)
    let topMatterThenContent = importOnly + topMatter.sort().join("\n").trim() + "\n\n" + parsed.toString().trim()

    return (
      topMatterThenContent
        .trim() // Remove leading whitespace
        .replace(/(\S.*?)[  \t]*$/gm, "$1") // Trim trailing whitespace, except for lines that are *all* whitespace (in which case the whitespace may be semantic particles)
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
    if (format === "particles") return particles.toString()
    return particles.toString()
  }

  compileConcepts(filename = "csv", sortBy = "") {
    if (!sortBy) return this._compileArray(filename, this.concepts)
    const orderBy = makeLodashOrderByParams(sortBy)
    return this._compileArray(filename, lodash.orderBy(this.concepts, orderBy[0], orderBy[1]))
  }

  _withStats
  get measuresWithStats() {
    if (!this._withStats) this._withStats = addMeasureStats(this.concepts, this.measures)
    return this._withStats
  }

  compileMeasures(filename = "csv", sortBy = "") {
    const withStats = this.measuresWithStats
    if (!sortBy) return this._compileArray(filename, withStats)
    const orderBy = makeLodashOrderByParams(sortBy)
    return this._compileArray(filename, lodash.orderBy(withStats, orderBy[0], orderBy[1]))
  }

  evalMacros(code, codeAtStart, absolutePath) {
    // note: the 2 params above are not used in this method, but may be used in user eval code. (todo: cleanup)
    const regex = /^replace/gm
    if (!regex.test(code)) return code
    const particle = new Particle(code) // todo: this can be faster. a more lightweight particle class?
    // Process macros
    const macroMap = {}
    particle
      .filter(particle => {
        const parserWord = particle.firstWord
        return parserWord === scrollKeywords.replace || parserWord === scrollKeywords.replaceJs || parserWord === scrollKeywords.replaceNodejs
      })
      .forEach(particle => {
        let value = particle.length ? particle.childrenToString() : particle.getWordsFrom(2).join(" ")
        const kind = particle.firstWord
        if (kind === scrollKeywords.replaceJs) value = eval(value)
        if (kind === scrollKeywords.replaceNodejs) {
          const tempPath = this.filePath + ".js"
          if (Disk.exists(tempPath)) throw new Error(`Failed to write/require replaceNodejs snippet since '${tempPath}' already exists.`)
          try {
            Disk.write(tempPath, value)
            const results = require(tempPath)
            Object.keys(results).forEach(key => (macroMap[key] = results[key]))
          } catch (err) {
            console.error(err)
          } finally {
            Disk.rm(tempPath)
          }
        } else macroMap[particle.getWord(1)] = value
        particle.destroy() // Destroy definitions after eval
      })

    const keys = Object.keys(macroMap)
    if (!keys.length) return code

    let codeAfterMacroSubstitution = particle.asString
    // Todo: speed up. build a template?
    Object.keys(macroMap).forEach(key => (codeAfterMacroSubstitution = codeAfterMacroSubstitution.replace(new RegExp(key, "g"), macroMap[key])))

    return codeAfterMacroSubstitution
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
    if (this.scrollProgram.has(scrollKeywords.endSnippet)) return this.scrollProgram.getParticle(scrollKeywords.endSnippet).getIndex()
    // Next look for a dinkus
    const snippetBreak = this.scrollProgram.find(particle => particle.isDinkus)
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
  includeFileInKeyboardNav(file) {
    return file.buildsHtml && file.hasKeyboardNav && file.tags.includes(this.primaryTag)
  }

  get linkToPrevious() {
    if (!this.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).previous
    while (!this.includeFileInKeyboardNav(file)) {
      file = this._nextAndPrevious(this.allScrollFiles, file.timeIndex).previous
    }
    return file.permalink
  }

  get linkToNext() {
    if (!this.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).next
    while (!this.includeFileInKeyboardNav(file)) {
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

    const images = this.scrollProgram.findParticles(scrollKeywords.image)

    const hit = images.find(particle => particle.has(scrollKeywords.openGraph)) || this.scrollProgram.getParticle(scrollKeywords.image)

    if (!hit) return ""

    return this.ensureAbsoluteLink(hit.content)
  }

  // Use the first paragraph for the description
  // todo: add a particle method version of get that gets you the first particle. (actulaly make get return array?)
  // would speed up a lot.
  get description() {
    const program = this.scrollProgram
    const description = program.get(scrollKeywords.description)
    if (description) return description

    for (let particle of program.getTopDownArrayIterator()) {
      if (particle.constructor.name !== "printTitleParser" && particle.doesExtend("paragraphParser")) return Utils.stripHtml(particle.compile()).replace(/\n/g, " ").replace(/\"/g, "'").substr(0, 300)
    }
    return ""
  }

  get title() {
    const title = this.scrollProgram.get(scrollKeywords.title)
    if (title) return title
    else if (this.filename) return unCamelCase(this.filenameNoExtension)
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

    const viewSourceBaseUrl = this.get(scrollKeywords.viewSourceBaseUrl)
    return (viewSourceBaseUrl ? viewSourceBaseUrl.replace(/\/$/, "") + "/" : "") + this.filename
  }

  get gitRepo() {
    // given https://github.com/breck7/breckyunits.com/blob/main/four-tips-to-improve-communication.scroll
    // return https://github.com/breck7/breckyunits.com
    return this.viewSourceUrl.split("/").slice(0, 5).join("/")
  }

  get tags() {
    return this.scrollProgram.get(scrollKeywords.tags) || ""
  }

  get primaryTag() {
    return this.tags.split(" ")[0]
  }

  getFilesWithTagsForEmbedding(tags, limit) {
    if (!tags || !tags.length)
      return this.allHtmlFiles
        .filter(file => file !== this) // avoid infinite loops. todo: think this through better.
        .map(file => {
          return { file, relativePath: "" }
        })
        .slice(0, limit)
    let arr = []
    tags.forEach(name => {
      if (!name.includes("/"))
        return (arr = arr.concat(
          getFilesWithTag(name, this.allScrollFiles)
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
      const filtered = getFilesWithTag(group, files).map(file => {
        return { file, relativePath: relativePath + "/" }
      })

      arr = arr.concat(filtered.slice(0, limit))
    })

    return lodash.sortBy(arr, file => file.file.timestamp).reverse()
  }

  get viewSourceHtml() {
    return this.compileStumpCode(`a View source
 class abstractTextLinkParser
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
        .map(particle => {
          const text = particle.compileTxt ? particle.compileTxt() : ""
          if (text) return text + "\n"
          if (!particle.getLine().length) return "\n"
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
      .filter(particle => particle.compileJs)
      .map(particle => particle.compileJs())
      .join("\n")
      .trim()
  }

  get authors() {
    return this.scrollProgram.get("authors")
  }

  get asRss() {
    return this.scrollProgram.compile().trim()
  }

  get asCss() {
    return this.scrollProgram.topDownArray
      .filter(particle => particle.compileCss)
      .map(particle => particle.compileCss())
      .join("\n")
      .trim()
  }

  get asCsv() {
    return this.scrollProgram.topDownArray
      .filter(particle => particle.compileCsv)
      .map(particle => particle.compileCsv())
      .join("\n")
      .trim()
  }

  async build() {
    await Promise.all(this.scrollProgram.filter(particle => particle.build).map(async particle => particle.build()))
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

const isUserPipingInput = () => {
  if (process.platform === "win32") return false

  // Check if stdin is explicitly set to a TTY
  if (process.stdin.isTTY === true) return false

  return fs.fstatSync(0).isFIFO()
}

class ScrollCli {
  CommandFnDecoratorSuffix = "Command"

  executeUsersInstructionsFromShell(args = [], userIsPipingInput = isUserPipingInput()) {
    const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
    const commandName = `${command}${this.CommandFnDecoratorSuffix}`
    if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
    else if (command) this.log(`No command '${command}'. Running help command.`)
    else this.log(`No command provided. Running help command.`)
    return this.helpCommand()
  }

  _runCommandOnPipedStdIn(commandName) {
    this.log(`Running ${commandName} on piped input`)
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
    // todo: use stamp for this.
    const initFolder = {
      ".gitignore": `*.html
*.txt
feed.xml`,
      "header.scroll": `importOnly
metaTags
buildTxt
buildHtml
gazetteCss
homeButton
leftRightButtons
viewSourceButton
printTitle`,
      "feed.scroll": `buildRss feed.xml
printFeed All`,
      "footer.scroll": `importOnly
viewSourceButton
scrollVersionLink`,
      "helloWorld.scroll": `tags All
import header.scroll

thinColumns
This is my first blog post using Scroll.
endColumns
****
import footer.scroll`,
      "index.scroll": `title My Blog
import header.scroll
printSnippets All
import footer.scroll`
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
      this.log(new Particle(parserErrors).toFormattedTable(200))
      this.log(``)
    }
    if (scrollErrors.length) {
      this.log(``)
      this.log(`❌ ${scrollErrors.length} errors in "${cwd}"`)
      this.log(new Particle(scrollErrors).toFormattedTable(100))
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
    if (!parser.parserWordsRequiringExternals) parser.parserWordsRequiringExternals = parser.cachedHandParsersProgramRoot.filter(particle => particle.copyFromExternal).map(particle => particle.getLine().replace("Parser", ""))
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
        const particle = file.scrollProgram.getParticle(word)
        const externalFiles = particle.copyFromExternal.split(" ")
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
    file.scrollProgram.findParticles(scrollKeywords.buildConcepts).forEach(particle => {
      const files = particle.getWordsFrom(1)
      if (!files.length) files.push(permalink.replace(".html", ".csv"))
      const sortBy = particle.get("sortBy")
      files.forEach(link => {
        fileSystem.writeProduct(path.join(folder, link), file.compileConcepts(link, sortBy))
        this.log(`💾 Built concepts in ${file.filename} to ${link}`)
      })
    })

    if (!file.has(scrollKeywords.buildMeasures)) return
    file.scrollProgram.findParticles(scrollKeywords.buildMeasures).forEach(particle => {
      const files = particle.getWordsFrom(1)
      if (!files.length) files.push(permalink.replace(".html", ".csv"))
      const sortBy = particle.get("sortBy")
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

  buildFiles(fileSystem, files, folder) {
    const start = Date.now()
    this.logIndent++
    // Run the build loop twice. The first time we build ScrollSets, in case some of the HTML files
    // will depend on csv/tsv/json/etc
    files
      .filter(file => !file.importOnly)
      .forEach(file => {
        file.build() // Run any build steps
        this._buildConceptsAndMeasures(file, folder, fileSystem) // todo: call this buildDelimited?
        this._buildFileType(file, folder, fileSystem, "csv")
      })
    files
      .filter(file => !file.importOnly)
      .forEach(file => {
        if (file.has(scrollKeywords.buildHtml)) this._copyExternalFiles(file, folder, fileSystem)
        this._buildFileType(file, folder, fileSystem, "js")
        this._buildFileType(file, folder, fileSystem, "txt")
        this._buildFileType(file, folder, fileSystem, "html")
        this._buildFileType(file, folder, fileSystem, "rss")
        this._buildFileType(file, folder, fileSystem, "css")
        if (file.has(scrollKeywords.buildPdf)) this.buildPdf(file)
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

  buildPdf(file) {
    const outputFile = file.filenameNoExtension + ".pdf"
    // relevant source code for chrome: https://github.com/chromium/chromium/blob/a56ef4a02086c6c09770446733700312c86f7623/components/headless/command_handler/headless_command_switches.cc#L22
    const command = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --headless --disable-gpu --no-pdf-header-footer --default-background-color=00000000 --no-pdf-background --print-to-pdf="${outputFile}" "${file.permalink}"`
    // console.log(`Node.js is running on architecture: ${process.arch}`)
    try {
      const output = require("child_process").execSync(command, { stdio: "ignore" })
      this.log(`💾 Built ${outputFile} from ${file.filename}`)
    } catch (error) {
      console.error(error)
    }
  }

  buildFilesInFolder(fileSystem, folder = "/") {
    folder = Utils.ensureFolderEndsInSlash(folder)
    const files = fileSystem.getScrollFilesInFolder(folder)
    this.log(`Found ${files.length} scroll files in '${folder}'\n`)
    return this.buildFiles(fileSystem, files, folder)
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
