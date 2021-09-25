require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const { FacebookAdsInsights, keys, fields } = require('./models');

const API_VER = 'v12.0';
axios.defaults.baseURL = `https://graph.facebook.com/${API_VER}`;

const getReportId = async (adAccountId, attempt = 0) => {
  try {
    return pollReport(await sendReportRequest(adAccountId));
  } catch (err) {
    console.log(err.message, attempt);
    return await getReportId(adAccountId, attempt + 1);
  }
};

const sendReportRequest = async (adAccountId) => {
  const { data } = await axios.post(`/${adAccountId}/insights`, {
    access_token: process.env.ACCESS_TOKEN,
    fields,
    level: 'ad',
    time_range: JSON.stringify({ since: '2021-09-01', until: '2021-09-05' }),
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
  await mongoose.connect(process.env.MONGO_URI);
  const bulkUpdateOps = data.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(keys.map((i) => [i, item[i]])),
      update: Object.fromEntries(fields.map((i) => [i, item[i]])),
      upsert: true,
    },
  }));
  try {
    const { modifiedCount } = await FacebookAdsInsights.bulkWrite(
      bulkUpdateOps
    );
    return modifiedCount;
  } catch (err) {
    console.log(err.message);
  }
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
