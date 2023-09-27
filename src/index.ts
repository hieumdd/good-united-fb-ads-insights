import { http } from '@google-cloud/functions-framework';
import express from 'express';

import { logger } from './logging.service';
import * as pipelines from './pipeline/pipeline.const';
import { runInsightsPipeline, runDimensionPipeline, createInsightsPipelineTasks } from './pipeline/pipeline.service';
import { CreatePipelineTasksBodySchema, RunPipelineBodySchema } from './pipeline/pipeline.request.dto';

const app = express();

app.use(({ headers, path, body }, _, next) => {
    logger.info({ headers, path, body });
    next();
});

app.use('/task', ({ body }, res) => {
    CreatePipelineTasksBodySchema.validateAsync(body)
        .then((options) => {
            Promise.all([createInsightsPipelineTasks(options), runDimensionPipeline()])
                .then((result) => {
                    res.status(200).json({ result });
                })
                .catch((error) => {
                    logger.error({ error });
                    res.status(500).json({ error });
                });
        })
        .catch((error) => {
            logger.warn({ error });
            res.status(400).json({ error });
        });
});

app.use('/', ({ body }, res) => {
    RunPipelineBodySchema.validateAsync(body)
        .then((value) => {
            runInsightsPipeline(pipelines[value.pipeline], {
                accountId: value.accountId,
                start: value.start,
                end: value.end,
            })
                .then((result) => {
                    res.status(200).json({ result });
                })
                .catch((error) => {
                    logger.error({ error });
                    res.status(500).json({ error });
                });
        })
        .catch((error) => {
            logger.warn({ error });
            res.status(400).json({ error });
        });
});

http('main', app);
