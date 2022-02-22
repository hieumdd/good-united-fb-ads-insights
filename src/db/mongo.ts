import { connect, disconnect, Model } from 'mongoose';
import { chunk, sumBy } from 'lodash';

import { getKeys, getFields } from './utils';

export type MongoResponse = {
    deletedCount: number;
    insertedCount: number;
    modifiedCount: number;
    upsertedCount: number;
};

type Data = {
    [key: string]: any;
}

export const load = async <M, D extends Data>(
    model: Model<M>,
    data: D[],
): Promise<MongoResponse> => {
    const defaultLoadResponse: MongoResponse = {
        deletedCount: 0,
        insertedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
    };

    if (data.length === 0) return defaultLoadResponse;

    const dataChunks = chunk(data, 100);

    const bulkUpdateOps = dataChunks.map((dataChunk) =>
        dataChunk.map((item) => ({
            updateOne: {
                filter: Object.fromEntries(
                    getKeys(model).map((i) => [i, item[i]]),
                ),
                update: Object.fromEntries(
                    getFields(model).map((i) => [i, item[i]]),
                ),
                upsert: true,
            },
        })),
    );

    try {
        await connect(process.env.MONGO_URI || '');
        const results: MongoResponse[] = await Promise.all(
            bulkUpdateOps.map(async (op) => {
                const {
                    deletedCount,
                    insertedCount,
                    modifiedCount,
                    upsertedCount,
                } = await model.bulkWrite(op, { ordered: false });
                return {
                    deletedCount,
                    insertedCount,
                    modifiedCount,
                    upsertedCount,
                };
            }),
        );
        return {
            deletedCount: sumBy(results, (j) => j['deletedCount']),
            insertedCount: sumBy(results, (j) => j['insertedCount']),
            modifiedCount: sumBy(results, (j) => j['modifiedCount']),
            upsertedCount: sumBy(results, (j) => j['upsertedCount']),
        };
    } catch (err) {
        console.log(err);
        return defaultLoadResponse;
    } finally {
        disconnect();
    }
};

export const createView = async (
    viewName: string,
    viewOn: string,
    pipeline: any,
): Promise<[unknown | null, string | null]> => {
    try {
        const { connection } = await connect(process.env.MONGO_URI || '');
        const currentViews = await connection.db
            .listCollections({ name: viewName })
            .toArray();
        if (currentViews.length !== 0) {
            await connection.db.dropCollection(viewName);
        }
        await connection.db.createCollection(viewName, {
            viewOn,
            pipeline,
        });
        return [null, 'Loaded to Mongo'];
    } catch (err) {
        return [err, null];
    } finally {
        disconnect();
    }
};
