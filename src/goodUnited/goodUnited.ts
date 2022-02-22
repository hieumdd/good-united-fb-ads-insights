export type AdAccountAPI = {
    [key: string]: string[];
};

export type AdAccount = {
    adAccount: string;
    ids: string[];
};

export type EventAPI = {
    ID: string;
    Nonprofit: string;
    'Live Date': string;
    'Start Date': string;
};

export type Event = {
    eventId: string;
    nonProfit: string;
    start: Date;
    end: Date;
};

export type EventWithAdAccount = {
    adAccountId: number;
    eventId: string;
    nonProfit: string;
    start: Date;
    end: Date;
};
