import { pipelineService } from './facebook.service';
import {
    Pipeline,
    CampaignInsights,
    AgeGenderInsights,
} from './pipeline.const';

const cases = [
    // [CampaignInsights.collection, CampaignInsights],
    [AgeGenderInsights.collection, AgeGenderInsights],
] as [string, Pipeline][];

describe('Facebook Service', () => {
    it.each(cases)('Pipeline Service %p', async (_, pipeline) => {
        const options = {
            accountId: '1727886630625085',
            start: '2021-12-01',
            end: '2021-12-05',
        };

        return pipelineService(options, pipeline).then((res) =>
            expect(res).toBeTruthy(),
        );
    });
});
