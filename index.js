require('dotenv').config();
const fs = require('fs/promises');
const axios = require('axios');

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
    ids: value.map((i) => i.trim()).map((i) => (i ? i : null)),
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
  const events = await getEvents();
  const adAccounts = await getAdAccounts();
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
    .flat()
    .filter(({ nonProfit }) => nonProfit !== 'American Cancer Society');
  const results = await (
    await Promise.all(
      eventsWithAdAccount.map(async (i) => await getAdsInsights(i))
    )
  ).flat();
  const data = results.filter((i) => !i['err']);
  const err = results.filter((i) => i['err']);
  const loadResults = await loadMongo(
    { model: FacebookAdsInsights, keys, fields },
    data
  );
  await fs.writeFile('exports/errors.json', JSON.stringify(err, null, 4));
  return {
    err,
    loadResults,
  };
};

main().then((run) => console.log(JSON.stringify(run, null, 4)));
