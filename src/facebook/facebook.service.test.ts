import { pipelineService } from './facebook.service';
import { CampaignInsights, AgeGenderInsights, AgeGenderAdInsights } from './pipeline.const';

describe('Facebook Service', () => {
    it.each([CampaignInsights, AgeGenderInsights, AgeGenderAdInsights])(
        'Pipeline Service %p',
        async (pipeline) => {
            const options = {
                accountId: '137172389777147',
                start: '2022-12-01',
                end: '2023-01-01',
            };

            return pipelineService(options, pipeline).then((res) => expect(res).toBeTruthy());
        },
    );
});
