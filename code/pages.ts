const dayjs = require("dayjs")
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
  toCommaList,
  linkMany
} from "./utils"

const currentYear = new Date().getFullYear()

class LanguagePageTemplate {
  constructor(file: PLDBFile) {
    this.file = file
    this.object = file.toObject()
    this.id = this.file.id
  }

  makeATag(permalink) {
    const file = this.file.base.getFile(permalink)
    return `<a href="${permalink}.html">${file.title}</a>`
  }

  protected object: pldbNode
  protected file: PLDBFile // todo: fix type
  protected id: string

  get trendingRepos() {
    const { file } = this
    const { title } = file
    const count = file.get(
      `${pldbNodeKeywords.githubLanguage} trendingProjectsCount`
    )
    if (parseInt(count) > 0) {
      const table = file.getNode("githubLanguage trendingProjects")
      const githubId = file.get("githubLanguage")

      if (!table) {
        console.log(`Error with ${this.id}`)
        return ""
      }

      const tree = TreeNode.fromSsv(table.childrenToString())
      tree.forEach(child => {
        child.set("repo", child.get("name"))
        child.set("repoLink", child.get("url"))
      })
      return `foldBreak
subsection Trending <a href="https://github.com/trending/${githubId}?since=monthly">${title} repos</a> on GitHub
commaTable
 ${cleanAndRightShift(
   tree.toDelimited(",", ["repo", "repoLink", "stars", "description"])
 )}
`
    }
    return ""
  }

  get semanticScholar() {
    const { file } = this
    const { title } = file
    const items = file.getNode(`semanticScholar`)
    if (!items) return ""

    if (items.getContent() === "0") return ""

    const tree = TreeNode.fromDelimited(items.childrenToString(), "|")
    tree.forEach(child => {
      child.set(
        "titleLink",
        `https://www.semanticscholar.org/paper/${child.get("paperId")}`
      )
    })
    return `foldBreak
subsection Publications about ${title} from Semantic Scholar.
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", [
     "title",
     "titleLink",
     "authors",
     "year",
     "citations",
     "influentialCitations"
   ])
 )}
`
  }

  get isbndb() {
    const { file } = this
    const { title } = file
    const isbndb = file.getNode(`isbndb`)
    if (!isbndb) return ""

    if (isbndb.getContent() === "0") return ""

    const tree = TreeNode.fromDelimited(isbndb.childrenToString(), "|")
    tree.forEach(child => {
      child.set("titleLink", `https://isbndb.com/book/${child.get("isbn13")}`)
    })
    return `foldBreak
subsection Books about ${title} from ISBNdb.com.
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", ["title", "titleLink", "authors", "year", "publisher"])
 )}
`
  }

  get goodreads() {
    const { file } = this
    const { title } = file
    const goodreads = file.getNode(`goodreads`) // todo: the goodreadsIds we have are wrong.
    if (!goodreads) return ""

    const tree = TreeNode.fromDelimited(goodreads.childrenToString(), "|")
    tree.forEach(child => {
      child.set(
        "titleLink",
        `https://www.goodreads.com/search?q=${child.get("title") +
          " " +
          child.get("author")}`
      )
    })
    return `foldBreak
subsection Books about ${title} on goodreads
pipeTable
 ${cleanAndRightShift(
   tree.toDelimited("|", [
     "title",
     "titleLink",
     "author",
     "year",
     "reviews",
     "ratings",
     "rating"
   ])
 )}
`
  }

  get publications() {
    const { file } = this
    const { title } = file
    const dblp = file.getNode(`dblp`)
    if (dblp && dblp.get("hits") !== "0") {
      const tree = TreeNode.fromDelimited(
        dblp.getNode("publications").childrenToString(),
        "|"
      )
      tree.forEach(child => {
        child.set(
          "titleLink",
          child.get("doi")
            ? `https://doi.org/` + child.get("doi")
            : child.get("url")
        )
      })
      return `foldBreak
subsection ${dblp.get(
        "hits"
      )} publications about ${title} on <a href="${file.get("dblp")}">DBLP</a>
pipeTable
 ${cleanAndRightShift(tree.toDelimited("|", ["title", "titleLink", "year"]))}
`
    }
    return ""
  }

  get featuresTable() {
    const { file } = this
    const featuresTable = file.getNode(`features`)
    if (!featuresTable) return ""

    const { featuresMap } = file.base

    const table = new TreeNode()
    featuresTable.forEach(node => {
      const feature = featuresMap.get(node.getWord(0))
      if (!feature) {
        console.log(`${node.getWord(0)} not found`)
        return
      }

      const tokenPath = feature.token
      const supported = node.getContent() === "true"

      table
        .appendLineAndChildren(
          `row`,
          `Feature ${feature.feature}
FeatureLink ${feature.featureLink}
Supported ${supported ? "✓" : "ϴ"}
Example
Token ${supported && tokenPath ? file.get(tokenPath) ?? "" : ""}`
        )
        .touchNode("Example")
        .setChildren(node.childrenToString())
    })

    return `foldBreak
subsection Language <a href="../lists/features.html">features</a>

treeTable
 ${table
   .sortBy(["Supported", "Example"])
   .reverse()
   .toString()
   .replace(/\n/g, "\n ")}`
  }

  get hackerNewsTable() {
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
      row.set("date", dayjs(row.get("time")).format("MM/DD/YYYY"))
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

    if (title.includes("%20")) throw new Error("bad space in title: " + title)

    return `title ${title}

htmlTitle ${title} - ${lodash.upperFirst(typeName)}
sourceLink https://github.com/breck7/pldb/blob/main/database/things/${
      this.id
    }.pldb

paragraph
 ${this.description}

${this.kpiBar}

${this.tryNowRepls}

${this.monacoEditor}

${this.descriptionSection}

${this.factsSection}

${this.exampleSection}

${this.keywordsSection}

${this.featuresTable}

${this.trendingRepos}

${this.goodreads}

${this.isbndb}

${this.semanticScholar}

${this.publications}

${this.hackerNewsTable}

${this.keyboardNavigation}
`
  }

  get monacoEditor() {
    const { file } = this
    const monaco = file.get("monaco")
    if (!monaco) return ""

    const example = file.allExamples[0]
      ? file.allExamples[0].code.replace(/\n/g, "\n ")
      : ""

    if (example.includes("`"))
      console.error(
        `WARNING: backtick detected in a monaco example. Not supported yet.`
      )

    return `monacoEditor ${monaco}
 ${example}`
  }

  get prevPage() {
    return this.file.previousRanked.id
  }

  get nextPage() {
    return this.file.nextRanked.id
  }

  get keyboardNavigation() {
    return `html
 <script>
  Mousetrap.bind("left", () => {window.location = "${this.prevPage}.html"})
  Mousetrap.bind("right", () => {window.location = "${this.nextPage}.html"})
 </script>`
  }

  get factsSection() {
    const { facts } = this
    return `list
${facts.map(fact => ` - ${fact}`).join("\n")}`
  }

  get description() {
    const { typeName, title, creators } = this.file
    const { object } = this
    let akaMessage = object.standsFor ? `, aka ${object.standsFor},` : ""
    const appeared = object.appeared

    let creatorsStr = ""
    if (creators.length) {
      creatorsStr =
        ` by ` +
        creators
          .map(
            name =>
              `<a href="../lists/creators.html#${nameToAnchor(
                name
              )}">${name}</a>`
          )
          .join(" and ")
    }

    return `${title}${akaMessage} is ${getIndefiniteArticle(typeName)} ${
      this.typeLink
    }${
      appeared
        ? ` created in <a href="../lists/languages.html?filter=${appeared}">${appeared}</a>`
        : ""
    }${creatorsStr}.`
  }

  get typeLink() {
    return `<a href="../lists/languages.html?filter=${this.object.type}">${this.file.typeName}</a>`
  }

  get descriptionSection() {
    const { file, object } = this
    let description = ""
    const wikipediaSummary = file.get("wikipedia summary")
    const ghDescription = file.get("githubRepo description")
    const wpLink = file.get(pldbNodeKeywords.wikipedia)
    if (wikipediaSummary)
      description =
        wikipediaSummary
          .split(". ")
          .slice(0, 3)
          .join(". ") + `. <a href="${wpLink}">Read more on Wikipedia...</a>`
    else if (object.description) description = object.description
    else if (ghDescription) description = ghDescription
    return `paragraph
 ${description}`
  }

  get facts() {
    const { object, file } = this
    const { title } = file

    const facts = []

    const website = object.website
    if (website) facts.push(`the <a href="${website}">${title} website</a>`)

    const wikipediaLink = file.get("wikipedia")
    const wikiLink = wikipediaLink ? wikipediaLink : ""
    if (wikiLink)
      facts.push(`the <a href="${wikiLink}">${title} Wikipedia page</a>`)

    const githubRepo = file.getNode("githubRepo")
    if (githubRepo) {
      const stars = githubRepo.get("stars")
      const starMessage = stars
        ? ` and has ${numeral(stars).format("0,0")} stars`
        : ""
      facts.push(
        `${title} is developed on <a href="${githubRepo.getWord(
          1
        )}">GitHub</a>${starMessage}`
      )
    }

    const gitlabRepo = object.gitlab
    if (gitlabRepo) facts.push(`<a href="${gitlabRepo}">${title} on GitLab</a>`)

    const supersetOf = file.supersetFile
    if (supersetOf) facts.push(`${title} is a superset of ${supersetOf.link}`)

    const { corporateDevelopers } = file
    let corporateDevelopersStr = ""
    if (corporateDevelopers.length) {
      corporateDevelopersStr = corporateDevelopers
        .map(
          name =>
            `<a href="../lists/corporations.html#${nameToAnchor(
              name
            )}">${name}</a>`
        )
        .join(" and ")
      facts.push(`${title} is backed by ${corporateDevelopersStr}`)
    }

    const { numberOfJobs } = file
    const jobs = numberOfJobs > 10 ? numeral(numberOfJobs).format("0a") : ""
    if (jobs)
      facts.push(
        `PLDB estimates there are currently ${jobs} job openings for ${title} programmers.`
      )

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
          .map(link => this.makeATag(link))
          .join(" or ")}`
      )

    const writtenIn = file.get("writtenIn")
    if (writtenIn)
      facts.push(
        `${title} is written in ${writtenIn
          .split(" ")
          .map(link => this.makeATag(link))
          .join(" & ")}`
      )

    const twitter = object.twitter
    if (twitter)
      facts.push(
        `the ${title} team is on <a href="https://twitter.com/${twitter}">Twitter</a>`
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

    const firstAnnouncement = file.get("firstAnnouncement")
    const announcementMethod = file.get("announcementMethod")
    if (firstAnnouncement)
      facts.push(
        `<a href="${firstAnnouncement}">First announcement of</a> ${title}${
          announcementMethod ? " via " + announcementMethod : ""
        }`
      )

    const subreddit = file.get("subreddit")
    if (subreddit) {
      const peNum = numeral(
        file.getMostRecentInt("subreddit memberCount")
      ).format("0,0")
      facts.push(
        `There are ${peNum} members in the <a href="https://reddit.com/r/${subreddit}">${title} subreddit</a>`
      )
    }

    const pe = file.get("projectEuler")
    if (pe) {
      const peNum = numeral(
        file.getMostRecentInt("projectEuler memberCount")
      ).format("0,0")
      facts.push(
        `There are ${peNum} <a href="https://projecteuler.net/language=${pe}">Project Euler</a> users using ${title}`
      )
    }

    const soSurvey = file.getNode("stackOverflowSurvey 2021")
    if (soSurvey) {
      let fact = `In the 2021 StackOverflow <a href="https://insights.stackoverflow.com/survey">developer survey</a> ${title} programmers reported a median salary of $${numeral(
        soSurvey.get("medianSalary")
      ).format("0,0")}. `

      fact += `${lodash.round(
        parseFloat(soSurvey.get("percentageUsing")) * 100,
        2
      )}% of respondents reported using ${title}. `

      fact += `${numeral(soSurvey.get("users")).format(
        "0,0"
      )} programmers reported using ${title}, and ${numeral(
        soSurvey.get("fans")
      ).format("0,0")} said they wanted to use it`

      facts.push(fact)
    }

    const rosettaCode = file.get("rosettaCode")
    if (rosettaCode)
      facts.push(
        `Explore ${title} snippets on <a href="http://www.rosettacode.org/wiki/Category:${rosettaCode}">Rosetta Code</a>`
      )

    const nativeLanguage = file.get("nativeLanguage")
    if (nativeLanguage)
      facts.push(
        `${title} is written with the native language of ${nativeLanguage}`
      )

    const gdb = file.get("gdbSupport")
    if (gdb)
      facts.push(
        `${title} is supported by the <a href="https://www.sourceware.org/gdb/">GDB</a>`
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

    const esolang = file.get("esolang")
    if (esolang)
      facts.push(`${title} is listed on <a href="${esolang}">Esolang</a>`)

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
        `There is a <a href="codemirror.html">CodeMirror</a> <a href="https://github.com/codemirror/codemirror5/tree/master/mode/${codeMirror}">package</a> for syntax highlighting ${title}`
      )

    const monaco = file.get("monaco")
    if (monaco)
      facts.push(
        `There is a <a href="monaco.html">Monaco</a> <a href="https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages/${monaco}">package</a> for syntax highlighting ${title}`
      )

    const pygmentsHighlighter = file.get("pygmentsHighlighter")
    if (pygmentsHighlighter)
      facts.push(
        `<a href="languages/pygments.html">Pygments</a> supports <a href="https://github.com/pygments/pygments/blob/master/pygments/lexers/${file.get(
          "pygmentsHighlighter filename"
        )}">syntax highlighting</a> for ${title}`
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

    const jupyters = file.getAll("jupyterKernel")
    if (jupyters.length === 1)
      facts.push(
        `There is 1 <a href="jupyter-notebook.html">Jupyter</a> <a href="${jupyters[0]}">Kernel</a> for ${title}`
      )
    else if (jupyters.length > 1)
      facts.push(
        `There are ${
          jupyters.length
        } <a href="jupyter-notebook.html">Jupyter</a> Kernels for ${title}: ${jupyters.map(
          (i, index) => `<a href="${i}">${index + 1}</a>`
        )}`
      )

    const packageRepos = file.getAll("packageRepository")
    if (packageRepos.length === 1)
      facts.push(
        `There is a <a href="${packageRepos[0]}">central package repository</a> for ${title}`
      )
    else if (packageRepos.length > 1)
      facts.push(
        `There are ${
          packageRepos.length
        } central package repositories for ${title}: ${linkMany(packageRepos)}`
      )

    const cheatSheetUrl = file.get("cheatSheetUrl")
    if (cheatSheetUrl)
      facts.push(`${title} <a href="${cheatSheetUrl}">cheat sheet</a>`)

    const indeedJobs = file.getNode("indeedJobs")
    if (indeedJobs) {
      const query = file.get("indeedJobs")
      const jobCount = numeral(file.getMostRecentInt("indeedJobs")).format(
        "0,0"
      )
      facts.push(
        `Indeed.com has ${jobCount} matches for <a href="https://www.indeed.com/jobs?q=${query}">"${query}"</a>.`
      )
    }

    const domainRegistered = file.get("domainName registered")
    if (domainRegistered)
      facts.push(
        `<a href="${object.website}">${file.get(
          "domainName"
        )}</a> was registered in ${domainRegistered}`
      )

    const wpRelated = file.get("wikipedia related")
    const seeAlsoLinks = wpRelated ? wpRelated.split(" ") : []
    const related = object.related
    if (related) related.split(" ").forEach(id => seeAlsoLinks.push(id))

    if (seeAlsoLinks.length)
      facts.push(
        "See also: " + seeAlsoLinks.map(link => this.makeATag(link)).join(", ")
      )

    const { otherReferences } = file

    const semanticScholarReferences = otherReferences.filter(link =>
      link.includes("semanticscholar")
    )
    const nonSemanticScholarReferences = otherReferences.filter(
      link => !link.includes("semanticscholar")
    )

    if (semanticScholarReferences.length)
      facts.push(
        `Read more about ${title} on Semantic Scholar: ${linkMany(
          semanticScholarReferences
        )}`
      )
    if (nonSemanticScholarReferences.length)
      facts.push(
        `Read more about ${title} on the web: ${linkMany(
          nonSemanticScholarReferences
        )}`
      )

    facts.push(
      `Have a question about ${title} not answered here? <a href="https://github.com/breck7/pldb/issues/new">Open an issue</a> explaining what you need.`
    )
    facts.push(
      `<a href="https://edit.pldb.com/edit/${file.id}">Edit this page</a>`
    )
    return facts
  }

  get keywordsSection() {
    const keywords = this.file.get("keywords")
    if (!keywords) return ""
    return `subsection <a href="../lists/keywords.html?filter=${this.id}">Keywords</a> in ${this.file.title}
paragraph
 ${keywords}`
  }

  get exampleSection() {
    return this.file.allExamples
      .map(
        example =>
          `subsection Example code from ${
            !example.link
              ? example.source
              : `<a href='${example.link}'>` + example.source + "</a>"
          }:
code
 ${cleanAndRightShift(lodash.escape(example.code), 1)}`
      )
      .join("\n\n")
  }

  get tryNowRepls() {
    const { file } = this

    const repls = []

    const webRepl = file.get("webRepl")
    if (webRepl) repls.push(`<a href="${webRepl}">Web</a>`)

    const rijuRepl = file.get("rijuRepl")
    if (rijuRepl) repls.push(`<a href="${rijuRepl}">Riju</a>`)

    const tryItOnline = file.get("tryItOnline")
    if (tryItOnline)
      repls.push(`<a href="https://tio.run/#${tryItOnline}">TIO</a>`)

    const replit = file.get("replit")
    if (replit)
      repls.push(`<a href="https://repl.it/languages/${replit}">Replit</a>`)

    if (!repls.length) return ""

    return (
      `paragraph
 Try now: ` + repls.join(" · ")
    )
  }

  get kpiBar() {
    const { file, object } = this
    const appeared = object.appeared
    const { numberOfUsers, bookCount, paperCount } = file
    const users =
      numberOfUsers > 10
        ? numberOfUsers < 1000
          ? numeral(numberOfUsers).format("0")
          : numeral(numberOfUsers).format("0.0a")
        : ""

    const lines = [
      file.isLanguage
        ? `#${file.languageRank + 1} <span title="${
            file.langRankDebug
          }">on PLDB</span>`
        : `#${file.rank + 1} on PLDB`,
      isNaN(appeared) ? "" : `${currentYear - appeared} Years Old`,
      users
        ? `${users} <span title="Crude user estimate from a linear model.">Users</span>`
        : "",
      file.isLanguage
        ? `${bookCount} <span title="Books about or leveraging ${file.title}">Books</span>`
        : "",
      paperCount
        ? `${paperCount} <span title="Academic papers about or leveraging ${file.title}">Papers</span>`
        : ""
    ]
      .filter(i => i)
      .join("\n ")

    return `kpiTable
 ${lines}`
  }
}

class FeaturePageTemplate extends LanguagePageTemplate {
  get kpiBar() {
    return ""
  }

  get description() {
    const { typeName, title } = this.file
    const { object } = this
    const isOrAre = title.endsWith("s") ? "are" : "is"

    return `${title} ${isOrAre} ${getIndefiniteArticle(typeName)} ${
      this.typeLink
    }.`
  }

  get prevPage() {
    return this.file.previousRankedFeature.id
  }

  get nextPage() {
    return this.file.nextRankedFeature.id
  }

  get typeLink() {
    return `<a href="../lists/features.html">${this.file.typeName}</a>`
  }

  get exampleSection() {
    const { file } = this
    const { title, featurePath } = file

    const positives = file.languagesWithThisFeature
    const negatives = file.languagesWithoutThisFeature

    const examples = positives
      .filter(file => file.getNode(featurePath).length)
      .map(file => {
        return {
          id: file.id,
          title: file.title,
          example: file.getNode(featurePath).childrenToString()
        }
      })

    const grouped = lodash.groupBy(examples, "example")

    const examplesText = Object.values(grouped)
      .map((group: any) => {
        const id = file.id
        const links = group
          .map(hit => `<a href="${hit.id}.html">${hit.title}</a>`)
          .join(", ")
        return `subsection Example from ${links}:

code
 ${cleanAndRightShift(lodash.escape(group[0].example), 1)}`
      })
      .join("\n\n")

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
      examplesText
    )
  }
}

export { FeaturePageTemplate, LanguagePageTemplate }
