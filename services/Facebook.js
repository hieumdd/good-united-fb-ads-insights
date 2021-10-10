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

const pollReport = async (reportId, attempt = 0) => {
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
  } else if (attempt <= 20) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('Polling', reportId);
    return pollReport(reportId);
  } else if (attempt > 20) {
    throw 'Async job Timeout';
  }
};

const getReportId = async (options, attempt = 0) => {
  try {
    const reportId = await sendReportRequest(options);
    return pollReport(reportId);
  } catch (err) {
    if (err.isAxiosError & (err.response?.status === 400)) {
      throw err;
    } else if (attempt < 2) {
      return getReportId(options, attempt + 1);
    } else {
      console.log(err);
      throw err;
    }
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
  try {
    const {
      data: { data, paging },
    } = await instance.get(`/${reportId}/insights`, {
      params,
    });
    const {
      cursors: { after },
      next,
    } = paging;
    return next ? [...data, await getData(reportId, after)] : [...data];
  } catch (err) {
    if (err.isAxiosError & (err.response?.status === 400)) {
      throw err;
    } else {
      return await getData(reportId, after);
    }
  }
};

const getAdsInsights = async (options) => {
  try {
    const reportId = await getReportId(options);
    const data = await getData(reportId);
    return data.map((i) => ({
      ...i,
      apiEventId: options.eventId,
      apiNonProfit: options.nonProfit,
    }));
  } catch (err) {
    const error = err.response?.data.error ?? err.message;
    console.log(error, options);
    return [
      {
        apiNonProfit: options.nonProfit,
        apiEventId: options.campaignId,
        apiAdAccountId: options.adAccountId,
        err: error,
      },
    ];
  }
};

module.exports = {
  getAdsInsights,
};
