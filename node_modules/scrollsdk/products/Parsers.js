const { Utils } = require("../products/Utils.js")
const { TreeNode, TreeWord, ExtendibleTreeNode, AbstractExtendibleTreeNode } = require("../products/TreeNode.js")
// Compiled language parsers will include these files:
const GlobalNamespaceAdditions = {
  Utils: "Utils.js",
  TreeNode: "TreeNode.js",
  HandParsersProgram: "Parsers.js",
  ParserBackedNode: "Parsers.js"
}
var ParsersConstantsCompiler
;(function (ParsersConstantsCompiler) {
  ParsersConstantsCompiler["stringTemplate"] = "stringTemplate"
  ParsersConstantsCompiler["indentCharacter"] = "indentCharacter"
  ParsersConstantsCompiler["catchAllCellDelimiter"] = "catchAllCellDelimiter"
  ParsersConstantsCompiler["openChildren"] = "openChildren"
  ParsersConstantsCompiler["joinChildrenWith"] = "joinChildrenWith"
  ParsersConstantsCompiler["closeChildren"] = "closeChildren"
})(ParsersConstantsCompiler || (ParsersConstantsCompiler = {}))
var ParsersConstantsMisc
;(function (ParsersConstantsMisc) {
  ParsersConstantsMisc["doNotSynthesize"] = "doNotSynthesize"
})(ParsersConstantsMisc || (ParsersConstantsMisc = {}))
var PreludeCellTypeIds
;(function (PreludeCellTypeIds) {
  PreludeCellTypeIds["anyCell"] = "anyCell"
  PreludeCellTypeIds["keywordCell"] = "keywordCell"
  PreludeCellTypeIds["extraWordCell"] = "extraWordCell"
  PreludeCellTypeIds["floatCell"] = "floatCell"
  PreludeCellTypeIds["numberCell"] = "numberCell"
  PreludeCellTypeIds["bitCell"] = "bitCell"
  PreludeCellTypeIds["boolCell"] = "boolCell"
  PreludeCellTypeIds["intCell"] = "intCell"
})(PreludeCellTypeIds || (PreludeCellTypeIds = {}))
var ParsersConstantsConstantTypes
;(function (ParsersConstantsConstantTypes) {
  ParsersConstantsConstantTypes["boolean"] = "boolean"
  ParsersConstantsConstantTypes["string"] = "string"
  ParsersConstantsConstantTypes["int"] = "int"
  ParsersConstantsConstantTypes["float"] = "float"
})(ParsersConstantsConstantTypes || (ParsersConstantsConstantTypes = {}))
var ParsersBundleFiles
;(function (ParsersBundleFiles) {
  ParsersBundleFiles["package"] = "package.json"
  ParsersBundleFiles["readme"] = "readme.md"
  ParsersBundleFiles["indexHtml"] = "index.html"
  ParsersBundleFiles["indexJs"] = "index.js"
  ParsersBundleFiles["testJs"] = "test.js"
})(ParsersBundleFiles || (ParsersBundleFiles = {}))
var ParsersCellParser
;(function (ParsersCellParser) {
  ParsersCellParser["prefix"] = "prefix"
  ParsersCellParser["postfix"] = "postfix"
  ParsersCellParser["omnifix"] = "omnifix"
})(ParsersCellParser || (ParsersCellParser = {}))
var ParsersConstants
;(function (ParsersConstants) {
  // node types
  ParsersConstants["extensions"] = "extensions"
  ParsersConstants["comment"] = "//"
  ParsersConstants["version"] = "version"
  ParsersConstants["parser"] = "parser"
  ParsersConstants["cellType"] = "cellType"
  ParsersConstants["parsersFileExtension"] = "parsers"
  ParsersConstants["abstractParserPrefix"] = "abstract"
  ParsersConstants["parserSuffix"] = "Parser"
  ParsersConstants["cellTypeSuffix"] = "Cell"
  // error check time
  ParsersConstants["regex"] = "regex"
  ParsersConstants["reservedWords"] = "reservedWords"
  ParsersConstants["enumFromCellTypes"] = "enumFromCellTypes"
  ParsersConstants["enum"] = "enum"
  ParsersConstants["examples"] = "examples"
  ParsersConstants["min"] = "min"
  ParsersConstants["max"] = "max"
  // baseParsers
  ParsersConstants["baseParser"] = "baseParser"
  ParsersConstants["blobParser"] = "blobParser"
  ParsersConstants["errorParser"] = "errorParser"
  // parse time
  ParsersConstants["extends"] = "extends"
  ParsersConstants["root"] = "root"
  ParsersConstants["crux"] = "crux"
  ParsersConstants["cruxFromId"] = "cruxFromId"
  ParsersConstants["pattern"] = "pattern"
  ParsersConstants["inScope"] = "inScope"
  ParsersConstants["cells"] = "cells"
  ParsersConstants["listDelimiter"] = "listDelimiter"
  ParsersConstants["contentKey"] = "contentKey"
  ParsersConstants["childrenKey"] = "childrenKey"
  ParsersConstants["uniqueFirstWord"] = "uniqueFirstWord"
  ParsersConstants["catchAllCellType"] = "catchAllCellType"
  ParsersConstants["cellParser"] = "cellParser"
  ParsersConstants["catchAllParser"] = "catchAllParser"
  ParsersConstants["constants"] = "constants"
  ParsersConstants["required"] = "required"
  ParsersConstants["single"] = "single"
  ParsersConstants["uniqueLine"] = "uniqueLine"
  ParsersConstants["tags"] = "tags"
  ParsersConstants["_extendsJsClass"] = "_extendsJsClass"
  ParsersConstants["_rootNodeJsHeader"] = "_rootNodeJsHeader"
  // default catchAll parser
  ParsersConstants["BlobParser"] = "BlobParser"
  ParsersConstants["DefaultRootParser"] = "DefaultRootParser"
  // code
  ParsersConstants["javascript"] = "javascript"
  // compile time
  ParsersConstants["compilerParser"] = "compiler"
  ParsersConstants["compilesTo"] = "compilesTo"
  // develop time
  ParsersConstants["description"] = "description"
  ParsersConstants["example"] = "example"
  ParsersConstants["frequency"] = "frequency"
  ParsersConstants["paint"] = "paint"
})(ParsersConstants || (ParsersConstants = {}))
class TypedWord extends TreeWord {
  constructor(node, cellIndex, type) {
    super(node, cellIndex)
    this._type = type
  }
  get type() {
    return this._type
  }
  toString() {
    return this.word + ":" + this.type
  }
}
// todo: can we merge these methods into base TreeNode and ditch this class?
class ParserBackedNode extends TreeNode {
  get definition() {
    if (this._definition) return this._definition
    this._definition = this.isRoot() ? this.handParsersProgram : this.parent.definition.getParserDefinitionByParserId(this.constructor.name)
    return this._definition
  }
  get rootParsersTree() {
    return this.definition.root
  }
  getAutocompleteResults(partialWord, cellIndex) {
    return cellIndex === 0 ? this._getAutocompleteResultsForFirstWord(partialWord) : this._getAutocompleteResultsForCell(partialWord, cellIndex)
  }
  makeError(message) {
    return new ParserDefinedError(this, message)
  }
  get nodeIndex() {
    // StringMap<int> {firstWord: index}
    // When there are multiple tails with the same firstWord, _index stores the last content.
    // todo: change the above behavior: when a collision occurs, create an array.
    return this._nodeIndex || this._makeNodeIndex()
  }
  _clearIndex() {
    delete this._nodeIndex
    return super._clearIndex()
  }
  _makeIndex(startAt = 0) {
    if (this._nodeIndex) this._makeNodeIndex(startAt)
    return super._makeIndex(startAt)
  }
  _makeNodeIndex(startAt = 0) {
    if (!this._nodeIndex || !startAt) this._nodeIndex = {}
    const nodes = this._getChildrenArray()
    const newIndex = this._nodeIndex
    const length = nodes.length
    for (let index = startAt; index < length; index++) {
      const node = nodes[index]
      const ancestors = Array.from(node.definition._getAncestorSet()).forEach(id => {
        if (!newIndex[id]) newIndex[id] = []
        newIndex[id].push(node)
      })
    }
    return newIndex
  }
  getChildInstancesOfParserId(parserId) {
    return this.nodeIndex[parserId] || []
  }
  doesExtend(parserId) {
    return this.definition._doesExtend(parserId)
  }
  _getErrorParserErrors() {
    return [this.firstWord ? new UnknownParserError(this) : new BlankLineError(this)]
  }
  _getBlobParserCatchAllParser() {
    return BlobParser
  }
  _getAutocompleteResultsForFirstWord(partialWord) {
    const keywordMap = this.definition.firstWordMapWithDefinitions
    let keywords = Object.keys(keywordMap)
    if (partialWord) keywords = keywords.filter(keyword => keyword.includes(partialWord))
    return keywords
      .map(keyword => {
        const def = keywordMap[keyword]
        if (def.suggestInAutocomplete === false) return false
        const description = def.description
        return {
          text: keyword,
          displayText: keyword + (description ? " " + description : "")
        }
      })
      .filter(i => i)
  }
  _getAutocompleteResultsForCell(partialWord, cellIndex) {
    // todo: root should be [] correct?
    const cell = this.parsedCells[cellIndex]
    return cell ? cell.getAutoCompleteWords(partialWord) : []
  }
  // note: this is overwritten by the root node of a runtime parsers program.
  // some of the magic that makes this all work. but maybe there's a better way.
  get handParsersProgram() {
    if (this.isRoot()) throw new Error(`Root node without getHandParsersProgram defined.`)
    return this.root.handParsersProgram
  }
  getRunTimeEnumOptions(cell) {
    return undefined
  }
  getRunTimeEnumOptionsForValidation(cell) {
    return this.getRunTimeEnumOptions(cell)
  }
  _sortNodesByInScopeOrder() {
    const parserOrder = this.definition._getMyInScopeParserIds()
    if (!parserOrder.length) return this
    const orderMap = {}
    parserOrder.forEach((word, index) => (orderMap[word] = index))
    this.sort(Utils.makeSortByFn(runtimeNode => orderMap[runtimeNode.definition.parserIdFromDefinition]))
    return this
  }
  get requiredNodeErrors() {
    const errors = []
    Object.values(this.definition.firstWordMapWithDefinitions).forEach(def => {
      if (def.isRequired() && !this.nodeIndex[def.id]) errors.push(new MissingRequiredParserError(this, def.id))
    })
    return errors
  }
  get programAsCells() {
    // todo: what is this?
    return this.topDownArray.map(node => {
      const cells = node.parsedCells
      let indents = node.getIndentLevel() - 1
      while (indents) {
        cells.unshift(undefined)
        indents--
      }
      return cells
    })
  }
  get programWidth() {
    return Math.max(...this.programAsCells.map(line => line.length))
  }
  get allTypedWords() {
    const words = []
    this.topDownArray.forEach(node => node.wordTypes.forEach((cell, index) => words.push(new TypedWord(node, index, cell.cellTypeId))))
    return words
  }
  findAllWordsWithCellType(cellTypeId) {
    return this.allTypedWords.filter(typedWord => typedWord.type === cellTypeId)
  }
  findAllNodesWithParser(parserId) {
    return this.topDownArray.filter(node => node.definition.parserIdFromDefinition === parserId)
  }
  toCellTypeTree() {
    return this.topDownArray.map(child => child.indentation + child.lineCellTypes).join("\n")
  }
  getParseTable(maxColumnWidth = 40) {
    const tree = new TreeNode(this.toCellTypeTree())
    return new TreeNode(
      tree.topDownArray.map((node, lineNumber) => {
        const sourceNode = this.nodeAtLine(lineNumber)
        const errs = sourceNode.getErrors()
        const errorCount = errs.length
        const obj = {
          lineNumber: lineNumber,
          source: sourceNode.indentation + sourceNode.getLine(),
          parser: sourceNode.constructor.name,
          cellTypes: node.content,
          errorCount: errorCount
        }
        if (errorCount) obj.errorMessages = errs.map(err => err.message).join(";")
        return obj
      })
    ).toFormattedTable(maxColumnWidth)
  }
  // Helper method for selecting potential parsers needed to update parsers file.
  get invalidParsers() {
    return Array.from(
      new Set(
        this.getAllErrors()
          .filter(err => err instanceof UnknownParserError)
          .map(err => err.getNode().firstWord)
      )
    )
  }
  _getAllAutoCompleteWords() {
    return this.getAllWordBoundaryCoordinates().map(coordinate => {
      const results = this.getAutocompleteResultsAt(coordinate.lineIndex, coordinate.charIndex)
      return {
        lineIndex: coordinate.lineIndex,
        charIndex: coordinate.charIndex,
        wordIndex: coordinate.wordIndex,
        word: results.word,
        suggestions: results.matches
      }
    })
  }
  toAutoCompleteCube(fillChar = "") {
    const trees = [this.clone()]
    const filled = this.clone().fill(fillChar)
    this._getAllAutoCompleteWords().forEach(hole => {
      hole.suggestions.forEach((suggestion, index) => {
        if (!trees[index + 1]) trees[index + 1] = filled.clone()
        trees[index + 1].nodeAtLine(hole.lineIndex).setWord(hole.wordIndex, suggestion.text)
      })
    })
    return new TreeNode(trees)
  }
  toAutoCompleteTable() {
    return new TreeNode(
      this._getAllAutoCompleteWords().map(result => {
        result.suggestions = result.suggestions.map(node => node.text).join(" ")
        return result
      })
    ).asTable
  }
  getAutocompleteResultsAt(lineIndex, charIndex) {
    const lineNode = this.nodeAtLine(lineIndex) || this
    const nodeInScope = lineNode.getNodeInScopeAtCharIndex(charIndex)
    // todo: add more tests
    // todo: second param this.childrenToString()
    // todo: change to getAutocomplete definitions
    const wordIndex = lineNode.getWordIndexAtCharacterIndex(charIndex)
    const wordProperties = lineNode.getWordProperties(wordIndex)
    return {
      startCharIndex: wordProperties.startCharIndex,
      endCharIndex: wordProperties.endCharIndex,
      word: wordProperties.word,
      matches: nodeInScope.getAutocompleteResults(wordProperties.word, wordIndex)
    }
  }
  _sortWithParentParsersUpTop() {
    const familyTree = new HandParsersProgram(this.toString()).parserFamilyTree
    const rank = {}
    familyTree.topDownArray.forEach((node, index) => {
      rank[node.getWord(0)] = index
    })
    const nodeAFirst = -1
    const nodeBFirst = 1
    this.sort((nodeA, nodeB) => {
      const nodeARank = rank[nodeA.getWord(0)]
      const nodeBRank = rank[nodeB.getWord(0)]
      return nodeARank < nodeBRank ? nodeAFirst : nodeBFirst
    })
    return this
  }
  format() {
    if (this.isRoot()) {
      this._sortNodesByInScopeOrder()
      try {
        this._sortWithParentParsersUpTop()
      } catch (err) {
        console.log(`Warning: ${err}`)
      }
    }
    this.topDownArray.forEach(child => {
      child.format()
    })
    return this
  }
  getParserUsage(filepath = "") {
    // returns a report on what parsers from its language the program uses
    const usage = new TreeNode()
    const handParsersProgram = this.handParsersProgram
    handParsersProgram.validConcreteAndAbstractParserDefinitions.forEach(def => {
      const requiredCellTypeIds = def.cellParser.getRequiredCellTypeIds()
      usage.appendLine([def.parserIdFromDefinition, "line-id", "parser", requiredCellTypeIds.join(" ")].join(" "))
    })
    this.topDownArray.forEach((node, lineNumber) => {
      const stats = usage.getNode(node.parserId)
      stats.appendLine([filepath + "-" + lineNumber, node.words.join(" ")].join(" "))
    })
    return usage
  }
  toPaintTree() {
    return this.topDownArray.map(child => child.indentation + child.getLinePaints()).join("\n")
  }
  toDefinitionLineNumberTree() {
    return this.topDownArray.map(child => child.definition.lineNumber + " " + child.indentation + child.cellDefinitionLineNumbers.join(" ")).join("\n")
  }
  get asCellTypeTreeWithParserIds() {
    return this.topDownArray.map(child => child.constructor.name + this.wordBreakSymbol + child.indentation + child.lineCellTypes).join("\n")
  }
  toPreludeCellTypeTreeWithParserIds() {
    return this.topDownArray.map(child => child.constructor.name + this.wordBreakSymbol + child.indentation + child.getLineCellPreludeTypes()).join("\n")
  }
  get asTreeWithParsers() {
    return this.topDownArray.map(child => child.constructor.name + this.wordBreakSymbol + child.indentation + child.getLine()).join("\n")
  }
  getCellPaintAtPosition(lineIndex, wordIndex) {
    this._initCellTypeCache()
    const typeNode = this._cache_paintTree.topDownArray[lineIndex - 1]
    return typeNode ? typeNode.getWord(wordIndex - 1) : undefined
  }
  _initCellTypeCache() {
    const treeMTime = this.getLineOrChildrenModifiedTime()
    if (this._cache_programCellTypeStringMTime === treeMTime) return undefined
    this._cache_typeTree = new TreeNode(this.toCellTypeTree())
    this._cache_paintTree = new TreeNode(this.toPaintTree())
    this._cache_programCellTypeStringMTime = treeMTime
  }
  createParserCombinator() {
    return this.isRoot() ? new TreeNode.ParserCombinator(BlobParser) : new TreeNode.ParserCombinator(this.parent._getParser()._getCatchAllParser(this.parent), {})
  }
  get parserId() {
    return this.definition.parserIdFromDefinition
  }
  get wordTypes() {
    return this.parsedCells.filter(cell => cell.getWord() !== undefined)
  }
  get cellErrors() {
    const { parsedCells } = this // todo: speedup. takes ~3s on pldb.
    // todo: speedup getErrorIfAny. takes ~3s on pldb.
    return parsedCells.map(check => check.getErrorIfAny()).filter(identity => identity)
  }
  get singleParserUsedTwiceErrors() {
    const errors = []
    const parent = this.parent
    const hits = parent.getChildInstancesOfParserId(this.definition.id)
    if (hits.length > 1)
      hits.forEach((node, index) => {
        if (node === this) errors.push(new ParserUsedMultipleTimesError(node))
      })
    return errors
  }
  get uniqueLineAppearsTwiceErrors() {
    const errors = []
    const parent = this.parent
    const hits = parent.getChildInstancesOfParserId(this.definition.id)
    if (hits.length > 1) {
      const set = new Set()
      hits.forEach((node, index) => {
        const line = node.getLine()
        if (set.has(line)) errors.push(new ParserUsedMultipleTimesError(node))
        set.add(line)
      })
    }
    return errors
  }
  get scopeErrors() {
    let errors = []
    const def = this.definition
    if (def.isSingle) errors = errors.concat(this.singleParserUsedTwiceErrors) // todo: speedup. takes ~1s on pldb.
    if (def.isUniqueLine) errors = errors.concat(this.uniqueLineAppearsTwiceErrors) // todo: speedup. takes ~1s on pldb.
    const { requiredNodeErrors } = this // todo: speedup. takes ~1.5s on pldb.
    if (requiredNodeErrors.length) errors = errors.concat(requiredNodeErrors)
    return errors
  }
  getErrors() {
    return this.cellErrors.concat(this.scopeErrors)
  }
  get parsedCells() {
    return this.definition.cellParser.getCellArray(this)
  }
  // todo: just make a fn that computes proper spacing and then is given a node to print
  get lineCellTypes() {
    return this.parsedCells.map(slot => slot.cellTypeId).join(" ")
  }
  getLineCellPreludeTypes() {
    return this.parsedCells
      .map(slot => {
        const def = slot.cellTypeDefinition
        //todo: cleanup
        return def ? def.preludeKindId : PreludeCellTypeIds.anyCell
      })
      .join(" ")
  }
  getLinePaints(defaultScope = "source") {
    return this.parsedCells.map(slot => slot.paint || defaultScope).join(" ")
  }
  get cellDefinitionLineNumbers() {
    return this.parsedCells.map(cell => cell.definitionLineNumber)
  }
  _getCompiledIndentation() {
    const indentCharacter = this.definition._getCompilerObject()[ParsersConstantsCompiler.indentCharacter]
    const indent = this.indentation
    return indentCharacter !== undefined ? indentCharacter.repeat(indent.length) : indent
  }
  _getFields() {
    // fields are like cells
    const fields = {}
    this.forEach(node => {
      const def = node.definition
      if (def.isRequired() || def.isSingle) fields[node.getWord(0)] = node.content
    })
    return fields
  }
  _getCompiledLine() {
    const compiler = this.definition._getCompilerObject()
    const catchAllCellDelimiter = compiler[ParsersConstantsCompiler.catchAllCellDelimiter]
    const str = compiler[ParsersConstantsCompiler.stringTemplate]
    return str !== undefined ? Utils.formatStr(str, catchAllCellDelimiter, Object.assign(this._getFields(), this.cells)) : this.getLine()
  }
  get listDelimiter() {
    return this.definition._getFromExtended(ParsersConstants.listDelimiter)
  }
  get contentKey() {
    return this.definition._getFromExtended(ParsersConstants.contentKey)
  }
  get childrenKey() {
    return this.definition._getFromExtended(ParsersConstants.childrenKey)
  }
  get childrenAreTextBlob() {
    return this.definition._isBlobParser()
  }
  get isArrayElement() {
    return this.definition._hasFromExtended(ParsersConstants.uniqueFirstWord) ? false : !this.definition.isSingle
  }
  get list() {
    return this.listDelimiter ? this.content.split(this.listDelimiter) : super.list
  }
  get typedContent() {
    // todo: probably a better way to do this, perhaps by defining a cellDelimiter at the node level
    // todo: this currently parse anything other than string types
    if (this.listDelimiter) return this.content.split(this.listDelimiter)
    const cells = this.parsedCells
    if (cells.length === 2) return cells[1].parsed
    return this.content
  }
  get typedTuple() {
    const key = this.firstWord
    if (this.childrenAreTextBlob) return [key, this.childrenToString()]
    const { typedContent, contentKey, childrenKey } = this
    if (contentKey || childrenKey) {
      let obj = {}
      if (childrenKey) obj[childrenKey] = this.childrenToString()
      else obj = this.typedMap
      if (contentKey) {
        obj[contentKey] = typedContent
      }
      return [key, obj]
    }
    const hasChildren = this.length > 0
    const hasChildrenNoContent = typedContent === undefined && hasChildren
    const shouldReturnValueAsObject = hasChildrenNoContent
    if (shouldReturnValueAsObject) return [key, this.typedMap]
    const hasChildrenAndContent = typedContent !== undefined && hasChildren
    const shouldReturnValueAsContentPlusChildren = hasChildrenAndContent
    // If the node has a content and a subtree return it as a string, as
    // Javascript object values can't be both a leaf and a tree.
    if (shouldReturnValueAsContentPlusChildren) return [key, this.contentWithChildren]
    return [key, typedContent]
  }
  get _shouldSerialize() {
    const should = this.shouldSerialize
    return should === undefined ? true : should
  }
  get typedMap() {
    const obj = {}
    this.forEach(node => {
      if (!node._shouldSerialize) return true
      const tuple = node.typedTuple
      if (!node.isArrayElement) obj[tuple[0]] = tuple[1]
      else {
        if (!obj[tuple[0]]) obj[tuple[0]] = []
        obj[tuple[0]].push(tuple[1])
      }
    })
    return obj
  }
  fromTypedMap() {}
  compile() {
    if (this.isRoot()) return super.compile()
    const def = this.definition
    const indent = this._getCompiledIndentation()
    const compiledLine = this._getCompiledLine()
    if (def.isTerminalParser()) return indent + compiledLine
    const compiler = def._getCompilerObject()
    const openChildrenString = compiler[ParsersConstantsCompiler.openChildren] || ""
    const closeChildrenString = compiler[ParsersConstantsCompiler.closeChildren] || ""
    const childJoinCharacter = compiler[ParsersConstantsCompiler.joinChildrenWith] || "\n"
    const compiledChildren = this.map(child => child.compile()).join(childJoinCharacter)
    return `${indent + compiledLine}${openChildrenString}
${compiledChildren}
${indent}${closeChildrenString}`
  }
  // todo: remove
  get cells() {
    const cells = {}
    this.parsedCells.forEach(cell => {
      const cellTypeId = cell.cellTypeId
      if (!cell.isCatchAll()) cells[cellTypeId] = cell.parsed
      else {
        if (!cells[cellTypeId]) cells[cellTypeId] = []
        cells[cellTypeId].push(cell.parsed)
      }
    })
    return cells
  }
}
class BlobParser extends ParserBackedNode {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(BlobParser, {})
  }
  getErrors() {
    return []
  }
}
// todo: can we remove this? hard to extend.
class UnknownParserNode extends ParserBackedNode {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(UnknownParserNode, {})
  }
  getErrors() {
    return [new UnknownParserError(this)]
  }
}
/*
A cell contains a word but also the type information for that word.
*/
class AbstractParsersBackedCell {
  constructor(node, index, typeDef, cellTypeId, isCatchAll, parserDefinitionParser) {
    this._typeDef = typeDef
    this._node = node
    this._isCatchAll = isCatchAll
    this._index = index
    this._cellTypeId = cellTypeId
    this._parserDefinitionParser = parserDefinitionParser
  }
  getWord() {
    return this._node.getWord(this._index)
  }
  get definitionLineNumber() {
    return this._typeDef.lineNumber
  }
  get cellTypeId() {
    return this._cellTypeId
  }
  getNode() {
    return this._node
  }
  get cellIndex() {
    return this._index
  }
  isCatchAll() {
    return this._isCatchAll
  }
  get min() {
    return this.cellTypeDefinition.get(ParsersConstants.min) || "0"
  }
  get max() {
    return this.cellTypeDefinition.get(ParsersConstants.max) || "100"
  }
  get placeholder() {
    return this.cellTypeDefinition.get(ParsersConstants.examples) || ""
  }
  get paint() {
    const definition = this.cellTypeDefinition
    if (definition) return definition.paint // todo: why the undefined?
  }
  getAutoCompleteWords(partialWord = "") {
    const cellDef = this.cellTypeDefinition
    let words = cellDef ? cellDef._getAutocompleteWordOptions(this.getNode().root) : []
    const runTimeOptions = this.getNode().getRunTimeEnumOptions(this)
    if (runTimeOptions) words = runTimeOptions.concat(words)
    if (partialWord) words = words.filter(word => word.includes(partialWord))
    return words.map(word => {
      return {
        text: word,
        displayText: word
      }
    })
  }
  synthesizeCell(seed = Date.now()) {
    // todo: cleanup
    const cellDef = this.cellTypeDefinition
    const enumOptions = cellDef._getFromExtended(ParsersConstants.enum)
    if (enumOptions) return Utils.getRandomString(1, enumOptions.split(" "))
    return this._synthesizeCell(seed)
  }
  _getStumpEnumInput(crux) {
    const cellDef = this.cellTypeDefinition
    const enumOptions = cellDef._getFromExtended(ParsersConstants.enum)
    if (!enumOptions) return undefined
    const options = new TreeNode(
      enumOptions
        .split(" ")
        .map(option => `option ${option}`)
        .join("\n")
    )
    return `select
 name ${crux}
${options.toString(1)}`
  }
  _toStumpInput(crux) {
    // todo: remove
    const enumInput = this._getStumpEnumInput(crux)
    if (enumInput) return enumInput
    // todo: cleanup. We shouldn't have these dual cellType classes.
    return `input
 name ${crux}
 placeholder ${this.placeholder}`
  }
  get cellTypeDefinition() {
    return this._typeDef
  }
  _getErrorContext() {
    return this.getNode().getLine().split(" ")[0] // todo: WordBreakSymbol
  }
  isValid() {
    const runTimeOptions = this.getNode().getRunTimeEnumOptionsForValidation(this)
    const word = this.getWord()
    if (runTimeOptions) return runTimeOptions.includes(word)
    return this.cellTypeDefinition.isValid(word, this.getNode().root) && this._isValid()
  }
  getErrorIfAny() {
    const word = this.getWord()
    if (word !== undefined && this.isValid()) return undefined
    // todo: refactor invalidwordError. We want better error messages.
    return word === undefined || word === "" ? new MissingWordError(this) : new InvalidWordError(this)
  }
}
AbstractParsersBackedCell.parserFunctionName = ""
class ParsersBitCell extends AbstractParsersBackedCell {
  _isValid() {
    const word = this.getWord()
    return word === "0" || word === "1"
  }
  _synthesizeCell() {
    return Utils.getRandomString(1, "01".split(""))
  }
  get regexString() {
    return "[01]"
  }
  get parsed() {
    const word = this.getWord()
    return !!parseInt(word)
  }
}
ParsersBitCell.defaultPaint = "constant.numeric"
class ParsersNumericCell extends AbstractParsersBackedCell {
  _toStumpInput(crux) {
    return `input
 name ${crux}
 type number
 placeholder ${this.placeholder}
 min ${this.min}
 max ${this.max}`
  }
}
class ParsersIntCell extends ParsersNumericCell {
  _isValid() {
    const word = this.getWord()
    const num = parseInt(word)
    if (isNaN(num)) return false
    return num.toString() === word
  }
  _synthesizeCell(seed) {
    return Utils.randomUniformInt(parseInt(this.min), parseInt(this.max), seed).toString()
  }
  get regexString() {
    return "-?[0-9]+"
  }
  get parsed() {
    const word = this.getWord()
    return parseInt(word)
  }
}
ParsersIntCell.defaultPaint = "constant.numeric.integer"
ParsersIntCell.parserFunctionName = "parseInt"
class ParsersFloatCell extends ParsersNumericCell {
  _isValid() {
    const word = this.getWord()
    const num = parseFloat(word)
    return !isNaN(num) && /^-?\d*(\.\d+)?([eE][+-]?\d+)?$/.test(word)
  }
  _synthesizeCell(seed) {
    return Utils.randomUniformFloat(parseFloat(this.min), parseFloat(this.max), seed).toString()
  }
  get regexString() {
    return "-?d*(.d+)?"
  }
  get parsed() {
    const word = this.getWord()
    return parseFloat(word)
  }
}
ParsersFloatCell.defaultPaint = "constant.numeric.float"
ParsersFloatCell.parserFunctionName = "parseFloat"
// ErrorCellType => parsers asks for a '' cell type here but the parsers does not specify a '' cell type. (todo: bring in didyoumean?)
class ParsersBoolCell extends AbstractParsersBackedCell {
  constructor() {
    super(...arguments)
    this._trues = new Set(["1", "true", "t", "yes"])
    this._falses = new Set(["0", "false", "f", "no"])
  }
  _isValid() {
    const word = this.getWord()
    const str = word.toLowerCase()
    return this._trues.has(str) || this._falses.has(str)
  }
  _synthesizeCell() {
    return Utils.getRandomString(1, ["1", "true", "t", "yes", "0", "false", "f", "no"])
  }
  _getOptions() {
    return Array.from(this._trues).concat(Array.from(this._falses))
  }
  get regexString() {
    return "(?:" + this._getOptions().join("|") + ")"
  }
  get parsed() {
    const word = this.getWord()
    return this._trues.has(word.toLowerCase())
  }
}
ParsersBoolCell.defaultPaint = "constant.numeric"
class ParsersAnyCell extends AbstractParsersBackedCell {
  _isValid() {
    return true
  }
  _synthesizeCell() {
    const examples = this.cellTypeDefinition._getFromExtended(ParsersConstants.examples)
    if (examples) return Utils.getRandomString(1, examples.split(" "))
    return this._parserDefinitionParser.parserIdFromDefinition + "-" + this.constructor.name
  }
  get regexString() {
    return "[^ ]+"
  }
  get parsed() {
    return this.getWord()
  }
}
class ParsersKeywordCell extends ParsersAnyCell {
  _synthesizeCell() {
    return this._parserDefinitionParser.cruxIfAny
  }
}
ParsersKeywordCell.defaultPaint = "keyword"
class ParsersExtraWordCellTypeCell extends AbstractParsersBackedCell {
  _isValid() {
    return false
  }
  synthesizeCell() {
    throw new Error(`Trying to synthesize a ParsersExtraWordCellTypeCell`)
    return this._synthesizeCell()
  }
  _synthesizeCell() {
    return "extraWord" // should never occur?
  }
  get parsed() {
    return this.getWord()
  }
  getErrorIfAny() {
    return new ExtraWordError(this)
  }
}
class ParsersUnknownCellTypeCell extends AbstractParsersBackedCell {
  _isValid() {
    return false
  }
  synthesizeCell() {
    throw new Error(`Trying to synthesize an ParsersUnknownCellTypeCell`)
    return this._synthesizeCell()
  }
  _synthesizeCell() {
    return "extraWord" // should never occur?
  }
  get parsed() {
    return this.getWord()
  }
  getErrorIfAny() {
    return new UnknownCellTypeError(this)
  }
}
class AbstractTreeError {
  constructor(node) {
    this._node = node
  }
  getLineIndex() {
    return this.lineNumber - 1
  }
  get lineNumber() {
    return this.getNode()._getLineNumber() // todo: handle sourcemaps
  }
  isCursorOnWord(lineIndex, characterIndex) {
    return lineIndex === this.getLineIndex() && this._doesCharacterIndexFallOnWord(characterIndex)
  }
  _doesCharacterIndexFallOnWord(characterIndex) {
    return this.cellIndex === this.getNode().getWordIndexAtCharacterIndex(characterIndex)
  }
  // convenience method. may be removed.
  isBlankLineError() {
    return false
  }
  // convenience method. may be removed.
  isMissingWordError() {
    return false
  }
  getIndent() {
    return this.getNode().indentation
  }
  getCodeMirrorLineWidgetElement(onApplySuggestionCallBack = () => {}) {
    const suggestion = this.suggestionMessage
    if (this.isMissingWordError()) return this._getCodeMirrorLineWidgetElementCellTypeHints()
    if (suggestion) return this._getCodeMirrorLineWidgetElementWithSuggestion(onApplySuggestionCallBack, suggestion)
    return this._getCodeMirrorLineWidgetElementWithoutSuggestion()
  }
  get parserId() {
    return this.getNode().definition.parserIdFromDefinition
  }
  _getCodeMirrorLineWidgetElementCellTypeHints() {
    const el = document.createElement("div")
    el.appendChild(document.createTextNode(this.getIndent() + this.getNode().definition.lineHints))
    el.className = "LintCellTypeHints"
    return el
  }
  _getCodeMirrorLineWidgetElementWithoutSuggestion() {
    const el = document.createElement("div")
    el.appendChild(document.createTextNode(this.getIndent() + this.message))
    el.className = "LintError"
    return el
  }
  _getCodeMirrorLineWidgetElementWithSuggestion(onApplySuggestionCallBack, suggestion) {
    const el = document.createElement("div")
    el.appendChild(document.createTextNode(this.getIndent() + `${this.errorTypeName}. Suggestion: ${suggestion}`))
    el.className = "LintErrorWithSuggestion"
    el.onclick = () => {
      this.applySuggestion()
      onApplySuggestionCallBack()
    }
    return el
  }
  getLine() {
    return this.getNode().getLine()
  }
  getExtension() {
    return this.getNode().handParsersProgram.extensionName
  }
  getNode() {
    return this._node
  }
  get errorTypeName() {
    return this.constructor.name.replace("Error", "")
  }
  get cellIndex() {
    return 0
  }
  toObject() {
    return {
      type: this.errorTypeName,
      line: this.lineNumber,
      cell: this.cellIndex,
      suggestion: this.suggestionMessage,
      path: this.getNode().getFirstWordPath(),
      message: this.message
    }
  }
  hasSuggestion() {
    return this.suggestionMessage !== ""
  }
  get suggestionMessage() {
    return ""
  }
  toString() {
    return this.message
  }
  applySuggestion() {}
  get message() {
    return `${this.errorTypeName} at line ${this.lineNumber} cell ${this.cellIndex}.`
  }
}
class AbstractCellError extends AbstractTreeError {
  constructor(cell) {
    super(cell.getNode())
    this._cell = cell
  }
  get cell() {
    return this._cell
  }
  get cellIndex() {
    return this._cell.cellIndex
  }
  get wordSuggestion() {
    return Utils.didYouMean(
      this.cell.getWord(),
      this.cell.getAutoCompleteWords().map(option => option.text)
    )
  }
}
class UnknownParserError extends AbstractTreeError {
  get message() {
    const node = this.getNode()
    const parentNode = node.parent
    const options = parentNode._getParser().getFirstWordOptions()
    return super.message + ` Invalid parser "${node.firstWord}". Valid parsers are: ${Utils._listToEnglishText(options, 7)}.`
  }
  get wordSuggestion() {
    const node = this.getNode()
    const parentNode = node.parent
    return Utils.didYouMean(
      node.firstWord,
      parentNode.getAutocompleteResults("", 0).map(option => option.text)
    )
  }
  get suggestionMessage() {
    const suggestion = this.wordSuggestion
    const node = this.getNode()
    if (suggestion) return `Change "${node.firstWord}" to "${suggestion}"`
    return ""
  }
  applySuggestion() {
    const suggestion = this.wordSuggestion
    if (suggestion) this.getNode().setWord(this.cellIndex, suggestion)
    return this
  }
}
class ParserDefinedError extends AbstractTreeError {
  constructor(node, message) {
    super()
    this._node = node
    this._message = message
  }
  get message() {
    return this._message
  }
}
class BlankLineError extends UnknownParserError {
  get message() {
    return super.message + ` Line: "${this.getNode().getLine()}". Blank lines are errors.`
  }
  // convenience method
  isBlankLineError() {
    return true
  }
  get suggestionMessage() {
    return `Delete line ${this.lineNumber}`
  }
  applySuggestion() {
    this.getNode().destroy()
    return this
  }
}
class MissingRequiredParserError extends AbstractTreeError {
  constructor(node, missingParserId) {
    super(node)
    this._missingParserId = missingParserId
  }
  get message() {
    return super.message + ` A "${this._missingParserId}" is required.`
  }
}
class ParserUsedMultipleTimesError extends AbstractTreeError {
  get message() {
    return super.message + ` Multiple "${this.getNode().firstWord}" found.`
  }
  get suggestionMessage() {
    return `Delete line ${this.lineNumber}`
  }
  applySuggestion() {
    return this.getNode().destroy()
  }
}
class LineAppearsMultipleTimesError extends AbstractTreeError {
  get message() {
    return super.message + ` "${this.getNode().getLine()}" appears multiple times.`
  }
  get suggestionMessage() {
    return `Delete line ${this.lineNumber}`
  }
  applySuggestion() {
    return this.getNode().destroy()
  }
}
class UnknownCellTypeError extends AbstractCellError {
  get message() {
    return super.message + ` No cellType "${this.cell.cellTypeId}" found. Language parsers for "${this.getExtension()}" may need to be fixed.`
  }
}
class InvalidWordError extends AbstractCellError {
  get message() {
    return super.message + ` "${this.cell.getWord()}" does not fit in cellType "${this.cell.cellTypeId}".`
  }
  get suggestionMessage() {
    const suggestion = this.wordSuggestion
    if (suggestion) return `Change "${this.cell.getWord()}" to "${suggestion}"`
    return ""
  }
  applySuggestion() {
    const suggestion = this.wordSuggestion
    if (suggestion) this.getNode().setWord(this.cellIndex, suggestion)
    return this
  }
}
class ExtraWordError extends AbstractCellError {
  get message() {
    return super.message + ` Extra word "${this.cell.getWord()}" in ${this.parserId}.`
  }
  get suggestionMessage() {
    return `Delete word "${this.cell.getWord()}" at cell ${this.cellIndex}`
  }
  applySuggestion() {
    return this.getNode().deleteWordAt(this.cellIndex)
  }
}
class MissingWordError extends AbstractCellError {
  // todo: autocomplete suggestion
  get message() {
    return super.message + ` Missing word for cell "${this.cell.cellTypeId}".`
  }
  isMissingWordError() {
    return true
  }
}
// todo: add standard types, enum types, from disk types
class AbstractParsersWordTestParser extends TreeNode {}
class ParsersRegexTestParser extends AbstractParsersWordTestParser {
  isValid(str) {
    if (!this._regex) this._regex = new RegExp("^" + this.content + "$")
    return !!str.match(this._regex)
  }
}
class ParsersReservedWordsTestParser extends AbstractParsersWordTestParser {
  isValid(str) {
    if (!this._set) this._set = new Set(this.content.split(" "))
    return !this._set.has(str)
  }
}
// todo: remove in favor of custom word type constructors
class EnumFromCellTypesTestParser extends AbstractParsersWordTestParser {
  _getEnumFromCellTypes(programRootNode) {
    const cellTypeIds = this.getWordsFrom(1)
    const enumGroup = cellTypeIds.join(" ")
    // note: hack where we store it on the program. otherwise has global effects.
    if (!programRootNode._enumMaps) programRootNode._enumMaps = {}
    if (programRootNode._enumMaps[enumGroup]) return programRootNode._enumMaps[enumGroup]
    const wordIndex = 1
    const map = {}
    const cellTypeMap = {}
    cellTypeIds.forEach(typeId => (cellTypeMap[typeId] = true))
    programRootNode.allTypedWords
      .filter(typedWord => cellTypeMap[typedWord.type])
      .forEach(typedWord => {
        map[typedWord.word] = true
      })
    programRootNode._enumMaps[enumGroup] = map
    return map
  }
  // todo: remove
  isValid(str, programRootNode) {
    return this._getEnumFromCellTypes(programRootNode)[str] === true
  }
}
class ParsersEnumTestNode extends AbstractParsersWordTestParser {
  isValid(str) {
    // enum c c++ java
    return !!this.getOptions()[str]
  }
  getOptions() {
    if (!this._map) this._map = Utils.arrayToMap(this.getWordsFrom(1))
    return this._map
  }
}
class cellTypeDefinitionParser extends AbstractExtendibleTreeNode {
  createParserCombinator() {
    const types = {}
    types[ParsersConstants.regex] = ParsersRegexTestParser
    types[ParsersConstants.reservedWords] = ParsersReservedWordsTestParser
    types[ParsersConstants.enumFromCellTypes] = EnumFromCellTypesTestParser
    types[ParsersConstants.enum] = ParsersEnumTestNode
    types[ParsersConstants.paint] = TreeNode
    types[ParsersConstants.comment] = TreeNode
    types[ParsersConstants.examples] = TreeNode
    types[ParsersConstants.min] = TreeNode
    types[ParsersConstants.max] = TreeNode
    types[ParsersConstants.description] = TreeNode
    types[ParsersConstants.extends] = TreeNode
    return new TreeNode.ParserCombinator(undefined, types)
  }
  get id() {
    return this.getWord(0)
  }
  get idToNodeMap() {
    return this.parent.cellTypeDefinitions
  }
  getGetter(wordIndex) {
    const wordToNativeJavascriptTypeParser = this.getCellConstructor().parserFunctionName
    return `get ${this.cellTypeId}() {
      return ${wordToNativeJavascriptTypeParser ? wordToNativeJavascriptTypeParser + `(this.getWord(${wordIndex}))` : `this.getWord(${wordIndex})`}
    }`
  }
  getCatchAllGetter(wordIndex) {
    const wordToNativeJavascriptTypeParser = this.getCellConstructor().parserFunctionName
    return `get ${this.cellTypeId}() {
      return ${wordToNativeJavascriptTypeParser ? `this.getWordsFrom(${wordIndex}).map(val => ${wordToNativeJavascriptTypeParser}(val))` : `this.getWordsFrom(${wordIndex})`}
    }`
  }
  // `this.getWordsFrom(${requireds.length + 1})`
  // todo: cleanup typings. todo: remove this hidden logic. have a "baseType" property?
  getCellConstructor() {
    return this.preludeKind || ParsersAnyCell
  }
  get preludeKind() {
    return PreludeKinds[this.getWord(0)] || PreludeKinds[this._getExtendedCellTypeId()]
  }
  get preludeKindId() {
    if (PreludeKinds[this.getWord(0)]) return this.getWord(0)
    else if (PreludeKinds[this._getExtendedCellTypeId()]) return this._getExtendedCellTypeId()
    return PreludeCellTypeIds.anyCell
  }
  _getExtendedCellTypeId() {
    const arr = this._getAncestorsArray()
    return arr[arr.length - 1].id
  }
  get paint() {
    const hs = this._getFromExtended(ParsersConstants.paint)
    if (hs) return hs
    const preludeKind = this.preludeKind
    if (preludeKind) return preludeKind.defaultPaint
  }
  _getEnumOptions() {
    const enumNode = this._getNodeFromExtended(ParsersConstants.enum)
    if (!enumNode) return undefined
    // we sort by longest first to capture longest match first. todo: add test
    const options = Object.keys(enumNode.getNode(ParsersConstants.enum).getOptions())
    options.sort((a, b) => b.length - a.length)
    return options
  }
  _getEnumFromCellTypeOptions(program) {
    const node = this._getNodeFromExtended(ParsersConstants.enumFromCellTypes)
    return node ? Object.keys(node.getNode(ParsersConstants.enumFromCellTypes)._getEnumFromCellTypes(program)) : undefined
  }
  _getAutocompleteWordOptions(program) {
    return this._getEnumOptions() || this._getEnumFromCellTypeOptions(program) || []
  }
  get regexString() {
    // todo: enum
    const enumOptions = this._getEnumOptions()
    return this._getFromExtended(ParsersConstants.regex) || (enumOptions ? "(?:" + enumOptions.join("|") + ")" : "[^ ]*")
  }
  _getAllTests() {
    return this._getChildrenByParserInExtended(AbstractParsersWordTestParser)
  }
  isValid(str, programRootNode) {
    return this._getAllTests().every(node => node.isValid(str, programRootNode))
  }
  get cellTypeId() {
    return this.getWord(0)
  }
}
class AbstractCellParser {
  constructor(definition) {
    this._definition = definition
  }
  get catchAllCellTypeId() {
    return this._definition._getFromExtended(ParsersConstants.catchAllCellType)
  }
  // todo: improve layout (use bold?)
  get lineHints() {
    const catchAllCellTypeId = this.catchAllCellTypeId
    const parserId = this._definition.cruxIfAny || this._definition.id // todo: cleanup
    return `${parserId}: ${this.getRequiredCellTypeIds().join(" ")}${catchAllCellTypeId ? ` ${catchAllCellTypeId}...` : ""}`
  }
  getRequiredCellTypeIds() {
    if (!this._requiredCellTypeIds) {
      const parameters = this._definition._getFromExtended(ParsersConstants.cells)
      this._requiredCellTypeIds = parameters ? parameters.split(" ") : []
    }
    return this._requiredCellTypeIds
  }
  _getCellTypeId(cellIndex, requiredCellTypeIds, totalWordCount) {
    return requiredCellTypeIds[cellIndex]
  }
  _isCatchAllCell(cellIndex, numberOfRequiredCells, totalWordCount) {
    return cellIndex >= numberOfRequiredCells
  }
  getCellArray(node = undefined) {
    const wordCount = node ? node.words.length : 0
    const def = this._definition
    const parsersProgram = def.languageDefinitionProgram
    const requiredCellTypeIds = this.getRequiredCellTypeIds()
    const numberOfRequiredCells = requiredCellTypeIds.length
    const actualWordCountOrRequiredCellCount = Math.max(wordCount, numberOfRequiredCells)
    const cells = []
    // A for loop instead of map because "numberOfCellsToFill" can be longer than words.length
    for (let cellIndex = 0; cellIndex < actualWordCountOrRequiredCellCount; cellIndex++) {
      const isCatchAll = this._isCatchAllCell(cellIndex, numberOfRequiredCells, wordCount)
      let cellTypeId = isCatchAll ? this.catchAllCellTypeId : this._getCellTypeId(cellIndex, requiredCellTypeIds, wordCount)
      let cellTypeDefinition = parsersProgram.getCellTypeDefinitionById(cellTypeId)
      let cellConstructor
      if (cellTypeDefinition) cellConstructor = cellTypeDefinition.getCellConstructor()
      else if (cellTypeId) cellConstructor = ParsersUnknownCellTypeCell
      else {
        cellConstructor = ParsersExtraWordCellTypeCell
        cellTypeId = PreludeCellTypeIds.extraWordCell
        cellTypeDefinition = parsersProgram.getCellTypeDefinitionById(cellTypeId)
      }
      const anyCellConstructor = cellConstructor
      cells[cellIndex] = new anyCellConstructor(node, cellIndex, cellTypeDefinition, cellTypeId, isCatchAll, def)
    }
    return cells
  }
}
class PrefixCellParser extends AbstractCellParser {}
class PostfixCellParser extends AbstractCellParser {
  _isCatchAllCell(cellIndex, numberOfRequiredCells, totalWordCount) {
    return cellIndex < totalWordCount - numberOfRequiredCells
  }
  _getCellTypeId(cellIndex, requiredCellTypeIds, totalWordCount) {
    const catchAllWordCount = Math.max(totalWordCount - requiredCellTypeIds.length, 0)
    return requiredCellTypeIds[cellIndex - catchAllWordCount]
  }
}
class OmnifixCellParser extends AbstractCellParser {
  getCellArray(node = undefined) {
    const cells = []
    const def = this._definition
    const program = node ? node.root : undefined
    const parsersProgram = def.languageDefinitionProgram
    const words = node ? node.words : []
    const requiredCellTypeDefs = this.getRequiredCellTypeIds().map(cellTypeId => parsersProgram.getCellTypeDefinitionById(cellTypeId))
    const catchAllCellTypeId = this.catchAllCellTypeId
    const catchAllCellTypeDef = catchAllCellTypeId && parsersProgram.getCellTypeDefinitionById(catchAllCellTypeId)
    words.forEach((word, wordIndex) => {
      let cellConstructor
      for (let index = 0; index < requiredCellTypeDefs.length; index++) {
        const cellTypeDefinition = requiredCellTypeDefs[index]
        if (cellTypeDefinition.isValid(word, program)) {
          // todo: cleanup cellIndex/wordIndex stuff
          cellConstructor = cellTypeDefinition.getCellConstructor()
          cells.push(new cellConstructor(node, wordIndex, cellTypeDefinition, cellTypeDefinition.id, false, def))
          requiredCellTypeDefs.splice(index, 1)
          return true
        }
      }
      if (catchAllCellTypeDef && catchAllCellTypeDef.isValid(word, program)) {
        cellConstructor = catchAllCellTypeDef.getCellConstructor()
        cells.push(new cellConstructor(node, wordIndex, catchAllCellTypeDef, catchAllCellTypeId, true, def))
        return true
      }
      cells.push(new ParsersUnknownCellTypeCell(node, wordIndex, undefined, undefined, false, def))
    })
    const wordCount = words.length
    requiredCellTypeDefs.forEach((cellTypeDef, index) => {
      let cellConstructor = cellTypeDef.getCellConstructor()
      cells.push(new cellConstructor(node, wordCount + index, cellTypeDef, cellTypeDef.id, false, def))
    })
    return cells
  }
}
class ParsersExampleParser extends TreeNode {}
class ParsersCompilerParser extends TreeNode {
  createParserCombinator() {
    const types = [
      ParsersConstantsCompiler.stringTemplate,
      ParsersConstantsCompiler.indentCharacter,
      ParsersConstantsCompiler.catchAllCellDelimiter,
      ParsersConstantsCompiler.joinChildrenWith,
      ParsersConstantsCompiler.openChildren,
      ParsersConstantsCompiler.closeChildren
    ]
    const map = {}
    types.forEach(type => {
      map[type] = TreeNode
    })
    return new TreeNode.ParserCombinator(undefined, map)
  }
}
class AbstractParserConstantParser extends TreeNode {
  constructor(children, line, parent) {
    super(children, line, parent)
    parent[this.identifier] = this.constantValue
  }
  getGetter() {
    return `get ${this.identifier}() { return ${this.constantValueAsJsText} }`
  }
  get identifier() {
    return this.getWord(1)
  }
  get constantValueAsJsText() {
    const words = this.getWordsFrom(2)
    return words.length > 1 ? `[${words.join(",")}]` : words[0]
  }
  get constantValue() {
    return JSON.parse(this.constantValueAsJsText)
  }
}
class ParsersParserConstantInt extends AbstractParserConstantParser {}
class ParsersParserConstantString extends AbstractParserConstantParser {
  get constantValueAsJsText() {
    return "`" + Utils.escapeBackTicks(this.constantValue) + "`"
  }
  get constantValue() {
    return this.length ? this.childrenToString() : this.getWordsFrom(2).join(" ")
  }
}
class ParsersParserConstantFloat extends AbstractParserConstantParser {}
class ParsersParserConstantBoolean extends AbstractParserConstantParser {}
class AbstractParserDefinitionParser extends AbstractExtendibleTreeNode {
  createParserCombinator() {
    // todo: some of these should just be on nonRootNodes
    const types = [
      ParsersConstants.frequency,
      ParsersConstants.inScope,
      ParsersConstants.cells,
      ParsersConstants.extends,
      ParsersConstants.description,
      ParsersConstants.catchAllParser,
      ParsersConstants.catchAllCellType,
      ParsersConstants.cellParser,
      ParsersConstants.extensions,
      ParsersConstants.version,
      ParsersConstants.tags,
      ParsersConstants.crux,
      ParsersConstants.cruxFromId,
      ParsersConstants.listDelimiter,
      ParsersConstants.contentKey,
      ParsersConstants.childrenKey,
      ParsersConstants.uniqueFirstWord,
      ParsersConstants.uniqueLine,
      ParsersConstants.pattern,
      ParsersConstants.baseParser,
      ParsersConstants.required,
      ParsersConstants.root,
      ParsersConstants._extendsJsClass,
      ParsersConstants._rootNodeJsHeader,
      ParsersConstants.javascript,
      ParsersConstants.compilesTo,
      ParsersConstants.javascript,
      ParsersConstants.single,
      ParsersConstants.comment
    ]
    const map = {}
    types.forEach(type => {
      map[type] = TreeNode
    })
    map[ParsersConstantsConstantTypes.boolean] = ParsersParserConstantBoolean
    map[ParsersConstantsConstantTypes.int] = ParsersParserConstantInt
    map[ParsersConstantsConstantTypes.string] = ParsersParserConstantString
    map[ParsersConstantsConstantTypes.float] = ParsersParserConstantFloat
    map[ParsersConstants.compilerParser] = ParsersCompilerParser
    map[ParsersConstants.example] = ParsersExampleParser
    return new TreeNode.ParserCombinator(undefined, map, [{ regex: HandParsersProgram.parserFullRegex, parser: parserDefinitionParser }])
  }
  toTypeScriptInterface(used = new Set()) {
    let childrenInterfaces = []
    let properties = []
    const inScope = this.firstWordMapWithDefinitions
    const thisId = this.id
    used.add(thisId)
    Object.keys(inScope).forEach(key => {
      const def = inScope[key]
      const map = def.firstWordMapWithDefinitions
      const id = def.id
      const optionalTag = def.isRequired() ? "" : "?"
      const escapedKey = key.match(/\?/) ? `"${key}"` : key
      const description = def.description
      if (Object.keys(map).length && !used.has(id)) {
        childrenInterfaces.push(def.toTypeScriptInterface(used))
        properties.push(` ${escapedKey}${optionalTag}: ${id}`)
      } else properties.push(` ${escapedKey}${optionalTag}: any${description ? " // " + description : ""}`)
    })
    properties.sort()
    const description = this.description
    const myInterface = ""
    return `${childrenInterfaces.join("\n")}
${description ? "// " + description : ""}
interface ${thisId} {
${properties.join("\n")}
}`.trim()
  }
  get id() {
    return this.getWord(0)
  }
  get idWithoutSuffix() {
    return this.id.replace(HandParsersProgram.parserSuffixRegex, "")
  }
  get constantsObject() {
    const obj = this._getUniqueConstantNodes()
    Object.keys(obj).forEach(key => (obj[key] = obj[key].constantValue))
    return obj
  }
  _getUniqueConstantNodes(extended = true) {
    const obj = {}
    const items = extended ? this._getChildrenByParserInExtended(AbstractParserConstantParser) : this.getChildrenByParser(AbstractParserConstantParser)
    items.reverse() // Last definition wins.
    items.forEach(node => (obj[node.identifier] = node))
    return obj
  }
  get examples() {
    return this._getChildrenByParserInExtended(ParsersExampleParser)
  }
  get parserIdFromDefinition() {
    return this.getWord(0)
  }
  // todo: remove? just reused parserId
  get generatedClassName() {
    return this.parserIdFromDefinition
  }
  _hasValidParserId() {
    return !!this.generatedClassName
  }
  _isAbstract() {
    return this.id.startsWith(ParsersConstants.abstractParserPrefix)
  }
  get cruxIfAny() {
    return this.get(ParsersConstants.crux) || (this._hasFromExtended(ParsersConstants.cruxFromId) ? this.idWithoutSuffix : undefined)
  }
  get regexMatch() {
    return this.get(ParsersConstants.pattern)
  }
  get firstCellEnumOptions() {
    const firstCellDef = this._getMyCellTypeDefs()[0]
    return firstCellDef ? firstCellDef._getEnumOptions() : undefined
  }
  get languageDefinitionProgram() {
    return this.root
  }
  get customJavascriptMethods() {
    const hasJsCode = this.has(ParsersConstants.javascript)
    return hasJsCode ? this.getNode(ParsersConstants.javascript).childrenToString() : ""
  }
  get firstWordMapWithDefinitions() {
    if (!this._cache_firstWordToNodeDefMap) this._cache_firstWordToNodeDefMap = this._createParserInfo(this._getInScopeParserIds()).firstWordMap
    return this._cache_firstWordToNodeDefMap
  }
  // todo: remove
  get runTimeFirstWordsInScope() {
    return this._getParser().getFirstWordOptions()
  }
  _getMyCellTypeDefs() {
    const requiredCells = this.get(ParsersConstants.cells)
    if (!requiredCells) return []
    const parsersProgram = this.languageDefinitionProgram
    return requiredCells.split(" ").map(cellTypeId => {
      const cellTypeDef = parsersProgram.getCellTypeDefinitionById(cellTypeId)
      if (!cellTypeDef) throw new Error(`No cellType "${cellTypeId}" found`)
      return cellTypeDef
    })
  }
  // todo: what happens when you have a cell getter and constant with same name?
  get cellGettersAndParserConstants() {
    // todo: add cellType parsings
    const parsersProgram = this.languageDefinitionProgram
    const getters = this._getMyCellTypeDefs().map((cellTypeDef, index) => cellTypeDef.getGetter(index))
    const catchAllCellTypeId = this.get(ParsersConstants.catchAllCellType)
    if (catchAllCellTypeId) getters.push(parsersProgram.getCellTypeDefinitionById(catchAllCellTypeId).getCatchAllGetter(getters.length))
    // Constants
    Object.values(this._getUniqueConstantNodes(false)).forEach(node => getters.push(node.getGetter()))
    return getters.join("\n")
  }
  _createParserInfo(parserIdsInScope) {
    const result = {
      firstWordMap: {},
      regexTests: []
    }
    if (!parserIdsInScope.length) return result
    const allProgramParserDefinitionsMap = this.programParserDefinitionCache
    Object.keys(allProgramParserDefinitionsMap)
      .filter(parserId => {
        const def = allProgramParserDefinitionsMap[parserId]
        return def.isOrExtendsAParserInScope(parserIdsInScope) && !def._isAbstract()
      })
      .forEach(parserId => {
        const def = allProgramParserDefinitionsMap[parserId]
        const regex = def.regexMatch
        const crux = def.cruxIfAny
        const enumOptions = def.firstCellEnumOptions
        if (regex) result.regexTests.push({ regex: regex, parser: def.parserIdFromDefinition })
        else if (crux) result.firstWordMap[crux] = def
        else if (enumOptions) {
          enumOptions.forEach(option => (result.firstWordMap[option] = def))
        }
      })
    return result
  }
  get topParserDefinitions() {
    const arr = Object.values(this.firstWordMapWithDefinitions)
    arr.sort(Utils.makeSortByFn(definition => definition.frequency))
    arr.reverse()
    return arr
  }
  _getMyInScopeParserIds(target = this) {
    const parsersNode = target.getNode(ParsersConstants.inScope)
    const scopedDefinitionIds = target.myScopedParserDefinitions.map(def => def.id)
    return parsersNode ? parsersNode.getWordsFrom(1).concat(scopedDefinitionIds) : scopedDefinitionIds
  }
  _getInScopeParserIds() {
    // todo: allow multiple of these if we allow mixins?
    const ids = this._getMyInScopeParserIds()
    const parentDef = this._getExtendedParent()
    return parentDef ? ids.concat(parentDef._getInScopeParserIds()) : ids
  }
  get isSingle() {
    const hit = this._getNodeFromExtended(ParsersConstants.single)
    return hit && hit.get(ParsersConstants.single) !== "false"
  }
  get isUniqueLine() {
    const hit = this._getNodeFromExtended(ParsersConstants.uniqueLine)
    return hit && hit.get(ParsersConstants.uniqueLine) !== "false"
  }
  isRequired() {
    return this._hasFromExtended(ParsersConstants.required)
  }
  getParserDefinitionByParserId(parserId) {
    // todo: return catch all?
    const def = this.programParserDefinitionCache[parserId]
    if (def) return def
    this.languageDefinitionProgram._addDefaultCatchAllBlobParser() // todo: cleanup. Why did I do this? Needs to be removed or documented.
    const nodeDef = this.languageDefinitionProgram.programParserDefinitionCache[parserId]
    if (!nodeDef) throw new Error(`No definition found for parser id "${parserId}". Node: \n---\n${this.asString}\n---`)
    return nodeDef
  }
  isDefined(parserId) {
    return !!this.programParserDefinitionCache[parserId]
  }
  get idToNodeMap() {
    return this.programParserDefinitionCache
  }
  _amIRoot() {
    if (this._cache_isRoot === undefined) this._cache_isRoot = this._languageRootNode === this
    return this._cache_isRoot
  }
  get _languageRootNode() {
    return this.root.rootParserDefinition
  }
  _isErrorParser() {
    return this.get(ParsersConstants.baseParser) === ParsersConstants.errorParser
  }
  _isBlobParser() {
    // Do not check extended classes. Only do once.
    return this._getFromExtended(ParsersConstants.baseParser) === ParsersConstants.blobParser
  }
  get errorMethodToJavascript() {
    if (this._isBlobParser()) return "getErrors() { return [] }" // Skips parsing child nodes for perf gains.
    if (this._isErrorParser()) return "getErrors() { return this._getErrorParserErrors() }"
    return ""
  }
  get parserAsJavascript() {
    if (this._isBlobParser())
      // todo: do we need this?
      return "createParserCombinator() { return new TreeNode.ParserCombinator(this._getBlobParserCatchAllParser())}"
    const parserInfo = this._createParserInfo(this._getMyInScopeParserIds())
    const myFirstWordMap = parserInfo.firstWordMap
    const regexRules = parserInfo.regexTests
    // todo: use constants in first word maps?
    // todo: cache the super extending?
    const firstWords = Object.keys(myFirstWordMap)
    const hasFirstWords = firstWords.length
    const catchAllParser = this.catchAllParserToJavascript
    if (!hasFirstWords && !catchAllParser && !regexRules.length) return ""
    const firstWordsStr = hasFirstWords
      ? `Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), {` + firstWords.map(firstWord => `"${firstWord}" : ${myFirstWordMap[firstWord].parserIdFromDefinition}`).join(",\n") + "})"
      : "undefined"
    const regexStr = regexRules.length
      ? `[${regexRules
          .map(rule => {
            return `{regex: /${rule.regex}/, parser: ${rule.parser}}`
          })
          .join(",")}]`
      : "undefined"
    const catchAllStr = catchAllParser ? catchAllParser : this._amIRoot() ? `this._getBlobParserCatchAllParser()` : "undefined"
    const scopedParserJavascript = this.myScopedParserDefinitions.map(def => def.asJavascriptClass).join("\n\n")
    return `createParserCombinator() {${scopedParserJavascript}
  return new TreeNode.ParserCombinator(${catchAllStr}, ${firstWordsStr}, ${regexStr})
  }`
  }
  get myScopedParserDefinitions() {
    return this.getChildrenByParser(parserDefinitionParser)
  }
  get catchAllParserToJavascript() {
    if (this._isBlobParser()) return "this._getBlobParserCatchAllParser()"
    const parserId = this.get(ParsersConstants.catchAllParser)
    if (!parserId) return ""
    const nodeDef = this.getParserDefinitionByParserId(parserId)
    return nodeDef.generatedClassName
  }
  get asJavascriptClass() {
    const components = [this.parserAsJavascript, this.errorMethodToJavascript, this.cellGettersAndParserConstants, this.customJavascriptMethods].filter(identity => identity)
    const thisClassName = this.generatedClassName
    if (this._amIRoot()) {
      components.push(`static cachedHandParsersProgramRoot = new HandParsersProgram(\`${Utils.escapeBackTicks(this.parent.toString().replace(/\\/g, "\\\\"))}\`)
        get handParsersProgram() {
          return this.constructor.cachedHandParsersProgramRoot
      }`)
      components.push(`static rootParser = ${thisClassName}`)
    }
    return `class ${thisClassName} extends ${this._getExtendsClassName()} {
      ${components.join("\n")}
    }`
  }
  _getExtendsClassName() {
    // todo: this is hopefully a temporary line in place for now for the case where you want your base class to extend something other than another treeclass
    const hardCodedExtend = this.get(ParsersConstants._extendsJsClass)
    if (hardCodedExtend) return hardCodedExtend
    const extendedDef = this._getExtendedParent()
    return extendedDef ? extendedDef.generatedClassName : "ParserBackedNode"
  }
  _getCompilerObject() {
    let obj = {}
    const items = this._getChildrenByParserInExtended(ParsersCompilerParser)
    items.reverse() // Last definition wins.
    items.forEach(node => {
      obj = Object.assign(obj, node.toObject()) // todo: what about multiline strings?
    })
    return obj
  }
  // todo: improve layout (use bold?)
  get lineHints() {
    return this.cellParser.lineHints
  }
  isOrExtendsAParserInScope(firstWordsInScope) {
    const chain = this._getParserInheritanceSet()
    return firstWordsInScope.some(firstWord => chain.has(firstWord))
  }
  isTerminalParser() {
    return !this._getFromExtended(ParsersConstants.inScope) && !this._getFromExtended(ParsersConstants.catchAllParser)
  }
  get sublimeMatchLine() {
    const regexMatch = this.regexMatch
    if (regexMatch) return `'${regexMatch}'`
    const cruxMatch = this.cruxIfAny
    if (cruxMatch) return `'^ *${Utils.escapeRegExp(cruxMatch)}(?: |$)'`
    const enumOptions = this.firstCellEnumOptions
    if (enumOptions) return `'^ *(${Utils.escapeRegExp(enumOptions.join("|"))})(?: |$)'`
  }
  // todo: refactor. move some parts to cellParser?
  _toSublimeMatchBlock() {
    const defaultPaint = "source"
    const program = this.languageDefinitionProgram
    const cellParser = this.cellParser
    const requiredCellTypeIds = cellParser.getRequiredCellTypeIds()
    const catchAllCellTypeId = cellParser.catchAllCellTypeId
    const firstCellTypeDef = program.getCellTypeDefinitionById(requiredCellTypeIds[0])
    const firstWordPaint = (firstCellTypeDef ? firstCellTypeDef.paint : defaultPaint) + "." + this.parserIdFromDefinition
    const topHalf = ` '${this.parserIdFromDefinition}':
  - match: ${this.sublimeMatchLine}
    scope: ${firstWordPaint}`
    if (catchAllCellTypeId) requiredCellTypeIds.push(catchAllCellTypeId)
    if (!requiredCellTypeIds.length) return topHalf
    const captures = requiredCellTypeIds
      .map((cellTypeId, index) => {
        const cellTypeDefinition = program.getCellTypeDefinitionById(cellTypeId) // todo: cleanup
        if (!cellTypeDefinition) throw new Error(`No ${ParsersConstants.cellType} ${cellTypeId} found`) // todo: standardize error/capture error at parsers time
        return `        ${index + 1}: ${(cellTypeDefinition.paint || defaultPaint) + "." + cellTypeDefinition.cellTypeId}`
      })
      .join("\n")
    const cellTypesToRegex = cellTypeIds => cellTypeIds.map(cellTypeId => `({{${cellTypeId}}})?`).join(" ?")
    return `${topHalf}
    push:
     - match: ${cellTypesToRegex(requiredCellTypeIds)}
       captures:
${captures}
     - match: $
       pop: true`
  }
  _getParserInheritanceSet() {
    if (!this._cache_parserInheritanceSet) this._cache_parserInheritanceSet = new Set(this.ancestorParserIdsArray)
    return this._cache_parserInheritanceSet
  }
  get ancestorParserIdsArray() {
    if (!this._cache_ancestorParserIdsArray) {
      this._cache_ancestorParserIdsArray = this._getAncestorsArray().map(def => def.parserIdFromDefinition)
      this._cache_ancestorParserIdsArray.reverse()
    }
    return this._cache_ancestorParserIdsArray
  }
  get programParserDefinitionCache() {
    if (!this._cache_parserDefinitionParsers) this._cache_parserDefinitionParsers = this.isRoot || this.hasParserDefinitions ? this.makeProgramParserDefinitionCache() : this.parent.programParserDefinitionCache
    return this._cache_parserDefinitionParsers
  }
  get hasParserDefinitions() {
    return !!this.getChildrenByParser(parserDefinitionParser).length
  }
  makeProgramParserDefinitionCache() {
    const scopedParsers = this.getChildrenByParser(parserDefinitionParser)
    const cache = Object.assign({}, this.parent.programParserDefinitionCache) // todo. We don't really need this. we should just lookup the parent if no local hits.
    scopedParsers.forEach(parserDefinitionParser => (cache[parserDefinitionParser.parserIdFromDefinition] = parserDefinitionParser))
    return cache
  }
  get description() {
    return this._getFromExtended(ParsersConstants.description) || ""
  }
  get frequency() {
    const val = this._getFromExtended(ParsersConstants.frequency)
    return val ? parseFloat(val) : 0
  }
  _getExtendedParserId() {
    const ancestorIds = this.ancestorParserIdsArray
    if (ancestorIds.length > 1) return ancestorIds[ancestorIds.length - 2]
  }
  _toStumpString() {
    const crux = this.cruxIfAny
    const cellArray = this.cellParser.getCellArray().filter((item, index) => index) // for now this only works for keyword langs
    if (!cellArray.length)
      // todo: remove this! just doing it for now until we refactor getCellArray to handle catchAlls better.
      return ""
    const cells = new TreeNode(cellArray.map((cell, index) => cell._toStumpInput(crux)).join("\n"))
    return `div
 label ${crux}
${cells.toString(1)}`
  }
  toStumpString() {
    const nodeBreakSymbol = "\n"
    return this._getConcreteNonErrorInScopeNodeDefinitions(this._getInScopeParserIds())
      .map(def => def._toStumpString())
      .filter(identity => identity)
      .join(nodeBreakSymbol)
  }
  _generateSimulatedLine(seed) {
    // todo: generate simulated data from catch all
    const crux = this.cruxIfAny
    return this.cellParser
      .getCellArray()
      .map((cell, index) => (!index && crux ? crux : cell.synthesizeCell(seed)))
      .join(" ")
  }
  _shouldSynthesize(def, parserChain) {
    if (def._isErrorParser() || def._isAbstract()) return false
    if (parserChain.includes(def.id)) return false
    const tags = def.get(ParsersConstants.tags)
    if (tags && tags.includes(ParsersConstantsMisc.doNotSynthesize)) return false
    return true
  }
  // Get all definitions in this current scope down, even ones that are scoped inside other definitions.
  get inScopeAndDescendantDefinitions() {
    return this.languageDefinitionProgram._collectAllDefinitions(Object.values(this.programParserDefinitionCache), [])
  }
  _collectAllDefinitions(defs, collection = []) {
    defs.forEach(def => {
      collection.push(def)
      def._collectAllDefinitions(def.getChildrenByParser(parserDefinitionParser), collection)
    })
    return collection
  }
  get cruxPath() {
    const parentPath = this.parent.cruxPath
    return (parentPath ? parentPath + " " : "") + this.cruxIfAny
  }
  get cruxPathAsColumnName() {
    return this.cruxPath.replace(/ /g, "_")
  }
  // Get every definition that extends from this one, even ones that are scoped inside other definitions.
  get concreteDescendantDefinitions() {
    const { inScopeAndDescendantDefinitions, id } = this
    return Object.values(inScopeAndDescendantDefinitions).filter(def => def._doesExtend(id) && !def._isAbstract())
  }
  get concreteInScopeDescendantDefinitions() {
    // Note: non-recursive.
    const defs = this.programParserDefinitionCache
    const id = this.id
    return Object.values(defs).filter(def => def._doesExtend(id) && !def._isAbstract())
  }
  _getConcreteNonErrorInScopeNodeDefinitions(parserIds) {
    const defs = []
    parserIds.forEach(parserId => {
      const def = this.getParserDefinitionByParserId(parserId)
      if (def._isErrorParser()) return
      else if (def._isAbstract()) def.concreteInScopeDescendantDefinitions.forEach(def => defs.push(def))
      else defs.push(def)
    })
    return defs
  }
  // todo: refactor
  synthesizeNode(nodeCount = 1, indentCount = -1, parsersAlreadySynthesized = [], seed = Date.now()) {
    let inScopeParserIds = this._getInScopeParserIds()
    const catchAllParserId = this._getFromExtended(ParsersConstants.catchAllParser)
    if (catchAllParserId) inScopeParserIds.push(catchAllParserId)
    const thisId = this.id
    if (!parsersAlreadySynthesized.includes(thisId)) parsersAlreadySynthesized.push(thisId)
    const lines = []
    while (nodeCount) {
      const line = this._generateSimulatedLine(seed)
      if (line) lines.push(" ".repeat(indentCount >= 0 ? indentCount : 0) + line)
      this._getConcreteNonErrorInScopeNodeDefinitions(inScopeParserIds.filter(parserId => !parsersAlreadySynthesized.includes(parserId)))
        .filter(def => this._shouldSynthesize(def, parsersAlreadySynthesized))
        .forEach(def => {
          const chain = parsersAlreadySynthesized // .slice(0)
          chain.push(def.id)
          def.synthesizeNode(1, indentCount + 1, chain, seed).forEach(line => lines.push(line))
        })
      nodeCount--
    }
    return lines
  }
  get cellParser() {
    if (!this._cellParser) {
      const cellParsingStrategy = this._getFromExtended(ParsersConstants.cellParser)
      if (cellParsingStrategy === ParsersCellParser.postfix) this._cellParser = new PostfixCellParser(this)
      else if (cellParsingStrategy === ParsersCellParser.omnifix) this._cellParser = new OmnifixCellParser(this)
      else this._cellParser = new PrefixCellParser(this)
    }
    return this._cellParser
  }
}
// todo: remove?
class parserDefinitionParser extends AbstractParserDefinitionParser {}
// HandParsersProgram is a constructor that takes a parsers file, and builds a new
// constructor for new language that takes files in that language to execute, compile, etc.
class HandParsersProgram extends AbstractParserDefinitionParser {
  createParserCombinator() {
    const map = {}
    map[ParsersConstants.comment] = TreeNode
    return new TreeNode.ParserCombinator(UnknownParserNode, map, [
      { regex: HandParsersProgram.blankLineRegex, parser: TreeNode },
      { regex: HandParsersProgram.parserFullRegex, parser: parserDefinitionParser },
      { regex: HandParsersProgram.cellTypeFullRegex, parser: cellTypeDefinitionParser }
    ])
  }
  // rootParser
  // Note: this is some so far unavoidable tricky code. We need to eval the transpiled JS, in a NodeJS or browser environment.
  _compileAndReturnRootParser() {
    if (this._cache_rootParser) return this._cache_rootParser
    if (!this.isNodeJs()) {
      this._cache_rootParser = Utils.appendCodeAndReturnValueOnWindow(this.toBrowserJavascript(), this.rootParserId).rootParser
      return this._cache_rootParser
    }
    const path = require("path")
    const code = this.toNodeJsJavascript(__dirname)
    try {
      const rootNode = this._requireInVmNodeJsRootParser(code)
      this._cache_rootParser = rootNode.rootParser
      if (!this._cache_rootParser) throw new Error(`Failed to rootParser`)
    } catch (err) {
      // todo: figure out best error pattern here for debugging
      console.log(err)
      // console.log(`Error in code: `)
      // console.log(new TreeNode(code).toStringWithLineNumbers())
    }
    return this._cache_rootParser
  }
  get cruxPath() {
    return ""
  }
  trainModel(programs, rootParser = this.compileAndReturnRootParser()) {
    const nodeDefs = this.validConcreteAndAbstractParserDefinitions
    const nodeDefCountIncludingRoot = nodeDefs.length + 1
    const matrix = Utils.makeMatrix(nodeDefCountIncludingRoot, nodeDefCountIncludingRoot, 0)
    const idToIndex = {}
    const indexToId = {}
    nodeDefs.forEach((def, index) => {
      const id = def.id
      idToIndex[id] = index + 1
      indexToId[index + 1] = id
    })
    programs.forEach(code => {
      const exampleProgram = new rootParser(code)
      exampleProgram.topDownArray.forEach(node => {
        const nodeIndex = idToIndex[node.definition.id]
        const parentNode = node.parent
        if (!nodeIndex) return undefined
        if (parentNode.isRoot()) matrix[0][nodeIndex]++
        else {
          const parentIndex = idToIndex[parentNode.definition.id]
          if (!parentIndex) return undefined
          matrix[parentIndex][nodeIndex]++
        }
      })
    })
    return {
      idToIndex,
      indexToId,
      matrix
    }
  }
  _mapPredictions(predictionsVector, model) {
    const total = Utils.sum(predictionsVector)
    const predictions = predictionsVector.slice(1).map((count, index) => {
      const id = model.indexToId[index + 1]
      return {
        id,
        def: this.getParserDefinitionByParserId(id),
        count,
        prob: count / total
      }
    })
    predictions.sort(Utils.makeSortByFn(prediction => prediction.count)).reverse()
    return predictions
  }
  predictChildren(model, node) {
    return this._mapPredictions(this._predictChildren(model, node), model)
  }
  predictParents(model, node) {
    return this._mapPredictions(this._predictParents(model, node), model)
  }
  _predictChildren(model, node) {
    return model.matrix[node.isRoot() ? 0 : model.idToIndex[node.definition.id]]
  }
  _predictParents(model, node) {
    if (node.isRoot()) return []
    const nodeIndex = model.idToIndex[node.definition.id]
    return model.matrix.map(row => row[nodeIndex])
  }
  _setDirName(name) {
    this._dirName = name
    return this
  }
  _requireInVmNodeJsRootParser(code) {
    const vm = require("vm")
    const path = require("path")
    // todo: cleanup up
    try {
      Object.keys(GlobalNamespaceAdditions).forEach(key => {
        global[key] = require("./" + GlobalNamespaceAdditions[key])
      })
      global.require = require
      global.__dirname = this._dirName
      global.module = {}
      return vm.runInThisContext(code)
    } catch (err) {
      // todo: figure out best error pattern here for debugging
      console.log(`Error in compiled parsers code for language "${this.parsersName}"`)
      // console.log(new TreeNode(code).toStringWithLineNumbers())
      console.log(err)
      throw err
    }
  }
  examplesToTestBlocks(rootParser = this.compileAndReturnRootParser(), expectedErrorMessage = "") {
    const testBlocks = {}
    this.validConcreteAndAbstractParserDefinitions.forEach(def =>
      def.examples.forEach(example => {
        const id = def.id + example.content
        testBlocks[id] = equal => {
          const exampleProgram = new rootParser(example.childrenToString())
          const errors = exampleProgram.getAllErrors(example._getLineNumber() + 1)
          equal(errors.join("\n"), expectedErrorMessage, `Expected no errors in ${id}`)
        }
      })
    )
    return testBlocks
  }
  toReadMe() {
    const languageName = this.extensionName
    const rootNodeDef = this.rootParserDefinition
    const cellTypes = this.cellTypeDefinitions
    const parserFamilyTree = this.parserFamilyTree
    const exampleNode = rootNodeDef.examples[0]
    return `title ${languageName} Readme

paragraph ${rootNodeDef.description}

subtitle Quick Example

code
${exampleNode ? exampleNode.childrenToString(1) : ""}

subtitle Quick facts about ${languageName}

list
 - ${languageName} has ${parserFamilyTree.topDownArray.length} node types.
 - ${languageName} has ${Object.keys(cellTypes).length} cell types
 - The source code for ${languageName} is ${this.topDownArray.length} lines long.

subtitle Installing

code
 npm install .

subtitle Testing

code
 node test.js

subtitle Node Types

code
${parserFamilyTree.toString(1)}

subtitle Cell Types

code
${new TreeNode(Object.keys(cellTypes).join("\n")).toString(1)}

subtitle Road Map

paragraph Here are the "todos" present in the source code for ${languageName}:

list
${this.topDownArray
  .filter(node => node.getWord(0) === "todo")
  .map(node => ` - ${node.getLine()}`)
  .join("\n")}

paragraph This readme was auto-generated using the
 link https://github.com/breck7/scrollsdk ScrollSDK.`
  }
  toBundle() {
    const files = {}
    const rootNodeDef = this.rootParserDefinition
    const languageName = this.extensionName
    const example = rootNodeDef.examples[0]
    const sampleCode = example ? example.childrenToString() : ""
    files[ParsersBundleFiles.package] = JSON.stringify(
      {
        name: languageName,
        private: true,
        dependencies: {
          scrollsdk: TreeNode.getVersion()
        }
      },
      null,
      2
    )
    files[ParsersBundleFiles.readme] = this.toReadMe()
    const testCode = `const program = new ${languageName}(sampleCode)
const errors = program.getAllErrors()
console.log("Sample program compiled with " + errors.length + " errors.")
if (errors.length)
 console.log(errors.map(error => error.message))`
    const nodePath = `${languageName}.node.js`
    files[nodePath] = this.toNodeJsJavascript()
    files[ParsersBundleFiles.indexJs] = `module.exports = require("./${nodePath}")`
    const browserPath = `${languageName}.browser.js`
    files[browserPath] = this.toBrowserJavascript()
    files[ParsersBundleFiles.indexHtml] = `<script src="node_modules/scrollsdk/products/Utils.browser.js"></script>
<script src="node_modules/scrollsdk/products/TreeNode.browser.js"></script>
<script src="node_modules/scrollsdk/products/Parsers.ts.browser.js"></script>
<script src="${browserPath}"></script>
<script>
const sampleCode = \`${sampleCode.toString()}\`
${testCode}
</script>`
    const samplePath = "sample." + this.extensionName
    files[samplePath] = sampleCode.toString()
    files[ParsersBundleFiles.testJs] = `const ${languageName} = require("./index.js")
/*keep-line*/ const sampleCode = require("fs").readFileSync("${samplePath}", "utf8")
${testCode}`
    return files
  }
  get targetExtension() {
    return this.rootParserDefinition.get(ParsersConstants.compilesTo)
  }
  get cellTypeDefinitions() {
    if (this._cache_cellTypes) return this._cache_cellTypes
    const types = {}
    // todo: add built in word types?
    this.getChildrenByParser(cellTypeDefinitionParser).forEach(type => (types[type.cellTypeId] = type))
    this._cache_cellTypes = types
    return types
  }
  getCellTypeDefinitionById(cellTypeId) {
    // todo: return unknownCellTypeDefinition? or is that handled somewhere else?
    return this.cellTypeDefinitions[cellTypeId]
  }
  get parserFamilyTree() {
    const tree = new TreeNode()
    Object.values(this.validConcreteAndAbstractParserDefinitions).forEach(node => tree.touchNode(node.ancestorParserIdsArray.join(" ")))
    return tree
  }
  get languageDefinitionProgram() {
    return this
  }
  get validConcreteAndAbstractParserDefinitions() {
    return this.getChildrenByParser(parserDefinitionParser).filter(node => node._hasValidParserId())
  }
  get lastRootParserDefinitionNode() {
    return this.findLast(def => def instanceof AbstractParserDefinitionParser && def.has(ParsersConstants.root) && def._hasValidParserId())
  }
  _initRootParserDefinitionNode() {
    if (this._cache_rootParserNode) return
    if (!this._cache_rootParserNode) this._cache_rootParserNode = this.lastRootParserDefinitionNode
    // By default, have a very permissive basic root node.
    // todo: whats the best design pattern to use for this sort of thing?
    if (!this._cache_rootParserNode) {
      this._cache_rootParserNode = this.concat(`${ParsersConstants.DefaultRootParser}
 ${ParsersConstants.root}
 ${ParsersConstants.catchAllParser} ${ParsersConstants.BlobParser}`)[0]
      this._addDefaultCatchAllBlobParser()
    }
  }
  get rootParserDefinition() {
    this._initRootParserDefinitionNode()
    return this._cache_rootParserNode
  }
  _addDefaultCatchAllBlobParser() {
    if (this._addedCatchAll) return
    this._addedCatchAll = true
    delete this._cache_parserDefinitionParsers
    this.concat(`${ParsersConstants.BlobParser}
 ${ParsersConstants.baseParser} ${ParsersConstants.blobParser}`)
  }
  get extensionName() {
    return this.parsersName
  }
  get id() {
    return this.rootParserId
  }
  get rootParserId() {
    return this.rootParserDefinition.parserIdFromDefinition
  }
  get parsersName() {
    return this.rootParserId.replace(HandParsersProgram.parserSuffixRegex, "")
  }
  _getMyInScopeParserIds() {
    return super._getMyInScopeParserIds(this.rootParserDefinition)
  }
  _getInScopeParserIds() {
    const parsersNode = this.rootParserDefinition.getNode(ParsersConstants.inScope)
    return parsersNode ? parsersNode.getWordsFrom(1) : []
  }
  makeProgramParserDefinitionCache() {
    const cache = {}
    this.getChildrenByParser(parserDefinitionParser).forEach(parserDefinitionParser => (cache[parserDefinitionParser.parserIdFromDefinition] = parserDefinitionParser))
    return cache
  }
  compileAndReturnRootParser() {
    if (!this._cached_rootParser) {
      const rootDef = this.rootParserDefinition
      this._cached_rootParser = rootDef.languageDefinitionProgram._compileAndReturnRootParser()
    }
    return this._cached_rootParser
  }
  get fileExtensions() {
    return this.rootParserDefinition.get(ParsersConstants.extensions) ? this.rootParserDefinition.get(ParsersConstants.extensions).split(" ").join(",") : this.extensionName
  }
  toNodeJsJavascript(scrollsdkProductsPath = "scrollsdk/products") {
    return this._rootNodeDefToJavascriptClass(scrollsdkProductsPath, true).trim()
  }
  toBrowserJavascript() {
    return this._rootNodeDefToJavascriptClass("", false).trim()
  }
  _rootNodeDefToJavascriptClass(scrollsdkProductsPath, forNodeJs = true) {
    const defs = this.validConcreteAndAbstractParserDefinitions
    // todo: throw if there is no root node defined
    const parserClasses = defs.map(def => def.asJavascriptClass).join("\n\n")
    const rootDef = this.rootParserDefinition
    const rootNodeJsHeader = forNodeJs && rootDef._getConcatBlockStringFromExtended(ParsersConstants._rootNodeJsHeader)
    const rootName = rootDef.generatedClassName
    if (!rootName) throw new Error(`Root Node Type Has No Name`)
    let exportScript = ""
    if (forNodeJs)
      exportScript = `module.exports = ${rootName};
${rootName}`
    else exportScript = `window.${rootName} = ${rootName}`
    let nodeJsImports = ``
    if (forNodeJs) {
      const path = require("path")
      nodeJsImports = Object.keys(GlobalNamespaceAdditions)
        .map(key => {
          const thePath = scrollsdkProductsPath + "/" + GlobalNamespaceAdditions[key]
          return `const { ${key} } = require("${thePath.replace(/\\/g, "\\\\")}")` // escape windows backslashes
        })
        .join("\n")
    }
    // todo: we can expose the previous "constants" export, if needed, via the parsers, which we preserve.
    return `{
${nodeJsImports}
${rootNodeJsHeader ? rootNodeJsHeader : ""}
${parserClasses}

${exportScript}
}
`
  }
  toSublimeSyntaxFile() {
    const cellTypeDefs = this.cellTypeDefinitions
    const variables = Object.keys(cellTypeDefs)
      .map(name => ` ${name}: '${cellTypeDefs[name].regexString}'`)
      .join("\n")
    const defs = this.validConcreteAndAbstractParserDefinitions.filter(kw => !kw._isAbstract())
    const parserContexts = defs.map(def => def._toSublimeMatchBlock()).join("\n\n")
    const includes = defs.map(parserDef => `  - include: '${parserDef.parserIdFromDefinition}'`).join("\n")
    return `%YAML 1.2
---
name: ${this.extensionName}
file_extensions: [${this.fileExtensions}]
scope: source.${this.extensionName}

variables:
${variables}

contexts:
 main:
${includes}

${parserContexts}`
  }
}
HandParsersProgram.makeParserId = str => Utils._replaceNonAlphaNumericCharactersWithCharCodes(str).replace(HandParsersProgram.parserSuffixRegex, "") + ParsersConstants.parserSuffix
HandParsersProgram.makeCellTypeId = str => Utils._replaceNonAlphaNumericCharactersWithCharCodes(str).replace(HandParsersProgram.cellTypeSuffixRegex, "") + ParsersConstants.cellTypeSuffix
HandParsersProgram.parserSuffixRegex = new RegExp(ParsersConstants.parserSuffix + "$")
HandParsersProgram.parserFullRegex = new RegExp("^[a-zA-Z0-9_]+" + ParsersConstants.parserSuffix + "$")
HandParsersProgram.blankLineRegex = new RegExp("^$")
HandParsersProgram.cellTypeSuffixRegex = new RegExp(ParsersConstants.cellTypeSuffix + "$")
HandParsersProgram.cellTypeFullRegex = new RegExp("^[a-zA-Z0-9_]+" + ParsersConstants.cellTypeSuffix + "$")
HandParsersProgram._languages = {}
HandParsersProgram._parsers = {}
const PreludeKinds = {}
PreludeKinds[PreludeCellTypeIds.anyCell] = ParsersAnyCell
PreludeKinds[PreludeCellTypeIds.keywordCell] = ParsersKeywordCell
PreludeKinds[PreludeCellTypeIds.floatCell] = ParsersFloatCell
PreludeKinds[PreludeCellTypeIds.numberCell] = ParsersFloatCell
PreludeKinds[PreludeCellTypeIds.bitCell] = ParsersBitCell
PreludeKinds[PreludeCellTypeIds.boolCell] = ParsersBoolCell
PreludeKinds[PreludeCellTypeIds.intCell] = ParsersIntCell
class UnknownParsersProgram extends TreeNode {
  _inferRootNodeForAPrefixLanguage(parsersName) {
    parsersName = HandParsersProgram.makeParserId(parsersName)
    const rootNode = new TreeNode(`${parsersName}
 ${ParsersConstants.root}`)
    // note: right now we assume 1 global cellTypeMap and parserMap per parsers. But we may have scopes in the future?
    const rootNodeNames = this.getFirstWords()
      .filter(identity => identity)
      .map(word => HandParsersProgram.makeParserId(word))
    rootNode
      .nodeAt(0)
      .touchNode(ParsersConstants.inScope)
      .setWordsFrom(1, Array.from(new Set(rootNodeNames)))
    return rootNode
  }
  _renameIntegerKeywords(clone) {
    // todo: why are we doing this?
    for (let node of clone.getTopDownArrayIterator()) {
      const firstWordIsAnInteger = !!node.firstWord.match(/^\d+$/)
      const parentFirstWord = node.parent.firstWord
      if (firstWordIsAnInteger && parentFirstWord) node.setFirstWord(HandParsersProgram.makeParserId(parentFirstWord + UnknownParsersProgram._childSuffix))
    }
  }
  _getKeywordMaps(clone) {
    const keywordsToChildKeywords = {}
    const keywordsToNodeInstances = {}
    for (let node of clone.getTopDownArrayIterator()) {
      const firstWord = node.firstWord
      if (!keywordsToChildKeywords[firstWord]) keywordsToChildKeywords[firstWord] = {}
      if (!keywordsToNodeInstances[firstWord]) keywordsToNodeInstances[firstWord] = []
      keywordsToNodeInstances[firstWord].push(node)
      node.forEach(child => (keywordsToChildKeywords[firstWord][child.firstWord] = true))
    }
    return { keywordsToChildKeywords: keywordsToChildKeywords, keywordsToNodeInstances: keywordsToNodeInstances }
  }
  _inferParserDef(firstWord, globalCellTypeMap, childFirstWords, instances) {
    const edgeSymbol = this.edgeSymbol
    const parserId = HandParsersProgram.makeParserId(firstWord)
    const nodeDefNode = new TreeNode(parserId).nodeAt(0)
    const childParserIds = childFirstWords.map(word => HandParsersProgram.makeParserId(word))
    if (childParserIds.length) nodeDefNode.touchNode(ParsersConstants.inScope).setWordsFrom(1, childParserIds)
    const cellsForAllInstances = instances
      .map(line => line.content)
      .filter(identity => identity)
      .map(line => line.split(edgeSymbol))
    const instanceCellCounts = new Set(cellsForAllInstances.map(cells => cells.length))
    const maxCellsOnLine = Math.max(...Array.from(instanceCellCounts))
    const minCellsOnLine = Math.min(...Array.from(instanceCellCounts))
    let catchAllCellType
    let cellTypeIds = []
    for (let cellIndex = 0; cellIndex < maxCellsOnLine; cellIndex++) {
      const cellType = this._getBestCellType(
        firstWord,
        instances.length,
        maxCellsOnLine,
        cellsForAllInstances.map(cells => cells[cellIndex])
      )
      if (!globalCellTypeMap.has(cellType.cellTypeId)) globalCellTypeMap.set(cellType.cellTypeId, cellType.cellTypeDefinition)
      cellTypeIds.push(cellType.cellTypeId)
    }
    if (maxCellsOnLine > minCellsOnLine) {
      //columns = columns.slice(0, min)
      catchAllCellType = cellTypeIds.pop()
      while (cellTypeIds[cellTypeIds.length - 1] === catchAllCellType) {
        cellTypeIds.pop()
      }
    }
    const needsCruxProperty = !firstWord.endsWith(UnknownParsersProgram._childSuffix + ParsersConstants.parserSuffix) // todo: cleanup
    if (needsCruxProperty) nodeDefNode.set(ParsersConstants.crux, firstWord)
    if (catchAllCellType) nodeDefNode.set(ParsersConstants.catchAllCellType, catchAllCellType)
    const cellLine = cellTypeIds.slice()
    cellLine.unshift(PreludeCellTypeIds.keywordCell)
    if (cellLine.length > 0) nodeDefNode.set(ParsersConstants.cells, cellLine.join(edgeSymbol))
    //if (!catchAllCellType && cellTypeIds.length === 1) nodeDefNode.set(ParsersConstants.cells, cellTypeIds[0])
    // Todo: add conditional frequencies
    return nodeDefNode.parent.toString()
  }
  //  inferParsersFileForAnSSVLanguage(parsersName: string): string {
  //     parsersName = HandParsersProgram.makeParserId(parsersName)
  //    const rootNode = new TreeNode(`${parsersName}
  // ${ParsersConstants.root}`)
  //    // note: right now we assume 1 global cellTypeMap and parserMap per parsers. But we may have scopes in the future?
  //    const rootNodeNames = this.getFirstWords().map(word => HandParsersProgram.makeParserId(word))
  //    rootNode
  //      .nodeAt(0)
  //      .touchNode(ParsersConstants.inScope)
  //      .setWordsFrom(1, Array.from(new Set(rootNodeNames)))
  //    return rootNode
  //  }
  inferParsersFileForAKeywordLanguage(parsersName) {
    const clone = this.clone()
    this._renameIntegerKeywords(clone)
    const { keywordsToChildKeywords, keywordsToNodeInstances } = this._getKeywordMaps(clone)
    const globalCellTypeMap = new Map()
    globalCellTypeMap.set(PreludeCellTypeIds.keywordCell, undefined)
    const parserDefs = Object.keys(keywordsToChildKeywords)
      .filter(identity => identity)
      .map(firstWord => this._inferParserDef(firstWord, globalCellTypeMap, Object.keys(keywordsToChildKeywords[firstWord]), keywordsToNodeInstances[firstWord]))
    const cellTypeDefs = []
    globalCellTypeMap.forEach((def, id) => cellTypeDefs.push(def ? def : id))
    const nodeBreakSymbol = this.nodeBreakSymbol
    return this._formatCode([this._inferRootNodeForAPrefixLanguage(parsersName).toString(), cellTypeDefs.join(nodeBreakSymbol), parserDefs.join(nodeBreakSymbol)].filter(identity => identity).join("\n"))
  }
  _formatCode(code) {
    // todo: make this run in browser too
    if (!this.isNodeJs()) return code
    const parsersProgram = new HandParsersProgram(TreeNode.fromDisk(__dirname + "/../langs/parsers/parsers.parsers"))
    const rootParser = parsersProgram.compileAndReturnRootParser()
    const program = new rootParser(code)
    return program.format().toString()
  }
  _getBestCellType(firstWord, instanceCount, maxCellsOnLine, allValues) {
    const asSet = new Set(allValues)
    const edgeSymbol = this.edgeSymbol
    const values = Array.from(asSet).filter(identity => identity)
    const every = fn => {
      for (let index = 0; index < values.length; index++) {
        if (!fn(values[index])) return false
      }
      return true
    }
    if (every(str => str === "0" || str === "1")) return { cellTypeId: PreludeCellTypeIds.bitCell }
    if (
      every(str => {
        const num = parseInt(str)
        if (isNaN(num)) return false
        return num.toString() === str
      })
    ) {
      return { cellTypeId: PreludeCellTypeIds.intCell }
    }
    if (every(str => str.match(/^-?\d*.?\d+$/))) return { cellTypeId: PreludeCellTypeIds.floatCell }
    const bools = new Set(["1", "0", "true", "false", "t", "f", "yes", "no"])
    if (every(str => bools.has(str.toLowerCase()))) return { cellTypeId: PreludeCellTypeIds.boolCell }
    // todo: cleanup
    const enumLimit = 30
    if (instanceCount > 1 && maxCellsOnLine === 1 && allValues.length > asSet.size && asSet.size < enumLimit)
      return {
        cellTypeId: HandParsersProgram.makeCellTypeId(firstWord),
        cellTypeDefinition: `${HandParsersProgram.makeCellTypeId(firstWord)}
 enum ${values.join(edgeSymbol)}`
      }
    return { cellTypeId: PreludeCellTypeIds.anyCell }
  }
}
UnknownParsersProgram._childSuffix = "Child"

module.exports = { ParsersConstants, PreludeCellTypeIds, HandParsersProgram, ParserBackedNode, UnknownParserError, UnknownParsersProgram }
