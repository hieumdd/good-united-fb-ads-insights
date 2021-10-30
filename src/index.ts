import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs/promises';

import getAdsInsights from './controller/facebook';
import { loadMongo } from './controller/mongo';
import { models, keys, fields } from './models/models';
import { getEvents, getAdAccounts } from './controller/goodUnited';

const main = async (start?: string, end?: string) => {
  const [[errEvents, events], [errAdAccount, adAccounts]] = await Promise.all([
    getEvents(),
    getAdAccounts(),
  ]);
  if (errEvents || errAdAccount || !events || !adAccounts) {
    throw new Error();
  }
  const allAdAccounts = adAccounts
    .map(({ ids }) => ids)
    .flat()
    .filter((i) => i);
  const results = await Promise.all(
    allAdAccounts.map((adAccountId) =>
      getAdsInsights({
        adAccountId,
        start,
        end,
      })
    )
  );
  const err = results.filter((i) => i.hasOwnProperty('err'));
  const data = results.filter((i) => !i.hasOwnProperty('err'));
  const [loadErr, loadResults] = await loadMongo(
    { model: models, keys, fields },
    data
  );
  if (loadErr) return console.log(loadErr);
  await fs.writeFile('exports/errors.json', JSON.stringify(err, null, 4));
  return loadResults;
};

const [start, end] = process.argv.slice(2);
main(start, end).then((i) => console.log(i));
