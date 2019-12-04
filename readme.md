# CodeLani

This repo contains some processed `csv` files as well as the raw `database/` folder, which contains a strongly typed file with information on every language on https://codelani.com.

# Updating a language

To add or fix information on CodeLani, simply edit the corresponding `lani` file and send a pull request. For example, if the `appeared` year field for the `Ada` Language was incorrect, you could update that line on https://github.com/codelani/codelani/blob/master/database/ada.lani and send a pull request.

# Add a new language

To add a new language simply create a new file in the `database` with a unique URL friendly filename ending in `.lani`. A simple example would be the `typescript.lani` file for TypeScript. For a language with a complex name like X+#, you might create a file called `x-plus-sharp.lani`. Please include a minimum of `appeared`, `type`, `example`, and at least one of `website` or `github`.
