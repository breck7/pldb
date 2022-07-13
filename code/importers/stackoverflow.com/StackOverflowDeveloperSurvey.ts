#!/usr/bin/env ts-node

import * as fs from "fs"
import * as path from "path"
import * as csv from "fast-csv"
import * as ss from "simple-statistics"

import { jtree } from "jtree"
import { runCommand } from "../../utils"
import { PLDBBaseFolder } from "../../PLDBBase"

const lodash = require("lodash")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")

const pldbBase = PLDBBaseFolder.getBase()

const cachePath = __dirname + "/cache/stack-overflow-developer-survey-2021/"
const filepath = cachePath + "survey_results_public.csv"
const processedPath = cachePath + "processed.json"

// https://insights.stackoverflow.com/survey
class StackOverflowDeveloperSurveyImporter {
  users = {}
  processCsvCommand() {
    pldbBase.loadFolder()
    fs.createReadStream(filepath)
      .pipe(csv.parse({ headers: true }))
      .on("error", error => console.error(error))
      .on("data", row => this.processRow(row))
      .on("end", (rowCount: number) => this.done(rowCount))
  }

  done(rowCount) {
    console.log(`Parsed ${rowCount} rows`)
    Object.values(this.users).forEach((row: any) => {
      if (row.salaries.length)
        row.medianSalary = Math.round(ss.median(row.salaries))
      row.percentageUsing = lodash.round(row.users / this.totalRows, 2)
      delete row.salaries
    })

    delete this.users["NA"]

    Disk.write(processedPath, JSON.stringify(this.users, null, 2))
  }

  writeToDatabaseCommand() {
    pldbBase.loadFolder()
    const objects = JSON.parse(Disk.read(processedPath))
    Object.values(objects).forEach((row: any) => {
      const file = pldbBase.getFile(row.pldbId)
      file.appendLineAndChildren(
        "stackOverflowSurvey",
        `2021
 users ${row.users}
 medianSalary ${row.medianSalary}
 fans ${row.fans}
 percentageUsing ${row.percentageUsing}`
      )
      file.save()
    })
    /*
stackOverflowSurvey
 2021
  users
  medianSalary
*/
  }

  totalRows = 0
  processRow(row: any) {
    const { users } = this
    const {
      LanguageHaveWorkedWith, // C++;HTML/CSS;JavaScript;Objective-C;PHP;Swift
      LanguageWantToWorkWith, // C++;HTML/CSS;JavaScript;Objective-C;PHP;Swift
      ConvertedCompYearly
    } = row
    this.totalRows++

    const hardCodedIds = { "HTML/CSS": "html", "Bash/Shell": "bash" }

    const initLang = lang => {
      if (!users[lang])
        users[lang] = {
          lang,
          users: 0,
          salaries: [],
          fans: 0,
          pldbId: pldbBase.searchForEntity(lang) || hardCodedIds[lang]
        }
    }

    LanguageHaveWorkedWith.split(";").forEach(lang => {
      initLang(lang)
      users[lang].users++
      if (ConvertedCompYearly && ConvertedCompYearly.match(/^\d+$/))
        users[lang].salaries.push(parseInt(ConvertedCompYearly))
    })

    LanguageWantToWorkWith.split(";").forEach(lang => {
      initLang(lang)
      users[lang].fans++
    })
  }
}

export { StackOverflowDeveloperSurveyImporter }

if (!module.parent)
  runCommand(new StackOverflowDeveloperSurveyImporter(), process.argv[2])
