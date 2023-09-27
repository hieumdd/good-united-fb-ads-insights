import axios from 'axios';

import { logger } from '../logging.service';

const client = axios.create({
    baseURL: 'https://abc.1gu.xyz',
    headers: { key: process.env.API_KEY || '' },
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        logger.error({ fn: 'good-united.repository:client', error });
        throw error;
    },
);

type AdAccount = {
    adAccount: string;
    ids: string[];
};

export const getAdAccounts = async (): Promise<AdAccount[]> => {
    return client
        .request<{ [key: string]: string[] }>({ method: 'GET', url: '/adAccounts' })
        .then(({ data }) => {
            return Object.entries(data).map(([adAccount, ids]) => ({
                adAccount,
                ids: ids.map((i) => i.trim()),
            }));
        })
        .catch(() => []);
};

type EventResponse = {
    ID: string;
    Nonprofit: string;
    'Live Date': string;
    'Start Date': string;
};

type Event = {
    eventId: string;
    nonProfit: string;
    start: Date;
    end: Date;
};

const getEvents = async (): Promise<Event[]> => {
    return client
        .request<EventResponse[]>({ method: 'GET', url: '/events' })
        .then(({ data }) =>
            data.map((i) => ({
                eventId: i['ID'],
                nonProfit: i['Nonprofit'],
                start: new Date(i['Live Date']),
                end: new Date(i['Start Date']),
            })),
        )
        .catch(() => []);
};

export type EventWithAdAccount = {
    adAccountId: string;
    eventId: string;
    nonProfit: string;
    start: Date;
    end: Date;
};

export const getEventWithAdAccounts = async (): Promise<EventWithAdAccount[]> => {
    const [events, adAccounts] = await Promise.all([getEvents(), getAdAccounts()]);

    return events
        .flatMap((event) => {
            const mappedAdAccount = adAccounts.find(
                ({ adAccount }) => adAccount === event.nonProfit,
            );

            return mappedAdAccount
                ? mappedAdAccount.ids.map((adAccountId) => ({
                      ...event,
                      adAccountId,
                  }))
                : undefined;
        })
        .filter((i) => i?.adAccountId) as EventWithAdAccount[];
};
