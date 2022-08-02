#!/usr/bin/env ts-node

const tap = require("tap")
const lodash = require("lodash")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { Disk } = require("jtree/products/Disk.node.js")

import { PLDBBaseFolder } from "./PLDBBase"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

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
	areEqual(grammarErrors.length, 0)
}

// todo
testTree.ensureNoErrorsInBlog = areEqual => {}

testTree.ensureNoErrorsInDb = areEqual => {
	const { errors } = pldbBase
	if (errors.length) console.log(errors)
	areEqual(errors.length, 0)
}

testTree.ensurePrettifiedCausesNoSemanticChanges = areEqual => {
	// Arrange
	const pre = pldbBase.typedMapShort

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
	const post = pldbBase.typedMapShort
	areEqual(
		lodash.isEqual(pre, post),
		true,
		"typed map doesnt change after prettify"
	)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
