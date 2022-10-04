const lodash = require("lodash")

import {
  InverseRankings,
  FileInterface,
  FolderInterface,
  Ranking,
  Rankings
} from "./Interfaces"

const calcRanks = (folder: FolderInterface, files: FileInterface[]) => {
  const { inboundLinks } = folder
  let objects = files.map(file => {
    const id = file.id
    const object: any = {}
    object.id = id
    object.jobs = folder.predictNumberOfJobs(file)
    object.users = folder.predictNumberOfUsers(file)
    object.facts = file.factCount
    object.inboundLinks = inboundLinks[id].length
    return object
  })

  objects = rankSort(objects, "jobs")
  objects = rankSort(objects, "users")
  objects = rankSort(objects, "facts")
  objects = rankSort(objects, "inboundLinks")

  objects.forEach((obj, rank) => {
    // Drop the item this does the worst on, as it may be a flaw in PLDB.
    const top3: number[] = [
      obj.jobsRank,
      obj.usersRank,
      obj.factsRank,
      obj.inboundLinksRank
    ]
    obj.totalRank = lodash.sum(lodash.sortBy(top3).slice(0, 3))
  })
  objects = lodash.sortBy(objects, ["totalRank"])

  const ranks: Rankings = {}
  objects.forEach((obj, index) => {
    obj.index = index
    ranks[obj.id] = obj as Ranking
  })
  return ranks
}

const rankSort = (objects: any[], key: string) => {
  objects = lodash.sortBy(objects, [key])
  objects.reverse()
  let lastValue = objects[0][key]
  let lastRank = 0
  objects.forEach((obj, rank) => {
    const theValue = obj[key]
    if (lastValue === theValue) {
      // A tie
      obj[key + "Rank"] = lastRank
    } else {
      obj[key + "Rank"] = rank
      lastRank = rank
      lastValue = theValue
    }
  })
  return objects
}

const computeRankings = (folder: FolderInterface) => {
  const ranks = calcRanks(folder, folder.getChildren())
  const inverseRanks = makeInverseRanks(ranks)
  const languageRanks = calcRanks(
    folder,
    folder.filter(file => file.isLanguage)
  )
  const inverseLanguageRanks = makeInverseRanks(languageRanks)
  const featureRanks = calcRanks(
    folder,
    folder.filter(file => file.isFeature)
  )
  const inverseFeatureRanks = makeInverseRanks(featureRanks)

  return {
    ranks,
    inverseRanks,
    languageRanks,
    inverseLanguageRanks,
    featureRanks,
    inverseFeatureRanks
  }
}

const makeInverseRanks = (ranks: Rankings) => {
  const inverseRanks: InverseRankings = {}
  Object.keys(ranks).forEach(id => {
    inverseRanks[ranks[id].index] = ranks[id]
  })
  return inverseRanks
}
export { computeRankings }
