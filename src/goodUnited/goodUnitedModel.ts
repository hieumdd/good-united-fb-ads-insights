import { Schema, model } from 'mongoose';

import type { EventWithAdAccount } from './goodUnited';

const collection = 'Events';

const schemaObj = {
    adAccountId: Number,
    eventId: { type: String, required: true },
    nonProfit: String,
    start: Date,
    end: Date,
};

export const models = model<EventWithAdAccount>(
    collection,
    new Schema<EventWithAdAccount>(schemaObj, { collection }),
);
