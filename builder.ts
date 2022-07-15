#!/usr/bin/env ts-node

const lodash = require("lodash")
const numeral = require("numeral")
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

const { TreeBaseServer } = require("jtree/products/treeBase.node.js")

const pldbBase = PLDBBaseFolder.getBase()
const websiteFolder = __dirname + "/pldb.pub"
const databaseFolderWhenPublishedToWebsite = websiteFolder + "/languages" // Todo: eventually redirect away from /languages?
const settingsFile = Disk.read(__dirname + "/blog/scroll.settings")

import {
  nameToAnchor,
  replaceNext,
  toScrollTable,
  isLanguage,
  benchmark,
  benchmarkResults
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
  }

  buildAll() {
    pldbBase.loadFolder()
    this.buildCreatorsPage()
    this.buildCorporationsPage()
    this.buildFeaturesPage()
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
    console.log(benchmarkResults)
  }

  _buildTopPages(num) {
    pldbBase.loadFolder()
    const pagePath = __dirname + `/blog/lists/top${num}.scroll`
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase.topLanguages.map(file => {
      const name = file.id
      const appeared = file.get("appeared")
      const rank = file.languageRank + 1
      const type = file.get("type")
      const title = file.get("title")
      return {
        title,
        titleLink: `../languages/${name}.html`,
        rank,
        type,
        appeared
      }
    })

    replaceNext(
      page,
      `comment autogenTop`,
      toScrollTable(new TreeNode(files.slice(0, num)), [
        "title",
        "titleLink",
        "appeared",
        "type",
        "rank"
      ])
    )

    Disk.write(pagePath, page.toString())
  }

  @benchmark
  buildTopPages() {
    this._buildTopPages(100)
    this._buildTopPages(250)
    this._buildTopPages(500)
    this._buildTopPages(1000)
  }

  @benchmark
  buildKeywordsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/keywords.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const langsWithKeywords = pldbBase.filter(
      file => file.isLanguage && file.has("keywords")
    )

    const theWords = {}
    langsWithKeywords.forEach(file => {
      const name = file.id
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
            `<a href='../languages/${file.id}.html'>${file.title}</a>`
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

  @benchmark
  buildFileExtensionsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/extensions.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase
      .filter(file => file.get("type") !== "feature")
      .map(file => {
        return {
          name: file.title,
          nameLink: `../languages/${file.id}.html`,
          rank: file.rank,
          extensions: file.extensions
        }
      })
      .filter(file => file.extensions)

    const sorted = lodash.sortBy(files, "rank")

    replaceNext(
      page,
      "comment autogenExtensions",
      toScrollTable(new TreeNode(sorted), ["name", "nameLink", "extensions"])
    )

    const text = page
      .toString()
      .replace(
        /list of .+ file extensions/,
        `list of ${numeral(sorted.length).format("0,0")} file extensions`
      )

    Disk.write(pagePath, text)
  }
  
  @benchmark
  buildEntitiesPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/entities.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    let files = pldbBase.map(file => {
      const name = file.id
      const appeared = file.get("appeared")
      const rank = file.rank + 1
      const type = file.get("type")
      const title = file.get("title")
      return {
        title,
        titleLink: `../languages/${name}.html`,
        rank,
        type,
        appeared
      }
    })

    files = lodash.sortBy(files, "rank")

    replaceNext(
      page,
      "comment autogenEntities",
      toScrollTable(new TreeNode(files), [
        "title",
        "titleLink",
        "type",
        "appeared",
        "rank"
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

  @benchmark
  buildLanguagesPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/languages.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const files = pldbBase
      .filter(file => file.isLanguage)
      .map(file => {
        const name = file.id
        const title = file.get("title")
        const appeared = file.get("appeared") || ""
        const rank = file.languageRank + 1
        const type = file.get("type")
        return {
          title,
          titleLink: `../languages/${name}.html`,
          type,
          appeared,
          rank
        }
      })

    const sorted = lodash.sortBy(files, "rank")

    replaceNext(
      page,
      "comment autogenLanguages",
      toScrollTable(new TreeNode(sorted), [
        "title",
        "titleLink",
        "type",
        "appeared",
        "rank"
      ])
    )

    const text = page
      .toString()
      .replace(
        /currently has .+ languages/,
        `currently has ${numeral(sorted.length).format("0,0")} languages`
      )

    Disk.write(pagePath, text)
  }

  @benchmark
  buildFeaturesPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/features.scroll"
    const page = new TreeNode(Disk.read(pagePath))
    const { topFeatures } = pldbBase

    replaceNext(
      page,
      "comment autogenFeatures",
      toScrollTable(new TreeNode(topFeatures), [
        "feature",
        "featureLink",
        "aka",
        "psuedoExample",
        "languages"
      ])
    )

    const text = page
      .toString()
      .replace(
        /A list of .+ features/,
        `A list of ${numeral(topFeatures.length).format("0,0")} features`
      )

    Disk.write(pagePath, text)
  }

  @benchmark
  buildCreatorsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/creators.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const creators = {}

    lodash
      .sortBy(
        pldbBase.filter(file => file.isLanguage && file.has("creators")),
        "languageRank"
      )
      .forEach(file => {
        file
          .get("creators")
          .split(" and ")
          .forEach(creatorName => {
            if (!creators[creatorName]) creators[creatorName] = []
            creators[creatorName].push(file)
          })
      })

    const wikipediaLinks = new TreeNode(
      page
        .find(node => node.getLine().startsWith("comment WikipediaPages"))
        .childrenToString()
    )

    const rows = Object.keys(creators).map(name => {
      const languages = creators[name]
        .map(file => `<a href='../languages/${file.id}.html'>${file.title}</a>`)
        .join(" - ")
      const count = creators[name].length
      let topRank = 10000

      creators[name].forEach(file => {
        const { languageRank } = file
        if (languageRank < topRank) topRank = languageRank
      })

      const person = wikipediaLinks.nodesThatStartWith(name)[0]
      const anchorTag = nameToAnchor(name)
      const wrappedName = !person
        ? `<a name='${anchorTag}' />${name}`
        : `<a name='${anchorTag}' href='https://en.wikipedia.org/wiki/${person.get(
            "wikipedia"
          )}'>${name}</a>`

      return {
        name: wrappedName,
        languages,
        count,
        topRank: topRank + 1
      }
    })

    const sorted = lodash.sortBy(rows, "topRank")

    const theTable = toScrollTable(new TreeNode(sorted), [
      "name",
      "languages",
      "count",
      "topRank"
    ])

    replaceNext(page, "comment autogenCreators", theTable)

    const newCount = numeral(Object.values(creators).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of .+ people/, `list of ${newCount} people`)

    Disk.write(pagePath, text)
  }

  @benchmark
  buildCorporationsPage() {
    pldbBase.loadFolder()
    const pagePath = __dirname + "/blog/lists/corporations.scroll"
    const page = new TreeNode(Disk.read(pagePath))

    const entities = {}

    const files = lodash.sortBy(
      pldbBase.filter(
        file => file.isLanguage && file.has("corporateDevelopers")
      ),
      "languageRank"
    )

    files.forEach(file => {
      file
        .get("corporateDevelopers")
        .split(" and ")
        .forEach(entity => {
          if (!entities[entity]) entities[entity] = []
          entities[entity].push({
            id: file.id,
            title: file.title,
            languageRank: file.languageRank
          })
        })
    })

    const rows = Object.keys(entities).map(name => {
      const languages = entities[name]
        .map(lang => `<a href='../languages/${lang.id}.html'>${lang.title}</a>`)
        .join(" - ")
      const count = entities[name].length
      const top = -Math.min(...entities[name].map(lang => lang.languageRank))

      const wrappedName = `<a name='${nameToAnchor(name)}' />${name}`

      return { name: wrappedName, languages, count, top }
    })
    const sorted = lodash.sortBy(rows, ["count", "top"])
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

  @benchmark
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

    this._buildListsSite()
  }

  @benchmark
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
  @benchmark
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
      this._scrollExtensionsFile
    )

    const folder = new ScrollFolder(websiteFolder + "/lists")
    folder.buildSinglePages()
  }

  @benchmark
  buildDatabasePages() {
    this.buildGrammar()
    Disk.mkdir(databaseFolderWhenPublishedToWebsite)

    pldbBase.loadFolder()
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

  @benchmark
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
    Disk.write(__dirname + "/code/types.ts", pldbBase.typesFile)
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

  generateWorksheets() {
    pldbBase.loadFolder()
    const { topFeatures } = pldbBase

    pldbBase.topLanguages
      .slice(0, 100)
      .filter(file => file.has("githubCopilotOptimized"))
      .forEach(file => {
        const lineCommentKeyword = file.lineCommentKeyword

        const todos = []
        topFeatures.forEach(feature => {
          const hit = file.getNode(`features ${feature.path}`)
          if (hit && hit.getContent() === "false") return
          if (hit && hit.length)
            todos.push(
              `${lineCommentKeyword} A short example of ${feature.feature}(${
                feature.path
              }) in ${file.title}:\n${hit.childrenToString()}`
            )
          else
            todos.push(
              `${lineCommentKeyword} A short example of ${feature.feature}(${feature.path}) in ${file.title}:`
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
