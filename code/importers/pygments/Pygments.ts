import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")
const outputFile = cacheDir + "output.json"

class PygmentsImporter {
	linkAllCommand() {
		this.matches.forEach(entry => {
			this.writeOne(entry.file, entry)
		})
	}

	extractDataCommand() {
		this.matches.forEach(entry => {
			this.extractData(entry.file, entry)
		})
	}

	extractData(file, entry) {
		if (!file.has("pygmentsHighlighter")) return
		if (!file.has("keywords") && entry.keywords.length)
			file.set("keywords", entry.keywords.join(" "))

		const nums = [
			"Octals",
			"Hexadecimals",
			"Floats",
			"Integers",
			"BinaryNumbers"
		]

		nums.forEach(num => {
			const path = `features has${num}`
			const value = entry[num.toLowerCase()]
			const { lineCommentToken } = file
			if (file.get(path) === undefined && value) {
				file.set(path, "true")
				if (lineCommentToken)
					file.touchNode(path).setChildren(lineCommentToken + " " + value)
			}
		})

		const features = ["hasLineComments", "hasMultiLineComments"]

		features.forEach(feature => {
			const path = `features ${feature}`
			const value = entry[feature]
			const { lineCommentToken } = file
			if (file.get(path) === undefined && value) {
				file.set(path, "true")
			}
		})

		file.prettifyAndSave()
	}

	writeOne(file, entry) {
		if (file.has("pygmentsHighlighter")) return

		file.set("pygmentsHighlighter", entry.name)
		file.set("pygmentsHighlighter filename", entry.filename)

		const extensions = entry.extensions.join(" ")
		if (extensions) file.set("pygmentsHighlighter fileExtensions", extensions)
		file.save()
	}

	get data() {
		return Disk.readJson(outputFile)
	}

	get match() {
		return this.data.map(entry => {
			entry.extensions = entry.filenames.map(ext => ext.replace("*.", ""))
			entry.filename = entry.filename.split("/").pop()
			entry.pldbId =
				pldbBase.searchForEntity(entry.name) ||
				pldbBase.searchForEntityByFileExtensions(entry.extensions)

			if (entry.pldbId) entry.file = pldbBase.getFile(entry.pldbId)
			return entry
		})
	}

	get matches() {
		return this.match.filter(item => item.pldbId)
	}

	get misses() {
		return this.match.filter(item => !item.pldbId)
	}

	addMissesCommand() {
		this.misses
			.filter(hit => hit.url)
			.forEach(miss => {
				const website = miss.url.includes("github")
					? `githubRepo ${miss.url}`
					: `website ${miss.url}`
				const newFile = pldbBase.createFile(`title ${miss.name}
type pl
${website}`)
				this.writeOne(newFile, miss)
			})
	}
}

export { PygmentsImporter }

if (!module.parent) runCommand(new PygmentsImporter(), process.argv[2])
