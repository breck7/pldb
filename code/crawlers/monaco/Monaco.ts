#!/usr/bin/env node

import { PLDBFolder } from "../../Folder"
import { PLDBFile } from "../../File"

const { Utils } = require("jtree/products/Utils.js")
const { TreeNode } = require("jtree/products/TreeNode.js")
const lodash = require("lodash")

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBFolder.getBase().loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")

const monacoFolder = cacheDir + "monaco-editor/src/basic-languages/"

class MonacoImporter {
	extractComments(match) {
		const { file } = match
		const { conf } = require(match.filename)
		try {
			if (conf.comments?.lineComment) {
				const currentToken = file.get("lineCommentToken")
				const newToken = conf.comments.lineComment
				if (!currentToken) file.set("lineCommentToken", newToken)
			}

			if (conf.comments?.blockComment) {
				const currentToken = file.get("multiLineCommentTokens")
				const newToken = lodash.uniq(conf.comments.blockComment)
				if (!currentToken)
					file.set("multiLineCommentTokens", newToken.join(" "))
			}
		} catch (err) {
			console.error(`Error with comments with ${file.id}`)
		}
		file.prettifyAndSave()
	}

	extractKeywords(match) {
		const { file } = match
		try {
			const { language } = require(match.filename)
			if (language.keywords && !file.has("keywords"))
				file.set("keywords", language.keywords.join(" "))
		} catch (err) {
			console.error(`Error with keywords with ${file.id}`)
		}
		file.prettifyAndSave()
	}

	extractMany(match) {
		const { file } = match
		try {
			const { language } = require(match.filename)
			const { tokenizer } = language
			if (tokenizer.string && !file.get("features hasStrings"))
				file.set("features hasStrings", "true")
			if (
				tokenizer.regexp ||
				(language.regEx &&
					!file.get("features hasRegularExpressionsSyntaxSugar"))
			)
				file.set("features hasRegularExpressionsSyntaxSugar", "true")
		} catch (err) {
			console.error(`Error with many with ${file.id}`)
		}
		file.prettifyAndSave()
	}

	writeAllCommand() {
		this.matched.forEach(match => {
			//this.extractComments(match)
			// this.extractKeywords(match)
			this.extractMany(match)
		})
	}

	linkAllCommand() {
		this.matched.forEach(match => {
			const { file } = match
			file.set("monaco", match.name)
			file.prettifyAndSave()
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

if (!module.parent) Utils.runCommand(new MonacoImporter(), process.argv[2])
