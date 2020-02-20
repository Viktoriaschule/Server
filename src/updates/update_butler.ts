import express from 'express';
import { UpdateData } from '../utils/interfaces';
import { getGrade } from '../authentication/ldap';
import getAuth from '../utils/auth';
import { getUpdates } from './update_db';

const updatesRouter = express.Router();

// Sends the update data
updatesRouter.get('/', async (req, res) => {
    const allUpdates = await getUpdates();
    const auth = getAuth(req);
    const updates: UpdateData = {
        timetable: allUpdates.get('timetable') || '',
        cafetoria: allUpdates.get('cafetoria') || '',
        calendar: allUpdates.get('calendar') || '',
        workgroups: allUpdates.get('workgroups') || '',
        substitutionPlan: allUpdates.get('substitution_plan_0') || '',
        subjects: allUpdates.get('subjects') || '',
        aixformation: allUpdates.get('aixformation') || '',
        minAppLevel: 27,
        grade: await getGrade(auth.username, auth.password)
    };
    return res.json(updates);
});

export default updatesRouter;