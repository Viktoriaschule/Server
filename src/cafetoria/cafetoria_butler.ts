import express from 'express';
import bodyParser from 'body-parser';
import { download, fetchDataForUser } from './cafetoria_download';
import { Cafetoria } from '../utils/interfaces';

export const cafetoriaRouter = express.Router();
cafetoriaRouter.use(bodyParser.json());

let data: Cafetoria | undefined;

cafetoriaRouter.post('/', async (req, res) => {
    if (req.body.id === 'null' || req.body.pin === 'null' || req.body.id === undefined || req.body.pin === undefined) {
        res.json(data);
        return;
    }
    try {
        const result = await fetchDataForUser(req.body.id, req.body.pin);
        res.json({ error: result.error?.toString(), days: data?.days, saldo: result.saldo});
    } catch (e) {
        res.json({ error: e, days: data?.days, saldo: undefined});
    }
});

cafetoriaRouter.get('/', (req, res) => {
    return res.json(data);
});

export const updateCafetoriaMenus = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        download(data != undefined).then((_data) => {
            data = _data || data || {saldo: undefined, error: '?', days: []};
            resolve()
        }).catch((reason) => {
            data = data || { saldo: undefined, error: '?', days: [] };
            reject(reason)
        });
    });
};