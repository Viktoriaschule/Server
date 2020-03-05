import { sendMessage } from './notification';
import { User, Device } from "./interfaces";
import { isDeveloper } from "./auth";
import { getAllDevices, getUsers, getDevices } from '../tags/tags_db';

export const updateApp = async (type: string, data: any, dev?: boolean): Promise<void> => {
    if (!dev) dev = false;

    let devices: Device[] = [];
    if (dev) {
        let users = await getUsers(dev);
        for (let user of users) {
            devices = devices.concat(await getDevices(user.username));
        }
    } else {
        devices = await getAllDevices();
    }

    data.type = type;
    data.action = 'update';

    await sendMessage({
        devices: devices,
        data: data
    });
};
