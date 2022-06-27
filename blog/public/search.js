let searchIndex = false
document.addEventListener("DOMContentLoaded", function(event) {
  autocomplete({
    input: document.getElementById("searchBox"),
    minLength: 1,
    emptyMsg: "No matching entities found",
    preventSubmit: true,
    fetch: async (text, update) => {
      text = text.toLowerCase()
      // you can also use AJAX requests instead of preloaded data

      if (!searchIndex) {
        let response = await fetch("/searchIndex.json")
        if (response.ok) searchIndex = await response.json()
      }

      const suggestions = searchIndex.filter(entity =>
        entity.label.toLowerCase().startsWith(text)
      )
      update(suggestions)
    },
    onSelect: item => (window.location = "/languages/" + item.id + ".html")
  })
})
