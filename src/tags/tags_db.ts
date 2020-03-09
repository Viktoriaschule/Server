import {
    fromSqlBoolean,
    fromSqlValue,
    getDbResults,
    runDbCmd,
    toSqlValue,
    updateAllAttributes,
    updateOnlyNonNullAttributes
} from "../utils/database"
import {Device, Exam, Selection, User} from "../utils/interfaces";

/** Sets a new user or updates old parameters */
export const setUser = (user: User): void => {
    const updateAttr = {
        grade: user.grade,
        user_group: user.group,
        last_active: new Date().toISOString(),
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO users VALUES ('${user.username}', '${user.grade}', '${user.group}', '${updateAttr.last_active}') ${updateStr};`);
}

/** Removes a user with the given username */
export const rmvUser = (user: User): void => {
    runDbCmd(`DELETE FROM users WHERE username='${user.username}';`);
}

/** Returns one user */
export const getUser = async (username: string): Promise<User | undefined> => {
    const dbUser = (await getDbResults(`SELECT * FROM users WHERE username='${username}';`))[0];
    if (!dbUser) return undefined;
    return {
        username: username,
        grade: dbUser.grade,
        group: dbUser.user_group,
        last_active: dbUser.last_active,
    };
}

/** Returns one user */
export const getUsers = async (dev = false): Promise<User[]> => {
    let devFilter = '';
    if (dev) {
        devFilter = ' WHERE user_group=5 OR user_group=6 OR user_group=12';
    }
    const dbUser = (await getDbResults(`SELECT * FROM users${devFilter};`)) || [];
    return dbUser.map((user) => {
        return {
            username: user.username,
            grade: user.grade,
            group: user.user_group,
            last_active: user.last_active,
        };
    });
}

/** Sets a selection for user */
export const setSelection = (username: string, selection: Selection): void => {
    const updateAttr = {
        course_id: selection.courseID,
        timestamp: selection.timestamp
    };
    const updateStr = updateAllAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_selections VALUES ('${username}', '${selection.block}', ${toSqlValue(selection.courseID)}, '${selection.timestamp}') ${updateStr};`);
}

/** Returns the selections for a user*/
export const getSelection = async (username: string, block: string): Promise<Selection | undefined> => {
    const dbSelections = (await getDbResults(`SELECT * FROM users_selections WHERE username='${username}' AND block='${block}';`))[0];
    if (!dbSelections) return undefined;
    return {
        block: dbSelections.block,
        courseID: dbSelections.course_id,
        timestamp: dbSelections.timestamp
    };
}

/** Removes all selections */
export const rmvAllSelections = (): void => {
    runDbCmd(`DELETE FROM users_selections;`);
}

/** Removes all selections for one username */
export const rmvSelections = (username: string): void => {
    runDbCmd(`DELETE FROM users_selections WHERE username='${username}';`);
}

/** Returns the selections for a user*/
export const getSelections = async (username: string): Promise<Selection[] | undefined> => {
    const dbSelections = (await getDbResults(`SELECT * FROM users_selections WHERE username='${username}';`));
    if (!dbSelections) return undefined;
    return dbSelections.map((selection) => {
        return {
            block: selection.block,
            courseID: fromSqlValue(selection.course_id),
            timestamp: selection.timestamp
        };
    });
}

/** Sets a writing option for a course id */
export const setExam = (username: string, exam: Exam): void => {
    const updateAttr = {
        writing: exam.writing,
        timestamp: exam.timestamp
    };
    const updateStr = updateAllAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_exams VALUES ('${username}', '${exam.subject}', ${toSqlValue(exam.writing)}, '${exam.timestamp}') ${updateStr};`);
}

/** Returns the writing option for a course id */
export const getExam = async (username: string, subject: string): Promise<Exam | undefined> => {
    const dbExam = (await getDbResults(`SELECT * FROM users_exams WHERE username='${username}' AND subject='${subject}';`))[0];
    if (!dbExam) return undefined;
    return {
        writing: fromSqlBoolean(dbExam.writing),
        subject: dbExam.subject,
        timestamp: dbExam.timestamp,
    };
}

/** Removes all exam for a given [username] */
export const rmvExams = (username: string): void => {
    runDbCmd(`DELETE FROM users_exams WHERE username='${username}';`);
}

/** Returns all exams for a user */
export const getExams = async (username: string): Promise<Exam[] | undefined> => {
    const dbExams = (await getDbResults(`SELECT * FROM users_exams WHERE username='${username}';`));
    if (!dbExams) return undefined;
    return dbExams.map((exam) => {
        return {
            subject: exam.subject,
            writing: fromSqlBoolean(exam.writing),
            timestamp: exam.timestamp
        };
    });
}

/** Sets a new device or updates old parameters */
export const setDevice = (username: string, device: Device): void => {
    const updateAttr = {
        os: device.os,
        version: device.appVersion,
        last_active: device.lastActive,
        package: device.package,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_devices VALUES ('${username}', '${device.firebaseId}', '${device.os}', '${device.appVersion}', '${device.package}', '${device.lastActive}') ${updateStr};`);
}

/** Removes a device */
export const rmvDevice = (device: Device): void => {
    runDbCmd(`DELETE FROM users_devices WHERE token='${device.firebaseId}';`);
}

/** Removes all devices of a user */
export const rmvDevices = (username: string): void => {
    runDbCmd(`DELETE FROM users_devices WHERE username='${username}';`);
}

/** Returns the device with the username and token */
export const getDevice = async (username: string, token: string): Promise<Device | undefined> => {
    const dbDevice = (await getDbResults(`SELECT * FROM users_devices WHERE username='${username}' AND token='${token}';`))[0];
    if (dbDevice === undefined) return undefined;
    return {
        firebaseId: dbDevice.token,
        os: dbDevice.os,
        appVersion: dbDevice.version,
        lastActive: dbDevice.last_active,
        package: dbDevice.package,
    };
}

/** Returns all stored devices for a given username */
export const getDevices = async (username: string): Promise<Device[]> => {
    const dbDevices = (await getDbResults(`SELECT * FROM users_devices WHERE username='${username}';`)) || [];
    return dbDevices.map((device) => {
        return {
            firebaseId: device.token,
            os: device.os,
            appVersion: device.version,
            lastActive: device.last_active,
            package: device.package,
        };
    });
}

/** Returns all stored devices */
export const getAllDevices = async (): Promise<Device[]> => {
    const dbDevices = (await getDbResults(`SELECT * FROM users_devices;`));
    return dbDevices.map((device) => {
        return {
            firebaseId: device.token,
            os: device.os,
            appVersion: device.version,
            lastActive: device.last_active,
            package: device.package,
        };
    });
}

/** Defines a preference for a device */
export const setPreference = (token: string, key: string, value: boolean): void => {
    const updateAttr = {
        value: value
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_settings VALUES ('${token}', '${key}', ${value}) ${updateStr};`);
}

/** Deletes all preferences for a device */
export const rmvPreferences = (token: string): void => {
    runDbCmd(`DELETE FROM users_settings WHERE token='${token}';`);
}

/** Returns a value for a device preference */
export const getPreference = async (token: string, key: string): Promise<boolean | undefined> => {
    const dbPreference = (await getDbResults(`SELECT * FROM users_settings WHERE token='${token}' AND key_name='${key}';`))[0];
    if (dbPreference === undefined) return undefined;
    return dbPreference.value === 1 ? true : false;
}

/** Define a preference for an user */
export const setNotification = (username: string, dayIndex: number, notification: string): void => {
    const updateAttr = {
        hash: notification
    };
    const updateStr = updateAllAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_notifications VALUES ('${username}', ${dayIndex}, ${toSqlValue(notification)}) ${updateStr};`);
}

/** Removes all notifications for a given username */
export const rmvNotifications = (username: string): void => {
    runDbCmd(`DELETE FROM users_notifications WHERE username='${username}';`);
}

/** Returns a value for a user preference */
export const getNotification = async (username: string, dayIndex: number): Promise<string | undefined> => {
    const dbNotification = (await getDbResults(`SELECT * FROM users_notifications WHERE username='${username}' AND day_index=${dayIndex};`))[0];
    if (dbNotification === undefined) return undefined;
    return dbNotification.hash;
}
