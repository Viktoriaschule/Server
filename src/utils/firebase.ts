import admin from 'firebase-admin';
import path from 'path';
import { Device, User } from './interfaces';
import { getAllDevices, rmvDevice, getUsers, getDevices, rmvUser, rmvPreferences, rmvSelections, rmvExams, rmvNotifications, rmvDevices } from '../tags/tags_db';
import { checkUsername } from '../authentication/ldap';
import { rmvCafetoriaLogin } from '../cafetoria/cafetoria_db';

export const initFirebase = () => {
    console.log("Init firebase");
    const serviceAccount = require(path.resolve(process.cwd(), 'firebase.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://viktoriaflutter.firebaseio.com'
    });
};

export const send = async (tokens: string[], data: any, options?: any): Promise<boolean> => {
    if (tokens.length === 0) return false;
    return new Promise((resolve, reject) => {
        admin.messaging().sendToDevice(tokens, data, options)
            .then((response) => {
                resolve(response.failureCount !== tokens.length);
            })
            .catch(function (error: any) {
                console.error('Error sending message:', error);
                resolve(false);
            });
    });
};

export const removeOldDevices = async () => {
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    // Clean up old devices
    let count = 0;
    let devices: Device[] = await getAllDevices();
    for (var device of devices) {
        const success = await send([device.firebaseId], {data: {}}, {'dry_run': true});

        // Delete the device if the token does not exist or it was since four month inactive
        if (!success || Date.parse(device.lastActive) < fourMonthsAgo.getTime()) {
            rmvDevice(device);
            rmvPreferences(device.firebaseId);
            count++;
        }
    }
    console.log(`Removed ${count} devices`);

    // Clean up old users
    count = 0;
    const users: User[] = await getUsers();
    for (var user of users) {
        const _devices = await getDevices(user.username);
        const userExists = await checkUsername(user.username);
        if (!userExists || _devices.length === 0) {
            // Delete complete user data
            rmvUser(user);
            rmvDevices(user.username);
            rmvSelections(user.username);
            rmvExams(user.username);
            rmvNotifications(user.username);
            rmvCafetoriaLogin(user.username);
            _devices.forEach((device) => rmvPreferences(device.firebaseId));
            count++;
        }
    }
    console.log(`Removed ${count} users`);

}
