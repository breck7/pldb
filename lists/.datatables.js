/*
 * This combined file was created by the DataTables downloader builder:
 *   https://datatables.net/download
 *
 * To rebuild or modify this file with the latest versions of the included
 * software please visit:
 *   https://datatables.net/download/#dt/dt-2.1.7/b-3.1.2/b-colvis-3.1.2/b-html5-3.1.2/cr-2.0.4/fc-5.0.2/fh-4.0.1/sb-1.8.0
 *
 * Included libraries:
 *   DataTables 2.1.7, Buttons 3.1.2, Column visibility 3.1.2, HTML5 export 3.1.2, ColReorder 2.0.4, FixedColumns 5.0.2, FixedHeader 4.0.1, SearchBuilder 1.8.0
 */

/*! DataTables 2.1.7
 * © SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     DataTables
 * @description Paginate, search and order HTML tables
 * @version     2.1.7
 * @author      SpryMedia Ltd
 * @contact     www.datatables.net
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - https://datatables.net/license
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://www.datatables.net
 */

;(function (factory) {
	"use strict"

	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		// jQuery's factory checks for a global window - if it isn't present then it
		// returns a factory function that expects the window object
		var jq = require("jquery")

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				return factory($, root, root.document)
			}
		} else {
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		window.DataTable = factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"

	var DataTable = function (selector, options) {
		// Check if called with a window or jQuery object for DOM less applications
		// This is for backwards compatibility
		if (DataTable.factory(selector, options)) {
			return DataTable
		}

		// When creating with `new`, create a new DataTable, returning the API instance
		if (this instanceof DataTable) {
			return $(selector).DataTable(options)
		} else {
			// Argument switching
			options = selector
		}

		var _that = this
		var emptyInit = options === undefined
		var len = this.length

		if (emptyInit) {
			options = {}
		}

		// Method to get DT API instance from jQuery object
		this.api = function () {
			return new _Api(this)
		}

		this.each(function () {
			// For each initialisation we want to give it a clean initialisation
			// object that can be bashed around
			var o = {}
			var oInit =
				len > 1 // optimisation for single table case
					? _fnExtend(o, options, true)
					: options

			var i = 0,
				iLen
			var sId = this.getAttribute("id")
			var defaults = DataTable.defaults
			var $this = $(this)

			/* Sanity check */
			if (this.nodeName.toLowerCase() != "table") {
				_fnLog(null, 0, "Non-table node initialisation (" + this.nodeName + ")", 2)
				return
			}

			$(this).trigger("options.dt", oInit)

			/* Backwards compatibility for the defaults */
			_fnCompatOpts(defaults)
			_fnCompatCols(defaults.column)

			/* Convert the camel-case defaults to Hungarian */
			_fnCamelToHungarian(defaults, defaults, true)
			_fnCamelToHungarian(defaults.column, defaults.column, true)

			/* Setting up the initialisation object */
			_fnCamelToHungarian(defaults, $.extend(oInit, $this.data()), true)

			/* Check to see if we are re-initialising a table */
			var allSettings = DataTable.settings
			for (i = 0, iLen = allSettings.length; i < iLen; i++) {
				var s = allSettings[i]

				/* Base check on table node */
				if (s.nTable == this || (s.nTHead && s.nTHead.parentNode == this) || (s.nTFoot && s.nTFoot.parentNode == this)) {
					var bRetrieve = oInit.bRetrieve !== undefined ? oInit.bRetrieve : defaults.bRetrieve
					var bDestroy = oInit.bDestroy !== undefined ? oInit.bDestroy : defaults.bDestroy

					if (emptyInit || bRetrieve) {
						return s.oInstance
					} else if (bDestroy) {
						new DataTable.Api(s).destroy()
						break
					} else {
						_fnLog(s, 0, "Cannot reinitialise DataTable", 3)
						return
					}
				}

				/* If the element we are initialising has the same ID as a table which was previously
				 * initialised, but the table nodes don't match (from before) then we destroy the old
				 * instance by simply deleting it. This is under the assumption that the table has been
				 * destroyed by other methods. Anyone using non-id selectors will need to do this manually
				 */
				if (s.sTableId == this.id) {
					allSettings.splice(i, 1)
					break
				}
			}

			/* Ensure the table has an ID - required for accessibility */
			if (sId === null || sId === "") {
				sId = "DataTables_Table_" + DataTable.ext._unique++
				this.id = sId
			}

			/* Create the settings object for this table and set some of the default parameters */
			var oSettings = $.extend(true, {}, DataTable.models.oSettings, {
				sDestroyWidth: $this[0].style.width,
				sInstance: sId,
				sTableId: sId,
				colgroup: $("<colgroup>").prependTo(this),
				fastData: function (row, column, type) {
					return _fnGetCellData(oSettings, row, column, type)
				}
			})
			oSettings.nTable = this
			oSettings.oInit = oInit

			allSettings.push(oSettings)

			// Make a single API instance available for internal handling
			oSettings.api = new _Api(oSettings)

			// Need to add the instance after the instance after the settings object has been added
			// to the settings array, so we can self reference the table instance if more than one
			oSettings.oInstance = _that.length === 1 ? _that : $this.dataTable()

			// Backwards compatibility, before we apply all the defaults
			_fnCompatOpts(oInit)

			// If the length menu is given, but the init display length is not, use the length menu
			if (oInit.aLengthMenu && !oInit.iDisplayLength) {
				oInit.iDisplayLength = Array.isArray(oInit.aLengthMenu[0]) ? oInit.aLengthMenu[0][0] : $.isPlainObject(oInit.aLengthMenu[0]) ? oInit.aLengthMenu[0].value : oInit.aLengthMenu[0]
			}

			// Apply the defaults and init options to make a single init object will all
			// options defined from defaults and instance options.
			oInit = _fnExtend($.extend(true, {}, defaults), oInit)

			// Map the initialisation options onto the settings object
			_fnMap(oSettings.oFeatures, oInit, ["bPaginate", "bLengthChange", "bFilter", "bSort", "bSortMulti", "bInfo", "bProcessing", "bAutoWidth", "bSortClasses", "bServerSide", "bDeferRender"])
			_fnMap(oSettings, oInit, [
				"ajax",
				"fnFormatNumber",
				"sServerMethod",
				"aaSorting",
				"aaSortingFixed",
				"aLengthMenu",
				"sPaginationType",
				"iStateDuration",
				"bSortCellsTop",
				"iTabIndex",
				"sDom",
				"fnStateLoadCallback",
				"fnStateSaveCallback",
				"renderer",
				"searchDelay",
				"rowId",
				"caption",
				"layout",
				"orderDescReverse",
				"typeDetect",
				["iCookieDuration", "iStateDuration"], // backwards compat
				["oSearch", "oPreviousSearch"],
				["aoSearchCols", "aoPreSearchCols"],
				["iDisplayLength", "_iDisplayLength"]
			])
			_fnMap(oSettings.oScroll, oInit, [
				["sScrollX", "sX"],
				["sScrollXInner", "sXInner"],
				["sScrollY", "sY"],
				["bScrollCollapse", "bCollapse"]
			])
			_fnMap(oSettings.oLanguage, oInit, "fnInfoCallback")

			/* Callback functions which are array driven */
			_fnCallbackReg(oSettings, "aoDrawCallback", oInit.fnDrawCallback)
			_fnCallbackReg(oSettings, "aoStateSaveParams", oInit.fnStateSaveParams)
			_fnCallbackReg(oSettings, "aoStateLoadParams", oInit.fnStateLoadParams)
			_fnCallbackReg(oSettings, "aoStateLoaded", oInit.fnStateLoaded)
			_fnCallbackReg(oSettings, "aoRowCallback", oInit.fnRowCallback)
			_fnCallbackReg(oSettings, "aoRowCreatedCallback", oInit.fnCreatedRow)
			_fnCallbackReg(oSettings, "aoHeaderCallback", oInit.fnHeaderCallback)
			_fnCallbackReg(oSettings, "aoFooterCallback", oInit.fnFooterCallback)
			_fnCallbackReg(oSettings, "aoInitComplete", oInit.fnInitComplete)
			_fnCallbackReg(oSettings, "aoPreDrawCallback", oInit.fnPreDrawCallback)

			oSettings.rowIdFn = _fnGetObjectDataFn(oInit.rowId)

			/* Browser support detection */
			_fnBrowserDetect(oSettings)

			var oClasses = oSettings.oClasses

			$.extend(oClasses, DataTable.ext.classes, oInit.oClasses)
			$this.addClass(oClasses.table)

			if (!oSettings.oFeatures.bPaginate) {
				oInit.iDisplayStart = 0
			}

			if (oSettings.iInitDisplayStart === undefined) {
				/* Display start point, taking into account the save saving */
				oSettings.iInitDisplayStart = oInit.iDisplayStart
				oSettings._iDisplayStart = oInit.iDisplayStart
			}

			var defer = oInit.iDeferLoading
			if (defer !== null) {
				oSettings.deferLoading = true

				var tmp = Array.isArray(defer)
				oSettings._iRecordsDisplay = tmp ? defer[0] : defer
				oSettings._iRecordsTotal = tmp ? defer[1] : defer
			}

			/*
			 * Columns
			 * See if we should load columns automatically or use defined ones
			 */
			var columnsInit = []
			var thead = this.getElementsByTagName("thead")
			var initHeaderLayout = _fnDetectHeader(oSettings, thead[0])

			// If we don't have a columns array, then generate one with nulls
			if (oInit.aoColumns) {
				columnsInit = oInit.aoColumns
			} else if (initHeaderLayout.length) {
				for (i = 0, iLen = initHeaderLayout[0].length; i < iLen; i++) {
					columnsInit.push(null)
				}
			}

			// Add the columns
			for (i = 0, iLen = columnsInit.length; i < iLen; i++) {
				_fnAddColumn(oSettings)
			}

			// Apply the column definitions
			_fnApplyColumnDefs(oSettings, oInit.aoColumnDefs, columnsInit, initHeaderLayout, function (iCol, oDef) {
				_fnColumnOptions(oSettings, iCol, oDef)
			})

			/* HTML5 attribute detection - build an mData object automatically if the
			 * attributes are found
			 */
			var rowOne = $this.children("tbody").find("tr").eq(0)

			if (rowOne.length) {
				var a = function (cell, name) {
					return cell.getAttribute("data-" + name) !== null ? name : null
				}

				$(rowOne[0])
					.children("th, td")
					.each(function (i, cell) {
						var col = oSettings.aoColumns[i]

						if (!col) {
							_fnLog(oSettings, 0, "Incorrect column count", 18)
						}

						if (col.mData === i) {
							var sort = a(cell, "sort") || a(cell, "order")
							var filter = a(cell, "filter") || a(cell, "search")

							if (sort !== null || filter !== null) {
								col.mData = {
									_: i + ".display",
									sort: sort !== null ? i + ".@data-" + sort : undefined,
									type: sort !== null ? i + ".@data-" + sort : undefined,
									filter: filter !== null ? i + ".@data-" + filter : undefined
								}
								col._isArrayHost = true

								_fnColumnOptions(oSettings, i)
							}
						}
					})
			}

			// Must be done after everything which can be overridden by the state saving!
			_fnCallbackReg(oSettings, "aoDrawCallback", _fnSaveState)

			var features = oSettings.oFeatures
			if (oInit.bStateSave) {
				features.bStateSave = true
			}

			// If aaSorting is not defined, then we use the first indicator in asSorting
			// in case that has been altered, so the default sort reflects that option
			if (oInit.aaSorting === undefined) {
				var sorting = oSettings.aaSorting
				for (i = 0, iLen = sorting.length; i < iLen; i++) {
					sorting[i][1] = oSettings.aoColumns[i].asSorting[0]
				}
			}

			// Do a first pass on the sorting classes (allows any size changes to be taken into
			// account, and also will apply sorting disabled classes if disabled
			_fnSortingClasses(oSettings)

			_fnCallbackReg(oSettings, "aoDrawCallback", function () {
				if (oSettings.bSorted || _fnDataSource(oSettings) === "ssp" || features.bDeferRender) {
					_fnSortingClasses(oSettings)
				}
			})

			/*
			 * Table HTML init
			 * Cache the header, body and footer as required, creating them if needed
			 */
			var caption = $this.children("caption")

			if (oSettings.caption) {
				if (caption.length === 0) {
					caption = $("<caption/>").appendTo($this)
				}

				caption.html(oSettings.caption)
			}

			// Store the caption side, so we can remove the element from the document
			// when creating the element
			if (caption.length) {
				caption[0]._captionSide = caption.css("caption-side")
				oSettings.captionNode = caption[0]
			}

			if (thead.length === 0) {
				thead = $("<thead/>").appendTo($this)
			}
			oSettings.nTHead = thead[0]
			$("tr", thead).addClass(oClasses.thead.row)

			var tbody = $this.children("tbody")
			if (tbody.length === 0) {
				tbody = $("<tbody/>").insertAfter(thead)
			}
			oSettings.nTBody = tbody[0]

			var tfoot = $this.children("tfoot")
			if (tfoot.length === 0) {
				// If we are a scrolling table, and no footer has been given, then we need to create
				// a tfoot element for the caption element to be appended to
				tfoot = $("<tfoot/>").appendTo($this)
			}
			oSettings.nTFoot = tfoot[0]
			$("tr", tfoot).addClass(oClasses.tfoot.row)

			// Copy the data index array
			oSettings.aiDisplay = oSettings.aiDisplayMaster.slice()

			// Initialisation complete - table can be drawn
			oSettings.bInitialised = true

			// Language definitions
			var oLanguage = oSettings.oLanguage
			$.extend(true, oLanguage, oInit.oLanguage)

			if (oLanguage.sUrl) {
				// Get the language definitions from a file
				$.ajax({
					dataType: "json",
					url: oLanguage.sUrl,
					success: function (json) {
						_fnCamelToHungarian(defaults.oLanguage, json)
						$.extend(true, oLanguage, json, oSettings.oInit.oLanguage)

						_fnCallbackFire(oSettings, null, "i18n", [oSettings], true)
						_fnInitialise(oSettings)
					},
					error: function () {
						// Error occurred loading language file
						_fnLog(oSettings, 0, "i18n file loading error", 21)

						// Continue on as best we can
						_fnInitialise(oSettings)
					}
				})
			} else {
				_fnCallbackFire(oSettings, null, "i18n", [oSettings], true)
				_fnInitialise(oSettings)
			}
		})
		_that = null
		return this
	}

	/**
	 * DataTables extensions
	 *
	 * This namespace acts as a collection area for plug-ins that can be used to
	 * extend DataTables capabilities. Indeed many of the build in methods
	 * use this method to provide their own capabilities (sorting methods for
	 * example).
	 *
	 * Note that this namespace is aliased to `jQuery.fn.dataTableExt` for legacy
	 * reasons
	 *
	 *  @namespace
	 */
	DataTable.ext = _ext = {
		/**
		 * Buttons. For use with the Buttons extension for DataTables. This is
		 * defined here so other extensions can define buttons regardless of load
		 * order. It is _not_ used by DataTables core.
		 *
		 *  @type object
		 *  @default {}
		 */
		buttons: {},

		/**
		 * Element class names
		 *
		 *  @type object
		 *  @default {}
		 */
		classes: {},

		/**
		 * DataTables build type (expanded by the download builder)
		 *
		 *  @type string
		 */
		builder: "dt/dt-2.1.7/b-3.1.2/b-colvis-3.1.2/b-html5-3.1.2/cr-2.0.4/fc-5.0.2/fh-4.0.1/sb-1.8.0",

		/**
		 * Error reporting.
		 *
		 * How should DataTables report an error. Can take the value 'alert',
		 * 'throw', 'none' or a function.
		 *
		 *  @type string|function
		 *  @default alert
		 */
		errMode: "alert",

		/**
		 * Legacy so v1 plug-ins don't throw js errors on load
		 */
		feature: [],

		/**
		 * Feature plug-ins.
		 *
		 * This is an object of callbacks which provide the features for DataTables
		 * to be initialised via the `layout` option.
		 */
		features: {},

		/**
		 * Row searching.
		 *
		 * This method of searching is complimentary to the default type based
		 * searching, and a lot more comprehensive as it allows you complete control
		 * over the searching logic. Each element in this array is a function
		 * (parameters described below) that is called for every row in the table,
		 * and your logic decides if it should be included in the searching data set
		 * or not.
		 *
		 * Searching functions have the following input parameters:
		 *
		 * 1. `{object}` DataTables settings object: see
		 *    {@link DataTable.models.oSettings}
		 * 2. `{array|object}` Data for the row to be processed (same as the
		 *    original format that was passed in as the data source, or an array
		 *    from a DOM data source
		 * 3. `{int}` Row index ({@link DataTable.models.oSettings.aoData}), which
		 *    can be useful to retrieve the `TR` element if you need DOM interaction.
		 *
		 * And the following return is expected:
		 *
		 * * {boolean} Include the row in the searched result set (true) or not
		 *   (false)
		 *
		 * Note that as with the main search ability in DataTables, technically this
		 * is "filtering", since it is subtractive. However, for consistency in
		 * naming we call it searching here.
		 *
		 *  @type array
		 *  @default []
		 *
		 *  @example
		 *    // The following example shows custom search being applied to the
		 *    // fourth column (i.e. the data[3] index) based on two input values
		 *    // from the end-user, matching the data in a certain range.
		 *    $.fn.dataTable.ext.search.push(
		 *      function( settings, data, dataIndex ) {
		 *        var min = document.getElementById('min').value * 1;
		 *        var max = document.getElementById('max').value * 1;
		 *        var version = data[3] == "-" ? 0 : data[3]*1;
		 *
		 *        if ( min == "" && max == "" ) {
		 *          return true;
		 *        }
		 *        else if ( min == "" && version < max ) {
		 *          return true;
		 *        }
		 *        else if ( min < version && "" == max ) {
		 *          return true;
		 *        }
		 *        else if ( min < version && version < max ) {
		 *          return true;
		 *        }
		 *        return false;
		 *      }
		 *    );
		 */
		search: [],

		/**
		 * Selector extensions
		 *
		 * The `selector` option can be used to extend the options available for the
		 * selector modifier options (`selector-modifier` object data type) that
		 * each of the three built in selector types offer (row, column and cell +
		 * their plural counterparts). For example the Select extension uses this
		 * mechanism to provide an option to select only rows, columns and cells
		 * that have been marked as selected by the end user (`{selected: true}`),
		 * which can be used in conjunction with the existing built in selector
		 * options.
		 *
		 * Each property is an array to which functions can be pushed. The functions
		 * take three attributes:
		 *
		 * * Settings object for the host table
		 * * Options object (`selector-modifier` object type)
		 * * Array of selected item indexes
		 *
		 * The return is an array of the resulting item indexes after the custom
		 * selector has been applied.
		 *
		 *  @type object
		 */
		selector: {
			cell: [],
			column: [],
			row: []
		},

		/**
		 * Legacy configuration options. Enable and disable legacy options that
		 * are available in DataTables.
		 *
		 *  @type object
		 */
		legacy: {
			/**
			 * Enable / disable DataTables 1.9 compatible server-side processing
			 * requests
			 *
			 *  @type boolean
			 *  @default null
			 */
			ajax: null
		},

		/**
		 * Pagination plug-in methods.
		 *
		 * Each entry in this object is a function and defines which buttons should
		 * be shown by the pagination rendering method that is used for the table:
		 * {@link DataTable.ext.renderer.pageButton}. The renderer addresses how the
		 * buttons are displayed in the document, while the functions here tell it
		 * what buttons to display. This is done by returning an array of button
		 * descriptions (what each button will do).
		 *
		 * Pagination types (the four built in options and any additional plug-in
		 * options defined here) can be used through the `paginationType`
		 * initialisation parameter.
		 *
		 * The functions defined take two parameters:
		 *
		 * 1. `{int} page` The current page index
		 * 2. `{int} pages` The number of pages in the table
		 *
		 * Each function is expected to return an array where each element of the
		 * array can be one of:
		 *
		 * * `first` - Jump to first page when activated
		 * * `last` - Jump to last page when activated
		 * * `previous` - Show previous page when activated
		 * * `next` - Show next page when activated
		 * * `{int}` - Show page of the index given
		 * * `{array}` - A nested array containing the above elements to add a
		 *   containing 'DIV' element (might be useful for styling).
		 *
		 * Note that DataTables v1.9- used this object slightly differently whereby
		 * an object with two functions would be defined for each plug-in. That
		 * ability is still supported by DataTables 1.10+ to provide backwards
		 * compatibility, but this option of use is now decremented and no longer
		 * documented in DataTables 1.10+.
		 *
		 *  @type object
		 *  @default {}
		 *
		 *  @example
		 *    // Show previous, next and current page buttons only
		 *    $.fn.dataTableExt.oPagination.current = function ( page, pages ) {
		 *      return [ 'previous', page, 'next' ];
		 *    };
		 */
		pager: {},

		renderer: {
			pageButton: {},
			header: {}
		},

		/**
		 * Ordering plug-ins - custom data source
		 *
		 * The extension options for ordering of data available here is complimentary
		 * to the default type based ordering that DataTables typically uses. It
		 * allows much greater control over the the data that is being used to
		 * order a column, but is necessarily therefore more complex.
		 *
		 * This type of ordering is useful if you want to do ordering based on data
		 * live from the DOM (for example the contents of an 'input' element) rather
		 * than just the static string that DataTables knows of.
		 *
		 * The way these plug-ins work is that you create an array of the values you
		 * wish to be ordering for the column in question and then return that
		 * array. The data in the array much be in the index order of the rows in
		 * the table (not the currently ordering order!). Which order data gathering
		 * function is run here depends on the `dt-init columns.orderDataType`
		 * parameter that is used for the column (if any).
		 *
		 * The functions defined take two parameters:
		 *
		 * 1. `{object}` DataTables settings object: see
		 *    {@link DataTable.models.oSettings}
		 * 2. `{int}` Target column index
		 *
		 * Each function is expected to return an array:
		 *
		 * * `{array}` Data for the column to be ordering upon
		 *
		 *  @type array
		 *
		 *  @example
		 *    // Ordering using `input` node values
		 *    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
		 *    {
		 *      return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
		 *        return $('input', td).val();
		 *      } );
		 *    }
		 */
		order: {},

		/**
		 * Type based plug-ins.
		 *
		 * Each column in DataTables has a type assigned to it, either by automatic
		 * detection or by direct assignment using the `type` option for the column.
		 * The type of a column will effect how it is ordering and search (plug-ins
		 * can also make use of the column type if required).
		 *
		 * @namespace
		 */
		type: {
			/**
			 * Automatic column class assignment
			 */
			className: {},

			/**
			 * Type detection functions.
			 *
			 * The functions defined in this object are used to automatically detect
			 * a column's type, making initialisation of DataTables super easy, even
			 * when complex data is in the table.
			 *
			 * The functions defined take two parameters:
			 *
			 *  1. `{*}` Data from the column cell to be analysed
			 *  2. `{settings}` DataTables settings object. This can be used to
			 *     perform context specific type detection - for example detection
			 *     based on language settings such as using a comma for a decimal
			 *     place. Generally speaking the options from the settings will not
			 *     be required
			 *
			 * Each function is expected to return:
			 *
			 * * `{string|null}` Data type detected, or null if unknown (and thus
			 *   pass it on to the other type detection functions.
			 *
			 *  @type array
			 *
			 *  @example
			 *    // Currency type detection plug-in:
			 *    $.fn.dataTable.ext.type.detect.push(
			 *      function ( data, settings ) {
			 *        // Check the numeric part
			 *        if ( ! data.substring(1).match(/[0-9]/) ) {
			 *          return null;
			 *        }
			 *
			 *        // Check prefixed by currency
			 *        if ( data.charAt(0) == '$' || data.charAt(0) == '&pound;' ) {
			 *          return 'currency';
			 *        }
			 *        return null;
			 *      }
			 *    );
			 */
			detect: [],

			/**
			 * Automatic renderer assignment
			 */
			render: {},

			/**
			 * Type based search formatting.
			 *
			 * The type based searching functions can be used to pre-format the
			 * data to be search on. For example, it can be used to strip HTML
			 * tags or to de-format telephone numbers for numeric only searching.
			 *
			 * Note that is a search is not defined for a column of a given type,
			 * no search formatting will be performed.
			 *
			 * Pre-processing of searching data plug-ins - When you assign the sType
			 * for a column (or have it automatically detected for you by DataTables
			 * or a type detection plug-in), you will typically be using this for
			 * custom sorting, but it can also be used to provide custom searching
			 * by allowing you to pre-processing the data and returning the data in
			 * the format that should be searched upon. This is done by adding
			 * functions this object with a parameter name which matches the sType
			 * for that target column. This is the corollary of <i>afnSortData</i>
			 * for searching data.
			 *
			 * The functions defined take a single parameter:
			 *
			 *  1. `{*}` Data from the column cell to be prepared for searching
			 *
			 * Each function is expected to return:
			 *
			 * * `{string|null}` Formatted string that will be used for the searching.
			 *
			 *  @type object
			 *  @default {}
			 *
			 *  @example
			 *    $.fn.dataTable.ext.type.search['title-numeric'] = function ( d ) {
			 *      return d.replace(/\n/g," ").replace( /<.*?>/g, "" );
			 *    }
			 */
			search: {},

			/**
			 * Type based ordering.
			 *
			 * The column type tells DataTables what ordering to apply to the table
			 * when a column is sorted upon. The order for each type that is defined,
			 * is defined by the functions available in this object.
			 *
			 * Each ordering option can be described by three properties added to
			 * this object:
			 *
			 * * `{type}-pre` - Pre-formatting function
			 * * `{type}-asc` - Ascending order function
			 * * `{type}-desc` - Descending order function
			 *
			 * All three can be used together, only `{type}-pre` or only
			 * `{type}-asc` and `{type}-desc` together. It is generally recommended
			 * that only `{type}-pre` is used, as this provides the optimal
			 * implementation in terms of speed, although the others are provided
			 * for compatibility with existing Javascript sort functions.
			 *
			 * `{type}-pre`: Functions defined take a single parameter:
			 *
			 *  1. `{*}` Data from the column cell to be prepared for ordering
			 *
			 * And return:
			 *
			 * * `{*}` Data to be sorted upon
			 *
			 * `{type}-asc` and `{type}-desc`: Functions are typical Javascript sort
			 * functions, taking two parameters:
			 *
			 *  1. `{*}` Data to compare to the second parameter
			 *  2. `{*}` Data to compare to the first parameter
			 *
			 * And returning:
			 *
			 * * `{*}` Ordering match: <0 if first parameter should be sorted lower
			 *   than the second parameter, ===0 if the two parameters are equal and
			 *   >0 if the first parameter should be sorted height than the second
			 *   parameter.
			 *
			 *  @type object
			 *  @default {}
			 *
			 *  @example
			 *    // Numeric ordering of formatted numbers with a pre-formatter
			 *    $.extend( $.fn.dataTable.ext.type.order, {
			 *      "string-pre": function(x) {
			 *        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
			 *        return parseFloat( a );
			 *      }
			 *    } );
			 *
			 *  @example
			 *    // Case-sensitive string ordering, with no pre-formatting method
			 *    $.extend( $.fn.dataTable.ext.order, {
			 *      "string-case-asc": function(x,y) {
			 *        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			 *      },
			 *      "string-case-desc": function(x,y) {
			 *        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
			 *      }
			 *    } );
			 */
			order: {}
		},

		/**
		 * Unique DataTables instance counter
		 *
		 * @type int
		 * @private
		 */
		_unique: 0,

		//
		// Depreciated
		// The following properties are retained for backwards compatibility only.
		// The should not be used in new projects and will be removed in a future
		// version
		//

		/**
		 * Version check function.
		 *  @type function
		 *  @depreciated Since 1.10
		 */
		fnVersionCheck: DataTable.fnVersionCheck,

		/**
		 * Index for what 'this' index API functions should use
		 *  @type int
		 *  @deprecated Since v1.10
		 */
		iApiIndex: 0,

		/**
		 * Software version
		 *  @type string
		 *  @deprecated Since v1.10
		 */
		sVersion: DataTable.version
	}

	//
	// Backwards compatibility. Alias to pre 1.10 Hungarian notation counter parts
	//
	$.extend(_ext, {
		afnFiltering: _ext.search,
		aTypes: _ext.type.detect,
		ofnSearch: _ext.type.search,
		oSort: _ext.type.order,
		afnSortData: _ext.order,
		aoFeatures: _ext.feature,
		oStdClasses: _ext.classes,
		oPagination: _ext.pager
	})

	$.extend(DataTable.ext.classes, {
		container: "dt-container",
		empty: {
			row: "dt-empty"
		},
		info: {
			container: "dt-info"
		},
		layout: {
			row: "dt-layout-row",
			cell: "dt-layout-cell",
			tableRow: "dt-layout-table",
			tableCell: "",
			start: "dt-layout-start",
			end: "dt-layout-end",
			full: "dt-layout-full"
		},
		length: {
			container: "dt-length",
			select: "dt-input"
		},
		order: {
			canAsc: "dt-orderable-asc",
			canDesc: "dt-orderable-desc",
			isAsc: "dt-ordering-asc",
			isDesc: "dt-ordering-desc",
			none: "dt-orderable-none",
			position: "sorting_"
		},
		processing: {
			container: "dt-processing"
		},
		scrolling: {
			body: "dt-scroll-body",
			container: "dt-scroll",
			footer: {
				self: "dt-scroll-foot",
				inner: "dt-scroll-footInner"
			},
			header: {
				self: "dt-scroll-head",
				inner: "dt-scroll-headInner"
			}
		},
		search: {
			container: "dt-search",
			input: "dt-input"
		},
		table: "dataTable",
		tbody: {
			cell: "",
			row: ""
		},
		thead: {
			cell: "",
			row: ""
		},
		tfoot: {
			cell: "",
			row: ""
		},
		paging: {
			active: "current",
			button: "dt-paging-button",
			container: "dt-paging",
			disabled: "disabled",
			nav: ""
		}
	})

	/*
	 * It is useful to have variables which are scoped locally so only the
	 * DataTables functions can access them and they don't leak into global space.
	 * At the same time these functions are often useful over multiple files in the
	 * core and API, so we list, or at least document, all variables which are used
	 * by DataTables as private variables here. This also ensures that there is no
	 * clashing of variable names and that they can easily referenced for reuse.
	 */

	// Defined else where
	//  _selector_run
	//  _selector_opts
	//  _selector_row_indexes

	var _ext // DataTable.ext
	var _Api // DataTable.Api
	var _api_register // DataTable.Api.register
	var _api_registerPlural // DataTable.Api.registerPlural

	var _re_dic = {}
	var _re_new_lines = /[\r\n\u2028]/g
	var _re_html = /<([^>]*>)/g
	var _max_str_len = Math.pow(2, 28)

	// This is not strict ISO8601 - Date.parse() is quite lax, although
	// implementations differ between browsers.
	var _re_date = /^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}([T ]{1}\d{1,2}[:.]\d{2}([.:]\d{2})?)?$/

	// Escape regular expression special characters
	var _re_escape_regex = new RegExp("(\\" + ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^", "-"].join("|\\") + ")", "g")

	// https://en.wikipedia.org/wiki/Foreign_exchange_market
	// - \u20BD - Russian ruble.
	// - \u20a9 - South Korean Won
	// - \u20BA - Turkish Lira
	// - \u20B9 - Indian Rupee
	// - R - Brazil (R$) and South Africa
	// - fr - Swiss Franc
	// - kr - Swedish krona, Norwegian krone and Danish krone
	// - \u2009 is thin space and \u202F is narrow no-break space, both used in many
	// - Ƀ - Bitcoin
	// - Ξ - Ethereum
	//   standards as thousands separators.
	var _re_formatted_numeric = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi

	var _empty = function (d) {
		return !d || d === true || d === "-" ? true : false
	}

	var _intVal = function (s) {
		var integer = parseInt(s, 10)
		return !isNaN(integer) && isFinite(s) ? integer : null
	}

	// Convert from a formatted number with characters other than `.` as the
	// decimal place, to a Javascript number
	var _numToDecimal = function (num, decimalPoint) {
		// Cache created regular expressions for speed as this function is called often
		if (!_re_dic[decimalPoint]) {
			_re_dic[decimalPoint] = new RegExp(_fnEscapeRegex(decimalPoint), "g")
		}
		return typeof num === "string" && decimalPoint !== "." ? num.replace(/\./g, "").replace(_re_dic[decimalPoint], ".") : num
	}

	var _isNumber = function (d, decimalPoint, formatted, allowEmpty) {
		var type = typeof d
		var strType = type === "string"

		if (type === "number" || type === "bigint") {
			return true
		}

		// If empty return immediately so there must be a number if it is a
		// formatted string (this stops the string "k", or "kr", etc being detected
		// as a formatted number for currency
		if (allowEmpty && _empty(d)) {
			return true
		}

		if (decimalPoint && strType) {
			d = _numToDecimal(d, decimalPoint)
		}

		if (formatted && strType) {
			d = d.replace(_re_formatted_numeric, "")
		}

		return !isNaN(parseFloat(d)) && isFinite(d)
	}

	// A string without HTML in it can be considered to be HTML still
	var _isHtml = function (d) {
		return _empty(d) || typeof d === "string"
	}

	// Is a string a number surrounded by HTML?
	var _htmlNumeric = function (d, decimalPoint, formatted, allowEmpty) {
		if (allowEmpty && _empty(d)) {
			return true
		}

		// input and select strings mean that this isn't just a number
		if (typeof d === "string" && d.match(/<(input|select)/i)) {
			return null
		}

		var html = _isHtml(d)
		return !html ? null : _isNumber(_stripHtml(d), decimalPoint, formatted, allowEmpty) ? true : null
	}

	var _pluck = function (a, prop, prop2) {
		var out = []
		var i = 0,
			ien = a.length

		// Could have the test in the loop for slightly smaller code, but speed
		// is essential here
		if (prop2 !== undefined) {
			for (; i < ien; i++) {
				if (a[i] && a[i][prop]) {
					out.push(a[i][prop][prop2])
				}
			}
		} else {
			for (; i < ien; i++) {
				if (a[i]) {
					out.push(a[i][prop])
				}
			}
		}

		return out
	}

	// Basically the same as _pluck, but rather than looping over `a` we use `order`
	// as the indexes to pick from `a`
	var _pluck_order = function (a, order, prop, prop2) {
		var out = []
		var i = 0,
			ien = order.length

		// Could have the test in the loop for slightly smaller code, but speed
		// is essential here
		if (prop2 !== undefined) {
			for (; i < ien; i++) {
				if (a[order[i]] && a[order[i]][prop]) {
					out.push(a[order[i]][prop][prop2])
				}
			}
		} else {
			for (; i < ien; i++) {
				if (a[order[i]]) {
					out.push(a[order[i]][prop])
				}
			}
		}

		return out
	}

	var _range = function (len, start) {
		var out = []
		var end

		if (start === undefined) {
			start = 0
			end = len
		} else {
			end = start
			start = len
		}

		for (var i = start; i < end; i++) {
			out.push(i)
		}

		return out
	}

	var _removeEmpty = function (a) {
		var out = []

		for (var i = 0, ien = a.length; i < ien; i++) {
			if (a[i]) {
				// careful - will remove all falsy values!
				out.push(a[i])
			}
		}

		return out
	}

	// Replaceable function in api.util
	var _stripHtml = function (input) {
		if (!input || typeof input !== "string") {
			return input
		}

		// Irrelevant check to workaround CodeQL's false positive on the regex
		if (input.length > _max_str_len) {
			throw new Error("Exceeded max str len")
		}

		var previous

		input = input.replace(_re_html, "") // Complete tags

		// Safety for incomplete script tag - use do / while to ensure that
		// we get all instances
		do {
			previous = input
			input = input.replace(/<script/i, "")
		} while (input !== previous)

		return previous
	}

	// Replaceable function in api.util
	var _escapeHtml = function (d) {
		if (Array.isArray(d)) {
			d = d.join(",")
		}

		return typeof d === "string" ? d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : d
	}

	// Remove diacritics from a string by decomposing it and then removing
	// non-ascii characters
	var _normalize = function (str, both) {
		if (typeof str !== "string") {
			return str
		}

		// It is faster to just run `normalize` than it is to check if
		// we need to with a regex! (Check as it isn't available in old
		// Safari)
		var res = str.normalize ? str.normalize("NFD") : str

		// Equally, here we check if a regex is needed or not
		return res.length !== str.length ? (both === true ? str + " " : "") + res.replace(/[\u0300-\u036f]/g, "") : res
	}

	/**
	 * Determine if all values in the array are unique. This means we can short
	 * cut the _unique method at the cost of a single loop. A sorted array is used
	 * to easily check the values.
	 *
	 * @param  {array} src Source array
	 * @return {boolean} true if all unique, false otherwise
	 * @ignore
	 */
	var _areAllUnique = function (src) {
		if (src.length < 2) {
			return true
		}

		var sorted = src.slice().sort()
		var last = sorted[0]

		for (var i = 1, ien = sorted.length; i < ien; i++) {
			if (sorted[i] === last) {
				return false
			}

			last = sorted[i]
		}

		return true
	}

	/**
	 * Find the unique elements in a source array.
	 *
	 * @param  {array} src Source array
	 * @return {array} Array of unique items
	 * @ignore
	 */
	var _unique = function (src) {
		if (Array.from && Set) {
			return Array.from(new Set(src))
		}

		if (_areAllUnique(src)) {
			return src.slice()
		}

		// A faster unique method is to use object keys to identify used values,
		// but this doesn't work with arrays or objects, which we must also
		// consider. See jsperf.app/compare-array-unique-versions/4 for more
		// information.
		var out = [],
			val,
			i,
			ien = src.length,
			j,
			k = 0

		again: for (i = 0; i < ien; i++) {
			val = src[i]

			for (j = 0; j < k; j++) {
				if (out[j] === val) {
					continue again
				}
			}

			out.push(val)
			k++
		}

		return out
	}

	// Surprisingly this is faster than [].concat.apply
	// https://jsperf.com/flatten-an-array-loop-vs-reduce/2
	var _flatten = function (out, val) {
		if (Array.isArray(val)) {
			for (var i = 0; i < val.length; i++) {
				_flatten(out, val[i])
			}
		} else {
			out.push(val)
		}

		return out
	}

	// Similar to jQuery's addClass, but use classList.add
	function _addClass(el, name) {
		if (name) {
			name.split(" ").forEach(function (n) {
				if (n) {
					// `add` does deduplication, so no need to check `contains`
					el.classList.add(n)
				}
			})
		}
	}

	/**
	 * DataTables utility methods
	 *
	 * This namespace provides helper methods that DataTables uses internally to
	 * create a DataTable, but which are not exclusively used only for DataTables.
	 * These methods can be used by extension authors to save the duplication of
	 * code.
	 *
	 *  @namespace
	 */
	DataTable.util = {
		/**
		 * Return a string with diacritic characters decomposed
		 * @param {*} mixed Function or string to normalize
		 * @param {*} both Return original string and the normalized string
		 * @returns String or undefined
		 */
		diacritics: function (mixed, both) {
			var type = typeof mixed

			if (type !== "function") {
				return _normalize(mixed, both)
			}
			_normalize = mixed
		},

		/**
		 * Debounce a function
		 *
		 * @param {function} fn Function to be called
		 * @param {integer} freq Call frequency in mS
		 * @return {function} Wrapped function
		 */
		debounce: function (fn, timeout) {
			var timer

			return function () {
				var that = this
				var args = arguments

				clearTimeout(timer)

				timer = setTimeout(function () {
					fn.apply(that, args)
				}, timeout || 250)
			}
		},

		/**
		 * Throttle the calls to a function. Arguments and context are maintained
		 * for the throttled function.
		 *
		 * @param {function} fn Function to be called
		 * @param {integer} freq Call frequency in mS
		 * @return {function} Wrapped function
		 */
		throttle: function (fn, freq) {
			var frequency = freq !== undefined ? freq : 200,
				last,
				timer

			return function () {
				var that = this,
					now = +new Date(),
					args = arguments

				if (last && now < last + frequency) {
					clearTimeout(timer)

					timer = setTimeout(function () {
						last = undefined
						fn.apply(that, args)
					}, frequency)
				} else {
					last = now
					fn.apply(that, args)
				}
			}
		},

		/**
		 * Escape a string such that it can be used in a regular expression
		 *
		 *  @param {string} val string to escape
		 *  @returns {string} escaped string
		 */
		escapeRegex: function (val) {
			return val.replace(_re_escape_regex, "\\$1")
		},

		/**
		 * Create a function that will write to a nested object or array
		 * @param {*} source JSON notation string
		 * @returns Write function
		 */
		set: function (source) {
			if ($.isPlainObject(source)) {
				/* Unlike get, only the underscore (global) option is used for for
				 * setting data since we don't know the type here. This is why an object
				 * option is not documented for `mData` (which is read/write), but it is
				 * for `mRender` which is read only.
				 */
				return DataTable.util.set(source._)
			} else if (source === null) {
				// Nothing to do when the data source is null
				return function () {}
			} else if (typeof source === "function") {
				return function (data, val, meta) {
					source(data, "set", val, meta)
				}
			} else if (typeof source === "string" && (source.indexOf(".") !== -1 || source.indexOf("[") !== -1 || source.indexOf("(") !== -1)) {
				// Like the get, we need to get data from a nested object
				var setData = function (data, val, src) {
					var a = _fnSplitObjNotation(src),
						b
					var aLast = a[a.length - 1]
					var arrayNotation, funcNotation, o, innerSrc

					for (var i = 0, iLen = a.length - 1; i < iLen; i++) {
						// Protect against prototype pollution
						if (a[i] === "__proto__" || a[i] === "constructor") {
							throw new Error("Cannot set prototype values")
						}

						// Check if we are dealing with an array notation request
						arrayNotation = a[i].match(__reArray)
						funcNotation = a[i].match(__reFn)

						if (arrayNotation) {
							a[i] = a[i].replace(__reArray, "")
							data[a[i]] = []

							// Get the remainder of the nested object to set so we can recurse
							b = a.slice()
							b.splice(0, i + 1)
							innerSrc = b.join(".")

							// Traverse each entry in the array setting the properties requested
							if (Array.isArray(val)) {
								for (var j = 0, jLen = val.length; j < jLen; j++) {
									o = {}
									setData(o, val[j], innerSrc)
									data[a[i]].push(o)
								}
							} else {
								// We've been asked to save data to an array, but it
								// isn't array data to be saved. Best that can be done
								// is to just save the value.
								data[a[i]] = val
							}

							// The inner call to setData has already traversed through the remainder
							// of the source and has set the data, thus we can exit here
							return
						} else if (funcNotation) {
							// Function call
							a[i] = a[i].replace(__reFn, "")
							data = data[a[i]](val)
						}

						// If the nested object doesn't currently exist - since we are
						// trying to set the value - create it
						if (data[a[i]] === null || data[a[i]] === undefined) {
							data[a[i]] = {}
						}
						data = data[a[i]]
					}

					// Last item in the input - i.e, the actual set
					if (aLast.match(__reFn)) {
						// Function call
						data = data[aLast.replace(__reFn, "")](val)
					} else {
						// If array notation is used, we just want to strip it and use the property name
						// and assign the value. If it isn't used, then we get the result we want anyway
						data[aLast.replace(__reArray, "")] = val
					}
				}

				return function (data, val) {
					// meta is also passed in, but not used
					return setData(data, val, source)
				}
			} else {
				// Array or flat object mapping
				return function (data, val) {
					// meta is also passed in, but not used
					data[source] = val
				}
			}
		},

		/**
		 * Create a function that will read nested objects from arrays, based on JSON notation
		 * @param {*} source JSON notation string
		 * @returns Value read
		 */
		get: function (source) {
			if ($.isPlainObject(source)) {
				// Build an object of get functions, and wrap them in a single call
				var o = {}
				$.each(source, function (key, val) {
					if (val) {
						o[key] = DataTable.util.get(val)
					}
				})

				return function (data, type, row, meta) {
					var t = o[type] || o._
					return t !== undefined ? t(data, type, row, meta) : data
				}
			} else if (source === null) {
				// Give an empty string for rendering / sorting etc
				return function (data) {
					// type, row and meta also passed, but not used
					return data
				}
			} else if (typeof source === "function") {
				return function (data, type, row, meta) {
					return source(data, type, row, meta)
				}
			} else if (typeof source === "string" && (source.indexOf(".") !== -1 || source.indexOf("[") !== -1 || source.indexOf("(") !== -1)) {
				/* If there is a . in the source string then the data source is in a
				 * nested object so we loop over the data for each level to get the next
				 * level down. On each loop we test for undefined, and if found immediately
				 * return. This allows entire objects to be missing and sDefaultContent to
				 * be used if defined, rather than throwing an error
				 */
				var fetchData = function (data, type, src) {
					var arrayNotation, funcNotation, out, innerSrc

					if (src !== "") {
						var a = _fnSplitObjNotation(src)

						for (var i = 0, iLen = a.length; i < iLen; i++) {
							// Check if we are dealing with special notation
							arrayNotation = a[i].match(__reArray)
							funcNotation = a[i].match(__reFn)

							if (arrayNotation) {
								// Array notation
								a[i] = a[i].replace(__reArray, "")

								// Condition allows simply [] to be passed in
								if (a[i] !== "") {
									data = data[a[i]]
								}
								out = []

								// Get the remainder of the nested object to get
								a.splice(0, i + 1)
								innerSrc = a.join(".")

								// Traverse each entry in the array getting the properties requested
								if (Array.isArray(data)) {
									for (var j = 0, jLen = data.length; j < jLen; j++) {
										out.push(fetchData(data[j], type, innerSrc))
									}
								}

								// If a string is given in between the array notation indicators, that
								// is used to join the strings together, otherwise an array is returned
								var join = arrayNotation[0].substring(1, arrayNotation[0].length - 1)
								data = join === "" ? out : out.join(join)

								// The inner call to fetchData has already traversed through the remainder
								// of the source requested, so we exit from the loop
								break
							} else if (funcNotation) {
								// Function call
								a[i] = a[i].replace(__reFn, "")
								data = data[a[i]]()
								continue
							}

							if (data === null || data[a[i]] === null) {
								return null
							} else if (data === undefined || data[a[i]] === undefined) {
								return undefined
							}

							data = data[a[i]]
						}
					}

					return data
				}

				return function (data, type) {
					// row and meta also passed, but not used
					return fetchData(data, type, source)
				}
			} else {
				// Array or flat object mapping
				return function (data) {
					// row and meta also passed, but not used
					return data[source]
				}
			}
		},

		stripHtml: function (mixed) {
			var type = typeof mixed

			if (type === "function") {
				_stripHtml = mixed
				return
			} else if (type === "string") {
				return _stripHtml(mixed)
			}
			return mixed
		},

		escapeHtml: function (mixed) {
			var type = typeof mixed

			if (type === "function") {
				_escapeHtml = mixed
				return
			} else if (type === "string" || Array.isArray(mixed)) {
				return _escapeHtml(mixed)
			}
			return mixed
		},

		unique: _unique
	}

	/**
	 * Create a mapping object that allows camel case parameters to be looked up
	 * for their Hungarian counterparts. The mapping is stored in a private
	 * parameter called `_hungarianMap` which can be accessed on the source object.
	 *  @param {object} o
	 *  @memberof DataTable#oApi
	 */
	function _fnHungarianMap(o) {
		var hungarian = "a aa ai ao as b fn i m o s ",
			match,
			newKey,
			map = {}

		$.each(o, function (key) {
			match = key.match(/^([^A-Z]+?)([A-Z])/)

			if (match && hungarian.indexOf(match[1] + " ") !== -1) {
				newKey = key.replace(match[0], match[2].toLowerCase())
				map[newKey] = key

				if (match[1] === "o") {
					_fnHungarianMap(o[key])
				}
			}
		})

		o._hungarianMap = map
	}

	/**
	 * Convert from camel case parameters to Hungarian, based on a Hungarian map
	 * created by _fnHungarianMap.
	 *  @param {object} src The model object which holds all parameters that can be
	 *    mapped.
	 *  @param {object} user The object to convert from camel case to Hungarian.
	 *  @param {boolean} force When set to `true`, properties which already have a
	 *    Hungarian value in the `user` object will be overwritten. Otherwise they
	 *    won't be.
	 *  @memberof DataTable#oApi
	 */
	function _fnCamelToHungarian(src, user, force) {
		if (!src._hungarianMap) {
			_fnHungarianMap(src)
		}

		var hungarianKey

		$.each(user, function (key) {
			hungarianKey = src._hungarianMap[key]

			if (hungarianKey !== undefined && (force || user[hungarianKey] === undefined)) {
				// For objects, we need to buzz down into the object to copy parameters
				if (hungarianKey.charAt(0) === "o") {
					// Copy the camelCase options over to the hungarian
					if (!user[hungarianKey]) {
						user[hungarianKey] = {}
					}
					$.extend(true, user[hungarianKey], user[key])

					_fnCamelToHungarian(src[hungarianKey], user[hungarianKey], force)
				} else {
					user[hungarianKey] = user[key]
				}
			}
		})
	}

	/**
	 * Map one parameter onto another
	 *  @param {object} o Object to map
	 *  @param {*} knew The new parameter name
	 *  @param {*} old The old parameter name
	 */
	var _fnCompatMap = function (o, knew, old) {
		if (o[knew] !== undefined) {
			o[old] = o[knew]
		}
	}

	/**
	 * Provide backwards compatibility for the main DT options. Note that the new
	 * options are mapped onto the old parameters, so this is an external interface
	 * change only.
	 *  @param {object} init Object to map
	 */
	function _fnCompatOpts(init) {
		_fnCompatMap(init, "ordering", "bSort")
		_fnCompatMap(init, "orderMulti", "bSortMulti")
		_fnCompatMap(init, "orderClasses", "bSortClasses")
		_fnCompatMap(init, "orderCellsTop", "bSortCellsTop")
		_fnCompatMap(init, "order", "aaSorting")
		_fnCompatMap(init, "orderFixed", "aaSortingFixed")
		_fnCompatMap(init, "paging", "bPaginate")
		_fnCompatMap(init, "pagingType", "sPaginationType")
		_fnCompatMap(init, "pageLength", "iDisplayLength")
		_fnCompatMap(init, "searching", "bFilter")

		// Boolean initialisation of x-scrolling
		if (typeof init.sScrollX === "boolean") {
			init.sScrollX = init.sScrollX ? "100%" : ""
		}
		if (typeof init.scrollX === "boolean") {
			init.scrollX = init.scrollX ? "100%" : ""
		}

		// Column search objects are in an array, so it needs to be converted
		// element by element
		var searchCols = init.aoSearchCols

		if (searchCols) {
			for (var i = 0, ien = searchCols.length; i < ien; i++) {
				if (searchCols[i]) {
					_fnCamelToHungarian(DataTable.models.oSearch, searchCols[i])
				}
			}
		}

		// Enable search delay if server-side processing is enabled
		if (init.serverSide && !init.searchDelay) {
			init.searchDelay = 400
		}
	}

	/**
	 * Provide backwards compatibility for column options. Note that the new options
	 * are mapped onto the old parameters, so this is an external interface change
	 * only.
	 *  @param {object} init Object to map
	 */
	function _fnCompatCols(init) {
		_fnCompatMap(init, "orderable", "bSortable")
		_fnCompatMap(init, "orderData", "aDataSort")
		_fnCompatMap(init, "orderSequence", "asSorting")
		_fnCompatMap(init, "orderDataType", "sortDataType")

		// orderData can be given as an integer
		var dataSort = init.aDataSort
		if (typeof dataSort === "number" && !Array.isArray(dataSort)) {
			init.aDataSort = [dataSort]
		}
	}

	/**
	 * Browser feature detection for capabilities, quirks
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnBrowserDetect(settings) {
		// We don't need to do this every time DataTables is constructed, the values
		// calculated are specific to the browser and OS configuration which we
		// don't expect to change between initialisations
		if (!DataTable.__browser) {
			var browser = {}
			DataTable.__browser = browser

			// Scrolling feature / quirks detection
			var n = $("<div/>")
				.css({
					position: "fixed",
					top: 0,
					left: -1 * window.pageXOffset, // allow for scrolling
					height: 1,
					width: 1,
					overflow: "hidden"
				})
				.append(
					$("<div/>")
						.css({
							position: "absolute",
							top: 1,
							left: 1,
							width: 100,
							overflow: "scroll"
						})
						.append(
							$("<div/>").css({
								width: "100%",
								height: 10
							})
						)
				)
				.appendTo("body")

			var outer = n.children()
			var inner = outer.children()

			// Get scrollbar width
			browser.barWidth = outer[0].offsetWidth - outer[0].clientWidth

			// In rtl text layout, some browsers (most, but not all) will place the
			// scrollbar on the left, rather than the right.
			browser.bScrollbarLeft = Math.round(inner.offset().left) !== 1

			n.remove()
		}

		$.extend(settings.oBrowser, DataTable.__browser)
		settings.oScroll.iBarWidth = DataTable.__browser.barWidth
	}

	/**
	 * Add a column to the list used for the table with default values
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAddColumn(oSettings) {
		// Add column to aoColumns array
		var oDefaults = DataTable.defaults.column
		var iCol = oSettings.aoColumns.length
		var oCol = $.extend({}, DataTable.models.oColumn, oDefaults, {
			aDataSort: oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
			mData: oDefaults.mData ? oDefaults.mData : iCol,
			idx: iCol,
			searchFixed: {},
			colEl: $("<col>").attr("data-dt-column", iCol)
		})
		oSettings.aoColumns.push(oCol)

		// Add search object for column specific search. Note that the `searchCols[ iCol ]`
		// passed into extend can be undefined. This allows the user to give a default
		// with only some of the parameters defined, and also not give a default
		var searchCols = oSettings.aoPreSearchCols
		searchCols[iCol] = $.extend({}, DataTable.models.oSearch, searchCols[iCol])
	}

	/**
	 * Apply options for a column
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iCol column index to consider
	 *  @param {object} oOptions object with sType, bVisible and bSearchable etc
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnOptions(oSettings, iCol, oOptions) {
		var oCol = oSettings.aoColumns[iCol]

		/* User specified column options */
		if (oOptions !== undefined && oOptions !== null) {
			// Backwards compatibility
			_fnCompatCols(oOptions)

			// Map camel case parameters to their Hungarian counterparts
			_fnCamelToHungarian(DataTable.defaults.column, oOptions, true)

			/* Backwards compatibility for mDataProp */
			if (oOptions.mDataProp !== undefined && !oOptions.mData) {
				oOptions.mData = oOptions.mDataProp
			}

			if (oOptions.sType) {
				oCol._sManualType = oOptions.sType
			}

			// `class` is a reserved word in Javascript, so we need to provide
			// the ability to use a valid name for the camel case input
			if (oOptions.className && !oOptions.sClass) {
				oOptions.sClass = oOptions.className
			}

			var origClass = oCol.sClass

			$.extend(oCol, oOptions)
			_fnMap(oCol, oOptions, "sWidth", "sWidthOrig")

			// Merge class from previously defined classes with this one, rather than just
			// overwriting it in the extend above
			if (origClass !== oCol.sClass) {
				oCol.sClass = origClass + " " + oCol.sClass
			}

			/* iDataSort to be applied (backwards compatibility), but aDataSort will take
			 * priority if defined
			 */
			if (oOptions.iDataSort !== undefined) {
				oCol.aDataSort = [oOptions.iDataSort]
			}
			_fnMap(oCol, oOptions, "aDataSort")
		}

		/* Cache the data get and set functions for speed */
		var mDataSrc = oCol.mData
		var mData = _fnGetObjectDataFn(mDataSrc)

		// The `render` option can be given as an array to access the helper rendering methods.
		// The first element is the rendering method to use, the rest are the parameters to pass
		if (oCol.mRender && Array.isArray(oCol.mRender)) {
			var copy = oCol.mRender.slice()
			var name = copy.shift()

			oCol.mRender = DataTable.render[name].apply(window, copy)
		}

		oCol._render = oCol.mRender ? _fnGetObjectDataFn(oCol.mRender) : null

		var attrTest = function (src) {
			return typeof src === "string" && src.indexOf("@") !== -1
		}
		oCol._bAttrSrc = $.isPlainObject(mDataSrc) && (attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter))
		oCol._setter = null

		oCol.fnGetData = function (rowData, type, meta) {
			var innerData = mData(rowData, type, undefined, meta)

			return oCol._render && type ? oCol._render(innerData, type, rowData, meta) : innerData
		}
		oCol.fnSetData = function (rowData, val, meta) {
			return _fnSetObjectDataFn(mDataSrc)(rowData, val, meta)
		}

		// Indicate if DataTables should read DOM data as an object or array
		// Used in _fnGetRowElements
		if (typeof mDataSrc !== "number" && !oCol._isArrayHost) {
			oSettings._rowReadObject = true
		}

		/* Feature sorting overrides column specific when off */
		if (!oSettings.oFeatures.bSort) {
			oCol.bSortable = false
		}
	}

	/**
	 * Adjust the table column widths for new data. Note: you would probably want to
	 * do a redraw after calling this function!
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAdjustColumnSizing(settings) {
		_fnCalculateColumnWidths(settings)
		_fnColumnSizes(settings)

		var scroll = settings.oScroll
		if (scroll.sY !== "" || scroll.sX !== "") {
			_fnScrollDraw(settings)
		}

		_fnCallbackFire(settings, null, "column-sizing", [settings])
	}

	/**
	 * Apply column sizes
	 *
	 * @param {*} settings DataTables settings object
	 */
	function _fnColumnSizes(settings) {
		var cols = settings.aoColumns

		for (var i = 0; i < cols.length; i++) {
			var width = _fnColumnsSumWidth(settings, [i], false, false)

			cols[i].colEl.css("width", width)
		}
	}

	/**
	 * Convert the index of a visible column to the index in the data array (take account
	 * of hidden columns)
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iMatch Visible column index to lookup
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnVisibleToColumnIndex(oSettings, iMatch) {
		var aiVis = _fnGetColumns(oSettings, "bVisible")

		return typeof aiVis[iMatch] === "number" ? aiVis[iMatch] : null
	}

	/**
	 * Convert the index of an index in the data array and convert it to the visible
	 *   column index (take account of hidden columns)
	 *  @param {int} iMatch Column index to lookup
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnIndexToVisible(oSettings, iMatch) {
		var aiVis = _fnGetColumns(oSettings, "bVisible")
		var iPos = aiVis.indexOf(iMatch)

		return iPos !== -1 ? iPos : null
	}

	/**
	 * Get the number of visible columns
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the number of visible columns
	 *  @memberof DataTable#oApi
	 */
	function _fnVisbleColumns(settings) {
		var layout = settings.aoHeader
		var columns = settings.aoColumns
		var vis = 0

		if (layout.length) {
			for (var i = 0, ien = layout[0].length; i < ien; i++) {
				if (columns[i].bVisible && $(layout[0][i].cell).css("display") !== "none") {
					vis++
				}
			}
		}

		return vis
	}

	/**
	 * Get an array of column indexes that match a given property
	 *  @param {object} oSettings dataTables settings object
	 *  @param {string} sParam Parameter in aoColumns to look for - typically
	 *    bVisible or bSearchable
	 *  @returns {array} Array of indexes with matched properties
	 *  @memberof DataTable#oApi
	 */
	function _fnGetColumns(oSettings, sParam) {
		var a = []

		oSettings.aoColumns.map(function (val, i) {
			if (val[sParam]) {
				a.push(i)
			}
		})

		return a
	}

	/**
	 * Allow the result from a type detection function to be `true` while
	 * translating that into a string. Old type detection functions will
	 * return the type name if it passes. An obect store would be better,
	 * but not backwards compatible.
	 *
	 * @param {*} typeDetect Object or function for type detection
	 * @param {*} res Result from the type detection function
	 * @returns Type name or false
	 */
	function _typeResult(typeDetect, res) {
		return res === true ? typeDetect._name : res
	}

	/**
	 * Calculate the 'type' of a column
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnTypes(settings) {
		var columns = settings.aoColumns
		var data = settings.aoData
		var types = DataTable.ext.type.detect
		var i, ien, j, jen, k, ken
		var col, detectedType, cache

		// For each column, spin over the data type detection functions, seeing if one matches
		for (i = 0, ien = columns.length; i < ien; i++) {
			col = columns[i]
			cache = []

			if (!col.sType && col._sManualType) {
				col.sType = col._sManualType
			} else if (!col.sType) {
				// With SSP type detection can be unreliable and error prone, so we provide a way
				// to turn it off.
				if (!settings.typeDetect) {
					return
				}

				for (j = 0, jen = types.length; j < jen; j++) {
					var typeDetect = types[j]

					// There can be either one, or three type detection functions
					var oneOf = typeDetect.oneOf
					var allOf = typeDetect.allOf || typeDetect
					var init = typeDetect.init
					var one = false

					detectedType = null

					// Fast detect based on column assignment
					if (init) {
						detectedType = _typeResult(typeDetect, init(settings, col, i))

						if (detectedType) {
							col.sType = detectedType
							break
						}
					}

					for (k = 0, ken = data.length; k < ken; k++) {
						if (!data[k]) {
							continue
						}

						// Use a cache array so we only need to get the type data
						// from the formatter once (when using multiple detectors)
						if (cache[k] === undefined) {
							cache[k] = _fnGetCellData(settings, k, i, "type")
						}

						// Only one data point in the column needs to match this function
						if (oneOf && !one) {
							one = _typeResult(typeDetect, oneOf(cache[k], settings))
						}

						// All data points need to match this function
						detectedType = _typeResult(typeDetect, allOf(cache[k], settings))

						// If null, then this type can't apply to this column, so
						// rather than testing all cells, break out. There is an
						// exception for the last type which is `html`. We need to
						// scan all rows since it is possible to mix string and HTML
						// types
						if (!detectedType && j !== types.length - 3) {
							break
						}

						// Only a single match is needed for html type since it is
						// bottom of the pile and very similar to string - but it
						// must not be empty
						if (detectedType === "html" && !_empty(cache[k])) {
							break
						}
					}

					// Type is valid for all data points in the column - use this
					// type
					if ((oneOf && one && detectedType) || (!oneOf && detectedType)) {
						col.sType = detectedType
						break
					}
				}

				// Fall back - if no type was detected, always use string
				if (!col.sType) {
					col.sType = "string"
				}
			}

			// Set class names for header / footer for auto type classes
			var autoClass = _ext.type.className[col.sType]

			if (autoClass) {
				_columnAutoClass(settings.aoHeader, i, autoClass)
				_columnAutoClass(settings.aoFooter, i, autoClass)
			}

			var renderer = _ext.type.render[col.sType]

			// This can only happen once! There is no way to remove
			// a renderer. After the first time the renderer has
			// already been set so createTr will run the renderer itself.
			if (renderer && !col._render) {
				col._render = DataTable.util.get(renderer)

				_columnAutoRender(settings, i)
			}
		}
	}

	/**
	 * Apply an auto detected renderer to data which doesn't yet have
	 * a renderer
	 */
	function _columnAutoRender(settings, colIdx) {
		var data = settings.aoData

		for (var i = 0; i < data.length; i++) {
			if (data[i].nTr) {
				// We have to update the display here since there is no
				// invalidation check for the data
				var display = _fnGetCellData(settings, i, colIdx, "display")

				data[i].displayData[colIdx] = display
				_fnWriteCell(data[i].anCells[colIdx], display)

				// No need to update sort / filter data since it has
				// been invalidated and will be re-read with the
				// renderer now applied
			}
		}
	}

	/**
	 * Apply a class name to a column's header cells
	 */
	function _columnAutoClass(container, colIdx, className) {
		container.forEach(function (row) {
			if (row[colIdx] && row[colIdx].unique) {
				_addClass(row[colIdx].cell, className)
			}
		})
	}

	/**
	 * Take the column definitions and static columns arrays and calculate how
	 * they relate to column indexes. The callback function will then apply the
	 * definition found for a column to a suitable configuration object.
	 *  @param {object} oSettings dataTables settings object
	 *  @param {array} aoColDefs The aoColumnDefs array that is to be applied
	 *  @param {array} aoCols The aoColumns array that defines columns individually
	 *  @param {array} headerLayout Layout for header as it was loaded
	 *  @param {function} fn Callback function - takes two parameters, the calculated
	 *    column index and the definition for that column.
	 *  @memberof DataTable#oApi
	 */
	function _fnApplyColumnDefs(oSettings, aoColDefs, aoCols, headerLayout, fn) {
		var i, iLen, j, jLen, k, kLen, def
		var columns = oSettings.aoColumns

		if (aoCols) {
			for (i = 0, iLen = aoCols.length; i < iLen; i++) {
				if (aoCols[i] && aoCols[i].name) {
					columns[i].sName = aoCols[i].name
				}
			}
		}

		// Column definitions with aTargets
		if (aoColDefs) {
			/* Loop over the definitions array - loop in reverse so first instance has priority */
			for (i = aoColDefs.length - 1; i >= 0; i--) {
				def = aoColDefs[i]

				/* Each definition can target multiple columns, as it is an array */
				var aTargets = def.target !== undefined ? def.target : def.targets !== undefined ? def.targets : def.aTargets

				if (!Array.isArray(aTargets)) {
					aTargets = [aTargets]
				}

				for (j = 0, jLen = aTargets.length; j < jLen; j++) {
					var target = aTargets[j]

					if (typeof target === "number" && target >= 0) {
						/* Add columns that we don't yet know about */
						while (columns.length <= target) {
							_fnAddColumn(oSettings)
						}

						/* Integer, basic index */
						fn(target, def)
					} else if (typeof target === "number" && target < 0) {
						/* Negative integer, right to left column counting */
						fn(columns.length + target, def)
					} else if (typeof target === "string") {
						for (k = 0, kLen = columns.length; k < kLen; k++) {
							if (target === "_all") {
								// Apply to all columns
								fn(k, def)
							} else if (target.indexOf(":name") !== -1) {
								// Column selector
								if (columns[k].sName === target.replace(":name", "")) {
									fn(k, def)
								}
							} else {
								// Cell selector
								headerLayout.forEach(function (row) {
									if (row[k]) {
										var cell = $(row[k].cell)

										// Legacy support. Note that it means that we don't support
										// an element name selector only, since they are treated as
										// class names for 1.x compat.
										if (target.match(/^[a-z][\w-]*$/i)) {
											target = "." + target
										}

										if (cell.is(target)) {
											fn(k, def)
										}
									}
								})
							}
						}
					}
				}
			}
		}

		// Statically defined columns array
		if (aoCols) {
			for (i = 0, iLen = aoCols.length; i < iLen; i++) {
				fn(i, aoCols[i])
			}
		}
	}

	/**
	 * Get the width for a given set of columns
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} targets Columns - comma separated string or array of numbers
	 * @param {*} original Use the original width (true) or calculated (false)
	 * @param {*} incVisible Include visible columns (true) or not (false)
	 * @returns Combined CSS value
	 */
	function _fnColumnsSumWidth(settings, targets, original, incVisible) {
		if (!Array.isArray(targets)) {
			targets = _fnColumnsFromHeader(targets)
		}

		var sum = 0
		var unit
		var columns = settings.aoColumns

		for (var i = 0, ien = targets.length; i < ien; i++) {
			var column = columns[targets[i]]
			var definedWidth = original ? column.sWidthOrig : column.sWidth

			if (!incVisible && column.bVisible === false) {
				continue
			}

			if (definedWidth === null || definedWidth === undefined) {
				return null // can't determine a defined width - browser defined
			} else if (typeof definedWidth === "number") {
				unit = "px"
				sum += definedWidth
			} else {
				var matched = definedWidth.match(/([\d\.]+)([^\d]*)/)

				if (matched) {
					sum += matched[1] * 1
					unit = matched.length === 3 ? matched[2] : "px"
				}
			}
		}

		return sum + unit
	}

	function _fnColumnsFromHeader(cell) {
		var attr = $(cell).closest("[data-dt-column]").attr("data-dt-column")

		if (!attr) {
			return []
		}

		return attr.split(",").map(function (val) {
			return val * 1
		})
	}
	/**
	 * Add a data array to the table, creating DOM node etc. This is the parallel to
	 * _fnGatherData, but for adding rows from a Javascript source, rather than a
	 * DOM source.
	 *  @param {object} settings dataTables settings object
	 *  @param {array} data data array to be added
	 *  @param {node} [tr] TR element to add to the table - optional. If not given,
	 *    DataTables will create a row automatically
	 *  @param {array} [tds] Array of TD|TH elements for the row - must be given
	 *    if nTr is.
	 *  @returns {int} >=0 if successful (index of new aoData entry), -1 if failed
	 *  @memberof DataTable#oApi
	 */
	function _fnAddData(settings, dataIn, tr, tds) {
		/* Create the object for storing information about this new row */
		var rowIdx = settings.aoData.length
		var rowModel = $.extend(true, {}, DataTable.models.oRow, {
			src: tr ? "dom" : "data",
			idx: rowIdx
		})

		rowModel._aData = dataIn
		settings.aoData.push(rowModel)

		var columns = settings.aoColumns

		for (var i = 0, iLen = columns.length; i < iLen; i++) {
			// Invalidate the column types as the new data needs to be revalidated
			columns[i].sType = null
		}

		/* Add to the display array */
		settings.aiDisplayMaster.push(rowIdx)

		var id = settings.rowIdFn(dataIn)
		if (id !== undefined) {
			settings.aIds[id] = rowModel
		}

		/* Create the DOM information, or register it if already present */
		if (tr || !settings.oFeatures.bDeferRender) {
			_fnCreateTr(settings, rowIdx, tr, tds)
		}

		return rowIdx
	}

	/**
	 * Add one or more TR elements to the table. Generally we'd expect to
	 * use this for reading data from a DOM sourced table, but it could be
	 * used for an TR element. Note that if a TR is given, it is used (i.e.
	 * it is not cloned).
	 *  @param {object} settings dataTables settings object
	 *  @param {array|node|jQuery} trs The TR element(s) to add to the table
	 *  @returns {array} Array of indexes for the added rows
	 *  @memberof DataTable#oApi
	 */
	function _fnAddTr(settings, trs) {
		var row

		// Allow an individual node to be passed in
		if (!(trs instanceof $)) {
			trs = $(trs)
		}

		return trs.map(function (i, el) {
			row = _fnGetRowElements(settings, el)
			return _fnAddData(settings, row.data, el, row.cells)
		})
	}

	/**
	 * Get the data for a given cell from the internal cache, taking into account data mapping
	 *  @param {object} settings dataTables settings object
	 *  @param {int} rowIdx aoData row id
	 *  @param {int} colIdx Column index
	 *  @param {string} type data get type ('display', 'type' 'filter|search' 'sort|order')
	 *  @returns {*} Cell data
	 *  @memberof DataTable#oApi
	 */
	function _fnGetCellData(settings, rowIdx, colIdx, type) {
		if (type === "search") {
			type = "filter"
		} else if (type === "order") {
			type = "sort"
		}

		var row = settings.aoData[rowIdx]

		if (!row) {
			return undefined
		}

		var draw = settings.iDraw
		var col = settings.aoColumns[colIdx]
		var rowData = row._aData
		var defaultContent = col.sDefaultContent
		var cellData = col.fnGetData(rowData, type, {
			settings: settings,
			row: rowIdx,
			col: colIdx
		})

		// Allow for a node being returned for non-display types
		if (type !== "display" && cellData && typeof cellData === "object" && cellData.nodeName) {
			cellData = cellData.innerHTML
		}

		if (cellData === undefined) {
			if (settings.iDrawError != draw && defaultContent === null) {
				_fnLog(settings, 0, "Requested unknown parameter " + (typeof col.mData == "function" ? "{function}" : "'" + col.mData + "'") + " for row " + rowIdx + ", column " + colIdx, 4)
				settings.iDrawError = draw
			}
			return defaultContent
		}

		// When the data source is null and a specific data type is requested (i.e.
		// not the original data), we can use default column data
		if ((cellData === rowData || cellData === null) && defaultContent !== null && type !== undefined) {
			cellData = defaultContent
		} else if (typeof cellData === "function") {
			// If the data source is a function, then we run it and use the return,
			// executing in the scope of the data object (for instances)
			return cellData.call(rowData)
		}

		if (cellData === null && type === "display") {
			return ""
		}

		if (type === "filter") {
			var fomatters = DataTable.ext.type.search

			if (fomatters[col.sType]) {
				cellData = fomatters[col.sType](cellData)
			}
		}

		return cellData
	}

	/**
	 * Set the value for a specific cell, into the internal data cache
	 *  @param {object} settings dataTables settings object
	 *  @param {int} rowIdx aoData row id
	 *  @param {int} colIdx Column index
	 *  @param {*} val Value to set
	 *  @memberof DataTable#oApi
	 */
	function _fnSetCellData(settings, rowIdx, colIdx, val) {
		var col = settings.aoColumns[colIdx]
		var rowData = settings.aoData[rowIdx]._aData

		col.fnSetData(rowData, val, {
			settings: settings,
			row: rowIdx,
			col: colIdx
		})
	}

	/**
	 * Write a value to a cell
	 * @param {*} td Cell
	 * @param {*} val Value
	 */
	function _fnWriteCell(td, val) {
		if (val && typeof val === "object" && val.nodeName) {
			$(td).empty().append(val)
		} else {
			td.innerHTML = val
		}
	}

	// Private variable that is used to match action syntax in the data property object
	var __reArray = /\[.*?\]$/
	var __reFn = /\(\)$/

	/**
	 * Split string on periods, taking into account escaped periods
	 * @param  {string} str String to split
	 * @return {array} Split string
	 */
	function _fnSplitObjNotation(str) {
		var parts = str.match(/(\\.|[^.])+/g) || [""]

		return parts.map(function (s) {
			return s.replace(/\\\./g, ".")
		})
	}

	/**
	 * Return a function that can be used to get data from a source object, taking
	 * into account the ability to use nested objects as a source
	 *  @param {string|int|function} mSource The data source for the object
	 *  @returns {function} Data get function
	 *  @memberof DataTable#oApi
	 */
	var _fnGetObjectDataFn = DataTable.util.get

	/**
	 * Return a function that can be used to set data from a source object, taking
	 * into account the ability to use nested objects as a source
	 *  @param {string|int|function} mSource The data source for the object
	 *  @returns {function} Data set function
	 *  @memberof DataTable#oApi
	 */
	var _fnSetObjectDataFn = DataTable.util.set

	/**
	 * Return an array with the full table data
	 *  @param {object} oSettings dataTables settings object
	 *  @returns array {array} aData Master data array
	 *  @memberof DataTable#oApi
	 */
	function _fnGetDataMaster(settings) {
		return _pluck(settings.aoData, "_aData")
	}

	/**
	 * Nuke the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnClearTable(settings) {
		settings.aoData.length = 0
		settings.aiDisplayMaster.length = 0
		settings.aiDisplay.length = 0
		settings.aIds = {}
	}

	/**
	 * Mark cached data as invalid such that a re-read of the data will occur when
	 * the cached data is next requested. Also update from the data source object.
	 *
	 * @param {object} settings DataTables settings object
	 * @param {int}    rowIdx   Row index to invalidate
	 * @param {string} [src]    Source to invalidate from: undefined, 'auto', 'dom'
	 *     or 'data'
	 * @param {int}    [colIdx] Column index to invalidate. If undefined the whole
	 *     row will be invalidated
	 * @memberof DataTable#oApi
	 *
	 * @todo For the modularisation of v1.11 this will need to become a callback, so
	 *   the sort and filter methods can subscribe to it. That will required
	 *   initialisation options for sorting, which is why it is not already baked in
	 */
	function _fnInvalidate(settings, rowIdx, src, colIdx) {
		var row = settings.aoData[rowIdx]
		var i, ien

		// Remove the cached data for the row
		row._aSortData = null
		row._aFilterData = null
		row.displayData = null

		// Are we reading last data from DOM or the data object?
		if (src === "dom" || ((!src || src === "auto") && row.src === "dom")) {
			// Read the data from the DOM
			row._aData = _fnGetRowElements(settings, row, colIdx, colIdx === undefined ? undefined : row._aData).data
		} else {
			// Reading from data object, update the DOM
			var cells = row.anCells
			var display = _fnGetRowDisplay(settings, rowIdx)

			if (cells) {
				if (colIdx !== undefined) {
					_fnWriteCell(cells[colIdx], display[colIdx])
				} else {
					for (i = 0, ien = cells.length; i < ien; i++) {
						_fnWriteCell(cells[i], display[i])
					}
				}
			}
		}

		// Column specific invalidation
		var cols = settings.aoColumns
		if (colIdx !== undefined) {
			// Type - the data might have changed
			cols[colIdx].sType = null

			// Max length string. Its a fairly cheep recalculation, so not worth
			// something more complicated
			cols[colIdx].maxLenString = null
		} else {
			for (i = 0, ien = cols.length; i < ien; i++) {
				cols[i].sType = null
				cols[i].maxLenString = null
			}

			// Update DataTables special `DT_*` attributes for the row
			_fnRowAttributes(settings, row)
		}
	}

	/**
	 * Build a data source object from an HTML row, reading the contents of the
	 * cells that are in the row.
	 *
	 * @param {object} settings DataTables settings object
	 * @param {node|object} TR element from which to read data or existing row
	 *   object from which to re-read the data from the cells
	 * @param {int} [colIdx] Optional column index
	 * @param {array|object} [d] Data source object. If `colIdx` is given then this
	 *   parameter should also be given and will be used to write the data into.
	 *   Only the column in question will be written
	 * @returns {object} Object with two parameters: `data` the data read, in
	 *   document order, and `cells` and array of nodes (they can be useful to the
	 *   caller, so rather than needing a second traversal to get them, just return
	 *   them from here).
	 * @memberof DataTable#oApi
	 */
	function _fnGetRowElements(settings, row, colIdx, d) {
		var tds = [],
			td = row.firstChild,
			name,
			col,
			i = 0,
			contents,
			columns = settings.aoColumns,
			objectRead = settings._rowReadObject

		// Allow the data object to be passed in, or construct
		d = d !== undefined ? d : objectRead ? {} : []

		var attr = function (str, td) {
			if (typeof str === "string") {
				var idx = str.indexOf("@")

				if (idx !== -1) {
					var attr = str.substring(idx + 1)
					var setter = _fnSetObjectDataFn(str)
					setter(d, td.getAttribute(attr))
				}
			}
		}

		// Read data from a cell and store into the data object
		var cellProcess = function (cell) {
			if (colIdx === undefined || colIdx === i) {
				col = columns[i]
				contents = cell.innerHTML.trim()

				if (col && col._bAttrSrc) {
					var setter = _fnSetObjectDataFn(col.mData._)
					setter(d, contents)

					attr(col.mData.sort, cell)
					attr(col.mData.type, cell)
					attr(col.mData.filter, cell)
				} else {
					// Depending on the `data` option for the columns the data can
					// be read to either an object or an array.
					if (objectRead) {
						if (!col._setter) {
							// Cache the setter function
							col._setter = _fnSetObjectDataFn(col.mData)
						}
						col._setter(d, contents)
					} else {
						d[i] = contents
					}
				}
			}

			i++
		}

		if (td) {
			// `tr` element was passed in
			while (td) {
				name = td.nodeName.toUpperCase()

				if (name == "TD" || name == "TH") {
					cellProcess(td)
					tds.push(td)
				}

				td = td.nextSibling
			}
		} else {
			// Existing row object passed in
			tds = row.anCells

			for (var j = 0, jen = tds.length; j < jen; j++) {
				cellProcess(tds[j])
			}
		}

		// Read the ID from the DOM if present
		var rowNode = row.firstChild ? row : row.nTr

		if (rowNode) {
			var id = rowNode.getAttribute("id")

			if (id) {
				_fnSetObjectDataFn(settings.rowId)(d, id)
			}
		}

		return {
			data: d,
			cells: tds
		}
	}

	/**
	 * Render and cache a row's display data for the columns, if required
	 * @returns
	 */
	function _fnGetRowDisplay(settings, rowIdx) {
		var rowModal = settings.aoData[rowIdx]
		var columns = settings.aoColumns

		if (!rowModal.displayData) {
			// Need to render and cache
			rowModal.displayData = []

			for (var colIdx = 0, len = columns.length; colIdx < len; colIdx++) {
				rowModal.displayData.push(_fnGetCellData(settings, rowIdx, colIdx, "display"))
			}
		}

		return rowModal.displayData
	}

	/**
	 * Create a new TR element (and it's TD children) for a row
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iRow Row to consider
	 *  @param {node} [nTrIn] TR element to add to the table - optional. If not given,
	 *    DataTables will create a row automatically
	 *  @param {array} [anTds] Array of TD|TH elements for the row - must be given
	 *    if nTr is.
	 *  @memberof DataTable#oApi
	 */
	function _fnCreateTr(oSettings, iRow, nTrIn, anTds) {
		var row = oSettings.aoData[iRow],
			rowData = row._aData,
			cells = [],
			nTr,
			nTd,
			oCol,
			i,
			iLen,
			create,
			trClass = oSettings.oClasses.tbody.row

		if (row.nTr === null) {
			nTr = nTrIn || document.createElement("tr")

			row.nTr = nTr
			row.anCells = cells

			_addClass(nTr, trClass)

			/* Use a private property on the node to allow reserve mapping from the node
			 * to the aoData array for fast look up
			 */
			nTr._DT_RowIndex = iRow

			/* Special parameters can be given by the data source to be used on the row */
			_fnRowAttributes(oSettings, row)

			/* Process each column */
			for (i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++) {
				oCol = oSettings.aoColumns[i]
				create = nTrIn && anTds[i] ? false : true

				nTd = create ? document.createElement(oCol.sCellType) : anTds[i]

				if (!nTd) {
					_fnLog(oSettings, 0, "Incorrect column count", 18)
				}

				nTd._DT_CellIndex = {
					row: iRow,
					column: i
				}

				cells.push(nTd)

				var display = _fnGetRowDisplay(oSettings, iRow)

				// Need to create the HTML if new, or if a rendering function is defined
				if (create || ((oCol.mRender || oCol.mData !== i) && (!$.isPlainObject(oCol.mData) || oCol.mData._ !== i + ".display"))) {
					_fnWriteCell(nTd, display[i])
				}

				// column class
				_addClass(nTd, oCol.sClass)

				// Visibility - add or remove as required
				if (oCol.bVisible && create) {
					nTr.appendChild(nTd)
				} else if (!oCol.bVisible && !create) {
					nTd.parentNode.removeChild(nTd)
				}

				if (oCol.fnCreatedCell) {
					oCol.fnCreatedCell.call(oSettings.oInstance, nTd, _fnGetCellData(oSettings, iRow, i), rowData, iRow, i)
				}
			}

			_fnCallbackFire(oSettings, "aoRowCreatedCallback", "row-created", [nTr, rowData, iRow, cells])
		} else {
			_addClass(row.nTr, trClass)
		}
	}

	/**
	 * Add attributes to a row based on the special `DT_*` parameters in a data
	 * source object.
	 *  @param {object} settings DataTables settings object
	 *  @param {object} DataTables row object for the row to be modified
	 *  @memberof DataTable#oApi
	 */
	function _fnRowAttributes(settings, row) {
		var tr = row.nTr
		var data = row._aData

		if (tr) {
			var id = settings.rowIdFn(data)

			if (id) {
				tr.id = id
			}

			if (data.DT_RowClass) {
				// Remove any classes added by DT_RowClass before
				var a = data.DT_RowClass.split(" ")
				row.__rowc = row.__rowc ? _unique(row.__rowc.concat(a)) : a

				$(tr).removeClass(row.__rowc.join(" ")).addClass(data.DT_RowClass)
			}

			if (data.DT_RowAttr) {
				$(tr).attr(data.DT_RowAttr)
			}

			if (data.DT_RowData) {
				$(tr).data(data.DT_RowData)
			}
		}
	}

	/**
	 * Create the HTML header for the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnBuildHead(settings, side) {
		var classes = settings.oClasses
		var columns = settings.aoColumns
		var i, ien, row
		var target = side === "header" ? settings.nTHead : settings.nTFoot
		var titleProp = side === "header" ? "sTitle" : side

		// Footer might be defined
		if (!target) {
			return
		}

		// If no cells yet and we have content for them, then create
		if (side === "header" || _pluck(settings.aoColumns, titleProp).join("")) {
			row = $("tr", target)

			// Add a row if needed
			if (!row.length) {
				row = $("<tr/>").appendTo(target)
			}

			// Add the number of cells needed to make up to the number of columns
			if (row.length === 1) {
				var cells = $("td, th", row)

				for (i = cells.length, ien = columns.length; i < ien; i++) {
					$("<th/>")
						.html(columns[i][titleProp] || "")
						.appendTo(row)
				}
			}
		}

		var detected = _fnDetectHeader(settings, target, true)

		if (side === "header") {
			settings.aoHeader = detected
		} else {
			settings.aoFooter = detected
		}

		// ARIA role for the rows
		$(target).children("tr").attr("role", "row")

		// Every cell needs to be passed through the renderer
		$(target)
			.children("tr")
			.children("th, td")
			.each(function () {
				_fnRenderer(settings, side)(settings, $(this), classes)
			})
	}

	/**
	 * Build a layout structure for a header or footer
	 *
	 * @param {*} settings DataTables settings
	 * @param {*} source Source layout array
	 * @param {*} incColumns What columns should be included
	 * @returns Layout array
	 */
	function _fnHeaderLayout(settings, source, incColumns) {
		var row, column, cell
		var local = []
		var structure = []
		var columns = settings.aoColumns
		var columnCount = columns.length
		var rowspan, colspan

		if (!source) {
			return
		}

		// Default is to work on only visible columns
		if (!incColumns) {
			incColumns = _range(columnCount).filter(function (idx) {
				return columns[idx].bVisible
			})
		}

		// Make a copy of the master layout array, but with only the columns we want
		for (row = 0; row < source.length; row++) {
			// Remove any columns we haven't selected
			local[row] = source[row].slice().filter(function (cell, i) {
				return incColumns.includes(i)
			})

			// Prep the structure array - it needs an element for each row
			structure.push([])
		}

		for (row = 0; row < local.length; row++) {
			for (column = 0; column < local[row].length; column++) {
				rowspan = 1
				colspan = 1

				// Check to see if there is already a cell (row/colspan) covering our target
				// insert point. If there is, then there is nothing to do.
				if (structure[row][column] === undefined) {
					cell = local[row][column].cell

					// Expand for rowspan
					while (local[row + rowspan] !== undefined && local[row][column].cell == local[row + rowspan][column].cell) {
						structure[row + rowspan][column] = null
						rowspan++
					}

					// And for colspan
					while (local[row][column + colspan] !== undefined && local[row][column].cell == local[row][column + colspan].cell) {
						// Which also needs to go over rows
						for (var k = 0; k < rowspan; k++) {
							structure[row + k][column + colspan] = null
						}

						colspan++
					}

					var titleSpan = $("span.dt-column-title", cell)

					structure[row][column] = {
						cell: cell,
						colspan: colspan,
						rowspan: rowspan,
						title: titleSpan.length ? titleSpan.html() : $(cell).html()
					}
				}
			}
		}

		return structure
	}

	/**
	 * Draw the header (or footer) element based on the column visibility states.
	 *
	 *  @param object oSettings dataTables settings object
	 *  @param array aoSource Layout array from _fnDetectHeader
	 *  @memberof DataTable#oApi
	 */
	function _fnDrawHead(settings, source) {
		var layout = _fnHeaderLayout(settings, source)
		var tr, n

		for (var row = 0; row < source.length; row++) {
			tr = source[row].row

			// All cells are going to be replaced, so empty out the row
			// Can't use $().empty() as that kills event handlers
			if (tr) {
				while ((n = tr.firstChild)) {
					tr.removeChild(n)
				}
			}

			for (var column = 0; column < layout[row].length; column++) {
				var point = layout[row][column]

				if (point) {
					$(point.cell).appendTo(tr).attr("rowspan", point.rowspan).attr("colspan", point.colspan)
				}
			}
		}
	}

	/**
	 * Insert the required TR nodes into the table for display
	 *  @param {object} oSettings dataTables settings object
	 *  @param ajaxComplete true after ajax call to complete rendering
	 *  @memberof DataTable#oApi
	 */
	function _fnDraw(oSettings, ajaxComplete) {
		// Allow for state saving and a custom start position
		_fnStart(oSettings)

		/* Provide a pre-callback function which can be used to cancel the draw is false is returned */
		var aPreDraw = _fnCallbackFire(oSettings, "aoPreDrawCallback", "preDraw", [oSettings])
		if (aPreDraw.indexOf(false) !== -1) {
			_fnProcessingDisplay(oSettings, false)
			return
		}

		var anRows = []
		var iRowCount = 0
		var bServerSide = _fnDataSource(oSettings) == "ssp"
		var aiDisplay = oSettings.aiDisplay
		var iDisplayStart = oSettings._iDisplayStart
		var iDisplayEnd = oSettings.fnDisplayEnd()
		var columns = oSettings.aoColumns
		var body = $(oSettings.nTBody)

		oSettings.bDrawing = true

		/* Server-side processing draw intercept */
		if (oSettings.deferLoading) {
			oSettings.deferLoading = false
			oSettings.iDraw++
			_fnProcessingDisplay(oSettings, false)
		} else if (!bServerSide) {
			oSettings.iDraw++
		} else if (!oSettings.bDestroying && !ajaxComplete) {
			// Show loading message for server-side processing
			if (oSettings.iDraw === 0) {
				body.empty().append(_emptyRow(oSettings))
			}

			_fnAjaxUpdate(oSettings)
			return
		}

		if (aiDisplay.length !== 0) {
			var iStart = bServerSide ? 0 : iDisplayStart
			var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd

			for (var j = iStart; j < iEnd; j++) {
				var iDataIndex = aiDisplay[j]
				var aoData = oSettings.aoData[iDataIndex]
				if (aoData.nTr === null) {
					_fnCreateTr(oSettings, iDataIndex)
				}

				var nRow = aoData.nTr

				// Add various classes as needed
				for (var i = 0; i < columns.length; i++) {
					var col = columns[i]
					var td = aoData.anCells[i]

					_addClass(td, _ext.type.className[col.sType]) // auto class
					_addClass(td, oSettings.oClasses.tbody.cell) // all cells
				}

				// Row callback functions - might want to manipulate the row
				// iRowCount and j are not currently documented. Are they at all
				// useful?
				_fnCallbackFire(oSettings, "aoRowCallback", null, [nRow, aoData._aData, iRowCount, j, iDataIndex])

				anRows.push(nRow)
				iRowCount++
			}
		} else {
			anRows[0] = _emptyRow(oSettings)
		}

		/* Header and footer callbacks */
		_fnCallbackFire(oSettings, "aoHeaderCallback", "header", [$(oSettings.nTHead).children("tr")[0], _fnGetDataMaster(oSettings), iDisplayStart, iDisplayEnd, aiDisplay])

		_fnCallbackFire(oSettings, "aoFooterCallback", "footer", [$(oSettings.nTFoot).children("tr")[0], _fnGetDataMaster(oSettings), iDisplayStart, iDisplayEnd, aiDisplay])

		// replaceChildren is faster, but only became widespread in 2020,
		// so a fall back in jQuery is provided for older browsers.
		if (body[0].replaceChildren) {
			body[0].replaceChildren.apply(body[0], anRows)
		} else {
			body.children().detach()
			body.append($(anRows))
		}

		// Empty table needs a specific class
		$(oSettings.nTableWrapper).toggleClass("dt-empty-footer", $("tr", oSettings.nTFoot).length === 0)

		/* Call all required callback functions for the end of a draw */
		_fnCallbackFire(oSettings, "aoDrawCallback", "draw", [oSettings], true)

		/* Draw is complete, sorting and filtering must be as well */
		oSettings.bSorted = false
		oSettings.bFiltered = false
		oSettings.bDrawing = false
	}

	/**
	 * Redraw the table - taking account of the various features which are enabled
	 *  @param {object} oSettings dataTables settings object
	 *  @param {boolean} [holdPosition] Keep the current paging position. By default
	 *    the paging is reset to the first page
	 *  @memberof DataTable#oApi
	 */
	function _fnReDraw(settings, holdPosition, recompute) {
		var features = settings.oFeatures,
			sort = features.bSort,
			filter = features.bFilter

		if (recompute === undefined || recompute === true) {
			// Resolve any column types that are unknown due to addition or invalidation
			_fnColumnTypes(settings)

			if (sort) {
				_fnSort(settings)
			}

			if (filter) {
				_fnFilterComplete(settings, settings.oPreviousSearch)
			} else {
				// No filtering, so we want to just use the display master
				settings.aiDisplay = settings.aiDisplayMaster.slice()
			}
		}

		if (holdPosition !== true) {
			settings._iDisplayStart = 0
		}

		// Let any modules know about the draw hold position state (used by
		// scrolling internally)
		settings._drawHold = holdPosition

		_fnDraw(settings)

		settings._drawHold = false
	}

	/*
	 * Table is empty - create a row with an empty message in it
	 */
	function _emptyRow(settings) {
		var oLang = settings.oLanguage
		var zero = oLang.sZeroRecords
		var dataSrc = _fnDataSource(settings)

		if ((settings.iDraw < 1 && dataSrc === "ssp") || (settings.iDraw <= 1 && dataSrc === "ajax")) {
			zero = oLang.sLoadingRecords
		} else if (oLang.sEmptyTable && settings.fnRecordsTotal() === 0) {
			zero = oLang.sEmptyTable
		}

		return $("<tr/>").append(
			$("<td />", {
				colSpan: _fnVisbleColumns(settings),
				class: settings.oClasses.empty.row
			}).html(zero)
		)[0]
	}

	/**
	 * Expand the layout items into an object for the rendering function
	 */
	function _layoutItems(row, align, items) {
		if (Array.isArray(items)) {
			for (var i = 0; i < items.length; i++) {
				_layoutItems(row, align, items[i])
			}

			return
		}

		var rowCell = row[align]

		// If it is an object, then there can be multiple features contained in it
		if ($.isPlainObject(items)) {
			// A feature plugin cannot be named "features" due to this check
			if (items.features) {
				if (items.rowId) {
					row.id = items.rowId
				}
				if (items.rowClass) {
					row.className = items.rowClass
				}

				rowCell.id = items.id
				rowCell.className = items.className

				_layoutItems(row, align, items.features)
			} else {
				Object.keys(items).map(function (key) {
					rowCell.contents.push({
						feature: key,
						opts: items[key]
					})
				})
			}
		} else {
			rowCell.contents.push(items)
		}
	}

	/**
	 * Find, or create a layout row
	 */
	function _layoutGetRow(rows, rowNum, align) {
		var row

		// Find existing rows
		for (var i = 0; i < rows.length; i++) {
			row = rows[i]

			if (row.rowNum === rowNum) {
				// full is on its own, but start and end share a row
				if ((align === "full" && row.full) || ((align === "start" || align === "end") && (row.start || row.end))) {
					if (!row[align]) {
						row[align] = {
							contents: []
						}
					}

					return row
				}
			}
		}

		// If we get this far, then there was no match, create a new row
		row = {
			rowNum: rowNum
		}

		row[align] = {
			contents: []
		}

		rows.push(row)

		return row
	}

	/**
	 * Convert a `layout` object given by a user to the object structure needed
	 * for the renderer. This is done twice, once for above and once for below
	 * the table. Ordering must also be considered.
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} layout Layout object to convert
	 * @param {string} side `top` or `bottom`
	 * @returns Converted array structure - one item for each row.
	 */
	function _layoutArray(settings, layout, side) {
		var rows = []

		// Split out into an array
		$.each(layout, function (pos, items) {
			if (items === null) {
				return
			}

			var parts = pos.match(/^([a-z]+)([0-9]*)([A-Za-z]*)$/)
			var rowNum = parts[2] ? parts[2] * 1 : 0
			var align = parts[3] ? parts[3].toLowerCase() : "full"

			// Filter out the side we aren't interested in
			if (parts[1] !== side) {
				return
			}

			// Get or create the row we should attach to
			var row = _layoutGetRow(rows, rowNum, align)

			_layoutItems(row, align, items)
		})

		// Order by item identifier
		rows.sort(function (a, b) {
			var order1 = a.rowNum
			var order2 = b.rowNum

			// If both in the same row, then the row with `full` comes first
			if (order1 === order2) {
				var ret = a.full && !b.full ? -1 : 1

				return side === "bottom" ? ret * -1 : ret
			}

			return order2 - order1
		})

		// Invert for below the table
		if (side === "bottom") {
			rows.reverse()
		}

		for (var row = 0; row < rows.length; row++) {
			delete rows[row].rowNum

			_layoutResolve(settings, rows[row])
		}

		return rows
	}

	/**
	 * Convert the contents of a row's layout object to nodes that can be inserted
	 * into the document by a renderer. Execute functions, look up plug-ins, etc.
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} row Layout object for this row
	 */
	function _layoutResolve(settings, row) {
		var getFeature = function (feature, opts) {
			if (!_ext.features[feature]) {
				_fnLog(settings, 0, "Unknown feature: " + feature)
			}

			return _ext.features[feature].apply(this, [settings, opts])
		}

		var resolve = function (item) {
			if (!row[item]) {
				return
			}

			var line = row[item].contents

			for (var i = 0, ien = line.length; i < ien; i++) {
				if (!line[i]) {
					continue
				} else if (typeof line[i] === "string") {
					line[i] = getFeature(line[i], null)
				} else if ($.isPlainObject(line[i])) {
					// If it's an object, it just has feature and opts properties from
					// the transform in _layoutArray
					line[i] = getFeature(line[i].feature, line[i].opts)
				} else if (typeof line[i].node === "function") {
					line[i] = line[i].node(settings)
				} else if (typeof line[i] === "function") {
					var inst = line[i](settings)

					line[i] = typeof inst.node === "function" ? inst.node() : inst
				}
			}
		}

		resolve("start")
		resolve("end")
		resolve("full")
	}

	/**
	 * Add the options to the page HTML for the table
	 *  @param {object} settings DataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAddOptionsHtml(settings) {
		var classes = settings.oClasses
		var table = $(settings.nTable)

		// Wrapper div around everything DataTables controls
		var insert = $("<div/>")
			.attr({
				id: settings.sTableId + "_wrapper",
				class: classes.container
			})
			.insertBefore(table)

		settings.nTableWrapper = insert[0]

		if (settings.sDom) {
			// Legacy
			_fnLayoutDom(settings, settings.sDom, insert)
		} else {
			var top = _layoutArray(settings, settings.layout, "top")
			var bottom = _layoutArray(settings, settings.layout, "bottom")
			var renderer = _fnRenderer(settings, "layout")

			// Everything above - the renderer will actually insert the contents into the document
			top.forEach(function (item) {
				renderer(settings, insert, item)
			})

			// The table - always the center of attention
			renderer(settings, insert, {
				full: {
					table: true,
					contents: [_fnFeatureHtmlTable(settings)]
				}
			})

			// Everything below
			bottom.forEach(function (item) {
				renderer(settings, insert, item)
			})
		}

		// Processing floats on top, so it isn't an inserted feature
		_processingHtml(settings)
	}

	/**
	 * Draw the table with the legacy DOM property
	 * @param {*} settings DT settings object
	 * @param {*} dom DOM string
	 * @param {*} insert Insert point
	 */
	function _fnLayoutDom(settings, dom, insert) {
		var parts = dom.match(/(".*?")|('.*?')|./g)
		var featureNode, option, newNode, next, attr

		for (var i = 0; i < parts.length; i++) {
			featureNode = null
			option = parts[i]

			if (option == "<") {
				// New container div
				newNode = $("<div/>")

				// Check to see if we should append an id and/or a class name to the container
				next = parts[i + 1]

				if (next[0] == "'" || next[0] == '"') {
					attr = next.replace(/['"]/g, "")

					var id = "",
						className

					/* The attribute can be in the format of "#id.class", "#id" or "class" This logic
					 * breaks the string into parts and applies them as needed
					 */
					if (attr.indexOf(".") != -1) {
						var split = attr.split(".")

						id = split[0]
						className = split[1]
					} else if (attr[0] == "#") {
						id = attr
					} else {
						className = attr
					}

					newNode.attr("id", id.substring(1)).addClass(className)

					i++ // Move along the position array
				}

				insert.append(newNode)
				insert = newNode
			} else if (option == ">") {
				// End container div
				insert = insert.parent()
			} else if (option == "t") {
				// Table
				featureNode = _fnFeatureHtmlTable(settings)
			} else {
				DataTable.ext.feature.forEach(function (feature) {
					if (option == feature.cFeature) {
						featureNode = feature.fnInit(settings)
					}
				})
			}

			// Add to the display
			if (featureNode) {
				insert.append(featureNode)
			}
		}
	}

	/**
	 * Use the DOM source to create up an array of header cells. The idea here is to
	 * create a layout grid (array) of rows x columns, which contains a reference
	 * to the cell that that point in the grid (regardless of col/rowspan), such that
	 * any column / row could be removed and the new grid constructed
	 *  @param {node} thead The header/footer element for the table
	 *  @returns {array} Calculated layout array
	 *  @memberof DataTable#oApi
	 */
	function _fnDetectHeader(settings, thead, write) {
		var columns = settings.aoColumns
		var rows = $(thead).children("tr")
		var row, cell
		var i, k, l, iLen, shifted, column, colspan, rowspan
		var isHeader = thead && thead.nodeName.toLowerCase() === "thead"
		var layout = []
		var unique
		var shift = function (a, i, j) {
			var k = a[i]
			while (k[j]) {
				j++
			}
			return j
		}

		// We know how many rows there are in the layout - so prep it
		for (i = 0, iLen = rows.length; i < iLen; i++) {
			layout.push([])
		}

		for (i = 0, iLen = rows.length; i < iLen; i++) {
			row = rows[i]
			column = 0

			// For every cell in the row..
			cell = row.firstChild
			while (cell) {
				if (cell.nodeName.toUpperCase() == "TD" || cell.nodeName.toUpperCase() == "TH") {
					var cols = []

					// Get the col and rowspan attributes from the DOM and sanitise them
					colspan = cell.getAttribute("colspan") * 1
					rowspan = cell.getAttribute("rowspan") * 1
					colspan = !colspan || colspan === 0 || colspan === 1 ? 1 : colspan
					rowspan = !rowspan || rowspan === 0 || rowspan === 1 ? 1 : rowspan

					// There might be colspan cells already in this row, so shift our target
					// accordingly
					shifted = shift(layout, i, column)

					// Cache calculation for unique columns
					unique = colspan === 1 ? true : false

					// Perform header setup
					if (write) {
						if (unique) {
							// Allow column options to be set from HTML attributes
							_fnColumnOptions(settings, shifted, $(cell).data())

							// Get the width for the column. This can be defined from the
							// width attribute, style attribute or `columns.width` option
							var columnDef = columns[shifted]
							var width = cell.getAttribute("width") || null
							var t = cell.style.width.match(/width:\s*(\d+[pxem%]+)/)
							if (t) {
								width = t[1]
							}

							columnDef.sWidthOrig = columnDef.sWidth || width

							if (isHeader) {
								// Column title handling - can be user set, or read from the DOM
								// This happens before the render, so the original is still in place
								if (columnDef.sTitle !== null && !columnDef.autoTitle) {
									cell.innerHTML = columnDef.sTitle
								}

								if (!columnDef.sTitle && unique) {
									columnDef.sTitle = _stripHtml(cell.innerHTML)
									columnDef.autoTitle = true
								}
							} else {
								// Footer specific operations
								if (columnDef.footer) {
									cell.innerHTML = columnDef.footer
								}
							}

							// Fall back to the aria-label attribute on the table header if no ariaTitle is
							// provided.
							if (!columnDef.ariaTitle) {
								columnDef.ariaTitle = $(cell).attr("aria-label") || columnDef.sTitle
							}

							// Column specific class names
							if (columnDef.className) {
								$(cell).addClass(columnDef.className)
							}
						}

						// Wrap the column title so we can write to it in future
						if ($("span.dt-column-title", cell).length === 0) {
							$("<span>").addClass("dt-column-title").append(cell.childNodes).appendTo(cell)
						}

						if (isHeader && $("span.dt-column-order", cell).length === 0) {
							$("<span>").addClass("dt-column-order").appendTo(cell)
						}
					}

					// If there is col / rowspan, copy the information into the layout grid
					for (l = 0; l < colspan; l++) {
						for (k = 0; k < rowspan; k++) {
							layout[i + k][shifted + l] = {
								cell: cell,
								unique: unique
							}

							layout[i + k].row = row
						}

						cols.push(shifted + l)
					}

					// Assign an attribute so spanning cells can still be identified
					// as belonging to a column
					cell.setAttribute("data-dt-column", _unique(cols).join(","))
				}

				cell = cell.nextSibling
			}
		}

		return layout
	}

	/**
	 * Set the start position for draw
	 *  @param {object} oSettings dataTables settings object
	 */
	function _fnStart(oSettings) {
		var bServerSide = _fnDataSource(oSettings) == "ssp"
		var iInitDisplayStart = oSettings.iInitDisplayStart

		// Check and see if we have an initial draw position from state saving
		if (iInitDisplayStart !== undefined && iInitDisplayStart !== -1) {
			oSettings._iDisplayStart = bServerSide ? iInitDisplayStart : iInitDisplayStart >= oSettings.fnRecordsDisplay() ? 0 : iInitDisplayStart

			oSettings.iInitDisplayStart = -1
		}
	}

	/**
	 * Create an Ajax call based on the table's settings, taking into account that
	 * parameters can have multiple forms, and backwards compatibility.
	 *
	 * @param {object} oSettings dataTables settings object
	 * @param {array} data Data to send to the server, required by
	 *     DataTables - may be augmented by developer callbacks
	 * @param {function} fn Callback function to run when data is obtained
	 */
	function _fnBuildAjax(oSettings, data, fn) {
		var ajaxData
		var ajax = oSettings.ajax
		var instance = oSettings.oInstance
		var callback = function (json) {
			var status = oSettings.jqXHR ? oSettings.jqXHR.status : null

			if (json === null || (typeof status === "number" && status == 204)) {
				json = {}
				_fnAjaxDataSrc(oSettings, json, [])
			}

			var error = json.error || json.sError
			if (error) {
				_fnLog(oSettings, 0, error)
			}

			// Microsoft often wrap JSON as a string in another JSON object
			// Let's handle that automatically
			if (json.d && typeof json.d === "string") {
				try {
					json = JSON.parse(json.d)
				} catch (e) {
					// noop
				}
			}

			oSettings.json = json

			_fnCallbackFire(oSettings, null, "xhr", [oSettings, json, oSettings.jqXHR], true)
			fn(json)
		}

		if ($.isPlainObject(ajax) && ajax.data) {
			ajaxData = ajax.data

			var newData =
				typeof ajaxData === "function"
					? ajaxData(data, oSettings) // fn can manipulate data or return
					: ajaxData // an object object or array to merge

			// If the function returned something, use that alone
			data = typeof ajaxData === "function" && newData ? newData : $.extend(true, data, newData)

			// Remove the data property as we've resolved it already and don't want
			// jQuery to do it again (it is restored at the end of the function)
			delete ajax.data
		}

		var baseAjax = {
			url: typeof ajax === "string" ? ajax : "",
			data: data,
			success: callback,
			dataType: "json",
			cache: false,
			type: oSettings.sServerMethod,
			error: function (xhr, error) {
				var ret = _fnCallbackFire(oSettings, null, "xhr", [oSettings, null, oSettings.jqXHR], true)

				if (ret.indexOf(true) === -1) {
					if (error == "parsererror") {
						_fnLog(oSettings, 0, "Invalid JSON response", 1)
					} else if (xhr.readyState === 4) {
						_fnLog(oSettings, 0, "Ajax error", 7)
					}
				}

				_fnProcessingDisplay(oSettings, false)
			}
		}

		// If `ajax` option is an object, extend and override our default base
		if ($.isPlainObject(ajax)) {
			$.extend(baseAjax, ajax)
		}

		// Store the data submitted for the API
		oSettings.oAjaxData = data

		// Allow plug-ins and external processes to modify the data
		_fnCallbackFire(oSettings, null, "preXhr", [oSettings, data, baseAjax], true)

		if (typeof ajax === "function") {
			// Is a function - let the caller define what needs to be done
			oSettings.jqXHR = ajax.call(instance, data, callback, oSettings)
		} else if (ajax.url === "") {
			// No url, so don't load any data. Just apply an empty data array
			// to the object for the callback.
			var empty = {}

			DataTable.util.set(ajax.dataSrc)(empty, [])
			callback(empty)
		} else {
			// Object to extend the base settings
			oSettings.jqXHR = $.ajax(baseAjax)
		}

		// Restore for next time around
		if (ajaxData) {
			ajax.data = ajaxData
		}
	}

	/**
	 * Update the table using an Ajax call
	 *  @param {object} settings dataTables settings object
	 *  @returns {boolean} Block the table drawing or not
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxUpdate(settings) {
		settings.iDraw++
		_fnProcessingDisplay(settings, true)

		_fnBuildAjax(settings, _fnAjaxParameters(settings), function (json) {
			_fnAjaxUpdateDraw(settings, json)
		})
	}

	/**
	 * Build up the parameters in an object needed for a server-side processing
	 * request.
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {bool} block the table drawing or not
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxParameters(settings) {
		var columns = settings.aoColumns,
			features = settings.oFeatures,
			preSearch = settings.oPreviousSearch,
			preColSearch = settings.aoPreSearchCols,
			colData = function (idx, prop) {
				return typeof columns[idx][prop] === "function" ? "function" : columns[idx][prop]
			}

		return {
			draw: settings.iDraw,
			columns: columns.map(function (column, i) {
				return {
					data: colData(i, "mData"),
					name: column.sName,
					searchable: column.bSearchable,
					orderable: column.bSortable,
					search: {
						value: preColSearch[i].search,
						regex: preColSearch[i].regex,
						fixed: Object.keys(column.searchFixed).map(function (name) {
							return {
								name: name,
								term: column.searchFixed[name].toString()
							}
						})
					}
				}
			}),
			order: _fnSortFlatten(settings).map(function (val) {
				return {
					column: val.col,
					dir: val.dir,
					name: colData(val.col, "sName")
				}
			}),
			start: settings._iDisplayStart,
			length: features.bPaginate ? settings._iDisplayLength : -1,
			search: {
				value: preSearch.search,
				regex: preSearch.regex,
				fixed: Object.keys(settings.searchFixed).map(function (name) {
					return {
						name: name,
						term: settings.searchFixed[name].toString()
					}
				})
			}
		}
	}

	/**
	 * Data the data from the server (nuking the old) and redraw the table
	 *  @param {object} oSettings dataTables settings object
	 *  @param {object} json json data return from the server.
	 *  @param {string} json.sEcho Tracking flag for DataTables to match requests
	 *  @param {int} json.iTotalRecords Number of records in the data set, not accounting for filtering
	 *  @param {int} json.iTotalDisplayRecords Number of records in the data set, accounting for filtering
	 *  @param {array} json.aaData The data to display on this page
	 *  @param {string} [json.sColumns] Column ordering (sName, comma separated)
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxUpdateDraw(settings, json) {
		var data = _fnAjaxDataSrc(settings, json)
		var draw = _fnAjaxDataSrcParam(settings, "draw", json)
		var recordsTotal = _fnAjaxDataSrcParam(settings, "recordsTotal", json)
		var recordsFiltered = _fnAjaxDataSrcParam(settings, "recordsFiltered", json)

		if (draw !== undefined) {
			// Protect against out of sequence returns
			if (draw * 1 < settings.iDraw) {
				return
			}
			settings.iDraw = draw * 1
		}

		// No data in returned object, so rather than an array, we show an empty table
		if (!data) {
			data = []
		}

		_fnClearTable(settings)
		settings._iRecordsTotal = parseInt(recordsTotal, 10)
		settings._iRecordsDisplay = parseInt(recordsFiltered, 10)

		for (var i = 0, ien = data.length; i < ien; i++) {
			_fnAddData(settings, data[i])
		}
		settings.aiDisplay = settings.aiDisplayMaster.slice()

		_fnColumnTypes(settings)
		_fnDraw(settings, true)
		_fnInitComplete(settings)
		_fnProcessingDisplay(settings, false)
	}

	/**
	 * Get the data from the JSON data source to use for drawing a table. Using
	 * `_fnGetObjectDataFn` allows the data to be sourced from a property of the
	 * source object, or from a processing function.
	 *  @param {object} settings dataTables settings object
	 *  @param  {object} json Data source object / array from the server
	 *  @return {array} Array of data to use
	 */
	function _fnAjaxDataSrc(settings, json, write) {
		var dataProp = "data"

		if ($.isPlainObject(settings.ajax) && settings.ajax.dataSrc !== undefined) {
			// Could in inside a `dataSrc` object, or not!
			var dataSrc = settings.ajax.dataSrc

			// string, function and object are valid types
			if (typeof dataSrc === "string" || typeof dataSrc === "function") {
				dataProp = dataSrc
			} else if (dataSrc.data !== undefined) {
				dataProp = dataSrc.data
			}
		}

		if (!write) {
			if (dataProp === "data") {
				// If the default, then we still want to support the old style, and safely ignore
				// it if possible
				return json.aaData || json[dataProp]
			}

			return dataProp !== "" ? _fnGetObjectDataFn(dataProp)(json) : json
		}

		// set
		_fnSetObjectDataFn(dataProp)(json, write)
	}

	/**
	 * Very similar to _fnAjaxDataSrc, but for the other SSP properties
	 * @param {*} settings DataTables settings object
	 * @param {*} param Target parameter
	 * @param {*} json JSON data
	 * @returns Resolved value
	 */
	function _fnAjaxDataSrcParam(settings, param, json) {
		var dataSrc = $.isPlainObject(settings.ajax) ? settings.ajax.dataSrc : null

		if (dataSrc && dataSrc[param]) {
			// Get from custom location
			return _fnGetObjectDataFn(dataSrc[param])(json)
		}

		// else - Default behaviour
		var old = ""

		// Legacy support
		if (param === "draw") {
			old = "sEcho"
		} else if (param === "recordsTotal") {
			old = "iTotalRecords"
		} else if (param === "recordsFiltered") {
			old = "iTotalDisplayRecords"
		}

		return json[old] !== undefined ? json[old] : json[param]
	}

	/**
	 * Filter the table using both the global filter and column based filtering
	 *  @param {object} settings dataTables settings object
	 *  @param {object} input search information
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterComplete(settings, input) {
		var columnsSearch = settings.aoPreSearchCols

		// In server-side processing all filtering is done by the server, so no point hanging around here
		if (_fnDataSource(settings) != "ssp") {
			// Check if any of the rows were invalidated
			_fnFilterData(settings)

			// Start from the full data set
			settings.aiDisplay = settings.aiDisplayMaster.slice()

			// Global filter first
			_fnFilter(settings.aiDisplay, settings, input.search, input)

			$.each(settings.searchFixed, function (name, term) {
				_fnFilter(settings.aiDisplay, settings, term, {})
			})

			// Then individual column filters
			for (var i = 0; i < columnsSearch.length; i++) {
				var col = columnsSearch[i]

				_fnFilter(settings.aiDisplay, settings, col.search, col, i)

				$.each(settings.aoColumns[i].searchFixed, function (name, term) {
					_fnFilter(settings.aiDisplay, settings, term, {}, i)
				})
			}

			// And finally global filtering
			_fnFilterCustom(settings)
		}

		// Tell the draw function we have been filtering
		settings.bFiltered = true

		_fnCallbackFire(settings, null, "search", [settings])
	}

	/**
	 * Apply custom filtering functions
	 *
	 * This is legacy now that we have named functions, but it is widely used
	 * from 1.x, so it is not yet deprecated.
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterCustom(settings) {
		var filters = DataTable.ext.search
		var displayRows = settings.aiDisplay
		var row, rowIdx

		for (var i = 0, ien = filters.length; i < ien; i++) {
			var rows = []

			// Loop over each row and see if it should be included
			for (var j = 0, jen = displayRows.length; j < jen; j++) {
				rowIdx = displayRows[j]
				row = settings.aoData[rowIdx]

				if (filters[i](settings, row._aFilterData, rowIdx, row._aData, j)) {
					rows.push(rowIdx)
				}
			}

			// So the array reference doesn't break set the results into the
			// existing array
			displayRows.length = 0
			displayRows.push.apply(displayRows, rows)
		}
	}

	/**
	 * Filter the data table based on user input and draw the table
	 */
	function _fnFilter(searchRows, settings, input, options, column) {
		if (input === "") {
			return
		}

		var i = 0
		var matched = []

		// Search term can be a function, regex or string - if a string we apply our
		// smart filtering regex (assuming the options require that)
		var searchFunc = typeof input === "function" ? input : null
		var rpSearch = input instanceof RegExp ? input : searchFunc ? null : _fnFilterCreateSearch(input, options)

		// Then for each row, does the test pass. If not, lop the row from the array
		for (i = 0; i < searchRows.length; i++) {
			var row = settings.aoData[searchRows[i]]
			var data = column === undefined ? row._sFilterRow : row._aFilterData[column]

			if ((searchFunc && searchFunc(data, row._aData, searchRows[i], column)) || (rpSearch && rpSearch.test(data))) {
				matched.push(searchRows[i])
			}
		}

		// Mutate the searchRows array
		searchRows.length = matched.length

		for (i = 0; i < matched.length; i++) {
			searchRows[i] = matched[i]
		}
	}

	/**
	 * Build a regular expression object suitable for searching a table
	 *  @param {string} sSearch string to search for
	 *  @param {bool} bRegex treat as a regular expression or not
	 *  @param {bool} bSmart perform smart filtering or not
	 *  @param {bool} bCaseInsensitive Do case insensitive matching or not
	 *  @returns {RegExp} constructed object
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterCreateSearch(search, inOpts) {
		var not = []
		var options = $.extend(
			{},
			{
				boundary: false,
				caseInsensitive: true,
				exact: false,
				regex: false,
				smart: true
			},
			inOpts
		)

		if (typeof search !== "string") {
			search = search.toString()
		}

		// Remove diacritics if normalize is set up to do so
		search = _normalize(search)

		if (options.exact) {
			return new RegExp("^" + _fnEscapeRegex(search) + "$", options.caseInsensitive ? "i" : "")
		}

		search = options.regex ? search : _fnEscapeRegex(search)

		if (options.smart) {
			/* For smart filtering we want to allow the search to work regardless of
			 * word order. We also want double quoted text to be preserved, so word
			 * order is important - a la google. And a negative look around for
			 * finding rows which don't contain a given string.
			 *
			 * So this is the sort of thing we want to generate:
			 *
			 * ^(?=.*?\bone\b)(?=.*?\btwo three\b)(?=.*?\bfour\b).*$
			 */
			var parts = search.match(/!?["\u201C][^"\u201D]+["\u201D]|[^ ]+/g) || [""]
			var a = parts.map(function (word) {
				var negative = false
				var m

				// Determine if it is a "does not include"
				if (word.charAt(0) === "!") {
					negative = true
					word = word.substring(1)
				}

				// Strip the quotes from around matched phrases
				if (word.charAt(0) === '"') {
					m = word.match(/^"(.*)"$/)
					word = m ? m[1] : word
				} else if (word.charAt(0) === "\u201C") {
					// Smart quote match (iPhone users)
					m = word.match(/^\u201C(.*)\u201D$/)
					word = m ? m[1] : word
				}

				// For our "not" case, we need to modify the string that is
				// allowed to match at the end of the expression.
				if (negative) {
					if (word.length > 1) {
						not.push("(?!" + word + ")")
					}

					word = ""
				}

				return word.replace(/"/g, "")
			})

			var match = not.length ? not.join("") : ""

			var boundary = options.boundary ? "\\b" : ""

			search = "^(?=.*?" + boundary + a.join(")(?=.*?" + boundary) + ")(" + match + ".)*$"
		}

		return new RegExp(search, options.caseInsensitive ? "i" : "")
	}

	/**
	 * Escape a string such that it can be used in a regular expression
	 *  @param {string} sVal string to escape
	 *  @returns {string} escaped string
	 *  @memberof DataTable#oApi
	 */
	var _fnEscapeRegex = DataTable.util.escapeRegex

	var __filter_div = $("<div>")[0]
	var __filter_div_textContent = __filter_div.textContent !== undefined

	// Update the filtering data for each row if needed (by invalidation or first run)
	function _fnFilterData(settings) {
		var columns = settings.aoColumns
		var data = settings.aoData
		var column
		var j, jen, filterData, cellData, row
		var wasInvalidated = false

		for (var rowIdx = 0; rowIdx < data.length; rowIdx++) {
			if (!data[rowIdx]) {
				continue
			}

			row = data[rowIdx]

			if (!row._aFilterData) {
				filterData = []

				for (j = 0, jen = columns.length; j < jen; j++) {
					column = columns[j]

					if (column.bSearchable) {
						cellData = _fnGetCellData(settings, rowIdx, j, "filter")

						// Search in DataTables is string based
						if (cellData === null) {
							cellData = ""
						}

						if (typeof cellData !== "string" && cellData.toString) {
							cellData = cellData.toString()
						}
					} else {
						cellData = ""
					}

					// If it looks like there is an HTML entity in the string,
					// attempt to decode it so sorting works as expected. Note that
					// we could use a single line of jQuery to do this, but the DOM
					// method used here is much faster https://jsperf.com/html-decode
					if (cellData.indexOf && cellData.indexOf("&") !== -1) {
						__filter_div.innerHTML = cellData
						cellData = __filter_div_textContent ? __filter_div.textContent : __filter_div.innerText
					}

					if (cellData.replace) {
						cellData = cellData.replace(/[\r\n\u2028]/g, "")
					}

					filterData.push(cellData)
				}

				row._aFilterData = filterData
				row._sFilterRow = filterData.join("  ")
				wasInvalidated = true
			}
		}

		return wasInvalidated
	}

	/**
	 * Draw the table for the first time, adding all required features
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnInitialise(settings) {
		var i
		var init = settings.oInit
		var deferLoading = settings.deferLoading
		var dataSrc = _fnDataSource(settings)

		// Ensure that the table data is fully initialised
		if (!settings.bInitialised) {
			setTimeout(function () {
				_fnInitialise(settings)
			}, 200)
			return
		}

		// Build the header / footer for the table
		_fnBuildHead(settings, "header")
		_fnBuildHead(settings, "footer")

		// Load the table's state (if needed) and then render around it and draw
		_fnLoadState(settings, init, function () {
			// Then draw the header / footer
			_fnDrawHead(settings, settings.aoHeader)
			_fnDrawHead(settings, settings.aoFooter)

			// Cache the paging start point, as the first redraw will reset it
			var iAjaxStart = settings.iInitDisplayStart

			// Local data load
			// Check if there is data passing into the constructor
			if (init.aaData) {
				for (i = 0; i < init.aaData.length; i++) {
					_fnAddData(settings, init.aaData[i])
				}
			} else if (deferLoading || dataSrc == "dom") {
				// Grab the data from the page
				_fnAddTr(settings, $(settings.nTBody).children("tr"))
			}

			// Filter not yet applied - copy the display master
			settings.aiDisplay = settings.aiDisplayMaster.slice()

			// Enable features
			_fnAddOptionsHtml(settings)
			_fnSortInit(settings)

			_colGroup(settings)

			/* Okay to show that something is going on now */
			_fnProcessingDisplay(settings, true)

			_fnCallbackFire(settings, null, "preInit", [settings], true)

			// If there is default sorting required - let's do it. The sort function
			// will do the drawing for us. Otherwise we draw the table regardless of the
			// Ajax source - this allows the table to look initialised for Ajax sourcing
			// data (show 'loading' message possibly)
			_fnReDraw(settings)

			// Server-side processing init complete is done by _fnAjaxUpdateDraw
			if (dataSrc != "ssp" || deferLoading) {
				// if there is an ajax source load the data
				if (dataSrc == "ajax") {
					_fnBuildAjax(
						settings,
						{},
						function (json) {
							var aData = _fnAjaxDataSrc(settings, json)

							// Got the data - add it to the table
							for (i = 0; i < aData.length; i++) {
								_fnAddData(settings, aData[i])
							}

							// Reset the init display for cookie saving. We've already done
							// a filter, and therefore cleared it before. So we need to make
							// it appear 'fresh'
							settings.iInitDisplayStart = iAjaxStart

							_fnReDraw(settings)
							_fnProcessingDisplay(settings, false)
							_fnInitComplete(settings)
						},
						settings
					)
				} else {
					_fnInitComplete(settings)
					_fnProcessingDisplay(settings, false)
				}
			}
		})
	}

	/**
	 * Draw the table for the first time, adding all required features
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnInitComplete(settings) {
		if (settings._bInitComplete) {
			return
		}

		var args = [settings, settings.json]

		settings._bInitComplete = true

		// Table is fully set up and we have data, so calculate the
		// column widths
		_fnAdjustColumnSizing(settings)

		_fnCallbackFire(settings, null, "plugin-init", args, true)
		_fnCallbackFire(settings, "aoInitComplete", "init", args, true)
	}

	function _fnLengthChange(settings, val) {
		var len = parseInt(val, 10)
		settings._iDisplayLength = len

		_fnLengthOverflow(settings)

		// Fire length change event
		_fnCallbackFire(settings, null, "length", [settings, len])
	}

	/**
	 * Alter the display settings to change the page
	 *  @param {object} settings DataTables settings object
	 *  @param {string|int} action Paging action to take: "first", "previous",
	 *    "next" or "last" or page number to jump to (integer)
	 *  @param [bool] redraw Automatically draw the update or not
	 *  @returns {bool} true page has changed, false - no change
	 *  @memberof DataTable#oApi
	 */
	function _fnPageChange(settings, action, redraw) {
		var start = settings._iDisplayStart,
			len = settings._iDisplayLength,
			records = settings.fnRecordsDisplay()

		if (records === 0 || len === -1) {
			start = 0
		} else if (typeof action === "number") {
			start = action * len

			if (start > records) {
				start = 0
			}
		} else if (action == "first") {
			start = 0
		} else if (action == "previous") {
			start = len >= 0 ? start - len : 0

			if (start < 0) {
				start = 0
			}
		} else if (action == "next") {
			if (start + len < records) {
				start += len
			}
		} else if (action == "last") {
			start = Math.floor((records - 1) / len) * len
		} else if (action === "ellipsis") {
			return
		} else {
			_fnLog(settings, 0, "Unknown paging action: " + action, 5)
		}

		var changed = settings._iDisplayStart !== start
		settings._iDisplayStart = start

		_fnCallbackFire(settings, null, changed ? "page" : "page-nc", [settings])

		if (changed && redraw) {
			_fnDraw(settings)
		}

		return changed
	}

	/**
	 * Generate the node required for the processing node
	 *  @param {object} settings DataTables settings object
	 */
	function _processingHtml(settings) {
		var table = settings.nTable
		var scrolling = settings.oScroll.sX !== "" || settings.oScroll.sY !== ""

		if (settings.oFeatures.bProcessing) {
			var n = $("<div/>", {
				id: settings.sTableId + "_processing",
				class: settings.oClasses.processing.container,
				role: "status"
			})
				.html(settings.oLanguage.sProcessing)
				.append("<div><div></div><div></div><div></div><div></div></div>")

			// Different positioning depending on if scrolling is enabled or not
			if (scrolling) {
				n.prependTo($("div.dt-scroll", settings.nTableWrapper))
			} else {
				n.insertBefore(table)
			}

			$(table).on("processing.dt.DT", function (e, s, show) {
				n.css("display", show ? "block" : "none")
			})
		}
	}

	/**
	 * Display or hide the processing indicator
	 *  @param {object} settings DataTables settings object
	 *  @param {bool} show Show the processing indicator (true) or not (false)
	 */
	function _fnProcessingDisplay(settings, show) {
		// Ignore cases when we are still redrawing
		if (settings.bDrawing && show === false) {
			return
		}

		_fnCallbackFire(settings, null, "processing", [settings, show])
	}

	/**
	 * Show the processing element if an action takes longer than a given time
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} enable Do (true) or not (false) async processing (local feature enablement)
	 * @param {*} run Function to run
	 */
	function _fnProcessingRun(settings, enable, run) {
		if (!enable) {
			// Immediate execution, synchronous
			run()
		} else {
			_fnProcessingDisplay(settings, true)

			// Allow the processing display to show if needed
			setTimeout(function () {
				run()

				_fnProcessingDisplay(settings, false)
			}, 0)
		}
	}
	/**
	 * Add any control elements for the table - specifically scrolling
	 *  @param {object} settings dataTables settings object
	 *  @returns {node} Node to add to the DOM
	 *  @memberof DataTable#oApi
	 */
	function _fnFeatureHtmlTable(settings) {
		var table = $(settings.nTable)

		// Scrolling from here on in
		var scroll = settings.oScroll

		if (scroll.sX === "" && scroll.sY === "") {
			return settings.nTable
		}

		var scrollX = scroll.sX
		var scrollY = scroll.sY
		var classes = settings.oClasses.scrolling
		var caption = settings.captionNode
		var captionSide = caption ? caption._captionSide : null
		var headerClone = $(table[0].cloneNode(false))
		var footerClone = $(table[0].cloneNode(false))
		var footer = table.children("tfoot")
		var _div = "<div/>"
		var size = function (s) {
			return !s ? null : _fnStringToCss(s)
		}

		if (!footer.length) {
			footer = null
		}

		/*
		 * The HTML structure that we want to generate in this function is:
		 *  div - scroller
		 *    div - scroll head
		 *      div - scroll head inner
		 *        table - scroll head table
		 *          thead - thead
		 *    div - scroll body
		 *      table - table (master table)
		 *        thead - thead clone for sizing
		 *        tbody - tbody
		 *    div - scroll foot
		 *      div - scroll foot inner
		 *        table - scroll foot table
		 *          tfoot - tfoot
		 */
		var scroller = $(_div, { class: classes.container })
			.append(
				$(_div, { class: classes.header.self })
					.css({
						overflow: "hidden",
						position: "relative",
						border: 0,
						width: scrollX ? size(scrollX) : "100%"
					})
					.append(
						$(_div, { class: classes.header.inner })
							.css({
								"box-sizing": "content-box",
								width: scroll.sXInner || "100%"
							})
							.append(
								headerClone
									.removeAttr("id")
									.css("margin-left", 0)
									.append(captionSide === "top" ? caption : null)
									.append(table.children("thead"))
							)
					)
			)
			.append(
				$(_div, { class: classes.body })
					.css({
						position: "relative",
						overflow: "auto",
						width: size(scrollX)
					})
					.append(table)
			)

		if (footer) {
			scroller.append(
				$(_div, { class: classes.footer.self })
					.css({
						overflow: "hidden",
						border: 0,
						width: scrollX ? size(scrollX) : "100%"
					})
					.append(
						$(_div, { class: classes.footer.inner }).append(
							footerClone
								.removeAttr("id")
								.css("margin-left", 0)
								.append(captionSide === "bottom" ? caption : null)
								.append(table.children("tfoot"))
						)
					)
			)
		}

		var children = scroller.children()
		var scrollHead = children[0]
		var scrollBody = children[1]
		var scrollFoot = footer ? children[2] : null

		// When the body is scrolled, then we also want to scroll the headers
		$(scrollBody).on("scroll.DT", function () {
			var scrollLeft = this.scrollLeft

			scrollHead.scrollLeft = scrollLeft

			if (footer) {
				scrollFoot.scrollLeft = scrollLeft
			}
		})

		// When focus is put on the header cells, we might need to scroll the body
		$("th, td", scrollHead).on("focus", function () {
			var scrollLeft = scrollHead.scrollLeft

			scrollBody.scrollLeft = scrollLeft

			if (footer) {
				scrollBody.scrollLeft = scrollLeft
			}
		})

		$(scrollBody).css("max-height", scrollY)
		if (!scroll.bCollapse) {
			$(scrollBody).css("height", scrollY)
		}

		settings.nScrollHead = scrollHead
		settings.nScrollBody = scrollBody
		settings.nScrollFoot = scrollFoot

		// On redraw - align columns
		settings.aoDrawCallback.push(_fnScrollDraw)

		return scroller[0]
	}

	/**
	 * Update the header, footer and body tables for resizing - i.e. column
	 * alignment.
	 *
	 * Welcome to the most horrible function DataTables. The process that this
	 * function follows is basically:
	 *   1. Re-create the table inside the scrolling div
	 *   2. Correct colgroup > col values if needed
	 *   3. Copy colgroup > col over to header and footer
	 *   4. Clean up
	 *
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnScrollDraw(settings) {
		// Given that this is such a monster function, a lot of variables are use
		// to try and keep the minimised size as small as possible
		var scroll = settings.oScroll,
			barWidth = scroll.iBarWidth,
			divHeader = $(settings.nScrollHead),
			divHeaderInner = divHeader.children("div"),
			divHeaderTable = divHeaderInner.children("table"),
			divBodyEl = settings.nScrollBody,
			divBody = $(divBodyEl),
			divFooter = $(settings.nScrollFoot),
			divFooterInner = divFooter.children("div"),
			divFooterTable = divFooterInner.children("table"),
			header = $(settings.nTHead),
			table = $(settings.nTable),
			footer = settings.nTFoot && $("th, td", settings.nTFoot).length ? $(settings.nTFoot) : null,
			browser = settings.oBrowser,
			headerCopy,
			footerCopy

		// If the scrollbar visibility has changed from the last draw, we need to
		// adjust the column sizes as the table width will have changed to account
		// for the scrollbar
		var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight

		if (settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== undefined) {
			settings.scrollBarVis = scrollBarVis
			_fnAdjustColumnSizing(settings)
			return // adjust column sizing will call this function again
		} else {
			settings.scrollBarVis = scrollBarVis
		}

		// 1. Re-create the table inside the scrolling div
		// Remove the old minimised thead and tfoot elements in the inner table
		table.children("thead, tfoot").remove()

		// Clone the current header and footer elements and then place it into the inner table
		headerCopy = header.clone().prependTo(table)
		headerCopy.find("th, td").removeAttr("tabindex")
		headerCopy.find("[id]").removeAttr("id")

		if (footer) {
			footerCopy = footer.clone().prependTo(table)
			footerCopy.find("[id]").removeAttr("id")
		}

		// 2. Correct colgroup > col values if needed
		// It is possible that the cell sizes are smaller than the content, so we need to
		// correct colgroup>col for such cases. This can happen if the auto width detection
		// uses a cell which has a longer string, but isn't the widest! For example
		// "Chief Executive Officer (CEO)" is the longest string in the demo, but
		// "Systems Administrator" is actually the widest string since it doesn't collapse.
		// Note the use of translating into a column index to get the `col` element. This
		// is because of Responsive which might remove `col` elements, knocking the alignment
		// of the indexes out.
		if (settings.aiDisplay.length) {
			// Get the column sizes from the first row in the table. This should really be a
			// [].find, but it wasn't supported in Chrome until Sept 2015, and DT has 10 year
			// browser support
			var firstTr = null

			for (i = 0; i < settings.aiDisplay.length; i++) {
				var idx = settings.aiDisplay[i]
				var tr = settings.aoData[idx].nTr

				if (tr) {
					firstTr = tr
					break
				}
			}

			if (firstTr) {
				var colSizes = $(firstTr)
					.children("th, td")
					.map(function (vis) {
						return {
							idx: _fnVisibleToColumnIndex(settings, vis),
							width: $(this).outerWidth()
						}
					})

				// Check against what the colgroup > col is set to and correct if needed
				for (var i = 0; i < colSizes.length; i++) {
					var colEl = settings.aoColumns[colSizes[i].idx].colEl[0]
					var colWidth = colEl.style.width.replace("px", "")

					if (colWidth !== colSizes[i].width) {
						colEl.style.width = colSizes[i].width + "px"
					}
				}
			}
		}

		// 3. Copy the colgroup over to the header and footer
		divHeaderTable.find("colgroup").remove()

		divHeaderTable.append(settings.colgroup.clone())

		if (footer) {
			divFooterTable.find("colgroup").remove()

			divFooterTable.append(settings.colgroup.clone())
		}

		// "Hide" the header and footer that we used for the sizing. We need to keep
		// the content of the cell so that the width applied to the header and body
		// both match, but we want to hide it completely.
		$("th, td", headerCopy).each(function () {
			$(this.childNodes).wrapAll('<div class="dt-scroll-sizing">')
		})

		if (footer) {
			$("th, td", footerCopy).each(function () {
				$(this.childNodes).wrapAll('<div class="dt-scroll-sizing">')
			})
		}

		// 4. Clean up
		// Figure out if there are scrollbar present - if so then we need a the header and footer to
		// provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
		var isScrolling = Math.floor(table.height()) > divBodyEl.clientHeight || divBody.css("overflow-y") == "scroll"
		var paddingSide = "padding" + (browser.bScrollbarLeft ? "Left" : "Right")

		// Set the width's of the header and footer tables
		var outerWidth = table.outerWidth()

		divHeaderTable.css("width", _fnStringToCss(outerWidth))
		divHeaderInner.css("width", _fnStringToCss(outerWidth)).css(paddingSide, isScrolling ? barWidth + "px" : "0px")

		if (footer) {
			divFooterTable.css("width", _fnStringToCss(outerWidth))
			divFooterInner.css("width", _fnStringToCss(outerWidth)).css(paddingSide, isScrolling ? barWidth + "px" : "0px")
		}

		// Correct DOM ordering for colgroup - comes before the thead
		table.children("colgroup").prependTo(table)

		// Adjust the position of the header in case we loose the y-scrollbar
		divBody.trigger("scroll")

		// If sorting or filtering has occurred, jump the scrolling back to the top
		// only if we aren't holding the position
		if ((settings.bSorted || settings.bFiltered) && !settings._drawHold) {
			divBodyEl.scrollTop = 0
		}
	}

	/**
	 * Calculate the width of columns for the table
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnCalculateColumnWidths(settings) {
		// Not interested in doing column width calculation if auto-width is disabled
		if (!settings.oFeatures.bAutoWidth) {
			return
		}

		var table = settings.nTable,
			columns = settings.aoColumns,
			scroll = settings.oScroll,
			scrollY = scroll.sY,
			scrollX = scroll.sX,
			scrollXInner = scroll.sXInner,
			visibleColumns = _fnGetColumns(settings, "bVisible"),
			tableWidthAttr = table.getAttribute("width"), // from DOM element
			tableContainer = table.parentNode,
			i,
			column,
			columnIdx

		var styleWidth = table.style.width

		// If there is no width applied as a CSS style or as an attribute, we assume that
		// the width is intended to be 100%, which is usually is in CSS, but it is very
		// difficult to correctly parse the rules to get the final result.
		if (!styleWidth && !tableWidthAttr) {
			table.style.width = "100%"
			styleWidth = "100%"
		}

		if (styleWidth && styleWidth.indexOf("%") !== -1) {
			tableWidthAttr = styleWidth
		}

		// Let plug-ins know that we are doing a recalc, in case they have changed any of the
		// visible columns their own way (e.g. Responsive uses display:none).
		_fnCallbackFire(settings, null, "column-calc", { visible: visibleColumns }, false)

		// Construct a single row, worst case, table with the widest
		// node in the data, assign any user defined widths, then insert it into
		// the DOM and allow the browser to do all the hard work of calculating
		// table widths
		var tmpTable = $(table.cloneNode()).css("visibility", "hidden").removeAttr("id")

		// Clean up the table body
		tmpTable.append("<tbody>")
		var tr = $("<tr/>").appendTo(tmpTable.find("tbody"))

		// Clone the table header and footer - we can't use the header / footer
		// from the cloned table, since if scrolling is active, the table's
		// real header and footer are contained in different table tags
		tmpTable.append($(settings.nTHead).clone()).append($(settings.nTFoot).clone())

		// Remove any assigned widths from the footer (from scrolling)
		tmpTable.find("tfoot th, tfoot td").css("width", "")

		// Apply custom sizing to the cloned header
		tmpTable.find("thead th, thead td").each(function () {
			// Get the `width` from the header layout
			var width = _fnColumnsSumWidth(settings, this, true, false)

			if (width) {
				this.style.width = width

				// For scrollX we need to force the column width otherwise the
				// browser will collapse it. If this width is smaller than the
				// width the column requires, then it will have no effect
				if (scrollX) {
					$(this).append(
						$("<div/>").css({
							width: width,
							margin: 0,
							padding: 0,
							border: 0,
							height: 1
						})
					)
				}
			} else {
				this.style.width = ""
			}
		})

		// Find the widest piece of data for each column and put it into the table
		for (i = 0; i < visibleColumns.length; i++) {
			columnIdx = visibleColumns[i]
			column = columns[columnIdx]

			var longest = _fnGetMaxLenString(settings, columnIdx)
			var autoClass = _ext.type.className[column.sType]
			var text = longest + column.sContentPadding
			var insert = longest.indexOf("<") === -1 ? document.createTextNode(text) : text

			$("<td/>").addClass(autoClass).addClass(column.sClass).append(insert).appendTo(tr)
		}

		// Tidy the temporary table - remove name attributes so there aren't
		// duplicated in the dom (radio elements for example)
		$("[name]", tmpTable).removeAttr("name")

		// Table has been built, attach to the document so we can work with it.
		// A holding element is used, positioned at the top of the container
		// with minimal height, so it has no effect on if the container scrolls
		// or not. Otherwise it might trigger scrolling when it actually isn't
		// needed
		var holder = $("<div/>")
			.css(
				scrollX || scrollY
					? {
							position: "absolute",
							top: 0,
							left: 0,
							height: 1,
							right: 0,
							overflow: "hidden"
					  }
					: {}
			)
			.append(tmpTable)
			.appendTo(tableContainer)

		// When scrolling (X or Y) we want to set the width of the table as
		// appropriate. However, when not scrolling leave the table width as it
		// is. This results in slightly different, but I think correct behaviour
		if (scrollX && scrollXInner) {
			tmpTable.width(scrollXInner)
		} else if (scrollX) {
			tmpTable.css("width", "auto")
			tmpTable.removeAttr("width")

			// If there is no width attribute or style, then allow the table to
			// collapse
			if (tmpTable.width() < tableContainer.clientWidth && tableWidthAttr) {
				tmpTable.width(tableContainer.clientWidth)
			}
		} else if (scrollY) {
			tmpTable.width(tableContainer.clientWidth)
		} else if (tableWidthAttr) {
			tmpTable.width(tableWidthAttr)
		}

		// Get the width of each column in the constructed table
		var total = 0
		var bodyCells = tmpTable.find("tbody tr").eq(0).children()

		for (i = 0; i < visibleColumns.length; i++) {
			// Use getBounding for sub-pixel accuracy, which we then want to round up!
			var bounding = bodyCells[i].getBoundingClientRect().width

			// Total is tracked to remove any sub-pixel errors as the outerWidth
			// of the table might not equal the total given here
			total += bounding

			// Width for each column to use
			columns[visibleColumns[i]].sWidth = _fnStringToCss(bounding)
		}

		table.style.width = _fnStringToCss(total)

		// Finished with the table - ditch it
		holder.remove()

		// If there is a width attr, we want to attach an event listener which
		// allows the table sizing to automatically adjust when the window is
		// resized. Use the width attr rather than CSS, since we can't know if the
		// CSS is a relative value or absolute - DOM read is always px.
		if (tableWidthAttr) {
			table.style.width = _fnStringToCss(tableWidthAttr)
		}

		if ((tableWidthAttr || scrollX) && !settings._reszEvt) {
			var bindResize = function () {
				$(window).on(
					"resize.DT-" + settings.sInstance,
					DataTable.util.throttle(function () {
						if (!settings.bDestroying) {
							_fnAdjustColumnSizing(settings)
						}
					})
				)
			}

			bindResize()

			settings._reszEvt = true
		}
	}

	/**
	 * Get the maximum strlen for each data column
	 *  @param {object} settings dataTables settings object
	 *  @param {int} colIdx column of interest
	 *  @returns {string} string of the max length
	 *  @memberof DataTable#oApi
	 */
	function _fnGetMaxLenString(settings, colIdx) {
		var column = settings.aoColumns[colIdx]

		if (!column.maxLenString) {
			var s,
				max = "",
				maxLen = -1

			for (var i = 0, ien = settings.aiDisplayMaster.length; i < ien; i++) {
				var rowIdx = settings.aiDisplayMaster[i]
				var data = _fnGetRowDisplay(settings, rowIdx)[colIdx]

				var cellString = data && typeof data === "object" && data.nodeType ? data.innerHTML : data + ""

				// Remove id / name attributes from elements so they
				// don't interfere with existing elements
				cellString = cellString.replace(/id=".*?"/g, "").replace(/name=".*?"/g, "")

				s = _stripHtml(cellString).replace(/&nbsp;/g, " ")

				if (s.length > maxLen) {
					// We want the HTML in the string, but the length that
					// is important is the stripped string
					max = cellString
					maxLen = s.length
				}
			}

			column.maxLenString = max
		}

		return column.maxLenString
	}

	/**
	 * Append a CSS unit (only if required) to a string
	 *  @param {string} value to css-ify
	 *  @returns {string} value with css unit
	 *  @memberof DataTable#oApi
	 */
	function _fnStringToCss(s) {
		if (s === null) {
			return "0px"
		}

		if (typeof s == "number") {
			return s < 0 ? "0px" : s + "px"
		}

		// Check it has a unit character already
		return s.match(/\d$/) ? s + "px" : s
	}

	/**
	 * Re-insert the `col` elements for current visibility
	 *
	 * @param {*} settings DT settings
	 */
	function _colGroup(settings) {
		var cols = settings.aoColumns

		settings.colgroup.empty()

		for (i = 0; i < cols.length; i++) {
			if (cols[i].bVisible) {
				settings.colgroup.append(cols[i].colEl)
			}
		}
	}

	function _fnSortInit(settings) {
		var target = settings.nTHead
		var headerRows = target.querySelectorAll("tr")
		var legacyTop = settings.bSortCellsTop
		var notSelector = ':not([data-dt-order="disable"]):not([data-dt-order="icon-only"])'

		// Legacy support for `orderCellsTop`
		if (legacyTop === true) {
			target = headerRows[0]
		} else if (legacyTop === false) {
			target = headerRows[headerRows.length - 1]
		}

		_fnSortAttachListener(settings, target, target === settings.nTHead ? "tr" + notSelector + " th" + notSelector + ", tr" + notSelector + " td" + notSelector : "th" + notSelector + ", td" + notSelector)

		// Need to resolve the user input array into our internal structure
		var order = []
		_fnSortResolve(settings, order, settings.aaSorting)

		settings.aaSorting = order
	}

	function _fnSortAttachListener(settings, node, selector, column, callback) {
		_fnBindAction(node, selector, function (e) {
			var run = false
			var columns = column === undefined ? _fnColumnsFromHeader(e.target) : [column]

			if (columns.length) {
				for (var i = 0, ien = columns.length; i < ien; i++) {
					var ret = _fnSortAdd(settings, columns[i], i, e.shiftKey)

					if (ret !== false) {
						run = true
					}

					// If the first entry is no sort, then subsequent
					// sort columns are ignored
					if (settings.aaSorting.length === 1 && settings.aaSorting[0][1] === "") {
						break
					}
				}

				if (run) {
					_fnProcessingRun(settings, true, function () {
						_fnSort(settings)
						_fnSortDisplay(settings, settings.aiDisplay)

						_fnReDraw(settings, false, false)

						if (callback) {
							callback()
						}
					})
				}
			}
		})
	}

	/**
	 * Sort the display array to match the master's order
	 * @param {*} settings
	 */
	function _fnSortDisplay(settings, display) {
		if (display.length < 2) {
			return
		}

		var master = settings.aiDisplayMaster
		var masterMap = {}
		var map = {}
		var i

		// Rather than needing an `indexOf` on master array, we can create a map
		for (i = 0; i < master.length; i++) {
			masterMap[master[i]] = i
		}

		// And then cache what would be the indexOf fom the display
		for (i = 0; i < display.length; i++) {
			map[display[i]] = masterMap[display[i]]
		}

		display.sort(function (a, b) {
			// Short version of this function is simply `master.indexOf(a) - master.indexOf(b);`
			return map[a] - map[b]
		})
	}

	function _fnSortResolve(settings, nestedSort, sort) {
		var push = function (a) {
			if ($.isPlainObject(a)) {
				if (a.idx !== undefined) {
					// Index based ordering
					nestedSort.push([a.idx, a.dir])
				} else if (a.name) {
					// Name based ordering
					var cols = _pluck(settings.aoColumns, "sName")
					var idx = cols.indexOf(a.name)

					if (idx !== -1) {
						nestedSort.push([idx, a.dir])
					}
				}
			} else {
				// Plain column index and direction pair
				nestedSort.push(a)
			}
		}

		if ($.isPlainObject(sort)) {
			// Object
			push(sort)
		} else if (sort.length && typeof sort[0] === "number") {
			// 1D array
			push(sort)
		} else if (sort.length) {
			// 2D array
			for (var z = 0; z < sort.length; z++) {
				push(sort[z]) // Object or array
			}
		}
	}

	function _fnSortFlatten(settings) {
		var i,
			k,
			kLen,
			aSort = [],
			extSort = DataTable.ext.type.order,
			aoColumns = settings.aoColumns,
			aDataSort,
			iCol,
			sType,
			srcCol,
			fixed = settings.aaSortingFixed,
			fixedObj = $.isPlainObject(fixed),
			nestedSort = []

		if (!settings.oFeatures.bSort) {
			return aSort
		}

		// Build the sort array, with pre-fix and post-fix options if they have been
		// specified
		if (Array.isArray(fixed)) {
			_fnSortResolve(settings, nestedSort, fixed)
		}

		if (fixedObj && fixed.pre) {
			_fnSortResolve(settings, nestedSort, fixed.pre)
		}

		_fnSortResolve(settings, nestedSort, settings.aaSorting)

		if (fixedObj && fixed.post) {
			_fnSortResolve(settings, nestedSort, fixed.post)
		}

		for (i = 0; i < nestedSort.length; i++) {
			srcCol = nestedSort[i][0]

			if (aoColumns[srcCol]) {
				aDataSort = aoColumns[srcCol].aDataSort

				for (k = 0, kLen = aDataSort.length; k < kLen; k++) {
					iCol = aDataSort[k]
					sType = aoColumns[iCol].sType || "string"

					if (nestedSort[i]._idx === undefined) {
						nestedSort[i]._idx = aoColumns[iCol].asSorting.indexOf(nestedSort[i][1])
					}

					if (nestedSort[i][1]) {
						aSort.push({
							src: srcCol,
							col: iCol,
							dir: nestedSort[i][1],
							index: nestedSort[i]._idx,
							type: sType,
							formatter: extSort[sType + "-pre"],
							sorter: extSort[sType + "-" + nestedSort[i][1]]
						})
					}
				}
			}
		}

		return aSort
	}

	/**
	 * Change the order of the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnSort(oSettings, col, dir) {
		var i,
			ien,
			iLen,
			aiOrig = [],
			extSort = DataTable.ext.type.order,
			aoData = oSettings.aoData,
			sortCol,
			displayMaster = oSettings.aiDisplayMaster,
			aSort

		// Allow a specific column to be sorted, which will _not_ alter the display
		// master
		if (col !== undefined) {
			var srcCol = oSettings.aoColumns[col]
			aSort = [
				{
					src: col,
					col: col,
					dir: dir,
					index: 0,
					type: srcCol.sType,
					formatter: extSort[srcCol.sType + "-pre"],
					sorter: extSort[srcCol.sType + "-" + dir]
				}
			]
			displayMaster = displayMaster.slice()
		} else {
			aSort = _fnSortFlatten(oSettings)
		}

		for (i = 0, ien = aSort.length; i < ien; i++) {
			sortCol = aSort[i]

			// Load the data needed for the sort, for each cell
			_fnSortData(oSettings, sortCol.col)
		}

		/* No sorting required if server-side or no sorting array */
		if (_fnDataSource(oSettings) != "ssp" && aSort.length !== 0) {
			// Reset the initial positions on each pass so we get a stable sort
			for (i = 0, iLen = displayMaster.length; i < iLen; i++) {
				aiOrig[i] = i
			}

			// If the first sort is desc, then reverse the array to preserve original
			// order, just in reverse
			if (aSort.length && aSort[0].dir === "desc" && oSettings.orderDescReverse) {
				aiOrig.reverse()
			}

			/* Do the sort - here we want multi-column sorting based on a given data source (column)
			 * and sorting function (from oSort) in a certain direction. It's reasonably complex to
			 * follow on it's own, but this is what we want (example two column sorting):
			 *  fnLocalSorting = function(a,b){
			 *    var test;
			 *    test = oSort['string-asc']('data11', 'data12');
			 *      if (test !== 0)
			 *        return test;
			 *    test = oSort['numeric-desc']('data21', 'data22');
			 *    if (test !== 0)
			 *      return test;
			 *    return oSort['numeric-asc']( aiOrig[a], aiOrig[b] );
			 *  }
			 * Basically we have a test for each sorting column, if the data in that column is equal,
			 * test the next column. If all columns match, then we use a numeric sort on the row
			 * positions in the original data array to provide a stable sort.
			 */
			displayMaster.sort(function (a, b) {
				var x,
					y,
					k,
					test,
					sort,
					len = aSort.length,
					dataA = aoData[a]._aSortData,
					dataB = aoData[b]._aSortData

				for (k = 0; k < len; k++) {
					sort = aSort[k]

					// Data, which may have already been through a `-pre` function
					x = dataA[sort.col]
					y = dataB[sort.col]

					if (sort.sorter) {
						// If there is a custom sorter (`-asc` or `-desc`) for this
						// data type, use it
						test = sort.sorter(x, y)

						if (test !== 0) {
							return test
						}
					} else {
						// Otherwise, use generic sorting
						test = x < y ? -1 : x > y ? 1 : 0

						if (test !== 0) {
							return sort.dir === "asc" ? test : -test
						}
					}
				}

				x = aiOrig[a]
				y = aiOrig[b]

				return x < y ? -1 : x > y ? 1 : 0
			})
		} else if (aSort.length === 0) {
			// Apply index order
			displayMaster.sort(function (x, y) {
				return x < y ? -1 : x > y ? 1 : 0
			})
		}

		if (col === undefined) {
			// Tell the draw function that we have sorted the data
			oSettings.bSorted = true
			oSettings.sortDetails = aSort

			_fnCallbackFire(oSettings, null, "order", [oSettings, aSort])
		}

		return displayMaster
	}

	/**
	 * Function to run on user sort request
	 *  @param {object} settings dataTables settings object
	 *  @param {node} attachTo node to attach the handler to
	 *  @param {int} colIdx column sorting index
	 *  @param {int} addIndex Counter
	 *  @param {boolean} [shift=false] Shift click add
	 *  @param {function} [callback] callback function
	 *  @memberof DataTable#oApi
	 */
	function _fnSortAdd(settings, colIdx, addIndex, shift) {
		var col = settings.aoColumns[colIdx]
		var sorting = settings.aaSorting
		var asSorting = col.asSorting
		var nextSortIdx
		var next = function (a, overflow) {
			var idx = a._idx
			if (idx === undefined) {
				idx = asSorting.indexOf(a[1])
			}

			return idx + 1 < asSorting.length ? idx + 1 : overflow ? null : 0
		}

		if (!col.bSortable) {
			return false
		}

		// Convert to 2D array if needed
		if (typeof sorting[0] === "number") {
			sorting = settings.aaSorting = [sorting]
		}

		// If appending the sort then we are multi-column sorting
		if ((shift || addIndex) && settings.oFeatures.bSortMulti) {
			// Are we already doing some kind of sort on this column?
			var sortIdx = _pluck(sorting, "0").indexOf(colIdx)

			if (sortIdx !== -1) {
				// Yes, modify the sort
				nextSortIdx = next(sorting[sortIdx], true)

				if (nextSortIdx === null && sorting.length === 1) {
					nextSortIdx = 0 // can't remove sorting completely
				}

				if (nextSortIdx === null) {
					sorting.splice(sortIdx, 1)
				} else {
					sorting[sortIdx][1] = asSorting[nextSortIdx]
					sorting[sortIdx]._idx = nextSortIdx
				}
			} else if (shift) {
				// No sort on this column yet, being added by shift click
				// add it as itself
				sorting.push([colIdx, asSorting[0], 0])
				sorting[sorting.length - 1]._idx = 0
			} else {
				// No sort on this column yet, being added from a colspan
				// so add with same direction as first column
				sorting.push([colIdx, sorting[0][1], 0])
				sorting[sorting.length - 1]._idx = 0
			}
		} else if (sorting.length && sorting[0][0] == colIdx) {
			// Single column - already sorting on this column, modify the sort
			nextSortIdx = next(sorting[0])

			sorting.length = 1
			sorting[0][1] = asSorting[nextSortIdx]
			sorting[0]._idx = nextSortIdx
		} else {
			// Single column - sort only on this column
			sorting.length = 0
			sorting.push([colIdx, asSorting[0]])
			sorting[0]._idx = 0
		}
	}

	/**
	 * Set the sorting classes on table's body, Note: it is safe to call this function
	 * when bSort and bSortClasses are false
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnSortingClasses(settings) {
		var oldSort = settings.aLastSort
		var sortClass = settings.oClasses.order.position
		var sort = _fnSortFlatten(settings)
		var features = settings.oFeatures
		var i, ien, colIdx

		if (features.bSort && features.bSortClasses) {
			// Remove old sorting classes
			for (i = 0, ien = oldSort.length; i < ien; i++) {
				colIdx = oldSort[i].src

				// Remove column sorting
				$(_pluck(settings.aoData, "anCells", colIdx)).removeClass(sortClass + (i < 2 ? i + 1 : 3))
			}

			// Add new column sorting
			for (i = 0, ien = sort.length; i < ien; i++) {
				colIdx = sort[i].src

				$(_pluck(settings.aoData, "anCells", colIdx)).addClass(sortClass + (i < 2 ? i + 1 : 3))
			}
		}

		settings.aLastSort = sort
	}

	// Get the data to sort a column, be it from cache, fresh (populating the
	// cache), or from a sort formatter
	function _fnSortData(settings, colIdx) {
		// Custom sorting function - provided by the sort data type
		var column = settings.aoColumns[colIdx]
		var customSort = DataTable.ext.order[column.sSortDataType]
		var customData

		if (customSort) {
			customData = customSort.call(settings.oInstance, settings, colIdx, _fnColumnIndexToVisible(settings, colIdx))
		}

		// Use / populate cache
		var row, cellData
		var formatter = DataTable.ext.type.order[column.sType + "-pre"]
		var data = settings.aoData

		for (var rowIdx = 0; rowIdx < data.length; rowIdx++) {
			// Sparse array
			if (!data[rowIdx]) {
				continue
			}

			row = data[rowIdx]

			if (!row._aSortData) {
				row._aSortData = []
			}

			if (!row._aSortData[colIdx] || customSort) {
				cellData = customSort
					? customData[rowIdx] // If there was a custom sort function, use data from there
					: _fnGetCellData(settings, rowIdx, colIdx, "sort")

				row._aSortData[colIdx] = formatter ? formatter(cellData, settings) : cellData
			}
		}
	}

	/**
	 * State information for a table
	 *
	 * @param {*} settings
	 * @returns State object
	 */
	function _fnSaveState(settings) {
		if (settings._bLoadingState) {
			return
		}

		/* Store the interesting variables */
		var state = {
			time: +new Date(),
			start: settings._iDisplayStart,
			length: settings._iDisplayLength,
			order: $.extend(true, [], settings.aaSorting),
			search: $.extend({}, settings.oPreviousSearch),
			columns: settings.aoColumns.map(function (col, i) {
				return {
					visible: col.bVisible,
					search: $.extend({}, settings.aoPreSearchCols[i])
				}
			})
		}

		settings.oSavedState = state
		_fnCallbackFire(settings, "aoStateSaveParams", "stateSaveParams", [settings, state])

		if (settings.oFeatures.bStateSave && !settings.bDestroying) {
			settings.fnStateSaveCallback.call(settings.oInstance, settings, state)
		}
	}

	/**
	 * Attempt to load a saved table state
	 *  @param {object} oSettings dataTables settings object
	 *  @param {object} oInit DataTables init object so we can override settings
	 *  @param {function} callback Callback to execute when the state has been loaded
	 *  @memberof DataTable#oApi
	 */
	function _fnLoadState(settings, init, callback) {
		if (!settings.oFeatures.bStateSave) {
			callback()
			return
		}

		var loaded = function (state) {
			_fnImplementState(settings, state, callback)
		}

		var state = settings.fnStateLoadCallback.call(settings.oInstance, settings, loaded)

		if (state !== undefined) {
			_fnImplementState(settings, state, callback)
		}
		// otherwise, wait for the loaded callback to be executed

		return true
	}

	function _fnImplementState(settings, s, callback) {
		var i, ien
		var columns = settings.aoColumns
		settings._bLoadingState = true

		// When StateRestore was introduced the state could now be implemented at any time
		// Not just initialisation. To do this an api instance is required in some places
		var api = settings._bInitComplete ? new DataTable.Api(settings) : null

		if (!s || !s.time) {
			settings._bLoadingState = false
			callback()
			return
		}

		// Reject old data
		var duration = settings.iStateDuration
		if (duration > 0 && s.time < +new Date() - duration * 1000) {
			settings._bLoadingState = false
			callback()
			return
		}

		// Allow custom and plug-in manipulation functions to alter the saved data set and
		// cancelling of loading by returning false
		var abStateLoad = _fnCallbackFire(settings, "aoStateLoadParams", "stateLoadParams", [settings, s])
		if (abStateLoad.indexOf(false) !== -1) {
			settings._bLoadingState = false
			callback()
			return
		}

		// Number of columns have changed - all bets are off, no restore of settings
		if (s.columns && columns.length !== s.columns.length) {
			settings._bLoadingState = false
			callback()
			return
		}

		// Store the saved state so it might be accessed at any time
		settings.oLoadedState = $.extend(true, {}, s)

		// This is needed for ColReorder, which has to happen first to allow all
		// the stored indexes to be usable. It is not publicly documented.
		_fnCallbackFire(settings, null, "stateLoadInit", [settings, s], true)

		// Page Length
		if (s.length !== undefined) {
			// If already initialised just set the value directly so that the select element is also updated
			if (api) {
				api.page.len(s.length)
			} else {
				settings._iDisplayLength = s.length
			}
		}

		// Restore key features
		if (s.start !== undefined) {
			if (api === null) {
				settings._iDisplayStart = s.start
				settings.iInitDisplayStart = s.start
			} else {
				_fnPageChange(settings, s.start / settings._iDisplayLength)
			}
		}

		// Order
		if (s.order !== undefined) {
			settings.aaSorting = []
			$.each(s.order, function (i, col) {
				settings.aaSorting.push(col[0] >= columns.length ? [0, col[1]] : col)
			})
		}

		// Search
		if (s.search !== undefined) {
			$.extend(settings.oPreviousSearch, s.search)
		}

		// Columns
		if (s.columns) {
			for (i = 0, ien = s.columns.length; i < ien; i++) {
				var col = s.columns[i]

				// Visibility
				if (col.visible !== undefined) {
					// If the api is defined, the table has been initialised so we need to use it rather than internal settings
					if (api) {
						// Don't redraw the columns on every iteration of this loop, we will do this at the end instead
						api.column(i).visible(col.visible, false)
					} else {
						columns[i].bVisible = col.visible
					}
				}

				// Search
				if (col.search !== undefined) {
					$.extend(settings.aoPreSearchCols[i], col.search)
				}
			}

			// If the api is defined then we need to adjust the columns once the visibility has been changed
			if (api) {
				api.columns.adjust()
			}
		}

		settings._bLoadingState = false
		_fnCallbackFire(settings, "aoStateLoaded", "stateLoaded", [settings, s])
		callback()
	}

	/**
	 * Log an error message
	 *  @param {object} settings dataTables settings object
	 *  @param {int} level log error messages, or display them to the user
	 *  @param {string} msg error message
	 *  @param {int} tn Technical note id to get more information about the error.
	 *  @memberof DataTable#oApi
	 */
	function _fnLog(settings, level, msg, tn) {
		msg = "DataTables warning: " + (settings ? "table id=" + settings.sTableId + " - " : "") + msg

		if (tn) {
			msg += ". For more information about this error, please see " + "https://datatables.net/tn/" + tn
		}

		if (!level) {
			// Backwards compatibility pre 1.10
			var ext = DataTable.ext
			var type = ext.sErrMode || ext.errMode

			if (settings) {
				_fnCallbackFire(settings, null, "dt-error", [settings, tn, msg], true)
			}

			if (type == "alert") {
				alert(msg)
			} else if (type == "throw") {
				throw new Error(msg)
			} else if (typeof type == "function") {
				type(settings, tn, msg)
			}
		} else if (window.console && console.log) {
			console.log(msg)
		}
	}

	/**
	 * See if a property is defined on one object, if so assign it to the other object
	 *  @param {object} ret target object
	 *  @param {object} src source object
	 *  @param {string} name property
	 *  @param {string} [mappedName] name to map too - optional, name used if not given
	 *  @memberof DataTable#oApi
	 */
	function _fnMap(ret, src, name, mappedName) {
		if (Array.isArray(name)) {
			$.each(name, function (i, val) {
				if (Array.isArray(val)) {
					_fnMap(ret, src, val[0], val[1])
				} else {
					_fnMap(ret, src, val)
				}
			})

			return
		}

		if (mappedName === undefined) {
			mappedName = name
		}

		if (src[name] !== undefined) {
			ret[mappedName] = src[name]
		}
	}

	/**
	 * Extend objects - very similar to jQuery.extend, but deep copy objects, and
	 * shallow copy arrays. The reason we need to do this, is that we don't want to
	 * deep copy array init values (such as aaSorting) since the dev wouldn't be
	 * able to override them, but we do want to deep copy arrays.
	 *  @param {object} out Object to extend
	 *  @param {object} extender Object from which the properties will be applied to
	 *      out
	 *  @param {boolean} breakRefs If true, then arrays will be sliced to take an
	 *      independent copy with the exception of the `data` or `aaData` parameters
	 *      if they are present. This is so you can pass in a collection to
	 *      DataTables and have that used as your data source without breaking the
	 *      references
	 *  @returns {object} out Reference, just for convenience - out === the return.
	 *  @memberof DataTable#oApi
	 *  @todo This doesn't take account of arrays inside the deep copied objects.
	 */
	function _fnExtend(out, extender, breakRefs) {
		var val

		for (var prop in extender) {
			if (Object.prototype.hasOwnProperty.call(extender, prop)) {
				val = extender[prop]

				if ($.isPlainObject(val)) {
					if (!$.isPlainObject(out[prop])) {
						out[prop] = {}
					}
					$.extend(true, out[prop], val)
				} else if (breakRefs && prop !== "data" && prop !== "aaData" && Array.isArray(val)) {
					out[prop] = val.slice()
				} else {
					out[prop] = val
				}
			}
		}

		return out
	}

	/**
	 * Bind an event handers to allow a click or return key to activate the callback.
	 * This is good for accessibility since a return on the keyboard will have the
	 * same effect as a click, if the element has focus.
	 *  @param {element} n Element to bind the action to
	 *  @param {object|string} selector Selector (for delegated events) or data object
	 *   to pass to the triggered function
	 *  @param {function} fn Callback function for when the event is triggered
	 *  @memberof DataTable#oApi
	 */
	function _fnBindAction(n, selector, fn) {
		$(n)
			.on("click.DT", selector, function (e) {
				fn(e)
			})
			.on("keypress.DT", selector, function (e) {
				if (e.which === 13) {
					e.preventDefault()
					fn(e)
				}
			})
			.on("selectstart.DT", selector, function () {
				// Don't want a double click resulting in text selection
				return false
			})
	}

	/**
	 * Register a callback function. Easily allows a callback function to be added to
	 * an array store of callback functions that can then all be called together.
	 *  @param {object} settings dataTables settings object
	 *  @param {string} store Name of the array storage for the callbacks in oSettings
	 *  @param {function} fn Function to be called back
	 *  @memberof DataTable#oApi
	 */
	function _fnCallbackReg(settings, store, fn) {
		if (fn) {
			settings[store].push(fn)
		}
	}

	/**
	 * Fire callback functions and trigger events. Note that the loop over the
	 * callback array store is done backwards! Further note that you do not want to
	 * fire off triggers in time sensitive applications (for example cell creation)
	 * as its slow.
	 *  @param {object} settings dataTables settings object
	 *  @param {string} callbackArr Name of the array storage for the callbacks in
	 *      oSettings
	 *  @param {string} eventName Name of the jQuery custom event to trigger. If
	 *      null no trigger is fired
	 *  @param {array} args Array of arguments to pass to the callback function /
	 *      trigger
	 *  @param {boolean} [bubbles] True if the event should bubble
	 *  @memberof DataTable#oApi
	 */
	function _fnCallbackFire(settings, callbackArr, eventName, args, bubbles) {
		var ret = []

		if (callbackArr) {
			ret = settings[callbackArr]
				.slice()
				.reverse()
				.map(function (val) {
					return val.apply(settings.oInstance, args)
				})
		}

		if (eventName !== null) {
			var e = $.Event(eventName + ".dt")
			var table = $(settings.nTable)

			// Expose the DataTables API on the event object for easy access
			e.dt = settings.api

			table[bubbles ? "trigger" : "triggerHandler"](e, args)

			// If not yet attached to the document, trigger the event
			// on the body directly to sort of simulate the bubble
			if (bubbles && table.parents("body").length === 0) {
				$("body").trigger(e, args)
			}

			ret.push(e.result)
		}

		return ret
	}

	function _fnLengthOverflow(settings) {
		var start = settings._iDisplayStart,
			end = settings.fnDisplayEnd(),
			len = settings._iDisplayLength

		/* If we have space to show extra rows (backing up from the end point - then do so */
		if (start >= end) {
			start = end - len
		}

		// Keep the start record on the current page
		start -= start % len

		if (len === -1 || start < 0) {
			start = 0
		}

		settings._iDisplayStart = start
	}

	function _fnRenderer(settings, type) {
		var renderer = settings.renderer
		var host = DataTable.ext.renderer[type]

		if ($.isPlainObject(renderer) && renderer[type]) {
			// Specific renderer for this type. If available use it, otherwise use
			// the default.
			return host[renderer[type]] || host._
		} else if (typeof renderer === "string") {
			// Common renderer - if there is one available for this type use it,
			// otherwise use the default
			return host[renderer] || host._
		}

		// Use the default
		return host._
	}

	/**
	 * Detect the data source being used for the table. Used to simplify the code
	 * a little (ajax) and to make it compress a little smaller.
	 *
	 *  @param {object} settings dataTables settings object
	 *  @returns {string} Data source
	 *  @memberof DataTable#oApi
	 */
	function _fnDataSource(settings) {
		if (settings.oFeatures.bServerSide) {
			return "ssp"
		} else if (settings.ajax) {
			return "ajax"
		}
		return "dom"
	}

	/**
	 * Common replacement for language strings
	 *
	 * @param {*} settings DT settings object
	 * @param {*} str String with values to replace
	 * @param {*} entries Plural number for _ENTRIES_ - can be undefined
	 * @returns String
	 */
	function _fnMacros(settings, str, entries) {
		// When infinite scrolling, we are always starting at 1. _iDisplayStart is
		// used only internally
		var formatter = settings.fnFormatNumber,
			start = settings._iDisplayStart + 1,
			len = settings._iDisplayLength,
			vis = settings.fnRecordsDisplay(),
			max = settings.fnRecordsTotal(),
			all = len === -1

		return str
			.replace(/_START_/g, formatter.call(settings, start))
			.replace(/_END_/g, formatter.call(settings, settings.fnDisplayEnd()))
			.replace(/_MAX_/g, formatter.call(settings, max))
			.replace(/_TOTAL_/g, formatter.call(settings, vis))
			.replace(/_PAGE_/g, formatter.call(settings, all ? 1 : Math.ceil(start / len)))
			.replace(/_PAGES_/g, formatter.call(settings, all ? 1 : Math.ceil(vis / len)))
			.replace(/_ENTRIES_/g, settings.api.i18n("entries", "", entries))
			.replace(/_ENTRIES-MAX_/g, settings.api.i18n("entries", "", max))
			.replace(/_ENTRIES-TOTAL_/g, settings.api.i18n("entries", "", vis))
	}

	/**
	 * Computed structure of the DataTables API, defined by the options passed to
	 * `DataTable.Api.register()` when building the API.
	 *
	 * The structure is built in order to speed creation and extension of the Api
	 * objects since the extensions are effectively pre-parsed.
	 *
	 * The array is an array of objects with the following structure, where this
	 * base array represents the Api prototype base:
	 *
	 *     [
	 *       {
	 *         name:      'data'                -- string   - Property name
	 *         val:       function () {},       -- function - Api method (or undefined if just an object
	 *         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
	 *         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
	 *       },
	 *       {
	 *         name:     'row'
	 *         val:       {},
	 *         methodExt: [ ... ],
	 *         propExt:   [
	 *           {
	 *             name:      'data'
	 *             val:       function () {},
	 *             methodExt: [ ... ],
	 *             propExt:   [ ... ]
	 *           },
	 *           ...
	 *         ]
	 *       }
	 *     ]
	 *
	 * @type {Array}
	 * @ignore
	 */
	var __apiStruct = []

	/**
	 * `Array.prototype` reference.
	 *
	 * @type object
	 * @ignore
	 */
	var __arrayProto = Array.prototype

	/**
	 * Abstraction for `context` parameter of the `Api` constructor to allow it to
	 * take several different forms for ease of use.
	 *
	 * Each of the input parameter types will be converted to a DataTables settings
	 * object where possible.
	 *
	 * @param  {string|node|jQuery|object} mixed DataTable identifier. Can be one
	 *   of:
	 *
	 *   * `string` - jQuery selector. Any DataTables' matching the given selector
	 *     with be found and used.
	 *   * `node` - `TABLE` node which has already been formed into a DataTable.
	 *   * `jQuery` - A jQuery object of `TABLE` nodes.
	 *   * `object` - DataTables settings object
	 *   * `DataTables.Api` - API instance
	 * @return {array|null} Matching DataTables settings objects. `null` or
	 *   `undefined` is returned if no matching DataTable is found.
	 * @ignore
	 */
	var _toSettings = function (mixed) {
		var idx, jq
		var settings = DataTable.settings
		var tables = _pluck(settings, "nTable")

		if (!mixed) {
			return []
		} else if (mixed.nTable && mixed.oFeatures) {
			// DataTables settings object
			return [mixed]
		} else if (mixed.nodeName && mixed.nodeName.toLowerCase() === "table") {
			// Table node
			idx = tables.indexOf(mixed)
			return idx !== -1 ? [settings[idx]] : null
		} else if (mixed && typeof mixed.settings === "function") {
			return mixed.settings().toArray()
		} else if (typeof mixed === "string") {
			// jQuery selector
			jq = $(mixed).get()
		} else if (mixed instanceof $) {
			// jQuery object (also DataTables instance)
			jq = mixed.get()
		}

		if (jq) {
			return settings.filter(function (v, idx) {
				return jq.includes(tables[idx])
			})
		}
	}

	/**
	 * DataTables API class - used to control and interface with  one or more
	 * DataTables enhanced tables.
	 *
	 * The API class is heavily based on jQuery, presenting a chainable interface
	 * that you can use to interact with tables. Each instance of the API class has
	 * a "context" - i.e. the tables that it will operate on. This could be a single
	 * table, all tables on a page or a sub-set thereof.
	 *
	 * Additionally the API is designed to allow you to easily work with the data in
	 * the tables, retrieving and manipulating it as required. This is done by
	 * presenting the API class as an array like interface. The contents of the
	 * array depend upon the actions requested by each method (for example
	 * `rows().nodes()` will return an array of nodes, while `rows().data()` will
	 * return an array of objects or arrays depending upon your table's
	 * configuration). The API object has a number of array like methods (`push`,
	 * `pop`, `reverse` etc) as well as additional helper methods (`each`, `pluck`,
	 * `unique` etc) to assist your working with the data held in a table.
	 *
	 * Most methods (those which return an Api instance) are chainable, which means
	 * the return from a method call also has all of the methods available that the
	 * top level object had. For example, these two calls are equivalent:
	 *
	 *     // Not chained
	 *     api.row.add( {...} );
	 *     api.draw();
	 *
	 *     // Chained
	 *     api.row.add( {...} ).draw();
	 *
	 * @class DataTable.Api
	 * @param {array|object|string|jQuery} context DataTable identifier. This is
	 *   used to define which DataTables enhanced tables this API will operate on.
	 *   Can be one of:
	 *
	 *   * `string` - jQuery selector. Any DataTables' matching the given selector
	 *     with be found and used.
	 *   * `node` - `TABLE` node which has already been formed into a DataTable.
	 *   * `jQuery` - A jQuery object of `TABLE` nodes.
	 *   * `object` - DataTables settings object
	 * @param {array} [data] Data to initialise the Api instance with.
	 *
	 * @example
	 *   // Direct initialisation during DataTables construction
	 *   var api = $('#example').DataTable();
	 *
	 * @example
	 *   // Initialisation using a DataTables jQuery object
	 *   var api = $('#example').dataTable().api();
	 *
	 * @example
	 *   // Initialisation as a constructor
	 *   var api = new DataTable.Api( 'table.dataTable' );
	 */
	_Api = function (context, data) {
		if (!(this instanceof _Api)) {
			return new _Api(context, data)
		}

		var i
		var settings = []
		var ctxSettings = function (o) {
			var a = _toSettings(o)
			if (a) {
				settings.push.apply(settings, a)
			}
		}

		if (Array.isArray(context)) {
			for (i = 0; i < context.length; i++) {
				ctxSettings(context[i])
			}
		} else {
			ctxSettings(context)
		}

		// Remove duplicates
		this.context = settings.length > 1 ? _unique(settings) : settings

		// Initial data
		if (data) {
			// Chrome can throw a max stack error if apply is called with
			// too large an array, but apply is faster.
			if (data.length < 10000) {
				this.push.apply(this, data)
			} else {
				for (i = 0; i < data.length; i++) {
					this.push(data[i])
				}
			}
		}

		// selector
		this.selector = {
			rows: null,
			cols: null,
			opts: null
		}

		_Api.extend(this, this, __apiStruct)
	}

	DataTable.Api = _Api

	// Don't destroy the existing prototype, just extend it. Required for jQuery 2's
	// isPlainObject.
	$.extend(_Api.prototype, {
		any: function () {
			return this.count() !== 0
		},

		context: [], // array of table settings objects

		count: function () {
			return this.flatten().length
		},

		each: function (fn) {
			for (var i = 0, ien = this.length; i < ien; i++) {
				fn.call(this, this[i], i, this)
			}

			return this
		},

		eq: function (idx) {
			var ctx = this.context

			return ctx.length > idx ? new _Api(ctx[idx], this[idx]) : null
		},

		filter: function (fn) {
			var a = __arrayProto.filter.call(this, fn, this)

			return new _Api(this.context, a)
		},

		flatten: function () {
			var a = []

			return new _Api(this.context, a.concat.apply(a, this.toArray()))
		},

		get: function (idx) {
			return this[idx]
		},

		join: __arrayProto.join,

		includes: function (find) {
			return this.indexOf(find) === -1 ? false : true
		},

		indexOf: __arrayProto.indexOf,

		iterator: function (flatten, type, fn, alwaysNew) {
			var a = [],
				ret,
				i,
				ien,
				j,
				jen,
				context = this.context,
				rows,
				items,
				item,
				selector = this.selector

			// Argument shifting
			if (typeof flatten === "string") {
				alwaysNew = fn
				fn = type
				type = flatten
				flatten = false
			}

			for (i = 0, ien = context.length; i < ien; i++) {
				var apiInst = new _Api(context[i])

				if (type === "table") {
					ret = fn.call(apiInst, context[i], i)

					if (ret !== undefined) {
						a.push(ret)
					}
				} else if (type === "columns" || type === "rows") {
					// this has same length as context - one entry for each table
					ret = fn.call(apiInst, context[i], this[i], i)

					if (ret !== undefined) {
						a.push(ret)
					}
				} else if (type === "every" || type === "column" || type === "column-rows" || type === "row" || type === "cell") {
					// columns and rows share the same structure.
					// 'this' is an array of column indexes for each context
					items = this[i]

					if (type === "column-rows") {
						rows = _selector_row_indexes(context[i], selector.opts)
					}

					for (j = 0, jen = items.length; j < jen; j++) {
						item = items[j]

						if (type === "cell") {
							ret = fn.call(apiInst, context[i], item.row, item.column, i, j)
						} else {
							ret = fn.call(apiInst, context[i], item, i, j, rows)
						}

						if (ret !== undefined) {
							a.push(ret)
						}
					}
				}
			}

			if (a.length || alwaysNew) {
				var api = new _Api(context, flatten ? a.concat.apply([], a) : a)
				var apiSelector = api.selector
				apiSelector.rows = selector.rows
				apiSelector.cols = selector.cols
				apiSelector.opts = selector.opts
				return api
			}
			return this
		},

		lastIndexOf: __arrayProto.lastIndexOf,

		length: 0,

		map: function (fn) {
			var a = __arrayProto.map.call(this, fn, this)

			return new _Api(this.context, a)
		},

		pluck: function (prop) {
			var fn = DataTable.util.get(prop)

			return this.map(function (el) {
				return fn(el)
			})
		},

		pop: __arrayProto.pop,

		push: __arrayProto.push,

		reduce: __arrayProto.reduce,

		reduceRight: __arrayProto.reduceRight,

		reverse: __arrayProto.reverse,

		// Object with rows, columns and opts
		selector: null,

		shift: __arrayProto.shift,

		slice: function () {
			return new _Api(this.context, this)
		},

		sort: __arrayProto.sort,

		splice: __arrayProto.splice,

		toArray: function () {
			return __arrayProto.slice.call(this)
		},

		to$: function () {
			return $(this)
		},

		toJQuery: function () {
			return $(this)
		},

		unique: function () {
			return new _Api(this.context, _unique(this.toArray()))
		},

		unshift: __arrayProto.unshift
	})

	function _api_scope(scope, fn, struc) {
		return function () {
			var ret = fn.apply(scope || this, arguments)

			// Method extension
			_Api.extend(ret, ret, struc.methodExt)
			return ret
		}
	}

	function _api_find(src, name) {
		for (var i = 0, ien = src.length; i < ien; i++) {
			if (src[i].name === name) {
				return src[i]
			}
		}
		return null
	}

	window.__apiStruct = __apiStruct

	_Api.extend = function (scope, obj, ext) {
		// Only extend API instances and static properties of the API
		if (!ext.length || !obj || (!(obj instanceof _Api) && !obj.__dt_wrapper)) {
			return
		}

		var i, ien, struct

		for (i = 0, ien = ext.length; i < ien; i++) {
			struct = ext[i]

			if (struct.name === "__proto__") {
				continue
			}

			// Value
			obj[struct.name] = struct.type === "function" ? _api_scope(scope, struct.val, struct) : struct.type === "object" ? {} : struct.val

			obj[struct.name].__dt_wrapper = true

			// Property extension
			_Api.extend(scope, obj[struct.name], struct.propExt)
		}
	}

	//     [
	//       {
	//         name:      'data'                -- string   - Property name
	//         val:       function () {},       -- function - Api method (or undefined if just an object
	//         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
	//         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
	//       },
	//       {
	//         name:     'row'
	//         val:       {},
	//         methodExt: [ ... ],
	//         propExt:   [
	//           {
	//             name:      'data'
	//             val:       function () {},
	//             methodExt: [ ... ],
	//             propExt:   [ ... ]
	//           },
	//           ...
	//         ]
	//       }
	//     ]

	_Api.register = _api_register = function (name, val) {
		if (Array.isArray(name)) {
			for (var j = 0, jen = name.length; j < jen; j++) {
				_Api.register(name[j], val)
			}
			return
		}

		var i,
			ien,
			heir = name.split("."),
			struct = __apiStruct,
			key,
			method

		for (i = 0, ien = heir.length; i < ien; i++) {
			method = heir[i].indexOf("()") !== -1
			key = method ? heir[i].replace("()", "") : heir[i]

			var src = _api_find(struct, key)
			if (!src) {
				src = {
					name: key,
					val: {},
					methodExt: [],
					propExt: [],
					type: "object"
				}
				struct.push(src)
			}

			if (i === ien - 1) {
				src.val = val
				src.type = typeof val === "function" ? "function" : $.isPlainObject(val) ? "object" : "other"
			} else {
				struct = method ? src.methodExt : src.propExt
			}
		}
	}

	_Api.registerPlural = _api_registerPlural = function (pluralName, singularName, val) {
		_Api.register(pluralName, val)

		_Api.register(singularName, function () {
			var ret = val.apply(this, arguments)

			if (ret === this) {
				// Returned item is the API instance that was passed in, return it
				return this
			} else if (ret instanceof _Api) {
				// New API instance returned, want the value from the first item
				// in the returned array for the singular result.
				return ret.length
					? Array.isArray(ret[0])
						? new _Api(ret.context, ret[0]) // Array results are 'enhanced'
						: ret[0]
					: undefined
			}

			// Non-API return - just fire it back
			return ret
		})
	}

	/**
	 * Selector for HTML tables. Apply the given selector to the give array of
	 * DataTables settings objects.
	 *
	 * @param {string|integer} [selector] jQuery selector string or integer
	 * @param  {array} Array of DataTables settings objects to be filtered
	 * @return {array}
	 * @ignore
	 */
	var __table_selector = function (selector, a) {
		if (Array.isArray(selector)) {
			var result = []

			selector.forEach(function (sel) {
				var inner = __table_selector(sel, a)

				result.push.apply(result, inner)
			})

			return result.filter(function (item) {
				return item
			})
		}

		// Integer is used to pick out a table by index
		if (typeof selector === "number") {
			return [a[selector]]
		}

		// Perform a jQuery selector on the table nodes
		var nodes = a.map(function (el) {
			return el.nTable
		})

		return $(nodes)
			.filter(selector)
			.map(function () {
				// Need to translate back from the table node to the settings
				var idx = nodes.indexOf(this)
				return a[idx]
			})
			.toArray()
	}

	/**
	 * Context selector for the API's context (i.e. the tables the API instance
	 * refers to.
	 *
	 * @name    DataTable.Api#tables
	 * @param {string|integer} [selector] Selector to pick which tables the iterator
	 *   should operate on. If not given, all tables in the current context are
	 *   used. This can be given as a jQuery selector (for example `':gt(0)'`) to
	 *   select multiple tables or as an integer to select a single table.
	 * @returns {DataTable.Api} Returns a new API instance if a selector is given.
	 */
	_api_register("tables()", function (selector) {
		// A new instance is created if there was a selector specified
		return selector !== undefined && selector !== null ? new _Api(__table_selector(selector, this.context)) : this
	})

	_api_register("table()", function (selector) {
		var tables = this.tables(selector)
		var ctx = tables.context

		// Truncate to the first matched table
		return ctx.length ? new _Api(ctx[0]) : tables
	})

	// Common methods, combined to reduce size
	;[
		["nodes", "node", "nTable"],
		["body", "body", "nTBody"],
		["header", "header", "nTHead"],
		["footer", "footer", "nTFoot"]
	].forEach(function (item) {
		_api_registerPlural("tables()." + item[0] + "()", "table()." + item[1] + "()", function () {
			return this.iterator(
				"table",
				function (ctx) {
					return ctx[item[2]]
				},
				1
			)
		})
	})

	// Structure methods
	;[
		["header", "aoHeader"],
		["footer", "aoFooter"]
	].forEach(function (item) {
		_api_register("table()." + item[0] + ".structure()", function (selector) {
			var indexes = this.columns(selector).indexes().flatten()
			var ctx = this.context[0]

			return _fnHeaderLayout(ctx, ctx[item[1]], indexes)
		})
	})

	_api_registerPlural("tables().containers()", "table().container()", function () {
		return this.iterator(
			"table",
			function (ctx) {
				return ctx.nTableWrapper
			},
			1
		)
	})

	_api_register("tables().every()", function (fn) {
		var that = this

		return this.iterator("table", function (s, i) {
			fn.call(that.table(i), i)
		})
	})

	_api_register("caption()", function (value, side) {
		var context = this.context

		// Getter - return existing node's content
		if (value === undefined) {
			var caption = context[0].captionNode

			return caption && context.length ? caption.innerHTML : null
		}

		return this.iterator(
			"table",
			function (ctx) {
				var table = $(ctx.nTable)
				var caption = $(ctx.captionNode)
				var container = $(ctx.nTableWrapper)

				// Create the node if it doesn't exist yet
				if (!caption.length) {
					caption = $("<caption/>").html(value)
					ctx.captionNode = caption[0]

					// If side isn't set, we need to insert into the document to let the
					// CSS decide so we can read it back, otherwise there is no way to
					// know if the CSS would put it top or bottom for scrolling
					if (!side) {
						table.prepend(caption)

						side = caption.css("caption-side")
					}
				}

				caption.html(value)

				if (side) {
					caption.css("caption-side", side)
					caption[0]._captionSide = side
				}

				if (container.find("div.dataTables_scroll").length) {
					var selector = side === "top" ? "Head" : "Foot"

					container.find("div.dataTables_scroll" + selector + " table").prepend(caption)
				} else {
					table.prepend(caption)
				}
			},
			1
		)
	})

	_api_register("caption.node()", function () {
		var ctx = this.context

		return ctx.length ? ctx[0].captionNode : null
	})

	/**
	 * Redraw the tables in the current context.
	 */
	_api_register("draw()", function (paging) {
		return this.iterator("table", function (settings) {
			if (paging === "page") {
				_fnDraw(settings)
			} else {
				if (typeof paging === "string") {
					paging = paging === "full-hold" ? false : true
				}

				_fnReDraw(settings, paging === false)
			}
		})
	})

	/**
	 * Get the current page index.
	 *
	 * @return {integer} Current page index (zero based)
	 */ /**
	 * Set the current page.
	 *
	 * Note that if you attempt to show a page which does not exist, DataTables will
	 * not throw an error, but rather reset the paging.
	 *
	 * @param {integer|string} action The paging action to take. This can be one of:
	 *  * `integer` - The page index to jump to
	 *  * `string` - An action to take:
	 *    * `first` - Jump to first page.
	 *    * `next` - Jump to the next page
	 *    * `previous` - Jump to previous page
	 *    * `last` - Jump to the last page.
	 * @returns {DataTables.Api} this
	 */ _api_register("page()", function (action) {
		if (action === undefined) {
			return this.page.info().page // not an expensive call
		}

		// else, have an action to take on all tables
		return this.iterator("table", function (settings) {
			_fnPageChange(settings, action)
		})
	})

	/**
	 * Paging information for the first table in the current context.
	 *
	 * If you require paging information for another table, use the `table()` method
	 * with a suitable selector.
	 *
	 * @return {object} Object with the following properties set:
	 *  * `page` - Current page index (zero based - i.e. the first page is `0`)
	 *  * `pages` - Total number of pages
	 *  * `start` - Display index for the first record shown on the current page
	 *  * `end` - Display index for the last record shown on the current page
	 *  * `length` - Display length (number of records). Note that generally `start
	 *    + length = end`, but this is not always true, for example if there are
	 *    only 2 records to show on the final page, with a length of 10.
	 *  * `recordsTotal` - Full data set length
	 *  * `recordsDisplay` - Data set length once the current filtering criterion
	 *    are applied.
	 */
	_api_register("page.info()", function () {
		if (this.context.length === 0) {
			return undefined
		}

		var settings = this.context[0],
			start = settings._iDisplayStart,
			len = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1,
			visRecords = settings.fnRecordsDisplay(),
			all = len === -1

		return {
			page: all ? 0 : Math.floor(start / len),
			pages: all ? 1 : Math.ceil(visRecords / len),
			start: start,
			end: settings.fnDisplayEnd(),
			length: len,
			recordsTotal: settings.fnRecordsTotal(),
			recordsDisplay: visRecords,
			serverSide: _fnDataSource(settings) === "ssp"
		}
	})

	/**
	 * Get the current page length.
	 *
	 * @return {integer} Current page length. Note `-1` indicates that all records
	 *   are to be shown.
	 */ /**
	 * Set the current page length.
	 *
	 * @param {integer} Page length to set. Use `-1` to show all records.
	 * @returns {DataTables.Api} this
	 */ _api_register("page.len()", function (len) {
		// Note that we can't call this function 'length()' because `length`
		// is a Javascript property of functions which defines how many arguments
		// the function expects.
		if (len === undefined) {
			return this.context.length !== 0 ? this.context[0]._iDisplayLength : undefined
		}

		// else, set the page length
		return this.iterator("table", function (settings) {
			_fnLengthChange(settings, len)
		})
	})

	var __reload = function (settings, holdPosition, callback) {
		// Use the draw event to trigger a callback
		if (callback) {
			var api = new _Api(settings)

			api.one("draw", function () {
				callback(api.ajax.json())
			})
		}

		if (_fnDataSource(settings) == "ssp") {
			_fnReDraw(settings, holdPosition)
		} else {
			_fnProcessingDisplay(settings, true)

			// Cancel an existing request
			var xhr = settings.jqXHR
			if (xhr && xhr.readyState !== 4) {
				xhr.abort()
			}

			// Trigger xhr
			_fnBuildAjax(settings, {}, function (json) {
				_fnClearTable(settings)

				var data = _fnAjaxDataSrc(settings, json)
				for (var i = 0, ien = data.length; i < ien; i++) {
					_fnAddData(settings, data[i])
				}

				_fnReDraw(settings, holdPosition)
				_fnInitComplete(settings)
				_fnProcessingDisplay(settings, false)
			})
		}
	}

	/**
	 * Get the JSON response from the last Ajax request that DataTables made to the
	 * server. Note that this returns the JSON from the first table in the current
	 * context.
	 *
	 * @return {object} JSON received from the server.
	 */
	_api_register("ajax.json()", function () {
		var ctx = this.context

		if (ctx.length > 0) {
			return ctx[0].json
		}

		// else return undefined;
	})

	/**
	 * Get the data submitted in the last Ajax request
	 */
	_api_register("ajax.params()", function () {
		var ctx = this.context

		if (ctx.length > 0) {
			return ctx[0].oAjaxData
		}

		// else return undefined;
	})

	/**
	 * Reload tables from the Ajax data source. Note that this function will
	 * automatically re-draw the table when the remote data has been loaded.
	 *
	 * @param {boolean} [reset=true] Reset (default) or hold the current paging
	 *   position. A full re-sort and re-filter is performed when this method is
	 *   called, which is why the pagination reset is the default action.
	 * @returns {DataTables.Api} this
	 */
	_api_register("ajax.reload()", function (callback, resetPaging) {
		return this.iterator("table", function (settings) {
			__reload(settings, resetPaging === false, callback)
		})
	})

	/**
	 * Get the current Ajax URL. Note that this returns the URL from the first
	 * table in the current context.
	 *
	 * @return {string} Current Ajax source URL
	 */ /**
	 * Set the Ajax URL. Note that this will set the URL for all tables in the
	 * current context.
	 *
	 * @param {string} url URL to set.
	 * @returns {DataTables.Api} this
	 */ _api_register("ajax.url()", function (url) {
		var ctx = this.context

		if (url === undefined) {
			// get
			if (ctx.length === 0) {
				return undefined
			}
			ctx = ctx[0]

			return $.isPlainObject(ctx.ajax) ? ctx.ajax.url : ctx.ajax
		}

		// set
		return this.iterator("table", function (settings) {
			if ($.isPlainObject(settings.ajax)) {
				settings.ajax.url = url
			} else {
				settings.ajax = url
			}
		})
	})

	/**
	 * Load data from the newly set Ajax URL. Note that this method is only
	 * available when `ajax.url()` is used to set a URL. Additionally, this method
	 * has the same effect as calling `ajax.reload()` but is provided for
	 * convenience when setting a new URL. Like `ajax.reload()` it will
	 * automatically redraw the table once the remote data has been loaded.
	 *
	 * @returns {DataTables.Api} this
	 */
	_api_register("ajax.url().load()", function (callback, resetPaging) {
		// Same as a reload, but makes sense to present it for easy access after a
		// url change
		return this.iterator("table", function (ctx) {
			__reload(ctx, resetPaging === false, callback)
		})
	})

	var _selector_run = function (type, selector, selectFn, settings, opts) {
		var out = [],
			res,
			a,
			i,
			ien,
			j,
			jen,
			selectorType = typeof selector

		// Can't just check for isArray here, as an API or jQuery instance might be
		// given with their array like look
		if (!selector || selectorType === "string" || selectorType === "function" || selector.length === undefined) {
			selector = [selector]
		}

		for (i = 0, ien = selector.length; i < ien; i++) {
			// Only split on simple strings - complex expressions will be jQuery selectors
			a = selector[i] && selector[i].split && !selector[i].match(/[[(:]/) ? selector[i].split(",") : [selector[i]]

			for (j = 0, jen = a.length; j < jen; j++) {
				res = selectFn(typeof a[j] === "string" ? a[j].trim() : a[j])

				// Remove empty items
				res = res.filter(function (item) {
					return item !== null && item !== undefined
				})

				if (res && res.length) {
					out = out.concat(res)
				}
			}
		}

		// selector extensions
		var ext = _ext.selector[type]
		if (ext.length) {
			for (i = 0, ien = ext.length; i < ien; i++) {
				out = ext[i](settings, opts, out)
			}
		}

		return _unique(out)
	}

	var _selector_opts = function (opts) {
		if (!opts) {
			opts = {}
		}

		// Backwards compatibility for 1.9- which used the terminology filter rather
		// than search
		if (opts.filter && opts.search === undefined) {
			opts.search = opts.filter
		}

		return $.extend(
			{
				search: "none",
				order: "current",
				page: "all"
			},
			opts
		)
	}

	// Reduce the API instance to the first item found
	var _selector_first = function (old) {
		var inst = new _Api(old.context[0])

		// Use a push rather than passing to the constructor, since it will
		// merge arrays down automatically, which isn't what is wanted here
		if (old.length) {
			inst.push(old[0])
		}

		inst.selector = old.selector

		// Limit to a single row / column / cell
		if (inst.length && inst[0].length > 1) {
			inst[0].splice(1)
		}

		return inst
	}

	var _selector_row_indexes = function (settings, opts) {
		var i,
			ien,
			tmp,
			a = [],
			displayFiltered = settings.aiDisplay,
			displayMaster = settings.aiDisplayMaster

		var search = opts.search, // none, applied, removed
			order = opts.order, // applied, current, index (original - compatibility with 1.9)
			page = opts.page // all, current

		if (_fnDataSource(settings) == "ssp") {
			// In server-side processing mode, most options are irrelevant since
			// rows not shown don't exist and the index order is the applied order
			// Removed is a special case - for consistency just return an empty
			// array
			return search === "removed" ? [] : _range(0, displayMaster.length)
		}

		if (page == "current") {
			// Current page implies that order=current and filter=applied, since it is
			// fairly senseless otherwise, regardless of what order and search actually
			// are
			for (i = settings._iDisplayStart, ien = settings.fnDisplayEnd(); i < ien; i++) {
				a.push(displayFiltered[i])
			}
		} else if (order == "current" || order == "applied") {
			if (search == "none") {
				a = displayMaster.slice()
			} else if (search == "applied") {
				a = displayFiltered.slice()
			} else if (search == "removed") {
				// O(n+m) solution by creating a hash map
				var displayFilteredMap = {}

				for (i = 0, ien = displayFiltered.length; i < ien; i++) {
					displayFilteredMap[displayFiltered[i]] = null
				}

				displayMaster.forEach(function (item) {
					if (!Object.prototype.hasOwnProperty.call(displayFilteredMap, item)) {
						a.push(item)
					}
				})
			}
		} else if (order == "index" || order == "original") {
			for (i = 0, ien = settings.aoData.length; i < ien; i++) {
				if (!settings.aoData[i]) {
					continue
				}

				if (search == "none") {
					a.push(i)
				} else {
					// applied | removed
					tmp = displayFiltered.indexOf(i)

					if ((tmp === -1 && search == "removed") || (tmp >= 0 && search == "applied")) {
						a.push(i)
					}
				}
			}
		} else if (typeof order === "number") {
			// Order the rows by the given column
			var ordered = _fnSort(settings, order, "asc")

			if (search === "none") {
				a = ordered
			} else {
				// applied | removed
				for (i = 0; i < ordered.length; i++) {
					tmp = displayFiltered.indexOf(ordered[i])

					if ((tmp === -1 && search == "removed") || (tmp >= 0 && search == "applied")) {
						a.push(ordered[i])
					}
				}
			}
		}

		return a
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Rows
	 *
	 * {}          - no selector - use all available rows
	 * {integer}   - row aoData index
	 * {node}      - TR node
	 * {string}    - jQuery selector to apply to the TR elements
	 * {array}     - jQuery array of nodes, or simply an array of TR nodes
	 *
	 */
	var __row_selector = function (settings, selector, opts) {
		var rows
		var run = function (sel) {
			var selInt = _intVal(sel)
			var aoData = settings.aoData

			// Short cut - selector is a number and no options provided (default is
			// all records, so no need to check if the index is in there, since it
			// must be - dev error if the index doesn't exist).
			if (selInt !== null && !opts) {
				return [selInt]
			}

			if (!rows) {
				rows = _selector_row_indexes(settings, opts)
			}

			if (selInt !== null && rows.indexOf(selInt) !== -1) {
				// Selector - integer
				return [selInt]
			} else if (sel === null || sel === undefined || sel === "") {
				// Selector - none
				return rows
			}

			// Selector - function
			if (typeof sel === "function") {
				return rows.map(function (idx) {
					var row = aoData[idx]
					return sel(idx, row._aData, row.nTr) ? idx : null
				})
			}

			// Selector - node
			if (sel.nodeName) {
				var rowIdx = sel._DT_RowIndex // Property added by DT for fast lookup
				var cellIdx = sel._DT_CellIndex

				if (rowIdx !== undefined) {
					// Make sure that the row is actually still present in the table
					return aoData[rowIdx] && aoData[rowIdx].nTr === sel ? [rowIdx] : []
				} else if (cellIdx) {
					return aoData[cellIdx.row] && aoData[cellIdx.row].nTr === sel.parentNode ? [cellIdx.row] : []
				} else {
					var host = $(sel).closest("*[data-dt-row]")
					return host.length ? [host.data("dt-row")] : []
				}
			}

			// ID selector. Want to always be able to select rows by id, regardless
			// of if the tr element has been created or not, so can't rely upon
			// jQuery here - hence a custom implementation. This does not match
			// Sizzle's fast selector or HTML4 - in HTML5 the ID can be anything,
			// but to select it using a CSS selector engine (like Sizzle or
			// querySelect) it would need to need to be escaped for some characters.
			// DataTables simplifies this for row selectors since you can select
			// only a row. A # indicates an id any anything that follows is the id -
			// unescaped.
			if (typeof sel === "string" && sel.charAt(0) === "#") {
				// get row index from id
				var rowObj = settings.aIds[sel.replace(/^#/, "")]
				if (rowObj !== undefined) {
					return [rowObj.idx]
				}

				// need to fall through to jQuery in case there is DOM id that
				// matches
			}

			// Get nodes in the order from the `rows` array with null values removed
			var nodes = _removeEmpty(_pluck_order(settings.aoData, rows, "nTr"))

			// Selector - jQuery selector string, array of nodes or jQuery object/
			// As jQuery's .filter() allows jQuery objects to be passed in filter,
			// it also allows arrays, so this will cope with all three options
			return $(nodes)
				.filter(sel)
				.map(function () {
					return this._DT_RowIndex
				})
				.toArray()
		}

		var matched = _selector_run("row", selector, run, settings, opts)

		if (opts.order === "current" || opts.order === "applied") {
			_fnSortDisplay(settings, matched)
		}

		return matched
	}

	_api_register("rows()", function (selector, opts) {
		// argument shifting
		if (selector === undefined) {
			selector = ""
		} else if ($.isPlainObject(selector)) {
			opts = selector
			selector = ""
		}

		opts = _selector_opts(opts)

		var inst = this.iterator(
			"table",
			function (settings) {
				return __row_selector(settings, selector, opts)
			},
			1
		)

		// Want argument shifting here and in __row_selector?
		inst.selector.rows = selector
		inst.selector.opts = opts

		return inst
	})

	_api_register("rows().nodes()", function () {
		return this.iterator(
			"row",
			function (settings, row) {
				return settings.aoData[row].nTr || undefined
			},
			1
		)
	})

	_api_register("rows().data()", function () {
		return this.iterator(
			true,
			"rows",
			function (settings, rows) {
				return _pluck_order(settings.aoData, rows, "_aData")
			},
			1
		)
	})

	_api_registerPlural("rows().cache()", "row().cache()", function (type) {
		return this.iterator(
			"row",
			function (settings, row) {
				var r = settings.aoData[row]
				return type === "search" ? r._aFilterData : r._aSortData
			},
			1
		)
	})

	_api_registerPlural("rows().invalidate()", "row().invalidate()", function (src) {
		return this.iterator("row", function (settings, row) {
			_fnInvalidate(settings, row, src)
		})
	})

	_api_registerPlural("rows().indexes()", "row().index()", function () {
		return this.iterator(
			"row",
			function (settings, row) {
				return row
			},
			1
		)
	})

	_api_registerPlural("rows().ids()", "row().id()", function (hash) {
		var a = []
		var context = this.context

		// `iterator` will drop undefined values, but in this case we want them
		for (var i = 0, ien = context.length; i < ien; i++) {
			for (var j = 0, jen = this[i].length; j < jen; j++) {
				var id = context[i].rowIdFn(context[i].aoData[this[i][j]]._aData)
				a.push((hash === true ? "#" : "") + id)
			}
		}

		return new _Api(context, a)
	})

	_api_registerPlural("rows().remove()", "row().remove()", function () {
		this.iterator("row", function (settings, row) {
			var data = settings.aoData
			var rowData = data[row]

			// Delete from the display arrays
			var idx = settings.aiDisplayMaster.indexOf(row)
			if (idx !== -1) {
				settings.aiDisplayMaster.splice(idx, 1)
			}

			// For server-side processing tables - subtract the deleted row from the count
			if (settings._iRecordsDisplay > 0) {
				settings._iRecordsDisplay--
			}

			// Check for an 'overflow' they case for displaying the table
			_fnLengthOverflow(settings)

			// Remove the row's ID reference if there is one
			var id = settings.rowIdFn(rowData._aData)
			if (id !== undefined) {
				delete settings.aIds[id]
			}

			data[row] = null
		})

		return this
	})

	_api_register("rows.add()", function (rows) {
		var newRows = this.iterator(
			"table",
			function (settings) {
				var row, i, ien
				var out = []

				for (i = 0, ien = rows.length; i < ien; i++) {
					row = rows[i]

					if (row.nodeName && row.nodeName.toUpperCase() === "TR") {
						out.push(_fnAddTr(settings, row)[0])
					} else {
						out.push(_fnAddData(settings, row))
					}
				}

				return out
			},
			1
		)

		// Return an Api.rows() extended instance, so rows().nodes() etc can be used
		var modRows = this.rows(-1)
		modRows.pop()
		modRows.push.apply(modRows, newRows)

		return modRows
	})

	/**
	 *
	 */
	_api_register("row()", function (selector, opts) {
		return _selector_first(this.rows(selector, opts))
	})

	_api_register("row().data()", function (data) {
		var ctx = this.context

		if (data === undefined) {
			// Get
			return ctx.length && this.length && this[0].length ? ctx[0].aoData[this[0]]._aData : undefined
		}

		// Set
		var row = ctx[0].aoData[this[0]]
		row._aData = data

		// If the DOM has an id, and the data source is an array
		if (Array.isArray(data) && row.nTr && row.nTr.id) {
			_fnSetObjectDataFn(ctx[0].rowId)(data, row.nTr.id)
		}

		// Automatically invalidate
		_fnInvalidate(ctx[0], this[0], "data")

		return this
	})

	_api_register("row().node()", function () {
		var ctx = this.context

		if (ctx.length && this.length && this[0].length) {
			var row = ctx[0].aoData[this[0]]

			if (row && row.nTr) {
				return row.nTr
			}
		}

		return null
	})

	_api_register("row.add()", function (row) {
		// Allow a jQuery object to be passed in - only a single row is added from
		// it though - the first element in the set
		if (row instanceof $ && row.length) {
			row = row[0]
		}

		var rows = this.iterator("table", function (settings) {
			if (row.nodeName && row.nodeName.toUpperCase() === "TR") {
				return _fnAddTr(settings, row)[0]
			}
			return _fnAddData(settings, row)
		})

		// Return an Api.rows() extended instance, with the newly added row selected
		return this.row(rows[0])
	})

	$(document).on("plugin-init.dt", function (e, context) {
		var api = new _Api(context)

		api.on("stateSaveParams.DT", function (e, settings, d) {
			// This could be more compact with the API, but it is a lot faster as a simple
			// internal loop
			var idFn = settings.rowIdFn
			var rows = settings.aiDisplayMaster
			var ids = []

			for (var i = 0; i < rows.length; i++) {
				var rowIdx = rows[i]
				var data = settings.aoData[rowIdx]

				if (data._detailsShow) {
					ids.push("#" + idFn(data._aData))
				}
			}

			d.childRows = ids
		})

		// For future state loads (e.g. with StateRestore)
		api.on("stateLoaded.DT", function (e, settings, state) {
			__details_state_load(api, state)
		})

		// And the initial load state
		__details_state_load(api, api.state.loaded())
	})

	var __details_state_load = function (api, state) {
		if (state && state.childRows) {
			api
				.rows(
					state.childRows.map(function (id) {
						// Escape any `:` characters from the row id. Accounts for
						// already escaped characters.
						return id.replace(/([^:\\]*(?:\\.[^:\\]*)*):/g, "$1\\:")
					})
				)
				.every(function () {
					_fnCallbackFire(api.settings()[0], null, "requestChild", [this])
				})
		}
	}

	var __details_add = function (ctx, row, data, klass) {
		// Convert to array of TR elements
		var rows = []
		var addRow = function (r, k) {
			// Recursion to allow for arrays of jQuery objects
			if (Array.isArray(r) || r instanceof $) {
				for (var i = 0, ien = r.length; i < ien; i++) {
					addRow(r[i], k)
				}
				return
			}

			// If we get a TR element, then just add it directly - up to the dev
			// to add the correct number of columns etc
			if (r.nodeName && r.nodeName.toLowerCase() === "tr") {
				r.setAttribute("data-dt-row", row.idx)
				rows.push(r)
			} else {
				// Otherwise create a row with a wrapper
				var created = $("<tr><td></td></tr>").attr("data-dt-row", row.idx).addClass(k)

				$("td", created).addClass(k).html(r)[0].colSpan = _fnVisbleColumns(ctx)

				rows.push(created[0])
			}
		}

		addRow(data, klass)

		if (row._details) {
			row._details.detach()
		}

		row._details = $(rows)

		// If the children were already shown, that state should be retained
		if (row._detailsShow) {
			row._details.insertAfter(row.nTr)
		}
	}

	// Make state saving of child row details async to allow them to be batch processed
	var __details_state = DataTable.util.throttle(function (ctx) {
		_fnSaveState(ctx[0])
	}, 500)

	var __details_remove = function (api, idx) {
		var ctx = api.context

		if (ctx.length) {
			var row = ctx[0].aoData[idx !== undefined ? idx : api[0]]

			if (row && row._details) {
				row._details.remove()

				row._detailsShow = undefined
				row._details = undefined
				$(row.nTr).removeClass("dt-hasChild")
				__details_state(ctx)
			}
		}
	}

	var __details_display = function (api, show) {
		var ctx = api.context

		if (ctx.length && api.length) {
			var row = ctx[0].aoData[api[0]]

			if (row._details) {
				row._detailsShow = show

				if (show) {
					row._details.insertAfter(row.nTr)
					$(row.nTr).addClass("dt-hasChild")
				} else {
					row._details.detach()
					$(row.nTr).removeClass("dt-hasChild")
				}

				_fnCallbackFire(ctx[0], null, "childRow", [show, api.row(api[0])])

				__details_events(ctx[0])
				__details_state(ctx)
			}
		}
	}

	var __details_events = function (settings) {
		var api = new _Api(settings)
		var namespace = ".dt.DT_details"
		var drawEvent = "draw" + namespace
		var colvisEvent = "column-sizing" + namespace
		var destroyEvent = "destroy" + namespace
		var data = settings.aoData

		api.off(drawEvent + " " + colvisEvent + " " + destroyEvent)

		if (_pluck(data, "_details").length > 0) {
			// On each draw, insert the required elements into the document
			api.on(drawEvent, function (e, ctx) {
				if (settings !== ctx) {
					return
				}

				api
					.rows({ page: "current" })
					.eq(0)
					.each(function (idx) {
						// Internal data grab
						var row = data[idx]

						if (row._detailsShow) {
							row._details.insertAfter(row.nTr)
						}
					})
			})

			// Column visibility change - update the colspan
			api.on(colvisEvent, function (e, ctx) {
				if (settings !== ctx) {
					return
				}

				// Update the colspan for the details rows (note, only if it already has
				// a colspan)
				var row,
					visible = _fnVisbleColumns(ctx)

				for (var i = 0, ien = data.length; i < ien; i++) {
					row = data[i]

					if (row && row._details) {
						row._details.each(function () {
							var el = $(this).children("td")

							if (el.length == 1) {
								el.attr("colspan", visible)
							}
						})
					}
				}
			})

			// Table destroyed - nuke any child rows
			api.on(destroyEvent, function (e, ctx) {
				if (settings !== ctx) {
					return
				}

				for (var i = 0, ien = data.length; i < ien; i++) {
					if (data[i] && data[i]._details) {
						__details_remove(api, i)
					}
				}
			})
		}
	}

	// Strings for the method names to help minification
	var _emp = ""
	var _child_obj = _emp + "row().child"
	var _child_mth = _child_obj + "()"

	// data can be:
	//  tr
	//  string
	//  jQuery or array of any of the above
	_api_register(_child_mth, function (data, klass) {
		var ctx = this.context

		if (data === undefined) {
			// get
			return ctx.length && this.length && ctx[0].aoData[this[0]] ? ctx[0].aoData[this[0]]._details : undefined
		} else if (data === true) {
			// show
			this.child.show()
		} else if (data === false) {
			// remove
			__details_remove(this)
		} else if (ctx.length && this.length) {
			// set
			__details_add(ctx[0], ctx[0].aoData[this[0]], data, klass)
		}

		return this
	})

	_api_register(
		[
			_child_obj + ".show()",
			_child_mth + ".show()" // only when `child()` was called with parameters (without
		],
		function () {
			// it returns an object and this method is not executed)
			__details_display(this, true)
			return this
		}
	)

	_api_register(
		[
			_child_obj + ".hide()",
			_child_mth + ".hide()" // only when `child()` was called with parameters (without
		],
		function () {
			// it returns an object and this method is not executed)
			__details_display(this, false)
			return this
		}
	)

	_api_register(
		[
			_child_obj + ".remove()",
			_child_mth + ".remove()" // only when `child()` was called with parameters (without
		],
		function () {
			// it returns an object and this method is not executed)
			__details_remove(this)
			return this
		}
	)

	_api_register(_child_obj + ".isShown()", function () {
		var ctx = this.context

		if (ctx.length && this.length && ctx[0].aoData[this[0]]) {
			// _detailsShown as false or undefined will fall through to return false
			return ctx[0].aoData[this[0]]._detailsShow || false
		}
		return false
	})

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Columns
	 *
	 * {integer}           - column index (>=0 count from left, <0 count from right)
	 * "{integer}:visIdx"  - visible column index (i.e. translate to column index)  (>=0 count from left, <0 count from right)
	 * "{integer}:visible" - alias for {integer}:visIdx  (>=0 count from left, <0 count from right)
	 * "{string}:name"     - column name
	 * "{string}"          - jQuery selector on column header nodes
	 *
	 */

	// can be an array of these items, comma separated list, or an array of comma
	// separated lists

	var __re_column_selector = /^([^:]+)?:(name|title|visIdx|visible)$/

	// r1 and r2 are redundant - but it means that the parameters match for the
	// iterator callback in columns().data()
	var __columnData = function (settings, column, r1, r2, rows, type) {
		var a = []
		for (var row = 0, ien = rows.length; row < ien; row++) {
			a.push(_fnGetCellData(settings, rows[row], column, type))
		}
		return a
	}

	var __column_header = function (settings, column, row) {
		var header = settings.aoHeader
		var target =
			row !== undefined
				? row
				: settings.bSortCellsTop // legacy support
				? 0
				: header.length - 1

		return header[target][column].cell
	}

	var __column_selector = function (settings, selector, opts) {
		var columns = settings.aoColumns,
			names = _pluck(columns, "sName"),
			titles = _pluck(columns, "sTitle"),
			cells = DataTable.util.get("[].[].cell")(settings.aoHeader),
			nodes = _unique(_flatten([], cells))

		var run = function (s) {
			var selInt = _intVal(s)

			// Selector - all
			if (s === "") {
				return _range(columns.length)
			}

			// Selector - index
			if (selInt !== null) {
				return [
					selInt >= 0
						? selInt // Count from left
						: columns.length + selInt // Count from right (+ because its a negative value)
				]
			}

			// Selector = function
			if (typeof s === "function") {
				var rows = _selector_row_indexes(settings, opts)

				return columns.map(function (col, idx) {
					return s(idx, __columnData(settings, idx, 0, 0, rows), __column_header(settings, idx)) ? idx : null
				})
			}

			// jQuery or string selector
			var match = typeof s === "string" ? s.match(__re_column_selector) : ""

			if (match) {
				switch (match[2]) {
					case "visIdx":
					case "visible":
						// Selector is a column index
						if (match[1] && match[1].match(/^\d+$/)) {
							var idx = parseInt(match[1], 10)

							// Visible index given, convert to column index
							if (idx < 0) {
								// Counting from the right
								var visColumns = columns.map(function (col, i) {
									return col.bVisible ? i : null
								})
								return [visColumns[visColumns.length + idx]]
							}
							// Counting from the left
							return [_fnVisibleToColumnIndex(settings, idx)]
						}

						return columns.map(function (col, idx) {
							// Not visible, can't match
							if (!col.bVisible) {
								return null
							}

							// Selector
							if (match[1]) {
								return $(nodes[idx]).filter(match[1]).length > 0 ? idx : null
							}

							// `:visible` on its own
							return idx
						})

					case "name":
						// match by name. `names` is column index complete and in order
						return names.map(function (name, i) {
							return name === match[1] ? i : null
						})

					case "title":
						// match by column title
						return titles.map(function (title, i) {
							return title === match[1] ? i : null
						})

					default:
						return []
				}
			}

			// Cell in the table body
			if (s.nodeName && s._DT_CellIndex) {
				return [s._DT_CellIndex.column]
			}

			// jQuery selector on the TH elements for the columns
			var jqResult = $(nodes)
				.filter(s)
				.map(function () {
					return _fnColumnsFromHeader(this) // `nodes` is column index complete and in order
				})
				.toArray()

			if (jqResult.length || !s.nodeName) {
				return jqResult
			}

			// Otherwise a node which might have a `dt-column` data attribute, or be
			// a child or such an element
			var host = $(s).closest("*[data-dt-column]")
			return host.length ? [host.data("dt-column")] : []
		}

		return _selector_run("column", selector, run, settings, opts)
	}

	var __setColumnVis = function (settings, column, vis) {
		var cols = settings.aoColumns,
			col = cols[column],
			data = settings.aoData,
			cells,
			i,
			ien,
			tr

		// Get
		if (vis === undefined) {
			return col.bVisible
		}

		// Set
		// No change
		if (col.bVisible === vis) {
			return false
		}

		if (vis) {
			// Insert column
			// Need to decide if we should use appendChild or insertBefore
			var insertBefore = _pluck(cols, "bVisible").indexOf(true, column + 1)

			for (i = 0, ien = data.length; i < ien; i++) {
				if (data[i]) {
					tr = data[i].nTr
					cells = data[i].anCells

					if (tr) {
						// insertBefore can act like appendChild if 2nd arg is null
						tr.insertBefore(cells[column], cells[insertBefore] || null)
					}
				}
			}
		} else {
			// Remove column
			$(_pluck(settings.aoData, "anCells", column)).detach()
		}

		// Common actions
		col.bVisible = vis

		_colGroup(settings)

		return true
	}

	_api_register("columns()", function (selector, opts) {
		// argument shifting
		if (selector === undefined) {
			selector = ""
		} else if ($.isPlainObject(selector)) {
			opts = selector
			selector = ""
		}

		opts = _selector_opts(opts)

		var inst = this.iterator(
			"table",
			function (settings) {
				return __column_selector(settings, selector, opts)
			},
			1
		)

		// Want argument shifting here and in _row_selector?
		inst.selector.cols = selector
		inst.selector.opts = opts

		return inst
	})

	_api_registerPlural("columns().header()", "column().header()", function (row) {
		return this.iterator(
			"column",
			function (settings, column) {
				return __column_header(settings, column, row)
			},
			1
		)
	})

	_api_registerPlural("columns().footer()", "column().footer()", function (row) {
		return this.iterator(
			"column",
			function (settings, column) {
				var footer = settings.aoFooter

				if (!footer.length) {
					return null
				}

				return settings.aoFooter[row !== undefined ? row : 0][column].cell
			},
			1
		)
	})

	_api_registerPlural("columns().data()", "column().data()", function () {
		return this.iterator("column-rows", __columnData, 1)
	})

	_api_registerPlural("columns().render()", "column().render()", function (type) {
		return this.iterator(
			"column-rows",
			function (settings, column, i, j, rows) {
				return __columnData(settings, column, i, j, rows, type)
			},
			1
		)
	})

	_api_registerPlural("columns().dataSrc()", "column().dataSrc()", function () {
		return this.iterator(
			"column",
			function (settings, column) {
				return settings.aoColumns[column].mData
			},
			1
		)
	})

	_api_registerPlural("columns().cache()", "column().cache()", function (type) {
		return this.iterator(
			"column-rows",
			function (settings, column, i, j, rows) {
				return _pluck_order(settings.aoData, rows, type === "search" ? "_aFilterData" : "_aSortData", column)
			},
			1
		)
	})

	_api_registerPlural("columns().init()", "column().init()", function () {
		return this.iterator(
			"column",
			function (settings, column) {
				return settings.aoColumns[column]
			},
			1
		)
	})

	_api_registerPlural("columns().nodes()", "column().nodes()", function () {
		return this.iterator(
			"column-rows",
			function (settings, column, i, j, rows) {
				return _pluck_order(settings.aoData, rows, "anCells", column)
			},
			1
		)
	})

	_api_registerPlural("columns().titles()", "column().title()", function (title, row) {
		return this.iterator(
			"column",
			function (settings, column) {
				// Argument shifting
				if (typeof title === "number") {
					row = title
					title = undefined
				}

				var span = $("span.dt-column-title", this.column(column).header(row))

				if (title !== undefined) {
					span.html(title)
					return this
				}

				return span.html()
			},
			1
		)
	})

	_api_registerPlural("columns().types()", "column().type()", function () {
		return this.iterator(
			"column",
			function (settings, column) {
				var type = settings.aoColumns[column].sType

				// If the type was invalidated, then resolve it. This actually does
				// all columns at the moment. Would only happen once if getting all
				// column's data types.
				if (!type) {
					_fnColumnTypes(settings)
				}

				return type
			},
			1
		)
	})

	_api_registerPlural("columns().visible()", "column().visible()", function (vis, calc) {
		var that = this
		var changed = []
		var ret = this.iterator("column", function (settings, column) {
			if (vis === undefined) {
				return settings.aoColumns[column].bVisible
			} // else

			if (__setColumnVis(settings, column, vis)) {
				changed.push(column)
			}
		})

		// Group the column visibility changes
		if (vis !== undefined) {
			this.iterator("table", function (settings) {
				// Redraw the header after changes
				_fnDrawHead(settings, settings.aoHeader)
				_fnDrawHead(settings, settings.aoFooter)

				// Update colspan for no records display. Child rows and extensions will use their own
				// listeners to do this - only need to update the empty table item here
				if (!settings.aiDisplay.length) {
					$(settings.nTBody).find("td[colspan]").attr("colspan", _fnVisbleColumns(settings))
				}

				_fnSaveState(settings)

				// Second loop once the first is done for events
				that.iterator("column", function (settings, column) {
					if (changed.includes(column)) {
						_fnCallbackFire(settings, null, "column-visibility", [settings, column, vis, calc])
					}
				})

				if (changed.length && (calc === undefined || calc)) {
					that.columns.adjust()
				}
			})
		}

		return ret
	})

	_api_registerPlural("columns().widths()", "column().width()", function () {
		// Injects a fake row into the table for just a moment so the widths can
		// be read, regardless of colspan in the header and rows being present in
		// the body
		var columns = this.columns(":visible").count()
		var row = $("<tr>").html("<td>" + Array(columns).join("</td><td>") + "</td>")

		$(this.table().body()).append(row)

		var widths = row.children().map(function () {
			return $(this).outerWidth()
		})

		row.remove()

		return this.iterator(
			"column",
			function (settings, column) {
				var visIdx = _fnColumnIndexToVisible(settings, column)

				return visIdx !== null ? widths[visIdx] : 0
			},
			1
		)
	})

	_api_registerPlural("columns().indexes()", "column().index()", function (type) {
		return this.iterator(
			"column",
			function (settings, column) {
				return type === "visible" ? _fnColumnIndexToVisible(settings, column) : column
			},
			1
		)
	})

	_api_register("columns.adjust()", function () {
		return this.iterator(
			"table",
			function (settings) {
				_fnAdjustColumnSizing(settings)
			},
			1
		)
	})

	_api_register("column.index()", function (type, idx) {
		if (this.context.length !== 0) {
			var ctx = this.context[0]

			if (type === "fromVisible" || type === "toData") {
				return _fnVisibleToColumnIndex(ctx, idx)
			} else if (type === "fromData" || type === "toVisible") {
				return _fnColumnIndexToVisible(ctx, idx)
			}
		}
	})

	_api_register("column()", function (selector, opts) {
		return _selector_first(this.columns(selector, opts))
	})

	var __cell_selector = function (settings, selector, opts) {
		var data = settings.aoData
		var rows = _selector_row_indexes(settings, opts)
		var cells = _removeEmpty(_pluck_order(data, rows, "anCells"))
		var allCells = $(_flatten([], cells))
		var row
		var columns = settings.aoColumns.length
		var a, i, ien, j, o, host

		var run = function (s) {
			var fnSelector = typeof s === "function"

			if (s === null || s === undefined || fnSelector) {
				// All cells and function selectors
				a = []

				for (i = 0, ien = rows.length; i < ien; i++) {
					row = rows[i]

					for (j = 0; j < columns; j++) {
						o = {
							row: row,
							column: j
						}

						if (fnSelector) {
							// Selector - function
							host = data[row]

							if (s(o, _fnGetCellData(settings, row, j), host.anCells ? host.anCells[j] : null)) {
								a.push(o)
							}
						} else {
							// Selector - all
							a.push(o)
						}
					}
				}

				return a
			}

			// Selector - index
			if ($.isPlainObject(s)) {
				// Valid cell index and its in the array of selectable rows
				return s.column !== undefined && s.row !== undefined && rows.indexOf(s.row) !== -1 ? [s] : []
			}

			// Selector - jQuery filtered cells
			var jqResult = allCells
				.filter(s)
				.map(function (i, el) {
					return {
						// use a new object, in case someone changes the values
						row: el._DT_CellIndex.row,
						column: el._DT_CellIndex.column
					}
				})
				.toArray()

			if (jqResult.length || !s.nodeName) {
				return jqResult
			}

			// Otherwise the selector is a node, and there is one last option - the
			// element might be a child of an element which has dt-row and dt-column
			// data attributes
			host = $(s).closest("*[data-dt-row]")
			return host.length
				? [
						{
							row: host.data("dt-row"),
							column: host.data("dt-column")
						}
				  ]
				: []
		}

		return _selector_run("cell", selector, run, settings, opts)
	}

	_api_register("cells()", function (rowSelector, columnSelector, opts) {
		// Argument shifting
		if ($.isPlainObject(rowSelector)) {
			// Indexes
			if (rowSelector.row === undefined) {
				// Selector options in first parameter
				opts = rowSelector
				rowSelector = null
			} else {
				// Cell index objects in first parameter
				opts = columnSelector
				columnSelector = null
			}
		}
		if ($.isPlainObject(columnSelector)) {
			opts = columnSelector
			columnSelector = null
		}

		// Cell selector
		if (columnSelector === null || columnSelector === undefined) {
			return this.iterator("table", function (settings) {
				return __cell_selector(settings, rowSelector, _selector_opts(opts))
			})
		}

		// The default built in options need to apply to row and columns
		var internalOpts = opts
			? {
					page: opts.page,
					order: opts.order,
					search: opts.search
			  }
			: {}

		// Row + column selector
		var columns = this.columns(columnSelector, internalOpts)
		var rows = this.rows(rowSelector, internalOpts)
		var i, ien, j, jen

		var cellsNoOpts = this.iterator(
			"table",
			function (settings, idx) {
				var a = []

				for (i = 0, ien = rows[idx].length; i < ien; i++) {
					for (j = 0, jen = columns[idx].length; j < jen; j++) {
						a.push({
							row: rows[idx][i],
							column: columns[idx][j]
						})
					}
				}

				return a
			},
			1
		)

		// There is currently only one extension which uses a cell selector extension
		// It is a _major_ performance drag to run this if it isn't needed, so this is
		// an extension specific check at the moment
		var cells = opts && opts.selected ? this.cells(cellsNoOpts, opts) : cellsNoOpts

		$.extend(cells.selector, {
			cols: columnSelector,
			rows: rowSelector,
			opts: opts
		})

		return cells
	})

	_api_registerPlural("cells().nodes()", "cell().node()", function () {
		return this.iterator(
			"cell",
			function (settings, row, column) {
				var data = settings.aoData[row]

				return data && data.anCells ? data.anCells[column] : undefined
			},
			1
		)
	})

	_api_register("cells().data()", function () {
		return this.iterator(
			"cell",
			function (settings, row, column) {
				return _fnGetCellData(settings, row, column)
			},
			1
		)
	})

	_api_registerPlural("cells().cache()", "cell().cache()", function (type) {
		type = type === "search" ? "_aFilterData" : "_aSortData"

		return this.iterator(
			"cell",
			function (settings, row, column) {
				return settings.aoData[row][type][column]
			},
			1
		)
	})

	_api_registerPlural("cells().render()", "cell().render()", function (type) {
		return this.iterator(
			"cell",
			function (settings, row, column) {
				return _fnGetCellData(settings, row, column, type)
			},
			1
		)
	})

	_api_registerPlural("cells().indexes()", "cell().index()", function () {
		return this.iterator(
			"cell",
			function (settings, row, column) {
				return {
					row: row,
					column: column,
					columnVisible: _fnColumnIndexToVisible(settings, column)
				}
			},
			1
		)
	})

	_api_registerPlural("cells().invalidate()", "cell().invalidate()", function (src) {
		return this.iterator("cell", function (settings, row, column) {
			_fnInvalidate(settings, row, src, column)
		})
	})

	_api_register("cell()", function (rowSelector, columnSelector, opts) {
		return _selector_first(this.cells(rowSelector, columnSelector, opts))
	})

	_api_register("cell().data()", function (data) {
		var ctx = this.context
		var cell = this[0]

		if (data === undefined) {
			// Get
			return ctx.length && cell.length ? _fnGetCellData(ctx[0], cell[0].row, cell[0].column) : undefined
		}

		// Set
		_fnSetCellData(ctx[0], cell[0].row, cell[0].column, data)
		_fnInvalidate(ctx[0], cell[0].row, "data", cell[0].column)

		return this
	})

	/**
	 * Get current ordering (sorting) that has been applied to the table.
	 *
	 * @returns {array} 2D array containing the sorting information for the first
	 *   table in the current context. Each element in the parent array represents
	 *   a column being sorted upon (i.e. multi-sorting with two columns would have
	 *   2 inner arrays). The inner arrays may have 2 or 3 elements. The first is
	 *   the column index that the sorting condition applies to, the second is the
	 *   direction of the sort (`desc` or `asc`) and, optionally, the third is the
	 *   index of the sorting order from the `column.sorting` initialisation array.
	 */ /**
	 * Set the ordering for the table.
	 *
	 * @param {integer} order Column index to sort upon.
	 * @param {string} direction Direction of the sort to be applied (`asc` or `desc`)
	 * @returns {DataTables.Api} this
	 */ /**
	 * Set the ordering for the table.
	 *
	 * @param {array} order 1D array of sorting information to be applied.
	 * @param {array} [...] Optional additional sorting conditions
	 * @returns {DataTables.Api} this
	 */ /**
	 * Set the ordering for the table.
	 *
	 * @param {array} order 2D array of sorting information to be applied.
	 * @returns {DataTables.Api} this
	 */ _api_register("order()", function (order, dir) {
		var ctx = this.context
		var args = Array.prototype.slice.call(arguments)

		if (order === undefined) {
			// get
			return ctx.length !== 0 ? ctx[0].aaSorting : undefined
		}

		// set
		if (typeof order === "number") {
			// Simple column / direction passed in
			order = [[order, dir]]
		} else if (args.length > 1) {
			// Arguments passed in (list of 1D arrays)
			order = args
		}
		// otherwise a 2D array was passed in

		return this.iterator("table", function (settings) {
			settings.aaSorting = Array.isArray(order) ? order.slice() : order
		})
	})

	/**
	 * Attach a sort listener to an element for a given column
	 *
	 * @param {node|jQuery|string} node Identifier for the element(s) to attach the
	 *   listener to. This can take the form of a single DOM node, a jQuery
	 *   collection of nodes or a jQuery selector which will identify the node(s).
	 * @param {integer} column the column that a click on this node will sort on
	 * @param {function} [callback] callback function when sort is run
	 * @returns {DataTables.Api} this
	 */
	_api_register("order.listener()", function (node, column, callback) {
		return this.iterator("table", function (settings) {
			_fnSortAttachListener(settings, node, {}, column, callback)
		})
	})

	_api_register("order.fixed()", function (set) {
		if (!set) {
			var ctx = this.context
			var fixed = ctx.length ? ctx[0].aaSortingFixed : undefined

			return Array.isArray(fixed) ? { pre: fixed } : fixed
		}

		return this.iterator("table", function (settings) {
			settings.aaSortingFixed = $.extend(true, {}, set)
		})
	})

	// Order by the selected column(s)
	_api_register(["columns().order()", "column().order()"], function (dir) {
		var that = this

		if (!dir) {
			return this.iterator(
				"column",
				function (settings, idx) {
					var sort = _fnSortFlatten(settings)

					for (var i = 0, ien = sort.length; i < ien; i++) {
						if (sort[i].col === idx) {
							return sort[i].dir
						}
					}

					return null
				},
				1
			)
		} else {
			return this.iterator("table", function (settings, i) {
				settings.aaSorting = that[i].map(function (col) {
					return [col, dir]
				})
			})
		}
	})

	_api_registerPlural("columns().orderable()", "column().orderable()", function (directions) {
		return this.iterator(
			"column",
			function (settings, idx) {
				var col = settings.aoColumns[idx]

				return directions ? col.asSorting : col.bSortable
			},
			1
		)
	})

	_api_register("processing()", function (show) {
		return this.iterator("table", function (ctx) {
			_fnProcessingDisplay(ctx, show)
		})
	})

	_api_register("search()", function (input, regex, smart, caseInsen) {
		var ctx = this.context

		if (input === undefined) {
			// get
			return ctx.length !== 0 ? ctx[0].oPreviousSearch.search : undefined
		}

		// set
		return this.iterator("table", function (settings) {
			if (!settings.oFeatures.bFilter) {
				return
			}

			if (typeof regex === "object") {
				// New style options to pass to the search builder
				_fnFilterComplete(
					settings,
					$.extend(settings.oPreviousSearch, regex, {
						search: input
					})
				)
			} else {
				// Compat for the old options
				_fnFilterComplete(
					settings,
					$.extend(settings.oPreviousSearch, {
						search: input,
						regex: regex === null ? false : regex,
						smart: smart === null ? true : smart,
						caseInsensitive: caseInsen === null ? true : caseInsen
					})
				)
			}
		})
	})

	_api_register("search.fixed()", function (name, search) {
		var ret = this.iterator(true, "table", function (settings) {
			var fixed = settings.searchFixed

			if (!name) {
				return Object.keys(fixed)
			} else if (search === undefined) {
				return fixed[name]
			} else if (search === null) {
				delete fixed[name]
			} else {
				fixed[name] = search
			}

			return this
		})

		return name !== undefined && search === undefined ? ret[0] : ret
	})

	_api_registerPlural("columns().search()", "column().search()", function (input, regex, smart, caseInsen) {
		return this.iterator("column", function (settings, column) {
			var preSearch = settings.aoPreSearchCols

			if (input === undefined) {
				// get
				return preSearch[column].search
			}

			// set
			if (!settings.oFeatures.bFilter) {
				return
			}

			if (typeof regex === "object") {
				// New style options to pass to the search builder
				$.extend(preSearch[column], regex, {
					search: input
				})
			} else {
				// Old style (with not all options available)
				$.extend(preSearch[column], {
					search: input,
					regex: regex === null ? false : regex,
					smart: smart === null ? true : smart,
					caseInsensitive: caseInsen === null ? true : caseInsen
				})
			}

			_fnFilterComplete(settings, settings.oPreviousSearch)
		})
	})

	_api_register(["columns().search.fixed()", "column().search.fixed()"], function (name, search) {
		var ret = this.iterator(true, "column", function (settings, colIdx) {
			var fixed = settings.aoColumns[colIdx].searchFixed

			if (!name) {
				return Object.keys(fixed)
			} else if (search === undefined) {
				return fixed[name]
			} else if (search === null) {
				delete fixed[name]
			} else {
				fixed[name] = search
			}

			return this
		})

		return name !== undefined && search === undefined ? ret[0] : ret
	})
	/*
	 * State API methods
	 */

	_api_register("state()", function (set, ignoreTime) {
		// getter
		if (!set) {
			return this.context.length ? this.context[0].oSavedState : null
		}

		var setMutate = $.extend(true, {}, set)

		// setter
		return this.iterator("table", function (settings) {
			if (ignoreTime !== false) {
				setMutate.time = +new Date() + 100
			}

			_fnImplementState(settings, setMutate, function () {})
		})
	})

	_api_register("state.clear()", function () {
		return this.iterator("table", function (settings) {
			// Save an empty object
			settings.fnStateSaveCallback.call(settings.oInstance, settings, {})
		})
	})

	_api_register("state.loaded()", function () {
		return this.context.length ? this.context[0].oLoadedState : null
	})

	_api_register("state.save()", function () {
		return this.iterator("table", function (settings) {
			_fnSaveState(settings)
		})
	})

	/**
	 * Set the libraries that DataTables uses, or the global objects.
	 * Note that the arguments can be either way around (legacy support)
	 * and the second is optional. See docs.
	 */
	DataTable.use = function (arg1, arg2) {
		// Reverse arguments for legacy support
		var module = typeof arg1 === "string" ? arg2 : arg1
		var type = typeof arg2 === "string" ? arg2 : arg1

		// Getter
		if (module === undefined && typeof type === "string") {
			switch (type) {
				case "lib":
				case "jq":
					return $

				case "win":
					return window

				case "datetime":
					return DataTable.DateTime

				case "luxon":
					return __luxon

				case "moment":
					return __moment

				default:
					return null
			}
		}

		// Setter
		if (type === "lib" || type === "jq" || (module && module.fn && module.fn.jquery)) {
			$ = module
		} else if (type == "win" || (module && module.document)) {
			window = module
			document = module.document
		} else if (type === "datetime" || (module && module.type === "DateTime")) {
			DataTable.DateTime = module
		} else if (type === "luxon" || (module && module.FixedOffsetZone)) {
			__luxon = module
		} else if (type === "moment" || (module && module.isMoment)) {
			__moment = module
		}
	}

	/**
	 * CommonJS factory function pass through. This will check if the arguments
	 * given are a window object or a jQuery object. If so they are set
	 * accordingly.
	 * @param {*} root Window
	 * @param {*} jq jQUery
	 * @returns {boolean} Indicator
	 */
	DataTable.factory = function (root, jq) {
		var is = false

		// Test if the first parameter is a window object
		if (root && root.document) {
			window = root
			document = root.document
		}

		// Test if the second parameter is a jQuery object
		if (jq && jq.fn && jq.fn.jquery) {
			$ = jq
			is = true
		}

		return is
	}

	/**
	 * Provide a common method for plug-ins to check the version of DataTables being
	 * used, in order to ensure compatibility.
	 *
	 *  @param {string} version Version string to check for, in the format "X.Y.Z".
	 *    Note that the formats "X" and "X.Y" are also acceptable.
	 *  @param {string} [version2=current DataTables version] As above, but optional.
	 *   If not given the current DataTables version will be used.
	 *  @returns {boolean} true if this version of DataTables is greater or equal to
	 *    the required version, or false if this version of DataTales is not
	 *    suitable
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    alert( $.fn.dataTable.versionCheck( '1.9.0' ) );
	 */
	DataTable.versionCheck = function (version, version2) {
		var aThis = version2 ? version2.split(".") : DataTable.version.split(".")
		var aThat = version.split(".")
		var iThis, iThat

		for (var i = 0, iLen = aThat.length; i < iLen; i++) {
			iThis = parseInt(aThis[i], 10) || 0
			iThat = parseInt(aThat[i], 10) || 0

			// Parts are the same, keep comparing
			if (iThis === iThat) {
				continue
			}

			// Parts are different, return immediately
			return iThis > iThat
		}

		return true
	}

	/**
	 * Check if a `<table>` node is a DataTable table already or not.
	 *
	 *  @param {node|jquery|string} table Table node, jQuery object or jQuery
	 *      selector for the table to test. Note that if more than more than one
	 *      table is passed on, only the first will be checked
	 *  @returns {boolean} true the table given is a DataTable, or false otherwise
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    if ( ! $.fn.DataTable.isDataTable( '#example' ) ) {
	 *      $('#example').dataTable();
	 *    }
	 */
	DataTable.isDataTable = function (table) {
		var t = $(table).get(0)
		var is = false

		if (table instanceof DataTable.Api) {
			return true
		}

		$.each(DataTable.settings, function (i, o) {
			var head = o.nScrollHead ? $("table", o.nScrollHead)[0] : null
			var foot = o.nScrollFoot ? $("table", o.nScrollFoot)[0] : null

			if (o.nTable === t || head === t || foot === t) {
				is = true
			}
		})

		return is
	}

	/**
	 * Get all DataTable tables that have been initialised - optionally you can
	 * select to get only currently visible tables.
	 *
	 *  @param {boolean} [visible=false] Flag to indicate if you want all (default)
	 *    or visible tables only.
	 *  @returns {array} Array of `table` nodes (not DataTable instances) which are
	 *    DataTables
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    $.each( $.fn.dataTable.tables(true), function () {
	 *      $(table).DataTable().columns.adjust();
	 *    } );
	 */
	DataTable.tables = function (visible) {
		var api = false

		if ($.isPlainObject(visible)) {
			api = visible.api
			visible = visible.visible
		}

		var a = DataTable.settings
			.filter(function (o) {
				return !visible || (visible && $(o.nTable).is(":visible")) ? true : false
			})
			.map(function (o) {
				return o.nTable
			})

		return api ? new _Api(a) : a
	}

	/**
	 * Convert from camel case parameters to Hungarian notation. This is made public
	 * for the extensions to provide the same ability as DataTables core to accept
	 * either the 1.9 style Hungarian notation, or the 1.10+ style camelCase
	 * parameters.
	 *
	 *  @param {object} src The model object which holds all parameters that can be
	 *    mapped.
	 *  @param {object} user The object to convert from camel case to Hungarian.
	 *  @param {boolean} force When set to `true`, properties which already have a
	 *    Hungarian value in the `user` object will be overwritten. Otherwise they
	 *    won't be.
	 */
	DataTable.camelToHungarian = _fnCamelToHungarian

	/**
	 *
	 */
	_api_register("$()", function (selector, opts) {
		var rows = this.rows(opts).nodes(), // Get all rows
			jqRows = $(rows)

		return $([].concat(jqRows.filter(selector).toArray(), jqRows.find(selector).toArray()))
	})

	// jQuery functions to operate on the tables
	$.each(["on", "one", "off"], function (i, key) {
		_api_register(key + "()", function (/* event, handler */) {
			var args = Array.prototype.slice.call(arguments)

			// Add the `dt` namespace automatically if it isn't already present
			args[0] = args[0]
				.split(/\s/)
				.map(function (e) {
					return !e.match(/\.dt\b/) ? e + ".dt" : e
				})
				.join(" ")

			var inst = $(this.tables().nodes())
			inst[key].apply(inst, args)
			return this
		})
	})

	_api_register("clear()", function () {
		return this.iterator("table", function (settings) {
			_fnClearTable(settings)
		})
	})

	_api_register("error()", function (msg) {
		return this.iterator("table", function (settings) {
			_fnLog(settings, 0, msg)
		})
	})

	_api_register("settings()", function () {
		return new _Api(this.context, this.context)
	})

	_api_register("init()", function () {
		var ctx = this.context
		return ctx.length ? ctx[0].oInit : null
	})

	_api_register("data()", function () {
		return this.iterator("table", function (settings) {
			return _pluck(settings.aoData, "_aData")
		}).flatten()
	})

	_api_register("trigger()", function (name, args, bubbles) {
		return this.iterator("table", function (settings) {
			return _fnCallbackFire(settings, null, name, args, bubbles)
		}).flatten()
	})

	_api_register("ready()", function (fn) {
		var ctx = this.context

		// Get status of first table
		if (!fn) {
			return ctx.length ? ctx[0]._bInitComplete || false : null
		}

		// Function to run either once the table becomes ready or
		// immediately if it is already ready.
		return this.tables().every(function () {
			if (this.context[0]._bInitComplete) {
				fn.call(this)
			} else {
				this.on("init.dt.DT", function () {
					fn.call(this)
				})
			}
		})
	})

	_api_register("destroy()", function (remove) {
		remove = remove || false

		return this.iterator("table", function (settings) {
			var classes = settings.oClasses
			var table = settings.nTable
			var tbody = settings.nTBody
			var thead = settings.nTHead
			var tfoot = settings.nTFoot
			var jqTable = $(table)
			var jqTbody = $(tbody)
			var jqWrapper = $(settings.nTableWrapper)
			var rows = settings.aoData.map(function (r) {
				return r ? r.nTr : null
			})
			var orderClasses = classes.order

			// Flag to note that the table is currently being destroyed - no action
			// should be taken
			settings.bDestroying = true

			// Fire off the destroy callbacks for plug-ins etc
			_fnCallbackFire(settings, "aoDestroyCallback", "destroy", [settings], true)

			// If not being removed from the document, make all columns visible
			if (!remove) {
				new _Api(settings).columns().visible(true)
			}

			// Blitz all `DT` namespaced events (these are internal events, the
			// lowercase, `dt` events are user subscribed and they are responsible
			// for removing them
			jqWrapper.off(".DT").find(":not(tbody *)").off(".DT")
			$(window).off(".DT-" + settings.sInstance)

			// When scrolling we had to break the table up - restore it
			if (table != thead.parentNode) {
				jqTable.children("thead").detach()
				jqTable.append(thead)
			}

			if (tfoot && table != tfoot.parentNode) {
				jqTable.children("tfoot").detach()
				jqTable.append(tfoot)
			}

			settings.colgroup.remove()

			settings.aaSorting = []
			settings.aaSortingFixed = []
			_fnSortingClasses(settings)

			$("th, td", thead)
				.removeClass(orderClasses.canAsc + " " + orderClasses.canDesc + " " + orderClasses.isAsc + " " + orderClasses.isDesc)
				.css("width", "")

			// Add the TR elements back into the table in their original order
			jqTbody.children().detach()
			jqTbody.append(rows)

			var orig = settings.nTableWrapper.parentNode
			var insertBefore = settings.nTableWrapper.nextSibling

			// Remove the DataTables generated nodes, events and classes
			var removedMethod = remove ? "remove" : "detach"
			jqTable[removedMethod]()
			jqWrapper[removedMethod]()

			// If we need to reattach the table to the document
			if (!remove && orig) {
				// insertBefore acts like appendChild if !arg[1]
				orig.insertBefore(table, insertBefore)

				// Restore the width of the original table - was read from the style property,
				// so we can restore directly to that
				jqTable.css("width", settings.sDestroyWidth).removeClass(classes.table)
			}

			/* Remove the settings object from the settings array */
			var idx = DataTable.settings.indexOf(settings)
			if (idx !== -1) {
				DataTable.settings.splice(idx, 1)
			}
		})
	})

	// Add the `every()` method for rows, columns and cells in a compact form
	$.each(["column", "row", "cell"], function (i, type) {
		_api_register(type + "s().every()", function (fn) {
			var opts = this.selector.opts
			var api = this
			var inst
			var counter = 0

			return this.iterator("every", function (settings, selectedIdx, tableIdx) {
				inst = api[type](selectedIdx, opts)

				if (type === "cell") {
					fn.call(inst, inst[0][0].row, inst[0][0].column, tableIdx, counter)
				} else {
					fn.call(inst, selectedIdx, tableIdx, counter)
				}

				counter++
			})
		})
	})

	// i18n method for extensions to be able to use the language object from the
	// DataTable
	_api_register("i18n()", function (token, def, plural) {
		var ctx = this.context[0]
		var resolved = _fnGetObjectDataFn(token)(ctx.oLanguage)

		if (resolved === undefined) {
			resolved = def
		}

		if ($.isPlainObject(resolved)) {
			resolved = plural !== undefined && resolved[plural] !== undefined ? resolved[plural] : resolved._
		}

		return typeof resolved === "string"
			? resolved.replace("%d", plural) // nb: plural might be undefined,
			: resolved
	})

	/**
	 * Version string for plug-ins to check compatibility. Allowed format is
	 * `a.b.c-d` where: a:int, b:int, c:int, d:string(dev|beta|alpha). `d` is used
	 * only for non-release builds. See https://semver.org/ for more information.
	 *  @member
	 *  @type string
	 *  @default Version number
	 */
	DataTable.version = "2.1.7"

	/**
	 * Private data store, containing all of the settings objects that are
	 * created for the tables on a given page.
	 *
	 * Note that the `DataTable.settings` object is aliased to
	 * `jQuery.fn.dataTableExt` through which it may be accessed and
	 * manipulated, or `jQuery.fn.dataTable.settings`.
	 *  @member
	 *  @type array
	 *  @default []
	 *  @private
	 */
	DataTable.settings = []

	/**
	 * Object models container, for the various models that DataTables has
	 * available to it. These models define the objects that are used to hold
	 * the active state and configuration of the table.
	 *  @namespace
	 */
	DataTable.models = {}

	/**
	 * Template object for the way in which DataTables holds information about
	 * search information for the global filter and individual column filters.
	 *  @namespace
	 */
	DataTable.models.oSearch = {
		/**
		 * Flag to indicate if the filtering should be case insensitive or not
		 */
		caseInsensitive: true,

		/**
		 * Applied search term
		 */
		search: "",

		/**
		 * Flag to indicate if the search term should be interpreted as a
		 * regular expression (true) or not (false) and therefore and special
		 * regex characters escaped.
		 */
		regex: false,

		/**
		 * Flag to indicate if DataTables is to use its smart filtering or not.
		 */
		smart: true,

		/**
		 * Flag to indicate if DataTables should only trigger a search when
		 * the return key is pressed.
		 */
		return: false
	}

	/**
	 * Template object for the way in which DataTables holds information about
	 * each individual row. This is the object format used for the settings
	 * aoData array.
	 *  @namespace
	 */
	DataTable.models.oRow = {
		/**
		 * TR element for the row
		 */
		nTr: null,

		/**
		 * Array of TD elements for each row. This is null until the row has been
		 * created.
		 */
		anCells: null,

		/**
		 * Data object from the original data source for the row. This is either
		 * an array if using the traditional form of DataTables, or an object if
		 * using mData options. The exact type will depend on the passed in
		 * data from the data source, or will be an array if using DOM a data
		 * source.
		 */
		_aData: [],

		/**
		 * Sorting data cache - this array is ostensibly the same length as the
		 * number of columns (although each index is generated only as it is
		 * needed), and holds the data that is used for sorting each column in the
		 * row. We do this cache generation at the start of the sort in order that
		 * the formatting of the sort data need be done only once for each cell
		 * per sort. This array should not be read from or written to by anything
		 * other than the master sorting methods.
		 */
		_aSortData: null,

		/**
		 * Per cell filtering data cache. As per the sort data cache, used to
		 * increase the performance of the filtering in DataTables
		 */
		_aFilterData: null,

		/**
		 * Filtering data cache. This is the same as the cell filtering cache, but
		 * in this case a string rather than an array. This is easily computed with
		 * a join on `_aFilterData`, but is provided as a cache so the join isn't
		 * needed on every search (memory traded for performance)
		 */
		_sFilterRow: null,

		/**
		 * Denote if the original data source was from the DOM, or the data source
		 * object. This is used for invalidating data, so DataTables can
		 * automatically read data from the original source, unless uninstructed
		 * otherwise.
		 */
		src: null,

		/**
		 * Index in the aoData array. This saves an indexOf lookup when we have the
		 * object, but want to know the index
		 */
		idx: -1,

		/**
		 * Cached display value
		 */
		displayData: null
	}

	/**
	 * Template object for the column information object in DataTables. This object
	 * is held in the settings aoColumns array and contains all the information that
	 * DataTables needs about each individual column.
	 *
	 * Note that this object is related to {@link DataTable.defaults.column}
	 * but this one is the internal data store for DataTables's cache of columns.
	 * It should NOT be manipulated outside of DataTables. Any configuration should
	 * be done through the initialisation options.
	 *  @namespace
	 */
	DataTable.models.oColumn = {
		/**
		 * Column index.
		 */
		idx: null,

		/**
		 * A list of the columns that sorting should occur on when this column
		 * is sorted. That this property is an array allows multi-column sorting
		 * to be defined for a column (for example first name / last name columns
		 * would benefit from this). The values are integers pointing to the
		 * columns to be sorted on (typically it will be a single integer pointing
		 * at itself, but that doesn't need to be the case).
		 */
		aDataSort: null,

		/**
		 * Define the sorting directions that are applied to the column, in sequence
		 * as the column is repeatedly sorted upon - i.e. the first value is used
		 * as the sorting direction when the column if first sorted (clicked on).
		 * Sort it again (click again) and it will move on to the next index.
		 * Repeat until loop.
		 */
		asSorting: null,

		/**
		 * Flag to indicate if the column is searchable, and thus should be included
		 * in the filtering or not.
		 */
		bSearchable: null,

		/**
		 * Flag to indicate if the column is sortable or not.
		 */
		bSortable: null,

		/**
		 * Flag to indicate if the column is currently visible in the table or not
		 */
		bVisible: null,

		/**
		 * Store for manual type assignment using the `column.type` option. This
		 * is held in store so we can manipulate the column's `sType` property.
		 */
		_sManualType: null,

		/**
		 * Flag to indicate if HTML5 data attributes should be used as the data
		 * source for filtering or sorting. True is either are.
		 */
		_bAttrSrc: false,

		/**
		 * Developer definable function that is called whenever a cell is created (Ajax source,
		 * etc) or processed for input (DOM source). This can be used as a compliment to mRender
		 * allowing you to modify the DOM element (add background colour for example) when the
		 * element is available.
		 */
		fnCreatedCell: null,

		/**
		 * Function to get data from a cell in a column. You should <b>never</b>
		 * access data directly through _aData internally in DataTables - always use
		 * the method attached to this property. It allows mData to function as
		 * required. This function is automatically assigned by the column
		 * initialisation method
		 */
		fnGetData: null,

		/**
		 * Function to set data for a cell in the column. You should <b>never</b>
		 * set the data directly to _aData internally in DataTables - always use
		 * this method. It allows mData to function as required. This function
		 * is automatically assigned by the column initialisation method
		 */
		fnSetData: null,

		/**
		 * Property to read the value for the cells in the column from the data
		 * source array / object. If null, then the default content is used, if a
		 * function is given then the return from the function is used.
		 */
		mData: null,

		/**
		 * Partner property to mData which is used (only when defined) to get
		 * the data - i.e. it is basically the same as mData, but without the
		 * 'set' option, and also the data fed to it is the result from mData.
		 * This is the rendering method to match the data method of mData.
		 */
		mRender: null,

		/**
		 * The class to apply to all TD elements in the table's TBODY for the column
		 */
		sClass: null,

		/**
		 * When DataTables calculates the column widths to assign to each column,
		 * it finds the longest string in each column and then constructs a
		 * temporary table and reads the widths from that. The problem with this
		 * is that "mmm" is much wider then "iiii", but the latter is a longer
		 * string - thus the calculation can go wrong (doing it properly and putting
		 * it into an DOM object and measuring that is horribly(!) slow). Thus as
		 * a "work around" we provide this option. It will append its value to the
		 * text that is found to be the longest string for the column - i.e. padding.
		 */
		sContentPadding: null,

		/**
		 * Allows a default value to be given for a column's data, and will be used
		 * whenever a null data source is encountered (this can be because mData
		 * is set to null, or because the data source itself is null).
		 */
		sDefaultContent: null,

		/**
		 * Name for the column, allowing reference to the column by name as well as
		 * by index (needs a lookup to work by name).
		 */
		sName: null,

		/**
		 * Custom sorting data type - defines which of the available plug-ins in
		 * afnSortData the custom sorting will use - if any is defined.
		 */
		sSortDataType: "std",

		/**
		 * Class to be applied to the header element when sorting on this column
		 */
		sSortingClass: null,

		/**
		 * Title of the column - what is seen in the TH element (nTh).
		 */
		sTitle: null,

		/**
		 * Column sorting and filtering type
		 */
		sType: null,

		/**
		 * Width of the column
		 */
		sWidth: null,

		/**
		 * Width of the column when it was first "encountered"
		 */
		sWidthOrig: null,

		/** Cached string which is the longest in the column */
		maxLenString: null,

		/**
		 * Store for named searches
		 */
		searchFixed: null
	}

	/*
	 * Developer note: The properties of the object below are given in Hungarian
	 * notation, that was used as the interface for DataTables prior to v1.10, however
	 * from v1.10 onwards the primary interface is camel case. In order to avoid
	 * breaking backwards compatibility utterly with this change, the Hungarian
	 * version is still, internally the primary interface, but is is not documented
	 * - hence the @name tags in each doc comment. This allows a Javascript function
	 * to create a map from Hungarian notation to camel case (going the other direction
	 * would require each property to be listed, which would add around 3K to the size
	 * of DataTables, while this method is about a 0.5K hit).
	 *
	 * Ultimately this does pave the way for Hungarian notation to be dropped
	 * completely, but that is a massive amount of work and will break current
	 * installs (therefore is on-hold until v2).
	 */

	/**
	 * Initialisation options that can be given to DataTables at initialisation
	 * time.
	 *  @namespace
	 */
	DataTable.defaults = {
		/**
		 * An array of data to use for the table, passed in at initialisation which
		 * will be used in preference to any data which is already in the DOM. This is
		 * particularly useful for constructing tables purely in Javascript, for
		 * example with a custom Ajax call.
		 */
		aaData: null,

		/**
		 * If ordering is enabled, then DataTables will perform a first pass sort on
		 * initialisation. You can define which column(s) the sort is performed
		 * upon, and the sorting direction, with this variable. The `sorting` array
		 * should contain an array for each column to be sorted initially containing
		 * the column's index and a direction string ('asc' or 'desc').
		 */
		aaSorting: [[0, "asc"]],

		/**
		 * This parameter is basically identical to the `sorting` parameter, but
		 * cannot be overridden by user interaction with the table. What this means
		 * is that you could have a column (visible or hidden) which the sorting
		 * will always be forced on first - any sorting after that (from the user)
		 * will then be performed as required. This can be useful for grouping rows
		 * together.
		 */
		aaSortingFixed: [],

		/**
		 * DataTables can be instructed to load data to display in the table from a
		 * Ajax source. This option defines how that Ajax call is made and where to.
		 *
		 * The `ajax` property has three different modes of operation, depending on
		 * how it is defined. These are:
		 *
		 * * `string` - Set the URL from where the data should be loaded from.
		 * * `object` - Define properties for `jQuery.ajax`.
		 * * `function` - Custom data get function
		 *
		 * `string`
		 * --------
		 *
		 * As a string, the `ajax` property simply defines the URL from which
		 * DataTables will load data.
		 *
		 * `object`
		 * --------
		 *
		 * As an object, the parameters in the object are passed to
		 * [jQuery.ajax](https://api.jquery.com/jQuery.ajax/) allowing fine control
		 * of the Ajax request. DataTables has a number of default parameters which
		 * you can override using this option. Please refer to the jQuery
		 * documentation for a full description of the options available, although
		 * the following parameters provide additional options in DataTables or
		 * require special consideration:
		 *
		 * * `data` - As with jQuery, `data` can be provided as an object, but it
		 *   can also be used as a function to manipulate the data DataTables sends
		 *   to the server. The function takes a single parameter, an object of
		 *   parameters with the values that DataTables has readied for sending. An
		 *   object may be returned which will be merged into the DataTables
		 *   defaults, or you can add the items to the object that was passed in and
		 *   not return anything from the function. This supersedes `fnServerParams`
		 *   from DataTables 1.9-.
		 *
		 * * `dataSrc` - By default DataTables will look for the property `data` (or
		 *   `aaData` for compatibility with DataTables 1.9-) when obtaining data
		 *   from an Ajax source or for server-side processing - this parameter
		 *   allows that property to be changed. You can use Javascript dotted
		 *   object notation to get a data source for multiple levels of nesting, or
		 *   it my be used as a function. As a function it takes a single parameter,
		 *   the JSON returned from the server, which can be manipulated as
		 *   required, with the returned value being that used by DataTables as the
		 *   data source for the table.
		 *
		 * * `success` - Should not be overridden it is used internally in
		 *   DataTables. To manipulate / transform the data returned by the server
		 *   use `ajax.dataSrc`, or use `ajax` as a function (see below).
		 *
		 * `function`
		 * ----------
		 *
		 * As a function, making the Ajax call is left up to yourself allowing
		 * complete control of the Ajax request. Indeed, if desired, a method other
		 * than Ajax could be used to obtain the required data, such as Web storage
		 * or an AIR database.
		 *
		 * The function is given four parameters and no return is required. The
		 * parameters are:
		 *
		 * 1. _object_ - Data to send to the server
		 * 2. _function_ - Callback function that must be executed when the required
		 *    data has been obtained. That data should be passed into the callback
		 *    as the only parameter
		 * 3. _object_ - DataTables settings object for the table
		 */
		ajax: null,

		/**
		 * This parameter allows you to readily specify the entries in the length drop
		 * down menu that DataTables shows when pagination is enabled. It can be
		 * either a 1D array of options which will be used for both the displayed
		 * option and the value, or a 2D array which will use the array in the first
		 * position as the value, and the array in the second position as the
		 * displayed options (useful for language strings such as 'All').
		 *
		 * Note that the `pageLength` property will be automatically set to the
		 * first value given in this array, unless `pageLength` is also provided.
		 */
		aLengthMenu: [10, 25, 50, 100],

		/**
		 * The `columns` option in the initialisation parameter allows you to define
		 * details about the way individual columns behave. For a full list of
		 * column options that can be set, please see
		 * {@link DataTable.defaults.column}. Note that if you use `columns` to
		 * define your columns, you must have an entry in the array for every single
		 * column that you have in your table (these can be null if you don't which
		 * to specify any options).
		 */
		aoColumns: null,

		/**
		 * Very similar to `columns`, `columnDefs` allows you to target a specific
		 * column, multiple columns, or all columns, using the `targets` property of
		 * each object in the array. This allows great flexibility when creating
		 * tables, as the `columnDefs` arrays can be of any length, targeting the
		 * columns you specifically want. `columnDefs` may use any of the column
		 * options available: {@link DataTable.defaults.column}, but it _must_
		 * have `targets` defined in each object in the array. Values in the `targets`
		 * array may be:
		 *   <ul>
		 *     <li>a string - class name will be matched on the TH for the column</li>
		 *     <li>0 or a positive integer - column index counting from the left</li>
		 *     <li>a negative integer - column index counting from the right</li>
		 *     <li>the string "_all" - all columns (i.e. assign a default)</li>
		 *   </ul>
		 */
		aoColumnDefs: null,

		/**
		 * Basically the same as `search`, this parameter defines the individual column
		 * filtering state at initialisation time. The array must be of the same size
		 * as the number of columns, and each element be an object with the parameters
		 * `search` and `escapeRegex` (the latter is optional). 'null' is also
		 * accepted and the default will be used.
		 */
		aoSearchCols: [],

		/**
		 * Enable or disable automatic column width calculation. This can be disabled
		 * as an optimisation (it takes some time to calculate the widths) if the
		 * tables widths are passed in using `columns`.
		 */
		bAutoWidth: true,

		/**
		 * Deferred rendering can provide DataTables with a huge speed boost when you
		 * are using an Ajax or JS data source for the table. This option, when set to
		 * true, will cause DataTables to defer the creation of the table elements for
		 * each row until they are needed for a draw - saving a significant amount of
		 * time.
		 */
		bDeferRender: true,

		/**
		 * Replace a DataTable which matches the given selector and replace it with
		 * one which has the properties of the new initialisation object passed. If no
		 * table matches the selector, then the new DataTable will be constructed as
		 * per normal.
		 */
		bDestroy: false,

		/**
		 * Enable or disable filtering of data. Filtering in DataTables is "smart" in
		 * that it allows the end user to input multiple words (space separated) and
		 * will match a row containing those words, even if not in the order that was
		 * specified (this allow matching across multiple columns). Note that if you
		 * wish to use filtering in DataTables this must remain 'true' - to remove the
		 * default filtering input box and retain filtering abilities, please use
		 * {@link DataTable.defaults.dom}.
		 */
		bFilter: true,

		/**
		 * Used only for compatiblity with DT1
		 * @deprecated
		 */
		bInfo: true,

		/**
		 * Used only for compatiblity with DT1
		 * @deprecated
		 */
		bLengthChange: true,

		/**
		 * Enable or disable pagination.
		 */
		bPaginate: true,

		/**
		 * Enable or disable the display of a 'processing' indicator when the table is
		 * being processed (e.g. a sort). This is particularly useful for tables with
		 * large amounts of data where it can take a noticeable amount of time to sort
		 * the entries.
		 */
		bProcessing: false,

		/**
		 * Retrieve the DataTables object for the given selector. Note that if the
		 * table has already been initialised, this parameter will cause DataTables
		 * to simply return the object that has already been set up - it will not take
		 * account of any changes you might have made to the initialisation object
		 * passed to DataTables (setting this parameter to true is an acknowledgement
		 * that you understand this). `destroy` can be used to reinitialise a table if
		 * you need.
		 */
		bRetrieve: false,

		/**
		 * When vertical (y) scrolling is enabled, DataTables will force the height of
		 * the table's viewport to the given height at all times (useful for layout).
		 * However, this can look odd when filtering data down to a small data set,
		 * and the footer is left "floating" further down. This parameter (when
		 * enabled) will cause DataTables to collapse the table's viewport down when
		 * the result set will fit within the given Y height.
		 */
		bScrollCollapse: false,

		/**
		 * Configure DataTables to use server-side processing. Note that the
		 * `ajax` parameter must also be given in order to give DataTables a
		 * source to obtain the required data for each draw.
		 */
		bServerSide: false,

		/**
		 * Enable or disable sorting of columns. Sorting of individual columns can be
		 * disabled by the `sortable` option for each column.
		 */
		bSort: true,

		/**
		 * Enable or display DataTables' ability to sort multiple columns at the
		 * same time (activated by shift-click by the user).
		 */
		bSortMulti: true,

		/**
		 * Allows control over whether DataTables should use the top (true) unique
		 * cell that is found for a single column, or the bottom (false - default).
		 * This is useful when using complex headers.
		 */
		bSortCellsTop: null,

		/**
		 * Enable or disable the addition of the classes `sorting\_1`, `sorting\_2` and
		 * `sorting\_3` to the columns which are currently being sorted on. This is
		 * presented as a feature switch as it can increase processing time (while
		 * classes are removed and added) so for large data sets you might want to
		 * turn this off.
		 */
		bSortClasses: true,

		/**
		 * Enable or disable state saving. When enabled HTML5 `localStorage` will be
		 * used to save table display information such as pagination information,
		 * display length, filtering and sorting. As such when the end user reloads
		 * the page the display display will match what thy had previously set up.
		 */
		bStateSave: false,

		/**
		 * This function is called when a TR element is created (and all TD child
		 * elements have been inserted), or registered if using a DOM source, allowing
		 * manipulation of the TR element (adding classes etc).
		 */
		fnCreatedRow: null,

		/**
		 * This function is called on every 'draw' event, and allows you to
		 * dynamically modify any aspect you want about the created DOM.
		 */
		fnDrawCallback: null,

		/**
		 * Identical to fnHeaderCallback() but for the table footer this function
		 * allows you to modify the table footer on every 'draw' event.
		 */
		fnFooterCallback: null,

		/**
		 * When rendering large numbers in the information element for the table
		 * (i.e. "Showing 1 to 10 of 57 entries") DataTables will render large numbers
		 * to have a comma separator for the 'thousands' units (e.g. 1 million is
		 * rendered as "1,000,000") to help readability for the end user. This
		 * function will override the default method DataTables uses.
		 */
		fnFormatNumber: function (toFormat) {
			return toFormat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.oLanguage.sThousands)
		},

		/**
		 * This function is called on every 'draw' event, and allows you to
		 * dynamically modify the header row. This can be used to calculate and
		 * display useful information about the table.
		 */
		fnHeaderCallback: null,

		/**
		 * The information element can be used to convey information about the current
		 * state of the table. Although the internationalisation options presented by
		 * DataTables are quite capable of dealing with most customisations, there may
		 * be times where you wish to customise the string further. This callback
		 * allows you to do exactly that.
		 */
		fnInfoCallback: null,

		/**
		 * Called when the table has been initialised. Normally DataTables will
		 * initialise sequentially and there will be no need for this function,
		 * however, this does not hold true when using external language information
		 * since that is obtained using an async XHR call.
		 */
		fnInitComplete: null,

		/**
		 * Called at the very start of each table draw and can be used to cancel the
		 * draw by returning false, any other return (including undefined) results in
		 * the full draw occurring).
		 */
		fnPreDrawCallback: null,

		/**
		 * This function allows you to 'post process' each row after it have been
		 * generated for each table draw, but before it is rendered on screen. This
		 * function might be used for setting the row class name etc.
		 */
		fnRowCallback: null,

		/**
		 * Load the table state. With this function you can define from where, and how, the
		 * state of a table is loaded. By default DataTables will load from `localStorage`
		 * but you might wish to use a server-side database or cookies.
		 */
		fnStateLoadCallback: function (settings) {
			try {
				return JSON.parse((settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem("DataTables_" + settings.sInstance + "_" + location.pathname))
			} catch (e) {
				return {}
			}
		},

		/**
		 * Callback which allows modification of the saved state prior to loading that state.
		 * This callback is called when the table is loading state from the stored data, but
		 * prior to the settings object being modified by the saved state. Note that for
		 * plug-in authors, you should use the `stateLoadParams` event to load parameters for
		 * a plug-in.
		 */
		fnStateLoadParams: null,

		/**
		 * Callback that is called when the state has been loaded from the state saving method
		 * and the DataTables settings object has been modified as a result of the loaded state.
		 */
		fnStateLoaded: null,

		/**
		 * Save the table state. This function allows you to define where and how the state
		 * information for the table is stored By default DataTables will use `localStorage`
		 * but you might wish to use a server-side database or cookies.
		 */
		fnStateSaveCallback: function (settings, data) {
			try {
				;(settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem("DataTables_" + settings.sInstance + "_" + location.pathname, JSON.stringify(data))
			} catch (e) {
				// noop
			}
		},

		/**
		 * Callback which allows modification of the state to be saved. Called when the table
		 * has changed state a new state save is required. This method allows modification of
		 * the state saving object prior to actually doing the save, including addition or
		 * other state properties or modification. Note that for plug-in authors, you should
		 * use the `stateSaveParams` event to save parameters for a plug-in.
		 */
		fnStateSaveParams: null,

		/**
		 * Duration for which the saved state information is considered valid. After this period
		 * has elapsed the state will be returned to the default.
		 * Value is given in seconds.
		 */
		iStateDuration: 7200,

		/**
		 * Number of rows to display on a single page when using pagination. If
		 * feature enabled (`lengthChange`) then the end user will be able to override
		 * this to a custom setting using a pop-up menu.
		 */
		iDisplayLength: 10,

		/**
		 * Define the starting point for data display when using DataTables with
		 * pagination. Note that this parameter is the number of records, rather than
		 * the page number, so if you have 10 records per page and want to start on
		 * the third page, it should be "20".
		 */
		iDisplayStart: 0,

		/**
		 * By default DataTables allows keyboard navigation of the table (sorting, paging,
		 * and filtering) by adding a `tabindex` attribute to the required elements. This
		 * allows you to tab through the controls and press the enter key to activate them.
		 * The tabindex is default 0, meaning that the tab follows the flow of the document.
		 * You can overrule this using this parameter if you wish. Use a value of -1 to
		 * disable built-in keyboard navigation.
		 */
		iTabIndex: 0,

		/**
		 * Classes that DataTables assigns to the various components and features
		 * that it adds to the HTML table. This allows classes to be configured
		 * during initialisation in addition to through the static
		 * {@link DataTable.ext.oStdClasses} object).
		 */
		oClasses: {},

		/**
		 * All strings that DataTables uses in the user interface that it creates
		 * are defined in this object, allowing you to modified them individually or
		 * completely replace them all as required.
		 */
		oLanguage: {
			/**
			 * Strings that are used for WAI-ARIA labels and controls only (these are not
			 * actually visible on the page, but will be read by screenreaders, and thus
			 * must be internationalised as well).
			 */
			oAria: {
				/**
				 * ARIA label that is added to the table headers when the column may be sorted
				 */
				orderable: ": Activate to sort",

				/**
				 * ARIA label that is added to the table headers when the column is currently being sorted
				 */
				orderableReverse: ": Activate to invert sorting",

				/**
				 * ARIA label that is added to the table headers when the column is currently being
				 * sorted and next step is to remove sorting
				 */
				orderableRemove: ": Activate to remove sorting",

				paginate: {
					first: "First",
					last: "Last",
					next: "Next",
					previous: "Previous",
					number: ""
				}
			},

			/**
			 * Pagination string used by DataTables for the built-in pagination
			 * control types.
			 */
			oPaginate: {
				/**
				 * Label and character for first page button («)
				 */
				sFirst: "\u00AB",

				/**
				 * Last page button (»)
				 */
				sLast: "\u00BB",

				/**
				 * Next page button (›)
				 */
				sNext: "\u203A",

				/**
				 * Previous page button (‹)
				 */
				sPrevious: "\u2039"
			},

			/**
			 * Plural object for the data type the table is showing
			 */
			entries: {
				_: "entries",
				1: "entry"
			},

			/**
			 * This string is shown in preference to `zeroRecords` when the table is
			 * empty of data (regardless of filtering). Note that this is an optional
			 * parameter - if it is not given, the value of `zeroRecords` will be used
			 * instead (either the default or given value).
			 */
			sEmptyTable: "No data available in table",

			/**
			 * This string gives information to the end user about the information
			 * that is current on display on the page. The following tokens can be
			 * used in the string and will be dynamically replaced as the table
			 * display updates. This tokens can be placed anywhere in the string, or
			 * removed as needed by the language requires:
			 *
			 * * `\_START\_` - Display index of the first record on the current page
			 * * `\_END\_` - Display index of the last record on the current page
			 * * `\_TOTAL\_` - Number of records in the table after filtering
			 * * `\_MAX\_` - Number of records in the table without filtering
			 * * `\_PAGE\_` - Current page number
			 * * `\_PAGES\_` - Total number of pages of data in the table
			 */
			sInfo: "Showing _START_ to _END_ of _TOTAL_ _ENTRIES-TOTAL_",

			/**
			 * Display information string for when the table is empty. Typically the
			 * format of this string should match `info`.
			 */
			sInfoEmpty: "Showing 0 to 0 of 0 _ENTRIES-TOTAL_",

			/**
			 * When a user filters the information in a table, this string is appended
			 * to the information (`info`) to give an idea of how strong the filtering
			 * is. The variable _MAX_ is dynamically updated.
			 */
			sInfoFiltered: "(filtered from _MAX_ total _ENTRIES-MAX_)",

			/**
			 * If can be useful to append extra information to the info string at times,
			 * and this variable does exactly that. This information will be appended to
			 * the `info` (`infoEmpty` and `infoFiltered` in whatever combination they are
			 * being used) at all times.
			 */
			sInfoPostFix: "",

			/**
			 * This decimal place operator is a little different from the other
			 * language options since DataTables doesn't output floating point
			 * numbers, so it won't ever use this for display of a number. Rather,
			 * what this parameter does is modify the sort methods of the table so
			 * that numbers which are in a format which has a character other than
			 * a period (`.`) as a decimal place will be sorted numerically.
			 *
			 * Note that numbers with different decimal places cannot be shown in
			 * the same table and still be sortable, the table must be consistent.
			 * However, multiple different tables on the page can use different
			 * decimal place characters.
			 */
			sDecimal: "",

			/**
			 * DataTables has a build in number formatter (`formatNumber`) which is
			 * used to format large numbers that are used in the table information.
			 * By default a comma is used, but this can be trivially changed to any
			 * character you wish with this parameter.
			 */
			sThousands: ",",

			/**
			 * Detail the action that will be taken when the drop down menu for the
			 * pagination length option is changed. The '_MENU_' variable is replaced
			 * with a default select list of 10, 25, 50 and 100, and can be replaced
			 * with a custom select box if required.
			 */
			sLengthMenu: "_MENU_ _ENTRIES_ per page",

			/**
			 * When using Ajax sourced data and during the first draw when DataTables is
			 * gathering the data, this message is shown in an empty row in the table to
			 * indicate to the end user the the data is being loaded. Note that this
			 * parameter is not used when loading data by server-side processing, just
			 * Ajax sourced data with client-side processing.
			 */
			sLoadingRecords: "Loading...",

			/**
			 * Text which is displayed when the table is processing a user action
			 * (usually a sort command or similar).
			 */
			sProcessing: "",

			/**
			 * Details the actions that will be taken when the user types into the
			 * filtering input text box. The variable "_INPUT_", if used in the string,
			 * is replaced with the HTML text box for the filtering input allowing
			 * control over where it appears in the string. If "_INPUT_" is not given
			 * then the input box is appended to the string automatically.
			 */
			sSearch: "Search:",

			/**
			 * Assign a `placeholder` attribute to the search `input` element
			 *  @type string
			 *  @default
			 *
			 *  @dtopt Language
			 *  @name DataTable.defaults.language.searchPlaceholder
			 */
			sSearchPlaceholder: "",

			/**
			 * All of the language information can be stored in a file on the
			 * server-side, which DataTables will look up if this parameter is passed.
			 * It must store the URL of the language file, which is in a JSON format,
			 * and the object has the same properties as the oLanguage object in the
			 * initialiser object (i.e. the above parameters). Please refer to one of
			 * the example language files to see how this works in action.
			 */
			sUrl: "",

			/**
			 * Text shown inside the table records when the is no information to be
			 * displayed after filtering. `emptyTable` is shown when there is simply no
			 * information in the table at all (regardless of filtering).
			 */
			sZeroRecords: "No matching records found"
		},

		/** The initial data order is reversed when `desc` ordering */
		orderDescReverse: true,

		/**
		 * This parameter allows you to have define the global filtering state at
		 * initialisation time. As an object the `search` parameter must be
		 * defined, but all other parameters are optional. When `regex` is true,
		 * the search string will be treated as a regular expression, when false
		 * (default) it will be treated as a straight string. When `smart`
		 * DataTables will use it's smart filtering methods (to word match at
		 * any point in the data), when false this will not be done.
		 */
		oSearch: $.extend({}, DataTable.models.oSearch),

		/**
		 * Table and control layout. This replaces the legacy `dom` option.
		 */
		layout: {
			topStart: "pageLength",
			topEnd: "search",
			bottomStart: "info",
			bottomEnd: "paging"
		},

		/**
		 * Legacy DOM layout option
		 */
		sDom: null,

		/**
		 * Search delay option. This will throttle full table searches that use the
		 * DataTables provided search input element (it does not effect calls to
		 * `dt-api search()`, providing a delay before the search is made.
		 */
		searchDelay: null,

		/**
		 * DataTables features six different built-in options for the buttons to
		 * display for pagination control:
		 *
		 * * `numbers` - Page number buttons only
		 * * `simple` - 'Previous' and 'Next' buttons only
		 * * 'simple_numbers` - 'Previous' and 'Next' buttons, plus page numbers
		 * * `full` - 'First', 'Previous', 'Next' and 'Last' buttons
		 * * `full_numbers` - 'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers
		 * * `first_last_numbers` - 'First' and 'Last' buttons, plus page numbers
		 */
		sPaginationType: "",

		/**
		 * Enable horizontal scrolling. When a table is too wide to fit into a
		 * certain layout, or you have a large number of columns in the table, you
		 * can enable x-scrolling to show the table in a viewport, which can be
		 * scrolled. This property can be `true` which will allow the table to
		 * scroll horizontally when needed, or any CSS unit, or a number (in which
		 * case it will be treated as a pixel measurement). Setting as simply `true`
		 * is recommended.
		 */
		sScrollX: "",

		/**
		 * This property can be used to force a DataTable to use more width than it
		 * might otherwise do when x-scrolling is enabled. For example if you have a
		 * table which requires to be well spaced, this parameter is useful for
		 * "over-sizing" the table, and thus forcing scrolling. This property can by
		 * any CSS unit, or a number (in which case it will be treated as a pixel
		 * measurement).
		 */
		sScrollXInner: "",

		/**
		 * Enable vertical scrolling. Vertical scrolling will constrain the DataTable
		 * to the given height, and enable scrolling for any data which overflows the
		 * current viewport. This can be used as an alternative to paging to display
		 * a lot of data in a small area (although paging and scrolling can both be
		 * enabled at the same time). This property can be any CSS unit, or a number
		 * (in which case it will be treated as a pixel measurement).
		 */
		sScrollY: "",

		/**
		 * __Deprecated__ The functionality provided by this parameter has now been
		 * superseded by that provided through `ajax`, which should be used instead.
		 *
		 * Set the HTTP method that is used to make the Ajax call for server-side
		 * processing or Ajax sourced data.
		 */
		sServerMethod: "GET",

		/**
		 * DataTables makes use of renderers when displaying HTML elements for
		 * a table. These renderers can be added or modified by plug-ins to
		 * generate suitable mark-up for a site. For example the Bootstrap
		 * integration plug-in for DataTables uses a paging button renderer to
		 * display pagination buttons in the mark-up required by Bootstrap.
		 *
		 * For further information about the renderers available see
		 * DataTable.ext.renderer
		 */
		renderer: null,

		/**
		 * Set the data property name that DataTables should use to get a row's id
		 * to set as the `id` property in the node.
		 */
		rowId: "DT_RowId",

		/**
		 * Caption value
		 */
		caption: null,

		/**
		 * For server-side processing - use the data from the DOM for the first draw
		 */
		iDeferLoading: null
	}

	_fnHungarianMap(DataTable.defaults)

	/*
	 * Developer note - See note in model.defaults.js about the use of Hungarian
	 * notation and camel case.
	 */

	/**
	 * Column options that can be given to DataTables at initialisation time.
	 *  @namespace
	 */
	DataTable.defaults.column = {
		/**
		 * Define which column(s) an order will occur on for this column. This
		 * allows a column's ordering to take multiple columns into account when
		 * doing a sort or use the data from a different column. For example first
		 * name / last name columns make sense to do a multi-column sort over the
		 * two columns.
		 */
		aDataSort: null,
		iDataSort: -1,

		ariaTitle: "",

		/**
		 * You can control the default ordering direction, and even alter the
		 * behaviour of the sort handler (i.e. only allow ascending ordering etc)
		 * using this parameter.
		 */
		asSorting: ["asc", "desc", ""],

		/**
		 * Enable or disable filtering on the data in this column.
		 */
		bSearchable: true,

		/**
		 * Enable or disable ordering on this column.
		 */
		bSortable: true,

		/**
		 * Enable or disable the display of this column.
		 */
		bVisible: true,

		/**
		 * Developer definable function that is called whenever a cell is created (Ajax source,
		 * etc) or processed for input (DOM source). This can be used as a compliment to mRender
		 * allowing you to modify the DOM element (add background colour for example) when the
		 * element is available.
		 */
		fnCreatedCell: null,

		/**
		 * This property can be used to read data from any data source property,
		 * including deeply nested objects / properties. `data` can be given in a
		 * number of different ways which effect its behaviour:
		 *
		 * * `integer` - treated as an array index for the data source. This is the
		 *   default that DataTables uses (incrementally increased for each column).
		 * * `string` - read an object property from the data source. There are
		 *   three 'special' options that can be used in the string to alter how
		 *   DataTables reads the data from the source object:
		 *    * `.` - Dotted Javascript notation. Just as you use a `.` in
		 *      Javascript to read from nested objects, so to can the options
		 *      specified in `data`. For example: `browser.version` or
		 *      `browser.name`. If your object parameter name contains a period, use
		 *      `\\` to escape it - i.e. `first\\.name`.
		 *    * `[]` - Array notation. DataTables can automatically combine data
		 *      from and array source, joining the data with the characters provided
		 *      between the two brackets. For example: `name[, ]` would provide a
		 *      comma-space separated list from the source array. If no characters
		 *      are provided between the brackets, the original array source is
		 *      returned.
		 *    * `()` - Function notation. Adding `()` to the end of a parameter will
		 *      execute a function of the name given. For example: `browser()` for a
		 *      simple function on the data source, `browser.version()` for a
		 *      function in a nested property or even `browser().version` to get an
		 *      object property if the function called returns an object. Note that
		 *      function notation is recommended for use in `render` rather than
		 *      `data` as it is much simpler to use as a renderer.
		 * * `null` - use the original data source for the row rather than plucking
		 *   data directly from it. This action has effects on two other
		 *   initialisation options:
		 *    * `defaultContent` - When null is given as the `data` option and
		 *      `defaultContent` is specified for the column, the value defined by
		 *      `defaultContent` will be used for the cell.
		 *    * `render` - When null is used for the `data` option and the `render`
		 *      option is specified for the column, the whole data source for the
		 *      row is used for the renderer.
		 * * `function` - the function given will be executed whenever DataTables
		 *   needs to set or get the data for a cell in the column. The function
		 *   takes three parameters:
		 *    * Parameters:
		 *      * `{array|object}` The data source for the row
		 *      * `{string}` The type call data requested - this will be 'set' when
		 *        setting data or 'filter', 'display', 'type', 'sort' or undefined
		 *        when gathering data. Note that when `undefined` is given for the
		 *        type DataTables expects to get the raw data for the object back<
		 *      * `{*}` Data to set when the second parameter is 'set'.
		 *    * Return:
		 *      * The return value from the function is not required when 'set' is
		 *        the type of call, but otherwise the return is what will be used
		 *        for the data requested.
		 *
		 * Note that `data` is a getter and setter option. If you just require
		 * formatting of data for output, you will likely want to use `render` which
		 * is simply a getter and thus simpler to use.
		 *
		 * Note that prior to DataTables 1.9.2 `data` was called `mDataProp`. The
		 * name change reflects the flexibility of this property and is consistent
		 * with the naming of mRender. If 'mDataProp' is given, then it will still
		 * be used by DataTables, as it automatically maps the old name to the new
		 * if required.
		 */
		mData: null,

		/**
		 * This property is the rendering partner to `data` and it is suggested that
		 * when you want to manipulate data for display (including filtering,
		 * sorting etc) without altering the underlying data for the table, use this
		 * property. `render` can be considered to be the the read only companion to
		 * `data` which is read / write (then as such more complex). Like `data`
		 * this option can be given in a number of different ways to effect its
		 * behaviour:
		 *
		 * * `integer` - treated as an array index for the data source. This is the
		 *   default that DataTables uses (incrementally increased for each column).
		 * * `string` - read an object property from the data source. There are
		 *   three 'special' options that can be used in the string to alter how
		 *   DataTables reads the data from the source object:
		 *    * `.` - Dotted Javascript notation. Just as you use a `.` in
		 *      Javascript to read from nested objects, so to can the options
		 *      specified in `data`. For example: `browser.version` or
		 *      `browser.name`. If your object parameter name contains a period, use
		 *      `\\` to escape it - i.e. `first\\.name`.
		 *    * `[]` - Array notation. DataTables can automatically combine data
		 *      from and array source, joining the data with the characters provided
		 *      between the two brackets. For example: `name[, ]` would provide a
		 *      comma-space separated list from the source array. If no characters
		 *      are provided between the brackets, the original array source is
		 *      returned.
		 *    * `()` - Function notation. Adding `()` to the end of a parameter will
		 *      execute a function of the name given. For example: `browser()` for a
		 *      simple function on the data source, `browser.version()` for a
		 *      function in a nested property or even `browser().version` to get an
		 *      object property if the function called returns an object.
		 * * `object` - use different data for the different data types requested by
		 *   DataTables ('filter', 'display', 'type' or 'sort'). The property names
		 *   of the object is the data type the property refers to and the value can
		 *   defined using an integer, string or function using the same rules as
		 *   `render` normally does. Note that an `_` option _must_ be specified.
		 *   This is the default value to use if you haven't specified a value for
		 *   the data type requested by DataTables.
		 * * `function` - the function given will be executed whenever DataTables
		 *   needs to set or get the data for a cell in the column. The function
		 *   takes three parameters:
		 *    * Parameters:
		 *      * {array|object} The data source for the row (based on `data`)
		 *      * {string} The type call data requested - this will be 'filter',
		 *        'display', 'type' or 'sort'.
		 *      * {array|object} The full data source for the row (not based on
		 *        `data`)
		 *    * Return:
		 *      * The return value from the function is what will be used for the
		 *        data requested.
		 */
		mRender: null,

		/**
		 * Change the cell type created for the column - either TD cells or TH cells. This
		 * can be useful as TH cells have semantic meaning in the table body, allowing them
		 * to act as a header for a row (you may wish to add scope='row' to the TH elements).
		 */
		sCellType: "td",

		/**
		 * Class to give to each cell in this column.
		 */
		sClass: "",

		/**
		 * When DataTables calculates the column widths to assign to each column,
		 * it finds the longest string in each column and then constructs a
		 * temporary table and reads the widths from that. The problem with this
		 * is that "mmm" is much wider then "iiii", but the latter is a longer
		 * string - thus the calculation can go wrong (doing it properly and putting
		 * it into an DOM object and measuring that is horribly(!) slow). Thus as
		 * a "work around" we provide this option. It will append its value to the
		 * text that is found to be the longest string for the column - i.e. padding.
		 * Generally you shouldn't need this!
		 */
		sContentPadding: "",

		/**
		 * Allows a default value to be given for a column's data, and will be used
		 * whenever a null data source is encountered (this can be because `data`
		 * is set to null, or because the data source itself is null).
		 */
		sDefaultContent: null,

		/**
		 * This parameter is only used in DataTables' server-side processing. It can
		 * be exceptionally useful to know what columns are being displayed on the
		 * client side, and to map these to database fields. When defined, the names
		 * also allow DataTables to reorder information from the server if it comes
		 * back in an unexpected order (i.e. if you switch your columns around on the
		 * client-side, your server-side code does not also need updating).
		 */
		sName: "",

		/**
		 * Defines a data source type for the ordering which can be used to read
		 * real-time information from the table (updating the internally cached
		 * version) prior to ordering. This allows ordering to occur on user
		 * editable elements such as form inputs.
		 */
		sSortDataType: "std",

		/**
		 * The title of this column.
		 */
		sTitle: null,

		/**
		 * The type allows you to specify how the data for this column will be
		 * ordered. Four types (string, numeric, date and html (which will strip
		 * HTML tags before ordering)) are currently available. Note that only date
		 * formats understood by Javascript's Date() object will be accepted as type
		 * date. For example: "Mar 26, 2008 5:03 PM". May take the values: 'string',
		 * 'numeric', 'date' or 'html' (by default). Further types can be adding
		 * through plug-ins.
		 */
		sType: null,

		/**
		 * Defining the width of the column, this parameter may take any CSS value
		 * (3em, 20px etc). DataTables applies 'smart' widths to columns which have not
		 * been given a specific width through this interface ensuring that the table
		 * remains readable.
		 */
		sWidth: null
	}

	_fnHungarianMap(DataTable.defaults.column)

	/**
	 * DataTables settings object - this holds all the information needed for a
	 * given table, including configuration, data and current application of the
	 * table options. DataTables does not have a single instance for each DataTable
	 * with the settings attached to that instance, but rather instances of the
	 * DataTable "class" are created on-the-fly as needed (typically by a
	 * $().dataTable() call) and the settings object is then applied to that
	 * instance.
	 *
	 * Note that this object is related to {@link DataTable.defaults} but this
	 * one is the internal data store for DataTables's cache of columns. It should
	 * NOT be manipulated outside of DataTables. Any configuration should be done
	 * through the initialisation options.
	 */
	DataTable.models.oSettings = {
		/**
		 * Primary features of DataTables and their enablement state.
		 */
		oFeatures: {
			/**
			 * Flag to say if DataTables should automatically try to calculate the
			 * optimum table and columns widths (true) or not (false).
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bAutoWidth: null,

			/**
			 * Delay the creation of TR and TD elements until they are actually
			 * needed by a driven page draw. This can give a significant speed
			 * increase for Ajax source and Javascript source data, but makes no
			 * difference at all for DOM and server-side processing tables.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bDeferRender: null,

			/**
			 * Enable filtering on the table or not. Note that if this is disabled
			 * then there is no filtering at all on the table, including fnFilter.
			 * To just remove the filtering input use sDom and remove the 'f' option.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bFilter: null,

			/**
			 * Used only for compatiblity with DT1
			 * @deprecated
			 */
			bInfo: true,

			/**
			 * Used only for compatiblity with DT1
			 * @deprecated
			 */
			bLengthChange: true,

			/**
			 * Pagination enabled or not. Note that if this is disabled then length
			 * changing must also be disabled.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bPaginate: null,

			/**
			 * Processing indicator enable flag whenever DataTables is enacting a
			 * user request - typically an Ajax request for server-side processing.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bProcessing: null,

			/**
			 * Server-side processing enabled flag - when enabled DataTables will
			 * get all data from the server for every draw - there is no filtering,
			 * sorting or paging done on the client-side.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bServerSide: null,

			/**
			 * Sorting enablement flag.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bSort: null,

			/**
			 * Multi-column sorting
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bSortMulti: null,

			/**
			 * Apply a class to the columns which are being sorted to provide a
			 * visual highlight or not. This can slow things down when enabled since
			 * there is a lot of DOM interaction.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bSortClasses: null,

			/**
			 * State saving enablement flag.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bStateSave: null
		},

		/**
		 * Scrolling settings for a table.
		 */
		oScroll: {
			/**
			 * When the table is shorter in height than sScrollY, collapse the
			 * table container down to the height of the table (when true).
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			bCollapse: null,

			/**
			 * Width of the scrollbar for the web-browser's platform. Calculated
			 * during table initialisation.
			 */
			iBarWidth: 0,

			/**
			 * Viewport width for horizontal scrolling. Horizontal scrolling is
			 * disabled if an empty string.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			sX: null,

			/**
			 * Width to expand the table to when using x-scrolling. Typically you
			 * should not need to use this.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 *  @deprecated
			 */
			sXInner: null,

			/**
			 * Viewport height for vertical scrolling. Vertical scrolling is disabled
			 * if an empty string.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			sY: null
		},

		/**
		 * Language information for the table.
		 */
		oLanguage: {
			/**
			 * Information callback function. See
			 * {@link DataTable.defaults.fnInfoCallback}
			 */
			fnInfoCallback: null
		},

		/**
		 * Browser support parameters
		 */
		oBrowser: {
			/**
			 * Determine if the vertical scrollbar is on the right or left of the
			 * scrolling container - needed for rtl language layout, although not
			 * all browsers move the scrollbar (Safari).
			 */
			bScrollbarLeft: false,

			/**
			 * Browser scrollbar width
			 */
			barWidth: 0
		},

		ajax: null,

		/**
		 * Array referencing the nodes which are used for the features. The
		 * parameters of this object match what is allowed by sDom - i.e.
		 *   <ul>
		 *     <li>'l' - Length changing</li>
		 *     <li>'f' - Filtering input</li>
		 *     <li>'t' - The table!</li>
		 *     <li>'i' - Information</li>
		 *     <li>'p' - Pagination</li>
		 *     <li>'r' - pRocessing</li>
		 *   </ul>
		 */
		aanFeatures: [],

		/**
		 * Store data information - see {@link DataTable.models.oRow} for detailed
		 * information.
		 */
		aoData: [],

		/**
		 * Array of indexes which are in the current display (after filtering etc)
		 */
		aiDisplay: [],

		/**
		 * Array of indexes for display - no filtering
		 */
		aiDisplayMaster: [],

		/**
		 * Map of row ids to data indexes
		 */
		aIds: {},

		/**
		 * Store information about each column that is in use
		 */
		aoColumns: [],

		/**
		 * Store information about the table's header
		 */
		aoHeader: [],

		/**
		 * Store information about the table's footer
		 */
		aoFooter: [],

		/**
		 * Store the applied global search information in case we want to force a
		 * research or compare the old search to a new one.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		oPreviousSearch: {},

		/**
		 * Store for named searches
		 */
		searchFixed: {},

		/**
		 * Store the applied search for each column - see
		 * {@link DataTable.models.oSearch} for the format that is used for the
		 * filtering information for each column.
		 */
		aoPreSearchCols: [],

		/**
		 * Sorting that is applied to the table. Note that the inner arrays are
		 * used in the following manner:
		 * <ul>
		 *   <li>Index 0 - column number</li>
		 *   <li>Index 1 - current sorting direction</li>
		 * </ul>
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		aaSorting: null,

		/**
		 * Sorting that is always applied to the table (i.e. prefixed in front of
		 * aaSorting).
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		aaSortingFixed: [],

		/**
		 * If restoring a table - we should restore its width
		 */
		sDestroyWidth: 0,

		/**
		 * Callback functions array for every time a row is inserted (i.e. on a draw).
		 */
		aoRowCallback: [],

		/**
		 * Callback functions for the header on each draw.
		 */
		aoHeaderCallback: [],

		/**
		 * Callback function for the footer on each draw.
		 */
		aoFooterCallback: [],

		/**
		 * Array of callback functions for draw callback functions
		 */
		aoDrawCallback: [],

		/**
		 * Array of callback functions for row created function
		 */
		aoRowCreatedCallback: [],

		/**
		 * Callback functions for just before the table is redrawn. A return of
		 * false will be used to cancel the draw.
		 */
		aoPreDrawCallback: [],

		/**
		 * Callback functions for when the table has been initialised.
		 */
		aoInitComplete: [],

		/**
		 * Callbacks for modifying the settings to be stored for state saving, prior to
		 * saving state.
		 */
		aoStateSaveParams: [],

		/**
		 * Callbacks for modifying the settings that have been stored for state saving
		 * prior to using the stored values to restore the state.
		 */
		aoStateLoadParams: [],

		/**
		 * Callbacks for operating on the settings object once the saved state has been
		 * loaded
		 */
		aoStateLoaded: [],

		/**
		 * Cache the table ID for quick access
		 */
		sTableId: "",

		/**
		 * The TABLE node for the main table
		 */
		nTable: null,

		/**
		 * Permanent ref to the thead element
		 */
		nTHead: null,

		/**
		 * Permanent ref to the tfoot element - if it exists
		 */
		nTFoot: null,

		/**
		 * Permanent ref to the tbody element
		 */
		nTBody: null,

		/**
		 * Cache the wrapper node (contains all DataTables controlled elements)
		 */
		nTableWrapper: null,

		/**
		 * Indicate if all required information has been read in
		 */
		bInitialised: false,

		/**
		 * Information about open rows. Each object in the array has the parameters
		 * 'nTr' and 'nParent'
		 */
		aoOpenRows: [],

		/**
		 * Dictate the positioning of DataTables' control elements - see
		 * {@link DataTable.model.oInit.sDom}.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		sDom: null,

		/**
		 * Search delay (in mS)
		 */
		searchDelay: null,

		/**
		 * Which type of pagination should be used.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		sPaginationType: "two_button",

		/**
		 * Number of paging controls on the page. Only used for backwards compatibility
		 */
		pagingControls: 0,

		/**
		 * The state duration (for `stateSave`) in seconds.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		iStateDuration: 0,

		/**
		 * Array of callback functions for state saving. Each array element is an
		 * object with the following parameters:
		 *   <ul>
		 *     <li>function:fn - function to call. Takes two parameters, oSettings
		 *       and the JSON string to save that has been thus far created. Returns
		 *       a JSON string to be inserted into a json object
		 *       (i.e. '"param": [ 0, 1, 2]')</li>
		 *     <li>string:sName - name of callback</li>
		 *   </ul>
		 */
		aoStateSave: [],

		/**
		 * Array of callback functions for state loading. Each array element is an
		 * object with the following parameters:
		 *   <ul>
		 *     <li>function:fn - function to call. Takes two parameters, oSettings
		 *       and the object stored. May return false to cancel state loading</li>
		 *     <li>string:sName - name of callback</li>
		 *   </ul>
		 */
		aoStateLoad: [],

		/**
		 * State that was saved. Useful for back reference
		 */
		oSavedState: null,

		/**
		 * State that was loaded. Useful for back reference
		 */
		oLoadedState: null,

		/**
		 * Note if draw should be blocked while getting data
		 */
		bAjaxDataGet: true,

		/**
		 * The last jQuery XHR object that was used for server-side data gathering.
		 * This can be used for working with the XHR information in one of the
		 * callbacks
		 */
		jqXHR: null,

		/**
		 * JSON returned from the server in the last Ajax request
		 */
		json: undefined,

		/**
		 * Data submitted as part of the last Ajax request
		 */
		oAjaxData: undefined,

		/**
		 * Send the XHR HTTP method - GET or POST (could be PUT or DELETE if
		 * required).
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		sServerMethod: null,

		/**
		 * Format numbers for display.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		fnFormatNumber: null,

		/**
		 * List of options that can be used for the user selectable length menu.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		aLengthMenu: null,

		/**
		 * Counter for the draws that the table does. Also used as a tracker for
		 * server-side processing
		 */
		iDraw: 0,

		/**
		 * Indicate if a redraw is being done - useful for Ajax
		 */
		bDrawing: false,

		/**
		 * Draw index (iDraw) of the last error when parsing the returned data
		 */
		iDrawError: -1,

		/**
		 * Paging display length
		 */
		_iDisplayLength: 10,

		/**
		 * Paging start point - aiDisplay index
		 */
		_iDisplayStart: 0,

		/**
		 * Server-side processing - number of records in the result set
		 * (i.e. before filtering), Use fnRecordsTotal rather than
		 * this property to get the value of the number of records, regardless of
		 * the server-side processing setting.
		 */
		_iRecordsTotal: 0,

		/**
		 * Server-side processing - number of records in the current display set
		 * (i.e. after filtering). Use fnRecordsDisplay rather than
		 * this property to get the value of the number of records, regardless of
		 * the server-side processing setting.
		 */
		_iRecordsDisplay: 0,

		/**
		 * The classes to use for the table
		 */
		oClasses: {},

		/**
		 * Flag attached to the settings object so you can check in the draw
		 * callback if filtering has been done in the draw. Deprecated in favour of
		 * events.
		 *  @deprecated
		 */
		bFiltered: false,

		/**
		 * Flag attached to the settings object so you can check in the draw
		 * callback if sorting has been done in the draw. Deprecated in favour of
		 * events.
		 *  @deprecated
		 */
		bSorted: false,

		/**
		 * Indicate that if multiple rows are in the header and there is more than
		 * one unique cell per column, if the top one (true) or bottom one (false)
		 * should be used for sorting / title by DataTables.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		bSortCellsTop: null,

		/**
		 * Initialisation object that is used for the table
		 */
		oInit: null,

		/**
		 * Destroy callback functions - for plug-ins to attach themselves to the
		 * destroy so they can clean up markup and events.
		 */
		aoDestroyCallback: [],

		/**
		 * Get the number of records in the current record set, before filtering
		 */
		fnRecordsTotal: function () {
			return _fnDataSource(this) == "ssp" ? this._iRecordsTotal * 1 : this.aiDisplayMaster.length
		},

		/**
		 * Get the number of records in the current record set, after filtering
		 */
		fnRecordsDisplay: function () {
			return _fnDataSource(this) == "ssp" ? this._iRecordsDisplay * 1 : this.aiDisplay.length
		},

		/**
		 * Get the display end point - aiDisplay index
		 */
		fnDisplayEnd: function () {
			var len = this._iDisplayLength,
				start = this._iDisplayStart,
				calc = start + len,
				records = this.aiDisplay.length,
				features = this.oFeatures,
				paginate = features.bPaginate

			if (features.bServerSide) {
				return paginate === false || len === -1 ? start + records : Math.min(start + len, this._iRecordsDisplay)
			} else {
				return !paginate || calc > records || len === -1 ? records : calc
			}
		},

		/**
		 * The DataTables object for this table
		 */
		oInstance: null,

		/**
		 * Unique identifier for each instance of the DataTables object. If there
		 * is an ID on the table node, then it takes that value, otherwise an
		 * incrementing internal counter is used.
		 */
		sInstance: null,

		/**
		 * tabindex attribute value that is added to DataTables control elements, allowing
		 * keyboard navigation of the table and its controls.
		 */
		iTabIndex: 0,

		/**
		 * DIV container for the footer scrolling table if scrolling
		 */
		nScrollHead: null,

		/**
		 * DIV container for the footer scrolling table if scrolling
		 */
		nScrollFoot: null,

		/**
		 * Last applied sort
		 */
		aLastSort: [],

		/**
		 * Stored plug-in instances
		 */
		oPlugins: {},

		/**
		 * Function used to get a row's id from the row's data
		 */
		rowIdFn: null,

		/**
		 * Data location where to store a row's id
		 */
		rowId: null,

		caption: "",

		captionNode: null,

		colgroup: null,

		/** Delay loading of data */
		deferLoading: null,

		/** Allow auto type detection */
		typeDetect: true
	}

	/**
	 * Extension object for DataTables that is used to provide all extension
	 * options.
	 *
	 * Note that the `DataTable.ext` object is available through
	 * `jQuery.fn.dataTable.ext` where it may be accessed and manipulated. It is
	 * also aliased to `jQuery.fn.dataTableExt` for historic reasons.
	 *  @namespace
	 *  @extends DataTable.models.ext
	 */

	var extPagination = DataTable.ext.pager

	// Paging buttons configuration
	$.extend(extPagination, {
		simple: function () {
			return ["previous", "next"]
		},

		full: function () {
			return ["first", "previous", "next", "last"]
		},

		numbers: function () {
			return ["numbers"]
		},

		simple_numbers: function () {
			return ["previous", "numbers", "next"]
		},

		full_numbers: function () {
			return ["first", "previous", "numbers", "next", "last"]
		},

		first_last: function () {
			return ["first", "last"]
		},

		first_last_numbers: function () {
			return ["first", "numbers", "last"]
		},

		// For testing and plug-ins to use
		_numbers: _pagingNumbers,

		// Number of number buttons - legacy, use `numbers` option for paging feature
		numbers_length: 7
	})

	$.extend(true, DataTable.ext.renderer, {
		pagingButton: {
			_: function (settings, buttonType, content, active, disabled) {
				var classes = settings.oClasses.paging
				var btnClasses = [classes.button]
				var btn

				if (active) {
					btnClasses.push(classes.active)
				}

				if (disabled) {
					btnClasses.push(classes.disabled)
				}

				if (buttonType === "ellipsis") {
					btn = $('<span class="ellipsis"></span>').html(content)[0]
				} else {
					btn = $("<button>", {
						class: btnClasses.join(" "),
						role: "link",
						type: "button"
					}).html(content)
				}

				return {
					display: btn,
					clicker: btn
				}
			}
		},

		pagingContainer: {
			_: function (settings, buttons) {
				// No wrapping element - just append directly to the host
				return buttons
			}
		}
	})

	// Common function to remove new lines, strip HTML and diacritic control
	var _filterString = function (stripHtml, normalize) {
		return function (str) {
			if (_empty(str) || typeof str !== "string") {
				return str
			}

			str = str.replace(_re_new_lines, " ")

			if (stripHtml) {
				str = _stripHtml(str)
			}

			if (normalize) {
				str = _normalize(str, false)
			}

			return str
		}
	}

	/*
	 * Public helper functions. These aren't used internally by DataTables, or
	 * called by any of the options passed into DataTables, but they can be used
	 * externally by developers working with DataTables. They are helper functions
	 * to make working with DataTables a little bit easier.
	 */

	/**
	 * Common logic for moment, luxon or a date action.
	 *
	 * Happens after __mldObj, so don't need to call `resolveWindowsLibs` again
	 */
	function __mld(dtLib, momentFn, luxonFn, dateFn, arg1) {
		if (__moment) {
			return dtLib[momentFn](arg1)
		} else if (__luxon) {
			return dtLib[luxonFn](arg1)
		}

		return dateFn ? dtLib[dateFn](arg1) : dtLib
	}

	var __mlWarning = false
	var __luxon // Can be assigned in DateTeble.use()
	var __moment // Can be assigned in DateTeble.use()

	/**
	 *
	 */
	function resolveWindowLibs() {
		if (window.luxon && !__luxon) {
			__luxon = window.luxon
		}

		if (window.moment && !__moment) {
			__moment = window.moment
		}
	}

	function __mldObj(d, format, locale) {
		var dt

		resolveWindowLibs()

		if (__moment) {
			dt = __moment.utc(d, format, locale, true)

			if (!dt.isValid()) {
				return null
			}
		} else if (__luxon) {
			dt = format && typeof d === "string" ? __luxon.DateTime.fromFormat(d, format) : __luxon.DateTime.fromISO(d)

			if (!dt.isValid) {
				return null
			}

			dt.setLocale(locale)
		} else if (!format) {
			// No format given, must be ISO
			dt = new Date(d)
		} else {
			if (!__mlWarning) {
				alert("DataTables warning: Formatted date without Moment.js or Luxon - https://datatables.net/tn/17")
			}

			__mlWarning = true
		}

		return dt
	}

	// Wrapper for date, datetime and time which all operate the same way with the exception of
	// the output string for auto locale support
	function __mlHelper(localeString) {
		return function (from, to, locale, def) {
			// Luxon and Moment support
			// Argument shifting
			if (arguments.length === 0) {
				locale = "en"
				to = null // means toLocaleString
				from = null // means iso8601
			} else if (arguments.length === 1) {
				locale = "en"
				to = from
				from = null
			} else if (arguments.length === 2) {
				locale = to
				to = from
				from = null
			}

			var typeName = "datetime" + (to ? "-" + to : "")

			// Add type detection and sorting specific to this date format - we need to be able to identify
			// date type columns as such, rather than as numbers in extensions. Hence the need for this.
			if (!DataTable.ext.type.order[typeName]) {
				DataTable.type(typeName, {
					detect: function (d) {
						// The renderer will give the value to type detect as the type!
						return d === typeName ? typeName : false
					},
					order: {
						pre: function (d) {
							// The renderer gives us Moment, Luxon or Date obects for the sorting, all of which have a
							// `valueOf` which gives milliseconds epoch
							return d.valueOf()
						}
					},
					className: "dt-right"
				})
			}

			return function (d, type) {
				// Allow for a default value
				if (d === null || d === undefined) {
					if (def === "--now") {
						// We treat everything as UTC further down, so no changes are
						// made, as such need to get the local date / time as if it were
						// UTC
						var local = new Date()
						d = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds()))
					} else {
						d = ""
					}
				}

				if (type === "type") {
					// Typing uses the type name for fast matching
					return typeName
				}

				if (d === "") {
					return type !== "sort" ? "" : __mldObj("0000-01-01 00:00:00", null, locale)
				}

				// Shortcut. If `from` and `to` are the same, we are using the renderer to
				// format for ordering, not display - its already in the display format.
				if (to !== null && from === to && type !== "sort" && type !== "type" && !(d instanceof Date)) {
					return d
				}

				var dt = __mldObj(d, from, locale)

				if (dt === null) {
					return d
				}

				if (type === "sort") {
					return dt
				}

				var formatted = to === null ? __mld(dt, "toDate", "toJSDate", "")[localeString]() : __mld(dt, "format", "toFormat", "toISOString", to)

				// XSS protection
				return type === "display" ? _escapeHtml(formatted) : formatted
			}
		}
	}

	// Based on locale, determine standard number formatting
	// Fallback for legacy browsers is US English
	var __thousands = ","
	var __decimal = "."

	if (window.Intl !== undefined) {
		try {
			var num = new Intl.NumberFormat().formatToParts(100000.1)

			for (var i = 0; i < num.length; i++) {
				if (num[i].type === "group") {
					__thousands = num[i].value
				} else if (num[i].type === "decimal") {
					__decimal = num[i].value
				}
			}
		} catch (e) {
			// noop
		}
	}

	// Formatted date time detection - use by declaring the formats you are going to use
	DataTable.datetime = function (format, locale) {
		var typeName = "datetime-" + format

		if (!locale) {
			locale = "en"
		}

		if (!DataTable.ext.type.order[typeName]) {
			DataTable.type(typeName, {
				detect: function (d) {
					var dt = __mldObj(d, format, locale)
					return d === "" || dt ? typeName : false
				},
				order: {
					pre: function (d) {
						return __mldObj(d, format, locale) || 0
					}
				},
				className: "dt-right"
			})
		}
	}

	/**
	 * Helpers for `columns.render`.
	 *
	 * The options defined here can be used with the `columns.render` initialisation
	 * option to provide a display renderer. The following functions are defined:
	 *
	 * * `moment` - Uses the MomentJS library to convert from a given format into another.
	 * This renderer has three overloads:
	 *   * 1 parameter:
	 *     * `string` - Format to convert to (assumes input is ISO8601 and locale is `en`)
	 *   * 2 parameters:
	 *     * `string` - Format to convert from
	 *     * `string` - Format to convert to. Assumes `en` locale
	 *   * 3 parameters:
	 *     * `string` - Format to convert from
	 *     * `string` - Format to convert to
	 *     * `string` - Locale
	 * * `number` - Will format numeric data (defined by `columns.data`) for
	 *   display, retaining the original unformatted data for sorting and filtering.
	 *   It takes 5 parameters:
	 *   * `string` - Thousands grouping separator
	 *   * `string` - Decimal point indicator
	 *   * `integer` - Number of decimal points to show
	 *   * `string` (optional) - Prefix.
	 *   * `string` (optional) - Postfix (/suffix).
	 * * `text` - Escape HTML to help prevent XSS attacks. It has no optional
	 *   parameters.
	 *
	 * @example
	 *   // Column definition using the number renderer
	 *   {
	 *     data: "salary",
	 *     render: $.fn.dataTable.render.number( '\'', '.', 0, '$' )
	 *   }
	 *
	 * @namespace
	 */
	DataTable.render = {
		date: __mlHelper("toLocaleDateString"),
		datetime: __mlHelper("toLocaleString"),
		time: __mlHelper("toLocaleTimeString"),
		number: function (thousands, decimal, precision, prefix, postfix) {
			// Auto locale detection
			if (thousands === null || thousands === undefined) {
				thousands = __thousands
			}

			if (decimal === null || decimal === undefined) {
				decimal = __decimal
			}

			return {
				display: function (d) {
					if (typeof d !== "number" && typeof d !== "string") {
						return d
					}

					if (d === "" || d === null) {
						return d
					}

					var negative = d < 0 ? "-" : ""
					var flo = parseFloat(d)
					var abs = Math.abs(flo)

					// Scientific notation for large and small numbers
					if (abs >= 100000000000 || (abs < 0.0001 && abs !== 0)) {
						var exp = flo.toExponential(precision).split(/e\+?/)
						return exp[0] + " x 10<sup>" + exp[1] + "</sup>"
					}

					// If NaN then there isn't much formatting that we can do - just
					// return immediately, escaping any HTML (this was supposed to
					// be a number after all)
					if (isNaN(flo)) {
						return _escapeHtml(d)
					}

					flo = flo.toFixed(precision)
					d = Math.abs(flo)

					var intPart = parseInt(d, 10)
					var floatPart = precision ? decimal + (d - intPart).toFixed(precision).substring(2) : ""

					// If zero, then can't have a negative prefix
					if (intPart === 0 && parseFloat(floatPart) === 0) {
						negative = ""
					}

					return negative + (prefix || "") + intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + floatPart + (postfix || "")
				}
			}
		},

		text: function () {
			return {
				display: _escapeHtml,
				filter: _escapeHtml
			}
		}
	}

	var _extTypes = DataTable.ext.type

	// Get / set type
	DataTable.type = function (name, prop, val) {
		if (!prop) {
			return {
				className: _extTypes.className[name],
				detect: _extTypes.detect.find(function (fn) {
					return fn._name === name
				}),
				order: {
					pre: _extTypes.order[name + "-pre"],
					asc: _extTypes.order[name + "-asc"],
					desc: _extTypes.order[name + "-desc"]
				},
				render: _extTypes.render[name],
				search: _extTypes.search[name]
			}
		}

		var setProp = function (prop, propVal) {
			_extTypes[prop][name] = propVal
		}
		var setDetect = function (detect) {
			// `detect` can be a function or an object - we set a name
			// property for either - that is used for the detection
			Object.defineProperty(detect, "_name", { value: name })

			var idx = _extTypes.detect.findIndex(function (item) {
				return item._name === name
			})

			if (idx === -1) {
				_extTypes.detect.unshift(detect)
			} else {
				_extTypes.detect.splice(idx, 1, detect)
			}
		}
		var setOrder = function (obj) {
			_extTypes.order[name + "-pre"] = obj.pre // can be undefined
			_extTypes.order[name + "-asc"] = obj.asc // can be undefined
			_extTypes.order[name + "-desc"] = obj.desc // can be undefined
		}

		// prop is optional
		if (val === undefined) {
			val = prop
			prop = null
		}

		if (prop === "className") {
			setProp("className", val)
		} else if (prop === "detect") {
			setDetect(val)
		} else if (prop === "order") {
			setOrder(val)
		} else if (prop === "render") {
			setProp("render", val)
		} else if (prop === "search") {
			setProp("search", val)
		} else if (!prop) {
			if (val.className) {
				setProp("className", val.className)
			}

			if (val.detect !== undefined) {
				setDetect(val.detect)
			}

			if (val.order) {
				setOrder(val.order)
			}

			if (val.render !== undefined) {
				setProp("render", val.render)
			}

			if (val.search !== undefined) {
				setProp("search", val.search)
			}
		}
	}

	// Get a list of types
	DataTable.types = function () {
		return _extTypes.detect.map(function (fn) {
			return fn._name
		})
	}

	var __diacriticSort = function (a, b) {
		a = a !== null && a !== undefined ? a.toString().toLowerCase() : ""
		b = b !== null && b !== undefined ? b.toString().toLowerCase() : ""

		// Checked for `navigator.languages` support in `oneOf` so this code can't execute in old
		// Safari and thus can disable this check
		// eslint-disable-next-line compat/compat
		return a.localeCompare(b, navigator.languages[0] || navigator.language, {
			numeric: true,
			ignorePunctuation: true
		})
	}

	//
	// Built in data types
	//

	DataTable.type("string", {
		detect: function () {
			return "string"
		},
		order: {
			pre: function (a) {
				// This is a little complex, but faster than always calling toString,
				// http://jsperf.com/tostring-v-check
				return _empty(a) && typeof a !== "boolean" ? "" : typeof a === "string" ? a.toLowerCase() : !a.toString ? "" : a.toString()
			}
		},
		search: _filterString(false, true)
	})

	DataTable.type("string-utf8", {
		detect: {
			allOf: function (d) {
				return true
			},
			oneOf: function (d) {
				// At least one data point must contain a non-ASCII character
				// This line will also check if navigator.languages is supported or not. If not (Safari 10.0-)
				// this data type won't be supported.
				// eslint-disable-next-line compat/compat
				return !_empty(d) && navigator.languages && typeof d === "string" && d.match(/[^\x00-\x7F]/)
			}
		},
		order: {
			asc: __diacriticSort,
			desc: function (a, b) {
				return __diacriticSort(a, b) * -1
			}
		},
		search: _filterString(false, true)
	})

	DataTable.type("html", {
		detect: {
			allOf: function (d) {
				return _empty(d) || (typeof d === "string" && d.indexOf("<") !== -1)
			},
			oneOf: function (d) {
				// At least one data point must contain a `<`
				return !_empty(d) && typeof d === "string" && d.indexOf("<") !== -1
			}
		},
		order: {
			pre: function (a) {
				return _empty(a) ? "" : a.replace ? _stripHtml(a).trim().toLowerCase() : a + ""
			}
		},
		search: _filterString(true, true)
	})

	DataTable.type("date", {
		className: "dt-type-date",
		detect: {
			allOf: function (d) {
				// V8 tries _very_ hard to make a string passed into `Date.parse()`
				// valid, so we need to use a regex to restrict date formats. Use a
				// plug-in for anything other than ISO8601 style strings
				if (d && !(d instanceof Date) && !_re_date.test(d)) {
					return null
				}
				var parsed = Date.parse(d)
				return (parsed !== null && !isNaN(parsed)) || _empty(d)
			},
			oneOf: function (d) {
				// At least one entry must be a date or a string with a date
				return d instanceof Date || (typeof d === "string" && _re_date.test(d))
			}
		},
		order: {
			pre: function (d) {
				var ts = Date.parse(d)
				return isNaN(ts) ? -Infinity : ts
			}
		}
	})

	DataTable.type("html-num-fmt", {
		className: "dt-type-numeric",
		detect: {
			allOf: function (d, settings) {
				var decimal = settings.oLanguage.sDecimal
				return _htmlNumeric(d, decimal, true, false)
			},
			oneOf: function (d, settings) {
				// At least one data point must contain a numeric value
				var decimal = settings.oLanguage.sDecimal
				return _htmlNumeric(d, decimal, true, false)
			}
		},
		order: {
			pre: function (d, s) {
				var dp = s.oLanguage.sDecimal
				return __numericReplace(d, dp, _re_html, _re_formatted_numeric)
			}
		},
		search: _filterString(true, true)
	})

	DataTable.type("html-num", {
		className: "dt-type-numeric",
		detect: {
			allOf: function (d, settings) {
				var decimal = settings.oLanguage.sDecimal
				return _htmlNumeric(d, decimal, false, true)
			},
			oneOf: function (d, settings) {
				// At least one data point must contain a numeric value
				var decimal = settings.oLanguage.sDecimal
				return _htmlNumeric(d, decimal, false, false)
			}
		},
		order: {
			pre: function (d, s) {
				var dp = s.oLanguage.sDecimal
				return __numericReplace(d, dp, _re_html)
			}
		},
		search: _filterString(true, true)
	})

	DataTable.type("num-fmt", {
		className: "dt-type-numeric",
		detect: {
			allOf: function (d, settings) {
				var decimal = settings.oLanguage.sDecimal
				return _isNumber(d, decimal, true, true)
			},
			oneOf: function (d, settings) {
				// At least one data point must contain a numeric value
				var decimal = settings.oLanguage.sDecimal
				return _isNumber(d, decimal, true, false)
			}
		},
		order: {
			pre: function (d, s) {
				var dp = s.oLanguage.sDecimal
				return __numericReplace(d, dp, _re_formatted_numeric)
			}
		}
	})

	DataTable.type("num", {
		className: "dt-type-numeric",
		detect: {
			allOf: function (d, settings) {
				var decimal = settings.oLanguage.sDecimal
				return _isNumber(d, decimal, false, true)
			},
			oneOf: function (d, settings) {
				// At least one data point must contain a numeric value
				var decimal = settings.oLanguage.sDecimal
				return _isNumber(d, decimal, false, false)
			}
		},
		order: {
			pre: function (d, s) {
				var dp = s.oLanguage.sDecimal
				return __numericReplace(d, dp)
			}
		}
	})

	var __numericReplace = function (d, decimalPlace, re1, re2) {
		if (d !== 0 && (!d || d === "-")) {
			return -Infinity
		}

		var type = typeof d

		if (type === "number" || type === "bigint") {
			return d
		}

		// If a decimal place other than `.` is used, it needs to be given to the
		// function so we can detect it and replace with a `.` which is the only
		// decimal place Javascript recognises - it is not locale aware.
		if (decimalPlace) {
			d = _numToDecimal(d, decimalPlace)
		}

		if (d.replace) {
			if (re1) {
				d = d.replace(re1, "")
			}

			if (re2) {
				d = d.replace(re2, "")
			}
		}

		return d * 1
	}

	$.extend(true, DataTable.ext.renderer, {
		footer: {
			_: function (settings, cell, classes) {
				cell.addClass(classes.tfoot.cell)
			}
		},

		header: {
			_: function (settings, cell, classes) {
				cell.addClass(classes.thead.cell)

				if (!settings.oFeatures.bSort) {
					cell.addClass(classes.order.none)
				}

				var legacyTop = settings.bSortCellsTop
				var headerRows = cell.closest("thead").find("tr")
				var rowIdx = cell.parent().index()

				// Conditions to not apply the ordering icons
				if (
					// Cells and rows which have the attribute to disable the icons
					cell.attr("data-dt-order") === "disable" ||
					cell.parent().attr("data-dt-order") === "disable" ||
					// Legacy support for `orderCellsTop`. If it is set, then cells
					// which are not in the top or bottom row of the header (depending
					// on the value) do not get the sorting classes applied to them
					(legacyTop === true && rowIdx !== 0) ||
					(legacyTop === false && rowIdx !== headerRows.length - 1)
				) {
					return
				}

				// No additional mark-up required
				// Attach a sort listener to update on sort - note that using the
				// `DT` namespace will allow the event to be removed automatically
				// on destroy, while the `dt` namespaced event is the one we are
				// listening for
				$(settings.nTable).on("order.dt.DT column-visibility.dt.DT", function (e, ctx) {
					if (settings !== ctx) {
						// need to check this this is the host
						return // table, not a nested one
					}

					var sorting = ctx.sortDetails

					if (!sorting) {
						return
					}

					var i
					var orderClasses = classes.order
					var columns = ctx.api.columns(cell)
					var col = settings.aoColumns[columns.flatten()[0]]
					var orderable = columns.orderable().includes(true)
					var ariaType = ""
					var indexes = columns.indexes()
					var sortDirs = columns.orderable(true).flatten()
					var orderedColumns = _pluck(sorting, "col")

					cell
						.removeClass(orderClasses.isAsc + " " + orderClasses.isDesc)
						.toggleClass(orderClasses.none, !orderable)
						.toggleClass(orderClasses.canAsc, orderable && sortDirs.includes("asc"))
						.toggleClass(orderClasses.canDesc, orderable && sortDirs.includes("desc"))

					// Determine if all of the columns that this cell covers are included in the
					// current ordering
					var isOrdering = true

					for (i = 0; i < indexes.length; i++) {
						if (!orderedColumns.includes(indexes[i])) {
							isOrdering = false
						}
					}

					if (isOrdering) {
						// Get the ordering direction for the columns under this cell
						// Note that it is possible for a cell to be asc and desc sorting
						// (column spanning cells)
						var orderDirs = columns.order()

						cell.addClass(orderDirs.includes("asc") ? orderClasses.isAsc : "" + orderDirs.includes("desc") ? orderClasses.isDesc : "")
					}

					// Find the first visible column that has ordering applied to it - it get's
					// the aria information, as the ARIA spec says that only one column should
					// be marked with aria-sort
					var firstVis = -1 // column index

					for (i = 0; i < orderedColumns.length; i++) {
						if (settings.aoColumns[orderedColumns[i]].bVisible) {
							firstVis = orderedColumns[i]
							break
						}
					}

					if (indexes[0] == firstVis) {
						var firstSort = sorting[0]
						var sortOrder = col.asSorting

						cell.attr("aria-sort", firstSort.dir === "asc" ? "ascending" : "descending")

						// Determine if the next click will remove sorting or change the sort
						ariaType = !sortOrder[firstSort.index + 1] ? "Remove" : "Reverse"
					} else {
						cell.removeAttr("aria-sort")
					}

					cell.attr("aria-label", orderable ? col.ariaTitle + ctx.api.i18n("oAria.orderable" + ariaType) : col.ariaTitle)

					// Make the headers tab-able for keyboard navigation
					if (orderable) {
						cell.find(".dt-column-title").attr("role", "button")
						cell.attr("tabindex", 0)
					}
				})
			}
		},

		layout: {
			_: function (settings, container, items) {
				var classes = settings.oClasses.layout
				var row = $("<div/>")
					.attr("id", items.id || null)
					.addClass(items.className || classes.row)
					.appendTo(container)

				$.each(items, function (key, val) {
					if (key === "id" || key === "className") {
						return
					}

					var klass = ""

					if (val.table) {
						row.addClass(classes.tableRow)
						klass += classes.tableCell + " "
					}

					if (key === "start") {
						klass += classes.start
					} else if (key === "end") {
						klass += classes.end
					} else {
						klass += classes.full
					}

					$("<div/>")
						.attr({
							id: val.id || null,
							class: val.className ? val.className : classes.cell + " " + klass
						})
						.append(val.contents)
						.appendTo(row)
				})
			}
		}
	})

	DataTable.feature = {}

	// Third parameter is internal only!
	DataTable.feature.register = function (name, cb, legacy) {
		DataTable.ext.features[name] = cb

		if (legacy) {
			_ext.feature.push({
				cFeature: legacy,
				fnInit: cb
			})
		}
	}

	function _divProp(el, prop, val) {
		if (val) {
			el[prop] = val
		}
	}

	DataTable.feature.register("div", function (settings, opts) {
		var n = $("<div>")[0]

		if (opts) {
			_divProp(n, "className", opts.className)
			_divProp(n, "id", opts.id)
			_divProp(n, "innerHTML", opts.html)
			_divProp(n, "textContent", opts.text)
		}

		return n
	})

	DataTable.feature.register(
		"info",
		function (settings, opts) {
			// For compatibility with the legacy `info` top level option
			if (!settings.oFeatures.bInfo) {
				return null
			}

			var lang = settings.oLanguage,
				tid = settings.sTableId,
				n = $("<div/>", {
					class: settings.oClasses.info.container
				})

			opts = $.extend(
				{
					callback: lang.fnInfoCallback,
					empty: lang.sInfoEmpty,
					postfix: lang.sInfoPostFix,
					search: lang.sInfoFiltered,
					text: lang.sInfo
				},
				opts
			)

			// Update display on each draw
			settings.aoDrawCallback.push(function (s) {
				_fnUpdateInfo(s, opts, n)
			})

			// For the first info display in the table, we add a callback and aria information.
			if (!settings._infoEl) {
				n.attr({
					"aria-live": "polite",
					id: tid + "_info",
					role: "status"
				})

				// Table is described by our info div
				$(settings.nTable).attr("aria-describedby", tid + "_info")

				settings._infoEl = n
			}

			return n
		},
		"i"
	)

	/**
	 * Update the information elements in the display
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnUpdateInfo(settings, opts, node) {
		var start = settings._iDisplayStart + 1,
			end = settings.fnDisplayEnd(),
			max = settings.fnRecordsTotal(),
			total = settings.fnRecordsDisplay(),
			out = total ? opts.text : opts.empty

		if (total !== max) {
			// Record set after filtering
			out += " " + opts.search
		}

		// Convert the macros
		out += opts.postfix
		out = _fnMacros(settings, out)

		if (opts.callback) {
			out = opts.callback.call(settings.oInstance, settings, start, end, max, total, out)
		}

		node.html(out)

		_fnCallbackFire(settings, null, "info", [settings, node[0], out])
	}

	var __searchCounter = 0

	// opts
	// - text
	// - placeholder
	DataTable.feature.register(
		"search",
		function (settings, opts) {
			// Don't show the input if filtering isn't available on the table
			if (!settings.oFeatures.bFilter) {
				return null
			}

			var classes = settings.oClasses.search
			var tableId = settings.sTableId
			var language = settings.oLanguage
			var previousSearch = settings.oPreviousSearch
			var input = '<input type="search" class="' + classes.input + '"/>'

			opts = $.extend(
				{
					placeholder: language.sSearchPlaceholder,
					processing: false,
					text: language.sSearch
				},
				opts
			)

			// The _INPUT_ is optional - is appended if not present
			if (opts.text.indexOf("_INPUT_") === -1) {
				opts.text += "_INPUT_"
			}

			opts.text = _fnMacros(settings, opts.text)

			// We can put the <input> outside of the label if it is at the start or end
			// which helps improve accessability (not all screen readers like implicit
			// for elements).
			var end = opts.text.match(/_INPUT_$/)
			var start = opts.text.match(/^_INPUT_/)
			var removed = opts.text.replace(/_INPUT_/, "")
			var str = "<label>" + opts.text + "</label>"

			if (start) {
				str = "_INPUT_<label>" + removed + "</label>"
			} else if (end) {
				str = "<label>" + removed + "</label>_INPUT_"
			}

			var filter = $("<div>")
				.addClass(classes.container)
				.append(str.replace(/_INPUT_/, input))

			// add for and id to label and input
			filter.find("label").attr("for", "dt-search-" + __searchCounter)
			filter.find("input").attr("id", "dt-search-" + __searchCounter)
			__searchCounter++

			var searchFn = function (event) {
				var val = this.value

				if (previousSearch.return && event.key !== "Enter") {
					return
				}

				/* Now do the filter */
				if (val != previousSearch.search) {
					_fnProcessingRun(settings, opts.processing, function () {
						previousSearch.search = val

						_fnFilterComplete(settings, previousSearch)

						// Need to redraw, without resorting
						settings._iDisplayStart = 0
						_fnDraw(settings)
					})
				}
			}

			var searchDelay = settings.searchDelay !== null ? settings.searchDelay : 0

			var jqFilter = $("input", filter)
				.val(previousSearch.search)
				.attr("placeholder", opts.placeholder)
				.on("keyup.DT search.DT input.DT paste.DT cut.DT", searchDelay ? DataTable.util.debounce(searchFn, searchDelay) : searchFn)
				.on("mouseup.DT", function (e) {
					// Edge fix! Edge 17 does not trigger anything other than mouse events when clicking
					// on the clear icon (Edge bug 17584515). This is safe in other browsers as `searchFn`
					// checks the value to see if it has changed. In other browsers it won't have.
					setTimeout(function () {
						searchFn.call(jqFilter[0], e)
					}, 10)
				})
				.on("keypress.DT", function (e) {
					/* Prevent form submission */
					if (e.keyCode == 13) {
						return false
					}
				})
				.attr("aria-controls", tableId)

			// Update the input elements whenever the table is filtered
			$(settings.nTable).on("search.dt.DT", function (ev, s) {
				if (settings === s && jqFilter[0] !== document.activeElement) {
					jqFilter.val(typeof previousSearch.search !== "function" ? previousSearch.search : "")
				}
			})

			return filter
		},
		"f"
	)

	// opts
	// - type - button configuration
	// - buttons - number of buttons to show - must be odd
	DataTable.feature.register(
		"paging",
		function (settings, opts) {
			// Don't show the paging input if the table doesn't have paging enabled
			if (!settings.oFeatures.bPaginate) {
				return null
			}

			opts = $.extend(
				{
					buttons: DataTable.ext.pager.numbers_length,
					type: settings.sPaginationType,
					boundaryNumbers: true,
					firstLast: true,
					previousNext: true,
					numbers: true
				},
				opts
			)

			var host = $("<div/>")
				.addClass(settings.oClasses.paging.container + (opts.type ? " paging_" + opts.type : ""))
				.append($("<nav>").attr("aria-label", "pagination").addClass(settings.oClasses.paging.nav))
			var draw = function () {
				_pagingDraw(settings, host.children(), opts)
			}

			settings.aoDrawCallback.push(draw)

			// Responsive redraw of paging control
			$(settings.nTable).on("column-sizing.dt.DT", draw)

			return host
		},
		"p"
	)

	/**
	 * Dynamically create the button type array based on the configuration options.
	 * This will only happen if the paging type is not defined.
	 */
	function _pagingDynamic(opts) {
		var out = []

		if (opts.numbers) {
			out.push("numbers")
		}

		if (opts.previousNext) {
			out.unshift("previous")
			out.push("next")
		}

		if (opts.firstLast) {
			out.unshift("first")
			out.push("last")
		}

		return out
	}

	function _pagingDraw(settings, host, opts) {
		if (!settings._bInitComplete) {
			return
		}

		var plugin = opts.type ? DataTable.ext.pager[opts.type] : _pagingDynamic,
			aria = settings.oLanguage.oAria.paginate || {},
			start = settings._iDisplayStart,
			len = settings._iDisplayLength,
			visRecords = settings.fnRecordsDisplay(),
			all = len === -1,
			page = all ? 0 : Math.ceil(start / len),
			pages = all ? 1 : Math.ceil(visRecords / len),
			buttons = [],
			buttonEls = [],
			buttonsNested = plugin(opts).map(function (val) {
				return val === "numbers" ? _pagingNumbers(page, pages, opts.buttons, opts.boundaryNumbers) : val
			})

		// .flat() would be better, but not supported in old Safari
		buttons = buttons.concat.apply(buttons, buttonsNested)

		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i]

			var btnInfo = _pagingButtonInfo(settings, button, page, pages)
			var btn = _fnRenderer(settings, "pagingButton")(settings, button, btnInfo.display, btnInfo.active, btnInfo.disabled)

			var ariaLabel = typeof button === "string" ? aria[button] : aria.number ? aria.number + (button + 1) : null

			// Common attributes
			$(btn.clicker).attr({
				"aria-controls": settings.sTableId,
				"aria-disabled": btnInfo.disabled ? "true" : null,
				"aria-current": btnInfo.active ? "page" : null,
				"aria-label": ariaLabel,
				"data-dt-idx": button,
				tabIndex: btnInfo.disabled ? -1 : settings.iTabIndex ? settings.iTabIndex : null // `0` doesn't need a tabIndex since it is the default
			})

			if (typeof button !== "number") {
				$(btn.clicker).addClass(button)
			}

			_fnBindAction(btn.clicker, { action: button }, function (e) {
				e.preventDefault()

				_fnPageChange(settings, e.data.action, true)
			})

			buttonEls.push(btn.display)
		}

		var wrapped = _fnRenderer(settings, "pagingContainer")(settings, buttonEls)

		var activeEl = host.find(document.activeElement).data("dt-idx")

		host.empty().append(wrapped)

		if (activeEl !== undefined) {
			host.find("[data-dt-idx=" + activeEl + "]").trigger("focus")
		}

		// Responsive - check if the buttons are over two lines based on the
		// height of the buttons and the container.
		if (
			buttonEls.length && // any buttons
			opts.buttons > 1 && // prevent infinite
			$(host).height() >= $(buttonEls[0]).outerHeight() * 2 - 10
		) {
			_pagingDraw(settings, host, $.extend({}, opts, { buttons: opts.buttons - 2 }))
		}
	}

	/**
	 * Get properties for a button based on the current paging state of the table
	 *
	 * @param {*} settings DT settings object
	 * @param {*} button The button type in question
	 * @param {*} page Table's current page
	 * @param {*} pages Number of pages
	 * @returns Info object
	 */
	function _pagingButtonInfo(settings, button, page, pages) {
		var lang = settings.oLanguage.oPaginate
		var o = {
			display: "",
			active: false,
			disabled: false
		}

		switch (button) {
			case "ellipsis":
				o.display = "&#x2026;"
				o.disabled = true
				break

			case "first":
				o.display = lang.sFirst

				if (page === 0) {
					o.disabled = true
				}
				break

			case "previous":
				o.display = lang.sPrevious

				if (page === 0) {
					o.disabled = true
				}
				break

			case "next":
				o.display = lang.sNext

				if (pages === 0 || page === pages - 1) {
					o.disabled = true
				}
				break

			case "last":
				o.display = lang.sLast

				if (pages === 0 || page === pages - 1) {
					o.disabled = true
				}
				break

			default:
				if (typeof button === "number") {
					o.display = settings.fnFormatNumber(button + 1)

					if (page === button) {
						o.active = true
					}
				}
				break
		}

		return o
	}

	/**
	 * Compute what number buttons to show in the paging control
	 *
	 * @param {*} page Current page
	 * @param {*} pages Total number of pages
	 * @param {*} buttons Target number of number buttons
	 * @param {boolean} addFirstLast Indicate if page 1 and end should be included
	 * @returns Buttons to show
	 */
	function _pagingNumbers(page, pages, buttons, addFirstLast) {
		var numbers = [],
			half = Math.floor(buttons / 2),
			before = addFirstLast ? 2 : 1,
			after = addFirstLast ? 1 : 0

		if (pages <= buttons) {
			numbers = _range(0, pages)
		} else if (buttons === 1) {
			// Single button - current page only
			numbers = [page]
		} else if (buttons === 3) {
			// Special logic for just three buttons
			if (page <= 1) {
				numbers = [0, 1, "ellipsis"]
			} else if (page >= pages - 2) {
				numbers = _range(pages - 2, pages)
				numbers.unshift("ellipsis")
			} else {
				numbers = ["ellipsis", page, "ellipsis"]
			}
		} else if (page <= half) {
			numbers = _range(0, buttons - before)
			numbers.push("ellipsis")

			if (addFirstLast) {
				numbers.push(pages - 1)
			}
		} else if (page >= pages - 1 - half) {
			numbers = _range(pages - (buttons - before), pages)
			numbers.unshift("ellipsis")

			if (addFirstLast) {
				numbers.unshift(0)
			}
		} else {
			numbers = _range(page - half + before, page + half - after)
			numbers.push("ellipsis")
			numbers.unshift("ellipsis")

			if (addFirstLast) {
				numbers.push(pages - 1)
				numbers.unshift(0)
			}
		}

		return numbers
	}

	var __lengthCounter = 0

	// opts
	// - menu
	// - text
	DataTable.feature.register(
		"pageLength",
		function (settings, opts) {
			var features = settings.oFeatures

			// For compatibility with the legacy `pageLength` top level option
			if (!features.bPaginate || !features.bLengthChange) {
				return null
			}

			opts = $.extend(
				{
					menu: settings.aLengthMenu,
					text: settings.oLanguage.sLengthMenu
				},
				opts
			)

			var classes = settings.oClasses.length,
				tableId = settings.sTableId,
				menu = opts.menu,
				lengths = [],
				language = [],
				i

			// Options can be given in a number of ways
			if (Array.isArray(menu[0])) {
				// Old 1.x style - 2D array
				lengths = menu[0]
				language = menu[1]
			} else {
				for (i = 0; i < menu.length; i++) {
					// An object with different label and value
					if ($.isPlainObject(menu[i])) {
						lengths.push(menu[i].value)
						language.push(menu[i].label)
					} else {
						// Or just a number to display and use
						lengths.push(menu[i])
						language.push(menu[i])
					}
				}
			}

			// We can put the <select> outside of the label if it is at the start or
			// end which helps improve accessability (not all screen readers like
			// implicit for elements).
			var end = opts.text.match(/_MENU_$/)
			var start = opts.text.match(/^_MENU_/)
			var removed = opts.text.replace(/_MENU_/, "")
			var str = "<label>" + opts.text + "</label>"

			if (start) {
				str = "_MENU_<label>" + removed + "</label>"
			} else if (end) {
				str = "<label>" + removed + "</label>_MENU_"
			}

			// Wrapper element - use a span as a holder for where the select will go
			var tmpId = "tmp-" + +new Date()
			var div = $("<div/>")
				.addClass(classes.container)
				.append(str.replace("_MENU_", '<span id="' + tmpId + '"></span>'))

			// Save text node content for macro updating
			var textNodes = []
			Array.from(div.find("label")[0].childNodes).forEach(function (el) {
				if (el.nodeType === Node.TEXT_NODE) {
					textNodes.push({
						el: el,
						text: el.textContent
					})
				}
			})

			// Update the label text in case it has an entries value
			var updateEntries = function (len) {
				textNodes.forEach(function (node) {
					node.el.textContent = _fnMacros(settings, node.text, len)
				})
			}

			// Next, the select itself, along with the options
			var select = $("<select/>", {
				name: tableId + "_length",
				"aria-controls": tableId,
				class: classes.select
			})

			for (i = 0; i < lengths.length; i++) {
				select[0][i] = new Option(typeof language[i] === "number" ? settings.fnFormatNumber(language[i]) : language[i], lengths[i])
			}

			// add for and id to label and input
			div.find("label").attr("for", "dt-length-" + __lengthCounter)
			select.attr("id", "dt-length-" + __lengthCounter)
			__lengthCounter++

			// Swap in the select list
			div.find("#" + tmpId).replaceWith(select)

			// Can't use `select` variable as user might provide their own and the
			// reference is broken by the use of outerHTML
			$("select", div)
				.val(settings._iDisplayLength)
				.on("change.DT", function () {
					_fnLengthChange(settings, $(this).val())
					_fnDraw(settings)
				})

			// Update node value whenever anything changes the table's length
			$(settings.nTable).on("length.dt.DT", function (e, s, len) {
				if (settings === s) {
					$("select", div).val(len)

					// Resolve plurals in the text for the new length
					updateEntries(len)
				}
			})

			updateEntries(settings._iDisplayLength)

			return div
		},
		"l"
	)

	// jQuery access
	$.fn.dataTable = DataTable

	// Provide access to the host jQuery object (circular reference)
	DataTable.$ = $

	// Legacy aliases
	$.fn.dataTableSettings = DataTable.settings
	$.fn.dataTableExt = DataTable.ext

	// With a capital `D` we return a DataTables API instance rather than a
	// jQuery object
	$.fn.DataTable = function (opts) {
		return $(this).dataTable(opts).api()
	}

	// All properties that are available to $.fn.dataTable should also be
	// available on $.fn.DataTable
	$.each(DataTable, function (prop, val) {
		$.fn.DataTable[prop] = val
	})

	return DataTable
})

/*! DataTables styling integration
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	return DataTable
})

/*! Buttons for DataTables 3.1.2
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	// Used for namespacing events added to the document by each instance, so they
	// can be removed on destroy
	var _instCounter = 0

	// Button namespacing counter for namespacing events on individual buttons
	var _buttonCounter = 0

	var _dtButtons = DataTable.ext.buttons

	// Custom entity decoder for data export
	var _entityDecoder = null

	// Allow for jQuery slim
	function _fadeIn(el, duration, fn) {
		if ($.fn.animate) {
			el.stop().fadeIn(duration, fn)
		} else {
			el.css("display", "block")

			if (fn) {
				fn.call(el)
			}
		}
	}

	function _fadeOut(el, duration, fn) {
		if ($.fn.animate) {
			el.stop().fadeOut(duration, fn)
		} else {
			el.css("display", "none")

			if (fn) {
				fn.call(el)
			}
		}
	}

	/**
	 * [Buttons description]
	 * @param {[type]}
	 * @param {[type]}
	 */
	var Buttons = function (dt, config) {
		if (!DataTable.versionCheck("2")) {
			throw "Warning: Buttons requires DataTables 2 or newer"
		}

		// If not created with a `new` keyword then we return a wrapper function that
		// will take the settings object for a DT. This allows easy use of new instances
		// with the `layout` option - e.g. `topLeft: $.fn.dataTable.Buttons( ... )`.
		if (!(this instanceof Buttons)) {
			return function (settings) {
				return new Buttons(settings, dt).container()
			}
		}

		// If there is no config set it to an empty object
		if (typeof config === "undefined") {
			config = {}
		}

		// Allow a boolean true for defaults
		if (config === true) {
			config = {}
		}

		// For easy configuration of buttons an array can be given
		if (Array.isArray(config)) {
			config = { buttons: config }
		}

		this.c = $.extend(true, {}, Buttons.defaults, config)

		// Don't want a deep copy for the buttons
		if (config.buttons) {
			this.c.buttons = config.buttons
		}

		this.s = {
			dt: new DataTable.Api(dt),
			buttons: [],
			listenKeys: "",
			namespace: "dtb" + _instCounter++
		}

		this.dom = {
			container: $("<" + this.c.dom.container.tag + "/>").addClass(this.c.dom.container.className)
		}

		this._constructor()
	}

	$.extend(Buttons.prototype, {
		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Public methods
		 */

		/**
		 * Get the action of a button
		 * @param  {int|string} Button index
		 * @return {function}
		 */ /**
		 * Set the action of a button
		 * @param  {node} node Button element
		 * @param  {function} action Function to set
		 * @return {Buttons} Self for chaining
		 */
		action: function (node, action) {
			var button = this._nodeToButton(node)

			if (action === undefined) {
				return button.conf.action
			}

			button.conf.action = action

			return this
		},

		/**
		 * Add an active class to the button to make to look active or get current
		 * active state.
		 * @param  {node} node Button element
		 * @param  {boolean} [flag] Enable / disable flag
		 * @return {Buttons} Self for chaining or boolean for getter
		 */
		active: function (node, flag) {
			var button = this._nodeToButton(node)
			var klass = this.c.dom.button.active
			var jqNode = $(button.node)

			if (button.inCollection && this.c.dom.collection.button && this.c.dom.collection.button.active !== undefined) {
				klass = this.c.dom.collection.button.active
			}

			if (flag === undefined) {
				return jqNode.hasClass(klass)
			}

			jqNode.toggleClass(klass, flag === undefined ? true : flag)

			return this
		},

		/**
		 * Add a new button
		 * @param {object} config Button configuration object, base string name or function
		 * @param {int|string} [idx] Button index for where to insert the button
		 * @param {boolean} [draw=true] Trigger a draw. Set a false when adding
		 *   lots of buttons, until the last button.
		 * @return {Buttons} Self for chaining
		 */
		add: function (config, idx, draw) {
			var buttons = this.s.buttons

			if (typeof idx === "string") {
				var split = idx.split("-")
				var base = this.s

				for (var i = 0, ien = split.length - 1; i < ien; i++) {
					base = base.buttons[split[i] * 1]
				}

				buttons = base.buttons
				idx = split[split.length - 1] * 1
			}

			this._expandButton(buttons, config, config !== undefined ? config.split : undefined, (config === undefined || config.split === undefined || config.split.length === 0) && base !== undefined, false, idx)

			if (draw === undefined || draw === true) {
				this._draw()
			}

			return this
		},

		/**
		 * Clear buttons from a collection and then insert new buttons
		 */
		collectionRebuild: function (node, newButtons) {
			var button = this._nodeToButton(node)

			if (newButtons !== undefined) {
				var i
				// Need to reverse the array
				for (i = button.buttons.length - 1; i >= 0; i--) {
					this.remove(button.buttons[i].node)
				}

				// If the collection has prefix and / or postfix buttons we need to add them in
				if (button.conf.prefixButtons) {
					newButtons.unshift.apply(newButtons, button.conf.prefixButtons)
				}

				if (button.conf.postfixButtons) {
					newButtons.push.apply(newButtons, button.conf.postfixButtons)
				}

				for (i = 0; i < newButtons.length; i++) {
					var newBtn = newButtons[i]

					this._expandButton(
						button.buttons,
						newBtn,
						newBtn !== undefined && newBtn.config !== undefined && newBtn.config.split !== undefined,
						true,
						newBtn.parentConf !== undefined && newBtn.parentConf.split !== undefined,
						null,
						newBtn.parentConf
					)
				}
			}

			this._draw(button.collection, button.buttons)
		},

		/**
		 * Get the container node for the buttons
		 * @return {jQuery} Buttons node
		 */
		container: function () {
			return this.dom.container
		},

		/**
		 * Disable a button
		 * @param  {node} node Button node
		 * @return {Buttons} Self for chaining
		 */
		disable: function (node) {
			var button = this._nodeToButton(node)

			$(button.node).addClass(this.c.dom.button.disabled).prop("disabled", true)

			return this
		},

		/**
		 * Destroy the instance, cleaning up event handlers and removing DOM
		 * elements
		 * @return {Buttons} Self for chaining
		 */
		destroy: function () {
			// Key event listener
			$("body").off("keyup." + this.s.namespace)

			// Individual button destroy (so they can remove their own events if
			// needed). Take a copy as the array is modified by `remove`
			var buttons = this.s.buttons.slice()
			var i, ien

			for (i = 0, ien = buttons.length; i < ien; i++) {
				this.remove(buttons[i].node)
			}

			// Container
			this.dom.container.remove()

			// Remove from the settings object collection
			var buttonInsts = this.s.dt.settings()[0]

			for (i = 0, ien = buttonInsts.length; i < ien; i++) {
				if (buttonInsts.inst === this) {
					buttonInsts.splice(i, 1)
					break
				}
			}

			return this
		},

		/**
		 * Enable / disable a button
		 * @param  {node} node Button node
		 * @param  {boolean} [flag=true] Enable / disable flag
		 * @return {Buttons} Self for chaining
		 */
		enable: function (node, flag) {
			if (flag === false) {
				return this.disable(node)
			}

			var button = this._nodeToButton(node)
			$(button.node).removeClass(this.c.dom.button.disabled).prop("disabled", false)

			return this
		},

		/**
		 * Get a button's index
		 *
		 * This is internally recursive
		 * @param {element} node Button to get the index of
		 * @return {string} Button index
		 */
		index: function (node, nested, buttons) {
			if (!nested) {
				nested = ""
				buttons = this.s.buttons
			}

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				var inner = buttons[i].buttons

				if (buttons[i].node === node) {
					return nested + i
				}

				if (inner && inner.length) {
					var match = this.index(node, i + "-", inner)

					if (match !== null) {
						return match
					}
				}
			}

			return null
		},

		/**
		 * Get the instance name for the button set selector
		 * @return {string} Instance name
		 */
		name: function () {
			return this.c.name
		},

		/**
		 * Get a button's node of the buttons container if no button is given
		 * @param  {node} [node] Button node
		 * @return {jQuery} Button element, or container
		 */
		node: function (node) {
			if (!node) {
				return this.dom.container
			}

			var button = this._nodeToButton(node)
			return $(button.node)
		},

		/**
		 * Set / get a processing class on the selected button
		 * @param {element} node Triggering button node
		 * @param  {boolean} flag true to add, false to remove, undefined to get
		 * @return {boolean|Buttons} Getter value or this if a setter.
		 */
		processing: function (node, flag) {
			var dt = this.s.dt
			var button = this._nodeToButton(node)

			if (flag === undefined) {
				return $(button.node).hasClass("processing")
			}

			$(button.node).toggleClass("processing", flag)

			$(dt.table().node()).triggerHandler("buttons-processing.dt", [flag, dt.button(node), dt, $(node), button.conf])

			return this
		},

		/**
		 * Remove a button.
		 * @param  {node} node Button node
		 * @return {Buttons} Self for chaining
		 */
		remove: function (node) {
			var button = this._nodeToButton(node)
			var host = this._nodeToHost(node)
			var dt = this.s.dt

			// Remove any child buttons first
			if (button.buttons.length) {
				for (var i = button.buttons.length - 1; i >= 0; i--) {
					this.remove(button.buttons[i].node)
				}
			}

			button.conf.destroying = true

			// Allow the button to remove event handlers, etc
			if (button.conf.destroy) {
				button.conf.destroy.call(dt.button(node), dt, $(node), button.conf)
			}

			this._removeKey(button.conf)

			$(button.node).remove()

			var idx = $.inArray(button, host)
			host.splice(idx, 1)

			return this
		},

		/**
		 * Get the text for a button
		 * @param  {int|string} node Button index
		 * @return {string} Button text
		 */ /**
		 * Set the text for a button
		 * @param  {int|string|function} node Button index
		 * @param  {string} label Text
		 * @return {Buttons} Self for chaining
		 */
		text: function (node, label) {
			var button = this._nodeToButton(node)
			var textNode = button.textNode
			var dt = this.s.dt
			var jqNode = $(button.node)
			var text = function (opt) {
				return typeof opt === "function" ? opt(dt, jqNode, button.conf) : opt
			}

			if (label === undefined) {
				return text(button.conf.text)
			}

			button.conf.text = label
			textNode.html(text(label))

			return this
		},

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Constructor
		 */

		/**
		 * Buttons constructor
		 * @private
		 */
		_constructor: function () {
			var that = this
			var dt = this.s.dt
			var dtSettings = dt.settings()[0]
			var buttons = this.c.buttons

			if (!dtSettings._buttons) {
				dtSettings._buttons = []
			}

			dtSettings._buttons.push({
				inst: this,
				name: this.c.name
			})

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				this.add(buttons[i])
			}

			dt.on("destroy", function (e, settings) {
				if (settings === dtSettings) {
					that.destroy()
				}
			})

			// Global key event binding to listen for button keys
			$("body").on("keyup." + this.s.namespace, function (e) {
				if (!document.activeElement || document.activeElement === document.body) {
					// SUse a string of characters for fast lookup of if we need to
					// handle this
					var character = String.fromCharCode(e.keyCode).toLowerCase()

					if (that.s.listenKeys.toLowerCase().indexOf(character) !== -1) {
						that._keypress(character, e)
					}
				}
			})
		},

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Private methods
		 */

		/**
		 * Add a new button to the key press listener
		 * @param {object} conf Resolved button configuration object
		 * @private
		 */
		_addKey: function (conf) {
			if (conf.key) {
				this.s.listenKeys += $.isPlainObject(conf.key) ? conf.key.key : conf.key
			}
		},

		/**
		 * Insert the buttons into the container. Call without parameters!
		 * @param  {node} [container] Recursive only - Insert point
		 * @param  {array} [buttons] Recursive only - Buttons array
		 * @private
		 */
		_draw: function (container, buttons) {
			if (!container) {
				container = this.dom.container
				buttons = this.s.buttons
			}

			container.children().detach()

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				container.append(buttons[i].inserter)
				container.append(" ")

				if (buttons[i].buttons && buttons[i].buttons.length) {
					this._draw(buttons[i].collection, buttons[i].buttons)
				}
			}
		},

		/**
		 * Create buttons from an array of buttons
		 * @param  {array} attachTo Buttons array to attach to
		 * @param  {object} button Button definition
		 * @param  {boolean} inCollection true if the button is in a collection
		 * @private
		 */
		_expandButton: function (attachTo, button, split, inCollection, inSplit, attachPoint, parentConf) {
			var dt = this.s.dt
			var isSplit = false
			var domCollection = this.c.dom.collection
			var buttons = !Array.isArray(button) ? [button] : button

			if (button === undefined) {
				buttons = !Array.isArray(split) ? [split] : split
			}

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				var conf = this._resolveExtends(buttons[i])

				if (!conf) {
					continue
				}

				isSplit = conf.config && conf.config.split ? true : false

				// If the configuration is an array, then expand the buttons at this
				// point
				if (Array.isArray(conf)) {
					this._expandButton(attachTo, conf, built !== undefined && built.conf !== undefined ? built.conf.split : undefined, inCollection, parentConf !== undefined && parentConf.split !== undefined, attachPoint, parentConf)
					continue
				}

				var built = this._buildButton(conf, inCollection, conf.split !== undefined || (conf.config !== undefined && conf.config.split !== undefined), inSplit)
				if (!built) {
					continue
				}

				if (attachPoint !== undefined && attachPoint !== null) {
					attachTo.splice(attachPoint, 0, built)
					attachPoint++
				} else {
					attachTo.push(built)
				}

				// Create the dropdown for a collection
				if (built.conf.buttons) {
					built.collection = $("<" + domCollection.container.content.tag + "/>")
					built.conf._collection = built.collection

					$(built.node).append(domCollection.action.dropHtml)

					this._expandButton(built.buttons, built.conf.buttons, built.conf.split, !isSplit, isSplit, attachPoint, built.conf)
				}

				// And the split collection
				if (built.conf.split) {
					built.collection = $("<" + domCollection.container.tag + "/>")
					built.conf._collection = built.collection

					for (var j = 0; j < built.conf.split.length; j++) {
						var item = built.conf.split[j]

						if (typeof item === "object") {
							item.parent = parentConf

							if (item.collectionLayout === undefined) {
								item.collectionLayout = built.conf.collectionLayout
							}

							if (item.dropup === undefined) {
								item.dropup = built.conf.dropup
							}

							if (item.fade === undefined) {
								item.fade = built.conf.fade
							}
						}
					}

					this._expandButton(built.buttons, built.conf.buttons, built.conf.split, !isSplit, isSplit, attachPoint, built.conf)
				}

				built.conf.parent = parentConf

				// init call is made here, rather than buildButton as it needs to
				// be selectable, and for that it needs to be in the buttons array
				if (conf.init) {
					conf.init.call(dt.button(built.node), dt, $(built.node), conf)
				}
			}
		},

		/**
		 * Create an individual button
		 * @param  {object} config            Resolved button configuration
		 * @param  {boolean} inCollection `true` if a collection button
		 * @return {object} Completed button description object
		 * @private
		 */
		_buildButton: function (config, inCollection, isSplit, inSplit) {
			var that = this
			var configDom = this.c.dom
			var textNode
			var dt = this.s.dt
			var text = function (opt) {
				return typeof opt === "function" ? opt(dt, button, config) : opt
			}

			// Create an object that describes the button which can be in `dom.button`, or
			// `dom.collection.button` or `dom.split.button` or `dom.collection.split.button`!
			// Each should extend from `dom.button`.
			var dom = $.extend(true, {}, configDom.button)

			if (inCollection && isSplit && configDom.collection.split) {
				$.extend(true, dom, configDom.collection.split.action)
			} else if (inSplit || inCollection) {
				$.extend(true, dom, configDom.collection.button)
			} else if (isSplit) {
				$.extend(true, dom, configDom.split.button)
			}

			// Spacers don't do much other than insert an element into the DOM
			if (config.spacer) {
				var spacer = $("<" + dom.spacer.tag + "/>")
					.addClass("dt-button-spacer " + config.style + " " + dom.spacer.className)
					.html(text(config.text))

				return {
					conf: config,
					node: spacer,
					inserter: spacer,
					buttons: [],
					inCollection: inCollection,
					isSplit: isSplit,
					collection: null,
					textNode: spacer
				}
			}

			// Make sure that the button is available based on whatever requirements
			// it has. For example, PDF button require pdfmake
			if (config.available && !config.available(dt, config) && !config.html) {
				return false
			}

			var button

			if (!config.html) {
				var run = function (e, dt, button, config, done) {
					config.action.call(dt.button(button), e, dt, button, config, done)

					$(dt.table().node()).triggerHandler("buttons-action.dt", [dt.button(button), dt, button, config])
				}

				var action = function (e, dt, button, config) {
					if (config.async) {
						that.processing(button[0], true)

						setTimeout(function () {
							run(e, dt, button, config, function () {
								that.processing(button[0], false)
							})
						}, config.async)
					} else {
						run(e, dt, button, config, function () {})
					}
				}

				var tag = config.tag || dom.tag
				var clickBlurs = config.clickBlurs === undefined ? true : config.clickBlurs

				button = $("<" + tag + "/>")
					.addClass(dom.className)
					.attr("tabindex", this.s.dt.settings()[0].iTabIndex)
					.attr("aria-controls", this.s.dt.table().node().id)
					.on("click.dtb", function (e) {
						e.preventDefault()

						if (!button.hasClass(dom.disabled) && config.action) {
							action(e, dt, button, config)
						}

						if (clickBlurs) {
							button.trigger("blur")
						}
					})
					.on("keypress.dtb", function (e) {
						if (e.keyCode === 13) {
							e.preventDefault()

							if (!button.hasClass(dom.disabled) && config.action) {
								action(e, dt, button, config)
							}
						}
					})

				// Make `a` tags act like a link
				if (tag.toLowerCase() === "a") {
					button.attr("href", "#")
				}

				// Button tags should have `type=button` so they don't have any default behaviour
				if (tag.toLowerCase() === "button") {
					button.attr("type", "button")
				}

				if (dom.liner.tag) {
					var liner = $("<" + dom.liner.tag + "/>")
						.html(text(config.text))
						.addClass(dom.liner.className)

					if (dom.liner.tag.toLowerCase() === "a") {
						liner.attr("href", "#")
					}

					button.append(liner)
					textNode = liner
				} else {
					button.html(text(config.text))
					textNode = button
				}

				if (config.enabled === false) {
					button.addClass(dom.disabled)
				}

				if (config.className) {
					button.addClass(config.className)
				}

				if (config.titleAttr) {
					button.attr("title", text(config.titleAttr))
				}

				if (config.attr) {
					button.attr(config.attr)
				}

				if (!config.namespace) {
					config.namespace = ".dt-button-" + _buttonCounter++
				}

				if (config.config !== undefined && config.config.split) {
					config.split = config.config.split
				}
			} else {
				button = $(config.html)
			}

			var buttonContainer = this.c.dom.buttonContainer
			var inserter
			if (buttonContainer && buttonContainer.tag) {
				inserter = $("<" + buttonContainer.tag + "/>")
					.addClass(buttonContainer.className)
					.append(button)
			} else {
				inserter = button
			}

			this._addKey(config)

			// Style integration callback for DOM manipulation
			// Note that this is _not_ documented. It is currently
			// for style integration only
			if (this.c.buttonCreated) {
				inserter = this.c.buttonCreated(config, inserter)
			}

			var splitDiv

			if (isSplit) {
				var dropdownConf = inCollection ? $.extend(true, this.c.dom.split, this.c.dom.collection.split) : this.c.dom.split
				var wrapperConf = dropdownConf.wrapper

				splitDiv = $("<" + wrapperConf.tag + "/>")
					.addClass(wrapperConf.className)
					.append(button)

				var dropButtonConfig = $.extend(config, {
					align: dropdownConf.dropdown.align,
					attr: {
						"aria-haspopup": "dialog",
						"aria-expanded": false
					},
					className: dropdownConf.dropdown.className,
					closeButton: false,
					splitAlignClass: dropdownConf.dropdown.splitAlignClass,
					text: dropdownConf.dropdown.text
				})

				this._addKey(dropButtonConfig)

				var splitAction = function (e, dt, button, config) {
					_dtButtons.split.action.call(dt.button(splitDiv), e, dt, button, config)

					$(dt.table().node()).triggerHandler("buttons-action.dt", [dt.button(button), dt, button, config])
					button.attr("aria-expanded", true)
				}

				var dropButton = $('<button class="' + dropdownConf.dropdown.className + ' dt-button"></button>')
					.html(dropdownConf.dropdown.dropHtml)
					.on("click.dtb", function (e) {
						e.preventDefault()
						e.stopPropagation()

						if (!dropButton.hasClass(dom.disabled)) {
							splitAction(e, dt, dropButton, dropButtonConfig)
						}
						if (clickBlurs) {
							dropButton.trigger("blur")
						}
					})
					.on("keypress.dtb", function (e) {
						if (e.keyCode === 13) {
							e.preventDefault()

							if (!dropButton.hasClass(dom.disabled)) {
								splitAction(e, dt, dropButton, dropButtonConfig)
							}
						}
					})

				if (config.split.length === 0) {
					dropButton.addClass("dtb-hide-drop")
				}

				splitDiv.append(dropButton).attr(dropButtonConfig.attr)
			}

			return {
				conf: config,
				node: isSplit ? splitDiv.get(0) : button.get(0),
				inserter: isSplit ? splitDiv : inserter,
				buttons: [],
				inCollection: inCollection,
				isSplit: isSplit,
				inSplit: inSplit,
				collection: null,
				textNode: textNode
			}
		},

		/**
		 * Get the button object from a node (recursive)
		 * @param  {node} node Button node
		 * @param  {array} [buttons] Button array, uses base if not defined
		 * @return {object} Button object
		 * @private
		 */
		_nodeToButton: function (node, buttons) {
			if (!buttons) {
				buttons = this.s.buttons
			}

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				if (buttons[i].node === node) {
					return buttons[i]
				}

				if (buttons[i].buttons.length) {
					var ret = this._nodeToButton(node, buttons[i].buttons)

					if (ret) {
						return ret
					}
				}
			}
		},

		/**
		 * Get container array for a button from a button node (recursive)
		 * @param  {node} node Button node
		 * @param  {array} [buttons] Button array, uses base if not defined
		 * @return {array} Button's host array
		 * @private
		 */
		_nodeToHost: function (node, buttons) {
			if (!buttons) {
				buttons = this.s.buttons
			}

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				if (buttons[i].node === node) {
					return buttons
				}

				if (buttons[i].buttons.length) {
					var ret = this._nodeToHost(node, buttons[i].buttons)

					if (ret) {
						return ret
					}
				}
			}
		},

		/**
		 * Handle a key press - determine if any button's key configured matches
		 * what was typed and trigger the action if so.
		 * @param  {string} character The character pressed
		 * @param  {object} e Key event that triggered this call
		 * @private
		 */
		_keypress: function (character, e) {
			// Check if this button press already activated on another instance of Buttons
			if (e._buttonsHandled) {
				return
			}

			var run = function (conf, node) {
				if (!conf.key) {
					return
				}

				if (conf.key === character) {
					e._buttonsHandled = true
					$(node).click()
				} else if ($.isPlainObject(conf.key)) {
					if (conf.key.key !== character) {
						return
					}

					if (conf.key.shiftKey && !e.shiftKey) {
						return
					}

					if (conf.key.altKey && !e.altKey) {
						return
					}

					if (conf.key.ctrlKey && !e.ctrlKey) {
						return
					}

					if (conf.key.metaKey && !e.metaKey) {
						return
					}

					// Made it this far - it is good
					e._buttonsHandled = true
					$(node).click()
				}
			}

			var recurse = function (a) {
				for (var i = 0, ien = a.length; i < ien; i++) {
					run(a[i].conf, a[i].node)

					if (a[i].buttons.length) {
						recurse(a[i].buttons)
					}
				}
			}

			recurse(this.s.buttons)
		},

		/**
		 * Remove a key from the key listener for this instance (to be used when a
		 * button is removed)
		 * @param  {object} conf Button configuration
		 * @private
		 */
		_removeKey: function (conf) {
			if (conf.key) {
				var character = $.isPlainObject(conf.key) ? conf.key.key : conf.key

				// Remove only one character, as multiple buttons could have the
				// same listening key
				var a = this.s.listenKeys.split("")
				var idx = $.inArray(character, a)
				a.splice(idx, 1)
				this.s.listenKeys = a.join("")
			}
		},

		/**
		 * Resolve a button configuration
		 * @param  {string|function|object} conf Button config to resolve
		 * @return {object} Button configuration
		 * @private
		 */
		_resolveExtends: function (conf) {
			var that = this
			var dt = this.s.dt
			var i, ien
			var toConfObject = function (base) {
				var loop = 0

				// Loop until we have resolved to a button configuration, or an
				// array of button configurations (which will be iterated
				// separately)
				while (!$.isPlainObject(base) && !Array.isArray(base)) {
					if (base === undefined) {
						return
					}

					if (typeof base === "function") {
						base = base.call(that, dt, conf)

						if (!base) {
							return false
						}
					} else if (typeof base === "string") {
						if (!_dtButtons[base]) {
							return { html: base }
						}

						base = _dtButtons[base]
					}

					loop++
					if (loop > 30) {
						// Protect against misconfiguration killing the browser
						throw "Buttons: Too many iterations"
					}
				}

				return Array.isArray(base) ? base : $.extend({}, base)
			}

			conf = toConfObject(conf)

			while (conf && conf.extend) {
				// Use `toConfObject` in case the button definition being extended
				// is itself a string or a function
				if (!_dtButtons[conf.extend]) {
					throw "Cannot extend unknown button type: " + conf.extend
				}

				var objArray = toConfObject(_dtButtons[conf.extend])
				if (Array.isArray(objArray)) {
					return objArray
				} else if (!objArray) {
					// This is a little brutal as it might be possible to have a
					// valid button without the extend, but if there is no extend
					// then the host button would be acting in an undefined state
					return false
				}

				// Stash the current class name
				var originalClassName = objArray.className

				if (conf.config !== undefined && objArray.config !== undefined) {
					conf.config = $.extend({}, objArray.config, conf.config)
				}

				conf = $.extend({}, objArray, conf)

				// The extend will have overwritten the original class name if the
				// `conf` object also assigned a class, but we want to concatenate
				// them so they are list that is combined from all extended buttons
				if (originalClassName && conf.className !== originalClassName) {
					conf.className = originalClassName + " " + conf.className
				}

				// Although we want the `conf` object to overwrite almost all of
				// the properties of the object being extended, the `extend`
				// property should come from the object being extended
				conf.extend = objArray.extend
			}

			// Buttons to be added to a collection  -gives the ability to define
			// if buttons should be added to the start or end of a collection
			var postfixButtons = conf.postfixButtons
			if (postfixButtons) {
				if (!conf.buttons) {
					conf.buttons = []
				}

				for (i = 0, ien = postfixButtons.length; i < ien; i++) {
					conf.buttons.push(postfixButtons[i])
				}
			}

			var prefixButtons = conf.prefixButtons
			if (prefixButtons) {
				if (!conf.buttons) {
					conf.buttons = []
				}

				for (i = 0, ien = prefixButtons.length; i < ien; i++) {
					conf.buttons.splice(i, 0, prefixButtons[i])
				}
			}

			return conf
		},

		/**
		 * Display (and replace if there is an existing one) a popover attached to a button
		 * @param {string|node} content Content to show
		 * @param {DataTable.Api} hostButton DT API instance of the button
		 * @param {object} inOpts Options (see object below for all options)
		 */
		_popover: function (content, hostButton, inOpts) {
			var dt = hostButton
			var c = this.c
			var closed = false
			var options = $.extend(
				{
					align: "button-left", // button-right, dt-container, split-left, split-right
					autoClose: false,
					background: true,
					backgroundClassName: "dt-button-background",
					closeButton: true,
					containerClassName: c.dom.collection.container.className,
					contentClassName: c.dom.collection.container.content.className,
					collectionLayout: "",
					collectionTitle: "",
					dropup: false,
					fade: 400,
					popoverTitle: "",
					rightAlignClassName: "dt-button-right",
					tag: c.dom.collection.container.tag
				},
				inOpts
			)

			var containerSelector = options.tag + "." + options.containerClassName.replace(/ /g, ".")
			var hostNode = hostButton.node()

			var close = function () {
				closed = true

				_fadeOut($(containerSelector), options.fade, function () {
					$(this).detach()
				})

				$(dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes()).attr("aria-expanded", "false")

				$("div.dt-button-background").off("click.dtb-collection")
				Buttons.background(false, options.backgroundClassName, options.fade, hostNode)

				$(window).off("resize.resize.dtb-collection")
				$("body").off(".dtb-collection")
				dt.off("buttons-action.b-internal")
				dt.off("destroy")
			}

			if (content === false) {
				close()
				return
			}

			var existingExpanded = $(dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes())
			if (existingExpanded.length) {
				// Reuse the current position if the button that was triggered is inside an existing collection
				if (hostNode.closest(containerSelector).length) {
					hostNode = existingExpanded.eq(0)
				}

				close()
			}

			// Try to be smart about the layout
			var cnt = $(".dt-button", content).length
			var mod = ""

			if (cnt === 3) {
				mod = "dtb-b3"
			} else if (cnt === 2) {
				mod = "dtb-b2"
			} else if (cnt === 1) {
				mod = "dtb-b1"
			}

			var display = $("<" + options.tag + "/>")
				.addClass(options.containerClassName)
				.addClass(options.collectionLayout)
				.addClass(options.splitAlignClass)
				.addClass(mod)
				.css("display", "none")
				.attr({
					"aria-modal": true,
					role: "dialog"
				})

			content = $(content).addClass(options.contentClassName).attr("role", "menu").appendTo(display)

			hostNode.attr("aria-expanded", "true")

			if (hostNode.parents("body")[0] !== document.body) {
				hostNode = document.body.lastChild
			}

			if (options.popoverTitle) {
				display.prepend('<div class="dt-button-collection-title">' + options.popoverTitle + "</div>")
			} else if (options.collectionTitle) {
				display.prepend('<div class="dt-button-collection-title">' + options.collectionTitle + "</div>")
			}

			if (options.closeButton) {
				display.prepend('<div class="dtb-popover-close">&times;</div>').addClass("dtb-collection-closeable")
			}

			_fadeIn(display.insertAfter(hostNode), options.fade)

			var tableContainer = $(hostButton.table().container())
			var position = display.css("position")

			if (options.span === "container" || options.align === "dt-container") {
				hostNode = hostNode.parent()
				display.css("width", tableContainer.width())
			}

			// Align the popover relative to the DataTables container
			// Useful for wide popovers such as SearchPanes
			if (position === "absolute") {
				// Align relative to the host button
				var offsetParent = $(hostNode[0].offsetParent)
				var buttonPosition = hostNode.position()
				var buttonOffset = hostNode.offset()
				var tableSizes = offsetParent.offset()
				var containerPosition = offsetParent.position()
				var computed = window.getComputedStyle(offsetParent[0])

				tableSizes.height = offsetParent.outerHeight()
				tableSizes.width = offsetParent.width() + parseFloat(computed.paddingLeft)
				tableSizes.right = tableSizes.left + tableSizes.width
				tableSizes.bottom = tableSizes.top + tableSizes.height

				// Set the initial position so we can read height / width
				var top = buttonPosition.top + hostNode.outerHeight()
				var left = buttonPosition.left

				display.css({
					top: top,
					left: left
				})

				// Get the popover position
				computed = window.getComputedStyle(display[0])
				var popoverSizes = display.offset()

				popoverSizes.height = display.outerHeight()
				popoverSizes.width = display.outerWidth()
				popoverSizes.right = popoverSizes.left + popoverSizes.width
				popoverSizes.bottom = popoverSizes.top + popoverSizes.height
				popoverSizes.marginTop = parseFloat(computed.marginTop)
				popoverSizes.marginBottom = parseFloat(computed.marginBottom)

				// First position per the class requirements - pop up and right align
				if (options.dropup) {
					top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom
				}

				if (options.align === "button-right" || display.hasClass(options.rightAlignClassName)) {
					left = buttonPosition.left - popoverSizes.width + hostNode.outerWidth()
				}

				// Container alignment - make sure it doesn't overflow the table container
				if (options.align === "dt-container" || options.align === "container") {
					if (left < buttonPosition.left) {
						left = -buttonPosition.left
					}
				}

				// Window adjustment
				if (containerPosition.left + left + popoverSizes.width > $(window).width()) {
					// Overflowing the document to the right
					left = $(window).width() - popoverSizes.width - containerPosition.left
				}

				if (buttonOffset.left + left < 0) {
					// Off to the left of the document
					left = -buttonOffset.left
				}

				if (containerPosition.top + top + popoverSizes.height > $(window).height() + $(window).scrollTop()) {
					// Pop up if otherwise we'd need the user to scroll down
					top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom
				}

				if (containerPosition.top + top < $(window).scrollTop()) {
					// Correction for when the top is beyond the top of the page
					top = buttonPosition.top + hostNode.outerHeight()
				}

				// Calculations all done - now set it
				display.css({
					top: top,
					left: left
				})
			} else {
				// Fix position - centre on screen
				var place = function () {
					var half = $(window).height() / 2

					var top = display.height() / 2
					if (top > half) {
						top = half
					}

					display.css("marginTop", top * -1)
				}

				place()

				$(window).on("resize.dtb-collection", function () {
					place()
				})
			}

			if (options.background) {
				Buttons.background(true, options.backgroundClassName, options.fade, options.backgroundHost || hostNode)
			}

			// This is bonkers, but if we don't have a click listener on the
			// background element, iOS Safari will ignore the body click
			// listener below. An empty function here is all that is
			// required to make it work...
			$("div.dt-button-background").on("click.dtb-collection", function () {})

			if (options.autoClose) {
				setTimeout(function () {
					dt.on("buttons-action.b-internal", function (e, btn, dt, node) {
						if (node[0] === hostNode[0]) {
							return
						}
						close()
					})
				}, 0)
			}

			$(display).trigger("buttons-popover.dt")

			dt.on("destroy", close)

			setTimeout(function () {
				closed = false
				$("body")
					.on("click.dtb-collection", function (e) {
						if (closed) {
							return
						}

						// andSelf is deprecated in jQ1.8, but we want 1.7 compat
						var back = $.fn.addBack ? "addBack" : "andSelf"
						var parent = $(e.target).parent()[0]

						if ((!$(e.target).parents()[back]().filter(content).length && !$(parent).hasClass("dt-buttons")) || $(e.target).hasClass("dt-button-background")) {
							close()
						}
					})
					.on("keyup.dtb-collection", function (e) {
						if (e.keyCode === 27) {
							close()
						}
					})
					.on("keydown.dtb-collection", function (e) {
						// Focus trap for tab key
						var elements = $("a, button", content)
						var active = document.activeElement

						if (e.keyCode !== 9) {
							// tab
							return
						}

						if (elements.index(active) === -1) {
							// If current focus is not inside the popover
							elements.first().focus()
							e.preventDefault()
						} else if (e.shiftKey) {
							// Reverse tabbing order when shift key is pressed
							if (active === elements[0]) {
								elements.last().focus()
								e.preventDefault()
							}
						} else {
							if (active === elements.last()[0]) {
								elements.first().focus()
								e.preventDefault()
							}
						}
					})
			}, 0)
		}
	})

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Statics
	 */

	/**
	 * Show / hide a background layer behind a collection
	 * @param  {boolean} Flag to indicate if the background should be shown or
	 *   hidden
	 * @param  {string} Class to assign to the background
	 * @static
	 */
	Buttons.background = function (show, className, fade, insertPoint) {
		if (fade === undefined) {
			fade = 400
		}
		if (!insertPoint) {
			insertPoint = document.body
		}

		if (show) {
			_fadeIn($("<div/>").addClass(className).css("display", "none").insertAfter(insertPoint), fade)
		} else {
			_fadeOut($("div." + className), fade, function () {
				$(this).removeClass(className).remove()
			})
		}
	}

	/**
	 * Instance selector - select Buttons instances based on an instance selector
	 * value from the buttons assigned to a DataTable. This is only useful if
	 * multiple instances are attached to a DataTable.
	 * @param  {string|int|array} Instance selector - see `instance-selector`
	 *   documentation on the DataTables site
	 * @param  {array} Button instance array that was attached to the DataTables
	 *   settings object
	 * @return {array} Buttons instances
	 * @static
	 */
	Buttons.instanceSelector = function (group, buttons) {
		if (group === undefined || group === null) {
			return $.map(buttons, function (v) {
				return v.inst
			})
		}

		var ret = []
		var names = $.map(buttons, function (v) {
			return v.name
		})

		// Flatten the group selector into an array of single options
		var process = function (input) {
			if (Array.isArray(input)) {
				for (var i = 0, ien = input.length; i < ien; i++) {
					process(input[i])
				}
				return
			}

			if (typeof input === "string") {
				if (input.indexOf(",") !== -1) {
					// String selector, list of names
					process(input.split(","))
				} else {
					// String selector individual name
					var idx = $.inArray(input.trim(), names)

					if (idx !== -1) {
						ret.push(buttons[idx].inst)
					}
				}
			} else if (typeof input === "number") {
				// Index selector
				ret.push(buttons[input].inst)
			} else if (typeof input === "object" && input.nodeName) {
				// Element selector
				for (var j = 0; j < buttons.length; j++) {
					if (buttons[j].inst.dom.container[0] === input) {
						ret.push(buttons[j].inst)
					}
				}
			} else if (typeof input === "object") {
				// Actual instance selector
				ret.push(input)
			}
		}

		process(group)

		return ret
	}

	/**
	 * Button selector - select one or more buttons from a selector input so some
	 * operation can be performed on them.
	 * @param  {array} Button instances array that the selector should operate on
	 * @param  {string|int|node|jQuery|array} Button selector - see
	 *   `button-selector` documentation on the DataTables site
	 * @return {array} Array of objects containing `inst` and `idx` properties of
	 *   the selected buttons so you know which instance each button belongs to.
	 * @static
	 */
	Buttons.buttonSelector = function (insts, selector) {
		var ret = []
		var nodeBuilder = function (a, buttons, baseIdx) {
			var button
			var idx

			for (var i = 0, ien = buttons.length; i < ien; i++) {
				button = buttons[i]

				if (button) {
					idx = baseIdx !== undefined ? baseIdx + i : i + ""

					a.push({
						node: button.node,
						name: button.conf.name,
						idx: idx
					})

					if (button.buttons) {
						nodeBuilder(a, button.buttons, idx + "-")
					}
				}
			}
		}

		var run = function (selector, inst) {
			var i, ien
			var buttons = []
			nodeBuilder(buttons, inst.s.buttons)

			var nodes = $.map(buttons, function (v) {
				return v.node
			})

			if (Array.isArray(selector) || selector instanceof $) {
				for (i = 0, ien = selector.length; i < ien; i++) {
					run(selector[i], inst)
				}
				return
			}

			if (selector === null || selector === undefined || selector === "*") {
				// Select all
				for (i = 0, ien = buttons.length; i < ien; i++) {
					ret.push({
						inst: inst,
						node: buttons[i].node
					})
				}
			} else if (typeof selector === "number") {
				// Main button index selector
				if (inst.s.buttons[selector]) {
					ret.push({
						inst: inst,
						node: inst.s.buttons[selector].node
					})
				}
			} else if (typeof selector === "string") {
				if (selector.indexOf(",") !== -1) {
					// Split
					var a = selector.split(",")

					for (i = 0, ien = a.length; i < ien; i++) {
						run(a[i].trim(), inst)
					}
				} else if (selector.match(/^\d+(\-\d+)*$/)) {
					// Sub-button index selector
					var indexes = $.map(buttons, function (v) {
						return v.idx
					})

					ret.push({
						inst: inst,
						node: buttons[$.inArray(selector, indexes)].node
					})
				} else if (selector.indexOf(":name") !== -1) {
					// Button name selector
					var name = selector.replace(":name", "")

					for (i = 0, ien = buttons.length; i < ien; i++) {
						if (buttons[i].name === name) {
							ret.push({
								inst: inst,
								node: buttons[i].node
							})
						}
					}
				} else {
					// jQuery selector on the nodes
					$(nodes)
						.filter(selector)
						.each(function () {
							ret.push({
								inst: inst,
								node: this
							})
						})
				}
			} else if (typeof selector === "object" && selector.nodeName) {
				// Node selector
				var idx = $.inArray(selector, nodes)

				if (idx !== -1) {
					ret.push({
						inst: inst,
						node: nodes[idx]
					})
				}
			}
		}

		for (var i = 0, ien = insts.length; i < ien; i++) {
			var inst = insts[i]

			run(selector, inst)
		}

		return ret
	}

	/**
	 * Default function used for formatting output data.
	 * @param {*} str Data to strip
	 */
	Buttons.stripData = function (str, config) {
		if (typeof str !== "string") {
			return str
		}

		// Always remove script tags
		str = Buttons.stripHtmlScript(str)

		// Always remove comments
		str = Buttons.stripHtmlComments(str)

		if (!config || config.stripHtml) {
			str = DataTable.util.stripHtml(str)
		}

		if (!config || config.trim) {
			str = str.trim()
		}

		if (!config || config.stripNewlines) {
			str = str.replace(/\n/g, " ")
		}

		if (!config || config.decodeEntities) {
			if (_entityDecoder) {
				str = _entityDecoder(str)
			} else {
				_exportTextarea.innerHTML = str
				str = _exportTextarea.value
			}
		}

		return str
	}

	/**
	 * Provide a custom entity decoding function - e.g. a regex one, which can be
	 * much faster than the built in DOM option, but also larger code size.
	 * @param {function} fn
	 */
	Buttons.entityDecoder = function (fn) {
		_entityDecoder = fn
	}

	/**
	 * Common function for stripping HTML comments
	 *
	 * @param {*} input
	 * @returns
	 */
	Buttons.stripHtmlComments = function (input) {
		var previous

		do {
			previous = input
			input = input.replace(/(<!--.*?--!?>)|(<!--[\S\s]+?--!?>)|(<!--[\S\s]*?$)/g, "")
		} while (input !== previous)

		return input
	}

	/**
	 * Common function for stripping HTML script tags
	 *
	 * @param {*} input
	 * @returns
	 */
	Buttons.stripHtmlScript = function (input) {
		var previous

		do {
			previous = input
			input = input.replace(/<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi, "")
		} while (input !== previous)

		return input
	}

	/**
	 * Buttons defaults. For full documentation, please refer to the docs/option
	 * directory or the DataTables site.
	 * @type {Object}
	 * @static
	 */
	Buttons.defaults = {
		buttons: ["copy", "excel", "csv", "pdf", "print"],
		name: "main",
		tabIndex: 0,
		dom: {
			container: {
				tag: "div",
				className: "dt-buttons"
			},
			collection: {
				action: {
					// action button
					dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>'
				},
				container: {
					// The element used for the dropdown
					className: "dt-button-collection",
					content: {
						className: "",
						tag: "div"
					},
					tag: "div"
				}
				// optionally
				// , button: IButton - buttons inside the collection container
				// , split: ISplit - splits inside the collection container
			},
			button: {
				tag: "button",
				className: "dt-button",
				active: "dt-button-active", // class name
				disabled: "disabled", // class name
				spacer: {
					className: "dt-button-spacer",
					tag: "span"
				},
				liner: {
					tag: "span",
					className: ""
				}
			},
			split: {
				action: {
					// action button
					className: "dt-button-split-drop-button dt-button",
					tag: "button"
				},
				dropdown: {
					// button to trigger the dropdown
					align: "split-right",
					className: "dt-button-split-drop",
					dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>',
					splitAlignClass: "dt-button-split-left",
					tag: "button"
				},
				wrapper: {
					// wrap around both
					className: "dt-button-split",
					tag: "div"
				}
			}
		}
	}

	/**
	 * Version information
	 * @type {string}
	 * @static
	 */
	Buttons.version = "3.1.2"

	$.extend(_dtButtons, {
		collection: {
			text: function (dt) {
				return dt.i18n("buttons.collection", "Collection")
			},
			className: "buttons-collection",
			closeButton: false,
			init: function (dt, button) {
				button.attr("aria-expanded", false)
			},
			action: function (e, dt, button, config) {
				if (config._collection.parents("body").length) {
					this.popover(false, config)
				} else {
					this.popover(config._collection, config)
				}

				// When activated using a key - auto focus on the
				// first item in the popover
				if (e.type === "keypress") {
					$("a, button", config._collection).eq(0).focus()
				}
			},
			attr: {
				"aria-haspopup": "dialog"
			}
			// Also the popover options, defined in Buttons.popover
		},
		split: {
			text: function (dt) {
				return dt.i18n("buttons.split", "Split")
			},
			className: "buttons-split",
			closeButton: false,
			init: function (dt, button) {
				return button.attr("aria-expanded", false)
			},
			action: function (e, dt, button, config) {
				this.popover(config._collection, config)
			},
			attr: {
				"aria-haspopup": "dialog"
			}
			// Also the popover options, defined in Buttons.popover
		},
		copy: function () {
			if (_dtButtons.copyHtml5) {
				return "copyHtml5"
			}
		},
		csv: function (dt, conf) {
			if (_dtButtons.csvHtml5 && _dtButtons.csvHtml5.available(dt, conf)) {
				return "csvHtml5"
			}
		},
		excel: function (dt, conf) {
			if (_dtButtons.excelHtml5 && _dtButtons.excelHtml5.available(dt, conf)) {
				return "excelHtml5"
			}
		},
		pdf: function (dt, conf) {
			if (_dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available(dt, conf)) {
				return "pdfHtml5"
			}
		},
		pageLength: function (dt) {
			var lengthMenu = dt.settings()[0].aLengthMenu
			var vals = []
			var lang = []
			var text = function (dt) {
				return dt.i18n(
					"buttons.pageLength",
					{
						"-1": "Show all rows",
						_: "Show %d rows"
					},
					dt.page.len()
				)
			}

			// Support for DataTables 1.x 2D array
			if (Array.isArray(lengthMenu[0])) {
				vals = lengthMenu[0]
				lang = lengthMenu[1]
			} else {
				for (var i = 0; i < lengthMenu.length; i++) {
					var option = lengthMenu[i]

					// Support for DataTables 2 object in the array
					if ($.isPlainObject(option)) {
						vals.push(option.value)
						lang.push(option.label)
					} else {
						vals.push(option)
						lang.push(option)
					}
				}
			}

			return {
				extend: "collection",
				text: text,
				className: "buttons-page-length",
				autoClose: true,
				buttons: $.map(vals, function (val, i) {
					return {
						text: lang[i],
						className: "button-page-length",
						action: function (e, dt) {
							dt.page.len(val).draw()
						},
						init: function (dt, node, conf) {
							var that = this
							var fn = function () {
								that.active(dt.page.len() === val)
							}

							dt.on("length.dt" + conf.namespace, fn)
							fn()
						},
						destroy: function (dt, node, conf) {
							dt.off("length.dt" + conf.namespace)
						}
					}
				}),
				init: function (dt, node, conf) {
					var that = this
					dt.on("length.dt" + conf.namespace, function () {
						that.text(conf.text)
					})
				},
				destroy: function (dt, node, conf) {
					dt.off("length.dt" + conf.namespace)
				}
			}
		},
		spacer: {
			style: "empty",
			spacer: true,
			text: function (dt) {
				return dt.i18n("buttons.spacer", "")
			}
		}
	})

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * DataTables API
	 *
	 * For complete documentation, please refer to the docs/api directory or the
	 * DataTables site
	 */

	// Buttons group and individual button selector
	DataTable.Api.register("buttons()", function (group, selector) {
		// Argument shifting
		if (selector === undefined) {
			selector = group
			group = undefined
		}

		this.selector.buttonGroup = group

		var res = this.iterator(
			true,
			"table",
			function (ctx) {
				if (ctx._buttons) {
					return Buttons.buttonSelector(Buttons.instanceSelector(group, ctx._buttons), selector)
				}
			},
			true
		)

		res._groupSelector = group
		return res
	})

	// Individual button selector
	DataTable.Api.register("button()", function (group, selector) {
		// just run buttons() and truncate
		var buttons = this.buttons(group, selector)

		if (buttons.length > 1) {
			buttons.splice(1, buttons.length)
		}

		return buttons
	})

	// Active buttons
	DataTable.Api.registerPlural("buttons().active()", "button().active()", function (flag) {
		if (flag === undefined) {
			return this.map(function (set) {
				return set.inst.active(set.node)
			})
		}

		return this.each(function (set) {
			set.inst.active(set.node, flag)
		})
	})

	// Get / set button action
	DataTable.Api.registerPlural("buttons().action()", "button().action()", function (action) {
		if (action === undefined) {
			return this.map(function (set) {
				return set.inst.action(set.node)
			})
		}

		return this.each(function (set) {
			set.inst.action(set.node, action)
		})
	})

	// Collection control
	DataTable.Api.registerPlural("buttons().collectionRebuild()", "button().collectionRebuild()", function (buttons) {
		return this.each(function (set) {
			for (var i = 0; i < buttons.length; i++) {
				if (typeof buttons[i] === "object") {
					buttons[i].parentConf = set
				}
			}
			set.inst.collectionRebuild(set.node, buttons)
		})
	})

	// Enable / disable buttons
	DataTable.Api.register(["buttons().enable()", "button().enable()"], function (flag) {
		return this.each(function (set) {
			set.inst.enable(set.node, flag)
		})
	})

	// Disable buttons
	DataTable.Api.register(["buttons().disable()", "button().disable()"], function () {
		return this.each(function (set) {
			set.inst.disable(set.node)
		})
	})

	// Button index
	DataTable.Api.register("button().index()", function () {
		var idx = null

		this.each(function (set) {
			var res = set.inst.index(set.node)

			if (res !== null) {
				idx = res
			}
		})

		return idx
	})

	// Get button nodes
	DataTable.Api.registerPlural("buttons().nodes()", "button().node()", function () {
		var jq = $()

		// jQuery will automatically reduce duplicates to a single entry
		$(
			this.each(function (set) {
				jq = jq.add(set.inst.node(set.node))
			})
		)

		return jq
	})

	// Get / set button processing state
	DataTable.Api.registerPlural("buttons().processing()", "button().processing()", function (flag) {
		if (flag === undefined) {
			return this.map(function (set) {
				return set.inst.processing(set.node)
			})
		}

		return this.each(function (set) {
			set.inst.processing(set.node, flag)
		})
	})

	// Get / set button text (i.e. the button labels)
	DataTable.Api.registerPlural("buttons().text()", "button().text()", function (label) {
		if (label === undefined) {
			return this.map(function (set) {
				return set.inst.text(set.node)
			})
		}

		return this.each(function (set) {
			set.inst.text(set.node, label)
		})
	})

	// Trigger a button's action
	DataTable.Api.registerPlural("buttons().trigger()", "button().trigger()", function () {
		return this.each(function (set) {
			set.inst.node(set.node).trigger("click")
		})
	})

	// Button resolver to the popover
	DataTable.Api.register("button().popover()", function (content, options) {
		return this.map(function (set) {
			return set.inst._popover(content, this.button(this[0].node), options)
		})
	})

	// Get the container elements
	DataTable.Api.register("buttons().containers()", function () {
		var jq = $()
		var groupSelector = this._groupSelector

		// We need to use the group selector directly, since if there are no buttons
		// the result set will be empty
		this.iterator(true, "table", function (ctx) {
			if (ctx._buttons) {
				var insts = Buttons.instanceSelector(groupSelector, ctx._buttons)

				for (var i = 0, ien = insts.length; i < ien; i++) {
					jq = jq.add(insts[i].container())
				}
			}
		})

		return jq
	})

	DataTable.Api.register("buttons().container()", function () {
		// API level of nesting is `buttons()` so we can zip into the containers method
		return this.containers().eq(0)
	})

	// Add a new button
	DataTable.Api.register("button().add()", function (idx, conf, draw) {
		var ctx = this.context

		// Don't use `this` as it could be empty - select the instances directly
		if (ctx.length) {
			var inst = Buttons.instanceSelector(this._groupSelector, ctx[0]._buttons)

			if (inst.length) {
				inst[0].add(conf, idx, draw)
			}
		}

		return this.button(this._groupSelector, idx)
	})

	// Destroy the button sets selected
	DataTable.Api.register("buttons().destroy()", function () {
		this.pluck("inst")
			.unique()
			.each(function (inst) {
				inst.destroy()
			})

		return this
	})

	// Remove a button
	DataTable.Api.registerPlural("buttons().remove()", "buttons().remove()", function () {
		this.each(function (set) {
			set.inst.remove(set.node)
		})

		return this
	})

	// Information box that can be used by buttons
	var _infoTimer
	DataTable.Api.register("buttons.info()", function (title, message, time) {
		var that = this

		if (title === false) {
			this.off("destroy.btn-info")
			_fadeOut($("#datatables_buttons_info"), 400, function () {
				$(this).remove()
			})
			clearTimeout(_infoTimer)
			_infoTimer = null

			return this
		}

		if (_infoTimer) {
			clearTimeout(_infoTimer)
		}

		if ($("#datatables_buttons_info").length) {
			$("#datatables_buttons_info").remove()
		}

		title = title ? "<h2>" + title + "</h2>" : ""

		_fadeIn(
			$('<div id="datatables_buttons_info" class="dt-button-info"/>')
				.html(title)
				.append($("<div/>")[typeof message === "string" ? "html" : "append"](message))
				.css("display", "none")
				.appendTo("body")
		)

		if (time !== undefined && time !== 0) {
			_infoTimer = setTimeout(function () {
				that.buttons.info(false)
			}, time)
		}

		this.on("destroy.btn-info", function () {
			that.buttons.info(false)
		})

		return this
	})

	// Get data from the table for export - this is common to a number of plug-in
	// buttons so it is included in the Buttons core library
	DataTable.Api.register("buttons.exportData()", function (options) {
		if (this.context.length) {
			return _exportData(new DataTable.Api(this.context[0]), options)
		}
	})

	// Get information about the export that is common to many of the export data
	// types (DRY)
	DataTable.Api.register("buttons.exportInfo()", function (conf) {
		if (!conf) {
			conf = {}
		}

		return {
			filename: _filename(conf, this),
			title: _title(conf, this),
			messageTop: _message(this, conf, conf.message || conf.messageTop, "top"),
			messageBottom: _message(this, conf, conf.messageBottom, "bottom")
		}
	})

	/**
	 * Get the file name for an exported file.
	 *
	 * @param {object} config Button configuration
	 * @param {object} dt DataTable instance
	 */
	var _filename = function (config, dt) {
		// Backwards compatibility
		var filename = config.filename === "*" && config.title !== "*" && config.title !== undefined && config.title !== null && config.title !== "" ? config.title : config.filename

		if (typeof filename === "function") {
			filename = filename(config, dt)
		}

		if (filename === undefined || filename === null) {
			return null
		}

		if (filename.indexOf("*") !== -1) {
			filename = filename.replace(/\*/g, $("head > title").text()).trim()
		}

		// Strip characters which the OS will object to
		filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, "")

		var extension = _stringOrFunction(config.extension, config, dt)
		if (!extension) {
			extension = ""
		}

		return filename + extension
	}

	/**
	 * Simply utility method to allow parameters to be given as a function
	 *
	 * @param {undefined|string|function} option Option
	 * @return {null|string} Resolved value
	 */
	var _stringOrFunction = function (option, config, dt) {
		if (option === null || option === undefined) {
			return null
		} else if (typeof option === "function") {
			return option(config, dt)
		}
		return option
	}

	/**
	 * Get the title for an exported file.
	 *
	 * @param {object} config	Button configuration
	 */
	var _title = function (config, dt) {
		var title = _stringOrFunction(config.title, config, dt)

		return title === null ? null : title.indexOf("*") !== -1 ? title.replace(/\*/g, $("head > title").text() || "Exported data") : title
	}

	var _message = function (dt, config, option, position) {
		var message = _stringOrFunction(option, config, dt)
		if (message === null) {
			return null
		}

		var caption = $("caption", dt.table().container()).eq(0)
		if (message === "*") {
			var side = caption.css("caption-side")
			if (side !== position) {
				return null
			}

			return caption.length ? caption.text() : ""
		}

		return message
	}

	var _exportTextarea = $("<textarea/>")[0]
	var _exportData = function (dt, inOpts) {
		var config = $.extend(
			true,
			{},
			{
				rows: null,
				columns: "",
				modifier: {
					search: "applied",
					order: "applied"
				},
				orthogonal: "display",
				stripHtml: true,
				stripNewlines: true,
				decodeEntities: true,
				trim: true,
				format: {
					header: function (d) {
						return Buttons.stripData(d, config)
					},
					footer: function (d) {
						return Buttons.stripData(d, config)
					},
					body: function (d) {
						return Buttons.stripData(d, config)
					}
				},
				customizeData: null,
				customizeZip: null
			},
			inOpts
		)

		var header = dt
			.columns(config.columns)
			.indexes()
			.map(function (idx) {
				var col = dt.column(idx)
				return config.format.header(col.title(), idx, col.header())
			})
			.toArray()

		var footer = dt.table().footer()
			? dt
					.columns(config.columns)
					.indexes()
					.map(function (idx) {
						var el = dt.column(idx).footer()
						var val = ""

						if (el) {
							var inner = $(".dt-column-title", el)

							val = inner.length ? inner.html() : $(el).html()
						}

						return config.format.footer(val, idx, el)
					})
					.toArray()
			: null

		// If Select is available on this table, and any rows are selected, limit the export
		// to the selected rows. If no rows are selected, all rows will be exported. Specify
		// a `selected` modifier to control directly.
		var modifier = $.extend({}, config.modifier)
		if (dt.select && typeof dt.select.info === "function" && modifier.selected === undefined) {
			if (dt.rows(config.rows, $.extend({ selected: true }, modifier)).any()) {
				$.extend(modifier, { selected: true })
			}
		}

		var rowIndexes = dt.rows(config.rows, modifier).indexes().toArray()
		var selectedCells = dt.cells(rowIndexes, config.columns, {
			order: modifier.order
		})
		var cells = selectedCells.render(config.orthogonal).toArray()
		var cellNodes = selectedCells.nodes().toArray()
		var cellIndexes = selectedCells.indexes().toArray()

		var columns = dt.columns(config.columns).count()
		var rows = columns > 0 ? cells.length / columns : 0
		var body = []
		var cellCounter = 0

		for (var i = 0, ien = rows; i < ien; i++) {
			var row = [columns]

			for (var j = 0; j < columns; j++) {
				row[j] = config.format.body(cells[cellCounter], cellIndexes[cellCounter].row, cellIndexes[cellCounter].column, cellNodes[cellCounter])
				cellCounter++
			}

			body[i] = row
		}

		var data = {
			header: header,
			headerStructure: _headerFormatter(config.format.header, dt.table().header.structure(config.columns)),
			footer: footer,
			footerStructure: _headerFormatter(config.format.footer, dt.table().footer.structure(config.columns)),
			body: body
		}

		if (config.customizeData) {
			config.customizeData(data)
		}

		return data
	}

	function _headerFormatter(formatter, struct) {
		for (var i = 0; i < struct.length; i++) {
			for (var j = 0; j < struct[i].length; j++) {
				var item = struct[i][j]

				if (item) {
					item.title = formatter(item.title, j, item.cell)
				}
			}
		}

		return struct
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * DataTables interface
	 */

	// Attach to DataTables objects for global access
	$.fn.dataTable.Buttons = Buttons
	$.fn.DataTable.Buttons = Buttons

	// DataTables creation - check if the buttons have been defined for this table,
	// they will have been if the `B` option was used in `dom`, otherwise we should
	// create the buttons instance here so they can be inserted into the document
	// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
	// be removed in future.
	$(document).on("init.dt plugin-init.dt", function (e, settings) {
		if (e.namespace !== "dt") {
			return
		}

		var opts = settings.oInit.buttons || DataTable.defaults.buttons

		if (opts && !settings._buttons) {
			new Buttons(settings, opts).container()
		}
	})

	function _init(settings, options) {
		var api = new DataTable.Api(settings)
		var opts = options ? options : api.init().buttons || DataTable.defaults.buttons

		return new Buttons(api, opts).container()
	}

	// DataTables 1 `dom` feature option
	DataTable.ext.feature.push({
		fnInit: _init,
		cFeature: "B"
	})

	// DataTables 2 layout feature
	if (DataTable.feature) {
		DataTable.feature.register("buttons", _init)
	}

	return DataTable
})

/*! DataTables styling wrapper for Buttons
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net-dt", "datatables.net-buttons"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net-dt")(root, $)
			}

			if (!$.fn.dataTable.Buttons) {
				require("datatables.net-buttons")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	return DataTable
})

/*!
 * Column visibility buttons for Buttons and DataTables.
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net", "datatables.net-buttons"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}

			if (!$.fn.dataTable.Buttons) {
				require("datatables.net-buttons")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	$.extend(DataTable.ext.buttons, {
		// A collection of column visibility buttons
		colvis: function (dt, conf) {
			var node = null
			var buttonConf = {
				extend: "collection",
				init: function (dt, n) {
					node = n
				},
				text: function (dt) {
					return dt.i18n("buttons.colvis", "Column visibility")
				},
				className: "buttons-colvis",
				closeButton: false,
				buttons: [
					{
						extend: "columnsToggle",
						columns: conf.columns,
						columnText: conf.columnText
					}
				]
			}

			// Rebuild the collection with the new column structure if columns are reordered
			dt.on("column-reorder.dt" + conf.namespace, function () {
				dt.button(null, dt.button(null, node).node()).collectionRebuild([
					{
						extend: "columnsToggle",
						columns: conf.columns,
						columnText: conf.columnText
					}
				])
			})

			return buttonConf
		},

		// Selected columns with individual buttons - toggle column visibility
		columnsToggle: function (dt, conf) {
			var columns = dt
				.columns(conf.columns)
				.indexes()
				.map(function (idx) {
					return {
						extend: "columnToggle",
						columns: idx,
						columnText: conf.columnText
					}
				})
				.toArray()

			return columns
		},

		// Single button to toggle column visibility
		columnToggle: function (dt, conf) {
			return {
				extend: "columnVisibility",
				columns: conf.columns,
				columnText: conf.columnText
			}
		},

		// Selected columns with individual buttons - set column visibility
		columnsVisibility: function (dt, conf) {
			var columns = dt
				.columns(conf.columns)
				.indexes()
				.map(function (idx) {
					return {
						extend: "columnVisibility",
						columns: idx,
						visibility: conf.visibility,
						columnText: conf.columnText
					}
				})
				.toArray()

			return columns
		},

		// Single button to set column visibility
		columnVisibility: {
			columns: undefined, // column selector
			text: function (dt, button, conf) {
				return conf._columnText(dt, conf)
			},
			className: "buttons-columnVisibility",
			action: function (e, dt, button, conf) {
				var col = dt.columns(conf.columns)
				var curr = col.visible()

				col.visible(conf.visibility !== undefined ? conf.visibility : !(curr.length ? curr[0] : false))
			},
			init: function (dt, button, conf) {
				var that = this
				button.attr("data-cv-idx", conf.columns)

				dt.on("column-visibility.dt" + conf.namespace, function (e, settings) {
					if (!settings.bDestroying && settings.nTable == dt.settings()[0].nTable) {
						that.active(dt.column(conf.columns).visible())
					}
				}).on("column-reorder.dt" + conf.namespace, function () {
					// Button has been removed from the DOM
					if (conf.destroying) {
						return
					}

					if (dt.columns(conf.columns).count() !== 1) {
						return
					}

					// This button controls the same column index but the text for the column has
					// changed
					that.text(conf._columnText(dt, conf))

					// Since its a different column, we need to check its visibility
					that.active(dt.column(conf.columns).visible())
				})

				this.active(dt.column(conf.columns).visible())
			},
			destroy: function (dt, button, conf) {
				dt.off("column-visibility.dt" + conf.namespace).off("column-reorder.dt" + conf.namespace)
			},

			_columnText: function (dt, conf) {
				if (typeof conf.text === "string") {
					return conf.text
				}

				var title = dt.column(conf.columns).title()
				var idx = dt.column(conf.columns).index()

				title = title
					.replace(/\n/g, " ") // remove new lines
					.replace(/<br\s*\/?>/gi, " ") // replace line breaks with spaces
					.replace(/<select(.*?)<\/select\s*>/gi, "") // remove select tags, including options text

				// Strip HTML comments
				title = DataTable.Buttons.stripHtmlComments(title)

				// Use whatever HTML stripper DataTables is configured for
				title = DataTable.util.stripHtml(title).trim()

				return conf.columnText ? conf.columnText(dt, idx, title) : title
			}
		},

		colvisRestore: {
			className: "buttons-colvisRestore",

			text: function (dt) {
				return dt.i18n("buttons.colvisRestore", "Restore visibility")
			},

			init: function (dt, button, conf) {
				// Use a private parameter on the column. This gets moved around with the
				// column if ColReorder changes the order
				dt.columns().every(function () {
					var init = this.init()

					if (init.__visOriginal === undefined) {
						init.__visOriginal = this.visible()
					}
				})
			},

			action: function (e, dt, button, conf) {
				dt.columns().every(function (i) {
					var init = this.init()

					this.visible(init.__visOriginal)
				})
			}
		},

		colvisGroup: {
			className: "buttons-colvisGroup",

			action: function (e, dt, button, conf) {
				dt.columns(conf.show).visible(true, false)
				dt.columns(conf.hide).visible(false, false)

				dt.columns.adjust()
			},

			show: [],

			hide: []
		}
	})

	return DataTable
})

/*!
 * HTML5 export buttons for Buttons and DataTables.
 * © SpryMedia Ltd - datatables.net/license
 *
 * FileSaver.js (1.3.3) - MIT license
 * Copyright © 2016 Eli Grey - http://eligrey.com
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net", "datatables.net-buttons"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}

			if (!$.fn.dataTable.Buttons) {
				require("datatables.net-buttons")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	// Allow the constructor to pass in JSZip and PDFMake from external requires.
	// Otherwise, use globally defined variables, if they are available.
	var useJszip
	var usePdfmake

	function _jsZip() {
		return useJszip || window.JSZip
	}
	function _pdfMake() {
		return usePdfmake || window.pdfMake
	}

	DataTable.Buttons.pdfMake = function (_) {
		if (!_) {
			return _pdfMake()
		}
		usePdfmake = _
	}

	DataTable.Buttons.jszip = function (_) {
		if (!_) {
			return _jsZip()
		}
		useJszip = _
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * FileSaver.js dependency
	 */

	/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

	var _saveAs = (function (view) {
		"use strict"
		// IE <10 is explicitly unsupported
		if (typeof view === "undefined" || (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent))) {
			return
		}
		var doc = view.document,
			// only get URL when necessary in case Blob.js hasn't overridden it yet
			get_URL = function () {
				return view.URL || view.webkitURL || view
			},
			save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
			can_use_save_link = "download" in save_link,
			click = function (node) {
				var event = new MouseEvent("click")
				node.dispatchEvent(event)
			},
			is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
			is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
			throw_outside = function (ex) {
				;(view.setImmediate || view.setTimeout)(function () {
					throw ex
				}, 0)
			},
			force_saveable_type = "application/octet-stream",
			// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
			arbitrary_revoke_timeout = 1000 * 40, // in ms
			revoke = function (file) {
				var revoker = function () {
					if (typeof file === "string") {
						// file is an object URL
						get_URL().revokeObjectURL(file)
					} else {
						// file is a File
						file.remove()
					}
				}
				setTimeout(revoker, arbitrary_revoke_timeout)
			},
			dispatch = function (filesaver, event_types, event) {
				event_types = [].concat(event_types)
				var i = event_types.length
				while (i--) {
					var listener = filesaver["on" + event_types[i]]
					if (typeof listener === "function") {
						try {
							listener.call(filesaver, event || filesaver)
						} catch (ex) {
							throw_outside(ex)
						}
					}
				}
			},
			auto_bom = function (blob) {
				// prepend BOM for UTF-8 XML and text/* types (including HTML)
				// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
				if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
					return new Blob([String.fromCharCode(0xfeff), blob], {
						type: blob.type
					})
				}
				return blob
			},
			FileSaver = function (blob, name, no_auto_bom) {
				if (!no_auto_bom) {
					blob = auto_bom(blob)
				}
				// First try a.download, then web filesystem, then object URLs
				var filesaver = this,
					type = blob.type,
					force = type === force_saveable_type,
					object_url,
					dispatch_all = function () {
						dispatch(filesaver, "writestart progress write writeend".split(" "))
					},
					// on any filesys errors revert to saving with object URLs
					fs_error = function () {
						if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
							// Safari doesn't allow downloading of blob urls
							var reader = new FileReader()
							reader.onloadend = function () {
								var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, "data:attachment/file;")
								var popup = view.open(url, "_blank")
								if (!popup) view.location.href = url
								url = undefined // release reference before dispatching
								filesaver.readyState = filesaver.DONE
								dispatch_all()
							}
							reader.readAsDataURL(blob)
							filesaver.readyState = filesaver.INIT
							return
						}
						// don't create more object URLs than needed
						if (!object_url) {
							object_url = get_URL().createObjectURL(blob)
						}
						if (force) {
							view.location.href = object_url
						} else {
							var opened = view.open(object_url, "_blank")
							if (!opened) {
								// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
								view.location.href = object_url
							}
						}
						filesaver.readyState = filesaver.DONE
						dispatch_all()
						revoke(object_url)
					}
				filesaver.readyState = filesaver.INIT

				if (can_use_save_link) {
					object_url = get_URL().createObjectURL(blob)
					setTimeout(function () {
						save_link.href = object_url
						save_link.download = name
						click(save_link)
						dispatch_all()
						revoke(object_url)
						filesaver.readyState = filesaver.DONE
					})
					return
				}

				fs_error()
			},
			FS_proto = FileSaver.prototype,
			saveAs = function (blob, name, no_auto_bom) {
				return new FileSaver(blob, name || blob.name || "download", no_auto_bom)
			}
		// IE 10+ (native saveAs)
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
			return function (blob, name, no_auto_bom) {
				name = name || blob.name || "download"

				if (!no_auto_bom) {
					blob = auto_bom(blob)
				}
				return navigator.msSaveOrOpenBlob(blob, name)
			}
		}

		FS_proto.abort = function () {}
		FS_proto.readyState = FS_proto.INIT = 0
		FS_proto.WRITING = 1
		FS_proto.DONE = 2

		FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null

		return saveAs
	})((typeof self !== "undefined" && self) || (typeof window !== "undefined" && window) || this.content)

	// Expose file saver on the DataTables API. Can't attach to `DataTables.Buttons`
	// since this file can be loaded before Button's core!
	DataTable.fileSave = _saveAs

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Local (private) functions
	 */

	/**
	 * Get the sheet name for Excel exports.
	 *
	 * @param {object}	config Button configuration
	 */
	var _sheetname = function (config) {
		var sheetName = "Sheet1"

		if (config.sheetName) {
			sheetName = config.sheetName.replace(/[\[\]\*\/\\\?\:]/g, "")
		}

		return sheetName
	}

	/**
	 * Get the newline character(s)
	 *
	 * @param {object}	config Button configuration
	 * @return {string}				Newline character
	 */
	var _newLine = function (config) {
		return config.newline ? config.newline : navigator.userAgent.match(/Windows/) ? "\r\n" : "\n"
	}

	/**
	 * Combine the data from the `buttons.exportData` method into a string that
	 * will be used in the export file.
	 *
	 * @param	{DataTable.Api} dt		 DataTables API instance
	 * @param	{object}				config Button configuration
	 * @return {object}							 The data to export
	 */
	var _exportData = function (dt, config) {
		var newLine = _newLine(config)
		var data = dt.buttons.exportData(config.exportOptions)
		var boundary = config.fieldBoundary
		var separator = config.fieldSeparator
		var reBoundary = new RegExp(boundary, "g")
		var escapeChar = config.escapeChar !== undefined ? config.escapeChar : "\\"
		var join = function (a) {
			var s = ""

			// If there is a field boundary, then we might need to escape it in
			// the source data
			for (var i = 0, ien = a.length; i < ien; i++) {
				if (i > 0) {
					s += separator
				}

				s += boundary ? boundary + ("" + a[i]).replace(reBoundary, escapeChar + boundary) + boundary : a[i]
			}

			return s
		}

		var header = ""
		var footer = ""
		var body = []

		if (config.header) {
			header =
				data.headerStructure
					.map(function (row) {
						return join(
							row.map(function (cell) {
								return cell ? cell.title : ""
							})
						)
					})
					.join(newLine) + newLine
		}

		if (config.footer && data.footer) {
			footer =
				data.footerStructure
					.map(function (row) {
						return join(
							row.map(function (cell) {
								return cell ? cell.title : ""
							})
						)
					})
					.join(newLine) + newLine
		}

		for (var i = 0, ien = data.body.length; i < ien; i++) {
			body.push(join(data.body[i]))
		}

		return {
			str: header + body.join(newLine) + newLine + footer,
			rows: body.length
		}
	}

	/**
	 * Older versions of Safari (prior to tech preview 18) don't support the
	 * download option required.
	 *
	 * @return {Boolean} `true` if old Safari
	 */
	var _isDuffSafari = function () {
		var safari = navigator.userAgent.indexOf("Safari") !== -1 && navigator.userAgent.indexOf("Chrome") === -1 && navigator.userAgent.indexOf("Opera") === -1

		if (!safari) {
			return false
		}

		var version = navigator.userAgent.match(/AppleWebKit\/(\d+\.\d+)/)
		if (version && version.length > 1 && version[1] * 1 < 603.1) {
			return true
		}

		return false
	}

	/**
	 * Convert from numeric position to letter for column names in Excel
	 * @param  {int} n Column number
	 * @return {string} Column letter(s) name
	 */
	function createCellPos(n) {
		var ordA = "A".charCodeAt(0)
		var ordZ = "Z".charCodeAt(0)
		var len = ordZ - ordA + 1
		var s = ""

		while (n >= 0) {
			s = String.fromCharCode((n % len) + ordA) + s
			n = Math.floor(n / len) - 1
		}

		return s
	}

	try {
		var _serialiser = new XMLSerializer()
		var _ieExcel
	} catch (t) {
		// noop
	}

	/**
	 * Recursively add XML files from an object's structure to a ZIP file. This
	 * allows the XSLX file to be easily defined with an object's structure matching
	 * the files structure.
	 *
	 * @param {JSZip} zip ZIP package
	 * @param {object} obj Object to add (recursive)
	 */
	function _addToZip(zip, obj) {
		if (_ieExcel === undefined) {
			// Detect if we are dealing with IE's _awful_ serialiser by seeing if it
			// drop attributes
			_ieExcel = _serialiser.serializeToString(new window.DOMParser().parseFromString(excelStrings["xl/worksheets/sheet1.xml"], "text/xml")).indexOf("xmlns:r") === -1
		}

		$.each(obj, function (name, val) {
			if ($.isPlainObject(val)) {
				var newDir = zip.folder(name)
				_addToZip(newDir, val)
			} else {
				if (_ieExcel) {
					// IE's XML serialiser will drop some name space attributes from
					// from the root node, so we need to save them. Do this by
					// replacing the namespace nodes with a regular attribute that
					// we convert back when serialised. Edge does not have this
					// issue
					var worksheet = val.childNodes[0]
					var i, ien
					var attrs = []

					for (i = worksheet.attributes.length - 1; i >= 0; i--) {
						var attrName = worksheet.attributes[i].nodeName
						var attrValue = worksheet.attributes[i].nodeValue

						if (attrName.indexOf(":") !== -1) {
							attrs.push({ name: attrName, value: attrValue })

							worksheet.removeAttribute(attrName)
						}
					}

					for (i = 0, ien = attrs.length; i < ien; i++) {
						var attr = val.createAttribute(attrs[i].name.replace(":", "_dt_b_namespace_token_"))
						attr.value = attrs[i].value
						worksheet.setAttributeNode(attr)
					}
				}

				var str = _serialiser.serializeToString(val)

				// Fix IE's XML
				if (_ieExcel) {
					// IE doesn't include the XML declaration
					if (str.indexOf("<?xml") === -1) {
						str = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + str
					}

					// Return namespace attributes to being as such
					str = str.replace(/_dt_b_namespace_token_/g, ":")

					// Remove testing name space that IE puts into the space preserve attr
					str = str.replace(/xmlns:NS[\d]+="" NS[\d]+:/g, "")
				}

				// Safari, IE and Edge will put empty name space attributes onto
				// various elements making them useless. This strips them out
				str = str.replace(/<([^<>]*?) xmlns=""([^<>]*?)>/g, "<$1 $2>")

				zip.file(name, str)
			}
		})
	}

	/**
	 * Create an XML node and add any children, attributes, etc without needing to
	 * be verbose in the DOM.
	 *
	 * @param  {object} doc      XML document
	 * @param  {string} nodeName Node name
	 * @param  {object} opts     Options - can be `attr` (attributes), `children`
	 *   (child nodes) and `text` (text content)
	 * @return {node}            Created node
	 */
	function _createNode(doc, nodeName, opts) {
		var tempNode = doc.createElement(nodeName)

		if (opts) {
			if (opts.attr) {
				$(tempNode).attr(opts.attr)
			}

			if (opts.children) {
				$.each(opts.children, function (key, value) {
					tempNode.appendChild(value)
				})
			}

			if (opts.text !== null && opts.text !== undefined) {
				tempNode.appendChild(doc.createTextNode(opts.text))
			}
		}

		return tempNode
	}

	/**
	 * Get the width for an Excel column based on the contents of that column
	 * @param  {object} data Data for export
	 * @param  {int}    col  Column index
	 * @return {int}         Column width
	 */
	function _excelColWidth(data, col) {
		var max = data.header[col].length
		var len, lineSplit, str

		if (data.footer && data.footer[col] && data.footer[col].length > max) {
			max = data.footer[col].length
		}

		for (var i = 0, ien = data.body.length; i < ien; i++) {
			var point = data.body[i][col]
			str = point !== null && point !== undefined ? point.toString() : ""

			// If there is a newline character, workout the width of the column
			// based on the longest line in the string
			if (str.indexOf("\n") !== -1) {
				lineSplit = str.split("\n")
				lineSplit.sort(function (a, b) {
					return b.length - a.length
				})

				len = lineSplit[0].length
			} else {
				len = str.length
			}

			if (len > max) {
				max = len
			}

			// Max width rather than having potentially massive column widths
			if (max > 40) {
				return 54 // 40 * 1.35
			}
		}

		max *= 1.35

		// And a min width
		return max > 6 ? max : 6
	}

	// Excel - Pre-defined strings to build a basic XLSX file
	var excelStrings = {
		"_rels/.rels":
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
			"</Relationships>",

		"xl/_rels/workbook.xml.rels":
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
			'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
			"</Relationships>",

		"[Content_Types].xml":
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
			'<Default Extension="xml" ContentType="application/xml" />' +
			'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />' +
			'<Default Extension="jpeg" ContentType="image/jpeg" />' +
			'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />' +
			'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />' +
			'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" />' +
			"</Types>",

		"xl/workbook.xml":
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
			'<fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/>' +
			'<workbookPr showInkAnnotation="0" autoCompressPictures="0"/>' +
			"<bookViews>" +
			'<workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/>' +
			"</bookViews>" +
			"<sheets>" +
			'<sheet name="Sheet1" sheetId="1" r:id="rId1"/>' +
			"</sheets>" +
			"<definedNames/>" +
			"</workbook>",

		"xl/worksheets/sheet1.xml":
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">' +
			"<sheetData/>" +
			'<mergeCells count="0"/>' +
			"</worksheet>",

		"xl/styles.xml":
			'<?xml version="1.0" encoding="UTF-8"?>' +
			'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">' +
			'<numFmts count="6">' +
			'<numFmt numFmtId="164" formatCode="[$$-409]#,##0.00;-[$$-409]#,##0.00"/>' +
			'<numFmt numFmtId="165" formatCode="&quot;£&quot;#,##0.00"/>' +
			'<numFmt numFmtId="166" formatCode="[$€-2] #,##0.00"/>' +
			'<numFmt numFmtId="167" formatCode="0.0%"/>' +
			'<numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/>' +
			'<numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/>' +
			"</numFmts>" +
			'<fonts count="5" x14ac:knownFonts="1">' +
			"<font>" +
			'<sz val="11" />' +
			'<name val="Calibri" />' +
			"</font>" +
			"<font>" +
			'<sz val="11" />' +
			'<name val="Calibri" />' +
			'<color rgb="FFFFFFFF" />' +
			"</font>" +
			"<font>" +
			'<sz val="11" />' +
			'<name val="Calibri" />' +
			"<b />" +
			"</font>" +
			"<font>" +
			'<sz val="11" />' +
			'<name val="Calibri" />' +
			"<i />" +
			"</font>" +
			"<font>" +
			'<sz val="11" />' +
			'<name val="Calibri" />' +
			"<u />" +
			"</font>" +
			"</fonts>" +
			'<fills count="6">' +
			"<fill>" +
			'<patternFill patternType="none" />' +
			"</fill>" +
			"<fill>" + // Excel appears to use this as a dotted background regardless of values but
			'<patternFill patternType="none" />' + // to be valid to the schema, use a patternFill
			"</fill>" +
			"<fill>" +
			'<patternFill patternType="solid">' +
			'<fgColor rgb="FFD9D9D9" />' +
			'<bgColor indexed="64" />' +
			"</patternFill>" +
			"</fill>" +
			"<fill>" +
			'<patternFill patternType="solid">' +
			'<fgColor rgb="FFD99795" />' +
			'<bgColor indexed="64" />' +
			"</patternFill>" +
			"</fill>" +
			"<fill>" +
			'<patternFill patternType="solid">' +
			'<fgColor rgb="ffc6efce" />' +
			'<bgColor indexed="64" />' +
			"</patternFill>" +
			"</fill>" +
			"<fill>" +
			'<patternFill patternType="solid">' +
			'<fgColor rgb="ffc6cfef" />' +
			'<bgColor indexed="64" />' +
			"</patternFill>" +
			"</fill>" +
			"</fills>" +
			'<borders count="2">' +
			"<border>" +
			"<left />" +
			"<right />" +
			"<top />" +
			"<bottom />" +
			"<diagonal />" +
			"</border>" +
			'<border diagonalUp="false" diagonalDown="false">' +
			'<left style="thin">' +
			'<color auto="1" />' +
			"</left>" +
			'<right style="thin">' +
			'<color auto="1" />' +
			"</right>" +
			'<top style="thin">' +
			'<color auto="1" />' +
			"</top>" +
			'<bottom style="thin">' +
			'<color auto="1" />' +
			"</bottom>" +
			"<diagonal />" +
			"</border>" +
			"</borders>" +
			'<cellStyleXfs count="1">' +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" />' +
			"</cellStyleXfs>" +
			'<cellXfs count="68">' +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment horizontal="left"/>' +
			"</xf>" +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment horizontal="center"/>' +
			"</xf>" +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment horizontal="right"/>' +
			"</xf>" +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment horizontal="fill"/>' +
			"</xf>" +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment textRotation="90"/>' +
			"</xf>" +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
			'<alignment wrapText="1"/>' +
			"</xf>" +
			'<xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			'<xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
			"</cellXfs>" +
			'<cellStyles count="1">' +
			'<cellStyle name="Normal" xfId="0" builtinId="0" />' +
			"</cellStyles>" +
			'<dxfs count="0" />' +
			'<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" />' +
			"</styleSheet>"
	}
	// Note we could use 3 `for` loops for the styles, but when gzipped there is
	// virtually no difference in size, since the above can be easily compressed

	// Pattern matching for special number formats. Perhaps this should be exposed
	// via an API in future?
	// Ref: section 3.8.30 - built in formatters in open spreadsheet
	//   https://www.ecma-international.org/news/TC45_current_work/Office%20Open%20XML%20Part%204%20-%20Markup%20Language%20Reference.pdf
	var _excelSpecials = [
		{
			match: /^\-?\d+\.\d%$/,
			style: 60,
			fmt: function (d) {
				return d / 100
			}
		}, // Percent with d.p.
		{
			match: /^\-?\d+\.?\d*%$/,
			style: 56,
			fmt: function (d) {
				return d / 100
			}
		}, // Percent
		{ match: /^\-?\$[\d,]+.?\d*$/, style: 57 }, // Dollars
		{ match: /^\-?£[\d,]+.?\d*$/, style: 58 }, // Pounds
		{ match: /^\-?€[\d,]+.?\d*$/, style: 59 }, // Euros
		{ match: /^\-?\d+$/, style: 65 }, // Numbers without thousand separators
		{ match: /^\-?\d+\.\d{2}$/, style: 66 }, // Numbers 2 d.p. without thousands separators
		{
			match: /^\([\d,]+\)$/,
			style: 61,
			fmt: function (d) {
				return -1 * d.replace(/[\(\)]/g, "")
			}
		}, // Negative numbers indicated by brackets
		{
			match: /^\([\d,]+\.\d{2}\)$/,
			style: 62,
			fmt: function (d) {
				return -1 * d.replace(/[\(\)]/g, "")
			}
		}, // Negative numbers indicated by brackets - 2d.p.
		{ match: /^\-?[\d,]+$/, style: 63 }, // Numbers with thousand separators
		{ match: /^\-?[\d,]+\.\d{2}$/, style: 64 },
		{
			match: /^(19\d\d|[2-9]\d\d\d)\-(0\d|1[012])\-[0123][\d]$/,
			style: 67,
			fmt: function (d) {
				return Math.round(25569 + Date.parse(d) / (86400 * 1000))
			}
		} //Date yyyy-mm-dd
	]

	var _excelMergeCells = function (rels, row, column, rowspan, colspan) {
		var mergeCells = $("mergeCells", rels)

		mergeCells[0].appendChild(
			_createNode(rels, "mergeCell", {
				attr: {
					ref: createCellPos(column) + row + ":" + createCellPos(column + colspan - 1) + (row + rowspan - 1)
				}
			})
		)

		mergeCells.attr("count", parseFloat(mergeCells.attr("count")) + 1)
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Buttons
	 */

	//
	// Copy to clipboard
	//
	DataTable.ext.buttons.copyHtml5 = {
		className: "buttons-copy buttons-html5",

		text: function (dt) {
			return dt.i18n("buttons.copy", "Copy")
		},

		action: function (e, dt, button, config, cb) {
			var exportData = _exportData(dt, config)
			var info = dt.buttons.exportInfo(config)
			var newline = _newLine(config)
			var output = exportData.str
			var hiddenDiv = $("<div/>").css({
				height: 1,
				width: 1,
				overflow: "hidden",
				position: "fixed",
				top: 0,
				left: 0
			})

			// Changes made by Breck.
			// Do not append stuff to data. Keep it clean.
			// if (info.title) {
			// 	output = info.title + newline + newline + output
			// }

			// if (info.messageTop) {
			// 	output = info.messageTop + newline + newline + output
			// }

			// if (info.messageBottom) {
			// 	output = output + newline + newline + info.messageBottom
			// }

			// if (config.customize) {
			// 	output = config.customize(output, config, dt)
			// }
			output = output.trim()

			var textarea = $("<textarea readonly/>").val(output).appendTo(hiddenDiv)

			// For browsers that support the copy execCommand, try to use it
			if (document.queryCommandSupported("copy")) {
				hiddenDiv.appendTo(dt.table().container())
				textarea[0].focus()
				textarea[0].select()

				try {
					var successful = document.execCommand("copy")
					hiddenDiv.remove()

					if (successful) {
						if (config.copySuccess) {
							dt.buttons.info(
								dt.i18n("buttons.copyTitle", "Copy to clipboard"),
								dt.i18n(
									"buttons.copySuccess",
									{
										1: "Copied one row to clipboard",
										_: "Copied %d rows to clipboard"
									},
									exportData.rows
								),
								2000
							)
						}

						cb()
						return
					}
				} catch (t) {
					// noop
				}
			}

			// Otherwise we show the text box and instruct the user to use it
			var message = $(
				"<span>" + dt.i18n("buttons.copyKeys", "Press <i>ctrl</i> or <i>\u2318</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>" + "To cancel, click this message or press escape.") + "</span>"
			).append(hiddenDiv)

			dt.buttons.info(dt.i18n("buttons.copyTitle", "Copy to clipboard"), message, 0)

			// Select the text so when the user activates their system clipboard
			// it will copy that text
			textarea[0].focus()
			textarea[0].select()

			// Event to hide the message when the user is done
			var container = $(message).closest(".dt-button-info")
			var close = function () {
				container.off("click.buttons-copy")
				$(document).off(".buttons-copy")
				dt.buttons.info(false)
			}

			container.on("click.buttons-copy", function () {
				close()
				cb()
			})
			$(document)
				.on("keydown.buttons-copy", function (e) {
					if (e.keyCode === 27) {
						// esc
						close()
						cb()
					}
				})
				.on("copy.buttons-copy cut.buttons-copy", function () {
					close()
					cb()
				})
		},

		async: 100,

		copySuccess: true,

		exportOptions: {},

		fieldSeparator: "\t",

		fieldBoundary: "",

		header: true,

		footer: true,

		title: "*",

		messageTop: "*",

		messageBottom: "*"
	}

	//
	// CSV export
	//
	DataTable.ext.buttons.csvHtml5 = {
		bom: false,

		className: "buttons-csv buttons-html5",

		available: function () {
			return window.FileReader !== undefined && window.Blob
		},

		text: function (dt) {
			return dt.i18n("buttons.csv", "CSV")
		},

		action: function (e, dt, button, config, cb) {
			// Set the text
			var output = _exportData(dt, config).str
			var info = dt.buttons.exportInfo(config)
			var charset = config.charset

			if (config.customize) {
				output = config.customize(output, config, dt)
			}

			if (charset !== false) {
				if (!charset) {
					charset = document.characterSet || document.charset
				}

				if (charset) {
					charset = ";charset=" + charset
				}
			} else {
				charset = ""
			}

			if (config.bom) {
				output = String.fromCharCode(0xfeff) + output
			}

			_saveAs(new Blob([output], { type: "text/csv" + charset }), info.filename, true)

			cb()
		},

		async: 100,

		filename: "*",

		extension: ".csv",

		exportOptions: {},

		fieldSeparator: ",",

		fieldBoundary: '"',

		escapeChar: '"',

		charset: null,

		header: true,

		footer: true
	}

	//
	// Excel (xlsx) export
	//
	DataTable.ext.buttons.excelHtml5 = {
		className: "buttons-excel buttons-html5",

		available: function () {
			return window.FileReader !== undefined && _jsZip() !== undefined && !_isDuffSafari() && _serialiser
		},

		text: function (dt) {
			return dt.i18n("buttons.excel", "Excel")
		},

		action: function (e, dt, button, config, cb) {
			var rowPos = 0
			var dataStartRow, dataEndRow
			var getXml = function (type) {
				var str = excelStrings[type]

				//str = str.replace( /xmlns:/g, 'xmlns_' ).replace( /mc:/g, 'mc_' );

				return $.parseXML(str)
			}
			var rels = getXml("xl/worksheets/sheet1.xml")
			var relsGet = rels.getElementsByTagName("sheetData")[0]

			var xlsx = {
				_rels: {
					".rels": getXml("_rels/.rels")
				},
				xl: {
					_rels: {
						"workbook.xml.rels": getXml("xl/_rels/workbook.xml.rels")
					},
					"workbook.xml": getXml("xl/workbook.xml"),
					"styles.xml": getXml("xl/styles.xml"),
					worksheets: {
						"sheet1.xml": rels
					}
				},
				"[Content_Types].xml": getXml("[Content_Types].xml")
			}

			var data = dt.buttons.exportData(config.exportOptions)
			var currentRow, rowNode
			var addRow = function (row) {
				currentRow = rowPos + 1
				rowNode = _createNode(rels, "row", { attr: { r: currentRow } })

				for (var i = 0, ien = row.length; i < ien; i++) {
					// Concat both the Cell Columns as a letter and the Row of the cell.
					var cellId = createCellPos(i) + "" + currentRow
					var cell = null

					// For null, undefined of blank cell, continue so it doesn't create the _createNode
					if (row[i] === null || row[i] === undefined || row[i] === "") {
						if (config.createEmptyCells === true) {
							row[i] = ""
						} else {
							continue
						}
					}

					var originalContent = row[i]
					row[i] = typeof row[i].trim === "function" ? row[i].trim() : row[i]

					// Special number formatting options
					for (var j = 0, jen = _excelSpecials.length; j < jen; j++) {
						var special = _excelSpecials[j]

						// TODO Need to provide the ability for the specials to say
						// if they are returning a string, since at the moment it is
						// assumed to be a number
						if (row[i].match && !row[i].match(/^0\d+/) && row[i].match(special.match)) {
							var val = row[i].replace(/[^\d\.\-]/g, "")

							if (special.fmt) {
								val = special.fmt(val)
							}

							cell = _createNode(rels, "c", {
								attr: {
									r: cellId,
									s: special.style
								},
								children: [_createNode(rels, "v", { text: val })]
							})

							break
						}
					}

					if (!cell) {
						if (
							typeof row[i] === "number" ||
							(row[i].match &&
								row[i].match(/^-?\d+(\.\d+)?([eE]\-?\d+)?$/) && // Includes exponential format
								!row[i].match(/^0\d+/))
						) {
							// Detect numbers - don't match numbers with leading zeros
							// or a negative anywhere but the start
							cell = _createNode(rels, "c", {
								attr: {
									t: "n",
									r: cellId
								},
								children: [_createNode(rels, "v", { text: row[i] })]
							})
						} else {
							// String output - replace non standard characters for text output
							/*eslint no-control-regex: "off"*/
							var text = !originalContent.replace ? originalContent : originalContent.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")

							cell = _createNode(rels, "c", {
								attr: {
									t: "inlineStr",
									r: cellId
								},
								children: {
									row: _createNode(rels, "is", {
										children: {
											row: _createNode(rels, "t", {
												text: text,
												attr: {
													"xml:space": "preserve"
												}
											})
										}
									})
								}
							})
						}
					}

					rowNode.appendChild(cell)
				}

				relsGet.appendChild(rowNode)
				rowPos++
			}

			var addHeader = function (structure) {
				structure.forEach(function (row) {
					addRow(
						row.map(function (cell) {
							return cell ? cell.title : ""
						}),
						rowPos
					)
					$("row:last c", rels).attr("s", "2") // bold

					// Add any merge cells
					row.forEach(function (cell, columnCounter) {
						if (cell && (cell.colSpan > 1 || cell.rowSpan > 1)) {
							_excelMergeCells(rels, rowPos, columnCounter, cell.rowSpan, cell.colSpan)
						}
					})
				})
			}

			// Title and top messages
			var exportInfo = dt.buttons.exportInfo(config)
			if (exportInfo.title) {
				addRow([exportInfo.title], rowPos)
				_excelMergeCells(rels, rowPos, 0, 1, data.header.length)
				$("row:last c", rels).attr("s", "51") // centre
			}

			if (exportInfo.messageTop) {
				addRow([exportInfo.messageTop], rowPos)
				_excelMergeCells(rels, rowPos, 0, 1, data.header.length)
			}

			// Table header
			if (config.header) {
				addHeader(data.headerStructure)
			}

			dataStartRow = rowPos

			// Table body
			for (var n = 0, ie = data.body.length; n < ie; n++) {
				addRow(data.body[n], rowPos)
			}

			dataEndRow = rowPos

			// Table footer
			if (config.footer && data.footer) {
				addHeader(data.footerStructure)
			}

			// Below the table
			if (exportInfo.messageBottom) {
				addRow([exportInfo.messageBottom], rowPos)
				_excelMergeCells(rels, rowPos, 0, 1, data.header.length)
			}

			// Set column widths
			var cols = _createNode(rels, "cols")
			$("worksheet", rels).prepend(cols)

			for (var i = 0, ien = data.header.length; i < ien; i++) {
				cols.appendChild(
					_createNode(rels, "col", {
						attr: {
							min: i + 1,
							max: i + 1,
							width: _excelColWidth(data, i),
							customWidth: 1
						}
					})
				)
			}

			// Workbook modifications
			var workbook = xlsx.xl["workbook.xml"]

			$("sheets sheet", workbook).attr("name", _sheetname(config))

			// Auto filter for columns
			if (config.autoFilter) {
				$("mergeCells", rels).before(
					_createNode(rels, "autoFilter", {
						attr: {
							ref: "A" + dataStartRow + ":" + createCellPos(data.header.length - 1) + dataEndRow
						}
					})
				)

				$("definedNames", workbook).append(
					_createNode(workbook, "definedName", {
						attr: {
							name: "_xlnm._FilterDatabase",
							localSheetId: "0",
							hidden: 1
						},
						text: "'" + _sheetname(config).replace(/'/g, "''") + "'!$A$" + dataStartRow + ":" + createCellPos(data.header.length - 1) + dataEndRow
					})
				)
			}

			// Let the developer customise the document if they want to
			if (config.customize) {
				config.customize(xlsx, config, dt)
			}

			// Excel doesn't like an empty mergeCells tag
			if ($("mergeCells", rels).children().length === 0) {
				$("mergeCells", rels).remove()
			}

			var jszip = _jsZip()
			var zip = new jszip()
			var zipConfig = {
				compression: "DEFLATE",
				type: "blob",
				mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			}

			_addToZip(zip, xlsx)

			// Modern Excel has a 218 character limit on the file name + path of the file (why!?)
			// https://support.microsoft.com/en-us/office/excel-specifications-and-limits-1672b34d-7043-467e-8e27-269d656771c3
			// So we truncate to allow for this.
			var filename = exportInfo.filename

			if (filename > 175) {
				filename = filename.substr(0, 175)
			}

			// Let the developer customize the final zip file if they want to before it is generated and sent to the browser
			if (config.customizeZip) {
				config.customizeZip(zip, data, filename)
			}

			if (zip.generateAsync) {
				// JSZip 3+
				zip.generateAsync(zipConfig).then(function (blob) {
					_saveAs(blob, filename)
					cb()
				})
			} else {
				// JSZip 2.5
				_saveAs(zip.generate(zipConfig), filename)
				cb()
			}
		},

		async: 100,

		filename: "*",

		extension: ".xlsx",

		exportOptions: {},

		header: true,

		footer: true,

		title: "*",

		messageTop: "*",

		messageBottom: "*",

		createEmptyCells: false,

		autoFilter: false,

		sheetName: ""
	}

	//
	// PDF export - using pdfMake - http://pdfmake.org
	//
	DataTable.ext.buttons.pdfHtml5 = {
		className: "buttons-pdf buttons-html5",

		available: function () {
			return window.FileReader !== undefined && _pdfMake()
		},

		text: function (dt) {
			return dt.i18n("buttons.pdf", "PDF")
		},

		action: function (e, dt, button, config, cb) {
			var data = dt.buttons.exportData(config.exportOptions)
			var info = dt.buttons.exportInfo(config)
			var rows = []

			if (config.header) {
				data.headerStructure.forEach(function (row) {
					rows.push(
						row.map(function (cell) {
							return cell
								? {
										text: cell.title,
										colSpan: cell.colspan,
										rowSpan: cell.rowspan,
										style: "tableHeader"
								  }
								: {}
						})
					)
				})
			}

			for (var i = 0, ien = data.body.length; i < ien; i++) {
				rows.push(
					data.body[i].map(function (d) {
						return {
							text: d === null || d === undefined ? "" : typeof d === "string" ? d : d.toString()
						}
					})
				)
			}

			if (config.footer) {
				data.footerStructure.forEach(function (row) {
					rows.push(
						row.map(function (cell) {
							return cell
								? {
										text: cell.title,
										colSpan: cell.colspan,
										rowSpan: cell.rowspan,
										style: "tableHeader"
								  }
								: {}
						})
					)
				})
			}

			var doc = {
				pageSize: config.pageSize,
				pageOrientation: config.orientation,
				content: [
					{
						style: "table",
						table: {
							headerRows: data.headerStructure.length,
							footerRows: data.footerStructure.length, // Used for styling, doesn't do anything in pdfmake
							body: rows
						},
						layout: {
							hLineWidth: function (i, node) {
								if (i === 0 || i === node.table.body.length) {
									return 0
								}
								return 0.5
							},
							vLineWidth: function () {
								return 0
							},
							hLineColor: function (i, node) {
								return i === node.table.headerRows || i === node.table.body.length - node.table.footerRows ? "#333" : "#ddd"
							},
							fillColor: function (rowIndex) {
								if (rowIndex < data.headerStructure.length) {
									return "#fff"
								}
								return rowIndex % 2 === 0 ? "#f3f3f3" : null
							},
							paddingTop: function () {
								return 5
							},
							paddingBottom: function () {
								return 5
							}
						}
					}
				],
				styles: {
					tableHeader: {
						bold: true,
						fontSize: 11,
						alignment: "center"
					},
					tableFooter: {
						bold: true,
						fontSize: 11
					},
					table: {
						margin: [0, 5, 0, 5]
					},
					title: {
						alignment: "center",
						fontSize: 13
					},
					message: {}
				},
				defaultStyle: {
					fontSize: 10
				}
			}

			if (info.messageTop) {
				doc.content.unshift({
					text: info.messageTop,
					style: "message",
					margin: [0, 0, 0, 12]
				})
			}

			if (info.messageBottom) {
				doc.content.push({
					text: info.messageBottom,
					style: "message",
					margin: [0, 0, 0, 12]
				})
			}

			if (info.title) {
				doc.content.unshift({
					text: info.title,
					style: "title",
					margin: [0, 0, 0, 12]
				})
			}

			if (config.customize) {
				config.customize(doc, config, dt)
			}

			var pdf = _pdfMake().createPdf(doc)

			if (config.download === "open" && !_isDuffSafari()) {
				pdf.open()
			} else {
				pdf.download(info.filename)
			}

			cb()
		},

		async: 100,

		title: "*",

		filename: "*",

		extension: ".pdf",

		exportOptions: {},

		orientation: "portrait",

		// This isn't perfect, but it is close
		pageSize: navigator.language === "en-US" || navigator.language === "en-CA" ? "LETTER" : "A4",

		header: true,

		footer: true,

		messageTop: "*",

		messageBottom: "*",

		customize: null,

		download: "download"
	}

	return DataTable
})

/*! ColReorder 2.0.4
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	/**
	 * Mutate an array, moving a set of elements into a new index position
	 *
	 * @param arr Array to modify
	 * @param from Start move index
	 * @param count Number of elements to move
	 * @param to Index where the start element will move to
	 */
	function arrayMove(arr, from, count, to) {
		var movers = arr.splice(from, count)
		// Add delete and start to the array, so we can use it for the `apply`
		movers.unshift(0) // splice delete param
		movers.unshift(to < from ? to : to - count + 1) // splice start param
		arr.splice.apply(arr, movers)
	}
	/**
	 * Run finishing activities after one or more columns have been reordered.
	 *
	 * @param dt DataTable being operated on - must be a single table instance
	 */
	function finalise(dt) {
		// Cache invalidation. Always read from the data object rather
		// than reading back from the DOM since it could have been
		// changed by a renderer
		dt.rows().invalidate("data")
		// Redraw the header / footer. Its a little bit of a hack this, as DT
		// doesn't expose the header draw as an API method. It calls state
		// saving, so we don't need to here.
		dt.column(0).visible(dt.column(0).visible())
		dt.columns.adjust()
		// Fire an event so other plug-ins can update
		var order = dt.colReorder.order()
		dt.trigger("columns-reordered", [
			{
				order: order,
				mapping: invertKeyValues(order)
			}
		])
	}
	/**
	 * Get the original indexes in their current order
	 *
	 * @param dt DataTable being operated on - must be a single table instance
	 * @returns Original indexes in current order
	 */
	function getOrder(dt) {
		return dt.settings()[0].aoColumns.map(function (col) {
			return col._crOriginalIdx
		})
	}
	/**
	 * Manipulate a header / footer array in DataTables settings to reorder
	 * the columns.
	 */
	function headerUpdate(structure, map, from, to) {
		var done = []
		for (var i = 0; i < structure.length; i++) {
			var headerRow = structure[i]
			arrayMove(headerRow, from[0], from.length, to)
			for (var j = 0; j < headerRow.length; j++) {
				var cell = headerRow[j].cell
				// Only work on a DOM element once, otherwise we risk remapping a
				// remapped value (etc).
				if (done.includes(cell)) {
					continue
				}
				var indexes = cell.getAttribute("data-dt-column").split(",")
				var mapped = indexes
					.map(function (idx) {
						return map[idx]
					})
					.join(",")
				// Update data attributes for the new column position
				cell.setAttribute("data-dt-column", mapped)
				done.push(cell)
			}
		}
	}
	/**
	 * Setup for ColReorder API operations
	 *
	 * @param dt DataTable(s) being operated on - might have multiple tables!
	 */
	function init(api) {
		// Assign the original column index to a parameter that we can lookup.
		// On the first pass (i.e. when the parameter hasn't yet been set), the
		// index order will be the original order, so this is quite a simple
		// assignment.
		api.columns().iterator("column", function (s, idx) {
			var columns = s.aoColumns
			if (columns[idx]._crOriginalIdx === undefined) {
				columns[idx]._crOriginalIdx = idx
			}
		})
	}
	/**
	 * Switch the key value pairing of an index array to be value key (i.e. the old value is now the
	 * key). For example consider [ 2, 0, 1 ] this would be returned as [ 1, 2, 0 ].
	 *
	 *  @param   array arr Array to switch around
	 */
	function invertKeyValues(arr) {
		var result = []
		for (var i = 0; i < arr.length; i++) {
			result[arr[i]] = i
		}
		return result
	}
	/**
	 * Move one or more columns from one index to another.
	 *
	 * This method has a lot of knowledge about how DataTables works internally.
	 * If DataTables changes how it handles cells, columns, etc, then this
	 * method would need to be updated accordingly.
	 *
	 * @param dt DataTable being operated on - must be a single table instance
	 * @param from Column indexes to move
	 * @param to Destination index (starting if multiple)
	 */
	function move(dt, from, to) {
		var i, j
		var settings = dt.settings()[0]
		var columns = settings.aoColumns
		var newOrder = columns.map(function (col, idx) {
			return idx
		})
		// The to column in already inside the from column(s) (might be the same)
		// no change required
		if (from.includes(to)) {
			return
		}
		// A reverse index array so we can look up new indexes from old
		arrayMove(newOrder, from[0], from.length, to)
		var reverseIndexes = invertKeyValues(newOrder)
		// Main column
		arrayMove(columns, from[0], from.length, to)
		// Per row manipulations
		for (i = 0; i < settings.aoData.length; i++) {
			var data = settings.aoData[i]
			// Allow for sparse array
			if (!data) {
				continue
			}
			var cells = data.anCells
			// Not yet rendered
			if (!cells) {
				continue
			}
			// Array of cells
			arrayMove(cells, from[0], from.length, to)
			for (j = 0; j < cells.length; j++) {
				// Reinsert into the document in the new order
				if (data.nTr && cells[j] && columns[j].bVisible) {
					data.nTr.appendChild(cells[j])
				}
				// Update lookup index
				if (cells[j] && cells[j]._DT_CellIndex) {
					cells[j]._DT_CellIndex.column = j
				}
			}
		}
		// Per column manipulation
		for (i = 0; i < columns.length; i++) {
			var column = columns[i]
			// Data column sorting
			for (j = 0; j < column.aDataSort.length; j++) {
				column.aDataSort[j] = reverseIndexes[column.aDataSort[j]]
			}
			// Update the column indexes
			column.idx = reverseIndexes[column.idx]
			// Reorder the colgroup > col elements for the new order
			if (column.bVisible) {
				settings.colgroup.append(column.colEl)
			}
		}
		// Header and footer
		headerUpdate(settings.aoHeader, reverseIndexes, from, to)
		headerUpdate(settings.aoFooter, reverseIndexes, from, to)
		// Search - columns
		arrayMove(settings.aoPreSearchCols, from[0], from.length, to)
		// Ordering indexes update - note that the sort listener on the
		// header works out the index to apply on each draw, so it doesn't
		// need to be updated here.
		orderingIndexes(reverseIndexes, settings.aaSorting)
		if (Array.isArray(settings.aaSortingFixed)) {
			orderingIndexes(reverseIndexes, settings.aaSortingFixed)
		} else if (settings.aaSortingFixed.pre) {
			orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre)
		} else if (settings.aaSortingFixed.post) {
			orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre)
		}
		settings.aLastSort.forEach(function (el) {
			el.src = reverseIndexes[el.src]
		})
		// Fire an event so other plug-ins can update
		dt.trigger("column-reorder", [
			dt.settings()[0],
			{
				from: from,
				to: to,
				mapping: reverseIndexes
			}
		])
	}
	/**
	 * Update the indexing for ordering arrays
	 *
	 * @param map Reverse index map
	 * @param order Array to update
	 */
	function orderingIndexes(map, order) {
		// Can happen if the order was deleted from a saved state
		if (!order) {
			return
		}
		for (var i = 0; i < order.length; i++) {
			var el = order[i]
			if (typeof el === "number") {
				// Just a number
				order[i] = map[el]
			} else if ($.isPlainObject(el) && el.idx !== undefined) {
				// New index in an object style
				el.idx = map[el.idx]
			} else if (Array.isArray(el) && typeof el[0] === "number") {
				// The good old fixes length array
				el[0] = map[el[0]]
			}
			// No need to update if in object + .name style
		}
	}
	/**
	 * Take an index array for the current positioned, reordered to what you want
	 * them to be.
	 *
	 * @param dt DataTable being operated on - must be a single table instance
	 * @param order Indexes from current order, positioned as you want them to be
	 */
	function setOrder(dt, order, original) {
		var changed = false
		var i
		if (order.length !== dt.columns().count()) {
			dt.error("ColReorder - column count mismatch")
			return
		}
		// The order given is based on the original indexes, rather than the
		// existing ones, so we need to translate from the original to current
		// before then doing the order
		if (original) {
			order = transpose(dt, order, "toCurrent")
		}
		// The API is array index as the desired position, but our algorithm below is
		// for array index as the current position. So we need to invert for it to work.
		var setOrder = invertKeyValues(order)
		// Move columns, one by one with validation disabled!
		for (i = 0; i < setOrder.length; i++) {
			var currentIndex = setOrder.indexOf(i)
			if (i !== currentIndex) {
				// Reorder our switching error
				arrayMove(setOrder, currentIndex, 1, i)
				// Do the reorder
				move(dt, [currentIndex], i)
				changed = true
			}
		}
		// Reorder complete
		if (changed) {
			finalise(dt)
		}
	}
	/**
	 * Convert the DataTables header structure array into a 2D array where each
	 * element has a reference to its TH/TD cell (regardless of spanning).
	 *
	 * @param structure Header / footer structure object
	 * @returns 2D array of header cells
	 */
	function structureFill(structure) {
		var filledIn = []
		for (var row = 0; row < structure.length; row++) {
			filledIn.push([])
			for (var col = 0; col < structure[row].length; col++) {
				var cell = structure[row][col]
				if (cell) {
					for (var rowInner = 0; rowInner < cell.rowspan; rowInner++) {
						if (!filledIn[row + rowInner]) {
							filledIn[row + rowInner] = []
						}
						for (var colInner = 0; colInner < cell.colspan; colInner++) {
							filledIn[row + rowInner][col + colInner] = cell.cell
						}
					}
				}
			}
		}
		return filledIn
	}
	/**
	 * Convert the index type
	 *
	 * @param dt DataTable to work on
	 * @param idx Index to transform
	 * @param dir Transform direction
	 * @returns Converted number(s)
	 */
	function transpose(dt, idx, dir) {
		var order = dt.colReorder.order()
		var columns = dt.settings()[0].aoColumns
		if (dir === "toCurrent" || dir === "fromOriginal") {
			// Given an original index, want the current
			return !Array.isArray(idx)
				? order.indexOf(idx)
				: idx.map(function (index) {
						return order.indexOf(index)
				  })
		}
		// Given a current index, want the original
		return !Array.isArray(idx)
			? columns[idx]._crOriginalIdx
			: idx.map(function (index) {
					return columns[index]._crOriginalIdx
			  })
	}
	/**
	 * Validate that a requested move is okay. This includes bound checking
	 * and that it won't split colspan'ed cells.
	 *
	 * @param table API instance
	 * @param from Column indexes to move
	 * @param to Destination index (starting if multiple)
	 * @returns Validation result
	 */
	function validateMove(table, from, to) {
		var columns = table.columns().count()
		// Sanity and bound checking
		if (from[0] < to && to < from[from.length]) {
			return false
		}
		if (from[0] < 0 && from[from.length - 1] > columns) {
			return false
		}
		if (to < 0 && to > columns) {
			return false
		}
		// No change - it's valid
		if (from.includes(to)) {
			return true
		}
		if (!validateStructureMove(table.table().header.structure(), from, to)) {
			return false
		}
		if (!validateStructureMove(table.table().footer.structure(), from, to)) {
			return false
		}
		return true
	}
	/**
	 * For a given structure check that the move is valid.
	 * @param structure
	 * @param from
	 * @param to
	 * @returns
	 */
	function validateStructureMove(structure, from, to) {
		var header = structureFill(structure)
		var i
		// Shuffle the header cells around
		for (i = 0; i < header.length; i++) {
			arrayMove(header[i], from[0], from.length, to)
		}
		// Sanity check that the headers are next to each other
		for (i = 0; i < header.length; i++) {
			var seen = []
			for (var j = 0; j < header[i].length; j++) {
				var cell = header[i][j]
				if (!seen.includes(cell)) {
					// Hasn't been seen before
					seen.push(cell)
				} else if (seen[seen.length - 1] !== cell) {
					// Has been seen before and is not the previous cell - validation failed
					return false
				}
			}
		}
		return true
	}

	/**
	 * This is one possible UI for column reordering in DataTables. In this case
	 * columns are reordered by clicking and dragging a column header. It calculates
	 * where columns can be dropped based on the column header used to start the drag
	 * and then `colReorder.move()` method to alter the DataTable.
	 */
	var ColReorder = /** @class */ (function () {
		function ColReorder(dt, opts) {
			this.dom = {
				drag: null
			}
			this.c = {
				columns: null,
				enable: null,
				order: null
			}
			this.s = {
				dropZones: [],
				mouse: {
					absLeft: -1,
					offset: {
						x: -1,
						y: -1
					},
					start: {
						x: -1,
						y: -1
					},
					target: null,
					targets: []
				},
				scrollInterval: null
			}
			var that = this
			var ctx = dt.settings()[0]
			// Check if ColReorder already has been initialised on this DataTable - only
			// one can exist.
			if (ctx._colReorder) {
				return
			}
			dt.settings()[0]._colReorder = this
			this.dt = dt
			$.extend(this.c, ColReorder.defaults, opts)
			init(dt)
			dt.on("stateSaveParams", function (e, s, d) {
				d.colReorder = getOrder(dt)
			})
			dt.on("destroy", function () {
				dt.off(".colReorder")
				dt.colReorder.reset()
			})
			// Initial ordering / state restoring
			var loaded = dt.state.loaded()
			var order = this.c.order
			if (loaded && loaded.colReorder) {
				order = loaded.colReorder
			}
			if (order) {
				dt.ready(function () {
					setOrder(dt, order, true)
				})
			}
			dt.table()
				.header.structure()
				.forEach(function (row) {
					for (var i = 0; i < row.length; i++) {
						if (row[i] && row[i].cell) {
							that._addListener(row[i].cell)
						}
					}
				})
		}
		ColReorder.prototype.disable = function () {
			this.c.enable = false
			return this
		}
		ColReorder.prototype.enable = function (flag) {
			if (flag === void 0) {
				flag = true
			}
			if (flag === false) {
				return this.disable()
			}
			this.c.enable = true
			return this
		}
		/**
		 * Attach the mouse down listener to an element to start a column reorder action
		 *
		 * @param el
		 */
		ColReorder.prototype._addListener = function (el) {
			var that = this
			$(el)
				.on("selectstart.colReorder", function () {
					return false
				})
				.on("mousedown.colReorder touchstart.colReorder", function (e) {
					// Ignore middle and right click
					if (e.type === "mousedown" && e.which !== 1) {
						return
					}
					// Ignore if disabled
					if (!that.c.enable) {
						return
					}
					that._mouseDown(e, this)
				})
		}
		/**
		 * Create the element that is dragged around the page
		 */
		ColReorder.prototype._createDragNode = function () {
			var origCell = this.s.mouse.target
			var origTr = origCell.parent()
			var origThead = origTr.parent()
			var origTable = origThead.parent()
			var cloneCell = origCell.clone()
			// This is a slightly odd combination of jQuery and DOM, but it is the
			// fastest and least resource intensive way I could think of cloning
			// the table with just a single header cell in it.
			this.dom.drag = $(origTable[0].cloneNode(false))
				.addClass("dtcr-cloned")
				.append(
					$(origThead[0].cloneNode(false)).append($(origTr[0].cloneNode(false)).append(cloneCell[0])) // Not sure why  it doesn't want to append a jQuery node
				)
				.css({
					position: "absolute",
					top: 0,
					left: 0,
					width: $(origCell).outerWidth(),
					height: $(origCell).outerHeight()
				})
				.appendTo("body")
		}
		/**
		 * Get cursor position regardless of mouse or touch input
		 *
		 * @param e Event
		 * @param prop Property name to get
		 * @returns Value - assuming a number here
		 */
		ColReorder.prototype._cursorPosition = function (e, prop) {
			return e.type.indexOf("touch") !== -1 ? e.originalEvent.touches[0][prop] : e[prop]
		}
		/**
		 * Cache values at start
		 *
		 * @param e Triggering event
		 * @param cell Cell that the action started on
		 * @returns
		 */
		ColReorder.prototype._mouseDown = function (e, cell) {
			var _this = this
			var target = $(e.target).closest("th, td")
			var offset = target.offset()
			var moveableColumns = this.dt.columns(this.c.columns).indexes().toArray()
			var moveColumnIndexes = $(cell)
				.attr("data-dt-column")
				.split(",")
				.map(function (val) {
					return parseInt(val, 10)
				})
			// Don't do anything for columns which are not selected as moveable
			for (var j = 0; j < moveColumnIndexes.length; j++) {
				if (!moveableColumns.includes(moveColumnIndexes[j])) {
					return false
				}
			}
			this.s.mouse.start.x = this._cursorPosition(e, "pageX")
			this.s.mouse.start.y = this._cursorPosition(e, "pageY")
			this.s.mouse.offset.x = this._cursorPosition(e, "pageX") - offset.left
			this.s.mouse.offset.y = this._cursorPosition(e, "pageY") - offset.top
			this.s.mouse.target = target
			this.s.mouse.targets = moveColumnIndexes
			// Classes to highlight the columns being moved
			for (var i = 0; i < moveColumnIndexes.length; i++) {
				var cells = this.dt.cells(null, moveColumnIndexes[i], { page: "current" }).nodes().to$()
				var klass = "dtcr-moving"
				if (i === 0) {
					klass += " dtcr-moving-first"
				}
				if (i === moveColumnIndexes.length - 1) {
					klass += " dtcr-moving-last"
				}
				cells.addClass(klass)
			}
			this._regions(moveColumnIndexes)
			this._scrollRegions()
			/* Add event handlers to the document */
			$(document)
				.on("mousemove.colReorder touchmove.colReorder", function (e) {
					_this._mouseMove(e)
				})
				.on("mouseup.colReorder touchend.colReorder", function (e) {
					_this._mouseUp(e)
				})
		}
		ColReorder.prototype._mouseMove = function (e) {
			if (this.dom.drag === null) {
				// Only create the drag element if the mouse has moved a specific distance from the start
				// point - this allows the user to make small mouse movements when sorting and not have a
				// possibly confusing drag element showing up
				if (Math.pow(Math.pow(this._cursorPosition(e, "pageX") - this.s.mouse.start.x, 2) + Math.pow(this._cursorPosition(e, "pageY") - this.s.mouse.start.y, 2), 0.5) < 5) {
					return
				}
				$(document.body).addClass("dtcr-dragging")
				this._createDragNode()
			}
			// Position the element - we respect where in the element the click occurred
			this.dom.drag.css({
				left: this._cursorPosition(e, "pageX") - this.s.mouse.offset.x,
				top: this._cursorPosition(e, "pageY") - this.s.mouse.offset.y
			})
			// Find cursor's left position relative to the table
			var tableOffset = $(this.dt.table().node()).offset().left
			var cursorMouseLeft = this._cursorPosition(e, "pageX") - tableOffset
			var dropZone = this.s.dropZones.find(function (zone) {
				if (zone.left <= cursorMouseLeft && cursorMouseLeft <= zone.left + zone.width) {
					return true
				}
				return false
			})
			this.s.mouse.absLeft = this._cursorPosition(e, "pageX")
			if (!dropZone) {
				return
			}
			if (!dropZone.self) {
				this._move(dropZone, cursorMouseLeft)
			}
		}
		ColReorder.prototype._mouseUp = function (e) {
			$(document).off(".colReorder")
			$(document.body).removeClass("dtcr-dragging")
			if (this.dom.drag) {
				this.dom.drag.remove()
				this.dom.drag = null
			}
			if (this.s.scrollInterval) {
				clearInterval(this.s.scrollInterval)
			}
			this.dt.cells(".dtcr-moving").nodes().to$().removeClass("dtcr-moving dtcr-moving-first dtcr-moving-last")
		}
		/**
		 * Shift columns around
		 *
		 * @param dropZone Where to move to
		 * @param cursorMouseLeft Cursor position, relative to the left of the table
		 */
		ColReorder.prototype._move = function (dropZone, cursorMouseLeft) {
			var that = this
			this.dt.colReorder.move(this.s.mouse.targets, dropZone.colIdx)
			// Update the targets
			this.s.mouse.targets = $(this.s.mouse.target)
				.attr("data-dt-column")
				.split(",")
				.map(function (val) {
					return parseInt(val, 10)
				})
			this._regions(this.s.mouse.targets)
			var visibleTargets = this.s.mouse.targets.filter(function (val) {
				return that.dt.column(val).visible()
			})
			// If the column being moved is smaller than the column it is replacing,
			// the drop zones might need a correction to allow for this since, otherwise
			// we might immediately be changing the column order as soon as it was placed.
			// Find the drop zone for the first in the list of targets - is its
			// left greater than the mouse position. If so, it needs correcting
			var dz = this.s.dropZones.find(function (zone) {
				return zone.colIdx === visibleTargets[0]
			})
			var dzIdx = this.s.dropZones.indexOf(dz)
			if (dz.left > cursorMouseLeft) {
				var previousDiff = dz.left - cursorMouseLeft
				var previousDz = this.s.dropZones[dzIdx - 1]
				dz.left -= previousDiff
				dz.width += previousDiff
				if (previousDz) {
					previousDz.width -= previousDiff
				}
			}
			// And for the last in the list
			dz = this.s.dropZones.find(function (zone) {
				return zone.colIdx === visibleTargets[visibleTargets.length - 1]
			})
			if (dz.left + dz.width < cursorMouseLeft) {
				var nextDiff = cursorMouseLeft - (dz.left + dz.width)
				var nextDz = this.s.dropZones[dzIdx + 1]
				dz.width += nextDiff
				if (nextDz) {
					nextDz.left += nextDiff
					nextDz.width -= nextDiff
				}
			}
		}
		/**
		 * Determine the boundaries for where drops can happen and where they would
		 * insert into.
		 */
		ColReorder.prototype._regions = function (moveColumns) {
			var that = this
			var dropZones = []
			var totalWidth = 0
			var negativeCorrect = 0
			var allowedColumns = this.dt.columns(this.c.columns).indexes().toArray()
			var widths = this.dt.columns().widths()
			// Each column is a drop zone
			this.dt.columns().every(function (colIdx, tabIdx, i) {
				if (!this.visible()) {
					return
				}
				var columnWidth = widths[colIdx]
				// Check that we are allowed to move into this column - if not, need
				// to offset the widths
				if (!allowedColumns.includes(colIdx)) {
					totalWidth += columnWidth
					return
				}
				var valid = validateMove(that.dt, moveColumns, colIdx)
				if (valid) {
					// New drop zone. Note that it might have it's offset moved
					// by the final condition in this logic set
					dropZones.push({
						colIdx: colIdx,
						left: totalWidth - negativeCorrect,
						self: moveColumns[0] <= colIdx && colIdx <= moveColumns[moveColumns.length - 1],
						width: columnWidth + negativeCorrect
					})
				} else if (colIdx < moveColumns[0]) {
					// Not valid and before the column(s) to be moved - the drop
					// zone for the previous valid drop point is extended
					if (dropZones.length) {
						dropZones[dropZones.length - 1].width += columnWidth
					}
				} else if (colIdx > moveColumns[moveColumns.length - 1]) {
					// Not valid and after the column(s) to be moved - the next
					// drop zone to be created will be extended
					negativeCorrect += columnWidth
				}
				totalWidth += columnWidth
			})
			this.s.dropZones = dropZones
			// this._drawDropZones();
		}
		/**
		 * Check if the table is scrolling or not. It is it the `table` isn't the same for
		 * the header and body parents.
		 *
		 * @returns
		 */
		ColReorder.prototype._isScrolling = function () {
			return this.dt.table().body().parentNode !== this.dt.table().header().parentNode
		}
		/**
		 * Set an interval clock that will check to see if the scrolling of the table body should be moved
		 * as the mouse moves on the scroll (allowing a drag and drop to columns which aren't yet visible)
		 */
		ColReorder.prototype._scrollRegions = function () {
			if (!this._isScrolling()) {
				// Not scrolling - nothing to do
				return
			}
			var that = this
			var tableLeft = $(this.dt.table().container()).position().left
			var tableWidth = $(this.dt.table().container()).outerWidth()
			var mouseBuffer = 75
			var scrollContainer = this.dt.table().body().parentElement.parentElement
			this.s.scrollInterval = setInterval(function () {
				var mouseLeft = that.s.mouse.absLeft
				if (mouseLeft < tableLeft + mouseBuffer && scrollContainer.scrollLeft) {
					scrollContainer.scrollLeft -= 5
				} else if (mouseLeft > tableLeft + tableWidth - mouseBuffer && scrollContainer.scrollLeft < scrollContainer.scrollWidth) {
					scrollContainer.scrollLeft += 5
				}
			}, 25)
		}
		// This is handy for debugging where the drop zones actually are!
		// private _drawDropZones () {
		// 	let dropZones = this.s.dropZones;
		// 	$('div.allan').remove();
		// 	for (let i=0 ; i<dropZones.length ; i++) {
		// 		let zone = dropZones[i];
		// 		$(this.dt.table().container()).append(
		// 			$('<div>')
		// 				.addClass('allan')
		// 				.css({
		// 					position: 'absolute',
		// 					top: 0,
		// 					width: zone.width - 4,
		// 					height: 20,
		// 					left: zone.left + 2,
		// 					border: '1px solid red',
		// 				})
		// 		);
		// 	}
		// }
		ColReorder.defaults = {
			columns: "",
			enable: true,
			order: null
		}
		ColReorder.version = "2.0.4"
		return ColReorder
	})()

	/*! ColReorder 2.0.4
	 * © SpryMedia Ltd - datatables.net/license
	 */
	/**
	 * @summary     ColReorder
	 * @description Provide the ability to reorder columns in a DataTable
	 * @version     2.0.4
	 * @author      SpryMedia Ltd
	 * @contact     datatables.net
	 * @copyright   SpryMedia Ltd.
	 *
	 * This source file is free software, available under the following license:
	 *   MIT license - http://datatables.net/license/mit
	 *
	 * This source file is distributed in the hope that it will be useful, but
	 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
	 *
	 * For details please refer to: http://www.datatables.net
	 */
	// declare var DataTable: any;
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * UI interaction class
	 */
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * DataTables API integration
	 */
	/** Enable mouse column reordering */
	DataTable.Api.register("colReorder.enable()", function (flag) {
		return this.iterator("table", function (ctx) {
			if (ctx._colReorder) {
				ctx._colReorder.enable(flag)
			}
		})
	})
	/** Disable mouse column reordering */
	DataTable.Api.register("colReorder.disable()", function () {
		return this.iterator("table", function (ctx) {
			if (ctx._colReorder) {
				ctx._colReorder.disable()
			}
		})
	})
	/**
	 * Change the ordering of the columns in the DataTable.
	 */
	DataTable.Api.register("colReorder.move()", function (from, to) {
		init(this)
		if (!Array.isArray(from)) {
			from = [from]
		}
		if (!validateMove(this, from, to)) {
			this.error("ColReorder - invalid move")
			return this
		}
		return this.tables().every(function () {
			move(this, from, to)
			finalise(this)
		})
	})
	DataTable.Api.register("colReorder.order()", function (set, original) {
		init(this)
		if (!set) {
			return this.context.length ? getOrder(this) : null
		}
		return this.tables().every(function () {
			setOrder(this, set, original)
		})
	})
	DataTable.Api.register("colReorder.reset()", function () {
		init(this)
		return this.tables().every(function () {
			var order = this.columns()
				.every(function (i) {
					return i
				})
				.flatten()
				.toArray()
			setOrder(this, order, true)
		})
	})
	DataTable.Api.register("colReorder.transpose()", function (idx, dir) {
		init(this)
		if (!dir) {
			dir = "toCurrent"
		}
		return transpose(this, idx, dir)
	})
	DataTable.ColReorder = ColReorder
	// Called when DataTables is going to load a state. That might be
	// before the table is ready (state saving) or after (state restoring).
	// Also note that it happens _before_ preInit (below).
	$(document).on("stateLoadInit.dt", function (e, settings, state) {
		if (e.namespace !== "dt") {
			return
		}
		var dt = new DataTable.Api(settings)
		if (state.colReorder) {
			if (dt.ready()) {
				// Table is fully loaded - do the column reordering here
				// so that the stored indexes are in the correct place
				// e.g. column visibility
				setOrder(dt, state.colReorder, true)
			} else {
				// If the table is not ready, column reordering is done
				// after it becomes fully ready. That means that saved
				// column indexes need to be updated for where those columns
				// currently are. Any properties which refer to column indexes
				// would need to be updated here.
				// State's ordering indexes
				orderingIndexes(state.colReorder, state.order)
				// State's columns array - sort by restore index
				if (state.columns) {
					for (var i = 0; i < state.columns.length; i++) {
						state.columns[i]._cr_sort = state.colReorder[i]
					}
					state.columns.sort(function (a, b) {
						return a._cr_sort - b._cr_sort
					})
				}
			}
		}
	})
	$(document).on("preInit.dt", function (e, settings) {
		if (e.namespace !== "dt") {
			return
		}
		var init = settings.oInit.colReorder
		var defaults = DataTable.defaults.colReorder
		if (init || defaults) {
			var opts = $.extend({}, defaults, init)
			if (init !== false) {
				var dt = new DataTable.Api(settings)
				new ColReorder(dt, opts)
			}
		}
	})

	return DataTable
})

/*! FixedColumns 5.0.2
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	;(function () {
		"use strict"

		var $$1
		var DataTable$1
		function setJQuery(jq) {
			$$1 = jq
			DataTable$1 = $$1.fn.dataTable
		}
		var FixedColumns = /** @class */ (function () {
			function FixedColumns(settings, opts) {
				var _this = this
				// Check that the required version of DataTables is included
				if (!DataTable$1 || !DataTable$1.versionCheck || !DataTable$1.versionCheck("2")) {
					throw new Error("FixedColumns requires DataTables 2 or newer")
				}
				var table = new DataTable$1.Api(settings)
				this.classes = $$1.extend(true, {}, FixedColumns.classes)
				// Get options from user
				this.c = $$1.extend(true, {}, FixedColumns.defaults, opts)
				this.s = {
					dt: table,
					rtl: $$1(table.table().node()).css("direction") === "rtl"
				}
				// Backwards compatibility for deprecated options
				if (opts && opts.leftColumns !== undefined) {
					opts.left = opts.leftColumns
				}
				if (opts && opts.left !== undefined) {
					this.c[this.s.rtl ? "end" : "start"] = opts.left
				}
				if (opts && opts.rightColumns !== undefined) {
					opts.right = opts.rightColumns
				}
				if (opts && opts.right !== undefined) {
					this.c[this.s.rtl ? "start" : "end"] = opts.right
				}
				this.dom = {
					bottomBlocker: $$1("<div>").addClass(this.classes.bottomBlocker),
					topBlocker: $$1("<div>").addClass(this.classes.topBlocker),
					scroller: $$1("div.dt-scroll-body", this.s.dt.table().container())
				}
				if (this.s.dt.settings()[0]._bInitComplete) {
					// Fixed Columns Initialisation
					this._addStyles()
					this._setKeyTableListener()
				} else {
					table.one("init.dt.dtfc", function () {
						// Fixed Columns Initialisation
						_this._addStyles()
						_this._setKeyTableListener()
					})
				}
				// Lots or reasons to redraw the column styles
				table.on("column-sizing.dt.dtfc column-reorder.dt.dtfc draw.dt.dtfc", function () {
					return _this._addStyles()
				})
				// Column visibility can trigger a number of times quickly, so we debounce it
				var debounced = DataTable$1.util.debounce(function () {
					_this._addStyles()
				}, 50)
				table.on("column-visibility.dt.dtfc", function () {
					debounced()
				})
				// Add classes to indicate scrolling state for styling
				this.dom.scroller.on("scroll.dtfc", function () {
					return _this._scroll()
				})
				this._scroll()
				// Make class available through dt object
				table.settings()[0]._fixedColumns = this
				table.on("destroy", function () {
					return _this._destroy()
				})
				return this
			}
			FixedColumns.prototype.end = function (newVal) {
				// If the value is to change
				if (newVal !== undefined) {
					if (newVal >= 0 && newVal <= this.s.dt.columns().count()) {
						// Set the new values and redraw the columns
						this.c.end = newVal
						this._addStyles()
					}
					return this
				}
				return this.c.end
			}
			/**
			 * Left fix - accounting for RTL
			 *
			 * @param count Columns to fix, or undefined for getter
			 */
			FixedColumns.prototype.left = function (count) {
				return this.s.rtl ? this.end(count) : this.start(count)
			}
			/**
			 * Right fix - accounting for RTL
			 *
			 * @param count Columns to fix, or undefined for getter
			 */
			FixedColumns.prototype.right = function (count) {
				return this.s.rtl ? this.start(count) : this.end(count)
			}
			FixedColumns.prototype.start = function (newVal) {
				// If the value is to change
				if (newVal !== undefined) {
					if (newVal >= 0 && newVal <= this.s.dt.columns().count()) {
						// Set the new values and redraw the columns
						this.c.start = newVal
						this._addStyles()
					}
					return this
				}
				return this.c.start
			}
			/**
			 * Iterates over the columns, fixing the appropriate ones to the left and right
			 */
			FixedColumns.prototype._addStyles = function () {
				var dt = this.s.dt
				var that = this
				var colCount = this.s.dt.columns(":visible").count()
				var headerStruct = dt.table().header.structure(":visible")
				var footerStruct = dt.table().footer.structure(":visible")
				var widths = dt.columns(":visible").widths().toArray()
				var wrapper = $$1(dt.table().node()).closest("div.dt-scroll")
				var scroller = $$1(dt.table().node()).closest("div.dt-scroll-body")[0]
				var rtl = this.s.rtl
				var start = this.c.start
				var end = this.c.end
				var left = rtl ? end : start
				var right = rtl ? start : end
				var barWidth = dt.settings()[0].oBrowser.barWidth // dt internal
				// Do nothing if no scrolling in the DataTable
				if (wrapper.length === 0) {
					return this
				}
				// Bar not needed - no vertical scrolling
				if (scroller.offsetWidth === scroller.clientWidth) {
					barWidth = 0
				}
				// Loop over the visible columns, setting their state
				dt.columns().every(function (colIdx) {
					var visIdx = dt.column.index("toVisible", colIdx)
					var offset
					// Skip the hidden columns
					if (visIdx === null) {
						return
					}
					if (visIdx < start) {
						// Fix to the start
						offset = that._sum(widths, visIdx)
						that._fixColumn(visIdx, offset, "start", headerStruct, footerStruct, barWidth)
					} else if (visIdx >= colCount - end) {
						// Fix to the end
						offset = that._sum(widths, colCount - visIdx - 1, true)
						that._fixColumn(visIdx, offset, "end", headerStruct, footerStruct, barWidth)
					} else {
						// Release
						that._fixColumn(visIdx, 0, "none", headerStruct, footerStruct, barWidth)
					}
				})
				// Apply classes to table to indicate what state we are in
				$$1(dt.table().node())
					.toggleClass(that.classes.tableFixedStart, start > 0)
					.toggleClass(that.classes.tableFixedEnd, end > 0)
					.toggleClass(that.classes.tableFixedLeft, left > 0)
					.toggleClass(that.classes.tableFixedRight, right > 0)
				// Blocker elements for when scroll bars are always visible
				var headerEl = dt.table().header()
				var footerEl = dt.table().footer()
				var headerHeight = $$1(headerEl).outerHeight()
				var footerHeight = $$1(footerEl).outerHeight()
				this.dom.topBlocker
					.appendTo(wrapper)
					.css("top", 0)
					.css(this.s.rtl ? "left" : "right", 0)
					.css("height", headerHeight)
					.css("width", barWidth + 1)
					.css("display", barWidth ? "block" : "none")
				if (footerEl) {
					this.dom.bottomBlocker
						.appendTo(wrapper)
						.css("bottom", 0)
						.css(this.s.rtl ? "left" : "right", 0)
						.css("height", footerHeight)
						.css("width", barWidth + 1)
						.css("display", barWidth ? "block" : "none")
				}
			}
			/**
			 * Clean up
			 */
			FixedColumns.prototype._destroy = function () {
				this.s.dt.off(".dtfc")
				this.dom.scroller.off(".dtfc")
				$$1(this.s.dt.table().node()).removeClass(this.classes.tableScrollingEnd + " " + this.classes.tableScrollingLeft + " " + this.classes.tableScrollingStart + " " + this.classes.tableScrollingRight)
				this.dom.bottomBlocker.remove()
				this.dom.topBlocker.remove()
			}
			/**
			 * Fix or unfix a column
			 *
			 * @param idx Column visible index to operate on
			 * @param offset Offset from the start (pixels)
			 * @param side start, end or none to unfix a column
			 * @param header DT header structure object
			 * @param footer DT footer structure object
			 */
			FixedColumns.prototype._fixColumn = function (idx, offset, side, header, footer, barWidth) {
				var _this = this
				var dt = this.s.dt
				var applyStyles = function (jq, part) {
					if (side === "none") {
						jq.css("position", "")
							.css("left", "")
							.css("right", "")
							.removeClass(_this.classes.fixedEnd + " " + _this.classes.fixedLeft + " " + _this.classes.fixedRight + " " + _this.classes.fixedStart)
					} else {
						var positionSide = side === "start" ? "left" : "right"
						if (_this.s.rtl) {
							positionSide = side === "start" ? "right" : "left"
						}
						var off = offset
						if (side === "end" && (part === "header" || part === "footer")) {
							off += barWidth
						}
						jq.css("position", "sticky")
							.css(positionSide, off)
							.addClass(side === "start" ? _this.classes.fixedStart : _this.classes.fixedEnd)
							.addClass(positionSide === "left" ? _this.classes.fixedLeft : _this.classes.fixedRight)
					}
				}
				header.forEach(function (row) {
					if (row[idx]) {
						applyStyles($$1(row[idx].cell), "header")
					}
				})
				applyStyles(
					dt
						.column(idx + ":visible", { page: "current" })
						.nodes()
						.to$(),
					"body"
				)
				if (footer) {
					footer.forEach(function (row) {
						if (row[idx]) {
							applyStyles($$1(row[idx].cell), "footer")
						}
					})
				}
			}
			/**
			 * Update classes on the table to indicate if the table is scrolling or not
			 */
			FixedColumns.prototype._scroll = function () {
				var scroller = this.dom.scroller[0]
				// Not a scrolling table
				if (!scroller) {
					return
				}
				// Need to update the classes on potentially multiple table tags. There is the
				// main one, the scrolling ones and if FixedHeader is active, the holding
				// position ones! jQuery will deduplicate for us.
				var table = $$1(this.s.dt.table().node())
					.add(this.s.dt.table().header().parentNode)
					.add(this.s.dt.table().footer().parentNode)
					.add("div.dt-scroll-headInner table", this.s.dt.table().container())
					.add("div.dt-scroll-footInner table", this.s.dt.table().container())
				var scrollLeft = scroller.scrollLeft // 0 when fully scrolled left
				var ltr = !this.s.rtl
				var scrollStart = scrollLeft !== 0
				var scrollEnd = scroller.scrollWidth > scroller.clientWidth + Math.abs(scrollLeft) + 1 // extra 1 for Chrome
				table.toggleClass(this.classes.tableScrollingStart, scrollStart)
				table.toggleClass(this.classes.tableScrollingEnd, scrollEnd)
				table.toggleClass(this.classes.tableScrollingLeft, (scrollStart && ltr) || (scrollEnd && !ltr))
				table.toggleClass(this.classes.tableScrollingRight, (scrollEnd && ltr) || (scrollStart && !ltr))
			}
			FixedColumns.prototype._setKeyTableListener = function () {
				var _this = this
				this.s.dt.on("key-focus.dt.dtfc", function (e, dt, cell) {
					var currScroll
					var cellPos = $$1(cell.node()).offset()
					var scroller = _this.dom.scroller[0]
					var scroll = $$1($$1(_this.s.dt.table().node()).closest("div.dt-scroll-body"))
					// If there are fixed columns to the left
					if (_this.c.start > 0) {
						// Get the rightmost left fixed column header, it's position and it's width
						var rightMost = $$1(_this.s.dt.column(_this.c.start - 1).header())
						var rightMostPos = rightMost.offset()
						var rightMostWidth = rightMost.outerWidth()
						// If the current highlighted cell is left of the rightmost cell on the screen
						if ($$1(cell.node()).hasClass(_this.classes.fixedLeft)) {
							// Fixed columns have the scrollbar at the start, always
							scroll.scrollLeft(0)
						} else if (cellPos.left < rightMostPos.left + rightMostWidth) {
							// Scroll it into view
							currScroll = scroll.scrollLeft()
							scroll.scrollLeft(currScroll - (rightMostPos.left + rightMostWidth - cellPos.left))
						}
					}
					// If there are fixed columns to the right
					if (_this.c.end > 0) {
						// Get the number of columns and the width of the cell as doing right side calc
						var numCols = _this.s.dt.columns().data().toArray().length
						var cellWidth = $$1(cell.node()).outerWidth()
						// Get the leftmost right fixed column header and it's position
						var leftMost = $$1(_this.s.dt.column(numCols - _this.c.end).header())
						var leftMostPos = leftMost.offset()
						// If the current highlighted cell is right of the leftmost cell on the screen
						if ($$1(cell.node()).hasClass(_this.classes.fixedRight)) {
							scroll.scrollLeft(scroller.scrollWidth - scroller.clientWidth)
						} else if (cellPos.left + cellWidth > leftMostPos.left) {
							// Scroll it into view
							currScroll = scroll.scrollLeft()
							scroll.scrollLeft(currScroll - (leftMostPos.left - (cellPos.left + cellWidth)))
						}
					}
				})
			}
			/**
			 * Sum a range of values from an array
			 *
			 * @param widths
			 * @param index
			 * @returns
			 */
			FixedColumns.prototype._sum = function (widths, index, reverse) {
				if (reverse === void 0) {
					reverse = false
				}
				if (reverse) {
					widths = widths.slice().reverse()
				}
				return widths.slice(0, index).reduce(function (accum, val) {
					return accum + val
				}, 0)
			}
			FixedColumns.version = "5.0.2"
			FixedColumns.classes = {
				bottomBlocker: "dtfc-bottom-blocker",
				fixedEnd: "dtfc-fixed-end",
				fixedLeft: "dtfc-fixed-left",
				fixedRight: "dtfc-fixed-right",
				fixedStart: "dtfc-fixed-start",
				tableFixedEnd: "dtfc-has-end",
				tableFixedLeft: "dtfc-has-left",
				tableFixedRight: "dtfc-has-right",
				tableFixedStart: "dtfc-has-start",
				tableScrollingEnd: "dtfc-scrolling-end",
				tableScrollingLeft: "dtfc-scrolling-left",
				tableScrollingRight: "dtfc-scrolling-right",
				tableScrollingStart: "dtfc-scrolling-start",
				topBlocker: "dtfc-top-blocker"
			}
			FixedColumns.defaults = {
				i18n: {
					button: "FixedColumns"
				},
				start: 1,
				end: 0
			}
			return FixedColumns
		})()

		/*! FixedColumns 5.0.2
		 * © SpryMedia Ltd - datatables.net/license
		 */
		setJQuery($)
		$.fn.dataTable.FixedColumns = FixedColumns
		$.fn.DataTable.FixedColumns = FixedColumns
		var apiRegister = DataTable.Api.register
		apiRegister("fixedColumns()", function () {
			return this
		})
		apiRegister("fixedColumns().start()", function (newVal) {
			var ctx = this.context[0]
			if (newVal !== undefined) {
				ctx._fixedColumns.start(newVal)
				return this
			} else {
				return ctx._fixedColumns.start()
			}
		})
		apiRegister("fixedColumns().end()", function (newVal) {
			var ctx = this.context[0]
			if (newVal !== undefined) {
				ctx._fixedColumns.end(newVal)
				return this
			} else {
				return ctx._fixedColumns.end()
			}
		})
		apiRegister("fixedColumns().left()", function (newVal) {
			var ctx = this.context[0]
			if (newVal !== undefined) {
				ctx._fixedColumns.left(newVal)
				return this
			} else {
				return ctx._fixedColumns.left()
			}
		})
		apiRegister("fixedColumns().right()", function (newVal) {
			var ctx = this.context[0]
			if (newVal !== undefined) {
				ctx._fixedColumns.right(newVal)
				return this
			} else {
				return ctx._fixedColumns.right()
			}
		})
		DataTable.ext.buttons.fixedColumns = {
			action: function (e, dt, node, config) {
				if ($(node).attr("active")) {
					$(node).removeAttr("active").removeClass("active")
					dt.fixedColumns().start(0)
					dt.fixedColumns().end(0)
				} else {
					$(node).attr("active", "true").addClass("active")
					dt.fixedColumns().start(config.config.start)
					dt.fixedColumns().end(config.config.end)
				}
			},
			config: {
				start: 1,
				end: 0
			},
			init: function (dt, node, config) {
				if (dt.settings()[0]._fixedColumns === undefined) {
					_init(dt.settings(), config)
				}
				$(node).attr("active", "true").addClass("active")
				dt.button(node).text(config.text || dt.i18n("buttons.fixedColumns", dt.settings()[0]._fixedColumns.c.i18n.button))
			},
			text: null
		}
		function _init(settings, options) {
			if (options === void 0) {
				options = null
			}
			var api = new DataTable.Api(settings)
			var opts = options ? options : api.init().fixedColumns || DataTable.defaults.fixedColumns
			var fixedColumns = new FixedColumns(api, opts)
			return fixedColumns
		}
		// Attach a listener to the document which listens for DataTables initialisation
		// events so we can automatically initialise
		$(document).on("plugin-init.dt", function (e, settings) {
			if (e.namespace !== "dt") {
				return
			}
			if (settings.oInit.fixedColumns || DataTable.defaults.fixedColumns) {
				if (!settings._fixedColumns) {
					_init(settings, null)
				}
			}
		})
	})()

	return DataTable
})

/*! FixedHeader 4.0.1
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	/**
	 * @summary     FixedHeader
	 * @description Fix a table's header or footer, so it is always visible while
	 *              scrolling
	 * @version     4.0.1
	 * @author      SpryMedia Ltd
	 * @contact     datatables.net
	 *
	 * This source file is free software, available under the following license:
	 *   MIT license - http://datatables.net/license/mit
	 *
	 * This source file is distributed in the hope that it will be useful, but
	 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
	 *
	 * For details please refer to: http://www.datatables.net
	 */

	var _instCounter = 0

	var FixedHeader = function (dt, config) {
		if (!DataTable.versionCheck("2")) {
			throw "Warning: FixedHeader requires DataTables 2 or newer"
		}

		// Sanity check - you just know it will happen
		if (!(this instanceof FixedHeader)) {
			throw "FixedHeader must be initialised with the 'new' keyword."
		}

		// Allow a boolean true for defaults
		if (config === true) {
			config = {}
		}

		dt = new DataTable.Api(dt)

		this.c = $.extend(true, {}, FixedHeader.defaults, config)

		this.s = {
			dt: dt,
			position: {
				theadTop: 0,
				tbodyTop: 0,
				tfootTop: 0,
				tfootBottom: 0,
				width: 0,
				left: 0,
				tfootHeight: 0,
				theadHeight: 0,
				windowHeight: $(window).height(),
				visible: true
			},
			headerMode: null,
			footerMode: null,
			autoWidth: dt.settings()[0].oFeatures.bAutoWidth,
			namespace: ".dtfc" + _instCounter++,
			scrollLeft: {
				header: -1,
				footer: -1
			},
			enable: true,
			autoDisable: false
		}

		this.dom = {
			floatingHeader: null,
			thead: $(dt.table().header()),
			tbody: $(dt.table().body()),
			tfoot: $(dt.table().footer()),
			header: {
				host: null,
				floating: null,
				floatingParent: $('<div class="dtfh-floatingparent"><div></div></div>'),
				placeholder: null
			},
			footer: {
				host: null,
				floating: null,
				floatingParent: $('<div class="dtfh-floatingparent"><div></div></div>'),
				placeholder: null
			}
		}

		this.dom.header.host = this.dom.thead.parent()
		this.dom.footer.host = this.dom.tfoot.parent()

		var dtSettings = dt.settings()[0]
		if (dtSettings._fixedHeader) {
			throw "FixedHeader already initialised on table " + dtSettings.nTable.id
		}

		dtSettings._fixedHeader = this

		this._constructor()
	}

	/*
	 * Variable: FixedHeader
	 * Purpose:  Prototype for FixedHeader
	 * Scope:    global
	 */
	$.extend(FixedHeader.prototype, {
		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * API methods
		 */

		/**
		 * Kill off FH and any events
		 */
		destroy: function () {
			var dom = this.dom

			this.s.dt.off(".dtfc")
			$(window).off(this.s.namespace)

			// Remove clones of FC blockers
			if (dom.header.rightBlocker) {
				dom.header.rightBlocker.remove()
			}
			if (dom.header.leftBlocker) {
				dom.header.leftBlocker.remove()
			}
			if (dom.footer.rightBlocker) {
				dom.footer.rightBlocker.remove()
			}
			if (dom.footer.leftBlocker) {
				dom.footer.leftBlocker.remove()
			}

			if (this.c.header) {
				this._modeChange("in-place", "header", true)
			}

			if (this.c.footer && dom.tfoot.length) {
				this._modeChange("in-place", "footer", true)
			}
		},

		/**
		 * Enable / disable the fixed elements
		 *
		 * @param  {boolean} enable `true` to enable, `false` to disable
		 */
		enable: function (enable, update, type) {
			this.s.enable = enable

			this.s.enableType = type

			if (update || update === undefined) {
				this._positions()
				this._scroll(true)
			}
		},

		/**
		 * Get enabled status
		 */
		enabled: function () {
			return this.s.enable
		},

		/**
		 * Set header offset
		 *
		 * @param  {int} new value for headerOffset
		 */
		headerOffset: function (offset) {
			if (offset !== undefined) {
				this.c.headerOffset = offset
				this.update()
			}

			return this.c.headerOffset
		},

		/**
		 * Set footer offset
		 *
		 * @param  {int} new value for footerOffset
		 */
		footerOffset: function (offset) {
			if (offset !== undefined) {
				this.c.footerOffset = offset
				this.update()
			}

			return this.c.footerOffset
		},

		/**
		 * Recalculate the position of the fixed elements and force them into place
		 */
		update: function (force) {
			var table = this.s.dt.table().node()

			// Update should only do something if enabled by the dev.
			if (!this.s.enable && !this.s.autoDisable) {
				return
			}

			if ($(table).is(":visible")) {
				this.s.autoDisable = false
				this.enable(true, false)
			} else {
				this.s.autoDisable = true
				this.enable(false, false)
			}

			// Don't update if header is not in the document atm (due to
			// async events)
			if ($(table).children("thead").length === 0) {
				return
			}

			this._positions()
			this._scroll(force !== undefined ? force : true)
			this._widths(this.dom.header)
			this._widths(this.dom.footer)
		},

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Constructor
		 */

		/**
		 * FixedHeader constructor - adding the required event listeners and
		 * simple initialisation
		 *
		 * @private
		 */
		_constructor: function () {
			var that = this
			var dt = this.s.dt

			$(window)
				.on("scroll" + this.s.namespace, function () {
					that._scroll()
				})
				.on(
					"resize" + this.s.namespace,
					DataTable.util.throttle(function () {
						that.s.position.windowHeight = $(window).height()
						that.update()
					}, 50)
				)

			var autoHeader = $(".fh-fixedHeader")
			if (!this.c.headerOffset && autoHeader.length) {
				this.c.headerOffset = autoHeader.outerHeight()
			}

			var autoFooter = $(".fh-fixedFooter")
			if (!this.c.footerOffset && autoFooter.length) {
				this.c.footerOffset = autoFooter.outerHeight()
			}

			dt.on("column-reorder.dt.dtfc column-visibility.dt.dtfc column-sizing.dt.dtfc responsive-display.dt.dtfc", function (e, ctx) {
				that.update()
			}).on("draw.dt.dtfc", function (e, ctx) {
				// For updates from our own table, don't reclone, but for all others, do
				that.update(ctx === dt.settings()[0] ? false : true)
			})

			dt.on("destroy.dtfc", function () {
				that.destroy()
			})

			this._positions()
			this._scroll()
		},

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Private methods
		 */

		/**
		 * Clone a fixed item to act as a place holder for the original element
		 * which is moved into a clone of the table element, and moved around the
		 * document to give the fixed effect.
		 *
		 * @param  {string}  item  'header' or 'footer'
		 * @param  {boolean} force Force the clone to happen, or allow automatic
		 *   decision (reuse existing if available)
		 * @private
		 */
		_clone: function (item, force) {
			var that = this
			var dt = this.s.dt
			var itemDom = this.dom[item]
			var itemElement = item === "header" ? this.dom.thead : this.dom.tfoot

			// If footer and scrolling is enabled then we don't clone
			// Instead the table's height is decreased accordingly - see `_scroll()`
			if (item === "footer" && this._scrollEnabled()) {
				return
			}

			if (!force && itemDom.floating) {
				// existing floating element - reuse it
				itemDom.floating.removeClass("fixedHeader-floating fixedHeader-locked")
			} else {
				if (itemDom.floating) {
					if (itemDom.placeholder !== null) {
						itemDom.placeholder.remove()
					}

					itemDom.floating.children().detach()
					itemDom.floating.remove()
				}

				var tableNode = $(dt.table().node())
				var scrollBody = $(tableNode.parent())
				var scrollEnabled = this._scrollEnabled()

				itemDom.floating = $(dt.table().node().cloneNode(false))
					.attr("aria-hidden", "true")
					.css({
						top: 0,
						left: 0
					})
					.removeAttr("id")

				itemDom.floatingParent
					.css({
						width: scrollBody[0].offsetWidth,
						overflow: "hidden",
						height: "fit-content",
						position: "fixed",
						left: scrollEnabled ? tableNode.offset().left + scrollBody.scrollLeft() : 0
					})
					.css(
						item === "header"
							? {
									top: this.c.headerOffset,
									bottom: ""
							  }
							: {
									top: "",
									bottom: this.c.footerOffset
							  }
					)
					.addClass(item === "footer" ? "dtfh-floatingparent-foot" : "dtfh-floatingparent-head")
					.appendTo("body")
					.children()
					.eq(0)
					.append(itemDom.floating)

				this._stickyPosition(itemDom.floating, "-")

				var scrollLeftUpdate = function () {
					var scrollLeft = scrollBody.scrollLeft()
					that.s.scrollLeft = { footer: scrollLeft, header: scrollLeft }
					itemDom.floatingParent.scrollLeft(that.s.scrollLeft.header)
				}

				scrollLeftUpdate()
				scrollBody.off("scroll.dtfh").on("scroll.dtfh", scrollLeftUpdate)

				// Need padding on the header's container to allow for a scrollbar,
				// just like how DataTables handles it
				itemDom.floatingParent.children().css({
					width: "fit-content",
					paddingRight: that.s.dt.settings()[0].oBrowser.barWidth
				})

				// Blocker to hide the table behind the scrollbar - this needs to use
				// fixed positioning in the container since we don't have an outer wrapper
				let blocker = $(item === "footer" ? "div.dtfc-bottom-blocker" : "div.dtfc-top-blocker", dt.table().container())

				if (blocker.length) {
					blocker.clone().appendTo(itemDom.floatingParent).css({
						position: "fixed",
						right: blocker.width()
					})
				}

				// Insert a fake thead/tfoot into the DataTable to stop it jumping around
				itemDom.placeholder = itemElement.clone(false)
				itemDom.placeholder.find("*[id]").removeAttr("id")

				// Move the thead / tfoot elements around - original into the floating
				// element and clone into the original table
				itemDom.host.prepend(itemDom.placeholder)
				itemDom.floating.append(itemElement)

				this._widths(itemDom)
			}
		},

		/**
		 * This method sets the sticky position of the header elements to match fixed columns
		 * @param {JQuery<HTMLElement>} el
		 * @param {string} sign
		 */
		_stickyPosition: function (el, sign) {
			if (this._scrollEnabled()) {
				var that = this
				var rtl = $(that.s.dt.table().node()).css("direction") === "rtl"

				el.find("th").each(function () {
					// Find out if fixed header has previously set this column
					if ($(this).css("position") === "sticky") {
						var right = $(this).css("right")
						var left = $(this).css("left")
						var potential

						if (right !== "auto" && !rtl) {
							potential = +right.replace(/px/g, "")

							$(this).css("right", potential > 0 ? potential : 0)
						} else if (left !== "auto" && rtl) {
							potential = +left.replace(/px/g, "")

							$(this).css("left", potential > 0 ? potential : 0)
						}
					}
				})
			}
		},

		/**
		 * Reposition the floating elements to take account of horizontal page
		 * scroll
		 *
		 * @param  {string} item       The `header` or `footer`
		 * @param  {int}    scrollLeft Document scrollLeft
		 * @private
		 */
		_horizontal: function (item, scrollLeft) {
			var itemDom = this.dom[item]
			var lastScrollLeft = this.s.scrollLeft

			if (itemDom.floating && lastScrollLeft[item] !== scrollLeft) {
				// If scrolling is enabled we need to match the floating header to the body
				if (this._scrollEnabled()) {
					var newScrollLeft = $($(this.s.dt.table().node()).parent()).scrollLeft()
					itemDom.floating.scrollLeft(newScrollLeft)
					itemDom.floatingParent.scrollLeft(newScrollLeft)
				}

				lastScrollLeft[item] = scrollLeft
			}
		},

		/**
		 * Change from one display mode to another. Each fixed item can be in one
		 * of:
		 *
		 * * `in-place` - In the main DataTable
		 * * `in` - Floating over the DataTable
		 * * `below` - (Header only) Fixed to the bottom of the table body
		 * * `above` - (Footer only) Fixed to the top of the table body
		 *
		 * @param  {string}  mode        Mode that the item should be shown in
		 * @param  {string}  item        'header' or 'footer'
		 * @param  {boolean} forceChange Force a redraw of the mode, even if already
		 *     in that mode.
		 * @private
		 */
		_modeChange: function (mode, item, forceChange) {
			var itemDom = this.dom[item]
			var position = this.s.position

			// Just determine if scroll is enabled once
			var scrollEnabled = this._scrollEnabled()

			// If footer and scrolling is enabled then we don't clone
			// Instead the table's height is decreased accordingly - see `_scroll()`
			if (item === "footer" && scrollEnabled) {
				return
			}

			// It isn't trivial to add a !important css attribute...
			var importantWidth = function (w) {
				itemDom.floating[0].style.setProperty("width", w + "px", "important")

				// If not scrolling also have to update the floatingParent
				if (!scrollEnabled) {
					itemDom.floatingParent[0].style.setProperty("width", w + "px", "important")
				}
			}

			// Record focus. Browser's will cause input elements to loose focus if
			// they are inserted else where in the doc
			var tablePart = this.dom[item === "footer" ? "tfoot" : "thead"]
			var focus = $.contains(tablePart[0], document.activeElement) ? document.activeElement : null
			var scrollBody = $($(this.s.dt.table().node()).parent())

			if (mode === "in-place") {
				// Insert the header back into the table's real header
				if (itemDom.placeholder) {
					itemDom.placeholder.remove()
					itemDom.placeholder = null
				}

				if (item === "header") {
					itemDom.host.prepend(tablePart)
				} else {
					itemDom.host.append(tablePart)
				}

				if (itemDom.floating) {
					itemDom.floating.remove()
					itemDom.floating = null
					this._stickyPosition(itemDom.host, "+")
				}

				if (itemDom.floatingParent) {
					itemDom.floatingParent.find("div.dtfc-top-blocker").remove()
					itemDom.floatingParent.remove()
				}

				$($(itemDom.host.parent()).parent()).scrollLeft(scrollBody.scrollLeft())
			} else if (mode === "in") {
				// Remove the header from the real table and insert into a fixed
				// positioned floating table clone
				this._clone(item, forceChange)

				// Get useful position values
				var scrollOffset = scrollBody.offset()
				var windowTop = $(document).scrollTop()
				var windowHeight = $(window).height()
				var windowBottom = windowTop + windowHeight
				var bodyTop = scrollEnabled ? scrollOffset.top : position.tbodyTop
				var bodyBottom = scrollEnabled ? scrollOffset.top + scrollBody.outerHeight() : position.tfootTop

				// Calculate the amount that the footer or header needs to be shuffled
				var shuffle

				if (item === "footer") {
					shuffle =
						bodyTop > windowBottom
							? position.tfootHeight // Yes - push the footer below
							: bodyTop + position.tfootHeight - windowBottom // No
				} else {
					// Otherwise must be a header so get the difference from the bottom of the
					//  desired floating header and the bottom of the table body
					shuffle = windowTop + this.c.headerOffset + position.theadHeight - bodyBottom
				}

				// Set the top or bottom based off of the offset and the shuffle value
				var prop = item === "header" ? "top" : "bottom"
				var val = this.c[item + "Offset"] - (shuffle > 0 ? shuffle : 0)

				itemDom.floating.addClass("fixedHeader-floating")
				itemDom.floatingParent.css(prop, val).css({
					left: position.left,
					"z-index": 3
				})

				importantWidth(position.width)

				if (item === "footer") {
					itemDom.floating.css("top", "")
				}
			} else if (mode === "below") {
				// only used for the header
				// Fix the position of the floating header at base of the table body
				this._clone(item, forceChange)

				itemDom.floating.addClass("fixedHeader-locked")
				itemDom.floatingParent.css({
					position: "absolute",
					top: position.tfootTop - position.theadHeight,
					left: position.left + "px"
				})

				importantWidth(position.width)
			} else if (mode === "above") {
				// only used for the footer
				// Fix the position of the floating footer at top of the table body
				this._clone(item, forceChange)

				itemDom.floating.addClass("fixedHeader-locked")
				itemDom.floatingParent.css({
					position: "absolute",
					top: position.tbodyTop,
					left: position.left + "px"
				})

				importantWidth(position.width)
			}

			// Restore focus if it was lost
			if (focus && focus !== document.activeElement) {
				setTimeout(function () {
					focus.focus()
				}, 10)
			}

			this.s.scrollLeft.header = -1
			this.s.scrollLeft.footer = -1
			this.s[item + "Mode"] = mode
		},

		/**
		 * Cache the positional information that is required for the mode
		 * calculations that FixedHeader performs.
		 *
		 * @private
		 */
		_positions: function () {
			var dt = this.s.dt
			var table = dt.table()
			var position = this.s.position
			var dom = this.dom
			var tableNode = $(table.node())
			var scrollEnabled = this._scrollEnabled()

			// Need to use the header and footer that are in the main table,
			// regardless of if they are clones, since they hold the positions we
			// want to measure from
			var thead = $(dt.table().header())
			var tfoot = $(dt.table().footer())
			var tbody = dom.tbody
			var scrollBody = tableNode.parent()

			position.visible = tableNode.is(":visible")
			position.width = tableNode.outerWidth()
			position.left = tableNode.offset().left
			position.theadTop = thead.offset().top
			position.tbodyTop = scrollEnabled ? scrollBody.offset().top : tbody.offset().top
			position.tbodyHeight = scrollEnabled ? scrollBody.outerHeight() : tbody.outerHeight()
			position.theadHeight = thead.outerHeight()
			position.theadBottom = position.theadTop + position.theadHeight
			position.tfootTop = position.tbodyTop + position.tbodyHeight //tfoot.offset().top;

			if (tfoot.length) {
				position.tfootBottom = position.tfootTop + tfoot.outerHeight()
				position.tfootHeight = tfoot.outerHeight()
			} else {
				position.tfootBottom = position.tfootTop
				position.tfootHeight = 0
			}
		},

		/**
		 * Mode calculation - determine what mode the fixed items should be placed
		 * into.
		 *
		 * @param  {boolean} forceChange Force a redraw of the mode, even if already
		 *     in that mode.
		 * @private
		 */
		_scroll: function (forceChange) {
			if (this.s.dt.settings()[0].bDestroying) {
				return
			}

			// ScrollBody details
			var scrollEnabled = this._scrollEnabled()
			var scrollBody = $(this.s.dt.table().node()).parent()
			var scrollOffset = scrollBody.offset()
			var scrollHeight = scrollBody.outerHeight()

			// Window details
			var windowLeft = $(document).scrollLeft()
			var windowTop = $(document).scrollTop()
			var windowHeight = $(window).height()
			var windowBottom = windowHeight + windowTop

			var position = this.s.position
			var headerMode, footerMode

			// Body Details
			var bodyTop = scrollEnabled ? scrollOffset.top : position.tbodyTop
			var bodyLeft = scrollEnabled ? scrollOffset.left : position.left
			var bodyBottom = scrollEnabled ? scrollOffset.top + scrollHeight : position.tfootTop
			var bodyWidth = scrollEnabled ? scrollBody.outerWidth() : position.tbodyWidth

			if (this.c.header) {
				if (!this.s.enable) {
					headerMode = "in-place"
				}
				// The header is in it's normal place if the body top is lower than
				//  the scroll of the window plus the headerOffset and the height of the header
				else if (!position.visible || windowTop + this.c.headerOffset + position.theadHeight <= bodyTop) {
					headerMode = "in-place"
				}
				// The header should be floated if
				else if (
					// The scrolling plus the header offset plus the height of the header is lower than the top of the body
					windowTop + this.c.headerOffset + position.theadHeight > bodyTop &&
					// And the scrolling at the top plus the header offset is above the bottom of the body
					windowTop + this.c.headerOffset + position.theadHeight < bodyBottom
				) {
					headerMode = "in"

					// Further to the above, If the scrolling plus the header offset plus the header height is lower
					// than the bottom of the table a shuffle is required so have to force the calculation
					if (windowTop + this.c.headerOffset + position.theadHeight > bodyBottom || this.dom.header.floatingParent === undefined) {
						forceChange = true
					} else {
						this.dom.header.floatingParent
							.css({
								top: this.c.headerOffset,
								position: "fixed"
							})
							.children()
							.eq(0)
							.append(this.dom.header.floating)
					}
				}
				// Anything else and the view is below the table
				else {
					headerMode = "below"
				}

				if (forceChange || headerMode !== this.s.headerMode) {
					this._modeChange(headerMode, "header", forceChange)
				}

				this._horizontal("header", windowLeft)
			}

			var header = {
				offset: { top: 0, left: 0 },
				height: 0
			}
			var footer = {
				offset: { top: 0, left: 0 },
				height: 0
			}

			if (this.c.footer && this.dom.tfoot.length && this.dom.tfoot.find("th, td").length) {
				if (!this.s.enable) {
					footerMode = "in-place"
				} else if (!position.visible || position.tfootBottom + this.c.footerOffset <= windowBottom) {
					footerMode = "in-place"
				} else if (bodyBottom + position.tfootHeight + this.c.footerOffset > windowBottom && bodyTop + this.c.footerOffset < windowBottom) {
					footerMode = "in"
					forceChange = true
				} else {
					footerMode = "above"
				}

				if (forceChange || footerMode !== this.s.footerMode) {
					this._modeChange(footerMode, "footer", forceChange)
				}

				this._horizontal("footer", windowLeft)

				var getOffsetHeight = function (el) {
					return {
						offset: el.offset(),
						height: el.outerHeight()
					}
				}

				header = this.dom.header.floating ? getOffsetHeight(this.dom.header.floating) : getOffsetHeight(this.dom.thead)
				footer = this.dom.footer.floating ? getOffsetHeight(this.dom.footer.floating) : getOffsetHeight(this.dom.tfoot)

				// If scrolling is enabled and the footer is off the screen
				if (scrollEnabled && footer.offset.top > windowTop) {
					// && footer.offset.top >= windowBottom) {
					// Calculate the gap between the top of the scrollBody and the top of the window
					var overlap = windowTop - scrollOffset.top
					// The new height is the bottom of the window
					var newHeight =
						windowBottom +
						// If the gap between the top of the scrollbody and the window is more than
						//  the height of the header then the top of the table is still visible so add that gap
						// Doing this has effectively calculated the height from the top of the table to the bottom of the current page
						(overlap > -header.height ? overlap : 0) -
						// Take from that
						// The top of the header plus
						(header.offset.top +
							// The header height if the standard header is present
							(overlap < -header.height ? header.height : 0) +
							// And the height of the footer
							footer.height)

					// Don't want a negative height
					if (newHeight < 0) {
						newHeight = 0
					}

					// At the end of the above calculation the space between the header (top of the page if floating)
					// and the point just above the footer should be the new value for the height of the table.
					scrollBody.outerHeight(newHeight)

					// Need some rounding here as sometimes very small decimal places are encountered
					// If the actual height is bigger or equal to the height we just applied then the footer is "Floating"
					if (Math.round(scrollBody.outerHeight()) >= Math.round(newHeight)) {
						$(this.dom.tfoot.parent()).addClass("fixedHeader-floating")
					}
					// Otherwise max-width has kicked in so it is not floating
					else {
						$(this.dom.tfoot.parent()).removeClass("fixedHeader-floating")
					}
				}
			}

			if (this.dom.header.floating) {
				this.dom.header.floatingParent.css("left", bodyLeft - windowLeft)
			}
			if (this.dom.footer.floating) {
				this.dom.footer.floatingParent.css("left", bodyLeft - windowLeft)
			}

			// If fixed columns is being used on this table then the blockers need to be copied across
			// Cloning these is cleaner than creating as our own as it will keep consistency with fixedColumns automatically
			// ASSUMING that the class remains the same
			if (this.s.dt.settings()[0]._fixedColumns !== undefined) {
				var adjustBlocker = function (side, end, el) {
					if (el === undefined) {
						var blocker = $("div.dtfc-" + side + "-" + end + "-blocker")

						el = blocker.length === 0 ? null : blocker.clone().css("z-index", 1)
					}

					if (el !== null) {
						if (headerMode === "in" || headerMode === "below") {
							el.appendTo("body").css({
								top: end === "top" ? header.offset.top : footer.offset.top,
								left: side === "right" ? bodyLeft + bodyWidth - el.width() : bodyLeft
							})
						} else {
							el.detach()
						}
					}

					return el
				}

				// Adjust all blockers
				this.dom.header.rightBlocker = adjustBlocker("right", "top", this.dom.header.rightBlocker)
				this.dom.header.leftBlocker = adjustBlocker("left", "top", this.dom.header.leftBlocker)
				this.dom.footer.rightBlocker = adjustBlocker("right", "bottom", this.dom.footer.rightBlocker)
				this.dom.footer.leftBlocker = adjustBlocker("left", "bottom", this.dom.footer.leftBlocker)
			}
		},

		/**
		 * Function to check if scrolling is enabled on the table or not
		 * @returns Boolean value indicating if scrolling on the table is enabled or not
		 */
		_scrollEnabled: function () {
			var oScroll = this.s.dt.settings()[0].oScroll
			if (oScroll.sY !== "" || oScroll.sX !== "") {
				return true
			}
			return false
		},

		/**
		 * Realign columns by using the colgroup tag and
		 * checking column widths
		 */
		_widths: function (itemDom) {
			if (!itemDom || !itemDom.placeholder) {
				return
			}

			// Match the table overall width
			var tableNode = $(this.s.dt.table().node())
			var scrollBody = $(tableNode.parent())

			itemDom.floatingParent.css("width", scrollBody[0].offsetWidth)
			itemDom.floating.css("width", tableNode[0].offsetWidth)

			// Strip out the old colgroup
			$("colgroup", itemDom.floating).remove()

			// Copy the `colgroup` element to define the number of columns - needed
			// for complex header cases where a column might not have a unique
			// header
			var cols = itemDom.placeholder.parent().find("colgroup").clone().appendTo(itemDom.floating).find("col")

			// However, the widths defined in the colgroup from the DataTable might
			// not exactly reflect the actual widths of the columns (content can
			// force it to stretch). So we need to copy the actual widths into the
			// colgroup / col's used for the floating header.
			var widths = this.s.dt.columns(":visible").widths()

			for (var i = 0; i < widths.length; i++) {
				cols.eq(i).css("width", widths[i])
			}
		}
	})

	/**
	 * Version
	 * @type {String}
	 * @static
	 */
	FixedHeader.version = "4.0.1"

	/**
	 * Defaults
	 * @type {Object}
	 * @static
	 */
	FixedHeader.defaults = {
		header: true,
		footer: false,
		headerOffset: 0,
		footerOffset: 0
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * DataTables interfaces
	 */

	// Attach for constructor access
	$.fn.dataTable.FixedHeader = FixedHeader
	$.fn.DataTable.FixedHeader = FixedHeader

	// DataTables creation - check if the FixedHeader option has been defined on the
	// table and if so, initialise
	$(document).on("init.dt.dtfh", function (e, settings, json) {
		if (e.namespace !== "dt") {
			return
		}

		var init = settings.oInit.fixedHeader
		var defaults = DataTable.defaults.fixedHeader

		if ((init || defaults) && !settings._fixedHeader) {
			var opts = $.extend({}, defaults, init)

			if (init !== false) {
				new FixedHeader(settings, opts)
			}
		}
	})

	// DataTables API methods
	DataTable.Api.register("fixedHeader()", function () {})

	DataTable.Api.register("fixedHeader.adjust()", function () {
		return this.iterator("table", function (ctx) {
			var fh = ctx._fixedHeader

			if (fh) {
				fh.update()
			}
		})
	})

	DataTable.Api.register("fixedHeader.enable()", function (flag) {
		return this.iterator("table", function (ctx) {
			var fh = ctx._fixedHeader

			flag = flag !== undefined ? flag : true
			if (fh && flag !== fh.enabled()) {
				fh.enable(flag)
			}
		})
	})

	DataTable.Api.register("fixedHeader.enabled()", function () {
		if (this.context.length) {
			var fh = this.context[0]._fixedHeader

			if (fh) {
				return fh.enabled()
			}
		}

		return false
	})

	DataTable.Api.register("fixedHeader.disable()", function () {
		return this.iterator("table", function (ctx) {
			var fh = ctx._fixedHeader

			if (fh && fh.enabled()) {
				fh.enable(false)
			}
		})
	})

	$.each(["header", "footer"], function (i, el) {
		DataTable.Api.register("fixedHeader." + el + "Offset()", function (offset) {
			var ctx = this.context

			if (offset === undefined) {
				return ctx.length && ctx[0]._fixedHeader ? ctx[0]._fixedHeader[el + "Offset"]() : undefined
			}

			return this.iterator("table", function (ctx) {
				var fh = ctx._fixedHeader

				if (fh) {
					fh[el + "Offset"](offset)
				}
			})
		})
	})

	return DataTable
})

/*! SearchBuilder 1.8.0
 * ©SpryMedia Ltd - datatables.net/license/mit
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	;(function () {
		"use strict"

		var $$3
		var dataTable$2
		/** Get a moment object. Attempt to get from DataTables for module loading first. */
		function moment() {
			var used = DataTable.use("moment")
			return used ? used : window.moment
		}
		/** Get a luxon object. Attempt to get from DataTables for module loading first. */
		function luxon() {
			var used = DataTable.use("luxon")
			return used ? used : window.luxon
		}
		/**
		 * Sets the value of jQuery for use in the file
		 *
		 * @param jq the instance of jQuery to be set
		 */
		function setJQuery$2(jq) {
			$$3 = jq
			dataTable$2 = jq.fn.dataTable
		}
		/**
		 * The Criteria class is used within SearchBuilder to represent a search criteria
		 */
		var Criteria = /** @class */ (function () {
			function Criteria(table, opts, topGroup, index, depth, serverData, liveSearch) {
				if (index === void 0) {
					index = 0
				}
				if (depth === void 0) {
					depth = 1
				}
				if (serverData === void 0) {
					serverData = undefined
				}
				if (liveSearch === void 0) {
					liveSearch = false
				}
				var _this = this
				this.classes = $$3.extend(true, {}, Criteria.classes)
				// Get options from user and any extra conditions/column types defined by plug-ins
				this.c = $$3.extend(true, {}, Criteria.defaults, $$3.fn.dataTable.ext.searchBuilder, opts)
				var i18n = this.c.i18n
				this.s = {
					condition: undefined,
					conditions: {},
					data: undefined,
					dataIdx: -1,
					dataPoints: [],
					dateFormat: false,
					depth: depth,
					dt: table,
					filled: false,
					index: index,
					liveSearch: liveSearch,
					origData: undefined,
					preventRedraw: false,
					serverData: serverData,
					topGroup: topGroup,
					type: "",
					value: []
				}
				this.dom = {
					buttons: $$3("<div/>").addClass(this.classes.buttonContainer),
					condition: $$3("<select disabled/>").addClass(this.classes.condition).addClass(this.classes.dropDown).addClass(this.classes.italic).attr("autocomplete", "hacking"),
					conditionTitle: $$3('<option value="" disabled selected hidden/>').html(this.s.dt.i18n("searchBuilder.condition", i18n.condition)),
					container: $$3("<div/>").addClass(this.classes.container),
					data: $$3("<select/>").addClass(this.classes.data).addClass(this.classes.dropDown).addClass(this.classes.italic),
					dataTitle: $$3('<option value="" disabled selected hidden/>').html(this.s.dt.i18n("searchBuilder.data", i18n.data)),
					defaultValue: $$3("<select disabled/>").addClass(this.classes.value).addClass(this.classes.dropDown).addClass(this.classes.select).addClass(this.classes.italic),
					delete: $$3("<button/>")
						.html(this.s.dt.i18n("searchBuilder.delete", i18n["delete"]))
						.addClass(this.classes["delete"])
						.addClass(this.classes.button)
						.attr("title", this.s.dt.i18n("searchBuilder.deleteTitle", i18n.deleteTitle))
						.attr("type", "button"),
					inputCont: $$3("<div/>").addClass(this.classes.inputCont),
					// eslint-disable-next-line no-useless-escape
					left: $$3("<button/>")
						.html(this.s.dt.i18n("searchBuilder.left", i18n.left))
						.addClass(this.classes.left)
						.addClass(this.classes.button)
						.attr("title", this.s.dt.i18n("searchBuilder.leftTitle", i18n.leftTitle))
						.attr("type", "button"),
					// eslint-disable-next-line no-useless-escape
					right: $$3("<button/>")
						.html(this.s.dt.i18n("searchBuilder.right", i18n.right))
						.addClass(this.classes.right)
						.addClass(this.classes.button)
						.attr("title", this.s.dt.i18n("searchBuilder.rightTitle", i18n.rightTitle))
						.attr("type", "button"),
					value: [$$3("<select disabled/>").addClass(this.classes.value).addClass(this.classes.dropDown).addClass(this.classes.italic).addClass(this.classes.select)],
					valueTitle: $$3('<option value="--valueTitle--" disabled selected hidden/>').html(this.s.dt.i18n("searchBuilder.value", i18n.value))
				}
				// If the greyscale option is selected then add the class to add the grey colour to SearchBuilder
				if (this.c.greyscale) {
					this.dom.data.addClass(this.classes.greyscale)
					this.dom.condition.addClass(this.classes.greyscale)
					this.dom.defaultValue.addClass(this.classes.greyscale)
					for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
						var val = _a[_i]
						val.addClass(this.classes.greyscale)
					}
				}
				$$3(window).on(
					"resize.dtsb",
					dataTable$2.util.throttle(function () {
						_this.s.topGroup.trigger("dtsb-redrawLogic")
					})
				)
				this._buildCriteria()
				return this
			}
			/**
			 * Escape html characters within a string
			 *
			 * @param txt the string to be escaped
			 * @returns the escaped string
			 */
			Criteria._escapeHTML = function (txt) {
				return txt
					.toString()
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&quot;/g, '"')
					.replace(/&amp;/g, "&")
			}
			/**
			 * Redraw the DataTable with the current search parameters
			 */
			Criteria.prototype.doSearch = function () {
				// Only do the search if live search is disabled, otherwise the search
				// is triggered by the button at the top level group.
				if (this.c.liveSearch) {
					this.s.dt.draw()
				}
			}
			/**
			 * Parses formatted numbers down to a form where they can be compared.
			 * Note that this does not account for different decimal characters. Use
			 * parseNumber instead on the instance.
			 *
			 * @param val the value to convert
			 * @returns the converted value
			 */
			Criteria.parseNumFmt = function (val) {
				return +val.replace(/(?!^-)[^0-9.]/g, "")
			}
			/**
			 * Adds the left button to the criteria
			 */
			Criteria.prototype.updateArrows = function (hasSiblings) {
				if (hasSiblings === void 0) {
					hasSiblings = false
				}
				// Empty the container and append all of the elements in the correct order
				this.dom.container.children().detach()
				this.dom.container.append(this.dom.data).append(this.dom.condition).append(this.dom.inputCont)
				this.setListeners()
				// Trigger the inserted events for the value elements as they are inserted
				if (this.dom.value[0] !== undefined) {
					$$3(this.dom.value[0]).trigger("dtsb-inserted")
				}
				for (var i = 1; i < this.dom.value.length; i++) {
					this.dom.inputCont.append(this.dom.value[i])
					$$3(this.dom.value[i]).trigger("dtsb-inserted")
				}
				// If this is a top level criteria then don't let it move left
				if (this.s.depth > 1) {
					this.dom.buttons.append(this.dom.left)
				}
				// If the depthLimit of the query has been hit then don't add the right button
				if ((this.c.depthLimit === false || this.s.depth < this.c.depthLimit) && hasSiblings) {
					this.dom.buttons.append(this.dom.right)
				} else {
					this.dom.right.remove()
				}
				this.dom.buttons.append(this.dom["delete"])
				this.dom.container.append(this.dom.buttons)
			}
			/**
			 * Destroys the criteria, removing listeners and container from the dom
			 */
			Criteria.prototype.destroy = function () {
				// Turn off listeners
				this.dom.data.off(".dtsb")
				this.dom.condition.off(".dtsb")
				this.dom["delete"].off(".dtsb")
				for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
					var val = _a[_i]
					val.off(".dtsb")
				}
				// Remove container from the dom
				this.dom.container.remove()
			}
			/**
			 * Passes in the data for the row and compares it against this single criteria
			 *
			 * @param rowData The data for the row to be compared
			 * @returns boolean Whether the criteria has passed
			 */
			Criteria.prototype.search = function (rowData, rowIdx) {
				var settings = this.s.dt.settings()[0]
				var condition = this.s.conditions[this.s.condition]
				if (this.s.condition !== undefined && condition !== undefined) {
					var filter = rowData[this.s.dataIdx]
					// This check is in place for if a custom decimal character is in place
					if (this.s.type && this.s.type.includes("num") && (settings.oLanguage.sDecimal !== "" || settings.oLanguage.sThousands !== "")) {
						var splitRD = [rowData[this.s.dataIdx]]
						if (settings.oLanguage.sDecimal !== "") {
							splitRD = rowData[this.s.dataIdx].split(settings.oLanguage.sDecimal)
						}
						if (settings.oLanguage.sThousands !== "") {
							for (var i = 0; i < splitRD.length; i++) {
								splitRD[i] = splitRD[i].replace(settings.oLanguage.sThousands, ",")
							}
						}
						filter = splitRD.join(".")
					}
					// If orthogonal data is in place we need to get it's values for searching
					if (this.c.orthogonal.search !== "filter") {
						filter = settings.fastData(rowIdx, this.s.dataIdx, typeof this.c.orthogonal === "string" ? this.c.orthogonal : this.c.orthogonal.search)
					}
					if (this.s.type === "array") {
						// Make sure we are working with an array
						if (!Array.isArray(filter)) {
							filter = [filter]
						}
						filter.sort()
						for (var _i = 0, filter_1 = filter; _i < filter_1.length; _i++) {
							var filt = filter_1[_i]
							if (filt && typeof filt === "string") {
								filt = filt.replace(/[\r\n\u2028]/g, " ")
							}
						}
					} else if (filter !== null && typeof filter === "string") {
						filter = filter.replace(/[\r\n\u2028]/g, " ")
					}
					if (this.s.type.includes("html") && typeof filter === "string") {
						filter = filter.replace(/(<([^>]+)>)/gi, "")
					}
					// Not ideal, but jqueries .val() returns an empty string even
					// when the value set is null, so we shall assume the two are equal
					if (filter === null) {
						filter = ""
					}
					return condition.search(filter, this.s.value, this)
				}
			}
			/**
			 * Gets the details required to rebuild the criteria
			 */
			Criteria.prototype.getDetails = function (deFormatDates) {
				if (deFormatDates === void 0) {
					deFormatDates = false
				}
				var i
				var settings = this.s.dt.settings()[0]
				// This check is in place for if a custom decimal character is in place
				if (this.s.type !== null && this.s.type.includes("num") && (settings.oLanguage.sDecimal !== "" || settings.oLanguage.sThousands !== "")) {
					for (i = 0; i < this.s.value.length; i++) {
						var splitRD = [this.s.value[i].toString()]
						if (settings.oLanguage.sDecimal !== "") {
							splitRD = this.s.value[i].split(settings.oLanguage.sDecimal)
						}
						if (settings.oLanguage.sThousands !== "") {
							for (var j = 0; j < splitRD.length; j++) {
								splitRD[j] = splitRD[j].replace(settings.oLanguage.sThousands, ",")
							}
						}
						this.s.value[i] = splitRD.join(".")
					}
				} else if (this.s.type !== null && deFormatDates) {
					if (this.s.type.includes("date") || this.s.type.includes("time")) {
						for (i = 0; i < this.s.value.length; i++) {
							if (this.s.value[i].match(/^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$/g) === null) {
								this.s.value[i] = ""
							}
						}
					} else if (this.s.type.includes("moment")) {
						for (i = 0; i < this.s.value.length; i++) {
							if (this.s.value[i] && this.s.value[i].length > 0 && moment()(this.s.value[i], this.s.dateFormat, true).isValid()) {
								this.s.value[i] = moment()(this.s.value[i], this.s.dateFormat).format("YYYY-MM-DD HH:mm:ss")
							}
						}
					} else if (this.s.type.includes("luxon")) {
						for (i = 0; i < this.s.value.length; i++) {
							if (this.s.value[i] && this.s.value[i].length > 0 && luxon().DateTime.fromFormat(this.s.value[i], this.s.dateFormat).invalid === null) {
								this.s.value[i] = luxon().DateTime.fromFormat(this.s.value[i], this.s.dateFormat).toFormat("yyyy-MM-dd HH:mm:ss")
							}
						}
					}
				}
				if (this.s.type && this.s.type.includes("num") && this.s.dt.page.info().serverSide) {
					for (i = 0; i < this.s.value.length; i++) {
						this.s.value[i] = this.s.value[i].replace(/[^0-9.\-]/g, "")
					}
				}
				return {
					condition: this.s.condition,
					data: this.s.data,
					origData: this.s.origData,
					type: this.s.type,
					value: this.s.value.map(function (a) {
						return a !== null && a !== undefined ? a.toString() : a
					})
				}
			}
			/**
			 * Getter for the node for the container of the criteria
			 *
			 * @returns JQuery<HTMLElement> the node for the container
			 */
			Criteria.prototype.getNode = function () {
				return this.dom.container
			}
			/**
			 * Parses formatted numbers down to a form where they can be compared
			 *
			 * @param val the value to convert
			 * @returns the converted value
			 */
			Criteria.prototype.parseNumber = function (val) {
				var decimal = this.s.dt.i18n("decimal")
				// Remove any periods and then replace the decimal with a period
				if (decimal && decimal !== ".") {
					val = val.replace(/\./g, "").replace(decimal, ".")
				}
				return +val.replace(/(?!^-)[^0-9.]/g, "")
			}
			/**
			 * Populates the criteria data, condition and value(s) as far as has been selected
			 */
			Criteria.prototype.populate = function () {
				this._populateData()
				// If the column index has been found attempt to select a condition
				if (this.s.dataIdx !== -1) {
					this._populateCondition()
					// If the condittion has been found attempt to select the values
					if (this.s.condition !== undefined) {
						this._populateValue()
					}
				}
			}
			/**
			 * Rebuilds the criteria based upon the details passed in
			 *
			 * @param loadedCriteria the details required to rebuild the criteria
			 */
			Criteria.prototype.rebuild = function (loadedCriteria) {
				// Check to see if the previously selected data exists, if so select it
				var foundData = false
				var dataIdx, i
				this._populateData()
				// If a data selection has previously been made attempt to find and select it
				if (loadedCriteria.data !== undefined) {
					var italic_1 = this.classes.italic
					var data_1 = this.dom.data
					this.dom.data.children("option").each(function () {
						if (!foundData && ($$3(this).text() === loadedCriteria.data || (loadedCriteria.origData && $$3(this).prop("origData") === loadedCriteria.origData))) {
							$$3(this).prop("selected", true)
							data_1.removeClass(italic_1)
							foundData = true
							dataIdx = parseInt($$3(this).val(), 10)
						} else {
							$$3(this).removeProp("selected")
						}
					})
				}
				// If the data has been found and selected then the condition can be populated and searched
				if (foundData) {
					this.s.data = loadedCriteria.data
					this.s.origData = loadedCriteria.origData
					this.s.dataIdx = dataIdx
					this.c.orthogonal = this._getOptions().orthogonal
					this.dom.dataTitle.remove()
					this._populateCondition()
					this.dom.conditionTitle.remove()
					var condition = void 0
					// Check to see if the previously selected condition exists, if so select it
					var options = this.dom.condition.children("option")
					for (i = 0; i < options.length; i++) {
						var option = $$3(options[i])
						if (loadedCriteria.condition !== undefined && option.val() === loadedCriteria.condition && typeof loadedCriteria.condition === "string") {
							option.prop("selected", true)
							condition = option.val()
						} else {
							option.removeProp("selected")
						}
					}
					this.s.condition = condition
					// If the condition has been found and selected then the value can be populated and searched
					if (this.s.condition !== undefined) {
						this.dom.conditionTitle.removeProp("selected")
						this.dom.conditionTitle.remove()
						this.dom.condition.removeClass(this.classes.italic)
						for (i = 0; i < options.length; i++) {
							var opt = $$3(options[i])
							if (opt.val() !== this.s.condition) {
								opt.removeProp("selected")
							}
						}
						this._populateValue(loadedCriteria)
					} else {
						this.dom.conditionTitle.prependTo(this.dom.condition).prop("selected", true)
					}
				}
			}
			/**
			 * Sets the listeners for the criteria
			 */
			Criteria.prototype.setListeners = function () {
				var _this = this
				this.dom.data.unbind("change").on("change.dtsb", function () {
					_this.dom.dataTitle.removeProp("selected")
					// Need to go over every option to identify the correct selection
					var options = _this.dom.data.children("option." + _this.classes.option)
					for (var i = 0; i < options.length; i++) {
						var option = $$3(options[i])
						if (option.val() === _this.dom.data.val()) {
							_this.dom.data.removeClass(_this.classes.italic)
							option.prop("selected", true)
							_this.s.dataIdx = +option.val()
							_this.s.data = option.text()
							_this.s.origData = option.prop("origData")
							_this.c.orthogonal = _this._getOptions().orthogonal
							// When the data is changed, the values in condition and
							// value may also change so need to renew them
							_this._clearCondition()
							_this._clearValue()
							_this._populateCondition()
							// If this criteria was previously active in the search then
							// remove it from the search and trigger a new search
							if (_this.s.filled) {
								_this.s.filled = false
								_this.doSearch()
								_this.setListeners()
							}
							_this.s.dt.state.save()
						} else {
							option.removeProp("selected")
						}
					}
				})
				this.dom.condition.unbind("change").on("change.dtsb", function () {
					_this.dom.conditionTitle.removeProp("selected")
					// Need to go over every option to identify the correct selection
					var options = _this.dom.condition.children("option." + _this.classes.option)
					for (var i = 0; i < options.length; i++) {
						var option = $$3(options[i])
						if (option.val() === _this.dom.condition.val()) {
							_this.dom.condition.removeClass(_this.classes.italic)
							option.prop("selected", true)
							var condDisp = option.val()
							// Find the condition that has been selected and store it internally
							for (var _i = 0, _a = Object.keys(_this.s.conditions); _i < _a.length; _i++) {
								var cond = _a[_i]
								if (cond === condDisp) {
									_this.s.condition = condDisp
									break
								}
							}
							// When the condition is changed, the value selector may switch between
							// a select element and an input element
							_this._clearValue()
							_this._populateValue()
							for (var _b = 0, _c = _this.dom.value; _b < _c.length; _b++) {
								var val = _c[_b]
								// If this criteria was previously active in the search then remove
								// it from the search and trigger a new search
								if (_this.s.filled && val !== undefined && _this.dom.inputCont.has(val[0]).length !== 0) {
									_this.s.filled = false
									_this.doSearch()
									_this.setListeners()
								}
							}
							if (_this.dom.value.length === 0 || (_this.dom.value.length === 1 && _this.dom.value[0] === undefined)) {
								_this.doSearch()
							}
						} else {
							option.removeProp("selected")
						}
					}
				})
			}
			Criteria.prototype.setupButtons = function () {
				if (window.innerWidth > 550) {
					this.dom.container.removeClass(this.classes.vertical)
					this.dom.buttons.css("left", null)
					this.dom.buttons.css("top", null)
					return
				}
				this.dom.container.addClass(this.classes.vertical)
				this.dom.buttons.css("left", this.dom.data.innerWidth())
				this.dom.buttons.css("top", this.dom.data.position().top)
			}
			/**
			 * Builds the elements of the dom together
			 */
			Criteria.prototype._buildCriteria = function () {
				// Append Titles for select elements
				this.dom.data.append(this.dom.dataTitle)
				this.dom.condition.append(this.dom.conditionTitle)
				// Add elements to container
				this.dom.container.append(this.dom.data).append(this.dom.condition)
				this.dom.inputCont.empty()
				for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
					var val = _a[_i]
					val.append(this.dom.valueTitle)
					this.dom.inputCont.append(val)
				}
				// Add buttons to container
				this.dom.buttons.append(this.dom["delete"]).append(this.dom.right)
				this.dom.container.append(this.dom.inputCont).append(this.dom.buttons)
				this.setListeners()
			}
			/**
			 * Clears the condition select element
			 */
			Criteria.prototype._clearCondition = function () {
				this.dom.condition.empty()
				this.dom.conditionTitle.prop("selected", true).attr("disabled", "true")
				this.dom.condition.prepend(this.dom.conditionTitle).prop("selectedIndex", 0)
				this.s.conditions = {}
				this.s.condition = undefined
			}
			/**
			 * Clears the value elements
			 */
			Criteria.prototype._clearValue = function () {
				var val
				if (this.s.condition !== undefined) {
					if (this.dom.value.length > 0 && this.dom.value[0] !== undefined) {
						// Remove all of the value elements
						for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
							val = _a[_i]
							if (val !== undefined) {
								// Timeout is annoying but because of IOS
								setTimeout(function () {
									val.remove()
								}, 50)
							}
						}
					}
					// Call the init function to get the value elements for this condition
					this.dom.value = [].concat(this.s.conditions[this.s.condition].init(this, Criteria.updateListener))
					if (this.dom.value.length > 0 && this.dom.value[0] !== undefined) {
						this.dom.inputCont.empty().append(this.dom.value[0]).insertAfter(this.dom.condition)
						$$3(this.dom.value[0]).trigger("dtsb-inserted")
						// Insert all of the value elements
						for (var i = 1; i < this.dom.value.length; i++) {
							this.dom.inputCont.append(this.dom.value[i])
							$$3(this.dom.value[i]).trigger("dtsb-inserted")
						}
					}
				} else {
					// Remove all of the value elements
					for (var _b = 0, _c = this.dom.value; _b < _c.length; _b++) {
						val = _c[_b]
						if (val !== undefined) {
							// Timeout is annoying but because of IOS
							setTimeout(function () {
								val.remove()
							}, 50)
						}
					}
					// Append the default valueTitle to the default select element
					this.dom.valueTitle.prop("selected", true)
					this.dom.defaultValue.append(this.dom.valueTitle).insertAfter(this.dom.condition)
				}
				this.s.value = []
				this.dom.value = [$$3("<select disabled/>").addClass(this.classes.value).addClass(this.classes.dropDown).addClass(this.classes.italic).addClass(this.classes.select).append(this.dom.valueTitle.clone())]
			}
			/**
			 * Gets the options for the column
			 *
			 * @returns {object} The options for the column
			 */
			Criteria.prototype._getOptions = function () {
				var table = this.s.dt
				return $$3.extend(true, {}, Criteria.defaults, table.settings()[0].aoColumns[this.s.dataIdx].searchBuilder)
			}
			/**
			 * Populates the condition dropdown
			 */
			Criteria.prototype._populateCondition = function () {
				var conditionOpts = []
				var conditionsLength = Object.keys(this.s.conditions).length
				var dt = this.s.dt
				var colInits = dt.settings()[0].aoColumns
				var column = +this.dom.data.children("option:selected").val()
				var condition, condName
				// If there are no conditions stored then we need to get them from the appropriate type
				if (conditionsLength === 0) {
					this.s.type = dt.column(column).type()
					if (colInits !== undefined) {
						var colInit = colInits[column]
						if (colInit.searchBuilderType !== undefined && colInit.searchBuilderType !== null) {
							this.s.type = colInit.searchBuilderType
						} else if (this.s.type === undefined || this.s.type === null) {
							this.s.type = colInit.sType
						}
					}
					// If the column type is still unknown use the internal API to detect type
					if (this.s.type === null || this.s.type === undefined) {
						// This can only happen in DT1 - DT2 will do the invalidation of the type itself
						if ($$3.fn.dataTable.ext.oApi) {
							$$3.fn.dataTable.ext.oApi._fnColumnTypes(dt.settings()[0])
						}
						this.s.type = dt.column(column).type()
					}
					// Enable the condition element
					this.dom.condition.removeAttr("disabled").empty().append(this.dom.conditionTitle).addClass(this.classes.italic)
					this.dom.conditionTitle.prop("selected", true)
					var decimal = dt.settings()[0].oLanguage.sDecimal
					// This check is in place for if a custom decimal character is in place
					if (decimal !== "" && this.s.type && this.s.type.indexOf(decimal) === this.s.type.length - decimal.length) {
						if (this.s.type.includes("num-fmt")) {
							this.s.type = this.s.type.replace(decimal, "")
						} else if (this.s.type.includes("num")) {
							this.s.type = this.s.type.replace(decimal, "")
						}
					}
					// Select which conditions are going to be used based on the column type
					var conditionObj = void 0
					if (this.c.conditions[this.s.type] !== undefined) {
						conditionObj = this.c.conditions[this.s.type]
					} else if (this.s.type && this.s.type.includes("datetime-")) {
						// Date / time data types in DataTables are driven by Luxon or
						// Moment.js.
						conditionObj = DataTable.use("moment") ? this.c.conditions.moment : this.c.conditions.luxon
						this.s.dateFormat = this.s.type.replace(/datetime-/g, "")
					} else if (this.s.type && this.s.type.includes("moment")) {
						conditionObj = this.c.conditions.moment
						this.s.dateFormat = this.s.type.replace(/moment-/g, "")
					} else if (this.s.type && this.s.type.includes("luxon")) {
						conditionObj = this.c.conditions.luxon
						this.s.dateFormat = this.s.type.replace(/luxon-/g, "")
					} else {
						conditionObj = this.c.conditions.string
					}
					// Add all of the conditions to the select element
					for (var _i = 0, _a = Object.keys(conditionObj); _i < _a.length; _i++) {
						condition = _a[_i]
						if (conditionObj[condition] !== null) {
							// Serverside processing does not supply the options for the select elements
							// Instead input elements need to be used for these instead
							if (dt.page.info().serverSide && conditionObj[condition].init === Criteria.initSelect) {
								var col = colInits[column]
								if (this.s.serverData && this.s.serverData[col.data]) {
									conditionObj[condition].init = Criteria.initSelectSSP
									conditionObj[condition].inputValue = Criteria.inputValueSelect
									conditionObj[condition].isInputValid = Criteria.isInputValidSelect
								} else {
									conditionObj[condition].init = Criteria.initInput
									conditionObj[condition].inputValue = Criteria.inputValueInput
									conditionObj[condition].isInputValid = Criteria.isInputValidInput
								}
							}
							this.s.conditions[condition] = conditionObj[condition]
							condName = conditionObj[condition].conditionName
							if (typeof condName === "function") {
								condName = condName(dt, this.c.i18n)
							}
							conditionOpts.push(
								$$3("<option>", {
									text: condName,
									value: condition
								})
									.addClass(this.classes.option)
									.addClass(this.classes.notItalic)
							)
						}
					}
				}
				// Otherwise we can just load them in
				else if (conditionsLength > 0) {
					this.dom.condition.empty().removeAttr("disabled").addClass(this.classes.italic)
					for (var _b = 0, _c = Object.keys(this.s.conditions); _b < _c.length; _b++) {
						condition = _c[_b]
						var name_1 = this.s.conditions[condition].conditionName
						if (typeof name_1 === "function") {
							name_1 = name_1(dt, this.c.i18n)
						}
						var newOpt = $$3("<option>", {
							text: name_1,
							value: condition
						})
							.addClass(this.classes.option)
							.addClass(this.classes.notItalic)
						if (this.s.condition !== undefined && this.s.condition === name_1) {
							newOpt.prop("selected", true)
							this.dom.condition.removeClass(this.classes.italic)
						}
						conditionOpts.push(newOpt)
					}
				} else {
					this.dom.condition.attr("disabled", "true").addClass(this.classes.italic)
					return
				}
				for (var _d = 0, conditionOpts_1 = conditionOpts; _d < conditionOpts_1.length; _d++) {
					var opt = conditionOpts_1[_d]
					this.dom.condition.append(opt)
				}
				// Selecting a default condition if one is set
				if (colInits[column].searchBuilder && colInits[column].searchBuilder.defaultCondition) {
					var defaultCondition = colInits[column].searchBuilder.defaultCondition
					// If it is a number just use it as an index
					if (typeof defaultCondition === "number") {
						this.dom.condition.prop("selectedIndex", defaultCondition)
						this.dom.condition.trigger("change")
					}
					// If it is a string then things get slightly more tricly
					else if (typeof defaultCondition === "string") {
						// We need to check each condition option to see if any will match
						for (var i = 0; i < conditionOpts.length; i++) {
							// Need to check against the stored conditions so we can match the token "cond" to the option
							for (var _e = 0, _f = Object.keys(this.s.conditions); _e < _f.length; _e++) {
								var cond = _f[_e]
								condName = this.s.conditions[cond].conditionName
								if (
									// If the conditionName matches the text of the option
									(typeof condName === "string" ? condName : condName(dt, this.c.i18n)) === conditionOpts[i].text() &&
									// and the tokens match
									cond === defaultCondition
								) {
									// Select that option
									this.dom.condition.prop("selectedIndex", this.dom.condition.children().toArray().indexOf(conditionOpts[i][0])).removeClass(this.classes.italic)
									this.dom.condition.trigger("change")
									i = conditionOpts.length
									break
								}
							}
						}
					}
				}
				// If not default set then default to 0, the title
				else {
					this.dom.condition.prop("selectedIndex", 0)
				}
			}
			/**
			 * Populates the data / column select element
			 */
			Criteria.prototype._populateData = function () {
				var columns = this.s.dt.settings()[0].aoColumns
				var includeColumns = this.s.dt.columns(this.c.columns).indexes().toArray()
				this.dom.data.empty().append(this.dom.dataTitle)
				for (var index = 0; index < columns.length; index++) {
					// Need to check that the column can be filtered on before adding it
					if (this.c.columns === true || includeColumns.includes(index)) {
						var col = columns[index]
						var opt = {
							index: index,
							origData: col.data,
							text: (col.searchBuilderTitle || col.sTitle).replace(/(<([^>]+)>)/gi, "")
						}
						this.dom.data.append(
							$$3("<option>", {
								text: opt.text,
								value: opt.index
							})
								.addClass(this.classes.option)
								.addClass(this.classes.notItalic)
								.prop("origData", col.data)
								.prop("selected", this.s.dataIdx === opt.index ? true : false)
						)
						if (this.s.dataIdx === opt.index) {
							this.dom.dataTitle.removeProp("selected")
						}
					}
				}
			}
			/**
			 * Populates the Value select element
			 *
			 * @param loadedCriteria optional, used to reload criteria from predefined filters
			 */
			Criteria.prototype._populateValue = function (loadedCriteria) {
				var _this = this
				var prevFilled = this.s.filled
				var i
				this.s.filled = false
				// Remove any previous value elements
				// Timeout is annoying but because of IOS
				setTimeout(function () {
					_this.dom.defaultValue.remove()
				}, 50)
				var _loop_1 = function (val) {
					// Timeout is annoying but because of IOS
					setTimeout(function () {
						if (val !== undefined) {
							val.remove()
						}
					}, 50)
				}
				for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
					var val = _a[_i]
					_loop_1(val)
				}
				var children = this.dom.inputCont.children()
				if (children.length > 1) {
					for (i = 0; i < children.length; i++) {
						$$3(children[i]).remove()
					}
				}
				// Find the column with the title matching the data for the criteria and take note of the index
				if (loadedCriteria !== undefined) {
					this.s.dt.columns().every(function (index) {
						if (_this.s.dt.settings()[0].aoColumns[index].sTitle === loadedCriteria.data) {
							_this.s.dataIdx = index
						}
					})
				}
				// Initialise the value elements based on the condition
				this.dom.value = [].concat(this.s.conditions[this.s.condition].init(this, Criteria.updateListener, loadedCriteria !== undefined ? loadedCriteria.value : undefined))
				if (loadedCriteria !== undefined && loadedCriteria.value !== undefined) {
					this.s.value = loadedCriteria.value
				}
				this.dom.inputCont.empty()
				// Insert value elements and trigger the inserted event
				if (this.dom.value[0] !== undefined) {
					$$3(this.dom.value[0]).appendTo(this.dom.inputCont).trigger("dtsb-inserted")
				}
				for (i = 1; i < this.dom.value.length; i++) {
					$$3(this.dom.value[i])
						.insertAfter(this.dom.value[i - 1])
						.trigger("dtsb-inserted")
				}
				// Check if the criteria can be used in a search
				this.s.filled = this.s.conditions[this.s.condition].isInputValid(this.dom.value, this)
				this.setListeners()
				// If it can and this is different to before then trigger a draw
				if (!this.s.preventRedraw && prevFilled !== this.s.filled) {
					// If using SSP we want to restrict the amount of server calls that take place
					//  and this will already have taken place
					if (!this.s.dt.page.info().serverSide) {
						this.doSearch()
					}
					this.setListeners()
				}
			}
			/**
			 * Provides throttling capabilities to SearchBuilder without having to use dt's _fnThrottle function
			 * This is because that function is not quite suitable for our needs as it runs initially rather than waiting
			 *
			 * @param args arguments supplied to the throttle function
			 * @returns Function that is to be run that implements the throttling
			 */
			Criteria.prototype._throttle = function (fn, frequency) {
				if (frequency === void 0) {
					frequency = 200
				}
				var last = null
				var timer = null
				var that = this
				if (frequency === null) {
					frequency = 200
				}
				return function () {
					var args = []
					for (var _i = 0; _i < arguments.length; _i++) {
						args[_i] = arguments[_i]
					}
					var now = +new Date()
					if (last !== null && now < last + frequency) {
						clearTimeout(timer)
					} else {
						last = now
					}
					timer = setTimeout(function () {
						last = null
						fn.apply(that, args)
					}, frequency)
				}
			}
			Criteria.version = "1.1.0"
			Criteria.classes = {
				button: "dtsb-button",
				buttonContainer: "dtsb-buttonContainer",
				condition: "dtsb-condition",
				container: "dtsb-criteria",
				data: "dtsb-data",
				delete: "dtsb-delete",
				dropDown: "dtsb-dropDown",
				greyscale: "dtsb-greyscale",
				input: "dtsb-input",
				inputCont: "dtsb-inputCont",
				italic: "dtsb-italic",
				joiner: "dtsb-joiner",
				left: "dtsb-left",
				notItalic: "dtsb-notItalic",
				option: "dtsb-option",
				right: "dtsb-right",
				select: "dtsb-select",
				value: "dtsb-value",
				vertical: "dtsb-vertical"
			}
			/**
			 * Default initialisation function for select conditions
			 */
			Criteria.initSelect = function (that, fn, preDefined, array) {
				if (preDefined === void 0) {
					preDefined = null
				}
				if (array === void 0) {
					array = false
				}
				var column = that.dom.data.children("option:selected").val()
				var indexArray = that.s.dt.rows().indexes().toArray()
				var fastData = that.s.dt.settings()[0].fastData
				that.dom.valueTitle.prop("selected", true)
				// Declare select element to be used with all of the default classes and listeners.
				var el = $$3("<select/>")
					.addClass(Criteria.classes.value)
					.addClass(Criteria.classes.dropDown)
					.addClass(Criteria.classes.italic)
					.addClass(Criteria.classes.select)
					.append(that.dom.valueTitle)
					.on("change.dtsb", function () {
						$$3(this).removeClass(Criteria.classes.italic)
						fn(that, this)
					})
				if (that.c.greyscale) {
					el.addClass(Criteria.classes.greyscale)
				}
				var added = []
				var options = []
				// Add all of the options from the table to the select element.
				// Only add one option for each possible value
				for (var _i = 0, indexArray_1 = indexArray; _i < indexArray_1.length; _i++) {
					var index = indexArray_1[_i]
					var filter = fastData(index, column, typeof that.c.orthogonal === "string" ? that.c.orthogonal : that.c.orthogonal.search)
					var value = {
						filter:
							typeof filter === "string"
								? filter.replace(/[\r\n\u2028]/g, " ") // Need to replace certain characters to match search values
								: filter,
						index: index,
						text: fastData(index, column, typeof that.c.orthogonal === "string" ? that.c.orthogonal : that.c.orthogonal.display)
					}
					// If we are dealing with an array type, either make sure we are working with arrays, or sort them
					if (that.s.type === "array") {
						value.filter = !Array.isArray(value.filter) ? [value.filter] : value.filter
						value.text = !Array.isArray(value.text) ? [value.text] : value.text
					}
					// Function to add an option to the select element
					var addOption = function (filt, text) {
						if (that.s.type.includes("html") && filt !== null && typeof filt === "string") {
							filt.replace(/(<([^>]+)>)/gi, "")
						}
						// Add text and value, stripping out any html if that is the column type
						var opt = $$3("<option>", {
							type: Array.isArray(filt) ? "Array" : "String",
							value: filt
						})
							.data("sbv", filt)
							.addClass(that.classes.option)
							.addClass(that.classes.notItalic)
							// Have to add the text this way so that special html characters are not escaped - &amp; etc.
							.html(typeof text === "string" ? text.replace(/(<([^>]+)>)/gi, "") : text)
						var val = opt.val()
						// Check that this value has not already been added
						if (added.indexOf(val) === -1) {
							added.push(val)
							options.push(opt)
							if (preDefined !== null && Array.isArray(preDefined[0])) {
								preDefined[0] = preDefined[0].sort().join(",")
							}
							// If this value was previously selected as indicated by preDefined, then select it again
							if (preDefined !== null && opt.val() === preDefined[0]) {
								opt.prop("selected", true)
								el.removeClass(Criteria.classes.italic)
								that.dom.valueTitle.removeProp("selected")
							}
						}
					}
					// If this is to add the individual values within the array we need to loop over the array
					if (array) {
						for (var i = 0; i < value.filter.length; i++) {
							addOption(value.filter[i], value.text[i])
						}
					}
					// Otherwise the value that is in the cell is to be added
					else {
						addOption(value.filter, Array.isArray(value.text) ? value.text.join(", ") : value.text)
					}
				}
				options.sort(function (a, b) {
					if (that.s.type === "array" || that.s.type === "string" || that.s.type === "html") {
						if (a.val() < b.val()) {
							return -1
						} else if (a.val() > b.val()) {
							return 1
						} else {
							return 0
						}
					} else if (that.s.type === "num" || that.s.type === "html-num") {
						if (+a.val().replace(/(<([^>]+)>)/gi, "") < +b.val().replace(/(<([^>]+)>)/gi, "")) {
							return -1
						} else if (+a.val().replace(/(<([^>]+)>)/gi, "") > +b.val().replace(/(<([^>]+)>)/gi, "")) {
							return 1
						} else {
							return 0
						}
					} else if (that.s.type === "num-fmt" || that.s.type === "html-num-fmt") {
						if (+a.val().replace(/[^0-9.]/g, "") < +b.val().replace(/[^0-9.]/g, "")) {
							return -1
						} else if (+a.val().replace(/[^0-9.]/g, "") > +b.val().replace(/[^0-9.]/g, "")) {
							return 1
						} else {
							return 0
						}
					}
				})
				for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
					var opt = options_1[_a]
					el.append(opt)
				}
				return el
			}
			/**
			 * Default initialisation function for select conditions
			 */
			Criteria.initSelectSSP = function (that, fn, preDefined) {
				if (preDefined === void 0) {
					preDefined = null
				}
				that.dom.valueTitle.prop("selected", true)
				// Declare select element to be used with all of the default classes and listeners.
				var el = $$3("<select/>")
					.addClass(Criteria.classes.value)
					.addClass(Criteria.classes.dropDown)
					.addClass(Criteria.classes.italic)
					.addClass(Criteria.classes.select)
					.append(that.dom.valueTitle)
					.on("change.dtsb", function () {
						$$3(this).removeClass(Criteria.classes.italic)
						fn(that, this)
					})
				if (that.c.greyscale) {
					el.addClass(Criteria.classes.greyscale)
				}
				var options = []
				for (var _i = 0, _a = that.s.serverData[that.s.origData]; _i < _a.length; _i++) {
					var option = _a[_i]
					var value = option.value
					var label = option.label
					// Function to add an option to the select element
					var addOption = function (filt, text) {
						if (that.s.type.includes("html") && filt !== null && typeof filt === "string") {
							filt.replace(/(<([^>]+)>)/gi, "")
						}
						// Add text and value, stripping out any html if that is the column type
						var opt = $$3("<option>", {
							type: Array.isArray(filt) ? "Array" : "String",
							value: filt
						})
							.data("sbv", filt)
							.addClass(that.classes.option)
							.addClass(that.classes.notItalic)
							// Have to add the text this way so that special html characters are not escaped - &amp; etc.
							.html(typeof text === "string" ? text.replace(/(<([^>]+)>)/gi, "") : text)
						options.push(opt)
						// If this value was previously selected as indicated by preDefined, then select it again
						if (preDefined !== null && opt.val() === preDefined[0]) {
							opt.prop("selected", true)
							el.removeClass(Criteria.classes.italic)
							that.dom.valueTitle.removeProp("selected")
						}
					}
					addOption(value, label)
				}
				for (var _b = 0, options_2 = options; _b < options_2.length; _b++) {
					var opt = options_2[_b]
					el.append(opt)
				}
				return el
			}
			/**
			 * Default initialisation function for select array conditions
			 *
			 * This exists because there needs to be different select functionality for contains/without and equals/not
			 */
			Criteria.initSelectArray = function (that, fn, preDefined) {
				if (preDefined === void 0) {
					preDefined = null
				}
				return Criteria.initSelect(that, fn, preDefined, true)
			}
			/**
			 * Default initialisation function for input conditions
			 */
			Criteria.initInput = function (that, fn, preDefined) {
				if (preDefined === void 0) {
					preDefined = null
				}
				// Declare the input element
				var searchDelay = that.s.dt.settings()[0].searchDelay
				var el = $$3("<input/>")
					.addClass(Criteria.classes.value)
					.addClass(Criteria.classes.input)
					.on(
						"input.dtsb keypress.dtsb",
						that._throttle(
							function (e) {
								var code = e.keyCode || e.which
								return fn(that, this, code)
							},
							searchDelay === null ? 100 : searchDelay
						)
					)
				if (that.c.greyscale) {
					el.addClass(Criteria.classes.greyscale)
				}
				// If there is a preDefined value then add it
				if (preDefined !== null) {
					el.val(preDefined[0])
				}
				// This is add responsive functionality to the logic button without redrawing everything else
				that.s.dt.one("draw.dtsb", function () {
					that.s.topGroup.trigger("dtsb-redrawLogic")
				})
				return el
			}
			/**
			 * Default initialisation function for conditions requiring 2 inputs
			 */
			Criteria.init2Input = function (that, fn, preDefined) {
				if (preDefined === void 0) {
					preDefined = null
				}
				// Declare all of the necessary jQuery elements
				var searchDelay = that.s.dt.settings()[0].searchDelay
				var els = [
					$$3("<input/>")
						.addClass(Criteria.classes.value)
						.addClass(Criteria.classes.input)
						.on(
							"input.dtsb keypress.dtsb",
							that._throttle(
								function (e) {
									var code = e.keyCode || e.which
									return fn(that, this, code)
								},
								searchDelay === null ? 100 : searchDelay
							)
						),
					$$3("<span>").addClass(that.classes.joiner).html(that.s.dt.i18n("searchBuilder.valueJoiner", that.c.i18n.valueJoiner)),
					$$3("<input/>")
						.addClass(Criteria.classes.value)
						.addClass(Criteria.classes.input)
						.on(
							"input.dtsb keypress.dtsb",
							that._throttle(
								function (e) {
									var code = e.keyCode || e.which
									return fn(that, this, code)
								},
								searchDelay === null ? 100 : searchDelay
							)
						)
				]
				if (that.c.greyscale) {
					els[0].addClass(Criteria.classes.greyscale)
					els[2].addClass(Criteria.classes.greyscale)
				}
				// If there is a preDefined value then add it
				if (preDefined !== null) {
					els[0].val(preDefined[0])
					els[2].val(preDefined[1])
				}
				// This is add responsive functionality to the logic button without redrawing everything else
				that.s.dt.one("draw.dtsb", function () {
					that.s.topGroup.trigger("dtsb-redrawLogic")
				})
				return els
			}
			/**
			 * Default initialisation function for date conditions
			 */
			Criteria.initDate = function (that, fn, preDefined) {
				if (preDefined === void 0) {
					preDefined = null
				}
				var searchDelay = that.s.dt.settings()[0].searchDelay
				var i18n = that.s.dt.i18n("datetime", {})
				// Declare date element using DataTables dateTime plugin
				var el = $$3("<input/>")
					.addClass(Criteria.classes.value)
					.addClass(Criteria.classes.input)
					.dtDateTime({
						attachTo: "input",
						format: that.s.dateFormat ? that.s.dateFormat : undefined,
						i18n: i18n
					})
					.on(
						"change.dtsb",
						that._throttle(
							function () {
								return fn(that, this)
							},
							searchDelay === null ? 100 : searchDelay
						)
					)
					.on("input.dtsb keypress.dtsb", function (e) {
						that._throttle(
							function () {
								var code = e.keyCode || e.which
								return fn(that, this, code)
							},
							searchDelay === null ? 100 : searchDelay
						)
					})
				if (that.c.greyscale) {
					el.addClass(Criteria.classes.greyscale)
				}
				// If there is a preDefined value then add it
				if (preDefined !== null) {
					el.val(preDefined[0])
				}
				// This is add responsive functionality to the logic button without redrawing everything else
				that.s.dt.one("draw.dtsb", function () {
					that.s.topGroup.trigger("dtsb-redrawLogic")
				})
				return el
			}
			Criteria.initNoValue = function (that) {
				// This is add responsive functionality to the logic button without redrawing everything else
				that.s.dt.one("draw.dtsb", function () {
					that.s.topGroup.trigger("dtsb-redrawLogic")
				})
				return []
			}
			Criteria.init2Date = function (that, fn, preDefined) {
				var _this = this
				if (preDefined === void 0) {
					preDefined = null
				}
				var searchDelay = that.s.dt.settings()[0].searchDelay
				var i18n = that.s.dt.i18n("datetime", {})
				// Declare all of the date elements that are required using DataTables dateTime plugin
				var els = [
					$$3("<input/>")
						.addClass(Criteria.classes.value)
						.addClass(Criteria.classes.input)
						.dtDateTime({
							attachTo: "input",
							format: that.s.dateFormat ? that.s.dateFormat : undefined,
							i18n: i18n
						})
						.on(
							"change.dtsb",
							searchDelay !== null
								? DataTable.util.throttle(function () {
										return fn(that, this)
								  }, searchDelay)
								: function () {
										fn(that, _this)
								  }
						)
						.on("input.dtsb keypress.dtsb", function (e) {
							DataTable.util.throttle(
								function () {
									var code = e.keyCode || e.which
									return fn(that, this, code)
								},
								searchDelay === null ? 0 : searchDelay
							)
						}),
					$$3("<span>").addClass(that.classes.joiner).html(that.s.dt.i18n("searchBuilder.valueJoiner", that.c.i18n.valueJoiner)),
					$$3("<input/>")
						.addClass(Criteria.classes.value)
						.addClass(Criteria.classes.input)
						.dtDateTime({
							attachTo: "input",
							format: that.s.dateFormat ? that.s.dateFormat : undefined,
							i18n: i18n
						})
						.on(
							"change.dtsb",
							searchDelay !== null
								? DataTable.util.throttle(function () {
										return fn(that, this)
								  }, searchDelay)
								: function () {
										fn(that, _this)
								  }
						)
						.on(
							"input.dtsb keypress.dtsb",
							!that.c.enterSearch && !(that.s.dt.settings()[0].oInit.search !== undefined && that.s.dt.settings()[0].oInit.search["return"]) && searchDelay !== null
								? DataTable.util.throttle(function () {
										return fn(that, this)
								  }, searchDelay)
								: function (e) {
										var code = e.keyCode || e.which
										fn(that, _this, code)
								  }
						)
				]
				if (that.c.greyscale) {
					els[0].addClass(Criteria.classes.greyscale)
					els[2].addClass(Criteria.classes.greyscale)
				}
				// If there are and preDefined values then add them
				if (preDefined !== null && preDefined.length > 0) {
					els[0].val(preDefined[0])
					els[2].val(preDefined[1])
				}
				// This is add responsive functionality to the logic button without redrawing everything else
				that.s.dt.one("draw.dtsb", function () {
					that.s.topGroup.trigger("dtsb-redrawLogic")
				})
				return els
			}
			/**
			 * Default function for select elements to validate condition
			 */
			Criteria.isInputValidSelect = function (el) {
				var allFilled = true
				// Check each element to make sure that the selections are valid
				for (var _i = 0, el_1 = el; _i < el_1.length; _i++) {
					var element = el_1[_i]
					if (
						element.children("option:selected").length === element.children("option").length - element.children("option." + Criteria.classes.notItalic).length &&
						element.children("option:selected").length === 1 &&
						element.children("option:selected")[0] === element.children("option")[0]
					) {
						allFilled = false
					}
				}
				return allFilled
			}
			/**
			 * Default function for input and date elements to validate condition
			 */
			Criteria.isInputValidInput = function (el) {
				var allFilled = true
				// Check each element to make sure that the inputs are valid
				for (var _i = 0, el_2 = el; _i < el_2.length; _i++) {
					var element = el_2[_i]
					if (element.is("input") && element.val().length === 0) {
						allFilled = false
					}
				}
				return allFilled
			}
			/**
			 * Default function for getting select conditions
			 */
			Criteria.inputValueSelect = function (el) {
				var values = []
				// Go through the select elements and push each selected option to the return array
				for (var _i = 0, el_3 = el; _i < el_3.length; _i++) {
					var element = el_3[_i]
					if (element.is("select")) {
						values.push(Criteria._escapeHTML(element.children("option:selected").data("sbv")))
					}
				}
				return values
			}
			/**
			 * Default function for getting input conditions
			 */
			Criteria.inputValueInput = function (el) {
				var values = []
				// Go through the input elements and push each value to the return array
				for (var _i = 0, el_4 = el; _i < el_4.length; _i++) {
					var element = el_4[_i]
					if (element.is("input")) {
						values.push(Criteria._escapeHTML(element.val()))
					}
				}
				return values
			}
			/**
			 * Function that is run on each element as a call back when a search should be triggered
			 */
			Criteria.updateListener = function (that, el, code) {
				// When the value is changed the criteria is now complete so can be included in searches
				// Get the condition from the map based on the key that has been selected for the condition
				var condition = that.s.conditions[that.s.condition]
				var i
				that.s.filled = condition.isInputValid(that.dom.value, that)
				that.s.value = condition.inputValue(that.dom.value, that)
				if (!that.s.filled) {
					if ((!that.c.enterSearch && !(that.s.dt.settings()[0].oInit.search !== undefined && that.s.dt.settings()[0].oInit.search["return"])) || code === 13) {
						that.doSearch()
					}
					return
				}
				if (!Array.isArray(that.s.value)) {
					that.s.value = [that.s.value]
				}
				for (i = 0; i < that.s.value.length; i++) {
					// If the value is an array we need to sort it
					if (Array.isArray(that.s.value[i])) {
						that.s.value[i].sort()
					}
				}
				// Take note of the cursor position so that we can refocus there later
				var idx = null
				var cursorPos = null
				for (i = 0; i < that.dom.value.length; i++) {
					if (el === that.dom.value[i][0]) {
						idx = i
						if (el.selectionStart !== undefined) {
							cursorPos = el.selectionStart
						}
					}
				}
				if ((!that.c.enterSearch && !(that.s.dt.settings()[0].oInit.search !== undefined && that.s.dt.settings()[0].oInit.search["return"])) || code === 13) {
					// Trigger a search
					that.doSearch()
				}
				// Refocus the element and set the correct cursor position
				if (idx !== null) {
					that.dom.value[idx].removeClass(that.classes.italic)
					that.dom.value[idx].focus()
					if (cursorPos !== null) {
						that.dom.value[idx][0].setSelectionRange(cursorPos, cursorPos)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.dateConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.equals", i18n.conditions.date.equals)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						return value === comparison[0]
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.not", i18n.conditions.date.not)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						return value !== comparison[0]
					}
				},
				"<": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.before", i18n.conditions.date.before)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						return value < comparison[0]
					}
				},
				">": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.after", i18n.conditions.date.after)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						return value > comparison[0]
					}
				},
				between: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.between", i18n.conditions.date.between)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						if (comparison[0] < comparison[1]) {
							return comparison[0] <= value && value <= comparison[1]
						} else {
							return comparison[1] <= value && value <= comparison[0]
						}
					}
				},
				"!between": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notBetween", i18n.conditions.date.notBetween)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						value = value.replace(/(\/|-|,)/g, "-")
						if (comparison[0] < comparison[1]) {
							return !(comparison[0] <= value && value <= comparison[1])
						} else {
							return !(comparison[1] <= value && value <= comparison[0])
						}
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.empty", i18n.conditions.date.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notEmpty", i18n.conditions.date.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.momentDateConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.equals", i18n.conditions.date.equals)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return moment()(value, that.s.dateFormat).valueOf() === moment()(comparison[0], that.s.dateFormat).valueOf()
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.not", i18n.conditions.date.not)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return moment()(value, that.s.dateFormat).valueOf() !== moment()(comparison[0], that.s.dateFormat).valueOf()
					}
				},
				"<": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.before", i18n.conditions.date.before)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return moment()(value, that.s.dateFormat).valueOf() < moment()(comparison[0], that.s.dateFormat).valueOf()
					}
				},
				">": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.after", i18n.conditions.date.after)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return moment()(value, that.s.dateFormat).valueOf() > moment()(comparison[0], that.s.dateFormat).valueOf()
					}
				},
				between: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.between", i18n.conditions.date.between)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						var val = moment()(value, that.s.dateFormat).valueOf()
						var comp0 = moment()(comparison[0], that.s.dateFormat).valueOf()
						var comp1 = moment()(comparison[1], that.s.dateFormat).valueOf()
						if (comp0 < comp1) {
							return comp0 <= val && val <= comp1
						} else {
							return comp1 <= val && val <= comp0
						}
					}
				},
				"!between": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notBetween", i18n.conditions.date.notBetween)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						var val = moment()(value, that.s.dateFormat).valueOf()
						var comp0 = moment()(comparison[0], that.s.dateFormat).valueOf()
						var comp1 = moment()(comparison[1], that.s.dateFormat).valueOf()
						if (comp0 < comp1) {
							return !(+comp0 <= +val && +val <= +comp1)
						} else {
							return !(+comp1 <= +val && +val <= +comp0)
						}
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.empty", i18n.conditions.date.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notEmpty", i18n.conditions.date.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.luxonDateConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.equals", i18n.conditions.date.equals)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts === luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.not", i18n.conditions.date.not)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts !== luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
					}
				},
				"<": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.before", i18n.conditions.date.before)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts < luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
					}
				},
				">": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.after", i18n.conditions.date.after)
					},
					init: Criteria.initDate,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts > luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
					}
				},
				between: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.between", i18n.conditions.date.between)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						var val = luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
						var comp0 = luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
						var comp1 = luxon().DateTime.fromFormat(comparison[1], that.s.dateFormat).ts
						if (comp0 < comp1) {
							return comp0 <= val && val <= comp1
						} else {
							return comp1 <= val && val <= comp0
						}
					}
				},
				"!between": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notBetween", i18n.conditions.date.notBetween)
					},
					init: Criteria.init2Date,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, that) {
						var val = luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
						var comp0 = luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts
						var comp1 = luxon().DateTime.fromFormat(comparison[1], that.s.dateFormat).ts
						if (comp0 < comp1) {
							return !(+comp0 <= +val && +val <= +comp1)
						} else {
							return !(+comp1 <= +val && +val <= +comp0)
						}
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.empty", i18n.conditions.date.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.date.notEmpty", i18n.conditions.date.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.numConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.equals", i18n.conditions.number.equals)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						return +value === +comparison[0]
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.not", i18n.conditions.number.not)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						return +value !== +comparison[0]
					}
				},
				"<": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.lt", i18n.conditions.number.lt)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return +value < +comparison[0]
					}
				},
				"<=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.lte", i18n.conditions.number.lte)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return +value <= +comparison[0]
					}
				},
				">=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.gte", i18n.conditions.number.gte)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return +value >= +comparison[0]
					}
				},
				">": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.gt", i18n.conditions.number.gt)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return +value > +comparison[0]
					}
				},
				between: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.between", i18n.conditions.number.between)
					},
					init: Criteria.init2Input,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						if (+comparison[0] < +comparison[1]) {
							return +comparison[0] <= +value && +value <= +comparison[1]
						} else {
							return +comparison[1] <= +value && +value <= +comparison[0]
						}
					}
				},
				"!between": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.notBetween", i18n.conditions.number.notBetween)
					},
					init: Criteria.init2Input,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						if (+comparison[0] < +comparison[1]) {
							return !(+comparison[0] <= +value && +value <= +comparison[1])
						} else {
							return !(+comparison[1] <= +value && +value <= +comparison[0])
						}
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.empty", i18n.conditions.number.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.notEmpty", i18n.conditions.number.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.numFmtConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.equals", i18n.conditions.number.equals)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) === criteria.parseNumber(comparison[0])
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.not", i18n.conditions.number.not)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) !== criteria.parseNumber(comparison[0])
					}
				},
				"<": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.lt", i18n.conditions.number.lt)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) < criteria.parseNumber(comparison[0])
					}
				},
				"<=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.lte", i18n.conditions.number.lte)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) <= criteria.parseNumber(comparison[0])
					}
				},
				">=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.gte", i18n.conditions.number.gte)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) >= criteria.parseNumber(comparison[0])
					}
				},
				">": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.gt", i18n.conditions.number.gt)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						return criteria.parseNumber(value) > criteria.parseNumber(comparison[0])
					}
				},
				between: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.between", i18n.conditions.number.between)
					},
					init: Criteria.init2Input,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						var val = criteria.parseNumber(value)
						var comp0 = criteria.parseNumber(comparison[0])
						var comp1 = criteria.parseNumber(comparison[1])
						if (+comp0 < +comp1) {
							return +comp0 <= +val && +val <= +comp1
						} else {
							return +comp1 <= +val && +val <= +comp0
						}
					}
				},
				"!between": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.notBetween", i18n.conditions.number.notBetween)
					},
					init: Criteria.init2Input,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison, criteria) {
						var val = criteria.parseNumber(value)
						var comp0 = criteria.parseNumber(comparison[0])
						var comp1 = criteria.parseNumber(comparison[1])
						if (+comp0 < +comp1) {
							return !(+comp0 <= +val && +val <= +comp1)
						} else {
							return !(+comp1 <= +val && +val <= +comp0)
						}
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.empty", i18n.conditions.number.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.number.notEmpty", i18n.conditions.number.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Has to be in this order so that they are displayed correctly in select elements
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.stringConditions = {
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.equals", i18n.conditions.string.equals)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						return value === comparison[0]
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.not", i18n.conditions.string.not)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return value !== comparison[0]
					}
				},
				starts: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.startsWith", i18n.conditions.string.startsWith)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return value.toLowerCase().indexOf(comparison[0].toLowerCase()) === 0
					}
				},
				"!starts": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.notStartsWith", i18n.conditions.string.notStartsWith)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return value.toLowerCase().indexOf(comparison[0].toLowerCase()) !== 0
					}
				},
				contains: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.contains", i18n.conditions.string.contains)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return value.toLowerCase().includes(comparison[0].toLowerCase())
					}
				},
				"!contains": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.notContains", i18n.conditions.string.notContains)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return !value.toLowerCase().includes(comparison[0].toLowerCase())
					}
				},
				ends: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.endsWith", i18n.conditions.string.endsWith)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return value.toLowerCase().endsWith(comparison[0].toLowerCase())
					}
				},
				"!ends": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.notEndsWith", i18n.conditions.string.notEndsWith)
					},
					init: Criteria.initInput,
					inputValue: Criteria.inputValueInput,
					isInputValid: Criteria.isInputValidInput,
					search: function (value, comparison) {
						return !value.toLowerCase().endsWith(comparison[0].toLowerCase())
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.empty", i18n.conditions.string.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.string.notEmpty", i18n.conditions.string.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return !(value === null || value === undefined || value.length === 0)
					}
				}
			}
			// The order of the conditions will make eslint sad :(
			// Also have to disable member ordering for this as the private methods used are not yet declared otherwise
			Criteria.arrayConditions = {
				contains: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.contains", i18n.conditions.array.contains)
					},
					init: Criteria.initSelectArray,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						return value.includes(comparison[0])
					}
				},
				without: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.without", i18n.conditions.array.without)
					},
					init: Criteria.initSelectArray,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						return value.indexOf(comparison[0]) === -1
					}
				},
				"=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.equals", i18n.conditions.array.equals)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						if (value.length === comparison[0].length) {
							for (var i = 0; i < value.length; i++) {
								if (value[i] !== comparison[0][i]) {
									return false
								}
							}
							return true
						}
						return false
					}
				},
				"!=": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.not", i18n.conditions.array.not)
					},
					init: Criteria.initSelect,
					inputValue: Criteria.inputValueSelect,
					isInputValid: Criteria.isInputValidSelect,
					search: function (value, comparison) {
						if (value.length === comparison[0].length) {
							for (var i = 0; i < value.length; i++) {
								if (value[i] !== comparison[0][i]) {
									return true
								}
							}
							return false
						}
						return true
					}
				},
				null: {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.empty", i18n.conditions.array.empty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value === null || value === undefined || value.length === 0
					}
				},
				"!null": {
					conditionName: function (dt, i18n) {
						return dt.i18n("searchBuilder.conditions.array.notEmpty", i18n.conditions.array.notEmpty)
					},
					init: Criteria.initNoValue,
					inputValue: function () {
						return
					},
					isInputValid: function () {
						return true
					},
					search: function (value) {
						return value !== null && value !== undefined && value.length !== 0
					}
				}
			}
			// eslint will be sad because we have to disable member ordering for this as the
			// private static properties used are not yet declared otherwise
			Criteria.defaults = {
				columns: true,
				conditions: {
					array: Criteria.arrayConditions,
					date: Criteria.dateConditions,
					html: Criteria.stringConditions,
					"html-num": Criteria.numConditions,
					"html-num-fmt": Criteria.numFmtConditions,
					luxon: Criteria.luxonDateConditions,
					moment: Criteria.momentDateConditions,
					num: Criteria.numConditions,
					"num-fmt": Criteria.numFmtConditions,
					string: Criteria.stringConditions
				},
				depthLimit: false,
				enterSearch: false,
				filterChanged: undefined,
				greyscale: false,
				i18n: {
					add: "Add Condition",
					button: {
						0: "Search Builder",
						_: "Search Builder (%d)"
					},
					clearAll: "Clear All",
					condition: "Condition",
					data: "Data",
					delete: "&times",
					deleteTitle: "Delete filtering rule",
					left: "<",
					leftTitle: "Outdent criteria",
					logicAnd: "And",
					logicOr: "Or",
					right: ">",
					rightTitle: "Indent criteria",
					search: "Search",
					title: {
						0: "Custom Search Builder",
						_: "Custom Search Builder (%d)"
					},
					value: "Value",
					valueJoiner: "and"
				},
				liveSearch: true,
				logic: "AND",
				orthogonal: {
					display: "display",
					search: "filter"
				},
				preDefined: false
			}
			return Criteria
		})()

		var $$2
		/**
		 * Sets the value of jQuery for use in the file
		 *
		 * @param jq the instance of jQuery to be set
		 */
		function setJQuery$1(jq) {
			$$2 = jq
			jq.fn.dataTable
		}
		/**
		 * The Group class is used within SearchBuilder to represent a group of criteria
		 */
		var Group = /** @class */ (function () {
			function Group(table, opts, topGroup, index, isChild, depth, serverData) {
				if (index === void 0) {
					index = 0
				}
				if (isChild === void 0) {
					isChild = false
				}
				if (depth === void 0) {
					depth = 1
				}
				if (serverData === void 0) {
					serverData = undefined
				}
				this.classes = $$2.extend(true, {}, Group.classes)
				// Get options from user
				this.c = $$2.extend(true, {}, Group.defaults, opts)
				this.s = {
					criteria: [],
					depth: depth,
					dt: table,
					index: index,
					isChild: isChild,
					logic: undefined,
					opts: opts,
					preventRedraw: false,
					serverData: serverData,
					toDrop: undefined,
					topGroup: topGroup
				}
				this.dom = {
					add: $$2("<button/>").addClass(this.classes.add).addClass(this.classes.button).attr("type", "button"),
					clear: $$2("<button>&times</button>").addClass(this.classes.button).addClass(this.classes.clearGroup).attr("type", "button"),
					container: $$2("<div/>").addClass(this.classes.group),
					logic: $$2("<button><div/></button>").addClass(this.classes.logic).addClass(this.classes.button).attr("type", "button"),
					logicContainer: $$2("<div/>").addClass(this.classes.logicContainer),
					search: $$2("<button/>").addClass(this.classes.search).addClass(this.classes.button).attr("type", "button").css("display", "none")
				}
				// A reference to the top level group is maintained throughout any subgroups and criteria that may be created
				if (this.s.topGroup === undefined) {
					this.s.topGroup = this.dom.container
				}
				this._setup()
				return this
			}
			/**
			 * Destroys the groups buttons, clears the internal criteria and removes it from the dom
			 */
			Group.prototype.destroy = function () {
				// Turn off listeners
				this.dom.add.off(".dtsb")
				this.dom.logic.off(".dtsb")
				this.dom.search.off(".dtsb")
				// Trigger event for groups at a higher level to pick up on
				this.dom.container.trigger("dtsb-destroy").remove()
				this.s.criteria = []
			}
			/**
			 * Gets the details required to rebuild the group
			 */
			// Eslint upset at empty object but needs to be done
			Group.prototype.getDetails = function (deFormatDates) {
				if (deFormatDates === void 0) {
					deFormatDates = false
				}
				if (this.s.criteria.length === 0) {
					return {}
				}
				var details = {
					criteria: [],
					logic: this.s.logic
				}
				// NOTE here crit could be either a subgroup or a criteria
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					details.criteria.push(crit.criteria.getDetails(deFormatDates))
				}
				return details
			}
			/**
			 * Getter for the node for the container of the group
			 *
			 * @returns Node for the container of the group
			 */
			Group.prototype.getNode = function () {
				return this.dom.container
			}
			/**
			 * Rebuilds the group based upon the details passed in
			 *
			 * @param loadedDetails the details required to rebuild the group
			 */
			Group.prototype.rebuild = function (loadedDetails) {
				var crit
				// If no criteria are stored then just return
				if (loadedDetails.criteria === undefined || loadedDetails.criteria === null || (Array.isArray(loadedDetails.criteria) && loadedDetails.criteria.length === 0)) {
					return
				}
				this.s.logic = loadedDetails.logic
				this.dom.logic
					.children()
					.first()
					.html(this.s.logic === "OR" ? this.s.dt.i18n("searchBuilder.logicOr", this.c.i18n.logicOr) : this.s.dt.i18n("searchBuilder.logicAnd", this.c.i18n.logicAnd))
				// Add all of the criteria, be it a sub group or a criteria
				if (Array.isArray(loadedDetails.criteria)) {
					for (var _i = 0, _a = loadedDetails.criteria; _i < _a.length; _i++) {
						crit = _a[_i]
						if (crit.logic !== undefined) {
							this._addPrevGroup(crit)
						} else if (crit.logic === undefined) {
							this._addPrevCriteria(crit)
						}
					}
				}
				// For all of the criteria children, update the arrows incase they require changing and set the listeners
				for (var _b = 0, _c = this.s.criteria; _b < _c.length; _b++) {
					crit = _c[_b]
					if (crit.criteria instanceof Criteria) {
						crit.criteria.updateArrows(this.s.criteria.length > 1)
						this._setCriteriaListeners(crit.criteria)
					}
				}
			}
			/**
			 * Redraws the Contents of the searchBuilder Groups and Criteria
			 */
			Group.prototype.redrawContents = function () {
				if (this.s.preventRedraw) {
					return
				}
				// Clear the container out and add the basic elements
				this.dom.container.children().detach()
				this.dom.container.append(this.dom.logicContainer).append(this.dom.add)
				if (!this.c.liveSearch) {
					this.dom.container.append(this.dom.search)
				}
				// Sort the criteria by index so that they appear in the correct order
				this.s.criteria.sort(function (a, b) {
					if (a.criteria.s.index < b.criteria.s.index) {
						return -1
					} else if (a.criteria.s.index > b.criteria.s.index) {
						return 1
					}
					return 0
				})
				this.setListeners()
				for (var i = 0; i < this.s.criteria.length; i++) {
					var crit = this.s.criteria[i].criteria
					if (crit instanceof Criteria) {
						// Reset the index to the new value
						this.s.criteria[i].index = i
						this.s.criteria[i].criteria.s.index = i
						// Add to the group
						this.s.criteria[i].criteria.dom.container.insertBefore(this.dom.add)
						// Set listeners for various points
						this._setCriteriaListeners(crit)
						this.s.criteria[i].criteria.s.preventRedraw = this.s.preventRedraw
						this.s.criteria[i].criteria.rebuild(this.s.criteria[i].criteria.getDetails())
						this.s.criteria[i].criteria.s.preventRedraw = false
					} else if (crit instanceof Group && crit.s.criteria.length > 0) {
						// Reset the index to the new value
						this.s.criteria[i].index = i
						this.s.criteria[i].criteria.s.index = i
						// Add the sub group to the group
						this.s.criteria[i].criteria.dom.container.insertBefore(this.dom.add)
						// Redraw the contents of the group
						crit.s.preventRedraw = this.s.preventRedraw
						crit.redrawContents()
						crit.s.preventRedraw = false
						this._setGroupListeners(crit)
					} else {
						// The group is empty so remove it
						this.s.criteria.splice(i, 1)
						i--
					}
				}
				this.setupLogic()
			}
			/**
			 * Resizes the logic button only rather than the entire dom.
			 */
			Group.prototype.redrawLogic = function () {
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					if (crit.criteria instanceof Group) {
						crit.criteria.redrawLogic()
					}
				}
				this.setupLogic()
			}
			/**
			 * Search method, checking the row data against the criteria in the group
			 *
			 * @param rowData The row data to be compared
			 * @returns boolean The result of the search
			 */
			Group.prototype.search = function (rowData, rowIdx) {
				if (this.s.logic === "AND") {
					return this._andSearch(rowData, rowIdx)
				} else if (this.s.logic === "OR") {
					return this._orSearch(rowData, rowIdx)
				}
				return true
			}
			/**
			 * Locates the groups logic button to the correct location on the page
			 */
			Group.prototype.setupLogic = function () {
				// Remove logic button
				this.dom.logicContainer.remove()
				this.dom.clear.remove()
				// If there are no criteria in the group then keep the logic removed and return
				if (this.s.criteria.length < 1) {
					if (!this.s.isChild) {
						this.dom.container.trigger("dtsb-destroy")
						// Set criteria left margin
						this.dom.container.css("margin-left", 0)
					}
					this.dom.search.css("display", "none")
					return
				}
				this.dom.clear.height("0px")
				this.dom.logicContainer.append(this.dom.clear)
				if (!this.s.isChild) {
					this.dom.search.css("display", "inline-block")
				}
				// Prepend logic button
				this.dom.container.prepend(this.dom.logicContainer)
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					if (crit.criteria instanceof Criteria) {
						crit.criteria.setupButtons()
					}
				}
				// Set width, take 2 for the border
				var height = this.dom.container.outerHeight() - 1
				this.dom.logicContainer.width(height)
				this._setLogicListener()
				// Set criteria left margin
				this.dom.container.css("margin-left", this.dom.logicContainer.outerHeight(true))
				var logicOffset = this.dom.logicContainer.offset()
				// Set horizontal alignment
				var currentLeft = logicOffset.left
				var groupLeft = this.dom.container.offset().left
				var shuffleLeft = currentLeft - groupLeft
				var newPos = currentLeft - shuffleLeft - this.dom.logicContainer.outerHeight(true)
				this.dom.logicContainer.offset({ left: newPos })
				// Set vertical alignment
				var firstCrit = this.dom.logicContainer.next()
				var currentTop = logicOffset.top
				var firstTop = $$2(firstCrit).offset().top
				var shuffleTop = currentTop - firstTop
				var newTop = currentTop - shuffleTop
				this.dom.logicContainer.offset({ top: newTop })
				this.dom.clear.outerHeight(this.dom.logicContainer.height())
				this._setClearListener()
			}
			/**
			 * Sets listeners on the groups elements
			 */
			Group.prototype.setListeners = function () {
				var _this = this
				this.dom.add.unbind("click")
				this.dom.add.on("click.dtsb", function () {
					// If this is the parent group then the logic button has not been added yet
					if (!_this.s.isChild) {
						_this.dom.container.prepend(_this.dom.logicContainer)
					}
					_this.addCriteria()
					_this.dom.container.trigger("dtsb-add")
					_this.s.dt.state.save()
					return false
				})
				this.dom.search.off("click.dtsb").on("click.dtsb", function () {
					_this.s.dt.draw()
				})
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					crit.criteria.setListeners()
				}
				this._setClearListener()
				this._setLogicListener()
			}
			/**
			 * Adds a criteria to the group
			 *
			 * @param crit Instance of Criteria to be added to the group
			 */
			Group.prototype.addCriteria = function (crit) {
				if (crit === void 0) {
					crit = null
				}
				var index = crit === null ? this.s.criteria.length : crit.s.index
				var criteria = new Criteria(this.s.dt, this.s.opts, this.s.topGroup, index, this.s.depth, this.s.serverData, this.c.liveSearch)
				// If a Criteria has been passed in then set the values to continue that
				if (crit !== null) {
					criteria.c = crit.c
					criteria.s = crit.s
					criteria.s.depth = this.s.depth
					criteria.classes = crit.classes
				}
				criteria.populate()
				var inserted = false
				for (var i = 0; i < this.s.criteria.length; i++) {
					if (i === 0 && this.s.criteria[i].criteria.s.index > criteria.s.index) {
						// Add the node for the criteria at the start of the group
						criteria.getNode().insertBefore(this.s.criteria[i].criteria.dom.container)
						inserted = true
					} else if (i < this.s.criteria.length - 1 && this.s.criteria[i].criteria.s.index < criteria.s.index && this.s.criteria[i + 1].criteria.s.index > criteria.s.index) {
						// Add the node for the criteria in the correct location
						criteria.getNode().insertAfter(this.s.criteria[i].criteria.dom.container)
						inserted = true
					}
				}
				if (!inserted) {
					criteria.getNode().insertBefore(this.dom.add)
				}
				// Add the details for this criteria to the array
				this.s.criteria.push({
					criteria: criteria,
					index: index
				})
				this.s.criteria = this.s.criteria.sort(function (a, b) {
					return a.criteria.s.index - b.criteria.s.index
				})
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var opt = _a[_i]
					if (opt.criteria instanceof Criteria) {
						opt.criteria.updateArrows(this.s.criteria.length > 1)
					}
				}
				this._setCriteriaListeners(criteria)
				criteria.setListeners()
				this.setupLogic()
			}
			/**
			 * Checks the group to see if it has any filled criteria
			 */
			Group.prototype.checkFilled = function () {
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					if ((crit.criteria instanceof Criteria && crit.criteria.s.filled) || (crit.criteria instanceof Group && crit.criteria.checkFilled())) {
						return true
					}
				}
				return false
			}
			/**
			 * Gets the count for the number of criteria in this group and any sub groups
			 */
			Group.prototype.count = function () {
				var count = 0
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					if (crit.criteria instanceof Group) {
						count += crit.criteria.count()
					} else {
						count++
					}
				}
				return count
			}
			/**
			 * Rebuilds a sub group that previously existed
			 *
			 * @param loadedGroup The details of a group within this group
			 */
			Group.prototype._addPrevGroup = function (loadedGroup) {
				var idx = this.s.criteria.length
				var group = new Group(this.s.dt, this.c, this.s.topGroup, idx, true, this.s.depth + 1, this.s.serverData)
				// Add the new group to the criteria array
				this.s.criteria.push({
					criteria: group,
					index: idx,
					logic: group.s.logic
				})
				// Rebuild it with the previous conditions for that group
				group.rebuild(loadedGroup)
				this.s.criteria[idx].criteria = group
				this.s.topGroup.trigger("dtsb-redrawContents")
				this._setGroupListeners(group)
			}
			/**
			 * Rebuilds a criteria of this group that previously existed
			 *
			 * @param loadedCriteria The details of a criteria within the group
			 */
			Group.prototype._addPrevCriteria = function (loadedCriteria) {
				var idx = this.s.criteria.length
				var criteria = new Criteria(this.s.dt, this.s.opts, this.s.topGroup, idx, this.s.depth, this.s.serverData)
				criteria.populate()
				// Add the new criteria to the criteria array
				this.s.criteria.push({
					criteria: criteria,
					index: idx
				})
				// Rebuild it with the previous conditions for that criteria
				criteria.s.preventRedraw = this.s.preventRedraw
				criteria.rebuild(loadedCriteria)
				criteria.s.preventRedraw = false
				this.s.criteria[idx].criteria = criteria
				if (!this.s.preventRedraw) {
					this.s.topGroup.trigger("dtsb-redrawContents")
				}
			}
			/**
			 * Checks And the criteria using AND logic
			 *
			 * @param rowData The row data to be checked against the search criteria
			 * @returns boolean The result of the AND search
			 */
			Group.prototype._andSearch = function (rowData, rowIdx) {
				// If there are no criteria then return true for this group
				if (this.s.criteria.length === 0) {
					return true
				}
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					// If the criteria is not complete then skip it
					if (crit.criteria instanceof Criteria && !crit.criteria.s.filled) {
						continue
					}
					// Otherwise if a single one fails return false
					else if (!crit.criteria.search(rowData, rowIdx)) {
						return false
					}
				}
				// If we get to here then everything has passed, so return true for the group
				return true
			}
			/**
			 * Checks And the criteria using OR logic
			 *
			 * @param rowData The row data to be checked against the search criteria
			 * @returns boolean The result of the OR search
			 */
			Group.prototype._orSearch = function (rowData, rowIdx) {
				// If there are no criteria in the group then return true
				if (this.s.criteria.length === 0) {
					return true
				}
				// This will check to make sure that at least one criteria in the group is complete
				var filledfound = false
				for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					if (crit.criteria instanceof Criteria && crit.criteria.s.filled) {
						// A completed criteria has been found so set the flag
						filledfound = true
						// If the search passes then return true
						if (crit.criteria.search(rowData, rowIdx)) {
							return true
						}
					} else if (crit.criteria instanceof Group && crit.criteria.checkFilled()) {
						filledfound = true
						if (crit.criteria.search(rowData, rowIdx)) {
							return true
						}
					}
				}
				// If we get here we need to return the inverse of filledfound,
				//  as if any have been found and we are here then none have passed
				return !filledfound
			}
			/**
			 * Removes a criteria from the group
			 *
			 * @param criteria The criteria instance to be removed
			 */
			Group.prototype._removeCriteria = function (criteria, group) {
				if (group === void 0) {
					group = false
				}
				var i
				// If removing a criteria and there is only then then just destroy the group
				if (this.s.criteria.length <= 1 && this.s.isChild) {
					this.destroy()
				} else {
					// Otherwise splice the given criteria out and redo the indexes
					var last = void 0
					for (i = 0; i < this.s.criteria.length; i++) {
						if (this.s.criteria[i].index === criteria.s.index && (!group || this.s.criteria[i].criteria instanceof Group)) {
							last = i
						}
					}
					// We want to remove the last element with the desired index, as its replacement will be inserted before it
					if (last !== undefined) {
						this.s.criteria.splice(last, 1)
					}
					for (i = 0; i < this.s.criteria.length; i++) {
						this.s.criteria[i].index = i
						this.s.criteria[i].criteria.s.index = i
					}
				}
			}
			/**
			 * Sets the listeners in group for a criteria
			 *
			 * @param criteria The criteria for the listeners to be set on
			 */
			Group.prototype._setCriteriaListeners = function (criteria) {
				var _this = this
				criteria.dom["delete"].unbind("click").on("click.dtsb", function () {
					_this._removeCriteria(criteria)
					criteria.dom.container.remove()
					for (var _i = 0, _a = _this.s.criteria; _i < _a.length; _i++) {
						var crit = _a[_i]
						if (crit.criteria instanceof Criteria) {
							crit.criteria.updateArrows(_this.s.criteria.length > 1)
						}
					}
					criteria.destroy()
					_this.s.dt.draw()
					_this.s.topGroup.trigger("dtsb-redrawContents")
					return false
				})
				criteria.dom.right.unbind("click").on("click.dtsb", function () {
					var idx = criteria.s.index
					var group = new Group(_this.s.dt, _this.s.opts, _this.s.topGroup, criteria.s.index, true, _this.s.depth + 1, _this.s.serverData)
					// Add the criteria that is to be moved to the new group
					group.addCriteria(criteria)
					// Update the details in the current groups criteria array
					_this.s.criteria[idx].criteria = group
					_this.s.criteria[idx].logic = "AND"
					_this.s.topGroup.trigger("dtsb-redrawContents")
					_this._setGroupListeners(group)
					return false
				})
				criteria.dom.left.unbind("click").on("click.dtsb", function () {
					_this.s.toDrop = new Criteria(_this.s.dt, _this.s.opts, _this.s.topGroup, criteria.s.index, undefined, _this.s.serverData)
					_this.s.toDrop.s = criteria.s
					_this.s.toDrop.c = criteria.c
					_this.s.toDrop.classes = criteria.classes
					_this.s.toDrop.populate()
					// The dropCriteria event mutates the reference to the index so need to store it
					var index = _this.s.toDrop.s.index
					_this.dom.container.trigger("dtsb-dropCriteria")
					criteria.s.index = index
					_this._removeCriteria(criteria)
					// By tracking the top level group we can directly trigger a redraw on it,
					//  bubbling is also possible, but that is slow with deep levelled groups
					_this.s.topGroup.trigger("dtsb-redrawContents")
					_this.s.dt.draw()
					return false
				})
			}
			/**
			 * Set's the listeners for the group clear button
			 */
			Group.prototype._setClearListener = function () {
				var _this = this
				this.dom.clear.unbind("click").on("click.dtsb", function () {
					if (!_this.s.isChild) {
						_this.dom.container.trigger("dtsb-clearContents")
						return false
					}
					_this.destroy()
					_this.s.topGroup.trigger("dtsb-redrawContents")
					return false
				})
			}
			/**
			 * Sets listeners for sub groups of this group
			 *
			 * @param group The sub group that the listeners are to be set on
			 */
			Group.prototype._setGroupListeners = function (group) {
				var _this = this
				// Set listeners for the new group
				group.dom.add.unbind("click").on("click.dtsb", function () {
					_this.setupLogic()
					_this.dom.container.trigger("dtsb-add")
					return false
				})
				group.dom.container.unbind("dtsb-add").on("dtsb-add.dtsb", function () {
					_this.setupLogic()
					_this.dom.container.trigger("dtsb-add")
					return false
				})
				group.dom.container.unbind("dtsb-destroy").on("dtsb-destroy.dtsb", function () {
					_this._removeCriteria(group, true)
					group.dom.container.remove()
					_this.setupLogic()
					return false
				})
				group.dom.container.unbind("dtsb-dropCriteria").on("dtsb-dropCriteria.dtsb", function () {
					var toDrop = group.s.toDrop
					toDrop.s.index = group.s.index
					toDrop.updateArrows(_this.s.criteria.length > 1)
					_this.addCriteria(toDrop)
					return false
				})
				group.setListeners()
			}
			/**
			 * Sets up the Group instance, setting listeners and appending elements
			 */
			Group.prototype._setup = function () {
				this.setListeners()
				this.dom.add.html(this.s.dt.i18n("searchBuilder.add", this.c.i18n.add))
				this.dom.search.html(this.s.dt.i18n("searchBuilder.search", this.c.i18n.search))
				this.dom.logic
					.children()
					.first()
					.html(this.c.logic === "OR" ? this.s.dt.i18n("searchBuilder.logicOr", this.c.i18n.logicOr) : this.s.dt.i18n("searchBuilder.logicAnd", this.c.i18n.logicAnd))
				this.s.logic = this.c.logic === "OR" ? "OR" : "AND"
				if (this.c.greyscale) {
					this.dom.logic.addClass(this.classes.greyscale)
				}
				this.dom.logicContainer.append(this.dom.logic).append(this.dom.clear)
				// Only append the logic button immediately if this is a sub group,
				//  otherwise it will be prepended later when adding a criteria
				if (this.s.isChild) {
					this.dom.container.append(this.dom.logicContainer)
				}
				this.dom.container.append(this.dom.add)
				if (!this.c.liveSearch) {
					this.dom.container.append(this.dom.search)
				}
			}
			/**
			 * Sets the listener for the logic button
			 */
			Group.prototype._setLogicListener = function () {
				var _this = this
				this.dom.logic.unbind("click").on("click.dtsb", function () {
					_this._toggleLogic()
					_this.s.dt.draw()
					for (var _i = 0, _a = _this.s.criteria; _i < _a.length; _i++) {
						var crit = _a[_i]
						crit.criteria.setListeners()
					}
				})
			}
			/**
			 * Toggles the logic for the group
			 */
			Group.prototype._toggleLogic = function () {
				if (this.s.logic === "OR") {
					this.s.logic = "AND"
					this.dom.logic.children().first().html(this.s.dt.i18n("searchBuilder.logicAnd", this.c.i18n.logicAnd))
				} else if (this.s.logic === "AND") {
					this.s.logic = "OR"
					this.dom.logic.children().first().html(this.s.dt.i18n("searchBuilder.logicOr", this.c.i18n.logicOr))
				}
			}
			Group.version = "1.1.0"
			Group.classes = {
				add: "dtsb-add",
				button: "dtsb-button",
				clearGroup: "dtsb-clearGroup",
				greyscale: "dtsb-greyscale",
				group: "dtsb-group",
				inputButton: "dtsb-iptbtn",
				logic: "dtsb-logic",
				logicContainer: "dtsb-logicContainer",
				search: "dtsb-search"
			}
			Group.defaults = {
				columns: true,
				conditions: {
					date: Criteria.dateConditions,
					html: Criteria.stringConditions,
					"html-num": Criteria.numConditions,
					"html-num-fmt": Criteria.numFmtConditions,
					luxon: Criteria.luxonDateConditions,
					moment: Criteria.momentDateConditions,
					num: Criteria.numConditions,
					"num-fmt": Criteria.numFmtConditions,
					string: Criteria.stringConditions
				},
				depthLimit: false,
				enterSearch: false,
				filterChanged: undefined,
				greyscale: false,
				liveSearch: true,
				i18n: {
					add: "Add Condition",
					button: {
						0: "Search Builder",
						_: "Search Builder (%d)"
					},
					clearAll: "Clear All",
					condition: "Condition",
					data: "Data",
					delete: "&times",
					deleteTitle: "Delete filtering rule",
					left: "<",
					leftTitle: "Outdent criteria",
					logicAnd: "And",
					logicOr: "Or",
					right: ">",
					rightTitle: "Indent criteria",
					search: "Search",
					title: {
						0: "Custom Search Builder",
						_: "Custom Search Builder (%d)"
					},
					value: "Value",
					valueJoiner: "and"
				},
				logic: "AND",
				orthogonal: {
					display: "display",
					search: "filter"
				},
				preDefined: false
			}
			return Group
		})()

		var $$1
		var dataTable$1
		/**
		 * Sets the value of jQuery for use in the file
		 *
		 * @param jq the instance of jQuery to be set
		 */
		function setJQuery(jq) {
			$$1 = jq
			dataTable$1 = jq.fn.DataTable
		}
		/**
		 * SearchBuilder class for DataTables.
		 * Allows for complex search queries to be constructed and implemented on a DataTable
		 */
		var SearchBuilder = /** @class */ (function () {
			function SearchBuilder(builderSettings, opts) {
				var _this = this
				// Check that the required version of DataTables is included
				if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck("2")) {
					throw new Error("SearchBuilder requires DataTables 2 or newer")
				}
				var table = new dataTable$1.Api(builderSettings)
				this.classes = $$1.extend(true, {}, SearchBuilder.classes)
				// Get options from user
				this.c = $$1.extend(true, {}, SearchBuilder.defaults, opts)
				this.dom = {
					clearAll: $$1('<button type="button">' + table.i18n("searchBuilder.clearAll", this.c.i18n.clearAll) + "</button>")
						.addClass(this.classes.clearAll)
						.addClass(this.classes.button)
						.attr("type", "button"),
					container: $$1("<div/>").addClass(this.classes.container),
					title: $$1("<div/>").addClass(this.classes.title),
					titleRow: $$1("<div/>").addClass(this.classes.titleRow),
					topGroup: undefined
				}
				this.s = {
					dt: table,
					opts: opts,
					search: undefined,
					serverData: undefined,
					topGroup: undefined
				}
				// If searchbuilder is already defined for this table then return
				if (table.settings()[0]._searchBuilder !== undefined) {
					return
				}
				table.settings()[0]._searchBuilder = this
				// If using SSP we want to include the previous state in the very first server call
				if (this.s.dt.page.info().serverSide) {
					this.s.dt.on("preXhr.dtsb", function (e, settings, data) {
						var loadedState = _this.s.dt.state.loaded()
						if (loadedState && loadedState.searchBuilder) {
							data.searchBuilder = _this._collapseArray(loadedState.searchBuilder)
						}
					})
					this.s.dt.on("xhr.dtsb", function (e, settings, json) {
						if (json && json.searchBuilder && json.searchBuilder.options) {
							_this.s.serverData = json.searchBuilder.options
						}
					})
				}
				// Run the remaining setup when the table is initialised
				if (this.s.dt.settings()[0]._bInitComplete) {
					this._setUp()
				} else {
					table.one("init.dt", function () {
						_this._setUp()
					})
				}
				return this
			}
			/**
			 * Gets the details required to rebuild the SearchBuilder as it currently is
			 */
			// eslint upset at empty object but that is what it is
			SearchBuilder.prototype.getDetails = function (deFormatDates) {
				if (deFormatDates === void 0) {
					deFormatDates = false
				}
				return this.s.topGroup.getDetails(deFormatDates)
			}
			/**
			 * Getter for the node of the container for the searchBuilder
			 *
			 * @returns JQuery<HTMLElement> the node of the container
			 */
			SearchBuilder.prototype.getNode = function () {
				return this.dom.container
			}
			/**
			 * Rebuilds the SearchBuilder to a state that is provided
			 *
			 * @param details The details required to perform a rebuild
			 */
			SearchBuilder.prototype.rebuild = function (details) {
				this.dom.clearAll.click()
				// If there are no details to rebuild then return
				if (details === undefined || details === null) {
					return this
				}
				this.s.topGroup.s.preventRedraw = true
				this.s.topGroup.rebuild(details)
				this.s.topGroup.s.preventRedraw = false
				this._checkClear()
				this._updateTitle(this.s.topGroup.count())
				this.s.topGroup.redrawContents()
				this.s.dt.draw(false)
				this.s.topGroup.setListeners()
				return this
			}
			/**
			 * Applies the defaults to preDefined criteria
			 *
			 * @param preDef the array of criteria to be processed.
			 */
			SearchBuilder.prototype._applyPreDefDefaults = function (preDef) {
				var _this = this
				if (preDef.criteria !== undefined && preDef.logic === undefined) {
					preDef.logic = "AND"
				}
				var _loop_1 = function (crit) {
					// Apply the defaults to any further criteria
					if (crit.criteria !== undefined) {
						crit = this_1._applyPreDefDefaults(crit)
					} else {
						this_1.s.dt.columns().every(function (index) {
							if (_this.s.dt.settings()[0].aoColumns[index].sTitle === crit.data) {
								crit.dataIdx = index
							}
						})
					}
				}
				var this_1 = this
				for (var _i = 0, _a = preDef.criteria; _i < _a.length; _i++) {
					var crit = _a[_i]
					_loop_1(crit)
				}
				return preDef
			}
			/**
			 * Set's up the SearchBuilder
			 */
			SearchBuilder.prototype._setUp = function (loadState) {
				var _this = this
				if (loadState === void 0) {
					loadState = true
				}
				// Register an Api method for getting the column type. DataTables 2 has
				// this built in
				if (typeof this.s.dt.column().type !== "function") {
					DataTable.Api.registerPlural("columns().types()", "column().type()", function () {
						return this.iterator(
							"column",
							function (settings, column) {
								return settings.aoColumns[column].sType
							},
							1
						)
					})
				}
				// Check that DateTime is included, If not need to check if it could be used
				// eslint-disable-next-line no-extra-parens
				if (!dataTable$1.DateTime) {
					var types = this.s.dt.columns().types().toArray()
					if (types === undefined || types.includes(undefined) || types.includes(null)) {
						types = []
						for (var _i = 0, _a = this.s.dt.settings()[0].aoColumns; _i < _a.length; _i++) {
							var colInit = _a[_i]
							types.push(colInit.searchBuilderType !== undefined ? colInit.searchBuilderType : colInit.sType)
						}
					}
					var columnIdxs = this.s.dt.columns().toArray()
					// If the column type is still unknown use the internal API to detect type
					if (types === undefined || types.includes(undefined) || types.includes(null)) {
						// This can only happen in DT1 - DT2 will do the invalidation of the type itself
						if ($$1.fn.dataTable.ext.oApi) {
							$$1.fn.dataTable.ext.oApi._fnColumnTypes(this.s.dt.settings()[0])
						}
						types = this.s.dt.columns().types().toArray()
					}
					for (var i = 0; i < columnIdxs[0].length; i++) {
						var column = columnIdxs[0][i]
						var type = types[column]
						if (
							// Check if this column can be filtered
							(this.c.columns === true || (Array.isArray(this.c.columns) && this.c.columns.includes(i))) &&
							// Check if the type is one of the restricted types
							(type.includes("date") || type.includes("moment") || type.includes("luxon"))
						) {
							alert("SearchBuilder Requires DateTime when used with dates.")
							throw new Error("SearchBuilder requires DateTime")
						}
					}
				}
				this.s.topGroup = new Group(this.s.dt, this.c, undefined, undefined, undefined, undefined, this.s.serverData)
				this._setClearListener()
				this.s.dt.on("stateSaveParams.dtsb", function (e, settings, data) {
					data.searchBuilder = _this.getDetails()
					if (!data.scroller) {
						data.page = _this.s.dt.page()
					} else {
						data.start = _this.s.dt.state().start
					}
				})
				this.s.dt.on("stateLoadParams.dtsb", function (e, settings, data) {
					_this.rebuild(data.searchBuilder)
				})
				this._build()
				this.s.dt.on("preXhr.dtsb", function (e, settings, data) {
					if (_this.s.dt.page.info().serverSide) {
						data.searchBuilder = _this._collapseArray(_this.getDetails(true))
					}
				})
				this.s.dt.on("columns-reordered", function () {
					_this.rebuild(_this.getDetails())
				})
				if (loadState) {
					var loadedState = this.s.dt.state.loaded()
					// If the loaded State is not null rebuild based on it for statesave
					if (loadedState !== null && loadedState.searchBuilder !== undefined) {
						this.s.topGroup.rebuild(loadedState.searchBuilder)
						this.s.topGroup.dom.container.trigger("dtsb-redrawContents")
						// If using SSP we want to restrict the amount of server calls that take place
						//  and this information will already have been processed
						if (!this.s.dt.page.info().serverSide) {
							if (loadedState.page) {
								this.s.dt.page(loadedState.page).draw("page")
							} else if (this.s.dt.scroller && loadedState.scroller) {
								this.s.dt.scroller().scrollToRow(loadedState.scroller.topRow)
							}
						}
						this.s.topGroup.setListeners()
					}
					// Otherwise load any predefined options
					else if (this.c.preDefined !== false) {
						this.c.preDefined = this._applyPreDefDefaults(this.c.preDefined)
						this.rebuild(this.c.preDefined)
					}
				}
				this._setEmptyListener()
				this.s.dt.state.save()
			}
			SearchBuilder.prototype._collapseArray = function (criteria) {
				if (criteria.logic === undefined) {
					if (criteria.value !== undefined) {
						criteria.value.sort(function (a, b) {
							if (!isNaN(+a)) {
								a = +a
								b = +b
							}
							if (a < b) {
								return -1
							} else if (b < a) {
								return 1
							} else {
								return 0
							}
						})
						criteria.value1 = criteria.value[0]
						criteria.value2 = criteria.value[1]
					}
				} else {
					for (var i = 0; i < criteria.criteria.length; i++) {
						criteria.criteria[i] = this._collapseArray(criteria.criteria[i])
					}
				}
				return criteria
			}
			/**
			 * Updates the title of the SearchBuilder
			 *
			 * @param count the number of filters in the SearchBuilder
			 */
			SearchBuilder.prototype._updateTitle = function (count) {
				this.dom.title.html(this.s.dt.i18n("searchBuilder.title", this.c.i18n.title, count))
			}
			/**
			 * Builds all of the dom elements together
			 */
			SearchBuilder.prototype._build = function () {
				var _this = this
				// Empty and setup the container
				this.dom.clearAll.remove()
				this.dom.container.empty()
				var count = this.s.topGroup.count()
				this._updateTitle(count)
				this.dom.titleRow.append(this.dom.title)
				this.dom.container.append(this.dom.titleRow)
				this.dom.topGroup = this.s.topGroup.getNode()
				this.dom.container.append(this.dom.topGroup)
				this._setRedrawListener()
				var tableNode = this.s.dt.table(0).node()
				if (!$$1.fn.dataTable.ext.search.includes(this.s.search)) {
					// Custom search function for SearchBuilder
					this.s.search = function (settings, searchData, dataIndex) {
						if (settings.nTable !== tableNode) {
							return true
						}
						return _this.s.topGroup.search(searchData, dataIndex)
					}
					// Add SearchBuilder search function to the dataTables search array
					$$1.fn.dataTable.ext.search.push(this.s.search)
				}
				this.s.dt.on("destroy.dtsb", function () {
					_this.dom.container.remove()
					_this.dom.clearAll.remove()
					var searchIdx = $$1.fn.dataTable.ext.search.indexOf(_this.s.search)
					while (searchIdx !== -1) {
						$$1.fn.dataTable.ext.search.splice(searchIdx, 1)
						searchIdx = $$1.fn.dataTable.ext.search.indexOf(_this.s.search)
					}
					_this.s.dt.off(".dtsb")
					$$1(_this.s.dt.table().node()).off(".dtsb")
				})
			}
			/**
			 * Checks if the clearAll button should be added or not
			 */
			SearchBuilder.prototype._checkClear = function () {
				if (this.s.topGroup.s.criteria.length > 0) {
					this.dom.clearAll.insertAfter(this.dom.title)
					this._setClearListener()
				} else {
					this.dom.clearAll.remove()
				}
			}
			/**
			 * Update the count in the title/button
			 *
			 * @param count Number of filters applied
			 */
			SearchBuilder.prototype._filterChanged = function (count) {
				var fn = this.c.filterChanged
				if (typeof fn === "function") {
					fn(count, this.s.dt.i18n("searchBuilder.button", this.c.i18n.button, count))
				}
			}
			/**
			 * Set the listener for the clear button
			 */
			SearchBuilder.prototype._setClearListener = function () {
				var _this = this
				this.dom.clearAll.unbind("click")
				this.dom.clearAll.on("click.dtsb", function () {
					_this.s.topGroup = new Group(_this.s.dt, _this.c, undefined, undefined, undefined, undefined, _this.s.serverData)
					_this._build()
					_this.s.dt.draw()
					_this.s.topGroup.setListeners()
					_this.dom.clearAll.remove()
					_this._setEmptyListener()
					_this._filterChanged(0)
					return false
				})
			}
			/**
			 * Set the listener for the Redraw event
			 */
			SearchBuilder.prototype._setRedrawListener = function () {
				var _this = this
				this.s.topGroup.dom.container.unbind("dtsb-redrawContents")
				this.s.topGroup.dom.container.on("dtsb-redrawContents.dtsb", function () {
					_this._checkClear()
					_this.s.topGroup.redrawContents()
					_this.s.topGroup.setupLogic()
					_this._setEmptyListener()
					var count = _this.s.topGroup.count()
					_this._updateTitle(count)
					_this._filterChanged(count)
					// If using SSP we want to restrict the amount of server calls that take place
					//  and this information will already have been processed
					if (!_this.s.dt.page.info().serverSide) {
						_this.s.dt.draw()
					}
					_this.s.dt.state.save()
				})
				this.s.topGroup.dom.container.unbind("dtsb-redrawContents-noDraw")
				this.s.topGroup.dom.container.on("dtsb-redrawContents-noDraw.dtsb", function () {
					_this._checkClear()
					_this.s.topGroup.s.preventRedraw = true
					_this.s.topGroup.redrawContents()
					_this.s.topGroup.s.preventRedraw = false
					_this.s.topGroup.setupLogic()
					_this._setEmptyListener()
					var count = _this.s.topGroup.count()
					_this._updateTitle(count)
					_this._filterChanged(count)
				})
				this.s.topGroup.dom.container.unbind("dtsb-redrawLogic")
				this.s.topGroup.dom.container.on("dtsb-redrawLogic.dtsb", function () {
					_this.s.topGroup.redrawLogic()
					var count = _this.s.topGroup.count()
					_this._updateTitle(count)
					_this._filterChanged(count)
				})
				this.s.topGroup.dom.container.unbind("dtsb-add")
				this.s.topGroup.dom.container.on("dtsb-add.dtsb", function () {
					var count = _this.s.topGroup.count()
					_this._updateTitle(count)
					_this._filterChanged(count)
					_this._checkClear()
				})
				this.s.dt.on("postEdit.dtsb postCreate.dtsb postRemove.dtsb", function () {
					_this.s.topGroup.redrawContents()
				})
				this.s.topGroup.dom.container.unbind("dtsb-clearContents")
				this.s.topGroup.dom.container.on("dtsb-clearContents.dtsb", function () {
					_this._setUp(false)
					_this._filterChanged(0)
					_this.s.dt.draw()
				})
			}
			/**
			 * Sets listeners to check whether clearAll should be added or removed
			 */
			SearchBuilder.prototype._setEmptyListener = function () {
				var _this = this
				this.s.topGroup.dom.add.on("click.dtsb", function () {
					_this._checkClear()
				})
				this.s.topGroup.dom.container.on("dtsb-destroy.dtsb", function () {
					_this.dom.clearAll.remove()
				})
			}
			SearchBuilder.version = "1.8.0"
			SearchBuilder.classes = {
				button: "dtsb-button",
				clearAll: "dtsb-clearAll",
				container: "dtsb-searchBuilder",
				inputButton: "dtsb-iptbtn",
				title: "dtsb-title",
				titleRow: "dtsb-titleRow"
			}
			SearchBuilder.defaults = {
				columns: true,
				conditions: {
					date: Criteria.dateConditions,
					html: Criteria.stringConditions,
					"html-num": Criteria.numConditions,
					"html-num-fmt": Criteria.numFmtConditions,
					luxon: Criteria.luxonDateConditions,
					moment: Criteria.momentDateConditions,
					num: Criteria.numConditions,
					"num-fmt": Criteria.numFmtConditions,
					string: Criteria.stringConditions
				},
				depthLimit: false,
				enterSearch: false,
				filterChanged: undefined,
				greyscale: false,
				liveSearch: true,
				i18n: {
					add: "Add Condition",
					button: {
						0: "Search Builder",
						_: "Search Builder (%d)"
					},
					clearAll: "Clear All",
					condition: "Condition",
					conditions: {
						array: {
							contains: "Contains",
							empty: "Empty",
							equals: "Equals",
							not: "Not",
							notEmpty: "Not Empty",
							without: "Without"
						},
						date: {
							after: "After",
							before: "Before",
							between: "Between",
							empty: "Empty",
							equals: "Equals",
							not: "Not",
							notBetween: "Not Between",
							notEmpty: "Not Empty"
						},
						// eslint-disable-next-line id-blacklist
						number: {
							between: "Between",
							empty: "Empty",
							equals: "Equals",
							gt: "Greater Than",
							gte: "Greater Than Equal To",
							lt: "Less Than",
							lte: "Less Than Equal To",
							not: "Not",
							notBetween: "Not Between",
							notEmpty: "Not Empty"
						},
						// eslint-disable-next-line id-blacklist
						string: {
							contains: "Contains",
							empty: "Empty",
							endsWith: "Ends With",
							equals: "Equals",
							not: "Not",
							notContains: "Does Not Contain",
							notEmpty: "Not Empty",
							notEndsWith: "Does Not End With",
							notStartsWith: "Does Not Start With",
							startsWith: "Starts With"
						}
					},
					data: "Data",
					delete: "&times",
					deleteTitle: "Delete filtering rule",
					left: "<",
					leftTitle: "Outdent criteria",
					logicAnd: "And",
					logicOr: "Or",
					right: ">",
					rightTitle: "Indent criteria",
					search: "Search",
					title: {
						0: "Custom Search Builder",
						_: "Custom Search Builder (%d)"
					},
					value: "Value",
					valueJoiner: "and"
				},
				logic: "AND",
				orthogonal: {
					display: "display",
					search: "filter"
				},
				preDefined: false
			}
			return SearchBuilder
		})()

		/*! SearchBuilder 1.8.0
		 * ©SpryMedia Ltd - datatables.net/license/mit
		 */
		setJQuery($)
		setJQuery$1($)
		setJQuery$2($)
		var dataTable = $.fn.dataTable
		// eslint-disable-next-line no-extra-parens
		DataTable.SearchBuilder = SearchBuilder
		// eslint-disable-next-line no-extra-parens
		dataTable.SearchBuilder = SearchBuilder
		// eslint-disable-next-line no-extra-parens
		DataTable.Group = Group
		// eslint-disable-next-line no-extra-parens
		dataTable.Group = Group
		// eslint-disable-next-line no-extra-parens
		DataTable.Criteria = Criteria
		// eslint-disable-next-line no-extra-parens
		dataTable.Criteria = Criteria
		// eslint-disable-next-line no-extra-parens
		var apiRegister = DataTable.Api.register
		// Set up object for plugins
		DataTable.ext.searchBuilder = {
			conditions: {}
		}
		DataTable.ext.buttons.searchBuilder = {
			action: function (e, dt, node, config) {
				this.popover(config._searchBuilder.getNode(), {
					align: "container",
					span: "container"
				})
				var topGroup = config._searchBuilder.s.topGroup
				// Need to redraw the contents to calculate the correct positions for the elements
				if (topGroup !== undefined) {
					topGroup.dom.container.trigger("dtsb-redrawContents-noDraw")
				}
				if (topGroup.s.criteria.length === 0) {
					$("." + $.fn.dataTable.Group.classes.add.replace(/ /g, ".")).click()
				}
			},
			config: {},
			init: function (dt, node, config) {
				var sb = new DataTable.SearchBuilder(
					dt,
					$.extend(
						{
							filterChanged: function (count, text) {
								dt.button(node).text(text)
							}
						},
						config.config
					)
				)
				dt.button(node).text(config.text || dt.i18n("searchBuilder.button", sb.c.i18n.button, 0))
				config._searchBuilder = sb
			},
			text: null
		}
		apiRegister("searchBuilder.getDetails()", function (deFormatDates) {
			if (deFormatDates === void 0) {
				deFormatDates = false
			}
			var ctx = this.context[0]
			// If SearchBuilder has not been initialised on this instance then return
			return ctx._searchBuilder ? ctx._searchBuilder.getDetails(deFormatDates) : null
		})
		apiRegister("searchBuilder.rebuild()", function (details) {
			var ctx = this.context[0]
			// If SearchBuilder has not been initialised on this instance then return
			if (ctx._searchBuilder === undefined) {
				return null
			}
			ctx._searchBuilder.rebuild(details)
			return this
		})
		apiRegister("searchBuilder.container()", function () {
			var ctx = this.context[0]
			// If SearchBuilder has not been initialised on this instance then return
			return ctx._searchBuilder ? ctx._searchBuilder.getNode() : null
		})
		/**
		 * Init function for SearchBuilder
		 *
		 * @param settings the settings to be applied
		 * @param options the options for SearchBuilder
		 * @returns JQUERY<HTMLElement> Returns the node of the SearchBuilder
		 */
		function _init(settings, options) {
			var api = new DataTable.Api(settings)
			var opts = options ? options : api.init().searchBuilder || DataTable.defaults.searchBuilder
			var searchBuilder = new SearchBuilder(api, opts)
			var node = searchBuilder.getNode()
			return node
		}
		// Attach a listener to the document which listens for DataTables initialisation
		// events so we can automatically initialise
		$(document).on("preInit.dt.dtsp", function (e, settings) {
			if (e.namespace !== "dt") {
				return
			}
			if (settings.oInit.searchBuilder || DataTable.defaults.searchBuilder) {
				if (!settings._searchBuilder) {
					_init(settings)
				}
			}
		})
		// DataTables `dom` feature option
		DataTable.ext.feature.push({
			cFeature: "Q",
			fnInit: _init
		})
		// DataTables 2 layout feature
		if (DataTable.feature) {
			DataTable.feature.register("searchBuilder", _init)
		}
	})()

	return DataTable
})

/*! DataTables integration for DataTables' SearchBuilder
 * © SpryMedia Ltd - datatables.net/license
 */
;(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD
		define(["jquery", "datatables.net-dt", "datatables.net-searchbuilder"], function ($) {
			return factory($, window, document)
		})
	} else if (typeof exports === "object") {
		// CommonJS
		var jq = require("jquery")
		var cjsRequires = function (root, $) {
			if (!$.fn.dataTable) {
				require("datatables.net-dt")(root, $)
			}

			if (!$.fn.dataTable.SearchBuilder) {
				require("datatables.net-searchbuilder")(root, $)
			}
		}

		if (typeof window === "undefined") {
			module.exports = function (root, $) {
				if (!root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window
				}

				if (!$) {
					$ = jq(root)
				}

				cjsRequires(root, $)
				return factory($, root, root.document)
			}
		} else {
			cjsRequires(window, jq)
			module.exports = factory(jq, window, window.document)
		}
	} else {
		// Browser
		factory(jQuery, window, document)
	}
})(function ($, window, document) {
	"use strict"
	var DataTable = $.fn.dataTable

	return DataTable
})
