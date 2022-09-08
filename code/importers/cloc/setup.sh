cd "$(dirname "$0")"
command -v croc ||  echo "Install cloc and rerun"
command -v croc ||  exit 125
mkdir cache
cd cache
cloc --write-lang-def=my_definitions.txt
