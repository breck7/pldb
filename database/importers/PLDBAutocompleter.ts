#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../PLDBBase"
import { getCleanedId, runCommand } from "../utils"

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

class PLDBAutocompleter {
  autocompleteFileCommand(id) {
    if (!id)
      return console.error(
        `❌ Example Usage: ./PLDBAutocompleter.ts javascript`
      )
    const file = pldbBase.getFile(id)
    if (!file) return console.error(`❌ File '${id}' not found.`)
  }
}

export { PLDBAutocompleter }

if (!module.parent)
  runCommand(new PLDBAutocompleter().autocompleteFileCommand(process.argv[2]))
