cd "$(dirname "$0")"
mkdir cache
cd cache
command -v cloc ||  echo "Install cloc and rerun"
command -v cloc ||  exit 125
cloc --write-lang-def=my_definitions.txt
