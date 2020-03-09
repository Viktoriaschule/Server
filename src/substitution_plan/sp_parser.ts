import { SubstitutionPlan, Substitution, SubstitutionPlanGrades } from '../utils/interfaces';
import { getRoomID } from '../utils/rooms';
import getLocalization from '../utils/localizations';

/**
 * Parses the week (A/B), date and update in ISO-8601 string
 * @param raw parsed html object
 */
export const parseDates = (raw: any): { week: number, date: string, update: string } => {
    // Get dates
    let week = -1;
    let date = new Date(2000, 1, 1).toISOString();
    try {
        const rawDateInfo = raw.querySelectorAll('div')[0].childNodes[0].rawText
        week = rawDateInfo.slice(-1) === 'A' ? 0 : 1;
        const dateStr = rawDateInfo.split(' ')[0].split('.');
        const dateObject = new Date(`${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`);
        dateObject.setHours(5);
        date = dateObject.toISOString();
    } catch (e) {
        console.error('Cannot get the \'date\' of the substitution plan', e.toString());
    }
    let update = new Date().toISOString();
    try {
        const rawDate = raw.querySelectorAll('html')[0].childNodes[2].rawText.trim().split(' ')[1];
        const dateStr = rawDate.split(' ')[0].split('.');
        const updateTime = raw.querySelectorAll('html')[0].childNodes[2].rawText.trim().split(' ')[2];
        const updateDate = new Date(`${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`);
        updateDate.setHours(parseInt(updateTime.split(':')[0]));
        updateDate.setMinutes(parseInt(updateTime.split(':')[1]));
        update = updateDate.toISOString();
    } catch (e) {
        console.error('Cannot get the \'update\' date of the substitution plan', e.toString());
    }

    return {
        week: week,
        date: date,
        update
    };
};

/**
 * Parses the raw html substitution plan into our json structure
 * @param raw parsed html data
 * @param isDev development option for log level
 */
const parseSubstitutionPlan = async (raw: any, isDev: boolean): Promise<SubstitutionPlan> => {

    const parsedDates = parseDates(raw);

    // Create the data and unparsed objects
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'ef', 'q1', 'q2']
    const unparsed: SubstitutionPlanGrades = {};
    const data: SubstitutionPlanGrades = {};

    unparsed.other = [];
    grades.forEach((grade: string) => {
        unparsed[grade] = [];
        data[grade] = [];
    });

    // Parse changes
    try {
        raw.querySelectorAll('tr').forEach((row: any, i: number) => {
            // Check if it's a data line of the current grade
            if ((row.classNames.includes('even') || row.classNames.includes('odd'))) {
                try {
                    // Get all grades of this substitution
                    let rawGrades = row.childNodes[0].rawText.replace('→', ',').trim().toLowerCase().split(', ');
                    // Remove duplicates
                    rawGrades = Array.from(new Set(rawGrades));
                    // Parse the line for each grade
                    rawGrades.forEach((grade: string) => {
                        grade = grade.trim();
                        if (!grades.includes(grade)) return;
                        try {
                            const rawUnit = row.childNodes[1].childNodes[0].rawText.trim();
                            rawUnit.split('-').forEach((cUnit: any) => {
                                let unit = parseInt(cUnit.trim()) - 1;
                                if (unit > 4) unit++;

                                // Get the type of the substitution
                                const typeText = row.childNodes[3].childNodes[0].rawText.trim();
                                let type = typeText === 'Entfall' ? 1 : typeText === 'Klausur' ? 2 : 0;

                                // Get the info text
                                let info = removeUnusedCharacters(row.childNodes[6].rawText);
                                let description = '';
                                let normalSubject = '';
                                let normalCourse;
                                let normalRoom = '';
                                let normalTeacher = '';
                                let newSubject = '';
                                //let newCourse = '';
                                let newRoom = '';
                                let newTeacher = '';

                                let teacherCell = row.childNodes[4];
                                if (teacherCell.childNodes[0].tagName === 'span') teacherCell = teacherCell.childNodes[0];
                                // No changed teacher
                                if (teacherCell.childNodes.length === 1) {
                                    normalTeacher = removeUnusedCharacters(teacherCell.childNodes[0].rawText);
                                    if (teacherCell.querySelectorAll('s').length === 1) {
                                        newTeacher = '';
                                    }
                                    else {
                                        newTeacher = normalTeacher;
                                    }
                                }
                                // Teacher changed
                                else if (teacherCell.childNodes.length === 2) {
                                    normalTeacher = removeUnusedCharacters(teacherCell.childNodes[0].rawText);
                                    newTeacher = removeUnusedCharacters(teacherCell.childNodes[1].rawText);
                                }

                                let subjectCell = row.childNodes[2];
                                if (subjectCell.childNodes[0].tagName === 'span') subjectCell = subjectCell.childNodes[0];
                                // No changed subject
                                if (subjectCell.childNodes.length === 1) {
                                    if (subjectCell.querySelectorAll('s').length === 1) {
                                        normalSubject = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[0];
                                        normalCourse = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[1];
                                        newSubject = '';
                                        // newCourse = '';
                                        if (typeText === 'Trotz Absenz') {
                                            type = 1;
                                        }
                                    }
                                    else {
                                        normalSubject = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[0];
                                        normalCourse = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[1];
                                        // newCourse = normalCourse;
                                        newSubject = normalSubject;
                                    }
                                }
                                // Subject changed
                                else if (subjectCell.childNodes.length === 2) {
                                    normalSubject = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[0];
                                    normalCourse = removeUnusedCharacters(subjectCell.childNodes[0].rawText).split(' ')[1];
                                    newSubject = removeUnusedCharacters(subjectCell.childNodes[1].rawText.replace('→', '')).split(' ')[0];
                                    // newCourse = removeUnusedCharacters(subjectCell.childNodes[1].rawText.replace('→', '')).split(' ')[1];
                                }

                                let roomCell = row.childNodes[5];
                                if (roomCell.childNodes[0].tagName === 'span') {
                                    roomCell = roomCell.childNodes[0];
                                }
                                // No changed room
                                if (roomCell.childNodes.length === 1) {
                                    if (roomCell.querySelectorAll('s').length === 1) {
                                        normalRoom = removeUnusedCharacters(roomCell.childNodes[0].rawText);
                                        newRoom = '';
                                    }
                                    else {
                                        normalRoom = removeUnusedCharacters(roomCell.childNodes[0].rawText);
                                        newRoom = normalRoom;

                                        if (normalRoom === '---') {
                                            normalRoom = '';
                                            newRoom = '';
                                        }
                                    }
                                }
                                // room changed
                                else if (roomCell.childNodes.length === 2) {
                                    normalRoom = removeUnusedCharacters(roomCell.childNodes[0].rawText);
                                    newRoom = removeUnusedCharacters(roomCell.childNodes[1].rawText.replace('→', ''));
                                }

                                // Handle Reststunde
                                if (info.toLowerCase().includes('rest')) {
                                    info = '';
                                    description = getLocalization('remainingHour');
                                    type = 0;
                                } else if (type == 0) {
                                    if (normalSubject == newSubject) {
                                        if (normalTeacher != newTeacher) {
                                            description = getLocalization('substitution');
                                        } else if (normalRoom != newRoom) {
                                            description = getLocalization('roomChange');
                                        }
                                    }
                                }

                                const substitution: Substitution = {
                                    unit: unit,
                                    type: type,
                                    info: info,
                                    id: undefined,
                                    courseID: undefined,
                                    description: description,
                                    original: {
                                        subjectID: normalSubject.toLowerCase().replace(/[0-9]/g, ''),
                                        teacherID: normalTeacher.toLowerCase(),
                                        roomID: getRoomID(normalRoom.toLowerCase().replace(' ', '')),
                                        course: normalCourse ? normalCourse.toLowerCase() : undefined
                                    },
                                    changed: {
                                        subjectID: newSubject.toLowerCase().replace(/[0-9]/g, ''),
                                        teacherID: newTeacher.toLowerCase(),
                                        roomID: getRoomID(newRoom.toLowerCase().replace(' ', '')),

                                    }
                                };

                                data[grade].push(substitution);
                            });

                        } catch (e) {
                            console.error('Cannot parse substitution:', i, parsedDates.date, row, e);

                            // Push raw line to the grade object in unparsed
                            const rawLine = row.childNodes.map((element: any) => element.rawText.replace('&nbsp;', '')).join(' ');
                            unparsed[grade].push(rawLine);
                        }
                    });
                } catch (e) {
                    console.error('Cannot parse grade:', i, row, e);

                    // Push raw line to the other object in unparsed
                    const rawLine = row.childNodes.map((element: any) => element.rawText.replace('&nbsp;', '')).join(' ');
                    unparsed.other.push(rawLine);
                }
            }
        });
    } catch (e) {
        console.error('Cannot find \'tr\' selectors', e.toString());
    }

    // Create the substitutionPlan
    const substitutionPlan: SubstitutionPlan = {
        date: parsedDates.date,
        updated: parsedDates.update,
        week: parsedDates.week,
        unparsed: unparsed,
        data: data,
    };

    return substitutionPlan;
};

/**
 * Removes multiple spaces, arrows and other characters that should be ignored
 * @param text raw text
 * @returns the optimized string
 */
const removeUnusedCharacters = (text: string): string => {
    return text.replace(/\s\s+/g, ' ').replace('→', '').replace('&nbsp;', '').replace('---', '');
}

export default parseSubstitutionPlan;