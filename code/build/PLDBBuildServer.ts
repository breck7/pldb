#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const https = require("https")
const express = require("express")
const bodyParser = require("body-parser")
const numeral = require("numeral")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFile, getFullyExpandedFile } = require("scroll-cli")

import { PLDBBaseFolder, PLDBFile } from "../PLDBBase"
import {
	runCommand,
	lastCommitHashInFolder,
	htmlEscaped,
	isValidEmail
} from "../utils"
import simpleGit, { SimpleGit } from "simple-git"

const baseFolder = path.join(__dirname, "..", "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const builtSiteFolder = path.join(baseFolder, "site")
const csvFileLength = Disk.read(path.join(builtSiteFolder, "pldb.csv")).length

const editLogPath = path.join(ignoreFolder, "buildServerLog.tree")
const searchLogPath = path.join(ignoreFolder, "searchLog.tree")
Disk.touch(editLogPath)
Disk.touch(searchLogPath)

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
					.map(col => col.Column)
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
 <input type="button" id="submitButton" value="Save" onClick="alert('You have no call sign set. Build.PLDB.com is temporarily limited while we resolve traffic issues. Please email breck@pldb.com if you want a call sign.')" />
 </div>
 <p>Remember, you can always submit updates to this file using the traditional GitHub Pull Request flow.</p>
 <!-- <input type="submit" value="Save" id="submitButton" onClick="app.saveAuthorIfUnsaved()"/> --!>
 </form>`

const cssLibs = "node_modules/jtree/sandbox/lib/codemirror.css node_modules/jtree/sandbox/lib/codemirror.show-hint.css"
	.split(" ")
	.map(name => ` <link rel="stylesheet" type="text/css" href="/${name}" />`)
	.join("\n")

const scripts = "libs.js buildApp.js node_modules/jtree/products/jtree.browser.js pldb.browser.js node_modules/jtree/sandbox/lib/codemirror.js node_modules/jtree/sandbox/lib/show-hint.js"
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
	path.join(builtSiteFolder, "settings.scroll")
).code

class PLDBBuildServer {
	folder: PLDBBaseFolder
	app: any
	homepage = ""
	reloadBase() {
		this.folder = PLDBBaseFolder.getBase().loadFolder()
		const folder = this.folder
		const { cachedErrors } = folder

		const listAll = folder.topLanguages
			.slice(0, 100)
			.map(file => `<a href="edit/${file.id}">${file.id}</a>`)
			.join(" · ")

		this.homepage = this.scrollToHtml(`
html
 <pre>
 - Entities: ${folder.length} files in ${folder.dir}
 - Grammar: ${folder.grammarFilePaths.length} grammar files in ${
			folder.grammarDir
		}
 - TreeBase Bytes: ${numeral(folder.bytes).format("0.0b")}
 - CSV Bytes: ${numeral(csvFileLength).format("0.0b")}
 - Errors: ${
		cachedErrors.length
			? `<a href="errors.csv">${cachedErrors.length}</a>`
			: `0`
 } 
 </pre>

# Edit a language:

html
 ${listAll}
 `)
	}
	constructor() {
		this.reloadBase()
		this.compileGrammarForInBrowserCodeMirrorEditor()

		const app = express()
		this.app = app
		app.use(bodyParser.urlencoded({ extended: false }))
		app.use(bodyParser.json())
		app.use((req: any, res: any, next: any) => {
			res.setHeader("Access-Control-Allow-Origin", "*")
			res.setHeader(
				"Access-Control-Allow-Methods",
				"GET, POST, OPTIONS, PUT, PATCH, DELETE"
			)
			res.setHeader(
				"Access-Control-Allow-Headers",
				"X-Requested-With,content-type"
			)
			res.setHeader("Access-Control-Allow-Credentials", true)
			next()
		})

		app.get("/", (req: any, res: any) => res.send(this.homepage))

		app.get("/errors.csv", (req: any, res: any) => {
			res.setHeader("Content-Type", "text/plain")
			res.send(this.errorsToCsvCommand())
		})

		app.use(express.static(__dirname))
		app.use(express.static(builtSiteFolder))

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
			const tree = `search
 time ${Date.now()}
 ip ${req.ip}
 query
  ${req.query.q.replace(/\n/g, "\n  ")} 
`
			fs.appendFile(searchLogPath, tree, function() {})
			res.send(this.scrollToHtml(this.search(decodeURIComponent(req.query.q))))
		})

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

				this.reloadBase()

				res.redirect(`${id}#commit=${commitResult.commitHash}`)
			} catch (error) {
				console.error(error)
				errorForm(content, error, res)
			}
		})
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
					success: true,
					redirectUrl: `edit/${newFile.id}#errorMessage=${commitResult.error.message}`
				}

			this.reloadBase()

			return {
				success: true,
				redirectUrl: `edit/${newFile.id}#commit=${commitResult.commitHash}`
			}
		} catch (error) {
			console.error(error)
			return {
				error
			}
		}
	}

	search(query): string {
		const startTime = Date.now()
		const pldbBase = this.folder
		// Todo: allow advanced search. case sensitive/insensitive, regex, et cetera.
		const testFn = str => str.includes(query)

		const escapedQuery = htmlEscaped(query)
		const hits = pldbBase.filter(file => testFn(file.toString()))
		const nameHits = pldbBase.filter(file => file.names.some(testFn))
		const baseUrl = "https://pldb.com/languages/"

		const highlightHit = file => {
			const line = file
				.toString()
				.split("\n")
				.find(line => testFn(line))
			return line.replace(query, `<span style="highlightHit">${query}</span>`)
		}
		const fullTextSearchResults = hits
			.map(
				file =>
					` <div class="searchResultFullText"><a href="${baseUrl}${
						file.permalink
					}">${file.title}</a> - ${file.get("type")} #${
						file.rank
					} - ${highlightHit(file)}</div>`
			)
			.join("\n")

		const nameResults = nameHits
			.map(
				file =>
					` <div class="searchResultName"><a href="${baseUrl}${
						file.permalink
					}">${file.title}</a> - ${file.get("type")} #${file.rank}</div>`
			)
			.join("\n")

		const time = numeral((Date.now() - startTime) / 1000).format("0.00")
		return `
html
 <div class="pldbSearchForm"><form style="display:inline;" method="get" action="https://build.pldb.com/search"><input name="q" placeholder="Search" autocomplete="off" type="search" id="searchFormInput"><input class="pldbSearchButton" type="submit" value="Search"></form></div>
 <script>document.addEventListener("DOMContentLoaded", evt => initSearchAutocomplete("searchFormInput"))</script>

paragraph
 <p class="searchResultsHeader">Searched ${numeral(pldbBase.length).format(
		"0,0"
 )} languages and entities for "${escapedQuery}" in ${time}s.</p>
 <hr>

html
 <p class="searchResultsHeader">Showing ${
		nameHits.length
 } files whose name or aliases matched.</p>

html
${nameResults}
<hr>

paragraph
 <p class="searchResultsHeader">Showing ${
		hits.length
 } files who matched on a full text search.</p>

html
 ${fullTextSearchResults}`
	}

	listen(port = 4444) {
		this.app.listen(port, () =>
			console.log(
				`PLDBBuildServer server running: \ncmd+dblclick: http://localhost:${port}/`
			)
		)
		return this
	}

	errorsToCsvCommand() {
		return new jtree.TreeNode(
			this.folder.errors.map((err: any) => err.toObject())
		).toCsv()
	}

	validateSubmission(content: string, fileBeingEdited?: PLDBFile) {
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
			content: this.folder.prettifyContent(content)
		}
	}

	scrollToHtml(scrollContent) {
		return new ScrollFile(
			`replace BASE_URL ${this.isProd ? "https://pldb.com" : ""}
replace BUILD_URL ${this.isProd ? "https://build.pldb.com" : "/"}

${scrollSettings}
maxColumns 1
columnWidth 200

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
`
		).html
	}

	compileGrammarForInBrowserCodeMirrorEditor() {
		// todo: cleanup
		jtree.compileGrammarForBrowser(
			path.join(builtSiteFolder, "pldb.grammar"),
			__dirname + "/",
			false
		)
	}

	private _git?: SimpleGit
	private get git() {
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
		const key = fs.readFileSync(path.join(ignoreFolder, "privkey.pem"))
		const cert = fs.readFileSync(path.join(ignoreFolder, "fullchain.pem"))
		https
			.createServer(
				{
					key,
					cert
				},
				this.app
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

class PLDBBuildServerCommands {
	startDevServerCommand(port) {
		new PLDBBuildServer().listen(port)
	}

	startProdServerCommand() {
		new PLDBBuildServer().listenProd()
	}
}

export { PLDBBuildServer }

if (!module.parent)
	runCommand(new PLDBBuildServerCommands(), process.argv[2], process.argv[3])
