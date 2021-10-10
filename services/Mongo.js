const mongoose = require('mongoose');

const loadMongo = async ({ model, keys, fields }, data) => { // eslint-disable-line
  const bulkUpdateOps = data.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(keys.map((i) => [i, item[i]])),
      update: Object.fromEntries(fields.map((i) => [i, item[i]])),
      upsert: true,
    },
  }));
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { deletedCount, insertedCount, modifiedCount, upsertedCount } =
      await model.bulkWrite(bulkUpdateOps);
    return {
      deletedCount,
      insertedCount,
      modifiedCount,
      upsertedCount,
    };
  } catch (err) {
    console.log(err.message);
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
  } catch (err) {
    console.log(err);
  } finally {
    mongoose.disconnect();
  }
};

module.exports = {
  loadMongo,
  createView,
};
