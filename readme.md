# PLDB: A Programming Language Database

[View this README as HTML](https://pldb.io/readme.html)

PLDB is a public domain ScrollSet and website, compiling over 135,000 facts about 4,000+ programming languages. This repository hosts the entire ScrollSet, codebase, and website for [https://pldb.io](https://pldb.io).

---

## 📂 Downloading the Data

The PLDB data is available in popular formats, with [full documentation](https://pldb.io/csv.html):

- **CSV**: [pldb.csv](https://pldb.io/pldb.csv)
- **TSV**: [pldb.tsv](https://pldb.io/pldb.tsv)
- **JSON**: [pldb.json](https://pldb.io/pldb.json)

---

## 📜 Contributing

### Adding a New Language

#### Local Method

1. Clone the repository.
2. Create a new `.scroll` file in `concepts/` (e.g., `concepts/[newId].scroll`).
3. [Use the Designer](https://sdk.scroll.pub/designer#url%20https%3A%2F%2Fpldb.io%2Fpldb.parsers%0AprogramUrl%20https%3A%2F%2Fpldb.io%2Fconcepts%2Ftxt.scroll) for autocomplete support.
4. Submit a pull request.

#### Web Method

1. Fork this repository.
2. Visit: `https://github.com/[yourGithubUserName]/pldb/new/main/concepts`
3. [Use the Designer](https://sdk.scroll.pub/designer#url%20https%3A%2F%2Fpldb.io%2Fpldb.parsers%0AprogramUrl%20https%3A%2F%2Fpldb.io).
4. Submit a pull request.

### Updating a Language

Click the edit button on the top right of a page and edit the language.

### Adding a New Measure

Modify `code/measures.parsers` and add at least one measurement in a `concepts` file, then submit a pull request.

---

## 🚀 Building the Site Locally

```bash
git clone https://github.com/breck7/pldb
cd pldb
# Install dependencies (initial setup)
npm i -g cloc
npm install .
# Run tests (optional)
npm run test
# Build the site
npm run build
# Format changes before committing
npm run format
```

## 🔍 Repository Structure

- **`concepts`**: Contains the ScrollSet with one file per language/concept.
- **`code/measures.parsers`**: Defines the schema for measurements in the ScrollSet.
- **Language Stats**: See detailed language statistics at [PLDB Stats](https://pldb.io/pages/about.html).

---

## 📄 Citation

All sources for PLDB are listed on the [Acknowledgements](https://pldb.io/pages/acknowledgements.html) page.

---

## 💬 About PLDB

PLDB is a comprehensive database on programming languages for:

1. **Programming Language Creators**: Discover data-driven insights to enhance language design by referencing historical data from thousands of languages.
2. **Programming Language Users**: Gain a strategic perspective on the programming language landscape to advance projects and career goals.

[Get Involved](https://pldb.io/join.html) | [GitHub Repository](https://github.com/breck7/pldb)

### Acknowledgements

PLDB is powered by many contributors and various open-source projects. Thank you to all! Full list on the [Acknowledgements](https://pldb.io/pages/acknowledgements.html) page.

### Rankings Algorithm

PLDB ranks languages based on a composite score from five broad categories. The ranking algorithm details can be explored in [The Rankings Algorithm](https://pldb.io/pages/the-rankings-algorithm.html).

---

## 📝 Release Notes

See major updates and breaking changes in the [Release Notes](https://pldb.io/releaseNotes.html).

---

## History

Originally launched by Breck Yunits in 2017.
