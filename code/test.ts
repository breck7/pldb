#!/usr/bin/env node

const tap = require("tap")
const lodash = require("lodash")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { ScrollFolder } = require("scroll-cli")

import { PLDBBaseFolder } from "./PLDBBase"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()

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
testTree.ensureNoErrorsInBlog = areEqual => {}

testTree.ensureNoBrokenPermalinks = areEqual => {
	areEqual(
		!!pldbBase.inboundLinks,
		true,
		"should not throw because of broken permalink"
	)
}

testTree.ensureNoErrorsInDb = areEqual => {
	const { errors } = pldbBase
	if (errors.length) console.log(errors)
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
