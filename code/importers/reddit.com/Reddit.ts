#!/usr/bin/env node

import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const path = require("path")
const dayjs = require("dayjs")

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase().loadFolder()

const cachePath = path.join(__dirname, "cache")
Disk.mkdir(cachePath)

import { getTitle, handTitles } from "./getTitle"

const getCachePath = file =>
  path.join(cachePath, file.get("subreddit") + ".json")

class RedditImporter {
  writeToDatabaseCommand() {
    this.matches.forEach(file => {
      try {
        this.writeOne(file)
      } catch (err) {
        console.error(err)
      }
    })
  }

  writeOne(file) {
    const path = getCachePath(file)
    if (!Disk.exists(path)) return
    const parsed = Disk.readJson(path)
    const members = parsed.data.children[0].data.subscribers
    const key = `subreddit memberCount 2022`
    if (!file.get(key)) {
      file.set(key, members.toString())
      file.save()
    }
  }

  get matches() {
    return pldbBase.filter(file => file.has("subreddit"))
  }

  async fetchOne(file) {
    const path = getCachePath(file)
    if (Disk.exists(path)) return this
    const url = `https://www.reddit.com/subreddits/search.json?q=${file.get(
      "subreddit"
    )}`
    await Disk.downloadJson(url, path)
  }

  get announcements() {
    return this.posts.filter(
      post => post.link_flair_text === "Language announcement"
    )
  }

  findLangsCommand() {}

  get posts() {
    return Disk.getFullPaths(path.join(cachePath, "ProgrammingLanguages"))
      .filter(name => name.endsWith(".json"))
      .map(name => Disk.readJson(name))
  }

  printAnnouncementsCommand() {
    this.announcements.forEach(post => {
      if (!handTitles[post.permalink]) handTitles[post.permalink] = post.title
    })
    console.log(JSON.stringify(handTitles, null, 2))
  }

  createFromAnnouncementsCommand() {
    this.announcements.forEach(post => {
      const { url, created_utc, permalink, title } = post
      const handTitle = getTitle(post)
      if (!handTitle) return

      const hit = pldbBase.searchForEntity(handTitle)
      if (hit) return

      const type = "pl"
      const appeared = dayjs(created_utc * 1000).format("YYYY")
      let link = ""
      if (url.includes("github.com")) link = `githubRepo ${url}`
      else if (!url.includes(permalink)) link = `reference ${url}`

      const newFile = pldbBase.createFile(`title ${handTitle}
description ${title}
type ${type}
appeared ${appeared}
reference https://reddit.com${permalink}
${link}
`)
    })
  }

  fetchAllCommand() {
    this.matches.forEach(file => {
      this.fetchOne(file)
    })
  }
}

export { RedditImporter }

if (!module.parent) runCommand(new RedditImporter(), process.argv[2])
