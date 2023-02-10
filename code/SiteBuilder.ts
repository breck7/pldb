#!/usr/bin/env node

/*

* To investigate slowdowns:

code
 node --cpu-prof --cpu-prof-name=test.cpuprofile ./code/SiteBuilder.js buildAll

* Then:

- open a new Chrome tab
- open devtools
- click Performance
- click "Load Profile..."
- select your test.cpuprofile
*/

const lodash = require("lodash")
const path = require("path")
const dayjs = require("dayjs")
const numeral = require("numeral")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFolder } = require("scroll-cli")
const shell = require("child_process").execSync

import { PLDBFolder } from "./Folder"

const pldbBase = PLDBFolder.getBase().loadFolder()
const codeDir = __dirname
const rootDir = path.join(codeDir, "..")
const siteFolder = path.join(rootDir, "site")
const pagesDir = path.join(siteFolder, "pages")
const publishedDocsFolder = path.join(siteFolder, "docs")
const publishedPagesFolder = path.join(siteFolder, "pages")
const listsFolder = path.join(siteFolder, "lists")
const publishedPostsFolder = path.join(siteFolder, "posts")
const publishedFeaturesFolder = path.join(siteFolder, "features")
const publishedLanguagesFolder = path.join(siteFolder, "languages") // Todo: eventually redirect away from /languages?
import { FeatureSummary } from "./Interfaces"

const buildAllList = []
const buildAll: MethodDecorator = (
  target: Object,
  prop: PropertyKey,
  descriptor: PropertyDescriptor
): void => {
  buildAllList.push(prop)
}

const benchmarkResults = []
const benchmark: MethodDecorator = (
  target: Object,
  prop: PropertyKey,
  descriptor: PropertyDescriptor
): void => {
  const method: Function = descriptor.value
  const meter: any = typeof performance !== "undefined" ? performance : Date

  descriptor.value = function(): any {
    const action: Function = method.apply.bind(method, this, arguments)
    const start = meter.now()
    const result: any = action()
    const elapsed = lodash.round((meter.now() - start) / 1000, 3)
    benchmarkResults.push({
      step: benchmarkResults.length,
      methodName: String(prop),
      timeInSeconds: elapsed
    })
    return result
  }
}

const buildImportsFile = (filepath, varMap) => {
  Disk.writeIfChanged(
    filepath,
    `importOnly\n\n` +
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

          if (!value.includes("\n")) return `replace ${key} ${value}`

          return `replace ${key}
 ${value.replace(/\n/g, "\n ")}`
        })
        .join("\n\n")
  )
}

class SiteBuilder {
  buildAllCommand() {
    let lastMethodName = ""
    buildAllList.forEach((methodName, index) => {
      if (lastMethodName) console.log(`Finished: ${lastMethodName}`)
      console.log(`${index}. Running ${methodName}`)
      this[methodName]()
      lastMethodName = methodName
    })
    console.log(`Finished: ${lastMethodName}`)
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
  buildFeaturePagesCommand() {
    pldbBase.features.forEach(feature =>
      Disk.writeIfChanged(
        path.join(publishedFeaturesFolder, `${feature.id}.scroll`),
        feature.toScroll()
      )
    )
  }

  @benchmark
  @buildAll
  buildDatabasePagesCommand() {
    pldbBase.forEach(file => file.writeScrollFileIfChanged())
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
      "explorer",
      "gitignore"
    ].map(s => pldbBase.getFile(pldbBase.searchForEntity(s)))

    const npmPackages = Object.keys({
      ...require("../package.json").dependencies,
      ...require("./crawlers/package.json").dependencies
    })
    npmPackages.sort()

    buildImportsFile(path.join(pagesDir, "acknowledgementsImports.scroll"), {
      WRITTEN_IN_TABLE: lodash
        .sortBy(writtenIn, "rank")
        .map(file => `- ${file.title}\n link ../languages/${file.permalink}`)
        .join("\n"),
      PACKAGES_TABLE: npmPackages
        .map(s => `- ${s}\n https://www.npmjs.com/package/${s}`)
        .join("\n"),
      SOURCES_TABLE: sources.map(s => `- ${s}\n https://${s}`).join("\n"),
      CONTRIBUTORS_TABLE: JSON.parse(
        Disk.read(path.join(pagesDir, "contributors.json"))
      )
        .filter(
          item =>
            item.login !== "codelani" &&
            item.login !== "breck7" &&
            item.login !== "pldbbot"
        )
        .map(item => `- ${item.login}\n ${item.html_url}`)
        .join("\n")
    })
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

    Disk.writeIfChanged(path.join(siteFolder, "pldb.csv"), pldbCsv)
    Disk.writeIfChanged(path.join(siteFolder, "languages.csv"), langsCsv)
    Disk.writeIfChanged(path.join(siteFolder, "columns.csv"), columnsCsv)

    buildImportsFile(path.join(publishedDocsFolder, "csvImports.scroll"), {
      LANG_COUNT: pldbBase.topLanguages.length,
      APPROXIMATE_FACT_COUNT: numeral(pldbBase.factCount).format("0,0a"),
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
    const pages = [1000]
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

    files.forEach(file => {
      let extensionsLength: number = file.extensions.split(" ").length
      file.numberOfExtensions = extensionsLength
    })

    const rows = lodash.sortBy(files, "rank")

    buildImportsFile(path.join(listsFolder, "extensionsImports.scroll"), {
      EXTENSION_COUNT: numeral(allExtensions.size).format("0,0"),
      TABLE: {
        rows,
        header: ["name", "nameLink", "extensions", "numberOfExtensions"]
      },
      LANG_WITH_DATA_COUNT: files.length
    })
  }

  @benchmark
  @buildAll
  buildFeaturesImports() {
    const { topFeatures } = pldbBase

    const summaries: FeatureSummary[] = topFeatures.map(
      feature => feature.summary
    )

    buildImportsFile(path.join(listsFolder, "allFeaturesImports.scroll"), {
      COUNT: numeral(summaries.length).format("0,0"),
      TABLE: {
        rows: summaries,
        header: [
          "title",
          "titleLink",
          "pseudoExample",
          "yes",
          "no",
          "percentage"
        ]
      }
    })

    const atLeast10 = summaries.filter(
      (feature: any) => feature.measurements > 9
    )

    buildImportsFile(path.join(listsFolder, "featuresImports.scroll"), {
      COUNT: numeral(atLeast10.length).format("0,0"),
      TABLE: {
        rows: atLeast10,
        header: [
          "title",
          "titleLink",
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
  buildOriginCommunitiesImports() {
    const files = lodash.sortBy(
      pldbBase.filter(file => file.isLanguage && file.originCommunity.length),
      "languageRank"
    )

    const entities = pldbBase.groupByListValues("originCommunity", files)
    const rows = Object.keys(entities).map(name => {
      const group = entities[name]
      const languages = group
        .map(lang => `<a href='../languages/${lang.id}.html'>${lang.title}</a>`)
        .join(" - ")
      const count = group.length
      const top = -Math.min(...group.map(lang => lang.languageRank))

      const wrappedName = `<a name='${lodash.camelCase(name)}' />${name}`

      return { name: wrappedName, languages, count, top }
    })
    const sorted = lodash.sortBy(rows, ["count", "top"])
    sorted.reverse()

    buildImportsFile(
      path.join(listsFolder, "originCommunitiesImports.scroll"),
      {
        TABLE: {
          rows: sorted,
          header: ["count", "name", "languages"]
        },
        COUNT: numeral(Object.values(entities).length).format("0,0")
      }
    )
  }

  @benchmark
  @buildAll
  buildCreatorsImports() {
    const entities = pldbBase.groupByListValues(
      "creators",
      pldbBase.filter(file => file.isLanguage),
      " and "
    )
    const wikipediaLinks = new TreeNode(
      Disk.read(path.join(listsFolder, "creators.tree"))
    )

    const rows = Object.keys(entities).map(name => {
      const group = lodash.sortBy(entities[name], "languageRank")
      const person = wikipediaLinks.nodesThatStartWith(name)[0]
      const anchorTag = lodash.camelCase(name)

      return {
        name: !person
          ? `<a name='${anchorTag}' />${name}`
          : `<a name='${anchorTag}' href='https://en.wikipedia.org/wiki/${person.get(
              "wikipedia"
            )}'>${name}</a>`,
        languages: group
          .map(
            file => `<a href='../languages/${file.permalink}'>${file.title}</a>`
          )
          .join(" - "),
        count: group.length,
        topRank: group[0].languageRank + 1
      }
    })

    buildImportsFile(path.join(listsFolder, "creatorsImports.scroll"), {
      TABLE: {
        rows: lodash.sortBy(rows, "topRank"),
        header: ["name", "languages", "count", "topRank"]
      },
      COUNT: numeral(Object.values(entities).length).format("0,0")
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
      NEW_POSTS: postsScroll
        .getGroup("index")
        .slice(0, 5)
        .map(file => `<a href="./posts/${file.permalink}">${file.title}</a>`)
        .join("<br>")
    })
  }

  @buildAll
  @benchmark
  buildScrollsCommand() {
    const folders = [
      siteFolder,
      listsFolder,
      publishedLanguagesFolder,
      publishedPagesFolder,
      publishedDocsFolder,
      publishedPostsFolder,
      publishedFeaturesFolder
    ]
    const didSiteFolderChange = new ScrollFolder(siteFolder).buildNeeded
    folders.forEach(folderPath => {
      const folder = new ScrollFolder(folderPath).silence()
      if (didSiteFolderChange) {
        folder.buildFiles()
        console.log(
          `Ran scroll build in ${folderPath} because site folder changed`
        )
      } else if (folder.buildNeeded) {
        folder.buildFiles()
        console.log(
          `Ran scroll build in ${folderPath} because site folder changed`
        )
      }
    })
  }
}

export { SiteBuilder }

if (!module.parent)
  Utils.runCommand(new SiteBuilder(), process.argv[2], process.argv[3])
