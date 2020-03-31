import checkLogin from './ldap';
import express from 'express';
import {AsyncAuthorizerCallback} from 'express-basic-auth';

export const authRouter = express.Router();

authRouter.get('/', (req, res) => {
    return res.json({status: true});
});

authRouter.get('/:username/:password', async (req, res) => {
    const status = await checkLogin(req.params.username, req.params.password);
    return res.json({status: status});
});

async function authorizer(username: string, password: string, callback: AsyncAuthorizerCallback): Promise<void> {
    const status = await checkLogin(username, password);
    callback(null, status);
}

export default authorizer;