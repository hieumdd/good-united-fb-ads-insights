import dayjs from 'dayjs';

import { Pipeline } from './pipeline.const';
import { get } from './facebook.repository';
import { load } from '../db/mongo.service';

export type PipelineOptions = {
    accountId: string;
    start?: string;
    end?: string;
};

export const pipelineService = async (
    options: PipelineOptions,
    pipeline: Pipeline,
) => {
    const [start, end] = [
        options.start ? dayjs(options.start) : dayjs().subtract(7, 'days'),
        options.end ? dayjs(options.end) : dayjs(),
    ];

    return get({
        accountId: options.accountId,
        start,
        end,
        ...pipeline,
    }).then((data) =>
        load(data, { collection: pipeline.collection, keys: pipeline.keys }),
    );
};
