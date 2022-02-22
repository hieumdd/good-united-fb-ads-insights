import axios from 'axios';
import * as dayjs from 'dayjs';

import { fields } from '../models/facebook';

import type { FBAdsOpts, PollReportId, FBAdsErr } from '../types/facebook';
import type { FBAdsRes } from '../types/models';

const API_VER = 'v12.0';
const axClient = axios.create({
  baseURL: `https://graph.facebook.com/${API_VER}`,
});
axClient.interceptors.request.use((config) => {
  config.params = {
    access_token: process.env.ACCESS_TOKEN,
    ...config.params,
  };
  return config;
});

const sendReportRequest = async ({
  adAccountId,
  start,
  end,
}: FBAdsOpts): PollReportId => {
  try {
    const { data } = await axClient.post(`/act_${adAccountId}/insights`, {
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
        since: start || dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        until: end || dayjs().format('YYYY-MM-DD'),
      }),
      time_increment: 1,
    });
    return [null, data.report_run_id];
  } catch (err) {
    return [err, null];
  }
};

const pollReport = async (reportId: string, attempt = 0): PollReportId => {
  try {
    const { data } = await axClient.get(`/${reportId}`);
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

const getReportId = async (options: FBAdsOpts): PollReportId => {
  const [getReportErr, reportId] = await sendReportRequest(options);
  if (getReportErr || !reportId) return [getReportErr, null];
  return pollReport(reportId);
};

const getData = async (
  reportId: string
): Promise<[unknown | null, any[] | null]> => {
  const getFromReport = async (_after = null): Promise<any[]> => {
    const params: any = {
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
    } = await axClient.get(`/${reportId}/insights`, {
      params,
    });
    return next ? [...data, ...(await getFromReport(after))] : [...data];
  };

  try {
    return [null, await getFromReport()];
  } catch (err) {
    return [err, null];
  }
};

const getAdsInsights = async (
  options: FBAdsOpts
): Promise<FBAdsRes[] | FBAdsErr[]> => {
  const handleErr = (err: any) => {
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
  if (getReportErr || !reportId) return handleErr(getReportErr);
  const [getInsightsErr, data] = await getData(reportId);
  if (getInsightsErr || !data) return handleErr(getInsightsErr);
  if (data) console.log('Done', options);
  return data;
};

export default getAdsInsights;
