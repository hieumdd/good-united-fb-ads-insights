import { MongoClient } from 'mongodb';
import { chunk } from 'lodash';

type LoadOptions<D> = {
    collection: string;
    keys: (keyof D)[];
};

export const load = async <D extends Record<string, any>>(data: D[], { collection, keys }: LoadOptions<D>) => {
    const client = new MongoClient(process.env.MONGO_URI || '');

    const operations = chunk(data, 100).map((dataChunk) => {
        return dataChunk.map((row) => {
            const filters = keys.map((key) => [key, row[key]]);

            return {
                updateOne: {
                    filter: Object.fromEntries(filters),
                    update: { $set: row },
                    upsert: true,
                },
            };
        });
    });

    return Promise.all(operations.map((operation) => client.db('facebook').collection(collection).bulkWrite(operation)))
        .then((results) => results.map((result) => result.nUpserted))
        .finally(() => client.close());
};
