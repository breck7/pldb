const defaultAuthor = "Anon <anon@pldb.pub>"
const htmlEscaped = content => content.replace(/</g, "&lt;")
class EditApp {
	start() {
		if (document.getElementById("previousFile")) this.startNav()
		if (document.getElementById("submitButton")) this.startForm()
	}

	startForm() {
		Mousetrap.bind("mod+s", evt => {
			document.getElementById("submitButton").click()
			evt.preventDefault()
			return false
		})
		this.updateAuthor()
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
}

document.addEventListener("DOMContentLoaded", function(event) {
	window.app = new EditApp()
	window.app.start()
})
