import { PLDBBaseFolder } from "../PLDBBase"
import { GitHubImporter } from "./github.com/GitHub"
import { runCommand } from "../utils"
import { jtree } from "jtree"
import { WhoIsImporter } from "./whois/WhoIs"
import { WikipediaImporter } from "./wikipedia.org/Wikipedia"
const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase().loadFolder()

class PLDBUpdater {
  async update(id: string) {
    const file = pldbBase.getFile(id)
    if (!file) return console.error(`❌ File '${id}' not found.`)

    const importer = new WhoIsImporter()
    const promises = [
      new GitHubImporter().runAll(file),
      new WikipediaImporter().updateOneCommand(file),
      importer.updateOne(file)
    ]
    await Promise.all(promises)
    file.prettify()
    file.save()
  }

  updateCommand(id: string) {
    this.update(id)
  }

  appearedCommand() {
    pldbBase.topLanguages
      .filter(file => !file.has("appeared"))
      .forEach(file => {
        //new GitHubImporter().runAll(file)
        //new WikipediaImporter().updateOneCommand(file)
        const importer = new WhoIsImporter()
        importer.updateOne(file)
      })
  }

  importFromCsvCommand(path: string) {
    const content = Disk.read(path)
    const rows = jtree.TreeNode.fromCsv(content)
    const queryColumn = rows.nodeAt(0).getFirstWords()[0]
    rows.forEach(entry => {
      entry = entry.toObject()
      const hit = pldbBase.searchForEntity(entry[queryColumn])
      if (!hit) {
        console.log(entry[queryColumn] + " not found")
        return
      }
      const file = pldbBase.getFile(hit)

      delete entry[queryColumn]
      Object.keys(entry).forEach(key =>
        file.set(key.replace(".", " "), entry[key])
      )
      file.prettifyAndSave()
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

  makePredictions(featureName, tokenProperty?: string) {
    const featurePath = `features ${featureName}`
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file =>
          file.get(featurePath) === undefined &&
          (!file.has(tokenProperty) || !tokenProperty)
      )
      .forEach(file => {
        const prediction = file[featureName + "Prediction"]
        if (prediction) {
          file.set(featurePath, prediction.value.toString())
          if (prediction.token) file.set(tokenProperty, prediction.token)
          if (prediction.example)
            file.touchNode(featurePath).setChildren(prediction.example)
          file.prettifyAndSave()
        }
      })
  }

  scanForBooleansCommand() {
    this.makePredictions("hasBooleans", "booleanTokens")
  }

  scanForImportsCommand() {
    this.makePredictions("hasImports", "includeToken")
  }

  scanForWhileLoopsCommand() {
    this.makePredictions("hasWhileLoops")
  }

  scanForClassesCommand() {
    this.makePredictions("hasClasses")
  }

  scanForConstantsCommand() {
    this.makePredictions("hasConstants")
  }

  scanForExceptionsCommand() {
    this.makePredictions("hasExceptions")
  }

  scanForFunctionsCommand() {
    this.makePredictions("hasFunctions")
  }

  scanForSwitchCommand() {
    this.makePredictions("hasSwitch")
  }

  scanForAccessModifiersCommand() {
    this.makePredictions("hasAccessModifiers")
  }

  scanForInheritanceCommand() {
    this.makePredictions("hasInheritance")
  }

  scanForAsyncAwaitCommand() {
    this.makePredictions("hasAsyncAwait")
  }

  scanForConditionalsCommand() {
    this.makePredictions("hasConditionals")
  }

  scanAllCommand() {
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(word => word.startsWith("scanFor"))
      .forEach(word => {
        this[word]()
      })
  }

  scanExamplesForStringsCommand() {
    // print put puts out log write
    const regex = /'Hello world'/i
    pldbBase
      .filter(file => file.isLanguage)
      .filter(file => !file.has("stringToken"))
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
          file.set("stringToken", "'")
          file.save()
        }
      })
  }

  updateStringsCommand() {
    pldbBase
      .filter(file => file.isLanguage)
      .filter(
        file => file.has("stringToken") && !file.get("features hasStrings")
      )
      .forEach(file => {
        file.set("features hasStrings", "true")
        const token = file.get("stringToken")
        file
          .touchNode("features hasStrings")
          .setChildren(`${token}Hello world${token}`)
        file.save()
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
