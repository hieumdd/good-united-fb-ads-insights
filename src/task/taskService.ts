import 'dotenv/config';
import { CloudTasksClient } from '@google-cloud/tasks';

const PROJECT = process.env.PROJECT_ID || '';
const LOCATION = 'us-central1';
const QUEUE = 'fb-ads-insights';
const URL = process.env.PUBLIC_URL || '';
const GCP_SA = process.env.GCP_SA || '';

const client = new CloudTasksClient();

export const createTasks = async <P>(payloads: P[]) => {
    const parent = client.queuePath(PROJECT, LOCATION, QUEUE);

    const tasks: any[] = payloads
        .map((p) => ({
            httpRequest: {
                httpMethod: 'POST',
                url: URL,
                oidcToken: {
                    serviceAccountEmail: GCP_SA,
                },
                body: Buffer.from(JSON.stringify(p)).toString('base64'),
            },
        }))
        .map((task) => ({ parent, task }));

    const results = (
        await Promise.all(tasks.map((r) => client.createTask(r)))
    ).map(([res]) => res);

    return results.length;
};
