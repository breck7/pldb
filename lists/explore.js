class ExploreApp {
  constructor() {
    this.columnsString = this.getColumnStringFromHash()
    this.renderMeasureLinks()
    this.createDatatable()
    this.bindToHashChange()
  }

  bindToHashChange() {
    // Listen for hash changes to update the DataTable search
    window.addEventListener("hashchange", () => {
      const colString = this.getColumnStringFromHash()

      // If columns changed, we need to rebuild the whole table
      if (colString !== this.columnsString) {
        this.columnsString = colString
        this.dataTable.destroy(true)
        jQuery("#tableHolder").append(`<table id="exploreTable" class="scrollTable"></table>`)
        this.createDatatable()
        this.renderMeasureLinks()
      } else {
        this.dataTable.search(getSearchFromHash()).draw(false)
      }
    })
  }

  columnsString = ""

  createDatatable() {
    this.dataTable = jQuery("#exploreTable").DataTable({
      data: pldb,
      columns: this.makeColumns(this.getColumnStringFromHash()),
      paging: false,
      stateSave: true,
      stateSaveCallback: (settings, data) => {
        if (data.search.search)
          window.location.hash = "q=" + encodeURIComponent(data.search.search) + "&columns=" + this.columnsString
        else window.location.hash = "columns=" + this.columnsString
      },
      // Set the search input to the initial value extracted from the URL
      search: { search: this.getSearchFromHash() },
      stateLoadCallback: settings => {
        return {
          search: { search: this.getSearchFromHash(), columns: this.makeColumns(this.getColumnStringFromHash()) }
        }
      }
    })
  }

  updateFromCheckbox(name) {
    let currentHash = window.location.hash.toString()
    if (currentHash.includes(name)) currentHash = currentHash.replace(name, "")
    else currentHash += "," + name
    window.location.hash = currentHash.replace(/,+$/, "")
  }

  renderMeasureLinks() {
    const { columnsString } = this
    // todo: set checked state
    const names = measures.map(m => m.Name)
    names.sort()
    jQuery("#measureLinks").html(
      names
        .map(
          measure =>
            `<input onchange="exploreApp.updateFromCheckbox('${measure}')" type="checkbox" ${
              columnsString.includes(measure) ? "checked" : ""
            } id="measure_${measure}"><label for="measure_${measure}">${measure}</label>`
        )
        .join("<br>")
    )
  }

  getParamsFromHash() {
    return window.location.hash
      .substr(1)
      .split("&")
      .reduce(function (p, e) {
        var a = e.split("=")
        p[decodeURIComponent(a[0])] = decodeURIComponent(a[1])
        return p
      }, {})
  }

  getSearchFromHash() {
    return this.getParamsFromHash().q || ""
  }

  getColumnStringFromHash() {
    return this.getParamsFromHash().columns || "rank,id,appeared,type,creators"
  }

  makeColumns(columnsString) {
    return columnsString
      .split(",")
      .filter(name => measures.find(m => m.Name === name))
      .map(measure => {
        const col = { data: measure, title: measure }

        if (measure === "id")
          col.render = (data, type, row, meta) =>
            `<a href="../concepts/${row.filename.replace(".scroll", ".html")}">${row.id}</a>`

        return col
      })
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.exploreApp = new ExploreApp()
})
