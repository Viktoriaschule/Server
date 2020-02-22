import express from 'express';
import download from './teachers_download';
import { Teacher } from '../utils/interfaces';
import { loadData, shouldForceUpdate, saveData } from '../utils/data';

export const teachersRouter = express.Router();
const defaultData: Teacher[] = [];

teachersRouter.get('/', async (req, res) => {
    return res.json(await loadData<Teacher[]>('teachers', defaultData));
});

/**
 * Updates the teacher
 */
export const updateTeachers = async (): Promise<void> => {
    const data = await loadData<Teacher[]>('teachers', defaultData);
    const newData = await download(shouldForceUpdate(data, defaultData)) || data;
    saveData('teachers', newData);
};