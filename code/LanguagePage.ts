const dayjs = require("dayjs")
const lodash = require("lodash")
const numeral = require("numeral")

import { jtree } from "jtree"
const { TreeNode } = jtree
import { PLDBFile } from "./File"

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
    this.id = this.file.id
  }

  makeATag(id) {
    const file = this.file.base.getFile(id)
    return `<a href="${file.permalink}">${file.title}</a>`
  }

  protected file: PLDBFile // todo: fix type
  protected id: string

  get trendingRepos() {
    const { file } = this
    const { title } = file
    const count = file.get(`$githubLanguage trendingProjectsCount`)
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
subsection Publications about ${title} from Semantic Scholar
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
subsection Books about ${title} from ISBNdb
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
    const { file } = this
    const { typeName, title, id } = file

    if (title.includes("%20")) throw new Error("bad space in title: " + title)

    return `title ${title}

import settings.scroll
htmlTitle ${title} - ${lodash.upperFirst(typeName)}

viewSourceUrl https://github.com/breck7/pldb/blob/main/database/things/${id}.pldb

paragraph
 ${this.description}

${this.kpiBar}

${this.tryNowRepls}

${this.monacoEditor}

${this.image}

${this.descriptionSection}

${this.factsSection}

html
 <br>

${this.exampleSection}

${this.funFactSection}

${this.keywordsSection}

${this.featuresTable}

${this.trendingRepos}

${this.goodreads}

${this.isbndb}

${this.semanticScholar}

${this.publications}

${this.hackerNewsTable}

keyboardNav ${this.prevPage} ${this.nextPage}
`
  }

  get image() {
    const { file } = this
    const { title } = file

    let image = file.get("screenshot")
    let caption = `A screenshot of the <a href="../lists/languages.html?filter=visual">visual language</a> ${title}.`
    if (!image) {
      image = file.get("photo")
      caption = `A photo of ${title}.`
    }

    if (!image) return ""

    return `openGraphImage image
image ${image.replace("https://pldb.com/", "../")}
 caption ${caption}`
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
    return this.file.previousRanked.permalink
  }

  get nextPage() {
    return this.file.nextRanked.permalink
  }

  get factsSection() {
    const { facts } = this
    return `list
${facts.map(fact => ` - ${fact}`).join("\n")}`
  }

  get description() {
    const { file } = this
    const { typeName, title, creators, appeared } = file
    const standsFor = file.get("standsFor")
    let akaMessage = standsFor ? `, aka ${standsFor},` : ""

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
    return `<a href="../lists/languages.html?filter=${this.file.type}">${this.file.typeName}</a>`
  }

  get descriptionSection() {
    const { file } = this
    let description = ""
    const authoredDescription = file.get("description")
    const wikipediaSummary = file.get("wikipedia summary")
    const ghDescription = file.get("githubRepo description")
    const wpLink = file.get(`wikipedia`)
    if (wikipediaSummary)
      description =
        wikipediaSummary
          .split(". ")
          .slice(0, 3)
          .join(". ") + `. <a href="${wpLink}">Read more on Wikipedia...</a>`
    else if (authoredDescription) description = authoredDescription
    else if (ghDescription) description = ghDescription
    return `paragraph
 ${description}`
  }

  get facts() {
    const { file } = this
    const { title, website } = file

    const facts = []
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

    const gitlabRepo = file.get("gitlabRepo")
    if (gitlabRepo) facts.push(`<a href="${gitlabRepo}">${title} on GitLab</a>`)


     const documentation = file.getAll("documentation");
        if (documentation){
            if (documentation.length ===1)
                facts.push(`the <a href="${documentation[0]}">${title} docs</a>`);
            else if(documentation.length >1)
                facts.push(`there are ${documentation.length} Docs for ${title}: ${documentation.map((i, index) => `<a href="${i}">${index + 1}</a>`)}`);

        }

    const demoVideo = file.get("demoVideo")
    if (demoVideo)
      facts.push(`A <a href="${demoVideo}">video demo of ${title}</a>`)

    const githubRepoCount = file.get("githubLanguage repos")
    if (githubRepoCount) {
      const url = `https://github.com/search?q=language:${file.get(
        "githubLanguage"
      )}`
      const repoCount = numeral(githubRepoCount).format("0,0")
      facts.push(
        `There are at least ${repoCount} ${title} repos on <a href="${url}">GitHub</a>`
      )
    }

    const supersetOf = file.supersetFile
    if (supersetOf) facts.push(`${title} is a superset of ${supersetOf.link}`)

    const { originCommunity } = file
    let originCommunityStr = ""
    if (originCommunity.length) {
      originCommunityStr = originCommunity
        .map(
          name =>
            `<a href="../lists/originCommunities.html#${nameToAnchor(
              name
            )}">${name}</a>`
        )
        .join(" and ")
      facts.push(`${title} first developed in ${originCommunityStr}`)
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

    const twitter = file.get("twitter")
    if (twitter)
      facts.push(`the ${title} team is on <a href="${twitter}">Twitter</a>`)

    const conferences = file.getNodesByGlobPath("conference")
    if (conferences.length) {
      facts.push(
        `Recurring conference about ${title}: ${conferences.map(
          tree => `<a href="${tree.getWord(1)}">${tree.getWordsFrom(2)}</a>`
        )}`
      )
    }

    const githubBigQuery = file.getNode("githubBigQuery")
    if (githubBigQuery) {
      const url = `https://api.github.com/search/repositories?q=language:${githubBigQuery.getContent()}`
      const userCount = numeral(githubBigQuery.get("users")).format("0a")
      const repoCount = numeral(githubBigQuery.get("repos")).format("0a")
      facts.push(
        `The  Google BigQuery Public Dataset GitHub snapshot shows ${userCount} users using ${title} in ${repoCount} repos on <a href="${url}">GitHub</a>`
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
        `There are ${peNum} members in the <a href="${subreddit}">${title} subreddit</a>`
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
    if (hopl) facts.push(`${title} is listed on <a href="${hopl}">HOPL</a>`)

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
        `<a href="${website}">${file.get(
          "domainName"
        )}</a> was registered in ${domainRegistered}`
      )


    const wpRelated = file.get("wikipedia related")
    const seeAlsoLinks = wpRelated ? wpRelated.split(" ") : []
    const related = file.get("related")
    if (related) related.split(" ").forEach(id => seeAlsoLinks.push(id))

    if (seeAlsoLinks.length)
      facts.push(
        "See also: "+`(${seeAlsoLinks.length} related languages)` + seeAlsoLinks.map(link => this.makeATag(link)).join(", ")
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
      `HTML of this page generated by <a href="https://github.com/breck7/pldb/blob/main/code/LanguagePage.ts">LanguagePage.ts</a>`
    )
    facts.push(
      `<a href="https://build.pldb.com/edit/${file.id}">Improve our ${title} file</a>`
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

  get funFactSection() {
    return this.file
      .findNodes("funFact")
      .map(
        fact =>
          `exampleCodeHeader ${`<a href='${fact.getContent()}'>Fun fact</a>`}:
code
 ${cleanAndRightShift(lodash.escape(fact.childrenToString()), 1)}`
      )
      .join("\n\n")
  }

  get exampleSection() {
    return this.file.allExamples
      .map(
        example =>
          `exampleCodeHeader Example from ${
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
    const { file } = this
    const {
      appeared,
      numberOfUsers,
      bookCount,
      paperCount,
      numberOfRepos,
      title,
      isLanguage,
      languageRank,
      factSponsors
    } = file
    const users =
      numberOfUsers > 10
        ? numberOfUsers < 1000
          ? numeral(numberOfUsers).format("0")
          : numeral(numberOfUsers).format("0.0a")
        : ""

    const lines = [
      isLanguage
        ? `#${languageRank + 1} <span title="${
            file.langRankDebug
          }">on PLDB</span>`
        : `#${file.rank + 1} on PLDB`,
      appeared ? `${currentYear - appeared} Years Old` : "",
      users
        ? `${users} <span title="Crude user estimate from a linear model.">Users</span>`
        : "",
      isLanguage
        ? `${bookCount} <span title="Books about or leveraging ${title}">Books</span>`
        : "",
      isLanguage
        ? `${paperCount} <span title="Academic publications about or leveraging ${title}">Papers</span>`
        : "",
      factSponsors
        ? `${factSponsors.length} <span title="Number of people who have sponsored research on this file for $10 per fact.">Sponsors</span>`
        : "",
      numberOfRepos
        ? `${numeral(numberOfRepos).format(
            "0a"
          )} <span title="${title} repos on GitHub.">Repos</span>`
        : ""
    ]
      .filter(i => i)
      .join("\n ")

    return `kpiTable
 ${lines}`
  }
}

export { LanguagePageTemplate }
