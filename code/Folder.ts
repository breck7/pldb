import { jtree } from "jtree"
import { FeatureFile, FeaturesFolder } from "./FeaturesFolder"
import { PLDBFile, runtimeCsvProps } from "./File"
import {
  FeatureSummary,
  FolderInterface,
  InverseRankings,
  StringMap
} from "./Interfaces"
import { computeRankings } from "./Rankings"
import { nodeToFlatObject, isLanguage, getCleanedId, imemo } from "./utils"

const path = require("path")
const lodash = require("lodash")
const { Table } = require("jtree/products/jtable.node.js")
const { TreeNode } = jtree
const { TreeBaseFolder } = require("jtree/products/treeBase.node.js")
const { Disk } = require("jtree/products/Disk.node.js")

const databaseFolder = path.join(__dirname, "..", "database")

class PLDBFolder extends TreeBaseFolder {
  static getBase(): PLDBFolder {
    return new PLDBFolder()
      .setDir(path.join(databaseFolder, "things"))
      .setGrammarDir(path.join(databaseFolder, "grammar"))
  }

  createParser() {
    return new TreeNode.Parser(PLDBFile)
  }

  _featuresFolder: any
  get featuresFolder() {
    if (!this._featuresFolder)
      this._featuresFolder = FeaturesFolder.getFolder(this)
    return this._featuresFolder
  }

  @imemo
  get inboundLinks(): StringMap {
    const inBoundLinks = {}
    this.forEach(file => {
      inBoundLinks[file.id] = []
    })

    this.forEach(file => {
      file.linksToOtherFiles.forEach(link => {
        if (!inBoundLinks[link])
          throw new Error(
            `Broken permalink in '${file.id}': No language "${link}" found`
          )

        inBoundLinks[link].push(file.id)
      })
    })

    return inBoundLinks
  }

  get grammarDef() {
    const gpc = this.grammarProgramConstructor
    return new gpc().getDefinition()
  }

  @imemo
  get searchIndex(): Map<string, string> {
    const map = new Map()
    this.forEach(file => {
      const { id } = file
      file.names.forEach(name => map.set(name.toLowerCase(), id))
    })
    return map
  }

  searchForEntity(query: string) {
    if (query === undefined || query === "") return
    const { searchIndex } = this
    return (
      searchIndex.get(query) ||
      searchIndex.get(query.toLowerCase()) ||
      searchIndex.get(getCleanedId(query))
    )
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
    if (id === undefined) return undefined
    if (id.includes("/")) id = Disk.getFileName(id).replace(".pldb", "")
    return this.getNode(id)
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

  predictNumberOfJobs(file: PLDBFile) {
    return (
      Math.round(file.getMostRecentInt("linkedInSkill") * 0.01) +
      file.getMostRecentInt("indeedJobs")
    )
  }

  @imemo
  get rankings() {
    // Todo: once jtree is cleaned up, we should be able to remove this.
    // the problem is this class does implement FolderInterface, but Typescript doesn't know that
    // because it misses the inherited methods (filter and getChildren).
    const folder: FolderInterface = <any>this
    return computeRankings(folder)
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
    this.topFeatures.forEach(feature => featuresMap.set(feature.path, feature))
    return featuresMap
  }

  @imemo
  get topFeatures(): FeatureSummary[] {
    const files = this.featuresFolder.map((file: FeatureFile) => {
      const positives = file.languagesWithThisFeature.length
      const negatives = file.languagesWithoutThisFeature.length
      const measurements = positives + negatives
      return {
        feature: file.get("title"),
        featureLink: `../features/${file.permalink}`,
        aka: file.getAll("aka").join(" or "),
        path: file.get("featureKeyword"),
        token: file.get("tokenKeyword"),
        yes: positives,
        no: negatives,
        percentage:
          measurements < 100
            ? "-"
            : lodash.round((100 * positives) / measurements, 0) + "%",
        pseudoExample: (file.get("pseudoExample") || "")
          .replace(/\</g, "&lt;")
          .replace(/\|/g, "&#124;")
      }
    })

    const sorted = lodash.sortBy(files, "yes")
    sorted.reverse()

    return sorted
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
    Disk.write(this.makeFilePath(id), content)
    return this.appendLineAndChildren(id, content)
  }

  get exampleCounts() {
    const counts = new Map<string, number>()
    this.forEach(file => counts.set(file.id, file.exampleCount))
    return counts
  }

  @imemo
  get colNameToGrammarDefMap() {
    const map = new Map()
    this.nodesForCsv.forEach(node => {
      node.getTopDownArray().forEach(node => {
        const path = node.getFirstWordPath().replace(/ /g, ".")
        map.set(path, node.getDefinition())
      })
    })
    return map
  }

  get colNamesForCsv() {
    return this.columnDocumentation.map(col => col.Column)
  }

  // todo: is there already a way to do this in jtree?
  getFilePathAndLineNumberWhereGrammarNodeIsDefined(nodeTypeId: string) {
    const { grammarFileMap } = this
    const regex = new RegExp(`^${nodeTypeId}`, "gm")
    let filePath
    let lineNumber
    Object.keys(grammarFileMap).some(grammarFilePath => {
      const code = grammarFileMap[grammarFilePath]
      if (grammarFileMap[grammarFilePath].match(regex)) {
        filePath = grammarFilePath
        lineNumber = code.split("\n").indexOf(nodeTypeId)
        return true
      }
    })
    return { filePath, lineNumber }
  }

  @imemo
  get grammarFileMap() {
    const map = {}
    this.grammarFilePaths.forEach(filepath => {
      map[filepath] = Disk.read(filepath)
    })
    return map
  }

  @imemo
  get columnDocumentation() {
    // Return columns with documentation sorted in the most interesting order.

    const { colNameToGrammarDefMap, objectsForCsv } = this
    const colNames = new TreeNode(objectsForCsv)
      .toCsv()
      .split("\n")[0]
      .split(",")
      .map(col => {
        return { name: col }
      })
    const table = new Table(objectsForCsv, colNames, undefined, false) // todo: fix jtable or switch off
    const cols = table
      .getColumnsArray()
      .map(col => {
        const reductions = col.getReductions()
        const Column = col.getColumnName()
        const colDef = colNameToGrammarDefMap.get(Column)
        let colDefId
        if (colDef) colDefId = colDef.getLine()
        else colDefId = ""

        const Example = reductions.mode
        const Description =
          colDefId !== "" && colDefId !== "errorNode"
            ? colDef.get("description")
            : "computed"
        let Source
        if (colDef) Source = colDef.getFrom("string sourceDomain")
        else Source = ""

        const sourceLocation = this.getFilePathAndLineNumberWhereGrammarNodeIsDefined(
          colDefId
        )
        const Definition =
          colDefId !== "" && colDefId !== "errorNode"
            ? path.basename(sourceLocation.filePath)
            : "A computed value"
        const DefinitionLink =
          colDefId !== "" && colDefId !== "errorNode"
            ? `https://github.com/breck7/pldb/blob/main/database/grammar/${Definition}#L${sourceLocation.lineNumber +
                1}`
            : ""
        const SourceLink = Source ? `https://${Source}` : ""
        return {
          Column,
          Values: reductions.count,
          Coverage:
            Math.round(
              (100 * reductions.count) /
                (reductions.count + reductions.incompleteCount)
            ) + "%",
          Example,
          Source,
          SourceLink,
          Description,
          Definition,
          DefinitionLink,
          Recommended:
            colDef && colDef.getFrom("boolean alwaysRecommended") === "true"
        }
      })
      .filter(col => col.Values)

    const sortTemplate = `title
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

    const sortedCols = []
    sortTemplate.forEach(colName => {
      const hit = cols.find(col => col.Column === colName)
      sortedCols.push(hit)
    })

    lodash
      .sortBy(cols, "Values")
      .reverse()
      .forEach(col => {
        if (!sortTemplate.includes(col.Column)) sortedCols.push(col)
      })

    sortedCols.forEach((col, index) => (col.Index = index + 1))

    return sortedCols
  }

  @imemo
  get nodesForCsv() {
    const runTimeProps = Object.keys(runtimeCsvProps)
    return this.map(file => {
      const clone = file.parsed.clone()
      clone.getTopDownArray().forEach(node => {
        if (node.includeChildrenInCsv === false) node.deleteChildren()
        if (node.getNodeTypeId() === "blankLineNode") node.destroy()
      })

      runTimeProps.forEach(prop => {
        const value = file[prop]
        if (value !== undefined) clone.set(prop, value.toString())
      })

      return clone
    })
  }

  @imemo
  get objectsForCsv() {
    return lodash.sortBy(this.nodesForCsv.map(nodeToFlatObject), item =>
      parseInt(item.rank)
    )
  }

  @imemo
  get csvBuildOutput() {
    const { colNamesForCsv, objectsForCsv, columnDocumentation } = this

    const pldbCsv = new TreeNode(objectsForCsv).toDelimited(",", colNamesForCsv)

    const langsCsv = new TreeNode(
      objectsForCsv.filter(obj => isLanguage(obj.type))
    ).toDelimited(",", colNamesForCsv)

    const columnsMetadataTree = new TreeNode(columnDocumentation)
    const columnMetadataColumnNames = [
      "Index",
      "Column",
      "Values",
      "Coverage",
      "Example",
      "Description",
      "Source",
      "SourceLink",
      "Definition",
      "DefinitionLink"
    ]

    const columnsCsv = columnsMetadataTree.toDelimited(
      ",",
      columnMetadataColumnNames
    )

    return {
      pldbCsv,
      langsCsv,
      columnsCsv,
      columnsMetadataTree,
      columnMetadataColumnNames,
      colNamesForCsv
    }
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

  get sources() {
    const sources = Array.from(
      new Set(
        this.grammarCode
          .split("\n")
          .filter(line => line.includes("string sourceDomain"))
          .map(line => line.split("string sourceDomain")[1].trim())
      )
    )
    return sources.sort()
  }

  @imemo
  get keywordsOneHot() {
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
    return rows
  }

  @imemo
  get bytes() {
    return this.toString().length
  }

  @imemo
  get cachedErrors() {
    return this.errors
  }

  @imemo
  get factCount() {
    return lodash.sum(this.map(file => file.factCount))
  }

  @imemo
  get keywordsTable() {
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
    rows.forEach((row: any) => {
      row.count = row.ids.length
      row.langs = row.ids
        .map(id => {
          const file = this.getFile(id)
          return `<a href='../languages/${file.permalink}'>${file.title}</a>`
        })
        .join(" ")
      row.frequency =
        Math.round(100 * lodash.round(row.count / langsWithKeywordsCount, 2)) +
        "%"
    })

    return {
      langsWithKeywordsCount,
      rows: lodash.sortBy(rows, "count").reverse()
    }
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

    return program.toString().replace(/\n+$/, "") + "\n" // always end with a newline
  }
}

export { PLDBFolder }
