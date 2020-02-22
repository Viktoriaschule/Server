import express from 'express';
import bodyParser from 'body-parser';
import { download, fetchDataForUser } from './cafetoria_download';
import { Cafetoria } from '../utils/interfaces';
import { loadData, saveData, shouldForceUpdate } from '../utils/data';

export const cafetoriaRouter = express.Router();
cafetoriaRouter.use(bodyParser.json());

const defaultValue: Cafetoria = { saldo: undefined, error: 'No data', days: [] };

cafetoriaRouter.post('/', async (req, res) => {
    const data = await loadData<Cafetoria>('cafetoria', defaultValue);
    if (req.body.id === 'null' || req.body.pin === 'null' || req.body.id === undefined || req.body.pin === undefined) {
        res.json(data);
        return;
    }
    try {
        const result = await fetchDataForUser(req.body.id, req.body.pin);
        res.json({ error: result.error?.toString(), days: data?.days, saldo: result.saldo });
    } catch (e) {
        res.json({ error: e, days: data?.days, saldo: undefined});
    }
});

cafetoriaRouter.get('/', async (req, res) => {
    return res.json(await loadData<Cafetoria>('cafetoria', defaultValue));
});

export const updateCafetoriaMenus = async (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const data = await loadData<Cafetoria>('cafetoria', defaultValue);
        download(!shouldForceUpdate(data, defaultValue)).then((_data) => {
            saveData('cafetoria', _data || data || defaultValue);
            resolve();
        }).catch(reject);
    });
};