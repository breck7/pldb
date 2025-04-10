#! /usr/bin/env node

const path = require("path")

const { Particle } = require("scrollsdk/products/Particle.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollSetCLI } = require("scroll-cli/ScrollSetCLI.js")
const { execSync } = require("child_process")
const semver = require("semver")
const lodash = require("lodash")

const baseFolder = path.join(__dirname)
const ignoreFolder = path.join(baseFolder, "ignore")

class PLDBCli extends ScrollSetCLI {
  baseFolder = __dirname
  conceptsFolder = path.join(baseFolder, "concepts")
  parsersFile = path.join(__dirname, "code", "measures.parsers")
  scrollSetName = "pldb"
  compiledConcepts = path.join(__dirname, "./pldb.json")

  get keywordsOneHotCsv() {
    if (!this.quickCache.keywordsOneHotCsv) this.quickCache.keywordsOneHotCsv = new Particle(this.keywordsOneHot).asCsv
    return this.quickCache.keywordsOneHotCsv
  }

  makeNames(concept) {
    return [
      concept.name,
      concept.id,
      concept.standsFor,
      concept.githubLanguage,
      concept.wikipediaTitle,
      concept.aka
    ].filter(i => i)
  }

  get keywordsOneHot() {
    if (this.quickCache.keywordsOneHot) return this.quickCache.keywordsOneHot
    const { keywordsTable } = this
    const allKeywords = keywordsTable.rows.map(row => row.keyword)
    const langsWithKeywords = this.topLanguages.filter(file => file.has("keywords"))
    const headerRow = allKeywords.slice()
    headerRow.unshift("id")
    const rows = langsWithKeywords.map(file => {
      const row = [file.id]
      const keywords = new Set(file.keywords)
      allKeywords.forEach(keyword => {
        row.push(keywords.has(keyword) ? 1 : 0)
      })
      return row
    })
    rows.unshift(headerRow)
    this.quickCache.keywordsOneHot = rows
    return rows
  }

  async crawlGitHubCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    const { GitHubImporter } = require("../crawlers/github.com/GitHub.js")
    const importer = new GitHubImporter(this)
    await importer.fetchAllRepoDataCommand()
    await importer.writeAllRepoDataCommand()
  }

  async crawlWikipediaCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    const { WikipediaImporter } = require("../crawlers/wikipedia.org/Wikipedia.js")
    const importer = new WikipediaImporter(this)
    // await importer.fetchAllCommand()
    await importer.writeToDatabaseCommand()
  }

  async crawlRedditPLCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    const { RedditImporter } = require("../crawlers/reddit.com/Reddit.js")

    const importer = new RedditImporter(this.concepts, this.conceptsFolder)
    await importer.createFromAnnouncementsCommand()
  }

  async allCommand(lang) {
    await this.crawlGitsCommand(lang)
    await this.crawlGitHubCommand(lang)
    await this.addWrittenInCommand(lang)
  }

  async crawlGitsCommand(lang) {
    const { GitStats } = require("./code/gitStats.js")
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    const shuffled = lodash.shuffle(this.concepts)

    for (let file of shuffled) {
      if (lang && lang !== file.id) continue
      if (lang) console.log(`processing ${lang}`)
      const { mainRepo } = file
      if (!mainRepo) continue
      const targetFolder = path.join(this.gitsFolder, file.id)
      // if (Disk.exists(targetFolder)) continue
      //if (file.repoStats_files) continue
      //if (file.isFinished) continue
      try {
        const gitStats = new GitStats(mainRepo, targetFolder)
        if (!Disk.exists(targetFolder)) gitStats.clone()

        const particle = this.getParticle(file)
        particle.touchParticle("repoStats").setProperties(gitStats.summary)
        if (!particle.has("appeared")) particle.set("appeared", gitStats.firstCommit.toString())
        await this.formatAndSave(file, particle)
      } catch (err) {
        console.error(err, file.id)
      }
    }
  }

  async addWrittenInCommand(lang) {
    const files = lang ? this.concepts.filter(file => lang === file.id) : this.concepts
    const { addWrittenIn } = require("./code/addWrittenIn.js")
    files.forEach(file => {
      if (file.mainRepo && !file.writtenIn) addWrittenIn(file.id, this)
    })
  }

  gitsFolder = path.join(ignoreFolder, "node_modules", "gits") // toss in a fake "node_modules" folder to avoid a "scroll list" scan. hacky i know.

  async crawlVersionsCommand(lang) {
    this.concepts.forEach(async file => {
      if (lang && !lang.includes(file.id)) return
      const { mainRepo } = file
      if (!mainRepo) return
      const targetFolder = path.join(this.gitsFolder, file.id)
      if (file.latestVersion) return
      try {
        const version = this.extractVersion(targetFolder)
        if (version) this.setAndSave(file, "latestVersion", version)
      } catch (err) {
        console.error(err, file.id)
      }
    })
  }

  extractVersion(folderName) {
    const version = this.getLatestVersionFromTags(folderName)
    if (version) return version

    const packageJson = path.join(folderName, "package.json")
    if (Disk.exists(packageJson)) {
      const version = require(packageJson).version
      if (version !== "0.0.0") return version
    }
    const changesFile = path.join(folderName, "CHANGES.md")
    if (Disk.exists(changesFile)) {
      const hit = this.findVersion(Disk.read(changesFile))
      if (hit) return hit
    }
  }

  getLatestVersionFromTags(repoPath) {
    // Example usage
    // Fetch all tags
    execSync("git fetch --tags", { cwd: repoPath })

    // List all tags
    const tags = execSync("git tag", { encoding: "utf-8", cwd: repoPath })
      .split("\n")
      .filter(tag => semver.valid(tag)) // Filter valid semver tags

    // Sort tags using semver and get the latest version
    return tags.sort(semver.rcompare)[0]
  }

  findVersion(changesFile) {
    // Regular expression to match version numbers (e.g., v1.2.3, 1.2.3) but not dates like 2023.3.0
    const versionRegex = /\bv?(\d?\d?\d\.\d+\.\d+)\b/g
    // Find all version matches
    const versions = []
    let match
    while ((match = versionRegex.exec(changesFile)) !== null) {
      versions.push(match[1])
    }

    // Sort the versions in descending order to get the newest version first
    versions.sort((a, b) => {
      const aParts = a.split(".").map(Number)
      const bParts = b.split(".").map(Number)

      for (let i = 0; i < 3; i++) {
        if (aParts[i] > bParts[i]) return -1
        if (aParts[i] < bParts[i]) return 1
      }
      return 0
    })

    // The newest version is the first element in the sorted array
    return versions[0]
  }

  searchForConceptByFileExtensions(extensions = []) {
    const { extensionsMap } = this
    const hit = extensions.find(ext => extensionsMap.has(ext))
    return extensionsMap.get(hit)
  }

  get extensionsMap() {
    if (this.quickCache.extensionsMap) return this.quickCache.extensionsMap
    this.quickCache.extensionsMap = new Map()
    const extensionsMap = this.quickCache.extensionsMap
    this.concepts.forEach(concept => concept.extensions.split(" ").forEach(ext => extensionsMap.set(ext, concept.id)))

    return extensionsMap
  }
}

module.exports = { PLDBCli }

if (!module.parent) Utils.runCommand(new PLDBCli(), process.argv[2], process.argv[3])
