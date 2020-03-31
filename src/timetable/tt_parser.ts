import {Day, Timetable, Timetables} from '../utils/interfaces';
import {getRoomID} from '../utils/rooms';
import getLocalization from "../utils/localizations";

export const extractData = (data: string[]): Timetables => {
        const date: Date = new Date();
        const timetables: Timetables = {
            date: date.toISOString(),
            groups: {}
        };

        const lines = data
            .filter((line: string) => line.length > 0 && line.startsWith("U"));

        for (let i = 0; i < lines.length; i++) {
            let definingLines: any[] = [lines[i]];
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].startsWith("U1")) {
                    i += j - i - 1;
                    break;
                }
                definingLines.push(lines[j]);
            }
            definingLines = definingLines.map((line: string) => line.split(";")).sort((a, b) => parseInt(a[0].split("")[1]) - parseInt(b[0].split("")[1]));
            if (definingLines.length > 1) {
                let subject = definingLines[0][6].replace(/ {2,}/g, ' ');
                let grades: string[] = [definingLines[0][2].toLowerCase()];
                // Skip unused information
                if (subject === 'BER' || subject === 'KOOR') {
                    continue;
                }
                if (definingLines.length > 2 && definingLines[2][0] === 'U6') {
                    grades = definingLines[2].slice(3, -1).map((grade: string) => grade.toLowerCase());
                }
                const course: string = subject.split(" ").length > 1 ? subject.split(" ")[1] : null;
                subject = subject.split(" ")[0];
                const block: string = definingLines[0][1];
                const numberOfLessons: number = parseInt(definingLines[1][2]);
                for (let l = 0; l < grades.length; l++) {
                    const grade = grades[l];

                    // Skip all grades
                    if (grade == 'ag' || grade.length === 0) {
                        continue;
                    }

                    // Initialize timetable for the grade
                    if (!timetables.groups[grade]) {
                        timetables.groups[grade] = getEmptyGroup(grade, timetables.date);
                    }
                    const dataLine = definingLines[1].slice(3);
                    for (let k = 0; k < numberOfLessons; k++) {
                        const dataElement = dataLine.slice(k * 6, (k + 1) * 6);
                        const day: number = parseInt(dataElement[0]) - 1;
                        const unitCount: number = parseInt(dataElement[2]);
                        let startUnit: number = parseInt(dataElement[1]);
                        const room: string = dataElement[3];
                        const teacher: string = dataElement[4];

                        const _grade = timetables.groups[grade];
                        if (_grade) {
                            for (let j = 0; j < unitCount; j++) {
                                let unit = startUnit + j;
                                if (unit <= 5) {
                                    unit--;
                                }
                                if (!_grade.data.days[day].units[unit]) {
                                    _grade.data.days[day].units[unit] = {
                                        unit: unit,
                                        subjects: [{
                                            id: `${grade}-2-${day}-${unit}-0`,
                                            unit: unit,
                                            block: block,
                                            courseID: `${grade}-${block}-`,
                                            participantID: '',
                                            subjectID: 'Freistunde',
                                            roomID: '',
                                            week: 2,
                                        }]
                                    }
                                }
                                const subjectID = subject.replace('Schw', 'Sp').toLowerCase();
                                const courseID = `${grade}-${course != null ? course : `${block}+${teacher}`}-${subjectID}`.toLowerCase();
                                const teacherID = teacher.toLowerCase();
                                const _unit = _grade.data.days[day].units[unit];
                                const subjectToUpdate = _unit.subjects.filter((subject) => {
                                    return subject.courseID === courseID;
                                })[0];

                                if (subjectToUpdate) {
                                    if (subjectToUpdate.participantID !== teacherID) {
                                        subjectToUpdate.participantID += `+${teacherID}`;
                                    }
                                } else {
                                    _unit.subjects.push({
                                        unit: unit,
                                        id: `${grade}-2-${day}-${unit}-${_unit.subjects.length}`,
                                        courseID: courseID,
                                        subjectID: subjectID.replace(/[0-9]/g, ''),
                                        block: block,
                                        participantID: teacherID,
                                        roomID: getRoomID(room.toLowerCase()),
                                        week: 2,
                                    });
                                }

                                // Add the subject to the teacher
                                if (!timetables.groups[teacherID]) {
                                    timetables.groups[teacherID] = getEmptyGroup(teacherID, timetables.date);
                                }
                                const ttDay = timetables.groups[teacherID].data.days[day];
                                if (!ttDay.units[unit]) {
                                    ttDay.units[unit] = {
                                        unit: unit,
                                        subjects: [],
                                    }
                                }

                                const _subject = {
                                    unit: unit,
                                    id: `${grade}-2-${day}-${unit}-${_unit.subjects.length}`,
                                    courseID: courseID,
                                    subjectID: subjectID.replace(/[0-9]/g, ''),
                                    block: block,
                                    participantID: grade,
                                    roomID: getRoomID(room.toLowerCase()),
                                    week: 2,
                                };

                                // A teacher can only have one subject at the same time
                                const parallelSubject = ttDay.units[unit].subjects[0];
                                const isSameCourse = parallelSubject &&
                                    parallelSubject.subjectID === _subject.subjectID &&
                                    parallelSubject.roomID === _subject.roomID;

                                if (parallelSubject && !isSameCourse) {
                                    console.log(grade, parallelSubject);
                                }

                                // If the course is a combination of two grades, combine them
                                if (isSameCourse) {
                                    parallelSubject.participantID += `+${_subject.participantID}`;
                                } else {
                                    // Duplicate the subject for the teacher
                                    ttDay.units[unit].subjects.push(_subject);
                                }
                            }
                        }
                    }
                }
            }
        }

        Object.keys(timetables.groups).forEach((group: string) => {
            let blockIndex = 0;
            timetables.groups[group].data.days.forEach((day: Day) => {
                // Add lunch breaks
                if (day.units.length > 5) {
                    day.units[5] = {
                        unit: 5,
                        subjects: [
                            {
                                unit: 5,
                                id: `${group}-2-${day.day}-5-0`,
                                participantID: '',
                                subjectID: 'Mittagspause',
                                roomID: '',
                                courseID: `${group}--`,
                                block: '',
                                week: 2,
                            }
                        ]
                    };
                }

                for (let i = 0; i < day.units.length; i++) {
                    // Add missing lessons (This is only to prevent bugs)
                    const unit = day.units[i];
                    if (!unit) {
                        if (getLocalization('grades').includes(group)) {
                            console.log('Error: Lesson is missing: ', group, day.day, i);
                        }
                        day.units[i] = {
                            unit: i,
                            subjects: [{
                                id: `${group}-2-${day.day}-${i}-0`,
                                unit: i,
                                block: '',
                                courseID: `${group}--`,
                                participantID: '',
                                subjectID: 'Freistunde',
                                roomID: '',
                                week: 2,
                            }]
                        };
                    }

                    if (!getLocalization('grades').includes(group)) {
                        setTeacherBlocks(timetables.groups[group].data.days, group);
                    }
                        // Generate all block ids
                    // Set only the block for all parallels of this subject if the subject do not has already a block
                    else if (!unit.subjects[0].block.includes('-')) {
                        setBlockOfParallels(timetables.groups[group].data.days, group, unit.subjects[0].courseID, blockIndex);
                    }
                    blockIndex++;
                }
            });
        });

        return timetables;
    }
;

const getEmptyGroup = (group: string, date: string) => {
    const _group: Timetable = {
        group: group,
        date: date,
        data: {
            group: group,
            days: []
        }
    };
    for (let i = 0; i < 5; i++) {
        _group.data.days.push({
            day: i,
            units: []
        });
    }
    return _group;
};

const setTeacherBlocks = (ttDays: Day[], group: string): void => {
    let index = 0;
    ttDays.forEach((day) => {
        day.units.forEach((unit) => {
            unit.subjects.forEach((subject) => {
                subject.block = `${group}-${index}`;
                index++;
            });
        });
    });
};

/** Set the blocks of the subjects in the given unit and of all the parallel subjects */
const setBlockOfParallels = (ttDays: Day[], group: string, courseID: string, index: number): void => {
    const blockID: string = `${group}-${index}`;
    ttDays.forEach((day) => {
        day.units.forEach((unit) => {
            // Only set the blocks if the searched course id is in this unit
            if (unit.subjects.map((s) => s.courseID).includes(courseID)) {
                unit.subjects.forEach((subject) => {
                    // Only if the block is not set already
                    if (!subject.block.includes('-')) {
                        subject.block = blockID;
                        setBlockOfParallels(ttDays, group, subject.courseID, index);
                        const blockPart = subject.courseID.split('-')[1].split('+');
                        if (/^\d/.test(blockPart[0])) {
                            blockPart[0] = blockID.split('-')[1];
                            const fragments = subject.courseID.split('-');
                            fragments[1] = blockPart.join('+');
                            subject.courseID = fragments.join('-');
                        }
                    } else if (subject.block !== blockID && subject.unit !== 5) {
                        console.error('Failed to create block system!', subject);
                    }
                });
            }
        });
    });
};