import { Schema, model } from 'mongoose';

import type { EventWithAdAccount } from '../types/goodUnited';

const COLLECTION = 'Events';

export const schema = new Schema<EventWithAdAccount>(
  {
    adAccountId: String,
    eventId: { type: String, required: true },
    nonProfit: String,
    start: String,
    end: String,
  },
  { collection: COLLECTION }
);

export const models = model<EventWithAdAccount>(COLLECTION, schema);

export const keys = Object.entries(schema.obj)
  .filter(([, type]: [any, any]) => type.required)
  .map(([name]) => name);

export const fields = Object.entries(schema.obj).map(([name]) => name);
