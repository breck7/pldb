class AbstractParticle {
  _getProcessTimeInMilliseconds() {
    const hrtime = process.hrtime()
    return (hrtime[0] * 1e9 + hrtime[1]) / 1e6
  }
}
const { Utils } = require("../products/Utils.js")
var FileFormat
;(function (FileFormat) {
  FileFormat["csv"] = "csv"
  FileFormat["tsv"] = "tsv"
  FileFormat["particles"] = "particles"
})(FileFormat || (FileFormat = {}))
const TN_WORD_BREAK_SYMBOL = " "
const TN_EDGE_SYMBOL = " "
const TN_NODE_BREAK_SYMBOL = "\n"
class AbstractParticleEvent {
  constructor(targetParticle) {
    this.targetParticle = targetParticle
  }
}
class ChildAddedParticleEvent extends AbstractParticleEvent {}
class ChildRemovedParticleEvent extends AbstractParticleEvent {}
class DescendantChangedParticleEvent extends AbstractParticleEvent {}
class LineChangedParticleEvent extends AbstractParticleEvent {}
class ParticleWord {
  constructor(particle, cellIndex) {
    this._particle = particle
    this._cellIndex = cellIndex
  }
  replace(newWord) {
    this._particle.setWord(this._cellIndex, newWord)
  }
  get word() {
    return this._particle.getWord(this._cellIndex)
  }
}
const ParticleEvents = { ChildAddedParticleEvent, ChildRemovedParticleEvent, DescendantChangedParticleEvent, LineChangedParticleEvent }
var WhereOperators
;(function (WhereOperators) {
  WhereOperators["equal"] = "="
  WhereOperators["notEqual"] = "!="
  WhereOperators["lessThan"] = "<"
  WhereOperators["lessThanOrEqual"] = "<="
  WhereOperators["greaterThan"] = ">"
  WhereOperators["greaterThanOrEqual"] = ">="
  WhereOperators["includes"] = "includes"
  WhereOperators["doesNotInclude"] = "doesNotInclude"
  WhereOperators["in"] = "in"
  WhereOperators["notIn"] = "notIn"
  WhereOperators["empty"] = "empty"
  WhereOperators["notEmpty"] = "notEmpty"
})(WhereOperators || (WhereOperators = {}))
var ParticlesConstants
;(function (ParticlesConstants) {
  ParticlesConstants["extends"] = "extends"
})(ParticlesConstants || (ParticlesConstants = {}))
class ParserCombinator {
  constructor(catchAllParser, firstWordMap = {}, regexTests = undefined) {
    this._catchAllParser = catchAllParser
    this._firstWordMap = new Map(Object.entries(firstWordMap))
    this._regexTests = regexTests
  }
  getFirstWordOptions() {
    return Array.from(this._getFirstWordMap().keys())
  }
  // todo: remove
  _getFirstWordMap() {
    return this._firstWordMap
  }
  // todo: remove
  _getFirstWordMapAsObject() {
    let obj = {}
    const map = this._getFirstWordMap()
    for (let [key, val] of map.entries()) {
      obj[key] = val
    }
    return obj
  }
  _getParser(line, contextParticle, wordBreakSymbol = TN_WORD_BREAK_SYMBOL) {
    return this._getFirstWordMap().get(this._getFirstWord(line, wordBreakSymbol)) || this._getParserFromRegexTests(line) || this._getCatchAllParser(contextParticle)
  }
  _getCatchAllParser(contextParticle) {
    if (this._catchAllParser) return this._catchAllParser
    const parent = contextParticle.parent
    if (parent) return parent._getParser()._getCatchAllParser(parent)
    return contextParticle.constructor
  }
  _getParserFromRegexTests(line) {
    if (!this._regexTests) return undefined
    const hit = this._regexTests.find(test => test.regex.test(line))
    if (hit) return hit.parser
    return undefined
  }
  _getFirstWord(line, wordBreakSymbol) {
    const firstBreak = line.indexOf(wordBreakSymbol)
    return line.substr(0, firstBreak > -1 ? firstBreak : undefined)
  }
}
class Particle extends AbstractParticle {
  constructor(subparticles, line, parent) {
    super()
    // BEGIN MUTABLE METHODS BELOw
    this._particleCreationTime = this._getProcessTimeInMilliseconds()
    this._parent = parent
    this._setLine(line)
    this._setSubparticles(subparticles)
  }
  execute() {}
  async loadRequirements(context) {
    // todo: remove
    await Promise.all(this.map(particle => particle.loadRequirements(context)))
  }
  getErrors() {
    return []
  }
  get lineCellTypes() {
    // todo: make this any a constant
    return "undefinedCellType ".repeat(this.words.length).trim()
  }
  isNodeJs() {
    return typeof exports !== "undefined"
  }
  isBrowser() {
    return !this.isNodeJs()
  }
  getOlderSiblings() {
    if (this.isRoot()) return []
    return this.parent.slice(0, this.getIndex())
  }
  _getClosestOlderSibling() {
    const olderSiblings = this.getOlderSiblings()
    return olderSiblings[olderSiblings.length - 1]
  }
  getYoungerSiblings() {
    if (this.isRoot()) return []
    return this.parent.slice(this.getIndex() + 1)
  }
  getSiblings() {
    if (this.isRoot()) return []
    return this.parent.filter(particle => particle !== this)
  }
  _getUid() {
    if (!this._uid) this._uid = Particle._makeUniqueId()
    return this._uid
  }
  // todo: rename getMother? grandMother et cetera?
  get parent() {
    return this._parent
  }
  getIndentLevel(relativeTo) {
    return this._getIndentLevel(relativeTo)
  }
  get indentation() {
    const indentLevel = this._getIndentLevel() - 1
    if (indentLevel < 0) return ""
    return this.edgeSymbol.repeat(indentLevel)
  }
  _getTopDownArray(arr) {
    this.forEach(subparticle => {
      arr.push(subparticle)
      subparticle._getTopDownArray(arr)
    })
  }
  get topDownArray() {
    const arr = []
    this._getTopDownArray(arr)
    return arr
  }
  *getTopDownArrayIterator() {
    for (let subparticle of this.getSubparticles()) {
      yield subparticle
      yield* subparticle.getTopDownArrayIterator()
    }
  }
  particleAtLine(lineNumber) {
    let index = 0
    for (let particle of this.getTopDownArrayIterator()) {
      if (lineNumber === index) return particle
      index++
    }
  }
  get numberOfLines() {
    let lineCount = 0
    for (let particle of this.getTopDownArrayIterator()) {
      lineCount++
    }
    return lineCount
  }
  _getMaxUnitsOnALine() {
    let max = 0
    for (let particle of this.getTopDownArrayIterator()) {
      const count = particle.words.length + particle.getIndentLevel()
      if (count > max) max = count
    }
    return max
  }
  get numberOfWords() {
    let wordCount = 0
    for (let particle of this.getTopDownArrayIterator()) {
      wordCount += particle.words.length
    }
    return wordCount
  }
  get lineNumber() {
    return this._getLineNumberRelativeTo()
  }
  _getLineNumber(target = this) {
    if (this._cachedLineNumber) return this._cachedLineNumber
    let lineNumber = 1
    for (let particle of this.root.getTopDownArrayIterator()) {
      if (particle === target) return lineNumber
      lineNumber++
    }
    return lineNumber
  }
  isBlankLine() {
    return !this.length && !this.getLine()
  }
  hasDuplicateFirstWords() {
    return this.length ? new Set(this.getFirstWords()).size !== this.length : false
  }
  isEmpty() {
    return !this.length && !this.content
  }
  _getLineNumberRelativeTo(relativeTo) {
    if (this.isRoot(relativeTo)) return 0
    const start = relativeTo || this.root
    return start._getLineNumber(this)
  }
  isRoot(relativeTo) {
    return relativeTo === this || !this.parent
  }
  get root() {
    return this._getRootParticle()
  }
  _getRootParticle(relativeTo) {
    if (this.isRoot(relativeTo)) return this
    return this.parent._getRootParticle(relativeTo)
  }
  toString(indentCount = 0, language = this) {
    if (this.isRoot()) return this._subparticlesToString(indentCount, language)
    return language.edgeSymbol.repeat(indentCount) + this.getLine(language) + (this.length ? language.particleBreakSymbol + this._subparticlesToString(indentCount + 1, language) : "")
  }
  get asString() {
    return this.toString()
  }
  printLinesFrom(start, quantity) {
    return this._printLinesFrom(start, quantity, false)
  }
  printLinesWithLineNumbersFrom(start, quantity) {
    return this._printLinesFrom(start, quantity, true)
  }
  _printLinesFrom(start, quantity, printLineNumbers) {
    // todo: use iterator for better perf?
    const end = start + quantity
    this.toString()
      .split("\n")
      .slice(start, end)
      .forEach((line, index) => {
        if (printLineNumbers) console.log(`${start + index} ${line}`)
        else console.log(line)
      })
    return this
  }
  getWord(index) {
    const words = this._getWords(0)
    if (index < 0) index = words.length + index
    return words[index]
  }
  get list() {
    return this.getWordsFrom(1)
  }
  _toHtml(indentCount) {
    const path = this.getPathVector().join(" ")
    const classes = {
      particleLine: "particleLine",
      edgeSymbol: "edgeSymbol",
      particleBreakSymbol: "particleBreakSymbol",
      particleSubparticles: "particleSubparticles"
    }
    const edge = this.edgeSymbol.repeat(indentCount)
    // Set up the firstWord part of the particle
    const edgeHtml = `<span class="${classes.particleLine}" data-pathVector="${path}"><span class="${classes.edgeSymbol}">${edge}</span>`
    const lineHtml = this._getLineHtml()
    const subparticlesHtml = this.length ? `<span class="${classes.particleBreakSymbol}">${this.particleBreakSymbol}</span>` + `<span class="${classes.particleSubparticles}">${this._subparticlesToHtml(indentCount + 1)}</span>` : ""
    return `${edgeHtml}${lineHtml}${subparticlesHtml}</span>`
  }
  _getWords(startFrom) {
    if (!this._words) this._words = this._getLine().split(this.wordBreakSymbol)
    return startFrom ? this._words.slice(startFrom) : this._words
  }
  get words() {
    return this._getWords(0)
  }
  doesExtend(parserId) {
    return false
  }
  require(moduleName, filePath) {
    if (!this.isNodeJs()) return window[moduleName]
    return require(filePath || moduleName)
  }
  getWordsFrom(startFrom) {
    return this._getWords(startFrom)
  }
  getFirstAncestor() {
    const parent = this.parent
    return parent.isRoot() ? this : parent.getFirstAncestor()
  }
  isLoaded() {
    return true
  }
  getRunTimePhaseErrors() {
    if (!this._runTimePhaseErrors) this._runTimePhaseErrors = {}
    return this._runTimePhaseErrors
  }
  setRunTimePhaseError(phase, errorObject) {
    if (errorObject === undefined) delete this.getRunTimePhaseErrors()[phase]
    else this.getRunTimePhaseErrors()[phase] = errorObject
    return this
  }
  _getJavascriptPrototypeChainUpTo(stopAtClassName = "Particle") {
    // todo: cross browser test this
    let constructor = this.constructor
    const chain = []
    while (constructor.name !== stopAtClassName) {
      chain.unshift(constructor.name)
      constructor = constructor.__proto__
    }
    chain.unshift(stopAtClassName)
    return chain
  }
  _getProjectRootDir() {
    return this.isRoot() ? "" : this.root._getProjectRootDir()
  }
  // Concat 2 particles amd return a new particle, but replace any particles
  // in this particle that start with the same particle from the first particle with
  // that patched version. Does not recurse.
  patch(two) {
    const copy = this.clone()
    two.forEach(particle => {
      const hit = copy.getParticle(particle.getWord(0))
      if (hit) hit.destroy()
    })
    copy.concat(two)
    return copy
  }
  getSparsity() {
    const particles = this.getSubparticles()
    const fields = this._getUnionNames()
    let count = 0
    this.getSubparticles().forEach(particle => {
      fields.forEach(field => {
        if (particle.has(field)) count++
      })
    })
    return 1 - count / (particles.length * fields.length)
  }
  // todo: rename. what is the proper term from set/cat theory?
  getBiDirectionalMaps(propertyNameOrFn, propertyNameOrFn2 = particle => particle.getWord(0)) {
    const oneToTwo = {}
    const twoToOne = {}
    const is1Str = typeof propertyNameOrFn === "string"
    const is2Str = typeof propertyNameOrFn2 === "string"
    const subparticles = this.getSubparticles()
    this.forEach((particle, index) => {
      const value1 = is1Str ? particle.get(propertyNameOrFn) : propertyNameOrFn(particle, index, subparticles)
      const value2 = is2Str ? particle.get(propertyNameOrFn2) : propertyNameOrFn2(particle, index, subparticles)
      if (value1 !== undefined) {
        if (!oneToTwo[value1]) oneToTwo[value1] = []
        oneToTwo[value1].push(value2)
      }
      if (value2 !== undefined) {
        if (!twoToOne[value2]) twoToOne[value2] = []
        twoToOne[value2].push(value1)
      }
    })
    return [oneToTwo, twoToOne]
  }
  _getWordIndexCharacterStartPosition(wordIndex) {
    const xiLength = this.edgeSymbol.length
    const numIndents = this._getIndentLevel() - 1
    const indentPosition = xiLength * numIndents
    if (wordIndex < 1) return xiLength * (numIndents + wordIndex)
    return indentPosition + this.words.slice(0, wordIndex).join(this.wordBreakSymbol).length + this.wordBreakSymbol.length
  }
  getParticleInScopeAtCharIndex(charIndex) {
    if (this.isRoot()) return this
    let wordIndex = this.getWordIndexAtCharacterIndex(charIndex)
    if (wordIndex > 0) return this
    let particle = this
    while (wordIndex < 1) {
      particle = particle.parent
      wordIndex++
    }
    return particle
  }
  getWordProperties(wordIndex) {
    const start = this._getWordIndexCharacterStartPosition(wordIndex)
    const word = wordIndex < 0 ? "" : this.getWord(wordIndex)
    return {
      startCharIndex: start,
      endCharIndex: start + word.length,
      word: word
    }
  }
  fill(fill = "") {
    this.topDownArray.forEach(line => {
      line.words.forEach((word, index) => line.setWord(index, fill))
    })
    return this
  }
  getAllWordBoundaryCoordinates() {
    const coordinates = []
    let lineIndex = 0
    for (let particle of this.getTopDownArrayIterator()) {
      particle.getWordBoundaryCharIndices().forEach((charIndex, wordIndex) => {
        coordinates.push({
          lineIndex: lineIndex,
          charIndex: charIndex,
          wordIndex: wordIndex
        })
      })
      lineIndex++
    }
    return coordinates
  }
  getWordBoundaryCharIndices() {
    let indentLevel = this._getIndentLevel()
    const wordBreakSymbolLength = this.wordBreakSymbol.length
    let elapsed = indentLevel
    return this.words.map((word, wordIndex) => {
      const boundary = elapsed
      elapsed += word.length + wordBreakSymbolLength
      return boundary
    })
  }
  getWordIndexAtCharacterIndex(charIndex) {
    // todo: is this correct thinking for handling root?
    if (this.isRoot()) return 0
    const numberOfIndents = this._getIndentLevel(undefined) - 1
    // todo: probably want to rewrite this in a performant way.
    const spots = []
    while (spots.length < numberOfIndents) {
      spots.push(-(numberOfIndents - spots.length))
    }
    this.words.forEach((word, wordIndex) => {
      word.split("").forEach(letter => {
        spots.push(wordIndex)
      })
      spots.push(wordIndex)
    })
    return spots[charIndex]
  }
  // Note: This currently does not return any errors resulting from "required" or "single"
  getAllErrors(lineStartsAt = 1) {
    const errors = []
    for (let particle of this.topDownArray) {
      particle._cachedLineNumber = lineStartsAt // todo: cleanup
      const errs = particle.getErrors()
      errs.forEach(err => errors.push(err))
      // delete particle._cachedLineNumber
      lineStartsAt++
    }
    return errors
  }
  *getAllErrorsIterator() {
    let line = 1
    for (let particle of this.getTopDownArrayIterator()) {
      particle._cachedLineNumber = line
      const errs = particle.getErrors()
      // delete particle._cachedLineNumber
      if (errs.length) yield errs
      line++
    }
  }
  get firstWord() {
    return this.words[0]
  }
  get content() {
    const words = this.getWordsFrom(1)
    return words.length ? words.join(this.wordBreakSymbol) : undefined
  }
  get contentWithSubparticles() {
    // todo: deprecate
    const content = this.content
    return (content ? content : "") + (this.length ? this.particleBreakSymbol + this._subparticlesToString() : "")
  }
  getFirstParticle() {
    return this.particleAt(0)
  }
  getStack() {
    return this._getStack()
  }
  _getStack(relativeTo) {
    if (this.isRoot(relativeTo)) return []
    const parent = this.parent
    if (parent.isRoot(relativeTo)) return [this]
    else return parent._getStack(relativeTo).concat([this])
  }
  getStackString() {
    return this._getStack()
      .map((particle, index) => this.edgeSymbol.repeat(index) + particle.getLine())
      .join(this.particleBreakSymbol)
  }
  getLine(language) {
    if (!this._words && !language) return this._getLine() // todo: how does this interact with "language" param?
    return this.words.join((language || this).wordBreakSymbol)
  }
  getColumnNames() {
    return this._getUnionNames()
  }
  getOneHot(column) {
    const clone = this.clone()
    const cols = Array.from(new Set(clone.getColumn(column)))
    clone.forEach(particle => {
      const val = particle.get(column)
      particle.delete(column)
      cols.forEach(col => {
        particle.set(column + "_" + col, val === col ? "1" : "0")
      })
    })
    return clone
  }
  // todo: return array? getPathArray?
  _getFirstWordPath(relativeTo) {
    if (this.isRoot(relativeTo)) return ""
    else if (this.parent.isRoot(relativeTo)) return this.firstWord
    return this.parent._getFirstWordPath(relativeTo) + this.edgeSymbol + this.firstWord
  }
  getFirstWordPathRelativeTo(relativeTo) {
    return this._getFirstWordPath(relativeTo)
  }
  getFirstWordPath() {
    return this._getFirstWordPath()
  }
  getPathVector() {
    return this._getPathVector()
  }
  getPathVectorRelativeTo(relativeTo) {
    return this._getPathVector(relativeTo)
  }
  _getPathVector(relativeTo) {
    if (this.isRoot(relativeTo)) return []
    const path = this.parent._getPathVector(relativeTo)
    path.push(this.getIndex())
    return path
  }
  getIndex() {
    return this.parent._indexOfParticle(this)
  }
  isTerminal() {
    return !this.length
  }
  _getLineHtml() {
    return this.words.map((word, index) => `<span class="word${index}">${Utils.stripHtml(word)}</span>`).join(`<span class="zIncrement">${this.wordBreakSymbol}</span>`)
  }
  _getXmlContent(indentCount) {
    if (this.content !== undefined) return this.contentWithSubparticles
    return this.length ? `${indentCount === -1 ? "" : "\n"}${this._subparticlesToXml(indentCount > -1 ? indentCount + 2 : -1)}${" ".repeat(indentCount)}` : ""
  }
  _toXml(indentCount) {
    const indent = " ".repeat(indentCount)
    const tag = this.firstWord
    return `${indent}<${tag}>${this._getXmlContent(indentCount)}</${tag}>${indentCount === -1 ? "" : "\n"}`
  }
  _toObjectTuple() {
    const content = this.content
    const length = this.length
    const hasSubparticlesNoContent = content === undefined && length
    const hasContentAndHasSubparticles = content !== undefined && length
    // If the particle has a content and a subparticle return it as a string, as
    // Javascript object values can't be both a leaf and a particle.
    const tupleValue = hasSubparticlesNoContent ? this.toObject() : hasContentAndHasSubparticles ? this.contentWithSubparticles : content
    return [this.firstWord, tupleValue]
  }
  _indexOfParticle(needleParticle) {
    let result = -1
    this.find((particle, index) => {
      if (particle === needleParticle) {
        result = index
        return true
      }
    })
    return result
  }
  getMaxLineWidth() {
    let maxWidth = 0
    for (let particle of this.getTopDownArrayIterator()) {
      const lineWidth = particle.getLine().length
      if (lineWidth > maxWidth) maxWidth = lineWidth
    }
    return maxWidth
  }
  toParticle() {
    return new Particle(this.toString())
  }
  _rightPad(newWidth, padCharacter) {
    const line = this.getLine()
    this.setLine(line + padCharacter.repeat(newWidth - line.length))
    return this
  }
  rightPad(padCharacter = " ") {
    const newWidth = this.getMaxLineWidth()
    this.topDownArray.forEach(particle => particle._rightPad(newWidth, padCharacter))
    return this
  }
  lengthen(numberOfLines) {
    let linesToAdd = numberOfLines - this.numberOfLines
    while (linesToAdd > 0) {
      this.appendLine("")
      linesToAdd--
    }
    return this
  }
  toSideBySide(particlesOrStrings, delimiter = " ") {
    particlesOrStrings = particlesOrStrings.map(particle => (particle instanceof Particle ? particle : new Particle(particle)))
    const clone = this.toParticle()
    const particleBreakSymbol = "\n"
    let next
    while ((next = particlesOrStrings.shift())) {
      clone.lengthen(next.numberOfLines)
      clone.rightPad()
      next
        .toString()
        .split(particleBreakSymbol)
        .forEach((line, index) => {
          const particle = clone.particleAtLine(index)
          particle.setLine(particle.getLine() + delimiter + line)
        })
    }
    return clone
  }
  toComparison(particle) {
    const particleBreakSymbol = "\n"
    const lines = particle.toString().split(particleBreakSymbol)
    return new Particle(
      this.toString()
        .split(particleBreakSymbol)
        .map((line, index) => (lines[index] === line ? "" : "x"))
        .join(particleBreakSymbol)
    )
  }
  toBraid(particlesOrStrings) {
    particlesOrStrings.unshift(this)
    const particleDelimiter = this.particleBreakSymbol
    return new Particle(
      Utils.interweave(particlesOrStrings.map(particle => particle.toString().split(particleDelimiter)))
        .map(line => (line === undefined ? "" : line))
        .join(particleDelimiter)
    )
  }
  getSlice(startIndexInclusive, stopIndexExclusive) {
    return new Particle(
      this.slice(startIndexInclusive, stopIndexExclusive)
        .map(subparticle => subparticle.toString())
        .join("\n")
    )
  }
  _hasColumns(columns) {
    const words = this.words
    return columns.every((searchTerm, index) => searchTerm === words[index])
  }
  hasWord(index, word) {
    return this.getWord(index) === word
  }
  getParticleByColumns(...columns) {
    return this.topDownArray.find(particle => particle._hasColumns(columns))
  }
  getParticleByColumn(index, name) {
    return this.find(particle => particle.getWord(index) === name)
  }
  _getParticlesByColumn(index, name) {
    return this.filter(particle => particle.getWord(index) === name)
  }
  // todo: preserve subclasses!
  select(columnNames) {
    columnNames = Array.isArray(columnNames) ? columnNames : [columnNames]
    const result = new Particle()
    this.forEach(particle => {
      const newParticle = result.appendLine(particle.getLine())
      columnNames.forEach(name => {
        const valueParticle = particle.getParticle(name)
        if (valueParticle) newParticle.appendParticle(valueParticle)
      })
    })
    return result
  }
  selectionToString() {
    return this.getSelectedParticles()
      .map(particle => particle.toString())
      .join("\n")
  }
  getSelectedParticles() {
    return this.topDownArray.filter(particle => particle.isSelected())
  }
  clearSelection() {
    this.getSelectedParticles().forEach(particle => particle.unselectParticle())
  }
  // Note: this is for debugging select chains
  print(message = "") {
    if (message) console.log(message)
    console.log(this.toString())
    return this
  }
  // todo: preserve subclasses!
  // todo: preserve links back to parent so you could edit as normal?
  where(columnName, operator, fixedValue) {
    const isArray = Array.isArray(fixedValue)
    const valueType = isArray ? typeof fixedValue[0] : typeof fixedValue
    let parser
    if (valueType === "number") parser = parseFloat
    const fn = particle => {
      const cell = particle.get(columnName)
      const typedCell = parser ? parser(cell) : cell
      if (operator === WhereOperators.equal) return fixedValue === typedCell
      else if (operator === WhereOperators.notEqual) return fixedValue !== typedCell
      else if (operator === WhereOperators.includes) return typedCell !== undefined && typedCell.includes(fixedValue)
      else if (operator === WhereOperators.doesNotInclude) return typedCell === undefined || !typedCell.includes(fixedValue)
      else if (operator === WhereOperators.greaterThan) return typedCell > fixedValue
      else if (operator === WhereOperators.lessThan) return typedCell < fixedValue
      else if (operator === WhereOperators.greaterThanOrEqual) return typedCell >= fixedValue
      else if (operator === WhereOperators.lessThanOrEqual) return typedCell <= fixedValue
      else if (operator === WhereOperators.empty) return !particle.has(columnName)
      else if (operator === WhereOperators.notEmpty) return particle.has(columnName) || (cell !== "" && cell !== undefined)
      else if (operator === WhereOperators.in && isArray) return fixedValue.includes(typedCell)
      else if (operator === WhereOperators.notIn && isArray) return !fixedValue.includes(typedCell)
    }
    const result = new Particle()
    this.filter(fn).forEach(particle => {
      result.appendParticle(particle)
    })
    return result
  }
  with(firstWord) {
    return this.filter(particle => particle.has(firstWord))
  }
  without(firstWord) {
    return this.filter(particle => !particle.has(firstWord))
  }
  first(quantity = 1) {
    return this.limit(quantity, 0)
  }
  last(quantity = 1) {
    return this.limit(quantity, this.length - quantity)
  }
  // todo: preserve subclasses!
  limit(quantity, offset = 0) {
    const result = new Particle()
    this.getSubparticles()
      .slice(offset, quantity + offset)
      .forEach(particle => {
        result.appendParticle(particle)
      })
    return result
  }
  getSubparticlesFirstArray() {
    const arr = []
    this._getSubparticlesFirstArray(arr)
    return arr
  }
  _getSubparticlesFirstArray(arr) {
    this.forEach(subparticle => {
      subparticle._getSubparticlesFirstArray(arr)
      arr.push(subparticle)
    })
  }
  _getIndentLevel(relativeTo) {
    return this._getStack(relativeTo).length
  }
  getParentFirstArray() {
    const levels = this._getLevels()
    const arr = []
    Object.values(levels).forEach(level => {
      level.forEach(item => arr.push(item))
    })
    return arr
  }
  _getLevels() {
    const levels = {}
    this.topDownArray.forEach(particle => {
      const level = particle._getIndentLevel()
      if (!levels[level]) levels[level] = []
      levels[level].push(particle)
    })
    return levels
  }
  _getSubparticlesArray() {
    if (!this._subparticles) this._subparticles = []
    return this._subparticles
  }
  getLines() {
    return this.map(particle => particle.getLine())
  }
  getSubparticles() {
    return this._getSubparticlesArray().slice(0)
  }
  get length() {
    return this._getSubparticlesArray().length
  }
  _particleAt(index) {
    if (index < 0) index = this.length + index
    return this._getSubparticlesArray()[index]
  }
  particleAt(indexOrIndexArray) {
    if (typeof indexOrIndexArray === "number") return this._particleAt(indexOrIndexArray)
    if (indexOrIndexArray.length === 1) return this._particleAt(indexOrIndexArray[0])
    const first = indexOrIndexArray[0]
    const particle = this._particleAt(first)
    if (!particle) return undefined
    return particle.particleAt(indexOrIndexArray.slice(1))
  }
  // Flatten a particle into an object like {twitter:"pldb", "twitter.followers":123}.
  // Assumes you have a nested key/value list with no multiline strings.
  toFlatObject(delimiter = ".") {
    let newObject = {}
    const { edgeSymbolRegex } = this
    this.forEach((subparticle, index) => {
      newObject[subparticle.getWord(0)] = subparticle.content
      subparticle.topDownArray.forEach(particle => {
        const newColumnName = particle.getFirstWordPathRelativeTo(this).replace(edgeSymbolRegex, delimiter)
        const value = particle.content
        newObject[newColumnName] = value
      })
    })
    return newObject
  }
  _toObject() {
    const obj = {}
    this.forEach(particle => {
      const tuple = particle._toObjectTuple()
      obj[tuple[0]] = tuple[1]
    })
    return obj
  }
  get asHtml() {
    return this._subparticlesToHtml(0)
  }
  _toHtmlCubeLine(indents = 0, lineIndex = 0, planeIndex = 0) {
    const getLine = (cellIndex, word = "") =>
      `<span class="htmlCubeSpan" style="top: calc(var(--topIncrement) * ${planeIndex} + var(--rowHeight) * ${lineIndex}); left:calc(var(--leftIncrement) * ${planeIndex} + var(--cellWidth) * ${cellIndex});">${word}</span>`
    let cells = []
    this.words.forEach((word, index) => (word ? cells.push(getLine(index + indents, word)) : ""))
    return cells.join("")
  }
  get asHtmlCube() {
    return this.map((plane, planeIndex) => plane.topDownArray.map((line, lineIndex) => line._toHtmlCubeLine(line.getIndentLevel() - 2, lineIndex, planeIndex)).join("")).join("")
  }
  _getHtmlJoinByCharacter() {
    return `<span class="particleBreakSymbol">${this.particleBreakSymbol}</span>`
  }
  _subparticlesToHtml(indentCount) {
    const joinBy = this._getHtmlJoinByCharacter()
    return this.map(particle => particle._toHtml(indentCount)).join(joinBy)
  }
  _subparticlesToString(indentCount, language = this) {
    return this.map(particle => particle.toString(indentCount, language)).join(language.particleBreakSymbol)
  }
  subparticlesToString(indentCount = 0) {
    return this._subparticlesToString(indentCount)
  }
  // todo: implement
  _getChildJoinCharacter() {
    return "\n"
  }
  format() {
    this.forEach(subparticle => subparticle.format())
    return this
  }
  compile() {
    return this.map(subparticle => subparticle.compile()).join(this._getChildJoinCharacter())
  }
  get asXml() {
    return this._subparticlesToXml(0)
  }
  toDisk(path) {
    if (!this.isNodeJs()) throw new Error("This method only works in Node.js")
    const format = Particle._getFileFormat(path)
    const formats = {
      particles: particle => particle.toString(),
      csv: particle => particle.asCsv,
      tsv: particle => particle.asTsv
    }
    this.require("fs").writeFileSync(path, formats[format](this), "utf8")
    return this
  }
  _lineToYaml(indentLevel, listTag = "") {
    let prefix = " ".repeat(indentLevel)
    if (listTag && indentLevel > 1) prefix = " ".repeat(indentLevel - 2) + listTag + " "
    return prefix + `${this.firstWord}:` + (this.content ? " " + this.content : "")
  }
  _isYamlList() {
    return this.hasDuplicateFirstWords()
  }
  get asYaml() {
    return `%YAML 1.2
---\n${this._subparticlesToYaml(0).join("\n")}`
  }
  _subparticlesToYaml(indentLevel) {
    if (this._isYamlList()) return this._subparticlesToYamlList(indentLevel)
    else return this._subparticlesToYamlAssociativeArray(indentLevel)
  }
  // if your code-to-be-yaml has a list of associative arrays of type N and you don't
  // want the type N to print
  _collapseYamlLine() {
    return false
  }
  _toYamlListElement(indentLevel) {
    const subparticles = this._subparticlesToYaml(indentLevel + 1)
    if (this._collapseYamlLine()) {
      if (indentLevel > 1) return subparticles.join("\n").replace(" ".repeat(indentLevel), " ".repeat(indentLevel - 2) + "- ")
      return subparticles.join("\n")
    } else {
      subparticles.unshift(this._lineToYaml(indentLevel, "-"))
      return subparticles.join("\n")
    }
  }
  _subparticlesToYamlList(indentLevel) {
    return this.map(particle => particle._toYamlListElement(indentLevel + 2))
  }
  _toYamlAssociativeArrayElement(indentLevel) {
    const subparticles = this._subparticlesToYaml(indentLevel + 1)
    subparticles.unshift(this._lineToYaml(indentLevel))
    return subparticles.join("\n")
  }
  _subparticlesToYamlAssociativeArray(indentLevel) {
    return this.map(particle => particle._toYamlAssociativeArrayElement(indentLevel))
  }
  get asJsonSubset() {
    return JSON.stringify(this.toObject(), null, " ")
  }
  _toObjectForSerialization() {
    return this.length
      ? {
          cells: this.words,
          subparticles: this.map(subparticle => subparticle._toObjectForSerialization())
        }
      : {
          cells: this.words
        }
  }
  get asJson() {
    return JSON.stringify({ subparticles: this.map(subparticle => subparticle._toObjectForSerialization()) }, null, " ")
  }
  get asGrid() {
    const WordBreakSymbol = this.wordBreakSymbol
    return this.toString()
      .split(this.particleBreakSymbol)
      .map(line => line.split(WordBreakSymbol))
  }
  get asGridJson() {
    return JSON.stringify(this.asGrid, null, 2)
  }
  findParticles(firstWordPath) {
    // todo: can easily speed this up
    const map = {}
    if (!Array.isArray(firstWordPath)) firstWordPath = [firstWordPath]
    firstWordPath.forEach(path => (map[path] = true))
    return this.topDownArray.filter(particle => {
      if (map[particle._getFirstWordPath(this)]) return true
      return false
    })
  }
  evalTemplateString(str) {
    const that = this
    return str.replace(/{([^\}]+)}/g, (match, path) => that.get(path) || "")
  }
  emitLogMessage(message) {
    console.log(message)
  }
  getColumn(path) {
    return this.map(particle => particle.get(path))
  }
  getFiltered(fn) {
    const clone = this.clone()
    clone
      .filter((particle, index) => !fn(particle, index))
      .forEach(particle => {
        particle.destroy()
      })
    return clone
  }
  getParticle(firstWordPath) {
    return this._getParticleByPath(firstWordPath)
  }
  getFrom(prefix) {
    const hit = this.filter(particle => particle.getLine().startsWith(prefix))[0]
    if (hit) return hit.getLine().substr((prefix + this.wordBreakSymbol).length)
  }
  get(firstWordPath) {
    const particle = this._getParticleByPath(firstWordPath)
    return particle === undefined ? undefined : particle.content
  }
  getOneOf(keys) {
    for (let i = 0; i < keys.length; i++) {
      const value = this.get(keys[i])
      if (value) return value
    }
    return ""
  }
  pick(fields) {
    const newParticle = new Particle(this.toString()) // todo: why not clone?
    const map = Utils.arrayToMap(fields)
    newParticle.particleAt(0).forEach(particle => {
      if (!map[particle.getWord(0)]) particle.destroy()
    })
    return newParticle
  }
  getParticlesByGlobPath(query) {
    return this._getParticlesByGlobPath(query)
  }
  _getParticlesByGlobPath(globPath) {
    const edgeSymbol = this.edgeSymbol
    if (!globPath.includes(edgeSymbol)) {
      if (globPath === "*") return this.getSubparticles()
      return this.filter(particle => particle.firstWord === globPath)
    }
    const parts = globPath.split(edgeSymbol)
    const current = parts.shift()
    const rest = parts.join(edgeSymbol)
    const matchingParticles = current === "*" ? this.getSubparticles() : this.filter(subparticle => subparticle.firstWord === current)
    return [].concat.apply(
      [],
      matchingParticles.map(particle => particle._getParticlesByGlobPath(rest))
    )
  }
  _getParticleByPath(firstWordPath) {
    const edgeSymbol = this.edgeSymbol
    if (!firstWordPath.includes(edgeSymbol)) {
      const index = this.indexOfLast(firstWordPath)
      return index === -1 ? undefined : this._particleAt(index)
    }
    const parts = firstWordPath.split(edgeSymbol)
    const current = parts.shift()
    const currentParticle = this._getSubparticlesArray()[this._getIndex()[current]]
    return currentParticle ? currentParticle._getParticleByPath(parts.join(edgeSymbol)) : undefined
  }
  get next() {
    if (this.isRoot()) return this
    const index = this.getIndex()
    const parent = this.parent
    const length = parent.length
    const next = index + 1
    return next === length ? parent._getSubparticlesArray()[0] : parent._getSubparticlesArray()[next]
  }
  get previous() {
    if (this.isRoot()) return this
    const index = this.getIndex()
    const parent = this.parent
    const length = parent.length
    const prev = index - 1
    return prev === -1 ? parent._getSubparticlesArray()[length - 1] : parent._getSubparticlesArray()[prev]
  }
  _getUnionNames() {
    if (!this.length) return []
    const obj = {}
    this.forEach(particle => {
      if (!particle.length) return undefined
      particle.forEach(particle => {
        obj[particle.firstWord] = 1
      })
    })
    return Object.keys(obj)
  }
  getAncestorParticlesByInheritanceViaExtendsKeyword(key) {
    const ancestorParticles = this._getAncestorParticles(
      (particle, id) => particle._getParticlesByColumn(0, id),
      particle => particle.get(key),
      this
    )
    ancestorParticles.push(this)
    return ancestorParticles
  }
  // Note: as you can probably tell by the name of this method, I don't recommend using this as it will likely be replaced by something better.
  getAncestorParticlesByInheritanceViaColumnIndices(thisColumnNumber, extendsColumnNumber) {
    const ancestorParticles = this._getAncestorParticles(
      (particle, id) => particle._getParticlesByColumn(thisColumnNumber, id),
      particle => particle.getWord(extendsColumnNumber),
      this
    )
    ancestorParticles.push(this)
    return ancestorParticles
  }
  _getAncestorParticles(getPotentialParentParticlesByIdFn, getParentIdFn, cannotContainParticle) {
    const parentId = getParentIdFn(this)
    if (!parentId) return []
    const potentialParentParticles = getPotentialParentParticlesByIdFn(this.parent, parentId)
    if (!potentialParentParticles.length) throw new Error(`"${this.getLine()} tried to extend "${parentId}" but "${parentId}" not found.`)
    if (potentialParentParticles.length > 1) throw new Error(`Invalid inheritance paths. Multiple unique ids found for "${parentId}"`)
    const parentParticle = potentialParentParticles[0]
    // todo: detect loops
    if (parentParticle === cannotContainParticle) throw new Error(`Loop detected between '${this.getLine()}' and '${parentParticle.getLine()}'`)
    const ancestorParticles = parentParticle._getAncestorParticles(getPotentialParentParticlesByIdFn, getParentIdFn, cannotContainParticle)
    ancestorParticles.push(parentParticle)
    return ancestorParticles
  }
  pathVectorToFirstWordPath(pathVector) {
    const path = pathVector.slice() // copy array
    const names = []
    let particle = this
    while (path.length) {
      if (!particle) return names
      names.push(particle.particleAt(path[0]).firstWord)
      particle = particle.particleAt(path.shift())
    }
    return names
  }
  toStringWithLineNumbers() {
    return this.toString()
      .split("\n")
      .map((line, index) => `${index + 1} ${line}`)
      .join("\n")
  }
  get asCsv() {
    return this.toDelimited(",")
  }
  _getTypes(header) {
    const matrix = this._getMatrix(header)
    const types = header.map(i => "int")
    matrix.forEach(row => {
      row.forEach((value, index) => {
        const type = types[index]
        if (type === "string") return 1
        if (value === undefined || value === "") return 1
        if (type === "float") {
          if (value.match(/^\-?[0-9]*\.?[0-9]*$/)) return 1
          types[index] = "string"
        }
        if (value.match(/^\-?[0-9]+$/)) return 1
        types[index] = "string"
      })
    })
    return types
  }
  toDataTable(header = this._getUnionNames()) {
    const types = this._getTypes(header)
    const parsers = {
      string: str => str,
      float: parseFloat,
      int: parseInt
    }
    const cellFn = (cellValue, rowIndex, columnIndex) => (rowIndex ? parsers[types[columnIndex]](cellValue) : cellValue)
    const arrays = this._toArrays(header, cellFn)
    arrays.rows.unshift(arrays.header)
    return arrays.rows
  }
  toDelimited(delimiter, header = this._getUnionNames(), escapeSpecialChars = true) {
    const regex = new RegExp(`(\\n|\\"|\\${delimiter})`)
    const cellFn = (str, row, column) => (!str.toString().match(regex) ? str : `"` + str.replace(/\"/g, `""`) + `"`)
    return this._toDelimited(delimiter, header, escapeSpecialChars ? cellFn : str => str)
  }
  _getMatrix(columns) {
    const matrix = []
    this.forEach(subparticle => {
      const row = []
      columns.forEach(col => {
        row.push(subparticle.get(col))
      })
      matrix.push(row)
    })
    return matrix
  }
  _toArrays(columnNames, cellFn) {
    const skipHeaderRow = 1
    const header = columnNames.map((columnName, index) => cellFn(columnName, 0, index))
    const rows = this.map((particle, rowNumber) =>
      columnNames.map((columnName, columnIndex) => {
        const subparticleParticle = particle.getParticle(columnName)
        const content = subparticleParticle ? subparticleParticle.contentWithSubparticles : ""
        return cellFn(content, rowNumber + skipHeaderRow, columnIndex)
      })
    )
    return {
      rows,
      header
    }
  }
  _toDelimited(delimiter, header, cellFn) {
    const data = this._toArrays(header, cellFn)
    return data.header.join(delimiter) + "\n" + data.rows.map(row => row.join(delimiter)).join("\n")
  }
  get asTable() {
    // Output a table for printing
    return this._toTable(100, false)
  }
  toFormattedTable(maxCharactersPerColumn, alignRight = false) {
    return this._toTable(maxCharactersPerColumn, alignRight)
  }
  _toTable(maxCharactersPerColumn, alignRight = false) {
    const header = this._getUnionNames()
    // Set initial column widths
    const widths = header.map(col => (col.length > maxCharactersPerColumn ? maxCharactersPerColumn : col.length))
    // Expand column widths if needed
    this.forEach(particle => {
      if (!particle.length) return true
      header.forEach((col, index) => {
        const cellValue = particle.get(col)
        if (!cellValue) return true
        const length = cellValue.toString().length
        if (length > widths[index]) widths[index] = length > maxCharactersPerColumn ? maxCharactersPerColumn : length
      })
    })
    const cellFn = (cellText, row, col) => {
      const width = widths[col]
      // Strip newlines in fixedWidth output
      const cellValue = cellText.toString().replace(/\n/g, "\\n")
      const cellLength = cellValue.length
      if (cellLength > width) return cellValue.substr(0, width) + "..."
      const padding = " ".repeat(width - cellLength)
      return alignRight ? padding + cellValue : cellValue + padding
    }
    return this._toDelimited(" ", header, cellFn)
  }
  get asSsv() {
    return this.toDelimited(" ")
  }
  get asOutline() {
    return this._toOutline(particle => particle.getLine())
  }
  toMappedOutline(particleFn) {
    return this._toOutline(particleFn)
  }
  // Adapted from: https://github.com/notatestuser/treeify.js
  _toOutline(particleFn) {
    const growBranch = (outlineParticle, last, lastStates, particleFn, callback) => {
      let lastStatesCopy = lastStates.slice(0)
      const particle = outlineParticle.particle
      if (lastStatesCopy.push([outlineParticle, last]) && lastStates.length > 0) {
        let line = ""
        // firstWordd on the "was last element" states of whatever we're nested within,
        // we need to append either blankness or a branch to our line
        lastStates.forEach((lastState, idx) => {
          if (idx > 0) line += lastState[1] ? " " : "│"
        })
        // the prefix varies firstWordd on whether the key contains something to show and
        // whether we're dealing with the last element in this collection
        // the extra "-" just makes things stand out more.
        line += (last ? "└" : "├") + particleFn(particle)
        callback(line)
      }
      if (!particle) return
      const length = particle.length
      let index = 0
      particle.forEach(particle => {
        let lastKey = ++index === length
        growBranch({ particle: particle }, lastKey, lastStatesCopy, particleFn, callback)
      })
    }
    let output = ""
    growBranch({ particle: this }, false, [], particleFn, line => (output += line + "\n"))
    return output
  }
  copyTo(particle, index) {
    return particle._insertLineAndSubparticles(this.getLine(), this.subparticlesToString(), index)
  }
  // Note: Splits using a positive lookahead
  // this.split("foo").join("\n") === this.toString()
  split(firstWord) {
    const constructor = this.constructor
    const ParticleBreakSymbol = this.particleBreakSymbol
    const WordBreakSymbol = this.wordBreakSymbol
    // todo: cleanup. the escaping is wierd.
    return this.toString()
      .split(new RegExp(`\\${ParticleBreakSymbol}(?=${firstWord}(?:${WordBreakSymbol}|\\${ParticleBreakSymbol}))`, "g"))
      .map(str => new constructor(str))
  }
  get asMarkdownTable() {
    return this.toMarkdownTableAdvanced(this._getUnionNames(), val => val)
  }
  toMarkdownTableAdvanced(columns, formatFn) {
    const matrix = this._getMatrix(columns)
    const empty = columns.map(col => "-")
    matrix.unshift(empty)
    matrix.unshift(columns)
    const lines = matrix.map((row, rowIndex) => {
      const formattedValues = row.map((val, colIndex) => formatFn(val, rowIndex, colIndex))
      return `|${formattedValues.join("|")}|`
    })
    return lines.join("\n")
  }
  get asTsv() {
    return this.toDelimited("\t")
  }
  get particleBreakSymbol() {
    return TN_NODE_BREAK_SYMBOL
  }
  get wordBreakSymbol() {
    return TN_WORD_BREAK_SYMBOL
  }
  get edgeSymbolRegex() {
    return new RegExp(this.edgeSymbol, "g")
  }
  get particleBreakSymbolRegex() {
    return new RegExp(this.particleBreakSymbol, "g")
  }
  get edgeSymbol() {
    return TN_EDGE_SYMBOL
  }
  _textToContentAndSubparticlesTuple(text) {
    const lines = text.split(this.particleBreakSymbolRegex)
    const firstLine = lines.shift()
    const subparticles = !lines.length
      ? undefined
      : lines
          .map(line => (line.substr(0, 1) === this.edgeSymbol ? line : this.edgeSymbol + line))
          .map(line => line.substr(1))
          .join(this.particleBreakSymbol)
    return [firstLine, subparticles]
  }
  _getLine() {
    return this._line
  }
  _setLine(line = "") {
    this._line = line
    if (this._words) delete this._words
    return this
  }
  _clearSubparticles() {
    this._deleteByIndexes(Utils.getRange(0, this.length))
    delete this._subparticles
    return this
  }
  _setSubparticles(content, circularCheckArray) {
    this._clearSubparticles()
    if (!content) return this
    // set from string
    if (typeof content === "string") {
      this._appendSubparticlesFromString(content)
      return this
    }
    // set from particle
    if (content instanceof Particle) {
      content.forEach(particle => this._insertLineAndSubparticles(particle.getLine(), particle.subparticlesToString()))
      return this
    }
    // If we set from object, create an array of inserted objects to avoid circular loops
    if (!circularCheckArray) circularCheckArray = [content]
    return this._setFromObject(content, circularCheckArray)
  }
  _setFromObject(content, circularCheckArray) {
    for (let firstWord in content) {
      if (!content.hasOwnProperty(firstWord)) continue
      // Branch the circularCheckArray, as we only have same branch circular arrays
      this._appendFromJavascriptObjectTuple(firstWord, content[firstWord], circularCheckArray.slice(0))
    }
    return this
  }
  // todo: refactor the below.
  _appendFromJavascriptObjectTuple(firstWord, content, circularCheckArray) {
    const type = typeof content
    let line
    let subparticles
    if (content === null) line = firstWord + " " + null
    else if (content === undefined) line = firstWord
    else if (type === "string") {
      const tuple = this._textToContentAndSubparticlesTuple(content)
      line = firstWord + " " + tuple[0]
      subparticles = tuple[1]
    } else if (type === "function") line = firstWord + " " + content.toString()
    else if (type !== "object") line = firstWord + " " + content
    else if (content instanceof Date) line = firstWord + " " + content.getTime().toString()
    else if (content instanceof Particle) {
      line = firstWord
      subparticles = new Particle(content.subparticlesToString(), content.getLine())
    } else if (circularCheckArray.indexOf(content) === -1) {
      circularCheckArray.push(content)
      line = firstWord
      const length = content instanceof Array ? content.length : Object.keys(content).length
      if (length) subparticles = new Particle()._setSubparticles(content, circularCheckArray)
    } else {
      // iirc this is return early from circular
      return
    }
    this._insertLineAndSubparticles(line, subparticles)
  }
  _insertLineAndSubparticles(line, subparticles, index = this.length) {
    const parser = this._getParser()._getParser(line, this)
    const newParticle = new parser(subparticles, line, this)
    const adjustedIndex = index < 0 ? this.length + index : index
    this._getSubparticlesArray().splice(adjustedIndex, 0, newParticle)
    if (this._index) this._makeIndex(adjustedIndex)
    this.clearQuickCache()
    return newParticle
  }
  _appendSubparticlesFromString(str) {
    const lines = str.split(this.particleBreakSymbolRegex)
    const parentStack = []
    let currentIndentCount = -1
    let lastParticle = this
    lines.forEach(line => {
      const indentCount = this._getIndentCount(line)
      if (indentCount > currentIndentCount) {
        currentIndentCount++
        parentStack.push(lastParticle)
      } else if (indentCount < currentIndentCount) {
        // pop things off stack
        while (indentCount < currentIndentCount) {
          parentStack.pop()
          currentIndentCount--
        }
      }
      const lineContent = line.substr(currentIndentCount)
      const parent = parentStack[parentStack.length - 1]
      const parser = parent._getParser()._getParser(lineContent, parent)
      lastParticle = new parser(undefined, lineContent, parent)
      parent._getSubparticlesArray().push(lastParticle)
    })
  }
  _getIndex() {
    // StringMap<int> {firstWord: index}
    // When there are multiple tails with the same firstWord, _index stores the last content.
    // todo: change the above behavior: when a collision occurs, create an array.
    return this._index || this._makeIndex()
  }
  getContentsArray() {
    return this.map(particle => particle.content)
  }
  getSubparticlesByParser(parser) {
    return this.filter(subparticle => subparticle instanceof parser)
  }
  getAncestorByParser(parser) {
    if (this instanceof parser) return this
    if (this.isRoot()) return undefined
    const parent = this.parent
    return parent instanceof parser ? parent : parent.getAncestorByParser(parser)
  }
  getParticleByParser(parser) {
    return this.find(subparticle => subparticle instanceof parser)
  }
  indexOfLast(firstWord) {
    const result = this._getIndex()[firstWord]
    return result === undefined ? -1 : result
  }
  // todo: renmae to indexOfFirst?
  indexOf(firstWord) {
    if (!this.has(firstWord)) return -1
    const length = this.length
    const particles = this._getSubparticlesArray()
    for (let index = 0; index < length; index++) {
      if (particles[index].firstWord === firstWord) return index
    }
  }
  // todo: rename this. it is a particular type of object.
  toObject() {
    return this._toObject()
  }
  getFirstWords() {
    return this.map(particle => particle.firstWord)
  }
  _makeIndex(startAt = 0) {
    if (!this._index || !startAt) this._index = {}
    const particles = this._getSubparticlesArray()
    const newIndex = this._index
    const length = particles.length
    for (let index = startAt; index < length; index++) {
      newIndex[particles[index].firstWord] = index
    }
    return newIndex
  }
  _subparticlesToXml(indentCount) {
    return this.map(particle => particle._toXml(indentCount)).join("")
  }
  _getIndentCount(str) {
    let level = 0
    const edgeChar = this.edgeSymbol
    while (str[level] === edgeChar) {
      level++
    }
    return level
  }
  clone(subparticles = this.subparticlesToString(), line = this.getLine()) {
    return new this.constructor(subparticles, line)
  }
  hasFirstWord(firstWord) {
    return this._hasFirstWord(firstWord)
  }
  has(firstWordPath) {
    const edgeSymbol = this.edgeSymbol
    if (!firstWordPath.includes(edgeSymbol)) return this.hasFirstWord(firstWordPath)
    const parts = firstWordPath.split(edgeSymbol)
    const next = this.getParticle(parts.shift())
    if (!next) return false
    return next.has(parts.join(edgeSymbol))
  }
  hasParticle(particle) {
    const needle = particle.toString()
    return this.getSubparticles().some(particle => particle.toString() === needle)
  }
  _hasFirstWord(firstWord) {
    return this._getIndex()[firstWord] !== undefined
  }
  map(fn) {
    return this.getSubparticles().map(fn)
  }
  filter(fn = item => item) {
    return this.getSubparticles().filter(fn)
  }
  find(fn) {
    return this.getSubparticles().find(fn)
  }
  findLast(fn) {
    return this.getSubparticles().reverse().find(fn)
  }
  every(fn) {
    let index = 0
    for (let particle of this.getTopDownArrayIterator()) {
      if (!fn(particle, index)) return false
      index++
    }
    return true
  }
  forEach(fn) {
    this.getSubparticles().forEach(fn)
    return this
  }
  // Recurse if predicate passes
  deepVisit(predicate) {
    this.forEach(particle => {
      if (predicate(particle) !== false) particle.deepVisit(predicate)
    })
  }
  get quickCache() {
    if (!this._quickCache) this._quickCache = {}
    return this._quickCache
  }
  getCustomIndex(key) {
    if (!this.quickCache.customIndexes) this.quickCache.customIndexes = {}
    const customIndexes = this.quickCache.customIndexes
    if (customIndexes[key]) return customIndexes[key]
    const customIndex = {}
    customIndexes[key] = customIndex
    this.filter(file => file.has(key)).forEach(file => {
      const value = file.get(key)
      if (!customIndex[value]) customIndex[value] = []
      customIndex[value].push(file)
    })
    return customIndex
  }
  clearQuickCache() {
    delete this._quickCache
  }
  // todo: protected?
  _clearIndex() {
    delete this._index
    this.clearQuickCache()
  }
  slice(start, end) {
    return this.getSubparticles().slice(start, end)
  }
  // todo: make 0 and 1 a param
  getInheritanceParticles() {
    const paths = {}
    const result = new Particle()
    this.forEach(particle => {
      const key = particle.getWord(0)
      const parentKey = particle.getWord(1)
      const parentPath = paths[parentKey]
      paths[key] = parentPath ? [parentPath, key].join(" ") : key
      result.touchParticle(paths[key])
    })
    return result
  }
  _getGrandParent() {
    return this.isRoot() || this.parent.isRoot() ? undefined : this.parent.parent
  }
  _getParser() {
    if (!Particle._parserCombinators.has(this.constructor)) Particle._parserCombinators.set(this.constructor, this.createParserCombinator())
    return Particle._parserCombinators.get(this.constructor)
  }
  createParserCombinator() {
    return new ParserCombinator(this.constructor)
  }
  static _makeUniqueId() {
    if (this._uniqueId === undefined) this._uniqueId = 0
    this._uniqueId++
    return this._uniqueId
  }
  static _getFileFormat(path) {
    const format = path.split(".").pop()
    return FileFormat[format] ? format : FileFormat.particles
  }
  getLineModifiedTime() {
    return this._lineModifiedTime || this._particleCreationTime
  }
  getChildArrayModifiedTime() {
    return this._subparticleArrayModifiedTime || this._particleCreationTime
  }
  _setChildArrayMofifiedTime(value) {
    this._subparticleArrayModifiedTime = value
    return this
  }
  getLineOrSubparticlesModifiedTime() {
    return Math.max(
      this.getLineModifiedTime(),
      this.getChildArrayModifiedTime(),
      Math.max.apply(
        null,
        this.map(subparticle => subparticle.getLineOrSubparticlesModifiedTime())
      )
    )
  }
  _setVirtualParentParticle(particle) {
    this._virtualParentParticle = particle
    return this
  }
  _getVirtualParentParticle() {
    return this._virtualParentParticle
  }
  _setVirtualAncestorParticlesByInheritanceViaColumnIndicesAndThenExpand(particles, thisIdColumnNumber, extendsIdColumnNumber) {
    const map = {}
    for (let particle of particles) {
      const particleId = particle.getWord(thisIdColumnNumber)
      if (map[particleId]) throw new Error(`Tried to define a particle with id "${particleId}" but one is already defined.`)
      map[particleId] = {
        particleId: particleId,
        particle: particle,
        parentId: particle.getWord(extendsIdColumnNumber)
      }
    }
    // Add parent Particles
    Object.values(map).forEach(particleInfo => {
      const parentId = particleInfo.parentId
      const parentParticle = map[parentId]
      if (parentId && !parentParticle) throw new Error(`Particle "${particleInfo.particleId}" tried to extend "${parentId}" but "${parentId}" not found.`)
      if (parentId) particleInfo.particle._setVirtualParentParticle(parentParticle.particle)
    })
    particles.forEach(particle => particle._expandFromVirtualParentParticle())
    return this
  }
  _expandFromVirtualParentParticle() {
    if (this._isVirtualExpanded) return this
    this._isExpanding = true
    let parentParticle = this._getVirtualParentParticle()
    if (parentParticle) {
      if (parentParticle._isExpanding) throw new Error(`Loop detected: '${this.getLine()}' is the ancestor of one of its ancestors.`)
      parentParticle._expandFromVirtualParentParticle()
      const clone = this.clone()
      this._setSubparticles(parentParticle.subparticlesToString())
      this.extend(clone)
    }
    this._isExpanding = false
    this._isVirtualExpanded = true
  }
  // todo: solve issue related to whether extend should overwrite or append.
  _expandSubparticles(thisIdColumnNumber, extendsIdColumnNumber, subparticlesThatNeedExpanding = this.getSubparticles()) {
    return this._setVirtualAncestorParticlesByInheritanceViaColumnIndicesAndThenExpand(subparticlesThatNeedExpanding, thisIdColumnNumber, extendsIdColumnNumber)
  }
  // todo: add more testing.
  // todo: solve issue with where extend should overwrite or append
  // todo: should take a parsers? to decide whether to overwrite or append.
  // todo: this is slow.
  extend(particleOrStr) {
    const particle = particleOrStr instanceof Particle ? particleOrStr : new Particle(particleOrStr)
    const usedFirstWords = new Set()
    particle.forEach(sourceParticle => {
      const firstWord = sourceParticle.firstWord
      let targetParticle
      const isAnArrayNotMap = usedFirstWords.has(firstWord)
      if (!this.has(firstWord)) {
        usedFirstWords.add(firstWord)
        this.appendLineAndSubparticles(sourceParticle.getLine(), sourceParticle.subparticlesToString())
        return true
      }
      if (isAnArrayNotMap) targetParticle = this.appendLine(sourceParticle.getLine())
      else {
        targetParticle = this.touchParticle(firstWord).setContent(sourceParticle.content)
        usedFirstWords.add(firstWord)
      }
      if (sourceParticle.length) targetParticle.extend(sourceParticle)
    })
    return this
  }
  lastParticle() {
    return this.getSubparticles()[this.length - 1]
  }
  expandLastFromTopMatter() {
    const clone = this.clone()
    const map = new Map()
    const lastParticle = clone.lastParticle()
    lastParticle.getOlderSiblings().forEach(particle => map.set(particle.getWord(0), particle))
    lastParticle.topDownArray.forEach(particle => {
      const replacement = map.get(particle.getWord(0))
      if (!replacement) return
      particle.replaceParticle(str => replacement.toString())
    })
    return lastParticle
  }
  macroExpand(macroDefinitionWord, macroUsageWord) {
    const clone = this.clone()
    const defs = clone.findParticles(macroDefinitionWord)
    const allUses = clone.findParticles(macroUsageWord)
    const wordBreakSymbol = clone.wordBreakSymbol
    defs.forEach(def => {
      const macroName = def.getWord(1)
      const uses = allUses.filter(particle => particle.hasWord(1, macroName))
      const params = def.getWordsFrom(2)
      const replaceFn = str => {
        const paramValues = str.split(wordBreakSymbol).slice(2)
        let newParticle = def.subparticlesToString()
        params.forEach((param, index) => {
          newParticle = newParticle.replace(new RegExp(param, "g"), paramValues[index])
        })
        return newParticle
      }
      uses.forEach(particle => {
        particle.replaceParticle(replaceFn)
      })
      def.destroy()
    })
    return clone
  }
  setSubparticles(subparticles) {
    return this._setSubparticles(subparticles)
  }
  _updateLineModifiedTimeAndTriggerEvent() {
    this._lineModifiedTime = this._getProcessTimeInMilliseconds()
  }
  insertWord(index, word) {
    const wi = this.wordBreakSymbol
    const words = this._getLine().split(wi)
    words.splice(index, 0, word)
    this.setLine(words.join(wi))
    return this
  }
  deleteDuplicates() {
    const set = new Set()
    this.topDownArray.forEach(particle => {
      const str = particle.toString()
      if (set.has(str)) particle.destroy()
      else set.add(str)
    })
    return this
  }
  setWord(index, word) {
    const wi = this.wordBreakSymbol
    const words = this._getLine().split(wi)
    words[index] = word
    this.setLine(words.join(wi))
    return this
  }
  deleteSubparticles() {
    return this._clearSubparticles()
  }
  setContent(content) {
    if (content === this.content) return this
    const newArray = [this.firstWord]
    if (content !== undefined) {
      content = content.toString()
      if (content.match(this.particleBreakSymbol)) return this.setContentWithSubparticles(content)
      newArray.push(content)
    }
    this._setLine(newArray.join(this.wordBreakSymbol))
    this._updateLineModifiedTimeAndTriggerEvent()
    return this
  }
  prependSibling(line, subparticles) {
    return this.parent.insertLineAndSubparticles(line, subparticles, this.getIndex())
  }
  appendSibling(line, subparticles) {
    return this.parent.insertLineAndSubparticles(line, subparticles, this.getIndex() + 1)
  }
  setContentWithSubparticles(text) {
    // todo: deprecate
    if (!text.includes(this.particleBreakSymbol)) {
      this._clearSubparticles()
      return this.setContent(text)
    }
    const lines = text.split(this.particleBreakSymbolRegex)
    const firstLine = lines.shift()
    this.setContent(firstLine)
    // tood: cleanup.
    const remainingString = lines.join(this.particleBreakSymbol)
    const subparticles = new Particle(remainingString)
    if (!remainingString) subparticles.appendLine("")
    this.setSubparticles(subparticles)
    return this
  }
  setFirstWord(firstWord) {
    return this.setWord(0, firstWord)
  }
  setLine(line) {
    if (line === this.getLine()) return this
    // todo: clear parent TMTimes
    this.parent._clearIndex()
    this._setLine(line)
    this._updateLineModifiedTimeAndTriggerEvent()
    return this
  }
  duplicate() {
    return this.parent._insertLineAndSubparticles(this.getLine(), this.subparticlesToString(), this.getIndex() + 1)
  }
  trim() {
    // todo: could do this so only the trimmed rows are deleted.
    this.setSubparticles(this.subparticlesToString().trim())
    return this
  }
  destroy() {
    this.parent._deleteParticle(this)
  }
  set(firstWordPath, text) {
    return this.touchParticle(firstWordPath).setContentWithSubparticles(text)
  }
  setFromText(text) {
    if (this.toString() === text) return this
    const tuple = this._textToContentAndSubparticlesTuple(text)
    this.setLine(tuple[0])
    return this._setSubparticles(tuple[1])
  }
  setPropertyIfMissing(prop, value) {
    if (this.has(prop)) return true
    return this.touchParticle(prop).setContent(value)
  }
  setProperties(propMap) {
    const props = Object.keys(propMap)
    const values = Object.values(propMap)
    // todo: is there a built in particle method to do this?
    props.forEach((prop, index) => {
      const value = values[index]
      if (!value) return true
      if (this.get(prop) === value) return true
      this.touchParticle(prop).setContent(value)
    })
    return this
  }
  // todo: throw error if line contains a \n
  appendLine(line) {
    return this._insertLineAndSubparticles(line)
  }
  appendUniqueLine(line) {
    if (!this.hasLine(line)) return this.appendLine(line)
    return this.findLine(line)
  }
  appendLineAndSubparticles(line, subparticles) {
    return this._insertLineAndSubparticles(line, subparticles)
  }
  getParticlesByRegex(regex) {
    const matches = []
    regex = regex instanceof RegExp ? [regex] : regex
    this._getParticlesByLineRegex(matches, regex)
    return matches
  }
  // todo: remove?
  getParticlesByLinePrefixes(columns) {
    const matches = []
    this._getParticlesByLineRegex(
      matches,
      columns.map(str => new RegExp("^" + str))
    )
    return matches
  }
  particlesThatStartWith(prefix) {
    return this.filter(particle => particle.getLine().startsWith(prefix))
  }
  _getParticlesByLineRegex(matches, regs) {
    const rgs = regs.slice(0)
    const reg = rgs.shift()
    const candidates = this.filter(subparticle => subparticle.getLine().match(reg))
    if (!rgs.length) return candidates.forEach(cand => matches.push(cand))
    candidates.forEach(cand => cand._getParticlesByLineRegex(matches, rgs))
  }
  concat(particle) {
    if (typeof particle === "string") particle = new Particle(particle)
    return particle.map(particle => this._insertLineAndSubparticles(particle.getLine(), particle.subparticlesToString()))
  }
  _deleteByIndexes(indexesToDelete) {
    if (!indexesToDelete.length) return this
    this._clearIndex()
    // note: assumes indexesToDelete is in ascending order
    const deletedParticles = indexesToDelete.reverse().map(index => this._getSubparticlesArray().splice(index, 1)[0])
    this._setChildArrayMofifiedTime(this._getProcessTimeInMilliseconds())
    return this
  }
  _deleteParticle(particle) {
    const index = this._indexOfParticle(particle)
    return index > -1 ? this._deleteByIndexes([index]) : 0
  }
  reverse() {
    this._clearIndex()
    this._getSubparticlesArray().reverse()
    return this
  }
  shift() {
    if (!this.length) return null
    const particle = this._getSubparticlesArray().shift()
    return particle.copyTo(new this.constructor(), 0)
  }
  sort(fn) {
    this._getSubparticlesArray().sort(fn)
    this._clearIndex()
    return this
  }
  invert() {
    this.forEach(particle => particle.words.reverse())
    return this
  }
  _rename(oldFirstWord, newFirstWord) {
    const index = this.indexOf(oldFirstWord)
    if (index === -1) return this
    const particle = this._getSubparticlesArray()[index]
    particle.setFirstWord(newFirstWord)
    this._clearIndex()
    return this
  }
  // Does not recurse.
  remap(map) {
    this.forEach(particle => {
      const firstWord = particle.firstWord
      if (map[firstWord] !== undefined) particle.setFirstWord(map[firstWord])
    })
    return this
  }
  rename(oldFirstWord, newFirstWord) {
    this._rename(oldFirstWord, newFirstWord)
    return this
  }
  renameAll(oldName, newName) {
    this.findParticles(oldName).forEach(particle => particle.setFirstWord(newName))
    return this
  }
  _deleteAllChildParticlesWithFirstWord(firstWord) {
    if (!this.has(firstWord)) return this
    const allParticles = this._getSubparticlesArray()
    const indexesToDelete = []
    allParticles.forEach((particle, index) => {
      if (particle.firstWord === firstWord) indexesToDelete.push(index)
    })
    return this._deleteByIndexes(indexesToDelete)
  }
  delete(path = "") {
    const edgeSymbol = this.edgeSymbol
    if (!path.includes(edgeSymbol)) return this._deleteAllChildParticlesWithFirstWord(path)
    const parts = path.split(edgeSymbol)
    const nextFirstWord = parts.pop()
    const targetParticle = this.getParticle(parts.join(edgeSymbol))
    return targetParticle ? targetParticle._deleteAllChildParticlesWithFirstWord(nextFirstWord) : 0
  }
  deleteColumn(firstWord = "") {
    this.forEach(particle => particle.delete(firstWord))
    return this
  }
  _getNonMaps() {
    const results = this.topDownArray.filter(particle => particle.hasDuplicateFirstWords())
    if (this.hasDuplicateFirstWords()) results.unshift(this)
    return results
  }
  replaceParticle(fn) {
    const parent = this.parent
    const index = this.getIndex()
    const newParticles = new Particle(fn(this.toString()))
    const returnedParticles = []
    newParticles.forEach((subparticle, subparticleIndex) => {
      const newParticle = parent.insertLineAndSubparticles(subparticle.getLine(), subparticle.subparticlesToString(), index + subparticleIndex)
      returnedParticles.push(newParticle)
    })
    this.destroy()
    return returnedParticles
  }
  insertLineAndSubparticles(line, subparticles, index) {
    return this._insertLineAndSubparticles(line, subparticles, index)
  }
  insertLine(line, index) {
    return this._insertLineAndSubparticles(line, undefined, index)
  }
  prependLine(line) {
    return this.insertLine(line, 0)
  }
  pushContentAndSubparticles(content, subparticles) {
    let index = this.length
    while (this.has(index.toString())) {
      index++
    }
    const line = index.toString() + (content === undefined ? "" : this.wordBreakSymbol + content)
    return this.appendLineAndSubparticles(line, subparticles)
  }
  deleteBlanks() {
    this.getSubparticles()
      .filter(particle => particle.isBlankLine())
      .forEach(particle => particle.destroy())
    return this
  }
  // todo: add "globalReplace" method? Which runs a global regex or string replace on the Particle as a string?
  firstWordSort(firstWordOrder) {
    return this._firstWordSort(firstWordOrder)
  }
  deleteWordAt(wordIndex) {
    const words = this.words
    words.splice(wordIndex, 1)
    return this.setWords(words)
  }
  trigger(event) {
    if (this._listeners && this._listeners.has(event.constructor)) {
      const listeners = this._listeners.get(event.constructor)
      const listenersToRemove = []
      for (let index = 0; index < listeners.length; index++) {
        const listener = listeners[index]
        if (listener(event) === true) listenersToRemove.push(index)
      }
      listenersToRemove.reverse().forEach(index => listenersToRemove.splice(index, 1))
    }
  }
  triggerAncestors(event) {
    if (this.isRoot()) return
    const parent = this.parent
    parent.trigger(event)
    parent.triggerAncestors(event)
  }
  onLineChanged(eventHandler) {
    return this._addEventListener(LineChangedParticleEvent, eventHandler)
  }
  onDescendantChanged(eventHandler) {
    return this._addEventListener(DescendantChangedParticleEvent, eventHandler)
  }
  onChildAdded(eventHandler) {
    return this._addEventListener(ChildAddedParticleEvent, eventHandler)
  }
  onChildRemoved(eventHandler) {
    return this._addEventListener(ChildRemovedParticleEvent, eventHandler)
  }
  _addEventListener(eventClass, eventHandler) {
    if (!this._listeners) this._listeners = new Map()
    if (!this._listeners.has(eventClass)) this._listeners.set(eventClass, [])
    this._listeners.get(eventClass).push(eventHandler)
    return this
  }
  setWords(words) {
    return this.setLine(words.join(this.wordBreakSymbol))
  }
  setWordsFrom(index, words) {
    this.setWords(this.words.slice(0, index).concat(words))
    return this
  }
  appendWord(word) {
    const words = this.words
    words.push(word)
    return this.setWords(words)
  }
  _firstWordSort(firstWordOrder, secondarySortFn) {
    const particleAFirst = -1
    const particleBFirst = 1
    const map = {}
    firstWordOrder.forEach((word, index) => {
      map[word] = index
    })
    this.sort((particleA, particleB) => {
      const valA = map[particleA.firstWord]
      const valB = map[particleB.firstWord]
      if (valA > valB) return particleBFirst
      if (valA < valB) return particleAFirst
      return secondarySortFn ? secondarySortFn(particleA, particleB) : 0
    })
    return this
  }
  _touchParticle(firstWordPathArray) {
    let contextParticle = this
    firstWordPathArray.forEach(firstWord => {
      contextParticle = contextParticle.getParticle(firstWord) || contextParticle.appendLine(firstWord)
    })
    return contextParticle
  }
  _touchParticleByString(str) {
    str = str.replace(this.particleBreakSymbolRegex, "") // todo: do we want to do this sanitization?
    return this._touchParticle(str.split(this.wordBreakSymbol))
  }
  touchParticle(str) {
    return this._touchParticleByString(str)
  }
  appendParticle(particle) {
    return this.appendLineAndSubparticles(particle.getLine(), particle.subparticlesToString())
  }
  hasLine(line) {
    return this.getSubparticles().some(particle => particle.getLine() === line)
  }
  findLine(line) {
    return this.getSubparticles().find(particle => particle.getLine() === line)
  }
  getParticlesByLine(line) {
    return this.filter(particle => particle.getLine() === line)
  }
  toggleLine(line) {
    const lines = this.getParticlesByLine(line)
    if (lines.length) {
      lines.map(line => line.destroy())
      return this
    }
    return this.appendLine(line)
  }
  // todo: remove?
  sortByColumns(indexOrIndices) {
    const indices = indexOrIndices instanceof Array ? indexOrIndices : [indexOrIndices]
    const length = indices.length
    this.sort((particleA, particleB) => {
      const wordsA = particleA.words
      const wordsB = particleB.words
      for (let index = 0; index < length; index++) {
        const col = indices[index]
        const av = wordsA[col]
        const bv = wordsB[col]
        if (av === undefined) return -1
        if (bv === undefined) return 1
        if (av > bv) return 1
        else if (av < bv) return -1
      }
      return 0
    })
    return this
  }
  getWordsAsSet() {
    return new Set(this.getWordsFrom(1))
  }
  appendWordIfMissing(word) {
    if (this.getWordsAsSet().has(word)) return this
    return this.appendWord(word)
  }
  // todo: check to ensure identical objects
  addObjectsAsDelimited(arrayOfObjects, delimiter = Utils._chooseDelimiter(new Particle(arrayOfObjects).toString())) {
    const header = Object.keys(arrayOfObjects[0])
      .join(delimiter)
      .replace(/[\n\r]/g, "")
    const rows = arrayOfObjects.map(item =>
      Object.values(item)
        .join(delimiter)
        .replace(/[\n\r]/g, "")
    )
    return this.addUniqueRowsToNestedDelimited(header, rows)
  }
  setSubparticlesAsDelimited(particle, delimiter = Utils._chooseDelimiter(particle.toString())) {
    particle = particle instanceof Particle ? particle : new Particle(particle)
    return this.setSubparticles(particle.toDelimited(delimiter))
  }
  convertSubparticlesToDelimited(delimiter = Utils._chooseDelimiter(this.subparticlesToString())) {
    // todo: handle newlines!!!
    return this.setSubparticles(this.toDelimited(delimiter))
  }
  addUniqueRowsToNestedDelimited(header, rowsAsStrings) {
    if (!this.length) this.appendLine(header)
    // todo: this looks brittle
    rowsAsStrings.forEach(row => {
      if (!this.toString().includes(row)) this.appendLine(row)
    })
    return this
  }
  shiftLeft() {
    const grandParent = this._getGrandParent()
    if (!grandParent) return this
    const parentIndex = this.parent.getIndex()
    const newParticle = grandParent.insertLineAndSubparticles(this.getLine(), this.length ? this.subparticlesToString() : undefined, parentIndex + 1)
    this.destroy()
    return newParticle
  }
  pasteText(text) {
    const parent = this.parent
    const index = this.getIndex()
    const newParticles = new Particle(text)
    const firstParticle = newParticles.particleAt(0)
    if (firstParticle) {
      this.setLine(firstParticle.getLine())
      if (firstParticle.length) this.setSubparticles(firstParticle.subparticlesToString())
    } else {
      this.setLine("")
    }
    newParticles.forEach((subparticle, subparticleIndex) => {
      if (!subparticleIndex)
        // skip first
        return true
      parent.insertLineAndSubparticles(subparticle.getLine(), subparticle.subparticlesToString(), index + subparticleIndex)
    })
    return this
  }
  templateToString(obj) {
    // todo: compile/cache for perf?
    const particle = this.clone()
    particle.topDownArray.forEach(particle => {
      const line = particle.getLine().replace(/{([^\}]+)}/g, (match, path) => {
        const replacement = obj[path]
        if (replacement === undefined) throw new Error(`In string template no match found on line "${particle.getLine()}"`)
        return replacement
      })
      particle.pasteText(line)
    })
    return particle.toString()
  }
  shiftRight() {
    const olderSibling = this._getClosestOlderSibling()
    if (!olderSibling) return this
    const newParticle = olderSibling.appendLineAndSubparticles(this.getLine(), this.length ? this.subparticlesToString() : undefined)
    this.destroy()
    return newParticle
  }
  shiftYoungerSibsRight() {
    const particles = this.getYoungerSiblings()
    particles.forEach(particle => particle.shiftRight())
    return this
  }
  sortBy(nameOrNames) {
    const names = nameOrNames instanceof Array ? nameOrNames : [nameOrNames]
    const length = names.length
    this.sort((particleA, particleB) => {
      if (!particleB.length && !particleA.length) return 0
      else if (!particleA.length) return -1
      else if (!particleB.length) return 1
      for (let index = 0; index < length; index++) {
        const firstWord = names[index]
        const av = particleA.get(firstWord)
        const bv = particleB.get(firstWord)
        if (av > bv) return 1
        else if (av < bv) return -1
      }
      return 0
    })
    return this
  }
  selectParticle() {
    this._selected = true
  }
  unselectParticle() {
    delete this._selected
  }
  isSelected() {
    return !!this._selected
  }
  async saveVersion() {
    const newVersion = this.toString()
    const topUndoVersion = this._getTopUndoVersion()
    if (newVersion === topUndoVersion) return undefined
    this._recordChange(newVersion)
    this._setSavedVersion(this.toString())
    return this
  }
  hasUnsavedChanges() {
    return this.toString() !== this._getSavedVersion()
  }
  async redo() {
    const undoStack = this._getUndoStack()
    const redoStack = this._getRedoStack()
    if (!redoStack.length) return undefined
    undoStack.push(redoStack.pop())
    return this._reloadFromUndoTop()
  }
  async undo() {
    const undoStack = this._getUndoStack()
    const redoStack = this._getRedoStack()
    if (undoStack.length === 1) return undefined
    redoStack.push(undoStack.pop())
    return this._reloadFromUndoTop()
  }
  _getSavedVersion() {
    return this._savedVersion
  }
  _setSavedVersion(str) {
    this._savedVersion = str
    return this
  }
  _clearRedoStack() {
    const redoStack = this._getRedoStack()
    redoStack.splice(0, redoStack.length)
  }
  getChangeHistory() {
    return this._getUndoStack().slice(0)
  }
  _getUndoStack() {
    if (!this._undoStack) this._undoStack = []
    return this._undoStack
  }
  _getRedoStack() {
    if (!this._redoStack) this._redoStack = []
    return this._redoStack
  }
  _getTopUndoVersion() {
    const undoStack = this._getUndoStack()
    return undoStack[undoStack.length - 1]
  }
  async _reloadFromUndoTop() {
    this.setSubparticles(this._getTopUndoVersion())
  }
  _recordChange(newVersion) {
    this._clearRedoStack()
    this._getUndoStack().push(newVersion) // todo: use diffs?
  }
  static fromCsv(str) {
    return this.fromDelimited(str, ",", '"')
  }
  // todo: jeez i think we can come up with a better name than "JsonSubset"
  static fromJsonSubset(str) {
    return new Particle(JSON.parse(str))
  }
  static serializedParticleToParticle(particle) {
    const language = new Particle()
    const cellDelimiter = language.wordBreakSymbol
    const particleDelimiter = language.particleBreakSymbol
    const line = particle.cells ? particle.cells.join(cellDelimiter) : undefined
    const newParticle = new Particle(undefined, line)
    if (particle.subparticles)
      particle.subparticles.forEach(subparticle => {
        newParticle.appendParticle(this.serializedParticleToParticle(subparticle))
      })
    return newParticle
  }
  static fromJson(str) {
    return this.serializedParticleToParticle(JSON.parse(str))
  }
  static fromGridJson(str) {
    const lines = JSON.parse(str)
    const language = new Particle()
    const cellDelimiter = language.wordBreakSymbol
    const particleDelimiter = language.particleBreakSymbol
    return new Particle(lines.map(line => line.join(cellDelimiter)).join(particleDelimiter))
  }
  static fromSsv(str) {
    return this.fromDelimited(str, " ", '"')
  }
  static fromTsv(str) {
    return this.fromDelimited(str, "\t", '"')
  }
  static fromDelimited(str, delimiter, quoteChar = '"') {
    str = str.replace(/\r/g, "") // remove windows newlines if present
    const rows = this._getEscapedRows(str, delimiter, quoteChar)
    return this._rowsToParticle(rows, delimiter, true)
  }
  static _getEscapedRows(str, delimiter, quoteChar) {
    return str.includes(quoteChar) ? this._strToRows(str, delimiter, quoteChar) : str.split("\n").map(line => line.split(delimiter))
  }
  static fromDelimitedNoHeaders(str, delimiter, quoteChar) {
    str = str.replace(/\r/g, "") // remove windows newlines if present
    const rows = this._getEscapedRows(str, delimiter, quoteChar)
    return this._rowsToParticle(rows, delimiter, false)
  }
  static _strToRows(str, delimiter, quoteChar, newLineChar = "\n") {
    const rows = [[]]
    const newLine = "\n"
    const length = str.length
    let currentCell = ""
    let inQuote = str.substr(0, 1) === quoteChar
    let currentPosition = inQuote ? 1 : 0
    let nextChar
    let isLastChar
    let currentRow = 0
    let char
    let isNextCharAQuote
    while (currentPosition < length) {
      char = str[currentPosition]
      isLastChar = currentPosition + 1 === length
      nextChar = str[currentPosition + 1]
      isNextCharAQuote = nextChar === quoteChar
      if (inQuote) {
        if (char !== quoteChar) currentCell += char
        else if (isNextCharAQuote) {
          // Both the current and next char are ", so the " is escaped
          currentCell += nextChar
          currentPosition++ // Jump 2
        } else {
          // If the current char is a " and the next char is not, it's the end of the quotes
          inQuote = false
          if (isLastChar) rows[currentRow].push(currentCell)
        }
      } else {
        if (char === delimiter) {
          rows[currentRow].push(currentCell)
          currentCell = ""
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (char === newLine) {
          rows[currentRow].push(currentCell)
          currentCell = ""
          currentRow++
          if (nextChar) rows[currentRow] = []
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (isLastChar) rows[currentRow].push(currentCell + char)
        else currentCell += char
      }
      currentPosition++
    }
    return rows
  }
  static multiply(particleA, particleB) {
    const productParticle = particleA.clone()
    productParticle.forEach((particle, index) => {
      particle.setSubparticles(particle.length ? this.multiply(particle, particleB) : particleB.clone())
    })
    return productParticle
  }
  // Given an array return a particle
  static _rowsToParticle(rows, delimiter, hasHeaders) {
    const numberOfColumns = rows[0].length
    const particle = new Particle()
    const names = this._getHeader(rows, hasHeaders)
    const rowCount = rows.length
    for (let rowIndex = hasHeaders ? 1 : 0; rowIndex < rowCount; rowIndex++) {
      let row = rows[rowIndex]
      // If the row contains too many columns, shift the extra columns onto the last one.
      // This allows you to not have to escape delimiter characters in the final column.
      if (row.length > numberOfColumns) {
        row[numberOfColumns - 1] = row.slice(numberOfColumns - 1).join(delimiter)
        row = row.slice(0, numberOfColumns)
      } else if (row.length < numberOfColumns) {
        // If the row is missing columns add empty columns until it is full.
        // This allows you to make including delimiters for empty ending columns in each row optional.
        while (row.length < numberOfColumns) {
          row.push("")
        }
      }
      const obj = {}
      row.forEach((cellValue, index) => {
        obj[names[index]] = cellValue
      })
      particle.pushContentAndSubparticles(undefined, obj)
    }
    return particle
  }
  static _initializeXmlParser() {
    if (this._xmlParser) return
    const windowObj = window
    if (typeof windowObj.DOMParser !== "undefined") this._xmlParser = xmlStr => new windowObj.DOMParser().parseFromString(xmlStr, "text/xml")
    else if (typeof windowObj.ActiveXObject !== "undefined" && new windowObj.ActiveXObject("Microsoft.XMLDOM")) {
      this._xmlParser = xmlStr => {
        const xmlDoc = new windowObj.ActiveXObject("Microsoft.XMLDOM")
        xmlDoc.async = "false"
        xmlDoc.loadXML(xmlStr)
        return xmlDoc
      }
    } else throw new Error("No XML parser found")
  }
  static fromXml(str) {
    this._initializeXmlParser()
    const xml = this._xmlParser(str)
    try {
      return this._particleFromXml(xml).getParticle("subparticles")
    } catch (err) {
      return this._particleFromXml(this._parseXml2(str)).getParticle("subparticles")
    }
  }
  static _zipObject(keys, values) {
    const obj = {}
    keys.forEach((key, index) => (obj[key] = values[index]))
    return obj
  }
  static fromShape(shapeArr, rootParticle = new Particle()) {
    const part = shapeArr.shift()
    if (part !== undefined) {
      for (let index = 0; index < part; index++) {
        rootParticle.appendLine(index.toString())
      }
    }
    if (shapeArr.length) rootParticle.forEach(particle => Particle.fromShape(shapeArr.slice(0), particle))
    return rootParticle
  }
  static fromDataTable(table) {
    const header = table.shift()
    return new Particle(table.map(row => this._zipObject(header, row)))
  }
  static _parseXml2(str) {
    const el = document.createElement("div")
    el.innerHTML = str
    return el
  }
  // todo: cleanup typings
  static _particleFromXml(xml) {
    const result = new Particle()
    const subparticles = new Particle()
    // Set attributes
    if (xml.attributes) {
      for (let index = 0; index < xml.attributes.length; index++) {
        result.set(xml.attributes[index].name, xml.attributes[index].value)
      }
    }
    if (xml.data) subparticles.pushContentAndSubparticles(xml.data)
    // Set content
    if (xml.childNodes && xml.childNodes.length > 0) {
      for (let index = 0; index < xml.childNodes.length; index++) {
        const child = xml.childNodes[index]
        if (child.tagName && child.tagName.match(/parsererror/i)) throw new Error("Parse Error")
        if (child.childNodes.length > 0 && child.tagName) subparticles.appendLineAndSubparticles(child.tagName, this._particleFromXml(child))
        else if (child.tagName) subparticles.appendLine(child.tagName)
        else if (child.data) {
          const data = child.data.trim()
          if (data) subparticles.pushContentAndSubparticles(data)
        }
      }
    }
    if (subparticles.length > 0) result.touchParticle("subparticles").setSubparticles(subparticles)
    return result
  }
  static _getHeader(rows, hasHeaders) {
    const numberOfColumns = rows[0].length
    const headerRow = hasHeaders ? rows[0] : []
    const WordBreakSymbol = " "
    const ziRegex = new RegExp(WordBreakSymbol, "g")
    if (hasHeaders) {
      // Strip any WordBreakSymbols from column names in the header row.
      // This makes the mapping not quite 1 to 1 if there are any WordBreakSymbols in names.
      for (let index = 0; index < numberOfColumns; index++) {
        headerRow[index] = headerRow[index].replace(ziRegex, "")
      }
    } else {
      // If str has no headers, create them as 0,1,2,3
      for (let index = 0; index < numberOfColumns; index++) {
        headerRow.push(index.toString())
      }
    }
    return headerRow
  }
  static nest(str, xValue) {
    const ParticleBreakSymbol = TN_NODE_BREAK_SYMBOL
    const WordBreakSymbol = TN_WORD_BREAK_SYMBOL
    const indent = ParticleBreakSymbol + WordBreakSymbol.repeat(xValue)
    return str ? indent + str.replace(/\n/g, indent) : ""
  }
  static fromDisk(path) {
    const format = this._getFileFormat(path)
    const content = require("fs").readFileSync(path, "utf8")
    const methods = {
      particles: content => new Particle(content),
      csv: content => this.fromCsv(content),
      tsv: content => this.fromTsv(content)
    }
    if (!methods[format]) throw new Error(`No support for '${format}'`)
    return methods[format](content)
  }
  static fromFolder(folderPath, filepathPredicate = filepath => filepath !== ".DS_Store") {
    const path = require("path")
    const fs = require("fs")
    const particle = new Particle()
    const files = fs
      .readdirSync(folderPath)
      .map(filename => path.join(folderPath, filename))
      .filter(filepath => !fs.statSync(filepath).isDirectory() && filepathPredicate(filepath))
      .forEach(filePath => particle.appendLineAndSubparticles(filePath, fs.readFileSync(filePath, "utf8")))
    return particle
  }
}
Particle._parserCombinators = new Map()
Particle.ParserCombinator = ParserCombinator
Particle.iris = `sepal_length,sepal_width,petal_length,petal_width,species
6.1,3,4.9,1.8,virginica
5.6,2.7,4.2,1.3,versicolor
5.6,2.8,4.9,2,virginica
6.2,2.8,4.8,1.8,virginica
7.7,3.8,6.7,2.2,virginica
5.3,3.7,1.5,0.2,setosa
6.2,3.4,5.4,2.3,virginica
4.9,2.5,4.5,1.7,virginica
5.1,3.5,1.4,0.2,setosa
5,3.4,1.5,0.2,setosa`
Particle.getVersion = () => "86.0.0"
class AbstractExtendibleParticle extends Particle {
  _getFromExtended(firstWordPath) {
    const hit = this._getParticleFromExtended(firstWordPath)
    return hit ? hit.get(firstWordPath) : undefined
  }
  _getLineage() {
    const newParticle = new Particle()
    this.forEach(particle => {
      const path = particle._getAncestorsArray().map(particle => particle.id)
      path.reverse()
      newParticle.touchParticle(path.join(TN_EDGE_SYMBOL))
    })
    return newParticle
  }
  // todo: be more specific with the param
  _getSubparticlesByParserInExtended(parser) {
    return Utils.flatten(this._getAncestorsArray().map(particle => particle.getSubparticlesByParser(parser)))
  }
  _getExtendedParent() {
    return this._getAncestorsArray()[1]
  }
  _hasFromExtended(firstWordPath) {
    return !!this._getParticleFromExtended(firstWordPath)
  }
  _getParticleFromExtended(firstWordPath) {
    return this._getAncestorsArray().find(particle => particle.has(firstWordPath))
  }
  _getConcatBlockStringFromExtended(firstWordPath) {
    return this._getAncestorsArray()
      .filter(particle => particle.has(firstWordPath))
      .map(particle => particle.getParticle(firstWordPath).subparticlesToString())
      .reverse()
      .join("\n")
  }
  _doesExtend(parserId) {
    return this._getAncestorSet().has(parserId)
  }
  _getAncestorSet() {
    if (!this._cache_ancestorSet) this._cache_ancestorSet = new Set(this._getAncestorsArray().map(def => def.id))
    return this._cache_ancestorSet
  }
  // Note: the order is: [this, parent, grandParent, ...]
  _getAncestorsArray(cannotContainParticles) {
    this._initAncestorsArrayCache(cannotContainParticles)
    return this._cache_ancestorsArray
  }
  get idThatThisExtends() {
    return this.get(ParticlesConstants.extends)
  }
  _initAncestorsArrayCache(cannotContainParticles) {
    if (this._cache_ancestorsArray) return undefined
    if (cannotContainParticles && cannotContainParticles.includes(this)) throw new Error(`Loop detected: '${this.getLine()}' is the ancestor of one of its ancestors.`)
    cannotContainParticles = cannotContainParticles || [this]
    let ancestors = [this]
    const extendedId = this.idThatThisExtends
    if (extendedId) {
      const parentParticle = this.idToParticleMap[extendedId]
      if (!parentParticle) throw new Error(`${extendedId} not found`)
      ancestors = ancestors.concat(parentParticle._getAncestorsArray(cannotContainParticles))
    }
    this._cache_ancestorsArray = ancestors
  }
}
class ExtendibleParticle extends AbstractExtendibleParticle {
  get idToParticleMap() {
    if (!this.isRoot()) return this.root.idToParticleMap
    if (!this._particleMapCache) {
      this._particleMapCache = {}
      this.forEach(subparticle => {
        this._particleMapCache[subparticle.id] = subparticle
      })
    }
    return this._particleMapCache
  }
  get id() {
    return this.getWord(0)
  }
}

module.exports = { Particle, ExtendibleParticle, AbstractExtendibleParticle, ParticleEvents, ParticleWord }
