import express from 'express';
import download from './tt_download';
import {Subject, Timetable, TimetableGroups, Timetables} from '../utils/interfaces';
import {shouldForceUpdate} from '../utils/data';
import {clearTimetables, getTimetableGroup, setTimetableGroup} from "./tt_db";
import config from "../utils/config";
import bodyParser from "body-parser";

export const timetableRouter = express.Router();
timetableRouter.use(bodyParser.json());

const defaultValue: Timetables = {date: new Date().toISOString(), groups: {}};

timetableRouter.get('/', async (req, res) => {
    return res.json((await getTimetableGroup(req.user.group)) || {
        date: new Date().toISOString(),
        group: req.user.group,
        data: {},
    });
});

timetableRouter.post('/', async (req, res) => {
    const key = req.query.key;
    if (key !== config.timetableKey) {
        res.status(401);
        res.json({'error': 'Missing auth key'});
        return;
    }

    const ids: string[] = req.body?.ids ?? [];

    const loadedIds: string[] = [];
    const subjects: Subject[] = [];

    const loadedTimetables: TimetableGroups = {};
    for (const id of ids) {
        const group = id.split('-')[0];

        // Load the timetable from the database if not loaded yet
        if (!loadedTimetables[group]) {
            const timetable = await getTimetableGroup(group);
            if (timetable) {
                loadedTimetables[group] = timetable;
            }
        }

        // If the timetable exists load the subject
        if (loadedTimetables[group] && !loadedIds.includes(id)) {
            const subject = getSubjectFromId(loadedTimetables[group], id);
            if (subject) {
                subjects.push(subject);
            }
            loadedIds.push(id);
        }
    }

    return res.json({subjects: subjects});
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
    return getSubjectFromId(timetable, id)?.courseID;
};

const getSubjectFromId = (timetable: Timetable, id: string): Subject | undefined => {
    try {
        return timetable.data
            .days[parseInt(id.split('-')[2])]
            .units[parseInt(id.split('-')[3])]
            .subjects[parseInt(id.split('-')[4])];
    } catch (_) {
        return undefined;
    }
};
