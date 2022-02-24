import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { pipelineService } from './facebook/facebookService';
import { eventService, taskService } from './goodUnited/goodUnitedService';

export const main: HttpFunction = async (req, res) => {
    const { body } = req;

    console.log(body);

    const result = body?.accountId
        ? await pipelineService(body)
        : await Promise.all([eventService(), taskService()]);

    console.log(JSON.stringify(result, null, 4));

    res.send(result);
};
