import express from 'express';
import download from './axf_download';
import { AiXformation, Device, Post } from '../utils/interfaces';
import { loadData, saveData } from '../utils/data';
import { getAllDevices, getDevices, getUsers, getPreference } from "../tags/tags_db";
import { sendNotification } from "../utils/notification";
import { updateApp } from "../utils/update_app";
import getLocalization from "../utils/localizations";

export const aixformationRouter = express.Router();

aixformationRouter.get('/', async (req, res) => {
    return res.json(await loadData<AiXformation>('aixformation', defaultValue));
});

export const updateAiXformation = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
        const aixformation = await loadData<AiXformation>('aixformation', defaultValue);
        download()
            .then((data) => {
                saveData('aixformation', data || aixformation || defaultValue);
                resolve();
            })
            .catch(reject);
    });
};

/**
 * Sends the AiXformation notifications to all users who want them
 * @param data loaded AiXformation data
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (post: Post, isDev: boolean): Promise<void> => {
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
            var getNotifications = await getPreference(device.firebaseId, 'notifications-aixformation');
            if (getNotifications === undefined) getNotifications = true;
            if (getNotifications) {
                devices.push(device);
            }
        }

        console.log('Sending notifications to ' + devices.length + ' devices');

        await sendNotification({
            devices: devices,
            body: post.title,
            bigBody: post.title,
            title: getLocalization('aixformation'),
            type: 'aixformation',
            group: 6,
            data: {
                url: post.url,
            }
        });

        // Inform the app about a new cafetoria menus
        await updateApp('aixformation', {
            'url': post.url,
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};

const defaultValue: AiXformation = {
    date: new Date().toISOString(),
    posts: [],
};
