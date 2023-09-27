import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import dayjs from '../dayjs';
import { logger } from '../logging.service';
import { createUpsertStream } from '../mongo.service';
import { createTasks } from '../cloud-tasks.service';
import { CreatePipelineTasksBody, PipelineOptions } from './pipeline.request.dto';
import * as pipelines from './pipeline.const';
import { getAdAccounts, getEventWithAdAccounts } from '../good-united/good-united.service';

export const runInsightsPipeline = async (pipeline_: pipelines.Pipeline, options: PipelineOptions) => {
    logger.info({
        fn: 'pipeline.service:runPipeline',
        pipeline: pipeline_.upsertConfig.collection,
        options,
    });

    const [extractStream, { upsertStreams, callback }] = await Promise.all([
        pipeline_.getExtractStream(options),
        createUpsertStream(pipeline_.upsertConfig),
    ]);

    return pipeline(
        extractStream,
        new Transform({
            objectMode: true,
            transform: (row, _, callback) => {
                const { value, error } = pipeline_.validationSchema.validate(row);

                if (error) {
                    callback(error);
                    return;
                }

                callback(null, { ...value, _batched_at: dayjs().utc().toISOString() });
            },
        }),
        ...upsertStreams,
    )
        .then(() => callback())
        .then(() => true);
};

export const runDimensionPipeline = async () => {
    logger.info({ fn: 'pipeline.service:createInsightsPipelineTasks' });

    const [extractStream, { upsertStreams, callback }] = await Promise.all([
        getEventWithAdAccounts(),
        createUpsertStream({
            collection: 'Events',
            keys: ['adAccountId', 'eventId', 'nonProfit'],
        }),
    ]);

    return pipeline(Readable.from(extractStream), ...upsertStreams)
        .then(() => callback())
        .then(() => true);
};

export const createInsightsPipelineTasks = async ({ start, end }: CreatePipelineTasksBody) => {
    logger.info({ fn: 'createInsightsPipelineTasks', options: { start, end } });

    const accountIds = await getAdAccounts().then((accounts) => accounts.flatMap(({ ids }) => ids));

    return Promise.all(
        Object.keys(pipelines)
            .map((pipeline) => {
                return accountIds.map((accountId) => ({ accountId, start, end, pipeline }));
            })
            .map((data) => createTasks(data, (task) => [task.pipeline, task.accountId].join('-'))),
    ).then(() => true);
};
