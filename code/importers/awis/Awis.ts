import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, PoliteCrawler } from "../../utils"

import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")
const path = require("path")
const awis = require("awis")

const cacheDir = path.join(__dirname, "cache")
const pldbBase = PLDBBaseFolder.getBase().loadFolder()
Disk.mkdir(cacheDir)

const creds = JSON.parse(
  Disk.read(path.join(__dirname, "ignore", "creds.json"))
)

const client = awis(creds)

class AwisFile {
  constructor(file: PLDBFile) {
    this.file = file
  }

  write() {
    if (!this.exists) return
    const { file, domainName } = this
    const awis = this.read
    const alexaDomain = awis.contentData.dataUrl
    if (alexaDomain !== domainName) return false

    const year = "2022"
    const rank = awis.trafficData.rank
    if (rank) {
      file.set(`domainName awisRank ${year}`, rank.toString())
      file.save()
    }
  }

  file: PLDBFile

  get path() {
    return path.join(cacheDir, this.file.id + ".json")
  }

  get read() {
    return JSON.parse(Disk.read(this.path))
  }

  get exists() {
    return Disk.exists(this.path)
  }

  get domainName() {
    return this.file.get("domainName")
  }

  async download() {
    if (!this.domainName || this.exists) return

    try {
      return await this.fetch()
    } catch (err) {
      console.error(err)
    }
  }

  async fetch() {
    const { domainName, path } = this
    console.log(`Fetching ${domainName}`)

    return new Promise((resolve, reject) => {
      client(
        {
          Action: "UrlInfo",
          Url: domainName,
          ResponseGroup:
            "Related,TrafficData,ContentData,LinksInCount,RankByCountry"
        },
        function(err, data) {
          //console.log(data)
          if (err) {
            console.error(err)
            return reject(err)
          }

          Disk.write(path, JSON.stringify(data, null, 2))
          resolve(domainName)
        }
      )
    })
  }
}

class AwisImporter {
  writeAllCommand() {
    pldbBase.forEach(file => new AwisFile(file).write())
  }

  async downloadAllCommand() {
    await Promise.all(pldbBase.map(file => new AwisFile(file).download()))
  }
}

export { AwisImporter }

if (!module.parent) runCommand(new AwisImporter(), process.argv[2])
