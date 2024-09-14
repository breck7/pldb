var _a
const fs = require("fs")
const path = require("path")
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
Disk.touch = path => (Disk.exists(path) ? true : Disk.write(path, ""))
Disk.copy = (source, destination) => Disk.write(destination, Disk.read(source))
Disk.mkdir = path => fs.mkdirSync(path, { recursive: true })
Disk.getRecursive = path => Disk.recursiveReaddirSyncSimple(path)
Disk.readJson = path => JSON.parse(Disk.read(path))
Disk.getFileNameWithoutExtension = filepath => path.parse(filepath).name
Disk.write = (path, content) => fs.writeFileSync(path, content, "utf8")
// Do not overwrite to preserve mtimes for cache
Disk.writeIfChanged = (filepath, content) => {
  if (!Disk.exists(filepath) || Disk.read(filepath) !== content) Disk.write(filepath, content)
}
Disk.writeJson = (path, content) => fs.writeFileSync(path, JSON.stringify(content, null, 2), "utf8")
Disk.createFileIfDoesNotExist = (path, initialString = "") => {
  if (!fs.existsSync(path)) Disk.write(path, initialString)
}
Disk.exists = path => fs.existsSync(path)
Disk.dir = dir => fs.readdirSync(dir).filter(file => file !== ".DS_Store")
Disk.getFullPaths = dir => Disk.dir(dir).map(file => path.join(dir, file))
Disk.getFiles = dir => Disk.getFullPaths(dir).filter(file => fs.statSync(file).isFile())
Disk.getFolders = dir => Disk.getFullPaths(dir).filter(file => fs.statSync(file).isDirectory())
Disk.isDir = path => fs.statSync(path).isDirectory()
Disk.getFileName = fileName => path.parse(fileName).base
Disk.append = (path, content) => fs.appendFileSync(path, content, "utf8")
Disk.appendAsync = (path, content, callback) => fs.appendFile(path, content, "utf8", callback)
Disk.readCsvAsParticles = path => Disk.getParticle().fromCsv(Disk.read(path))
Disk.readSsvAsParticles = path => Disk.getParticle().fromSsv(Disk.read(path))
Disk.readTsvAsParticles = path => Disk.getParticle().fromTsv(Disk.read(path))
Disk.insertIntoFile = (path, content, delimiter) => Disk.write(path, Disk.stickBetween(content, Disk.read(path), delimiter))
Disk.detectAndReadAsParticles = path => Disk.detectDelimiterAndReadAsParticles(Disk.read(path))
Disk.getAllOf = (particle, prop) => particle.filter(particle => particle.getWord(0) === prop)
Disk.getDelimitedParticlesAsParticles = (particle, delimiter = undefined) => Disk.detectDelimiterAndReadAsParticles(particle.subparticlesToString())
Disk.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
Disk.readParticles = path => new (Disk.getParticle())(Disk.read(path))
Disk.sizeOf = path => fs.statSync(path).size
Disk.stripHtml = text => (text && text.replace ? text.replace(/<(?:.|\n)*?>/gm, "") : text)
Disk.stripParentheticals = text => (text && text.replace ? text.replace(/\((?:.|\n)*?\)/gm, "") : text)
Disk.escape = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
Disk.hasLine = (path, line) => Disk.read(path).includes(line)
Disk.mv = (source, dest) => {
  if (Disk.exists(dest) && false) {
    console.log(`${dest} exists. Skipping`)
  } else {
    Disk.write(dest, Disk.read(source))
    Disk.rm(source)
  }
}
Disk.stickBetween = (content, dest, delimiter) => {
  const parts = dest.split(delimiter)
  return [parts[0], content, parts[2]].join(delimiter)
}
// todo: move to particle base class
Disk.detectDelimiterAndReadAsParticles = str => {
  const line1 = str.split("\n")[0]
  const Particle = Disk.getParticle()
  if (line1.includes("\t")) return Particle.fromTsv(str)
  else if (line1.includes(",")) return Particle.fromCsv(str)
  else if (line1.includes("|")) return Particle.fromDelimited(str, "|")
  else if (line1.includes(";")) return Particle.fromDelimited(str, ";")
  // todo: add more robust. align with choose delimiter
  return Particle.fromSsv(str)
}
Disk.deleteDuplicates = (particle, prop1, prop2, reverse = false) => {
  const map = {}
  Disk.getAllOf(particle, prop1).forEach(particle => {
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
  const file = Disk.read(path)
  if (file.match(new RegExp("^" + Disk.escape(line), "m"))) return true
  const prefix = !file || file.endsWith("\n") ? "" : "\n"
  return Disk.append(path, prefix + line + "\n")
}
Disk.move = (particle, newPosition) => {
  particle.parent.insertLineAndSubparticles(particle.getLine(), particle.subparticlesToString(), newPosition)
  particle.destroy()
}
Disk._getTextUrl = async url => {
  // todo: https://visionmedia.github.io/superagent/
  // build well tested version of this.
  // have a mock server returning with all sorts of things.
  const res = await Disk.getUrl(url)
  // todo: leave it up to user to specfiy text ro body
  return res.body || res.text || ""
}
Disk.getUrl = async url => {
  const superagent = require("superagent")
  const agent = superagent.agent()
  const res = await agent.get(url)
  return res
}
Disk.download = async (url, destination) => {
  const result = await Disk._getTextUrl(url)
  Disk.write(destination, result)
}
Disk.downloadPlain = async (url, destination) => {
  const result = await Disk.getUrl(url)
  Disk.write(destination, result.text)
}
Disk.downloadJson = async (url, destination) => {
  const result = await Disk._getTextUrl(url)
  if (destination) Disk.writeJson(destination, result)
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
  const particle = Disk.readCsvAsParticles(path)
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
    if (filename.includes("/")) Disk.mkdir(path.dirname(filePath))
    if (!fs.existsSync(filePath)) Disk.writeIfChanged(filePath, obj[filename])
  })
}
Disk.recursiveReaddirSyncSimple = filepath => {
  let list = []
  const files = fs.readdirSync(filepath)
  let stats
  files.forEach(function (file) {
    stats = fs.lstatSync(path.join(filepath, file))
    if (stats.isDirectory()) list = list.concat(Disk.recursiveReaddirSyncSimple(path.join(filepath, file)))
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
      if (isDir) Disk.recursiveReaddirSync(fullPath, callback)
      else callback(fullPath)
    } catch (err) {
      // Ignore errors
    }
  })

module.exports = { Disk }
