const axios = require('axios');
const dayjs = require('dayjs');

const { fields } = require('../models/models');

const API_VER = 'v12.0';
const instance = axios.create({
  baseURL: `https://graph.facebook.com/${API_VER}`,
});

const sendReportRequest = async ({ adAccountId, start, end }) => {
  const { data } = await instance.post(`/act_${adAccountId}/insights`, {
    access_token: process.env.ACCESS_TOKEN,
    fields: fields.filter((i) => !i.match(/api/)).join(','),
    filter: JSON.stringify([
      { field: 'ad.impressions', operator: 'GREATER_THAN', value: 0 },
      {
        field: 'campaign.name',
        operator: 'CONTAIN',
        value: `LEADS`,
      },
    ]),
    level: 'campaign',
    time_range: JSON.stringify({
      since: dayjs(start) > dayjs() ? dayjs().format('YYYY-MM-DD') : start,
      until: end,
    }),
    time_increment: 1,
  });
  return data.report_run_id;
};

const pollReport = async (reportId) => {
  const { data } = await instance.get(`/${reportId}`, {
    params: { access_token: process.env.ACCESS_TOKEN },
  });
  if (
    (data.async_percent_completion === 100) &
    (data.async_status === 'Job Completed')
  ) {
    return reportId;
  } else if (data.async_status === 'Job Failed') {
    throw 'Async job Failed';
  } else {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return pollReport(reportId);
  }
};

const getReportId = async (options) => {
  const reportId = await sendReportRequest(options);
  return pollReport(reportId);
};

const getData = async (reportId, after = null) => {
  const params = {
    access_token: process.env.ACCESS_TOKEN,
    limit: 500,
  };
  if (after) {
    params.after = after;
  }
  try {
    const {
      data: { data, paging },
    } = await instance.get(`/${reportId}/insights`, {
      params,
    });
    const { next } = paging;
    return next ? [...data, await getData(reportId, next)] : [...data];
  } catch (err) {
    return await getData(reportId, after);
  }
};

const getAdsInsights = async (options) => {
  try {
    const reportId = await getReportId(options);
    const data = await getData(reportId);
    return data.map((i) => ({
      ...i,
      apiNonProfit: options.nonProfit,
      apiCampaignId: options.campaignId,
    }));
  } catch (err) {
    const error = err.response.data?.error ?? err.message;
    console.log(error, options);
    return [
      {
        apiNonProfit: options.nonProfit,
        apiCampaignId: options.campaignId,
        apiAdAccountId: options.adAccountId,
        err: error,
      },
    ];
  }
};

module.exports = {
  getAdsInsights,
};
