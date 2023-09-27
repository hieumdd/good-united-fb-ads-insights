import { getAdAccounts, getEventWithAdAccounts } from './good-united.service';

it('getAdAccounts', async () => {
    return getAdAccounts().then((result) => expect(result).toBeDefined());
});

it('getEventWithAdAccounts', async () => {
    return getEventWithAdAccounts().then((result) => expect(result).toBeDefined());
});
