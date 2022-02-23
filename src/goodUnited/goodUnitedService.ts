import { models } from './goodUnitedModel';
import { getAdAccounts, getEventWithAdAccounts } from './goodUnitedRepo';
import { InsightsRequest } from '../facebook/facebook';
import { load } from '../db/mongo';
import { createTasks } from '../task/taskService';

export const eventService = async () => {
    const events = await getEventWithAdAccounts();
    return {
        service: 'events',
        result: await load(models, events),
    };
};

export const taskService = async () => {
    const adsAccounts = (await getAdAccounts())
        .map(({ ids }) => ids)
        .reduce((acc, cur) => [...acc, ...cur], [])
        .filter((i) => i)
        .map((accountId) => ({ accountId }));
    return {
        service: 'tasks',
        result: await createTasks<InsightsRequest>(adsAccounts),
    };
};
