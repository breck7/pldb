import { LanguagePageTemplate } from "./LanguagePage"
import { cleanAndRightShift, getIndefiniteArticle } from "./utils"

const lodash = require("lodash")

class FeaturePageTemplate extends LanguagePageTemplate {
  get kpiBar() {
    return ""
  }

  get description() {
    const { typeName, title } = this.file
    const isOrAre = title.endsWith("s") ? "are" : "is"

    return `${title} ${isOrAre} ${getIndefiniteArticle(typeName)} ${
      this.typeLink
    }.`
  }

  get prevPage() {
    return this.file.previousRankedFeature.permalink
  }

  get nextPage() {
    return this.file.nextRankedFeature.permalink
  }

  get typeLink() {
    return `<a href="../lists/features.html">${this.file.typeName}</a>`
  }

  get exampleSection() {
    const { file } = this
    const { title, featurePath } = file

    const positives = file.languagesWithThisFeature
    const negatives = file.languagesWithoutThisFeature

    const examples = positives
      .filter(file => file.getNode(featurePath).length)
      .map(file => {
        return {
          id: file.id,
          title: file.title,
          example: file.getNode(featurePath).childrenToString()
        }
      })

    const grouped = lodash.groupBy(examples, "example")

    const examplesText = Object.values(grouped)
      .map((group: any) => {
        const id = file.id
        const links = group
          .map(hit => `<a href="${hit.id}.html">${hit.title}</a>`)
          .join(", ")
        return `exampleCodeHeader Example from ${links}:

code
 ${cleanAndRightShift(lodash.escape(group[0].example), 1)}`
      })
      .join("\n\n")

    const negativeText = negatives.length
      ? `paragraph
 Languages <b>without</b> ${title} include ${negatives
          .map(file => file.link)
          .join(", ")}

`
      : ""

    return (
      negativeText +
      `paragraph
 Languages <b>with</b> ${title} include ${positives
        .map(file => file.link)
        .join(", ")}

` +
      examplesText
    )
  }
}

export { FeaturePageTemplate }
