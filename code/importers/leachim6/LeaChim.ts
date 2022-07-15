#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const cacheDir = __dirname + "/cache/"
const hwDir = cacheDir + "hello-world/"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")

const skips = [`MOONBlock`, "Executable", "Scratch ", "Pxem", "Piet"]

class LeaChimImporter {
	parseAllCommand() {
		const entries = []
		const folders = Disk.getFolders(hwDir).filter(name => !name.startsWith("."))
		folders.forEach(folder => {
			Disk.getFiles(folder)
				.filter(file => !skips.some(skip => file.includes(skip)))
				.forEach(file => {
					const filename = file.split("/").pop()
					const parts = filename.split(".")
					const extension = parts.length > 1 ? parts.pop() : ""

					if (filename.includes(".png")) return

					const code = Disk.read(file)
					// todo: smarter binary detection
					if (code.length > 1000) return

					entries.push({
						file,
						extension,
						name: parts.join("."),
						code
					})
				})
		})
		const tree = new jtree.TreeNode()
		entries.forEach(entry => {
			tree.appendLineAndChildren(
				entry.file,
				`name ${entry.name}
extension ${entry.extension}
code
 ${entry.code.replace(/\n/g, "\n ")}`
			)
		})
		Disk.write(cacheDir + "parsed.tree", tree.toString())
		console.log(tree.length)
	}
}

export { LeaChimImporter }

if (!module.parent) runCommand(new LeaChimImporter(), process.argv[2])
