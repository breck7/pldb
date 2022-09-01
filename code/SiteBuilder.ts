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
  toScrollTable,
  runCommand
} from "./utils"

class SiteBuilder {
  buildAllCommand() {
    this.copyNpmAssetsCommand()
    this.buildBuildLogImportsCommand()
    this.buildAcknowledgementsImportsCommand()
    this.buildKeywordsImportsCommand()
    this.buildTopListImports()
    this.buildHomepageFeedImportsCommand()
    this.buildSingleGrammarFile()
    this.buildKeywordsOneHot()
    this.buildCsvImportsCommand()
    this.buildJsonCommand()
    this.buildRedirectsCommand()
    this.buildSearchIndexCommand()
    this.buildDatabasePagesCommand()
    this.buildScrolls()

    this._printBenchmarkResults()
  }

  @benchmark buildScrolls() {
    new ScrollFolder(listsFolder).buildFiles()
    new ScrollFolder(siteFolder).buildFiles()
    new ScrollFolder(publishedPagesFolder).buildFiles()
    new ScrollFolder(publishedDocsFolder).buildFiles()
    this.postsScroll.buildFiles()
    this.buildDatabasePagesScrollCommand()
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
    Disk.mkdir(path.join(siteFolder, "node_modules"))
    shell(
      `cp -R ${rootDir}/node_modules/monaco-editor ${siteFolder}/node_modules/`
    )
    shell(`cp -R ${rootDir}/node_modules/jtree ${siteFolder}/node_modules/`)
  }

  @benchmark
  buildSingleGrammarFile() {
    // Copy grammar to docs folder for easy access in things like TN Designer.
    Disk.write(path.join(siteFolder, "pldb.grammar"), pldbBase.grammarCode)
  }

  @benchmark
  buildBuildLogImportsCommand() {
    const lastHash = lastCommitHashInFolder()
    const builtOnYear = dayjs().format("YYYY")
    const builtOnDay = dayjs().format("MM/DD/YYYY")
    const tree = new TreeNode(Disk.read(settingsFilePath))

    tree.getNodeByColumns("replace", "LAST_HASH").setWord(2, lastHash)
    tree.getNodeByColumns("replace", "BUILT_IN_YEAR").setWord(2, builtOnYear)
    tree.getNodeByColumns("replace", "BUILT_ON_DAY").setWord(2, builtOnDay)

    Disk.write(path.join(siteFolder, "buildLogImports.scroll"), tree.toString())
  }

  @benchmark
  buildKeywordsImportsCommand() {
    const { keywordsTable } = pldbBase
    const { rows, langsWithKeywordsCount } = keywordsTable
    Disk.write(
      path.join(listsFolder, "keywordsImports.scroll"),
      `importOnly
replace NUM_KEYWORDS ${numeral(rows.length).format("0,0")}
replace LANGS_WITH_KEYWORD_DATA ${langsWithKeywordsCount}
replace KEYWORDS_TABLE
 ${toScrollTable(new TreeNode(rows), [
   "keyword",
   "count",
   "frequency",
   "langs"
 ])}`
    )
  }

  @imemo get postsScroll() {
    return new ScrollFolder(publishedPostsFolder)
  }

  @benchmark
  buildHomepageFeedImportsCommand() {
    const { postsScroll } = this

    const topLangs = pldbBase.topLanguages
      .slice(0, 10)
      .map(file => `<a href="./languages/${file.permalink}">${file.title}</a>`)
      .join(" · ")

    const newPosts = postsScroll.files
      .slice(0, 5)
      .map(file => `<a href="./posts/${file.permalink}">${file.title}</a>`)
      .join("<br>")

    Disk.write(
      path.join(siteFolder, "homepageFeedImports.scroll"),
      `importOnly
replace TOP_LANGS ${topLangs}
replace NEW_POSTS ${newPosts}`
    )
  }

  @benchmark
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
  buildDatabasePagesCommand() {
    pldbBase.forEach(file => {
      const filePath = path.join(publishedLanguagesFolder, `${file.id}.scroll`)

      const constructor =
        file.get("type") === "feature"
          ? FeaturePageTemplate
          : LanguagePageTemplate

      Disk.write(filePath, new constructor(file).toScroll())
    })
  }

  @benchmark
  buildDatabasePagesScrollCommand() {
    new ScrollFolder(publishedLanguagesFolder).buildFiles()
  }

  @benchmark
  buildAcknowledgementsImportsCommand() {
    const { sources } = pldbBase
    const sourcesTable =
      `list\n` +
      sources.map(s => ` - <a href="https://${s}">${s}</a>`).join("\n")

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

    const writtenInTable = writtenIn
      .map(
        file =>
          ` - <a href="BASE_URL/languages/${file.permalink}">${file.title}</a>`
      )
      .join("\n")

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

    let contributorsTable = ""
    try {
      contributorsTable =
        `list\n` +
        JSON.parse(Disk.read(path.join(pagesDir, "contributors.json")))
          .filter(item => item.login !== "codelani" && item.login !== "breck7")
          .map(item => ` - <a href="${item.html_url}">${item.login}</a>`)
          .join("\n")
    } catch (err) {}

    Disk.write(
      path.join(listsFolder, "acknowledgementsImports.scroll"),
      `importOnly
replace WRITTEN_IN_TABLE
 ${writtenInTable}
replace PACKAGES_TABLE
 ${packageTable}
replace SOURCES_TABLE
 ${sourcesTable}
replace CONTRIBUTORS_TABLE
 ${contributorsTable}`
    )
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
      path.join(siteFolder, "searchIndex.json"),
      JSON.stringify(objects, null, 2)
    )
  }

  @benchmark
  buildKeywordsOneHot() {
    Disk.write(
      path.join(siteFolder, "keywordsOneHot.csv"),
      new TreeNode(pldbBase.keywordsOneHot).toCsv()
    )
  }

  @benchmark
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

    const csvImports = `importOnly

replace LANG_COUNT ${pldbBase.topLanguages.length}
replace COL_COUNT ${colNamesForCsv.length}
replace ENTITY_COUNT ${pldbBase.length}
replace ENTITIES_FILE_SIZE_UNCOMPRESSED ${numeral(pldbCsv.length).format(
      "0.0b"
    )}
replace LANGS_FILE_SIZE_UNCOMPRESSED ${numeral(langsCsv.length).format("0.0b")}
replace COLUMN_METADATA_TABLE
 pipeTable
  ${columnsMetadataTree
    .toDelimited("|", columnMetadataColumnNames)
    .replace(/\n/g, "\n  ")}
`

    Disk.write(path.join(publishedDocsFolder, "csvImports.scroll"), csvImports)
  }

  @benchmark
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

    const vars = [100, 250, 500, 1000].map(
      num => `replace TOP_${num}\n
${toScrollTable(new TreeNode(files.slice(0, num)), [
  "title",
  "titleLink",
  "appeared",
  "type",
  "rank"
])}`
    )

    Disk.write(
      path.join(listsFolder, "topLangsImports.scroll"),
      `importOnly
${vars}`
    )
  }

  @benchmark
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

    const sorted = lodash.sortBy(files, "rank")
    const table = toScrollTable(new TreeNode(sorted), [
      "name",
      "nameLink",
      "extensions"
    ])

    Disk.write(
      path.join(listsFolder, "extensionsImports.scroll"),
      `importOnly
replace EXTENSION_COUNT ${numeral(allExtensions.size).format("0,0")}
replace TABLE
 ${table}`
    )
  }

  @benchmark
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

    files = lodash.sortBy(files, "rank")

    const entitiesTable = toScrollTable(new TreeNode(files), [
      "title",
      "titleLink",
      "type",
      "appeared",
      "rank"
    ])

    Disk.write(
      path.join(listsFolder, "entitiesImports.scroll"),
      `importOnly
replace COUNT ${numeral(Object.values(files).length).format("0,0")}
replace TABLE
 ${entitiesTable}`
    )
  }

  @benchmark
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

    const sorted = lodash.sortBy(files, "rank")

    const langsTable = toScrollTable(new TreeNode(sorted), [
      "title",
      "titleLink",
      "type",
      "appeared",
      "rank"
    ])

    Disk.write(
      path.join(listsFolder, "languagesImports.scroll"),
      `importOnly
replace COUNT ${numeral(Object.values(sorted).length).format("0,0")}
replace TABLE
 ${langsTable}`
    )
  }

  @benchmark
  buildFeaturesImports() {
    const { topFeatures } = pldbBase

    const featuresTable = toScrollTable(new TreeNode(topFeatures), [
      "feature",
      "featureLink",
      "pseudoExample",
      "yes",
      "no",
      "percentage"
    ])

    Disk.write(
      path.join(listsFolder, "featuresImports.scroll"),
      `importOnly
replace COUNT ${numeral(Object.values(topFeatures).length).format("0,0")}
replace TABLE
 ${featuresTable}`
    )
  }

  @benchmark
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

    const theTable = toScrollTable(new TreeNode(sorted), [
      "name",
      "languages",
      "count"
    ])

    Disk.write(
      path.join(listsFolder, "corporationsImports.scroll"),
      `importOnly
replace COUNT ${numeral(Object.values(entities).length).format("0,0")}
replace TABLE
 ${theTable}`
    )
  }

  @benchmark
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

    const theTable = toScrollTable(new TreeNode(sorted), [
      "name",
      "languages",
      "count",
      "topRank"
    ])

    Disk.write(
      path.join(listsFolder, "corporationsImports.scroll"),
      `importOnly
replace COUNT ${numeral(Object.values(creators).length).format("0,0")}
replace TABLE
 ${theTable}`
    )
  }
}

export { SiteBuilder }

if (!module.parent)
  runCommand(new SiteBuilder(), process.argv[2], process.argv[3])
