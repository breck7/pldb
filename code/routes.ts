import { PLDBBaseFolder } from "./PLDBBase"
import {
  nameToAnchor,
  replaceNext,
  replaceNode,
  toScrollTable,
  htmlEscaped
} from "./utils"

const lodash = require("lodash")
const numeral = require("numeral")
const path = require("path")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
const blogFolder = path.join(__dirname, "..", "blog")

class SearchRoutes {
  constructor() {
    pldbBase.loadFolder()
  }
  search(query, format, url = ""): string {
    const regex = new RegExp(query, "i")
    const escapedQuery = htmlEscaped(query)
    const hits = pldbBase.filter(file => file.toString().match(regex))

    const nameHits = pldbBase.filter(file =>
      file.names.some(name => name.match(regex))
    )

    const ids = new Set(hits.map(file => file.id))

    if (format === "json") {
      const { typedMap } = pldbBase
      const rows = Array.from(ids).map((id: string) => typedMap[id])
      return JSON.stringify(rows, null, 2)
    }

    if (format === "csv") {
      const { colNamesForCsv, objectsForCsv } = pldbBase
      const rows = objectsForCsv.filter(item => ids.has(item.pldbId))
      return new TreeNode(rows).toDelimited(",", colNamesForCsv)
    }

    const baseUrl = "https://pldb.com/languages/"

    const highlightHit = file => {
      const line = file
        .toString()
        .split("\n")
        .find(line => line.match(regex))
      return line.replace(query, `<b>${query}</b>`)
    }
    const searchResults = hits
      .map(
        file =>
          ` <a href="${baseUrl}${file.permalink}">${
            file.title
          }</a> - ${file.get("type")} #${file.rank} - ${highlightHit(file)}`
      )
      .join("<br>\n")

    const nameResults = nameHits
      .map(
        file =>
          ` <a href="${baseUrl}${file.permalink}">${
            file.title
          }</a> - ${file.get("type")} #${file.rank}`
      )
      .join("<br>\n")

    return `paragraph
 ${nameHits.length} name matches for "${escapedQuery}" shown below.

html
${nameResults}

paragraph
 ${hits.length} full text matches for "${escapedQuery}" shown below. <a href="${url}&format=csv">CSV</a> | <a href="${url}&format=json">JSON</a>

html
 ${searchResults}`
  }
}

class ListRoutes {
  constructor() {
    pldbBase.loadFolder()
  }

  private makeTopPage(num) {
    const pagePath = path.join(blogFolder, `lists`, `top${num}.scroll`)
    const page = new TreeNode(Disk.read(pagePath))

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

    replaceNode(
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

    return page.toString()
  }

  get top100() {
    return this.makeTopPage(100)
  }

  get top250() {
    return this.makeTopPage(250)
  }

  get top500() {
    return this.makeTopPage(500)
  }

  get top1000() {
    return this.makeTopPage(1000)
  }

  get keywords() {
    const pagePath = path.join(blogFolder, "lists", "keywords.scroll")
    const page = new TreeNode(Disk.read(pagePath))

    const langsWithKeywords = pldbBase.topLanguages.filter(file =>
      file.has("keywords")
    )

    const theWords = {}
    langsWithKeywords.forEach(file => {
      file.keywords.forEach(word => {
        const escapedWord = "Q" + word.toLowerCase() // b.c. you cannot have a key "constructor" in JS objects.

        if (!theWords[escapedWord])
          theWords[escapedWord] = {
            keyword: escapedWord,
            count: 0,
            langs: []
          }

        const entry = theWords[escapedWord]

        entry.langs.push(
          `<a href='../languages/${file.permalink}'>${file.title}</a>`
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

    replaceNode(
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

    return page.toString()
  }

  get extensions() {
    const pagePath = path.join(blogFolder, "lists", "extensions.scroll")
    const page = new TreeNode(Disk.read(pagePath))

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
    files.forEach(file => {
      file.extensions.split(" ").forEach(ext => allExtensions.add(ext))
    })

    const sorted = lodash.sortBy(files, "rank")

    replaceNode(
      page,
      "comment autogenExtensionsMessage",
      `aftertext
 Here is the list of ${numeral(allExtensions.size).format(
   "0,0"
 )} unique file extensions across ${numeral(sorted.length).format(
        "0,0"
      )} languages in the PLDB.`
    )

    replaceNode(
      page,
      "comment autogenExtensionsTable",
      toScrollTable(new TreeNode(sorted), ["name", "nameLink", "extensions"])
    )

    return page.toString()
  }

  get entities() {
    const pagePath = path.join(blogFolder, "lists", "entities.scroll")
    const page = new TreeNode(Disk.read(pagePath))

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

    replaceNode(
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

    return page
      .toString()
      .replace(
        /list of all .+ entities/,
        `list of all ${numeral(files.length).format("0,0")} entities`
      )
  }

  get languages() {
    const pagePath = path.join(blogFolder, "lists", "languages.scroll")
    const page = new TreeNode(Disk.read(pagePath))

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

    replaceNode(
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

    return page
      .toString()
      .replace(
        /currently has .+ languages/,
        `currently has ${numeral(sorted.length).format("0,0")} languages`
      )
  }

  get features() {
    const pagePath = path.join(blogFolder, "lists", "features.scroll")
    const page = new TreeNode(Disk.read(pagePath))
    const { topFeatures } = pldbBase

    replaceNode(
      page,
      "comment autogenFeatures",
      toScrollTable(new TreeNode(topFeatures), [
        "feature",
        "featureLink",
        "psuedoExample",
        "yes",
        "no",
        "percentage"
      ])
    )

    return page
      .toString()
      .replace(
        /A list of .+ features/,
        `A list of ${numeral(topFeatures.length).format("0,0")} features`
      )
  }

  get corporations() {
    const pagePath = path.join(blogFolder, "lists", "corporations.scroll")
    const page = new TreeNode(Disk.read(pagePath))

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

    replaceNode(page, "comment autogenCorporations", theTable)

    const newCount = numeral(Object.values(entities).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of .+ corporations/, `list of ${newCount} corporations`)

    return text
  }

  get creators() {
    const pagePath = path.join(blogFolder, "lists", "creators.scroll")
    const page = new TreeNode(Disk.read(pagePath))

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
      page
        .find(node => node.getLine().startsWith("comment WikipediaPages"))
        .childrenToString()
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

    replaceNode(page, "comment autogenCreators", theTable)

    const newCount = numeral(Object.values(creators).length).format("0,0")
    const text = page
      .toString()
      .replace(/list of .+ people/, `list of ${newCount} people`)

    return text
  }
}

export { ListRoutes, SearchRoutes }
