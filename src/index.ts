import { http } from '@google-cloud/functions-framework';
import express from 'express';

import { logger } from './logging.service';
import { pipelines } from './facebook/pipeline.const';
import { pipelineService } from './facebook/facebook.service';
import { eventService, taskService } from './good-united/good-united.service';

const app = express();

app.use(({ headers, path, body }, _, next) => {
    logger.info({ headers, path, body });
    next();
});

type Body = {
    pipeline: keyof typeof pipelines;
    accountId?: string;
    start?: string;
    end?: string;
};

app.use('/', (req, res) => {
    const body = req.body as Body;

    if (body.accountId && body.pipeline) {
        pipelineService(
            { accountId: body.accountId, start: body.start, end: body.end },
            pipelines[body.pipeline],
        )
            .then((result) => res.status(200).json({ result }))
            .catch((error) => {
                logger.error({ error });
                res.status(500).json({ error });
            });
        return;
    }

    if (!body.accountId && body.pipeline) {
        Promise.all([eventService(), taskService(body)])
            .then((result) => res.status(200).json({ result }))
            .catch((error) => {
                logger.error({ error });
                res.status(500).json({ error });
            });
        return;
    }
});

http('main', app);
