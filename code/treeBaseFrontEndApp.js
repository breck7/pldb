const genDefaultAuthor = () => {
	let user = "region.platform.vendor"
	try {
		const region = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
		const platform =
			navigator.userAgentData?.platform ?? navigator.platform ?? ""
		const vendor = navigator.vendor ?? ""
		// make sure email address is not too long. i think 64 is the limit.
		// so here length is max 45 + 7 + 4 + 4.
		user = [region, platform, vendor]
			.map(str => str.replace(/[^a-zA-Z]/g, "").substr(0, 15))
			.join(".")
	} catch (err) {
		console.error(err)
	}
	const hash = Utils.getRandomCharacters(7)
	return `Anon <${`anon.${user}.${hash}`}@pldb.com>`
}
const defaultAuthor = genDefaultAuthor()

class TreeBaseFrontEndApp {
	get author() {
		try {
			return this.store.getItem("author") || defaultAuthor
		} catch (err) {
			console.error(err)
		}

		return defaultAuthor
	}

	startSearchPage() {
		this.startTQLCodeMirror()
	}

	async startTQLCodeMirror() {
		this.programCompiler = tqlNode
		this.codeMirrorInstance = new GrammarCodeMirrorMode(
			"custom",
			() => tqlNode,
			undefined,
			CodeMirror
		)
			.register()
			.fromTextAreaWithAutocomplete(document.getElementById("tqlInput"), {
				lineWrapping: false,
				lineNumbers: false
			})

		this.codeMirrorInstance.setSize(400, 100)
		this.codeMirrorInstance.setValue(
			(new URLSearchParams(window.location.search).get("q") || "").replace(
				/\r/g,
				""
			)
		)
		this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
	}

	_onCodeKeyUp() {
		const { codeMirrorInstance } = this
		const code = codeMirrorInstance.getValue()
		if (this._code === code) return
		this._code = code
		this.program = new this.programCompiler(code)
		const errs = this.program.scopeErrors.concat(this.program.getAllErrors())

		const errMessage = errs.length
			? errs.map(err => err.getMessage()).join(" ")
			: "&nbsp;"
		document.getElementById("tqlErrors").innerHTML = errMessage
	}

	start() {
		if (this.route === "search") return this.startSearchPage()
		if (document.getElementById("submitButton")) this.startForm()
		if (this.route === "create") this.startCreateForm()

		const urlParams = new URLSearchParams(window.location.hash.replace("#", ""))
		const commit = urlParams.get("commit")
		const errorMessage = urlParams.get("errorMessage")

		if (commit) {
			const base = "https://github.com/breck7/pldb/commit/"
			document.getElementById(
				"successLink"
			).innerHTML = `<a target="_pldb" href="${base +
				commit}">Success! Changes published as ${commit.substring(0, 7)}</a>`
		}
		if (errorMessage)
			document.getElementById(
				"errorMessage"
			).innerHTML = `Error: ${Utils.htmlEscaped(errorMessage)}`

		window.location.hash = ""
	}

	startForm() {
		Mousetrap.bind("mod+s", evt => {
			document.getElementById("submitButton").click()
			evt.preventDefault()
			return false
		})
		this.updateAuthor()
		this.updateQuickLinks()
		this.startPLDBCodeMirror()
	}

	startCreateForm() {
		document.getElementById(
			"exampleSection"
		).innerHTML = `Example:<br><pre>title Elixir
appeared 2011
type pl
creators José Valim
website https://elixir-lang.org/
githubRepo https://github.com/elixir-lang/elixir</pre>`
	}

	async startPLDBCodeMirror() {
		this.programCompiler = pldbNode
		this.codeMirrorInstance = new GrammarCodeMirrorMode(
			"custom",
			() => pldbNode,
			undefined,
			CodeMirror
		)
			.register()
			.fromTextAreaWithAutocomplete(document.getElementById("content"), {
				lineWrapping: false,
				lineNumbers: true
			})

		this.codeMirrorInstance.setSize(this.codeMirrorWidth, 500)
		this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
	}

	get codeMirrorWidth() {
		return document.getElementById("leftCell").width
	}

	updateAuthor() {
		document.getElementById("authorLabel").innerHTML = Utils.htmlEscaped(
			this.author
		)
		document.getElementById("author").value = this.author
	}

	get store() {
		return window.localStorage
	}

	saveAuthorIfUnsaved() {
		try {
			if (!this.store.getItem("author")) this.saveAuthor(defaultAuthor)
		} catch (err) {
			console.error(err)
		}
	}

	saveAuthor(name) {
		try {
			this.store.setItem("author", name)
		} catch (err) {
			console.error(err)
		}
	}

	changeAuthor() {
		const newValue = prompt(
			`Enter author name and email formatted like "Breck Yunits <by@breckyunits.com>". This information is recorded in the public Git log.`,
			this.author
		)
		if (newValue === "") this.saveAuthor(defaultAuthor)
		if (newValue) this.saveAuthor(newValue)
		this.updateAuthor()
	}

	get content() {
		return document.getElementById("content").value
	}

	get route() {
		return location.pathname.split("/").pop()
	}

	updateQuickLinks() {
		const { content } = this
		if (!content) return
		const tree = new TreeNode(content)
		const id = tree.get("title")
		const references = tree
			.findNodes("reference")
			.map(node => "Reference: " + node.getContent())

		const links = ["website", "githubRepo", "wikipedia"]
			.filter(key => tree.has(key))
			.map(key => `${Utils.capitalizeFirstLetter(key)}: ${tree.get(key)}`)

		const permalink = this.route
		document.getElementById("quickLinks").innerHTML =
			Utils.linkify(`<b>PLDB on ${id}:</b><br>
Git: https://github.com/breck7/pldb/blob/main/database/things/${permalink}.pldb<br>
HTML page: https://pldb.com/languages/${permalink}.html
<br><br>
<b>Links about ${id}:</b><br>
${links.join("<br>")}
${references.join("<br>")}<br><br>

<b>Search for more information about ${id}:</b><br>
Google: https://www.google.com/search?q=${id}+programming+language<br>
Google w/time: https://www.google.com/search?q=${id}+programming+language&tbs=cdr%3A1%2Ccd_min%3A1%2F1%2F1980%2Ccd_max%3A12%2F31%2F1995&tbm=<br>
Google Scholar: https://scholar.google.com/scholar?q=${id}<br>
Google Groups: https://groups.google.com/forum/#!search/${id}<br>
Google Trends: https://trends.google.com/trends/explore?date=all&q=${id}<br>
DDG: https://duckduckgo.com/?q=${id}<br>`) +
			`Wayback Machine: <a target="_blank" href="https://web.archive.org/web/20220000000000*/${id}">https://web.archive.org/web/20220000000000*/${id}</a>`
	}
}

document.addEventListener("DOMContentLoaded", function(event) {
	window.app = new TreeBaseFrontEndApp()
	window.app.start()
})
