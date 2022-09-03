let searchIndex = false

const initSearchAutocomplete = elementId => {
  autocomplete({
    input: document.getElementById(elementId),
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
      const { id } = item
      // todo: make work on local dev server too
      if (id) window.location = "https://pldb.com/languages/" + id + ".html"
      else
        window.location = `https://edit.pldb.com/search?q=${
          document.getElementById(elementId).value
        }`
    }
  })
}

document.addEventListener("DOMContentLoaded", evt =>
  initSearchAutocomplete("headerSearch")
)
