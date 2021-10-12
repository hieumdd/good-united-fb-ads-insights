const mongoose = require('mongoose');
const { chunk, sumBy } = require('lodash');

const loadMongo = async ({ model, keys, fields }, data) => {
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Loading to Mongo...');
    const results = await Promise.all(
      bulkUpdateOps.map(async (op, i) => {
        console.log(`Loading chunk ${i}`);
        const { deletedCount, insertedCount, modifiedCount, upsertedCount } =
          await model.bulkWrite(op, { w: 0, ordered: false });
        console.log(`Loaded chunk ${i}`);
        return {
          deletedCount,
          insertedCount,
          modifiedCount,
          upsertedCount,
        };
      })
    );
    return [
      null,
      Object.fromEntries(
        ['deletedCount', 'insertedCount', 'modifiedCount', 'upsertedCount'].map(
          (i) => [i, sumBy(results, (j) => j.deletedCount)]
        )
      ),
    ];
  } catch (err) {
    return [err, null];
  } finally {
    mongoose.disconnect();
  }
};

const createView = async (viewName, viewOn, pipeline) => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);
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
    mongoose.disconnect();
  }
};

module.exports = {
  loadMongo,
  createView,
};
