#! /usr/bin/env node

const path = require("path")
const numeral = require("numeral")
const lodash = require("lodash")
const dayjs = require("dayjs")

const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { shiftRight, removeReturnChars } = Utils
const { Disk } = require("jtree/products/Disk.node.js")

const baseFolder = path.join(__dirname)
const ignoreFolder = path.join(baseFolder, "ignore")
const pagesDir = path.join(baseFolder, "pages")
const listsFolder = path.join(baseFolder, "lists")

const conceptsFolderName = "/concepts/"

class PLDBCli {
  get keywordsOneHotCsv() {
    if (!this.quickCache.keywordsOneHotCsv) this.quickCache.keywordsOneHotCsv = new TreeNode(this.keywordsOneHot).asCsv
    return this.quickCache.keywordsOneHotCsv
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

  // addRedirects(app) {
  //   // /languages => /truebase redirect
  //   app.get("/languages/:id", (req, res, next) => res.status(302).redirect(`/concepts/${req.params.id}`))

  //   const redirects = Disk.read(path.join(siteFolder, "redirects.txt"))
  //     .split("\n")
  //     .map(line => {
  //       const [oldUrl, newUrl] = line.split(" ")
  //       return {
  //         oldUrl,
  //         newUrl
  //       }
  //     })
  //   redirects.forEach(redirect =>
  //     app.get(`/${redirect.oldUrl}`, (req, res) => res.status(301).redirect(redirect.newUrl))
  //   )
  // }

  async crawlGitHubCommand() {
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have truecrawler project installed separateely.
    const { GitHubImporter } = require("../truecrawler/github.com/GitHub.js")
    const importer = new GitHubImporter(this.folder)
    await importer.fetchAllRepoDataCommand()
    await importer.writeAllRepoDataCommand()
  }

  async crawlGitsCommand() {
    const { GitStats } = require("./code/gitStats.js")
    // Todo: figuring out best repo orgnization for crawlers.
    // Note: this currently assumes you have truecrawler project installed separateely.
    const gitsFolder = path.join(ignoreFolder, "gits")
    this.folder.topLanguages.forEach(async file => {
      const repo = file.repo
      if (!repo) return
      if (file.has("repoStats")) return
      if (file.get("isDone") === "true") return
      const baseFolder = path.join(gitsFolder, file.id)
      try {
        const stats = new GitStats(repo, baseFolder)
        if (!Disk.exists(baseFolder)) stats.clone()
        file.appendLineAndChildren("repoStats", stats.summary)
        file.prettifyAndSave()
      } catch (err) {
        console.error(err, file.id)
      }
    })
  }
}

module.exports = { PLDBCli }

if (!module.parent) Utils.runCommand(new PLDBCli(), process.argv[2], process.argv[3])
