import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { InsightsRequest } from './facebook/facebook';
import { pipelineService } from './facebook/facebook.service';
import {
    eventPipelineService,
    taskService,
} from './good-united/good-united.service';

type Body = Partial<InsightsRequest>;

export const main: HttpFunction = async (req, res) => {
    const { body }: { body: Body } = req;

    console.log(body);

    const retryCount = req.get('X-CloudTasks-TaskRetryCount');

    if (retryCount && parseInt(retryCount) >= 3) {
        res.status(200).send({ ok: true });
    } else {
        const result = body.accountId
            ? await pipelineService(body as InsightsRequest)
            : await Promise.all([eventPipelineService(), taskService(body)]);

        console.log(result);

        res.status(200).send(result);
        return;
    }
};
