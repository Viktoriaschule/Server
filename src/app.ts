import express from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import authorizer from './authentication/auth_butler';
import { subjectsRouter, updateSubjects } from './subjects/subjects_butler';
import historyRouter from './history/history_butler';
import updateRouter from './updates/update_butler';
import { substitutionPlanRouter, updateSubstitutionPlan } from './substitution_plan/sp_butler';
import { timetableRouter, updateTimetable } from './timetable/tt_butler';
import { cafetoriaRouter, updateCafetoriaMenus } from './cafetoria/cafetoria_butler';
import { calendarRouter, updateCalendar } from './calendar/calendar_butler';
import { teachersRouter, updateTeachers } from './teachers/teachers_butler';
import tagsRouter from './tags/tags_butler';
import { authRouter } from './authentication/auth_butler';
import bugsRouter from './bugs/bugs_router';
import { initFirebase, removeOldDevices } from './utils/firebase';
import { initDatabase } from './utils/database';
import { updatedMinutely, updatedDaily, statusRouter, updatedHourly } from './status/status_butler';
import { aixformationRouter, updateAiXformation } from './aixformation/axf_butler';

const app = express();
app.use(cors());
app.use(basicAuth({ authorizer: authorizer, challenge: true, authorizeAsync: true }));

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
    try {
        await updateSubstitutionPlan();
    } catch (e) {
        console.error('Failed to run minutely update:', e);
    }
    setTimeout(minutely, 60000);
    updatedMinutely();
};

/**
 * Downloads every hour the aixformation
 */
const hourly = async (): Promise<void> => {
    try {
        await updateAiXformation();
    } catch (e) {
        console.error('Failed to run hourly update:', e);
    }
    setTimeout(hourly, 3600000);
    updatedHourly();
};

/**
 * Downloads every 24 hours the substitutionPlan
 */
const daily = async (): Promise<void> => {
    const updates: any = {
        'subjects': async () => await updateSubjects(),
        'teachers': async () => await updateTeachers(),
        'timetable': async () => await updateTimetable(),
        'calendar': async () => await updateCalendar(),
        'cafetoria': async () => await updateCafetoriaMenus(),
        'devices': async () => await removeOldDevices(),
    };
    for (var update of Object.keys(updates)) {
        try {
            console.log('Update', update);
            await updates[update]().catch((e: any) => {
                console.error(`Failed to run daily update ${updates[update]}:`, e);
            });
        } catch (e) {
            console.error(`Failed to run daily update ${updates[update]}:`, e);
        }
    }

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
