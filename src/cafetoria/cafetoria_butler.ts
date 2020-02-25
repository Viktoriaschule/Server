import express from 'express';
import bodyParser from 'body-parser';
import {download, fetchDataForUser} from './cafetoria_download';
import {Cafetoria, CafetoriaDay, Device} from '../utils/interfaces';
import {loadData, saveData, shouldForceUpdate} from '../utils/data';
import {getAllDevices, getDevices, getUsers} from "../tags/tags_db";
import {sendNotification} from "../utils/notification";
import getLocalization from "../utils/localizations";
import {updateApp} from "../utils/update_app";
import {getWeekday} from "../substitution_plan/sp_notifications";

export const cafetoriaRouter = express.Router();
cafetoriaRouter.use(bodyParser.json());

const defaultValue: Cafetoria = {saldo: undefined, error: 'No data', days: []};

cafetoriaRouter.post('/', async (req, res) => {
    const data = await loadData<Cafetoria>('cafetoria', defaultValue);
    if (req.body.id === 'null' || req.body.pin === 'null' || req.body.id === undefined || req.body.pin === undefined) {
        res.json(data);
        return;
    }
    try {
        const result = await fetchDataForUser(req.body.id, req.body.pin);
        res.json({error: result.error?.toString(), days: data?.days, saldo: result.saldo});
    } catch (e) {
        res.json({error: e, days: data?.days, saldo: undefined});
    }
});

cafetoriaRouter.get('/', async (req, res) => {
    return res.json(await loadData<Cafetoria>('cafetoria', defaultValue));
});

export const updateCafetoriaMenus = async (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const data = await loadData<Cafetoria>('cafetoria', defaultValue);
        download(!shouldForceUpdate(data, defaultValue)).then((_data) => {
            saveData('cafetoria', _data || data || defaultValue);
            resolve();
        }).catch(reject);
    });
};


/**
 * Sends the Cafetoria notifications to all users who want them
 * @param data loaded Cafetoria data
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (data: Cafetoria, isDev: boolean): Promise<void> => {
    try {
        let devices: Device[] = [];
        if (isDev) {
            let users = await getUsers(isDev);
            for (let user of users) {
                devices = devices.concat(await getDevices(user.username));
            }
        } else {
            devices = await getAllDevices();
        }
        console.log('Sending notifications to ' + devices.length + ' devices');

        await sendNotification({
            devices: devices,
            body: `${data.days.filter((day: CafetoriaDay) => day.menus.length > 0).length} ${getLocalization('days')}`,
            bigBody: data.days.filter((day: CafetoriaDay) => day.menus.length > 0)
                .map((day: CafetoriaDay) => `${getWeekday(new Date(day.date).getDay() - 1)}: ${day.menus.length} ${getLocalization('menus')}`)
                .join('<br/>'),
            title: getLocalization('cafetoria'),
            data: {
                type: 'cafetoria'
            }
        });

        // Inform the app about a new cafetoria menus
        await updateApp({
            'type': 'cafetoria',
            'action': 'update',
            'weekday': '', // This is totally a bug, but I can't figure out why it's needed, but it doesn't make sense in any way - signed jld3103
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};
