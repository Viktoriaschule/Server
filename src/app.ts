import express from 'express';
import cors from 'cors';
import config from './config';
import { fetchDataForUser } from './cafetoria/cafetoria';
import router from './messageboard/messageboard';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.get('/login/:username/:password', (req, res) => {
    if (req.params.username.toLowerCase() === config.usernamesha && req.params.password.toLowerCase() === config.passwordsha) {
        return res.json({ status: true });
    }
    res.json({ status: false });
});

app.get('/cafetoria/login/:id/:pin', async (req, res) => {
    if (req.params.id === 'null' || req.params.pin === 'null' || req.params.id === undefined || req.params.pin === undefined) {
        req.params.id = '';
        req.params.pin = '';
    }
    try {
        res.json(await fetchDataForUser(req.params.id, req.params.pin));
    } catch (e) {
        res.json(e);
    }
});

app.use('/messageboard', router);

export default app;