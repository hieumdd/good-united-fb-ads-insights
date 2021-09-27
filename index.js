require('dotenv').config();
const dayjs = require('dayjs');
const axios = require('axios');
const mongoose = require('mongoose');

const { FacebookAdsInsights, keys, fields } = require('./models');

const API_VER = 'v12.0';
axios.defaults.baseURL = `https://graph.facebook.com/${API_VER}`;

const sendReportRequest = async (adAccountId, start, end) => {
  const { data } = await axios.post(`/${adAccountId}/insights`, {
    access_token: process.env.ACCESS_TOKEN,
    fields: fields.join(','),
    filter: JSON.stringify([
      { field: 'ad.impressions', operator: 'GREATER_THAN', value: 0 },
      {
        field: 'ad.effective_status',
        operator: 'IN',
        value: [
          'ACTIVE',
          'PAUSED',
          'DELETED',
          'PENDING_REVIEW',
          'DISAPPROVED',
          'PREAPPROVED',
          'PENDING_BILLING_INFO',
          'CAMPAIGN_PAUSED',
          'ARCHIVED',
          'ADSET_PAUSED',
          'IN_PROCESS',
          'WITH_ISSUES',
        ],
      },
    ]),
    level: 'campaign',
    time_range: JSON.stringify({ since: start, until: end }),
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

const getReportId = async (adAccountId, start, end, attempt = 0) => {
  try {
    return pollReport(await sendReportRequest(adAccountId, start, end));
  } catch (err) {
    console.log(err.message, attempt);
    return getReportId(adAccountId, start, end, attempt + 1);
  }
};

const getData = async (reportId, after = null) => {
  const params = {
    access_token: process.env.ACCESS_TOKEN,
    limit: 500,
  };
  if (after) {
    params.after = after;
  }
  const {
    data: { data, paging },
  } = await axios.get(`/${reportId}/insights`, {
    params,
  });
  const { next } = paging;
  return next ? [...data, await getData(reportId, next)] : [...data];
};

const getAdsInsights = async (adAccountId, start = null, end = null) => {
  const [_start, _end] =
    [start, end] ??
    [dayjs(), dayjs().subtract(7, 'day')].map((i) => i.format('YYYY-MM-DD'));
  const reportId = await pollReport(
    await getReportId(adAccountId, _start, _end)
  );
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
  let modifiedCount = null;
  try {
    ({ modifiedCount } = await FacebookAdsInsights.bulkWrite(bulkUpdateOps));
  } catch (err) {
    console.log(err.message);
  } finally {
    mongoose.disconnect();
  }
  return modifiedCount;
};

const main = async () => {
  const [start, end] = ['2021-09-01', '2021-09-05'];
  const adAccountIds = ['act_3921338037921594'];
  const data = await Promise.all(
    adAccountIds.map(async (adAccountId) =>
      getAdsInsights(adAccountId, start, end)
    )
  );

  const modifiedCount = await loadMongo(data.flat());
  console.log({ modifiedCount });
};

main();
