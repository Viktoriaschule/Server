import got from 'got';
import config from './config';
import {parse} from 'node-html-parser';

const fetchData = async (menuid: number): Promise<string> => {
    let path = `https://viktoriaschule-aachen.de/index.php?menuid=${menuid}`;
    return (await got(path, {username: config.username, password: config.password})).body;
};

export const getUrl = async (text: string, menuid: number): Promise<string> => {
    const data: any = parse(await fetchData(menuid));
    const url: any = data.querySelectorAll('.downloadlink').filter((i: any) => i.childNodes[0].rawText.includes(text))[0];
    return 'https://viktoriaschule-aachen.de' + url.rawAttrs.split('href="')[1].split('"')[0].replace('&amp;', '&');
};