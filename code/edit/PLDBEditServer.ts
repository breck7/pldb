#!/usr/bin/env ts-node

const path = require("path")
const fs = require("fs")
const https = require("https")
const express = require("express")
const numeral = require("numeral")
const { jtree } = require("jtree")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeBaseServer } = require("jtree/products/treeBase.node.js")
const { ScrollFile, getFullyExpandedFile } = require("scroll-cli")
import { PLDBBaseFolder, PLDBFile } from "../PLDBBase"
import {
	runCommand,
	lastCommitHashInFolder,
	htmlEscaped,
	isValidEmail
} from "../utils"
import simpleGit, { SimpleGit } from "simple-git"
import { SearchRoutes } from "../routes"

const baseFolder = path.join(__dirname, "..", "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const publishedFolder = path.join(baseFolder, "pldb.local")
const csvFileLength = Disk.read(path.join(publishedFolder, "pldb.csv")).length

const logPath = path.join(ignoreFolder, "editServerLog.tree")
Disk.touch(logPath)

const editForm = (content = "", title = "") =>
	`${title ? `title ${title}` : ""}
html
 <form method="POST" id="editForm">
 <div class="cell">
 <textarea name="content" id="content">${htmlEscaped(content).replace(
		/\n/g,
		"\n "
 )}</textarea>
 </div>
 <div class="cell">
 <div id="quickLinks"></div>
 <div id="exampleSection"></div>
 </div>
 <br><br>
 <div>
 Submitting as: <span id="authorLabel"></span> <a href="#" onClick="app.changeAuthor()">change</a>
 </div>
 <br>
 <input type="hidden" name="author" id="author"><input type="submit" value="Save" id="submitButton" onClick="app.saveAuthorIfUnsaved()"/>
 </form>`

const cssLibs = "node_modules/jtree/sandbox/lib/codemirror.css node_modules/jtree/sandbox/lib/codemirror.show-hint.css editApp.css"
	.split(" ")
	.map(name => ` <link rel="stylesheet" type="text/css" href="/${name}" />`)
	.join("\n")

const scripts = "libs.js editApp.js node_modules/jtree/products/jtree.browser.js pldb.browser.js node_modules/jtree/sandbox/lib/codemirror.js node_modules/jtree/sandbox/lib/show-hint.js"
	.split(" ")
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

const scrollSettings = getFullyExpandedFile(
	path.join(publishedFolder, "settings.scroll")
).code

class PLDBEditServer extends TreeBaseServer {
	validateSubmission(content: string, fileBeingEdited?: PLDBFile) {
		// Run some simple sanity checks.
		if (content.length > 200000) throw new Error(`Submission too large`)

		// Remove all return characters
		content = content.replace(/\r/g, "")

		const pldbBase = this._folder
		const programParser = pldbBase.grammarProgramConstructor
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
			content: this._folder.prettifyContent(content)
		}
	}

	scrollToHtml(scrollContent) {
		return new ScrollFile(
			`replace BASE_URL ${this.isProd ? "https://pldb.com" : ""}
replace EDIT_URL ${this.isProd ? "https://edit.pldb.com" : "/"}

${scrollSettings}
maxColumns 1
columnWidth 200

html
${cssLibs}
${scripts}

html
 <div id="successLink"></div>
 <div id="errorMessage" style="color: red;"></div>

${scrollContent}
`
		).html
	}

	compileGrammar() {
		// todo: cleanup
		jtree.compileGrammarForBrowser(
			path.join(baseFolder, "pldb.local", "docs", "pldb.grammar"),
			__dirname + "/",
			false
		)
	}

	private _git?: SimpleGit
	private get git() {
		if (!this._git)
			this._git = simpleGit({
				baseDir: this._folder.dir,
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

	private async commitFilePullAndPush(
		filename: string,
		commitMessage: string,
		authorName: string,
		authorEmail: string
	) {
		if (!this.gitOn) {
			console.log(
				`Would commit "${filename}" with message "${commitMessage}" as author "${authorName} <${authorEmail}>"`
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

			if (!isValidEmail(authorEmail))
				throw new Error(`Invalid email: ${authorEmail}`)

			await git.add(filename)
			const commitResult = await git.commit(commitMessage, filename, {
				"--author": `${authorName} <${authorEmail}>`
			})

			await this.git.pull()
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

	indexCommand() {
		const folder = this._folder
		const { errors } = folder

		const listAll = this._folder.topLanguages
			.map(file => `<a href="edit/${file.id}">${file.id}</a>`)
			.join(" · ")

		return this.scrollToHtml(`
html
 <pre>
 - Entities: ${folder.length} files in ${folder.dir}
 - Grammar: ${folder.grammarFilePaths.length} grammar files in ${
			folder.grammarDir
		}
 - TreeBase Bytes: ${numeral(folder.toString().length).format("0.0b")}
 - CSV Bytes: ${numeral(csvFileLength).format("0.0b")}
 - Errors: ${errors.length ? `<a href="errors.csv">${errors.length}</a>` : `0`} 
 </pre>

section Edit a language:

html
 ${listAll}
 `)
	}

	appendToPostLog(route, author, content) {
		// Write to log for backup in case something goes wrong.
		Disk.append(
			logPath,
			`post
 route ${route}
 time ${new Date().toString()}
 author
  ${author.replace(/\n/g, "\n ")}
 content
  ${content.replace(/\n/g, "\n ")}\n`
		)
	}

	addRoutes() {
		const app = this._app
		const pldbBase = this._folder

		app.use(express.static(__dirname))
		app.use(express.static(publishedFolder))

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
			return res.send(
				this.scrollToHtml(`paragraph
 "${htmlEscaped(id)}" not found`)
			)
		}

		app.get("/search", (req, res) => {
			const { q, format } = req.query
			const results = new SearchRoutes().search(q, format, req.originalUrl)
			if (format) res.send(results)
			else res.send(this.scrollToHtml(results))
		})

		app.get("/edit/:id", (req, res) => {
			const { id } = req.params
			if (id.endsWith(".pldb")) return res.redirect(id.replace(".pldb", ""))

			const file = pldbBase.getFile(id)
			if (!file) return notFound(id, res)

			res.send(
				this.scrollToHtml(
					editForm(file.childrenToString(), `Editing ${file.id}`) +
						`\nkeyboardNav ${file.previousRanked.id} ${file.nextRanked.id}`
				)
			)
		})

		app.post("/create", async (req, res) => {
			const { content, author } = req.body
			try {
				this.appendToPostLog("create", author, content)

				// todo: audit
				const validateSubmissionResults = this.validateSubmission(content)
				const newFile = pldbBase.createFile(validateSubmissionResults.content)

				const { authorName, authorEmail } = parseGitAuthor(author)

				// todo: audit
				const commitResult = await this.commitFilePullAndPush(
					newFile.filename,
					`Added '${newFile.id}'`,
					authorName,
					authorEmail
				)

				if (!commitResult.success)
					return res.redirect(
						`edit/${newFile.id}#errorMessage=${commitResult.error.message}`
					)

				// todo: cleanup cacheing issues
				pldbBase.clearMemos()
				res.redirect(`edit/${newFile.id}#commit=${commitResult.commitHash}`)
			} catch (error) {
				console.error(error)
				errorForm(content, error, res)
			}
		})

		app.post("/edit/:id", async (req, res) => {
			const { id } = req.params
			const file = pldbBase.getFile(id)
			if (!file) return notFound(id, res)
			const { content, author } = req.body

			try {
				this.appendToPostLog(id, author, content)

				const validateSubmissionResults = this.validateSubmission(content, file)

				file.setChildren(validateSubmissionResults.content)
				file.prettifyAndSave()

				const { authorName, authorEmail } = parseGitAuthor(author)

				isValidEmail(authorEmail)

				// todo: audit
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
			} catch (error) {
				console.error(error)
				errorForm(content, error, res)
			}
		})
	}

	gitOn = false
	isProd = false

	listenProd() {
		this.gitOn = true
		this.isProd = true
		const key = fs.readFileSync(path.join(ignoreFolder, "privkey.pem"))
		const cert = fs.readFileSync(path.join(ignoreFolder, "fullchain.pem"))
		https
			.createServer(
				{
					key,
					cert
				},
				this._app
			)
			.listen(443)

		const redirectApp = express()
		redirectApp.use((req, res) =>
			res.redirect(301, `https://${req.headers.host}${req.url}`)
		)
		redirectApp.listen(80, () => console.log(`Running redirect app`))
		return this
	}
}

class PLDBEditServerCommands {
	get server() {
		const pldbBase = PLDBBaseFolder.getBase().loadFolder()
		pldbBase.startListeningForFileChanges()
		const server = new (<any>PLDBEditServer)(pldbBase)
		server.addRoutes()
		server.compileGrammar()
		return server
	}

	startDevServerCommand(port) {
		this.server.listen(port)
	}

	startProdServerCommand() {
		this.server.listenProd()
	}
}

export { PLDBEditServer }

if (!module.parent)
	runCommand(new PLDBEditServerCommands(), process.argv[2], process.argv[3])
