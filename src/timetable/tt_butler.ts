import express from 'express';
import download from './tt_download';
import { Timetables } from '../utils/interfaces';
import getAuth from '../utils/auth';
import { getGrade } from '../authentication/ldap';
import { loadData, saveData, shouldForceUpdate } from '../utils/data';

export const timetableRouter = express.Router();
const defaultValue: Timetables = { date: new Date().toISOString(), grades: {} };

timetableRouter.get('/', async (req, res) => {
    const auth = getAuth(req);
    const grade = await getGrade(auth.username, auth.password);
    return res.json((await loadData<Timetables>('timetable', defaultValue)).grades[grade]);
});

/**
 * Updates the timetable
 */
export const updateTimetable = async (): Promise<void> => {
    const loaded = await loadData<Timetables>('timetable', defaultValue);
    return new Promise<void>((resolve, reject) => {
        download(!shouldForceUpdate(loaded, defaultValue))
            .then((timetable) => {
                if (timetable) {
                    saveData('timetable', timetable);
                }
                resolve();
            }).catch(reject);
    });
};

/**
 * Returns the version of the current timetable
 */
export const getTimetableVersion = async (): Promise<string> => {
    return (await loadData<Timetables>('timetable', defaultValue)).date;
};

/**
 * Returns the current timetable
 */
export const getTimetable = async (): Promise<Timetables | undefined> => {
    return loadData<Timetables>('timetable', defaultValue);
}


/**
 * Returns all subjects ids of one course id
 * @param grade for timetable
 * @param courseID searched [courseID]
 */
export const getCourseIDsFromID = (timetables: Timetables, grade: string, id: string): string | undefined => {
    const timetable = timetables.grades[grade];
    try {
        return timetable.data
            .days[parseInt(id.split('-')[2])]
            .units[parseInt(id.split('-')[3])]
            .subjects[parseInt(id.split('-')[4])]
            .courseID;
    } catch (_) {
        return undefined;
    }
}
