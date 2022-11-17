import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { pipelines } from './facebook/pipeline.const';
import { pipelineService } from './facebook/facebook.service';
import { eventService, taskService } from './good-united/good-united.service';

type Body = {
    pipeline: keyof typeof pipelines;
    accountId?: string;
    start?: string;
    end?: string;
};

export const main: HttpFunction = async (req, res) => {
    const { body }: { body: Body } = req;

    console.log('body', JSON.stringify(body));

    const retryCount = req.get('X-CloudTasks-TaskRetryCount');

    if (retryCount && parseInt(retryCount) >= 3) {
        res.status(200).send({ ok: true });
    } else if (body.accountId && body.pipeline) {
        pipelineService(
            {
                accountId: body.accountId,
                start: body.start,
                end: body.end,
            },
            pipelines[body.pipeline],
        ).then((result) => res.status(200).json({ result }));
    } else if (!body.accountId && body.pipeline) {
        await Promise.all([eventService(), taskService(body)]).then((result) =>
            res.status(200).json({ result }),
        );
    } else {
        res.status(400).json({ error: 'error' });
    }
};
