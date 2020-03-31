import express from 'express';
import crypto from 'crypto';
import {UpdateData} from '../utils/interfaces';
import {getGroup} from '../authentication/ldap';
import getAuth from '../utils/auth';
import {getUpdates} from './update_db';
import {getCafetoriaLogin} from '../cafetoria/cafetoria_db';

const updatesRouter = express.Router();

// Sends the update data
updatesRouter.get('/', async (req, res) => {
    const allUpdates = await getUpdates();
    const auth = getAuth(req);

    const group = (await getGroup(auth.username, auth.password)).group;
    const timetable = getHash((allUpdates.get('timetable') || '') + group);
    const substitutionPlan = getHash((allUpdates.get('substitution_plan_0') || '') + group);

    const cafetoriaLogin = await getCafetoriaLogin(auth.username);
    let cafetoria = allUpdates.get('cafetoria') || '';
    cafetoria += cafetoriaLogin.id || '';
    cafetoria += cafetoriaLogin.password || '';
    cafetoria = getHash(cafetoria);

    const updates: UpdateData = {
        timetable: timetable,
        cafetoria: cafetoria,
        calendar: allUpdates.get('calendar') || '',
        substitutionPlan: substitutionPlan,
        subjects: allUpdates.get('subjects') || '',
        aixformation: allUpdates.get('aixformation') || '',
        minAppLevel: 27,
        group: group,
    };
    return res.json(updates);
});

const getHash = (value: string) => crypto.createHash('sha1').update(value).digest('hex');

export default updatesRouter;
