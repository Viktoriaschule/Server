import {SubstitutionPlanGroup} from "../utils/interfaces";
import {getDbResults, runDbCmd, toSqlValue, updateAllAttributes} from "../utils/database";

/** Get the substitution plan for a group and date */
export const getSubstitutionPlanGroup = async (group: string, day_index: number): Promise<SubstitutionPlanGroup | undefined> => {
    const result = (await getDbResults(`SELECT data FROM data_substitution_plan WHERE group_name='${group}' AND day_index='${day_index}';`))[0];
    return result ? JSON.parse(result.data) : undefined;
};

/** Set a substitution plan for one group and a specific date */
export const setSubstitutionPlanGroup = (group: string, day_index: number, data: SubstitutionPlanGroup): void => {
    const parsed = JSON.stringify(data);
    const updateAttr = {
        data: parsed,
    };
    const updateStr = updateAllAttributes(updateAttr, true);
    runDbCmd(`INSERT INTO data_substitution_plan VALUES ('${group}', '${day_index}', ${toSqlValue(parsed)}) ${updateStr};`);
};

/** Clean the table */
export const cleanSubstitutionPlans = (day_index: number): void => {
    runDbCmd(`DELETE FROM data_substitution_plan WHERE day_index='${day_index}';`);
};