# The Programming Language Database

PLDB is a public domain database and blog containing over 100,000 facts about over 3,000 programming languages.

This repo contains the entire database, blog, and code for https://pldb.pub.

## To analyze the data

The PLDB database is freely available:

- As CSV: https://pldb.pub/pldb.csv
- As JSON: https://pldb.pub/pldb.json
- The JSON file is also available via npm:
  -- `npm install pldb`
  -- `console.log(require("pldb").javascript.appeared)`

Documentation for the columns is available here: https://pldb.pub/docs/columns.html.

## To add a new language

Easy method: https://edit.pldb.pub/create

Advanced method: Create a new file in `database/things` with a unique URL friendly filename ending in `.pldb` and send a pull request.

## To update a language

Easy method: https://edit.pldb.pub/edit

Advanced method: Edit the corresponding `database/things/*.pldb` file and send a pull request.

## To build the full site locally

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
npm run build
open pldb.pub/index.html
```

## To explore this repo

The most important folder is `database/things/`, which contains a file for each entity. The folder `database/grammar/` contains the grammar files (schema) for the database.

The blog content is in the `blog` folder.

The `code` folder contains importer scripts and other code for the database and site.

## To cite PLDB

PLDB content is published to the public domain and you can use it freely. If needed, here are 3 options for citing PLDB:

```
https://pldb.pub
```

```
Breck Yunits et al. (2022) - "The Programming Language Database". Published online at PLDB.pub. Retrieved from: 'https://pldb.pub' [Online Resource]
```

```
@article{pldb,
  author = {Breck Yunits et al.},
  title = {The Programming Language Database},
  journal = {PLDB},
  year = {2022},
  note = {https://pldb.pub}
 }
```

All sources for PLDB can be found here: https://pldb.pub/acknowledgements.html
