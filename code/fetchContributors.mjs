#! /usr/bin/env node

/*

fetchContributors.js

- fetch https://api.github.com/repos/breck7/pldb/contributors
- fetch all pagination pages
- write results as JSON to path.join(__dirname, "..", "pages", "contributors.json")
- You can use the npm package "ky"
- use async/await
- use fs sync

*/

import ky from "ky"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

// Polyfill for __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_URL = "https://api.github.com/repos/breck7/pldb/contributors"
const OUTPUT_FILE = path.join(__dirname, "..", "pages", "contributors.json")

async function fetchContributors(url, page = 1, allContributors = []) {
  const response = await ky
    .get(`${url}?page=${page}&per_page=100`, {
      headers: {
        "User-Agent": "fetchContributorsScript"
      }
    })
    .json()

  if (response.length > 0) {
    allContributors.push(...response)
    return fetchContributors(url, page + 1, allContributors)
  }

  return allContributors
}

async function main() {
  try {
    const contributors = await fetchContributors(API_URL)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contributors, null, 2))
    console.log(`Contributors data has been written to ${OUTPUT_FILE}`)
  } catch (error) {
    console.error("Error fetching contributors:", error)
  }
}

main()
