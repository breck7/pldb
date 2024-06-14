#! /usr/bin/env node
{
  const { Utils } = require("./Utils.js")
  const { TreeNode } = require("./TreeNode.js")
  const { HandGrammarProgram } = require("./GrammarLanguage.js")
  const { GrammarBackedNode } = require("./GrammarLanguage.js")

  class hakonParser extends GrammarBackedNode {
    createParserCombinator() {
      return new TreeNode.ParserCombinator(selectorParser, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), { comment: commentParser }), undefined)
    }
    getSelector() {
      return ""
    }
    compile() {
      return this.topDownArray
        .filter(node => node.isSelectorParser)
        .map(child => child.compile())
        .join("")
    }
    static cachedHandGrammarProgramRoot = new HandGrammarProgram(`// Cell Parsers
anyCell
keywordCell
commentKeywordCell
 extends keywordCell
 highlightScope comment
 enum comment
extraCell
 highlightScope invalid
cssValueCell
 highlightScope constant.numeric
selectorCell
 highlightScope keyword.control
 examples body h1
 // todo add html tags, css and ids selector regexes, etc
vendorPrefixPropertyKeywordCell
 description Properties like -moz-column-fill
 highlightScope variable.function
 extends keywordCell
propertyKeywordCell
 highlightScope variable.function
 extends keywordCell
 // todo Where are these coming from? Can we add a url link
 enum align-content align-items align-self all animation animation-delay animation-direction animation-duration animation-fill-mode animation-iteration-count animation-name animation-play-state animation-timing-function backface-visibility background background-attachment background-blend-mode background-clip background-color background-image background-origin background-position background-repeat background-size border border-bottom border-bottom-color border-bottom-left-radius border-bottom-right-radius border-bottom-style border-bottom-width border-collapse border-color border-image border-image-outset border-image-repeat border-image-slice border-image-source border-image-width border-left border-left-color border-left-style border-left-width border-radius border-right border-right-color border-right-style border-right-width border-spacing border-style border-top border-top-color border-top-left-radius border-top-right-radius border-top-style border-top-width border-width bottom box-shadow box-sizing break-inside caption-side clear clip color column-count column-fill column-gap column-rule column-rule-color column-rule-style column-rule-width column-span column-width columns content counter-increment counter-reset cursor direction display empty-cells fill filter flex flex-basis flex-direction flex-flow flex-grow flex-shrink flex-wrap float font @font-face font-family font-size font-size-adjust font-stretch font-style font-variant font-weight  hanging-punctuation height hyphens justify-content @keyframes left letter-spacing line-height list-style list-style-image list-style-position list-style-type margin margin-bottom margin-left margin-right margin-top max-height max-width @media min-height min-width nav-down nav-index nav-left nav-right nav-up opacity order outline outline-color outline-offset outline-style outline-width overflow overflow-x overflow-y padding padding-bottom padding-left padding-right padding-top page-break-after page-break-before page-break-inside perspective perspective-origin position quotes resize right tab-size table-layout text-align text-align-last text-decoration text-decoration-color text-decoration-line text-decoration-style text-indent text-justify text-overflow text-shadow text-transform top transform transform-origin transform-style transition transition-delay transition-duration transition-property transition-timing-function unicode-bidi vertical-align visibility white-space width word-break word-spacing word-wrap z-index overscroll-behavior-x user-select -ms-touch-action -webkit-user-select -webkit-touch-callout -moz-user-select touch-action -ms-user-select -khtml-user-select gap grid-auto-flow grid-column grid-column-end grid-column-gap grid-column-start grid-gap grid-row grid-row-end grid-row-gap grid-row-start grid-template-columns grid-template-rows justify-items justify-self
errorCell
 highlightScope invalid
commentCell
 highlightScope comment

// Line Parsers
hakonParser
 root
 // todo Add variables?
 description A prefix Tree Language that compiles to CSS
 compilesTo css
 inScope commentParser
 catchAllParser selectorParser
 javascript
  getSelector() {
   return ""
  }
  compile() {
   return this.topDownArray
    .filter(node => node.isSelectorParser)
    .map(child => child.compile())
    .join("")
  }
 example A basic example
  body
   font-size 12px
   h1,h2
    color red
  a
   &:hover
    color blue
    font-size 17px
propertyParser
 catchAllCellType cssValueCell
 catchAllParser errorParser
 javascript
  compile(spaces) {
   return \`\${spaces}\${this.firstWord}: \${this.content};\`
  }
 cells propertyKeywordCell
variableParser
 extends propertyParser
 pattern --
browserPrefixPropertyParser
 extends propertyParser
 pattern ^\\-\\w.+
 cells vendorPrefixPropertyKeywordCell
errorParser
 catchAllParser errorParser
 catchAllCellType errorCell
 baseParser errorParser
commentParser
 cells commentKeywordCell
 catchAllCellType commentCell
 catchAllParser commentParser
selectorParser
 inScope propertyParser variableParser commentParser
 catchAllParser selectorParser
 boolean isSelectorParser true
 javascript
  getSelector() {
   const parentSelector = this.parent.getSelector()
   return this.firstWord
    .split(",")
    .map(part => {
     if (part.startsWith("&")) return parentSelector + part.substr(1)
     return parentSelector ? parentSelector + " " + part : part
    })
    .join(",")
  }
  compile() {
   const propertyParsers = this.getChildren().filter(node => node.doesExtend("propertyParser"))
   if (!propertyParsers.length) return ""
   const spaces = "  "
   return \`\${this.getSelector()} {
  \${propertyParsers.map(child => child.compile(spaces)).join("\\n")}
  }\\n\`
  }
 cells selectorCell`)
    get handGrammarProgram() {
      return this.constructor.cachedHandGrammarProgramRoot
    }
    static rootParser = hakonParser
  }

  class propertyParser extends GrammarBackedNode {
    createParserCombinator() {
      return new TreeNode.ParserCombinator(errorParser, undefined, undefined)
    }
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get cssValueCell() {
      return this.getWordsFrom(1)
    }
    compile(spaces) {
      return `${spaces}${this.firstWord}: ${this.content};`
    }
  }

  class variableParser extends propertyParser {}

  class browserPrefixPropertyParser extends propertyParser {
    get vendorPrefixPropertyKeywordCell() {
      return this.getWord(0)
    }
  }

  class errorParser extends GrammarBackedNode {
    createParserCombinator() {
      return new TreeNode.ParserCombinator(errorParser, undefined, undefined)
    }
    getErrors() {
      return this._getErrorParserErrors()
    }
    get errorCell() {
      return this.getWordsFrom(0)
    }
  }

  class commentParser extends GrammarBackedNode {
    createParserCombinator() {
      return new TreeNode.ParserCombinator(commentParser, undefined, undefined)
    }
    get commentKeywordCell() {
      return this.getWord(0)
    }
    get commentCell() {
      return this.getWordsFrom(1)
    }
  }

  class selectorParser extends GrammarBackedNode {
    createParserCombinator() {
      return new TreeNode.ParserCombinator(
        selectorParser,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), {
          "border-bottom-right-radius": propertyParser,
          "transition-timing-function": propertyParser,
          "animation-iteration-count": propertyParser,
          "animation-timing-function": propertyParser,
          "border-bottom-left-radius": propertyParser,
          "border-top-right-radius": propertyParser,
          "border-top-left-radius": propertyParser,
          "background-attachment": propertyParser,
          "background-blend-mode": propertyParser,
          "text-decoration-color": propertyParser,
          "text-decoration-style": propertyParser,
          "overscroll-behavior-x": propertyParser,
          "-webkit-touch-callout": propertyParser,
          "grid-template-columns": propertyParser,
          "animation-play-state": propertyParser,
          "text-decoration-line": propertyParser,
          "animation-direction": propertyParser,
          "animation-fill-mode": propertyParser,
          "backface-visibility": propertyParser,
          "background-position": propertyParser,
          "border-bottom-color": propertyParser,
          "border-bottom-style": propertyParser,
          "border-bottom-width": propertyParser,
          "border-image-outset": propertyParser,
          "border-image-repeat": propertyParser,
          "border-image-source": propertyParser,
          "hanging-punctuation": propertyParser,
          "list-style-position": propertyParser,
          "transition-duration": propertyParser,
          "transition-property": propertyParser,
          "-webkit-user-select": propertyParser,
          "animation-duration": propertyParser,
          "border-image-slice": propertyParser,
          "border-image-width": propertyParser,
          "border-right-color": propertyParser,
          "border-right-style": propertyParser,
          "border-right-width": propertyParser,
          "perspective-origin": propertyParser,
          "-khtml-user-select": propertyParser,
          "grid-template-rows": propertyParser,
          "background-origin": propertyParser,
          "background-repeat": propertyParser,
          "border-left-color": propertyParser,
          "border-left-style": propertyParser,
          "border-left-width": propertyParser,
          "column-rule-color": propertyParser,
          "column-rule-style": propertyParser,
          "column-rule-width": propertyParser,
          "counter-increment": propertyParser,
          "page-break-before": propertyParser,
          "page-break-inside": propertyParser,
          "grid-column-start": propertyParser,
          "background-color": propertyParser,
          "background-image": propertyParser,
          "border-top-color": propertyParser,
          "border-top-style": propertyParser,
          "border-top-width": propertyParser,
          "font-size-adjust": propertyParser,
          "list-style-image": propertyParser,
          "page-break-after": propertyParser,
          "transform-origin": propertyParser,
          "transition-delay": propertyParser,
          "-ms-touch-action": propertyParser,
          "-moz-user-select": propertyParser,
          "animation-delay": propertyParser,
          "background-clip": propertyParser,
          "background-size": propertyParser,
          "border-collapse": propertyParser,
          "justify-content": propertyParser,
          "list-style-type": propertyParser,
          "text-align-last": propertyParser,
          "text-decoration": propertyParser,
          "transform-style": propertyParser,
          "-ms-user-select": propertyParser,
          "grid-column-end": propertyParser,
          "grid-column-gap": propertyParser,
          "animation-name": propertyParser,
          "border-spacing": propertyParser,
          "flex-direction": propertyParser,
          "letter-spacing": propertyParser,
          "outline-offset": propertyParser,
          "padding-bottom": propertyParser,
          "text-transform": propertyParser,
          "vertical-align": propertyParser,
          "grid-auto-flow": propertyParser,
          "grid-row-start": propertyParser,
          "align-content": propertyParser,
          "border-bottom": propertyParser,
          "border-radius": propertyParser,
          "counter-reset": propertyParser,
          "margin-bottom": propertyParser,
          "outline-color": propertyParser,
          "outline-style": propertyParser,
          "outline-width": propertyParser,
          "padding-right": propertyParser,
          "text-overflow": propertyParser,
          "justify-items": propertyParser,
          "border-color": propertyParser,
          "border-image": propertyParser,
          "border-right": propertyParser,
          "border-style": propertyParser,
          "border-width": propertyParser,
          "break-inside": propertyParser,
          "caption-side": propertyParser,
          "column-count": propertyParser,
          "column-width": propertyParser,
          "font-stretch": propertyParser,
          "font-variant": propertyParser,
          "margin-right": propertyParser,
          "padding-left": propertyParser,
          "table-layout": propertyParser,
          "text-justify": propertyParser,
          "unicode-bidi": propertyParser,
          "word-spacing": propertyParser,
          "touch-action": propertyParser,
          "grid-row-end": propertyParser,
          "grid-row-gap": propertyParser,
          "justify-self": propertyParser,
          "align-items": propertyParser,
          "border-left": propertyParser,
          "column-fill": propertyParser,
          "column-rule": propertyParser,
          "column-span": propertyParser,
          "empty-cells": propertyParser,
          "flex-shrink": propertyParser,
          "font-family": propertyParser,
          "font-weight": propertyParser,
          "line-height": propertyParser,
          "margin-left": propertyParser,
          "padding-top": propertyParser,
          perspective: propertyParser,
          "text-indent": propertyParser,
          "text-shadow": propertyParser,
          "white-space": propertyParser,
          "user-select": propertyParser,
          "grid-column": propertyParser,
          "align-self": propertyParser,
          background: propertyParser,
          "border-top": propertyParser,
          "box-shadow": propertyParser,
          "box-sizing": propertyParser,
          "column-gap": propertyParser,
          "flex-basis": propertyParser,
          "@font-face": propertyParser,
          "font-style": propertyParser,
          "@keyframes": propertyParser,
          "list-style": propertyParser,
          "margin-top": propertyParser,
          "max-height": propertyParser,
          "min-height": propertyParser,
          "overflow-x": propertyParser,
          "overflow-y": propertyParser,
          "text-align": propertyParser,
          transition: propertyParser,
          visibility: propertyParser,
          "word-break": propertyParser,
          animation: propertyParser,
          direction: propertyParser,
          "flex-flow": propertyParser,
          "flex-grow": propertyParser,
          "flex-wrap": propertyParser,
          "font-size": propertyParser,
          "max-width": propertyParser,
          "min-width": propertyParser,
          "nav-index": propertyParser,
          "nav-right": propertyParser,
          transform: propertyParser,
          "word-wrap": propertyParser,
          "nav-down": propertyParser,
          "nav-left": propertyParser,
          overflow: propertyParser,
          position: propertyParser,
          "tab-size": propertyParser,
          "grid-gap": propertyParser,
          "grid-row": propertyParser,
          columns: propertyParser,
          content: propertyParser,
          display: propertyParser,
          hyphens: propertyParser,
          opacity: propertyParser,
          outline: propertyParser,
          padding: propertyParser,
          "z-index": propertyParser,
          border: propertyParser,
          bottom: propertyParser,
          cursor: propertyParser,
          filter: propertyParser,
          height: propertyParser,
          margin: propertyParser,
          "@media": propertyParser,
          "nav-up": propertyParser,
          quotes: propertyParser,
          resize: propertyParser,
          clear: propertyParser,
          color: propertyParser,
          float: propertyParser,
          order: propertyParser,
          right: propertyParser,
          width: propertyParser,
          clip: propertyParser,
          fill: propertyParser,
          flex: propertyParser,
          font: propertyParser,
          left: propertyParser,
          all: propertyParser,
          top: propertyParser,
          gap: propertyParser,
          "": propertyParser,
          comment: commentParser
        }),
        [
          { regex: /--/, parser: variableParser },
          { regex: /^\-\w.+/, parser: browserPrefixPropertyParser }
        ]
      )
    }
    get selectorCell() {
      return this.getWord(0)
    }
    get isSelectorParser() {
      return true
    }
    getSelector() {
      const parentSelector = this.parent.getSelector()
      return this.firstWord
        .split(",")
        .map(part => {
          if (part.startsWith("&")) return parentSelector + part.substr(1)
          return parentSelector ? parentSelector + " " + part : part
        })
        .join(",")
    }
    compile() {
      const propertyParsers = this.getChildren().filter(node => node.doesExtend("propertyParser"))
      if (!propertyParsers.length) return ""
      const spaces = "  "
      return `${this.getSelector()} {
${propertyParsers.map(child => child.compile(spaces)).join("\n")}
}\n`
    }
  }

  module.exports = hakonParser
  hakonParser

  if (!module.parent) new hakonParser(TreeNode.fromDisk(process.argv[2]).toString()).execute()
}
