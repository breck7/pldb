#!/usr/bin/env ts-node

const { AbstractBuilder } = require("jtree/products/AbstractBuilder.node.js")
import { WikipediaImporter } from "./wikipedia.org/Wikipedia"
import { PLDBBaseFolder } from "../PLDBBase"

const pldbBase = PLDBBaseFolder.getBase()

class Builder extends AbstractBuilder {
  async fetchWikipedia() {
    pldbBase.loadFolder()
    const nodeOne = new WikipediaImporter(pldbBase.nodeAt(0))
    await nodeOne.fetchAll()
  }
}

export { Builder }

if (!module.parent)
  new Builder().main(process.argv[2], process.argv[3], process.argv[4])
