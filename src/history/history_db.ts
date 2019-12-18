import { runDbCmd, updateAllAttributes, escapeString } from "../utils/database"

/** Adds a new substitution plan to the history */
export const addSubstitutionPlanVersion = (date: Date, updates: Date, data: string) => {
    const escapedData = escapeString(data);
    const updateString = updateAllAttributes({ data: data }, true);
    runDbCmd(`INSERT INTO data_substitution_plan VALUES ('${date.toISOString()}', '${updates.toISOString()}', ${escapedData}) ${updateString};`);
}