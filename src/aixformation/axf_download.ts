import { AiXformation } from "../utils/interfaces";
import { initFirebase } from "../utils/firebase";
import { initDatabase } from "../utils/database";
import { fetchData } from "../utils/network";
import { compareLatestAiXformation, setLatestAiXformation } from '../history/history';
import parseAiXformation from "./axf_parser";
import { setValue, getValue } from "./axf_db";
import { sendNotifications } from "./axf_notifications";

const isDev = process.argv.length === 3;

const isNew = async (data: string): Promise<boolean> => {
    const _isNew = await compareLatestAiXformation(data);
    if (_isNew) {
        setLatestAiXformation(data);
    }
    return _isNew;
};

const download = async (): Promise<AiXformation> => {
    const url = 'https://aixformation.de/wp-json/wp/v2';
    const data = await fetchData(url + '/posts?per_page=100', false);
    const users = await fetchData(url + '/users?per_page=100', false);
    const tags = await fetchData(url + '/tags?per_page=100', false);
    const parsed = await parseAiXformation(data, users, tags);

    // Update the aixformation update hash
    await isNew(JSON.stringify(parsed.posts))

    const lastParsed = await getValue('date');

    if (lastParsed) {
        for (const post of parsed.posts) {
            if (Date.parse(post.date) > Date.parse(lastParsed) || (isDev && parsed.posts.indexOf(post) == 0)) {
                console.log('New aixformation post');
                await sendNotifications(post, isDev);
            }
        }
    }

    setValue('date', new Date().toISOString());

    return parsed;
};

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    initDatabase().then(async () => {
        await download();
    });
}

export default download;
