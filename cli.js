#! /usr/bin/env node

const path = require("path")

const { TreeNode } = require("scrollsdk/products/TreeNode.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollSetCLI } = require("./ScrollSet.js")
const { ScrollFile, ScrollFileSystem } = require("scroll-cli")
const { execSync } = require("child_process")
const semver = require("semver")

const baseFolder = path.join(__dirname)
const ignoreFolder = path.join(baseFolder, "ignore")

class PLDBCli extends ScrollSetCLI {
  conceptsFolder = path.join(baseFolder, "concepts")
  parsersFile = "code/measures.parsers"
  scrollSetName = "pldb"
  compiledConcepts = "./pldb.json"

  get keywordsOneHotCsv() {
    if (!this.quickCache.keywordsOneHotCsv) this.quickCache.keywordsOneHotCsv = new TreeNode(this.keywordsOneHot).asCsv
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
    const importer = new GitHubImporter(this.concepts, this.conceptsFolder)
    await importer.fetchAllRepoDataCommand()
    await importer.writeAllRepoDataCommand()
  }

  async crawlRedditPLCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    const { RedditImporter } = require("../crawlers/reddit.com/Reddit.js")

    const importer = new RedditImporter(this.concepts, this.conceptsFolder)
    await importer.createFromAnnouncementsCommand()
  }

  async crawlGitsCommand(lang) {
    const { GitStats } = require("./code/gitStats.js")
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    this.concepts.forEach(async file => {
      if (lang && lang !== file.id) return
      if (lang) console.log(`processing ${lang}`)
      const { mainRepo } = file
      if (!mainRepo) return
      const targetFolder = path.join(this.gitsFolder, file.id)
      //if (Disk.exists(targetFolder)) return
      if (file.repoStats_files) return
      //if (file.isFinished) return
      try {
        const gitStats = new GitStats(mainRepo, targetFolder)
        if (!Disk.exists(targetFolder)) gitStats.clone()

        const tree = this.getTree(file)
        tree.touchNode("repoStats").setProperties(gitStats.summary)
        if (!tree.has("appeared")) tree.set("appeared", gitStats.firstCommit.toString())
        this.formatAndSave(file, tree)
      } catch (err) {
        console.error(err, file.id)
      }
    })
  }

  async formatCommand(lang) {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have crawlers project installed separateely.
    if (!lang) return
    const file = this.concepts.filter(file => lang === file.id)[0]
    if (file) this.formatAndSave(file)
  }

  async testCommand(lang) {
    if (!lang) return ""
    const file = new ScrollFile(undefined, path.join(this.conceptsFolder, lang + ".scroll"), new ScrollFileSystem())
    const errors = file.scrollProgram.getAllErrors().map(obj => obj.toObject())
    console.log(errors.length + " errors")
    if (errors.length) console.log(errors)
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
