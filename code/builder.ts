#!/usr/bin/env ts-node

const lodash = require("lodash")
const simpleGit = require("simple-git")
const path = require("path")
const { jtree } = require("jtree")
const dayjs = require("dayjs")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
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
const settingsFilePath = path.join(blogDir, "settings.scroll")
const publishedRootFolder = path.join(rootDir, "pldb.local")
const publishedDocsFolder = path.join(publishedRootFolder, "docs")
const publishedPagesFolder = path.join(publishedRootFolder, "pages")
const publishedListsFolder = path.join(publishedRootFolder, "lists")
const publishedPostsFolder = path.join(publishedRootFolder, "posts")
const publishedLanguagesFolder = path.join(publishedRootFolder, "languages") // Todo: eventually redirect away from /languages?

import {
  replaceNext,
  isLanguage,
  benchmark,
  benchmarkResults,
  listGetters,
  cleanAndRightShift,
  lastCommitHashInFolder
} from "./utils"

class Builder extends AbstractBuilder {
  copyNpmAssets() {
    // Copy node module assets
    Disk.mkdir(path.join(publishedRootFolder, "node_modules"))
    shell(
      `cp -R ${rootDir}/node_modules/monaco-editor ${publishedRootFolder}/node_modules/`
    )
    shell(
      `cp -R ${rootDir}/node_modules/jtree ${publishedRootFolder}/node_modules/`
    )
  }

  buildAll() {
    shell(`cp -R ${blogDir} ${publishedRootFolder}`)
    this.copyNpmAssets()
    this.buildSettingsFile()
    this.buildAcknowledgementsPage()
    this.buildPages()
    this.buildLists()
    this.buildPosts()
    this.buildHomepage()
    this.buildCsvs()
    this.buildJson()
    this.buildSearchIndex()
    this.buildDatabasePages()
    this.buildDocs()
    console.log(benchmarkResults)
  }

  buildSettingsFile() {
    // todo: can we refactor scroll settings so we no longer need this?
    const lastHash = lastCommitHashInFolder()
    const builtOn = dayjs().format("YYYY")
    const tree = new TreeNode(Disk.read(settingsFilePath))

    tree.getNodeByColumns("replace", "LAST_HASH").setWord(2, lastHash)
    tree.getNodeByColumns("replace", "BUILT_ON").setWord(2, builtOn)

    Disk.write(
      path.join(publishedRootFolder, "settings.scroll"),
      tree.toString()
    )
  }

  buildLists() {
    const listRoutes = new ListRoutes()
    listGetters(listRoutes).forEach(getter => {
      Disk.write(
        path.join(publishedRootFolder, "lists", `${getter}.scroll`),
        listRoutes[getter]
      )
    })
    new ScrollFolder(publishedListsFolder).buildFiles()
  }

  buildHomepage() {
    new ScrollFolder(publishedRootFolder).buildFiles()
  }

  buildPages() {
    new ScrollFolder(publishedPagesFolder).buildFiles()
  }

  buildPosts() {
    new ScrollFolder(publishedPostsFolder).buildFiles()
  }

  buildRedirects() {
    return "" // todo: update
    Disk.read(path.join(blogDir, "redirects.txt"))
      .split("\n")
      .forEach(line => {
        const link = line.split(" ")
        Disk.write(
          publishedRootFolder + "/" + link[0],
          `<meta http-equiv="Refresh" content="0; url='${link[1]}'" />`
        )
      })
  }

  buildDatabasePages() {
    pldbBase.forEach(file => {
      const filePath = path.join(publishedLanguagesFolder, `${file.id}.scroll`)

      const constructor =
        file.get("type") === "feature"
          ? FeaturePageTemplate
          : LanguagePageTemplate

      Disk.write(filePath, new constructor(file).toScroll())
    })

    new ScrollFolder(publishedLanguagesFolder).buildFiles()
  }

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

    const ackPath = path.join(blogDir, "pages", "acknowledgements.scroll")
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
      .map(file => ` - <a href="languages/${file.permalink}">${file.title}</a>`)
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

  buildSearchIndex() {
    const objects = pldbBase.objectsForCsv.map(object => {
      return {
        label: object.title,
        appeared: object.appeared,
        id: object.pldbId
      }
    })
    Disk.write(
      path.join(publishedRootFolder, "searchIndex.json"),
      JSON.stringify(objects, null, 2)
    )
  }

  buildCsvs() {
    const { colNamesForCsv, objectsForCsv } = pldbBase

    Disk.write(
      path.join(publishedRootFolder, "pldb.csv"),
      new TreeNode(objectsForCsv).toDelimited(",", colNamesForCsv)
    )
    Disk.write(
      path.join(publishedRootFolder, "languages.csv"),
      new TreeNode(
        objectsForCsv.filter(obj => isLanguage(obj.type))
      ).toDelimited(",", colNamesForCsv)
    )
  }

  buildDocs() {
    const { columnDocumentation } = pldbBase

    const langCount = pldbBase.topLanguages.length
    const colCount = columnDocumentation.length
    const entityCount = pldbBase.length

    const columnTable =
      `pipeTable\n ` +
      new TreeNode(columnDocumentation)
        .toDelimited("|", [
          "Index",
          "Column",
          "Values",
          "Coverage",
          "Example",
          "Description",
          "Source",
          "SourceLink"
        ])
        .replace(/\n/g, "\n ")

    // todo: add linkify to scrolldown
    const page = new TreeNode(
      Disk.read(path.join(blogDir, "docs", "columns.scroll"))
        .replace("LANG_COUNT", langCount)
        .replace("COL_COUNT", colCount)
        .replace("ENTITY_COUNT", entityCount)
    )
    replaceNext(page, "comment autogenColumnDocs", columnTable)
    Disk.write(
      path.join(publishedDocsFolder, "columns.scroll"),
      page.toString()
    )

    new ScrollFolder(publishedDocsFolder).buildFiles()

    // Copy grammar to docs folder for easy access in things like TN Designer.
    Disk.write(
      path.join(publishedDocsFolder, "pldb.grammar"),
      pldbBase.grammarCode
    )
  }

  buildJson() {
    const str = JSON.stringify(pldbBase.typedMap, null, 2)
    Disk.write(path.join(publishedRootFolder, "pldb.json"), str)
    Disk.write(path.join(codeDir, "package", "pldb.json"), str)
  }

  buildTypesFile() {
    // todo: update/remove?
    Disk.write(path.join(codeDir, "types.ts"), pldbBase.typesFile)
  }

  formatDatabase() {
    pldbBase.forEach(file => {
      file.prettify()
      file.save()
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
