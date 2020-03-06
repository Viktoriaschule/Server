import express from 'express';
import download from './axf_download';
import { AiXformation } from '../utils/interfaces';
import { loadData, saveData } from '../utils/data';
export const aixformationRouter = express.Router();

aixformationRouter.get('/', async (req, res) => {
    return res.json(await loadData<AiXformation>('aixformation', defaultValue));
});

export const updateAiXformation = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
        const aixformation = await loadData<AiXformation>('aixformation', defaultValue);
        download()
            .then((data) => {
                saveData('aixformation', data || aixformation || defaultValue);
                resolve();
            })
            .catch(reject);
    });
};


const defaultValue: AiXformation = {
    date: new Date().toISOString(),
    posts: [],
};
