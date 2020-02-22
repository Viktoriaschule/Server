import crypto from 'crypto';
import { updateApp } from '../utils/update_app';
import { sendNotification } from '../utils/notification';
import { Device, SubstitutionPlan } from '../utils/interfaces';
import { getSubstitutionsForUser } from './sp_filter';
import { getUsers, getDevices, getPreference, getNotification, setNotification } from '../tags/tags_db';
import getLocalization from '../utils/localizations';
import { getSubject, getSubjects } from '../subjects/subjects_butler';

/**
 * Sends substitution plan notifications to all devices
 * @param isDev Only send notifications to developers
 * @param day The substitution plan day index
 * @param substitutionplanDay The substitution plan day
 */
export const sendNotifications = async (isDev: boolean, day: number, substitutionplanDay: SubstitutionPlan) => {
    try {
        if (substitutionplanDay === undefined) throw 'Substitution plan is undefined';
        const date = new Date(substitutionplanDay.date);
        const current = new Date();
        // Stop sending notifications if the substitution plan day is already passed
        if (date.getTime() < current.getTime() && !(date.getDate() === current.getDate()
            && date.getMonth() === current.getMonth()
            && date.getFullYear() === current.getFullYear())) {
            console.log(day + ': ' + 'The day has passed, do not send notifications');
            return;
        }
        const weekday = new Date(substitutionplanDay.date).getDay() - 1;

        let users = await getUsers(isDev);
        console.log(day + ': ' + 'Sending notifications to ' + users.length + ' users');
        let notChanged = 0;
        let deviceCount = 0;
        const notifications = new Map<string, Device[]>();
        for (let user of users) {
            try {
                const substitutions = await getSubstitutionsForUser(user, substitutionplanDay);
                const subjects = await getSubjects();
                
                var text = substitutions.map((s) => {
                    const unsure = s.courseID === undefined && s.id === undefined;
                    let text = ''
                    if (unsure) text += '(';
                    text += `${s.unit + 1}. ${getLocalization('hour')} ${subjects[s.original.subjectID]} ${s.original.teacherID.toLocaleUpperCase()}`.trim();
                    text += ': ';
                    if (s.type === 0) text += getLocalization('change');
                    else if (s.type === 1) text += getLocalization('freeLesson');
                    else if (s.type === 2) text += getLocalization('exam');
                    if (unsure) text += ')';

                    return text;
                }).join('\n');
                if (text.length === 0) text = getLocalization('noChanges');

                /// Check if notification changed to last time
                const newNotification = crypto.createHash('md5').update(text).digest('hex');
                const notificationKey = `${new Date().getDate()}-${Math.floor(date.getTime() / 86400000)}-${newNotification}`;
                const lastNotification = await getNotification(user.username, day);
                if (!lastNotification || lastNotification !== notificationKey) {
                    setNotification(user.username, day, notificationKey);
                } else {
                    notChanged++;
                    if (!isDev) continue;
                }

                const title = getWeekday(weekday);
                const notification = `${title}||${text}`;
                if (!notifications.get(notification)) {
                    notifications.set(notification, []);
                }

                const devices = await getDevices(user.username);
                for (let device of devices) {
                    try {
                        // Check if the device has notifications enabled
                        var getNotifications = await getPreference(device.firebaseId, 'spNotifications');
                        if (getNotifications === undefined) getNotifications = true;
                        if (!getNotifications) continue;

                        // Set the notification for each device
                        const devices = notifications.get(notification);
                        if (devices) {
                            deviceCount++;
                            devices.push(device);
                        }
                    }
                    catch (e) {
                        console.error(day + ': ' + `Cannot send notification to ${user.username}'s device: ${device.firebaseId}:`, e);
                    }
                }
            } catch (e) {
                console.error(day + ': ' + 'Cannot send notification to user: ', user.username, e);
            }
        }

        // Send all notifications
        console.log(day + ': ' + `Ignore ${notChanged} notifications, because they did not changed`);
        console.log(day + ': ' + `Send ${notifications.size} different notifications to ${deviceCount} different devices`);
        for (var notification of Array.from(notifications.keys())) {
            try {
                const changesCount = notification.split('|')[1].split('\n').length;
                await sendNotification({
                    devices: notifications.get(notification) || [],
                    body: changesCount == 0 ? notification.split('||')[1] : `${changesCount} ${getLocalization('changes')}`,
                    bigBody: notification.split('||')[1],
                    title: notification.split('||')[0],
                    data: {
                        type: 'substitution plan',
                        weekday: weekday.toString()
                    }
                });
            }
            catch (e) {
                console.error(`Cannot send notification:`, e);
            }
        }

        await updateApp('All', {
            'type': 'substitution plan',
            'action': 'update',
            'day': day.toString(),
            'weekday': weekday.toString()
        }, isDev);

    } catch (e) {
        console.error('Failed to send notifications', e);
    }
}

/**
 * Returns the weekday string of the given index ind the given language
 * @param day index
 */
const getWeekday = (day: number): string => {
    return getLocalization('weekdays')[day];
}