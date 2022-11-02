import {
    getAdAccounts,
    getEventWithAdAccounts,
} from './good-united.repository';
import { Pipeline, pipelines } from '../facebook/pipeline.const';
import { createTasks } from '../task/cloud-tasks.service';

export const eventPipelineService = async () => getEventWithAdAccounts();

type TimeFrame = {
    start?: string;
    end?: string;
};

export const taskService = async ({ start, end }: TimeFrame) =>
    getAdAccounts()
        .then((adAccounts) =>
            adAccounts
                .flatMap(({ ids }) => ids)
                .reduce(
                    (p, x) =>
                        [...p, ...pipelines.map((y) => [x, y])] as [
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
        .then((tasks) => createTasks(tasks, ({ accountId }) => accountId));
