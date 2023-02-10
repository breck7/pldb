#!/usr/bin/env node

const path = require("path")
const numeral = require("numeral")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { GrammarCompiler } = require("jtree/products/GrammarCompiler.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeBaseServer } = require("jtree/products/treeBaseServer.node.js")
const { ScrollFile } = require("scroll-cli")
const { clearQuickCache } = require("./quickCache")

const { PLDBFolder } = require("./Folder")
const simpleGit = require("simple-git")

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

const scrollHeader =
  new ScrollFile(undefined, path.join(builtSiteFolder, "header.scroll"))
    .importResults.code +
  "\n" +
  Disk.read(path.join(builtSiteFolder, "editImports.scroll"))
const scrollFooter = Disk.read(path.join(builtSiteFolder, "footer.scroll"))

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

class PLDBServerCommands {
  server = new PLDBServer(PLDBFolder.getBase().loadFolder(), ignoreFolder)

  startDevServerCommand(port) {
    this.server.listen(port)
  }

  startProdServerCommand() {
    this.server.listenProd()
  }
}

module.exports = { PLDBServer }

if (!module.parent)
  Utils.runCommand(new PLDBServerCommands(), process.argv[2], process.argv[3])
