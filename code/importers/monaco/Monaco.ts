#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")

const monacoFolder = cacheDir + "monaco-editor/src/basic-languages/"

class MonacoImporter {
	writeAllCommand() {
		this.matched.forEach(match => {
			try {
				const { file } = match
				const { conf } = require(match.filename)

				if (conf.comments?.lineComment) {
					const currentToken = file.get("lineCommentToken")
					const newToken = conf.comments.lineComment
					if (!currentToken) {
						file.set("lineCommentToken", newToken)
						file.save()
					}
				}
			} catch (err) {
				console.error(`Error with ${match.name}`)
			}
		})
	}

	linkAllCommand() {
		this.matched.forEach(match => {
			const { file } = match
			file.set("monaco", match.name)
			file.save()
		})
	}

	get missing() {
		return this.paired.filter(pair => !pair.matched)
	}

	get matched() {
		return this.paired.filter(pair => pair.matched)
	}

	listMissingCommand() {
		console.log(this.missing)
	}

	get paired() {
		return Disk.getFolders(monacoFolder).map(path => {
			const name = Disk.getFileName(path)
			const matched = pldbBase.searchForEntity(name)
			const file = matched ? pldbBase.getFile(matched) : undefined
			const filename = path + "/" + name + ".js"
			return {
				path,
				name,
				matched,
				filename,
				file
			}
		})
	}
}

export { MonacoImporter }

if (!module.parent) runCommand(new MonacoImporter(), process.argv[2])
