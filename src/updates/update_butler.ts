import express from 'express';
import crypto from 'crypto';
import { UpdateData } from '../utils/interfaces';
import { getGrade } from '../authentication/ldap';
import getAuth from '../utils/auth';
import { getUpdates } from './update_db';
import { getCafetoriaLogin } from '../cafetoria/cafetoria_db';

const updatesRouter = express.Router();

// Sends the update data
updatesRouter.get('/', async (req, res) => {
    const allUpdates = await getUpdates();
    const auth = getAuth(req);

    const cafetoriaLogin = await getCafetoriaLogin(auth.username);
    let cafetoria = allUpdates.get('cafetoria') || '';
    cafetoria += cafetoriaLogin.id || '';
    cafetoria += cafetoriaLogin.password || '';
    cafetoria = crypto.createHash('sha1').update(cafetoria).digest('hex')

    const updates: UpdateData = {
        timetable: allUpdates.get('timetable') || '',
        cafetoria: cafetoria,
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