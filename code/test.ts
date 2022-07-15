#!/usr/bin/env ts-node

const tap = require("tap")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { Disk } = require("jtree/products/Disk.node.js")

import { PLDBBaseFolder } from "./PLDBBase"
const pldbBase = PLDBBaseFolder.getBase()

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
	if (errors) console.log(errors)
	areEqual(errors.length, 0)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
