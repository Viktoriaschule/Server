import express from 'express';
import download from './sp_download';
import { SubstitutionPlan } from '../utils/interfaces';
import { loadData, saveData, shouldForceUpdate } from '../utils/data';

export const substitutionPlanRouter = express.Router();
const defaultData: SubstitutionPlan[] = [];

substitutionPlanRouter.get('/', async (req, res) => {
    return res.json(await loadData<SubstitutionPlan[]>('substitution_plan', defaultData));
});

/** Updates the substitution plan */
export const updateSubstitutionPlan = async (): Promise<void> => {
    const days = await loadData<SubstitutionPlan[]>('substitution_plan', defaultData);
    const newDays = await download(!(shouldForceUpdate(days, defaultData) || days[0] === undefined || days[1] === undefined));
    if (newDays[0] !== undefined) days[0] = newDays[0];
    if (newDays[1] !== undefined) days[1] = newDays[1];
    saveData('substitution_plan', days);
};

/** Returns the updated date of the substitution plan */
export const getSubstitutionPlanVersion = async (): Promise<string> => {
    const days = await loadData<SubstitutionPlan[]>('substitution_plan', defaultData);
    if (days[0] !== undefined){
        return days[0].updated;
    }
    return '';
};

/** Returns the current loaded substitutionplan */
export const getSubstitutionPlan = async (): Promise<(SubstitutionPlan | undefined)[]> => {
    return await loadData<SubstitutionPlan[]>('substitution_plan', defaultData);
}
