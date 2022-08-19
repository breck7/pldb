#!/usr/bin/env ts-node

import { PLDBFile, PLDBBaseFolder } from "../../PLDBBase"
import { runCommand, PoliteCrawler } from "../../utils"

import { jtree } from "jtree"

const { Disk } = require("jtree/products/Disk.node.js")
const { TreeNode } = jtree
const YAML = require("yaml")

const cacheDir = __dirname + "/cache/"
const reposDir = cacheDir + "repos/"
const firstCommitCache = cacheDir + "firstCommits/"
const pldbBase = PLDBBaseFolder.getBase().loadFolder()

const superagent = require("superagent")
const repoFirstCommit = require("repo-first-commit")
const dayjs = require("dayjs")
const path = require("path")

const creds = JSON.parse(Disk.read(__dirname + "/ignore/creds.json"))
const { apiToken, apiUser } = creds
if (!apiToken) {
	console.error(`No GitHub token found`)
	process.exit()
}

const downloadJson = async (url, destination) => {
	const agent = superagent.agent()
	console.log(`downloading ${url}`)
	const res = await agent
		.get(url)
		.set("User-Agent", apiUser)
		.set("Authorization", `token ${apiToken}`)
	Disk.writeJson(destination, res.body || res.text || "")
}

const repoPath = "githubRepo"
const firstCommitPath = `${repoPath} firstCommit`

Disk.mkdir(cacheDir)
Disk.mkdir(reposDir)
Disk.mkdir(firstCommitCache)

class PLDBFileWithGitHub {
	constructor(file: PLDBFile) {
		this.file = file
	}

	file: PLDBFile

	get firstCommitResultPath() {
		return firstCommitCache + this.file.id + ".json"
	}

	async fetch() {
		await this.fetchFirstCommit()
		await this.downloadRepoInfo()
	}

	async downloadRepoInfo() {
		const { repoFilePath, userId, repoId } = this
		if (Disk.exists(repoFilePath)) return true
		try {
			await downloadJson(
				`https://api.github.com/repos/${userId}/${repoId}`,
				repoFilePath
			)
		} catch (err) {
			//Disk.write(repoFilePath, JSON.stringify(err))
			console.error(err)
		}
	}

	get githubNode() {
		return this.file.getNode(repoPath)
	}

	get githubRepo() {
		return this.file.get(repoPath).replace("https://github.com/", "")
	}

	async fetchTrending() {
		const { file, githubNode } = this
		const { fetchRepositories } = require("@huchenme/github-trending")
		const id = "todo" // this.get("github_githubUrlParam") // todo: what should this be?
		fetchRepositories({ language: id, since: "monthly" }).then(repositories => {
			// todo: can monthly be annually?
			console.log(id)
			console.log(repositories.length)
			const data = new jtree.TreeNode(repositories)
			data.forEach(row => {
				row.delete("builtBy")
				const desc = row.get("description")
				row.delete("description")
				row.set("description", desc)
			})
			githubNode.appendLineAndChildren("githubTrending", data.toSsv())
			//console.log(data.toSsv())
			file.save()
		})
	}

	get userId() {
		return this.githubRepo.split("/")[0]
	}

	get repoId() {
		return this.githubRepo.split("/")[1]
	}

	get repoFilePath() {
		return `${reposDir}/${this.userId}-${this.repoId}.json`
	}

	writeRepoInfoToDatabase() {
		const { repoFilePath, file, githubNode } = this
		if (!Disk.exists(repoFilePath)) return this
		const obj = Disk.readJson(repoFilePath)

		if (typeof obj === "string") throw new Error("string:" + obj)

		if (!file.has("website") && obj.homepage) file.set("website", obj.homepage)

		githubNode.setProperties({
			stars: obj.stargazers_count.toString(),
			forks: obj.forks.toString(),
			subscribers: obj.subscribers_count.toString(),
			created: obj.created_at.substr(0, 4),
			updated: obj.updated_at.substr(0, 4),
			description: obj.description,
			issues: obj.open_issues_count.toString()
			// githubId: obj.id,
			// githubHomepage: obj.homepage,
			// githubLanguage: obj.language,
			// githubHasWiki: obj.hasWiki,
		})

		file.save()
		return this
	}

	async fetchFirstCommit() {
		const { file } = this
		if (Disk.exists(this.firstCommitResultPath)) return

		console.log(`Fetching "${file.id}"`)

		const url = file.get(repoPath)
		const parts = url.split("/")
		const repoName = parts.pop()
		const owner = parts.pop()
		if (owner === "github.com") return 1
		try {
			const commit = await repoFirstCommit({
				owner,
				repo: repoName,
				token: apiToken
				//sha: "5.0"
			})

			console.log(`Success for "${file.id}"`)
			Disk.write(this.firstCommitResultPath, JSON.stringify(commit, null, 2))
		} catch (err) {
			console.log(err)
			Disk.write(this.firstCommitResultPath, `Error`)
		}
	}

	writeFirstCommitToDatabase() {
		const { file } = this
		if (file.get(firstCommitPath) || !this.firstCommitFetched) return this

		try {
			const { firstCommit } = this
			const year = dayjs(firstCommit.commit.author.date).format("YYYY")
			file.set(firstCommitPath, year)
			file.save()
		} catch (err) {
			console.error(err)
		}
		return this
	}

	get firstCommitFetched() {
		return Disk.exists(this.firstCommitResultPath)
	}

	get firstCommit() {
		return JSON.parse(Disk.read(this.firstCommitResultPath))
	}

	autocompleteCreators() {
		const { file } = this
		try {
			if (!file.get("creators") && this.firstCommitFetched) {
				const { firstCommit } = this
				file.set("creators", firstCommit.commit.author.name)
				file.save()
			}
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
	async fetchAllRepoDataCommand() {
		console.log(`Fetching all...`)
		const crawler = new PoliteCrawler()
		crawler.maxConcurrent = 2
		await crawler.fetchAll(
			this.linkedFiles
				.filter(file => !file.getNode("githubRepo").length)
				.map(file => new PLDBFileWithGitHub(file))
		)
	}

	writeAllRepoDataCommand() {
		this.linkedFiles.forEach(file => {
			new PLDBFileWithGitHub(file)
				.writeFirstCommitToDatabase()
				.writeRepoInfoToDatabase()
				.autocompleteAppeared()
				.autocompleteCreators()
		})
	}

	get langs() {
		const map = this.yamlMap
		return Object.keys(map).map(key => {
			const value = map[key]
			value.title = key
			return value
		})
	}

	get yamlMap() {
		return YAML.parse(Disk.read(path.join(cacheDir, "languages.yml")))
	}

	// Make sure to download https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml to cacheDir
	async writeLanguageDataCommand() {
		this.matched.forEach(match => {
			const { file, lang } = match
			const { type, title, extensions, group, filenames } = lang
			const ghNode = file.touchNode("githubLanguage")
			if (!ghNode.getContent()) ghNode.setContent(title)
			ghNode.set("type", type)
			if (extensions)
				ghNode.set("fileExtensions", extensions.join(" ").replace(/\./g, ""))

			if (filenames) ghNode.set("filenames", filenames.join(" "))

			if (group) {
				ghNode.set("group", group)
				// const pldbId = pldbBase.searchForEntity(group)
				// if (pldbId) ghNode.set("groupPldbId", pldbId)
			}

			file.prettifyAndSave()
		})
	}

	async writeLinksCommand() {
		this.matched.forEach(match => {
			const { file, lang } = match
			const { type, title } = lang
			const ghNode = file.touchNode("githubLanguage")
			if (!ghNode.getContent()) {
				ghNode.setContent(title)
				file.prettifyAndSave()
			}
		})
	}

	get pairs() {
		return this.langs.map(lang => {
			const id = pldbBase.searchForEntity(lang.title)
			return { file: pldbBase.getFile(id), lang }
		})
	}

	get matched() {
		return this.pairs.filter(row => row.file)
	}

	get unmatched() {
		return this.pairs
			.filter(row => row.file === undefined)
			.map(item => item.lang)
	}

	listOutdatedLangsCommand() {
		const map = this.yamlMap
		pldbBase.forEach(file => {
			const title = file.get("githubLanguage")
			if (title && !map[title])
				console.log(`Outdated: "${file.id}" has "${title}"`)
		})
	}

	listUnmatchedLangsCommand() {
		const missingPath = path.join(cacheDir, "missingLangs.json")
		Disk.write(missingPath, JSON.stringify(this.unmatched, null, 2))
		console.log(`Wrote ${this.unmatched.length} missing to: ${missingPath}`)
	}

	get linkedFiles() {
		return pldbBase.filter(file => file.has(repoPath))
	}

	async runAll(file) {
		if (!file.has(repoPath)) return
		const gitFile = new PLDBFileWithGitHub(file)
		await gitFile.fetch()
		gitFile
			.writeFirstCommitToDatabase()
			.writeRepoInfoToDatabase()
			.autocompleteAppeared()
	}
}

export { GitHubImporter }

if (!module.parent) runCommand(new GitHubImporter(), process.argv[2])
