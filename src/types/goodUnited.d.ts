export type EventAPI = {
  ID: string;
  Nonprofit: string;
  'Live Date': string;
  'Start Date': string;
};

export type Event = {
  eventId: string;
  nonProfit: string;
  start: string;
  end: string;
};

export type AdAccountAPI<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];

export type AdAccount = {
  adAccount: string;
  ids: string[];
};
