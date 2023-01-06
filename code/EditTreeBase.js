#!/usr/bin/env node

// Handy utils for performing common global edit operations on a TreeBase

const { jtree } = require("jtree")
const lodash = require("lodash")
const path = require("path")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const { PLDBFolder } = require("./Folder.js")

const pldbBase = PLDBFolder.getBase().loadFolder()
const rootDir = path.join(__dirname, "..")
const languagesDir = path.join(rootDir, "site", "languages")

class EditTreeBaseCommands {
  changeListDelimiterCommand(field, newDelimiter) {
    pldbBase.forEach(file => {
      const hit = file.getNode(field)
      if (hit) {
        const parsed = file.parsed.getNode(field)
        hit.setContent(parsed.typedContent.join(newDelimiter))
        file.save()
      }
    })
  }

  runFromArgs() {
    jtree.Utils.runCommand(this, process.argv[2], process.argv[3])
  }
}

const commandRunner = new EditTreeBaseCommands()

// commandRunner.runFromArgs()
// commandRunner.changeListDelimiterCommand("originCommunity", " && ")
