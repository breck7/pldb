#!/usr/bin/env ts-node

const path = require("path")
const express = require("express")
const { TreeBaseServer } = require("jtree/products/treeBase.node.js")
import { PLDBBaseFolder } from "../PLDBBase"
import { runCommand } from "../utils"

class PLDBServer extends TreeBaseServer {}

class PLDBServerCommands {
	launchServerCommand(port) {
		const pldbBase = PLDBBaseFolder.getBase()
		pldbBase.loadFolder()
		pldbBase.startListeningForFileChanges()
		const server = new (<any>PLDBServer)(pldbBase)
		server.listen(port)
	}

	serveFolderCommand(
		port = 3030,
		folder = path.join(__dirname, "..", "..", "pldb.pub")
	) {
		const app = express()
		app.use(express.static(folder))
		app.listen(port)
		console.log(`Serving '${folder}'. cmd+dblclick: http://localhost:${port}/`)
	}
}

export { PLDBServer }

if (!module.parent)
	runCommand(new PLDBServerCommands(), process.argv[2], process.argv[3])
