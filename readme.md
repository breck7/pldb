# PLDB

This repo contains the database and all blog content on https://pldb.pub.

The key folder is `database/things/`, which contains a file for each entity.

The rest of the content for the site is in the `blog` folder.

## To update a language

To add or fix information on PLDB, simply edit the corresponding `database/things/*.pldb` file and send a pull request. For example, if the `appeared` year field for the `Ada` Language was incorrect, you could update that line on https://github.com/breck7/pldb/blob/main/database/things/ada.pldb and send a pull request.

## To add a new language

To add a new language simply create a new file in `database/things` with a unique URL friendly filename ending in `.pldb`. A simple example would be the `typescript.pldb` file for TypeScript. For a language with a complex name like X+#, you might create a file called `x-plus-sharp.pldb`. Please include a minimum of `appeared`, `type`, `example`, and at least one of `website` or `github`.

## Building the full site

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
npm run build
open pldb.pub/index.html
```

## See all commands

```
npm install -g jtree
jtree build
```
