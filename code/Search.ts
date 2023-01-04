#!/usr/bin/env node

import { PLDBFolder } from "./Folder"
const { SearchServer } = require("jtree/products/treeBaseServer.node.js")

const folder = PLDBFolder.getBase().loadFolder()

new SearchServer(folder).search(process.argv.slice(2).join(" "), "csv")
