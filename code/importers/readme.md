# PLDB Importers

This folder contains the scripts for importing data automatically from the web.

Importers generally:

1. Match - match entity ids from the source to PLDB ids
2. Fetch - fetch content from the source site and save to disk cache
3. Parse - parse the content into JSON objects and save to disk cache
4. Update - map the content to the PLDB grammar and save to PLDB
