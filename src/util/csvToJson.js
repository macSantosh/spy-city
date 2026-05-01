const fs = require('fs');

const rows = fs.readFileSync('constituents.csv', 'utf8')
  .trim()
  .split('\n');

const headers = rows[0].split(',');

const json = rows.slice(1).map(r =>
  Object.fromEntries(
    headers.map((h, i) => [h, r.split(',')[i]])
  )
);

fs.writeFileSync(
  './constituents.json',
  JSON.stringify(json, null, 2)
);

console.log("✅ Conversion complete");