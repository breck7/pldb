interface FeatureSummary {
  fileName: string
  id: string
  title: string
  titleLink: string
  aka: string
  token?: string // Links a feature to the related token keyword in the pldb grammar
  yes: number
  no: number
  measurements: number
  percentage: string
  pseudoExample: string
}

interface FeaturePrediction {
  value: boolean
  token?: string
  example?: string
}

interface Example {
  code: string
  source: string
  link: string
}

interface FileInterface {
  id: string
  factCount: number
}

interface FolderInterface {
  prettifyContent: Function
  predictNumberOfJobs: Function
  predictPercentile: Function
  predictNumberOfUsers: Function
  getFileAtLanguageRank: Function
  getFileAtRank: Function
  getLanguageRankExplanation: Function
  columnDocumentation: any[]
  topLanguages: any[]
  getRank: Function
  getLanguageRank: Function
  getFile: Function
  featuresMap: any
  inboundLinks: StringMap
  getChildren: () => FileInterface[]
  filter: (predicate: Function) => FileInterface[]
}

interface Ranking {
  index: number
  id: string
  totalRank: number
  jobsRank: number
  factsRank: number
  inboundLinksRank: number
  usersRank: number
}

type Rankings = { [firstWord: string]: Ranking }
type InverseRankings = { [firstWord: number]: Ranking }

type StringMap = { [id: string]: string[] }

export {
  FeatureSummary,
  FeaturePrediction,
  Example,
  FolderInterface,
  FileInterface,
  Ranking,
  Rankings,
  InverseRankings,
  StringMap
}
