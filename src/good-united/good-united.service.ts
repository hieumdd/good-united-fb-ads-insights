import { getAdAccounts, getEventWithAdAccounts } from './good-united.repository';
import { Pipeline, pipelines } from '../facebook/pipeline.const';
import { load } from '../db/mongo.service';
import { createTasks } from '../task/cloud-tasks.service';

export const eventService = async () => {
    return getEventWithAdAccounts().then((data) =>
        load(data, {
            collection: 'Events',
            keys: ['adAccountId', 'eventId', 'nonProfit'],
        }),
    );
};

type TimeFrame = {
    start?: string;
    end?: string;
};

export const taskService = async ({ start, end }: TimeFrame) => {
    return getAdAccounts()
        .then((adAccounts) =>
            adAccounts
                .flatMap(({ ids }) => ids)
                .reduce(
                    (p, x) =>
                        [...p, ...Object.keys(pipelines).map((y) => [x, y])] as [
                            string,
                            Pipeline,
                        ][],
                    [] as [string, Pipeline][],
                )
                .map(([accountId, pipeline]) => ({
                    pipeline,
                    accountId,
                    start,
                    end,
                })),
        )
        .then((tasks) => tasks.filter((task) => !!task.accountId))
        .then((tasks) => createTasks(tasks, ({ accountId }) => accountId));
};
