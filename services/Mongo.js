const mongoose = require('mongoose');

const loadMongo = async ({model, keys, fields}, data) => {
  const bulkUpdateOps = data.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(keys.map((i) => [i, item[i]])),
      update: Object.fromEntries(fields.map((i) => [i, item[i]])),
      upsert: true,
    },
  }));
  try {
    await mongoose.connect(process.env.MONGO_URI);
    ({ deletedCount, insertedCount, modifiedCount, upsertedCount } =
      await model.bulkWrite(bulkUpdateOps));
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

module.exports = {
  loadMongo,
};
