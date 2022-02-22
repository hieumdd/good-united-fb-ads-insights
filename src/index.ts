import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { pipelineService } from './facebook/facebookService';
import { eventService, taskService } from './goodUnited/goodUnitedService';

const main: HttpFunction = async (req, res) => {
    const { body } = req;

    const result = body.adAccoundId
        ? await pipelineService(body)
        : await Promise.all([eventService(), taskService()]);

    res.send(JSON.stringify(result));
};

export default main;
