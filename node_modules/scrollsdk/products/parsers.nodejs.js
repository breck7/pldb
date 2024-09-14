#! /usr/bin/env node
{
  const { Utils } = require("./Utils.js")
  const { Particle } = require("./Particle.js")
  const { HandParsersProgram } = require("./Parsers.js")
  const { ParserBackedParticle } = require("./Parsers.js")

  class parsersParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllErrorParser, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), { "//": slashCommentParser }), [
        { regex: /^$/, parser: blankLineParser },
        { regex: /^[a-zA-Z0-9_]+Cell$/, parser: cellTypeDefinitionParser },
        { regex: /^[a-zA-Z0-9_]+Parser$/, parser: parserDefinitionParser }
      ])
    }
    static cachedHandParsersProgramRoot =
      new HandParsersProgram(`// todo Add imports parsers, along with source maps, so we can correctly support parsers split across multiple files, and better enable parsers from compositions of reusable bits?
// todo Do error checking for if you have a firstwordCellType, cells, and/or catchAllCellType with same name.
// todo Add enumOption root level type?
// todo compile cells. add javascript property. move getRunTimeEnumOptions to cells.

// Cell Parsers
abstractConstantCell
 paint entity.name.tag

javascriptSafeAlphaNumericIdentifierCell
 regex [a-zA-Z0-9_]+
 reservedWords enum extends function static if while export return class for default require var let const new

anyCell

baseParsersCell
 description There are a few classes of special parsers. BlobParsers don't have their subparticles parsed. Error particles always report an error.
 // todo Remove?
 enum blobParser errorParser
 paint variable.parameter

boolCell
 enum true false
 paint constant.numeric

cellParserCell
 enum prefix postfix omnifix
 paint constant.numeric

cellPropertyNameCell
 paint variable.parameter

cellTypeIdCell
 examples intCell keywordCell someCustomCell
 extends javascriptSafeAlphaNumericIdentifierCell
 enumFromCellTypes cellTypeIdCell
 paint storage

constantIdentifierCell
 examples someId myVar
 // todo Extend javascriptSafeAlphaNumericIdentifier
 regex [a-zA-Z]\\w+
 paint constant.other
 description A word that can be assigned to the parser in the target language.

constructorFilePathCell

enumOptionCell
 // todo Add an enumOption top level type, so we can add data to an enum option such as a description.
 paint string

cellExampleCell
 description Holds an example for a cell with a wide range of options.
 paint string

extraCell
 paint invalid

fileExtensionCell
 examples js txt doc exe
 regex [a-zA-Z0-9]+
 paint string

numericCell
 description A float or an int.
 paint constant.numeric

floatCell
 regex \\-?[0-9]*\\.?[0-9]*
 paint constant.numeric

intCell
 regex \\-?[0-9]+
 paint constant.numeric

javascriptCodeCell

lowercaseCell
 regex [a-z]+

parserIdCell
 examples commentParser addParser
 description This doubles as the class name in Javascript. If this begins with \`abstract\`, then the parser will be considered an abstract parser, which cannot be used by itself but provides common functionality to parsers that extend it.
 paint variable.parameter
 extends javascriptSafeAlphaNumericIdentifierCell
 enumFromCellTypes parserIdCell

propertyKeywordCell
 paint constant.language

regexCell
 paint string.regexp

reservedWordCell
 description A word that a cell cannot contain.
 paint string

paintTypeCell
 enum comment comment.block comment.block.documentation comment.line constant constant.character.escape constant.language constant.numeric constant.numeric.complex constant.numeric.complex.imaginary constant.numeric.complex.real constant.numeric.float constant.numeric.float.binary constant.numeric.float.decimal constant.numeric.float.hexadecimal constant.numeric.float.octal constant.numeric.float.other constant.numeric.integer constant.numeric.integer.binary constant.numeric.integer.decimal constant.numeric.integer.hexadecimal constant.numeric.integer.octal constant.numeric.integer.other constant.other constant.other.placeholder entity entity.name entity.name.class entity.name.class.forward-decl entity.name.constant entity.name.enum entity.name.function entity.name.function.constructor entity.name.function.destructor entity.name.impl entity.name.interface entity.name.label entity.name.namespace entity.name.section entity.name.struct entity.name.tag entity.name.trait entity.name.type entity.name.union entity.other.attribute-name entity.other.inherited-class invalid invalid.deprecated invalid.illegal keyword keyword.control keyword.control.conditional keyword.control.import keyword.declaration keyword.operator keyword.operator.arithmetic keyword.operator.assignment keyword.operator.bitwise keyword.operator.logical keyword.operator.word keyword.other markup markup.bold markup.deleted markup.heading markup.inserted markup.italic markup.list.numbered markup.list.unnumbered markup.other markup.quote markup.raw.block markup.raw.inline markup.underline markup.underline.link meta meta.annotation meta.annotation.identifier meta.annotation.parameters meta.block meta.braces meta.brackets meta.class meta.enum meta.function meta.function-call meta.function.parameters meta.function.return-type meta.generic meta.group meta.impl meta.interface meta.interpolation meta.namespace meta.paragraph meta.parens meta.path meta.preprocessor meta.string meta.struct meta.tag meta.toc-list meta.trait meta.type meta.union punctuation punctuation.accessor punctuation.definition.annotation punctuation.definition.comment punctuation.definition.generic.begin punctuation.definition.generic.end punctuation.definition.keyword punctuation.definition.string.begin punctuation.definition.string.end punctuation.definition.variable punctuation.section.block.begin punctuation.section.block.end punctuation.section.braces.begin punctuation.section.braces.end punctuation.section.brackets.begin punctuation.section.brackets.end punctuation.section.group.begin punctuation.section.group.end punctuation.section.interpolation.begin punctuation.section.interpolation.end punctuation.section.parens.begin punctuation.section.parens.end punctuation.separator punctuation.separator.continuation punctuation.terminator source source.language-suffix.embedded storage storage.modifier storage.type storage.type keyword.declaration.type storage.type.class keyword.declaration.class storage.type.enum keyword.declaration.enum storage.type.function keyword.declaration.function storage.type.impl keyword.declaration.impl storage.type.interface keyword.declaration.interface storage.type.struct keyword.declaration.struct storage.type.trait keyword.declaration.trait storage.type.union keyword.declaration.union string string.quoted.double string.quoted.other string.quoted.single string.quoted.triple string.regexp string.unquoted support support.class support.constant support.function support.module support.type text text.html text.xml variable variable.annotation variable.function variable.language variable.other variable.other.constant variable.other.member variable.other.readwrite variable.parameter
 paint string

scriptUrlCell

semanticVersionCell
 examples 1.0.0 2.2.1
 regex [0-9]+\\.[0-9]+\\.[0-9]+
 paint constant.numeric

stringCell
 paint string
 examples lorem ipsum

tagCell
 paint string

wordCell
 regex [a-zA-Z]+
 paint variable.parameter

exampleAnyCell
 examples lorem ipsem
 // todo Eventually we want to be able to parse correctly the examples.
 paint comment
 extends stringCell

blankCell

commentCell
 paint comment

// Line Parsers
parsersParser
 root
 description A programming language for making languages.
 // Parsers is a language for creating new languages on top of Particles. By creating a parsers file you get a parser, a type checker, syntax highlighting, autocomplete, a compiler, and virtual machine for executing your new language. Parsers uses both postfix and prefix language features.
 catchAllParser catchAllErrorParser
 extensions parsers gram
 example A parsers that parses anything:
  latinParser
   root
   catchAllParser anyParser
  anyParser
   baseParser blobParser
 inScope slashCommentParser blankLineParser cellTypeDefinitionParser parserDefinitionParser

blankLineParser
 description Blank lines are OK in Parsers.
 cells blankCell
 pattern ^$
 tags doNotSynthesize

abstractCompilerRuleParser
 catchAllCellType anyCell
 cells propertyKeywordCell

closeSubparticlesParser
 extends abstractCompilerRuleParser
 description When compiling a parent particle to a string, this string is appended to the compiled and joined subparticles. Default is blank.
 cruxFromId

indentCharacterParser
 extends abstractCompilerRuleParser
 description You can change the indent character for compiled subparticles. Default is a space.
 cruxFromId

catchAllCellDelimiterParser
 description If a particle has a catchAllCell, this is the string delimiter that will be used to join those cells. Default is comma.
 extends abstractCompilerRuleParser
 cruxFromId

openSubparticlesParser
 extends abstractCompilerRuleParser
 description When compiling a parent particle to a string, this string is prepended to the compiled and joined subparticles. Default is blank.
 cruxFromId

stringTemplateParser
 extends abstractCompilerRuleParser
 description This template string is used to compile this line, and accepts strings of the format: const var = {someCellId}
 cruxFromId

joinSubparticlesWithParser
 description When compiling a parent particle to a string, subparticles are compiled to strings and joined by this character. Default is a newline.
 extends abstractCompilerRuleParser
 cruxFromId

abstractConstantParser
 description A constant.
 cells propertyKeywordCell
 cruxFromId
 // todo: make tags inherit
 tags actPhase

booleanParser
 cells propertyKeywordCell constantIdentifierCell
 catchAllCellType boolCell
 extends abstractConstantParser
 tags actPhase

floatParser
 cells propertyKeywordCell constantIdentifierCell
 catchAllCellType floatCell
 extends abstractConstantParser
 tags actPhase

intParser
 cells propertyKeywordCell constantIdentifierCell
 catchAllCellType intCell
 tags actPhase
 extends abstractConstantParser

stringParser
 cells propertyKeywordCell constantIdentifierCell
 catchAllCellType stringCell
 catchAllParser catchAllMultilineStringConstantParser
 extends abstractConstantParser
 tags actPhase

abstractParserRuleParser
 single
 cells propertyKeywordCell

compilesToParser
 cells propertyKeywordCell fileExtensionCell
 extends abstractParserRuleParser
 description File extension for simple compilers.
 // todo: deprecate?
 // Optionally specify a file extension that will be used when compiling your language to a file. Generally used on parsers marked root.
 cruxFromId
 tags experimental

extensionsParser
 extends abstractParserRuleParser
 catchAllCellType fileExtensionCell
 description File extension for your dialect.
 // File extensions of your language. Generally used for parsers marked "root". Sometimes your language might have multiple extensions. If you don't add this, the root particle's parserId will be used as the default file extension.
 cruxFromId
 tags deprecate

abstractNonTerminalParserRuleParser
 extends abstractParserRuleParser

baseParserParser
 cells propertyKeywordCell baseParsersCell
 description Set for blobs or errors. 
 // In rare cases with untyped content you can use a blobParser, for now, to skip parsing for performance gains. The base errorParser will report errors when parsed. Use that if you don't want to implement your own error parser.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

catchAllCellTypeParser
 cells propertyKeywordCell cellTypeIdCell
 description Use for lists.
 // Aka 'listCellType'. Use this when the value in a key/value pair is a list. If there are extra words in the particle's line, parse these words as this type. Often used with \`listDelimiterParser\`.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

cellParserParser
 cells propertyKeywordCell cellParserCell
 description Set parsing strategy.
 // prefix/postfix/omnifix parsing strategy. If missing, defaults to prefix.
 extends abstractParserRuleParser
 cruxFromId
 tags experimental analyzePhase

catchAllParserParser
 description Attach this to unmatched lines.
 // If a parser is not found in the inScope list, instantiate this type of particle instead.
 cells propertyKeywordCell parserIdCell
 extends abstractParserRuleParser
 cruxFromId
 tags acquirePhase

cellsParser
 catchAllCellType cellTypeIdCell
 description Set required cellTypes.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

compilerParser
 // todo Remove this and its subparticles?
 description For simple compilers.
 inScope stringTemplateParser catchAllCellDelimiterParser openSubparticlesParser closeSubparticlesParser indentCharacterParser joinSubparticlesWithParser
 extends abstractParserRuleParser
 cruxFromId
 tags experimental

parserDescriptionParser
 description Parser description.
 catchAllCellType stringCell
 extends abstractParserRuleParser
 crux description
 tags assemblePhase

cellTypeDescriptionParser
 description Cell Type description.
 catchAllCellType stringCell
 crux description
 tags assemblePhase

exampleParser
 // todo Should this just be a "string" constant on particles?
 description Set example for docs and tests.
 catchAllCellType exampleAnyCell
 catchAllParser catchAllExampleLineParser
 extends abstractParserRuleParser
 cruxFromId
 tags assemblePhase

extendsParserParser
 crux extends
 tags assemblePhase
 description Extend another parser.
 // todo: add a catchall that is used for mixins
 cells propertyKeywordCell parserIdCell
 extends abstractParserRuleParser

popularityParser
 // todo Remove this parser. Switch to conditional frequencies.
 description Parser popularity.
 cells propertyKeywordCell floatCell
 extends abstractParserRuleParser
 cruxFromId
 tags assemblePhase

inScopeParser
 description Parsers in scope.
 catchAllCellType parserIdCell
 extends abstractParserRuleParser
 cruxFromId
 tags acquirePhase

javascriptParser
 // todo Urgently need to get submode syntax highlighting running! (And eventually LSP)
 description Javascript code for Parser Actions.
 catchAllParser catchAllJavascriptCodeLineParser
 extends abstractParserRuleParser
 tags actPhase
 javascript
  format() {
   if (this.isNodeJs()) {
    const template = \`class FOO{ \${this.subparticlesToString()}}\`
    this.setSubparticles(
     require("prettier")
      .format(template, { semi: false, useTabs: true, parser: "babel", printWidth: 240 })
      .replace(/class FOO \\{\\s+/, "")
      .replace(/\\s+\\}\\s+$/, "")
      .replace(/\\n\\t/g, "\\n") // drop one level of indent
      .replace(/\\t/g, " ") // we used tabs instead of spaces to be able to dedent without breaking literals.
    )
   }
   return this
  }
 cruxFromId

abstractParseRuleParser
 // Each particle should have a pattern that it matches on unless it's a catch all particle.
 extends abstractParserRuleParser
 cruxFromId

cruxParser
 cells propertyKeywordCell stringCell
 description Attach by matching first word.
 extends abstractParseRuleParser
 tags acquirePhase

cruxFromIdParser
 cells propertyKeywordCell
 description Derive crux from parserId.
 // for example 'fooParser' would have crux of 'foo'.
 extends abstractParseRuleParser
 tags acquirePhase

patternParser
 catchAllCellType regexCell
 description Attach via regex.
 extends abstractParseRuleParser
 tags acquirePhase

requiredParser
 description Assert is present at least once.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

abstractValidationRuleParser
 extends abstractParserRuleParser
 cruxFromId
 catchAllCellType boolCell

singleParser
 description Assert used once.
 // Can be overridden by a child class by setting to false.
 extends abstractValidationRuleParser
 tags analyzePhase

uniqueLineParser
 description Assert unique lines. For pattern parsers.
 // Can be overridden by a child class by setting to false.
 extends abstractValidationRuleParser
 tags analyzePhase

uniqueFirstWordParser
 description Assert unique first words. For pattern parsers.
 // For catch all parsers or pattern particles, use this to indicate the 
 extends abstractValidationRuleParser
 tags analyzePhase

listDelimiterParser
 description Split content by this delimiter.
 extends abstractParserRuleParser
 cruxFromId
 catchAllCellType stringCell
 tags analyzePhase


contentKeyParser
 description Deprecated. For to/from JSON.
 // Advanced keyword to help with isomorphic JSON serialization/deserialization. If present will serialize the particle to an object and set a property with this key and the value set to the particle's content.
 extends abstractParserRuleParser
 cruxFromId
 catchAllCellType stringCell
 tags deprecate
subparticlesKeyParser
 // todo: deprecate?
 description Deprecated. For to/from JSON.
 // Advanced keyword to help with serialization/deserialization of blobs. If present will serialize the particle to an object and set a property with this key and the value set to the particle's subparticles.
 extends abstractParserRuleParser
 cruxFromId
 catchAllCellType stringCell
 tags deprecate

tagsParser
 catchAllCellType tagCell
 extends abstractParserRuleParser
 description Custom metadata.
 cruxFromId
 tags assemblePhase

catchAllErrorParser
 baseParser errorParser

catchAllExampleLineParser
 catchAllCellType exampleAnyCell
 catchAllParser catchAllExampleLineParser
 cells exampleAnyCell

catchAllJavascriptCodeLineParser
 catchAllCellType javascriptCodeCell
 catchAllParser catchAllJavascriptCodeLineParser

catchAllMultilineStringConstantParser
 description String constants can span multiple lines.
 catchAllCellType stringCell
 catchAllParser catchAllMultilineStringConstantParser
 cells stringCell


cellTypeDefinitionParser
 // todo Generate a class for each cell type?
 // todo Allow abstract cell types?
 // todo Change pattern to postfix.
 pattern ^[a-zA-Z0-9_]+Cell$
 inScope paintParser regexParser reservedWordsParser enumFromCellTypesParser cellTypeDescriptionParser enumParser slashCommentParser extendsCellTypeParser examplesParser cellMinParser cellMaxParser
 cells cellTypeIdCell
 tags assemblePhase

// Enums
enumFromCellTypesParser
 description Runtime enum options.
 catchAllCellType cellTypeIdCell
 cells cellPropertyNameCell
 cruxFromId
 tags analyzePhase

enumParser
 description Set enum options.
 cruxFromId
 catchAllCellType enumOptionCell
 cells cellPropertyNameCell
 tags analyzePhase

examplesParser
 description Examples for documentation and tests.
 // If the domain of possible cell values is large, such as a string type, it can help certain methods—such as program synthesis—to provide a few examples.
 cruxFromId
 catchAllCellType cellExampleCell
 cells cellPropertyNameCell
 tags assemblePhase

cellMinParser
 description Specify a min if numeric.
 crux min
 cells cellPropertyNameCell numericCell
 tags analyzePhase

cellMaxParser
 description Specify a max if numeric.
 crux max
 cells cellPropertyNameCell numericCell
 tags analyzePhase

paintParser
 cells propertyKeywordCell paintTypeCell
 description Instructor editor how to color these.
 single
 cruxFromId
 tags analyzePhase

rootFlagParser
 crux root
 description Set root parser.
 // Mark a parser as root if it is the root of your language. The parserId will be the name of your language. The parserId will also serve as the default file extension, if you don't specify another. If more than 1 parser is marked as "root", the last one wins.
 cells propertyKeywordCell
 tags assemblePhase

parserDefinitionParser
 // todo Add multiple dispatch?
 pattern ^[a-zA-Z0-9_]+Parser$
 description Parser types are a core unit of your language. They translate to 1 class per parser. Examples of parser would be "header", "person", "if", "+", "define", etc.
 catchAllParser catchAllErrorParser
 inScope rootFlagParser abstractParserRuleParser abstractConstantParser slashCommentParser parserDefinitionParser
 cells parserIdCell
 tags assemblePhase

regexParser
 catchAllCellType regexCell
 description Words must match this.
 single
 cells cellPropertyNameCell
 cruxFromId
 tags analyzePhase

reservedWordsParser
 single
 description Words can't be any of these.
 catchAllCellType reservedWordCell
 cells cellPropertyNameCell
 cruxFromId
 tags analyzePhase

commentLineParser
 catchAllCellType commentCell

slashCommentParser
 description A comment.
 catchAllCellType commentCell
 crux //
 catchAllParser commentLineParser
 tags assemblePhase

extendsCellTypeParser
 crux extends
 description Extend another cellType.
 // todo Add mixin support in addition to extends?
 cells propertyKeywordCell cellTypeIdCell
 tags assemblePhase
 single`)
    get handParsersProgram() {
      return this.constructor.cachedHandParsersProgramRoot
    }
    static rootParser = parsersParser
  }

  class blankLineParser extends ParserBackedParticle {
    get blankCell() {
      return this.getWord(0)
    }
  }

  class abstractCompilerRuleParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get anyCell() {
      return this.getWordsFrom(1)
    }
  }

  class closeSubparticlesParser extends abstractCompilerRuleParser {}

  class indentCharacterParser extends abstractCompilerRuleParser {}

  class catchAllCellDelimiterParser extends abstractCompilerRuleParser {}

  class openSubparticlesParser extends abstractCompilerRuleParser {}

  class stringTemplateParser extends abstractCompilerRuleParser {}

  class joinSubparticlesWithParser extends abstractCompilerRuleParser {}

  class abstractConstantParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
  }

  class booleanParser extends abstractConstantParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get constantIdentifierCell() {
      return this.getWord(1)
    }
    get boolCell() {
      return this.getWordsFrom(2)
    }
  }

  class floatParser extends abstractConstantParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get constantIdentifierCell() {
      return this.getWord(1)
    }
    get floatCell() {
      return this.getWordsFrom(2).map(val => parseFloat(val))
    }
  }

  class intParser extends abstractConstantParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get constantIdentifierCell() {
      return this.getWord(1)
    }
    get intCell() {
      return this.getWordsFrom(2).map(val => parseInt(val))
    }
  }

  class stringParser extends abstractConstantParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllMultilineStringConstantParser, undefined, undefined)
    }
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get constantIdentifierCell() {
      return this.getWord(1)
    }
    get stringCell() {
      return this.getWordsFrom(2)
    }
  }

  class abstractParserRuleParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
  }

  class compilesToParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get fileExtensionCell() {
      return this.getWord(1)
    }
  }

  class extensionsParser extends abstractParserRuleParser {
    get fileExtensionCell() {
      return this.getWordsFrom(0)
    }
  }

  class abstractNonTerminalParserRuleParser extends abstractParserRuleParser {}

  class baseParserParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get baseParsersCell() {
      return this.getWord(1)
    }
  }

  class catchAllCellTypeParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get cellTypeIdCell() {
      return this.getWord(1)
    }
  }

  class cellParserParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get cellParserCell() {
      return this.getWord(1)
    }
  }

  class catchAllParserParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get parserIdCell() {
      return this.getWord(1)
    }
  }

  class cellsParser extends abstractParserRuleParser {
    get cellTypeIdCell() {
      return this.getWordsFrom(0)
    }
  }

  class compilerParser extends abstractParserRuleParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        undefined,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), {
          closeSubparticles: closeSubparticlesParser,
          indentCharacter: indentCharacterParser,
          catchAllCellDelimiter: catchAllCellDelimiterParser,
          openSubparticles: openSubparticlesParser,
          stringTemplate: stringTemplateParser,
          joinSubparticlesWith: joinSubparticlesWithParser
        }),
        undefined
      )
    }
  }

  class parserDescriptionParser extends abstractParserRuleParser {
    get stringCell() {
      return this.getWordsFrom(0)
    }
  }

  class cellTypeDescriptionParser extends ParserBackedParticle {
    get stringCell() {
      return this.getWordsFrom(0)
    }
  }

  class exampleParser extends abstractParserRuleParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllExampleLineParser, undefined, undefined)
    }
    get exampleAnyCell() {
      return this.getWordsFrom(0)
    }
  }

  class extendsParserParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get parserIdCell() {
      return this.getWord(1)
    }
  }

  class popularityParser extends abstractParserRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get floatCell() {
      return parseFloat(this.getWord(1))
    }
  }

  class inScopeParser extends abstractParserRuleParser {
    get parserIdCell() {
      return this.getWordsFrom(0)
    }
  }

  class javascriptParser extends abstractParserRuleParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllJavascriptCodeLineParser, undefined, undefined)
    }
    format() {
      if (this.isNodeJs()) {
        const template = `class FOO{ ${this.subparticlesToString()}}`
        this.setSubparticles(
          require("prettier")
            .format(template, { semi: false, useTabs: true, parser: "babel", printWidth: 240 })
            .replace(/class FOO \{\s+/, "")
            .replace(/\s+\}\s+$/, "")
            .replace(/\n\t/g, "\n") // drop one level of indent
            .replace(/\t/g, " ") // we used tabs instead of spaces to be able to dedent without breaking literals.
        )
      }
      return this
    }
  }

  class abstractParseRuleParser extends abstractParserRuleParser {}

  class cruxParser extends abstractParseRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get stringCell() {
      return this.getWord(1)
    }
  }

  class cruxFromIdParser extends abstractParseRuleParser {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
  }

  class patternParser extends abstractParseRuleParser {
    get regexCell() {
      return this.getWordsFrom(0)
    }
  }

  class requiredParser extends abstractParserRuleParser {}

  class abstractValidationRuleParser extends abstractParserRuleParser {
    get boolCell() {
      return this.getWordsFrom(0)
    }
  }

  class singleParser extends abstractValidationRuleParser {}

  class uniqueLineParser extends abstractValidationRuleParser {}

  class uniqueFirstWordParser extends abstractValidationRuleParser {}

  class listDelimiterParser extends abstractParserRuleParser {
    get stringCell() {
      return this.getWordsFrom(0)
    }
  }

  class contentKeyParser extends abstractParserRuleParser {
    get stringCell() {
      return this.getWordsFrom(0)
    }
  }

  class subparticlesKeyParser extends abstractParserRuleParser {
    get stringCell() {
      return this.getWordsFrom(0)
    }
  }

  class tagsParser extends abstractParserRuleParser {
    get tagCell() {
      return this.getWordsFrom(0)
    }
  }

  class catchAllErrorParser extends ParserBackedParticle {
    getErrors() {
      return this._getErrorParserErrors()
    }
  }

  class catchAllExampleLineParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllExampleLineParser, undefined, undefined)
    }
    get exampleAnyCell() {
      return this.getWord(0)
    }
    get exampleAnyCell() {
      return this.getWordsFrom(1)
    }
  }

  class catchAllJavascriptCodeLineParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllJavascriptCodeLineParser, undefined, undefined)
    }
    get javascriptCodeCell() {
      return this.getWordsFrom(0)
    }
  }

  class catchAllMultilineStringConstantParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllMultilineStringConstantParser, undefined, undefined)
    }
    get stringCell() {
      return this.getWord(0)
    }
    get stringCell() {
      return this.getWordsFrom(1)
    }
  }

  class cellTypeDefinitionParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        undefined,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), {
          description: cellTypeDescriptionParser,
          enumFromCellTypes: enumFromCellTypesParser,
          enum: enumParser,
          examples: examplesParser,
          min: cellMinParser,
          max: cellMaxParser,
          paint: paintParser,
          regex: regexParser,
          reservedWords: reservedWordsParser,
          "//": slashCommentParser,
          extends: extendsCellTypeParser
        }),
        undefined
      )
    }
    get cellTypeIdCell() {
      return this.getWord(0)
    }
  }

  class enumFromCellTypesParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get cellTypeIdCell() {
      return this.getWordsFrom(1)
    }
  }

  class enumParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get enumOptionCell() {
      return this.getWordsFrom(1)
    }
  }

  class examplesParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get cellExampleCell() {
      return this.getWordsFrom(1)
    }
  }

  class cellMinParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get numericCell() {
      return this.getWord(1)
    }
  }

  class cellMaxParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get numericCell() {
      return this.getWord(1)
    }
  }

  class paintParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get paintTypeCell() {
      return this.getWord(1)
    }
  }

  class rootFlagParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
  }

  class parserDefinitionParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        catchAllErrorParser,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstWordMapAsObject()), {
          boolean: booleanParser,
          float: floatParser,
          int: intParser,
          string: stringParser,
          compilesTo: compilesToParser,
          extensions: extensionsParser,
          baseParser: baseParserParser,
          catchAllCellType: catchAllCellTypeParser,
          cellParser: cellParserParser,
          catchAllParser: catchAllParserParser,
          cells: cellsParser,
          compiler: compilerParser,
          description: parserDescriptionParser,
          example: exampleParser,
          extends: extendsParserParser,
          popularity: popularityParser,
          inScope: inScopeParser,
          javascript: javascriptParser,
          crux: cruxParser,
          cruxFromId: cruxFromIdParser,
          pattern: patternParser,
          required: requiredParser,
          single: singleParser,
          uniqueLine: uniqueLineParser,
          uniqueFirstWord: uniqueFirstWordParser,
          listDelimiter: listDelimiterParser,
          contentKey: contentKeyParser,
          subparticlesKey: subparticlesKeyParser,
          tags: tagsParser,
          root: rootFlagParser,
          "//": slashCommentParser
        }),
        [{ regex: /^[a-zA-Z0-9_]+Parser$/, parser: parserDefinitionParser }]
      )
    }
    get parserIdCell() {
      return this.getWord(0)
    }
  }

  class regexParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get regexCell() {
      return this.getWordsFrom(1)
    }
  }

  class reservedWordsParser extends ParserBackedParticle {
    get cellPropertyNameCell() {
      return this.getWord(0)
    }
    get reservedWordCell() {
      return this.getWordsFrom(1)
    }
  }

  class commentLineParser extends ParserBackedParticle {
    get commentCell() {
      return this.getWordsFrom(0)
    }
  }

  class slashCommentParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(commentLineParser, undefined, undefined)
    }
    get commentCell() {
      return this.getWordsFrom(0)
    }
  }

  class extendsCellTypeParser extends ParserBackedParticle {
    get propertyKeywordCell() {
      return this.getWord(0)
    }
    get cellTypeIdCell() {
      return this.getWord(1)
    }
  }

  module.exports = parsersParser
  parsersParser

  if (!module.parent) new parsersParser(Particle.fromDisk(process.argv[2]).toString()).execute()
}
