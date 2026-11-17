const fs = require('fs');
const path = require('path');

function buildPldb() {
  const rawData = [export_stub_or_data];
  const seen = new Set();
  const uniqueData = rawData.filter(item => {
    const key = item.id || item.name;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  fs.writeFileSync(path.join(__dirname, '../pldb.json'), JSON.stringify(uniqueData, null, 2));
}

module.exports = { buildPldb };
