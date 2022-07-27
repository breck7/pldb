const lodash = require("lodash")
const { jtree } = require("jtree")
const { Utils } = jtree

interface Ranking {
  index: number
  id: string
  totalRank: number
  jobsRank: number
  factsRank: number
  inboundLinksRank: number
  usersRank: number
}

type Rankings = { [firstWord: string]: Ranking }
type InverseRankings = { [firstWord: number]: Ranking }

const cleanAndRightShift = (str, numSpaces = 1) =>
  str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))

const toCommaList = (arr, conjunction = "and") => {
  if (arr.length === 1) return arr[0]
  let last = arr.pop()
  return arr.join(", ") + ` ${conjunction} ${last}`
}

const makeInverseRanks = (ranks: Rankings) => {
  const inverseRanks: InverseRankings = {}
  Object.keys(ranks).forEach(id => {
    inverseRanks[ranks[id].index] = ranks[id]
  })
  return inverseRanks
}

const linkMany = (links: string[]) =>
  links.map((link, index) => `<a href="${link}">${index + 1}</a>`)

const rankSort = (objects: any[], key: string) => {
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

const runCommand = (instance, command = "", param = undefined) => {
  const run = name => {
    console.log(`Running ${name}:`)
    instance[name](param)
  }

  if (instance[command + "Command"]) return run(command + "Command")

  const allCommands = Object.getOwnPropertyNames(
    Object.getPrototypeOf(instance)
  ).filter(word => word.endsWith("Command"))
  allCommands.sort()

  const commandAsNumber = parseInt(command) - 1

  if (
    command.match(/^\d$/) &&
    !isNaN(commandAsNumber) &&
    allCommands[commandAsNumber]
  )
    return run(allCommands[commandAsNumber])

  console.log(
    `\n❌ No command provided. Available commands:\n\n` +
      allCommands
        .map((name, index) => `${index + 1}. ${name.replace("Command", "")}`)
        .join("\n") +
      "\n"
  )
}

const getCleanedId = str =>
  str
    .replace(/[\/\_\:\\\[\]]/g, "-")
    .replace(/π/g, "pi")
    .replace(/`/g, "tick")
    .replace(/\$/g, "dollar-sign")
    .replace(/\*$/g, "-star")
    .replace(/^\*/g, "star-")
    .replace(/\*/g, "-star-")
    .replace(/\'+$/g, "q")
    .replace(/^@/g, "at-")
    .replace(/@$/g, "-at")
    .replace(/@/g, "-at-")
    .replace(/[\'\"\,\ū]/g, "")
    .replace(/^\#/g, "sharp-")
    .replace(/\#$/g, "-sharp")
    .replace(/\#/g, "-sharp-")
    .replace(/[\(\)]/g, "")
    .replace(/\+\+$/g, "pp")
    .replace(/\+$/g, "p")
    .replace(/^\!/g, "bang-")
    .replace(/\!$/g, "-bang")
    .replace(/\!/g, "-bang-")
    .replace(/\&/g, "-n-")
    .replace(/[\+\. ]/g, "-")
    .replace(/[^a-zA-Z0-9\-]/g, "")
    .toLowerCase()

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

interface PoliteCrawlerJob {
  fetch: Function
}

class PoliteCrawler {
  running = 0
  async _fetchQueue() {
    if (!this.downloadQueue.length) return

    await this.downloadQueue.pop().fetch()
    return this._fetchQueue()
  }

  maxConcurrent = 10
  downloadQueue: PoliteCrawlerJob[] = []
  randomize = true // By default randomizes the queue so dont get stuck on one
  async fetchAll(jobs) {
    this.downloadQueue = this.randomize ? lodash.shuffle(jobs) : jobs
    const threads = lodash
      .range(0, this.maxConcurrent, 1)
      .map(i => this._fetchQueue())
    await Promise.all(threads)
  }
}

const _re = new RegExp(
  "(^|[ \t\r\n])((ftp|http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))",
  "g"
)
const getLinks = str => str.match(_re) || []

const getPrimaryKey = node =>
  Utils.getFileName(Utils.removeFileExtension(node.getWord(0)))

const replaceNext = (node, path, newContent) =>
  node
    .find(node => node.getLine().startsWith(path))
    .getNext()
    .replaceNode(str => newContent)

const replaceNode = (node, path, newContent) =>
  node
    .find(node => node.getLine().startsWith(path))
    .replaceNode(str => newContent)

const nodeToFlatObject = parentNode => {
  const delimiter = "."
  let newObject = {}
  parentNode.forEach((child, index) => {
    newObject[child.getWord(0)] = child.getContent()
    child.getTopDownArray().forEach(node => {
      const key = node
        .getFirstWordPathRelativeTo(parentNode)
        .replace(/ /g, delimiter)
      const value = node.getContent()
      newObject[key] = value
    })
  })
  return newObject
}

const toScrollTable = (tree, header) =>
  "pipeTable\n " +
  tree
    .toDelimited("|", header, false)
    .replace(/\n/g, "\n ")
    .trim()

const nameToAnchor = (name: string) => name.replace(/ /g, "_")

const getJoined = (node, keywords): string => {
  const words = keywords
    .map(word => node.get(word) || "")
    .filter(i => i)
    .join(" ")
    .split(" ")
  return lodash.uniq(words).join(" ")
}

const listGetters = instance =>
  Object.entries(
    Object.getOwnPropertyDescriptors(Reflect.getPrototypeOf(instance))
  )
    .filter(e => typeof e[1].get === "function" && e[0] !== "__proto__")
    .map(e => e[0])

// https://github.com/rigoneri/indefinite-article.js/blob/master/indefinite-article.js
const getIndefiniteArticle = phrase => {
  // Getting the first word
  const match = /\w+/.exec(phrase)
  let word
  if (match) word = match[0]
  else return "an"

  var l_word = word.toLowerCase()
  // Specific start of words that should be preceeded by 'an'
  var alt_cases = ["honest", "hour", "hono"]
  for (var i in alt_cases) {
    if (l_word.indexOf(alt_cases[i]) == 0) return "an"
  }

  // Single letter word which should be preceeded by 'an'
  if (l_word.length == 1) {
    if ("aedhilmnorsx".indexOf(l_word) >= 0) return "an"
    else return "a"
  }

  // Capital words which should likely be preceeded by 'an'
  if (
    word.match(
      /(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/
    )
  ) {
    return "an"
  }

  // Special cases where a word that begins with a vowel should be preceeded by 'a'
  const regexes = [
    /^e[uw]/,
    /^onc?e\b/,
    /^uni([^nmd]|mo)/,
    /^u[bcfhjkqrst][aeiou]/
  ]
  for (var i in regexes) {
    if (l_word.match(regexes[i])) return "a"
  }

  // Special capital words (UK, UN)
  if (word.match(/^U[NK][AIEO]/)) {
    return "a"
  } else if (word == word.toUpperCase()) {
    if ("aedhilmnorsx".indexOf(l_word[0]) >= 0) return "an"
    else return "a"
  }

  // Basic method of words that begin with a vowel being preceeded by 'an'
  if ("aeiou".indexOf(l_word[0]) >= 0) return "an"

  // Instances where y follwed by specific letters is preceeded by 'an'
  if (l_word.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)) return "an"

  return "a"
}

let benchmarkResults = ""

const benchmark: MethodDecorator = (
  target: Object,
  prop: PropertyKey,
  descriptor: PropertyDescriptor
): void => {
  const method: Function = descriptor.value
  const meter: any = typeof performance !== "undefined" ? performance : Date

  descriptor.value = function(): any {
    const action: Function = method.apply.bind(method, this, arguments)
    const start = meter.now()
    const result: any = action()
    const elapsed = lodash.round((meter.now() - start) / 1000, 3)
    benchmarkResults += `Time for ${String(prop)}: ${elapsed}s\n`
    return result
  }
}

// Memoization for immutable getters. Run the function once for this instance and cache the result.
const memoKeys = "__memoKeys"
const imemo = <Type>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<Type>
): void => {
  const originalFn = descriptor.get!
  descriptor.get = function(this: Record<string, Type>): Type {
    const propName = `${propertyName}__memoized`
    if (this[propName] === undefined) {
      // Define the prop the long way so we don't enumerate over it
      const value = originalFn.apply(this)
      Object.defineProperty(this, propName, {
        configurable: false,
        enumerable: false,
        writable: true,
        value
      })
      const anyThis = <any>this
      if (!anyThis[memoKeys]) anyThis[memoKeys] = []
      anyThis[memoKeys].push(propName)
    }
    return this[propName]
  }
}

const listMemos = (instance: any) => instance[memoKeys]

const clearMemos = (instance: any) =>
  listMemos(instance).forEach(key => (instance[key] = undefined))

export {
  cleanAndRightShift,
  toCommaList,
  nameToAnchor,
  getIndefiniteArticle,
  replaceNext,
  replaceNode,
  nodeToFlatObject,
  toScrollTable,
  getJoined,
  getPrimaryKey,
  isLanguage,
  getCleanedId,
  runCommand,
  makeInverseRanks,
  PoliteCrawler,
  Rankings,
  Ranking,
  InverseRankings,
  rankSort,
  linkMany,
  benchmark,
  benchmarkResults,
  imemo,
  clearMemos,
  listMemos,
  listGetters,
  getLinks
}
