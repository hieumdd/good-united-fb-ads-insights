const axios = require('axios');
const dayjs = require('dayjs');

const { fields } = require('../models/models');

const API_VER = 'v12.0';
const instance = axios.create({
  baseURL: `https://graph.facebook.com/${API_VER}`,
});

const sendReportRequest = async ({ adAccountId, start, end }) => {
  try {
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
    return [null, data.report_run_id];
  } catch (err) {
    return [err, null];
  }
};

const pollReport = async (reportId, attempt = 0) => {
  try {
    const { data } = await instance.get(`/${reportId}`, {
      params: { access_token: process.env.ACCESS_TOKEN },
    });
    if (
      data.async_percent_completion === 100 &&
      data.async_status === 'Job Completed'
    ) {
      return [null, reportId];
    }
    if (data.async_status === 'Job Failed')
      return [Error('Async Failed'), null];
    if (attempt > 20) return [Error('Async Timeout'), null];
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('Polling', reportId);
    return pollReport(reportId);
  } catch (err) {
    return [err, null];
  }
};

const getReportId = async (options) => {
  const [getReportErr, reportId] = await sendReportRequest(options);
  if (getReportErr) return [getReportErr, null];
  return pollReport(reportId);
};

const getData = async (reportId) => {
  const getFromReport = async (_after = null) => {
    const params = {
      access_token: process.env.ACCESS_TOKEN,
      limit: 500,
    };
    if (_after) {
      params.after = _after;
    }
    const {
      data: {
        data,
        paging: {
          cursors: { after },
          next,
        },
      },
    } = await instance.get(`/${reportId}/insights`, {
      params,
    });
    return next ? [...data, await getFromReport(after)] : [...data];
  };

  try {
    return [null, await getFromReport()];
  } catch (err) {
    return [err, null];
  }
};

const getAdsInsights = async (options) => {
  const handleErr = (err) => {
    let message;
    if (err.isAxiosError) {
      message = err.response?.data.error.message;
    }
    console.log(message ?? err, options);
    return [
      {
        ...options,
        err: message ?? err,
      },
    ];
  };

  const [getReportErr, reportId] = await getReportId(options);
  if (getReportErr) return handleErr(getReportErr);

  const [getInsightsErr, data] = await getData(reportId);
  if (getInsightsErr) return handleErr(getInsightsErr);
  if (data) console.log('Done', options);
  return data;
};

module.exports = {
  getAdsInsights,
};
