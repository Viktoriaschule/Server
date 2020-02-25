import fs from 'fs';
import path from 'path';
import {parse} from 'node-html-parser';
import { parseDates as sp_parseDates} from '../substitution_plan/sp_parser';
import { compareUpdate, setUpdated } from '../updates/update_db';
import { addSubstitutionPlanVersion } from './history_db';

/**
 * Saves the html string in the substitution plan history
 * @param data raw html string
 */
export const setLatestSubstitutionPlan = (day: number, data: string): void => {
    // Save substitution plan
    const dates = sp_parseDates(parse(data));
    const update = new Date(dates.update);
    const date = new Date(dates.date);
    _setLatestSubstitutionPlan(day, data.replace(/\"|\\n|\\r/g, '').trim());
    addSubstitutionPlanVersion(date, update, data);
};

export const setLatestCafetoria = (date: Date): void => setUpdated('cafetoria', date.toISOString());
export const compareLatestCafetoria = async (date: Date): Promise<boolean> => await compareUpdate('cafetoria', date.toISOString());

export const setLatestCalendar = (url: string): void => setUpdated('calendar', url);
export const compareLatestCalendar = async (url: string): Promise<boolean> => await compareUpdate('calendar', url);

export const setLatestTeachers = (url: string): void => setUpdated('teachers', url);
export const compareLatestTeachers = async (url: string): Promise<boolean> => await compareUpdate('teachers', url);

export const setLatestSubjects = (data: string): void => setUpdated('subjects', data);
export const compareLatestSubjects = async (data: string): Promise<boolean> => await compareUpdate('subjects', data);

export const setLatestTimetable = (data: string): void => setUpdated('timetable', data);
export const compareLatestTimetable = async (data: string): Promise<boolean> => await compareUpdate('timetable', data);

export const setLatestAiXformation = (data: string): void => setUpdated('aixformation', data);
export const compareLatestAiXformation = async (data: string): Promise<boolean> => await compareUpdate('aixformation', data);

const _setLatestSubstitutionPlan = (day: number, data: string): void => setUpdated(`substitution_plan_${day}`, data);
export const compareLatestSubstitutionPlan = async (day: number, data: string): Promise<boolean> => await compareUpdate(`substitution_plan_${day}`, data);
