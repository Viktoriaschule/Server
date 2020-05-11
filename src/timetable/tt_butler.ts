import express from 'express';
import download from './tt_download';
import {Subject, Timetable, TimetableGroups, Timetables} from '../utils/interfaces';
import {shouldForceUpdate} from '../utils/data';
import {clearTimetables, getTimetableGroup, setTimetableGroup} from "./tt_db";
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

    const ids: string[] = req.body?.ids ?? [];

    const loadedIds: string[] = [];
    const subjects: Subject[] = [];

    const loadedTimetables: TimetableGroups = {};
    for (const id of ids) {
        const group = id.split('-')[0];

        if (!req.user.isTeacher && group !== req.user.group) {
            continue;
        }

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

timetableRouter.get('/unit', async (req, res) => {

    const group: string = req.query.group.toString();
    const day: number = parseInt(req.query.day.toString());
    const unit: number = parseInt(req.query.unit.toString());

    if (!req.user.isTeacher && group !== req.user.group) {
        res.status(405);
        res.json({error: 'Only teachers are allowed to request units of other groups'});
        return;
    }

    const timetable = await getTimetableGroup(group);
    if (timetable) {
        try {
            res.json({subjects: timetable.data.days[day].units[unit].subjects});
        } catch {
            res.status(400);
            res.json({error: 'There is not unit for the given params'});
        }
        return;
    }

    res.status(400);
    res.json({error: 'There is no timetable for the group'});
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
