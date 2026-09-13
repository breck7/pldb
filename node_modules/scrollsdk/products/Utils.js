class Timer {
  constructor() {
    this._tickTime = Date.now() - (Utils.isNodeJs() ? 1000 * process.uptime() : 0)
    this._firstTickTime = this._tickTime
  }
  tick(msg) {
    const elapsed = Date.now() - this._tickTime
    if (msg) console.log(`${elapsed}ms ${msg}`)
    this._tickTime = Date.now()
    return elapsed
  }
  getTotalElapsedTime() {
    return Date.now() - this._firstTickTime
  }
}
class Utils {
  static getFileExtension(filepath = "") {
    const match = filepath.match(/\.([^\.]+)$/)
    return (match && match[1]) || ""
  }
  static ensureFolderEndsInSlash(folder) {
    return folder.replace(/\/$/, "") + "/"
  }
  static runCommand(instance, command = "", param = undefined) {
    const run = name => {
      console.log(`Running ${name}:`)
      instance[name](param)
    }
    if (instance[command + "Command"]) return run(command + "Command")
    // Get commands from both the child and parent classes
    const classes = [Object.getPrototypeOf(instance), Object.getPrototypeOf(Object.getPrototypeOf(instance))]
    const allCommands = classes.map(classInstance => Object.getOwnPropertyNames(classInstance).filter(atom => atom.endsWith("Command"))).flat()
    allCommands.sort()
    const commandAsNumber = parseInt(command) - 1
    if (command.match(/^\d+$/) && allCommands[commandAsNumber]) return run(allCommands[commandAsNumber])
    console.log(`\n❌ No command provided. Available commands:\n\n` + allCommands.map((name, index) => `${index + 1}. ${name.replace("Command", "")}`).join("\n") + "\n")
  }
  static removeReturnChars(str = "") {
    return str.replace(/\r/g, "")
  }
  static isAbsoluteUrl(url) {
    return url.startsWith("https://") || url.startsWith("http://")
  }
  static removeEmptyLines(str = "") {
    return str.replace(/\n\n+/g, "\n")
  }
  static shiftRight(str = "", numSpaces = 1) {
    let spaces = " ".repeat(numSpaces)
    return str.replace(/\n/g, `\n${spaces}`)
  }
  static getLinks(str = "") {
    const _re = new RegExp("(^|[ \t\r\n])((ftp|http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))", "g")
    return str.match(_re) || []
  }
  // Only allow text content and inline styling. Don't allow HTML tags or any nested scroll tags or escape characters.
  static escapeScrollAndHtml(content = "") {
    return content.replace(/</g, "&lt;").replace(/\n/g, "").replace(/\r/g, "").replace(/\\/g, "")
  }
  static colorize(message, colorNameOrString = "red") {
    // ANSI: https://en.wikipedia.org/wiki/ANSI_escape_code
    const colors = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m" }
    const color = colors[colorNameOrString] || colorNameOrString
    const reset = "\x1b[0m"
    return `${color}${message}${reset}`
  }
  static ensureDelimiterNotFound(strings, delimiter) {
    const hit = strings.find(atom => atom.includes(delimiter))
    if (hit) throw `Delimiter "${delimiter}" found in hit`
  }
  // https://github.com/rigoneri/indefinite-article.js/blob/master/indefinite-article.js
  static getIndefiniteArticle(phrase) {
    // Getting the first atom
    const match = /\w+/.exec(phrase)
    let atom
    if (match) atom = match[0]
    else return "an"
    var l_atom = atom.toLowerCase()
    // Specific start of atoms that should be preceded by 'an'
    var alt_cases = ["honest", "hour", "hono"]
    for (var i in alt_cases) {
      if (l_atom.indexOf(alt_cases[i]) == 0) return "an"
    }
    // Single letter atom which should be preceded by 'an'
    if (l_atom.length == 1) {
      if ("aedhilmnorsx".indexOf(l_atom) >= 0) return "an"
      else return "a"
    }
    // Capital atoms which should likely be preceded by 'an'
    if (atom.match(/(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/)) {
      return "an"
    }
    // Special cases where a atom that begins with a vowel should be preceded by 'a'
    const regexes = [/^e[uw]/, /^onc?e\b/, /^uni([^nmd]|mo)/, /^u[bcfhjkqrst][aeiou]/]
    for (var i in regexes) {
      if (l_atom.match(regexes[i])) return "a"
    }
    // Special capital atoms (UK, UN)
    if (atom.match(/^U[NK][AIEO]/)) {
      return "a"
    } else if (atom == atom.toUpperCase()) {
      if ("aedhilmnorsx".indexOf(l_atom[0]) >= 0) return "an"
      else return "a"
    }
    // Basic method of atoms that begin with a vowel being preceded by 'an'
    if ("aeiou".indexOf(l_atom[0]) >= 0) return "an"
    // Instances where y follwed by specific letters is preceded by 'an'
    if (l_atom.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)) return "an"
    return "a"
  }
  static htmlEscaped(content = "") {
    return content.replace(/</g, "&lt;")
  }
  static isValidEmail(email = "") {
    return email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
  }
  static capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  // generate a random alpha numeric hash:
  static getRandomCharacters(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
  static isNodeJs() {
    return typeof exports !== "undefined"
  }
  static findProjectRoot(startingDirName, projectName) {
    const fs = require("fs")
    const getProjectName = dirName => {
      if (!dirName) throw new Error(`dirName undefined when attempting to findProjectRoot for project "${projectName}" starting in "${startingDirName}"`)
      const parts = dirName.split("/")
      const filename = parts.join("/") + "/" + "package.json"
      if (fs.existsSync(filename) && JSON.parse(fs.readFileSync(filename, "utf8")).name === projectName) return parts.join("/") + "/"
      parts.pop()
      return parts
    }
    let result = getProjectName(startingDirName)
    while (typeof result !== "string" && result.length > 0) {
      result = getProjectName(result.join("/"))
    }
    if (result.length === 0) throw new Error(`Project root "${projectName}" in folder ${startingDirName} not found.`)
    return result
  }
  static titleToPermalink(str) {
    return str
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
  }
  static escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }
  static sum(arr) {
    return arr.reduce((curr, next) => curr + next, 0)
  }
  static removeNonAscii(str) {
    // https://stackoverflow.com/questions/20856197/remove-non-ascii-character-in-string
    return str.replace(/[^\x00-\x7F]/g, "")
  }
  static getMethodFromDotPath(context, str) {
    const methodParts = str.split(".")
    while (methodParts.length > 1) {
      const methodName = methodParts.shift()
      if (!context[methodName]) throw new Error(`${methodName} is not a method on ${context}`)
      context = context[methodName]()
    }
    const final = methodParts.shift()
    return [context, final]
  }
  static requireAbsOrRelative(filePath, contextFilePath) {
    if (!filePath.startsWith(".")) return require(filePath)
    const path = require("path")
    const folder = this.getPathWithoutFileName(contextFilePath)
    const file = path.resolve(folder + "/" + filePath)
    return require(file)
  }
  // Removes last ".*" from this string
  static removeFileExtension(filename) {
    return filename ? filename.replace(/\.[^\.]+$/, "") : ""
  }
  static getFileName(path) {
    const normalizedPath = path.replace(/\\/g, "/")
    const parts = normalizedPath.split("/")
    return parts.pop()
  }
  static getPathWithoutFileName(path) {
    const normalizedPath = path.replace(/\\/g, "/")
    const parts = normalizedPath.split("/")
    parts.pop()
    return parts.join("/")
  }
  static shuffleInPlace(arr, seed = Date.now()) {
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    const randFn = Utils._getPseudoRandom0to1FloatGenerator(seed)
    for (let index = arr.length - 1; index > 0; index--) {
      const tempIndex = Math.floor(randFn() * (index + 1))
      ;[arr[index], arr[tempIndex]] = [arr[tempIndex], arr[index]]
    }
    return arr
  }
  // Only allows a-zA-Z0-9-_  (And optionally .)
  static _permalink(str, reg) {
    return str.length ? str.toLowerCase().replace(reg, "").replace(/ /g, "-") : ""
  }
  static isValueEmpty(value) {
    return value === undefined || value === "" || (typeof value === "number" && isNaN(value)) || (value instanceof Date && isNaN(value))
  }
  static stringToPermalink(str) {
    return this._permalink(str, /[^a-z0-9- _\.]/gi)
  }
  static getAvailablePermalink(permalink, doesFileExistSyncFn) {
    const extension = this.getFileExtension(permalink)
    permalink = this.removeFileExtension(permalink)
    const originalPermalink = permalink
    let num = 2
    let suffix = ""
    let filename = `${originalPermalink}${suffix}.${extension}`
    while (doesFileExistSyncFn(filename)) {
      filename = `${originalPermalink}${suffix}.${extension}`
      suffix = "-" + num
      num++
    }
    return filename
  }
  static getNextOrPrevious(arr, item) {
    const length = arr.length
    const index = arr.indexOf(item)
    if (length === 1) return undefined
    if (index === length - 1) return arr[index - 1]
    return arr[index + 1]
  }
  static toggle(currentValue, values) {
    const index = values.indexOf(currentValue)
    return index === -1 || index + 1 === values.length ? values[0] : values[index + 1]
  }
  static getClassNameFromFilePath(filepath) {
    return this.removeFileExtension(this.getFileName(filepath))
  }
  static joinArraysOn(joinOn, arrays, columns) {
    const rows = {}
    let index = 0
    if (!columns) columns = arrays.map(arr => Object.keys(arr[0]))
    arrays.forEach((arr, index) => {
      const cols = columns[index]
      arr.forEach(row => {
        const key = joinOn ? row[joinOn] : index++
        if (!rows[key]) rows[key] = {}
        const obj = rows[key]
        cols.forEach(col => (obj[col] = row[col]))
      })
    })
    return Object.values(rows)
  }
  static getParentFolder(path) {
    if (path.endsWith("/")) path = this._removeLastSlash(path)
    return path.replace(/\/[^\/]*$/, "") + "/"
  }
  static _removeLastSlash(path) {
    return path.replace(/\/$/, "")
  }
  static _listToEnglishText(list, limit = 5) {
    const len = list.length
    if (!len) return ""
    if (len === 1) return `'${list[0]}'`
    const clone = list.slice(0, limit).map(item => `'${item}'`)
    const last = clone.pop()
    if (len <= limit) return clone.join(", ") + ` and ${last}`
    return clone.join(", ") + ` and ${len - limit} more`
  }
  // todo: refactor so instead of str input takes an array of atoms(strings) and scans each indepndently.
  static _chooseDelimiter(str) {
    const del = " ,|\t;^%$!#@~*&+-=_:?.{}[]()<>/".split("").find(idea => !str.includes(idea))
    if (!del) throw new Error("Could not find a delimiter")
    return del
  }
  static flatten(arr) {
    if (arr.flat) return arr.flat()
    return arr.reduce((acc, val) => acc.concat(val), [])
  }
  static escapeBackTicks(str) {
    return str.replace(/\`/g, "\\`").replace(/\$\{/g, "\\${")
  }
  static ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  // Adapted from: https://github.com/dcporter/didyoumean.js/blob/master/didYouMean-1.2.1.js
  static didYouMean(str = "", options = [], caseSensitive = false, threshold = 0.4, thresholdAbsolute = 20) {
    if (!caseSensitive) str = str.toLowerCase()
    // Calculate the initial value (the threshold) if present.
    const thresholdRelative = threshold * str.length
    let maximumEditDistanceToBeBestMatch
    if (thresholdRelative !== null && thresholdAbsolute !== null) maximumEditDistanceToBeBestMatch = Math.min(thresholdRelative, thresholdAbsolute)
    else if (thresholdRelative !== null) maximumEditDistanceToBeBestMatch = thresholdRelative
    else if (thresholdAbsolute !== null) maximumEditDistanceToBeBestMatch = thresholdAbsolute
    // Get the edit distance to each option. If the closest one is less than 40% (by default) of str's length, then return it.
    let closestMatch
    const len = options.length
    for (let optionIndex = 0; optionIndex < len; optionIndex++) {
      const candidate = options[optionIndex]
      if (!candidate) continue
      const editDistance = Utils._getEditDistance(str, caseSensitive ? candidate : candidate.toLowerCase(), maximumEditDistanceToBeBestMatch)
      if (editDistance < maximumEditDistanceToBeBestMatch) {
        maximumEditDistanceToBeBestMatch = editDistance
        closestMatch = candidate
      }
    }
    return closestMatch
  }
  // Adapted from: https://github.com/dcporter/didyoumean.js/blob/master/didYouMean-1.2.1.js
  static _getEditDistance(stringA, stringB, maxInt) {
    // Handle null or undefined max.
    maxInt = maxInt || maxInt === 0 ? maxInt : Utils.MAX_INT
    const aLength = stringA.length
    const bLength = stringB.length
    // Fast path - no A or B.
    if (aLength === 0) return Math.min(maxInt + 1, bLength)
    if (bLength === 0) return Math.min(maxInt + 1, aLength)
    // Fast path - length diff larger than max.
    if (Math.abs(aLength - bLength) > maxInt) return maxInt + 1
    // Slow path.
    const matrix = []
    // Set up the first row ([0, 1, 2, 3, etc]).
    for (let bIndex = 0; bIndex <= bLength; bIndex++) {
      matrix[bIndex] = [bIndex]
    }
    // Set up the first column (same).
    for (let aIndex = 0; aIndex <= aLength; aIndex++) {
      matrix[0][aIndex] = aIndex
    }
    let colMin
    let minJ
    let maxJ
    // Loop over the rest of the columns.
    for (let bIndex = 1; bIndex <= bLength; bIndex++) {
      colMin = Utils.MAX_INT
      minJ = 1
      if (bIndex > maxInt) minJ = bIndex - maxInt
      maxJ = bLength + 1
      if (maxJ > maxInt + bIndex) maxJ = maxInt + bIndex
      // Loop over the rest of the rows.
      for (let aIndex = 1; aIndex <= aLength; aIndex++) {
        // If j is out of bounds, just put a large value in the slot.
        if (aIndex < minJ || aIndex > maxJ) matrix[bIndex][aIndex] = maxInt + 1
        // Otherwise do the normal Levenshtein thing.
        else {
          // If the characters are the same, there's no change in edit distance.
          if (stringB.charAt(bIndex - 1) === stringA.charAt(aIndex - 1)) matrix[bIndex][aIndex] = matrix[bIndex - 1][aIndex - 1]
          // Otherwise, see if we're substituting, inserting or deleting.
          else
            matrix[bIndex][aIndex] = Math.min(
              matrix[bIndex - 1][aIndex - 1] + 1, // Substitute
              Math.min(
                matrix[bIndex][aIndex - 1] + 1, // Insert
                matrix[bIndex - 1][aIndex] + 1
              )
            ) // Delete
        }
        // Either way, update colMin.
        if (matrix[bIndex][aIndex] < colMin) colMin = matrix[bIndex][aIndex]
      }
      // If this column's minimum is greater than the allowed maximum, there's no point
      // in going on with life.
      if (colMin > maxInt) return maxInt + 1
    }
    // If we made it this far without running into the max, then return the final matrix value.
    return matrix[bLength][aLength]
  }
  static getLineIndexAtCharacterPosition(str, index) {
    const lines = str.split("\n")
    const len = lines.length
    let position = 0
    for (let lineNumber = 0; lineNumber < len; lineNumber++) {
      position += lines[lineNumber].length
      if (position >= index) return lineNumber
    }
  }
  static resolvePath(filePath, programFilepath) {
    // For use in Node.js only
    if (!filePath.startsWith(".")) return filePath
    const path = require("path")
    const folder = this.getPathWithoutFileName(programFilepath)
    return path.resolve(folder + "/" + filePath)
  }
  static resolveProperty(obj, path, separator = ".") {
    const properties = Array.isArray(path) ? path : path.split(separator)
    return properties.reduce((prev, curr) => prev && prev[curr], obj)
  }
  static appendCodeAndReturnValueOnWindow(code, name) {
    const script = document.createElement("script")
    script.innerHTML = code
    document.head.appendChild(script)
    return window[name]
  }
  static formatStr(str, catchAllAtomDelimiter = " ", parameterMap) {
    return str.replace(/{([^\}]+)}/g, (match, path) => {
      const val = parameterMap[path]
      if (val === undefined) return ""
      return Array.isArray(val) ? val.join(catchAllAtomDelimiter) : val
    })
  }
  static stripHtml(text) {
    return text && text.replace ? text.replace(/<(?:.|\n)*?>/gm, "") : text
  }
  static getUniqueAtomsArray(allAtoms) {
    const atoms = allAtoms.replace(/\n/g, " ").split(" ")
    const index = {}
    atoms.forEach(atom => {
      if (!index[atom]) index[atom] = 0
      index[atom]++
    })
    return Object.keys(index).map(key => {
      return {
        atom: key,
        count: index[key]
      }
    })
  }
  static getRandomString(length = 30, letters = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), seed = Date.now()) {
    let str = ""
    const randFn = Utils._getPseudoRandom0to1FloatGenerator(seed)
    while (length) {
      str += letters[Math.round(Math.min(randFn() * letters.length, letters.length - 1))]
      length--
    }
    return str
  }
  // todo: add seed!
  static makeRandomParticles(lines = 1000, seed = Date.now()) {
    let str = ""
    let letters = " 123abc".split("")
    const randFn = Utils._getPseudoRandom0to1FloatGenerator(seed)
    while (lines) {
      let indent = " ".repeat(Math.round(randFn() * 6))
      let bit = indent
      let rand = Math.floor(randFn() * 30)
      while (rand) {
        bit += letters[Math.round(Math.min(randFn() * letters.length, letters.length - 1))]
        rand--
      }
      bit += "\n"
      str += bit
      lines--
    }
    return str
  }
  // adapted from https://gist.github.com/blixt/f17b47c62508be59987b
  // 1993 Park-Miller LCG
  static _getPseudoRandom0to1FloatGenerator(seed) {
    return function () {
      seed = Math.imul(48271, seed) | 0 % 2147483647
      return (seed & 2147483647) / 2147483648
    }
  }
  static sampleWithoutReplacement(population = [], quantity, seed) {
    const prng = this._getPseudoRandom0to1FloatGenerator(seed)
    const sampled = {}
    const populationSize = population.length
    if (quantity >= populationSize) return population.slice(0)
    const picked = []
    while (picked.length < quantity) {
      const index = Math.floor(prng() * populationSize)
      if (sampled[index]) continue
      sampled[index] = true
      picked.push(population[index])
    }
    return picked
  }
  static arrayToMap(arr) {
    const map = {}
    arr.forEach(val => (map[val] = true))
    return map
  }
  static _replaceNonAlphaNumericCharactersWithCharCodes(str) {
    return str
      .replace(/[^a-zA-Z0-9]/g, sub => {
        return "_" + sub.charCodeAt(0).toString()
      })
      .replace(/^([0-9])/, "number$1")
  }
  static mapValues(object, fn) {
    const result = {}
    Object.keys(object).forEach(key => {
      result[key] = fn(key)
    })
    return result
  }
  static javascriptTableWithHeaderRowToObjects(dataTable) {
    dataTable = dataTable.slice()
    const header = dataTable.shift()
    return dataTable.map(row => {
      const obj = {}
      header.forEach((colName, index) => (obj[colName] = row[index]))
      return obj
    })
  }
  static interweave(arrayOfArrays) {
    const lineCount = Math.max(...arrayOfArrays.map(arr => arr.length))
    const totalArrays = arrayOfArrays.length
    const result = []
    arrayOfArrays.forEach((lineArray, arrayIndex) => {
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
        result[lineIndex * totalArrays + arrayIndex] = lineArray[lineIndex]
      }
    })
    return result
  }
  static makeSortByFn(accessorOrAccessors) {
    const arrayOfFns = Array.isArray(accessorOrAccessors) ? accessorOrAccessors : [accessorOrAccessors]
    return (objectA, objectB) => {
      const particleAFirst = -1
      const particleBFirst = 1
      const accessor = arrayOfFns[0] // todo: handle accessors
      const av = accessor(objectA)
      const bv = accessor(objectB)
      let result = av < bv ? particleAFirst : av > bv ? particleBFirst : 0
      if (av === undefined && bv !== undefined) result = particleAFirst
      else if (bv === undefined && av !== undefined) result = particleBFirst
      return result
    }
  }
  static _makeGraphSortFunctionFromGraph(idAccessor, graph) {
    return (particleA, particleB) => {
      const particleAFirst = -1
      const particleBFirst = 1
      const particleAUniqueId = idAccessor(particleA)
      const particleBUniqueId = idAccessor(particleB)
      const particleAExtendsParticleB = graph[particleAUniqueId].has(particleBUniqueId)
      const particleBExtendsParticleA = graph[particleBUniqueId].has(particleAUniqueId)
      if (particleAExtendsParticleB) return particleBFirst
      else if (particleBExtendsParticleA) return particleAFirst
      const particleAExtendsSomething = graph[particleAUniqueId].size > 1
      const particleBExtendsSomething = graph[particleBUniqueId].size > 1
      if (!particleAExtendsSomething && particleBExtendsSomething) return particleAFirst
      else if (!particleBExtendsSomething && particleAExtendsSomething) return particleBFirst
      if (particleAUniqueId > particleBUniqueId) return particleBFirst
      else if (particleAUniqueId < particleBUniqueId) return particleAFirst
      return 0
    }
  }
  static removeAll(str, needle) {
    return str.split(needle).join("")
  }
  static _makeGraphSortFunction(idAccessor, extendsIdAccessor) {
    return (particleA, particleB) => {
      // -1 === a before b
      const particleAUniqueId = idAccessor(particleA)
      const particleAExtends = extendsIdAccessor(particleA)
      const particleBUniqueId = idAccessor(particleB)
      const particleBExtends = extendsIdAccessor(particleB)
      const particleAExtendsParticleB = particleAExtends === particleBUniqueId
      const particleBExtendsParticleA = particleBExtends === particleAUniqueId
      const particleAFirst = -1
      const particleBFirst = 1
      if (!particleAExtends && !particleBExtends) {
        // If neither extends, sort by cue
        if (particleAUniqueId > particleBUniqueId) return particleBFirst
        else if (particleAUniqueId < particleBUniqueId) return particleAFirst
        return 0
      }
      // If only one extends, the other comes first
      else if (!particleAExtends) return particleAFirst
      else if (!particleBExtends) return particleBFirst
      // If A extends B, B should come first
      if (particleAExtendsParticleB) return particleBFirst
      else if (particleBExtendsParticleA) return particleAFirst
      // Sort by what they extend
      if (particleAExtends > particleBExtends) return particleBFirst
      else if (particleAExtends < particleBExtends) return particleAFirst
      // Finally sort by cue
      if (particleAUniqueId > particleBUniqueId) return particleBFirst
      else if (particleAUniqueId < particleBUniqueId) return particleAFirst
      // Should never hit this, unless we have a duplicate line.
      return 0
    }
  }
}
Utils.Timer = Timer
//http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links#21925491
Utils.linkify = (text, target = "_blank") => {
  let replacedText
  let replacePattern1
  let replacePattern2
  let replacePattern3
  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z\(\)0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+\(\)&@#\/%=~_|])/gim
  replacedText = text.replace(replacePattern1, `<a href="$1" target="${target}">$1</a>`)
  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim
  replacedText = replacedText.replace(replacePattern2, `$1<a href="http://$2" target="${target}">$2</a>`)
  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>')
  return replacedText
}
// todo: switch algo to: http://indiegamr.com/generate-repeatable-random-numbers-in-js/?
Utils.makeSemiRandomFn = (seed = Date.now()) => {
  return () => {
    const semiRand = Math.sin(seed++) * 10000
    return semiRand - Math.floor(semiRand)
  }
}
Utils.randomUniformInt = (min, max, seed = Date.now()) => {
  return Math.floor(Utils.randomUniformFloat(min, max, seed))
}
Utils.randomUniformFloat = (min, max, seed = Date.now()) => {
  const randFn = Utils.makeSemiRandomFn(seed)
  return min + (max - min) * randFn()
}
Utils.getRange = (startIndex, endIndexExclusive, increment = 1) => {
  const range = []
  for (let index = startIndex; index < endIndexExclusive; index = index + increment) {
    range.push(index)
  }
  return range
}
Utils.MAX_INT = Math.pow(2, 32) - 1
// https://github.com/browserify/path-browserify/blob/master/index.js
function posix_assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError("Path must be a string. Received " + JSON.stringify(path))
  }
}
// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = ""
  var lastSegmentLength = 0
  var lastSlash = -1
  var dots = 0
  var code
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i)
    else if (code === 47 /*/*/) break
    else code = 47 /*/*/
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf("/")
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = ""
                lastSegmentLength = 0
              } else {
                res = res.slice(0, lastSlashIndex)
                lastSegmentLength = res.length - 1 - res.lastIndexOf("/")
              }
              lastSlash = i
              dots = 0
              continue
            }
          } else if (res.length === 2 || res.length === 1) {
            res = ""
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += "/.."
          else res = ".."
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) res += "/" + path.slice(lastSlash + 1, i)
        else res = path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }
      lastSlash = i
      dots = 0
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }
  return res
}
function _posixFormat(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root
  var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "")
  if (!dir) {
    return base
  }
  if (dir === pathObject.root) {
    return dir + base
  }
  return dir + sep + base
}
var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = ""
    var resolvedAbsolute = false
    var cwd
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path
      if (i >= 0) path = arguments[i]
      else {
        if (cwd === undefined) cwd = process.cwd()
        path = cwd
      }
      posix_assertPath(path)
      // Skip empty entries
      if (path.length === 0) {
        continue
      }
      resolvedPath = path + "/" + resolvedPath
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute)
    if (resolvedAbsolute) {
      if (resolvedPath.length > 0) return "/" + resolvedPath
      else return "/"
    } else if (resolvedPath.length > 0) {
      return resolvedPath
    } else {
      return "."
    }
  },
  normalize: function normalize(path) {
    posix_assertPath(path)
    if (path.length === 0) return "."
    var isAbsolute = path.charCodeAt(0) === 47 /*/*/
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/
    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute)
    if (path.length === 0 && !isAbsolute) path = "."
    if (path.length > 0 && trailingSeparator) path += "/"
    if (isAbsolute) return "/" + path
    return path
  },
  isAbsolute: function isAbsolute(path) {
    posix_assertPath(path)
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/
  },
  join: function join() {
    if (arguments.length === 0) return "."
    var joined
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i]
      posix_assertPath(arg)
      if (arg.length > 0) {
        if (joined === undefined) joined = arg
        else joined += "/" + arg
      }
    }
    if (joined === undefined) return "."
    return posix.normalize(joined)
  },
  relative: function relative(from, to) {
    posix_assertPath(from)
    posix_assertPath(to)
    if (from === to) return ""
    from = posix.resolve(from)
    to = posix.resolve(to)
    if (from === to) return ""
    // Trim any leading backslashes
    var fromStart = 1
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/) break
    }
    var fromEnd = from.length
    var fromLen = fromEnd - fromStart
    // Trim any leading backslashes
    var toStart = 1
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/) break
    }
    var toEnd = to.length
    var toLen = toEnd - toStart
    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen
    var lastCommonSep = -1
    var i = 0
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1)
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i)
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0
          }
        }
        break
      }
      var fromCode = from.charCodeAt(fromStart + i)
      var toCode = to.charCodeAt(toStart + i)
      if (fromCode !== toCode) break
      else if (fromCode === 47 /*/*/) lastCommonSep = i
    }
    var out = ""
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0) out += ".."
        else out += "/.."
      }
    }
    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep)
    else {
      toStart += lastCommonSep
      if (to.charCodeAt(toStart) === 47 /*/*/) ++toStart
      return to.slice(toStart)
    }
  },
  _makeLong: function _makeLong(path) {
    return path
  },
  dirname: function dirname(path) {
    posix_assertPath(path)
    if (path.length === 0) return "."
    var code = path.charCodeAt(0)
    var hasRoot = code === 47 /*/*/
    var end = -1
    var matchedSlash = true
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i)
      if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i
          break
        }
      } else {
        // We saw the first non-path separator
        matchedSlash = false
      }
    }
    if (end === -1) return hasRoot ? "/" : "."
    if (hasRoot && end === 1) return "//"
    return path.slice(0, end)
  },
  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== "string") throw new TypeError('"ext" argument must be a string')
    posix_assertPath(path)
    var start = 0
    var end = -1
    var matchedSlash = true
    var i
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return ""
      var extIdx = ext.length - 1
      var firstNonSlashEnd = -1
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i)
        if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1
            break
          }
        } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false
            firstNonSlashEnd = i + 1
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1
              end = firstNonSlashEnd
            }
          }
        }
      }
      if (start === end) end = firstNonSlashEnd
      else if (end === -1) end = path.length
      return path.slice(start, end)
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1
            break
          }
        } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false
          end = i + 1
        }
      }
      if (end === -1) return ""
      return path.slice(start, end)
    }
  },
  extname: function extname(path) {
    posix_assertPath(path)
    var startDot = -1
    var startPart = 0
    var end = -1
    var matchedSlash = true
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i)
      if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1
          break
        }
        continue
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false
        end = i + 1
      }
      if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1) startDot = i
        else if (preDotState !== 1) preDotState = 1
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1
      }
    }
    if (
      startDot === -1 ||
      end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      return ""
    }
    return path.slice(startDot, end)
  },
  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject)
    }
    return _posixFormat("/", pathObject)
  },
  parse: function parse(path) {
    posix_assertPath(path)
    var ret = { root: "", dir: "", base: "", ext: "", name: "" }
    if (path.length === 0) return ret
    var code = path.charCodeAt(0)
    var isAbsolute = code === 47 /*/*/
    var start
    if (isAbsolute) {
      ret.root = "/"
      start = 1
    } else {
      start = 0
    }
    var startDot = -1
    var startPart = 0
    var end = -1
    var matchedSlash = true
    var i = path.length - 1
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0
    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i)
      if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1
          break
        }
        continue
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false
        end = i + 1
      }
      if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1) startDot = i
        else if (preDotState !== 1) preDotState = 1
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1
      }
    }
    if (
      startDot === -1 ||
      end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end)
        else ret.base = ret.name = path.slice(startPart, end)
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot)
        ret.base = path.slice(1, end)
      } else {
        ret.name = path.slice(startPart, startDot)
        ret.base = path.slice(startPart, end)
      }
      ret.ext = path.slice(startDot, end)
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1)
    else if (isAbsolute) ret.dir = "/"
    return ret
  },
  sep: "/",
  delimiter: ":",
  win32: null,
  posix: null
}
posix.posix = posix
Utils.posix = posix

module.exports = { Utils }
