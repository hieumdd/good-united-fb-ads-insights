import * as pipelines from './pipeline.const';
import {
    runDimensionPipeline,
    runInsightsPipeline,
    createInsightsPipelineTasks,
} from './pipeline.service';

it('runInsightsPipeline', async () => {
    return runInsightsPipeline(pipelines.CAMPAIGN_INSIGHTS, {
        accountId: '285219587325995',
        start: '2023-08-01',
        end: '2023-09-01',
    })
        .then((results) => expect(results).toBeDefined())
        .catch((error) => {
            console.error({ error });
            throw error;
        });
});

it('runDimensionPipeline', async () => {
    return runDimensionPipeline()
        .then((result) => expect(result).toBeDefined())
        .catch((error) => {
            console.error({ error });
            return Promise.reject(error);
        });
});

it('createInsightsPipelineTasks', async () => {
    return createInsightsPipelineTasks({
        start: '2023-08-28',
        end: '2023-09-04',
    })
        .then((result) => expect(result).toBeDefined())
        .catch((error) => {
            console.error({ error });
            throw error;
        });
});
