cd "$(dirname "$0")"
mkdir cache
cd cache
git clone https://github.com/compiler-explorer/compiler-explorer
cd compiler-explorer
npm install .
tsc