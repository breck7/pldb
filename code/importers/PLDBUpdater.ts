#!/usr/bin/env ts-node

import { PLDBBaseFolder } from "../PLDBBase"
import { GitHubImporter } from "./github.com/GitHub"
import { runCommand } from "../utils"

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

class PLDBUpdater {
  async update(id: string) {
    const file = pldbBase.getFile(id)
    if (!file) return console.error(`❌ File '${id}' not found.`)

    new GitHubImporter().runAll(file)
  }

  updateCommand(id: string) {
    this.update(id)
  }

  scanExamplesCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          !file.has("lineCommentKeyword") &&
          file.get("features hasLineComments") === undefined
      )
      .filter(file => file.allExamples.length)
      .forEach(file => {
        const examples = file.allExamples.map(code => code.code)
        let hit
        if ((hit = examples.find(code => code.includes("// ")))) {
          file.set("lineCommentKeyword", "//")
          file.save()
        } else if ((hit = examples.find(code => code.includes("# ")))) {
          // file.set("lineCommentKeyword", "#")
          //file.save()
        }
      })
  }

  updateCommentsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.has("lineCommentKeyword") &&
          !file.get("features hasLineComments")
      )
      .forEach(file => {
        const kw = file.get("lineCommentKeyword")
        file.set("features hasLineComments", "true")
        file
          .touchNode("features hasLineComments")
          .setChildren(`${kw} A comment`)
        file.save()
      })

    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.has("multiLineCommentKeywords") &&
          !file.get("features hasMultiLineComments")
      )
      .forEach(file => {
        const kws = file.get("multiLineCommentKeywords")
        file.set("features hasMultiLineComments", "true")
        const parts = kws.split(" ")
        const start = parts[0]
        const end = parts[1] || start
        file
          .touchNode("features hasMultiLineComments")
          .setChildren(`${start} A comment ${end}`)

        file.save()
      })
  }
}

export { PLDBUpdater }

if (!module.parent) runCommand(new PLDBUpdater(), process.argv[2])
