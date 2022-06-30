#!/usr/bin/env ts-node

const lodash = require("lodash")
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
import { PLDBBaseFolder } from "./database/PLDBBase"

const { TreeBaseServer } = require("jtree/products/treeBase.node.js")

const pldbBase = PLDBBaseFolder.getBase()
const websiteFolder = __dirname + "/pldb.pub"
const databaseFolderWhenPublishedToWebsite = websiteFolder + "/languages" // Todo: eventually redirect away from /languages?
const settingsFile = Disk.read(__dirname + "/blog/scroll.settings")

import {
  nameToAnchor,
  replaceNext,
  toScrollTable,
  isLanguage
} from "./database/utils"

class Builder extends AbstractBuilder {
  _cpAssets() {
    // Copy other assets into the root site folder
    shell(`cp ${__dirname}/blog/public/*.* ${websiteFolder}`)

    // Copy grammar to public folder
    Disk.mkdir(websiteFolder + "/datasets")
    Disk.write(
      websiteFolder + "/datasets/pldb.grammar",
      Disk.read(pldbBase.dir + "pldb.grammar")
    )
  }

  buildAll() {
    this.buildCreatorsPage()
    this.buildCorporationsPage()
    this.buildPatternsPage()
    this.buildLanguagesPage()
    this.buildFileExtensionsPage()
    this.buildKeywordsPage()
    this.buildAcknowledgementsPage()
    this.buildTopPages()
    this.buildEntitiesPage()
    this.buildBlog()
    this.buildCsvs()
    this.buildSearchIndex()
    this.buildDatabasePages()
  }

  _buildTopPages(num) {
    pldbBase.loadFolder()
    const pagePath = __dirname + `/blog/lists/top${num}.scroll`
    const page = new TreeNode(Disk.read(pagePath))

    let files = pldbBase
      .filter(lang => lang.isLanguage)
      .map(file => {
        const name = file.primaryKey
        const appeared = file.get("appeared")
        const rank = file.languageRank + 1
        const type = file.get("type")
        return {
          name,
          nameLink: `../languages/${name}.html`,
          rank,
          type,
          appeared
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
        "rank"
      ])
    )

    Disk.write(pagePath, page.toString())
  }

  buildTopPages() {
    this._buildTopPages(100)
    this._buildTopPages(250)
  }

  buildKeywordsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/keywords.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const langsWithKeywords = pldbBase.filter(
      file => file.isLanguage && file.has("keywords")
    )

    const theWords = {}
    langsWithKeywords.forEach(file => {
      const name = file.primaryKey
      file
        .get("keywords")
        .split(" ")
        .forEach(word => {
          const escapedWord = "Q" + word.toLowerCase() // b.c. you cannot have a key "constructor" in JS objects.

          if (!theWords[escapedWord])
            theWords[escapedWord] = {
              keyword: escapedWord,
              count: 0,
              langs: []
            }

          const entry = theWords[escapedWord]

          entry.langs.push(
            `<a href='../languages/${file.primaryKey}.html'>${file.primaryKey}</a>`
          )
          entry.count++
        })
    })

    Object.values(theWords).forEach((word: any) => {
      word.langs = word.langs.join(" ")
      word.frequency =
        Math.round(
          100 * lodash.round(word.count / langsWithKeywords.length, 2)
        ) + "%"
    })

    const sorted = lodash.sortBy(theWords, "count")
    sorted.reverse()

    const tree = new TreeNode(sorted)
    tree.forEach(node => {
      node.set("keyword", node.get("keyword").substr(1))
    })

    replaceNext(
      page,
      "comment autogenKeywords",
      toScrollTable(tree, ["keyword", "count", "frequency", "langs"])
    )

    replaceNext(
      page,
      "comment autogenAbout",
      `paragraph
 Here is the list of ${numeral(Object.keys(theWords).length).format(
   "0,0"
 )} keywords for the ${
        langsWithKeywords.length
      } languages that PLDB has that information. This list is case insensitive. Refer to the DB for case information.`
    )

    Disk.write(pagePath, page.toString())
  }

  buildFileExtensionsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/extensions.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase
      .filter(file => file.get("type") !== "pattern")
      .map(file => {
        const name = file.primaryKey
        return {
          name,
          nameLink: `../languages/${name}.html`,
          extensions: file.extensions
        }
      })
      .filter(file => file.extensions)

    replaceNext(
      page,
      "comment autogenExtensions",
      toScrollTable(new TreeNode(files), ["name", "nameLink", "extensions"])
    )

    const text = page
      .toString()
      .replace(
        /list of .+ file extensions/,
        `list of ${numeral(files.length).format("0,0")} file extensions`
      )

    Disk.write(pagePath, text)
  }

  buildEntitiesPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/entities.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase.map(file => {
      const name = file.primaryKey
      const appeared = file.get("appeared") || ""
      const type = file.get("type")
      return {
        name,
        nameLink: `../languages/${name}.html`,
        type,
        appeared
      }
    })

    replaceNext(
      page,
      "comment autogenEntities",
      toScrollTable(new TreeNode(files), [
        "name",
        "nameLink",
        "type",
        "appeared"
      ])
    )

    const text = page
      .toString()
      .replace(
        /list of all .+ entities/,
        `list of all ${numeral(files.length).format("0,0")} entities`
      )

    Disk.write(pagePath, text)
  }

  buildLanguagesPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/languages.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase
      .filter(file => file.isLanguage)
      .map(file => {
        const name = file.primaryKey
        const appeared = file.get("appeared") || ""
        const type = file.get("type")
        return {
          name,
          nameLink: `../languages/${name}.html`,
          type,
          appeared
        }
      })

    replaceNext(
      page,
      "comment autogenLanguages",
      toScrollTable(new TreeNode(files), [
        "name",
        "nameLink",
        "type",
        "appeared"
      ])
    )

    const text = page
      .toString()
      .replace(
        /list of all .+ languages/,
        `list of all ${numeral(files.length).format("0,0")} languages`
      )

    Disk.write(pagePath, text)
  }

  buildPatternsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/patterns.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase.patternFiles.map(file => {
      const name = file.primaryKey
      return {
        pattern: file.get("title"),
        patternLink: `../languages/${name}.html`,
        aka: file.getAll("aka").join(" or "),
        languages: file.languagesWithThisPattern.length,
        psuedoExample: (file.get("psuedoExample") || "")
          .replace(/\</g, "&lt;")
          .replace(/\|/g, "&#124;")
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
        "languages"
      ])
    )

    const text = page
      .toString()
      .replace(
        /A list of .+ patterns/,
        `A list of ${numeral(files.length).format("0,0")} patterns`
      )

    Disk.write(pagePath, text)
  }

  buildCreatorsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/creators.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const entities = {}
    pldbBase.forEach(file => {
      const languageId = file.primaryKey
      if (file.has("creators"))
        file
          .get("creators")
          .split(" and ")
          .forEach(entity => {
            if (!entities[entity]) entities[entity] = []
            entities[entity].push(languageId)
          })
    })

    const wikipediaLinks = new TreeNode(
      page
        .find(node => node.getLine().startsWith("comment WikipediaPages"))
        .childrenToString()
    )

    const rows = Object.keys(entities).map(name => {
      const languages = entities[name]
        .map(lang => `<a href='../languages/${lang}.html'>${lang}</a>`)
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
      "count"
    ])

    replaceNext(page, "comment autogenCreators", theTable)

    const newCount = numeral(Object.values(entities).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of .+ people/, `list of ${newCount} people`)

    Disk.write(pagePath, text)
  }

  buildCorporationsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/corporations.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const entities = {}
    pldbBase.forEach(file => {
      const languageId = file.primaryKey
      if (file.has("corporateDevelopers"))
        file
          .get("corporateDevelopers")
          .split(" and ")
          .forEach(entity => {
            if (!entities[entity]) entities[entity] = []
            entities[entity].push(languageId)
          })
    })

    const rows = Object.keys(entities).map(name => {
      const languages = entities[name]
        .map(lang => `<a href='../languages/${lang}.html'>${lang}</a>`)
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
      "count"
    ])

    replaceNext(page, "comment autogenCorporations", theTable)

    const newCount = numeral(Object.values(entities).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of .+ corporations/, `list of ${newCount} corporations`)

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
          "https://github.com/breck7/pldb/blob/main/blog/posts/"
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
    folder.buildRssFeed()

    this._buildListsSite()
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

  // Build all the list pages
  _buildListsSite() {
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
      Disk.read(__dirname + `/database/scrollExtensions.grammar`)
    )

    const folder = new ScrollFolder(websiteFolder + "/lists")
    folder.buildSinglePages()
  }

  buildDatabasePages() {
    this.buildGrammar()
    Disk.mkdir(databaseFolderWhenPublishedToWebsite)

    pldbBase.loadFolder()
    pldbBase.forEach(file => {
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
    const tree = new TreeNode(Disk.read(path))
    replaceNext(tree, "comment autogenAcknowledgements", table)

    Disk.write(path, tree.toString())
  }

  buildGrammar() {
    const outputFilePath = pldbBase.dir + "pldb.grammar"

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
    Disk.write(outputFilePath, grammar)

    // check grammar for errors

    const grammarErrors = new grammarNode(grammar)
      .getAllErrors()
      .map(err => err.toObject())
    if (grammarErrors.length) console.log(grammarErrors)

    // Format the file:
    new CommandLineApp().format(outputFilePath)
  }

  merge() {
    pldbBase.loadFolder()
    pldbBase.forEach(file => {
      const comment = file.get("lineCommentKeyword")
      if (comment && !file.getNode("patterns hasLineComments?")) {
        file
          .touchNode("patterns")
          .appendLineAndChildren(
            `hasLineComments? true`,
            `${comment} A comment`
          )

        file.save()
      }
    })
  }

  buildSearchIndex() {
    pldbBase.loadFolder()
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

  buildCsvs() {
    pldbBase.loadFolder()
    const objects = pldbBase.toObjectsForCsv()

    Disk.write(websiteFolder + "/pldb.csv", new TreeNode(objects).toCsv())
    Disk.write(
      websiteFolder + "/languages.csv",
      new TreeNode(objects.filter(obj => isLanguage(obj.type))).toCsv()
    )
  }

  buildTypesFile() {
    Disk.write(__dirname + "/database/types.ts", pldbBase.typesFile)
  }

  formatDatabase() {
    pldbBase.loadFolder()
    pldbBase.forEach(file => file.formatAndSave())
  }

  serveFolder(port = 3030) {
    const express = require("express")
    const app = express()
    app.use(express.static(__dirname + "/pldb.pub"))
    app.listen(port)
  }

  startServer(port = 4444) {
    pldbBase.loadFolder()
    pldbBase.startListeningForFileChanges()
    new (<any>TreeBaseServer)(pldbBase).listen(port)
  }

  checkBlog() {
    console.log(
      shell(`cd ${websiteFolder}; scroll check; cd lists/; scroll check; `, {
        encoding: "utf8"
      })
    )
  }
}

export { Builder }

if (!module.parent)
  new Builder().main(process.argv[2], process.argv[3], process.argv[4])
