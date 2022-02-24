import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';

import {
    InsightsOptions,
    PollReportId,
    InsightsResponse,
} from './facebook';
import { models } from './facebookModel';
import { getFields } from '../db/utils';

const API_VER = 'v13.0';

const axClient = axios.create({
    baseURL: `https://graph.facebook.com/${API_VER}`,
});

axClient.interceptors.request.use((config) => ({
    ...config,
    params: {
        ...config.params,
        access_token: process.env.ACCESS_TOKEN,
    },
}));

const requestReport = async ({
    accountId,
    start,
    end,
}: InsightsOptions): Promise<PollReportId> => {
    const {
        data: { report_run_id },
    } = await axClient.post(`/act_${accountId}/insights`, {
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
    });
    return report_run_id;
};

const pollReport = async (reportId: PollReportId): Promise<PollReportId> => {
    const { data } = await axClient.get(`/${reportId}`);
    if (
        data.async_percent_completion === 100 &&
        data.async_status === 'Job Completed'
    ) {
        return reportId;
    }
    return pollReport(reportId);
};

const getInsights = async (reportId: PollReportId): InsightsResponse => {
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
        } = await axClient.get(`/${reportId}/insights`, {
            params,
        });
        return next ? [...data, ...(await _getInsights(after))] : [...data];
    };

    return  _getInsights();
};

const get = async (options: InsightsOptions): InsightsResponse => {
    return requestReport(options)
        .then((reportId) => pollReport(reportId))
        .then((reportId) => getInsights(reportId))
        .catch((err: Error | AxiosError) => {
            if (axios.isAxiosError(err)) {
                console.log(err.toJSON());
            } else {
                console.log(err);
            }
            throw err;
        });
};

export default get;
