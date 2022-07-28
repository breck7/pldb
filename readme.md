# The Programming Language Database

This repo contains the entire database, blog, and code for https://pldb.pub.

The most important folder is `database/things/`, which contains a file for each entity.

The blog content is in the `blog` folder.

The `code` folder contains importer scripts and other code for the database and site.

## To add a new language

Simple method: https://edit.pldb.pub/create

Advanced method: Create a new file in `database/things` with a unique URL friendly filename ending in `.pldb` and send a pull request.

## To update a language

Simple method: https://edit.pldb.pub/edit

Advanced method: Edit the corresponding `database/things/*.pldb` file and send a pull request.

## Building the full site

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
npm run build
open pldb.pub/index.html
```
