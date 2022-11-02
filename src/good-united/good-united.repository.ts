import axios from 'axios';

const client = axios.create({
    baseURL: 'https://abc.1gu.xyz',
    headers: {
        key: process.env.API_KEY || '',
    },
});

type AdAccount = {
    adAccount: string;
    ids: string[];
};

export const getAdAccounts = async (): Promise<AdAccount[]> =>
    client
        .request<{ [key: string]: string[] }>({
            method: 'GET',
            url: '/adAccounts',
        })
        .then(({ data }) =>
            Object.entries(data).map(([adAccount, ids]) => ({
                adAccount,
                ids: ids.map((i) => i.trim()),
            })),
        )
        .catch((err) => {
            axios.isAxiosError(err) && console.log(err.response?.data);
            return [];
        });

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

const getEvents = async (): Promise<Event[]> =>
    client
        .request<EventResponse[]>({ method: 'GET', url: '/events' })
        .then(({ data }) =>
            data.map((i) => ({
                eventId: i['ID'],
                nonProfit: i['Nonprofit'],
                start: new Date(i['Live Date']),
                end: new Date(i['Start Date']),
            })),
        )
        .catch((err) => {
            axios.isAxiosError(err) && console.log(err.response?.data);
            return [];
        });

export type EventWithAdAccount = {
    adAccountId: string;
    eventId: string;
    nonProfit: string;
    start: Date;
    end: Date;
};

export const getEventWithAdAccounts = async (): Promise<
    EventWithAdAccount[]
> => {
    const [events, adAccounts] = await Promise.all([
        getEvents(),
        getAdAccounts(),
    ]);

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
