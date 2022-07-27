const defaultAuthor = "Anon <anon@pldb.pub>"
const htmlEscaped = content => content.replace(/</g, "&lt;")
class EditApp {
	start() {
		if (document.getElementById("previousFile")) this.startNav()
		if (document.getElementById("submitButton")) this.startForm()

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
	}

	updateAuthor() {
		document.getElementById("authorLabel").innerHTML = htmlEscaped(this.author)
		document.getElementById("author").value = this.author
	}

	startNav() {
		Mousetrap.bind("left", () =>
			document.getElementById("previousFile").click()
		)
		Mousetrap.bind("right", () => document.getElementById("nextFile").click())
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

	updateQuickLinks() {
		const content = document.getElementById("content").value
		if (!content) return
		const tree = new jtree.TreeNode(content)
		const id = tree.get("title")
		const references = tree
			.findNodes("reference")
			.map(node => node.getContent())
		const links = [
			tree.get("website"),
			tree.get("githubRepo"),
			tree.get("wikipedia"),
			...references
		]
			.filter(i => i)
			.join("<br>")

		const permalink = location.pathname.split("/").pop()
		const html =
			TreeUtils.linkify(`${links}<br><br>
Google<br>
Search: https://www.google.com/search?q=${id}+programming+language<br>
W/time: https://www.google.com/search?q=${id}+programming+language&tbs=cdr%3A1%2Ccd_min%3A1%2F1%2F1980%2Ccd_max%3A12%2F31%2F1995&tbm=<br>
Scholar: https://scholar.google.com/scholar?q=${id}<br>
Groups: https://groups.google.com/forum/#!search/${id}<br>
Trends: https://trends.google.com/trends/explore?date=all&q=${id}<br>
<br>
DDG: https://duckduckgo.com/?q=${id}<br>`) +
			`Wayback: <a target="_blank" href="https://web.archive.org/web/20220000000000*/${id}">https://web.archive.org/web/20220000000000*/${id}</a>` +
			TreeUtils.linkify(`<br><br>
https://pldb.pub/languages/${permalink}.html<br>
https://github.com/breck7/pldb/blob/main/database/things/${permalink}.pldb`)
		document.getElementById("quickLinks").innerHTML = html
	}
}

document.addEventListener("DOMContentLoaded", function(event) {
	window.app = new EditApp()
	window.app.start()
})
