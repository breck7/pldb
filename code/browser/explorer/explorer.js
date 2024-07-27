class Patch {
  constructor(
    patchInput = "",
    grammar = {
      rowDelimiter: "&",
      columnDelimiter: "=",
      encodedRowDelimiter: "%2E%2E%2E",
      encodedColumnDelimiter: "%7E"
    }
  ) {
    // The pipeline of encodings. Operations will be run in order for encoding (and reveresed for decoding).
    this.encoders = [
      {
        encode: str => encodeURIComponent(str),
        decode: str => decodeURIComponent(str)
      },
      {
        encode: str => this.replaceAll(str, this.grammar.columnDelimiter, this.grammar.encodedColumnDelimiter),
        decode: str => this.replaceAll(str, this.grammar.encodedColumnDelimiter, this.grammar.columnDelimiter)
      },
      {
        encode: str => this.replaceAll(str, this.grammar.rowDelimiter, this.grammar.encodedRowDelimiter),
        decode: str => this.replaceAll(str, this.grammar.encodedRowDelimiter, this.grammar.rowDelimiter)
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
  replaceAll(str, search, replace) {
    return str.split(search).join(replace)
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
    if (obj.order === "0.asc") delete obj.order
    Object.keys(obj).forEach(key => {
      if (obj[key] === "") delete obj[key]
    })
    const newHash = new Patch(obj).uriEncodedString
    if (this.windowHash !== newHash) window.location.hash = newHash
  }

  bindToHashChange() {
    // Listen for hash changes to update the DataTable search
    window.addEventListener("hashchange", () => {
      const colString = this.columnStringFromHash
      const needsRerender = colString !== this.columnNames

      // If columns changed, we need to rebuild the whole table
      if (needsRerender) {
        this.dataTable.destroy(true)
        jQuery("#tableHolder").append(`<table id="exploreTable" class="scrollTable"></table>`)
        this.createDatatable()
        this.renderMeasureLinks()
      } else {
        this.dataTable.search(this.searchFromHash).order(this.orderFromHash).draw(false)
      }
    })
  }

  createDatatable() {
    this.columnNames = this.columnStringFromHash
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
        const order = data.order.map(([column, direction]) => `${column}.${direction}`).join(this.columnDelimiter)
        const patch = {
          q: data.search.search,
          columns: this.columnNames,
          searchBuilder: sb ? JSON.stringify(sb) : "",
          order
        }

        this.setObjectOnHash(patch)
      },
      // Set the search input to the initial value extracted from the URL
      search: { search: this.searchFromHash },
      order: this.orderFromHash,
      stateLoadCallback: settings => {
        return {
          search: {
            order: this.orderFromHash,
            search: this.searchFromHash,
            columns: this.makeColumns(this.columnStringFromHash)
          }
        }
      }
    })

    if (this.searchBuilder) this.dataTable.searchBuilder.rebuild(JSON.parse(this.searchBuilder))
  }

  get orderFromHash() {
    const order = this.objectFromHash.order
    return order
      ? order.split(this.columnDelimiter).map(o => {
          const parts = o.split(".")
          return [parseInt(parts[0]), parts[1]]
        })
      : []
  }

  columnDelimiter = "~"

  updateFromCheckbox(name) {
    let columns = this.columnStringFromHash.split(this.columnDelimiter)
    if (columns.includes(name)) columns = columns.filter(i => i !== name)
    else columns.push(name)

    const { objectFromHash } = this
    objectFromHash.columns = columns.join(this.columnDelimiter)
    this.setObjectOnHash(objectFromHash)
  }

  renderMeasureLinks() {
    const visibleMeasures = this.columnStringFromHash.split(this.columnDelimiter)
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

  get searchFromHash() {
    return this.objectFromHash.q || ""
  }

  get columnStringFromHash() {
    return this.objectFromHash.columns || this.defaultColumns
  }

  defaultColumns = "rank name id appeared tags creators".replace(/ /g, this.columnDelimiter)

  makeColumns(measureNames) {
    return measureNames
      .split(this.columnDelimiter)
      .map(name => measures.find(m => m.Name === name))
      .filter(i => i)
      .map(measureMeta => {
        const measure = measureMeta.Name
        const col = { data: measure, title: measure, defaultContent: "", type: measureMeta.Type }
        // number type in datatables is called num
        // see: https://datatables.net/extensions/searchbuilder/customConditions
        if (col.type === "number") col.type = "num"

        if (measure === "name")
          col.render = (data, type, row, meta) => `<a href="../concepts/${row.id}.html">${row.name}</a>`
        // todo: we should get type info from measures.js
        else
          col.render = (data, type, row, meta) =>
            typeof row[measure] === "string" && row[measure].startsWith("http")
              ? `<a href="${row[measure]}">${row[measure]}</a>`
              : row[measure]

        return col
      })
  }
}

document.addEventListener("DOMContentLoaded", () => (window.exploreApp = new ExploreApp()))
