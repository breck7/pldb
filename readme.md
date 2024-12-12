# PLDB - A Programming Language Database

[![Build Status](https://github.com/breck7/pldb/workflows/Tests/badge.svg)](https://github.com/breck7/pldb/actions)

PLDB is a comprehensive public domain database containing over 135,000 facts about more than 5,000 programming languages. The project includes both the complete dataset and the website code for [pldb.io](https://pldb.io).

## 🌟 Key Features

- **Rich Dataset**: Extensive information about programming languages, from high-level formats to binary specifications
- **Multiple Export Formats**: Access the complete dataset in CSV, TSV, or JSON format
- **Public Domain**: All data and code is freely available for any use
- **Regular Updates**: Actively maintained with version control and release notes
- **Web Interface**: Browse the data through an intuitive web interface at [pldb.io](https://pldb.io)

## 📊 Data Downloads

Access the complete dataset in your preferred format:

- **CSV**: [pldb.io/pldb.csv](https://pldb.io/pldb.csv)
- **TSV**: [pldb.io/pldb.tsv](https://pldb.io/pldb.tsv)
- **JSON**: [pldb.io/pldb.json](https://pldb.io/pldb.json)

Full documentation for the data formats is available at [pldb.io/csv.html](https://pldb.io/csv.html)

## 🚀 Local Development

Get started with local development:

```bash
# Clone the repository
git clone https://github.com/breck7/pldb
cd pldb

# First-time setup
npm i -g cloc
npm install .

# (Optional) Run tests
npm run test

# Build the site
npm run build

# Before committing changes
npm run format
```

## 📁 Repository Structure

The most important components of the repository:

- `concepts/`: Contains the ScrollSet (individual files for each concept)
- `code/measures.parsers`: Contains the Parsers (schema) for the ScrollSet
- View detailed language statistics at [pldb.io/pages/about.html](https://pldb.io/pages/about.html)

## 🏆 Rankings

PLDB includes a sophisticated ranking system for programming languages based on five key metrics:

- Number of estimated users
- Foundation score (languages built using this language)
- Estimated job opportunities
- Language influence
- Available measurements

Learn more about the ranking algorithm at [pldb.io/pages/the-rankings-algorithm.html](https://pldb.io/pages/the-rankings-algorithm.html)

## 📜 Version History

Latest major releases:

- **9.0.0** (May 2024): Migrated to Scroll 84
- **8.0.0** (March 2023): Upgraded to TrueBase 9
- See [Release Notes](https://pldb.io/releaseNotes.html) for complete history

## 🤝 Contributing

Contributions are welcome! PLDB is designed for two main audiences:

1. **Programming Language Creators**: Use our organized data to make informed design decisions
2. **Programming Language Users**: Get data-driven insights about the programming language ecosystem

## 📚 Resources

- **Main Website**: [pldb.io](https://pldb.io)
- **About Page**: [pldb.io/pages/about.html](https://pldb.io/pages/about.html)
- **Acknowledgements**: [pldb.io/pages/acknowledgements.html](https://pldb.io/pages/acknowledgements.html)

## 📖 Citation

This project is dedicated to the public domain. When using PLDB, we appreciate attribution but it's not required. All sources are listed at [pldb.io/pages/acknowledgements.html](https://pldb.io/pages/acknowledgements.html).

## 🌐 Mirrors

The primary site is hosted at [pldb.io](https://pldb.io) via ScrollHub. For offline access or redundancy, you can clone the repository and build locally:

```bash
git clone https://github.com/breck7/pldb.git
cd pldb
git pull  # To keep updated
```
