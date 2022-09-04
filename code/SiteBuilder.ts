#!/usr/bin/env node

const lodash = require("lodash")
const path = require("path")
const { jtree } = require("jtree")
const dayjs = require("dayjs")
const numeral = require("numeral")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { LanguagePageTemplate } from "./LanguagePage"
import { FeaturePageTemplate } from "./FeaturePage"
import { PLDBBaseFolder } from "./PLDBBase"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const codeDir = __dirname
const rootDir = path.join(codeDir, "..")
const siteFolder = path.join(rootDir, "site")
const settingsFilePath = path.join(siteFolder, "settings.scroll")
const pagesDir = path.join(siteFolder, "pages")
const publishedDocsFolder = path.join(siteFolder, "docs")
const publishedPagesFolder = path.join(siteFolder, "pages")
const listsFolder = path.join(siteFolder, "lists")
const publishedPostsFolder = path.join(siteFolder, "posts")
const publishedLanguagesFolder = path.join(siteFolder, "languages") // Todo: eventually redirect away from /languages?

import {
  isLanguage,
  benchmark,
  nameToAnchor,
  benchmarkResults,
  listGetters,
  lastCommitHashInFolder,
  imemo,
  runCommand
} from "./utils"

const buildAllList = []
const buildAll: MethodDecorator = (
  target: Object,
  prop: PropertyKey,
  descriptor: PropertyDescriptor
): void => {
  buildAllList.push(prop)
}

const buildImportsFile = (filepath, varMap) => {
  Disk.write(
    filepath,
    `importOnly\n` +
      Object.keys(varMap)
        .map(key => {
          let value = varMap[key]

          if (value.rows)
            return `replace ${key}
 pipeTable
  ${new TreeNode(value.rows)
    .toDelimited("|", value.header, false)
    .replace(/\n/g, "\n  ")}`

          value = value.toString()

          if (value.includes("\n")) return `replace ${key} ${value}`

          return `replace ${key}
 ${value.replace(/\n/g, "\n ")}`
        })
        .join("\n")
  )
}

class SiteBuilder {
  buildAllCommand() {
    buildAllList.forEach(methodName => {
      console.log(methodName)
      this[methodName]()
    })
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
  @buildAll
  copyNpmAssetsCommand() {
    // Copy node module assets
    Disk.mkdir(path.join(siteFolder, "node_modules"))
    shell(
      `cp -R ${rootDir}/node_modules/monaco-editor ${siteFolder}/node_modules/`
    )
    shell(`cp -R ${rootDir}/node_modules/jtree ${siteFolder}/node_modules/`)
  }

  @benchmark
  @buildAll
  buildSingleGrammarFile() {
    // Copy grammar to docs folder for easy access in things like TN Designer.
    Disk.write(path.join(siteFolder, "pldb.grammar"), pldbBase.grammarCode)
  }

  @benchmark
  @buildAll
  buildBuildLogImportsCommand() {
    buildImportsFile(path.join(siteFolder, "buildLogImports.scroll"), {
      LAST_HASH: lastCommitHashInFolder(),
      BUILT_IN_YEAR: dayjs().format("YYYY"),
      BUILT_ON_DAY: dayjs().format("MM/DD/YYYY")
    })
  }

  @benchmark
  @buildAll
  buildKeywordsImportsCommand() {
    const { keywordsTable } = pldbBase
    const { rows, langsWithKeywordsCount } = keywordsTable

    buildImportsFile(path.join(listsFolder, "keywordsImports.scroll"), {
      NUM_KEYWORDS: numeral(rows.length).format("0,0"),
      LANGS_WITH_KEYWORD_DATA: langsWithKeywordsCount,
      KEYWORDS_TABLE: {
        rows,
        header: ["keyword", "count", "frequency", "langs"]
      }
    })
  }

  @benchmark
  @buildAll
  buildRedirectsCommand() {
    Disk.read(path.join(siteFolder, "redirects.txt"))
      .split("\n")
      .forEach(line => {
        const link = line.split(" ")
        const oldFile = path.join(siteFolder, link[0])
        Disk.write(
          oldFile,
          `<meta http-equiv="Refresh" content="0; url='${link[1]}'" />`
        )
      })
  }

  @benchmark
  @buildAll
  buildDatabasePagesCommand() {
    pldbBase.forEach(file => {
      const constructor =
        file.get("type") === "feature"
          ? FeaturePageTemplate
          : LanguagePageTemplate

      Disk.write(
        path.join(publishedLanguagesFolder, `${file.id}.scroll`),
        new constructor(file).toScroll()
      )
    })
  }

  @benchmark
  @buildAll
  buildAcknowledgementsImportsCommand() {
    const { sources } = pldbBase
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

    const npmPackages = Object.keys({
      ...require("../package.json").dependencies,
      ...require("./importers/package.json").dependencies
    })
    npmPackages.sort()

    buildImportsFile(path.join(pagesDir, "acknowledgementsImports.scroll"), {
      WRITTEN_IN_TABLE: lodash
        .sortBy(writtenIn, "rank")
        .map(
          file =>
            `<li><a href="BASE_URL/languages/${file.permalink}">${file.title}</a></li>`
        )
        .join(""),
      PACKAGES_TABLE: npmPackages
        .map(
          s => `<li><a href="https://www.npmjs.com/package/${s}">${s}</a></li>`
        )
        .join(""),
      SOURCES_TABLE: sources
        .map(s => `<li><a href="https://${s}">${s}</a></li>`)
        .join(""),
      CONTRIBUTORS_TABLE: JSON.parse(
        Disk.read(path.join(pagesDir, "contributors.json"))
      )
        .filter(
          item =>
            item.login !== "codelani" &&
            item.login !== "breck7" &&
            item.login !== "pldbbot"
        )
        .map(item => `<li><a href="${item.html_url}">${item.login}</a></li>`)
        .join("")
    })
  }

  @benchmark
  @buildAll
  buildSearchIndexCommand() {
    const objects = pldbBase.objectsForCsv.map(object => {
      return {
        label: object.title,
        appeared: object.appeared,
        id: object.pldbId
      }
    })
    Disk.write(
      path.join(siteFolder, "searchIndex.json"),
      JSON.stringify(objects, null, 2)
    )
  }

  @benchmark
  @buildAll
  buildKeywordsOneHot() {
    Disk.write(
      path.join(siteFolder, "keywordsOneHot.csv"),
      new TreeNode(pldbBase.keywordsOneHot).toCsv()
    )
  }

  @benchmark
  @buildAll
  buildCsvImportsCommand() {
    const { csvBuildOutput } = pldbBase
    const {
      pldbCsv,
      langsCsv,
      columnsCsv,
      columnMetadataColumnNames,
      columnsMetadataTree,
      colNamesForCsv
    } = csvBuildOutput

    Disk.write(path.join(siteFolder, "pldb.csv"), pldbCsv)
    Disk.write(path.join(siteFolder, "languages.csv"), langsCsv)
    Disk.write(path.join(siteFolder, "columns.csv"), columnsCsv)

    buildImportsFile(path.join(publishedDocsFolder, "csvImports.scroll"), {
      LANG_COUNT: pldbBase.topLanguages.length,
      COL_COUNT: colNamesForCsv.length,
      ENTITY_COUNT: pldbBase.length,
      ENTITIES_FILE_SIZE_UNCOMPRESSED: numeral(pldbCsv.length).format("0.0b"),
      LANGS_FILE_SIZE_UNCOMPRESSED: numeral(langsCsv.length).format("0.0b"),
      COLUMN_METADATA_TABLE: {
        header: columnMetadataColumnNames,
        rows: columnsMetadataTree
      }
    })
  }

  @benchmark
  @buildAll
  buildJsonCommand() {
    const str = JSON.stringify(pldbBase.typedMap, null, 2)
    Disk.write(path.join(siteFolder, "pldb.json"), str)
    Disk.write(path.join(codeDir, "package", "pldb.json"), str)
  }

  @benchmark
  _formatDatabase() {
    pldbBase.forEach(file => file.prettifyAndSave())
  }

  @benchmark
  @buildAll
  buildTopListImports() {
    const files = pldbBase.topLanguages.map(file => {
      const appeared = file.get("appeared")
      const rank = file.languageRank + 1
      const type = file.get("type")
      const title = file.get("title")
      return {
        title,
        titleLink: `../languages/${file.permalink}`,
        rank,
        type,
        appeared
      }
    })

    const vars = {}
    const pages = [100, 250, 500, 1000]
    const header = ["title", "titleLink", "appeared", "type", "rank"]
    pages.forEach(
      num =>
        (vars[`TOP_${num}`] = {
          header,
          rows: files.slice(0, num)
        })
    )

    buildImportsFile(path.join(listsFolder, "topLangsImports.scroll"), vars)
  }

  @benchmark
  @buildAll
  buildExtensionsImports() {
    const files = pldbBase
      .filter(file => file.get("type") !== "feature")
      .map(file => {
        return {
          name: file.title,
          nameLink: `../languages/${file.permalink}`,
          rank: file.rank,
          extensions: file.extensions
        }
      })
      .filter(file => file.extensions)

    const allExtensions = new Set<string>()
    files.forEach(file =>
      file.extensions.split(" ").forEach(ext => allExtensions.add(ext))
    )

    const rows = lodash.sortBy(files, "rank")

    buildImportsFile(path.join(listsFolder, "extensionsImports.scroll"), {
      EXTENSION_COUNT: numeral(allExtensions.size).format("0,0"),
      TABLE: {
        rows,
        header: ["name", "nameLink", "extensions"]
      },
      LANG_WITH_DATA_COUNT: files.length
    })
  }

  @benchmark
  @buildAll
  buildEntitiesImports() {
    let files = pldbBase.map(file => {
      const appeared = file.get("appeared")
      const rank = file.rank + 1
      const type = file.get("type")
      const title = file.get("title")
      return {
        title,
        titleLink: `../languages/${file.permalink}`,
        rank,
        type,
        appeared
      }
    })

    buildImportsFile(path.join(listsFolder, "entitiesImports.scroll"), {
      COUNT: numeral(Object.values(files).length).format("0,0"),
      TABLE: {
        rows: lodash.sortBy(files, "rank"),
        header: ["title", "titleLink", "type", "appeared", "rank"]
      }
    })
  }

  @benchmark
  @buildAll
  buildLanguagesImports() {
    const files = pldbBase
      .filter(file => file.isLanguage)
      .map(file => {
        const title = file.get("title")
        const appeared = file.get("appeared") || ""
        const rank = file.languageRank + 1
        const type = file.get("type")
        return {
          title,
          titleLink: `../languages/${file.permalink}`,
          type,
          appeared,
          rank
        }
      })

    buildImportsFile(path.join(listsFolder, "languagesImports.scroll"), {
      COUNT: numeral(Object.values(files).length).format("0,0"),
      TABLE: {
        rows: lodash.sortBy(files, "rank"),
        header: ["title", "titleLink", "type", "appeared", "rank"]
      }
    })
  }

  @benchmark
  @buildAll
  buildFeaturesImports() {
    const { topFeatures } = pldbBase

    buildImportsFile(path.join(listsFolder, "featuresImports.scroll"), {
      COUNT: numeral(Object.values(topFeatures).length).format("0,0"),
      TABLE: {
        rows: topFeatures,
        header: [
          "feature",
          "featureLink",
          "pseudoExample",
          "yes",
          "no",
          "percentage"
        ]
      }
    })
  }

  @benchmark
  @buildAll
  buildCorporationsImports() {
    const entities = {}

    const files = lodash.sortBy(
      pldbBase.filter(
        file => file.isLanguage && file.corporateDevelopers.length
      ),
      "languageRank"
    )

    files.forEach(file => {
      file.corporateDevelopers.forEach(entity => {
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
        .map(
          lang => `<a href='../languages/${lang.permalink}'>${lang.title}</a>`
        )
        .join(" - ")
      const count = entities[name].length
      const top = -Math.min(...entities[name].map(lang => lang.languageRank))

      const wrappedName = `<a name='${nameToAnchor(name)}' />${name}`

      return { name: wrappedName, languages, count, top }
    })
    const sorted = lodash.sortBy(rows, ["count", "top"])
    sorted.reverse()

    buildImportsFile(path.join(listsFolder, "corporationsImports.scroll"), {
      TABLE: {
        rows: sorted,
        header: ["name", "languages", "count"]
      },
      COUNT: numeral(Object.values(entities).length).format("0,0")
    })
  }

  @benchmark
  @buildAll
  buildCreatorsImports() {
    const creators = {}

    lodash
      .sortBy(
        pldbBase.filter(file => file.isLanguage && file.has("creators")),
        "languageRank"
      )
      .forEach(file => {
        file.creators.forEach(creatorName => {
          if (!creators[creatorName]) creators[creatorName] = []
          creators[creatorName].push(file)
        })
      })

    const wikipediaLinks = new TreeNode(
      Disk.read(path.join(listsFolder, "creators.tree"))
    )

    const rows = Object.keys(creators).map(name => {
      const languages = creators[name]
        .map(
          file => `<a href='../languages/${file.permalink}'>${file.title}</a>`
        )
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

    buildImportsFile(path.join(listsFolder, "creatorsImports.scroll"), {
      TABLE: {
        rows: sorted,
        header: ["name", "languages", "count", "topRank"]
      },
      COUNT: numeral(Object.values(creators).length).format("0,0")
    })
  }

  @benchmark
  @buildAll
  buildHomepageImportsCommand() {
    const postsScroll = new ScrollFolder(publishedPostsFolder)

    buildImportsFile(path.join(siteFolder, "homepageImports.scroll"), {
      TOP_LANGS: pldbBase.topLanguages
        .slice(0, 10)
        .map(
          file => `<a href="./languages/${file.permalink}">${file.title}</a>`
        )
        .join(" · "),
      NEW_POSTS: postsScroll.files
        .slice(0, 5)
        .map(file => `<a href="./posts/${file.permalink}">${file.title}</a>`)
        .join("<br>")
    })
  }

  @benchmark
  buildDatabasePagesScrollCommand() {
    new ScrollFolder(publishedLanguagesFolder).buildFiles()
  }

  @buildAll
  @benchmark
  buildScrollsCommand() {
    new ScrollFolder(listsFolder).buildFiles()
    new ScrollFolder(siteFolder).buildFiles()
    new ScrollFolder(publishedPagesFolder).buildFiles()
    new ScrollFolder(publishedDocsFolder).buildFiles()
    new ScrollFolder(publishedPostsFolder).buildFiles()
    this.buildDatabasePagesScrollCommand()
  }
}

export { SiteBuilder }

if (!module.parent)
  runCommand(new SiteBuilder(), process.argv[2], process.argv[3])
