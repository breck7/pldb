#!/usr/bin/env node

const cheerio = require("cheerio")

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, getLinks } from "../../utils"

import { jtree } from "jtree"

const lodash = require("lodash")

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")
Disk.mkdir(cacheDir)

class Website {
  constructor(file) {
    this.file = file
  }

  file: PLDBFile

  async update() {
    const { file } = this
    if (!file.has("website")) return this
    await this.download()

    this.extractTwitter()
    this.extractGitHub()
    //this.extractTitle()
    //this.extractText()
    file.save()
  }

  get path() {
    return cacheDir + this.file.id + ".html"
  }

  async download() {
    const { path } = this
    if (Disk.exists(path)) return this
    console.log("downloading to " + path)
    await Disk.downloadPlain(this.file.get("website"), path)
  }

  get content() {
    return Disk.read(this.path)
  }

  extractGitHub() {
    const { file } = this
    if (file.has("githubRepo")) return this

    let potentialHits = getLinks(this.content.toLowerCase()).filter(link => {
      link = link.trim()
      const path = new URL(link).pathname.split("/")
      return link.includes("https://github.com") && path.length === 3
    })
    //todo: improve
    potentialHits = lodash.uniq(potentialHits)
    if (potentialHits.length === 1)
      file.set(`githubRepo`, potentialHits[0].trim())
    return this
  }

  extractTitle() {
    const { file, content } = this
    const cheer = cheerio.load(content)
    let title = ""
    cheer("title").each((i, elem) => {
      file.set("website title", cheer(elem).text())
    })
    return this
  }

  extractText() {
    // todo
  }

  extractTwitter() {
    const { file } = this
    if (file.has("twitter")) return
    const str = this.content.toLowerCase()
    const { id } = file
    if (str.includes("twitter")) {
      const matches = str.match(/twitter\.com\/([^"\/ \?\']+)/g)

      if (matches) {
        matches
          .map(m => m.replace("twitter.com/", ""))
          .forEach(m => {
            if (
              m === id ||
              m.includes(id) ||
              id.includes(m) ||
              file.toString().includes(m)
            ) {
              file.set("twitter", m)
            }
          })
      }
      let out = ""
      if (matches) out = matches.join(" ")
      console.log(`${id} ${out}`)
    }
    return this
  }
}

class WebsiteImporter {
  async updateAllCommand() {
    lodash
      .shuffle(pldbBase.filter(file => file.has("website")))
      .forEach(async file => {
        try {
          await new Website(file).update()
        } catch (err) {
          console.log(`Error with ${file.id}`)
        }
      })
  }
}

export { WebsiteImporter }

if (!module.parent)
  runCommand(new WebsiteImporter(), process.argv[2], process.argv[3])
