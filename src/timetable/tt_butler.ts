import express from 'express';
import download from './tt_download';
import {Timetables} from '../utils/interfaces';
import {shouldForceUpdate} from '../utils/data';
import {clearTimetables, getTimetableGroup, setTimetableGroup} from "./tt_db";

export const timetableRouter = express.Router();
const defaultValue: Timetables = {date: new Date().toISOString(), groups: {}};

timetableRouter.get('/', async (req, res) => {
    return res.json((await getTimetableGroup(req.user.group)) || {
        date: new Date().toISOString(),
        group: req.user.group,
        data: {},
    });
});

/**
 * Updates the timetable
 */
export const updateTimetable = async (): Promise<void> => {
    // Check if there is a loaded timetable (For an example group)
    const loaded = await getTimetableGroup('5a');
    return new Promise<void>((resolve, reject) => {
        download(!shouldForceUpdate(loaded, defaultValue))
            .then((timetable) => {
                if (timetable) {
                    clearTimetables();
                    for (const group of Object.keys(timetable.groups)) {
                        setTimetableGroup(group, timetable.groups[group]);
                    }
                }
                resolve();
            }).catch(reject);
    });
};


/**
 * Returns all subjects ids of one course id
 * @param timetables The loaded timetables
 * @param id The searched [id]
 */
export const getCourseIDsFromID = (timetables: Timetables, id: string): string | undefined => {
    const grade = id.split('-')[0];
    const timetable = timetables.groups[grade];
    try {
        return timetable.data
            .days[parseInt(id.split('-')[2])]
            .units[parseInt(id.split('-')[3])]
            .subjects[parseInt(id.split('-')[4])]
            .courseID;
    } catch (_) {
        return undefined;
    }
};
