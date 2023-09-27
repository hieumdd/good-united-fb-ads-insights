import { Readable } from 'node:stream';
import Joi from 'joi';

import { CreateUpsertStreamConfig } from '../mongo.service';
import { getInsightsStream } from '../facebook/insights.service';
import { PipelineOptions } from './pipeline.request.dto';

export type Pipeline = {
    getExtractStream: (options: PipelineOptions) => Promise<Readable>;
    validationSchema: Joi.Schema;
    upsertConfig: CreateUpsertStreamConfig;
};

const actionBreakdownSchema = Joi.array()
    .items({ action_type: Joi.string(), value: Joi.number() })
    .optional();

export const CAMPAIGN_INSIGHTS: Pipeline = {
    getExtractStream: getInsightsStream({
        level: 'campaign',
        fields: [
            'date_start',
            'date_stop',
            'account_id',
            'campaign_id',
            'account_name',
            'campaign_name',
            'account_currency',
            'actions',
            'action_values',
            'clicks',
            'conversion_rate_ranking',
            'conversion_values',
            'conversions',
            'cost_per_action_type',
            'cost_per_conversion',
            'cost_per_unique_action_type',
            'cost_per_unique_click',
            'cpc',
            'cpm',
            'ctr',
            'engagement_rate_ranking',
            'frequency',
            'impressions',
            'inline_link_click_ctr',
            'inline_link_clicks',
            'objective',
            'optimization_goal',
            'quality_ranking',
            'reach',
            'spend',
            'unique_actions',
            'unique_clicks',
            'unique_ctr',
            'unique_link_clicks_ctr',
        ],
    }),
    validationSchema: Joi.object({
        date_start: Joi.date(),
        date_stop: Joi.date(),
        account_id: Joi.string(),
        campaign_id: Joi.string(),
        account_name: Joi.string(),
        campaign_name: Joi.string(),
        account_currency: Joi.string(),
        action_values: actionBreakdownSchema,
        actions: actionBreakdownSchema,
        clicks: Joi.number(),
        conversion_rate_ranking: Joi.string(),
        conversion_values: actionBreakdownSchema,
        conversions: actionBreakdownSchema,
        cost_per_action_type: actionBreakdownSchema,
        cost_per_conversion: actionBreakdownSchema,
        cost_per_unique_action_type: actionBreakdownSchema,
        cost_per_unique_click: Joi.number(),
        cpc: Joi.number(),
        cpm: Joi.number(),
        ctr: Joi.number(),
        engagement_rate_ranking: Joi.string(),
        frequency: Joi.number(),
        impressions: Joi.number(),
        inline_link_click_ctr: Joi.number(),
        inline_link_clicks: Joi.number(),
        objective: Joi.string(),
        optimization_goal: Joi.string(),
        quality_ranking: Joi.string(),
        reach: Joi.number(),
        spend: Joi.number(),
        unique_actions: actionBreakdownSchema,
        unique_clicks: Joi.number(),
        unique_ctr: Joi.number(),
        unique_link_clicks_ctr: Joi.number(),
    }),
    upsertConfig: {
        collection: 'FBAds',
        keys: ['date_start', 'account_id', 'campaign_id'],
    },
};

export const AGE_GENDER_INSIGHTS: Pipeline = {
    getExtractStream: getInsightsStream({
        level: 'campaign',
        breakdowns: 'age,gender',
        fields: [
            'date_start',
            'date_stop',
            'account_id',
            'campaign_id',
            'campaign_name',
            'reach',
            'impressions',
            'cpc',
            'cpm',
            'ctr',
            'clicks',
            'spend',
            'actions',
            'action_values',
            'cost_per_action_type',
            'cost_per_unique_action_type',
        ],
    }),
    validationSchema: Joi.object({
        date_start: Joi.date(),
        date_stop: Joi.date(),
        age: Joi.string(),
        gender: Joi.string(),
        account_id: Joi.string(),
        campaign_id: Joi.string(),
        campaign_name: Joi.string(),
        reach: Joi.number(),
        impressions: Joi.number(),
        cpc: Joi.number(),
        cpm: Joi.number(),
        ctr: Joi.number(),
        clicks: Joi.number(),
        spend: Joi.number(),
        actions: actionBreakdownSchema,
        action_values: actionBreakdownSchema,
        cost_per_action_type: actionBreakdownSchema,
        cost_per_unique_action_type: actionBreakdownSchema,
    }),
    upsertConfig: {
        collection: 'FBAdsAgeGender',
        keys: ['date_start', 'account_id', 'campaign_id', 'age', 'gender'],
    },
};
