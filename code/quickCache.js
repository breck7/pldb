// Memoization for immutable getters. Run the function once for this instance and cache the result.
const quickCache = (target, propName, descriptor) => {
  const originalFn = descriptor.get
  descriptor.get = function(this) {
    if (!this.quickCacheCache) this.quickCacheCache = {}
    const quickCacheCache = this.quickCacheCache
    if (quickCacheCache[propName] === undefined)
      quickCacheCache[propName] = originalFn.apply(this)
    return quickCacheCache[propName]
  }
}
const clearQuickCache = obj => delete obj.quickCacheCache

export { quickCache, clearQuickCache }
