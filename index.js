require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

const { fbAdsSchema, FacebookAdsInsights } = require('./models');

const API_VER = 'v12.0';
axios.defaults.baseURL = `https://graph.facebook.com/${API_VER}`;

const mongoClient = new MongoClient(process.env.MONGO_URI);

const getReportId = async (adAccountId, attempt = 0) => {
  try {
    return pollReport(sendReportRequest(adAccountId));
  } catch (err) {
    console.log(err.message, attempt);
    return await getReportId(adAccountId, attempt + 1);
  }
};

const sendReportRequest = async (adAccountId) => {
  const { data } = await axios.post(`/${adAccountId}/insights`, {
    access_token: process.env.ACCESS_TOKEN,
    fields: Object.entries(fbAdsSchema.obj)
      .map((i) => i[0])
      .join(','),
    level: 'ad',
    time_increment: 1,
  });
  return data.report_run_id;
};

const pollReport = async (reportId) => {
  const { data } = await axios.get(`/${reportId}`, {
    params: { access_token: process.env.ACCESS_TOKEN },
  });
  return data.async_percent_completion === 100
    ? reportId
    : new Promise((resolve) =>
        setTimeout(() => {
          setTimeout(() => resolve(pollReport(reportId)));
        }, 10000)
      );
};

const getData = async (reportId, after = null) => {
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

const getAdsInsights = async (adAccountId) => {
  const reportId = await pollReport(await getReportId(adAccountId));
  const data = await getData(reportId);
  return data;
};

const loadMongo = async (data) => {
  await mongoClient.connect();
  const actionTypeMap = ({ action_type, value }) => ({
    action_type,
    value: Number(value),
  });
  const bulkUpdateOps = data.map((item) => ({
    updateOne: {
      filter: {
        date_start: new Date(item.date_start),
        date_stop: new Date(item.date_stop),
        account_id: parseInt(item.account_id),
        account_name: item.account_name,
        campaign_id: parseInt(item.campaign_id),
        campaign_name: item.campaign_name,
        adset_id: parseInt(item.adset_id),
        adset_name: item.adset_name,
        ad_id: parseInt(item.ad_id),
        ad_name: item.ad_name,
      },
      update: {
        $set: {
          date_start: new Date(item.date_start),
          date_stop: new Date(item.date_stop),
          account_id: Number(item.account_id),
          account_name: item.account_name,
          campaign_id: Number(item.campaign_id),
          campaign_name: item.campaign_name,
          adset_id: Number(item.adset_id),
          adset_name: item.adset_name,
          ad_id: Number(item.ad_id),
          ad_name: item.ad_name,
          account_currency: item.account_currency,
          actions: item.actions.map(actionTypeMap),
          action_values: item.action_values.map(actionTypeMap),
          clicks: Number(item.clicks),
          conversion_rate_ranking: item.conversion_rate_ranking,
          conversion_values: item.conversion_values.map(actionTypeMap),
          conversions: item.conversion_values.map(actionTypeMap),
          cost_per_action_type: item.cost_per_action_type.map(actionTypeMap),
          cost_per_conversion: item.cost_per_conversion.map(actionTypeMap),
          cost_per_unique_action_type:
            item.cost_per_unique_action_type.map(actionTypeMap),
          cost_per_unique_click: Number(item.cost_per_unique_click),
          cpc: Number(item.cpc),
          cpm: Number(item.cpm),
          ctr: Number(item.ctr),
          engagement_rate_ranking: item.engagement_rate_ranking,
          frequency: Number(item.frequency),
          impressions: Number(item.impressions),
          inline_link_click_ctr: Number(item.inline_link_click_ctr),
          inline_link_clicks: Number(item.inline_link_clicks),
          objective: item.objective,
          optimization_goal: item.optimization_goal,
          quality_ranking: item.quality_ranking,
          reach: Number(item.reach),
          spend: Number(item.spend),
          unique_actions: item.unique_actions.map(actionTypeMap),
          unique_clicks: Number(item.unique_clicks),
          unique_ctr: Number(item.unique_ctr),
          unique_link_clicks_ctr: Number(item.unique_link_clicks_ctr),
          video_30_sec_watched_actions:
            item.video_30_sec_watched_actions.map(actionTypeMap),
          video_p100_watched_actions:
            item.video_p100_watched_actions.map(actionTypeMap),
          video_p25_watched_actions:
            item.video_p25_watched_actions.map(actionTypeMap),
          video_p50_watched_actions:
            item.video_p50_watched_actions.map(actionTypeMap),
          video_p75_watched_actions:
            item.video_p75_watched_actions.map(actionTypeMap),
          video_p95_watched_actions:
            item.video_p95_watched_actions.map(actionTypeMap),
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
