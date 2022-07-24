# pldb: An npm package for The Programming Language Database

## Over 100,000 facts on over 3,000 languages in 1 typed JSON file with 0 dependencies

How to install:

```
npm install pldb
```

How to use:

```
const pldb = require("pldb")

console.log(
	Object.values(pldb)
		.filter((item) => item.type === "pl" && item.appeared === 1972)
		.map((item) => item.title)
)
```

## Also available as a direct download on the web and as CSV:

https://pldb.pub/pldb.json

OR:

https://pldb.pub/pldb.csv

### All public domain
