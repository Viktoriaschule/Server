const getKey = (subject: any) => {
    return `${subject.subject}-${subject.participant}`;
}

const getUnitPlanTag = (key: string, device: any, unitplan: any) => {
    const selected = parseInt(device.tags[key]);
    if (isNaN(selected)) return device.tags[key];

    // Parse int in AB Array (Convert old to new format)...
    const fragments = key.split('-');

    if (fragments.length === 3) {
        const block = fragments[2];
        for (let i = 0; i < unitplan.length; i++){
            const day = unitplan[i];
            for (let j = 0; j < Object.keys(day.lessons).length; j++){
                const lesson = day.lessons[Object.keys(day.lessons)[j]];
                if (lesson[0].block === block) {
                    return [getKey(lesson[selected])];
                }
            }
        }
    } else {
        const day = parseInt(fragments[2]);
        const subjects = unitplan[day].lessons[fragments[3]];
        return [getKey(subjects[selected])];
    }
}

const getSelectedSubject = (subjects: any, unit: number, selected: string, week: string) => {
    if (unit === 5) return subjects[0];
    if (selected === undefined) return undefined;
    week = week.toUpperCase();
    let index = selected.length === 1 ? 0 : week === 'A' ? 0 : 1;
    if (selected.length > 1 && subjects.filter((s: any) => s.week !== 'AB').length === 0) {
        if (selected[0].endsWith('-')) index = 1;
        else if (selected[1].endsWith('-')) index = 0;
    }
    const subject = subjects.filter((subject: any) => subject.week.includes(week) && getKey(subject) === selected[index]);
    if (subject.length === 0) return undefined;
    else return subject[0];
}

const isMyExam = (unitplan: any, exam: any) => {
    //TODO: Write Exam filter...
    return 0;
}

const changesForUserID = (_device: any, unitplan: any, weekday: number): any[] => {
    const examTags: any = {};
    Object.keys(_device.tags).filter(key => key.startsWith('exams')).forEach(key => {
        examTags[key.split('-')[2]] = _device.tags[key];
    });
    const unitplanTags: any = {};
    Object.keys(_device.tags).filter(key => key.startsWith('unitPlan')).forEach(key => {
        unitplanTags[key.split(_device.tags.grade + '-')[1]] = getUnitPlanTag(key, _device, unitplan.data);
    });
    console.log(unitplanTags);
    const device = {
        id: _device.id,
        grade: _device.tags.grade,
        isDev: _device.tags.dev,
        exams: examTags,
        unitplan: unitplanTags
    };
    const day = unitplan.data[weekday];
    const changes: any[] = [];
    Object.keys(day.lessons).forEach((unit: string) => {
        let subjects = day.lessons[unit];
        subjects.forEach((subject: any) => {
            let identifier = (subject.block !== '' ? subject.block : weekday + '-' + unit);
            if (subject.changes !== undefined) {
                subject.changes.forEach((change: any) => {
                    let isMy = -1;
                    if (Object.keys(device.unitplan).indexOf(identifier) >= 0) {
                        if (subject === getSelectedSubject(subjects, parseInt(unit), device.unitplan[identifier], day.replacementplan.for.weektype)) {
                            if (change.exam && !change.rewriteExam && !device.exams[change.change.subject]) {
                                isMy = isMyExam(unitplan, change);
                            }
                            else if (!change.sure) isMy = -1;
                            else isMy = 1;
                        }
                        else isMy = 0;
                    }

                    changes.push({
                        unit: change.unit,
                        subject: change.subject,
                        course: change.course,
                        room: change.room,
                        teacher: change.participant,
                        change: change.change,
                        isMy: isMy,
                        identifier: identifier,
                        nSubject: {
                            block: subject.block,
                            participant: subject.participant,
                            subject: subject.subject,
                            room: subject.room,
                            course: subject.course
                        }
                    });
                });
            }
        });
    });
    return changes;
};

export default changesForUserID;