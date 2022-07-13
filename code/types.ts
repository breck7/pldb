// GitHub has a set of supported languages.
export interface githubLanguageNode {
  fileExtensions?: any // What file extensions does GitHub use for this language type?
  trendingProjects?: any // Projects in this language trending on GitHub.
  trendingProjectsCount?: any // How many trending repos for this language does GitHub report?
}

export enum githubLanguageNodeKeywords {
  trendingProjectsCount = "trendingProjectsCount",
  fileExtensions = "fileExtensions",
  trendingProjects = "trendingProjects"
}
// URL of the official GitHub repo for the language project if it hosted there.
export interface githubRepoNode {
  created?: any // When was the *Github repo* for this entity created?
  description?: any // Description of the repo on GitHub.
  firstCommit?: any // What year the first commit made in this git repo?
  forks?: any // How many forks of the repo?
  issues?: any // How many isses on the repo?
  stars?: any // How many stars of the repo?
  subscribers?: any // How many subscribers to the repo?
  updated?: any // What year was the last commit made?
}

export enum githubRepoNodeKeywords {
  subscribers = "subscribers",
  forks = "forks",
  stars = "stars",
  issues = "issues",
  created = "created",
  updated = "updated",
  firstCommit = "firstCommit",
  description = "description"
}
// Linguist is a library used by GitHub to syntax highlight files on GitHub via a grammar. The list of languages supported by Linguist and the grammar package used for each language is listed here: https://github.com/github/linguist/blob/master/vendor/README.md. If Linguist has support for a language, it will have a repo on GitHub.
export interface linguistGrammarRepoNode {
  commitCount?: any // How many commits in this repo?
  committerCount?: any // How many people have made commits in this repo?
  example?: any // An example snippet from the relevant Linguist Grammar package.
  firstCommit?: any // What year was the first commit made?
  lastCommit?: any // What year was the last commit made?
  sampleCount?: any // How many language samples in this repo?
}

export enum linguistGrammarRepoNodeKeywords {
  commitCount = "commitCount",
  sampleCount = "sampleCount",
  committerCount = "committerCount",
  firstCommit = "firstCommit",
  lastCommit = "lastCommit",
  example = "example"
}
export interface patternsNode {
  "canBeCompiledToObjectFiles?"?: any
  "canDoFindAllReferences?"?: any
  "canDoGoToDefinition?"?: any
  "canDoRename?"?: any
  "canDoShebang?"?: any
  "canReadCommandLineArgs?"?: any
  "canUseQuestionMarksAsPartOfIdentifier?"?: any
  "canWriteToDisk?"?: any
  "doesEndOfLineEqualEndOfStatement?"?: any
  "has1DArrays?"?: any
  "hasAbstractTypes?"?: any
  "hasAccessModifiers?"?: any
  "hasAdditionOperator?"?: any
  "hasAlebraicDataTypes?"?: any
  "hasAnonymousFunctions?"?: any
  "hasArraySlicingSyntax?"?: any
  "hasAssertStatements?"?: any
  "hasAssignmentCharacter?"?: any
  "hasAssociativeArrays?"?: any
  "hasAsyncAwait?"?: any
  "hasBinaryOperators?"?: any
  "hasBitWiseOperators?"?: any
  "hasMultiLineComments?"?: any
  "hasBlockScope?"?: any
  "hasBlocks?"?: any
  "hasBooleans?"?: any
  "hasBoundedCheckedArrays?"?: any
  "hasBreak?"?: any
  "hasBuiltInRegex?"?: any
  "hasCExtensions?"?: any
  "hasCaseInsensitiveIdentifiers?"?: any
  "hasCentralPackageRepository?"?: any
  "hasChars?"?: any
  "hasClasses?"?: any
  "hasComments?"?: any
  "hasComplex?"?: any
  "hasCompositeTypes?"?: any
  "hasConditionals?"?: any
  "hasConstants?"?: any
  "hasConstructors?"?: any
  "hasContinue?"?: any
  "hasDependentTypes?"?: any
  "hasDeterminantOperator?"?: any
  "hasDictionaryType?"?: any
  "hasDirectives?"?: any
  "hasDisposeBlocks?"?: any
  "hasDoWhileLoops?"?: any
  "hasDocComments?"?: any
  "hasDualQuoteEscaping?"?: any
  "hasDuckTyping?"?: any
  "hasDynamicProperties?"?: any
  "hasDynamicSizedArrays?"?: any
  "hasDynamicTyping?"?: any
  "hasEnums?"?: any
  "hasEscapeCharacters?"?: any
  "hasExceptions?"?: any
  "hasExplicitTypeCasting?"?: any
  "hasExports?"?: any
  "hasExpressions?"?: any
  "hasFileScope?"?: any
  "hasFinally?"?: any
  "hasFirstClassFunctions?"?: any
  "hasFloats?"?: any
  "hasFnArgumentTypeDeclarations?"?: any
  "hasFnArguments?"?: any
  "hasForEachLoops?"?: any
  "hasForLoops?"?: any
  "hasFunctionOverloading?"?: any
  "hasFunctionScope?"?: any
  "hasFunctions?"?: any
  "hasGarbageCollection?"?: any
  "hasGenerators?"?: any
  "hasGenerics?"?: any
  "hasGlobalScope?"?: any
  "hasGotos?"?: any
  "hasHereDocs?"?: any
  "hasIdentifiers?"?: any
  "hasIfElses?"?: any
  "hasIfs?"?: any
  "hasImplicitArguments?"?: any
  "hasImplicitTypeConversions?"?: any
  "hasImports?"?: any
  "hasIncrementAndDecrementOperators?"?: any
  "hasInfixNotation?"?: any
  "hasInheritance?"?: any
  "hasIntegers?"?: any
  "hasInterfaces?"?: any
  "hasInterpolatedStrings?"?: any
  "hasIterators?"?: any
  "hasJavaExtensions?"?: any
  "hasLabels?"?: any
  "hasLazyEval?"?: any
  "hasLazyEvaluation?"?: any
  "hasLineContinuations?"?: any
  "hasLineContinuatorCharacter?"?: any
  "hasLinkers?"?: any
  "hasListComprehension?"?: any
  "hasMacros?"?: any
  "hasMagicGettersAndSetters?"?: any
  "hasManualMemoryManagement?"?: any
  "hasMapFunctions?"?: any
  "hasMathLikeNotation?"?: any
  "hasMemberVariables?"?: any
  "hasMethodChaining?"?: any
  "hasMethodOverloading?"?: any
  "hasMethods?"?: any
  "hasMixins?"?: any
  "hasModules?"?: any
  "hasMonads?"?: any
  "hasMultidimensionalArrays?"?: any
  "hasMultilineStrings?"?: any
  "hasMultipleDispatch?"?: any
  "hasMultipleInheritance?"?: any
  "hasNamespaces?"?: any
  "hasNestedFunctions?"?: any
  "hasNoKeywords?"?: any
  "hasNull?"?: any
  "hasObjectConstructors?"?: any
  "hasObjects?"?: any
  "hasOperatorOverloading?"?: any
  "hasPartialApplication?"?: any
  "hasPassByValue?"?: any
  "hasPatternMatching?"?: any
  "hasPipes?"?: any
  "hasPointers?"?: any
  "hasPolymorphicListType?"?: any
  "hasPolymorphism?"?: any
  "hasPostfixNotation?"?: any
  "hasPrefixNotation?"?: any
  "hasPrintStatements?"?: any
  "hasProcessorRegisters?"?: any
  "hasProtected?"?: any
  "hasQuoteEscaping?"?: any
  "hasQuotedRawStrings?"?: any
  "hasReferences?"?: any
  "hasRefinementTypes?"?: any
  "hasRegularExpressions?"?: any
  "hasRequiredMainFunction?"?: any
  "hasReservedWords?"?: any // Are things like keywords reserved words?
  "hasRunTimeGuards?"?: any
  "hasRunTimeTyping?"?: any
  "hasSelfOrThisWord?"?: any
  "hasSemanticIndentation?"?: any
  "hasSemaphores?"?: any
  "hasSignificantLines?"?: any
  "hasSingleDispatch?"?: any
  "hasSingleTypeArrays?"?: any // Has an array data structure that only can hold items of the same type.
  "hasSourceMaps?"?: any
  "hasSpecifiableBaseIndex?"?: any
  "hasStatementTerminatorCharacter?"?: any
  "hasStatements?"?: any
  "hasStaticTyping?"?: any
  "hasStreams?"?: any
  "hasStringConcatOperator?"?: any
  "hasStrings?"?: any
  "hasStructs?"?: any
  "hasSuper?"?: any
  "hasSwitch?"?: any
  "hasSymbolTables?"?: any
  "hasSyntaxForMatrixOps?"?: any
  "hasTemplates?"?: any
  "hasTernaryOperators?"?: any
  "hasTraits?"?: any
  "hasTransposeOperator?"?: any
  "hasTryCatch?"?: any
  "hasTuples?"?: any
  "hasTypeDeclarations?"?: any
  "hasTypeInference?"?: any
  "hasTypeParameters?"?: any
  "hasTypedHoles?"?: any
  "hasUnaryOperators?"?: any
  "hasUnicodeIdentifiers?"?: any
  "hasUnionTypes?"?: any
  "hasUserDefinedOperators?"?: any
  "hasValueReturnedFunctions?"?: any
  "hasVariableAssignment?"?: any
  "hasVariableDeclarations?"?: any
  "hasVariadicFunctions?"?: any
  "hasVars?"?: any
  "hasVectorizedOperations?"?: any
  "hasVoidFunctions?"?: any
  "hasWhileLoops?"?: any
  "hasZeroBasedNumbering?"?: any
  "hasZippers?"?: any
  "hashHighLevelDataTypes?"?: any
  "isCaseSensitive?"?: any
  "isInterpreted?"?: any
  "isLisp?"?: any
  "letterFirstIdentifiers?"?: any // Must identifiers start with a letter?
  "mergesWhitespace?"?: any
  "supportsBreakpoints?"?: any
}

export enum patternsNodeKeywords {
  "hasReservedWords?" = "hasReservedWords?",
  "hasRegularExpressions?" = "hasRegularExpressions?",
  "hasRunTimeGuards?" = "hasRunTimeGuards?",
  "hasAbstractTypes?" = "hasAbstractTypes?",
  "hasAsyncAwait?" = "hasAsyncAwait?",
  "hasTypedHoles?" = "hasTypedHoles?",
  "hasRefinementTypes?" = "hasRefinementTypes?",
  "hasMonads?" = "hasMonads?",
  "isLisp?" = "isLisp?",
  "hasUserDefinedOperators?" = "hasUserDefinedOperators?",
  "hasBinaryOperators?" = "hasBinaryOperators?",
  "hasUnaryOperators?" = "hasUnaryOperators?",
  "hasMapFunctions?" = "hasMapFunctions?",
  "hasPartialApplication?" = "hasPartialApplication?",
  "supportsBreakpoints?" = "supportsBreakpoints?",
  "hasPointers?" = "hasPointers?",
  "canWriteToDisk?" = "canWriteToDisk?",
  "hasDuckTyping?" = "hasDuckTyping?",
  "hasAssertStatements?" = "hasAssertStatements?",
  "mergesWhitespace?" = "mergesWhitespace?",
  "hasGenerics?" = "hasGenerics?",
  "hasPolymorphism?" = "hasPolymorphism?",
  "canBeCompiledToObjectFiles?" = "canBeCompiledToObjectFiles?",
  "hasSingleDispatch?" = "hasSingleDispatch?",
  "hasMultipleDispatch?" = "hasMultipleDispatch?",
  "canDoGoToDefinition?" = "canDoGoToDefinition?",
  "hasBitWiseOperators?" = "hasBitWiseOperators?",
  "canDoShebang?" = "canDoShebang?",
  "canDoFindAllReferences?" = "canDoFindAllReferences?",
  "canDoRename?" = "canDoRename?",
  "canReadCommandLineArgs?" = "canReadCommandLineArgs?",
  "canUseQuestionMarksAsPartOfIdentifier?" = "canUseQuestionMarksAsPartOfIdentifier?",
  "hasUnicodeIdentifiers?" = "hasUnicodeIdentifiers?",
  "doesEndOfLineEqualEndOfStatement?" = "doesEndOfLineEqualEndOfStatement?",
  "has1DArrays?" = "has1DArrays?",
  "hasAdditionOperator?" = "hasAdditionOperator?",
  "hasAlebraicDataTypes?" = "hasAlebraicDataTypes?",
  "hasArraySlicingSyntax?" = "hasArraySlicingSyntax?",
  "hasSourceMaps?" = "hasSourceMaps?",
  "hasSymbolTables?" = "hasSymbolTables?",
  "hasAssignmentCharacter?" = "hasAssignmentCharacter?",
  "hasProcessorRegisters?" = "hasProcessorRegisters?",
  "hasAssociativeArrays?" = "hasAssociativeArrays?",
  "hasDynamicProperties?" = "hasDynamicProperties?",
  "hasBlocks?" = "hasBlocks?",
  "hasMagicGettersAndSetters?" = "hasMagicGettersAndSetters?",
  "hasBlockScope?" = "hasBlockScope?",
  "hasBooleans?" = "hasBooleans?",
  "hasBoundedCheckedArrays?" = "hasBoundedCheckedArrays?",
  "hasBreak?" = "hasBreak?",
  "hasBuiltInRegex?" = "hasBuiltInRegex?",
  "hasCentralPackageRepository?" = "hasCentralPackageRepository?",
  "hasCExtensions?" = "hasCExtensions?",
  "hasMethodChaining?" = "hasMethodChaining?",
  "hasChars?" = "hasChars?",
  "hasClasses?" = "hasClasses?",
  "hasConditionals?" = "hasConditionals?",
  "hasComments?" = "hasComments?",
  "hasMultiLineComments?" = "hasMultiLineComments?",
  "hasDocComments?" = "hasDocComments?",
  "hasImplicitArguments?" = "hasImplicitArguments?",
  "hasComplex?" = "hasComplex?",
  "hasCompositeTypes?" = "hasCompositeTypes?",
  "hasStructs?" = "hasStructs?",
  "hasConstructors?" = "hasConstructors?",
  "hasZippers?" = "hasZippers?",
  "hasConstants?" = "hasConstants?",
  "hasContinue?" = "hasContinue?",
  "hasDependentTypes?" = "hasDependentTypes?",
  "hasDeterminantOperator?" = "hasDeterminantOperator?",
  "hasDictionaryType?" = "hasDictionaryType?",
  "hasDoWhileLoops?" = "hasDoWhileLoops?",
  "hasDualQuoteEscaping?" = "hasDualQuoteEscaping?",
  "hasDynamicSizedArrays?" = "hasDynamicSizedArrays?",
  "hasDynamicTyping?" = "hasDynamicTyping?",
  "hasEnums?" = "hasEnums?",
  "hasEscapeCharacters?" = "hasEscapeCharacters?",
  "hasExceptions?" = "hasExceptions?",
  "hasExpressions?" = "hasExpressions?",
  "hasFileScope?" = "hasFileScope?",
  "hasFinally?" = "hasFinally?",
  "hasFirstClassFunctions?" = "hasFirstClassFunctions?",
  "hasFloats?" = "hasFloats?",
  "hasFnArguments?" = "hasFnArguments?",
  "hasFnArgumentTypeDeclarations?" = "hasFnArgumentTypeDeclarations?",
  "hasForEachLoops?" = "hasForEachLoops?",
  "hasForLoops?" = "hasForLoops?",
  "hasFunctionScope?" = "hasFunctionScope?",
  "hasPatternMatching?" = "hasPatternMatching?",
  "hasGarbageCollection?" = "hasGarbageCollection?",
  "hasGenerators?" = "hasGenerators?",
  "hasGlobalScope?" = "hasGlobalScope?",
  "hasGotos?" = "hasGotos?",
  "hasHereDocs?" = "hasHereDocs?",
  "hashHighLevelDataTypes?" = "hashHighLevelDataTypes?",
  "hasDirectives?" = "hasDirectives?",
  "hasIdentifiers?" = "hasIdentifiers?",
  "hasIfElses?" = "hasIfElses?",
  "hasIfs?" = "hasIfs?",
  "hasImplicitTypeConversions?" = "hasImplicitTypeConversions?",
  "hasExplicitTypeCasting?" = "hasExplicitTypeCasting?",
  "hasImports?" = "hasImports?",
  "hasExports?" = "hasExports?",
  "hasInfixNotation?" = "hasInfixNotation?",
  "hasInterfaces?" = "hasInterfaces?",
  "hasInterpolatedStrings?" = "hasInterpolatedStrings?",
  "hasIntegers?" = "hasIntegers?",
  "hasIterators?" = "hasIterators?",
  "hasJavaExtensions?" = "hasJavaExtensions?",
  "hasLabels?" = "hasLabels?",
  "hasAnonymousFunctions?" = "hasAnonymousFunctions?",
  "hasLazyEval?" = "hasLazyEval?",
  "hasLazyEvaluation?" = "hasLazyEvaluation?",
  "hasLineContinuations?" = "hasLineContinuations?",
  "hasLineContinuatorCharacter?" = "hasLineContinuatorCharacter?",
  "hasLinkers?" = "hasLinkers?",
  "hasListComprehension?" = "hasListComprehension?",
  "hasMacros?" = "hasMacros?",
  "hasManualMemoryManagement?" = "hasManualMemoryManagement?",
  "hasMathLikeNotation?" = "hasMathLikeNotation?",
  "hasMemberVariables?" = "hasMemberVariables?",
  "hasFunctionOverloading?" = "hasFunctionOverloading?",
  "hasMethodOverloading?" = "hasMethodOverloading?",
  "hasMixins?" = "hasMixins?",
  "hasNamespaces?" = "hasNamespaces?",
  "hasMultidimensionalArrays?" = "hasMultidimensionalArrays?",
  "hasMultilineStrings?" = "hasMultilineStrings?",
  "hasMultipleInheritance?" = "hasMultipleInheritance?",
  "hasNestedFunctions?" = "hasNestedFunctions?",
  "hasNoKeywords?" = "hasNoKeywords?",
  "hasNull?" = "hasNull?",
  "hasObjectConstructors?" = "hasObjectConstructors?",
  "hasObjects?" = "hasObjects?",
  "hasCaseInsensitiveIdentifiers?" = "hasCaseInsensitiveIdentifiers?",
  "hasOperatorOverloading?" = "hasOperatorOverloading?",
  "hasReferences?" = "hasReferences?",
  "hasPassByValue?" = "hasPassByValue?",
  "hasPipes?" = "hasPipes?",
  "hasPolymorphicListType?" = "hasPolymorphicListType?",
  "hasPostfixNotation?" = "hasPostfixNotation?",
  "hasPrefixNotation?" = "hasPrefixNotation?",
  "hasPrintStatements?" = "hasPrintStatements?",
  "hasProtected?" = "hasProtected?",
  "hasQuotedRawStrings?" = "hasQuotedRawStrings?",
  "hasQuoteEscaping?" = "hasQuoteEscaping?",
  "hasRequiredMainFunction?" = "hasRequiredMainFunction?",
  "hasRunTimeTyping?" = "hasRunTimeTyping?",
  "hasSelfOrThisWord?" = "hasSelfOrThisWord?",
  "hasSemanticIndentation?" = "hasSemanticIndentation?",
  "hasSignificantLines?" = "hasSignificantLines?",
  "hasAccessModifiers?" = "hasAccessModifiers?",
  "hasInheritance?" = "hasInheritance?",
  "hasSpecifiableBaseIndex?" = "hasSpecifiableBaseIndex?",
  "hasStatements?" = "hasStatements?",
  "hasStatementTerminatorCharacter?" = "hasStatementTerminatorCharacter?",
  "hasStaticTyping?" = "hasStaticTyping?",
  "hasTypeParameters?" = "hasTypeParameters?",
  "letterFirstIdentifiers?" = "letterFirstIdentifiers?",
  "hasStreams?" = "hasStreams?",
  "hasStringConcatOperator?" = "hasStringConcatOperator?",
  "hasStrings?" = "hasStrings?",
  "hasTypeInference?" = "hasTypeInference?",
  "hasSuper?" = "hasSuper?",
  "hasSwitch?" = "hasSwitch?",
  "hasSyntaxForMatrixOps?" = "hasSyntaxForMatrixOps?",
  "hasTemplates?" = "hasTemplates?",
  "hasTernaryOperators?" = "hasTernaryOperators?",
  "hasTransposeOperator?" = "hasTransposeOperator?",
  "hasTryCatch?" = "hasTryCatch?",
  "hasSingleTypeArrays?" = "hasSingleTypeArrays?",
  "hasTraits?" = "hasTraits?",
  "hasTuples?" = "hasTuples?",
  "hasTypeDeclarations?" = "hasTypeDeclarations?",
  "hasUnionTypes?" = "hasUnionTypes?",
  "hasValueReturnedFunctions?" = "hasValueReturnedFunctions?",
  "hasVariableAssignment?" = "hasVariableAssignment?",
  "hasVariableDeclarations?" = "hasVariableDeclarations?",
  "hasVariadicFunctions?" = "hasVariadicFunctions?",
  "hasVars?" = "hasVars?",
  "hasVectorizedOperations?" = "hasVectorizedOperations?",
  "hasVoidFunctions?" = "hasVoidFunctions?",
  "hasWhileLoops?" = "hasWhileLoops?",
  "hasZeroBasedNumbering?" = "hasZeroBasedNumbering?",
  "isInterpreted?" = "isInterpreted?",
  "isCaseSensitive?" = "isCaseSensitive?",
  "hasModules?" = "hasModules?",
  "hasDisposeBlocks?" = "hasDisposeBlocks?",
  "hasFunctions?" = "hasFunctions?",
  "hasMethods?" = "hasMethods?",
  "hasSemaphores?" = "hasSemaphores?",
  "hasIncrementAndDecrementOperators?" = "hasIncrementAndDecrementOperators?"
}
// URL of the entity on Wikipedia, if and only if it has a page dedicated to it.
export interface wikipediaNode {
  appeared?: any // When does Wikipedia claim this entity first appeared?
  backlinksCount?: any // How many pages on WP link to this page?
  created?: any // When was the *Wikipedia page* for this entity created?
  dailyPageViews?: any // How many page views per day does this Wikipedia page get? Useful as a signal for rankings. Available via WP api.
  example?: any // Example(s) of this language on the Wikipedia page.
  fileExtensions?: any // If there's specifically identified file extensions on Wikipedia for this language.
  pageId?: any // Waht is the internal ID for this entity on WP?
  related?: any // What languages does Wikipedia have as related?
  revisionCount?: any // How many revisions does this page have?
  summary?: any // What is the text summary of the language from the Wikipedia page?
}

export enum wikipediaNodeKeywords {
  related = "related",
  dailyPageViews = "dailyPageViews",
  backlinksCount = "backlinksCount",
  revisionCount = "revisionCount",
  created = "created",
  appeared = "appeared",
  pageId = "pageId",
  example = "example",
  summary = "summary",
  fileExtensions = "fileExtensions"
}
// Some languages have active meetup groups on Meetup.com
export interface meetupNode {
  groupCount?: any
  memberCount?: any
}

export enum meetupNodeKeywords {
  memberCount = "memberCount",
  groupCount = "groupCount"
}
// Tiobe maintains a well known ranking of programming languages here: https://www.tiobe.com/tiobe-index/
export interface tiobeNode {
  currentRank?: any // What is the current Tiobe rank of this language?
}

export enum tiobeNodeKeywords {
  currentRank = "currentRank"
}
// Official Twitter handle of the entity, if any.
export interface twitterNode {
  followers?: any // How many followers the linked account has.
}

export enum twitterNodeKeywords {
  followers = "followers"
}

export interface pldbNode {
  aka?: any // Other names for the language.
  announcementUrl?: any // A url announcing the creation or release of a new language
  appeared?: any // What year was the language publicly released and/or announced.
  country?: any // What country was the language first developed in?
  creators?: any // Name(s) of the original creators of the language delimited by " and "
  description?: any // Description of the repo on GitHub.
  equation?: any // A text block containing a LaTeX snippet of a formula.
  example?: any // Example(s) of this language on the Wikipedia page.
  fileExtensions?: any // If there's specifically identified file extensions on Wikipedia for this language.
  fileType?: any // What is the file encoding for programs in this language?
  githubLanguage?: githubLanguageNode
  githubRepo?: githubRepoNode
  gitlab?: any // URL of the official GitLab repo for the language project.
  helloWorldCollection?: any // Hello world written in this language from http://helloworldcollection.de/
  linguistGrammarRepo?: linguistGrammarRepoNode
  meetup?: meetupNode
  patternKeyword?: any // For "type pattern" only. When building the pattern pages, look for this keyword on each object to see if it follows the pattern or not.
  patterns?: patternsNode
  psuedoExample?: any // As short an example as possible.
  reference?: any // A link with more info about this entity.
  related?: any // What languages does Wikipedia have as related?
  replit?: any // A link to try this langunage on replit.com
  standsFor?: any // If the language name is an abbreviation, what does/did it stand for?
  status?: any
  summary?: any // What is the text summary of the language from the Wikipedia page?
  tiobe?: tiobeNode
  title?: any // The official title of the language
  tryItOnline?: any // A link to try this langunage on https://tio.run
  twitter?: twitterNode
  type: any // Which category in PLDB's subjective ontology does this entity fit into.
  website?: any // URL of the official homepage for the language project.
  wikipedia?: wikipediaNode
  wordRank?: any // Some creators use a common English word as their language's name. For these we note how common the word is, where "the" is 1.
}

export enum pldbNodeKeywords {
  githubLanguage = "githubLanguage",
  githubRepo = "githubRepo",
  linguistGrammarRepo = "linguistGrammarRepo",
  patterns = "patterns",
  wikipedia = "wikipedia",
  related = "related",
  gitlab = "gitlab",
  announcementUrl = "announcementUrl",
  reference = "reference",
  website = "website",
  appeared = "appeared",
  wordRank = "wordRank",
  patternKeyword = "patternKeyword",
  title = "title",
  standsFor = "standsFor",
  aka = "aka",
  psuedoExample = "psuedoExample",
  meetup = "meetup",
  replit = "replit",
  tiobe = "tiobe",
  tryItOnline = "tryItOnline",
  twitter = "twitter",
  equation = "equation",
  example = "example",
  helloWorldCollection = "helloWorldCollection",
  description = "description",
  summary = "summary",
  fileExtensions = "fileExtensions",
  status = "status",
  creators = "creators",
  country = "country",
  type = "type",
  fileType = "fileType"
}
