#!/usr/bin/env ts-node

import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()
pldbBase.loadFolder()

const cachePath = __dirname + "/cache/"
Disk.mkdir(cachePath)

const getCachePath = file => cachePath + file.get("subreddit") + ".json"

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

  fetchAllCommand() {
    this.matches.forEach(file => {
      this.fetchOne(file)
    })
  }
}

export { RedditImporter }

if (!module.parent) runCommand(new RedditImporter(), process.argv[2])
