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
			const { file } = entry
			file.set("pygmentsHighlighter", entry.name)
			file.set("pygmentsHighlighter filename", entry.filename)

			const extensions = entry.filenames
				.map(ext => ext.replace("*.", ""))
				.join(" ")
			if (extensions) file.set("pygmentsHighlighter fileExtensions", extensions)
			file.save()
		})
	}

	get data() {
		return Disk.readJson(outputFile)
	}

	get matches() {
		return this.data
			.map(entry => {
				entry.pldbId = pldbBase.searchForEntity(entry.name)
				entry.filename = entry.filename.split("/").pop()
				if (entry.pldbId) entry.file = pldbBase.getFile(entry.pldbId)
				return entry
			})
			.filter(item => item.pldbId)
	}
}

export { PygmentsImporter }

if (!module.parent) runCommand(new PygmentsImporter(), process.argv[2])
