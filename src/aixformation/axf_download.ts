import { AiXformation } from "../utils/interfaces";
import { initFirebase } from "../utils/firebase";
import { initDatabase } from "../utils/database";
import { fetchData } from "../utils/network";
import { setLatestAiXformation, compareLatestAiXformation } from '../history/history';
import parseAiXformation from "./axf_parser";

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
    const users = await fetchData(url + '/users?per_page=100', false)
    const tags = await fetchData(url + '/tags?per_page=100', false)
    const parsed = parseAiXformation(data, users, tags);

    if (isNew(data + users + tags)) {
        //TODO: Send notifications
    }

    return parsed;
}

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    initDatabase().then(async () => {
        await download();
    });
}

export default download;