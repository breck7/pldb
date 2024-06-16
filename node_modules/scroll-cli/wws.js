#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")

// Scroll Notation Includes
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollCli, ScrollFile, ScrollFileSystem } = require("./scroll.js")

const WWS_VERSION = "0.0.1"

const scrollFs = new ScrollFileSystem()
const scrollCli = new ScrollCli().silence()

class WWSCli {
  CommandFnDecoratorSuffix = "Command"

  executeUsersInstructionsFromShell(args = [], userIsPipingInput = process.platform !== "win32" && fs.fstatSync(0).isFIFO()) {
    const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
    const commandName = `${command}${this.CommandFnDecoratorSuffix}`
    if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
    else if (command) this.log(`No command '${command}'. Running help command.`)
    else this.log(`No command provided. Running help command.`)
    return this.helpCommand()
  }

  _runCommandOnPipedStdIn(commandName) {
    let pipedData = ""
    process.stdin.on("readable", function () {
      pipedData += this.read() // todo: what's the lambda way to do this?
    })
    process.stdin.on("end", () => {
      const folders = pipedData
        .trim()
        .split("\n")
        .map(line => line.trim())
        .filter(line => fs.existsSync(line))

      folders.forEach(line => this[commandName](line))

      if (folders.length === 0)
        // Hacky to make sure this at least does something in all environments.
        // process.stdin.isTTY is not quite accurate for pipe detection
        this[commandName](process.cwd())
    })
  }

  silence() {
    this.verbose = false
    return this
  }

  verbose = true

  logIndent = 0
  log(message) {
    const indent = "    ".repeat(this.logIndent)
    if (this.verbose) console.log(indent + message)
    return message
  }

  get _allCommands() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(word => word.endsWith(this.CommandFnDecoratorSuffix))
      .sort()
  }

  async initCommand(cwd) {
    // Split cwd by dir separator and see if it already contains a "wws" part:
    const wwsCache = this._getWWSDir(cwd)
    if (wwsCache) return this.log(`\n👍 WWS already initialized: '${wwsCache}'.`)

    // If not, create a new folder and initialize it:
    const newCwd = path.join(cwd, "wws")
    Disk.mkdir(newCwd)
    const initFolder = {
      "index.scroll": `The World Wide Scroll\n`
    }
    Disk.writeObjectToDisk(newCwd, initFolder)
    return this.log(`\n👍 Initialized new WWS cache in '${newCwd}'.`)
  }

  async buildIndexPage(cwd) {
    const indexFile = path.join(cwd, "index.scroll")
    const content = `title The World Wide Scroll
metaTags
gazetteCss
printTitle
thinColumns 1

${this.folders.map(concept => `- ${concept.id}\n link ${concept.id}/index.html`).join("\n")}
`
    Disk.write(indexFile, content)
    await scrollCli.buildCommand(cwd)
  }

  _getWWSDir(cwd) {
    // first check if this folder contains a folder named "wws":
    if (Disk.exists(path.join(cwd, "wws"))) return path.join(cwd, "wws")
    const parts = cwd.split(path.sep)
    const indexOfWws = parts.indexOf("wws")
    if (indexOfWws === -1) return null
    return parts.slice(0, indexOfWws + 1).join(path.sep)
  }

  get folders() {
    const wwsFile = path.join(__dirname, "wws.scroll")
    const wws = new ScrollFile(Disk.read(wwsFile), wwsFile, scrollFs)
    return wws.concepts
  }

  listCommand() {
    this.folders.forEach(concept => this.log(concept.id))
  }

  fetchScroll(folderName, dir) {
    const folder = this.folders.find(concept => concept.id === folderName)
    if (!folder) return this.log(`\n👎 No folder '${folderName}' found.`)
    // mkdir the folder if it doesn't exist:
    const conceptDir = path.join(dir, folder.id)
    const gitSource = folder.source
    if (!Disk.exists(conceptDir)) {
      this.log(`Fetching ${folderName}`)
      Disk.mkdir(conceptDir)
      // do a shallow clone of the built site (wws branch) into the folder:
      require("child_process").execSync(`git clone --depth 1 --branch wws ${gitSource} ${conceptDir}`)
    } else {
      // update the shallow clone but still keep it shallow
      this.log(`Updating ${folderName}`)
      require("child_process").execSync(`cd ${conceptDir} && git pull`)
    }
  }

  fetchCommand(cwd) {
    const dir = this._getWWSDir(cwd)
    if (!dir) return this.log(`\n👎 No WWS cache found in '${cwd}'.`)
    this.folders.forEach(concept => this.fetchScroll(concept.id, dir))
    this.buildIndexPage(dir)
  }

  openCommand(cwd) {
    // Trigger the terminal to run "open index.html", opening the users web browser:
    const dir = this._getWWSDir(cwd)
    if (!dir) return this.log(`\n👎 No WWS cache found in '${cwd}'.`)
    const indexHtml = path.join(dir, "index.html")
    return require("child_process").exec(`open ${indexHtml}`)
  }

  helpCommand() {
    this.log(`\n🌎🌏📜 WELCOME TO THE WWS (v${WWS_VERSION})`)
    return this.log(`\nThis is the WWS help page.\n\nCommands you can run:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(this.CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
  }
}

if (module && !module.parent) new WWSCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)

module.exports = { WWSCli }
