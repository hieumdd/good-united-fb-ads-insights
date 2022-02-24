import 'dotenv/config';
import axios from 'axios';
import dayjs from 'dayjs';

import { InsightsData, InsightsOptions, PollReportId, InsightsResponse } from './facebook';
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
}: InsightsOptions): PollReportId => {
    try {
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
        return [null, report_run_id];
    } catch (err) {
        console.error(err);
        return [err, null];
    }
};

const pollReport = async (reportId: string): PollReportId => {
    try {
        const { data } = await axClient.get(`/${reportId}`);
        if (
            data.async_percent_completion === 100 &&
            data.async_status === 'Job Completed'
        ) {
            return [null, reportId];
        }
        return pollReport(reportId);
    } catch (err) {
        console.error(err);
        return [err, null];
    }
};

const getReport = async (options: InsightsOptions): PollReportId => {
    const [getReportErr, reportId] = await requestReport(options);
    if (getReportErr || !reportId) return [getReportErr, null];
    return pollReport(reportId);
};

const getInsights = async (reportId: string): InsightsResponse => {
    const defaultParams = {
        limit: 500,
    };
    const _getInsights = async (_after = null): Promise<InsightsData[]> => {
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

    try {
        return [null, await _getInsights()];
    } catch (err) {
        console.error(err);
        return [err, null];
    }
};

const get = async (options: InsightsOptions): Promise<InsightsData[]> => {
    const handleErr = (_: any) => [];

    const [getReportErr, reportId] = await getReport(options);

    if (getReportErr || !reportId) return handleErr(getReportErr);

    const [getInsightsErr, data] = await getInsights(reportId);

    if (getInsightsErr || !data) return handleErr(getInsightsErr);

    return data;
};

export default get;
