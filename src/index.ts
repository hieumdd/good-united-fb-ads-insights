import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { Pipeline } from './facebook/pipeline.const';
import { pipelineService } from './facebook/facebook.service';
import { eventService, taskService } from './good-united/good-united.service';

type Body = {
    accountId: string;
    start?: string;
    end?: string;
    pipeline: Pipeline;
};

export const main: HttpFunction = async (req, res) => {
    const { body }: { body: Body } = req;

    console.log('body', JSON.stringify(body));

    console.log('accountId', body.accountId);

    const retryCount = req.get('X-CloudTasks-TaskRetryCount');

    if (retryCount && parseInt(retryCount) >= 3) {
        res.status(200).send({ ok: true });

        return;
    } else {
        const result = body.accountId
            ? await pipelineService(
                  {
                      accountId: body.accountId,
                      start: body.start,
                      end: body.end,
                  },
                  body.pipeline,
              )
            : await Promise.all([eventService(), taskService(body)]);

        console.log('result', JSON.stringify(result));

        res.status(200).json({ result });

        return;
    }
};
