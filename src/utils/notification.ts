import {send} from './firebase';
import {Device} from './interfaces';
import {getAllDevices, getDevices, getPreference, getUsers} from '../tags/tags_db';

const getFirebaseIDs = async (key: string, dev: boolean, toAll = false): Promise<string[]> => {
    let allDevices: Device[] = [];
    if (dev) {
        let users = await getUsers(dev);
        for (let user of users) {
            allDevices = allDevices.concat(await getDevices(user.username));
        }
    } else {
        allDevices = await getAllDevices();
    }

    const allFirebaseIds = allDevices.map((device: Device) => device.firebaseId);

    if (toAll) {
        return allFirebaseIds;
    }

    // Find all devices with activated notifications
    const firebaseIds: string[] = [];

    for (const firebaseId of allFirebaseIds) {
        // Check if the device has notifications enabled
        var getNotifications = await getPreference(firebaseId, `notifications-${key}`);
        if (getNotifications === undefined) getNotifications = true;
        if (getNotifications) {
            firebaseIds.push(firebaseId);
        }

    }
    return firebaseIds;
};

export const updateApp = async (type: string, data: any, dev?: boolean): Promise<void> => {
    if (!dev) dev = false;

    const firebaseIds = await getFirebaseIDs(type, dev, true);
    data = JSON.parse(JSON.stringify(data));
    data.type = type;
    data.action = 'update';

    await send(firebaseIds, { data: data });
};

/** Sends the user notifications and updates the app */
export const sendNotification = async (dev: boolean, notification: { devices?: Device[], title: string, body: string, bigBody: string, type: string, group: number, data: any, closeGroups?: number[] }, shouldUpdateApp = true): Promise<void> => {
    try {
        let firebaseIds: string[] = notification.devices != null ? notification.devices
            .map((device: Device) => device.firebaseId) : await getFirebaseIDs(notification.type, dev);

        if (!notification.devices) {
            console.log(`Sending ${notification.type} notifications to ${firebaseIds.length} devices`);
        }

        if (shouldUpdateApp) {
            // Send a silent notification to inform the apps about new data
            await updateApp(notification.type, notification.data, dev);
        }

        notification.data.title = notification.title;
        notification.data.bigBody = notification.bigBody;
        notification.data.body = notification.body;
        notification.data.type = notification.type;
        notification.data.group = notification.group.toString();
        notification.data.closeGroups = JSON.stringify(notification.closeGroups ?? [notification.group]);

        // Send the notifications to inform the users
        await send(firebaseIds, { data: notification.data }, {});
    } catch (e) {
        console.log(`Failed to send ${notification.type} notifications: ${e}`);
    }
};
