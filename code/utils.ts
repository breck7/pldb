const lodash = require("lodash")

const cleanAndRightShift = (str, numSpaces = 1) =>
  str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))

const toCommaList = (arr, conjunction = "and") => {
  if (arr.length === 1) return arr[0]
  let last = arr.pop()
  return arr.join(", ") + ` ${conjunction} ${last}`
}

// Combine 2 trees, and if the second has something the first already has,
// destroy the version from the first
const patchTree = (one, two) => {
  const copy = one.clone()
  two.forEach(node => {
    const hit = copy.getNode(node.getWord(0))
    if (hit) hit.destroy()
  })
  copy.concat(two)
  return copy
}

const ensureDelimiterNotFound = (strings: string[], delimiter: string) => {
  const hit = strings.find(word => word.includes(delimiter))
  if (hit) throw `Delimiter "${delimiter}" found in hit`
}

const linkManyAftertext = (links: string[]) =>
  links.map((link, index) => `${index + 1}.`).join(" ") + // notice the dot is part of the link. a hack to make it more unique for aftertext matching.
  links.map((link, index) => `\n ${link} ${index + 1}.`).join("")

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
    .replace(/[\+ ]/g, "-")
    .replace(/[^a-zA-Z0-9\-\.]/g, "")
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
  async _fetchQueue(methodName = "fetch") {
    if (!this.downloadQueue.length) return

    await this.awaitScheduledTime()

    const nextItem = this.downloadQueue.pop()
    if (!nextItem) return
    await nextItem[methodName]()
    return this._fetchQueue(methodName)
  }

  async awaitScheduledTime() {
    if (!this.msDelayBetweenRequests) return

    if (!this._nextOpenTime) {
      this._nextOpenTime = Date.now() + this.msDelayBetweenRequests
      return
    }

    const awaitTimeInMs = this._nextOpenTime - Date.now()
    if (awaitTimeInMs < 1) {
      this._nextOpenTime = Date.now() + this.msDelayBetweenRequests
      return
    }
    this._nextOpenTime = this._nextOpenTime + this.msDelayBetweenRequests
    await new Promise(r => setTimeout(r, awaitTimeInMs))
  }

  _nextOpenTime = 0
  msDelayBetweenRequests = 0
  maxConcurrent = 10
  downloadQueue: PoliteCrawlerJob[] = []
  randomize = false // Can randomize the queue so dont get stuck on one
  async fetchAll(jobs, methodName = "fetch") {
    this.downloadQueue = this.randomize ? lodash.shuffle(jobs) : jobs
    const threads = lodash
      .range(0, this.maxConcurrent, 1)
      .map(i => this._fetchQueue(methodName))
    await Promise.all(threads)
  }
}

const makePrettyUrlLink = url => `<a href="${url}">${new URL(url).hostname}</a>`

// https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
const isValidEmail = email => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

const _re = new RegExp(
  "(^|[ \t\r\n])((ftp|http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))",
  "g"
)
const getLinks = str => str.match(_re) || []

const lastCommitHashInFolder = (cwd = __dirname) =>
  require("child_process")
    .execSync("git rev-parse HEAD", {
      cwd
    })
    .toString()
    .trim()

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

const getJoined = (node, keywords): string => {
  const words = keywords
    .map(word => node.get(word) || "")
    .filter(i => i)
    .join(" ")
    .split(" ")
  return lodash.uniq(words).join(" ")
}

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

const htmlEscaped = (content: string) => content.replace(/</g, "&lt;")

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

export {
  cleanAndRightShift,
  toCommaList,
  getIndefiniteArticle,
  replaceNode,
  nodeToFlatObject,
  getJoined,
  isLanguage,
  getCleanedId,
  PoliteCrawler,
  linkManyAftertext,
  imemo,
  getLinks,
  lastCommitHashInFolder,
  ensureDelimiterNotFound,
  htmlEscaped,
  isValidEmail,
  patchTree,
  makePrettyUrlLink
}
