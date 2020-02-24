import entities from 'entities';
import {Cafetoria, CafetoriaDay, Menu} from '../utils/interfaces';

/**
 * Extracts the cafetoria data
 * @param data raw html [data]
 * @param saldoIsNull sets saldo to null (for non-personalized data)
 */
const extractData = (data: any, saldoIsNull = false): Cafetoria => {
    let saldo: any = parseFloat(data.querySelector('#saldoOld').childNodes[0].rawText.replace(',', '.'));
    if (saldoIsNull) {
        saldo = null;
    }
    const rawDates = data.querySelectorAll('.MPDatum');
    const dates: CafetoriaDay[] = rawDates.map((a: any) => a.childNodes).map((b: any, day: number): CafetoriaDay => {
        const rawDate = b[0].childNodes[0].rawText.split('.');
        return {
            day: day, // TODO: remove unused parameter
            date: new Date(`${rawDate[2]} ${rawDate[1]} ${rawDate[0]}`).toISOString(),
            menus: []
        };
    });
    const names = data.querySelectorAll('.angebot_text');
    const prices = data.querySelectorAll('.angebot_preis');
    return {
        saldo: saldo,
        error: undefined,
        days: dates.map((date: CafetoriaDay, day: number): CafetoriaDay => {
            let menus: Menu[] = [];
            let extraTime: string = '';
            for (let i = 4; i > 0; i--) {
                let text = names[day * 4 + i - 1].childNodes.length >= 1 ? names[day * 4 + i - 1].childNodes.map((a: any) => a.rawText).join(' ').replace('  ', ' ') : '';
                text = entities.decodeHTML(text);
                let time: string = '';
                if (text.includes('bis') && text.includes(' Uhr ') && text.includes('abholen')) {
                    extraTime = text.replace('Menü bitte', '').replace('abholen.', '').replace('.', ':').trim();
                    continue;
                } else if (text.includes(' Uhr ')) {
                    time = text.split(' Uhr ')[0];
                    text = text.split(' Uhr ')[1];
                    time = time.replace(/\./g, ':');
                    let timeS = time.split(' - ')[0] || '';
                    let timeE = time.split(' - ')[1] || '';
                    if (timeS !== '') {
                        if (!timeS.includes(':')) {
                            timeS += ':00';
                        }
                    }
                    if (timeE !== '') {
                        if (!timeE.includes(':')) {
                            timeE += ':00';
                        }
                    }
                    time = timeS + (timeE !== '' ? ' - ' + timeE : '') + ' Uhr';
                }
                if (time == '' && extraTime != '') {
                    time = extraTime;
                }
                menus.push({
                    name: text,
                    time: time,
                    price: prices[dates.indexOf(date) * 4 + i - 1].childNodes.length == 1 ? parseFloat(prices[dates.indexOf(date) * 4 + i - 1].childNodes[0].rawText.replace('&euro;', '').trim().replace(',', '.')) : 0
                });
            }
            date.menus = menus.reverse().filter((a: any) => a.name !== '');
            return date;
        })
    };
};

export default extractData;
