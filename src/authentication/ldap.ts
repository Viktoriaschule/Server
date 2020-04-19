import request from 'request';
import config from '../utils/config';
import {LdapUser} from '../utils/interfaces';
import {getUser} from '../tags/tags_db';
import {getLdapUrl} from '../utils/urls';
import {isTeacher} from "../utils/auth";

const ldapRequest = (username: string, password: string): Promise<LdapUser> => {
    return new Promise<LdapUser>((resolve, reject) => {
        const options: request.CoreOptions = {auth: {username: username, password: password}, timeout: 500};
        const url = getLdapUrl(username);
        try {
            request.get(`${url}/login`, options, (err, res, body) => {
                if (err) {
                    console.log('Failed to check login:', err.code);
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
                    console.log('Failed to check username:', err.code);
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
export const getLdapUser = async (username: string, password: string, ldapUser?: LdapUser): Promise<{ group: string, isTeacher: boolean }> => {
    const user = ldapUser || await new Promise<LdapUser | undefined>(async (resolve, reject) => {
        ldapRequest(username, password)
            .then((user) => {
                resolve(user);
            })
            .catch((_) => {
                resolve(undefined);
            });
    });

    if (user && !user.status) {
        return {group: '', isTeacher: false};
    }

    if (user && user.isTeacher) {
        return {group: username, isTeacher: true};
    }

    if (!user || !user.grade) {
        const user = await getUser(username);
        return {group: user?.group || '', isTeacher: isTeacher(user?.userType || 1)};
    }

    return {group: user.grade, isTeacher: false};
};
