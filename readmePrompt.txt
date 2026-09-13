Below is the contents of this project/repo.

Generate a beautiful readme.md file from this.

```readme.scroll
// Greetings human!
//
// PLDB is a site
// created before Ai,
// by a team of humans
// all over the world
// who came together
// because of their
// shared interests in the questions
// "what is programming"
// "what are programming languages"
// "how any are there"
// "who created them"
// "what makes them similar and different"
// and
// "how can i make my own"?
//
// PLDB is written in Scroll.
// 
// The "database" is just text files.
// 
// PLDB is public domain.
//
// Downlaod a copy -
// it works great locally!

title PLDB Readme

rootHeader.scroll

printTitle

# A Programming Language Database

wideColumns 1

#### View this readme as HTML
 https://pldb.io/readme.html

code/ciBadges.scroll

PLDB is a public domain ScrollSet and website containing over 135,000 facts about over 5,000 programming languages.

This repo contains the entire ScrollSet, code, and website for https://pldb.io.

## To download the data
The entire ScrollSet is ready to analyze in popular formats. Full documentation is here: https://pldb.io/csv.html
- As CSV: https://pldb.io/pldb.csv
- As TSV: https://pldb.io/pldb.tsv
- As JSON: https://pldb.io/pldb.json

## To build the site locally
code
 git clone https://github.com/breck7/pldb
 cd pldb
 # Required to run this during first install only.
 npm i -g cloc
 # Required to run this on fresh checkout and when upgrading from an old checkout or periodically when there are new releases
 npm install .
 # (Optional) Run tests
 npm run test
 npm run build
 # After you make changes and before you commit make sure to run:
 npm run format

## To explore this repo
The most important folder is `concepts`, which contains the ScrollSet (a file for each concept). The file `code/measures.parsers` contains the Parsers (schema) for the ScrollSet.
You can see the `cloc` language stats on this repo at https://pldb.io/pages/about.html.

citation.scroll

All sources for PLDB can be found here: https://pldb.io/pages/acknowledgements.html

endColumns

footer.scroll

```
```releaseNotes.scroll
title PLDB Release Notes

rootHeader.scroll

printTitle
thinColumns

Here's a list of the notable changes in PLDB. Changes that break URLs or CSV files should be noted here.

# 9.0.0 5/08/2024
- 🎉 migrated from TrueBase to Scroll 84!

# 8.0.0 3/13/2023
- 🎉 upgrading to TrueBase 9. There will be bugs.

# 7.1.0 2/19/2023
- 🎉 started releaseNotes!

endColumns

footer.scroll

```
```pages/about.scroll
replaceJs BUILT_ON_DAY require("dayjs")().format("MM/DD/YYYY")
replaceJs DAYS_ONLINE Math.floor(require("dayjs")().diff(require("dayjs")("2022-08-15"), "day", true))
replaceJs DAYS_SINCE_LAUNCH Math.floor(require("dayjs")().diff(require("dayjs")("2022-08-28"), "day", true))
tags All
title About

header.scroll
printTitle

thinColumns 4

Welcome to PLDB: a Programming Language Database!

PLDB is a comprehensive database of programming languages and their features. The focus is on *programming languages*, but the database also includes other languages and entities one degree away--from popular high level plain text formats to binary specifications and beyond.

PLDB is for two groups of people:
1. *Programming language creators.* PLDB is organized big data to help you create great new languages, and improve existing ones. When making design decisions, quickly look up what features other languages have tried. Benefit from the experiences of thousands that have built languages before you. If you are researching something and can't find what you need here, you can add it and send a pull request, or share your request on Twitter.
 https://x.com/breckyunits share your request on Twitter
2. *Programming language users.* PLDB provides a data-driven view of the programming language universe, to demystify the world of programming languages for you, and provide sound strategic and tactical advice to help you in your projects and your career. If you have a question not answered by the data here, you can add it and send a pull request, or share your request on Twitter.
 https://x.com/breckyunits share your request on Twitter

## Join!
Want to get involved? Read more here.
 join.html here

## Open source
All data and source code used to generate this site are on GitHub.
 https://github.com/breck7/pldb GitHub

## Web server
PLDB is an entirely static site. PLDB.io is served via ScrollHub. You can clone the source to PLDB and build it locally and use PLDB entirely offline on your own machine.
 https://hub.scroll.pub/ ScrollHub

## Acknowledgements
This site is powered by information and software from so many people and organizations, a few of which are listed on the acknowledgements page.
 acknowledgements.html acknowledgements

## Cloc Stats
Below are the cloc stats for the pldb repo as of BUILT_ON_DAY.
 BASE_URL/concepts/cloc.html cloc
 https://github.com/breck7/pldb pldb repo

../code/scrollExtensions.parsers
bash cd ..; cloc --quiet --vcs git . --read-lang-def=code/clocLangs.txt

# Mirrors
The URL for the official PLDB site is https://pldb.io. DNS will take that domain name and send your browser an IPv4 address. Your browser will send a request to that address which will reach a DigitalOcean server running ScrollHub. That server will send you the HTML, CSS, Javascript, PNGs, SVGs and JSON that make up the built website.
 ../concepts/url.html URL
 ../concepts/dns.html DNS
 ../concepts/ipv4.html IPv4
 ../concepts/html.html HTML
 ../concepts/css.html CSS
 ../concepts/javascript.html Javascript
 ../concepts/png.html PNG
 ../concepts/svg.html SVG
 ../concepts/json.html JSON

In case there's a problem with ScrollHub, you should be able to access the exact same site locally by downloading the source.

If ScrollHub AND GitHub were to go down at the same time...well that's why it's good to regularly download the entire source code of the site to your own machine! You can do that with:

bashCode
 git clone https://github.com/breck7/pldb.git
 # Then to keep it updated:
 cd pldb
 git pull

## History
- Breck Yunits started PLDB as an anonymous Jekyll blog named "CodeLani" from his apartment in Honolulu, Hawai'i, on November 18, 2017.
 link ../lists/explorer.html#q=Breck%20Yunits Breck Yunits
 ../concepts/jekyll.html Jekyll
 ../blog/hello-world.html November 18, 2017
- Breck renamed CodeLani to PLDB and migrated it to Scroll and TrueBase on June 27, 2022.
 ../concepts/scroll.html Scroll
 https://github.com/breck7/pldb/commit/273f34a8620111e326a49332761e2c01823b58ef CodeLani to PLDB
- The new PLDB launched on HackerNews DAYS_SINCE_LAUNCH days ago, on August 28, 2022.
 https://news.ycombinator.com/item?id=32619671 launched
- Design patterns learned from TrueBase were merged into Scroll and PLDB became a fully functional static site on May 10, 2024

The site owes its existence to a kind (_but firm_) Internet commenter who told Breck Yunits to "learn to research properly" if he wanted to make his languages any good.
 https://breckyunits.com Breck Yunits

../citation.scroll

footer.scroll

```
```pages/acknowledgements.scroll
tags All
title Acknowledgements

// Currently fetched manually because of pagination.
// https://api.github.com/repos/breck7/pldb/contributors

header.scroll
printTitle

thinColumns

## Contributors
Thank you to everyone who has contributed directly to the PLDB repo:
 https://github.com/breck7/pldb PLDB repo
 https://api.github.com/repos/breck7/pldb/contributors everyone

datatable contributors.json
 where login != breck7
  where login != pldbbot
   where login != codelani
    compose link <li><a href="{html_url}">{login}</a></li>
     printColumn link

## Sources
The vast majority of the information on this site comes from other websites and projects and should always include a link back to the #source#. Thank you to all of those sites, including:
 inlineMarkup # u title="And if there's a link missing somewhere, please report a bug!"
../measures.csv
 where Source notEmpty
  compose links <li><a href="https://{Source}">{Source}</a></li>
   printColumn links

## NPM Packages
Thank you to the developers building these packages used by PLDB:
../package.json
 path devDependencies
 compose links <li><a href="https://www.npmjs.com/package/{key}">{key}</a></li>
  printColumn links

## Written In
PLDB itself is written in a number of languages including:
../pldb.json
 where id oneOf javascript nodejs html css particles scroll parsers git python bash markdown json typescript png svg explorer gitignore
  compose links <li><a href="../concepts/{id}.html">{id}</a></li>
   printColumn links

## Language Creators
And of course, thank you to all of the language creators who created the languages that are the subject of this site.
 BASE_URL/lists/creators.html language creators

footer.scroll

```
```pages/the-rankings-algorithm.scroll
tags All
title The PLDB Rankings Algorithm

header.scroll
printTitle

wideColumns 1

PLDB ranks languages by combining scores in 5 broad categories:

- number of estimated users
- number of languages built using this language ("foundation score")
- number of estimated jobs
- number of languages it has influenced
- number of measurements PLDB has on a language

# The Ranking Algorithm

katex PLDBScore(x) = 5*ConceptCount - UserEstRank(x) - FoundationScoreRank(x) - JobsEstRank(x) - LinkRank(x) - MeasurementsRank(x)

You can verify this yourself by reading the source code.

Each one of the five main inputs is composed from many sources and well over 100 signals go into calculating the rankings.
 acknowledgements.html sources

# About the rankings
In the beginning, PLDB did not have any rankings system. But I learned over the years that an imperfect ranking system is _vastly_ more useful than no ranking system. For example, languages used to be listed alphabetically which made it very hard to find the pages for the languages people used most. At least in my opinion, the site has become significantly more useful since I added the rankings system.

Along those lines, improvements to the rankings system make the site better, and therefore I am rather frequently trying to add more signals and improve the algorithm. 100% of the data and code produced by PLDB is open source, public domain, and published to git, so it can be a team effort to continuously build better rankings.
 https://github.com/breck7/pldb published to git

footer.scroll

```
