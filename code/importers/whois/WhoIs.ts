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
  _isRelevant(domain) {
    return domain.split(".").length <= 2
  }

  async fetchData(file) {
    if (file.get("domainName registered")) return 1
    const id = file.id
    const domain = this.getDomain(file)
    // todo: handle foreign domains
    if (!this._isRelevant(domain)) return 1
    const path = this.makePath(id)
    if (Disk.exists(path)) {
      const cached = Disk.readJson(path)
      const simple = !cached.domainName && Object.keys(cached).length < 3
      const multiple = !cached.length
      if (!simple && !multiple) {
        Disk.rm(path)
        throw new Error(path + " may have failed")
      }
      return cached
    }
    const results = await whois(domain, { follow: 10, verbose: true })
    console.log(`fetched ${domain}`)
    console.log(results)
    Disk.writeJson(path, results)
    return results
  }

  makePath(id) {
    return `${cacheDir}${id}.json`
  }

  getDomain(file) {
    return file.get("domainName")
  }

  extractDomain(file) {
    if (file.has("domainName")) return this
    const website = file.get("website")
    const uri = new URL(website)
    let webDomain = uri.hostname
    const path = uri.pathname
    const isDomainForTheLanguage = path.length < 2
    if (isDomainForTheLanguage) {
      webDomain = webDomain.replace(/^www\./, "")
      file.set(`domainName`, webDomain)
      file.save()
    }
  }

  writeData(file) {
    const { id } = file
    const domain = this.getDomain(file)
    if (!this._isRelevant(domain)) return 1
    const path = this.makePath(id)
    const results = Disk.readJson(path)
    let year = results.domainName
      ? results.creationDate || results.domainRegistered
      : results[0].data.creationDate
    year = year.match(/(198\d|199\d|200\d|201\d)/)[1]
    file.set("domainName registered", year)
    if (!file.has("appeared")) file.set("appeared", year)
    file.save()
  }

  async doAllCommand() {
    lodash
      .shuffle(pldbBase.filter(file => file.has("website")))
      .forEach(async file => {
        try {
          this.extractDomain(file)
          await this.fetchData(file)
          this.writeData(file)
        } catch (err) {
          console.log(`Error for ${file.get("website")}`)
          console.log(err)
        }
      })
  }
}

export { WhoIsImporter }

if (!module.parent) runCommand(new WhoIsImporter(), process.argv[2])
