import { pipelineService } from './facebook.service';
import { Pipeline, pipelines } from './pipeline.const';

const cases = pipelines.map((pipeline) => [pipeline.collection, pipeline]) as [
    string,
    Pipeline,
][];

it.each(cases)('Pipeline Service %p', async (_, pipeline) => {
    const options = {
        pipeline,
        accountId: '1727886630625085',
        start: '2021-12-01',
        end: '2021-12-05',
    };
    return pipelineService(options).then((res) => expect(res).toBeTruthy());
});
