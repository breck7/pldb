#!/usr/bin/env ts-node

import { parse } from "yaml"

import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

const cachePath = __dirname + "/cache/riju/langs/"

const scopeName = "rijuRepl"

class RijuImporter {
  writeLinksToDatabaseCommand() {
    this.matches.forEach(match => {
      match.pldbFile.set(scopeName, `https://riju.codes/${match.yaml.id}`)
      match.pldbFile.save()
    })
  }

  get yamlFiles() {
    return Disk.getFullPaths(cachePath)
  }

  get matches() {
    return this.yamlFiles
      .map(yamlFile => {
        const yaml = parse(Disk.read(yamlFile))
        const { id } = yaml
        const match = pldbBase.searchForEntity(id)
        if (match)
          return {
            pldbFile: pldbBase.getFile(match),
            yaml
          }
      })
      .filter(i => i)
  }

  listMissingCommand() {
    this.yamlFiles.forEach(yamlFile => {
      const { id } = parse(Disk.read(yamlFile))
      if (!pldbBase.searchForEntity(id)) console.log(`Missing language: ${id}`)
    })
  }

  mergeOne(match) {
    const { pldbFile, yaml } = match
    const object = pldbFile.toObject()
    const { info } = yaml

    const node = pldbFile.getNode(scopeName)

    if (yaml.template) node.appendLineAndChildren("example", yaml.template)

    if (info) {
      if (info.desc) node.set("description", info.desc)
      if (info.year && !object.appeared)
        pldbFile.set("appeared", info.year.toString())

      if (info.ext)
        node.set(
          "fileExtensions",
          info.ext.join ? info.ext.join(" ") : info.ext
        )

      if (info.web.home) node.set("website", info.web.home)

      if (info.web.source) node.set("githubRepo", info.web.source)
    }

    pldbFile.save()
  }

  mergeInfoCommand() {
    this.matches.forEach(match => {
      try {
        this.mergeOne(match)
      } catch (err) {
        console.error(match.yaml.id, err)
      }
    })
  }
}

export { RijuImporter }

if (!module.parent) runCommand(new RijuImporter(), process.argv[2])
