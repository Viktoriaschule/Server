import express from 'express';
import cors from 'cors';
import {addUserInfo, authRouter} from './authentication/auth_butler';
import {subjectsRouter, updateSubjects} from './subjects/subjects_butler';
import historyRouter from './history/history_butler';
import updateRouter from './updates/update_butler';
import {substitutionPlanRouter, updateSubstitutionPlan} from './substitution_plan/sp_butler';
import {timetableRouter, updateTimetable} from './timetable/tt_butler';
import {cafetoriaRouter, updateCafetoriaMenus} from './cafetoria/cafetoria_butler';
import {calendarRouter, updateCalendar} from './calendar/calendar_butler';
import {teachersRouter, updateTeachers} from './teachers/teachers_butler';
import tagsRouter from './tags/tags_butler';
import bugsRouter from './bugs/bugs_router';
import {initFirebase, removeOldDevices} from './utils/firebase';
import {initDatabase} from './utils/database';
import {statusRouter, updatedDaily, updatedHourly, updatedMinutely} from './status/status_butler';
import {aixformationRouter, updateAiXformation} from './aixformation/axf_butler';
import path from "path";

const app = express();
app.use(cors());

// Can't be used with authentication
app.use('/aixformation/images', express.static(path.resolve('tmp', 'images')));

app.use(addUserInfo);

//app.use(basicAuth({authorizer: authorizer, challenge: true, authorizeAsync: true}));

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.use('/login', authRouter);
app.use('/updates', updateRouter);
app.use('/history', historyRouter);
app.use('/timetable', timetableRouter);
app.use('/substitutionplan', substitutionPlanRouter);
app.use('/cafetoria', cafetoriaRouter);
app.use('/calendar', calendarRouter);
app.use('/tags', tagsRouter);
app.use('/teachers', teachersRouter);
app.use('/subjects', subjectsRouter);
app.use('/bugs', bugsRouter);
app.use('/aixformation', aixformationRouter);
app.use('/status', statusRouter);


/**
 * Downloads every minute the substitutionPlan
 */
const minutely = async (): Promise<void> => {
    await runUpdates('minutely', {
        'substitution plan': async () => runUpdate(updateSubstitutionPlan()),
    }, false);
    setTimeout(minutely, 60000);
    updatedMinutely();
};

/**
 * Downloads every hour the aixformation
 */
const hourly = async (): Promise<void> => {
    await runUpdates('hourly', {
        'aixformation': updateAiXformation,
        'cafetoria': async () => await runUpdate(updateCafetoriaMenus()),
    });
    setTimeout(hourly, 3600000);
    updatedHourly();
};

/**
 * Downloads every 24 hours the substitutionPlan
 */
const daily = async (): Promise<void> => {
    await runUpdates('daily', {
        'subjects': async () => await runUpdate(updateSubjects()),
        'teachers': async () => await runUpdate(updateTeachers()),
        'timetable': async () => await runUpdate(updateTimetable()),
        'calendar': async () => await runUpdate(updateCalendar()),
        'devices': removeOldDevices,
    });

    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setHours(18, 0, 0);
    while (tomorrow.getTime() <= now + 60000) {
        tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const difInMillis = tomorrow.getTime() - now;
    setTimeout(daily, difInMillis);
    updatedDaily();
};

const runUpdates = async (type: string, updates: any, log = true): Promise<void> => {
    for (let update of Object.keys(updates)) {
        try {
            if (log) console.log('Update', update);
            await updates[update]().catch((e: any) => {
                console.error(`Failed to run ${type} update ${updates[update]}:`, e);
            });
        } catch (e) {
            console.error(`Failed to run ${type} update ${updates[update]}:`, e);
        }
    }
};

const runUpdate = (update: Promise<void>): Promise<void> => {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise<void>((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('Timed out update.')
        }, 20000)
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race<void>([
        update,
        timeout
    ]);
};

// Start download process
(async () => {
    // Init firebase for sending notifications
    await initDatabase();
    initFirebase();
    await daily();
    await hourly();
    await minutely();
})();

export default app;
