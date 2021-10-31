import * as dotenv from 'dotenv';
dotenv.config();

import getAdsInsights from './controller/facebook';
import { loadMongo } from './controller/mongo';
import { getEvents, getAdAccounts } from './controller/goodUnited';
import * as facebook from './models/facebook';
import * as goodUnited from './models/goodUnited';
import { AdAccount, EventWithAdAccount } from './types/goodUnited';
import { MongoRes } from './types/mongo';

const handleFacebook = async (
  adAccounts: AdAccount[],
  start?: string,
  end?: string
): Promise<MongoRes | null> => {
  const allAdAccounts = adAccounts
    .map(({ ids }) => ids)
    .flat()
    .filter((i) => i);
  const data = await (
    await Promise.all(
      allAdAccounts.map((adAccountId) =>
        getAdsInsights({
          adAccountId,
          start,
          end,
        })
      )
    )
  )
    .flat(2)
    .filter((i) => !i.hasOwnProperty('err'));
  const [loadErr, loadResults] = await loadMongo(
    { model: facebook.models, keys: facebook.keys, fields: facebook.fields },
    data
  );
  if (loadErr || !loadResults) {
    console.log(loadErr);
    return null;
  }
  return loadResults;
};

const handleGoodUnited = async (
  eventsWithAdAccount: EventWithAdAccount[]
): Promise<MongoRes | null> => {
  const [loadErr, loadResults] = await loadMongo(
    {
      model: goodUnited.models,
      keys: goodUnited.keys,
      fields: goodUnited.fields,
    },
    eventsWithAdAccount
  );
  if (loadErr) {
    console.log(loadErr);
  }
  return loadResults;
};

const main = async (start?: string, end?: string) => {
  const [[errEvents, events], [errAdAccount, adAccounts]] = await Promise.all([
    getEvents(),
    getAdAccounts(),
  ]);
  if (errEvents || errAdAccount || !events || !adAccounts) {
    throw new Error();
  }
  const eventsWithAdAccount: EventWithAdAccount[] = events
    .map((event) => {
      const mappedAdAccount = adAccounts.find(
        (adAccount) => adAccount.adAccount === event.nonProfit
      );
      return mappedAdAccount
        ? mappedAdAccount.ids.map((id) => ({
            ...event,
            adAccountId: Number(id),
          }))
        : null!;
    })
    .filter((i) => i !== null)
    .flat();
  return Promise.all([
    handleGoodUnited(eventsWithAdAccount),
    handleFacebook(adAccounts, start, end),
  ]);
};

const [start, end] = process.argv.slice(2);
main(start, end).then((i) => console.log(JSON.stringify(i, null, 4)));
