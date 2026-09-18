PLDB Readme
===========

A Programming Language Database
===============================

View this readme as HTML
 https://pldb.io/readme.html View this readme as HTML
==============================================================================

PLDB is a public domain ScrollSet and website containing over 135,000 facts about over 5,000 programming languages.

This repo contains the entire ScrollSet, code, and website for https://pldb.io.

To download the data
====================
The entire ScrollSet is ready to analyze in popular formats. Full documentation is here: https://pldb.io/csv.html
- As CSV: https://pldb.io/pldb.csv
- As TSV: https://pldb.io/pldb.tsv
- As JSON: https://pldb.io/pldb.json

To build the site locally
=========================
```
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
```

To explore this repo
====================
The most important folder is `concepts`, which contains the ScrollSet (a file for each concept). The file `code/measures.parsers` contains the Parsers (schema) for the ScrollSet.
You can see the `cloc` language stats on this repo at https://pldb.io/pages/about.html.

Citation
========
PLDB content is published to the public domain and you can use it freely. If needed, here are 3 options for citing PLDB:

> https://pldb.io

> PLDB contributors. (2026) - "PLDB: a Programming Language Database". Retrieved from: 'https://pldb.io' [Online Resource]

```
@article{pldb,
  author = {PLDB contributors},
  title = {PLDB: a Programming Language Database},
  journal = {PLDB},
  year = {2026},
  note = {https://pldb.io}
 }
```

All sources for PLDB can be found here: https://pldb.io/pages/acknowledgements.html

Built with Scroll v180.0.1
