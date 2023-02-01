#!/usr/bin/env node

const { PLDBFolder } = require("./Folder")
const { SearchServer } = require("jtree/products/treeBaseServer.node.js")

const folder = PLDBFolder.getBase().loadFolder()
console.log(new SearchServer(folder).csv(process.argv.slice(2).join(" ")))
