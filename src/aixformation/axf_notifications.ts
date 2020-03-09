import { sendNotification } from "../utils/notification";
import { Post } from "../utils/interfaces";
import getLocalization from "../utils/localizations";

/**
 * Sends the AiXformation notifications to all users who want them
 * @param data loaded AiXformation data
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (post: Post, isDev: boolean): Promise<void> =>
    sendNotification(isDev, {
        body: post.title,
        bigBody: post.title,
        title: getLocalization('aixformation'),
        type: 'aixformation',
        group: 6,
        data: {
            url: post.url,
        }
    });