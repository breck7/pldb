const lodash = require("lodash")
const path = require("path")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Disk } = require("jtree/products/Disk.node.js")
const listsFolder = path.join(__dirname, "lists")
const numeral = require("numeral")

const delimiter = `|_$^`
const quickTree = (rows, header) => `table ${delimiter}
 ${new TreeNode(rows).toDelimited(delimiter, header, false).replace(/\n/g, "\n ")}`

const getMostRecentInt = (concept, pathToSet) => {
  let set = concept.getNode(pathToSet)
  if (!set) return 0
  set = set.toObject()
  const key = Math.max(...Object.keys(set).map(year => parseInt(year)))
  return parseInt(set[key])
}

const groupByListValues = (listColumnName, rows, delimiter = " && ") => {
  const values = {}
  rows.forEach(row => {
    const value = row[listColumnName]
    if (!value) return
    value.split(delimiter).forEach(value => {
      if (!values[value]) values[value] = []
      values[value].push(row)
    })
  })
  return values
}

class Tables {
  constructor() {}

  get top1000() {
    return this.toTable(this.top.slice(0, 1000))
  }

  get all() {
    return this.toTable(this.top)
  }

  toTable(data) {
    const header = lodash.keys(data[0]).join("\t")
    const rows = lodash.map(data, row => lodash.values(row).join("\t"))
    const tsv = [header, ...rows].join("\n ")
    return "tabTable\n " + tsv
  }

  _top
  get top() {
    if (this._top) return this._top
    const pldb = require("./pldb.json")
    this._top = lodash
      .chain(pldb)
      .orderBy(["rank"], ["asc"])
      .map(row =>
        lodash.pick(row, [
          "id",
          "rank",
          "appeared",
          "type",
          "creators",
          "numberOfUsersEstimate",
          "numberOfJobsEstimate",
          "measurements"
        ])
      )
      .value()
    return this._top
  }

  get creators() {
    const entities = groupByListValues(
      "creators",
      require("./pldb.json").filter(row => row.isLanguage),
      " and "
    )
    const wikipediaLinks = new TreeNode(Disk.read(path.join(listsFolder, "creators.tree")))

    const rows = Object.keys(entities).map(name => {
      const group = lodash.sortBy(entities[name], "languageRank")
      const person = wikipediaLinks.nodesThatStartWith(name)[0]
      const anchorTag = lodash.camelCase(name)

      return {
        name: !person
          ? `<a name='${anchorTag}' />${name}`
          : `<a name='${anchorTag}' href='https://en.wikipedia.org/wiki/${person.get("wikipedia")}'>${name}</a>`,
        languages: group.map(file => `<a href='../concepts/${file.permalink}'>${file.id}</a>`).join(" - "),
        count: group.length,
        topRank: group[0].languageRank
      }
    })

    return {
      TABLE: quickTree(lodash.sortBy(rows, "topRank"), ["name", "languages", "count", "topRank"]),
      COUNT: numeral(Object.values(entities).length).format("0,0")
    }
  }
}

const computeds = {
  numberOfUsersEstimate(concept) {
    const mostRecents = ["linkedInSkill", "subreddit memberCount", "projectEuler members"]
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
      lodash.sum(mostRecents.map(key => getMostRecentInt(concept, key))) +
        lodash.sum(directs.map(key => parseInt(concept.get(key) || 0))) +
        lodash.sum(
          Object.keys(customs).map(key => {
            const val = concept.get(key)
            return val ? customs[key](val) : 0
          })
        )
    )
  },

  numberOfJobsEstimate(concept) {
    return Math.round(getMostRecentInt(concept, "linkedInSkill") * 0.01) + getMostRecentInt(concept, "indeedJobs")
  },

  exampleCount(concept) {
    return concept.topDownArray.filter(node => node.isExampleCode).length
  },

  score(concept) {},

  measurements(concept) {
    let count = 0
    concept.forEach(node => {
      if (node.isMeasure) count++
    })
    return count
  },

  bookCount(concept) {
    const gr = concept.getNode(`goodreads`)?.length
    const isbndb = concept.getNode(`isbndb`)?.length
    let count = 0
    if (gr) count += gr - 1
    if (isbndb) count += isbndb - 1
    return count
  },

  paperCount(concept) {
    const ss = concept.getNode(`semanticScholar`)?.length
    let count = 0
    if (ss) count += ss - 1
    return count
  },

  hoplId(concept) {
    const id = concept.get("hopl")?.replace("https://hopl.info/showlanguage.prx?exp=", "")
    return id === undefined ? "" : parseInt(id)
  },

  lastActivity(concept) {
    return lodash.max(concept.findAllWordsWithCellType("yearCell").map(word => parseInt(word.word)))
  },

  isLanguage(concept) {
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
    const type = concept.get("type")
    return nonLanguages[type] ? 0 : 1
  },

  rank(concept, computer) {
    return computer.ranks[concept.get("id")].index
  },
  languageRank(concept, computer) {
    return computeds.isLanguage(concept) ? computer.languageRanks[concept.get("id")].index : ""
  }
}

class Computer {
  constructor(scrollFile, concepts) {
    this.concepts = concepts
    this.ranks = calcRanks(concepts, this)
    this.languageRanks = calcRanks(
      concepts.filter(concept => computeds.isLanguage(concept)),
      this
    )
  }

  get(measureName, concept) {
    if (computeds[measureName]) {
      if (!concept[measureName]) concept[measureName] = computeds[measureName](concept, this)
      return concept[measureName]
    }
    return concept.get("appeared")
  }
}

const calcRanks = (concepts, computer) => {
  // const { pageRankLinks } = folder
  let objects = concepts.map(concept => {
    const id = concept.get("id")
    const object = {}
    object.id = id
    object.jobs = computer.get("numberOfJobsEstimate", concept)
    object.users = computer.get("numberOfUsersEstimate", concept)
    object.measurements = computer.get("measurements", concept)
    // object.pageRankLinks = pageRankLinks[id].length
    return object
  })

  objects = rankSort(objects, "jobs")
  objects = rankSort(objects, "users")
  objects = rankSort(objects, "measurements")
  // objects = rankSort(objects, "pageRankLinks")

  objects.forEach((obj, rank) => {
    // Drop the item this does the worst on, as it may be a flaw in PLDB.
    const top3 = [obj.jobsRank, obj.usersRank, obj.measurementsRank]
    obj.totalRank = lodash.sum(lodash.sortBy(top3).slice(0, 3))
  })
  objects = lodash.sortBy(objects, ["totalRank"])

  const ranks = {}
  objects.forEach((obj, index) => {
    obj.index = index + 1
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

module.exports = { Computer, Tables: new Tables() }
