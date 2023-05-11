#!/usr/bin/env node

/*

To investigate slowdowns:

code
 node --cpu-prof --cpu-prof-name=test.cpuprofile ./code/test.js

Then:

- open a new Chrome tab
- open devtools
- click Performance
- click "Load Profile..."
- select your test.cpuprofile
*/
const lodash = require("lodash")
const { TestRacer } = require("jtree/products/TestRacer.js")
const { PLDB } = require("../PLDB.js")

const testTree = PLDB.testTree

testTree.ensureNoBrokenPermalinks = areEqual => {
	areEqual(!!PLDB.folder.pageRankLinks, true, "should not throw because of broken permalink")
}

testTree.ensureSortWorks = areEqual => {
	const parser = PLDB.folder.rootParser
	const program = new parser(`appeared 1923\ntitle foo`)
	program.sortFromSortTemplate()
	areEqual(program.asString, "title foo\nappeared 1923")
}

testTree.ensureSortCausesNoSemanticChanges = areEqual => {
	// Arrange
	const pre = PLDB.folder.typedMap

	// Act
	PLDB.folder.forEach((file, index) => {
		const originalTypedMap = file.typedMap
		if (index > 10) return
		file.sort()
		const sorted = file.typedMap

		areEqual(lodash.isEqual(originalTypedMap, file.typedMap), true, "typed map doesnt change after sort")

		const sortedOnce = file.asString
		file.sort()

		const sortedTwice = file.asString

		areEqual(sortedOnce, sortedTwice, `sort is stable`)
	})
}

if (module && !module.parent) TestRacer.testSingleFile(__filename, testTree)

module.exports = { testTree }
