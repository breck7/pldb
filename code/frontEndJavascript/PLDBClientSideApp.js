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

const localStorageKeys = {
	staged: "staged",
	author: "author",
	email: "email",
	password: "password"
}

const STAGED_KEY = "staged"
const TEXTAREA_ID = "fileContent"

let autocompleteIndex = false
let autocompleteIndexRequestMade = false

const SearchSuggestionInterface = {
	label: "string",
	appeared: "number",
	id: "string",
	url: "string"
}

const tinyTypeScript = (items, expectedInterface) =>
	items.forEach(item => {
		Object.keys(item).forEach(key => {
			const value = item[key]
			const actualType = typeof item[key]
			const expectedType = expectedInterface[key]
			const passed = actualType === expectedType
			console.assert(passed)
			if (!passed)
				console.error(
					`For key '${key}' object had type '${actualType}' but expected '${expectedType}'. Value was '${value}'`
				)
		})
	})

// This method is currently used to enable autocomplete on: the header search, front page search, 404 page search
const initSearchAutocomplete = elementId => {
	const input = document.getElementById(elementId)
	const urlParams = new URLSearchParams(window.location.search)
	const query = urlParams.get("q")
	if (query) input.value = query
	autocomplete({
		input,
		minLength: 1,
		emptyMsg: "No matching entities found",
		preventSubmit: true,
		fetch: async (query, update) => {
			text = query.toLowerCase()
			// you can also use AJAX requests instead of preloaded data

			if (!autocompleteIndexRequestMade) {
				autocompleteIndexRequestMade = true
				let response = await fetch("/dist/autocomplete.json")
				if (response.ok) autocompleteIndex = await response.json()
			}

			const suggestions = autocompleteIndex.filter(entity =>
				entity.label.toLowerCase().startsWith(text)
			)

			const htmlEncodedQuery = query.replace(/</g, "&lt;")

			suggestions.push({
				label: `Full text search for "${htmlEncodedQuery}"`,
				appeared: 2022,
				id: "",
				url: `/fullTextSearch?q=${htmlEncodedQuery}`
			})
			tinyTypeScript(suggestions, SearchSuggestionInterface)

			update(suggestions)
		},
		onSelect: item => {
			const { url, id } = item
			if (id) window.location = url
			else
				window.location = "/fullTextSearch?q=" + encodeURIComponent(input.value)
		}
	})
}

class TrueBaseFrontEndApp {
	constructor() {
		window.app = this
	}

	get loggedInUser() {
		return this.store.getItem(localStorageKeys.email)
	}

	hideUserAccountsButtons() {
		jQuery(".loggedIn,.notLoggedIn").hide()
	}

	revealUserAccountButtons() {
		if (this.loggedInUser) {
			jQuery(".loggedIn").show()
			jQuery("#logoutButton").attr(
				"title",
				`Logout of ${this.store.getItem(localStorageKeys.email)}`
			)
		} else jQuery(".notLoggedIn").show()
	}

	logoutCommand() {
		this.store.clear()
		jQuery(".loginMessage").show()
		jQuery(".loginMessage").html(`You are now logged out.`)
		this.hideUserAccountsButtons()
		this.revealUserAccountButtons()
	}

	attemptLoginCommand() {
		const params = new URLSearchParams(window.location.search)
		const email = params.get("email")
		const password = params.get("password")
		window.history.replaceState({}, null, "login.html")
		if (this.loggedInUser) {
			jQuery("#loginResult").html(
				`You are already logged in as ${this.loggedInUser}`
			)
			return
		}
		if (!email || !password) {
			jQuery("#loginResult").html(
				`Email and password not in url. Try clicking your link again? If you think this is a bug please email loginProblems@pldb.com`
			)
			return
		}
		jQuery.post("/login", { email, password }, data => {
			if (data === "OK") {
				jQuery("#loginResult").html(`You are logged in as ${email}`)
				this.store.setItem(localStorageKeys.email, email)
				this.store.setItem(localStorageKeys.password, password)
				this.hideUserAccountsButtons()
				this.revealUserAccountButtons()
			} else
				jQuery("#loginResult").html(
					"Sorry. Something went wrong. If you think this is a bug please email loginProblems@pldb.com"
				)
		})
	}

	verifyEmailAndSendLoginLinkCommand() {
		// send link
		const email = jQuery("#loginEmail").val()
		const htmlEscapedEmail = Utils.htmlEscaped(email)
		if (!Utils.isValidEmail(email)) {
			jQuery(".loginMessage").show()
			jQuery(".loginMessage").html(
				`'${htmlEscapedEmail}' is not a valid email.`
			)
			return
		}
		jQuery(".notLoggedIn").hide()
		jQuery.post("/sendLoginLink", { email }, data => {
			jQuery(".loginMessage").show()
			console.log(data)
			jQuery(".loginMessage").html(`Login link sent to '${htmlEscapedEmail}'.`)
		})
	}

	defaultAuthor = genDefaultAuthor()

	get author() {
		try {
			return this.store.getItem(localStorageKeys.author) || this.defaultAuthor
		} catch (err) {
			console.error(err)
		}

		return this.defaultAuthor
	}

	renderSearchPage() {
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
		const code = this.value
		if (this._code === code) return
		this._code = code
		this.program = new this.programCompiler(code)
		const errs = this.program.scopeErrors.concat(this.program.getAllErrors())

		const errMessage = errs.length
			? errs.map(err => err.getMessage()).join(" ")
			: "&nbsp;"
		document.getElementById("tqlErrors").innerHTML = errMessage
	}

	async renderEditPage() {
		this.renderCodeEditorStuff()
		await this.initEditData()
		this.updateQuickLinks()
	}

	renderCreatePage() {
		this.renderCodeEditorStuff()
		document.getElementById(
			"exampleSection"
		).innerHTML = `Example:<br><pre>title Elixir
appeared 2011
type pl
creators José Valim
website https://elixir-lang.org/
githubRepo https://github.com/elixir-lang/elixir</pre>`
	}

	renderCodeEditorStuff() {
		this.renderForm()
		this.startPLDBCodeMirror()
		this.bindStageButton()
		this.updateStagedStatus()
		this.updateAuthor()
	}

	async initEditData(currentValue, missingRecommendedColumns) {
		const { filename, currentFileId } = this
		const localValue = this.stagedFiles.getNode(filename)
		let response = await fetch(`/edit.json?id=${currentFileId}`)
		const data = await response.json()

		if (data.error)
			return (document.getElementById("formHolder").innerHTML = data.error)

		document.getElementById(
			"pageTitle"
		).innerHTML = `Editing file <i>${filename}</i>`

		document.addEventListener("keydown", function(event) {
			if (document.activeElement !== document.body) return
			if (event.key === "ArrowLeft")
				window.location = `edit.html?id=` + data.previous
			else if (event.key === "ArrowRight")
				window.location = `edit.html?id=` + data.next
		})

		this.codeMirrorInstance.setValue(
			localValue ? localValue.childrenToString() : data.content
		)
		document.getElementById(
			"missingRecommendedColumns"
		).innerHTML = `<br><b>Missing columns:</b><br>${data.missingRecommendedColumns
			.map(col => col.Column)
			.join("<br>")}`
	}

	updateStagedStatus() {
		const el = document.getElementById("stagedStatus")
		const { stagedFiles } = this
		el.style.display = "none"
		if (!stagedFiles.length) return
		document.getElementById("patch").value = stagedFiles.toString()
		el.style.display = "block"
	}

	bindStageButton() {
		const el = document.getElementById("stageButton")
		el.onclick = () => {
			const tree = this.stagedFiles
			tree.touchNode(this.filename).setChildren(this.value)
			this.setStage(tree.toString())
			this.updateStagedStatus()
		}

		Mousetrap.bind("mod+s", evt => {
			el.click()
			evt.preventDefault()
			return false
		})
	}

	setStage(str) {
		this.store.setItem(localStorageKeys.staged, str)
		document.getElementById("patch").value = str
	}

	get stagedFiles() {
		const str = this.store.getItem(localStorageKeys.staged)
		return str ? new TreeNode(str) : new TreeNode()
	}

	renderForm() {
		document.getElementById(
			"formHolder"
		).innerHTML = `<form method="POST" action="/saveCommitAndPush" id="stagedStatus" style="display: none;">
 <div>You have a patch ready to submit. Author is set as: <span id="authorLabel" class="linkButton" onClick="app.changeAuthor()"></span></div>
 <textarea id="patch" name="patch" readonly></textarea><br>
 <input type="hidden" name="author" id="author" />
 <input type="submit" value="Commit and push" id="saveCommitAndPushButton" onClick="app.saveAuthorIfUnsaved()"/> <a class="linkButton" onClick="app.clearChanges()">Clear local changes</a>
</form>
<div id="editForm">
 <div class="cell" id="leftCell">
   <textarea id="${TEXTAREA_ID}"></textarea>
   <div id="tqlErrors"></div> <!-- todo: cleanup. -->
 </div>
 <div class="cell">
   <div id="quickLinks"></div>
   <div id="missingRecommendedColumns"></div>
   <div id="exampleSection"></div>
 </div>
 <div>
   <button id="stageButton">Stage</button>
 </div>
</div>`
	}

	clearChanges() {
		if (
			confirm(
				"Are you sure you want to delete all local changes? This cannot be undone."
			)
		)
			this.setStage("")
		this.updateStagedStatus()
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
			.fromTextAreaWithAutocomplete(document.getElementById(TEXTAREA_ID), {
				lineWrapping: false,
				lineNumbers: true
			})

		this.codeMirrorInstance.setSize(this.codeMirrorWidth, 500)
		this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
	}

	get currentFileId() {
		return new URLSearchParams(window.location.search).get("id")
	}

	get filename() {
		if (location.pathname.includes("create.html")) return "create"
		return this.currentFileId + ".pldb"
	}

	get value() {
		return this.codeMirrorInstance.getValue()
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
			if (!this.store.getItem(localStorageKeys.author))
				this.saveAuthor(this.defaultAuthor)
		} catch (err) {
			console.error(err)
		}
	}

	saveAuthor(name) {
		try {
			this.store.setItem(localStorageKeys.author, name)
		} catch (err) {
			console.error(err)
		}
	}

	changeAuthor() {
		const newValue = prompt(
			`Enter author name and email formatted like "Breck Yunits <by@breckyunits.com>". This information is recorded in the public Git log.`,
			this.author
		)
		if (newValue === "") this.saveAuthor(this.defaultAuthor)
		if (newValue) this.saveAuthor(newValue)
		this.updateAuthor()
	}

	get route() {
		return location.pathname.split("/")[1]
	}

	updateQuickLinks() {
		const code = this.codeMirrorInstance.getValue()
		if (!code) return
		const tree = new TreeNode(code)
		const title = tree.get("title")
		const references = tree
			.findNodes("reference")
			.map(node => "Reference: " + node.content)

		const links = ["website", "githubRepo", "wikipedia"]
			.filter(key => tree.has(key))
			.map(key => `${Utils.capitalizeFirstLetter(key)}: ${tree.get(key)}`)

		const permalink = this.route
		document.getElementById("quickLinks").innerHTML =
			Utils.linkify(`<b>PLDB on ${title}:</b><br>
Git: https://github.com/breck7/pldb/blob/main/truebase/things/${permalink}.pldb<br>
HTML page: https://pldb.com/truebase/${permalink}.html
<br><br>
<b>Links about ${title}:</b><br>
${links.join("<br>")}
${references.join("<br>")}<br><br>

<b>Search for more information about ${title}:</b><br>
Google: https://www.google.com/search?q=${title}+programming+language<br>
Google w/time: https://www.google.com/search?q=${title}+programming+language&tbs=cdr%3A1%2Ccd_min%3A1%2F1%2F1980%2Ccd_max%3A12%2F31%2F1995&tbm=<br>
Google Scholar: https://scholar.google.com/scholar?q=${title}<br>
Google Groups: https://groups.google.com/forum/#!search/${title}<br>
Google Trends: https://trends.google.com/trends/explore?date=all&q=${title}<br>
DDG: https://duckduckgo.com/?q=${title}<br>`) +
			`Wayback Machine: <a target="_blank" href="https://web.archive.org/web/20220000000000*/${title}">https://web.archive.org/web/20220000000000*/${title}</a>`
	}
}

document.addEventListener("DOMContentLoaded", evt =>
	initSearchAutocomplete("headerSearch")
)
