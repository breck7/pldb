const path = require("path")
const lodash = require("lodash")

const { Table } = require("jtree/products/jtable.node.js")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { TreeBaseFolder } = require("jtree/products/treeBase.node.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { Utils } = require("jtree/products/Utils.js")
const { shiftRight, removeReturnChars } = Utils

const { PLDBFile, isLanguage } = require("./File.js")

const databaseFolder = path.join(__dirname, "..", "database")

const nodeToFlatObject = parentNode => {
  const delimiter = "."
  let newObject = {}
  parentNode.forEach((child, index) => {
    newObject[child.getWord(0)] = child.content
    child.getTopDownArray().forEach(node => {
      const key = node
        .getFirstWordPathRelativeTo(parentNode)
        .replace(/ /g, delimiter)
      const value = node.content
      newObject[key] = value
    })
  })
  return newObject
}

const linkManyAftertext = links =>
  links.map((link, index) => `${index + 1}.`).join(" ") + // notice the dot is part of the link. a hack to make it more unique for aftertext matching.
  links.map((link, index) => `\n ${link} ${index + 1}.`).join("")

// One feature maps to one grammar file that extends abstractFeatureNode
class Feature {
  constructor(node, collection) {
    this.node = node
    this.collection = collection
    this.fileName = this.id + ".grammar"
    this.id = node.id.replace("Node", "")
  }

  id = ""
  fileName = ""

  get permalink() {
    return this.id + ".html"
  }

  previous
  next

  node
  collection

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

  get base() {
    return this.collection.base
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
      .map(file => `<a href="../languages/${file.permalink}">${file.title}</a>`)
      .join(", ")}`

    const negatives = this.languagesWithoutThisFeature
    const negativeText = negatives.length
      ? `* Languages *without* ${title} include ${negatives
          .map(
            file => `<a href="../languages/${file.permalink}">${file.title}</a>`
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
          .map(hit => `<a href="../languages/${hit.id}.html">${hit.title}</a>`)
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
 <a class="prevLang" href="${previous.permalink}">&lt;</a>
 <a class="nextLang" href="${next.permalink}">&gt;</a>

viewSourceUrl https://github.com/breck7/pldb/blob/main/database/grammar/${fileName}

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

class FeaturesCollection {
  base
  features
  constructor(base) {
    this.base = base

    const allGrammarNodes = Object.values(
      base
        .nodeAt(0)
        .parsed.getDefinition()
        ._getProgramNodeTypeDefinitionCache()
    )

    this.features = allGrammarNodes
      .filter(node => node.get("extends") === "abstractFeatureNode")
      .map(nodeDef => {
        const feature = new Feature(nodeDef, this)
        if (!feature.title) {
          throw new Error(`Feature ${nodeDef.toString()} has no title.`)
        }
        return feature
      })

    let previous = this.features[this.features.length - 1]
    this.features.forEach((feature, index) => {
      feature.previous = previous
      feature.next = this.features[index + 1]
      previous = feature
    })
    this.features[this.features.length - 1].next = this.features[0]
  }
}

const calcRanks = (folder, files) => {
  const { inboundLinks } = folder
  let objects = files.map(file => {
    const id = file.id
    const object = {}
    object.id = id
    object.jobs = folder.predictNumberOfJobs(file)
    object.users = folder.predictNumberOfUsers(file)
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
    const top3 = [
      obj.jobsRank,
      obj.usersRank,
      obj.factsRank,
      obj.inboundLinksRank
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

class PLDBFolder extends TreeBaseFolder {
  static getBase() {
    return new PLDBFolder()
      .setDir(path.join(databaseFolder, "things"))
      .setGrammarDir(path.join(databaseFolder, "grammar"))
  }

  createParser() {
    return new TreeNode.Parser(PLDBFile)
  }

  get inboundLinks() {
    const inBoundLinks = {}
    this.forEach(file => (inBoundLinks[file.id] = []))

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

  get searchIndex() {
    const map = new Map()
    this.forEach(file => {
      const { id } = file
      file.names.forEach(name => map.set(name.toLowerCase(), id))
    })
    return map
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
    const extensionsMap = new Map()
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

  getFile(id) {
    if (id === undefined) return undefined
    if (id.includes("/")) id = Disk.getFileName(id).replace(".pldb", "")
    return this.getNode(id)
  }

  get topLanguages() {
    return lodash.sortBy(
      this.filter(lang => lang.isLanguage),
      "languageRank"
    )
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
    // Todo: once jtree is cleaned up, we should be able to remove this.
    // the problem is this class does implement FolderInterface, but Typescript doesn't know that
    // because it misses the inherited methods (filter and getChildren).
    return computeRankings(this)
  }

  _getFileAtRank(rank, ranks) {
    const count = Object.keys(ranks).length
    if (rank < 0) rank = count - 1
    if (rank >= count) rank = 0
    return this.getFile(ranks[rank].id)
  }

  _featureCache = {}
  getLanguagesWithFeatureResearched(id) {
    if (!this._featureCache[id])
      this._featureCache[id] = this.topLanguages.filter(file =>
        file.extendedFeaturesNode.has(id)
      )
    return this._featureCache[id]
  }

  get featuresMap() {
    const featuresMap = new Map()
    this.topFeatures.forEach(feature => featuresMap.set(feature.id, feature))
    return featuresMap
  }

  get features() {
    return new FeaturesCollection(this).features
  }

  get topFeatures() {
    const { features } = this
    const sorted = lodash.sortBy(features, "yes")
    sorted.reverse()
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

  makeId(title) {
    let id = Utils.titleToPermalink(title)
    let newId = id
    if (!this.getFile(newId)) return newId

    newId = id + "-lang"
    if (!this.getFile(newId)) return newId

    throw new Error(
      `Already language with id: "${id}". Are you sure this is a new language? Perhaps update the title to something more unique, then update title back`
    )
  }

  createFile(content, id) {
    if (id === undefined) {
      const title = new TreeNode(content).get("title")
      if (!title)
        throw new Error(`A "title" must be provided when creating a new file`)

      id = this.makeId(title)
    }
    Disk.write(this.makeFilePath(id), content)
    return this.appendLineAndChildren(id, content)
  }

  // todo: do this properly upstream in jtree
  rename(oldId, newId) {
    const content = this.getFile(oldId).childrenToString()
    Disk.write(this.makeFilePath(newId), content)
    this.delete(oldId)
    this.filter(file => file.doesLinkTo(oldId)).forEach(file =>
      file.updatePermalinks(oldId, newId)
    )
    this.appendLineAndChildren(newId, content)
  }

  get exampleCounts() {
    const counts = new Map()
    this.forEach(file => counts.set(file.id, file.exampleCount))
    return counts
  }

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

  // todo: is there already a way to do this in jtree?
  getFilePathAndLineNumberWhereGrammarNodeIsDefined(nodeTypeId) {
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

  get grammarFileMap() {
    const map = {}
    this.grammarFilePaths.forEach(
      filepath => (map[filepath] = Disk.read(filepath))
    )
    return map
  }

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
            : `https://github.com/breck7/pldb/blob/main/code/File.ts#:~:text=get%20${Column}()`
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

    const columnSortOrder = `title
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
    columnSortOrder.forEach(colName => {
      const hit = cols.find(col => col.Column === colName)
      sortedCols.push(hit)
    })

    lodash
      .sortBy(cols, "Values")
      .reverse()
      .forEach(col => {
        if (!columnSortOrder.includes(col.Column)) sortedCols.push(col)
      })

    sortedCols.forEach((col, index) => (col.Index = index + 1))

    return sortedCols
  }

  get nodesForCsv() {
    const runTimeProps = `pldbId bookCount paperCount hopl exampleCount numberOfUsers numberOfRepos numberOfJobs languageRank rank factCount lastActivity`.split(
      " "
    )
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

  get typedMapJson() {
    return JSON.stringify(this.typedMap, null, 2)
  }

  get keywordsOneHotCsv() {
    return new TreeNode(this.keywordsOneHot).toCsv()
  }

  get searchIndexJson() {
    return JSON.stringify(
      this.objectsForCsv.map(object => {
        return {
          label: object.title,
          appeared: parseInt(object.appeared),
          id: object.pldbId,
          url: `/languages/${object.pldbId}.html`
        }
      }),
      undefined,
      2
    )
  }

  get objectsForCsv() {
    return lodash.sortBy(this.nodesForCsv.map(nodeToFlatObject), item =>
      parseInt(item.rank)
    )
  }

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

  get bytes() {
    return this.toString().length
  }

  get cachedErrors() {
    return this.errors
  }

  get factCount() {
    return lodash.sum(this.map(file => file.factCount))
  }

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
    rows.forEach(row => {
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
}

module.exports = { PLDBFolder }
