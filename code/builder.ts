#!/usr/bin/env ts-node

const lodash = require("lodash")
const simpleGit = require("simple-git")
const fs = require("fs")
const path = require("path")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { CommandLineApp } = require("jtree/products/commandLineApp.node.js")
const { AbstractBuilder } = require("jtree/products/AbstractBuilder.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { LanguagePageTemplate, FeaturePageTemplate } from "./pages"
import { PLDBBaseFolder } from "./PLDBBase"
import { ListRoutes } from "./routes"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const codeDir = __dirname
const rootDir = path.join(codeDir, "..")
const blogDir = path.join(rootDir, "blog")
const websiteFolder = path.join(rootDir, "pldb.pub")
const databaseFolderWhenPublishedToWebsite = path.join(
  websiteFolder,
  "languages"
) // Todo: eventually redirect away from /languages?
const settingsFile = Disk.read(path.join(blogDir, "scroll.settings"))

import {
  replaceNext,
  isLanguage,
  benchmark,
  benchmarkResults,
  listGetters
} from "./utils"

class Builder extends AbstractBuilder {
  _cpAssets() {
    // Copy other assets into the root site folder
    const publicFolder = path.join(blogDir, "public")
    shell(`cp ${publicFolder}/*.* ${websiteFolder}`)

    // Copy grammar to public folder for easy access in things like TN Designer.
    Disk.mkdir(path.join(websiteFolder, "grammar"))
    Disk.write(
      path.join(websiteFolder, "grammar", "pldb.grammar"),
      pldbBase.grammarCode
    )

    // Copy Monaco assets
    Disk.mkdir(path.join(websiteFolder, "node_modules"))
    shell(
      `cp -R ${rootDir}/node_modules/monaco-editor ${websiteFolder}/node_modules/`
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
    shell(`cp -R ${blogDir}/lists ${websiteFolder}`)

    Disk.write(
      path.join(websiteFolder, "lists", "scroll.settings"),
      settingsFile
        .replace(/BASE_URL/g, "..")
        .replace(
          "GIT_PATH",
          "https://github.com/breck7/pldb/blob/main/blog/lists/"
        )
    )

    Disk.write(
      path.join(websiteFolder, "lists", "scrollExtensions.grammar"),
      this._scrollExtensionsFile
    )

    const listRoutes = new ListRoutes()
    listGetters(listRoutes).forEach(getter => {
      Disk.write(
        path.join(websiteFolder, "lists", `${getter}.scroll`),
        listRoutes[getter]
      )
    })

    const folder = new ScrollFolder(websiteFolder + "/lists")
    folder.buildSinglePages()
  }

  buildBlog() {
    Disk.mkdir(websiteFolder)
    this._cpAssets()

    // Copy posts dir into root site folder
    shell(`cp -R ${blogDir}/posts/* ${websiteFolder}`)

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
    Disk.read(path.join(blogDir, "redirects.txt"))
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
    return Disk.read(path.join(codeDir, `scrollExtensions.grammar`))
  }

  @benchmark
  buildAcknowledgementsPage() {
    const sources = Array.from(
      new Set(
        pldbBase.grammarCode
          .split("\n")
          .filter(line => line.includes("string sourceDomain"))
          .map(line => line.split("string sourceDomain")[1].trim())
      )
    )
    sources.sort()
    const table =
      `list\n` +
      sources.map(s => ` - <a href="https://${s}">${s}</a>`).join("\n")

    const ackPath = path.join(blogDir, "posts", "acknowledgements.scroll")
    const page = new TreeNode(Disk.read(ackPath))
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
      ...require("../package.json").dependencies,
      ...require("./importers/package.json").dependencies
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
        JSON.parse(Disk.read(path.join(rootDir, "ignore", "contributors.json")))
          .filter(item => item.login !== "codelani" && item.login !== "breck7")
          .map(item => ` - <a href="${item.html_url}">${item.login}</a>`)
          .join("\n")
      replaceNext(page, "comment autogenContributors", contributorsTable)
    } catch (err) {}

    Disk.write(ackPath, page.toString())
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
    const str = JSON.stringify(pldbBase.typedMap, null, 2)
    Disk.write(path.join(websiteFolder, "pldb.json"), str)
    Disk.write(path.join(codeDir, "package", "pldb.json"), str)
  }

  buildTypesFile() {
    Disk.write(path.join(codeDir, "types.ts"), pldbBase.typesFile)
  }

  formatDatabase() {
    pldbBase.forEach(file => {
      file.prettify()
      file.save()
    })
  }

  do() {
    pldbBase.forEach(file => {
      // file.delete("status")
      // file.save()
    })
  }

  async formatAndCheckChanged() {
    // git diff --name-only --cached
    const git = simpleGit(rootDir)
    const changed = await git.diff({ "--name-only": null, "--cached": null })
    changed
      .split("\n")
      .filter(file => file.endsWith(".pldb"))
      .forEach(path => {
        const file = pldbBase.getFile(path)
        file.prettify()
        file.save()
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
          path.join(
            rootDir,
            "ignore",
            "worksheets",
            `${file.id}.${file.fileExtension}`
          ),
          todos.join("\n\n")
        )
      })
  }
}

export { Builder }

if (!module.parent)
  new Builder().main(process.argv[2], process.argv[3], process.argv[4])
