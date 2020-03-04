import { updateAllAttributes, runDbCmd, toSqlValue, getDbResults } from "../utils/database";

/** Sets an aixformation value */
export const setValue = (key: string, value: string): void => {
    const updateAttr = {
        data: value,
    };
    const updateStr = updateAllAttributes(updateAttr);
    runDbCmd(`INSERT INTO data_aixformation VALUES ('${key}', ${toSqlValue(value, true)}) ${updateStr};`);
}

/** Returns the selections for a user*/
export const getValue = async (key: string): Promise<string | undefined> => {
    const dbValue = (await getDbResults(`SELECT * FROM data_aixformation WHERE name='${key}';`))[0];
    if (!dbValue) return undefined;
    return dbValue.data;
}
