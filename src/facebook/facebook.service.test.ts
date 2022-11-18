import { pipelineService } from './facebook.service';
import { Pipeline, CampaignInsights, AgeGenderInsights } from './pipeline.const';

const cases = [
    // [CampaignInsights.collection, CampaignInsights],
    [AgeGenderInsights.collection, AgeGenderInsights],
] as [string, Pipeline][];

describe('Facebook Service', () => {
    it.each(cases)('Pipeline Service %p', async (_, pipeline) => {
        const options = {
            accountId: '137172389777147',
        };

        return pipelineService(options, pipeline).then((res) => expect(res).toBeTruthy());
    });
});
