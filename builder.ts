#!/usr/bin/env ts-node

const lodash = require("lodash")
const fs = require("fs")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { CommandLineApp } = require("jtree/products/commandLineApp.node.js")
const { AbstractBuilder } = require("jtree/products/AbstractBuilder.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { LanguagePageTemplate, FeaturePageTemplate } from "./code/pages"
import { PLDBBaseFolder } from "./code/PLDBBase"
import { ListRoutes } from "./code/routes"

const { TreeBaseServer } = require("jtree/products/treeBase.node.js")

const pldbBase = PLDBBaseFolder.getBase()
const websiteFolder = __dirname + "/pldb.pub"
const databaseFolderWhenPublishedToWebsite = websiteFolder + "/languages" // Todo: eventually redirect away from /languages?
const settingsFile = Disk.read(__dirname + "/blog/scroll.settings")

pldbBase.loadFolder()

import {
  replaceNext,
  isLanguage,
  benchmark,
  benchmarkResults,
  listGetters
} from "./code/utils"

class Builder extends AbstractBuilder {
  _cpAssets() {
    // Copy other assets into the root site folder
    shell(`cp ${__dirname}/blog/public/*.* ${websiteFolder}`)

    // Copy grammar to public folder for easy access in things like TN Designer.
    Disk.mkdir(websiteFolder + "/grammar/")
    Disk.write(
      websiteFolder + "/grammar/pldb.grammar",
      Disk.read(pldbBase.dir + "pldb.grammar")
    )
    Disk.mkdir(websiteFolder + "/node_modules/")
    shell(
      `cp -R ${__dirname}/node_modules/monaco-editor ${websiteFolder}/node_modules/`
    )
  }

  buildAll() {
    this.buildAcknowledgementsPage()
    this.buildBlog()
    this.buildCsvs()
    this.buildJson()
    this.buildSearchIndex()
    this.buildDatabasePages()
    console.log(benchmarkResults)
  }

  buildListsBlog() {
    shell(`cp -R ${__dirname}/blog/lists ${websiteFolder}`)

    Disk.write(
      websiteFolder + "/lists/scroll.settings",
      settingsFile
        .replace(/BASE_URL/g, "..")
        .replace(
          "GIT_PATH",
          "https://github.com/breck7/pldb/blob/main/blog/lists/"
        )
    )

    Disk.write(
      websiteFolder + "/lists/scrollExtensions.grammar",
      this._scrollExtensionsFile
    )

    const listRoutes = new ListRoutes()
    listGetters(listRoutes).forEach(getter => {
      Disk.write(`${websiteFolder}/lists/${getter}.scroll`, listRoutes[getter])
    })

    const folder = new ScrollFolder(websiteFolder + "/lists")
    folder.buildSinglePages()
  }

  buildBlog() {
    Disk.mkdir(websiteFolder)
    this._cpAssets()

    // Copy posts dir into root site folder
    shell(`cp -R ${__dirname}/blog/posts/* ${websiteFolder}`)

    Disk.write(
      websiteFolder + "/scroll.settings",
      settingsFile
        .replace(/BASE_URL/g, ".")
        .replace(
          "GIT_PATH",
          "https://github.com/breck7/pldb/blob/main/blog/posts/"
        )
    )

    Disk.write(
      websiteFolder + "/scrollExtensions.grammar",
      this._scrollExtensionsFile
    )

    this._cpAssets()

    const folder = new ScrollFolder(websiteFolder)
    folder.buildSinglePages()
    folder.buildIndexPage("full.html")
    folder.buildSnippetsPage("index.html")
    folder.buildCssFile()
    folder.buildRssFeed()

    this.buildListsBlog()
  }

  buildRedirects() {
    Disk.mkdir(websiteFolder + "/posts")
    Disk.read(__dirname + "/blog/redirects.txt")
      .split("\n")
      .forEach(line => {
        const link = line.split(" ")
        Disk.write(
          websiteFolder + "/" + link[0],
          `<meta http-equiv="Refresh" content="0; url='${link[1]}'" />`
        )
      })
  }

  @benchmark
  buildDatabasePages() {
    this.buildGrammar()
    Disk.mkdir(databaseFolderWhenPublishedToWebsite)

    pldbBase.forEach(file => {
      const path = `${databaseFolderWhenPublishedToWebsite}/${file.id}.scroll`

      const constructor =
        file.get("type") === "feature"
          ? FeaturePageTemplate
          : LanguagePageTemplate

      Disk.write(path, new constructor(file).toScroll())
    })

    Disk.write(
      databaseFolderWhenPublishedToWebsite + "/scroll.settings",
      settingsFile.replace(/BASE_URL/g, "..")
    )

    Disk.write(
      databaseFolderWhenPublishedToWebsite + "/scrollExtensions.grammar",
      this._scrollExtensionsFile
    )

    const folder = new ScrollFolder(databaseFolderWhenPublishedToWebsite)
    folder.buildSinglePages()
  }

  get _scrollExtensionsFile() {
    return Disk.read(__dirname + `/code/scrollExtensions.grammar`)
  }

  @benchmark
  buildAcknowledgementsPage() {
    const sources = Array.from(
      new Set(
        Disk.read(pldbBase.dir + "pldb.grammar")
          .split("\n")
          .filter(line => line.includes("string sourceDomain"))
          .map(line => line.split("string sourceDomain")[1].trim())
      )
    )
    sources.sort()
    const table =
      `list\n` +
      sources.map(s => ` - <a href="https://${s}">${s}</a>`).join("\n")

    const path = __dirname + "/blog/posts/acknowledgements.scroll"
    const page = new TreeNode(Disk.read(path))
    replaceNext(page, "comment autogenAcknowledgements", table)

    let writtenIn = [
      "javascript",
      "nodejs",
      "html",
      "css",
      "treenotation",
      "scrolldown",
      "grammar",
      "python",
      "bash",
      "markdown",
      "json",
      "typescript",
      "png-format",
      "svg",
      "gitignore"
    ].map(s => pldbBase.getFile(pldbBase.searchForEntity(s)))

    writtenIn = lodash.sortBy(writtenIn, "rank")

    const text = writtenIn
      .map(file => ` - <a href="languages/${file.id}.html">${file.title}</a>`)
      .join("\n")

    replaceNext(
      page,
      "comment autogenWrittenIn",
      `list
${text}`
    )

    const npmPackages = Object.keys({
      ...require("./package.json").dependencies,
      ...require("./code/importers/package.json").dependencies
    })

    npmPackages.sort()

    const packageTable =
      `list\n` +
      npmPackages
        .map(s => ` - <a href="https://www.npmjs.com/package/${s}">${s}</a>`)
        .join("\n")
    replaceNext(page, "comment autogenPackages", packageTable)

    // https://api.github.com/repos/breck7/pldb/contributors
    try {
      const contributorsTable =
        `list\n` +
        JSON.parse(Disk.read(__dirname + "/ignore/contributors.json"))
          .filter(item => item.login !== "codelani" && item.login !== "breck7")
          .map(item => ` - <a href="${item.html_url}">${item.login}</a>`)
          .join("\n")
      replaceNext(page, "comment autogenContributors", contributorsTable)
    } catch (err) {}

    Disk.write(path, page.toString())
  }

  @benchmark
  buildGrammar() {
    // Concatenate all files ending in ".grammar" in the "grammar" directory:
    const grammar =
      `tooling A function generates this grammar by combining all files in the grammar folder.\n` +
      fs
        .readdirSync(__dirname + "/database/grammar")
        .filter(file => file.endsWith(".grammar"))
        .map(file =>
          fs.readFileSync(__dirname + "/database/grammar/" + file, "utf8")
        )
        .join("\n")

    // Write the concatenated grammar
    Disk.write(pldbBase.grammarPath, grammar)

    // Format the file:
    new CommandLineApp().format(pldbBase.grammarPath)
  }

  @benchmark
  buildSearchIndex() {
    const objects = pldbBase.toObjectsForCsv().map(object => {
      return {
        label: object.title,
        appeared: object.appeared,
        id: object.id
      }
    })
    Disk.write(
      websiteFolder + "/searchIndex.json",
      JSON.stringify(objects, null, 2)
    )
  }

  @benchmark
  buildCsvs() {
    const objects = pldbBase.toObjectsForCsv()

    Disk.write(websiteFolder + "/pldb.csv", new TreeNode(objects).toCsv())
    Disk.write(
      websiteFolder + "/languages.csv",
      new TreeNode(objects.filter(obj => isLanguage(obj.type))).toCsv()
    )
  }

  buildJson() {
    const str = JSON.stringify(pldbBase.typedMapShort, null, 2)
    Disk.write(websiteFolder + "/pldb.json", str)
    Disk.write(__dirname + "/code/package/pldb.json", str)
  }

  buildTypesFile() {
    Disk.write(__dirname + "/code/types.ts", pldbBase.typesFile)
  }

  formatDatabase() {
    pldbBase.forEach(file => {
      file.prettify()
      file.save()
    })
  }

  serveFolder(port = 3030) {
    const express = require("express")
    const app = express()
    app.use(express.static(__dirname + "/pldb.pub"))
    app.listen(port)
  }

  startServer(port = 4444) {
    pldbBase.startListeningForFileChanges()
    new (<any>TreeBaseServer)(pldbBase).listen(port)
  }

  do() {
    pldbBase.forEach(file => {
      // file.delete("status")
      // file.save()
    })
  }

  generateWorksheets() {
    const { topFeatures } = pldbBase

    pldbBase.topLanguages
      .slice(0, 100)
      .filter(file => file.has("githubCopilotOptimized"))
      .forEach(file => {
        const lineCommentToken = file.lineCommentToken

        const todos = []
        topFeatures.forEach(feature => {
          const hit = file.getNode(`features ${feature.path}`)
          if (hit && hit.getContent() === "false") return
          if (hit && hit.length)
            todos.push(
              `${lineCommentToken} A short example of ${feature.feature}(${
                feature.path
              }) in ${file.title}:\n${hit.childrenToString()}`
            )
          else
            todos.push(
              `${lineCommentToken} A short example of ${feature.feature}(${feature.path}) in ${file.title}:`
            )
        })

        Disk.write(
          __dirname + `/ignore/worksheets/${file.id}.${file.fileExtension}`,
          todos.join("\n\n")
        )
      })
  }
}

export { Builder }

if (!module.parent)
  new Builder().main(process.argv[2], process.argv[3], process.argv[4])
