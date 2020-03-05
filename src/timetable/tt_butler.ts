import express from 'express';
import download from './tt_download';
import { Device, Timetables } from '../utils/interfaces';
import getAuth from '../utils/auth';
import { getGrade } from '../authentication/ldap';
import { getAllDevices, getDevices, getUsers, getPreference } from '../tags/tags_db';
import { loadData, saveData, shouldForceUpdate } from '../utils/data';
import { updateApp } from "../utils/update_app";
import { sendNotification } from "../utils/notification";
import getLocalization from "../utils/localizations";

export const timetableRouter = express.Router();
const defaultValue: Timetables = { date: new Date().toISOString(), grades: {} };

timetableRouter.get('/', async (req, res) => {
    const auth = getAuth(req);
    const grade = await getGrade(auth.username, auth.password);
    return res.json((await loadData<Timetables>('timetable', defaultValue)).grades[grade]);
});

/**
 * Updates the timetable
 */
export const updateTimetable = async (): Promise<void> => {
    const loaded = await loadData<Timetables>('timetable', defaultValue);
    return new Promise<void>((resolve, reject) => {
        download(!shouldForceUpdate(loaded, defaultValue))
            .then((timetable) => {
                if (timetable) {
                    saveData('timetable', timetable);
                }
                resolve();
            }).catch(reject);
    });
};

/**
 * Returns the version of the current timetable
 */
export const getTimetableVersion = async (): Promise<string> => {
    return (await loadData<Timetables>('timetable', defaultValue)).date;
};

/**
 * Returns the current timetable
 */
export const getTimetable = async (): Promise<Timetables | undefined> => {
    return loadData<Timetables>('timetable', defaultValue);
}


/**
 * Returns all subjects ids of one course id
 * @param grade for timetable
 * @param courseID searched [courseID]
 */
export const getCourseIDsFromID = (timetables: Timetables, grade: string, id: string): string | undefined => {
    const timetable = timetables.grades[grade];
    try {
        return timetable.data
            .days[parseInt(id.split('-')[2])]
            .units[parseInt(id.split('-')[3])]
            .subjects[parseInt(id.split('-')[4])]
            .courseID;
    } catch (_) {
        return undefined;
    }
}

/**
 * Sends the new timetable notifications to all users
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (isDev: boolean): Promise<void> => {
    try {
        let allDevices: Device[] = [];
        if (isDev) {
            let users = await getUsers(isDev);
            for (let user of users) {
                allDevices = allDevices.concat(await getDevices(user.username));
            }
        } else {
            allDevices = await getAllDevices();
        }
        // Find all devices with activated notifications
        const devices: Device[] = [];
        for (const device of allDevices) {
            // Check if the device has notifications enabled
            var getNotifications = await getPreference(device.firebaseId, 'notifications-timetable');
            if (getNotifications === undefined) getNotifications = true;
            if (getNotifications) {
                devices.push(device);
            }
        }
        console.log('Sending notifications to ' + devices.length + ' devices');

        await sendNotification({
            devices: devices,
            body: getLocalization('newTimetable'),
            bigBody: getLocalization('newTimetable'),
            title: getLocalization('timetable'),
            type: 'timetable',
            group: 7,
            data: {},
        });

        // Inform the app about a new timetable
        await updateApp('timetable', {}, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};
