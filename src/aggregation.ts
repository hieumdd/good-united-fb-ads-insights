import * as dotenv from 'dotenv';
dotenv.config();

import { Schema } from 'mongoose';
import { createView } from './controller/mongo';
import { schema } from './models/facebook';

const dataCol = 'FBAds';

const unwind = (path: string) => ({
  $unwind: {
    path: `$${path}`,
    preserveNullAndEmptyArrays: true,
  },
});

const facetScalar = ({ path, agg }: { path: string; agg: string }) => [
  path,
  [
    {
      $project: {
        eventId: 1,
        date_start: 1,
        [`${path}`]: 1,
      },
    },
    {
      $group: {
        _id: {
          eventId: '$eventId',
          date_start: '$date_start',
        },
        [`${path}`]: {
          [`$${agg}`]: `$${path}`,
        },
      },
    },
  ],
];

const facetArray = ({ path }: { path: string }) => [
  path,
  [
    {
      $project: {
        eventId: 1,
        date_start: 1,
        [`${path}`]: 1,
      },
    },
    { ...unwind(path) },
    {
      $group: {
        _id: {
          eventId: '$eventId',
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

const aggregationPipelines = (schema: Schema) => {
  const nested = Object.entries(schema.obj)
    .filter(([, type]: [key: string, type: any]) => Array.isArray(type))
    .map(([path]) => ({ path }));
  const scalar = Object.entries(schema.obj)
    .filter(
      ([, type]: [key: string, type: any]) =>
        !Array.isArray(type) && type.agg !== undefined
    )
    .map(([path, type]: [path: string, type: any]) => ({
      path,
      agg: type.agg,
    }));

  const lookup = {
    $lookup: {
      from: dataCol,
      let: {
        adAccountId: '$adAccountId',
        startDate: '$start',
        endDate: '$end',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$account_id', '$$adAccountId'] },
                { $gte: ['$date_start', '$$startDate'] },
                { $lte: ['$date_start', '$$endDate'] },
              ],
            },
          },
        },
      ],
      as: 'adsData',
    },
  };

  const unwindAdsData = unwind('adsData');

  const projectAdsData = {
    $project: {
      eventId: '$eventId',
      adAccountId: '$adAccountId',
      end: '$end',
      nonProfit: '$nonProfit',
      start: '$start',
      date_start: '$adsData.date_start',
      ...Object.fromEntries(
        scalar.map(({ path }) => [`${path}`, `$adsData.${path}`])
      ),
      ...Object.fromEntries(
        nested.map(({ path }) => [`${path}`, `$adsData.${path}`])
      ),
    },
  };

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
        eventId: '$_id.eventId',
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
        eventId: '$_id.eventId',
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
      eventId: '$_id.eventId',
      date_start: '$_id.date_start',
      ...Object.fromEntries(scalar.map(({ path }) => [`${path}`, 1])),
      ...Object.fromEntries(nested.map(({ path }) => [`${path}`, 1])),
    },
  };

  const groupId = {
    $group: {
      _id: '$eventId',
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
    lookup,
    unwindAdsData,
    projectAdsData,
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

createView('FBAdsJoined', 'Events', aggregationPipelines(schema)).then(
  ([viewErr, view]) => {
    if (viewErr) {
      console.log(viewErr);
    } else {
      console.log(view, 'View Created');
    }
  }
);
