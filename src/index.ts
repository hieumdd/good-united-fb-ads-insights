import { config } from 'dotenv';
config();
import axios from 'axios';

const API_VER: string = 'v12.0';
axios.defaults.baseURL = `https://graph.facebook.com/${API_VER}`;

const getReportId = async (adAccountId: string): Promise<string> => {
  try {
    const { data } = await axios.post(`/${adAccountId}/insights`, {
      access_token: process.env.ACCESS_TOKEN,
      level: 'ad',
      time_increment: 1,
    });
    return data.report_run_id;
  } catch (err) {
    console.log(err);
  }
};

const pollReport = async (reportId: string): Promise<string> => {
  try {
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
  } catch (err) {
    console.error(err);
  }
};

const getData = async (reportId: string, after: string = null) => {
  try {
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
  } catch (err) {
    console.error(err);
  }
};

const getAdsInsights = async (adAccountId: string) => {
  const reportId = await pollReport(await getReportId(adAccountId));
  const data = await getData(reportId);
  data;
};

getAdsInsights('act_3921338037921594');
