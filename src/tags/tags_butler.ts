import express from 'express';
import bodyParser from 'body-parser';
import {CafetoriaLogin, Device, Exam, LdapUser, Selection, Tags} from '../utils/interfaces';
import getAuth, {getUserType} from '../utils/auth';
import {getLdapUser} from '../authentication/ldap';
import {
    getExam,
    getExams,
    getSelection,
    getSelections,
    getUser,
    setDevice,
    setExam,
    setPreference,
    setSelection,
    setUser
} from './tags_db';
import {getCafetoriaLogin, setCafetoriaLogin} from '../cafetoria/cafetoria_db';

const tagsRouter = express.Router();
tagsRouter.use(bodyParser.json());

tagsRouter.get('/', async (req, res) => {
    if (req.headers.authorization) {
        const username = getAuth(req).username;
        const user = await getUser(username);
        if (user) {
            const tags: Tags = {
                group: user.group,
                userType: user.userType,
                selected: await getSelections(username) || [],
                exams: await getExams(username) || [],
                cafetoria: await getCafetoriaLogin(username)
            };
            return res.json(tags);
        }
        return res.json({});
    }
    res.status(401);
    return res.json({error: 'unauthorized'});
});

export const registerUser = async (username: string, password: string, user?: LdapUser): Promise<void> => {
    const _user = await getLdapUser(username, password, user);
    setUser({
        username: username,
        group: _user?.group || '',
        userType: getUserType(username, user?.isTeacher || false),
        last_active: undefined,
    });
};

tagsRouter.post('/', async (req, res) => {

    // Update the user
    await registerUser(req.user.username, req.user.password, {
        isTeacher: req.user.isTeacher,
        grade: req.user.group,
        status: true,
    });

    const errors = [];

    // If the device is updated, update it
    if (req.body.device) {
        const device: Device = req.body.device;
        if (device.appVersion && device.firebaseId && device.package && device.os) {
            device.lastActive = new Date().toISOString();
            setDevice(req.user.username, device);

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
            const dbCafetoriaLogin = await getCafetoriaLogin(req.user.username);
            if (Date.parse(cafetoriaLogin.timestamp) > Date.parse(dbCafetoriaLogin.timestamp)) {
                setCafetoriaLogin(req.user.username, cafetoriaLogin);
            }
        } else {
            res.status(400);
            errors.push('The cafetoria login data has the wrong format!');
        }
    }

    // If the selections are updated, update them
    if (req.body.selected) {
        const selections: Selection[] = req.body.selected;
        for (let selection of selections) {
            if (selection.block && selection.timestamp) {
                const dbSelection = await getSelection(req.user.username, selection.block);
                selection.timestamp = new Date(Date.parse(selection.timestamp)).toISOString();
                if (!dbSelection || Date.parse(selection.timestamp) > Date.parse(dbSelection.timestamp)) {
                    setSelection(req.user.username, selection);
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
        for (let exam of exams) {
            if (exam.subject && exam.timestamp) {
                const dbExam = await getExam(req.user.username, exam.subject);
                if (!dbExam || Date.parse(exam.timestamp) > Date.parse(dbExam.timestamp)) {
                    setExam(req.user.username, exam);
                }
            } else {
                res.status(400);
                errors.push(`The index ${exams.indexOf(exam)} of exams has the wrong format!`);
            }
        }
    }
    if (errors.length > 0) {
        res.json({'errors': errors});
        return;
    }
    res.json({'error': null});
});

export default tagsRouter;
