import { Writable } from 'node:stream';
import { MongoClient } from 'mongodb';
import BatchStream from 'batch-stream';

import { logger } from './logging.service';

export type CreateUpsertStreamConfig = {
    collection: string;
    keys: string[];
};

export const createUpsertStream = async ({ collection, keys }: CreateUpsertStreamConfig) => {
    const client = await MongoClient.connect(process.env.MONGO_URI || '');
    const db = client.db('facebook');

    const writeStream = new Writable({
        objectMode: true,
        write: (rows: any[], _, callback) => {
            const operations = rows.map((row) => ({
                updateOne: {
                    filter: Object.fromEntries(keys.map((key) => [key, row[key]])),
                    update: { $set: row },
                    upsert: true,
                },
            }));

            db.collection(collection)
                .bulkWrite(operations)
                .then((result) => {
                    logger.info({
                        fn: 'mongo.service:createUpsertStream',
                        result: { upsertedCount: result.upsertedCount },
                    });
                    callback();
                })
                .catch((error) => {
                    logger.error({ fn: 'mongo.service:createUpsertStream', error });
                    callback(error);
                });
        },
    });

    return {
        upsertStreams: [new BatchStream({ size: 500 }), writeStream] as const,
        callback: () => client.close(),
    };
};
