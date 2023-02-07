#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const https = require("https")
const express = require("express")
const bodyParser = require("body-parser")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { GrammarCompiler } = require("jtree/products/GrammarCompiler.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFile, getFullyExpandedFile } = require("scroll-cli")
const {
  SearchServer,
  TreeBaseServer
} = require("jtree/products/treeBaseServer.node.js")

const { PLDBFolder } = require("./Folder")
const { PLDBFile } = require("./File")
const simpleGit = require("simple-git")

const baseFolder = path.join(__dirname, "..")
const builtSiteFolder = path.join(baseFolder, "site")
const ignoreFolder = path.join(baseFolder, "ignore")

const lastCommitHashInFolder = (cwd = __dirname) =>
  require("child_process")
    .execSync("git rev-parse HEAD", {
      cwd
    })
    .toString()
    .trim()

const cssLibs = "node_modules/jtree/sandbox/lib/codemirror.css node_modules/jtree/sandbox/lib/codemirror.show-hint.css"
  .split(" ")
  .map(name => ` <link rel="stylesheet" type="text/css" href="/${name}" />`)
  .join("\n")

const scripts = `node_modules/jtree/products/Utils.browser.js
node_modules/jtree/products/TreeNode.browser.js
node_modules/jtree/products/GrammarLanguage.browser.js
node_modules/jtree/products/GrammarCodeMirrorMode.browser.js
pldb.browser.js
tql.browser.js
node_modules/jtree/sandbox/lib/codemirror.js
node_modules/jtree/sandbox/lib/show-hint.js
treeBaseFrontEndApp.js`
  .split("\n")
  .map(name => ` <script src="/${name}"></script>`)
  .join("\n")

const GIT_DEFAULT_USERNAME = "PLDBBot"
const GIT_DEFAULT_EMAIL = "bot@pldb.com"
const GIT_DEFAULT_AUTHOR = `${GIT_DEFAULT_USERNAME} <${GIT_DEFAULT_EMAIL}>`

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

const scrollHeader = getFullyExpandedFile(
  path.join(builtSiteFolder, "header.scroll")
).code

const scrollFooter = getFullyExpandedFile(
  path.join(builtSiteFolder, "footer.scroll")
).code

class PLDBServer extends TreeBaseServer {
  constructor(folder, ignoreFolder) {
    super(folder, ignoreFolder)
    this.editLogPath = path.join(ignoreFolder, "treeBaseServerLog.tree")
    this.compileGrammarsForCodeMirrorEditors()
    this.serveFolder(builtSiteFolder)
    this.serveFolder(__dirname)
    this.initSearch()

    const { app } = this
    app.get("/create", (req, res) =>
      res.send(this.scrollToHtml("title Add a language"))
    )

    const notFound = (id, res) => {
      res.status(500)
      return res.send(
        this.scrollToHtml(`* "${Utils.htmlEscaped(id)}" not found`)
      )
    }

    app.get("/fullTextSearch", (req, res) =>
      res.redirect(`/search?q=includes+${req.query.q}`)
    )

    app.get("/edit.json/:id", (req, res) => {
      const { id } = req.params
      const file = this.folder.getFile(id)
      if (!file) return notFound(id, res)
      res.send(
        JSON.stringify({
          content: file.childrenToString(),
          missingRecommendedColumns: file.missingRecommendedColumns
        })
      )
    })

    app.get("/edit/:id", (req, res) => {
      const { id } = req.params
      if (id.endsWith(".pldb")) return res.redirect(id.replace(".pldb", ""))

      const file = this.folder.getFile(id)
      if (!file) return notFound(id, res)

      res.send(
        this.scrollToHtml(`title Editing ${file.id}
\nkeyboardNav ${file.previousRanked.id} ${file.nextRanked.id}`)
      )
    })

    app.post("/saveCommitAndPush", async (req, res) => {
      const { author } = req.body
      const patch = Utils.removeReturnChars(req.body.patch).trim()
      this.appendToPostLog(author, patch)
      const tree = new TreeNode(patch)
      const filenames = []

      try {
        const { authorName, authorEmail } = parseGitAuthor(author)
        Utils.isValidEmail(authorEmail)
        const create = tree.getNode("create")
        if (create) {
          const data = create.childrenToString()

          // todo: audit
          const validateSubmissionResults = this.validateSubmission(data)
          const newFile = this.folder.createFile(
            validateSubmissionResults.content
          )

          filenames.push(newFile.filename)
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
        })

        const commitResult = await this.commitFilesPullAndPush(
          filenames,
          authorName,
          authorEmail
        )

        this.reloadNeeded()
        res.redirect(`/thankYou.html#commit=` + commitResult.commitHash)
      } catch (error) {
        console.error(error)
        res
          .status(500)
          .send(
            this.scrollToHtml(`html <div style="color: red;">${error}</div>`)
          )
      }
    })

    // Short urls:
    app.get("/:id", (req, res, next) =>
      this.folder.getFile(req.params.id)
        ? res.status(302).redirect(`/languages/${req.params.id}.html`)
        : next()
    )
  }

  notFoundPage = Disk.read(path.join(builtSiteFolder, "custom_404.html"))

  reloadNeeded() {
    // todo: use some pattern like mobx or something to clear cached computeds?
    this.folder = PLDBFolder.getBase().loadFolder()
  }

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

  scrollToHtml(scrollContent) {
    return new ScrollFile(
      `replace BASE_URL ${this.isProd ? "https://pldb.com" : ""}

${scrollHeader}

html
${cssLibs}
${scripts}

${scrollContent}

html <div id="successLink"></div><div id="errorMessage" style="color: red;"></div>
html <div id="formHolder"></div>

${scrollFooter}
`
    ).html
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
