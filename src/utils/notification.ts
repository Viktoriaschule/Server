import { send } from './firebase';
import { Device } from './interfaces';

export const sendMessage = async (data: { devices: Device[], data: any }): Promise<void> => {
    const firebaseIds = data.devices.map((device: Device) => device.firebaseId);
    await send(firebaseIds, { data: data.data });
};

export const sendNotification = async (data: { devices: Device[], title: string, body: string, bigBody: string, type: string, group: number, data: any, closeGroups?: number[] }): Promise<void> => {
    var firebaseIds: string[] = data.devices
        .map((device: Device) => device.firebaseId);

    data.data.title = data.title;
    data.data.bigBody = data.bigBody;
    data.data.body = data.body;
    data.data.type = data.type;
    data.data.group = data.group.toString();
    data.data.closeGroups = JSON.stringify(data.closeGroups ?? [data.group]);

    await send(firebaseIds, { data: data.data }, {});
};
