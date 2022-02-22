import { Schema, model } from 'mongoose';

import type { FBAdsRes } from '../types/models';

const COLLECTION = 'FBAds';

const actionBreakdowns = [
  {
    action_type: String,
    value: Number,
  },
];

export const schema = new Schema<FBAdsRes>(
  {
    date_start: { type: Date, required: true },
    date_stop: { type: Date, required: true },
    account_id: { type: Number, required: true },
    campaign_id: { type: Number, required: true },
    account_name: String,
    campaign_name: String,
    account_currency: String,
    actions: actionBreakdowns,
    action_values: actionBreakdowns,
    clicks: { type: Number, agg: 'sum' },
    conversion_rate_ranking: String,
    conversion_values: actionBreakdowns,
    conversions: actionBreakdowns,
    cost_per_action_type: actionBreakdowns,
    cost_per_conversion: actionBreakdowns,
    cost_per_unique_action_type: actionBreakdowns,
    cost_per_unique_click: { type: Number, agg: 'avg' },
    cpc: { type: Number, agg: 'avg' },
    cpm: { type: Number, agg: 'avg' },
    ctr: { type: Number, agg: 'avg' },
    engagement_rate_ranking: String,
    frequency: { type: Number, agg: 'avg' },
    impressions: { type: Number, agg: 'sum' },
    inline_link_click_ctr: Number,
    inline_link_clicks: { type: Number, agg: 'sum' },
    objective: String,
    optimization_goal: String,
    quality_ranking: String,
    reach: { type: Number, agg: 'sum' },
    spend: { type: Number, agg: 'sum' },
    unique_actions: actionBreakdowns,
    unique_clicks: { type: Number, agg: 'sum' },
    unique_ctr: { type: Number, agg: 'avg' },
    unique_link_clicks_ctr: { type: Number, agg: 'avg' },
  },
  { collection: COLLECTION }
);

export const models = model<FBAdsRes>(COLLECTION, schema);

export const keys = Object.entries(schema.obj)
  .filter(([, type]: [any, any]) => type.required)
  .map(([name]) => name);

export const fields = Object.entries(schema.obj).map(([name]) => name);
