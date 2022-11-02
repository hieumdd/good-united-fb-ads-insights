export type Pipeline = {
    level: string;
    fields: string[];
    collection: string;
};

export const pipelines: Pipeline[] = [
    {
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
        collection: 'FBAds',
    },
];
