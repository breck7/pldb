#!/usr/bin/env node

// Handy utils for performing common global edit operations on a TreeBase

const { Utils } = require("jtree/products/Utils.js")
const lodash = require("lodash")
const path = require("path")
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
        hit.setContent(parsed.list.join(newDelimiter))
        file.save()
      }
    })
  }

  replaceListItems(field, replacementMap) {
    const keys = Object.keys(replacementMap)
    const delimiter = " && "
    pldbBase.forEach(file => {
      const value = file.get(field)
      if (!value) return

      const values = value
        .split(delimiter)
        .map(value => (replacementMap[value] ? replacementMap[value] : value))

      const joined = values.join(delimiter)
      if (joined === value) return

      file.set(field, joined)
      file.prettifyAndSave()
    })
  }

  runFromArgs() {
    Utils.runCommand(this, process.argv[2], process.argv[3])
  }
}

const commandRunner = new EditTreeBaseCommands()

// commandRunner.runFromArgs()
// commandRunner.changeListDelimiterCommand("originCommunity", " && ")

// commandRunner.replaceListItems("originCommunity", { "Apple Inc": "Apple" })
