import { imemo } from "./utils"

const path = require("path")

const { jtree } = require("jtree")
const { TreeNode } = jtree
const { TreeBaseFile } = require("jtree/products/treeBase.node.js")
const { TreeBaseFolder } = require("jtree/products/treeBase.node.js")

const databaseFolder = path.join(__dirname, "..", "database")

class FeatureFile extends TreeBaseFile {
  @imemo
  get _getLanguagesWithThisFeatureResearched() {
    const featureKeyword = this.get("featureKeyword")

    return this.base.topLanguages.filter(file =>
      file.getNode("features")?.has(featureKeyword)
    )
  }

  get base() {
    return this.getParent().languageFolder
  }

  get languagesWithThisFeature() {
    const { featurePath } = this
    return this._getLanguagesWithThisFeatureResearched.filter(
      file => file.get(featurePath) === "true"
    )
  }

  get languagesWithoutThisFeature() {
    const { featurePath } = this
    return this._getLanguagesWithThisFeatureResearched.filter(
      file => file.get(featurePath) === "false"
    )
  }
}

class FeaturesFolder extends TreeBaseFolder {
  static getFolder(languageFolder): FeaturesFolder {
    const featuresFolder = new FeaturesFolder()
      .setDir(path.join(databaseFolder, "things"))
      .setGrammarDir(path.join(databaseFolder, "grammar"))
    featuresFolder.languageFolder = languageFolder
    return featuresFolder.loadFolder()
  }

  createParser() {
    return new TreeNode.Parser(FeatureFile)
  }
}

export { FeaturesFolder, FeatureFile }
