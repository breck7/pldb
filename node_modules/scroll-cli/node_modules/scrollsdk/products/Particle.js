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
class ParticleAtom {
  constructor(particle, atomIndex) {
    this._particle = particle
    this._atomIndex = atomIndex
  }
  replace(newAtom) {
    this._particle.setAtom(this._atomIndex, newAtom)
  }
  get atom() {
    return this._particle.getAtom(this._atomIndex)
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
  constructor(catchAllParser, firstAtomMap = {}, regexTests = undefined) {
    this._catchAllParser = catchAllParser
    this._firstAtomMap = new Map(Object.entries(firstAtomMap))
    this._regexTests = regexTests
  }
  getFirstAtomOptions() {
    return Array.from(this._getFirstAtomMap().keys())
  }
  // todo: remove
  _getFirstAtomMap() {
    return this._firstAtomMap
  }
  // todo: remove
  _getFirstAtomMapAsObject() {
    let obj = {}
    const map = this._getFirstAtomMap()
    for (let [key, val] of map.entries()) {
      obj[key] = val
    }
    return obj
  }
  _getParser(line, contextParticle, atomBreakSymbol = TN_WORD_BREAK_SYMBOL) {
    return this._getFirstAtomMap().get(this._getFirstAtom(line, atomBreakSymbol)) || this._getParserFromRegexTests(line) || this._getCatchAllParser(contextParticle)
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
  _getFirstAtom(line, atomBreakSymbol) {
    const firstBreak = line.indexOf(atomBreakSymbol)
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
  get lineAtomTypes() {
    // todo: make this any a constant
    return "undefinedAtomType ".repeat(this.atoms.length).trim()
  }
  isNodeJs() {
    return typeof exports !== "undefined"
  }
  isBrowser() {
    return !this.isNodeJs()
  }
  getOlderSiblings() {
    if (this.isRoot()) return []
    return this.parent.slice(0, this.index)
  }
  _getClosestOlderSibling() {
    const olderSiblings = this.getOlderSiblings()
    return olderSiblings[olderSiblings.length - 1]
  }
  getYoungerSiblings() {
    if (this.isRoot()) return []
    return this.parent.slice(this.index + 1)
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
      const count = particle.atoms.length + particle.getIndentLevel()
      if (count > max) max = count
    }
    return max
  }
  get numberOfAtoms() {
    let atomCount = 0
    for (let particle of this.getTopDownArrayIterator()) {
      atomCount += particle.atoms.length
    }
    return atomCount
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
  get isBlank() {
    return this.isBlankLine()
  }
  hasDuplicateFirstAtoms() {
    return this.length ? new Set(this.getFirstAtoms()).size !== this.length : false
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
  getAtom(index) {
    const atoms = this._getAtoms(0)
    if (index < 0) index = atoms.length + index
    return atoms[index]
  }
  get list() {
    return this.getAtomsFrom(1)
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
    // Set up the firstAtom part of the particle
    const edgeHtml = `<span class="${classes.particleLine}" data-pathVector="${path}"><span class="${classes.edgeSymbol}">${edge}</span>`
    const lineHtml = this._getLineHtml()
    const subparticlesHtml = this.length ? `<span class="${classes.particleBreakSymbol}">${this.particleBreakSymbol}</span>` + `<span class="${classes.particleSubparticles}">${this._subparticlesToHtml(indentCount + 1)}</span>` : ""
    return `${edgeHtml}${lineHtml}${subparticlesHtml}</span>`
  }
  _getAtoms(startFrom) {
    if (!this._atoms) this._atoms = this._getLine().split(this.atomBreakSymbol)
    return startFrom ? this._atoms.slice(startFrom) : this._atoms
  }
  get atoms() {
    return this._getAtoms(0)
  }
  doesExtend(parserId) {
    return false
  }
  require(moduleName, filePath) {
    if (!this.isNodeJs()) return window[moduleName]
    return require(filePath || moduleName)
  }
  getAtomsFrom(startFrom) {
    return this._getAtoms(startFrom)
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
      const hit = copy.getParticle(particle.getAtom(0))
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
  getBiDirectionalMaps(propertyNameOrFn, propertyNameOrFn2 = particle => particle.getAtom(0)) {
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
  _getAtomIndexCharacterStartPosition(atomIndex) {
    const xiLength = this.edgeSymbol.length
    const numIndents = this._getIndentLevel() - 1
    const indentPosition = xiLength * numIndents
    if (atomIndex < 1) return xiLength * (numIndents + atomIndex)
    return indentPosition + this.atoms.slice(0, atomIndex).join(this.atomBreakSymbol).length + this.atomBreakSymbol.length
  }
  getParticleInScopeAtCharIndex(charIndex) {
    if (this.isRoot()) return this
    let atomIndex = this.getAtomIndexAtCharacterIndex(charIndex)
    if (atomIndex > 0) return this
    let particle = this
    while (atomIndex < 1) {
      particle = particle.parent
      atomIndex++
    }
    return particle
  }
  getAtomProperties(atomIndex) {
    const start = this._getAtomIndexCharacterStartPosition(atomIndex)
    const atom = atomIndex < 0 ? "" : this.getAtom(atomIndex)
    return {
      startCharIndex: start,
      endCharIndex: start + atom.length,
      atom: atom
    }
  }
  fill(fill = "") {
    this.topDownArray.forEach(line => {
      line.atoms.forEach((atom, index) => line.setAtom(index, fill))
    })
    return this
  }
  getAllAtomBoundaryCoordinates() {
    const coordinates = []
    let lineIndex = 0
    for (let particle of this.getTopDownArrayIterator()) {
      particle.getAtomBoundaryCharIndices().forEach((charIndex, atomIndex) => {
        coordinates.push({
          lineIndex: lineIndex,
          charIndex: charIndex,
          atomIndex: atomIndex
        })
      })
      lineIndex++
    }
    return coordinates
  }
  getAtomBoundaryCharIndices() {
    let indentLevel = this._getIndentLevel()
    const atomBreakSymbolLength = this.atomBreakSymbol.length
    let elapsed = indentLevel
    return this.atoms.map((atom, atomIndex) => {
      const boundary = elapsed
      elapsed += atom.length + atomBreakSymbolLength
      return boundary
    })
  }
  getAtomIndexAtCharacterIndex(charIndex) {
    // todo: is this correct thinking for handling root?
    if (this.isRoot()) return 0
    const numberOfIndents = this._getIndentLevel(undefined) - 1
    // todo: probably want to rewrite this in a performant way.
    const spots = []
    while (spots.length < numberOfIndents) {
      spots.push(-(numberOfIndents - spots.length))
    }
    this.atoms.forEach((atom, atomIndex) => {
      atom.split("").forEach(letter => {
        spots.push(atomIndex)
      })
      spots.push(atomIndex)
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
  get firstAtom() {
    return this.atoms[0]
  }
  get content() {
    const atoms = this.getAtomsFrom(1)
    return atoms.length ? atoms.join(this.atomBreakSymbol) : undefined
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
    if (!this._atoms && !language) return this._getLine() // todo: how does this interact with "language" param?
    return this.atoms.join((language || this).atomBreakSymbol)
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
  _getFirstAtomPath(relativeTo) {
    if (this.isRoot(relativeTo)) return ""
    else if (this.parent.isRoot(relativeTo)) return this.firstAtom
    return this.parent._getFirstAtomPath(relativeTo) + this.edgeSymbol + this.firstAtom
  }
  getFirstAtomPathRelativeTo(relativeTo) {
    return this._getFirstAtomPath(relativeTo)
  }
  getFirstAtomPath() {
    return this._getFirstAtomPath()
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
    path.push(this.index)
    return path
  }
  get index() {
    return this.parent._indexOfParticle(this)
  }
  isTerminal() {
    return !this.length
  }
  _getLineHtml() {
    return this.atoms.map((atom, index) => `<span class="atom${index}">${Utils.stripHtml(atom)}</span>`).join(`<span class="zIncrement">${this.atomBreakSymbol}</span>`)
  }
  _getXmlContent(indentCount) {
    if (this.content !== undefined) return this.contentWithSubparticles
    return this.length ? `${indentCount === -1 ? "" : "\n"}${this._subparticlesToXml(indentCount > -1 ? indentCount + 2 : -1)}${" ".repeat(indentCount)}` : ""
  }
  _toXml(indentCount) {
    const indent = " ".repeat(indentCount)
    const tag = this.firstAtom
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
    return [this.firstAtom, tupleValue]
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
    const atoms = this.atoms
    return columns.every((searchTerm, index) => searchTerm === atoms[index])
  }
  hasAtom(index, atom) {
    return this.getAtom(index) === atom
  }
  getParticleByColumns(...columns) {
    return this.topDownArray.find(particle => particle._hasColumns(columns))
  }
  getParticleByColumn(index, name) {
    return this.find(particle => particle.getAtom(index) === name)
  }
  _getParticlesByColumn(index, name) {
    return this.filter(particle => particle.getAtom(index) === name)
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
      const atom = particle.get(columnName)
      const typedAtom = parser ? parser(atom) : atom
      if (operator === WhereOperators.equal) return fixedValue === typedAtom
      else if (operator === WhereOperators.notEqual) return fixedValue !== typedAtom
      else if (operator === WhereOperators.includes) return typedAtom !== undefined && typedAtom.includes(fixedValue)
      else if (operator === WhereOperators.doesNotInclude) return typedAtom === undefined || !typedAtom.includes(fixedValue)
      else if (operator === WhereOperators.greaterThan) return typedAtom > fixedValue
      else if (operator === WhereOperators.lessThan) return typedAtom < fixedValue
      else if (operator === WhereOperators.greaterThanOrEqual) return typedAtom >= fixedValue
      else if (operator === WhereOperators.lessThanOrEqual) return typedAtom <= fixedValue
      else if (operator === WhereOperators.empty) return !particle.has(columnName)
      else if (operator === WhereOperators.notEmpty) return particle.has(columnName) || (atom !== "" && atom !== undefined)
      else if (operator === WhereOperators.in && isArray) return fixedValue.includes(typedAtom)
      else if (operator === WhereOperators.notIn && isArray) return !fixedValue.includes(typedAtom)
    }
    const result = new Particle()
    this.filter(fn).forEach(particle => {
      result.appendParticle(particle)
    })
    return result
  }
  with(firstAtom) {
    return this.filter(particle => particle.has(firstAtom))
  }
  without(firstAtom) {
    return this.filter(particle => !particle.has(firstAtom))
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
      newObject[subparticle.getAtom(0)] = subparticle.content
      subparticle.topDownArray.forEach(particle => {
        const newColumnName = particle.getFirstAtomPathRelativeTo(this).replace(edgeSymbolRegex, delimiter)
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
    const getLine = (atomIndex, atom = "") =>
      `<span class="htmlCubeSpan" style="top: calc(var(--topIncrement) * ${planeIndex} + var(--rowHeight) * ${lineIndex}); left:calc(var(--leftIncrement) * ${planeIndex} + var(--atomWidth) * ${atomIndex});">${atom}</span>`
    let atoms = []
    this.atoms.forEach((atom, index) => (atom ? atoms.push(getLine(index + indents, atom)) : ""))
    return atoms.join("")
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
    return prefix + `${this.firstAtom}:` + (this.content ? " " + this.content : "")
  }
  _isYamlList() {
    return this.hasDuplicateFirstAtoms()
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
          atoms: this.atoms,
          subparticles: this.map(subparticle => subparticle._toObjectForSerialization())
        }
      : {
          atoms: this.atoms
        }
  }
  get asJson() {
    return JSON.stringify({ subparticles: this.map(subparticle => subparticle._toObjectForSerialization()) }, null, " ")
  }
  get asGrid() {
    const AtomBreakSymbol = this.atomBreakSymbol
    return this.toString()
      .split(this.particleBreakSymbol)
      .map(line => line.split(AtomBreakSymbol))
  }
  get asGridJson() {
    return JSON.stringify(this.asGrid, null, 2)
  }
  findParticles(firstAtomPath) {
    // todo: can easily speed this up
    const map = {}
    if (!Array.isArray(firstAtomPath)) firstAtomPath = [firstAtomPath]
    firstAtomPath.forEach(path => (map[path] = true))
    return this.topDownArray.filter(particle => {
      if (map[particle._getFirstAtomPath(this)]) return true
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
  getParticle(firstAtomPath) {
    return this._getParticleByPath(firstAtomPath)
  }
  getParticles(firstAtomPath) {
    return this.findParticles(firstAtomPath)
  }
  get section() {
    // return all particles after this one to the next blank line or end of file
    const particles = []
    if (this.isLast) return particles
    let next = this.next
    while (!next.isBlank) {
      particles.push(next)
      next = next.next
      if (next.isFirst) break
    }
    return particles
  }
  get isLast() {
    return this.index === this.parent.length - 1
  }
  get isFirst() {
    return this.index === 0
  }
  getFrom(prefix) {
    const hit = this.filter(particle => particle.getLine().startsWith(prefix))[0]
    if (hit) return hit.getLine().substr((prefix + this.atomBreakSymbol).length)
  }
  get(firstAtomPath) {
    const particle = this._getParticleByPath(firstAtomPath)
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
      if (!map[particle.getAtom(0)]) particle.destroy()
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
      return this.filter(particle => particle.firstAtom === globPath)
    }
    const parts = globPath.split(edgeSymbol)
    const current = parts.shift()
    const rest = parts.join(edgeSymbol)
    const matchingParticles = current === "*" ? this.getSubparticles() : this.filter(subparticle => subparticle.firstAtom === current)
    return [].concat.apply(
      [],
      matchingParticles.map(particle => particle._getParticlesByGlobPath(rest))
    )
  }
  _getParticleByPath(firstAtomPath) {
    const edgeSymbol = this.edgeSymbol
    if (!firstAtomPath.includes(edgeSymbol)) {
      const index = this.indexOfLast(firstAtomPath)
      return index === -1 ? undefined : this._particleAt(index)
    }
    const parts = firstAtomPath.split(edgeSymbol)
    const current = parts.shift()
    const currentParticle = this._getSubparticlesArray()[this._getIndex()[current]]
    return currentParticle ? currentParticle._getParticleByPath(parts.join(edgeSymbol)) : undefined
  }
  get next() {
    if (this.isRoot()) return this
    const index = this.index
    const parent = this.parent
    const length = parent.length
    const next = index + 1
    return next === length ? parent._getSubparticlesArray()[0] : parent._getSubparticlesArray()[next]
  }
  get previous() {
    if (this.isRoot()) return this
    const index = this.index
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
        obj[particle.firstAtom] = 1
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
      particle => particle.getAtom(extendsColumnNumber),
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
  pathVectorToFirstAtomPath(pathVector) {
    const path = pathVector.slice() // copy array
    const names = []
    let particle = this
    while (path.length) {
      if (!particle) return names
      names.push(particle.particleAt(path[0]).firstAtom)
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
    const atomFn = (atomValue, rowIndex, columnIndex) => (rowIndex ? parsers[types[columnIndex]](atomValue) : atomValue)
    const arrays = this._toArrays(header, atomFn)
    arrays.rows.unshift(arrays.header)
    return arrays.rows
  }
  toDelimited(delimiter, header = this._getUnionNames(), escapeSpecialChars = true) {
    const regex = new RegExp(`(\\n|\\"|\\${delimiter})`)
    const atomFn = (str, row, column) => (!str.toString().match(regex) ? str : `"` + str.replace(/\"/g, `""`) + `"`)
    return this._toDelimited(delimiter, header, escapeSpecialChars ? atomFn : str => str)
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
  _toArrays(columnNames, atomFn) {
    const skipHeaderRow = 1
    const header = columnNames.map((columnName, index) => atomFn(columnName, 0, index))
    const rows = this.map((particle, rowNumber) =>
      columnNames.map((columnName, columnIndex) => {
        const subparticleParticle = particle.getParticle(columnName)
        const content = subparticleParticle ? subparticleParticle.contentWithSubparticles : ""
        return atomFn(content, rowNumber + skipHeaderRow, columnIndex)
      })
    )
    return {
      rows,
      header
    }
  }
  _toDelimited(delimiter, header, atomFn) {
    const data = this._toArrays(header, atomFn)
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
        const atomValue = particle.get(col)
        if (!atomValue) return true
        const length = atomValue.toString().length
        if (length > widths[index]) widths[index] = length > maxCharactersPerColumn ? maxCharactersPerColumn : length
      })
    })
    const atomFn = (atomText, row, col) => {
      const width = widths[col]
      // Strip newlines in fixedWidth output
      const atomValue = atomText.toString().replace(/\n/g, "\\n")
      const atomLength = atomValue.length
      if (atomLength > width) return atomValue.substr(0, width) + "..."
      const padding = " ".repeat(width - atomLength)
      return alignRight ? padding + atomValue : atomValue + padding
    }
    return this._toDelimited(" ", header, atomFn)
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
        // firstAtomd on the "was last element" states of whatever we're nested within,
        // we need to append either blankness or a branch to our line
        lastStates.forEach((lastState, idx) => {
          if (idx > 0) line += lastState[1] ? " " : "│"
        })
        // the prefix varies firstAtomd on whether the key contains something to show and
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
  split(firstAtom) {
    const constructor = this.constructor
    const ParticleBreakSymbol = this.particleBreakSymbol
    const AtomBreakSymbol = this.atomBreakSymbol
    // todo: cleanup. the escaping is wierd.
    return this.toString()
      .split(new RegExp(`\\${ParticleBreakSymbol}(?=${firstAtom}(?:${AtomBreakSymbol}|\\${ParticleBreakSymbol}))`, "g"))
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
  get atomBreakSymbol() {
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
    if (this._atoms) delete this._atoms
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
    for (let firstAtom in content) {
      if (!content.hasOwnProperty(firstAtom)) continue
      // Branch the circularCheckArray, as we only have same branch circular arrays
      this._appendFromJavascriptObjectTuple(firstAtom, content[firstAtom], circularCheckArray.slice(0))
    }
    return this
  }
  // todo: refactor the below.
  _appendFromJavascriptObjectTuple(firstAtom, content, circularCheckArray) {
    const type = typeof content
    let line
    let subparticles
    if (content === null) line = firstAtom + " " + null
    else if (content === undefined) line = firstAtom
    else if (type === "string") {
      const tuple = this._textToContentAndSubparticlesTuple(content)
      line = firstAtom + " " + tuple[0]
      subparticles = tuple[1]
    } else if (type === "function") line = firstAtom + " " + content.toString()
    else if (type !== "object") line = firstAtom + " " + content
    else if (content instanceof Date) line = firstAtom + " " + content.getTime().toString()
    else if (content instanceof Particle) {
      line = firstAtom
      subparticles = new Particle(content.subparticlesToString(), content.getLine())
    } else if (circularCheckArray.indexOf(content) === -1) {
      circularCheckArray.push(content)
      line = firstAtom
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
    // StringMap<int> {firstAtom: index}
    // When there are multiple tails with the same firstAtom, _index stores the last content.
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
  indexOfLast(firstAtom) {
    const result = this._getIndex()[firstAtom]
    return result === undefined ? -1 : result
  }
  // todo: renmae to indexOfFirst?
  indexOf(firstAtom) {
    if (!this.has(firstAtom)) return -1
    const length = this.length
    const particles = this._getSubparticlesArray()
    for (let index = 0; index < length; index++) {
      if (particles[index].firstAtom === firstAtom) return index
    }
  }
  // todo: rename this. it is a particular type of object.
  toObject() {
    return this._toObject()
  }
  getFirstAtoms() {
    return this.map(particle => particle.firstAtom)
  }
  _makeIndex(startAt = 0) {
    if (!this._index || !startAt) this._index = {}
    const particles = this._getSubparticlesArray()
    const newIndex = this._index
    const length = particles.length
    for (let index = startAt; index < length; index++) {
      newIndex[particles[index].firstAtom] = index
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
  hasFirstAtom(firstAtom) {
    return this._hasFirstAtom(firstAtom)
  }
  has(firstAtomPath) {
    const edgeSymbol = this.edgeSymbol
    if (!firstAtomPath.includes(edgeSymbol)) return this.hasFirstAtom(firstAtomPath)
    const parts = firstAtomPath.split(edgeSymbol)
    const next = this.getParticle(parts.shift())
    if (!next) return false
    return next.has(parts.join(edgeSymbol))
  }
  hasParticle(particle) {
    const needle = particle.toString()
    return this.getSubparticles().some(particle => particle.toString() === needle)
  }
  _hasFirstAtom(firstAtom) {
    return this._getIndex()[firstAtom] !== undefined
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
      const key = particle.getAtom(0)
      const parentKey = particle.getAtom(1)
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
      const particleId = particle.getAtom(thisIdColumnNumber)
      if (map[particleId]) throw new Error(`Tried to define a particle with id "${particleId}" but one is already defined.`)
      map[particleId] = {
        particleId: particleId,
        particle: particle,
        parentId: particle.getAtom(extendsIdColumnNumber)
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
    const usedFirstAtoms = new Set()
    particle.forEach(sourceParticle => {
      const firstAtom = sourceParticle.firstAtom
      let targetParticle
      const isAnArrayNotMap = usedFirstAtoms.has(firstAtom)
      if (!this.has(firstAtom)) {
        usedFirstAtoms.add(firstAtom)
        this.appendLineAndSubparticles(sourceParticle.getLine(), sourceParticle.subparticlesToString())
        return true
      }
      if (isAnArrayNotMap) targetParticle = this.appendLine(sourceParticle.getLine())
      else {
        targetParticle = this.touchParticle(firstAtom).setContent(sourceParticle.content)
        usedFirstAtoms.add(firstAtom)
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
    lastParticle.getOlderSiblings().forEach(particle => map.set(particle.getAtom(0), particle))
    lastParticle.topDownArray.forEach(particle => {
      const replacement = map.get(particle.getAtom(0))
      if (!replacement) return
      particle.replaceParticle(str => replacement.toString())
    })
    return lastParticle
  }
  macroExpand(macroDefinitionAtom, macroUsageAtom) {
    const clone = this.clone()
    const defs = clone.findParticles(macroDefinitionAtom)
    const allUses = clone.findParticles(macroUsageAtom)
    const atomBreakSymbol = clone.atomBreakSymbol
    defs.forEach(def => {
      const macroName = def.getAtom(1)
      const uses = allUses.filter(particle => particle.hasAtom(1, macroName))
      const params = def.getAtomsFrom(2)
      const replaceFn = str => {
        const paramValues = str.split(atomBreakSymbol).slice(2)
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
  insertAtom(index, atom) {
    const wi = this.atomBreakSymbol
    const atoms = this._getLine().split(wi)
    atoms.splice(index, 0, atom)
    this.setLine(atoms.join(wi))
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
  setAtom(index, atom) {
    const wi = this.atomBreakSymbol
    const atoms = this._getLine().split(wi)
    atoms[index] = atom
    this.setLine(atoms.join(wi))
    return this
  }
  deleteSubparticles() {
    return this._clearSubparticles()
  }
  setContent(content) {
    if (content === this.content) return this
    const newArray = [this.firstAtom]
    if (content !== undefined) {
      content = content.toString()
      if (content.match(this.particleBreakSymbol)) return this.setContentWithSubparticles(content)
      newArray.push(content)
    }
    this._setLine(newArray.join(this.atomBreakSymbol))
    this._updateLineModifiedTimeAndTriggerEvent()
    return this
  }
  prependSibling(line, subparticles) {
    return this.parent.insertLineAndSubparticles(line, subparticles, this.index)
  }
  appendSibling(line, subparticles) {
    return this.parent.insertLineAndSubparticles(line, subparticles, this.index + 1)
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
  setFirstAtom(firstAtom) {
    return this.setAtom(0, firstAtom)
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
    return this.parent._insertLineAndSubparticles(this.getLine(), this.subparticlesToString(), this.index + 1)
  }
  trim() {
    // todo: could do this so only the trimmed rows are deleted.
    this.setSubparticles(this.subparticlesToString().trim())
    return this
  }
  destroy() {
    this.parent._deleteParticle(this)
  }
  set(firstAtomPath, text) {
    return this.touchParticle(firstAtomPath).setContentWithSubparticles(text)
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
    this.forEach(particle => particle.atoms.reverse())
    return this
  }
  _rename(oldFirstAtom, newFirstAtom) {
    const index = this.indexOf(oldFirstAtom)
    if (index === -1) return this
    const particle = this._getSubparticlesArray()[index]
    particle.setFirstAtom(newFirstAtom)
    this._clearIndex()
    return this
  }
  // Does not recurse.
  remap(map) {
    this.forEach(particle => {
      const firstAtom = particle.firstAtom
      if (map[firstAtom] !== undefined) particle.setFirstAtom(map[firstAtom])
    })
    return this
  }
  rename(oldFirstAtom, newFirstAtom) {
    this._rename(oldFirstAtom, newFirstAtom)
    return this
  }
  renameAll(oldName, newName) {
    this.findParticles(oldName).forEach(particle => particle.setFirstAtom(newName))
    return this
  }
  _deleteAllChildParticlesWithFirstAtom(firstAtom) {
    if (!this.has(firstAtom)) return this
    const allParticles = this._getSubparticlesArray()
    const indexesToDelete = []
    allParticles.forEach((particle, index) => {
      if (particle.firstAtom === firstAtom) indexesToDelete.push(index)
    })
    return this._deleteByIndexes(indexesToDelete)
  }
  delete(path = "") {
    const edgeSymbol = this.edgeSymbol
    if (!path.includes(edgeSymbol)) return this._deleteAllChildParticlesWithFirstAtom(path)
    const parts = path.split(edgeSymbol)
    const nextFirstAtom = parts.pop()
    const targetParticle = this.getParticle(parts.join(edgeSymbol))
    return targetParticle ? targetParticle._deleteAllChildParticlesWithFirstAtom(nextFirstAtom) : 0
  }
  deleteColumn(firstAtom = "") {
    this.forEach(particle => particle.delete(firstAtom))
    return this
  }
  _getNonMaps() {
    const results = this.topDownArray.filter(particle => particle.hasDuplicateFirstAtoms())
    if (this.hasDuplicateFirstAtoms()) results.unshift(this)
    return results
  }
  replaceParticle(fn) {
    const parent = this.parent
    const index = this.index
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
    const line = index.toString() + (content === undefined ? "" : this.atomBreakSymbol + content)
    return this.appendLineAndSubparticles(line, subparticles)
  }
  deleteBlanks() {
    this.getSubparticles()
      .filter(particle => particle.isBlankLine())
      .forEach(particle => particle.destroy())
    return this
  }
  // todo: add "globalReplace" method? Which runs a global regex or string replace on the Particle as a string?
  firstAtomSort(firstAtomOrder) {
    return this._firstAtomSort(firstAtomOrder)
  }
  deleteAtomAt(atomIndex) {
    const atoms = this.atoms
    atoms.splice(atomIndex, 1)
    return this.setAtoms(atoms)
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
  setAtoms(atoms) {
    return this.setLine(atoms.join(this.atomBreakSymbol))
  }
  setAtomsFrom(index, atoms) {
    this.setAtoms(this.atoms.slice(0, index).concat(atoms))
    return this
  }
  appendAtom(atom) {
    const atoms = this.atoms
    atoms.push(atom)
    return this.setAtoms(atoms)
  }
  _firstAtomSort(firstAtomOrder, secondarySortFn) {
    const particleAFirst = -1
    const particleBFirst = 1
    const map = {}
    firstAtomOrder.forEach((atom, index) => {
      map[atom] = index
    })
    this.sort((particleA, particleB) => {
      const valA = map[particleA.firstAtom]
      const valB = map[particleB.firstAtom]
      if (valA > valB) return particleBFirst
      if (valA < valB) return particleAFirst
      return secondarySortFn ? secondarySortFn(particleA, particleB) : 0
    })
    return this
  }
  _touchParticle(firstAtomPathArray) {
    let contextParticle = this
    firstAtomPathArray.forEach(firstAtom => {
      contextParticle = contextParticle.getParticle(firstAtom) || contextParticle.appendLine(firstAtom)
    })
    return contextParticle
  }
  _touchParticleByString(str) {
    str = str.replace(this.particleBreakSymbolRegex, "") // todo: do we want to do this sanitization?
    return this._touchParticle(str.split(this.atomBreakSymbol))
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
      const atomsA = particleA.atoms
      const atomsB = particleB.atoms
      for (let index = 0; index < length; index++) {
        const col = indices[index]
        const av = atomsA[col]
        const bv = atomsB[col]
        if (av === undefined) return -1
        if (bv === undefined) return 1
        if (av > bv) return 1
        else if (av < bv) return -1
      }
      return 0
    })
    return this
  }
  getAtomsAsSet() {
    return new Set(this.getAtomsFrom(1))
  }
  appendAtomIfMissing(atom) {
    if (this.getAtomsAsSet().has(atom)) return this
    return this.appendAtom(atom)
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
    const parentIndex = this.parent.index
    const newParticle = grandParent.insertLineAndSubparticles(this.getLine(), this.length ? this.subparticlesToString() : undefined, parentIndex + 1)
    this.destroy()
    return newParticle
  }
  pasteText(text) {
    const parent = this.parent
    const index = this.index
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
        const firstAtom = names[index]
        const av = particleA.get(firstAtom)
        const bv = particleB.get(firstAtom)
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
    const atomDelimiter = language.atomBreakSymbol
    const particleDelimiter = language.particleBreakSymbol
    const line = particle.atoms ? particle.atoms.join(atomDelimiter) : undefined
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
    const atomDelimiter = language.atomBreakSymbol
    const particleDelimiter = language.particleBreakSymbol
    return new Particle(lines.map(line => line.join(atomDelimiter)).join(particleDelimiter))
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
    let currentAtom = ""
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
        if (char !== quoteChar) currentAtom += char
        else if (isNextCharAQuote) {
          // Both the current and next char are ", so the " is escaped
          currentAtom += nextChar
          currentPosition++ // Jump 2
        } else {
          // If the current char is a " and the next char is not, it's the end of the quotes
          inQuote = false
          if (isLastChar) rows[currentRow].push(currentAtom)
        }
      } else {
        if (char === delimiter) {
          rows[currentRow].push(currentAtom)
          currentAtom = ""
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (char === newLine) {
          rows[currentRow].push(currentAtom)
          currentAtom = ""
          currentRow++
          if (nextChar) rows[currentRow] = []
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (isLastChar) rows[currentRow].push(currentAtom + char)
        else currentAtom += char
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
      row.forEach((atomValue, index) => {
        obj[names[index]] = atomValue
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
    const AtomBreakSymbol = " "
    const ziRegex = new RegExp(AtomBreakSymbol, "g")
    if (hasHeaders) {
      // Strip any AtomBreakSymbols from column names in the header row.
      // This makes the mapping not quite 1 to 1 if there are any AtomBreakSymbols in names.
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
    const AtomBreakSymbol = TN_WORD_BREAK_SYMBOL
    const indent = ParticleBreakSymbol + AtomBreakSymbol.repeat(xValue)
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
Particle.getVersion = () => "88.0.0"
class AbstractExtendibleParticle extends Particle {
  _getFromExtended(firstAtomPath) {
    const hit = this._getParticleFromExtended(firstAtomPath)
    return hit ? hit.get(firstAtomPath) : undefined
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
  _hasFromExtended(firstAtomPath) {
    return !!this._getParticleFromExtended(firstAtomPath)
  }
  _getParticleFromExtended(firstAtomPath) {
    return this._getAncestorsArray().find(particle => particle.has(firstAtomPath))
  }
  _getConcatBlockStringFromExtended(firstAtomPath) {
    return this._getAncestorsArray()
      .filter(particle => particle.has(firstAtomPath))
      .map(particle => particle.getParticle(firstAtomPath).subparticlesToString())
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
    return this.getAtom(0)
  }
}

module.exports = { Particle, ExtendibleParticle, AbstractExtendibleParticle, ParticleEvents, ParticleAtom }
