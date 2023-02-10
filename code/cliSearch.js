#!/usr/bin/env node

const path = require("path")
const baseFolder = path.join(__dirname, "..")
const ignoreFolder = path.join(baseFolder, "ignore")
const { PLDBFolder } = require("./Folder")
const { SearchServer } = require("jtree/products/treeBaseServer.node.js")

const folder = PLDBFolder.getBase().loadFolder()
console.log(
	new SearchServer(folder, ignoreFolder).csv(process.argv.slice(2).join(" "))
)
