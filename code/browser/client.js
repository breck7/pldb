let autocompleteSearchIndex = window.autocompleteJs || [] // todo: cleanup?
// handle localhost differently
const isLocalHost = location.href.includes("/pldb/")
const isNested = isLocalHost && location.href.split("/pldb/")[1].split("/").length - 1
const normalizeUrl = url => (isLocalHost ? (isNested ? ".." + url : url.substr(1)) : url)
if (location.href.includes("/pldb/")) {
  autocompleteSearchIndex = autocompleteSearchIndex.map(row => {
    row.url = normalizeUrl(row.url)
    return row
  })
}

const initAutocomplete = elementId => {
  const input = document.getElementById(elementId)
  const urlParams = new URLSearchParams(window.location.search)
  const query = urlParams.get("q")
  if (query) input.value = query
  autocomplete({
    input,
    minLength: 1,
    emptyMsg: "No matching entities found",
    preventSubmit: true,
    fetch: async (query, update) => {
      const text = query.toLowerCase()
      const suggestions = autocompleteSearchIndex.filter(entity => entity.label.toLowerCase().startsWith(text))

      const htmlEncodedQuery = query.replace(/</g, "&lt;")

      suggestions.push({
        label: `Search for "${htmlEncodedQuery}"`,
        id: "",
        url: normalizeUrl(`/lists/explorer.html#q=${htmlEncodedQuery}`)
      })
      update(suggestions)
    },
    onSelect: item => {
      const { url, id } = item
      if (id) window.location = url
      else window.location = normalizeUrl("/search.html#q=" + encodeURIComponent(input.value))
    }
  })
}
