#!/usr/bin/env ts-node

import { parse } from "yaml"

import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()

const cachePath = __dirname + "/cache/riju/langs/"

class RijuImporter {
  writeToDatabaseCommand() {
    pldbBase.loadFolder()
    const files = Disk.getFullPaths(cachePath)
    files.forEach(yamlFile => {
      const { id } = parse(Disk.read(yamlFile))
      const match = pldbBase.searchForEntity(id)
      if (!match) {
        console.log(id, match)
        return
      }
      const file = pldbBase.getFile(match)
      file.set("rijuRepl", `https://riju.codes/${id}`)
      file.save()
    })
  }
}

export { RijuImporter }

if (!module.parent) runCommand(new RijuImporter(), process.argv[2])
