export interface Timetables {
    date: string;
    /** Grades in lowercase */
    groups: TimetableGroups
}

export interface TimetableGroups {
    /** Grades in lowercase */
    [group: string]: Timetable
}

// Timetable
export interface Timetable {
    /** group in lowercase */
    group: string;
    /** ISO 8601 */
    date: string;
    data: {
        group: string;
        days: Day[]
    }
}

export interface Day {
    /** Weekday; Monday = 0 */
    day: number;
    units: Unit[];
}

export interface Unit {
    unit: number; // First unit = 0
    subjects: Subject[];
}

//TODO: Delete week in id
export interface Subject {
    /** starts with 0; 6. unit is the lunch break */
    unit: number;
    /** Format: GRADE-WEEK-DAY-UNIT-SUBJECT_INDEX (lowercase) */
    id: string;
    /** Format: GRADE-COURSE(BLOCK+TEACHER)-SUBJECT (lowercase) */
    courseID: string;
    /** subject shorthand for example "e"; "s" */
    subjectID: string;
    /** Participant id
     *
     * For students it is the teacher shorthand (lowercase). Multiple teachers for one subject are separated with '+'.
     *
     * Example: 'him+kan' or only 'him'
     *
     * And for teachers the is is the grade (lowercase). Multiple grades are separated with a '+'
     */
    participantID: string;
    /** lowercase */
    roomID: string;
    /** 0 => A; 1 => B; 2 => AB */
    week: number;
    block: string;
}

export interface SubstitutionPlanInfo {
    /** ISO 8601 */
    date: string;
    /** ISO 8601 */
    updated: string;
    /** 0 => A; 1 => B */
    week: number;
}

export interface SubstitutionPlan extends SubstitutionPlanInfo {
    unparsed: SubstitutionPlanGroups;
    data: SubstitutionPlanGroups
}

/** The substitution plan for a specific group */
export interface SubstitutionPlanGroup extends SubstitutionPlanInfo {
    unparsed: Substitution[];
    data: Substitution[];
}

export interface SubstitutionPlanGroups {
    /** In lowercase (the grade for students, the teacher id for teachers) */
    [group: string]: Substitution[]
}

export interface Substitution {
    /** starts with 0; 6. unit is the lunch break */
    unit: number;
    /** 0 => substitution; 1 => free lesson; 2 => exam */
    type: number;
    info: string;
    id: string | undefined;
    /** Format: GRADE - COURSE(BLOCK|TEACHER) - SUBJECT(lowercase) */
    courseID: string | undefined;
    original: SubstitutionDetails;
    changed: SubstitutionDetails;
    /** A specific substitution case description */
    description: string;
}

export interface SubstitutionDetails {
    /** teacher in lowercase */
    participantID: string;
    /**subject in lowercase (without number) */
    subjectID: string;
    /**room in lowercase (without blanks & max 3 letters) */
    roomID: string;
    course?: string;
}

// Updates
export interface UpdateData {
    timetable: string; //
    substitutionPlan: string;
    cafetoria: string;
    calendar: string;
    subjects: string;
    minAppLevel: number;
    aixformation: string;
    /** group in lowercase (the grade for students and the teacher id for teachers  */
    group: string;
}

export interface Tags {
    /** group in lowercase (the grade for students and teacher id for teachers  */
    group: string;
    /** 1 (pupil); 2 (teacher); 4 (developer); 8 (other) */
    userType: number;
    selected: Selection[]; // course list
    exams: Exam[]; // course list
    cafetoria: CafetoriaLogin;
}

export interface CafetoriaLogin {
    id: string | undefined;
    password: string | undefined;
    timestamp: string;
}

export interface LdapUser {
    status: boolean;
    grade: string;
    isTeacher: boolean
}

export interface User {
    username: string;
    /** group in lowercase (the grade for students and teacher id for teachers */
    group: string;
    /** 1 (pupil); 2 (teacher); 4 (developer); 8 (other) */
    userType: number;
    /** ISO Date */
    last_active: string | undefined;
}

export interface Selection {
    block: string;
    courseID: string | undefined;
    timestamp: string;
}

export interface Exam {
    subject: string;
    writing: boolean | undefined;
    timestamp: string;
}

export interface Device {
    os: string;
    appVersion: string;
    firebaseId: string;
    package: string;
    /** ISO-Date */
    lastActive: string;
}

export interface Cafetoria {
    saldo: number | undefined;
    error: string | undefined;
    days: CafetoriaDay[];
}

export interface CafetoriaDay {
    day: number; // TODO: remove unused parameter
    date: string;
    menus: Menu[]
}

export interface Menu {
    name: string;
    time: string;
    price: number;
}

export interface Calendar {
    years: number[];
    data: Event[]
}

export interface Event {
    name: string;
    info: string;
    start: string; // ISO date
    end: string | undefined; // ISO date
}

export interface Teacher {
    shortName: string;
}

export interface Subjects {
    [id: string]: string;
}

export interface AiXformation {
    posts: Post[];
    /** ISO-Date */
    date: string;
}

export interface Post {
    id: number;
    /** ISO-Date */
    date: string;
    title: string;
    url: string;
    author: string;
    tags: string[];
}
