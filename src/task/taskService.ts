import { CloudTasksClient } from '@google-cloud/tasks';
import { v4 as uuidv4 } from 'uuid';

const PROJECT = process.env.PROJECT_ID || '';
const LOCATION = 'us-central1';
const QUEUE = 'fb-ads-insights';
const URL = process.env.PUBLIC_URL || '';
const GCP_SA = process.env.GCP_SA || '';

export const createTasks = async <P>(payloads: P[], name: (p: P) => string) => {
    const client = new CloudTasksClient();

    const parent = client.queuePath(PROJECT, LOCATION, QUEUE);

    const tasks: any[] = payloads
        .map((p) => ({
            name: client.taskPath(
                PROJECT,
                LOCATION,
                QUEUE,
                `${name(p)}-${uuidv4()}`,
            ),
            httpRequest: {
                httpMethod: 'POST',
                headers: { 'Content-Type': 'application/json' },
                url: URL,
                oidcToken: {
                    serviceAccountEmail: GCP_SA,
                },
                body: Buffer.from(JSON.stringify(p)).toString('base64'),
            },
        }))
        .map((task) => ({ parent, task }));

    const requests = await Promise.all(tasks.map((r) => client.createTask(r)));
    await client.close();
    const results = requests.map(([res]) => res.name);

    return results.length;
};
