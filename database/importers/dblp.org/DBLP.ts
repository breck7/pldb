#!/usr/bin/env ts-node

import { runCommand, PoliteCrawler } from "../../utils"
import { PLDBBaseFolder, PLDBFile } from "../../PLDBBase"
const lodash = require("lodash")
import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

const cachePath = __dirname + "/cache/"
Disk.mkdir(cachePath)

class DBLPFile {
  file: PLDBFile
  constructor(file: PLDBFile) {
    this.file = file
  }

  get query() {
    const { title } = this.file
    return `$${title}$`
  }

  async fetch() {
    const { file } = this
    const path = this.cachePath
    if (Disk.exists(path)) return this
    const url = `https://dblp.org/search/publ/api?format=json&h=1000&c=0&q=${this.query}`
    console.log(url)
    await Disk.downloadJson(url, path)
    // todo: download more than 1K?
  }

  write() {
    const { file } = this
    const path = this.cachePath
    if (!Disk.exists(path)) return
    if (file.has("dblp")) return

    const parsed = Disk.readJson(path)
    const regex = new RegExp(`\\b${file.title.toLowerCase()}\\b`)

    const table = parsed.result.hits.hit
      .filter(hit => {
        const { title } = hit.info
        const passes = title.toLowerCase().match(regex)
        console.log(title.toLowerCase(), regex)
        return passes
      })
      .map(hit => {
        const { title, year, doi, url } = hit.info
        return { title, year, doi, url }
      })

    file.set("dblp", `https://dblp.org/search?q=${this.query}`)
    file.set("dblp hits", table.length.toString())
    file
      .getNode("dblp")
      .appendLineAndChildren(
        "publications",
        new jtree.TreeNode(table.slice(0, 10)).toDelimited("|")
      )
    file.save()
  }

  get cachePath() {
    return cachePath + this.file.primaryKey + ".json"
  }

  get parsed() {
    return Disk.readJson(this.cachePath).result
  }
}

class DBLPImporter {
  writeToDatabaseCommand() {
    this.matches.forEach(file => {
      try {
        file.write()
      } catch (err) {
        console.error(err)
      }
    })
  }

  get matches() {
    const files = pldbBase.filter(file => file.isLanguage)

    const sorted = lodash.sortBy(files, file => file.rank)

    sorted.reverse()
    return sorted.map(file => new DBLPFile(file)) // todo: do features as well
  }

  async fetchAllCommand() {
    console.log(`Fetching all...`)
    const crawler = new PoliteCrawler()
    crawler.randomize = false
    crawler.maxConcurrent = 2
    await crawler.fetchAll(this.matches)
  }
}

export { DBLPImporter }

if (!module.parent) runCommand(new DBLPImporter(), process.argv[2])
