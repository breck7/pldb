let searchIndex = false
document.addEventListener("DOMContentLoaded", function(event) {
  autocomplete({
    input: document.getElementById("searchBox"),
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

      if (suggestions.length > 0) update(suggestions)
      else
        update([
          {
            label: `Full text search for "${query.replace(/</g, "&lt;")}"`,
            appeared: "",
            id: ""
          }
        ])
    },
    onSelect: item => {
      const { id } = item
      if (id) window.location = "/languages/" + id + ".html"
      else
        window.location = `https://edit.pldb.com/search?q=${
          document.getElementById("searchBox").value
        }`
    }
  })
})
