import { sendNotification } from "../utils/notification";
import { Cafetoria, CafetoriaDay } from "../utils/interfaces";
import { getWeekday } from "../substitution_plan/sp_notifications";
import getLocalization from "../utils/localizations";

/**
 * Sends the Cafetoria notifications to all users who want them
 * @param data loaded Cafetoria data
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (data: Cafetoria, isDev: boolean): Promise<void> =>
    sendNotification(isDev, {
        body: `${data.days.filter((day: CafetoriaDay) => day.menus.length > 0).length} ${getLocalization('days')}`,
        bigBody: data.days.filter((day: CafetoriaDay) => day.menus.length > 0)
            .map((day: CafetoriaDay) => `${getWeekday(new Date(day.date).getDay() - 1)}: ${day.menus.length} ${getLocalization('menus')}`)
            .join('<br/>'),
        title: getLocalization('cafetoria'),
        type: 'cafetoria',
        group: 5,
        data: {},
    });
