import express from 'express';
import { Subjects } from '../utils/interfaces';

export const statusRouter = express.Router();

const status = {
    sp: new Date('01 01 2000'),
    minutely: new Date('01 01 2000'),
    hourly: new Date('01 01 2000'),
    daily: new Date('01 01 2000')
};

statusRouter.get('/', (_, res) => {
    return res.send(
        `<h1>Status</h1>
        <table>
            <tr><td>Substitution plan</td><td>${status.sp}</td></tr><tr>
            <td>Minutely</td><td>${status.minutely}</td></tr>
            <tr><td>Hourly</td><td>${status.hourly}</td></tr>
            <tr><td>Daily</td><td>${status.daily}</td></tr>
        </table>
        `
    );
});


export const updatedSubstitutionPlan = () => {
    status.sp = new Date();
};

export const updatedDaily = () => {
    status.daily = new Date();
};

export const updatedHourly = () => {
    status.hourly = new Date();
};

export const updatedMinutely = () => {
    status.minutely = new Date();
};