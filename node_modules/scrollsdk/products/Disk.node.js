var _a
const fs = require("fs")
const path = require("path")
const { Utils } = require("../products/Utils.js")
class Disk {}
_a = Disk
Disk.getParticle = () => require("../products/Particle.js").Particle // todo: cleanup
Disk.rm = path => fs.unlinkSync(path)
Disk.getCleanedString = str => str.replace(/[\,\t\n]/g, " ")
Disk.makeExecutable = path => fs.chmodSync(path, 0o755)
Disk.strCount = (str, reg) => (str.match(new RegExp(reg, "gi")) || []).length
Disk.read = path => {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (err) {
    console.error(`Error reading '$path'`)
    throw err
  }
}
Disk.touch = path => (_a.exists(path) ? true : _a.write(path, ""))
Disk.copy = (source, destination) => _a.write(destination, _a.read(source))
Disk.mkdir = path => fs.mkdirSync(path, { recursive: true })
Disk.getRecursive = path => _a.recursiveReaddirSyncSimple(path)
Disk.readJson = path => JSON.parse(_a.read(path))
Disk.getFileNameWithoutExtension = filepath => path.parse(filepath).name
Disk.write = (path, content) => fs.writeFileSync(path, content, "utf8")
// Do not overwrite to preserve mtimes for cache
Disk.writeIfChanged = (filepath, content) => {
  if (!_a.exists(filepath) || _a.read(filepath) !== content) _a.write(filepath, content)
}
Disk.writeJson = (path, content) => fs.writeFileSync(path, JSON.stringify(content, null, 2), "utf8")
Disk.createFileIfDoesNotExist = (path, initialString = "") => {
  if (!fs.existsSync(path)) _a.write(path, initialString)
}
Disk.exists = path => fs.existsSync(path)
Disk.dir = dir => fs.readdirSync(dir).filter(file => file !== ".DS_Store")
Disk.getFullPaths = dir => _a.dir(dir).map(file => path.join(dir, file))
Disk.getFiles = dir => _a.getFullPaths(dir).filter(file => fs.statSync(file).isFile())
Disk.getFolders = dir => _a.getFullPaths(dir).filter(file => fs.statSync(file).isDirectory())
Disk.isDir = path => fs.statSync(path).isDirectory()
Disk.getFileName = fileName => path.parse(fileName).base
Disk.append = (path, content) => fs.appendFileSync(path, content, "utf8")
Disk.appendAsync = (path, content, callback) => fs.appendFile(path, content, "utf8", callback)
Disk.readCsvAsParticles = path => _a.getParticle().fromCsv(_a.read(path))
Disk.readSsvAsParticles = path => _a.getParticle().fromSsv(_a.read(path))
Disk.readTsvAsParticles = path => _a.getParticle().fromTsv(_a.read(path))
Disk.insertIntoFile = (path, content, delimiter) => _a.write(path, _a.stickBetween(content, _a.read(path), delimiter))
Disk.detectAndReadAsParticles = path => _a.detectDelimiterAndReadAsParticles(_a.read(path))
Disk.getAllOf = (particle, prop) => particle.filter(particle => particle.getAtom(0) === prop)
Disk.getDelimitedParticlesAsParticles = (particle, delimiter = undefined) => _a.detectDelimiterAndReadAsParticles(particle.subparticlesToString())
Disk.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
Disk.readParticles = path => new (_a.getParticle())(_a.read(path))
Disk.sizeOf = path => fs.statSync(path).size
Disk.stripHtml = text => (text && text.replace ? text.replace(/<(?:.|\n)*?>/gm, "") : text)
Disk.stripParentheticals = text => (text && text.replace ? text.replace(/\((?:.|\n)*?\)/gm, "") : text)
Disk.escape = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
Disk.hasLine = (path, line) => _a.read(path).includes(line)
Disk.mv = (source, dest) => {
  if (_a.exists(dest) && false) {
    console.log(`${dest} exists. Skipping`)
  } else {
    _a.write(dest, _a.read(source))
    _a.rm(source)
  }
}
Disk.stickBetween = (content, dest, delimiter) => {
  const parts = dest.split(delimiter)
  return [parts[0], content, parts[2]].join(delimiter)
}
// todo: move to particle base class
Disk.detectDelimiterAndReadAsParticles = str => {
  const line1 = str.split("\n")[0]
  const Particle = _a.getParticle()
  if (line1.includes("\t")) return Particle.fromTsv(str)
  else if (line1.includes(",")) return Particle.fromCsv(str)
  else if (line1.includes("|")) return Particle.fromDelimited(str, "|")
  else if (line1.includes(";")) return Particle.fromDelimited(str, ";")
  // todo: add more robust. align with choose delimiter
  return Particle.fromSsv(str)
}
Disk.deleteDuplicates = (particle, prop1, prop2, reverse = false) => {
  const map = {}
  _a.getAllOf(particle, prop1).forEach(particle => {
    const val = particle.get(prop2)
    console.log(val)
    if (map[val] && reverse) {
      map[val].destroy()
      map[val] = particle
    } else if (map[val]) {
      particle.destroy()
    } else map[val] = particle
  })
}
// todo: remove.
Disk.getLastFolderName = path => {
  const parts = path.replace(/\/$/, "").split("/")
  const last = parts.pop()
  return fs.statSync(path).isDirectory() ? last : parts.pop()
}
Disk.appendUniqueLine = (path, line) => {
  const file = _a.read(path)
  if (file.match(new RegExp("^" + _a.escape(line), "m"))) return true
  const prefix = !file || file.endsWith("\n") ? "" : "\n"
  return _a.append(path, prefix + line + "\n")
}
Disk.move = (particle, newPosition) => {
  particle.parent.insertLineAndSubparticles(particle.getLine(), particle.subparticlesToString(), newPosition)
  particle.destroy()
}
Disk._getTextUrl = async url => {
  const res = await _a.getUrl(url)
  return res.body === undefined ? res.text : res.body
}
Disk.getUrl = url => Utils.httpRequest(url)
Disk.download = async (url, destination) => {
  const result = await _a._getTextUrl(url)
  _a.write(destination, result)
}
Disk.downloadPlain = async (url, destination) => {
  const result = await _a.getUrl(url)
  _a.write(destination, result.text)
}
Disk.downloadJson = async (url, destination) => {
  const result = await _a._getTextUrl(url)
  if (destination) _a.writeJson(destination, result)
  return result
}
Disk.buildMapFrom = (particle, key, value) => {
  const map = {}
  particle.forEach(subparticle => {
    map[subparticle.get(key)] = subparticle.get(value)
  })
  return map
}
Disk.csvToMap = (path, columnName) => {
  const particle = _a.readCsvAsParticles(path)
  const map = {}
  particle.forEach(subparticle => {
    const key = subparticle.get(columnName)
    map[key] = subparticle.toObject()
  })
  return map
}
/**
 * Take an object like {".gitignore" : "ignore/", "parsers/root.parsers": "foo"}
 * and recreate on the filesystem as files and folders. Each key is 1 file.
 * */
Disk.writeObjectToDisk = (baseFolder, obj) => {
  Object.keys(obj).forEach(filename => {
    const filePath = path.join(baseFolder, filename)
    if (filename.includes("/")) _a.mkdir(path.dirname(filePath))
    if (!fs.existsSync(filePath)) _a.writeIfChanged(filePath, obj[filename])
  })
}
Disk.recursiveReaddirSyncSimple = filepath => {
  let list = []
  const files = fs.readdirSync(filepath)
  let stats
  files.forEach(function (file) {
    stats = fs.lstatSync(path.join(filepath, file))
    if (stats.isDirectory()) list = list.concat(_a.recursiveReaddirSyncSimple(path.join(filepath, file)))
    else list.push(path.join(filepath, file))
  })
  return list
}
Disk.recursiveReaddirSync = (folder, callback) =>
  fs.readdirSync(folder).forEach(filename => {
    try {
      const fullPath = path.join(folder, filename)
      const isDir = fs.lstatSync(fullPath).isDirectory()
      if (filename.includes("node_modules")) return // Do not recurse into node_modules folders
      if (isDir) _a.recursiveReaddirSync(fullPath, callback)
      else callback(fullPath)
    } catch (err) {
      // Ignore errors
    }
  })

module.exports = { Disk }
