import { CloudTasksClient } from '@google-cloud/tasks';

type Payload = {
    [key: string]: any;
};

const PROJECT = process.env.PROJECT_ID || '';
const LOCATION = 'us-central1';
const QUEUE = 'fb-ads-insights';
const URL = process.env.PUBLIC_URL || '';
const GCP_SA = process.env.GCP_SA || '';

const client = new CloudTasksClient();

export const createTasks = async (payloads: Payload[]) => {
    const parent = client.queuePath(PROJECT, LOCATION, QUEUE);

    const tasks: any[] = payloads.map((p) => ({
        httpRequest: {
            URL,
            httpMethod: 'POST',
            oidcToken: {
                serviceAccountEmail: GCP_SA,
            },
            body: Buffer.from(JSON.stringify(p)).toString('base64'),
        },
    }));

    const requests = tasks.map((task) => ({ parent, task }))
    return Promise.all(requests.map((r) => client.createTask(r)))
};
