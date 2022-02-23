import { assert } from 'chai';

import { pipelineService } from '../src/facebook/facebookService';
import { eventService, taskService } from '../src/goodUnited/goodUnitedService';

describe('Facebook', () => {
    it('Pipeline Service', async () => {
        const options = {
            accountId: '2876483672676878',
            start: '2022-01-01',
            end: '2022-01-02',
        };
        const res = await pipelineService(options);
        assert.isAbove(res.result.modifiedCount, 0);
    }).timeout(540000);
});

describe('Good United', () => {
    it('Event Service', async () => {
        const res = await eventService();
        assert.isAbove(res.result.modifiedCount, 0);
    }).timeout(540000);

    it('Task Service', async () => {
        const res = await taskService();
        assert.isAbove(res.result, 0);
    }).timeout(540000);
});
