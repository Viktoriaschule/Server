import { runDbCmd, getDbResults } from "../utils/database";
import crypto from 'crypto';

/** Saves the loaded data in the databes with the given name */
export const setUpdated = (name: string, value: string): void => {
    const hashedValue = crypto.createHash('sha1').update(value).digest('hex');
    runDbCmd(`INSERT INTO data_updates VALUES (\'${name}\', '${hashedValue}') ON DUPLICATE KEY UPDATE value = '${hashedValue}';`);
}

/** Returns the updates value for the given name */
export const compareUpdate = async (name: string, newValue: string): Promise<boolean> => {
    const hashedValue = crypto.createHash('sha1').update(newValue).digest('hex');
    const dbUpdate = (await getDbResults(`SELECT * FROM data_updates WHERE name='${name}';`))[0];
    if (!dbUpdate) return true;
    return dbUpdate.value !== hashedValue;
}

/** Returns the updates value for the given name */
export const getUpdates = async (): Promise<Map<string, string>> => {
    const updates = new Map<string, string>();
    (await getDbResults(`SELECT * FROM data_updates;`)).forEach(update => {
        updates.set(update.name, update.value);
    });
    return updates;
}