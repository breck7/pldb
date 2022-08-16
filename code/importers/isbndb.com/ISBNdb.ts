#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, PoliteCrawler, getCleanedId } from "../../utils"

import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")

const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()

const superagent = require("superagent")
const path = require("path")

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

	async fetch() {
		const { cacheFilePath } = this
		if (Disk.exists(cacheFilePath)) return true
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
		const langTitle = this.file.title.toLowerCase()
		return this.parsed.books.filter(book => {
			const { title } = book
			const titleContainsExactMatch = title
				.split(" ")
				.some(word => word.toLowerCase() === langTitle)
			if (!titleContainsExactMatch) return false

			if (book.subjects?.includes("Computer Science")) return true

			const isTechnical = new TreeNode(book)
				.toString()
				.toLowerCase()
				.includes("programming")
			return isTechnical
		})
	}

	writeBooks() {
		const { hits, file } = this
		const keyInfo = hits.map(book => {
			const { title, date_published, publisher, isbn13, authors } = book
			return {
				year: date_published,
				publisher,
				title,
				authors: authors.join(" and "),
				isbn13
			}
		})
		file.touchNode("isbndb").setChildren(new TreeNode(keyInfo).toDelimited("|"))
		file.save()
	}
}

class ISBNdbImporter {
	async fetchAllCommand() {
		console.log(`Fetching all...`)
		const crawler = new PoliteCrawler()
		crawler.maxConcurrent = 2
		await crawler.fetchAll(
			this.filesWithBooks.map(file => new PLDBFileForBooks(file))
		)
	}

	get filesWithBooks() {
		return pldbBase.topLanguages.slice(0, 3)
	}

	writeAllCommand() {
		this.filesWithBooks.forEach(file => new PLDBFileForBooks(file).writeBooks())
	}
}

export { ISBNdbImporter }

if (!module.parent) runCommand(new ISBNdbImporter(), process.argv[2])
