import express from 'express';
import { Subjects } from '../utils/interfaces';
import download from './subjects_download';
import { loadData, saveData } from '../utils/data';

export const subjectsRouter = express.Router();

const defaultData: Subjects = {};

subjectsRouter.get('/', async (_, res) => {
    return res.json(await loadData<Subjects>('subjects', defaultData));
});

/** Updates the subjects */
export const updateSubjects = async (): Promise<void> => {
    saveData('subjects', await download() || defaultData);
};

/** Returns the current subjects */
export const getSubjects = async (): Promise<Subjects> => {
    return await loadData<Subjects>('subjects', defaultData);
}

/** Returns the current subjects */
export const getSubject = async (subject: string): Promise<String | undefined> => {
    return (await getSubjects())[subject];
}