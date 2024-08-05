const { execSync } = require("child_process")
const path = require("path")
const lodash = require("lodash")

const addWrittenIn = (id, pldbCli) => {
  const gitFolder = path.join(__dirname, "..", "ignore", "node_modules", "gits", id)
  try {
    console.log(id)
    const clocCommand = `cloc --json ${gitFolder}`
    const stdout = execSync(clocCommand).toString()
    console.log(stdout)
    const clocOutput = JSON.parse(stdout)
    const langs = Object.entries(clocOutput)
      .filter(([key]) => key !== "header" && key !== "SUM")
      .map(([language, data]) => ({ language, files: data.nFiles }))
      .sort((a, b) => b.files - a.files)
      .map(({ language }) => language)

    const ids = langs
      .map(lang => {
        const hit = pldbCli.searchForConcept(lang)
        if (!hit) console.error(`No lang found for ${lang}`)
        else return hit.id
      })
      .filter(i => i)

    let hit = pldbCli.searchForConcept(id)
    if (hit) pldbCli.setAndSave(hit, "writtenIn", ids.join(" "))
    else console.log(`Failed to save ${id}. not found`)
    return langs
  } catch (error) {
    console.error(`Error executing cloc: ${error.message}. For folder: ${gitFolder}`)
  }
}

module.exports = { addWrittenIn }
