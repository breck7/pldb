# CodeLani

This repo contains the database and all blog content on https://codelani.com.

The key folder is `database/things/`, which contains a file for each entity.

The rest of the content for the site is in the `blog` folder.

## To update a language

To add or fix information on CodeLani, simply edit the corresponding `database/things/*.codelani` file and send a pull request. For example, if the `appeared` year field for the `Ada` Language was incorrect, you could update that line on https://github.com/codelani/codelani/blob/master/things/ada.scroll and send a pull request.

## To add a new language

To add a new language simply create a new file in `database/things` with a unique URL friendly filename ending in `.codelani`. A simple example would be the `typescript.codelani` file for TypeScript. For a language with a complex name like X+#, you might create a file called `x-plus-sharp.codelani`. Please include a minimum of `appeared`, `type`, `example`, and at least one of `website` or `github`.

## Building the full site

```
git clone https://github.com/codelani/codelani
cd codelani
npm install .
npm run build
open codelani.com/index.html
```

## See all commands

```
npm install -g jtree
jtree build
```
