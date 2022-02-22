import { Model } from 'mongoose';

export const getKeys = <M>(model: Model<M>) =>
    Object.entries(model.schema.obj)
        .filter(([, value]: [string, any]) => value.required)
        .map(([key]) => key);

export const getFields = <M>(model: Model<M>) =>
    Object.entries(model.schema.obj).map(([name]) => name);
