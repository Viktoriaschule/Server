import {getLdapUser} from './ldap';
import express, {Request} from 'express';
import getAuth from "../utils/auth";
import {registerUser} from "../tags/tags_butler";

// Extend the default request
declare global {
    namespace Express {
        export interface Request {
            user: {
                username: string,
                password: string,
                group: string,
                isTeacher: boolean,
            }
        }
    }
}

export const authRouter = express.Router();

authRouter.get('/', (req, res) => {
    return res.json({
        status: true,
        group: req.user.group,
        isTeacher: req.user.isTeacher,
    });
});

export async function addUserInfo(req: Request, res: any, next: () => any) {
    const auth = getAuth(req);
    const user = await getLdapUser(auth.username, auth.password);

    if (user.group != '') {
        req.user = {
            username: auth.username,
            password: auth.password,
            group: user.group,
            isTeacher: user.isTeacher,
        }

        await registerUser(auth.username, auth.password, {
            grade: user.group,
            isTeacher: user.isTeacher,
            status: true
        });

        next();
    } else {
        res.status(401);
        const challengeString = 'Basic';
        res.set('WWW-Authenticate', challengeString);
        res.json({error: 'unauthorized'});
    }
}