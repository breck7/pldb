#!/usr/bin/env node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const lodash = require("lodash")
const path = require("path")
const readline = require("readline")
const fs = require("fs")

const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const cacheDir = path.join(__dirname, "cache")

Disk.mkdir(cacheDir)

const filePath = path.join(cacheDir, "gh.json")
const outputPath = path.join(cacheDir, "gh.csv")

class BigQueryImporter {
	get pairs() {
		return this.table.map(row => {
			const id = pldbBase.searchForEntity(row.language)
			return { file: pldbBase.getFile(id), row }
		})
	}

	get matched() {
		return this.pairs.filter(row => row.file)
	}

	get unmatched() {
		return this.pairs
			.filter(row => row.file === undefined)
			.map(item => item.row)
	}

	listUnmatchedCommand() {
		const str = new TreeNode(this.unmatched).toFormattedTable()
		const missingPath = path.join(cacheDir, "missing.txt")
		Disk.write(missingPath, str)
		console.log(`Wrote ${this.unmatched.length} missing to: ${missingPath}`)
	}

	writeAllCommand() {
		this.matched.forEach(pair => {
			const { file, row } = pair
			file.set("githubBigQuery", row.language)
			file.set("githubBigQuery repos", row.repos)
			file.set("githubBigQuery users", row.users)
			file.prettifyAndSave()
		})
	}

	get table() {
		return TreeNode.fromCsv(Disk.read(outputPath)).map(item => item.toObject())
	}

	processGitHubFileCommand() {
		const langs = {}

		const lineReader = readline.createInterface({
			input: fs.createReadStream(filePath)
		})

		lineReader.on("line", function(line) {
			const obj = JSON.parse(line)
			const [username, repoName] = obj.repo_name.split("/")

			obj.language.forEach(item => {
				const lang = item.name
				if (!langs[lang])
					langs[lang] = {
						language: lang,
						repos: 0,
						users: new Set()
					}

				const hit = langs[lang]
				hit.users.add(username)
				hit.repos++
			})
		})

		lineReader.on("close", function() {
			Object.values(langs).forEach((lang: any) => {
				lang.users = lang.users.size
			})
			const sorted = lodash.sortBy(langs, "repos").reverse()
			Disk.write(outputPath, new TreeNode(sorted).toCsv())
		})
	}
}

export { BigQueryImporter }

if (!module.parent) runCommand(new BigQueryImporter(), process.argv[2])
