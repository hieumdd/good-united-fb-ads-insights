import Joi from 'joi';

import dayjs from '../dayjs';
import * as pipelines from './pipeline.const';

export type PipelineOptions = {
    accountId: string;
    start: string;
    end: string;
};

export type CreatePipelineTasksBody = Partial<Omit<PipelineOptions, 'accountId'>>;

export const CreatePipelineTasksBodySchema = Joi.object<CreatePipelineTasksBody>({
    start: Joi.string()
        .optional()
        .empty(null)
        .allow(null)
        .default(dayjs.utc().subtract(7, 'day').format('YYYY-MM-DD')),
    end: Joi.string().optional().empty(null).allow(null).default(dayjs.utc().format('YYYY-MM-DD')),
});

type RunPipelineBody = PipelineOptions & { pipeline: keyof typeof pipelines };

export const RunPipelineBodySchema = Joi.object<RunPipelineBody>({
    accountId: Joi.string(),
    start: Joi.string(),
    end: Joi.string(),
    pipeline: Joi.string(),
});
