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

  scanExamplesForCommentsCommand() {
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
        const commentToken = ";"
        let hit
        if ((hit = examples.find(code => code.includes(`${commentToken} `)))) {
          file.set("lineCommentKeyword", commentToken)
          file.save()
        }
      })
  }

  scanExamplesForPrintKeywordCommand() {
    const regex = /([\w\.\:\$]*out\w*)/i
    pldbBase
      .filter(file => file.isLanguage)
      .filter(file => !file.has("printKeyword"))
      .filter(file => file.allExamples.length)
      .forEach(file => {
        const examples = file.allExamples
          .filter(c => c.source === "hello-world")
          .map(code => code.code)
        let hit
        if (!examples[0]) return
        if (examples[0].split("\n").length > 3) return
        console.log(file.id, examples[0])
        return
        if ((hit = examples.find(code => code.match(regex)))) {
          const match = hit.match(regex)
          file.set("printKeyword", match[1])
          file.save()
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

    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          !file.get("features hasComments") &&
          (file.get("features hasMultiLineComments") === "true" ||
            file.get("features hasLineComments") === "true")
      )
      .forEach(file => {
        const example =
          file.getNode("features hasLineComments") ||
          file.getNode("features hasMultiLineComments")
        file.set("features hasComments", "true")
        file
          .touchNode("features hasComments")
          .setChildren(example.childrenToString())
        file.save()
      })
  }
}

export { PLDBUpdater }

if (!module.parent)
  runCommand(new PLDBUpdater(), process.argv[2], process.argv[3])
