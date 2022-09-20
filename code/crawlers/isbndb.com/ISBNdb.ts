#!/usr/bin/env node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, PoliteCrawler, getCleanedId } from "../../utils"

import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")

const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()

const superagent = require("superagent")
const path = require("path")
const dayjs = require("dayjs")

const creds = JSON.parse(
	Disk.read(path.join(__dirname, "ignore", "creds.json"))
)

const { restKey } = creds
if (!restKey) {
	console.error(`No restKey found`)
	process.exit()
}

const downloadJson = async (url, destination) => {
	const agent = superagent.agent()
	console.log(`downloading ${url}`)
	const res = await agent.get(url).set("Authorization", `${restKey}`)
	Disk.writeJson(destination, res.body || res.text || "")
}

Disk.mkdir(cacheDir)

const falsePositives = new Set(
	Disk.read(path.join(__dirname, "falsePositives.txt")).split("\n")
)

class PLDBFileForBooks {
	constructor(file: PLDBFile) {
		this.file = file
	}

	file: PLDBFile

	get cacheFilePath() {
		return path.join(cacheDir, `${this.filename}.json`)
	}

	get filename() {
		return getCleanedId(this.query)
	}

	get query() {
		return this.file.title
	}

	get parsed() {
		return JSON.parse(Disk.read(this.cacheFilePath))
	}

	get exists() {
		return Disk.exists(this.cacheFilePath)
	}

	async fetch() {
		const { cacheFilePath } = this
		if (this.exists) return true
		try {
			await downloadJson(
				`https://api2.isbndb.com/books/${this.query}?pageSize=1000&column=title`,
				cacheFilePath
			)
		} catch (err) {
			//Disk.write(repoFilePath, JSON.stringify(err))
			console.error(err)
		}
	}

	get hits() {
		const { file } = this
		const langTitle = this.file.title.toLowerCase()
		return this.parsed.books.filter(book => {
			const { title, date_published, isbn13 } = book
			const titleContainsExactMatch = title
				.split(" ")
				.some(word => word.toLowerCase() === langTitle)
			if (!titleContainsExactMatch) return false

			if (falsePositives.has(isbn13)) return false
			// todo: some books are technical but we are matching against the wrong language. So
			// we need to have a falsePositivesForLanguage map as well.

			if (title.toLowerCase().includes("programming")) return true

			if (book.subjects?.includes("Computer Science")) return true

			const content = new TreeNode(book).toString().toLowerCase()

			const isTechnical = content.includes("programming")

			return isTechnical
		})
	}

	writeBooks() {
		if (!this.exists) return true

		const { hits, file } = this
		const keyInfo = hits.map(book => {
			const { title, date_published, publisher, isbn13, authors } = book
			return {
				year: date_published,
				publisher,
				title,
				authors: authors ? authors.join(" and ") : "",
				isbn13
			}
		})
		const count = hits.length
		file.set("isbndb", `${count}`)

		if (count)
			file.getNode("isbndb").setChildren(new TreeNode(keyInfo).toDelimited("|"))
		file.prettifyAndSave()
	}
}

class ISBNdbImporter {
	async fetchAllCommand() {
		console.log(`Fetching all...`)
		const crawler = new PoliteCrawler()
		crawler.maxConcurrent = 3
		crawler.msDelayBetweenRequests = 500
		await crawler.fetchAll(this.unfetched)
	}

	get files() {
		return pldbBase.topLanguages.map(file => new PLDBFileForBooks(file))
	}

	get unfetched() {
		return this.files.filter(file => !file.exists).reverse()
	}

	writeAllCommand() {
		this.files.forEach(file => file.writeBooks())
	}
}

export { ISBNdbImporter }

if (!module.parent) runCommand(new ISBNdbImporter(), process.argv[2])
