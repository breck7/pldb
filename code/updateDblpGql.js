'use strict'

/**
 * Fetches recent DBLP publications about GQL (Graph Query Language / ISO 39075)
 * and updates concepts/graph-query-language.scroll with a `dblp` section.
 *
 * Searches run against the public DBLP JSON API (no key required).
 * Results are filtered to the most recent YEARS years and deduplicated.
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SCROLL_FILE = path.join(ROOT, 'concepts', 'graph-query-language.scroll')
const DBLP_SEARCH_URL = 'https://dblp.org/search?q=GQL+graph+query+language'
const YEARS = 5

// DBLP search queries whose hits are merged and deduplicated.
// "GQL graph" matches papers about the ISO GQL standard.
// "SQL/PGQ" matches the companion SQL Property Graph Query standard.
const QUERIES = [
  'GQL graph',
  'SQL/PGQ'
]

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchUrl(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'PLDB-DblpGql/1.0 (+https://pldb.info)' } }, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => req.destroy(new Error('DBLP fetch timed out')))
  })
}

function dblpApiUrl(query) {
  return `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&format=json&h=100&f=0`
}

// ─── DBLP parsing ─────────────────────────────────────────────────────────────

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function getAuthors(info) {
  const rawAuthors = info.authors?.author
  const list = Array.isArray(rawAuthors)
    ? rawAuthors
    : rawAuthors && typeof rawAuthors === 'object'
      ? [rawAuthors]
      : []
  return list
    .filter(a => a && typeof a.text === 'string')
    .map(a => a.text)
    .join(' and ')
}

function safePsvCell(value) {
  return String(value || '').replace(/\|/g, '-').replace(/\n/g, ' ').trim()
}

async function fetchDblpQuery(query) {
  const raw = await fetchUrl(dblpApiUrl(query))
  const data = JSON.parse(raw)
  return data.result?.hits?.hit || []
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function updateDblpGql() {
  const minYear = new Date().getFullYear() - YEARS
  const seen = new Set()
  const pubs = []

  for (const q of QUERIES) {
    let hits
    try {
      hits = await fetchDblpQuery(q)
    } catch (err) {
      console.warn(`  ⚠️  DBLP query "${q}" failed: ${err.message}`)
      continue
    }
    for (const h of hits) {
      const info = h.info || {}
      const year = parseInt(info.year || 0, 10)
      if (year < minYear) continue
      const key = info.key || info.url || ''
      if (!key || seen.has(key)) continue
      seen.add(key)

      const eeRaw = info.ee
      const url = Array.isArray(eeRaw) ? eeRaw[0] : (eeRaw || info.url || '')

      pubs.push({
        year,
        title: decodeEntities((info.title || '').replace(/\.$/, '')),
        doi: info.doi || '',
        url,
        authors: getAuthors(info)
      })
    }
  }

  // Sort by year descending, then title ascending
  pubs.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))

  const hitCount = pubs.length

  // Build PSV table (indented under `publications`)
  const psvHeader = 'year|title|doi|url'
  const psvRows = pubs.map(p =>
    [p.year, safePsvCell(p.title), safePsvCell(p.doi), safePsvCell(p.url)].join('|')
  )
  const psvLines = [psvHeader, ...psvRows]

  // Build the dblp block (Scroll indentation: 1 space for children, 2 for grandchildren)
  const dblpBlock =
    `dblp ${DBLP_SEARCH_URL}\n` +
    ` hits ${hitCount}\n` +
    ` publications\n` +
    psvLines.map(line => `  ${line}`).join('\n') +
    '\n'

  // Read scroll file and replace or append the dblp block
  let content = fs.readFileSync(SCROLL_FILE, 'utf8')

  // Match from "dblp <url>" through its indented children (lines starting with space/tab)
  const dblpBlockRe = /^dblp [^\n]*\n(?:[ \t][^\n]*\n?)*/m
  if (dblpBlockRe.test(content)) {
    content = content.replace(dblpBlockRe, dblpBlock)
  } else {
    content = content.trimEnd() + '\n\n' + dblpBlock
  }

  fs.writeFileSync(SCROLL_FILE, content)
  console.log(`  ✅ DBLP GQL: ${hitCount} publications (${minYear}–present) written to graph-query-language.scroll`)
}

module.exports = { updateDblpGql }

if (require.main === module) {
  updateDblpGql().catch(err => { console.error(err); process.exit(1) })
}
