cd "$(dirname "$0")"
mkdir cache
cd cache
git clone https://github.com/ashish01/hn-data-dumps
cd hn-data-dumps
pip3 install tqdm aiohttp
python3 hn_async2.py
