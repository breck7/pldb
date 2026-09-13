#! /usr/bin/env node

// NPM ecosystem includes
const path = require("path")
const lodash = require("lodash")

// Particles Includes
const { Particle } = require("scrollsdk/products/Particle.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollFileSystem } = require("scrollsdk/products/ScrollFileSystem.js")
const { SimpleCLI } = require("./simpleCli.js")
const packageJson = require("./package.json")

const ensureFolderEndsInSlash = folder => folder.replace(/\/$/, "") + "/"

class ScrollCli extends SimpleCLI {
  welcomeMessage = `\n📜 WELCOME TO SCROLL (v${packageJson.version})`
  async initCommand(cwd) {
    // todo: use stamp for this.
    const initFolder = {
      ".gitignore": `*.html
*.rss
*.txt
.*.js
.*.css
feed.xml`,
      "header.scroll": `importOnly
metaTags
buildTxt
buildHtml
theme gazette
homeButton
leftRightButtons
editButton
printTitle`,
      "feed.scroll": `buildRss
printFeed All`,
      "footer.scroll": `importOnly
center
editButton
scrollVersionLink`,
      "helloWorld.scroll": `tags All
header.scroll
thinColumn
This is my first blog post using Scroll.

****

footer.scroll`,
      "index.scroll": `title My Blog
header.scroll
printSnippets All
footer.scroll`
    }

    this.log(`Initializing scroll in "${cwd}"`)
    Disk.writeObjectToDisk(cwd, initFolder)
    require("child_process").execSync("git init", { cwd })
    return this.log(`\n✅ Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
  }

  async scrollToHtml(scrollCode) {
    const file = this.sfs.newFile(scrollCode)
    await file.singlePassFuse()
    return file.scrollProgram.asHtml
  }

  sfs = new ScrollFileSystem(undefined, path.join(__dirname, "parsers"))
  initFs(obj) {
    // for testing
    this.sfs = new ScrollFileSystem(obj, path.join(__dirname, "parsers"))
    return this.sfs
  }

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  async _getFilesInFolder(folder) {
    const folderPath = ensureFolderEndsInSlash(folder)
    return await this.sfs.getFusedFilesInFolder(folderPath, ".scroll") // Init/cache all parsers
  }

  async getErrorsInFolder(folder) {
    const files = await this._getFilesInFolder(folder)
    return await this.getErrorsInFiles(files)
  }

  async getErrorsInFiles(files) {
    // todo: re-add parser errors
    for (let file of files) await file.scrollProgram.load()
    return files
      .map(file => {
        const { scrollProgram } = file
        return scrollProgram.getAllErrors().map(err => {
          return { filename: scrollProgram.filename, ...err.toObject() }
        })
      })
      .flat()
  }

  async testCommand(cwd, filenames) {
    const start = Date.now()
    const folder = this.resolvePath(cwd)
    let target = cwd
    let scrollErrors = []
    let fileCount = 0
    if (filenames && filenames.length) {
      const files = await this.getFiles(cwd, filenames)
      scrollErrors = await this.getErrorsInFiles(files)
      target = filenames.join(" ")
      fileCount = files.length
    } else {
      scrollErrors = await this.getErrorsInFolder(folder)
      const files = await this._getFilesInFolder(folder)
      fileCount = files.length
    }

    const seconds = (Date.now() - start) / 1000

    if (scrollErrors.length) {
      this.log(``)
      this.log(`❌ ${scrollErrors.length} errors in "${cwd}"`)
      this.log(new Particle(scrollErrors).toFormattedTable(100))
      this.log(``)
    }
    if (!scrollErrors.length) return this.log(`✅ 0 errors in "${target}". ${fileCount} files tested in ${seconds} seconds.`)
    return `${scrollErrors.length} Errors`
  }

  async formatCommand(cwd, filenames) {
    let files = []
    if (filenames && filenames.length) files = await this.getFiles(cwd, filenames)
    else files = await this.sfs.getFusedFilesInFolder(this.resolvePath(cwd), ".scroll")
    // .concat(fileSystem.getFusedFilesInFolder(folder, ".parsers")) // todo: should format parser files too.
    for (let file of files) {
      this.formatFile(file.scrollProgram)
    }
  }

  // Formatting is currently defined as formatting the entire original source file
  // using the last parser present.
  async formatFile(scrollProgram) {
    await scrollProgram.ensureFileLoaded()
    const { formatted, filePath, filename, codeAtStart } = scrollProgram
    if (codeAtStart === formatted) return
    await this.sfs.write(filePath, formatted)
    this.log(`💾 formatted ${filename}`)
  }

  // A user provides a list of filenames such as 'index.scroll ../foobar.scroll' and we
  // know the cwd, turn them into absolute file paths
  resolveFilenames(cwd, filenames) {
    return filenames
      .filter(filename => filename.length > 0) // Remove empty strings
      .map(filename => path.resolve(cwd, filename)) // Convert to absolute paths
  }

  async getFiles(cwd, filenames) {
    const fullPaths = this.resolveFilenames(cwd, filenames)
    const files = await Promise.all(fullPaths.map(fp => this.sfs.getFusedFile(fp)))
    return files
  }

  async buildCommand(cwd, filenames) {
    if (filenames && filenames.length) {
      const files = await this.getFiles(cwd, filenames)
      this.log(`Building ${filenames.length} scroll files\n`)
      return await this.buildFiles(this.sfs, files, cwd)
    }
    await this.buildFilesInFolder(this.resolvePath(cwd))
    return this
  }

  async buildFiles(fileSystem, files, folder, options = {}) {
    const start = Date.now()
    // Run the build loop twice. The first time we build ScrollSets, in case some of the HTML files
    // will depend on csv/tsv/json/etc
    const toBuild = files.filter(file => !file.scrollProgram.importOnly)
    options.externalFilesCopied = {}
    for (const file of toBuild) {
      file.scrollProgram.logger = this
      await file.scrollProgram.load()
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildOne(options)
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildTwo(options)
    }
    const seconds = (Date.now() - start) / 1000
    this.log(``)
    const outputExtensions = fileSystem.productCache.map(filename => filename.split(".").pop())
    const buildStats = lodash.map(lodash.orderBy(lodash.toPairs(lodash.countBy(outputExtensions)), 1, "desc"), ([extension, count]) => ({ extension, count }))
    this.log(
      `⌛️ Read ${files.length} scroll files and wrote ${fileSystem.productCache.length} files (${buildStats.map(i => i.extension + ":" + i.count).join(" ")}) in ${seconds} seconds. Processed ${lodash.round(
        files.length / seconds
      )} scroll files per second\n`
    )

    return fileSystem.productCache
  }

  async buildFilesInFolder(folder = "/", fileSystem = this.sfs) {
    folder = ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getFusedFilesInFolder(folder, ".scroll")
    this.log(`Found ${files.length} scroll files in '${folder}'\n`)
    return await this.buildFiles(fileSystem, files, folder)
  }

  listCommand(cwd) {
    return this.findScrollsInDirRecursive(cwd)
  }

  findScrollsInDirRecursive(dir) {
    const folders = {}
    Disk.recursiveReaddirSync(dir, filename => {
      if (!filename.endsWith(".scroll")) return

      const folder = path.dirname(filename)
      if (!folders[folder]) {
        folders[folder] = {
          folder,
          scrollFileCount: 0
        }
        this.log(folder)
      }
      folders[folder].scrollFileCount++
    })

    return folders
  }
}

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell()

module.exports = { ScrollCli, SimpleCLI }
