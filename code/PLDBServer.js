#!/usr/bin/env node

const path = require("path")
const numeral = require("numeral")
const lodash = require("lodash")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { GrammarCompiler } = require("jtree/products/GrammarCompiler.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeBaseServer } = require("jtree/products/treeBaseServer.node.js")
const { ScrollFile } = require("scroll-cli")
const { clearQuickCache } = require("./quickCache")

const { PLDBFolder } = require("./Folder")
const simpleGit = require("simple-git")
const { ScrollFolder } = require("scroll-cli")

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
const baseFolder = path.join(__dirname, "..")
const builtSiteFolder = path.join(baseFolder, "site")
const ignoreFolder = path.join(baseFolder, "ignore")
const nodeModulesFolder = path.join(baseFolder, "node_modules")

const lastCommitHashInFolder = (cwd = __dirname) =>
  require("child_process")
    .execSync("git rev-parse HEAD", {
      cwd
    })
    .toString()
    .trim()

const GIT_DEFAULT_USERNAME = "PLDBBot"
const GIT_DEFAULT_EMAIL = "bot@pldb.com"
const GIT_DEFAULT_AUTHOR = `${GIT_DEFAULT_USERNAME} <${GIT_DEFAULT_EMAIL}>`

const delimitedEscapeFunction = value =>
  value.includes("\n") ? value.split("\n")[0] : value
const delimiter = " DeLiM "

const parseGitAuthor = (field = GIT_DEFAULT_AUTHOR) => {
  const authorName = field
    .split("<")[0]
    .trim()
    .replace(/[^a-zA-Z \.]/g, "")
    .substr(0, 32)
  const authorEmail = field
    .split("<")[1]
    .replace(">", "")
    .trim()
  return {
    authorName,
    authorEmail
  }
}

const scrollHeader = new ScrollFile(
  undefined,
  path.join(builtSiteFolder, "header.scroll")
).importResults.code
const scrollFooter = Disk.read(path.join(builtSiteFolder, "footer.scroll"))

const getCombinedFiles = (baseDir = "", filepaths = []) =>
  filepaths
    .map(filename => Disk.read(path.join(baseDir, filepath)))
    .join("\n\n")

class PLDBServer extends TreeBaseServer {
  constructor(folder, ignoreFolder) {
    super(folder, ignoreFolder)
    this.editLogPath = path.join(ignoreFolder, "treeBaseServerLog.tree")
    this.compileGrammarsForCodeMirrorEditors()
    this.serveFolder(builtSiteFolder)
    this.serveFolder(__dirname)
    this.initSearch()

    const { app } = this

    this.app.use(
      "jtree",
      express.static(path.join(nodeModulesFolder, "jtree", "products"))
    )
    this.app.use(
      "monaco-editor",
      express.static(path.join(nodeModulesFolder, "monaco-editor"))
    )

    const searchCache = {}
    app.get("/search.html", (req, res) => {
      const { searchServer } = this
      const query = req.query.q ?? ""
      searchServer.logQuery(query, req.ip, "scroll")
      if (!searchCache[query]) searchCache[query] = this.searchToHtml(query)

      res.send(searchCache[query])
    })

    app.get("/fullTextSearch", (req, res) =>
      res.redirect(`/search.html?q=includes+${req.query.q}`)
    )

    app.get("/edit.json", (req, res) => {
      const { id } = req.query
      const file = this.folder.getFile(id)
      if (!file) return res.send(JSON.stringify({ error: "Not found" }))
      res.send(
        JSON.stringify({
          content: file.childrenToString(),
          missingRecommendedColumns: file.missingRecommendedColumns,
          next: file.nextRanked.id,
          previous: file.previousRanked.id
        })
      )
    })

    app.post("/saveCommitAndPush", async (req, res) => {
      const { author } = req.body
      const patch = Utils.removeReturnChars(req.body.patch).trim()
      this.appendToPostLog(author, patch)

      try {
        const hash = await this.saveCommitAndPush(patch, author)
        res.redirect(`/thankYou.html?commit=${hash}`)
      } catch (error) {
        console.error(error)
        res
          .status(500)
          .redirect(`/error.html?error=${encodeURIComponent(error)}`)
      }
    })

    app.get("/pldb.grammar", (req, res) => res.send(pldbBase.grammarCode))

    // Short urls:
    app.get("/:id", (req, res, next) =>
      this.folder.getFile(req.params.id)
        ? res.status(302).redirect(`/languages/${req.params.id}.html`)
        : next()
    )

    app.get("/searchIndex.json", () => res.send(pldbBase.searchIndexJson))
    app.get("/keywordsOneHot.csv", () => res.send(pldbBase.keywordsOneHotCsv))
    app.get("/pldb.json", () => res.send(pldbBase.typedMapJson))

    const frontEndJsLibs = getCombinedFiles(
      path.join(__dirname, "frontEndJavascript"),
      `mousetrap.js autocomplete.js PLDBClientSideApp.js`.split(" ")
    )
    app.get("/combinedFrontEnd.js", () => res.send(frontEndJsLibs))

    const editorLibCode =
      getCombinedFiles(
        path.join(nodeModulesFolder, "jtree"),
        `products/Utils.browser.js
products/TreeNode.browser.js
products/GrammarLanguage.browser.js
products/GrammarCodeMirrorMode.browser.js
sandbox/lib/codemirror.js
sandbox/lib/show-hint.js`.split("\n")
      ) +
      "\n\n" +
      getCombinedFiles(
        builtSiteFolder,
        "pldb.browser.js tql.browser.js".split(" ")
      )

    app.get("/editorLibCode.js", () => res.send(editorLibCode))

    this.addRedirects(app)
  }

  addRedirects(app) {
    const redirects = Disk.read(path.join(siteFolder, "redirects.txt"))
      .split("\n")
      .map(line => {
        const [oldUrl, newUrl] = line.split(" ")
        return {
          oldUrl,
          newUrl
        }
      })
    redirects.forEach(redirect =>
      app.get(`/${redirect.oldUrl}`, (req, res) =>
        res.status(301).redirect(redirect.newUrl)
      )
    )
  }

  // todo: cleanup
  searchToHtml(originalQuery) {
    const {
      hits,
      queryTime,
      columnNames,
      errors,
      title,
      description
    } = this.searchServer.search(
      decodeURIComponent(originalQuery).replace(/\r/g, "")
    )
    const { folder } = this
    const results = new TreeNode(hits)._toDelimited(
      delimiter,
      columnNames,
      delimitedEscapeFunction
    )
    const encodedTitle = Utils.escapeScrollAndHtml(title)
    const encodedDescription = Utils.escapeScrollAndHtml(description)

    return new ScrollFile(
      `${scrollHeader}

html
 <link rel="stylesheet" type="text/css" href="node_modules/jtree/sandbox/lib/codemirror.css" />
 <link rel="stylesheet" type="text/css" href="node_modules/jtree/sandbox/lib/codemirror.show-hint.css" />
 <script src="/editorLibCode.js"></script>

title Search Results
 hidden

html <form method="get" action="search.html" class="tqlForm"><textarea id="tqlInput" name="q"></textarea><input type="submit" value="Search"></form>
html <div id="tqlErrors"></div>

* Searched ${numeral(folder.length).format("0,0")} files and found ${
        hits.length
      } matches in ${queryTime}s. 
 class searchResultsHeader

${title ? `# ${encodedTitle}` : ""}
${description ? `* ${encodedDescription}` : ""}

table ${delimiter}
 ${results.replace(/\n/g, "\n ")}

html <script>document.addEventListener("DOMContentLoaded", () => new TreeBaseFrontEndApp().renderSearchPage())</script>

${scrollFooter}
`
    ).html
  }

  async saveCommitAndPush(patch, author) {
    const tree = new TreeNode(patch)
    const filenames = []

    const { authorName, authorEmail } = parseGitAuthor(author)
    Utils.isValidEmail(authorEmail)
    const create = tree.getNode("create")
    clearQuickCache(this.folder)
    if (create) {
      const data = create.childrenToString()

      // todo: audit
      const validateSubmissionResults = this.validateSubmission(data)
      const newFile = this.folder.createFile(validateSubmissionResults.content)

      filenames.push(newFile.filename)
      newFile.writeScrollFileIfChanged()
    }

    tree.delete("create")

    tree.forEach(node => {
      const id = node.getWord(0).replace(".pldb", "")
      const file = this.folder.getFile(id)
      if (!file) throw new Error(`File '${id}' not found.`)

      const validateSubmissionResults = this.validateSubmission(
        node.childrenToString(),
        file
      )
      file.setChildren(validateSubmissionResults.content)
      file.prettifyAndSave()
      console.log(`Saved '${file.filename}'`)
      filenames.push(file.filename)
      clearQuickCache(file)
      file.writeScrollFileIfChanged()
    })

    const commitResult = await this.commitFilesPullAndPush(
      filenames,
      authorName,
      authorEmail
    )

    return commitResult.commitHash
  }

  notFoundPage = Disk.read(path.join(builtSiteFolder, "custom_404.html"))

  validateSubmission(content, fileBeingEdited) {
    // Run some simple sanity checks.
    if (content.length > 200000) throw new Error(`Submission too large`)

    // Remove all return characters
    content = Utils.removeEmptyLines(Utils.removeReturnChars(content))

    const programParser = this.folder.grammarProgramConstructor
    const parsed = new programParser(content)

    const errs = parsed.getAllErrors()

    if (errs.length > 3)
      throw new Error(
        `Too many errors detected in submission: ${JSON.stringify(
          errs.map(err => err.toObject())
        )}`
      )

    const { scopeErrors } = parsed
    if (scopeErrors.length > 3)
      throw new Error(
        `Too many scope errors detected in submission: ${JSON.stringify(
          scopeErrors.map(err => err.toObject())
        )}`
      )

    if (parsed.length < 3)
      throw new Error(`Must provide at least 3 facts about the language.`)

    return {
      content: parsed.sortFromSortTemplate().toString()
    }
  }

  compileGrammarsForCodeMirrorEditors() {
    const { folder } = this
    const { csvBuildOutput } = folder
    const { colNamesForCsv } = csvBuildOutput

    // todo: cleanup
    GrammarCompiler.compileGrammarForBrowser(
      path.join(builtSiteFolder, "pldb.grammar"),
      __dirname + "/",
      false
    )

    const tqlPath = path.join(
      __dirname,
      "..",
      "node_modules",
      "jtree",
      "langs",
      "tql",
      "tql.grammar"
    )
    const tqlGrammar = new TreeNode(Disk.read(tqlPath))

    tqlGrammar.getNode("columnNameCell").set("enum", colNamesForCsv.join(" "))
    const combinedPath = path.join(this.ignoreFolder, "pldbTql.grammar")
    Disk.write(combinedPath, tqlGrammar.toString())
    GrammarCompiler.compileGrammarForBrowser(
      combinedPath,
      __dirname + "/",
      false
    )
  }

  _git
  get git() {
    if (!this._git)
      this._git = simpleGit({
        baseDir: this.folder.dir,
        binary: "git",
        maxConcurrentProcesses: 1,
        // Needed since git won't let you commit if there's no user name config present (i.e. CI), even if you always
        // specify `author=` in every command. See https://stackoverflow.com/q/29685337/10670163 for example.
        config: [
          `user.name='${GIT_DEFAULT_USERNAME}'`,
          `user.email='${GIT_DEFAULT_EMAIL}'`
        ]
      })
    return this._git
  }

  async commitFilesPullAndPush(filenames, authorName, authorEmail) {
    const commitMessage = filenames.join(" ")
    if (!this.gitOn) {
      console.log(
        `Would commit "${commitMessage}" with author "${authorName} <${authorEmail}>"`
      )
      return {
        success: true,
        commitHash: `pretendCommitHash`
      }
    }
    const { git } = this
    try {
      // git add
      // git commit
      // git pull --rebase
      // git push

      if (!Utils.isValidEmail(authorEmail))
        throw new Error(`Invalid email: ${authorEmail}`)

      // for (const filename of filenames) {
      //   await git.add(filename)
      // }

      const commitResult = await git.commit(commitMessage, filenames, {
        "--author": `${authorName} <${authorEmail}>`
      })

      await this.git.pull("origin", "main")
      await git.push()

      // todo: verify that this is the users commit
      const commitHash = lastCommitHashInFolder()

      return {
        success: true,
        commitHash
      }
    } catch (error) {
      console.error(error)
      return {
        success: false,
        error
      }
    }
  }

  appendToPostLog(author = "", content = "") {
    // Write to log for backup in case something goes wrong.
    Disk.append(
      this.editLogPath,
      `post
 time ${new Date().toString()}
 author ${author.replace(/\n/g, " ")}
 content
  ${content.replace(/\n/g, "\n  ")}\n`
    )
  }

  gitOn = false
  isProd = false

  listenProd() {
    this.gitOn = true
    this.isProd = true
    return super.listenProd()
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

class PLDBServerCommands {
  get server() {
    return new PLDBServer(PLDBFolder.getBase().loadFolder(), ignoreFolder)
  }

  startDevServerCommand(port) {
    this.server.listen(port)
  }

  startProdServerCommand() {
    this.server.listenProd()
  }

  formatDatabaseCommand() {
    PLDBFolder.getBase()
      .loadFolder()
      .forEach(file => file.prettifyAndSave())
  }

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

  buildFeaturePagesCommand() {
    pldbBase.features.forEach(feature =>
      Disk.writeIfChanged(
        path.join(publishedFeaturesFolder, `${feature.id}.scroll`),
        feature.toScroll()
      )
    )
  }

  buildDatabasePagesCommand() {
    pldbBase.forEach(file => file.writeScrollFileIfChanged())
  }

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

    const allExtensions = new Set()
    files.forEach(file =>
      file.extensions.split(" ").forEach(ext => allExtensions.add(ext))
    )

    files.forEach(file => {
      let extensionsLength = file.extensions.split(" ").length
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

  buildFeaturesImports() {
    const { topFeatures } = pldbBase

    const summaries = topFeatures.map(feature => feature.summary)

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

    const atLeast10 = summaries.filter(feature => feature.measurements > 9)

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

module.exports = { PLDBServer }

if (!module.parent)
  Utils.runCommand(new PLDBServerCommands(), process.argv[2], process.argv[3])
