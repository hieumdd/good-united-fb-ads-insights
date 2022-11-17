import { CloudTasksClient, protos } from '@google-cloud/tasks';
import HttpMethod = protos.google.cloud.tasks.v2.HttpMethod;
import { v4 as uuidv4 } from 'uuid';

const PROJECT = 'good-united';
const LOCATION = 'us-central1';
const QUEUE = 'fb-ads-insights';

const URL = process.env.PUBLIC_URL || '';

export const createTasks = async <P>(
    payloads: P[],
    nameFn: (p: P) => string,
) => {
    const client = new CloudTasksClient();

    const serviceAccountEmail = await client.auth
        .getCredentials()
        .then((credentials) => credentials.client_email);

    const parent = client.queuePath(PROJECT, LOCATION, QUEUE);

    const tasks = payloads
        .map((p) => ({
            name: client.taskPath(
                PROJECT,
                LOCATION,
                QUEUE,
                `${nameFn(p)}-${uuidv4()}`,
            ),
            httpRequest: {
                httpMethod: HttpMethod.POST,
                headers: { 'Content-Type': 'application/json' },
                url: URL,
                oidcToken: { serviceAccountEmail },
                body: Buffer.from(JSON.stringify(p)).toString('base64'),
            },
        }))
        .map((task) => ({ parent, task })).slice(0, 2);

    const requests = await Promise.all(tasks.map((r) => client.createTask(r)));

    await client.close();

    const results = requests.map(([res]) => res.name);

    return results.length;
};
