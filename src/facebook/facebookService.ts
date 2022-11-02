import dayjs from 'dayjs';

import { InsightsRequest } from './facebook';
import { models as model } from './facebookModel';
import get from './facebookRepo';
import { load } from '../db/mongo';

const DATE_FORMAT = 'YYYY-MM-DD';

export const pipelineService = async ({
    accountId,
    start,
    end,
}: InsightsRequest) => {
    const data = await get({
        accountId,
        start: start
            ? dayjs(start).format(DATE_FORMAT)
            : dayjs().subtract(7, 'days').format(DATE_FORMAT),
        end: end ? dayjs(end).format(DATE_FORMAT) : dayjs().format(DATE_FORMAT),
    }).catch((err) => {
        console.log(err);
        throw err
        return []
    });
    const result = await load(model, data);
    return { service: 'facebook', accountId, start, end, result };
};
