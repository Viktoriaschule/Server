import fs from 'fs';
import path from 'path';
import config from '../config';
import got from 'got';
import {parse} from 'node-html-parser';
import {saveNewUnitplan} from '../history/history';
import {getInjectedUnitplan} from "../replacementplan/connectWithUnitplan";

const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const isNew = (data: any) => {
    let file = path.resolve(process.cwd(), 'out', 'unitplan', 'date.txt');
    let old = '';
    if (fs.existsSync(file)) {
        old = fs.readFileSync(file, 'utf-8').toString();
    }
    let n = data.querySelectorAll('div')[0].childNodes[0].rawText;
    fs.writeFileSync(file, n);
    return old !== n;
};

const fetchData = async () => {
    return (await got('https://www.viktoriaschule-aachen.de/sundvplan/sps/left.html', {auth: config.username + ':' + config.password})).body;
};

const parseData = async (raw: string) => {
    return await parse(raw);
};

const extractData = async (data: any) => {
    return await grades.map(grade => {
        let d: any = weekdays.map((weekday: string) => {
            return {
                weekday: weekday,
                replacementplan: {
                    for: {
                        date: '',
                        weekday: ''
                    },
                    updated: {
                        date: '',
                        time: ''
                    }
                },
                lessons: {}
            };
        });
        data.querySelectorAll('table')[grades.indexOf(grade)].childNodes.slice(1).forEach((row: any, unit: number) => {
            row.childNodes.slice(1).forEach((field: any, day: number) => {
                const a: any = field.childNodes.map((a: any) => a.childNodes[0].rawText.trim().replace(/ +(?= )/g, '')).filter((a: string, i: number) => a != '' || i == 5);
                if (a.length > 0) {
                    if (d[day].lessons[unit] === undefined) {
                        d[day].lessons[unit] = [];
                    }
                    if (a.length === 1) {
                        d[day].lessons[unit].push({
                            block: '',
                            participant: a[0].split(' ')[0],
                            subject: a[0].split(' ')[1].toUpperCase().replace(/[0-9]/g, ''),
                            room: a[0].split(' ')[2].toUpperCase(),
                            course: '',
                            changes: []
                        });
                    } else {
                        for (let i = 1; i < a.length; i++) {
                            d[day].lessons[unit].push({
                                block: a[0].split(' ')[1],
                                participant: a[i].split(' ')[1],
                                subject: a[i].split(' ')[0].toUpperCase().replace(/[0-9]/g, ''),
                                room: a[i].split(' ')[2].toUpperCase(),
                                course: '',
                                changes: []
                            });
                        }
                    }
                }
            });
        });
        d = d.map((a: any) => {
            if (Object.keys(a.lessons).length >= 6) {
                a.lessons['5'] = [{
                    block: '',
                    participant: '',
                    subject: 'Mittagspause',
                    room: '',
                    course: '',
                    changes: []
                }];
            }
            Object.keys(a.lessons).forEach((lesson: any) => {
                if (a.lessons[lesson].length > 1 || a.lessons[lesson][0].block !== '') {
                    a.lessons[lesson].push({
                        block: a.lessons[lesson][0].block,
                        participant: '',
                        subject: 'Freistunde',
                        room: '',
                        course: '',
                        changes: []
                    });
                }
            });
            return a;
        });
        d = d.map((a: any) => {
            if (grade === 'EF' || grade === 'Q1' || grade === 'Q2') {
                Object.keys(a.lessons).forEach((unit: string) => {
                    let b = a.lessons[unit];
                    const containsMultiple = b.filter((subject: any) => {
                        return /^(a|b|c|d)$/gmi.test(subject.room);
                    }).length > 0;
                    b = b.map((subject: any) => {
                        if (config.isFirstQ) {
                            if (/^(a|b|c|d)$/gmi.test(subject.room)) {
                                subject.room = '';
                                subject.participant = '';
                            }
                        } else {
                            if (containsMultiple) {
                                if (!/^(a|b|c|d)$/gmi.test(subject.room)) {
                                    subject.room = '';
                                    subject.participant = '';
                                }
                            }
                        }
                        return subject;
                    });
                    a.lessons[unit] = b;
                });
            }
            return a;
        });
        return {
            participant: grade,
            date: data.querySelector('div').childNodes[0].rawText.split(' den ')[1].trim(),
            data: d
        };
    });
};

(async () => {
    fetchData().then(raw => {
        console.log('Fetched unit plan');
        parseData(raw).then(data => {
            console.log('Parsed unit plan');
            if (isNew(data)) {
                saveNewUnitplan(raw, []);
                extractData(data).then(unitplan => {
                    console.log('Extracted unit plan');
                    unitplan.forEach(data => {
                        fs.writeFileSync(path.resolve(process.cwd(), 'out', 'unitplan', data.participant + '.json'), JSON.stringify(data, null, 2));
                        try {
                            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'unitplan', data.participant + '.json'), JSON.stringify(getInjectedUnitplan(data.participant), null, 2))
                        } catch (e) {

                        }
                    });
                    saveNewUnitplan('', unitplan);
                    console.log('Saved unit plan');

                });
            }
        });
    });
})();
