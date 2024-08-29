const { Utils } = require("../products/Utils.js")
const { Particle } = require("../products/Particle.js")
class TestRacerTestBlock {
  constructor(testFile, testName, fn) {
    this._parentFile = testFile
    this._testName = testName
    this._testFn = fn
  }
  _emitMessage(message) {
    this._parentFile.getRunner()._emitMessage(message)
    return message
  }
  async execute() {
    let passes = []
    let failures = []
    const assertEqual = (actual, expected, message = "") => {
      if (expected === actual) {
        passes.push(message)
      } else {
        failures.push([actual, expected, message])
      }
    }
    try {
      await this._testFn(assertEqual)
    } catch (err) {
      failures.push([
        "1",
        "0",
        `Should not have uncaught errors but in ${this._testName} got error:
 toString:
  ${new Particle(err.toString()).toString(2)}
 stack:
  ${new Particle(err.stack).toString(2)}`
      ])
    }
    failures.length ? this._emitBlockFailedMessage(failures) : this._emitBlockPassedMessage(passes)
    return {
      passes,
      failures
    }
  }
  _emitBlockPassedMessage(passes) {
    this._emitMessage(`${TestRacer.green()} block ${this._testName} - ${passes.length} passed`)
  }
  _emitBlockFailedMessage(failures) {
    // todo: should replace not replace last newline?
    // todo: do side by side.
    // todo: add diff.
    this._emitMessage(`${TestRacer.red()} block ${this._testName}`)
    this._emitMessage(
      failures
        .map(failure => {
          const actualVal = failure[0] === undefined ? "undefined" : failure[0].toString()
          const expectedVal = failure[1] === undefined ? "undefined" : failure[1].toString()
          const actual = new Particle(`actual\n${new Particle(actualVal).toString(1)}`)
          const expected = new Particle(`expected\n${new Particle(expectedVal.toString()).toString(1)}`)
          const comparison = actual.toComparison(expected)
          return new Particle(` assertion ${failure[2]}\n${comparison.toSideBySide([actual, expected]).toString(2)}`)
        })
        .join("\n")
    )
  }
}
class TestRacerFile {
  constructor(runner, testParticles, fileName) {
    this._runner = runner
    this._testParticles = {}
    this._fileName = fileName
    Object.keys(testParticles).forEach(key => {
      this._testParticles[key] = new TestRacerTestBlock(this, key, testParticles[key])
    })
  }
  getRunner() {
    return this._runner
  }
  getFileName() {
    return this._fileName
  }
  get length() {
    return Object.values(this._testParticles).length
  }
  get skippedTestBlockNames() {
    const testsToRun = this._filterSkippedTestBlocks()
    return Object.keys(this._testParticles).filter(blockName => !testsToRun.includes(blockName))
  }
  _emitMessage(message) {
    this.getRunner()._emitMessage(message)
  }
  _filterSkippedTestBlocks() {
    // _ prefix = run on these tests block
    // $ prefix = skip this test
    const runOnlyTheseTestBlocks = Object.keys(this._testParticles).filter(key => key.startsWith("_"))
    if (runOnlyTheseTestBlocks.length) return runOnlyTheseTestBlocks
    return Object.keys(this._testParticles).filter(key => !key.startsWith("$"))
  }
  async execute() {
    const testBlockNames = this._filterSkippedTestBlocks()
    this._emitStartFileMessage(testBlockNames.length)
    const fileTimer = new Utils.Timer()
    const blockResults = {}
    const blockPromises = testBlockNames.map(async testName => {
      const results = await this._testParticles[testName].execute()
      blockResults[testName] = results
    })
    await Promise.all(blockPromises)
    const fileStats = this._aggregateBlockResultsIntoFileResults(blockResults)
    const fileTimeElapsed = fileTimer.tick()
    fileStats.blocksFailed ? this._emitFileFailedMessage(fileStats, fileTimeElapsed, testBlockNames.length) : this._emitFilePassedMessage(fileStats, fileTimeElapsed, testBlockNames.length)
    return fileStats
  }
  _aggregateBlockResultsIntoFileResults(fileBlockResults) {
    const fileStats = {
      assertionsPassed: 0,
      assertionsFailed: 0,
      blocksPassed: 0,
      blocksFailed: 0,
      failedBlocks: []
    }
    Object.keys(fileBlockResults).forEach(blockName => {
      const results = fileBlockResults[blockName]
      fileStats.assertionsPassed += results.passes.length
      fileStats.assertionsFailed += results.failures.length
      if (results.failures.length) {
        fileStats.blocksFailed++
        fileStats.failedBlocks.push(blockName)
      } else fileStats.blocksPassed++
    })
    return fileStats
  }
  _emitStartFileMessage(blockCount) {
    this._emitMessage(`start file ${blockCount} test blocks in file ${this._fileName}`)
  }
  _emitFilePassedMessage(fileStats, fileTimeElapsed, blockCount) {
    this._emitMessage(`${TestRacer.green()} file ${this._fileName} in ${fileTimeElapsed}ms. ${blockCount} blocks and ${fileStats.assertionsPassed} assertions passed.`)
  }
  _emitFileFailedMessage(fileStats, fileTimeElapsed, blockCount) {
    this._emitMessage(
      `${TestRacer.red()} file ${this._fileName} over ${fileTimeElapsed}ms. ${fileStats.blocksFailed} blocks and ${fileStats.assertionsFailed} failed. ${blockCount - fileStats.blocksFailed} blocks and ${
        fileStats.assertionsPassed
      } assertions passed`
    )
  }
}
class TestRacer {
  constructor(fileTestParticles) {
    this._logFunction = console.log
    this._timer = new Utils.Timer()
    this._sessionFilesPassed = 0
    this._sessionFilesFailed = {}
    this._sessionBlocksFailed = 0
    this._sessionBlocksPassed = 0
    this._sessionAssertionsFailed = 0
    this._sessionAssertionsPassed = 0
    this._fileTestParticles = {}
    Object.keys(fileTestParticles).forEach(fileName => {
      this._fileTestParticles[fileName] = new TestRacerFile(this, fileTestParticles[fileName], fileName)
    })
  }
  setLogFunction(logFunction) {
    this._logFunction = logFunction
    return this
  }
  static green(message = "ok") {
    if (Utils.isNodeJs()) return Utils.colorize(message, "green")
    return `<span style="color: green;">${message}</span>`
  }
  static red(message = "failed") {
    if (Utils.isNodeJs()) return Utils.colorize(message, "red")
    return `<span style="color: red;">${message}</span>`
  }
  _addFileResultsToSessionResults(fileStats, fileName) {
    this._sessionAssertionsPassed += fileStats.assertionsPassed
    this._sessionAssertionsFailed += fileStats.assertionsFailed
    this._sessionBlocksPassed += fileStats.blocksPassed
    this._sessionBlocksFailed += fileStats.blocksFailed
    if (!fileStats.blocksFailed) this._sessionFilesPassed++
    else {
      this._sessionFilesFailed[fileName] = fileStats.failedBlocks
    }
  }
  async execute() {
    this._emitSessionPlanMessage()
    const proms = Object.values(this._fileTestParticles).map(async testFile => {
      const results = await testFile.execute()
      this._addFileResultsToSessionResults(results, testFile.getFileName())
    })
    await Promise.all(proms)
    return this
  }
  finish() {
    return this._emitSessionFinishMessage()
  }
  _emitMessage(message) {
    this._logFunction(message)
    return message
  }
  get length() {
    return Object.values(this._fileTestParticles).length
  }
  _emitSessionPlanMessage() {
    let blocks = 0
    Object.values(this._fileTestParticles).forEach(value => (blocks += value.length))
    this._emitMessage(`${this.length} files and ${blocks} blocks to run. ${this._getSkippedBlockNames().length} skipped blocks.`)
  }
  _getSkippedBlockNames() {
    const skippedBlocks = []
    Object.values(this._fileTestParticles).forEach(file => {
      file.skippedTestBlockNames.forEach(blockName => {
        skippedBlocks.push(blockName)
      })
    })
    return skippedBlocks
  }
  _getFailures() {
    if (!Object.keys(this._sessionFilesFailed).length) return ""
    return `
 failures
${new Particle(this._sessionFilesFailed).forEach(row => row.forEach(line => line.deleteWordAt(0))).toString(2)}`
  }
  _emitSessionFinishMessage() {
    const skipped = this._getSkippedBlockNames()
    const allPassed = this._sessionAssertionsFailed === 0
    const finalColorMethod = allPassed ? TestRacer.green : TestRacer.red
    return this._emitMessage(
      finalColorMethod(`finished in ${this._timer.getTotalElapsedTime()}ms
 skipped
  ${skipped.length} blocks${skipped ? " " + skipped.join(" ") : ""}
 passed
  ${this._sessionFilesPassed} files
  ${this._sessionBlocksPassed} blocks
  ${this._sessionAssertionsPassed} assertions
 failed
  ${Object.keys(this._sessionFilesFailed).length} files
  ${this._sessionBlocksFailed} blocks
  ${this._sessionAssertionsFailed} assertions${this._getFailures()}`)
    )
  }
  static async testSingleFile(fileName, testParticles) {
    const obj = {}
    obj[fileName] = testParticles
    const session = new TestRacer(obj)
    await session.execute()
    session.finish()
  }
}

module.exports = { TestRacer }
