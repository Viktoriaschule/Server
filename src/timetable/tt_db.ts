import {Timetable} from "../utils/interfaces";
import {getDbResults, runDbCmd, toSqlValue, updateAllAttributes} from "../utils/database";

/** Get the timetable for a group and date */
export const getTimetableGroup = async (group: string): Promise<Timetable | undefined> => {
    const result = (await getDbResults(`SELECT data FROM data_timetable WHERE group_name='${group}';`))[0];
    return result ? JSON.parse(result.data) : undefined;
};

/** Set a timetable for one group and a specific date */
export const setTimetableGroup = (group: string, data: Timetable): void => {
    const parsed = JSON.stringify(data);
    const updateAttr = {
        data: parsed,
    };
    const updateStr = updateAllAttributes(updateAttr, true);
    runDbCmd(`INSERT INTO data_timetable VALUES ('${group}', ${toSqlValue(parsed)}) ${updateStr};`);
};

/** Clean the table */
export const clearTimetables = (): void => {
    runDbCmd(`TRUNCATE data_substitution_plan;`);
};