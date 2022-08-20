#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand } from "../../utils"
import { jtree } from "jtree"

const path = require("path")
const { Disk } = require("jtree/products/Disk.node.js")
const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()
const compilerExplorerKey = "compilerExplorer"

const langPath = path.join(
	__dirname,
	"cache",
	"compiler-explorer",
	"out",
	"dist",
	"lib",
	"languages.js"
)

const prepLangFile = () => {
	const content =
		Disk.read(langPath)
			.replace(
				`import path from 'path';
import fs from 'fs-extra';
import _ from 'underscore';`,
				`const path = require('path');
const fs = require('fs-extra');
const _ = require('underscore');`
			)
			.replace("export const languages", "const languages") +
		`\nmodule.exports = {languages};`

	Disk.write(langPath, content)
}

class PLDBFileWithCompilerExplorer {
	constructor(file: PLDBFile) {
		this.file = file
	}

	file: PLDBFile

	get compilerExplorerNode() {
		return this.file.getNode(compilerExplorerKey)
	}

	writeInfo() {
		const { file, compilerExplorerNode } = this
		//file.prettifyAndSave()
		return this
	}
}

class CompilerExplorerImporter {
	constructor() {
		prepLangFile()
	}

	get languages() {
		return require(langPath).languages
	}

	writeAllRepoDataCommand() {
		this.linkedFiles.forEach(file =>
			new PLDBFileWithCompilerExplorer(file).writeInfo()
		)
	}

	async writeLinksCommand() {
		this.matched.forEach(match => {
			const { file, lang } = match
			const { name } = lang
			const node = file.touchNode(compilerExplorerKey)
			if (!node.getContent()) {
				node.setContent(name)
				file.prettifyAndSave()
			}
		})
	}

	get pairs() {
		return Object.values(this.languages).map((lang: any) => {
			const id = pldbBase.searchForEntity(lang.name)
			return { file: pldbBase.getFile(id), lang }
		})
	}

	get matched() {
		return this.pairs.filter(row => row.file)
	}

	get unmatched() {
		return this.pairs
			.filter(row => row.file === undefined)
			.map(item => item.lang)
	}

	listUnmatchedLangsCommand() {
		console.log(this.languages)
		const missingPath = path.join(cacheDir, "missingLangs.json")
		Disk.write(missingPath, JSON.stringify(this.unmatched, null, 2))
		console.log(`Wrote ${this.unmatched.length} missing to: ${missingPath}`)
	}

	get linkedFiles() {
		return pldbBase.filter(file => file.has(compilerExplorerKey))
	}
}

export { CompilerExplorerImporter }

if (!module.parent) runCommand(new CompilerExplorerImporter(), process.argv[2])
