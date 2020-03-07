import { setLatestSubstitutionPlan, compareLatestSubstitutionPlan } from '../history/history';
import { parse } from 'node-html-parser';
import { fetchData } from '../utils/network';
import parseSubstitutionPlan from './sp_parser';
import { SubstitutionPlan } from '../utils/interfaces';
import { sendNotifications } from './sp_notifications';
import { initFirebase } from '../utils/firebase';
import filterSubstitutionPlan from './sp_filter';
import { updateTimetable } from '../timetable/tt_butler';
import { initDatabase } from '../utils/database';
import { updatedSubstitutionPlan } from '../status/status_butler';
import { getSubstitutionPlanUrl } from '../utils/urls';

const isDev = process.argv.length >= 3 && process.argv[2].trim() === '--dev';

const isNew = async (day: number, data: string): Promise<boolean> => {
    const _isNew = await compareLatestSubstitutionPlan(day, data.replace(/\"|\\n|\\r/g, '').trim());
    if (_isNew) {
        setLatestSubstitutionPlan(day, data);
    }
    return _isNew;
};

/**
 * Downloads the html of the website and saves the parsed json
 * @param day the day of the website (0=left; 1=right)
 * @returns {SubstitutionPlan} the substitutionPlan
 */
const downloadDay = async (day: number, checkIfUpdated?: boolean): Promise<SubstitutionPlan | undefined> => {
    // Download the raw html
    const url = getSubstitutionPlanUrl(day + 1);
    const raw = await fetchData(url, true);
    //console.log('Fetched substitution plan for day ' + day);

    // Check if it is a new html or for development
    const _isNew = await isNew(day, raw);
    if (_isNew || isDev || !checkIfUpdated) {
        // Parse the html to an object
        const data = parse(raw);
        console.log('Parsed substitution plan for day ' + day);

        // Parse html to json
        let substitutionPlan = await parseSubstitutionPlan(data, isDev);
        substitutionPlan = await filterSubstitutionPlan(substitutionPlan);
        console.log('Extracted substitution plan for day ' + day);

        if (_isNew || isDev) {
            sendNotifications(isDev, day, substitutionPlan);
        }

        return substitutionPlan;
    }
    return undefined;
};

/**
 * Downloads both days from the website
 * @returns the downloaded day (undefined when not updated)
 */
const download = async (checkIfUpdated?: boolean): Promise<Array<SubstitutionPlan | undefined>> => {
    const day1 = await downloadDay(0, checkIfUpdated);
    const day2 = await downloadDay(1, checkIfUpdated);
    updatedSubstitutionPlan();
    return [day1, day2];
}

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    initDatabase().then(() => {
        updateTimetable().then(() => {
            download();
        })
    });
}

export default download;
