import { config } from 'dotenv';
config();
import axios from 'axios';
import { MongoClient } from 'mongodb';

const API_VER: string = 'v12.0';
axios.defaults.baseURL = `https://graph.facebook.com/${API_VER}`;

const mongoClient = new MongoClient(process.env.MONGO_URI);

const getReportId = async (adAccountId: string): Promise<string> => {
  const { data } = await axios.post(`/${adAccountId}/insights`, {
    access_token: process.env.ACCESS_TOKEN,
    level: 'ad',
    time_increment: 1,
  });
  return data.report_run_id;
};

const pollReport = async (reportId: string): Promise<string> => {
  const { data } = await axios.get(`/${reportId}`, {
    params: { access_token: process.env.ACCESS_TOKEN },
  });
  return data.async_percent_completion === 100
    ? reportId
    : new Promise((resolve) =>
        setTimeout(() => {
          setTimeout(() => resolve(pollReport(reportId)));
        }, 5000)
      );
};

const getData = async (
  reportId: string,
  after: string = null
): Promise<Array<Object>> => {
  const params = {
    access_token: process.env.ACCESS_TOKEN,
    limit: 500,
  };
  if (after) {
    params['after'] = after;
  }
  const {
    data: { data, paging },
  } = await axios.get(`/${reportId}/insights`, {
    params,
  });
  const { next } = paging;
  return next ? [...data, await getData(reportId, next)] : [...data];
};

const getAdsInsights = async (adAccountId: string): Promise<Array<Object>> => {
  const reportId = await pollReport(await getReportId(adAccountId));
  const data = await getData(reportId);
  return data;
};

const loadMongo = async (data: Array<Object>) => {
  await mongoClient.connect();
  const bulkUpdateOps = data.map((item: any) => ({
    updateOne: {
      filter: {
        account_id: item.account_id,
        campaign_id: item.campaign_id,
        adset_id: item.adset_id,
        date_start: item.date_start,
        date_stop: item.date_stop,
      },
      update: {
        $set: {
          account_id: parseInt(item.account_id),
          campaign_id: parseInt(item.campaign_id),
          adset_id: parseInt(item.adset_id),
          date_start: new Date(item.date_start),
          date_stop: new Date(item.date_stop),
          impressions: parseInt(item.impressions),
          spend: parseInt(item.spend),
        },
      },
      upsert: true,
    },
  }));
  const collection = mongoClient.db('dev').collection('fb_ads_raw');
  const { modifiedCount } = await collection.bulkWrite(bulkUpdateOps);
  await mongoClient.close();
  return modifiedCount;
};

const main = async () => {
  const adAccountIds = ['act_3921338037921594'];
  const data = await Promise.all(
    adAccountIds.map(async (adAccountId) => await getAdsInsights(adAccountId))
  );
  const modifiedCount = await loadMongo(data.flat());
  console.log({ modifedCount: modifiedCount });
};

main();
