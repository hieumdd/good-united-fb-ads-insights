import { eventPipelineService, taskService } from './good-united.service';

it('Event Service', async () => {
    return eventPipelineService().then((res) => expect(res).toBeTruthy());
});

const timeFrame = {
    // start: '2022-08-10',
    // end: '2022-08-15',
};

it('Task Service', async () => {
    return taskService(timeFrame).then((res) => expect(res).toBeTruthy());
});

it('Controller', async () => {
    return Promise.all([eventPipelineService(), taskService(timeFrame)]).then(
        (res) => res.forEach((r) => expect(r).toBeTruthy()),
    );
});
