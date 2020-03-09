import fs from 'fs';
import path from 'path';
import { setLatestTimetable, compareLatestTimetable } from '../history/history';
import { initFirebase } from '../utils/firebase';
import { extractData } from './tt_parser';
import { Timetables } from '../utils/interfaces';
import { initDatabase } from '../utils/database';
import { sendNotifications } from './tt_notifications';

const isDev = process.argv.length === 3;

const isNew = async (data: string): Promise<boolean> => {
    return await compareLatestTimetable(data.replace(/\"|\\n|\\r/g, '').trim());
};

/**
 * Fetches the html string for the given week
 * @param weekA fetches either week a or week b
 */
const fetchData = async (): Promise<string> => {
    return fs.readFileSync(path.resolve(process.cwd(), 'unstf.txt'), 'latin1').toString();
};

const parse = (raw: string): string[] => {
    return raw.replace(/\"/g, '').split('\n');
}

/**
 * Downloads and parses the timetable
 * @param checkIfUpdated if false, always update the timetable, but without notifications
 * @returns the [Timetables]
 */
const download = async (checkIfUpdated = true): Promise<Timetables | undefined> => {
    // Get html strings for week A and B
    const raw = await fetchData();

    // Check if the timetable is new
    console.log('Fetched timetable');
    const _isNew = await isNew(raw);
    if (_isNew || isDev || !checkIfUpdated) {

        // Save the new version
        setLatestTimetable(raw.replace(/\"|\\n|\\r/g, '').trim());

        // Parse the html strings to html objects
        const data = parse(raw);
        console.log('Parsed timetable');

        // Parse the timetables and combine them to one
        const timetable = extractData(data);
        console.log('Extracted timetable');

        // Send notifications
        if (_isNew) {
            // rmvAllSelections();
        };
        if (_isNew || isDev) await sendNotifications(isDev);
        return timetable;
    }
    return undefined
};

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    initDatabase().then(() => download(false));
}

export default download;