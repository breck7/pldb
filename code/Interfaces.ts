interface FeatureSummary {
    feature: string
    featureLink: string
    aka: string
    path: string
    token?: string
    yes: number
    no: number
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

  }

  interface FolderInterface {
    prettifyContent: Function
    predictNumberOfJobs: Function
    predictPercentile: Function
    predictNumberOfUsers: Function
    getFileAtLanguageRank: Function
    getFileAtRank: Function
    getFeatureAtRank: Function
    getLanguageRankExplanation: Function
    getFeatureRank: Function
    columnDocumentation: any[]
    topLanguages: any[]
    getRank: Function
    getLanguageRank: Function
    getFile: Function
  }

export { FeatureSummary, FeaturePrediction, Example, FolderInterface, FileInterface }
