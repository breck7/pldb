const fs = require("fs")
const path = require("path")
const lodash = require("lodash")
const { exec } = require("child_process")

const folderPath = path.join(__dirname, "..", "ignore", "node_modules", "gits")
const outputFile = path.join(__dirname, "writtenInTable.tsv")
const progressFile = path.join(__dirname, "progress.json")

// Function to execute cloc command and process the output
function processFolder(folderName) {
	return new Promise((resolve, reject) => {
		const command = `cloc --csv --quiet ${path.join(folderPath, folderName)}`

		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error)
				return
			}

			const lines = stdout.trim().split("\n")
			const results = []

			for (let i = 1; i < lines.length; i++) {
				const [language, fileCount, blank, comment, code] = lines[i].split(",")
				if (language !== "SUM:") {
					results.push({ folderName, language, fileCount, loc: code })
				}
			}

			resolve(results)
		})
	})
}

// Function to write the results to the output file
function writeResults(results) {
	const header = "folderName\tlanguage\tfileCount\tloc\n"
	const content = results
		.map(result => `${result.folderName}\t${result.language}\t${result.fileCount}\t${result.loc}`)
		.join("\n")

	fs.writeFileSync(outputFile, header + content)
}

// Function to load progress from the JSON file
function loadProgress() {
	if (fs.existsSync(progressFile)) {
		const data = fs.readFileSync(progressFile, "utf8")
		return JSON.parse(data)
	}
	return { processedFolders: [], allResults: [] }
}

// Function to save progress to the JSON file
function saveProgress(progress) {
	fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
}

// Main function to process all folders and write the results
async function runClocOnAllRepos() {
	const folders = fs.readdirSync(folderPath)
	const progress = loadProgress()

	for (const folder of folders) {
		if (fs.statSync(path.join(folderPath, folder)).isDirectory()) {
			if (!progress.processedFolders.includes(folder)) {
				try {
					const results = await processFolder(folder)
					progress.allResults.push(...results)
					progress.processedFolders.push(folder)
					saveProgress(progress)
					console.log(`Processed folder: ${folder}`)
				} catch (error) {
					console.error(`Error processing folder ${folder}:`, error)
				}
			} else {
				console.log(`Skipping already processed folder: ${folder}`)
			}
		}
	}

	writeResults(progress.allResults)
	console.log(`Results written to ${outputFile}`)
}

const processLang = rows => {}

const processData = (data, pldbCli) => {
	const langs = {}
	data.forEach(row => {
		/*"folderName": "05ab1e",
      "language": "39",
      "fileCount": "Elixir",
      "loc": "16228"*/
		const id = row.folderName
		const writtenIn = row.fileCount // was. a bug in claude script
		const loc = parseInt(row.loc)
		const fileCount = parseInt(row.language)

		if (!langs[id]) langs[id] = []

		langs[id].push({ id, writtenIn, loc, fileCount })
	})

	Object.values(langs).forEach(lang => {
		const str = lodash
			.sortBy(lang, ["fileCount", "loc"])
			.reverse()
			.map(l => {
				const hit = pldbCli.searchForConcept(l.writtenIn)
				if (!hit) console.log(`No lang found for ${hit}`)
				else return hit.id
			})
			.filter(i => i)
			.join(" ")

		const id = lang[0].id
		let hit = pldbCli.searchForConcept(id)
		if (hit) {
			pldbCli.setAndSave(hit, "writtenIn", str)
		} else {
			console.log(`${id} not found`)
		}
	})
}

module.exports = {
	addWrittenIn: async pldbCli => {
		await runClocOnAllRepos()
		const data = require("./progress.json").allResults
		processData(data, pldbCli)
	}
}
