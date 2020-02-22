import express from 'express';
import { download } from './calendar_download';
import { Calendar } from '../utils/interfaces';
import { loadData, saveData, shouldForceUpdate } from '../utils/data';

export const calendarRouter = express.Router();
const defaultData: Calendar = {years: [], data: []};

calendarRouter.get('/', async (req, res) => {
    return res.json(await loadData<Calendar>('calendar', defaultData));
});

/**
 * Updates the calendar
 */
export const updateCalendar = async (): Promise<void> => {
    const data = await loadData<Calendar>('calendar', defaultData);
    saveData('calendar', await download(shouldForceUpdate(data, defaultData)) || data || defaultData);
};