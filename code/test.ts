#!/usr/bin/env node

const tap = require("tap")
const lodash = require("lodash")
const path = require("path")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { ScrollFolder, ScrollCli } = require("scroll-cli")

import { PLDBFolder } from "./Folder"
import { getCleanedId } from "./utils"

const pldbBase = PLDBFolder.getBase().loadFolder()
const rootDir = path.join(__dirname, "..")

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

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
		const folder = new ScrollFolder(folderPath)
		areEqual(
			folder.grammarErrors.length,
			0,
			`no grammarErrors in ${folderPath}`
		)
		//areEqual(folder.errors.length, 0, `no errors in ${folderPath}`)
	}

	Object.keys(new ScrollCli().findScrollsInDirRecursive(rootDir)).map(
		checkScroll
	)
}

testTree.ensureGoodFilenames = areEqual => {
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
		if (index > 10) return
		file.prettify()
		const result = file.toString()
		file.prettify()
		const result2 = file.toString()
		areEqual(result, result2, `prettify is stable`)
	})

	// Assert
	const post = pldbBase.typedMap
	areEqual(
		lodash.isEqual(pre, post),
		true,
		"typed map doesnt change after prettify"
	)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
