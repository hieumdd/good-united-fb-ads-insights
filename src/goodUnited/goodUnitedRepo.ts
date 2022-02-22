import axios from 'axios';

import {
    AdAccountAPI,
    AdAccount,
    EventAPI,
    Event,
    EventWithAdAccount,
} from './goodUnited';

const client = axios.create({
    baseURL: 'https://abc.1gu.xyz',
    headers: {
        key: process.env.API_KEY || '',
    },
});

export const getAdAccounts = async (): Promise<AdAccount[]> => {
    const { data } = await client.get<AdAccountAPI>('/adAccounts');
    return Object.entries(data).map(([adAccount, ids]) => ({
        adAccount,
        ids: ids.map((i: string) => i.trim()),
    }));
};

const getEvents = async (): Promise<Event[]> => {
    const { data } = await client.get<EventAPI[]>('/events');
    return data.map((i) => ({
        eventId: i['ID'],
        nonProfit: i['Nonprofit'],
        start: new Date(i['Live Date']),
        end: new Date(i['Start Date']),
    }));
};

export const getEventWithAdAccounts = async (): Promise<
    EventWithAdAccount[]
> => {
    const [events, adAccounts] = await Promise.all([
        getEvents(),
        getAdAccounts(),
    ]);
    return events
        .map((event) => {
            const mappedAdAccount = adAccounts.find(
                ({ adAccount }) => adAccount === event.nonProfit,
            );
            return mappedAdAccount
                ? mappedAdAccount.ids.map((id) => ({
                      ...event,
                      adAccountId: parseInt(id),
                  }))
                : undefined;
        })
        .flat()
        .filter((i) => i) as EventWithAdAccount[];
};
