import config from '../config';
import got from 'got';
import changesForUserID from '../changes/changesForUserID';
import {getUsers} from '../tags/users';
import {weekdayToInt} from './utils';
import {updateApp} from '../update_app';

export const getDevices = async () => {
    let url = 'https://onesignal.com/api/v1/players?app_id=' + config.appId;
    const response = await got.get(
        url,
        {
            headers: {
                'Authorization': 'Basic ' + config.appAuthKey
            }
        });
    if (response.statusCode === 200) {
        return await response.body;
    } else {
        throw response.body;
    }
};


export const sendNotifications = async (isDev: Boolean, today: Boolean, data: any, replacementplan1: any, unitplans: any) => {
    try {
        let devices = getUsers().filter((device: any) => (!isDev || device.tags.dev) && device.tags.grade !== undefined);
        console.log('Sending notifications to ' + devices.length + ' devices');
        devices.forEach(async (device: any) => {
            try {
                const changes = changesForUserID(device, unitplans[device.tags.grade], weekdayToInt(replacementplan1[0].for.weekday));
                let text = '';
                changes.forEach((change: any) => {
                    if (change.isMy !== 0) {
                        text +=
                            (change.isMy === -1 ? '(' : '')
                            + (change.unit + 1) + '. Stunde ' + change.nSubject.subject
                            + (change.nSubject.participant !== '' ? ' ' + change.nSubject.participant : '') + ':'
                            + (change.change.subject !== '' ? ' ' + change.change.subject : '')
                            + (change.change.info !== '' ? ' ' + change.change.info : '')
                            + (change.change.teacher !== '' ? ' ' + change.change.teacher : '')
                            + (change.change.room !== '' ? ' ' + change.change.room : '')
                            + (change.isMy === -1 ? ')' : '') + '\n';
                    }
                });

                text = text.slice(0, -1);
                if (text.length === 0) {
                    text = 'Es gibt keine Änderungen';
                }
                const weekday = replacementplan1[0].for.weekday;
                const dataString = {
                        app_id: config.appId,
                        include_player_ids: [device.id],
                        android_group: weekday.toString(),
                        contents: {
                            de: text,
                            en: text
                        },
                        headings: {
                            de: weekday,
                            en: weekday
                        },
                        data: {
                            type: 'replacementplan'
                        }
                    }
                ;
                let url = 'https://onesignal.com/api/v1/notifications';
                try {
                    const response = await got.post(
                        url,
                        {
                            headers: {
                                'Content-Type': 'application/json; charset=utf-8',
                                'Authorization': 'Basic ' + config.appAuthKey
                            },
                            body: JSON.stringify(dataString)
                        });
                    if (JSON.parse(response.body).errors !== undefined) {
                        if (JSON.parse(response.body).errors[0] === 'All included players are not subscribed') {
                            return;
                        }
                    }
                    console.log(response.body);
                } catch (response) {
                    console.log(response);
                }
            } catch (e) {
                console.error('Cannot send notification to device: ', device, e);
            }
        });
        const dateStr = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).replace('-Klassen-Vertretungsplan für ', '').replace('Januar', 'January').replace('Februar', 'February').replace('März', 'March').replace('Mai', 'May').replace('Juni', 'June').replace('Juli', 'July').replace('Oktober', 'October').replace('Dezember', 'December');
        const weekday = dateStr.split(', ')[0];
        updateApp('All', {
            'type': 'replacementplan',
            'action': 'update',
            'day': (today ? 'today' : 'tomorrow'),
            'weekday': weekday
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
}
