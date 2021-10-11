const mongoose = require('mongoose');

const loadMongo = async ({ model, keys, fields }, data) => {
  const bulkUpdateOps = data.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(keys.map((i) => [i, item[i]])),
      update: Object.fromEntries(fields.map((i) => [i, item[i]])),
      upsert: true,
    },
  }));
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Loading to Mongo...');
    const { deletedCount, insertedCount, modifiedCount, upsertedCount } =
      await model.bulkWrite(bulkUpdateOps);
    return [
      null,
      {
        deletedCount,
        insertedCount,
        modifiedCount,
        upsertedCount,
      },
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
    return [null, 'Loaded to Mongo']
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
