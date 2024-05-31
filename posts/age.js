const lodash = require("lodash")
const path = require("path")
const { TreeNode } = require("scrollsdk/products/TreeNode.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const pldb = require("../pldb.json")
const creators = require("../creators/creators.json")
const creatorsMap = {}
creators.forEach(creator => (creatorsMap[creator.id] = creator))

const hits = pldb
	.filter(lang => lang.creators)
	.map(lang => {
		const { appeared, creators } = lang
		const firstCreator = creators.split(" and ")[0]
		const creator = creatorsMap[firstCreator]
		if (!creator || !creator.born) return false
		lang.ageAtCreation = appeared - creator.born
		return lang
	})
	.filter(i => i)
	.map(lang =>
		lodash.pick(lang, [
			"id",
			"name",
			"pldbScore",
			"rank",
			"appeared",
			"tags",
			"creators",
			"ageAtCreation",
			"foundationScore",
			"numberOfUsersEstimate",
			"numberOfJobsEstimate",
			"inboundLinksCount",
			"measurements"
		])
	)

Disk.write(path.join(__dirname, "age.tsv"), new TreeNode(hits).asTsv)
