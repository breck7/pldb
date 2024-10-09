#! /usr/bin/env node
{
  const { Utils } = require("./Utils.js")
  const { Particle } = require("./Particle.js")
  const { HandParsersProgram } = require("./Parsers.js")
  const { ParserBackedParticle } = require("./Parsers.js")

  class swarmParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        errorParser,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), { test: testParser, testOnly: testOnlyParser, skipTest: skipTestParser, "#!": hashbangParser, arrange: arrangeParser }),
        undefined
      )
    }
    getArrangeParser() {
      return this.getSubparticleInstancesOfParserId("arrangeParser")[0]
    }
    async execute(filepath) {
      const particle = new TestRacer(this.compileToRacer(filepath))
      await particle.execute()
      return particle.finish()
    }
    compileToRacer(filepath) {
      const testBlocks = {}
      this.getSubparticleInstancesOfParserId("abstractTestBlockParser").forEach(testParser => {
        const prefix = testParser.racerPrefix || ""
        testBlocks[prefix + testParser.content] = testParser.toTestRacerFunction(filepath)
      })
      const files = {}
      files[filepath] = testBlocks
      return files
    }
    static cachedHandParsersProgramRoot = new HandParsersProgram(`// todo Add comments?
// todo Make run in browser
// todo Add print or tracer type of intermediate element. debugger?

// Atom parsers
anyAtom
 paint string
 examples lorem ipsum
assertionKeywordAtom
 paint keyword.operator
 extends keywordAtom
commandAtom
 extends keywordAtom
 paint variable.function
 examples someCommand
extraAtom
 paint invalid
filepathAtom
 examples foobar.foo someFile.foo
 paint string
keywordAtom
hashBangKeywordAtom
 extends keywordAtom
 paint comment
 enum #!
hashBangAtom
 paint comment
intAtom
 regex \\-?[0-9]+
 paint constant.numeric.integer
parameterKeywordAtom
 extends keywordAtom
 paint variable.parameter
todoAtom
 paint comment
todoKeywordAtom
 extends keywordAtom
 paint comment
typeOfOptionAtom
 description The 6 possible results for Javascript's typeof.
 paint constant.language
 enum object boolean function number string undefined

// Line parsers
swarmParser
 root
 description A prefix Language for unit testing of classes.
 inScope hashbangParser arrangeParser abstractTestBlockParser
 catchAllParser errorParser
 javascript
  getArrangeParser() {
   return this.getSubparticleInstancesOfParserId("arrangeParser")[0]
  }
  async execute(filepath) {
   const particle = new TestRacer(this.compileToRacer(filepath))
   await particle.execute()
   return particle.finish()
  }
  compileToRacer(filepath) {
   const testBlocks = {}
   this.getSubparticleInstancesOfParserId("abstractTestBlockParser").forEach(testParser => {
    const prefix = testParser.racerPrefix || ""
    testBlocks[prefix + testParser.content] = testParser.toTestRacerFunction(filepath)
   })
   const files = {}
   files[filepath] = testBlocks
   return files
  }
abstractAssertionParser
 javascript
  async execute(arrangedInstance) {
   //todo: refactor. there is clearly a difference between sync and async that we are not
   // documenting. seems like async and sync have different atomTypes. the former requires
   // a method to get the result.
   const finalParts = Utils.getMethodFromDotPath(arrangedInstance, this.getAtom(1))
   const subject = finalParts[0]
   const command = finalParts[1]
   const actual = subject[command]()
   const actualAsString = this.parseActual(actual).toString()
   const expected = this.getExpected()
   this.getAssertionResult(actualAsString, expected, this.getLine())
  }
  equal(actual, expected, message) {
   this.parent.getEqualFn()(actual, expected, message)
  }
  getAssertionResult(actualAsString, expected, message) {
   this.equal(actualAsString, expected, message)
   return actualAsString === expected
  }
  parseActual(actual) {
   return actual
  }
  executeSync(result) {
   const expected = this.getSyncExpected()
   const actual = this.parseActual(result)
   const actualIsUndefined = actual === undefined
   const actualAsString = actualIsUndefined ? "undefined" : actual.toString()
   this.getAssertionResult(actualAsString, expected, this.getLine())
  }
  getExpected() {
   return this.getAtomsFrom(2).join(" ")
  }
  getSyncExpected() {
   return this.content
  }
 atoms assertionKeywordAtom
assertParagraphIsParser
 crux assertParagraphIs
 description When your expected value is a multiline string.
 catchAllParser paragraphLineParser
 javascript
  getExpected() {
   return this.subparticlesToString()
  }
  getSyncExpected() {
   return this.subparticlesToString()
  }
 extends abstractAssertionParser
assertLengthIsParser
 crux assertLengthIs
 description Intake is an array, and checks if the length of array matches expected.
 atoms assertionKeywordAtom intAtom
 javascript
  parseActual(actual) {
   return actual.length
  }
 extends abstractAssertionParser
assertStringExcludesParser
 crux assertStringExcludes
 description Converts the input to string and ensure the string does NOT contain the provided string
 catchAllAtomType anyAtom
 javascript
  getAssertionResult(actualAsString, expected, message) {
   const result = !actualAsString.includes(expected)
   if (!result) {
    const index = actualAsString.indexOf(expected)
    const start = Math.max(0, index - 50)
    message += \` Found \${expected} in: \` + actualAsString.substr(start, index + 50 + expected.length)
   }
   this.equal(result, true, message)
   return result
  }
 extends abstractAssertionParser
assertStringIncludesParser
 crux assertStringIncludes
 catchAllAtomType anyAtom
 description Converts the input to string and see if the string contains the provided string
 javascript
  getAssertionResult(actualAsString, expected, message) {
   const result = actualAsString.includes(expected)
   this.equal(result, true, message)
   return result
  }
 extends abstractAssertionParser
assertStringIsParser
 crux assertStringIs
 description Intake is anything with a toString method, and compares that to provided expected value.
 catchAllAtomType anyAtom
 extends abstractAssertionParser
assertTypeIsParser
 crux assertTypeIs
 description Assert result is one of Javascript's 6 typeof types.
 atoms assertionKeywordAtom typeOfOptionAtom
 javascript
  parseActual(actual) {
   return typeof actual
  }
 extends abstractAssertionParser
abstractArrangeFlagParser
 atoms keywordAtom
arrangeAsyncParser
 description Add this flag in the arrange particle to test async methods.
 extends abstractArrangeFlagParser
 crux async
arrangeRequireParser
 description Pass in the filename to require for nodejs tests.
 crux require
 atoms keywordAtom filepathAtom
 catchAllAtomType anyAtom
arrangeStaticParser
 crux static
 description Add this to the arrange particle to import class directly without initiating it for static method testing.
 extends abstractArrangeFlagParser
abstractTestBlockParser
 catchAllAtomType anyAtom
 javascript
  getArrangeParser() {
   return this.getParticle("arrange") || this.parent.getArrangeParser()
  }
  setEqualMethod(equal) {
   this._equal = equal
   return this
  }
  getTestBlock() {
   return this
  }
  getEqualFn() {
   return this._equal
  }
  toTestRacerFunction(programFilepath) {
   const arrangeParser = this.getArrangeParser()
   const arrangedInstance = arrangeParser.arrange(programFilepath)
   const executeMethod = arrangeParser.isAsync() ? "execute" : "executeSync"
   return async equal => {
    this.setEqualMethod(equal)
    const promises = this.map(async childAction => {
     const result = await childAction[executeMethod](arrangedInstance)
     return result
    })
    await Promise.all(promises)
   }
  }
 inScope arrangeParser
 catchAllParser actParser
 atoms keywordAtom
testParser
 description Basic test block.
 extends abstractTestBlockParser
 crux test
testOnlyParser
 description If set, only this test block will be run.
 extends abstractTestBlockParser
 string racerPrefix _
 crux testOnly
skipTestParser
 description If you want to skip running a test.
 extends abstractTestBlockParser
 string racerPrefix $
 crux skipTest
hashbangParser
 crux #!
 description Standard bash hashbang line.
 atoms hashBangKeywordAtom hashBangAtom
 catchAllAtomType hashBangAtom
arrangeParser
 crux arrange
 javascript
  isAsync() {
    return this.has("async")
  }
  arrange(programFilepath) {
   const requiredClass = this._getRequiredClass(programFilepath)
   const constructorArgParser = this.getSubparticleInstancesOfParserId("constructWithParagraphParser")[0]
   const param = constructorArgParser ? constructorArgParser.subparticlesToString() : undefined
   return this.has("static") ? requiredClass : new requiredClass(param)
  }
  _getRequiredClass(programFilepath) {
    // todo: cleanup
   let requiredClass =
    this.get("require") ||
    this.root
     .getParticle("arrange")
     .get("require")
   const requiredClassParts = requiredClass.split(" ") // Allows for ./ExportsClasses.js ChildClass
   const requiredFileNameOrClass = requiredClassParts[0]
   let theClass
   if (this.isNodeJs()) {
    if (requiredFileNameOrClass.includes("."))
      theClass = require(Utils.resolvePath(requiredFileNameOrClass, programFilepath))
    else
      theClass = global[requiredFileNameOrClass]
   }
   else theClass = window[Utils.getClassNameFromFilePath(requiredFileNameOrClass)]
   if (requiredClassParts[1]) theClass = Utils.resolveProperty(theClass, requiredClassParts[1])
   if (!theClass) throw new Error(\`Required class '\${requiredClassParts.join(" ")}' not found for \${this.toString()}\`)
   return theClass
  }
  executeSync() {}
 inScope arrangeAsyncParser arrangeRequireParser arrangeStaticParser constructWithParagraphParser todoParser
 atoms keywordAtom
withParagraphParser
 description Pass in a multiline string as a command arg.
 javascript
  executeSync() {}
 catchAllParser paragraphLineParser
 atoms parameterKeywordAtom
 crux withParagraph
actParser
 javascript
  getTestBlock() {
   return this.parent
  }
  getEqualFn() {
   return this.getTestBlock().getEqualFn()
  }
  _getActArgs() {
   const paragraphActParsers = this.getSubparticleInstancesOfParserId("withParagraphParser")
   if (paragraphActParsers.length) return paragraphActParsers.map(arg => arg.subparticlesToString())
   return this.getAtomsFrom(1)
  }
  _act(arrangedInstance) {
   const actionMethodName = this.firstAtom
   const actionMethod = arrangedInstance[actionMethodName]
   if (!actionMethod) throw new Error(\`No method "\${actionMethodName}" on "\${arrangedInstance.constructor.name}"\`)
   if (typeof actionMethod !== "function") return arrangedInstance[actionMethodName] // Property access
   return actionMethod.apply(arrangedInstance, this._getActArgs())
  }
  async execute(arrangedInstance) {
   await this._act(arrangedInstance)
   return Promise.all(this.map(child => child.execute(arrangedInstance)))
  }
  executeSync(arrangedInstance) {
   const newTestSubject = this._act(arrangedInstance)
   return this.map(child => child.executeSync(newTestSubject))
  }
 description Input is an object, and calls some method with an optional array of string args.
 catchAllAtomType anyAtom
 catchAllParser actParser
 inScope withParagraphParser abstractAssertionParser
 atoms commandAtom
constructWithParagraphParser
 javascript
  executeSync() {}
 description Pass in a multiline string to setup constructor. #todo: rename
 catchAllParser paragraphLineParser
 atoms keywordAtom
 crux constructWithParagraph
errorParser
 baseParser errorParser
paragraphLineParser
 catchAllAtomType anyAtom
 catchAllParser paragraphLineParser
 atoms anyAtom
todoParser
 description Todos let you add notes about what is coming in the future in the source code. They are like comments in other languages except should only be used for todos.
 catchAllAtomType todoAtom
 catchAllParser todoParser
 crux todo
 atoms todoKeywordAtom`)
    get handParsersProgram() {
      return this.constructor.cachedHandParsersProgramRoot
    }
    static rootParser = swarmParser
  }

  class abstractAssertionParser extends ParserBackedParticle {
    get assertionKeywordAtom() {
      return this.getAtom(0)
    }
    async execute(arrangedInstance) {
      //todo: refactor. there is clearly a difference between sync and async that we are not
      // documenting. seems like async and sync have different atomTypes. the former requires
      // a method to get the result.
      const finalParts = Utils.getMethodFromDotPath(arrangedInstance, this.getAtom(1))
      const subject = finalParts[0]
      const command = finalParts[1]
      const actual = subject[command]()
      const actualAsString = this.parseActual(actual).toString()
      const expected = this.getExpected()
      this.getAssertionResult(actualAsString, expected, this.getLine())
    }
    equal(actual, expected, message) {
      this.parent.getEqualFn()(actual, expected, message)
    }
    getAssertionResult(actualAsString, expected, message) {
      this.equal(actualAsString, expected, message)
      return actualAsString === expected
    }
    parseActual(actual) {
      return actual
    }
    executeSync(result) {
      const expected = this.getSyncExpected()
      const actual = this.parseActual(result)
      const actualIsUndefined = actual === undefined
      const actualAsString = actualIsUndefined ? "undefined" : actual.toString()
      this.getAssertionResult(actualAsString, expected, this.getLine())
    }
    getExpected() {
      return this.getAtomsFrom(2).join(" ")
    }
    getSyncExpected() {
      return this.content
    }
  }

  class assertParagraphIsParser extends abstractAssertionParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(paragraphLineParser, undefined, undefined)
    }
    getExpected() {
      return this.subparticlesToString()
    }
    getSyncExpected() {
      return this.subparticlesToString()
    }
  }

  class assertLengthIsParser extends abstractAssertionParser {
    get assertionKeywordAtom() {
      return this.getAtom(0)
    }
    get intAtom() {
      return parseInt(this.getAtom(1))
    }
    parseActual(actual) {
      return actual.length
    }
  }

  class assertStringExcludesParser extends abstractAssertionParser {
    get anyAtom() {
      return this.getAtomsFrom(0)
    }
    getAssertionResult(actualAsString, expected, message) {
      const result = !actualAsString.includes(expected)
      if (!result) {
        const index = actualAsString.indexOf(expected)
        const start = Math.max(0, index - 50)
        message += ` Found ${expected} in: ` + actualAsString.substr(start, index + 50 + expected.length)
      }
      this.equal(result, true, message)
      return result
    }
  }

  class assertStringIncludesParser extends abstractAssertionParser {
    get anyAtom() {
      return this.getAtomsFrom(0)
    }
    getAssertionResult(actualAsString, expected, message) {
      const result = actualAsString.includes(expected)
      this.equal(result, true, message)
      return result
    }
  }

  class assertStringIsParser extends abstractAssertionParser {
    get anyAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class assertTypeIsParser extends abstractAssertionParser {
    get assertionKeywordAtom() {
      return this.getAtom(0)
    }
    get typeOfOptionAtom() {
      return this.getAtom(1)
    }
    parseActual(actual) {
      return typeof actual
    }
  }

  class abstractArrangeFlagParser extends ParserBackedParticle {
    get keywordAtom() {
      return this.getAtom(0)
    }
  }

  class arrangeAsyncParser extends abstractArrangeFlagParser {}

  class arrangeRequireParser extends ParserBackedParticle {
    get keywordAtom() {
      return this.getAtom(0)
    }
    get filepathAtom() {
      return this.getAtom(1)
    }
    get anyAtom() {
      return this.getAtomsFrom(2)
    }
  }

  class arrangeStaticParser extends abstractArrangeFlagParser {}

  class abstractTestBlockParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(actParser, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), { arrange: arrangeParser }), undefined)
    }
    get keywordAtom() {
      return this.getAtom(0)
    }
    get anyAtom() {
      return this.getAtomsFrom(1)
    }
    getArrangeParser() {
      return this.getParticle("arrange") || this.parent.getArrangeParser()
    }
    setEqualMethod(equal) {
      this._equal = equal
      return this
    }
    getTestBlock() {
      return this
    }
    getEqualFn() {
      return this._equal
    }
    toTestRacerFunction(programFilepath) {
      const arrangeParser = this.getArrangeParser()
      const arrangedInstance = arrangeParser.arrange(programFilepath)
      const executeMethod = arrangeParser.isAsync() ? "execute" : "executeSync"
      return async equal => {
        this.setEqualMethod(equal)
        const promises = this.map(async childAction => {
          const result = await childAction[executeMethod](arrangedInstance)
          return result
        })
        await Promise.all(promises)
      }
    }
  }

  class testParser extends abstractTestBlockParser {}

  class testOnlyParser extends abstractTestBlockParser {
    get racerPrefix() {
      return `_`
    }
  }

  class skipTestParser extends abstractTestBlockParser {
    get racerPrefix() {
      return `$`
    }
  }

  class hashbangParser extends ParserBackedParticle {
    get hashBangKeywordAtom() {
      return this.getAtom(0)
    }
    get hashBangAtom() {
      return this.getAtom(1)
    }
    get hashBangAtom() {
      return this.getAtomsFrom(2)
    }
  }

  class arrangeParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        undefined,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), {
          async: arrangeAsyncParser,
          require: arrangeRequireParser,
          static: arrangeStaticParser,
          constructWithParagraph: constructWithParagraphParser,
          todo: todoParser
        }),
        undefined
      )
    }
    get keywordAtom() {
      return this.getAtom(0)
    }
    isAsync() {
      return this.has("async")
    }
    arrange(programFilepath) {
      const requiredClass = this._getRequiredClass(programFilepath)
      const constructorArgParser = this.getSubparticleInstancesOfParserId("constructWithParagraphParser")[0]
      const param = constructorArgParser ? constructorArgParser.subparticlesToString() : undefined
      return this.has("static") ? requiredClass : new requiredClass(param)
    }
    _getRequiredClass(programFilepath) {
      // todo: cleanup
      let requiredClass = this.get("require") || this.root.getParticle("arrange").get("require")
      const requiredClassParts = requiredClass.split(" ") // Allows for ./ExportsClasses.js ChildClass
      const requiredFileNameOrClass = requiredClassParts[0]
      let theClass
      if (this.isNodeJs()) {
        if (requiredFileNameOrClass.includes(".")) theClass = require(Utils.resolvePath(requiredFileNameOrClass, programFilepath))
        else theClass = global[requiredFileNameOrClass]
      } else theClass = window[Utils.getClassNameFromFilePath(requiredFileNameOrClass)]
      if (requiredClassParts[1]) theClass = Utils.resolveProperty(theClass, requiredClassParts[1])
      if (!theClass) throw new Error(`Required class '${requiredClassParts.join(" ")}' not found for ${this.toString()}`)
      return theClass
    }
    executeSync() {}
  }

  class withParagraphParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(paragraphLineParser, undefined, undefined)
    }
    get parameterKeywordAtom() {
      return this.getAtom(0)
    }
    executeSync() {}
  }

  class actParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        actParser,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), {
          assertParagraphIs: assertParagraphIsParser,
          assertLengthIs: assertLengthIsParser,
          assertStringExcludes: assertStringExcludesParser,
          assertStringIncludes: assertStringIncludesParser,
          assertStringIs: assertStringIsParser,
          assertTypeIs: assertTypeIsParser,
          withParagraph: withParagraphParser
        }),
        undefined
      )
    }
    get commandAtom() {
      return this.getAtom(0)
    }
    get anyAtom() {
      return this.getAtomsFrom(1)
    }
    getTestBlock() {
      return this.parent
    }
    getEqualFn() {
      return this.getTestBlock().getEqualFn()
    }
    _getActArgs() {
      const paragraphActParsers = this.getSubparticleInstancesOfParserId("withParagraphParser")
      if (paragraphActParsers.length) return paragraphActParsers.map(arg => arg.subparticlesToString())
      return this.getAtomsFrom(1)
    }
    _act(arrangedInstance) {
      const actionMethodName = this.firstAtom
      const actionMethod = arrangedInstance[actionMethodName]
      if (!actionMethod) throw new Error(`No method "${actionMethodName}" on "${arrangedInstance.constructor.name}"`)
      if (typeof actionMethod !== "function") return arrangedInstance[actionMethodName] // Property access
      return actionMethod.apply(arrangedInstance, this._getActArgs())
    }
    async execute(arrangedInstance) {
      await this._act(arrangedInstance)
      return Promise.all(this.map(child => child.execute(arrangedInstance)))
    }
    executeSync(arrangedInstance) {
      const newTestSubject = this._act(arrangedInstance)
      return this.map(child => child.executeSync(newTestSubject))
    }
  }

  class constructWithParagraphParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(paragraphLineParser, undefined, undefined)
    }
    get keywordAtom() {
      return this.getAtom(0)
    }
    executeSync() {}
  }

  class errorParser extends ParserBackedParticle {
    getErrors() {
      return this._getErrorParserErrors()
    }
  }

  class paragraphLineParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(paragraphLineParser, undefined, undefined)
    }
    get anyAtom() {
      return this.getAtom(0)
    }
    get anyAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class todoParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(todoParser, undefined, undefined)
    }
    get todoKeywordAtom() {
      return this.getAtom(0)
    }
    get todoAtom() {
      return this.getAtomsFrom(1)
    }
  }

  module.exports = swarmParser
  swarmParser

  if (!module.parent) new swarmParser(Particle.fromDisk(process.argv[2]).toString()).execute()
}
