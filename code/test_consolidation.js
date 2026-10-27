// Run after building: node code/test_consolidation.js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const data = JSON.parse(read('pldb.json'))
const ids = new Set(data.map(record => record.id))
assert.equal(ids.size, data.length, 'Duplicate IDs in export')
let sourceCount = 0
for (const file of fs.readdirSync(path.join(root, 'concepts')).filter(file => file.endsWith('.scroll'))) {
  const source = read(`concepts/${file}`)
  const id = source.match(/^id (\S+)\s*$/m)?.[1]
  if (!id) continue
  sourceCount++
  assert(ids.has(id), `Source record missing from export: ${id}`)
  assert(fs.existsSync(path.join(root, 'concepts', `${id}.html`)), `Page missing: ${id}`)
}
assert.equal(sourceCount, data.length, 'Source and export counts differ')
for (const id of ['abyss', 'chombit', 'faber', 'gooo', 'hybrix', 'kaikai', 'nlp-plus-plus', 'graph-query-language', 'tint', 'ussr']) {
  assert(ids.has(id), `Consolidated record missing: ${id}`)
}
const python = read('concepts/python.html')
assert(python.includes('https://pldb.info/concepts/python.html'), 'Incorrect canonical URL')
assert(python.includes('https://github.com/Programming-Language-DataBase/pldb/blob/main/concepts/python.scroll'), 'Incorrect edit link')
assert(!python.includes('/edit.html?'), 'Unavailable ScrollHub editor linked')
for (const file of ['index.html', 'search.html', 'news.html', 'pldb.csv', 'pldb.tsv', 'creators/creators.json', 'lists/top1000.html', 'features/hasBooleans.html']) {
  assert(read(file).length > 20, `Missing or empty output: ${file}`)
}
assert(read('search.html').includes('Faber'), 'New upstream concept missing from search')
assert(read('index.html').includes('Top TIOBE Languages'), 'TIOBE section missing')
console.log(`Consolidation checks passed: ${sourceCount} source records, exports, pages, search, and contribution links.`)
