import {Subject, Substitution, SubstitutionPlan, SubstitutionPlanGroup, Timetables, User} from "../utils/interfaces";
import {getCourseIDsFromID} from "../timetable/tt_butler";
import {getExams, getSelections} from "../tags/tags_db";
import {loadData} from "../utils/data";
import {isTeacher} from "../utils/auth";
import getLocalization from "../utils/localizations";
import {getTimetableGroup} from "../timetable/tt_db";

const filterSubstitutionPlan = async (substitutionPlan: SubstitutionPlan): Promise<SubstitutionPlan> => {
    const grades: string[] = getLocalization('grades');
    const groups = Object.keys(substitutionPlan.data);
    for (const group of groups) {
        const ttGroup = await getTimetableGroup(group);
        const isGrade = grades.includes(group);
        if (ttGroup) {
            const ttDay = ttGroup.data.days[new Date(substitutionPlan.date).getDay() - 1];
            substitutionPlan.data[group].forEach((substitution) => {
                try {
                    const ttUnit = ttDay.units[substitution.unit];

                    // If it is a teacher, all substitutions are correct
                    if (!isGrade) {
                        if (ttUnit.subjects.length != 1) {
                            console.log('Teacher with more than one subject in a unit:', group, substitution);
                        }
                        const subject = ttUnit.subjects[0];
                        substitution.id = subject.id;
                        substitution.courseID = subject.courseID;
                        autoFillSubstitution(substitution, subject);
                        return;
                    }

                    if (substitution.type != 2) {
                        // Filter with teacher
                        let subjects = ttUnit.subjects.filter((subject) => {
                            // A subject can have multiple participants (separated with '+'), so check for each participant
                            return subject.participantID
                                .split('+')
                                .map((participant) => participant === substitution.original.participantID)
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
                                    subject.participantID
                                        .split('+')
                                        .map((teacher) => teacher === substitution.original.participantID)
                                        .reduce((b1, b2) => b1 || b2);
                            });
                        }
                        if (subjects.length === 1) {
                            substitution.id = subjects[0].id;
                            substitution.courseID = subjects[0].courseID;
                            // Auto fill a substitution (For empty rooms or teachers)
                            autoFillSubstitution(substitution, subjects[0]);
                        } else {
                            console.error(`Cannot filter grade: ${group} unit: ${substitution.unit} day: ${new Date(substitutionPlan.date).getDay()}`);
                        }
                    }
                    if (substitution.original.course && !substitution.courseID) {
                        const course = substitution.original.course.split(' ');
                        if (course.length === 2) {
                            substitution.courseID = `${group}-${course[1]}-${course[0]}`;
                        } else {
                            console.error(`Cannot filter (exam) grade: ${group} unit: ${substitution.unit} day: ${new Date(substitutionPlan.date)}`);
                        }
                    }
                } catch (e) {
                    console.error(`Failed to filter group: ${group} unit: ${substitution.unit}`);
                }
            });
        }
    }

    return substitutionPlan;
};

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
};

/**
 * Returns all substitutions for a given user
 * @param user The user to filter for
 * @param substitutionPlan The loaded substitution plan to filter
 */
export const getSubstitutionsForUser = async (user: User, substitutionPlan: SubstitutionPlanGroup): Promise<Substitution[]> => {

    // Reduces the ids to string arrays
    const selections = await getSelections(user.username) || [];
    const selectedCourses = selections.map((course) => course.courseID);
    const _exams = await getExams(user.username) || [];
    const exams = _exams.map((exam) => exam.subject);
    const timetable = await loadData<Timetables>('timetable', {date: new Date().toISOString(), groups: {}});

    return substitutionPlan.data.filter((substitution) => {
        // A teacher always has all of the substitutions in his/her group
        if (isTeacher(user.userType)) {
            return true;
        }
        // If the server was not able to filter the substitution, select it and it will be marked as unknown
        if (substitution.courseID === undefined && substitution.id === undefined) {
            return true;
        }
        // If the course is selected, mark as user change
        if (substitution.courseID) {
            if (selectedCourses.includes(substitution.courseID || '-')) {
                if (substitution.type === 2) {
                    const index = exams.indexOf(substitution.original.subjectID || '-');
                    return index < 0 ? true : _exams[index].writing;
                }
                return true;
            }
        }

        // Retry with the id
        if (substitution.id) {
            const course = getCourseIDsFromID(timetable, substitution.id || '');
            if (selectedCourses.includes(course)) {
                return true;
            }
        }
        return false;
    });
};

export default filterSubstitutionPlan;