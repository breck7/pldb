#!/usr/bin/env ts-node

const lodash = require("lodash")
const moment = require("moment")
const numeral = require("numeral")
const fs = require("fs")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { CommandLineApp } = require("jtree/products/commandLineApp.node.js")
const { AbstractBuilder } = require("jtree/products/AbstractBuilder.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { LanguagePageTemplate, PatternPageTemplate } from "./database/pages"
import { CodeLaniBaseFolder } from "./database/CodeLaniBase"

const thingsFolder = __dirname + "/database/things/"
const codeLaniBase = new (<any>CodeLaniBaseFolder)(
  undefined,
  thingsFolder
) as CodeLaniBaseFolder
const websiteFolder = __dirname + "/codelani.com"
const databaseFolderWhenPublishedToWebsite = websiteFolder + "/languages" // Todo: eventually redirect away from /languages?
const settingsFile = Disk.read(__dirname + "/blog/scroll.settings")

import { nameToAnchor, replaceNext, toScrollTable } from "./database/utils"

class Builder extends AbstractBuilder {
  _cpAssets() {
    // Copy other assets into the root site folder
    shell(`cp ${__dirname}/blog/public/*.* ${websiteFolder}`)

    // Copy grammar to public folder
    Disk.write(
      websiteFolder + "/datasets/codelani.grammar",
      Disk.read(thingsFolder + "codelani.grammar")
    )
  }

  buildAll() {
    this.buildCreatorsPage()
    this.buildCorporationsPage()
    this.buildPatternsPage()
    this.buildLanguagesPage()
    this.buildFileExtensionsPage()
    this.buildAcknowledgementsPage()
    this.buildTopPages()
    this.buildBlog()
    this.buildCsv()
    this.buildDatabasePages()
  }

  _buildTopPages(num) {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + `/blog/lists/top${num}.scroll`
    const page = new TreeNode(Disk.read(pagePath))

    let files = codeLaniBase
      .filter((lang) => lang.isLanguage)
      .map((file) => {
        const name = file.primaryKey
        const appeared = file.get("appeared")
        const rank = file.languageRank + 1
        const type = file.get("type")
        return {
          name,
          nameLink: `../languages/${name}.html`,
          rank,
          type,
          appeared,
        }
      })

    files = lodash.sortBy(files, "rank").slice(0, num)

    replaceNext(
      page,
      `comment autogenTop`,
      toScrollTable(new TreeNode(files), [
        "name",
        "nameLink",
        "appeared",
        "type",
        "rank",
      ])
    )

    Disk.write(pagePath, page.toString())
  }

  buildTopPages() {
    this._buildTopPages(100)
    this._buildTopPages(250)
  }

  buildFileExtensionsPage() {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/extensions.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = codeLaniBase
      .filter((file) => file.get("type") !== "pattern")
      .map((file) => {
        const name = file.primaryKey
        return {
          name,
          nameLink: `../languages/${name}.html`,
          extensions: file.extensions,
        }
      })
      .filter((file) => file.extensions)

    replaceNext(
      page,
      "comment autogenExtensions",
      toScrollTable(new TreeNode(files), ["name", "nameLink", "extensions"])
    )

    const text = page
      .toString()
      .replace(
        /list of \.+ file extensions/,
        `list of ${numeral(files.length).format("0,0")} file extensions`
      )

    Disk.write(pagePath, text)
  }

  buildLanguagesPage() {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/languages.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = codeLaniBase
      .filter((file) => file.get("type") !== "pattern")
      .map((file) => {
        const name = file.primaryKey
        const appeared = file.get("appeared") || ""
        const type = file.get("type")
        return {
          name,
          nameLink: `../languages/${name}.html`,
          type,
          appeared,
        }
      })

    replaceNext(
      page,
      "comment autogenLanguages",
      toScrollTable(new TreeNode(files), [
        "name",
        "nameLink",
        "type",
        "appeared",
      ])
    )

    const text = page
      .toString()
      .replace(
        /list of the \.+ computer/,
        `list of the ${numeral(files.length).format("0,0")} computer`
      )

    Disk.write(pagePath, text)
  }

  buildPatternsPage() {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/patterns.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = codeLaniBase
      .filter((lang) => lang.get("type") === "pattern")
      .map((file) => {
        const name = file.primaryKey
        return {
          pattern: file.get("title"),
          patternLink: `../languages/${name}.html`,
          aka: file.get("aka"),
          psuedoExample: (file.get("psuedoExample") || "")
            .replace(/\</g, "&lt;")
            .replace(/\|/g, "&#124;"),
        }
      })

    replaceNext(
      page,
      "comment autogenPatterns",
      toScrollTable(new TreeNode(files), [
        "pattern",
        "patternLink",
        "aka",
        "psuedoExample",
      ])
    )

    const text = page
      .toString()
      .replace(
        /A list of \.+ patterns/,
        `A list of ${numeral(files.length).format("0,0")} patterns`
      )

    Disk.write(pagePath, text)
  }

  buildCreatorsPage() {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/creators.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const entities = {}
    codeLaniBase.forEach((file) => {
      const languageId = file.primaryKey
      if (file.has("creators"))
        file
          .get("creators")
          .split(" and ")
          .forEach((entity) => {
            if (!entities[entity]) entities[entity] = []
            entities[entity].push(languageId)
          })
    })

    const wikipediaLinks = new TreeNode(
      page
        .find((node) => node.getLine().startsWith("comment WikipediaPages"))
        .childrenToString()
    )

    const rows = Object.keys(entities).map((name) => {
      const languages = entities[name]
        .map((lang) => `<a href='../languages/${lang}.html'>${lang}</a>`)
        .join(" ")
      const count = entities[name].length

      const person = wikipediaLinks.nodesThatStartWith(name)[0]
      const anchorTag = nameToAnchor(name)
      const wrappedName = !person
        ? `<a name='${anchorTag}' />${name}`
        : `<a name='${anchorTag}' href='https://en.wikipedia.org/wiki/${person.get(
            "wikipedia"
          )}'>${name}</a>`

      return { name: wrappedName, languages, count }
    })

    const sorted = lodash.sortBy(rows, "count")
    sorted.reverse()

    const theTable = toScrollTable(new TreeNode(sorted), [
      "name",
      "languages",
      "count",
    ])

    replaceNext(page, "comment autogenCreators", theTable)

    const newCount = numeral(Object.values(entities).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of \.+ people/, `list of ${newCount} people`)

    Disk.write(pagePath, text)
  }

  buildCorporationsPage() {
    codeLaniBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/corporations.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const entities = {}
    codeLaniBase.forEach((file) => {
      const languageId = file.primaryKey
      if (file.has("corporateDevelopers"))
        file
          .get("corporateDevelopers")
          .split(" and ")
          .forEach((entity) => {
            if (!entities[entity]) entities[entity] = []
            entities[entity].push(languageId)
          })
    })

    const rows = Object.keys(entities).map((name) => {
      const languages = entities[name]
        .map((lang) => `<a href='../languages/${lang}.html'>${lang}</a>`)
        .join(" ")
      const count = entities[name].length

      const wrappedName = `<a name='${nameToAnchor(name)}' />${name}`

      return { name: wrappedName, languages, count }
    })
    const sorted = lodash.sortBy(rows, "count")
    sorted.reverse()

    const theTable = toScrollTable(new TreeNode(sorted), [
      "name",
      "languages",
      "count",
    ])

    replaceNext(page, "comment autogenCorporations", theTable)

    const newCount = numeral(Object.values(entities).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of \.+ corporations/, `list of ${newCount} corporations`)

    Disk.write(pagePath, text)
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
          "https://github.com/codelani/codelani/blob/main/blog/posts/"
        )
    )

    Disk.write(
      websiteFolder + "/scrollExtensions.grammar",
      Disk.read(__dirname + `/database/scrollExtensions.grammar`)
    )

    this._cpAssets()

    const folder = new ScrollFolder(websiteFolder)
    folder.buildSinglePages()
    folder.buildIndexPage("full.html")
    folder.buildSnippetsPage("index.html")
    folder.buildCssFile()

    this._buildListsSite()
  }

  // Build all the list pages
  _buildListsSite() {
    shell(`cp -R ${__dirname}/blog/lists ${websiteFolder}`)

    Disk.write(
      websiteFolder + "/lists/scroll.settings",
      settingsFile
        .replace(/BASE_URL/g, "..")
        .replace(
          "GIT_PATH",
          "https://github.com/codelani/codelani/blob/main/blog/lists/"
        )
    )

    Disk.write(
      websiteFolder + "/lists/scrollExtensions.grammar",
      Disk.read(__dirname + `/database/scrollExtensions.grammar`)
    )

    const folder = new ScrollFolder(websiteFolder + "/lists")
    folder.buildSinglePages()
  }

  buildDatabasePages() {
    this.buildGrammar()
    Disk.mkdir(databaseFolderWhenPublishedToWebsite)

    codeLaniBase.loadFolder()
    codeLaniBase.forEach((file) => {
      const path = `${databaseFolderWhenPublishedToWebsite}/${file.primaryKey}.scroll`

      const constructor =
        file.get("type") === "pattern"
          ? PatternPageTemplate
          : LanguagePageTemplate

      Disk.write(path, new constructor(file).toScroll())
    })

    Disk.write(
      databaseFolderWhenPublishedToWebsite + "/scroll.settings",
      settingsFile.replace(/BASE_URL/g, "..")
    )

    Disk.write(
      databaseFolderWhenPublishedToWebsite + "/scrollExtensions.grammar",
      Disk.read(__dirname + `/database/scrollExtensions.grammar`)
    )

    const folder = new ScrollFolder(databaseFolderWhenPublishedToWebsite)
    folder.buildSinglePages()
  }

  buildAcknowledgementsPage() {
    const sources = Array.from(
      new Set(
        Disk.read(thingsFolder + "codelani.grammar")
          .split("\n")
          .filter((line) => line.includes("string sourceDomain"))
          .map((line) => line.split("string sourceDomain")[1].trim())
      )
    )
    sources.sort()
    const table =
      `list\n` +
      sources.map((s) => ` - <a href="https://${s}">${s}</a>`).join("\n")

    const path = __dirname + "/blog/posts/acknowledgements.scroll"
    const tree = new TreeNode(Disk.read(path))
    replaceNext(tree, "comment autogenAcknowledgements", table)

    Disk.write(path, tree.toString())
  }

  buildGrammar() {
    const outputFilePath = thingsFolder + "codelani.grammar"

    // Concatenate all files ending in ".grammar" in the "grammar" directory:
    const grammar =
      `tooling A function generates this grammar by combining all files in the grammar folder.\n` +
      fs
        .readdirSync(__dirname + "/database/grammar")
        .filter((file) => file.endsWith(".grammar"))
        .map((file) =>
          fs.readFileSync(__dirname + "/database/grammar/" + file, "utf8")
        )
        .join("\n")

    // Write the concatenated grammar
    Disk.write(outputFilePath, grammar)

    // check grammar for errors

    const grammarErrors = new grammarNode(grammar)
      .getAllErrors()
      .map((err) => err.toObject())
    if (grammarErrors.length) console.log(grammarErrors)

    // Format the file:
    new CommandLineApp().format(outputFilePath)
  }

  buildCsv() {
    codeLaniBase.loadFolder()
    Disk.write(websiteFolder + "/codelani.csv", codeLaniBase.toCsv())
  }

  buildTypesFile() {
    Disk.write(__dirname + "/database/types.ts", codeLaniBase.typesFile)
  }

  formatDatabase() {
    codeLaniBase.loadFolder()
    codeLaniBase.forEach((file) => file.formatAndSave())
  }

  startServer(port = 4444) {
    codeLaniBase.startServer(port)
  }

  checkBlog() {
    console.log(
      shell(`cd ${websiteFolder}; scroll check; cd lists/; scroll check; `, {
        encoding: "utf8",
      })
    )
  }
}

export { Builder }

if (!module.parent)
  new Builder().main(process.argv[2], process.argv[3], process.argv[4])
