#!/usr/bin/env ts-node

import { PLDBBaseFolder } from "../PLDBBase"
import { GitHubImporter } from "./github.com/GitHub"

class PLDBAutocompleter {
  async update(id: string) {
    const pldbBase = PLDBBaseFolder.getBase()
    pldbBase.loadFolder()
    const file = pldbBase.getFile(id)
    if (!file) return console.error(`❌ File '${id}' not found.`)

    new GitHubImporter().runAll(file)
  }
}

export { PLDBAutocompleter }
