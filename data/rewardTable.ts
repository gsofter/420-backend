import * as fs from 'fs';
import { parse } from 'fast-csv';

const headers = ['Reward', 'Probability'];
const rateTable = {};

// Parse hash_table.csv, and build a JSON file
fs.createReadStream(__dirname + '/Reward_hash_table.csv')
  .pipe(parse({ delimiter: ';', headers }))
  .on('error', (error) => console.error(error))
  .on('data', (row) => {
    if (!row.Reward || !row.Probability) {
      throw new Error('Invalid row: ' + JSON.stringify({headers, row}));
    }

    if (row.Reward === 'Reward' && row.Probability === 'Probability') {
      // Skip header row
      return;
    }

    let reward = Number(row.Reward);
    let prob = Math.floor(Number(row.Probability) * 100);
    if(isNaN(reward) || isNaN(prob)) {
      throw new Error('Invalid format: ' + JSON.stringify(row));
    }

    if (!rateTable[prob]) {
      rateTable[prob] = [reward];
    } else {
      rateTable[prob].push(reward)
    }
  })
  .on('end', (rowCount: number) => {
    console.log(`Parsed ${rowCount} rows`);
    fs.writeFileSync(__dirname + '/hashTableReward.json', JSON.stringify(rateTable, null, 2));
  });
