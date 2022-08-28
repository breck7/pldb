const defaultAuthor = "Anon <anon@pldb.com>"
const htmlEscaped = content => content.replace(/</g, "&lt;")
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}
class EditApp {
	start() {
		if (document.getElementById("submitButton")) this.startForm()
		if (this.route === "create") this.startCreateForm()

		const urlParams = new URLSearchParams(window.location.hash.replace("#", ""))
		const commit = urlParams.get("commit")

		if (commit) {
			const base = "https://github.com/breck7/pldb/commit/"
			document.getElementById(
				"successLink"
			).innerHTML = `<a target="_pldb" href="${base +
				commit}">Success! Changes published as ${commit.substring(0, 7)}</a>`
			window.location.hash = ""
		}
	}

	startForm() {
		Mousetrap.bind("mod+s", evt => {
			document.getElementById("submitButton").click()
			evt.preventDefault()
			return false
		})
		this.updateAuthor()
		this.updateQuickLinks()
		this.startCodeMirror()
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

	async startCodeMirror() {
		this.codeMirrorInstance = new jtree.TreeNotationCodeMirrorMode(
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
		this.codeMirrorInstance.setSize(window.innerWidth / 2 - 50, 500)
		// this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
	}

	updateAuthor() {
		document.getElementById("authorLabel").innerHTML = htmlEscaped(this.author)
		document.getElementById("author").value = this.author
	}

	get store() {
		return window.localStorage
	}

	get author() {
		let author = defaultAuthor

		try {
			const changedAuthor = this.store.getItem("author")
			author = changedAuthor ?? author
		} catch (err) {
			console.error(err)
		}
		return author
	}

	setAuthor(name) {
		this.store.setItem("author", name)
		this.updateAuthor()
	}

	changeAuthor() {
		const newValue = prompt(
			`Enter new author name in format like ${defaultAuthor}`,
			this.author || defaultAuthor
		)
		if (newValue === "") this.setAuthor(defaultAuthor)
		if (newValue) this.setAuthor(newValue)
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
		const tree = new jtree.TreeNode(content)
		const id = tree.get("title")
		const references = tree
			.findNodes("reference")
			.map(node => "Reference: " + node.getContent())

		const links = ["website", "githubRepo", "wikipedia"]
			.filter(key => tree.has(key))
			.map(key => `${capitalizeFirstLetter(key)}: ${tree.get(key)}`)

		const permalink = this.route
		document.getElementById("quickLinks").innerHTML =
			TreeUtils.linkify(`<b>PLDB on ${id}:</b><br>
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
	window.app = new EditApp()
	window.app.start()
})
