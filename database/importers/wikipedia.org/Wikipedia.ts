const { Disk } = require("jtree/products/Disk.node.js")

const wiki = require("wikijs").default
const pageviews = require("pageviews")

const JSDOM = require("jsdom").JSDOM
const jquery = require("jquery")(new JSDOM(`<!DOCTYPE html>`).window)

const yearRegex = /(released|started|began|published|designed|announced|developed|funded|created|introduced|produced) in ([12][890]\d\d)\D/gi
const yearRegexRelaxed = /\D(200\d|201\d|199\d|198\d|197\d|196\d|195\d)\D/g
const withContext = /(\D{3,18}[12][890]\d\d\D{1,18})/gi

import { Importer } from "../Importer"

class WikipediaImporter extends Importer {
  get sourceId() {
    return this.file.wikipediaTitle
  }

  async fetch() {
    if (this.isDownloaded) return 1
    const { pldbId, sourceId } = this
    if (!sourceId) return 0
    console.log(`downloading page: '${sourceId}'`)
    let page
    try {
      page = await wiki().page(sourceId)
    } catch (err) {
      console.error(`Failed download for ${pldbId} '${sourceId}'`)
      console.error(err)
      const other = decodeURIComponent(sourceId)
      try {
        console.log(`Trying decodeURIComponent: ${other}`)
        page = await wiki().page(other)
      } catch (err2) {
        return {
          secondQuery: other,
          err: err,
          err2: err2,
          status: 0
        }
      }
    }

    const output: any = {}
    output.date = Date.now()
    output.raw = page.raw
    output.status = 1
    output.content = await page.content()
    output.html = await page.html()
    output.summary = await page.summary()
    output.rawInfo = await page.rawInfo()
    output.info = await page.info()
    output.images = await page.images()
    output.links = await page.links()
    output.backlinks = await page.backlinks()
    try {
      output.references = await page.references()
    } catch (err) {
      console.error(`Failed references for ${pldbId} ${sourceId}`)
    }
    //info = await article.getInfo(page)
    console.log(`Finished ${pldbId}`)

    Disk.write(this.cachePath, JSON.stringify(output, null, 2))
  }

  get object() {
    return JSON.parse(Disk.read(this.cachePath))
  }

  guidKey = "wikipedia"
  sourceDomain = "wikipedia.org"

  updatePldb() {
    const { pldbId } = this
    try {
      if (!Disk.exists(this.cachePath)) {
        console.log(`Wikipedia file for "${pldbId}" not yet downloaded.`)
        return 1
      }
      console.log("extracting wikipedia for " + pldbId)
      const { object } = this

      // this.getYear(object)
      // this.extractProperty(object, "license")
      // this.extractProperty(object, "status")
      // this.getCount(object, "references")
      // this.getCount(object, "backlinks")
      // this.getWebsite(object, "website", url =>
      //   url === "url" ? undefined : url.replace(/(\[|\])/g, "")
      // )
      // this.getPageId(object)
      // this.getDescription(object)
    } catch (err) {
      console.error(pldbId, err)
    }
  }
}

export { WikipediaImporter }
