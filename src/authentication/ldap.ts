import crypto from 'crypto';
import request from 'request';
import config from '../utils/config';
import {LdapUser} from '../utils/interfaces';
import {getDbResults, runDbCmd} from '../utils/database';
import {getUser} from '../tags/tags_db';
import {getLdapUrl} from '../utils/urls';
import {isTeacher} from "../utils/auth";
import {registerUser} from "../tags/tags_butler";

const ldapRequest = (username: string, password: string): Promise<LdapUser> => {
    return new Promise<LdapUser>((resolve, reject) => {
        const options: request.CoreOptions = {auth: {username: username, password: password}, timeout: 500};
        const url = getLdapUrl(username);
        try {
            request.get(`${url}/login`, options, (err, res, body) => {
                if (err) {
                    if (err.code === 'ETIMEDOUT') {
                        err = 'timeout';
                    }
                    console.log('Failed to check login:', err);
                    reject();
                } else {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        console.log('Failed to parse login response');
                        reject();
                    }
                }
            });
        } catch (e) {
            console.error('Login request failed:', e);
            reject();
        }
    });
};

const checkLogin = async (username: string, password: string): Promise<boolean> => {
    const hashed = crypto.createHash('sha256').update(password).digest('hex');
    const status = await new Promise<boolean | undefined>(async (resolve, reject) => {
        ldapRequest(username, password)
            .then(async (user) => {
                if (user.status) {
                    runDbCmd(`INSERT INTO users_login VALUES (\'${username}\', '${hashed}') ON DUPLICATE KEY UPDATE password = '${hashed}';`);
                    await registerUser(username, password);
                } else {
                    runDbCmd(`DELETE FROM users_login WHERE username='${username}';`);
                }
                resolve(user.status);
            })
            .catch(async (_) => {
                resolve(undefined);
            });

    });

    if (status === undefined) {
        const userLogin = (await getDbResults(`SELECT * FROM users_login where username="${username}";`))[0];
        return userLogin ? (userLogin.password === hashed) : false;
    }

    return status;
};

export const checkUsername = async (username: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const options: request.CoreOptions = {
            auth: {username: config.ldapUsername, password: config.ldapPassword},
            timeout: 1500
        };
        const url = getLdapUrl(username);
        try {
            request.get(`${url}/user/${username}`, options, (err, res, body) => {
                if (err) {
                    if (err.code === 'ETIMEDOUT') {
                        err = 'timeout';
                    }
                    console.log('Failed to check username:', err);
                    resolve(true);
                } else {
                    const status = body !== 'false';
                    resolve(status);
                }
            });
        } catch (_) {
            resolve(true);
        }
    });
};

/** Returns the user group (The grade for students and teacherID for teachers) **/
export const getGroup = async (username: string, password: string, ldapUser?: LdapUser): Promise<{ group: string, isTeacher: boolean }> => {
    const user = ldapUser || await new Promise<LdapUser | undefined>(async (resolve, reject) => {
        ldapRequest(username, password)
            .then((user) => {
                resolve(user);
            })
            .catch((_) => {
                resolve(undefined);
            });
    });

    if (user && user.isTeacher) {
        return {group: username, isTeacher: true};
    }

    if (!user || !user.grade) {
        const user = await getUser(username);
        return {group: user?.group || '', isTeacher: isTeacher(user?.userType || 1)};
    }

    return {group: user.grade, isTeacher: false};
};

export default checkLogin;