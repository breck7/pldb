#! /usr/bin/env node
{
  const { Utils } = require("./Utils.js")
  const { Particle } = require("./Particle.js")
  const { HandParsersProgram } = require("./Parsers.js")
  const { ParserBackedParticle } = require("./Parsers.js")

  class parsersParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllErrorParser, Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), { "//": slashCommentParser }), [
        { regex: /^$/, parser: blankLineParser },
        { regex: /^[a-zA-Z0-9_]+Atom$/, parser: atomTypeDefinitionParser },
        { regex: /^[a-zA-Z0-9_]+Parser$/, parser: parserDefinitionParser }
      ])
    }
    static cachedHandParsersProgramRoot =
      new HandParsersProgram(`// todo Add imports parsers, along with source maps, so we can correctly support parsers split across multiple files, and better enable parsers from compositions of reusable bits?
// todo Do error checking for if you have a firstatomAtomType, atoms, and/or catchAllAtomType with same name.
// todo Add enumOption root level type?
// todo compile atoms. add javascript property. move getRunTimeEnumOptions to atoms.

// Atom Parsers
abstractConstantAtom
 paint entity.name.tag

javascriptSafeAlphaNumericIdentifierAtom
 regex [a-zA-Z0-9_]+
 reservedAtoms enum extends function static if while export return class for default require var let const new

anyAtom

baseParsersAtom
 description There are a few classes of special parsers. BlobParsers don't have their subparticles parsed. Error particles always report an error.
 // todo Remove?
 enum blobParser errorParser
 paint variable.parameter

boolAtom
 enum true false
 paint constant.numeric

atomParserAtom
 enum prefix postfix omnifix
 paint constant.numeric

atomPropertyNameAtom
 paint variable.parameter

atomTypeIdAtom
 examples intAtom keywordAtom someCustomAtom
 extends javascriptSafeAlphaNumericIdentifierAtom
 enumFromAtomTypes atomTypeIdAtom
 paint storage

constantIdentifierAtom
 examples someId myVar
 // todo Extend javascriptSafeAlphaNumericIdentifier
 regex [a-zA-Z]\\w+
 paint constant.other
 description A atom that can be assigned to the parser in the target language.

constructorFilePathAtom

enumOptionAtom
 // todo Add an enumOption top level type, so we can add data to an enum option such as a description.
 paint string

atomExampleAtom
 description Holds an example for a atom with a wide range of options.
 paint string

extraAtom
 paint invalid

fileExtensionAtom
 examples js txt doc exe
 regex [a-zA-Z0-9]+
 paint string

numericAtom
 description A float or an int.
 paint constant.numeric

floatAtom
 regex \\-?[0-9]*\\.?[0-9]*
 paint constant.numeric

intAtom
 regex \\-?[0-9]+
 paint constant.numeric

javascriptCodeAtom

lowercaseAtom
 regex [a-z]+

parserIdAtom
 examples commentParser addParser
 description This doubles as the class name in Javascript. If this begins with \`abstract\`, then the parser will be considered an abstract parser, which cannot be used by itself but provides common functionality to parsers that extend it.
 paint variable.parameter
 extends javascriptSafeAlphaNumericIdentifierAtom
 enumFromAtomTypes parserIdAtom

propertyKeywordAtom
 paint constant.language

regexAtom
 paint string.regexp

reservedAtomAtom
 description A atom that a atom cannot contain.
 paint string

paintTypeAtom
 enum comment comment.block comment.block.documentation comment.line constant constant.character.escape constant.language constant.numeric constant.numeric.complex constant.numeric.complex.imaginary constant.numeric.complex.real constant.numeric.float constant.numeric.float.binary constant.numeric.float.decimal constant.numeric.float.hexadecimal constant.numeric.float.octal constant.numeric.float.other constant.numeric.integer constant.numeric.integer.binary constant.numeric.integer.decimal constant.numeric.integer.hexadecimal constant.numeric.integer.octal constant.numeric.integer.other constant.other constant.other.placeholder entity entity.name entity.name.class entity.name.class.forward-decl entity.name.constant entity.name.enum entity.name.function entity.name.function.constructor entity.name.function.destructor entity.name.impl entity.name.interface entity.name.label entity.name.namespace entity.name.section entity.name.struct entity.name.tag entity.name.trait entity.name.type entity.name.union entity.other.attribute-name entity.other.inherited-class invalid invalid.deprecated invalid.illegal keyword keyword.control keyword.control.conditional keyword.control.import keyword.declaration keyword.operator keyword.operator.arithmetic keyword.operator.assignment keyword.operator.bitwise keyword.operator.logical keyword.operator.atom keyword.other markup markup.bold markup.deleted markup.heading markup.inserted markup.italic markup.list.numbered markup.list.unnumbered markup.other markup.quote markup.raw.block markup.raw.inline markup.underline markup.underline.link meta meta.annotation meta.annotation.identifier meta.annotation.parameters meta.block meta.braces meta.brackets meta.class meta.enum meta.function meta.function-call meta.function.parameters meta.function.return-type meta.generic meta.group meta.impl meta.interface meta.interpolation meta.namespace meta.paragraph meta.parens meta.path meta.preprocessor meta.string meta.struct meta.tag meta.toc-list meta.trait meta.type meta.union punctuation punctuation.accessor punctuation.definition.annotation punctuation.definition.comment punctuation.definition.generic.begin punctuation.definition.generic.end punctuation.definition.keyword punctuation.definition.string.begin punctuation.definition.string.end punctuation.definition.variable punctuation.section.block.begin punctuation.section.block.end punctuation.section.braces.begin punctuation.section.braces.end punctuation.section.brackets.begin punctuation.section.brackets.end punctuation.section.group.begin punctuation.section.group.end punctuation.section.interpolation.begin punctuation.section.interpolation.end punctuation.section.parens.begin punctuation.section.parens.end punctuation.separator punctuation.separator.continuation punctuation.terminator source source.language-suffix.embedded storage storage.modifier storage.type storage.type keyword.declaration.type storage.type.class keyword.declaration.class storage.type.enum keyword.declaration.enum storage.type.function keyword.declaration.function storage.type.impl keyword.declaration.impl storage.type.interface keyword.declaration.interface storage.type.struct keyword.declaration.struct storage.type.trait keyword.declaration.trait storage.type.union keyword.declaration.union string string.quoted.double string.quoted.other string.quoted.single string.quoted.triple string.regexp string.unquoted support support.class support.constant support.function support.module support.type text text.html text.xml variable variable.annotation variable.function variable.language variable.other variable.other.constant variable.other.member variable.other.readwrite variable.parameter
 paint string

scriptUrlAtom

semanticVersionAtom
 examples 1.0.0 2.2.1
 regex [0-9]+\\.[0-9]+\\.[0-9]+
 paint constant.numeric

stringAtom
 paint string
 examples lorem ipsum

tagAtom
 paint string

atomAtom
 regex [a-zA-Z]+
 paint variable.parameter

exampleAnyAtom
 examples lorem ipsem
 // todo Eventually we want to be able to parse correctly the examples.
 paint comment
 extends stringAtom

blankAtom

commentAtom
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
 inScope slashCommentParser blankLineParser atomTypeDefinitionParser parserDefinitionParser

blankLineParser
 description Blank lines are OK in Parsers.
 atoms blankAtom
 pattern ^$
 tags doNotSynthesize

abstractCompilerRuleParser
 catchAllAtomType anyAtom
 atoms propertyKeywordAtom

closeSubparticlesParser
 extends abstractCompilerRuleParser
 description When compiling a parent particle to a string, this string is appended to the compiled and joined subparticles. Default is blank.
 cruxFromId

indentCharacterParser
 extends abstractCompilerRuleParser
 description You can change the indent character for compiled subparticles. Default is a space.
 cruxFromId

catchAllAtomDelimiterParser
 description If a particle has a catchAllAtom, this is the string delimiter that will be used to join those atoms. Default is comma.
 extends abstractCompilerRuleParser
 cruxFromId

openSubparticlesParser
 extends abstractCompilerRuleParser
 description When compiling a parent particle to a string, this string is prepended to the compiled and joined subparticles. Default is blank.
 cruxFromId

stringTemplateParser
 extends abstractCompilerRuleParser
 description This template string is used to compile this line, and accepts strings of the format: const var = {someAtomId}
 cruxFromId

joinSubparticlesWithParser
 description When compiling a parent particle to a string, subparticles are compiled to strings and joined by this character. Default is a newline.
 extends abstractCompilerRuleParser
 cruxFromId

abstractConstantParser
 description A constant.
 atoms propertyKeywordAtom
 cruxFromId
 // todo: make tags inherit
 tags actPhase

booleanParser
 atoms propertyKeywordAtom constantIdentifierAtom
 catchAllAtomType boolAtom
 extends abstractConstantParser
 tags actPhase

floatParser
 atoms propertyKeywordAtom constantIdentifierAtom
 catchAllAtomType floatAtom
 extends abstractConstantParser
 tags actPhase

intParser
 atoms propertyKeywordAtom constantIdentifierAtom
 catchAllAtomType intAtom
 tags actPhase
 extends abstractConstantParser

stringParser
 atoms propertyKeywordAtom constantIdentifierAtom
 catchAllAtomType stringAtom
 catchAllParser catchAllMultilineStringConstantParser
 extends abstractConstantParser
 tags actPhase

abstractParserRuleParser
 single
 atoms propertyKeywordAtom

compilesToParser
 atoms propertyKeywordAtom fileExtensionAtom
 extends abstractParserRuleParser
 description File extension for simple compilers.
 // todo: deprecate?
 // Optionally specify a file extension that will be used when compiling your language to a file. Generally used on parsers marked root.
 cruxFromId
 tags experimental

extensionsParser
 extends abstractParserRuleParser
 catchAllAtomType fileExtensionAtom
 description File extension for your dialect.
 // File extensions of your language. Generally used for parsers marked "root". Sometimes your language might have multiple extensions. If you don't add this, the root particle's parserId will be used as the default file extension.
 cruxFromId
 tags deprecate

abstractNonTerminalParserRuleParser
 extends abstractParserRuleParser

baseParserParser
 atoms propertyKeywordAtom baseParsersAtom
 description Set for blobs or errors. 
 // In rare cases with untyped content you can use a blobParser, for now, to skip parsing for performance gains. The base errorParser will report errors when parsed. Use that if you don't want to implement your own error parser.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

catchAllAtomTypeParser
 atoms propertyKeywordAtom atomTypeIdAtom
 description Use for lists.
 // Aka 'listAtomType'. Use this when the value in a key/value pair is a list. If there are extra atoms in the particle's line, parse these atoms as this type. Often used with \`listDelimiterParser\`.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

atomParserParser
 atoms propertyKeywordAtom atomParserAtom
 description Set parsing strategy.
 // prefix/postfix/omnifix parsing strategy. If missing, defaults to prefix.
 extends abstractParserRuleParser
 cruxFromId
 tags experimental analyzePhase

catchAllParserParser
 description Attach this to unmatched lines.
 // If a parser is not found in the inScope list, instantiate this type of particle instead.
 atoms propertyKeywordAtom parserIdAtom
 extends abstractParserRuleParser
 cruxFromId
 tags acquirePhase

atomsParser
 catchAllAtomType atomTypeIdAtom
 description Set required atomTypes.
 extends abstractParserRuleParser
 cruxFromId
 tags analyzePhase

compilerParser
 // todo Remove this and its subparticles?
 description For simple compilers.
 inScope stringTemplateParser catchAllAtomDelimiterParser openSubparticlesParser closeSubparticlesParser indentCharacterParser joinSubparticlesWithParser
 extends abstractParserRuleParser
 cruxFromId
 tags experimental

parserDescriptionParser
 description Parser description.
 catchAllAtomType stringAtom
 extends abstractParserRuleParser
 crux description
 tags assemblePhase

atomTypeDescriptionParser
 description Atom Type description.
 catchAllAtomType stringAtom
 crux description
 tags assemblePhase

exampleParser
 // todo Should this just be a "string" constant on particles?
 description Set example for docs and tests.
 catchAllAtomType exampleAnyAtom
 catchAllParser catchAllExampleLineParser
 extends abstractParserRuleParser
 cruxFromId
 tags assemblePhase

extendsParserParser
 crux extends
 tags assemblePhase
 description Extend another parser.
 // todo: add a catchall that is used for mixins
 atoms propertyKeywordAtom parserIdAtom
 extends abstractParserRuleParser

popularityParser
 // todo Remove this parser. Switch to conditional frequencies.
 description Parser popularity.
 atoms propertyKeywordAtom floatAtom
 extends abstractParserRuleParser
 cruxFromId
 tags assemblePhase

inScopeParser
 description Parsers in scope.
 catchAllAtomType parserIdAtom
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
 atoms propertyKeywordAtom stringAtom
 description Attach by matching first atom.
 extends abstractParseRuleParser
 tags acquirePhase

cruxFromIdParser
 atoms propertyKeywordAtom
 description Derive crux from parserId.
 // for example 'fooParser' would have crux of 'foo'.
 extends abstractParseRuleParser
 tags acquirePhase

patternParser
 catchAllAtomType regexAtom
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
 catchAllAtomType boolAtom

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

uniqueFirstAtomParser
 description Assert unique first atoms. For pattern parsers.
 // For catch all parsers or pattern particles, use this to indicate the 
 extends abstractValidationRuleParser
 tags analyzePhase

listDelimiterParser
 description Split content by this delimiter.
 extends abstractParserRuleParser
 cruxFromId
 catchAllAtomType stringAtom
 tags analyzePhase


contentKeyParser
 description Deprecated. For to/from JSON.
 // Advanced keyword to help with isomorphic JSON serialization/deserialization. If present will serialize the particle to an object and set a property with this key and the value set to the particle's content.
 extends abstractParserRuleParser
 cruxFromId
 catchAllAtomType stringAtom
 tags deprecate
subparticlesKeyParser
 // todo: deprecate?
 description Deprecated. For to/from JSON.
 // Advanced keyword to help with serialization/deserialization of blobs. If present will serialize the particle to an object and set a property with this key and the value set to the particle's subparticles.
 extends abstractParserRuleParser
 cruxFromId
 catchAllAtomType stringAtom
 tags deprecate

tagsParser
 catchAllAtomType tagAtom
 extends abstractParserRuleParser
 description Custom metadata.
 cruxFromId
 tags assemblePhase

catchAllErrorParser
 baseParser errorParser

catchAllExampleLineParser
 catchAllAtomType exampleAnyAtom
 catchAllParser catchAllExampleLineParser
 atoms exampleAnyAtom

catchAllJavascriptCodeLineParser
 catchAllAtomType javascriptCodeAtom
 catchAllParser catchAllJavascriptCodeLineParser

catchAllMultilineStringConstantParser
 description String constants can span multiple lines.
 catchAllAtomType stringAtom
 catchAllParser catchAllMultilineStringConstantParser
 atoms stringAtom


atomTypeDefinitionParser
 // todo Generate a class for each atom type?
 // todo Allow abstract atom types?
 // todo Change pattern to postfix.
 pattern ^[a-zA-Z0-9_]+Atom$
 inScope paintParser regexParser reservedAtomsParser enumFromAtomTypesParser atomTypeDescriptionParser enumParser slashCommentParser extendsAtomTypeParser examplesParser atomMinParser atomMaxParser
 atoms atomTypeIdAtom
 tags assemblePhase

// Enums
enumFromAtomTypesParser
 description Runtime enum options.
 catchAllAtomType atomTypeIdAtom
 atoms atomPropertyNameAtom
 cruxFromId
 tags analyzePhase

enumParser
 description Set enum options.
 cruxFromId
 catchAllAtomType enumOptionAtom
 atoms atomPropertyNameAtom
 tags analyzePhase

examplesParser
 description Examples for documentation and tests.
 // If the domain of possible atom values is large, such as a string type, it can help certain methods—such as program synthesis—to provide a few examples.
 cruxFromId
 catchAllAtomType atomExampleAtom
 atoms atomPropertyNameAtom
 tags assemblePhase

atomMinParser
 description Specify a min if numeric.
 crux min
 atoms atomPropertyNameAtom numericAtom
 tags analyzePhase

atomMaxParser
 description Specify a max if numeric.
 crux max
 atoms atomPropertyNameAtom numericAtom
 tags analyzePhase

paintParser
 atoms propertyKeywordAtom paintTypeAtom
 description Instructor editor how to color these.
 single
 cruxFromId
 tags analyzePhase

rootFlagParser
 crux root
 description Set root parser.
 // Mark a parser as root if it is the root of your language. The parserId will be the name of your language. The parserId will also serve as the default file extension, if you don't specify another. If more than 1 parser is marked as "root", the last one wins.
 atoms propertyKeywordAtom
 tags assemblePhase

parserDefinitionParser
 // todo Add multiple dispatch?
 pattern ^[a-zA-Z0-9_]+Parser$
 description Parser types are a core unit of your language. They translate to 1 class per parser. Examples of parser would be "header", "person", "if", "+", "define", etc.
 catchAllParser catchAllErrorParser
 inScope rootFlagParser abstractParserRuleParser abstractConstantParser slashCommentParser parserDefinitionParser
 atoms parserIdAtom
 tags assemblePhase

regexParser
 catchAllAtomType regexAtom
 description Atoms must match this.
 single
 atoms atomPropertyNameAtom
 cruxFromId
 tags analyzePhase

reservedAtomsParser
 single
 description Atoms can't be any of these.
 catchAllAtomType reservedAtomAtom
 atoms atomPropertyNameAtom
 cruxFromId
 tags analyzePhase

commentLineParser
 catchAllAtomType commentAtom

slashCommentParser
 description A comment.
 catchAllAtomType commentAtom
 crux //
 catchAllParser commentLineParser
 tags assemblePhase

extendsAtomTypeParser
 crux extends
 description Extend another atomType.
 // todo Add mixin support in addition to extends?
 atoms propertyKeywordAtom atomTypeIdAtom
 tags assemblePhase
 single`)
    get handParsersProgram() {
      return this.constructor.cachedHandParsersProgramRoot
    }
    static rootParser = parsersParser
  }

  class blankLineParser extends ParserBackedParticle {
    get blankAtom() {
      return this.getAtom(0)
    }
  }

  class abstractCompilerRuleParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get anyAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class closeSubparticlesParser extends abstractCompilerRuleParser {}

  class indentCharacterParser extends abstractCompilerRuleParser {}

  class catchAllAtomDelimiterParser extends abstractCompilerRuleParser {}

  class openSubparticlesParser extends abstractCompilerRuleParser {}

  class stringTemplateParser extends abstractCompilerRuleParser {}

  class joinSubparticlesWithParser extends abstractCompilerRuleParser {}

  class abstractConstantParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
  }

  class booleanParser extends abstractConstantParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get constantIdentifierAtom() {
      return this.getAtom(1)
    }
    get boolAtom() {
      return this.getAtomsFrom(2)
    }
  }

  class floatParser extends abstractConstantParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get constantIdentifierAtom() {
      return this.getAtom(1)
    }
    get floatAtom() {
      return this.getAtomsFrom(2).map(val => parseFloat(val))
    }
  }

  class intParser extends abstractConstantParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get constantIdentifierAtom() {
      return this.getAtom(1)
    }
    get intAtom() {
      return this.getAtomsFrom(2).map(val => parseInt(val))
    }
  }

  class stringParser extends abstractConstantParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllMultilineStringConstantParser, undefined, undefined)
    }
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get constantIdentifierAtom() {
      return this.getAtom(1)
    }
    get stringAtom() {
      return this.getAtomsFrom(2)
    }
  }

  class abstractParserRuleParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
  }

  class compilesToParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get fileExtensionAtom() {
      return this.getAtom(1)
    }
  }

  class extensionsParser extends abstractParserRuleParser {
    get fileExtensionAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class abstractNonTerminalParserRuleParser extends abstractParserRuleParser {}

  class baseParserParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get baseParsersAtom() {
      return this.getAtom(1)
    }
  }

  class catchAllAtomTypeParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get atomTypeIdAtom() {
      return this.getAtom(1)
    }
  }

  class atomParserParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get atomParserAtom() {
      return this.getAtom(1)
    }
  }

  class catchAllParserParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get parserIdAtom() {
      return this.getAtom(1)
    }
  }

  class atomsParser extends abstractParserRuleParser {
    get atomTypeIdAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class compilerParser extends abstractParserRuleParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        undefined,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), {
          closeSubparticles: closeSubparticlesParser,
          indentCharacter: indentCharacterParser,
          catchAllAtomDelimiter: catchAllAtomDelimiterParser,
          openSubparticles: openSubparticlesParser,
          stringTemplate: stringTemplateParser,
          joinSubparticlesWith: joinSubparticlesWithParser
        }),
        undefined
      )
    }
  }

  class parserDescriptionParser extends abstractParserRuleParser {
    get stringAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class atomTypeDescriptionParser extends ParserBackedParticle {
    get stringAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class exampleParser extends abstractParserRuleParser {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllExampleLineParser, undefined, undefined)
    }
    get exampleAnyAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class extendsParserParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get parserIdAtom() {
      return this.getAtom(1)
    }
  }

  class popularityParser extends abstractParserRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get floatAtom() {
      return parseFloat(this.getAtom(1))
    }
  }

  class inScopeParser extends abstractParserRuleParser {
    get parserIdAtom() {
      return this.getAtomsFrom(0)
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
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get stringAtom() {
      return this.getAtom(1)
    }
  }

  class cruxFromIdParser extends abstractParseRuleParser {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
  }

  class patternParser extends abstractParseRuleParser {
    get regexAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class requiredParser extends abstractParserRuleParser {}

  class abstractValidationRuleParser extends abstractParserRuleParser {
    get boolAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class singleParser extends abstractValidationRuleParser {}

  class uniqueLineParser extends abstractValidationRuleParser {}

  class uniqueFirstAtomParser extends abstractValidationRuleParser {}

  class listDelimiterParser extends abstractParserRuleParser {
    get stringAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class contentKeyParser extends abstractParserRuleParser {
    get stringAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class subparticlesKeyParser extends abstractParserRuleParser {
    get stringAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class tagsParser extends abstractParserRuleParser {
    get tagAtom() {
      return this.getAtomsFrom(0)
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
    get exampleAnyAtom() {
      return this.getAtom(0)
    }
    get exampleAnyAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class catchAllJavascriptCodeLineParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllJavascriptCodeLineParser, undefined, undefined)
    }
    get javascriptCodeAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class catchAllMultilineStringConstantParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(catchAllMultilineStringConstantParser, undefined, undefined)
    }
    get stringAtom() {
      return this.getAtom(0)
    }
    get stringAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class atomTypeDefinitionParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        undefined,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), {
          description: atomTypeDescriptionParser,
          enumFromAtomTypes: enumFromAtomTypesParser,
          enum: enumParser,
          examples: examplesParser,
          min: atomMinParser,
          max: atomMaxParser,
          paint: paintParser,
          regex: regexParser,
          reservedAtoms: reservedAtomsParser,
          "//": slashCommentParser,
          extends: extendsAtomTypeParser
        }),
        undefined
      )
    }
    get atomTypeIdAtom() {
      return this.getAtom(0)
    }
  }

  class enumFromAtomTypesParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get atomTypeIdAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class enumParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get enumOptionAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class examplesParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get atomExampleAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class atomMinParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get numericAtom() {
      return this.getAtom(1)
    }
  }

  class atomMaxParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get numericAtom() {
      return this.getAtom(1)
    }
  }

  class paintParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get paintTypeAtom() {
      return this.getAtom(1)
    }
  }

  class rootFlagParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
  }

  class parserDefinitionParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(
        catchAllErrorParser,
        Object.assign(Object.assign({}, super.createParserCombinator()._getFirstAtomMapAsObject()), {
          boolean: booleanParser,
          float: floatParser,
          int: intParser,
          string: stringParser,
          compilesTo: compilesToParser,
          extensions: extensionsParser,
          baseParser: baseParserParser,
          catchAllAtomType: catchAllAtomTypeParser,
          atomParser: atomParserParser,
          catchAllParser: catchAllParserParser,
          atoms: atomsParser,
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
          uniqueFirstAtom: uniqueFirstAtomParser,
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
    get parserIdAtom() {
      return this.getAtom(0)
    }
  }

  class regexParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get regexAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class reservedAtomsParser extends ParserBackedParticle {
    get atomPropertyNameAtom() {
      return this.getAtom(0)
    }
    get reservedAtomAtom() {
      return this.getAtomsFrom(1)
    }
  }

  class commentLineParser extends ParserBackedParticle {
    get commentAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class slashCommentParser extends ParserBackedParticle {
    createParserCombinator() {
      return new Particle.ParserCombinator(commentLineParser, undefined, undefined)
    }
    get commentAtom() {
      return this.getAtomsFrom(0)
    }
  }

  class extendsAtomTypeParser extends ParserBackedParticle {
    get propertyKeywordAtom() {
      return this.getAtom(0)
    }
    get atomTypeIdAtom() {
      return this.getAtom(1)
    }
  }

  module.exports = parsersParser
  parsersParser

  if (!module.parent) new parsersParser(Particle.fromDisk(process.argv[2]).toString()).execute()
}
