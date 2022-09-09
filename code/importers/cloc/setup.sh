cd "$(dirname "$0")"
command -v  cloc ||  echo "Install cloc and rerun"
command -v cloc ||  exit 125
mkdir cache
cd cache
cloc --write-lang-def=my_definitions.txt
