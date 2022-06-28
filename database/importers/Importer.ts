import { PLDBFile, PLDBBaseFolder } from "../PLDBBase"
const { Disk } = require("jtree/products/Disk.node.js")
import { getCleanedId } from "../utils"
const lodash = require("lodash")

class Importer {
  constructor(file: PLDBFile) {
    this.file = file
  }

  file: PLDBFile
  guidKey = ""
  sourceDomain = ""

  get base() {
    return this.file.getParent() as PLDBBaseFolder
  }

  get pldbId() {
    return this.file.getPrimaryKey()
  }

  get sourceId() {
    return this.file.get(this.guidKey)
  }

  get cacheDir() {
    return __dirname + "/cache/" + this.sourceDomain + "/"
  }

  get cacheFilename() {
    return getCleanedId(this.sourceId)
  }

  get cachePath() {
    return this.cacheDir + this.cacheFilename
  }

  get isDownloaded() {
    return Disk.exists(this.cachePath)
  }

  fetch() {}

  parse() {}

  updatePldb() {}

  mkCacheDir() {
    Disk.mkdir(this.cacheDir)
  }

  running = 0
  async _fetchQueue() {
    if (!this.downloadQueue.length) return

    await this.downloadQueue.pop().fetch()
    return this._fetchQueue()
  }

  maxConcurrent = 10
  downloadQueue: Importer[] = []
  async fetchAll() {
    this.mkCacheDir()
    const builder: any = this.constructor
    const files = this.linkedFiles.map(file => new builder(file))
    this.downloadQueue = lodash.shuffle(files) // Randomize so dont get stuck on one
    const threads = lodash
      .range(0, this.maxConcurrent, 1)
      .map(i => this._fetchQueue())
    await Promise.all(threads)
  }

  parseAll() {}

  get linkedFiles() {
    return this.base.filter(file => file.has(this.guidKey))
  }

  updateAllPldb() {
    const builder: any = this.constructor
    this.linkedFiles.forEach(file => {
      new builder(file).updatePldb()
    })
  }
}

export { Importer }
