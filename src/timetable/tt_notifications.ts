import { sendNotification } from "../utils/notification";
import getLocalization from "../utils/localizations";

/**
 * Sends the new timetable notifications to all users
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (isDev: boolean): Promise<void> => sendNotification(isDev, {
    body: getLocalization('newTimetable'),
    bigBody: getLocalization('newTimetable'),
    title: getLocalization('timetable'),
    type: 'timetable',
    group: 7,
    data: {},
});
