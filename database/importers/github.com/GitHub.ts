#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { getCleanedId, runCommand, PoliteCrawler } from "../../utils"

const lodash = require("lodash")
const cacheDir = __dirname + "/cache/"
const firstCommitCache = cacheDir + "firstCommits/"
const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()
const { Disk } = require("jtree/products/Disk.node.js")

const superagent = require("superagent")
const repoFirstCommit = require("repo-first-commit")
const moment = require("moment")

const downloadJson = async (url, destination) => {
	const agent = superagent.agent()
	const res = await agent.get(url).set("User-Agent", "codelani")
	Disk.writeJson(destination, res.body || res.text || "")
}

const repoPath = "githubRepo"
const firstCommitPath = `${repoPath} firstCommit`

Disk.mkdir(cacheDir)
Disk.mkdir(firstCommitCache)

class PLDBFileWithGitHub {
	constructor(file: PLDBFile) {
		this.file = file
	}

	file: PLDBFile

	get firstCommitResultPath() {
		return firstCommitCache + this.file.primaryKey + ".json"
	}

	async fetch() {
		await this.fetchFirstCommit()
	}

	async fetchFirstCommit() {
		const { file } = this
		if (file.get(firstCommitPath) || Disk.exists(this.firstCommitResultPath))
			return

		console.log(`Fetching "${file.primaryKey}"`)

		const token = JSON.parse(Disk.read(__dirname + "/ignore/creds.json"))
			.apiToken
		if (!token) return console.error(`No GitHub token found`)

		const url = file.get(repoPath)
		const parts = url.split("/")
		const repoName = parts.pop()
		const owner = parts.pop()
		if (owner === "github.com") return 1
		try {
			const commit = await repoFirstCommit({
				owner,
				repo: repoName,
				token
				//sha: "5.0"
			})

			console.log(`Success for "${file.primaryKey}"`)
			Disk.write(this.firstCommitResultPath, JSON.stringify(commit, null, 2))
		} catch (err) {
			console.log(err)
			Disk.write(this.firstCommitResultPath, `Error`)
		}
	}

	writeToDatabase() {
		const { file } = this
		if (file.get(firstCommitPath) || !Disk.exists(this.firstCommitResultPath))
			return this

		try {
			const commit = JSON.parse(Disk.read(this.firstCommitResultPath))
			const year = moment(commit.commit.author.date).format("YYYY")
			file.set(firstCommitPath, year)
			file.save()
		} catch (err) {
			console.error(err)
		}
		return this
	}

	autocompleteAppeared() {
		const { file } = this
		const year = file.get(firstCommitPath)
		if (!file.get("appeared") && year) {
			file.set("appeared", year)
			file.save()
		}
		return this
	}
}

class GitHubImporter {
	async fetchAllCommand() {
		console.log(`Fetching all...`)
		const crawler = new PoliteCrawler()
		crawler.maxConcurrent = 2
		await crawler.fetchAll(
			this.linkedFiles.map(file => new PLDBFileWithGitHub(file))
		)
	}

	writeAllCommand() {
		this.linkedFiles.forEach(file => {
			new PLDBFileWithGitHub(file).writeToDatabase().autocompleteAppeared()
		})
	}

	get linkedFiles() {
		return pldbBase.filter(file => file.has(repoPath))
	}
}

export { GitHubImporter }

if (!module.parent) runCommand(new GitHubImporter(), process.argv[2])
