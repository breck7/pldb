#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

if (!fs.existsSync(path.join(process.cwd(), "package.json")) || !fs.existsSync(path.join(process.cwd(), "build.js"))) {
  console.error("Error: clean.js must be run from the top-level repository directory.")
  process.exit(1)
}

function rm(p) {
  if (!fs.existsSync(p)) return
  const stat = fs.statSync(p)
  if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true })
  else fs.unlinkSync(p)
}

function rmInDir(dir, predicate) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    if (predicate(entry)) rm(path.join(dir, entry))
  }
}

const ext = (...exts) => f => exts.includes(path.extname(f))
const dotFile = f => f.startsWith(".")
const any = (...preds) => f => preds.some(p => p(f))

// node_modules and lock file
rm("node_modules")
rm("package-lock.json")

// Root-level dot lib files copied by scroll-cli
for (const f of [
  ".codeMirror.css", ".constants.js", ".datatables.css", ".datatables.js",
  ".dayjs.min.js", ".gazette.css", ".helpfulNotFound.js", ".jquery-3.7.1.min.js",
  ".scroll.css", ".scrollLibs.js", ".tableSearch.js"
]) rm(f)

// Root-level generated data/export files
for (const f of [
  "allStyles.css",
  "pldb.csv", "pldb.js", "pldb.tsv", "pldb.parsers",
  "measures.csv", "measures.js", "measures.json", "measures.tsv",
  "ranks.json"
]) rm(f)

// Root-level generated page files
for (const f of [
  "404.html", "add.html", "add.txt", "addPrompt.txt", "conceptsSitemap.txt",
  "csv.html", "csv.txt", "download.html", "download.txt",
  "index.html", "index.txt", "readme.html", "readme.txt",
  "readmePrompt.txt", "releaseNotes.html", "releaseNotes.txt",
  "search.html", "search.txt", "sitemap.txt"
]) rm(f)

// blog: generated .html, .txt, .csv, .xml
rmInDir("blog", ext(".html", ".txt", ".csv", ".xml"))

// books: generated .html, .txt, .csv, .tsv, .json + dot lib files
rmInDir("books", any(ext(".html", ".txt", ".csv", ".tsv", ".json"), dotFile))

// concepts: generated .html, .txt only
rmInDir("concepts", ext(".html", ".txt"))

// creators: generated .html, .txt, .csv, .tsv, .json
rmInDir("creators", ext(".html", ".txt", ".csv", ".tsv", ".json"))

// features: generated .html, .txt + generated .scroll files (keep header/settings/sitemap.scroll)
const keepScroll = new Set(["header.scroll", "settings.scroll", "sitemap.scroll"])
rmInDir("features", f => ext(".html", ".txt")(f) || (f.endsWith(".scroll") && !keepScroll.has(f)))

// lists: generated .html, .txt + dot lib files + named data exports
const listsDataFiles = new Set([
  "autocompleteCombined.js",
  "events.csv", "events.json", "events.tsv",
  "live.csv", "live.json", "live.tsv", "liveMeasures.csv",
  "podcastMeasures.csv",
  "podcasts.csv", "podcasts.json", "podcasts.tsv"
])
rmInDir("lists", f => ext(".html", ".txt")(f) || dotFile(f) || listsDataFiles.has(f))

// pages: generated .html, .txt + dot lib files
rmInDir("pages", any(ext(".html", ".txt"), dotFile))

console.log("Clean complete.")
