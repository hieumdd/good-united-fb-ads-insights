import axios from 'axios';

import type {
  Event,
  EventAPI,
  AdAccount,
  AdAccountAPI,
} from '../types/goodUnited';

const instance = axios.create({
  baseURL: 'https://abc.1gu.xyz',
  headers: {
    key: process.env.API_KEY || '',
  },
});

export const getAdAccounts = async (): Promise<
  [unknown | null, AdAccount[] | null]
> => {
  try {
    const { data }: { data: AdAccountAPI<any> } = await instance.get(
      '/adAccounts'
    );
    return [
      null,
      Object.entries(data).map(([key, value]) => ({
        adAccount: key,
        ids: value.map((i: string) => i.trim()).map((i: string) => i || null),
      })),
    ];
  } catch (err) {
    return [err, null];
  }
};

export const getEvents = async (): Promise<[unknown | null, Event[] | null]> => {
  try {
    const { data }: { data: EventAPI[] } = await instance.get('/events');
    return [
      null,
      data.map((i) => ({
        eventId: i['ID'],
        nonProfit: i['Nonprofit'],
        start: new Date(i['Live Date']),
        end: new Date(i['Start Date']),
      })),
    ];
  } catch (err) {
    return [err, null];
  }
};
