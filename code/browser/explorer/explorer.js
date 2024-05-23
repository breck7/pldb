const DefaultPatchGrammar = {
  rowDelimiter: "&",
  columnDelimiter: "=",
  encodedRowDelimiter: "%2E%2E%2E",
  encodedColumnDelimiter: "%7E"
}
class Patch {
  constructor(patchInput = "", grammar = DefaultPatchGrammar) {
    // The pipeline of encodings. Operations will be run in order for encoding (and reveresed for decoding).
    this.encoders = [
      {
        encode: str => encodeURIComponent(str),
        decode: str => decodeURIComponent(str)
      },
      {
        encode: str => replaceAll(str, this.grammar.columnDelimiter, this.grammar.encodedColumnDelimiter),
        decode: str => replaceAll(str, this.grammar.encodedColumnDelimiter, this.grammar.columnDelimiter)
      },
      {
        encode: str => replaceAll(str, this.grammar.rowDelimiter, this.grammar.encodedRowDelimiter),
        decode: str => replaceAll(str, this.grammar.encodedRowDelimiter, this.grammar.rowDelimiter)
      },
      {
        // Turn "%20" into "+" for prettier urls.
        encode: str => str.replace(/\%20/g, "+"),
        decode: str => str.replace(/\+/g, "%20")
      }
    ]
    this.grammar = grammar
    if (typeof patchInput === "string") this.uriEncodedString = patchInput
    else if (Array.isArray(patchInput)) this.uriEncodedString = this.arrayToEncodedString(patchInput)
    else this.uriEncodedString = this.objectToEncodedString(patchInput)
  }
  objectToEncodedString(obj) {
    return Object.keys(obj)
      .map(identifierCell => {
        const value = obj[identifierCell]
        const valueCells = value instanceof Array ? value : [value]
        const row = [identifierCell, ...valueCells].map(cell => this.encodeCell(cell))
        return row.join(this.grammar.columnDelimiter)
      })
      .join(this.grammar.rowDelimiter)
  }
  arrayToEncodedString(arr) {
    return arr
      .map(line => line.map(cell => this.encodeCell(cell)).join(this.grammar.columnDelimiter))
      .join(this.grammar.rowDelimiter)
  }
  get array() {
    return this.uriEncodedString
      .split(this.grammar.rowDelimiter)
      .map(line => line.split(this.grammar.columnDelimiter).map(cell => this.decodeCell(cell)))
  }
  get object() {
    const patchObj = {}
    if (!this.uriEncodedString) return patchObj
    this.array.forEach(cells => {
      const identifierCell = cells.shift()
      patchObj[identifierCell] = cells.length > 1 ? cells : cells[0] // If a single value, collapse to a simple tuple. todo: sure about this design?
    })
    return patchObj
  }
  encodeCell(unencodedCell) {
    return this.encoders.reduce((str, encoder) => encoder.encode(str), unencodedCell)
  }
  decodeCell(encodedCell) {
    return this.encoders
      .slice()
      .reverse()
      .reduce((str, encoder) => encoder.decode(str), encodedCell)
  }
}
const replaceAll = (str, search, replace) => str.split(search).join(replace)

class ExploreApp {
  constructor() {
    this.renderMeasureLinks()
    this.createDatatable()
    this.bindToHashChange()
  }

  get windowHash() {
    return window.location.hash.replace(/^#/, "")
  }

  get objectFromHash() {
    return new Patch(this.windowHash).object
  }

  setObjectOnHash(obj) {
    if (obj.columns === this.defaultColumns) delete obj.columns
    Object.keys(obj).forEach(key => {
      if (obj[key] === "") delete obj[key]
    })
    const newHash = new Patch(obj).uriEncodedString
    if (this.windowHash !== newHash) window.location.hash = newHash
  }

  bindToHashChange() {
    // Listen for hash changes to update the DataTable search
    window.addEventListener("hashchange", () => {
      const colString = this.getColumnStringFromHash()
      const needsRerender = colString !== this.columnNames

      // If columns changed, we need to rebuild the whole table
      if (needsRerender) {
        this.dataTable.destroy(true)
        jQuery("#tableHolder").append(`<table id="exploreTable" class="scrollTable"></table>`)
        this.createDatatable()
        this.renderMeasureLinks()
      } else {
        this.dataTable.search(this.getSearchFromHash()).draw(false)
      }
    })
  }

  createDatatable() {
    this.columnNames = this.getColumnStringFromHash()
    this.searchBuilder = this.objectFromHash.searchBuilder
    const columns = this.makeColumns(this.columnNames)
    this.dataTable = jQuery("#exploreTable").DataTable({
      data: pldb,
      columns,
      layout: {
        topStart: {
          buttons: ["copy", "csv", "excel", "pdf", "print"]
        },
        top1: {
          searchBuilder: {
            columns: columns.map((col, index) => index)
          }
        }
      },
      paging: false,
      stateSave: true,
      stateSaveCallback: (settings, data) => {
        let sb = this.dataTable?.searchBuilder?.getDetails()
        if (sb && !Object.keys(sb).length) sb = ""
        const patch = {
          q: data.search.search,
          columns: this.columnNames,
          searchBuilder: sb ? JSON.stringify(sb) : ""
        }

        this.setObjectOnHash(patch)
      },
      // Set the search input to the initial value extracted from the URL
      search: { search: this.getSearchFromHash() },
      stateLoadCallback: settings => {
        return {
          search: { search: this.getSearchFromHash(), columns: this.makeColumns(this.getColumnStringFromHash()) }
        }
      }
    })

    if (this.searchBuilder) this.dataTable.searchBuilder.rebuild(JSON.parse(this.searchBuilder))
  }

  columnDelimiter = "~"

  updateFromCheckbox(name) {
    let columns = this.getColumnStringFromHash().split(this.columnDelimiter)
    if (columns.includes(name)) columns = columns.filter(i => i !== name)
    else columns.push(name)

    const { objectFromHash } = this
    objectFromHash.columns = columns.join(this.columnDelimiter)
    this.setObjectOnHash(objectFromHash)
  }

  renderMeasureLinks() {
    const visibleMeasures = this.getColumnStringFromHash().split(this.columnDelimiter)
    // todo: set checked state
    const names = measures.map(m => m.Name)
    names.sort()
    jQuery("#measureLinks").html(
      names
        .map(
          measure =>
            `<input onchange="exploreApp.updateFromCheckbox('${measure}')" type="checkbox" ${
              visibleMeasures.includes(measure) ? "checked" : ""
            } id="measure_${measure}"><label for="measure_${measure}">${measure}</label>`
        )
        .join("<br>")
    )
  }

  getSearchFromHash() {
    return this.objectFromHash.q || ""
  }

  getColumnStringFromHash() {
    return this.objectFromHash.columns || this.defaultColumns
  }

  defaultColumns = "rank name id appeared tags creators".replace(/ /g, this.columnDelimiter)

  makeColumns(measureNames) {
    return measureNames
      .split(this.columnDelimiter)
      .filter(name => measures.find(m => m.Name === name))
      .map(measure => {
        const col = { data: measure, title: measure }

        if (measure === "name")
          col.render = (data, type, row, meta) => `<a href="../concepts/${row.id}.html">${row.name}</a>`

        return col
      })
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.exploreApp = new ExploreApp()
})
