#!/usr/bin/env node

const fs = require("fs")
const { Disk } = require("jtree/products/Disk.node.js")
const path = require("path")
const numeral = require("numeral")
const { jtree } = require("jtree")
const { TreeNode } = jtree

import { PLDBFolder } from "./Folder"
import { runCommand, htmlEscaped } from "./utils"

const baseFolder = path.join(__dirname, "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const searchLogPath = path.join(ignoreFolder, "searchLog.tree")

try {
	Disk.mkdir(ignoreFolder)
	Disk.touch(searchLogPath)
} catch (err) {
	console.error(err)
}

class SearchServer {
	folder = PLDBFolder.getBase().loadFolder()

	logQuery(originalQuery: string, ip: string) {
		const tree = `search
 time ${Date.now()}
 ip ${ip}
 query
  ${originalQuery.replace(/\n/g, "\n  ")} 
`
		fs.appendFile(searchLogPath, tree, function() {})
		return this
	}

	search(originalQuery: string, format = "html"): string {
		const query = decodeURIComponent(originalQuery)
		const startTime = Date.now()
		const pldbBase = this.folder
		const lowerCaseQuery = query.toLowerCase()
		// Todo: allow advanced search. case sensitive/insensitive, regex, et cetera.
		const testFn = str => str.includes(lowerCaseQuery)

		const escapedQuery = htmlEscaped(lowerCaseQuery)
		const fullTextHits = pldbBase.filter(file => testFn(file.lowercase))
		const nameHits = pldbBase.filter(file => file.lowercaseNames.some(testFn))
		const baseUrl = "https://pldb.com/languages/"

		if (format === "csv") {
			nameHits.map(file => file.set("pldbId", file.pldbId))
			fullTextHits.map(file => file.set("pldbId", file.pldbId))

			const columns = ["pldbId", "title", "type", "appeared", "creators"]
			console.log(`## ${nameHits.length} name hits`)
			console.log(new TreeNode(nameHits).toDelimited(",", columns))

			console.log(``)

			console.log(`## ${fullTextHits.length} full text hits`)
			console.log(new TreeNode(fullTextHits).toDelimited(",", columns))
			return
		}

		const highlightHit = file => {
			const line = file.lowercase.split("\n").find(line => testFn(line))
			return line.replace(
				lowerCaseQuery,
				`<span style="highlightHit">${lowerCaseQuery}</span>`
			)
		}
		const fullTextSearchResults = fullTextHits
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

* <p class="searchResultsHeader">Searched ${numeral(pldbBase.length).format(
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

* <p class="searchResultsHeader">Showing ${
			fullTextHits.length
		} files who matched on a full text search.</p>

html
 ${fullTextSearchResults}`
	}
}

export { SearchServer }

if (!module.parent)
	new SearchServer().search(process.argv.slice(2).join(" "), "csv")
