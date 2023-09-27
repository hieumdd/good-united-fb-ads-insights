import { setTimeout } from 'node:timers/promises';

import { logger } from '../logging.service';
import { getClient, getExtractStream } from './api.service';
import { PipelineOptions } from '../pipeline/pipeline.request.dto';

export type GetInsightsConfig = {
    level: string;
    fields: string[];
    breakdowns?: string;
};

export const getInsightsStream = (config: GetInsightsConfig) => {
    return async (options: PipelineOptions) => {
        const client = await getClient();

        const requestReport = async (): Promise<string> => {
            type RequestReportResponse = {
                report_run_id: string;
            };

            const { accountId, start: since, end: until } = options;
            const { level, fields, breakdowns } = config;

            return client
                .request<RequestReportResponse>({
                    method: 'POST',
                    url: `/act_${accountId}/insights`,
                    data: {
                        level,
                        fields,
                        breakdowns,
                        time_range: JSON.stringify({ since, until }),
                        time_increment: 1,
                    },
                })
                .then(({ data }) => data.report_run_id);
        };

        const pollReport = async (reportId: string): Promise<string> => {
            type ReportStatusResponse = {
                async_percent_completion: number;
                async_status: string;
            };

            const data = await client
                .request<ReportStatusResponse>({ method: 'GET', url: `/${reportId}` })
                .then((response) => response.data);

            if (data.async_percent_completion === 100 && data.async_status === 'Job Completed') {
                return reportId;
            }

            if (data.async_status === 'Job Failed') {
                logger.error(data);
                throw new Error(JSON.stringify(data));
            }

            await setTimeout(20_000);

            return pollReport(reportId);
        };

        return requestReport()
            .then(pollReport)
            .then((reportId) => {
                return getExtractStream(client, (after) => ({
                    method: 'GET',
                    url: `/${reportId}/insights`,
                    params: { after, limit: 500 },
                }));
            });
    };
};
