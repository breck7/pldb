let searchIndex = false

const initSearchAutocomplete = elementId => {
  const input = document.getElementById(elementId)
  const urlParams = new URLSearchParams(window.location.search)
  const query = urlParams.get("q")
  const IS_LOCALHOST =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
  if (query) input.value = query
  autocomplete({
    input,
    minLength: 1,
    emptyMsg: "No matching entities found",
    preventSubmit: true,
    fetch: async (query, update) => {
      text = query.toLowerCase()
      // you can also use AJAX requests instead of preloaded data

      if (!searchIndex) {
        let response = await fetch("/searchIndex.json")
        if (response.ok) searchIndex = await response.json()
      }

      const suggestions = searchIndex.filter(entity =>
        entity.label.toLowerCase().startsWith(text)
      )

      suggestions.push({
        label: `Full text search for "${query.replace(/</g, "&lt;")}"`,
        appeared: "",
        id: "",
        url: "/search?q="
      })

      update(suggestions)
    },
    onSelect: item => {
      const { url, id } = item
      if (id) window.location = IS_LOCALHOST ? url : `https://pldb.com${url}`
      else {
        const fullUrl = url + encodeURIComponent(input.value)
        window.location = IS_LOCALHOST
          ? fullUrl
          : `https://build.pldb.com${fullUrl}`
      }
    }
  })
}

document.addEventListener("DOMContentLoaded", evt =>
  initSearchAutocomplete("headerSearch")
)
