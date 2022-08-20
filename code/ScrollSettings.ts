// todo: can we refactor scroll settings so we no longer need this?

import dayjs = require("dayjs")
import path = require("path")
const { Disk } = require("jtree/products/Disk.node.js")
import { lastCommitHashInFolder } from "./utils"

const lastHash = lastCommitHashInFolder()
const builtOn = dayjs().format("YYYY")
const version = `<a title="This page was built in ${builtOn} from commit ${lastHash}" href="https://github.com/breck7/pldb/commit/${lastHash}">v${builtOn}</a>`
const settingsFile = Disk.read(
  path.join(__dirname, "..", "blog", "scroll.settings")
).replace(/PLDB_BUILT_ON/g, version)

const makeScrollSettings = (
  baseUrl = "",
  gitPath = "https://github.com/breck7/pldb/",
  editUrl = "https://edit.pldb.com"
) =>
  settingsFile
    .replace(/BASE_URL/g, baseUrl)
    .replace(/GIT_PATH/g, gitPath)
    .replace(/EDIT_URL/g, editUrl)

export { makeScrollSettings }
