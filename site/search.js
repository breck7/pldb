let searchIndex = false

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
        id: ""
      })

      update(suggestions)
    },
    onSelect: item => {
      const isLocalHost =
        location.hostname === "localhost" || location.hostname === "127.0.0.1"

      const { id } = item
      const goToUrl = `/languages/${id}.html`
      if (id)
        window.location = isLocalHost ? goToUrl : `https://pldb.com${goToUrl}`
      else {
        const goToUrl = `/search?q=${encodeURIComponent(
          document.getElementById(elementId).value
        )}`
        window.location = isLocalHost
          ? goToUrl
          : `https://edit.pldb.com${goToUrl}`
      }
    }
  })
}

document.addEventListener("DOMContentLoaded", evt =>
  initSearchAutocomplete("headerSearch")
)
