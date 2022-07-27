#!/usr/bin/env ts-node

const path = require("path")
const fs = require("fs")
const https = require("https")
const express = require("express")
const { jtree } = require("jtree")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeBaseServer } = require("jtree/products/treeBase.node.js")
import { PLDBBaseFolder } from "../PLDBBase"
import { runCommand } from "../utils"
import simpleGit, { SimpleGit } from "simple-git"

const editForm = (content = "") =>
	`<form method="POST" id="editForm">
<div class="cell">
<textarea name="content" id="content">${htmlEscaped(content)}</textarea>
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
<input type="hidden" name="author" id="author"><input type="submit" value="Save" id="submitButton"/>
</form>`

const htmlEscaped = (content: string) => content.replace(/</g, "&lt;")

const template = bodyContent => `<!doctype html>
<head>
<script src="/libs.js" ></script>
<script src="/editApp.js" ></script>
<script src="/jtree.browser.js"></script>
<script src="/pldb.browser.js"></script>
<link rel="stylesheet" type="text/css" href="/codemirror.css" />
<link rel="stylesheet" type="text/css" href="/codemirror.show-hint.css" />
<script type="text/javascript" src="/codemirror.js"></script>
<script type="text/javascript" src="/show-hint.js"></script>
<link rel="stylesheet" type="text/css" href="/editApp.css"></link>
<title>PLDB Edit</title>
</head>
<body>
<a class="gitHubTopRightLinkComponent" href="https://github.com/breck7/pldb"><svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub icon</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
<div>
<a href="/"><b>PLDB Edit</b></a> | <a href="/edit">List all</a> | <a href="/create">Create</a>
</div>
<br>
<div id="successLink"></div>
${bodyContent}
</body>
</html>`

const GIT_DEFAULT_USERNAME = "PLDBBot"
const GIT_DEFAULT_EMAIL = "bot@pldb.pub"
const GIT_DEFAULT_AUTHOR = `${GIT_DEFAULT_USERNAME} <${GIT_DEFAULT_EMAIL}>`

class PLDBEditServer extends TreeBaseServer {
	checkAndPrettifySubmission(content: string) {
		return this._folder.prettifyContent(content)
	}

	compileGrammar() {
		// todo: cleanup
		jtree.compileGrammarForBrowser(
			path.join(__dirname, "..", "..", "pldb.pub", "grammar", "pldb.grammar"),
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

	private async lastCommitHash() {
		return require("child_process")
			.execSync("git rev-parse HEAD")
			.toString()
			.trim()
	}

	private async commitFile(
		filename: string,
		commitMessage: string,
		authorName: string,
		authorEmail: string
	) {
		const { git } = this
		if (!this.gitOn) {
			console.log(
				`Would commit "${filename}" with message "${commitMessage}" as author "${authorName} <${authorEmail}>"`
			)
			return
		}
		try {
			// Do a pull _after_ the write. This ensures that, if we intend to overwrite a file
			// that has been changed on the server, we'll end up with an intentional merge conflict.
			await this.autopull()
			const pull = await this.autopull()
			if (!pull.success && pull) throw (<any>pull).error

			await git.add(filename)
			const commitResult = await git.commit(commitMessage, filename, {
				"--author": `${authorName} <${authorEmail}>`
			})

			await git.push()

			return { success: true }
		} catch (error) {
			const err = error as Error
			return { success: false, error: err.toString() }
		}
	}

	// Pull changes before making changes. However, only pull if an upstream branch is set up.
	private async autopull() {
		const res = await this.pullCommand()
		if (!res.success) {
			const err = res.error as string | undefined
			if (
				err?.includes(
					"There is no tracking information for the current branch." // local-only branch
				) ||
				err?.includes("You are not currently on a branch.") // detached HEAD
			)
				return { success: true }
		}
		return res
	}

	private async pullCommand() {
		try {
			const res = await this.git.pull()
			return {
				success: true,
				stdout: JSON.stringify(res.summary, null, 2)
			}
		} catch (error) {
			const err = error as Error
			console.log(err)
			return { success: false, error: err.toString() }
		}
	}

	indexCommand() {
		return template(`<p>PLDB Edit is a simple web app for quickly adding and editing content on <a href="https://pldb.pub/">The Programming Language Database</a>.</p>
<div style="white-space:pre;">
-- Folder: '${this._folder._getDir()}'
-- Grammars: '${this._folder._getGrammarPaths().join(",")}'
-- Files: ${this._folder.length}
-- Bytes: ${this._folder.toString().length}
</pre>
<a href="errors.html">Errors (HTML)</a> | <a href="errors.csv">Errors (CSV)</a>`)
	}

	addRoutes() {
		const app = this._app
		const pldbBase = this._folder

		const publicFolder = path.join(__dirname, "..", "..", "blog", "public")

		app.use(express.static(__dirname))
		app.use(express.static(publicFolder))
		app.use(
			express.static(
				path.join(__dirname, "..", "..", "node_modules", "jtree", "products")
			)
		)
		app.use(
			express.static(
				path.join(
					__dirname,
					"..",
					"..",
					"node_modules",
					"jtree",
					"sandbox",
					"lib"
				)
			)
		)

		app.get("/create", (req, res) => res.send(template(editForm())))

		app.post("/create", async (req, res) => {
			try {
				const newFile = pldbBase.createFile(
					this.checkAndPrettifySubmission(req.body.content)
				)

				const { authorName, authorEmail } = this.parseGitAuthor(req.body.author)

				await this.commitFile(
					newFile.getWord(0),
					`Added '${newFile.id}'`,
					authorName,
					authorEmail
				)

				const commit = await this.lastCommitHash()

				pldbBase.clearMemos()
				res.redirect("edit/" + newFile.id + `#commit=${commit}`)
			} catch (err) {
				errorForm(req.body.content, err, res)
			}
		})

		const errorForm = (submission, err, res) => {
			res.status(500)
			res.send(
				template(
					`<div style="color: red;">Error: ${err}</div>` + editForm(submission)
				)
			)
		}

		const notFound = (id, res) => {
			res.status(500)
			return res.send(template(`"${htmlEscaped(id)}" not found`))
		}

		app.get("/edit", (req, res) =>
			res.send(
				template(
					this._folder.topLanguages
						.map(file => `<a href="edit/${file.id}">${file.getFileName()}</a>`)
						.join("<br>")
				)
			)
		)

		app.get("/edit/:id", (req, res) => {
			const { id } = req.params
			if (id.endsWith(".pldb")) return res.redirect(id.replace(".pldb", ""))

			const file = pldbBase.getFile(id)
			if (!file) return notFound(id, res)

			const keyboardNav = `<a href="${file.previousRanked.id}" id="previousFile">previous</a>
<a href="${file.nextRanked.id}" id="nextFile">next</a>`

			res.send(template(editForm(file.childrenToString()) + keyboardNav))
		})

		app.post("/edit/:id", async (req, res) => {
			const { id } = req.params
			const file = pldbBase.getFile(id)
			if (!file) return notFound(id, res)

			try {
				file.setChildren(this.checkAndPrettifySubmission(req.body.content))
				file.save()

				const { authorName, authorEmail } = this.parseGitAuthor(req.body.author)

				await this.commitFile(
					file.getWord(0),
					`Updated '${file.id}'`,
					authorName,
					authorEmail
				)

				const commit = await this.lastCommitHash()

				res.redirect(id + `#commit=${commit}`)
			} catch (err) {
				errorForm(req.body.content, err, res)
			}
		})
	}

	parseGitAuthor(field = GIT_DEFAULT_AUTHOR) {
		const authorName = field.split("<")[0].trim()
		const authorEmail = field
			.split("<")[1]
			.replace(">", "")
			.trim()
		return {
			authorName,
			authorEmail
		}
	}

	gitOn = false

	listenProd() {
		this.gitOn = true
		const key = fs.readFileSync(
			path.join(__dirname, "..", "..", "ignore", "privkey.pem")
		)
		const cert = fs.readFileSync(
			path.join(__dirname, "..", "..", "ignore", "fullchain.pem")
		)
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
		const pldbBase = PLDBBaseFolder.getBase()
		pldbBase.loadFolder()
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
