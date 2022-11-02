import { MongoClient } from 'mongodb';
import { chunk } from 'lodash';

type LoadOptions<D> = {
    data: D[];
    keys: (keyof D)[];
};

export const load = async <D extends Record<string, any>>({
    data,
    keys,
}: LoadOptions<D>) => {
    const client = new MongoClient(process.env.MONGO_URI || '');

    const operations = chunk(data, 100).map((dataChunk) =>
        dataChunk.map((row) => ({
            updateOne: {
                filter: Object.fromEntries(keys.map((key) => [key, row[key]])),
                update: { $set: row },
                upsert: true,
            },
        })),
    );

    return Promise.all(
        operations.map((operation) =>
            client.db('').collection('').bulkWrite(operation),
        ),
    ).finally(() => client.close());
};
