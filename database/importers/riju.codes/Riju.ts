#!/usr/bin/env ts-node

import { parse } from "yaml"

import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

const cachePath = __dirname + "/cache/riju/langs/"

const manualMatches = {
  brainf: "brainfuck"
}

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
        const match =
          pldbBase.searchForEntity(id) ||
          pldbBase.searchForEntity(manualMatches[id])
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

    /*
    id: "yoptascript"
aliases:
  - "yopta"
name: "YoptaScript"

info:
  year: 2016
  desc: "The world's first scripting programming language for gopniks and real boys"
  ext: yopta
  web:
    home: "https://yopta.space/"
    source: "https://github.com/samgozman/YoptaScript"
  category: general
  mode: interpreted
  platform: nodejs
  syntax: c
  typing: dynamic
  paradigm:
    - functional
    - imperative
    - oo
  usage: []

install:
  npm:
    - yopta
  scripts:
    yopta: |
      #!/usr/bin/env -S NODE_PATH=/opt/yopta/lib/node_modules node
      const fs = require("fs");
      const repl = require("repl");

      const args = process.argv.slice(2);
      if (args.length > 1) {
        console.error("usage: yopta [FILE]");
        process.exit(1);
      }

      const program = args.length === 1 ? fs.readFileSync(args[0], "utf-8") : null;

      require("yopta");

      if (program !== null) {
        eval(yopta(program));
      }

      repl.start({prompt: "yopta> ", eval: (cmd, context, filename, callback) => callback(null, eval(yopta(cmd)))});

repl: |
  yopta

main: "main.yopta"
template: |
  красноглазое.чмо("Привет мир!") нах
hello: |
  Привет мир!

run: |
  yopta main.yopta

scope:
  code: |
    x = 123 * 234
*/
  }
}

export { RijuImporter }

if (!module.parent) runCommand(new RijuImporter(), process.argv[2])
