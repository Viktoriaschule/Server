import got from 'got';
import config from './config';

/**
 * Fetches data from an url
 * @param {string} url url to any website
 * @param {boolean} auth use the authentication from the config file
 * @returns {string} the raw html code as string 
 */
export const fetchData = async (url: string, auth: boolean): Promise<string> => {
    if (config && auth) {
        return (await got(url, {username: config.username, password: config.password})).body;
    }
    return (await got(url)).body;
};