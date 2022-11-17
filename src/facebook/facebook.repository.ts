import axios from 'axios';
import { Dayjs } from 'dayjs';

import { getSecret } from '../secret-manager/doppler.service';

export type InsightsOptions = {
    level: string;
    fields: string[];
    breakdowns?: string;
};

export type ReportOptions = {
    accountId: string;
    start: Dayjs;
    end: Dayjs;
};

type RequestReportResponse = {
    report_run_id: string;
};

type ReportStatusResponse = {
    async_percent_completion: number;
    async_status: string;
};

type InsightsData = Record<string, any>[];

type InsightsResponse = {
    data: InsightsData;
    paging: { cursors: { after: string }; next: string };
};

const getClient = async () => {
    const API_VER = 'v15.0';

    return getSecret('FACEBOOK_ACCESS_TOKEN').then((access_token) =>
        axios.create({
            baseURL: `https://graph.facebook.com/${API_VER}`,
            params: { access_token },
        }),
    );
};

export const get = async (options: InsightsOptions & ReportOptions): Promise<InsightsData> => {
    const client = await getClient();

    const requestReport = async (): Promise<string> => {
        return client
            .request<RequestReportResponse>({
                method: 'POST',
                url: `/act_${options.accountId}/insights`,
                data: {
                    level: options.level,
                    fields: options.fields,
                    breakdowns: options.breakdowns,
                    filter: [
                        {
                            field: 'ad.impressions',
                            operator: 'GREATER_THAN',
                            value: 0,
                        },
                        {
                            field: 'campaign.name',
                            operator: 'CONTAIN',
                            value: `LEADS`,
                        },
                    ],
                    time_range: JSON.stringify({
                        since: options.start.format('YYYY-MM-DD'),
                        until: options.end.format('YYYY-MM-DD'),
                    }),
                    time_increment: 1,
                },
            })
            .then(({ data }) => data.report_run_id);
    };

    const pollReport = async (reportId: string): Promise<string> => {
        const data = await client
            .request<ReportStatusResponse>({
                method: 'GET',
                url: `/${reportId}`,
            })
            .then((res) => res.data);

        return data.async_percent_completion === 100 && data.async_status === 'Job Completed'
            ? reportId
            : pollReport(reportId);
    };

    const getInsights = async (reportId: string): Promise<InsightsData> => {
        const _getInsights = async (after?: string): Promise<InsightsData> => {
            const data = await client
                .request<InsightsResponse>({
                    method: 'GET',
                    url: `/${reportId}/insights`,
                    params: { after, limit: 500 },
                })
                .then((res) => res.data);

            return data.paging.next
                ? [...data.data, ...(await _getInsights(data.paging.cursors.after))]
                : data.data;
        };

        return _getInsights();
    };

    return requestReport()
        .then(pollReport)
        .then(getInsights)
        .catch((err) => {
            if (axios.isAxiosError(err)) {
                console.log('facebook error', JSON.stringify(err.response?.data));
            }
            return [];
        });
};
