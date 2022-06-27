const moment = require("moment")
const lodash = require("lodash")
const numeral = require("numeral")

import { jtree } from "jtree"
const { TreeNode } = jtree
import { pldbNode, pldbNodeKeywords } from "./types"
import { PLDBFile } from "./PLDBBase"

import {
  cleanAndRightShift,
  getIndefiniteArticle,
  nameToAnchor,
  toCommaList
} from "./utils"

const currentYear = 2022

class LanguagePageTemplate {
  constructor(file: PLDBFile) {
    this.file = file
    this.object = file.toObject()
    this.primaryKey = this.file.primaryKey
  }

  protected object: pldbNode
  protected file: PLDBFile // todo: fix type
  protected primaryKey: string

  _getTrendingRepos() {
    const { file } = this
    const { title } = file
    const count = file.get(
      `${pldbNodeKeywords.githubLanguage} trendingProjectsCount`
    )
    if (parseInt(count) > 0) {
      const table = file.getNode("githubLanguage trendingProjects")
      const githubId = file.get("githubLanguage")

      if (!table) {
        console.log(`Error with ${this.primaryKey}`)
        return ""
      }

      const tree = TreeNode.fromSsv(table.childrenToString())
      tree.forEach(child => {
        child.set(
          "repo",
          `<a href='${child.get("url")}'>${child.get("name")}</a>`
        )
      })
      return `foldBreak
subsection Trending <a href="https://github.com/trending/${githubId}?since=monthly">${title} repos</a> on GitHub
commaTable
 ${cleanAndRightShift(tree.toDelimited(",", ["repo", "stars", "description"]))}
 `
    }
    return ""
  }

  _getHackerNewsTable() {
    const hnTable = this.file
      .getNode(`hackerNewsDiscussions`)
      ?.childrenToString()
    if (!hnTable) return ""

    const table = TreeNode.fromDelimited(hnTable, "|")
    table.forEach(row => {
      row.set(
        "titleLink",
        `https://news.ycombinator.com/item?id=${row.get("id")}`
      )
      row.set("date", moment(row.get("time")).format("MM/DD/YYYY"))
    })

    const delimited = table
      .toDelimited("|", ["title", "titleLink", "date", "score", "comments"])
      .replace(/\n/g, "\n ")
      .trim()
    return `subsection HackerNews discussions of ${this.file.title}

pipeTable
 ${delimited}`
  }

  toScroll() {
    const { typeName, title } = this.file

    const prevFile = this.file.getPrevious()
    const nextFile = this.file.getNext()

    if (title.includes("%20")) throw new Error("bad space in title: " + title)

    return `title ${title}

htmlTitle ${title} - ${lodash.upperFirst(typeName)}
sourceLink https://github.com/breck7/pldb/blob/main/database/things/${
      this.primaryKey
    }.pldb

${this._getDescriptionSection()}

${this._getKpiBar()}

${this._getFactsSection()}

${this._getExampleSection()}

${this._getTrendingRepos()}

${this._getHackerNewsTable()}

html
 <script src="../entityPageLibs.js"></script>
 <script>
  Mousetrap.bind("left", () => {window.location = "${
    prevFile.primaryKey
  }.html"})
  Mousetrap.bind("right", () => {window.location = "${
    nextFile.primaryKey
  }.html"})
 </script>
`
  }

  _getFactsSection() {
    const facts = this._getFacts()
    return `list
${facts.map(fact => ` - ${fact}`).join("\n")}`
  }

  _getDescription() {
    const { typeName, title } = this.file
    const { object } = this
    let statusMessage =
      object.status === "historical"
        ? getIndefiniteArticle(typeName)
        : "an actively used"
    let akaMessage = object.standsFor ? `, aka ${object.standsFor},` : ""
    const appeared = object.appeared
    return `${title}${akaMessage} is ${statusMessage} ${this._getTypeLink()}${
      appeared
        ? ` created in <a href="../lists/languages.html?filter=${appeared}">${appeared}</a>`
        : ""
    }.`
  }

  _getTypeLink() {
    return `<a href="../lists/languages.html?filter=${this.object.type}">${this.file.typeName}</a>`
  }

  _getDescriptionSection() {
    const description = this._getDescription()
    const { file, object } = this
    let longerDescription = ""
    const wikipediaSummary = file.get("wikipedia summary")
    const wpLink = file.get(pldbNodeKeywords.wikipedia)
    if (wikipediaSummary)
      longerDescription +=
        description +
        " " +
        wikipediaSummary
          .split(". ")
          .slice(0, 3)
          .join(". ") +
        `. <a href="${wpLink}">Read more on Wikipedia...</a>`
    else if (object.description)
      longerDescription += description + " " + object.description
    return `paragraph
 ${longerDescription || description}`
  }

  _getRankMessage() {
    const { file } = this
    const { isLanguage, percentile, title } = file
    const bins = [0.01, 0.05, 0.1, 0.25]
    bins.reverse()
    let rankMessage = ""
    const category = isLanguage ? "languages" : "entities I track"
    if (percentile > 0.25) return ""
    else {
      bins.forEach(bin => {
        if (percentile < bin)
          rankMessage = `${title} ranks in the top ${bin * 100}% of ${category}`
      })
    }
    return rankMessage
  }

  _getFacts() {
    const { object, file } = this
    const { title, languageRank } = file

    const facts = []

    const rankMessage = this._getRankMessage()
    if (languageRank < 101) {
      facts.push(
        `${title} <a href="../lists/top100.html">is a top 100</a> language`
      )
    } else if (languageRank < 251) {
      facts.push(
        `${title} <a href="../lists/top250.html">is a top 250</a> language`
      )
    } else if (rankMessage) facts.push(rankMessage)

    const website = object.website
    if (website) facts.push(`the <a href="${website}">${title} website</a>`)

    const wikipediaLink = file.get("wikipedia")
    const wikiLink = wikipediaLink ? wikipediaLink : ""
    if (wikiLink)
      facts.push(`the <a href="${wikiLink}">${title} wikipedia page</a>`)

    const githubRepo = file.getNode("githubRepo")
    if (githubRepo)
      facts.push(
        `${title} is developed on <a href="${githubRepo.getWord(1)}">github</a>`
      )

    const gitlabRepo = object.gitlab
    if (gitlabRepo) facts.push(`<a href="${gitlabRepo}">${title} on GitLab</a>`)

    const appeared = object.appeared
    if (appeared) facts.push(`${title} first appeared in ${appeared}`)

    let creators = object.creators
    if (creators) {
      creators = creators
        .split(" and ")
        .map(
          name =>
            `<a href="../lists/creators.html#${nameToAnchor(name)}">${name}</a>`
        )
        .join(" and ")
      facts.push(`${title} was created by ${creators}`)
    }

    let corporateDevelopers = file.get("corporateDevelopers")
    if (corporateDevelopers) {
      corporateDevelopers = corporateDevelopers
        .split(" and ")
        .map(
          name =>
            `<a href="../lists/corporations.html#${nameToAnchor(
              name
            )}">${name}</a>`
        )
        .join(" and ")
      facts.push(`${title} is backed by ${corporateDevelopers}`)
    }

    const { extensions } = file
    if (extensions)
      facts.push(
        `file extensions for ${title} include ${toCommaList(
          extensions.split(" ")
        )}`
      )

    const compilesTo = file.get("compilesTo")
    if (compilesTo)
      facts.push(
        `${title} compiles to ${compilesTo
          .split(" ")
          .map(id => this._getATag(id))
          .join(" & ")}`
      )

    const writtenIn = file.get("writtenIn")
    if (writtenIn)
      facts.push(
        `${title} is written in ${writtenIn
          .split(" ")
          .map(id => this._getATag(id))
          .join(" & ")}`
      )

    const twitter = object.twitter
    if (twitter)
      facts.push(
        `the ${title} team is on <a href="https://twitter.com/${twitter}">twitter</a>`
      )

    const conferences = file.getNodesByGlobPath("conference")
    if (conferences.length) {
      facts.push(
        `Recurring conference about ${title}: ${conferences.map(
          tree => `<a href="${tree.getWord(1)}">${tree.getWordsFrom(2)}</a>`
        )}`
      )
    }

    const meetup = file.get("meetup")
    if (meetup) {
      const groupCount = numeral(file.get("meetup groupCount")).format("0,0")
      facts.push(
        `Check out the ${groupCount} <a href="https://www.meetup.com/topics/${meetup}/">${title} meetup groups</a> on Meetup.com.`
      )
    }

    let reference = object.reference

    if (reference?.includes("semanticscholar"))
      facts.push(
        `Read more about <a href="${reference}">${title} on Semantic Scholar</a>`
      )
    else if (reference)
      facts.push(`Read more about <a href="${reference}">${title}</a>`)

    const firstAnnouncement = file.get("firstAnnouncement")
    const announcementMethod = file.get("announcementMethod")
    if (firstAnnouncement)
      facts.push(
        `<a href="${firstAnnouncement}">First announcement of</a> ${title}${
          announcementMethod ? " via " + announcementMethod : ""
        }`
      )

    const webRepl = file.get("webRepl")
    if (webRepl)
      facts.push(`Try ${title} on this <a href="${webRepl}">web repl</a>`)

    const subreddit = file.get("subreddit")
    if (subreddit) {
      const peNum = numeral(file.get("subreddit memberCount 2017")).format(
        "0,0"
      )
      facts.push(
        `There are ${peNum} members in the <a href="https://reddit.com/r/${subreddit}">${title} subreddit</a>`
      )
    }

    const pe = file.get("projectEuler")
    if (pe) {
      const peNum = numeral(file.get("projectEuler memberCount 2022")).format(
        "0,0"
      )
      facts.push(
        `There are ${peNum} <a href="https://projecteuler.net/language=${pe}">Project Euler</a> users using ${title}`
      )
    }

    const rosettaCode = file.get("rosettaCode")
    if (rosettaCode)
      facts.push(
        `Explore ${title} snippets on <a href="http://www.rosettacode.org/wiki/Category:${rosettaCode}">Rosetta Code</a>`
      )

    const hopl = file.get("hopl")
    if (hopl)
      facts.push(
        `${title} is listed on <a href="https://hopl.info/showlanguage.prx?exp=${hopl}">HOPL</a>`
      )

    const tiobe = file.get("tiobe")
    const tiobeRank = file.get("tiobe currentRank")
    if (tiobeRank)
      facts.push(
        `${title} ranks #${tiobeRank} in the <a href="https://www.tiobe.com/tiobe-index/">TIOBE Index</a>`
      )
    else if (tiobe)
      facts.push(
        `${title} appears in the <a href="https://www.tiobe.com/tiobe-index/">TIOBE Index</a>`
      )

    const tryItOnline = object.tryItOnline
    if (tryItOnline)
      facts.push(
        `tryitonline has an online <a href="https://tio.run/#${tryItOnline}">${title} repl</a>`
      )

    const replit = object.replit
    if (replit)
      facts.push(
        `replit has an online <a href="https://repl.it/languages/${replit}">${title} repl</a>`
      )

    const ubuntu = file.get("ubuntuPackage")
    if (ubuntu)
      facts.push(
        `There is an <a href="https://packages.ubuntu.com/jammy/${ubuntu}">Ubuntu package</a> for ${title}`
      )

    const antlr = file.get("antlr")
    if (antlr)
      facts.push(
        `Here is an <a href="antlr.html">ANTLR</a> <a href="${antlr}">grammar</a> for ${title}`
      )

    // todo: handle multiple
    const lsp = file.get("languageServerProtocolProject")
    if (lsp)
      facts.push(
        `Here is a ${title} <a href="language-server-protocol.html">LSP</a> <a href="${lsp}">implementation</a>`
      )

    const codeMirror = file.get("codeMirror")
    if (codeMirror)
      facts.push(
        `There is a <a href="codemirror-editor.html">CodeMirror</a> <a href="https://github.com/codemirror/codemirror5/tree/master/mode/${codeMirror}">package</a> for syntax highlighting ${title}`
      )

    const linguist = file.get("linguistGrammarRepo")
    if (linguist)
      facts.push(
        `GitHub supports <a href="${linguist}" title="The package used for syntax highlighting by GitHub Linguist.">syntax highlighting</a> for ${title}`
      )

    const quineRelay = file.get("quineRelay")
    if (quineRelay)
      facts.push(
        `${title} appears in the <a href="https://github.com/mame/quine-relay">Quine Relay</a> project`
      )

    const cheatSheetUrl = file.get("cheatSheetUrl")
    if (cheatSheetUrl)
      facts.push(`${title} <a href="${cheatSheetUrl}">cheat sheet</a>`)

    const indeedJobs = file.getNode("indeedJobs")
    if (indeedJobs) {
      const query = file.get("indeedJobs")
      const jobCount = numeral(file.get("indeedJobs 2017")).format("0,0")
      facts.push(
        `Indeed.com has ${jobCount} matches for <a href="https://www.indeed.com/jobs?q=${query}">"${query}"</a>.`
      )
    }

    const wpRelated = file.get("wikipedia related")
    const seeAlsoLinks = wpRelated ? wpRelated.split(" ") : []
    const related = object.related
    if (related) related.split(" ").forEach(id => seeAlsoLinks.push(id))

    if (seeAlsoLinks.length)
      facts.push(
        "See also: " + seeAlsoLinks.map(id => this._getATag(id)).join(", ")
      )

    facts.push(
      `Have a question about ${title} not answered here? <a href="https://github.com/breck7/pldb/issues/new">Open an issue</a> explaining what you need.`
    )
    return facts
  }

  _getFactCount() {
    return this.file.length
  }

  _getATag(permalink) {
    return `<a href="${permalink}.html">${permalink}</a>`
  }

  _getExampleSection() {
    const exampleSection = []
    let example: any = ""
    let exampleMessage = ""
    const file = this.file

    if ((example = file.getNode("example"))) {
      exampleSection.push(`subsection Example code from the web:
code
 ${cleanAndRightShift(lodash.escape(example.childrenToString()), 1)}`)
    }

    if ((example = file.getNode("helloWorldCollection"))) {
      const link = `http://helloworldcollection.de/#` + example.getWord(1)

      exampleMessage = `Example code from the <a href="${link}">Hello World Collection</a>:`

      exampleSection.push(`subsection ${exampleMessage}
code
 ${cleanAndRightShift(lodash.escape(example.childrenToString()))}`)
    }

    if ((example = file.getNode("linguistGrammarRepo example"))) {
      const linguist_url = file.get("linguistGrammarRepo")
      exampleMessage = `Example code from <a href='${linguist_url}'>Linguist</a>:`

      exampleSection.push(`subsection ${exampleMessage}
code
 ${cleanAndRightShift(lodash.escape(example.childrenToString()))}`)
    }

    if ((example = file.getNode("wikipedia example"))) {
      exampleMessage = `Example code from <a href="${file.get(
        "wikipedia"
      )}">Wikipedia</a>:`

      exampleSection.push(`subsection ${exampleMessage}
code
 ${cleanAndRightShift(lodash.escape(example.childrenToString()))}`)
    }
    return exampleSection.join("\n\n")
  }

  _getKpiBar() {
    const { file, object } = this
    const appeared = object.appeared
    const { numberOfUsers, numberOfJobs } = file
    const users =
      numberOfUsers > 10 ? numeral(numberOfUsers).format("0.0a") : ""
    const jobs = numberOfJobs > 10 ? numeral(numberOfJobs).format("0a") : ""

    const appearedLine = isNaN(appeared)
      ? ""
      : `${currentYear - appeared} Years Old`
    const userLine = users
      ? `${users} <span title="Crude user estimate from a linear model.">Users</span>`
      : ""
    const jobsLine = jobs
      ? `${jobs} <span title="Crude jobs estimate from a linear model.">Jobs</span>`
      : ""

    return `kpiTable
 ${appearedLine}
 ${userLine}
 ${jobsLine}`.trim()
  }
}

class PatternPageTemplate extends LanguagePageTemplate {
  _getKpiBar() {
    const { object } = this
    const appeared = object.appeared

    if (isNaN(appeared)) return ""

    return `kpiTable
 ${currentYear - appeared} Years Old`
  }

  _getTypeLink() {
    return `<a href="../lists/patterns.html">${this.file.typeName}</a>`
  }

  _getFactCount() {
    return (
      super._getFactCount() +
      this._getLanguagesWithThisPatternResearched().length
    )
  }

  _getLanguagesWithThisPatternResearched() {
    const { patternKeyword } = this.object

    return this.file
      .getParent()
      .filter(file => file.getNode("patterns")?.has(patternKeyword))
  }

  _getExampleSection() {
    const { object, file } = this
    const { title } = file
    const { patternKeyword } = object
    const results = this._getLanguagesWithThisPatternResearched()
    const patternPath = `patterns ${patternKeyword}`

    const positives = results.filter(file => file.get(patternPath) === "true")
    const negatives = results.filter(file => file.get(patternPath) === "false")

    const negativeText = negatives.length
      ? `paragraph
 Languages <b>without</b> ${title} include ${negatives
          .map(file => file.link)
          .join(", ")}

`
      : ""

    return (
      negativeText +
      `paragraph
 Languages <b>with</b> ${title} include ${positives
        .map(file => file.link)
        .join(", ")}

` +
      positives
        .filter(file => file.getNode(patternPath).length)
        .map(file => {
          const id = file.primaryKey
          return `subsection Example from <a href="${id}.html">${
            file.title
          }</a>:

code
 ${cleanAndRightShift(
   lodash.escape(file.getNode(patternPath).childrenToString()),
   1
 )}`
        })
        .join("\n\n")
    )
  }

  _getFacts() {
    const facts = super._getFacts()
    const ref = this.object.reference
    if (ref)
      facts.push(`Read more about <a href="${ref}">${this.file.title}</a>`)
    return facts
  }
}

export { PatternPageTemplate, LanguagePageTemplate }
