import { runDbCmd, updateAllAttributes, getDbResults, toSqlValue, fromSqlValue } from "../utils/database"

/** Saves loaded data in the database */
export const saveData = (name: string, data: any) => {
    if (data) {
        const escapedData = toSqlValue(JSON.stringify(data), true);
        const updateString = updateAllAttributes({ data: JSON.stringify(data) }, true);
        runDbCmd(`INSERT INTO data_loaded VALUES ('${name}', ${escapedData}) ${updateString};`);
    }
}

/** Returns the loaded data of the database */
export const loadData = async <type>(name: string, defaultValue: type): Promise<type> => {
    const raw = await getDbResults(`SELECT * FROM data_loaded WHERE name='${name}'`);
    const parsed = fromSqlValue(raw[0]?.data);
    return (parsed ? JSON.parse(parsed) : parsed) || defaultValue;
}

/** Checks if the the updater should do a force update.
 * 
 * Reasons for that can be stored default data or there is no stored data yet. */
export const shouldForceUpdate = (data: any, defaultValue: any): boolean => {
    return !data || JSON.stringify(data) === JSON.stringify(defaultValue) || data.error !== undefined;
}