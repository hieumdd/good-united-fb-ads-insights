import { models } from './goodUnitedModel';
import { getAdAccounts, getEventWithAdAccounts } from './goodUnitedRepo';
import { load } from '../db/mongo';
import { createTasks } from '../task/taskService';

export const eventService = async () => {
    const events = await getEventWithAdAccounts();
    return load(models, events);
};

export const taskService = async () => {
    const adsAccounts = (await getAdAccounts())
        .map(({ ids }) => ids)
        .reduce((acc, cur) => [...acc, ...cur], []);
    return createTasks(adsAccounts.map((i) => ({ adAccoundId: i })));
};
