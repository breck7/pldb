PLDB Readme
===========

A Programming Language Database
===============================

View this readme as HTML
 https://pldb.io/readme.html View this readme as HTML
==============================================================================

PLDB is a public domain ScrollSet and website containing over 135,000 facts about over 4,000 programming languages.

This repo contains the entire ScrollSet, code, and website for https://pldb.io.

To download the data
====================
The entire ScrollSet is ready to analyze in popular formats. Full documentation is here: https://pldb.io/csv.html
- As CSV: https://pldb.io/pldb.csv
- As TSV: https://pldb.io/pldb.tsv
- As JSON: https://pldb.io/pldb.json

To add a new language
=====================

Local Method:
=============
- Clone the repo locally.
- Create a new Scroll file `concepts/[newId].scroll`.
- Use the Designer if you need autocomplete help (recommended):
 https://sdk.scroll.pub/designer#url%20https%3A%2F%2Fpldb.io%2Fpldb.parsers%0AprogramUrl%20https%3A%2F%2Fpldb.io%2Fconcepts%2Ftxt.scroll Designer
- Send a Pull Request

Web Method:
===========
- Fork this repo
- Visit https://github.com/[yourGithubUserName]/pldb/new/main/concepts
- Use the Designer if you need autocomplete help (recommended):
 https://sdk.scroll.pub/designer#url%20https%3A%2F%2Fpldb.io%2Fpldb.parsers%0AprogramUrl%20https%3A%2F%2Fpldb.io Use the Designer if you need autocomplete help (recommended):
- Send a Pull Request

To update a language
====================
Edit the corresponding `concepts/*.scroll` file and send a pull request.

To add a new measure
====================
Update the file `code/measures.parsers` and add at least 1 measurement to a concept in `concepts` and send a pull request.

To build the site locally
=========================
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

To explore this repo
====================
The most important folder is `concepts`, which contains the ScrollSet (a file for each concept). The file `code/measures.parsers` contains the Parsers (schema) for the ScrollSet.
You can see the `cloc` language stats on this repo at https://pldb.io/pages/about.html.

Citation
========
PLDB content is published to the public domain and you can use it freely. If needed, here are 3 options for citing PLDB:

> https://pldb.io

> PLDB contributors. (2024) - "PLDB: a Programming Language Database". Retrieved from: 'https://pldb.io' [Online Resource]

@article{pldb,
  author = {PLDB contributors},
  title = {PLDB: a Programming Language Database},
  journal = {PLDB},
  year = {2024},
  note = {https://pldb.io}
 }

All sources for PLDB can be found here: https://pldb.io/pages/acknowledgements.html
