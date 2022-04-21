import * as fs from 'fs';
import { parse } from 'fast-csv';

const headers = ['THC', 'Size', 'Rate'];
const rateTable = {};

// Parse hash_table.csv, and build a JSON file
fs.createReadStream(__dirname + '/thc_hash_table.csv')
  .pipe(parse({ delimiter: ';', headers }))
  .on('error', (error) => console.error(error))
  .on('data', (row) => {
    if (!row.THC || !row.Size || !row.Rate) {
      throw new Error('Invalid row: ' + JSON.stringify({headers, row}));
    }

    if (row.THC === 'THC' && row.Size === 'Size' && row.Rate === 'Rate') {
      // Skip header row
      return;
    }

    let thc = row.THC.match(/[0-9]+/)?.[0];
    const size = Number(row.Size);
    let rate = row.Rate.match(/[0-9.-]+/)?.[0];
    if(!thc || isNaN(size) || !rate) {
      throw new Error('Invalid format: ' + JSON.stringify(row));
    }

    rate = Number(rate);
    if (!rateTable[thc]) {
      rateTable[thc] = { [size]: rate };
    } else {
      rateTable[thc][size] = rate;
    }
  })
  .on('end', (rowCount: number) => {
    console.log(`Parsed ${rowCount} rows`);
    fs.writeFileSync(__dirname + '/thc_hash_table.json', JSON.stringify(rateTable, null, 2));
  });
