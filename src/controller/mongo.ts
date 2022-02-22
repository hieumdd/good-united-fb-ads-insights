import { connect, disconnect, Model } from 'mongoose';
import { chunk, sumBy } from 'lodash';

import { MongoRes } from '../types/mongo';

export const loadMongo = async <M>(
  {
    model,
    keys,
    fields,
  }: { model: Model<M>; keys: string[]; fields: string[] },
  data: Record<string, any>[]
): Promise<[unknown | null, MongoRes | null]> => {
  const dataChunks = chunk(data, 100);
  const bulkUpdateOps = dataChunks.map((dataChunk) =>
    dataChunk.map((item) => ({
      updateOne: {
        filter: Object.fromEntries(keys.map((i) => [i, item[i]])),
        update: Object.fromEntries(fields.map((i) => [i, item[i]])),
        upsert: true,
      },
    }))
  );
  try {
    await connect(process.env.MONGO_URI || '');
    const results: MongoRes[] = await Promise.all(
      bulkUpdateOps.map(async (op) => {
        const { deletedCount, insertedCount, modifiedCount, upsertedCount } =
          await model.bulkWrite(op, { ordered: false });
        return { deletedCount, insertedCount, modifiedCount, upsertedCount };
      })
    );
    return [
      null,
      {
        deletedCount: sumBy(results, (j) => j['deletedCount']),
        insertedCount: sumBy(results, (j) => j['insertedCount']),
        modifiedCount: sumBy(results, (j) => j['modifiedCount']),
        upsertedCount: sumBy(results, (j) => j['upsertedCount']),
      },
    ];
  } catch (err) {
    return [err, null];
  } finally {
    disconnect();
  }
};

export const createView = async (
  viewName: string,
  viewOn: string,
  pipeline: any
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
