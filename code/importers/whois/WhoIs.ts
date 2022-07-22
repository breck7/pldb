#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const whois = require("whois-json")
const lodash = require("lodash")

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")
Disk.mkdir(cacheDir)

class WhoIsImporter {
  extractDomain(file) {
    if (file.domainName) return this
    const website = file.get("website")
    const uri = new URL(website)
    let webDomain = uri.hostname
    const path = uri.pathname
    // todo: handle foreign domains
    const isDomainForTheLanguage = path.length < 2
    if (isDomainForTheLanguage) {
      webDomain = webDomain.replace(/^www\./, "")
      file.set(`domainName`, webDomain)
      file.save()
    }
  }

  makePath(id) {
    return `${cacheDir}${id}.json`
  }

  async fetchData(file) {
    if (file.get("domainName registered")) return 1
    const { id, domainName } = file

    const path = this.makePath(id)
    if (Disk.exists(path)) return 1

    const results = await whois(domainName, { follow: 10, verbose: true })
    console.log(`fetched ${domainName}`)
    Disk.writeJson(path, results)
  }

  writeData(file) {
    const { id, domainName } = file
    const path = this.makePath(id)
    if (!Disk.exists(path)) return 1
    const results = Disk.readJson(path)
    let year = results.domainName
      ? results.creationDate || results.domainRegistered
      : results[0].data.creationDate

    year = year.match(/(198\d|199\d|200\d|201\d|202\d)/)[1]
    file.set("domainName registered", year)
    if (!file.has("appeared")) file.set("appeared", year)
    file.save()
  }

  async updateOne(file) {
    try {
      this.extractDomain(file)
      if (!file.domainName) return
      await this.fetchData(file)
      this.writeData(file)
    } catch (err) {
      console.log(`Error for ${file.domainName}`)
      console.log(err)
    }
  }

  async updateOneCommand(id) {
    this.updateOne(pldbBase.getFile(id))
  }

  async updateAllCommand() {
    lodash
      .shuffle(pldbBase.filter(file => file.has("website")))
      .forEach(async file => this.updateOne(file))
  }
}

export { WhoIsImporter }

if (!module.parent)
  runCommand(new WhoIsImporter(), process.argv[2], process.argv[3])
