#!/usr/bin/env ts-node

const lodash = require("lodash")
const tap = require("tap")
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
	const grammarErrors = new grammarNode(Disk.read(pldbBase.grammarPath))
		.getAllErrors()
		.map(err => err.toObject())
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0)
}

// todo
testTree.ensureNoErrorsInBlog = areEqual => {}

testTree.ensureNoErrorsInDb = areEqual => {
	const errors = pldbBase.parsed.getAllErrors()
	if (errors.length) console.log(errors)
	areEqual(errors.length, 0)
}

testTree.ensurePrettifiedCausesNoSemanticChanges = areEqual => {
	// Arrange
	const pre = pldbBase.typedMapShort

	// Act
	pldbBase.forEach(file => file.prettify())

	// Assert
	const post = pldbBase.typedMapShort
	lodash.isEqual(pre, post)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
