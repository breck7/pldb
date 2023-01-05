#!/usr/bin/env node

/*

* To investigate slowdowns:

code
 node --cpu-prof --cpu-prof-name=test.cpuprofile ./code/test.js

* Then:

- open a new Chrome tab
- open devtools
- click Performance
- click "Load Profile..."
- select your test.cpuprofile
*/

const tap = require("tap")
const lodash = require("lodash")
const path = require("path")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { ScrollFolder, ScrollCli, ScrollFile } = require("scroll-cli")
const { Disk } = require("jtree/products/Disk.node.js")

import { PLDBFolder } from "./Folder"
import { getCleanedId } from "./utils"

const pldbBase = PLDBFolder.getBase().loadFolder()
const rootDir = path.join(__dirname, "..")
const languagesDir = path.join(rootDir, "site", "languages")

const runTree = testTree => {
	const times = []
	Object.keys(testTree).forEach(key => {
		const startTime = Date.now()
		testTree[key](tap.equal)
		times.push({ TestName: key, Elapsed: (Date.now() - startTime) / 1000 })
	})

	console.log(
		new TreeNode(lodash.sortBy(times, "Elapsed").reverse()).toFormattedTable()
	)
}

const testTree: any = {}

testTree.ensureNoErrorsInGrammar = areEqual => {
	const grammarErrors = new grammarNode(pldbBase.grammarCode)
		.getAllErrors()
		.map(err => err.toObject())
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in pldb grammar")
}

testTree.ensureNoErrorsInScrollExtensions = areEqual => {
	const scrollFolder = new ScrollFolder(__dirname)
	const { grammarErrors } = scrollFolder
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in scroll extensions")
}

// todo
testTree.ensureNoErrorsInBlog = areEqual => {
	const checkScroll = folderPath => {
		// Do not check all ~5K generated scroll files for errors b/c redundant and wastes time.
		// Just check the Javascript one below.
		if (folderPath.includes("languages")) return
		const folder = new ScrollFolder(folderPath)
		areEqual(
			folder.grammarErrors.length,
			0,
			`no scroll errors in ${folderPath}`
		)
		//areEqual(folder.errors.length, 0, `no errors in ${folderPath}`)
	}

	const cli = new ScrollCli()
	cli.verbose = false
	Object.keys(cli.findScrollsInDirRecursive(rootDir)).map(checkScroll)

	const jsPagePath = path.join(languagesDir, "javascript.scroll")
	const jsFile = new ScrollFile(Disk.read(jsPagePath), undefined, jsPagePath)
	const errors = jsFile.scrollScriptProgram.getAllErrors()
	areEqual(
		errors.length,
		0,
		"no scroll errors in a generated language scroll file"
	)
}

testTree.ensureGoodFilenames = areEqual => {
	let invalidIds = 0
	let validIds = 0
	pldbBase.forEach(file => {
		if (file.id !== getCleanedId(file.id)) invalidIds++
		else validIds++
	})

	if (!invalidIds) {
		areEqual(0, 0, `all ${validIds} pldbId's are valid`)
		// We can abort early to print a lot of test output
		return
	}

	pldbBase.forEach(file =>
		areEqual(file.id, getCleanedId(file.id), `${file.id} is a valid pldbId`)
	)
}

testTree.ensureNoBrokenPermalinks = areEqual => {
	areEqual(
		!!pldbBase.inboundLinks,
		true,
		"should not throw because of broken permalink"
	)
}

testTree.ensureFieldsAreTrimmed = areEqual => {
	const scrollFolder = new ScrollFolder(__dirname)
	const { grammarErrors } = scrollFolder
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in scroll extensions")
}

testTree.ensureNoErrorsInDb = areEqual => {
	const { errors } = pldbBase
	if (errors.length)
		errors.forEach(err =>
			console.log(
				err._node.getRootNode().get("title"),
				err._node.getFirstWordPath(),
				err
			)
		)
	areEqual(errors.length, 0, "no errors in db")
}

testTree.ensurePrettifiedCausesNoSemanticChanges = areEqual => {
	// Arrange
	const pre = pldbBase.typedMap

	// Act
	pldbBase.forEach((file, index) => {
		const originalTypedMap = file.typedMap
		if (index > 10) return
		file.prettify()

		areEqual(
			lodash.isEqual(originalTypedMap, file.typedMap),
			true,
			"typed map doesnt change after prettify"
		)

		const result = file.toString()
		file.prettify()
		const result2 = file.toString()
		areEqual(result, result2, `prettify is stable`)
	})
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
