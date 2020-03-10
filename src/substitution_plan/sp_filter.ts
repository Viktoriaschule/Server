import { SubstitutionPlan, Substitution, Timetable, Subject, User, Timetables } from "../utils/interfaces";
import { getTimetable, getCourseIDsFromID } from "../timetable/tt_butler";
import { getSelections, getExams } from "../tags/tags_db";
import { loadData } from "../utils/data";

const filterSubstitutionPlan = async (substitutionPlan: SubstitutionPlan): Promise<SubstitutionPlan> => {
    const timetable = await getTimetable();
    if (timetable) {
        Object.keys(substitutionPlan.data).forEach((grade: string) => {
            const ttGrade = timetable.grades[grade];
            if (ttGrade) {
                const ttDay = ttGrade.data.days[new Date(substitutionPlan.date).getDay() - 1];
                substitutionPlan.data[grade].forEach((substitution) => {
                    try {
                        if (substitution.type != 2) {
                            const ttUnit = ttDay.units[substitution.unit];
                            // Filter with teacher
                            let subjects = ttUnit.subjects.filter((subject) => {
                                // A subject can have multiple teachers (separated with '+'), so check for each teacher
                                return subject.teacherID
                                    .split('+')
                                    .map((teacher) => teacher === substitution.original.teacherID)
                                    .reduce((b1, b2) => b1 || b2);
                            });
                            // Filter with subject
                            if (subjects.length !== 1) {
                                subjects = ttUnit.subjects.filter((subject) => {
                                    return subject.subjectID === substitution.original.subjectID;
                                });
                            }
                            // Filter with both
                            if (subjects.length !== 1) {
                                subjects = ttUnit.subjects.filter((subject) => {
                                    // A subject can have multiple teachers (separated with '+'), so check for each teacher
                                    return subject.subjectID === substitution.original.subjectID &&
                                        subject.teacherID
                                            .split('+')
                                            .map((teacher) => teacher === substitution.original.teacherID)
                                            .reduce((b1, b2) => b1 || b2);
                                });
                            }
                            if (subjects.length === 1) {
                                substitution.id = subjects[0].id;
                                substitution.courseID = subjects[0].courseID;
                                // Auto fill a substitution (For empty rooms or teachers)
                                autoFillSubstitution(substitution, subjects[0]);
                            } else {
                                console.error(`Cannot filter grade: ${grade} unit: ${substitution.unit}`);
                            }
                        }
                        if (substitution.original.course && !substitution.courseID) {
                            const course = substitution.original.course.split(' ');
                            if (course.length === 2) {
                                substitution.courseID = `${grade}-${course[1]}-${course[0]}`;
                            } else {
                                console.error(`Cannot filter (exam) grade: ${grade} unit: ${substitution.unit}`);
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to filter grade: ${grade} unit: ${substitution.unit}`);
                    }
                });
            }
        });
    }
    return substitutionPlan;
}

/**
 * Fills all missing original info to an substitution
 * @param substitution The [substitution] to fill
 * @param subject The [subject] with the [subjectID] of the [substitution]
 */
const autoFillSubstitution = (substitution: Substitution, subject: Subject): void => {
    if (substitution.original.subjectID.length === 0) {
        substitution.original.subjectID = subject.subjectID;
    }
    if (substitution.original.roomID.length === 0) {
        substitution.original.roomID = subject.roomID;
    }
}

/**
 * Returns all substitutions for a given user
 * @param user The user to filter for
 * @param day to search for
 */
export const getSubstitutionsForUser = async (user: User, substitutionPlan: SubstitutionPlan): Promise<Substitution[]> => {

    // Reduces the ids to string arrays
    const selections = await getSelections(user.username) || [];
    const selectedCourses = selections.map((course) => course.courseID);
    const exams = (await getExams(user.username) || []).map((exam) => exam.subject);
    const timetable = await loadData<Timetables>('timetable', { date: new Date().toISOString(), grades: {} });

    return substitutionPlan.data[user.grade].filter((substitution) => {
        // If the server was not able to filter the substitution, select it and it will be marked as unknown
        if (substitution.courseID === undefined && substitution.id === undefined) {
            return true;
        }
        // If the course is selected, mark as user change
        if (substitution.courseID) {
            if (selectedCourses.includes(substitution.courseID || '-')) {
                if (substitution.type === 2) {
                    return exams.includes(substitution.original.subjectID || '-');
                }
                return true;
            }
        }

        // Retry with the id
        if (substitution.id) {
            const course = getCourseIDsFromID(timetable, user.grade, substitution.id || '');
            if (selectedCourses.includes(course)) {
                if (substitution.type === 2) {
                    return exams.includes(substitution.original.subjectID || '-');
                }
                return true;
            }
        }
        return false;
    });
}

export default filterSubstitutionPlan;