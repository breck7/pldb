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
  TreeBaseServer,
} = require("jtree/products/treeBaseServer.node.js")

const { PLDBFolder } = require("./Folder")
const { PLDBFile } = require("./File")
const { lastCommitHashInFolder, htmlEscaped, isValidEmail } = require("./utils")
const simpleGit = require("simple-git")

const baseFolder = path.join(__dirname, "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const builtSiteFolder = path.join(baseFolder, "site")
const editLogPath = path.join(ignoreFolder, "treeBaseServerLog.tree")

try {
  Disk.mkdir(ignoreFolder)
  Disk.touch(editLogPath)
} catch (err) {
  console.error(err)
}

const editForm = (content = "", title = "", missingRecommendedColumns = []) =>
  `${title ? `title ${title}` : ""}
html
 <form method="POST" id="editForm">
 <div class="cell" id="leftCell">
 <textarea name="content" id="content">${htmlEscaped(content).replace(
   /\n/g,
   "\n "
 )}</textarea>
 </div>
 <div class="cell">
 <div id="quickLinks"></div>
 <div class="missingRecommendedColumns">${
   missingRecommendedColumns.length
     ? `<br><b>Missing columns:</b><br>${missingRecommendedColumns
         .map((col) => col.Column)
         .join("<br>")}`
     : ""
 }</div>
 <div id="exampleSection"></div>
 </div>
 <br><br>
 <div>
 Submitting as: <span id="authorLabel"></span> <a href="#" onClick="app.changeAuthor()">change</a>
 </div>
 <br>
 <div>
 <input type="hidden" name="author" id="author">
 <!-- <input type="button" id="submitButton" value="Save" onClick="alert('You have no call sign set. Build.PLDB.com is temporarily limited while we resolve traffic issues. Please email liability@pldb.com if you want a call sign.')" /> --!>
 </div>
 <p>Remember, you can always submit updates to this file using the traditional GitHub Pull Request flow.</p>
 <input type="submit" value="Save" id="submitButton" onClick="app.saveAuthorIfUnsaved()"/>
 </form>`

const cssLibs =
  "node_modules/jtree/sandbox/lib/codemirror.css node_modules/jtree/sandbox/lib/codemirror.show-hint.css"
    .split(" ")
    .map((name) => ` <link rel="stylesheet" type="text/css" href="/${name}" />`)
    .join("\n")

const scripts = `treeBaseFrontEndApp.js
node_modules/jtree/products/Utils.browser.js
node_modules/jtree/products/TreeNode.browser.js
node_modules/jtree/products/GrammarLanguage.browser.js
node_modules/jtree/products/GrammarCodeMirrorMode.browser.js
pldb.browser.js
node_modules/jtree/sandbox/lib/codemirror.js
node_modules/jtree/sandbox/lib/show-hint.js`
  .split("\n")
  .map((name) => ` <script src="/${name}"></script>`)
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
  const authorEmail = field.split("<")[1].replace(">", "").trim()
  return {
    authorName,
    authorEmail,
  }
}

const scrollHeader = getFullyExpandedFile(
  path.join(builtSiteFolder, "header.scroll")
).code

const scrollFooter = getFullyExpandedFile(
  path.join(builtSiteFolder, "footer.scroll")
).code

class PLDBServer extends TreeBaseServer {
  constructor(folder) {
    super(folder)
    this.compileGrammarForInBrowserCodeMirrorEditor()
    this.serveFolder(builtSiteFolder)
    this.serveFolder(__dirname)
    this.initSearch(ignoreFolder)

    const { app } = this
    app.get("/create", (req, res) =>
      res.send(this.scrollToHtml(editForm(undefined, "Add a language")))
    )

    const errorForm = (submission, error, res) => {
      res.status(500)
      res.send(
        this.scrollToHtml(
          `html
 <div style="color: red;">${error}</div>
${editForm(submission, "Error")}`
        )
      )
    }

    const notFound = (id, res) => {
      res.status(500)
      return res.send(this.scrollToHtml(`* "${htmlEscaped(id)}" not found`))
    }

    app.get("/edit/:id", (req, res) => {
      const { id } = req.params
      if (id.endsWith(".pldb")) return res.redirect(id.replace(".pldb", ""))

      const file = this.folder.getFile(id)
      if (!file) return notFound(id, res)

      res.send(
        this.scrollToHtml(
          editForm(
            file.childrenToString(),
            `Editing ${file.id}`,
            file.missingRecommendedColumns
          ) + `\nkeyboardNav ${file.previousRanked.id} ${file.nextRanked.id}`
        )
      )
    })

    app.post("/create", async (req, res) => {
      const { content, author } = req.body
      const result = await this.create(content, author)
      if (result.success) res.redirect(result.redirectUrl)
      else errorForm(content, result.error, res)
    })

    app.post("/edit/:id", async (req, res) => {
      const { id } = req.params
      const file = this.folder.getFile(id)
      if (!file) return notFound(id, res)
      const { content, author } = req.body

      try {
        this.appendToPostLog(id, author, content)

        const validateSubmissionResults = this.validateSubmission(content, file)

        file.setChildren(validateSubmissionResults.content)
        file.prettifyAndSave()

        const { authorName, authorEmail } = parseGitAuthor(author)

        isValidEmail(authorEmail)

        const commitResult = await this.commitFilePullAndPush(
          file.filename,
          `Updated '${file.id}'`,
          authorName,
          authorEmail
        )

        if (!commitResult.success)
          return res.redirect(
            `${id}#errorMessage=${commitResult.error.message}`
          )

        res.redirect(`${id}#commit=${commitResult.commitHash}`)
        this.reloadNeeded()
      } catch (error) {
        console.error(error)
        errorForm(content, error, res)
      }
    })
  }

  reloadNeeded() {
    // todo: use some pattern like mobx or something to clear cached computeds?
    this.folder = PLDBFolder.getBase().loadFolder()
  }

  async create(content, author) {
    try {
      this.appendToPostLog("create", author, content)

      // todo: audit
      const validateSubmissionResults = this.validateSubmission(content)
      const newFile = this.folder.createFile(validateSubmissionResults.content)

      const { authorName, authorEmail } = parseGitAuthor(author)

      const commitResult = await this.commitFilePullAndPush(
        newFile.filename,
        `Added '${newFile.id}'`,
        authorName,
        authorEmail
      )

      if (!commitResult.success)
        return {
          success: false,
          redirectUrl: `edit/${newFile.id}#errorMessage=${commitResult.error.message}`,
        }

      this.reloadNeeded()

      return {
        success: true,
        redirectUrl: `edit/${newFile.id}#commit=${commitResult.commitHash}`,
      }
    } catch (error) {
      console.error(error)
      return {
        error,
      }
    }
  }

  validateSubmission(content, fileBeingEdited) {
    // Run some simple sanity checks.
    if (content.length > 200000) throw new Error(`Submission too large`)

    // Remove all return characters
    content = content.replace(/\r/g, "")

    const pldbBase = this.folder
    const programParser = pldbBase.grammarProgramConstructor
    const parsed = new programParser(content)

    const errs = parsed.getAllErrors()

    if (errs.length > 3)
      throw new Error(
        `Too many errors detected in submission: ${JSON.stringify(
          errs.map((err) => err.toObject())
        )}`
      )

    const { scopeErrors } = parsed
    if (scopeErrors.length > 3)
      throw new Error(
        `Too many scope errors detected in submission: ${JSON.stringify(
          scopeErrors.map((err) => err.toObject())
        )}`
      )

    if (parsed.length < 3)
      throw new Error(`Must provide at least 3 facts about the language.`)

    return {
      content: this.folder.prettifyContent(content),
    }
  }

  scrollToHtml(scrollContent) {
    return new ScrollFile(
      `replace BASE_URL ${this.isProd ? "https://pldb.com" : ""}
replace BUILD_URL ${this.isProd ? "https://build.pldb.com" : "/"}

${scrollHeader}

html
${cssLibs}
${scripts}

css
 #editForm {
  width: 100%;
  height: 80%;
 }
 .cell {
   width: 48%;
   display: inline-block;
   vertical-align: top;
   padding: 5px;
 }
 #quickLinks, .missingRecommendedColumns {
   font-size: 80%;
 }


html
 <div id="successLink"></div>
 <div id="errorMessage" style="color: red;"></div>

${scrollContent}

${scrollFooter}
`
    ).html
  }

  compileGrammarForInBrowserCodeMirrorEditor() {
    // todo: cleanup
    GrammarCompiler.compileGrammarForBrowser(
      path.join(builtSiteFolder, "pldb.grammar"),
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
          `user.email='${GIT_DEFAULT_EMAIL}'`,
        ],
      })
    return this._git
  }

  async commitFilePullAndPush(
    filename,
    commitMessage,
    authorName,
    authorEmail
  ) {
    if (!this.gitOn) {
      console.log(
        `Would commit "${filename}" with message "${commitMessage}" as author "${authorName} <${authorEmail}>"`
      )
      return {
        success: true,
        commitHash: `pretendCommitHash`,
      }
    }
    const { git } = this
    try {
      // git add
      // git commit
      // git pull --rebase
      // git push

      if (!isValidEmail(authorEmail))
        throw new Error(`Invalid email: ${authorEmail}`)

      await git.add(filename)
      const commitResult = await git.commit(commitMessage, filename, {
        "--author": `${authorName} <${authorEmail}>`,
      })

      await this.git.pull("origin", "main")
      await git.push()

      // todo: verify that this is the users commit
      const commitHash = lastCommitHashInFolder()

      return {
        success: true,
        commitHash,
      }
    } catch (error) {
      console.error(error)
      return {
        success: false,
        error,
      }
    }
  }

  appendToPostLog(route, author, content) {
    // Write to log for backup in case something goes wrong.
    Disk.append(
      editLogPath,
      `post
 route ${route}
 time ${new Date().toString()}
 author
  ${author.replace(/\n/g, "\n ")}
 content
  ${content.replace(/\n/g, "\n ")}\n`
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
  server = new PLDBServer(PLDBFolder.getBase().loadFolder())

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
