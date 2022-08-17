#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"

import { jtree } from "jtree"

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
			Disk.write(outputPath, new jtree.TreeNode(sorted).toCsv())
		})
	}
}

export { BigQueryImporter }

if (!module.parent) runCommand(new BigQueryImporter(), process.argv[2])
