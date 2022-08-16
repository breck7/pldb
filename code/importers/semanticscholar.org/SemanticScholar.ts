#!/usr/bin/env ts-node

// Docs: https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data/operation/get_graph_get_paper_search

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, PoliteCrawler, getCleanedId } from "../../utils"

import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")
const lodash = require("lodash")

const { TreeNode } = jtree

const cacheDir = __dirname + "/cache/"

const pldbBase = PLDBBaseFolder.getBase().loadFolder()

const superagent = require("superagent")
const path = require("path")
const dayjs = require("dayjs")

const downloadJson = async (url, destination) => {
	const agent = superagent.agent()
	console.log(`downloading ${url}`)
	const res = await agent.get(url)
	Disk.writeJson(destination, res.body || res.text || "")
}

Disk.mkdir(cacheDir)

class PLDBFileForSemanticScholar {
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
		return this.file.title + " programming language"
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
		const fields = `title,authors,abstract,year,citationCount,influentialCitationCount,publicationTypes,referenceCount,fieldsOfStudy,journal,externalIds`
		try {
			await downloadJson(
				`http://api.semanticscholar.org/graph/v1/paper/search?query=${this.query}&limit=100&fields=${fields}`,
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
		return this.parsed.data.filter(paper => {
			const {
				title,
				abstract,
				citationCount,
				influentialCitationCount,
				year,
				externalIds
			} = paper
			const titleContainsExactMatch = title
				.split(" ")
				.some(word => word.toLowerCase() === langTitle)
			if (!titleContainsExactMatch) return false

			if (!citationCount) return false

			if (!externalIds.DOI) return false

			if (title.toLowerCase().includes("programming")) return true

			if (paper.fieldsOfStudy?.includes("Computer Science")) return true

			const content = new TreeNode(paper).toString().toLowerCase()

			const isTechnical = content.includes("programming")

			return isTechnical
		})
	}

	writePapers() {
		if (!this.exists) return true

		const { hits, file } = this
		const keyInfo = hits.map(paper => {
			const {
				title,
				year,
				externalIds,
				citationCount,
				influentialCitationCount,
				authors
			} = paper
			return {
				year,
				title,
				doi: externalIds.DOI,
				citations: citationCount,
				influentialCitations: influentialCitationCount,
				authors: authors.map(author => author.name).join(" and ")
			}
		})
		const count = hits.length
		file.set("semanticScholar", `${count}`)

		const sorted = lodash.sortBy(keyInfo, ["citations"]).reverse()

		if (count)
			file
				.getNode("semanticScholar")
				.setChildren(new TreeNode(sorted).toDelimited("|"))
		file.prettifyAndSave()
	}
}

class SemanticScholarImporter {
	async fetchAllCommand() {
		console.log(`Fetching all...`)
		const crawler = new PoliteCrawler()
		crawler.maxConcurrent = 2
		crawler.msDelayBetweenRequests = 3000
		await crawler.fetchAll(
			this.filesWithPapers.map(file => new PLDBFileForSemanticScholar(file))
		)
	}

	get filesWithPapers() {
		return pldbBase.topLanguages.slice(0, 10)
	}

	writeAllCommand() {
		this.filesWithPapers.forEach(file =>
			new PLDBFileForSemanticScholar(file).writePapers()
		)
	}
}

export { SemanticScholarImporter }

if (!module.parent) runCommand(new SemanticScholarImporter(), process.argv[2])
