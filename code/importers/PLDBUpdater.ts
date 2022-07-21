#!/usr/bin/env ts-node

import { PLDBBaseFolder } from "../PLDBBase"
import { GitHubImporter } from "./github.com/GitHub"
import { runCommand } from "../utils"
import { jtree } from "jtree"
import { WhoIsImporter } from "./whois/WhoIs"
const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

class PLDBUpdater {
  async update(id: string) {
    const file = pldbBase.getFile(id)
    if (!file) return console.error(`❌ File '${id}' not found.`)

    new GitHubImporter().runAll(file)
    const importer = new WhoIsImporter()
    await importer.updateOne(file)
  }

  updateCommand(id: string) {
    this.update(id)
  }

  importFromCsvCommand(path: string) {
    jtree.TreeNode.fromCsv(Disk.read(path)).forEach(entry => {
      entry = entry.toObject()
      const hit = pldbBase.searchForEntity(entry.query)
      if (!hit) {
        console.log(entry.query + " not found")
        return
      }
      const file = pldbBase.getFile(hit)

      delete entry.query
      Object.keys(entry).forEach(key => file.set(key, entry[key]))
      file.save()
    })
  }

  scanExamplesForCommentsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          !file.has("lineCommentToken") &&
          file.get("features hasLineComments") === undefined
      )
      .filter(file => file.allExamples.length)
      .forEach(file => {
        const examples = file.allExamples.map(code => code.code)
        const commentToken = ";"
        let hit
        if ((hit = examples.find(code => code.includes(`${commentToken} `)))) {
          file.set("lineCommentToken", commentToken)
          file.save()
        }
      })
  }

  scanExamplesForMultiLineCommentsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          !file.has("multiLineCommentTokens") &&
          file.get("features hasMultiLineComments") === undefined
        // && file.get("lineCommentToken") === "//"
      )
      .filter(file => file.allExamples.length)
      .forEach(file => {
        const examples = file.allExamples.map(code => code.code)
        const left = "<!--"
        const right = "-->"
        let hit
        if (
          (hit = examples.find(
            code => code.includes(left) && code.includes(right)
          ))
        ) {
          file.set("multiLineCommentTokens", `${left} ${right}`)
          file.save()
        }
      })
  }

  scanExamplesForPrintKeywordCommand() {
    // print put puts out log write
    const regex = /([\w\.\:\$]*print\w*)/i
    pldbBase
      .filter(file => file.isLanguage)
      .filter(file => !file.has("printToken"))
      .filter(file => file.allExamples.length)
      .forEach(file => {
        const examples = file.allExamples
          //.filter(c => c.source === "hello-world")
          .map(code => code.code)
        let hit
        // if (!examples[0]) return
        // if (examples[0].split("\n").length > 3) return
        //console.log(file.id, examples[0])
        //return
        if ((hit = examples.find(code => code.match(regex)))) {
          const match = hit.match(regex)
          file.set("printToken", match[1])
          file.save()
        }
      })
  }

  updatePrintsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.has("printToken") && !file.get("features hasPrintDebugging")
      )
      .forEach(file => {
        file.set("features hasPrintDebugging", "true")
        file.save()
      })
  }

  updateAssignmentCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.has("assignmentToken") && !file.get("features hasAssignment")
      )
      .forEach(file => {
        file.set("features hasAssignment", "true")
        file.save()
      })
  }

  updateSemanticIndentationCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(file => file.allExamples.length > 2)
      .filter(file => file.rank < 200)
      .filter(file => !file.get("features hasSemanticIndentation"))
      .forEach(file => {
        file.set("features hasSemanticIndentation", "false")
        file.save()
      })
  }

  updateCommentsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.has("lineCommentToken") && !file.get("features hasLineComments")
      )
      .forEach(file => {
        const kw = file.get("lineCommentToken")
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
          file.has("multiLineCommentTokens") &&
          !file.get("features hasMultiLineComments")
      )
      .forEach(file => {
        const kws = file.get("multiLineCommentTokens")
        file.set("features hasMultiLineComments", "true")
        const parts = kws.split(" ")
        const start = parts[0]
        const end = parts[1] || start
        file.touchNode("features hasMultiLineComments")
          .setChildren(`${start} A comment
${end}`)

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
