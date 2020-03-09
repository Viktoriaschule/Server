import config from '../utils/config';
import request from 'request';
import { parse } from 'node-html-parser';
import extractData from './cafetoria_parser';
import { Cafetoria } from '../utils/interfaces';
import { compareLatestCafetoria, setLatestCafetoria } from '../history/history';
import { initFirebase } from "../utils/firebase";
import { initDatabase } from "../utils/database";
import { sendNotifications } from './cafetoria_notifications';

const isDev = process.argv.length === 3;

/**
 * Compares the dates of the old and given data
 * @param data html [data] of the cafetoria website
 */
const isNew = async (data: any): Promise<boolean> => {
    const rawDate = data.querySelector('.MPDatum').childNodes[0].childNodes[0].rawText.split('.');
    const newDate = new Date(`${rawDate[1]} ${rawDate[0]} ${rawDate[2]}`);
    if (await compareLatestCafetoria(newDate)) {
        setLatestCafetoria(newDate);
        return true;
    }
    return false;
};

/**
 * Fetches html for keyfop
 * @param id of the keyfop
 * @param pin of the keyfop
 */
const fetchData = async (id: string, pin: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cookieJar = request.jar();
        try {
            request.get({
                timeout: 4000,
                url: 'https://www.opc-asp.de/vs-aachen/',
                jar: cookieJar
            }, () => {
                try {
                    request.post({
                        timeout: 4000,
                        url: 'https://www.opc-asp.de/vs-aachen/?LogIn=true',
                        jar: cookieJar,
                        form: {
                            sessiontest: (<any>cookieJar)._jar.store.idx['www.opc-asp.de']['/'].PHPSESSID.toString().split(';')[0].split('=')[1],
                            f_kartennr: id,
                            f_pw: pin
                        }
                    }, () => {
                        try {
                            request.get({
                                timeout: 4000,
                                url: 'https://www.opc-asp.de/vs-aachen/menuplan.php?KID=' + id,
                                jar: cookieJar
                            }, (error, response, body) => {
                                if (response.statusCode !== 200) {
                                    reject('Invalid cafetoria credentials');
                                    return;
                                }
                                resolve(body);
                            });
                        } catch (e) {
                            reject(e);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Fetches cafetoria data for keyfop
 * @param id of keyfop
 * @param pin of keyfop
 */
export const fetchDataForUser = async (id: string, pin: string): Promise<Cafetoria> => {
    if (id !== '' && pin !== '') {
        return new Promise((resolve, reject) => {
            fetchData(id, pin).then((raw: any) => {
                const data = parse(raw);
                const menus = extractData(data, false);
                resolve(menus);
            }).catch(reject);
        });
    }
    return { error: 'Credentials must not be null', saldo: undefined, days: [] };
};

/**
 * Downloads the non-personalized cafetoria menu
 */
export const download = (checkIfNew = true): Promise<Cafetoria | undefined> => {
    return new Promise((resolve, reject) => {
        fetchData(config.cafetoriaId, config.cafetoriaPin).then(async (raw: string) => {
            console.log('Fetched menus');
            const data = parse(raw);
            console.log('Parsed menus');
            const _isNew = await isNew(data);
            if (_isNew || isDev || !checkIfNew) {
                const menus = extractData(data, true);
                console.log('Extracted menus');
                if (_isNew || isDev) await sendNotifications(menus, isDev);
                resolve(menus);
            }
            resolve(undefined);
        }).catch(reject);
    });
}

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    initDatabase().then(() => download().catch((reason) => console.log(reason)));
}
