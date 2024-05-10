let autocompleteSearchIndex = window.autocompleteJs || [] // todo: cleanup?
// handle localhost differently
if (location.href.includes("/pldb/")) {
  let baseUrl = ""
  const isNested = location.href.split("/pldb/")[1].split("/").length - 1
  autocompleteSearchIndex = autocompleteSearchIndex.map(row => {
    if (isNested) row.url = ".." + row.url
    else row.url = row.url.substr(1)

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
        label: `Full text search for "${htmlEncodedQuery}"`,
        id: "",
        url: `/lists/search.html?q=${htmlEncodedQuery}`
      })
      update(suggestions)
    },
    onSelect: item => {
      const { url, id } = item
      if (id) window.location = url
      else window.location = "/lists/search.html?q=" + encodeURIComponent(input.value)
    }
  })
}
