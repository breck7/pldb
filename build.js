#!/usr/bin/env node

/**
 * PLDB Build Script
 *
 * This script builds the entire PLDB site from scratch.
 * It handles the correct build order and all dependencies.
 *
 * Usage: node build.js [--serve]
 *   --serve: Start a local server after building
 */

const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const ROOT = __dirname
const SCROLL_CLI = path.join(ROOT, 'node_modules', 'scroll-cli', 'scroll.js')

// Build order matters: creators must be before lists
const SUBFOLDERS = ['blog', 'books', 'concepts', 'creators', 'features', 'lists', 'pages']

function run(cmd, cwd = ROOT) {
  console.log(`\n📂 [${path.basename(cwd)}] Running: ${cmd}`)
  try {
    execSync(cmd, { cwd, stdio: 'inherit' })
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`)
    throw err
  }
}

function runQuiet(cmd, cwd = ROOT) {
  console.log(`📂 [${path.basename(cwd)}] Running: ${cmd}`)
  try {
    execSync(cmd, { cwd, stdio: 'pipe' })
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`)
    throw err
  }
}

function fetchTiobeTop10() {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const options = {
      hostname: 'www.tiobe.com',
      path: '/tiobe-index/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
    let data = ''
    const req = https.request(options, res => {
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        // The td-top20 cell contains the language logo image; the language name
        // is in the immediately following plain <td>.
        const matches = [...data.matchAll(/<td class="td-top20">.*?<\/td><td>([^<]+)<\/td>/g)]
        const top10 = matches.slice(0, 10).map(m => ({ name: m[1].trim() }))
        if (top10.length === 0) {
          reject(new Error('No TIOBE languages found in page — HTML structure may have changed'))
        } else {
          resolve(top10)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(new Error('TIOBE fetch timed out')) })
    req.end()
  })
}

// Maps TIOBE display names to PLDB concept IDs
const TIOBE_TO_PLDB = {
  'Python': 'python',
  'C': 'c',
  'C++': 'cpp',
  'Java': 'java',
  'C#': 'csharp',
  'JavaScript': 'javascript',
  'Visual Basic': 'visual-basic',
  'SQL': 'sql',
  'R': 'r',
  'Delphi/Object Pascal': 'delphi',
  'Go': 'go',
  'Fortran': 'fortran',
  'Rust': 'rust',
  'Kotlin': 'kotlin',
  'Swift': 'swift',
  'PHP': 'php',
  'MATLAB': 'matlab',
  'TypeScript': 'typescript',
  'Scratch': 'scratch',
  'Assembly language': 'assembly'
}

function writeTiobeLangsScroll(languages, fetchDate) {
  const heading = `<p class="pldbHomepageLink"><a href="https://www.tiobe.com/tiobe-index/">Top TIOBE Languages</a> <span style="color:#828282;font-size:0.85em;">(Fetched ${fetchDate})</span></p>`
  const items = languages.map(l => {
    const id = TIOBE_TO_PLDB[l.name]
    return id ? `<a href="concepts/${id}.html">${l.name}</a>` : l.name
  })
  const list = items.join('&nbsp;·&nbsp;')
  const content = `importOnly

${heading}

${list}
`
  fs.writeFileSync(path.join(ROOT, 'topTiobeLangs.scroll'), content)
}

async function build() {
  const startTime = Date.now()

  console.log('🔨 PLDB Build Script')
  console.log('=' .repeat(50))

  // Step 1: Build parsers file
  console.log('\n📋 Step 1: Building parsers file...')
  run('node cli.js buildParsersFile')

  // Step 2: Patch scroll-cli for Windows compatibility (if needed)
  console.log('\n🔧 Step 2: Checking scroll-cli Windows compatibility...')
  patchScrollCliIfNeeded()

  // Step 2.5: Fetch TIOBE top 10 and write topTiobeLangs.scroll
  console.log('\n📋 Step 2.5: Fetching TIOBE top 10 languages...')
  try {
    const tiobeLanguages = await fetchTiobeTop10()
    const fetchDate = new Date().toISOString().split('T')[0]
    writeTiobeLangsScroll(tiobeLanguages, fetchDate)
    console.log(`✅ TIOBE top 10: ${tiobeLanguages.map(l => l.name).join(', ')}`)
  } catch (err) {
    console.warn(`⚠️  Could not fetch TIOBE data (${err.message}), keeping existing topTiobeLangs.scroll`)
  }

  // Step 3: Build root folder (generates pldb.json, measures.json)
  console.log('\n📋 Step 3: Building root folder...')
  run(`node "${SCROLL_CLI}" build`)

  // Step 4: Generate feature pages (requires measures.json from step 3)
  console.log('\n📋 Step 4: Generating feature pages...')
  const { Tables } = require('./Computer.js')
  Tables.writeAllFeaturePages()
  console.log('✅ Feature pages generated')

  // Step 5: Build all subfolders
  console.log('\n📋 Step 5: Building subfolders...')
  for (const dir of SUBFOLDERS) {
    const folderPath = path.join(ROOT, dir)
    if (fs.existsSync(folderPath)) {
      console.log(`\n  📁 Building ${dir}/...`)
      try {
        runQuiet(`node "${SCROLL_CLI}" build`, folderPath)
        console.log(`  ✅ ${dir}/ built successfully`)
      } catch (err) {
        console.error(`  ⚠️ ${dir}/ build had errors (continuing...)`)
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '=' .repeat(50))
  console.log(`✅ Build complete in ${elapsed}s`)
}

function patchScrollCliIfNeeded() {
  // Check if we're on Windows and need to patch
  if (process.platform !== 'win32') {
    console.log('  Not on Windows, skipping patch')
    return
  }

  const rootParsersPath = path.join(ROOT, 'node_modules', 'scroll-cli', 'parsers', 'root.parsers')

  if (!fs.existsSync(rootParsersPath)) {
    console.log('  scroll-cli root.parsers not found, skipping patch')
    return
  }

  let content = fs.readFileSync(rootParsersPath, 'utf8')

  if (content.includes('Utils.posix.dirname')) {
    console.log('  Patching scroll-cli for Windows path compatibility...')
    content = content.replace(
      /Utils\.posix\.dirname\(this\.filePath\)/g,
      'require("path").dirname(this.filePath)'
    )
    content = content.replace(
      /Utils\.posix\.basename\(this\.filePath\)/g,
      'require("path").basename(this.filePath)'
    )
    fs.writeFileSync(rootParsersPath, content)
    console.log('  ✅ scroll-cli patched')

    // Also patch nested copy if exists
    const nestedPath = path.join(ROOT, 'node_modules', 'scroll-cli', 'node_modules', 'scroll-cli', 'parsers', 'root.parsers')
    if (fs.existsSync(nestedPath)) {
      let nestedContent = fs.readFileSync(nestedPath, 'utf8')
      nestedContent = nestedContent.replace(
        /Utils\.posix\.dirname\(this\.filePath\)/g,
        'require("path").dirname(this.filePath)'
      )
      nestedContent = nestedContent.replace(
        /Utils\.posix\.basename\(this\.filePath\)/g,
        'require("path").basename(this.filePath)'
      )
      fs.writeFileSync(nestedPath, nestedContent)
      console.log('  ✅ Nested scroll-cli patched')
    }
  } else {
    console.log('  scroll-cli already patched or uses compatible paths')
  }
}

function writeMaintenancePage() {
  const maintenanceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLDB - Building...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { font-size: 1.2rem; color: #666; }
    .spinner {
      margin: 2rem auto;
      width: 40px;
      height: 40px;
      border: 4px solid #ddd;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <meta http-equiv="refresh" content="10">
</head>
<body>
  <div class="container">
    <h1>PLDB</h1>
    <div class="spinner"></div>
    <p>Site is rebuilding. This page will refresh automatically.</p>
  </div>
</body>
</html>`
  fs.writeFileSync(path.join(ROOT, 'index.html'), maintenanceHtml)
  console.log('  Wrote maintenance page to index.html')
}

function startBackgroundServer() {
  console.log('  Starting background server on http://localhost:3000 ...')
  const serverProcess = spawn('npx', ['serve', '.'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true
  })
  return serverProcess
}

// Main
const args = process.argv.slice(2)
const shouldServe = args.includes('--serve') || args.includes('-s')

let serverProcess = null

if (shouldServe) {
  console.log('\n🌐 Setting up maintenance page before build...')
  writeMaintenancePage()
  serverProcess = startBackgroundServer()
}

build()
  .then(() => {
    if (shouldServe) {
      console.log('\n🌐 Server is running at http://localhost:3000')
      console.log('   Build complete - server is now serving the real site')
      console.log('   Press Ctrl+C to stop\n')
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...')
        if (serverProcess) serverProcess.kill()
        process.exit(0)
      })
    } else {
      console.log('\n💡 To start a local server, run: npm run serve')
      console.log('   Or: node build.js --serve')
    }
  })
  .catch(err => {
    console.error('\n❌ Build failed:', err.message)
    if (serverProcess) serverProcess.kill()
    process.exit(1)
  })
