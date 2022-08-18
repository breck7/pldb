#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"
const hwDir = cacheDir + "hello-world/"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")

const skips = [`MOONBlock`, "Executable", "Scratch ", "Pxem", "Piet"]

const outputPath = cacheDir + "parsed.tree"

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
		const tree = new TreeNode()
		entries.forEach(entry => {
			const path = entry.file.split(`cache/hello-world/`)[1]
			tree.appendLineAndChildren(
				entry.file,
				`name ${entry.name}
filepath ${path}
code
 ${entry.code.replace(/\n/g, "\n ").replace(/\r/g, "")}`
			)
			if (entry.extension)
				tree.set(`${entry.file} fileExtensions`, entry.extension)
		})
		Disk.write(outputPath, tree.toString())
		console.log(tree.length)
	}

	get parsed() {
		return new TreeNode(Disk.read(outputPath))
	}

	writeAllCommand() {
		this.matched.forEach(match => {
			const { file, hit } = match
			file.set(`leachim6`, hit.get("name"))
			file.set(`leachim6 filepath`, hit.get("filepath"))
			const node = file.getNode(`leachim6`)
			if (hit.has("fileExtensions"))
				node.set("fileExtensions", hit.get("fileExtensions"))
			node.appendLineAndChildren(
				"example",
				hit.getNode("code").childrenToString()
			)
			file.save()
		})
	}

	get matched() {
		return this.parsed
			.map(node => {
				const hit = pldbBase.searchForEntity(node.get("name"))
				if (!hit) return false

				return {
					file: pldbBase.getFile(hit),
					hit: node
				}
			})
			.filter(i => i)
	}
}

export { LeaChimImporter }

if (!module.parent) runCommand(new LeaChimImporter(), process.argv[2])
