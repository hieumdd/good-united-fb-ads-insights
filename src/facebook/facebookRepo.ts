import axios, { Axios, AxiosError } from 'axios';
import dayjs from 'dayjs';

import { InsightsOptions, PollReportId, InsightsResponse } from './facebook';
import { models } from './facebookModel';
import { getFields } from '../db/utils';
import { getAccessToken } from '../secret_manager/doppler';

const API_VER = 'v15.0';

const getClient = () =>
    getAccessToken().then((access_token) =>
        axios.create({
            baseURL: `https://graph.facebook.com/${API_VER}`,
            params: {
                access_token,
            },
        }),
    );

const requestReport = async (
    client: Axios,
    { accountId, start, end }: InsightsOptions,
): Promise<PollReportId | undefined> =>
    client
        .post(`/act_${accountId}/insights`, {
            fields: getFields(models),
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
                since: dayjs(start).format('YYYY-MM-DD'),
                until: dayjs(end).format('YYYY-MM-DD'),
            }),
            time_increment: 1,
        })
        .then(({ data }) => data.report_run_id);

const pollReport = async (
    client: Axios,
    reportId: PollReportId,
): Promise<PollReportId> => {
    const { data } = await client.get(`/${reportId}`);
    return data.async_percent_completion === 100 &&
        data.async_status === 'Job Completed'
        ? reportId
        : pollReport(client, reportId);
};

const getInsights = async (
    client: Axios,
    reportId: PollReportId,
): InsightsResponse => {
    const defaultParams = {
        limit: 500,
    };
    const _getInsights = async (_after = null): InsightsResponse => {
        const params = _after
            ? { ...defaultParams, after: _after }
            : defaultParams;
        const {
            data: {
                data,
                paging: {
                    cursors: { after },
                    next,
                },
            },
        } = await client.get(`/${reportId}/insights`, {
            params,
        });
        return next ? [...data, ...(await _getInsights(after))] : [...data];
    };

    return _getInsights();
};

const get = async (options: InsightsOptions): InsightsResponse => {
    const client = await getClient();
    const reportId = await requestReport(client, options);

    return reportId
        ? pollReport(client, reportId)
              .then((reportId) => getInsights(client, reportId))
              .catch((err: Error | AxiosError) => {
                  if (axios.isAxiosError(err)) {
                      console.log(
                          err.response ? err.response.data.error : err.toJSON(),
                      );
                  } else {
                      console.log(err);
                  }
                  throw err;
              })
        : [];
};

export default get;
