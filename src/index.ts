import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

import { pipelineService } from './facebook/facebookService';
import { eventService, taskService } from './goodUnited/goodUnitedService';

export const main: HttpFunction = async (req, res) => {
    const { body } = req;

    console.log('body', body);

    console.log('accountId', body?.accountId);

    // const result = body?.accountId
    //     ? await pipelineService(body)
    //     : await Promise.all([eventService(), taskService()]);

    // const result = await pipelineService(body);

    const result = {
        a: 1,
    };

    let resultJSON;
    
    setTimeout(() => {
        resultJSON = JSON.stringify(result);
        console.log(resultJSON);
    }, 30000);

    res.send(resultJSON);
};
