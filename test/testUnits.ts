import { pipelineService } from '../src/facebook/facebookService';
import { eventService, taskService } from '../src/goodUnited/goodUnitedService';

jest.setTimeout(100000000);

describe('Facebook', () => {
    it('Pipeline Service', async () => {
        const options = {
            accountId: '1727886630625085',
            start: '2021-12-01',
            end: '2022-01-01',
        };
        const res = await pipelineService(options);
        expect(res.result.modifiedCount).toBeGreaterThan(0);
    });
});

describe('Good United', () => {
    const timeFrame = {
        start: '2021-12-01',
        end: '2022-01-01',
    };
    const defaultTimeFrame = {};

    it('Event Service', async () => {
        const res = await eventService();
        expect(res.result.modifiedCount).toBeGreaterThan(0);
    });

    it('Task Service', async () => {
        const res = await taskService(defaultTimeFrame);
        expect(res.result).toBeGreaterThan(0);
    });

    it('Controller', async () => {
        const res = await Promise.all([
            eventService(),
            taskService(defaultTimeFrame),
        ]);
        res;
    });
});
