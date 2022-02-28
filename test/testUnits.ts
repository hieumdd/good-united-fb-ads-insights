import { assert } from 'chai';

import { pipelineService } from '../src/facebook/facebookService';
import { eventService, taskService } from '../src/goodUnited/goodUnitedService';

describe('Facebook', () => {
    it('Pipeline Service', async () => {
        const options = {
            accountId: '701463723810577',
            start: '2021-12-01',
        end: '2022-01-01',
        };
        const res = await pipelineService(options);
        assert.isAbove(res.result.modifiedCount, 0);
    }).timeout(540000);
});

describe('Good United', () => {
    const timeFrame = {
        start: '2021-12-01',
        end: '2022-01-01',
    };
    const defaultTimeFrame = {};

    it('Event Service', async () => {
        const res = await eventService();
        assert.isAbove(res.result.modifiedCount, 0);
    }).timeout(540000);

    it('Task Service', async () => {
        const res = await taskService(defaultTimeFrame);
        assert.isAbove(res.result, 0);
    }).timeout(540000);

    it('Controller', async () => {
        const res = await Promise.all([
            eventService(),
            taskService(defaultTimeFrame),
        ]);
        res;
    }).timeout(540000);
});
