require('dotenv').config();
const { fbAdsSchema } = require('./models/models');
const { createView } = require('./services/Mongo');

const aggregationPipelines = (schema) => {
  const nested = Object.entries(schema.tree)
    .filter(([_, type]) => Array.isArray(type))
    .map(([path, _]) => ({ path }));
  // .slice(1, 2);
  const scalar = Object.entries(fbAdsSchema.tree)
    .filter(([_, type]) => !Array.isArray(type) & (type.agg !== undefined))
    .map(([path, type]) => ({ path, agg: type.agg }));
  // .slice(1, 2);

  const facet = {
    $facet: {
      ...Object.fromEntries(scalar.map((i) => facetScalar(i))),
      ...Object.fromEntries(nested.map((i) => facetArray(i))),
    },
  };

  const project = {
    $project: {
      data: {
        $concatArrays: [...scalar, ...nested].map(({ path }) => `$${path}`),
      },
    },
  };

  const fullUnwind = unwind('data');

  const replaceRoot = {
    $replaceRoot: {
      newRoot: '$data',
    },
  };

  const groupKV = {
    $group: {
      _id: {
        apiEventId: '$_id.apiEventId',
        date_start: '$_id.date_start',
        field: '$_id.field',
      },
      ...Object.fromEntries(
        scalar.map(({ path }) => [`${path}`, { $sum: `$${path}` }])
      ),
      kv: {
        $push: {
          actions: '$_id.action_type',
          value: '$value',
        },
      },
    },
  };

  const groupPush = {
    $group: {
      _id: {
        apiEventId: '$_id.apiEventId',
        date_start: '$_id.date_start',
      },
      ...Object.fromEntries(
        scalar.map(({ path }) => [`${path}`, { $sum: `$${path}` }])
      ),
      ...Object.fromEntries(
        nested.map(({ path }) => [
          `${path}`,
          {
            $push: {
              $cond: {
                if: { $eq: ['$_id.field', path] },
                then: '$kv',
                else: '$$REMOVE',
              },
            },
          },
        ])
      ),
    },
  };

  const finalUnwinds = nested.map(({ path }) => unwind(path));

  const projectId = {
    $project: {
      _id: 0,
      apiEventId: '$_id.apiEventId',
      date_start: '$_id.date_start',
      ...Object.fromEntries(scalar.map(({ path }) => [`${path}`, 1])),
      ...Object.fromEntries(nested.map(({ path }) => [`${path}`, 1])),
    },
  };

  const groupId = {
    $group: {
      _id: '$apiEventId',
      ads: {
        $push: {
          date_start: '$date_start',
          ...Object.fromEntries(scalar.map(({ path }) => [path, `$${path}`])),
          ...Object.fromEntries(nested.map(({ path }) => [path, `$${path}`])),
        },
      },
    },
  };
  const pipelines = [
    facet,
    project,
    fullUnwind,
    replaceRoot,
    groupKV,
    groupPush,
    ...finalUnwinds,
    projectId,
    groupId,
  ];
  return pipelines;
};

const unwind = (path) => ({
  $unwind: {
    path: `$${path}`,
    preserveNullAndEmptyArrays: true,
  },
});

const facetScalar = ({ path, agg }) => [
  path,
  [
    {
      $project: {
        apiEventId: 1,
        date_start: 1,
        [`${path}`]: 1,
      },
    },
    {
      $group: {
        _id: {
          apiEventId: '$apiEventId',
          date_start: '$date_start',
        },
        [`${path}`]: {
          [`$${agg}`]: `$${path}`,
        },
      },
    },
  ],
];

const facetArray = ({ path }) => [
  path,
  [
    {
      $project: {
        apiEventId: 1,
        date_start: 1,
        [`${path}`]: 1,
      },
    },
    { ...unwind(path) },
    {
      $group: {
        _id: {
          apiEventId: '$apiEventId',
          date_start: '$date_start',
          field: `${path}`,
          action_type: `$${path}.action_type`,
        },
        value: {
          $sum: `$${path}.value`,
        },
      },
    },
  ],
];

createView(
  'FacebookAdsAggregated',
  'FacebookAdsInsightsRaw',
  aggregationPipelines(fbAdsSchema)
).then(() => console.log('View Created'));
