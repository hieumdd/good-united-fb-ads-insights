import { CloudTasksClient } from '@google-cloud/tasks';

type Payload = {
    [key: string]: any;
};

const PROJECT = '';
const LOCATION = '';
const QUEUE = '';
const URL = '';
const GCP_SA = '';

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
