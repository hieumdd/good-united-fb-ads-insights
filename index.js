require('dotenv').config();
const fs = require('fs/promises');
const axios = require('axios');
// const dayjs = require('dayjs');
const { groupBy } = require('lodash');

const { getAdsInsights } = require('./services/Facebook');
const { loadMongo } = require('./services/Mongo');
const { FacebookAdsInsights, keys, fields } = require('./models/models');

const instance = axios.create({
  baseURL: 'https://abc.1gu.xyz',
  headers: {
    key: process.env.API_KEY,
  },
});

const getAdAccounts = async () => {
  const { data } = await instance.get('/adAccounts');
  return Object.entries(data).map(([key, value]) => ({
    adAccount: key,
    ids: value.map((i) => i.trim()).map((i) => i || null),
  }));
};

const getEvents = async () => {
  const { data } = await instance.get('/events');
  return data.map((i) => ({
    eventId: i['ID'],
    nonProfit: i['Nonprofit'],
    start: i['Live Date'],
    end: i['Start Date'],
  }));
};

const main = async () => {
  const [events, adAccounts] = await Promise.all([
    getEvents(),
    getAdAccounts(),
  ]);
  const eventsWithAdAccount = events
    .map((event) => {
      const mappedAdAccount = adAccounts.find(
        (adAccount) => adAccount.adAccount === event.nonProfit
      );
      return mappedAdAccount.ids.map((id) => ({
        ...event,
        adAccountId: id,
      }));
    })
    .flat();
  // const eventsRecent = eventsWithAdAccount.filter(
  //   ({ end }) => dayjs(end) > dayjs().subtract(8, 'd')
  // );
  const eventsGrouped = Object.entries(
    groupBy(eventsWithAdAccount, ({ adAccountId, start, end }) =>
      JSON.stringify({ adAccountId, start, end })
    )
  )
    .map(([options, event]) => ({
      options: JSON.parse(options),
      event,
    })).slice(1, 5);
  const results = await (
    await Promise.all(
      eventsGrouped.map(async (i) => ({
        event: i.event,
        data: await getAdsInsights(i.options),
      }))
    )
  ).map(({ event, data }) =>
    event.map((i) =>
      data.map((d) => ({
        ...d,
        apiEventId: i.eventId,
        apiNonProfit: i.nonProfit,
      }))
    )
  ).flat(2);
  const data = results.filter((i) => !i['err']);
  const err = results.filter((i) => i['err']);
  const [loadErr, loadResults] = await loadMongo(
    { model: FacebookAdsInsights, keys, fields },
    data
  );
  if (loadErr) return console.log(loadErr);
  await fs.writeFile('exports/errors.json', JSON.stringify(err, null, 4));
  return {
    err,
    loadResults,
  };
};

main().then((run) => console.log(JSON.stringify(run, null, 4)));
