# PLDB: a Programming Language Database

<a href="https://github.com/breck7/pldb/actions/workflows/didTheTestsPass.yml"><img src="https://github.com/breck7/pldb/actions/workflows/didTheTestsPass.yml/badge.svg"/></a>

PLDB is a public domain database and website containing over 135,000 facts about over 4,000 programming languages.

This repo contains the entire database, code, and website for https://pldb.com.

## To analyze the data

The PLDB database is freely available:

- As CSV: https://pldb.com/pldb.csv
- As JSON: https://pldb.com/pldb.json
- The JSON file is also available via npm:

```
// npm install pldb
console.log(require("pldb").javascript.appeared)
```

Documentation for the CSV is available here: https://pldb.com/docs/csv.html.

## To add a new language

Easy method: https://build.pldb.com/create

Advanced method: Create a new file in `database/things` with a unique URL friendly filename ending in `.pldb` and send a pull request.

## To update a language

Easy method: https://build.pldb.com/

Advanced method: Edit the corresponding `database/things/*.pldb` file and send a pull request.

## To add a new column

Advanced method: Edit or create a new file in `database/grammar` and add at least 1 example to an entity in `database/things` and send a pull request.

## To build the full site locally

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
npm i -g cloc
npm run tsc
npm run build
# Run tests (optional)
npm run test
# Open the static site in your browser (without full text search)
open site/index.html
# Start the dev server to also have full text search running:
npm run local
# After you make changes and before you commit make sure to run:
npm run format
```

## To build the full site in docker

```
-- Run PLDB in docker
docker run -it -d -v /c/AndelaWork/pldb:/app -p 4444:4444 --name pldbnode node:16 bash
-- into docker interactive session run the follow:
git clone https://github.com/breck7/pldb
cd pldb
npm install .
npm run tsc
npm i -g cloc
npm run build
(Optional run TESTS): npm run test
(Following updates): npm run format
npm run local
-- navigate site in --> http://localhost:4444/index.html
```

## To explore this repo

The most important folder is `database/things/`, which contains a file for each entity. The folder `database/grammar/` contains the grammar files (schema) for the database.

The website content is in the `site` folder.

The `code` folder contains importer scripts and other code for the database and site.

You can see the `cloc` language stats on this repo at https://pldb.com/pages/about.html.

## To cite PLDB

PLDB content is published to the public domain and you can use it freely. If needed, here are 3 options for citing PLDB:

```
https://pldb.com
```

```
PLDB contributors. (2022) - "PLDB: a Programming Language Database". Retrieved from: 'https://pldb.com' [Online Resource]
```

```
@article{pldb,
  author = {PLDB contributors},
  title = {PLDB: a Programming Language Database},
  journal = {PLDB},
  year = {2022},
  note = {https://pldb.com}
 }
```

All sources for PLDB can be found here: https://pldb.com/pages/acknowledgements.html
