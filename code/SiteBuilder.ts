#!/usr/bin/env ts-node

const lodash = require("lodash")
const path = require("path")
const { jtree } = require("jtree")
const dayjs = require("dayjs")
const numeral = require("numeral")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { LanguagePageTemplate, FeaturePageTemplate } from "./pages"
import { PLDBBaseFolder } from "./PLDBBase"
import { ListRoutes } from "./routes"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const codeDir = __dirname
const rootDir = path.join(codeDir, "..")
const blogDir = path.join(rootDir, "blog")
const pagesDir = path.join(blogDir, "pages")
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
  lastCommitHashInFolder,
  runCommand
} from "./utils"

class SiteBuilder {
  buildAllCommand() {
    this.copyBlogFolderCommand()
    this.copyNpmAssetsCommand()
    this.buildSettingsFileCommand()
    this.buildAcknowledgementsPageCommand()
    this.buildPagesCommand()
    this.buildListsCommand()
    this.buildPostsCommand()
    this.buildHomepageCommand()
    this.buildCsvsCommand()
    this.buildJsonCommand()
    this.buildRedirectsCommand()
    this.buildSearchIndexCommand()
    this.buildDatabasePagesCommand()
    this._printBenchmarkResults()
  }

  _printBenchmarkResults() {
    const sorted = lodash.sortBy(benchmarkResults, "timeInSeconds").reverse()
    console.log(new TreeNode(sorted).toFormattedTable(60))
  }

  formatDatabaseCommand() {
    this._formatDatabase()
    this._printBenchmarkResults()
  }

  @benchmark
  copyNpmAssetsCommand() {
    // Copy node module assets
    Disk.mkdir(path.join(publishedRootFolder, "node_modules"))
    shell(
      `cp -R ${rootDir}/node_modules/monaco-editor ${publishedRootFolder}/node_modules/`
    )
    shell(
      `cp -R ${rootDir}/node_modules/jtree ${publishedRootFolder}/node_modules/`
    )
  }

  @benchmark
  copyBlogFolderCommand() {
    shell(
      `rm -rf ${publishedRootFolder}; cp -R ${blogDir} ${publishedRootFolder}`
    )
  }

  @benchmark
  buildSettingsFileCommand() {
    // todo: can we refactor scroll settings so we no longer need this?
    const lastHash = lastCommitHashInFolder()
    const builtOnYear = dayjs().format("YYYY")
    const builtOnDay = dayjs().format("MM/DD/YYYY")
    const tree = new TreeNode(Disk.read(settingsFilePath))

    tree.getNodeByColumns("replace", "LAST_HASH").setWord(2, lastHash)
    tree.getNodeByColumns("replace", "BUILT_IN_YEAR").setWord(2, builtOnYear)
    tree.getNodeByColumns("replace", "BUILT_ON_DAY").setWord(2, builtOnDay)

    Disk.write(
      path.join(publishedRootFolder, "settings.scroll"),
      tree.toString()
    )
  }

  @benchmark
  buildListsCommand() {
    const listRoutes = new ListRoutes()
    listGetters(listRoutes).forEach(getter => {
      Disk.write(
        path.join(publishedRootFolder, "lists", `${getter}.scroll`),
        listRoutes[getter]
      )
    })
    new ScrollFolder(publishedListsFolder).buildFiles()
  }

  @benchmark
  buildHomepageCommand() {
    new ScrollFolder(publishedRootFolder).buildFiles()
  }

  @benchmark
  buildPagesCommand() {
    new ScrollFolder(publishedPagesFolder).buildFiles()
  }

  @benchmark
  buildPostsCommand() {
    new ScrollFolder(publishedPostsFolder).buildFiles()
  }

  @benchmark
  buildRedirectsCommand() {
    Disk.read(path.join(blogDir, "redirects.txt"))
      .split("\n")
      .forEach(line => {
        const link = line.split(" ")
        const oldFile = path.join(publishedRootFolder, link[0])
        Disk.write(
          oldFile,
          `<meta http-equiv="Refresh" content="0; url='${link[1]}'" />`
        )
      })
  }

  @benchmark
  buildDatabasePagesCommand() {
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

  @benchmark
  buildAcknowledgementsPageCommand() {
    const { sources } = pldbBase
    const table =
      `list\n` +
      sources.map(s => ` - <a href="https://${s}">${s}</a>`).join("\n")

    const ackPath = path.join(pagesDir, "acknowledgements.scroll")
    const page = new TreeNode(Disk.read(ackPath))
    replaceNext(page, "comment autogenAcknowledgements", table)

    let writtenIn = [
      "javascript",
      "nodejs",
      "html",
      "css",
      "treenotation",
      "scroll",
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
      .map(
        file =>
          ` - <a href="BASE_URL/languages/${file.permalink}">${file.title}</a>`
      )
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

    try {
      const contributorsTable =
        `list\n` +
        JSON.parse(Disk.read(path.join(pagesDir, "contributors.json")))
          .filter(item => item.login !== "codelani" && item.login !== "breck7")
          .map(item => ` - <a href="${item.html_url}">${item.login}</a>`)
          .join("\n")
      replaceNext(page, "comment autogenContributors", contributorsTable)
    } catch (err) {}

    Disk.write(ackPath, page.toString())
  }

  @benchmark
  buildSearchIndexCommand() {
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

  @benchmark
  buildCsvsCommand() {
    const { colNamesForCsv, objectsForCsv, columnDocumentation } = pldbBase

    const pldbCsv = new TreeNode(objectsForCsv).toDelimited(",", colNamesForCsv)
    Disk.write(path.join(publishedRootFolder, "pldb.csv"), pldbCsv)

    const langsCsv = new TreeNode(
      objectsForCsv.filter(obj => isLanguage(obj.type))
    ).toDelimited(",", colNamesForCsv)
    Disk.write(path.join(publishedRootFolder, "languages.csv"), langsCsv)

    const columnsTree = new TreeNode(columnDocumentation)
    const columnColumns = [
      "Index",
      "Column",
      "Values",
      "Coverage",
      "Example",
      "Description",
      "Source",
      "SourceLink",
      "Definition",
      "DefinitionLink"
    ]

    Disk.write(
      path.join(publishedRootFolder, "columns.csv"),
      columnsTree.toDelimited(",", columnColumns)
    )

    const columnTable =
      `pipeTable\n ` +
      columnsTree.toDelimited("|", columnColumns).replace(/\n/g, "\n ")

    // todo: add linkify to scroll
    const page = new TreeNode(
      Disk.read(path.join(blogDir, "docs", "csv.scroll"))
        // todo use scroll vars
        .replace("LANG_COUNT", pldbBase.topLanguages.length)
        .replace("COL_COUNT", columnDocumentation.length)
        .replace("ENTITY_COUNT", pldbBase.length)
        .replace(
          "ENTITIES_FILE_SIZE_UNCOMPRESSED",
          numeral(pldbCsv.length).format("0.0b")
        )
        .replace(
          "LANGS_FILE_SIZE_UNCOMPRESSED",
          numeral(langsCsv.length).format("0.0b")
        )
    )
    replaceNext(page, "comment autogenColumnDocs", columnTable)
    Disk.write(path.join(publishedDocsFolder, "csv.scroll"), page.toString())

    new ScrollFolder(publishedDocsFolder).buildFiles()

    // todo: remove?
    // Copy grammar to docs folder for easy access in things like TN Designer.
    Disk.write(
      path.join(publishedDocsFolder, "pldb.grammar"),
      pldbBase.grammarCode
    )
  }

  @benchmark
  buildJsonCommand() {
    const str = JSON.stringify(pldbBase.typedMap, null, 2)
    Disk.write(path.join(publishedRootFolder, "pldb.json"), str)
    Disk.write(path.join(codeDir, "package", "pldb.json"), str)
  }

  @benchmark
  _formatDatabase() {
    pldbBase.forEach(file => file.prettifyAndSave())
  }
}

export { SiteBuilder }

if (!module.parent)
  runCommand(new SiteBuilder(), process.argv[2], process.argv[3])
