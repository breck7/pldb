#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")
const outputFile = cacheDir + "output.json"

class PygmentsImporter {
	writeAllCommand() {
		this.matches.forEach(entry => {
			this.writeOne(entry.file, entry)
		})
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
