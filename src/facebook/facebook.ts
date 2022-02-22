export type InsightsRequest = {
    accountId: string;
    start?: string;
    end?: string;
}

export type InsightsOptions = Required<InsightsRequest>;

type ActionBreakdowns = {
    action_type: string;
    value: number;
}[];

export type InsightsData = {
    date_start: Date;
    date_stop: Date;
    account_id: number;
    campaign_id: number;
    account_name: string;
    campaign_name: string;
    account_currency: string;
    actions: ActionBreakdowns;
    action_values: ActionBreakdowns;
    clicks: number;
    conversion_rate_ranking: string;
    conversion_values: ActionBreakdowns;
    conversions: ActionBreakdowns;
    cost_per_action_type: ActionBreakdowns;
    cost_per_conversion: ActionBreakdowns;
    cost_per_unique_action_type: ActionBreakdowns;
    cost_per_unique_click: number;
    cpc: number;
    cpm: number;
    ctr: number;
    engagement_rate_ranking: string;
    frequency: number;
    impressions: number;
    inline_link_click_ctr: number;
    inline_link_clicks: number;
    objective: string;
    optimization_goal: string;
    quality_ranking: string;
    reach: number;
    spend: number;
    unique_actions: ActionBreakdowns;
    unique_clicks: number;
    unique_ctr: number;
    unique_link_clicks_ctr: number;
};

type FacebookResponse<T> = Promise<[unknown | null, T | null]>;

export type PollReportId = FacebookResponse<string>;

export type InsightsResponse = FacebookResponse<InsightsData[]>;
