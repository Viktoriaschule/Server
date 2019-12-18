import express from 'express';
import bodyParser from 'body-parser';
import { Tags, Exam, Device, CafetoriaLogin, Selection } from '../utils/interfaces';
import getAuth, { isDeveloper } from '../utils/auth';
import { getGrade } from '../authentication/ldap';
import { setLastActive, getUser, getSelections, getExams, setUser, setDevice, getExam, setExam, setPreference, setSelection, getSelection } from './tags_db';
import { getCafetoriaLogin, setCafetoriaLogin } from '../cafetoria/cafetoria_db';

const tagsRouter = express.Router();
tagsRouter.use(bodyParser.json());

/** Sets the last active tag for each request */
export const requestHandler = (req: any) => {
    const auth = getAuth(req);
    setLastActive(auth.username);
}

tagsRouter.get('/', async (req, res) => {
    if (req.headers.authorization) {
        const username = getAuth(req).username;
        const user = await getUser(username);
        if (user) {
            const tags: Tags = {
                grade: user.grade,
                group: user.group,
                selected: await getSelections(username) || [],
                exams: await getExams(username) || [],
                cafetoria: await getCafetoriaLogin(username)
            }
            return res.json(tags);
        }
        return res.json({});
    }
    res.status(401);
    return res.json({ error: 'unauthorized' });
});

tagsRouter.post('/', async (req, res) => {

    // Update the user
    const auth = getAuth(req);
    setUser({
        username: auth.username,
        grade: getGrade(auth.username, auth.password),
        group: isDeveloper(auth.username) ? 5 : 1,
        lastActive: new Date().toISOString()
    });

    const errors = [];

    // If the device is updated, update it
    if (req.body.device) {
        const device: Device = req.body.device;
        if (device.appVersion && device.firebaseId && device.name && device.os) {
            setDevice(auth.username, device);

            // Update settings if they are set
            if (req.body.device.settings) {
                Object.keys(req.body.device.settings).forEach((key) => {
                    setPreference(device.firebaseId, key, req.body.device.settings[key]);
                });
            }
        } else {
            res.status(400);
            errors.push('The device has the wrong format!');
        }
    }

    // Update cafetoria data if it is set
    if (req.body.cafetoria) {
        const cafetoriaLogin: CafetoriaLogin = req.body.cafetoria;
        if (cafetoriaLogin.timestamp) {
            const dbCafetoriaLogin = await getCafetoriaLogin(auth.username);
            if (Date.parse(cafetoriaLogin.timestamp) > Date.parse(dbCafetoriaLogin.timestamp)) {
                setCafetoriaLogin(auth.username, cafetoriaLogin);
            }
        } else {
            res.status(400);
            errors.push('The cafetoria login data has the wrong format!');
        }
    }

    // If the selections are updated, update them
    if (req.body.selected) {
        const selections: Selection[] = req.body.selected;
        for (var selection of selections) {
            if (selection.block && selection.timestamp) {
                const dbSelection = await getSelection(auth.username, selection.block);
                if (!dbSelection || Date.parse(selection.timestamp) > Date.parse(dbSelection.timestamp)) {
                    setSelection(auth.username, selection);
                }
            } else {
                res.status(400);
                errors.push(`The index ${selections.indexOf(selection)} of selections has the wrong format!`);
            }
        }
    }

    // If the exams are updated, update them
    if (req.body.exams) {
        const exams: Exam[] = req.body.exams;
        for (var exam of exams) {
            if (exam.subject && exam.timestamp) {
                const dbExam = await getExam(auth.username, exam.subject);
                if (!dbExam || Date.parse(exam.timestamp) > Date.parse(dbExam.timestamp)) {
                    setExam(auth.username, exam);
                }
            } else {
                res.status(400);
                errors.push(`The index ${exams.indexOf(exam)} of exams has the wrong format!`);
            }
        }
    }
    if (errors.length > 0) {
        res.json({ 'errors': errors });
        return;
    }
    res.json({ 'error': null });
});

export default tagsRouter;