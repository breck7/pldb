#! /usr/bin/env node
{
  const { Utils } = require("./Utils.js")
  const { Particle } = require("./Particle.js")
  const { HandParsersProgram } = require("./Parsers.js")
  const { ParserBackedParticle } = require("./Parsers.js")

  class stampParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(errorParser, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), { "#!": hashbangParser, file: fileParser, folder: folderParser }), undefined)
    }
    async executeSeries(parentDir) {
      const length = this.length
      for (let index = 0; index < length; index++) {
        const particle = this.particleAt(index)
        await particle.execute(parentDir)
      }
      return parentDir
    }
    verbose = true
    silence() {
      this.verbose = false
      return this
    }
    log(message) {
      if (this.verbose) console.log(message)
    }
    async execute(parentDir = process.cwd()) {
      await this.executeSeries(parentDir)
    }
    static dirToStampWithContents(absPathWithoutEndingSlash) {
      return stampParser._dirToStampFn(absPathWithoutEndingSlash, "content")
    }
    static dirToStamp(absPathWithoutEndingSlash) {
      return stampParser._dirToStampFn(absPathWithoutEndingSlash, "list")
    }
    static _dirToStampFn(absPathWithoutEndingSlash, output) {
      const fs = require("fs")
      // todo: add chmod, file metadata
      if (absPathWithoutEndingSlash.startsWith(".")) absPathWithoutEndingSlash = Utils.resolvePath(absPathWithoutEndingSlash, process.cwd() + "/")
      const stat = fs.statSync(absPathWithoutEndingSlash)
      if (!stat.isDirectory()) throw new Error(`${absPath} is a file not a directory.`)
      const fns = {
        list: (file, reducedPath) => {
          const stat = fs.statSync(file)
          const isDir = stat.isDirectory()
          if (isDir) return `folder ` + reducedPath
          return `file ` + reducedPath
        },
        content: (file, reducedPath) => {
          const stat = fs.statSync(file)
          const isDir = stat.isDirectory()
          if (isDir) return `folder ` + reducedPath
          const content = fs.readFileSync(file, "utf8")
          return `file ${reducedPath}
 data${Particle.nest(content, 2)}`
        }
      }
      const fn = fns[output]
      return this._dirToStamp(absPathWithoutEndingSlash, fn)
    }
    static _dirToStamp(absPathWithoutEndingSlash, fileFn) {
      const fs = require("fs")
      const path = require("path")
      function recursiveReaddirSync(filepath) {
        let list = []
        const files = fs.readdirSync(filepath)
        let stats
        files.forEach(function (file) {
          stats = fs.lstatSync(path.join(filepath, file))
          if (stats.isDirectory()) list = list.concat(recursiveReaddirSync(path.join(filepath, file)))
          else list.push(path.join(filepath, file))
        })
        return list
      }
      const files = recursiveReaddirSync(absPathWithoutEndingSlash)
      const folderParts = absPathWithoutEndingSlash.split("/")
      const rootFolderName = folderParts.pop()
      const rootFolderPath = folderParts.join("/")
      const pathStartIndex = rootFolderPath.length + 1
      return files.map(file => fileFn(file, file.substr(pathStartIndex))).join("\n")
    }
    static cachedHandParsersProgramRoot = new HandParsersProgram(`// todo File permissions

// Atom parsers
anyAtom
extraAtom
 paint invalid
anyAtom
 paint string
promptAtomsAtom
 paint string
filepathAtom
varNameAtom
 paint string
commentAtom
 paint comment
inputTypeAtom
 enum string int any lowercase
keywordAtom
 paint keyword.control

// Line parsers
stampParser
 root
 description A prefix Language for creating distributable text template files that expand to folders and files.
 catchAllParser errorParser
 javascript
  async executeSeries(parentDir) {
   const length = this.length
   for (let index = 0; index < length; index++) {
    const particle = this.particleAt(index)
    await particle.execute(parentDir)
   }
   return parentDir
  }
  verbose = true
  silence(){
    this.verbose = false
    return this
  }
  log(message) {
    if (this.verbose)
      console.log(message)
  }
  async execute(parentDir = process.cwd()) {
   await this.executeSeries(parentDir)
  }
  static dirToStampWithContents(absPathWithoutEndingSlash) {
    return stampParser._dirToStampFn(absPathWithoutEndingSlash, "content")
  }
  static dirToStamp(absPathWithoutEndingSlash) {
    return stampParser._dirToStampFn(absPathWithoutEndingSlash, "list")
  }
  static _dirToStampFn(absPathWithoutEndingSlash, output) {
   const fs = require("fs")
   // todo: add chmod, file metadata
   if (absPathWithoutEndingSlash.startsWith(".")) absPathWithoutEndingSlash = Utils.resolvePath(absPathWithoutEndingSlash, process.cwd() + "/")
   const stat = fs.statSync(absPathWithoutEndingSlash)
   if (!stat.isDirectory()) throw new Error(\`\${absPath} is a file not a directory.\`)
   const fns = {
    list: (file, reducedPath) => {
     const stat = fs.statSync(file)
     const isDir = stat.isDirectory()
     if (isDir) return \`folder \` + reducedPath
     return \`file \` + reducedPath
    },
    content: (file, reducedPath) => {
     const stat = fs.statSync(file)
     const isDir = stat.isDirectory()
     if (isDir) return \`folder \` + reducedPath
     const content = fs.readFileSync(file, "utf8")
     return \`file \${reducedPath}
   data\${Particle.nest(content, 2)}\`
    }
   }
   const fn = fns[output]
   return this._dirToStamp(absPathWithoutEndingSlash, fn)
  }
  static _dirToStamp(absPathWithoutEndingSlash, fileFn) {
   const fs = require("fs")
   const path = require("path")
   function recursiveReaddirSync (filepath) {
    let list  = []
    const files = fs.readdirSync(filepath)
    let stats
    files.forEach(function (file) {
      stats = fs.lstatSync(path.join(filepath, file))
      if (stats.isDirectory()) list = list.concat(recursiveReaddirSync(path.join(filepath, file)))
      else list.push(path.join(filepath, file))
    })
    return list
   }
   const files = recursiveReaddirSync(absPathWithoutEndingSlash)
   const folderParts = absPathWithoutEndingSlash.split("/")
   const rootFolderName = folderParts.pop()
   const rootFolderPath = folderParts.join("/")
   const pathStartIndex = rootFolderPath.length + 1
   return files.map(file => fileFn(file, file.substr(pathStartIndex))).join("\\n")
  }
 inScope hashbangParser folderParser fileParser
hashbangParser
 crux #!
 catchAllAtomType commentAtom
 atoms commentAtom
catchAllAnyLineParser
 catchAllAtomType anyAtom
 catchAllParser catchAllAnyLineParser
 atoms anyAtom
dataParser
 catchAllParser catchAllAnyLineParser
 atoms keywordAtom
 crux data
errorParser
 baseParser errorParser
executableParser
 atoms keywordAtom
 crux executable
fileParser
 atoms keywordAtom filepathAtom
 javascript
  compileToBash(parentDir) {
   const filePath = this._getAbsolutePath(parentDir)
   return \`touch \${filePath}\\necho -e "\${this.subparticlesToString()}" >> \${filePath}\`
  }
  _getAbsolutePath(parentDir = process.cwd()) {
   return parentDir + "/" + this.atomsMap.filepathAtom
  }
  execute(parentDir) {
   const fs = require("fs")
   const fullPath = this._getAbsolutePath(parentDir)
   this.root.log(\`Creating file \${fullPath}\`)
   const data = this.getParticle("data")
   const content = data ? data.subparticlesToString() : ""
   fs.mkdirSync(require("path").dirname(fullPath), {recursive: true})
   fs.writeFileSync(fullPath, content, "utf8")
   const isExecutable = this.has("executable") // todo: allow for all file permissions?
   if (isExecutable) fs.chmodSync(fullPath, "755")
  }
 inScope dataParser executableParser
 crux file
folderParser
 atoms keywordAtom filepathAtom
 javascript
  compileToBash(parentDir) {
   return \`mkdir \${this._getAbsolutePath(parentDir)}\`
  }
  _getAbsolutePath(parentDir = process.cwd()) {
   return parentDir + "/" + this.atomsMap.filepathAtom
  }
  execute(parentDir) {
   const path = this._getAbsolutePath(parentDir)
   this.root.log(\`Creating folder \${path}\`)
   const fs = require("fs")
   fs.mkdirSync(path, {recursive: true})
  }
 crux folder`)
    get handParsersProgram() {
      return this.constructor.cachedHandParsersProgramRoot
    }
    static rootParser = stampParser
  }

  class hashbangParser extends ParserBackedParticle {
    get commentAtom() {
      return this.getAtom(0)
    }
    get commentAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class catchAllAnyLineParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllAnyLineParser, undefined, undefined)
    }
    get anyAtom() {
      return this.getAtom(0)
    }
    get anyAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class dataParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllAnyLineParser, undefined, undefined)
    }
    get keywordAtom() {
      return this.getAtom(0)
    }
  }

  class errorParser extends ParserBackedParticle {
    getErrors() {
      return this._getErrorParserErrors()
    }
  }

  class executableParser extends ParserBackedParticle {
    get keywordAtom() {
      return this.getAtom(0)
    }
  }

  class fileParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(undefined, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), { data: dataParser, executable: executableParser }), undefined)
    }
    get keywordAtom() {
      return this.getAtom(0)
    }
    get filepathAtom() {
      return this.getAtom(1)
    }
    compileToBash(parentDir) {
      const filePath = this._getAbsolutePath(parentDir)
      return `touch ${filePath}\necho -e "${this.subparticlesToString()}" >> ${filePath}`
    }
    _getAbsolutePath(parentDir = process.cwd()) {
      return parentDir + "/" + this.atomsMap.filepathAtom
    }
    execute(parentDir) {
      const fs = require("fs")
      const fullPath = this._getAbsolutePath(parentDir)
      this.root.log(`Creating file ${fullPath}`)
      const data = this.getParticle("data")
      const content = data ? data.subparticlesToString() : ""
      fs.mkdirSync(require("path").dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, content, "utf8")
      const isExecutable = this.has("executable") // todo: allow for all file permissions?
      if (isExecutable) fs.chmodSync(fullPath, "755")
    }
  }

  class folderParser extends ParserBackedParticle {
    get keywordAtom() {
      return this.getAtom(0)
    }
    get filepathAtom() {
      return this.getAtom(1)
    }
    compileToBash(parentDir) {
      return `mkdir ${this._getAbsolutePath(parentDir)}`
    }
    _getAbsolutePath(parentDir = process.cwd()) {
      return parentDir + "/" + this.atomsMap.filepathAtom
    }
    execute(parentDir) {
      const path = this._getAbsolutePath(parentDir)
      this.root.log(`Creating folder ${path}`)
      const fs = require("fs")
      fs.mkdirSync(path, { recursive: true })
    }
  }

  module.exports = stampParser
  stampParser

  if (!module.parent) new stampParser(Particle.fromDisk(process.argv[2]).toString()).execute()
}
