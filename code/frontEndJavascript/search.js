let searchIndex = false
let searchIndexRequestMade = false

const SearchSuggestionInterface = {
  label: "string",
  appeared: "number",
  id: "string",
  url: "string"
}

const tinyTypeScript = (items, expectedInterface) =>
  items.forEach(item => {
    Object.keys(item).forEach(key => {
      const value = item[key]
      const actualType = typeof item[key]
      const expectedType = expectedInterface[key]
      const passed = actualType === expectedType
      console.assert(passed)
      if (!passed)
        console.error(
          `For key '${key}' object had type '${actualType}' but expected '${expectedType}'. Value was '${value}'`
        )
    })
  })

// This method is currently used to enable autocomplete on: the header search, front page search, 404 page search
const initSearchAutocomplete = elementId => {
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
      text = query.toLowerCase()
      // you can also use AJAX requests instead of preloaded data

      if (!searchIndexRequestMade) {
        searchIndexRequestMade = true
        let response = await fetch("/searchIndex.json")
        if (response.ok) searchIndex = await response.json()
      }

      const suggestions = searchIndex.filter(entity =>
        entity.label.toLowerCase().startsWith(text)
      )

      const htmlEncodedQuery = query.replace(/</g, "&lt;")

      suggestions.push({
        label: `Full text search for "${htmlEncodedQuery}"`,
        appeared: 2022,
        id: "",
        url: `/fullTextSearch?q=${htmlEncodedQuery}`
      })
      tinyTypeScript(suggestions, SearchSuggestionInterface)

      update(suggestions)
    },
    onSelect: item => {
      const { url, id } = item
      if (id) window.location = url
      else
        window.location = "/fullTextSearch?q=" + encodeURIComponent(input.value)
    }
  })
}

document.addEventListener("DOMContentLoaded", evt =>
  initSearchAutocomplete("headerSearch")
)
