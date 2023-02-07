const lodash = require("lodash")

interface PoliteCrawlerJob {
  fetch: Function
}

class PoliteCrawler {
  running = 0
  async _fetchQueue(methodName = "fetch") {
    if (!this.downloadQueue.length) return

    await this.awaitScheduledTime()

    const nextItem = this.downloadQueue.pop()
    if (!nextItem) return
    await nextItem[methodName]()
    return this._fetchQueue(methodName)
  }

  async awaitScheduledTime() {
    if (!this.msDelayBetweenRequests) return

    if (!this._nextOpenTime) {
      this._nextOpenTime = Date.now() + this.msDelayBetweenRequests
      return
    }

    const awaitTimeInMs = this._nextOpenTime - Date.now()
    if (awaitTimeInMs < 1) {
      this._nextOpenTime = Date.now() + this.msDelayBetweenRequests
      return
    }
    this._nextOpenTime = this._nextOpenTime + this.msDelayBetweenRequests
    await new Promise(r => setTimeout(r, awaitTimeInMs))
  }

  _nextOpenTime = 0
  msDelayBetweenRequests = 0
  maxConcurrent = 10
  downloadQueue: PoliteCrawlerJob[] = []
  randomize = false // Can randomize the queue so dont get stuck on one
  async fetchAll(jobs, methodName = "fetch") {
    this.downloadQueue = this.randomize ? lodash.shuffle(jobs) : jobs
    const threads = lodash
      .range(0, this.maxConcurrent, 1)
      .map(i => this._fetchQueue(methodName))
    await Promise.all(threads)
  }
}

export { PoliteCrawler }
