import dayjs from 'dayjs';

import { Pipeline } from './pipeline.const';
import { get } from './facebook.repository';

type PipelineOptions = {
    pipeline: Pipeline;
    accountId: string;
    start?: string;
    end?: string;
};

export const pipelineService = async (options: PipelineOptions) => {
    const [start, end] = [
        options.start ? dayjs(options.start) : dayjs().subtract(7, 'days'),
        options.end ? dayjs(options.end) : dayjs(),
    ];

    return get({
        level: options.pipeline.level,
        fields: options.pipeline.fields,
        accountId: options.accountId,
        start,
        end,
    });
};
