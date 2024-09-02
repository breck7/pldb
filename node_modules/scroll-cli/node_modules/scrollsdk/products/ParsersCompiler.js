var _a
const fs = require("fs")
const path = require("path")
const { Utils } = require("../products/Utils.js")
const { Particle } = require("../products/Particle.js")
const { HandParsersProgram } = require("./Parsers.js")
var CompileTarget
;(function (CompileTarget) {
  CompileTarget["nodejs"] = "nodejs"
  CompileTarget["browser"] = "browser"
})(CompileTarget || (CompileTarget = {}))
class ParsersCompiler {
  static compileParsersForNodeJs(pathToParsers, outputFolder, usePrettier = true, scrollsdkProductsPath = __dirname) {
    return this._compileParsers(pathToParsers, outputFolder, CompileTarget.nodejs, usePrettier, scrollsdkProductsPath)
  }
  static _compileParsers(pathToParsers, outputFolder, target, usePrettier, scrollsdkProductsPath) {
    const isNodeJs = CompileTarget.nodejs === target
    const parsersCode = Particle.fromDisk(pathToParsers)
    const program = new HandParsersProgram(parsersCode.toString())
    const outputFilePath = path.join(outputFolder, `${program.parsersName}.${target}.js`)
    let result = isNodeJs ? program.toNodeJsJavascript(scrollsdkProductsPath) : program.toBrowserJavascript()
    if (isNodeJs)
      result =
        "#! /usr/bin/env node\n" +
        result.replace(
          /}\s*$/,
          `
if (!module.parent) new ${program.rootParserId}(Particle.fromDisk(process.argv[2]).toString()).execute()
}
`
        )
    if (usePrettier) result = require("prettier").format(result, require("../package.json").prettier)
    fs.writeFileSync(outputFilePath, result, "utf8")
    if (isNodeJs) fs.chmodSync(outputFilePath, 0o755)
    return outputFilePath
  }
  static compileParsersForBrowser(pathToParsers, outputFolder, usePrettier = true) {
    return this._compileParsers(pathToParsers, outputFolder, CompileTarget.browser, usePrettier)
  }
}
_a = ParsersCompiler
ParsersCompiler.compileParsersAndCreateProgram = (programPath, parsersPath) => {
  // tod: remove?
  const rootParser = _a.compileParsersFileAtPathAndReturnRootParser(parsersPath)
  return new rootParser(fs.readFileSync(programPath, "utf8"))
}
ParsersCompiler.formatCode = (programCode, parsersPath) => {
  // tod: remove?
  const rootParser = _a.compileParsersFileAtPathAndReturnRootParser(parsersPath)
  const program = new rootParser(programCode)
  return program.format().toString()
}
ParsersCompiler.formatFileInPlace = (programPath, parsersPath) => {
  // tod: remove?
  const original = Particle.fromDisk(programPath)
  const formatted = _a.formatCode(original.toString(), parsersPath)
  if (original === formatted) return false
  new Particle(formatted).toDisk(programPath)
  return true
}
ParsersCompiler.compileParsersFileAtPathAndReturnRootParser = parsersPath => {
  // todo: remove
  if (!fs.existsSync(parsersPath)) throw new Error(`Parsers file does not exist: ${parsersPath}`)
  const parsersCode = fs.readFileSync(parsersPath, "utf8")
  const parsersProgram = new HandParsersProgram(parsersCode)
  return parsersProgram.compileAndReturnRootParser()
}
ParsersCompiler.combineFiles = globPatterns => {
  const glob = require("glob")
  const files = Utils.flatten(globPatterns.map(pattern => glob.sync(pattern)))
  const content = files.map(path => fs.readFileSync(path, "utf8")).join("\n")
  return new Particle(content)
}

module.exports = { ParsersCompiler }
