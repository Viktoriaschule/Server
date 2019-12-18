import { initDatabase } from "../utils/database";
import { setUser, getUser, rmvUser, setDevice, getUsers, getDevice, rmvDevice, getDevices, getAllDevices, setExam, getExam, clearExams, getExams, setNotification, getNotification, clearNotifications, setSelection, getSelection, clearSelections, getSelections, setPreference, getPreference, clearPreferences } from "../tags/tags_db";
import { User, Device, CafetoriaLogin, Exam, Selection } from "../utils/interfaces";
import { setCafetoriaLogin, getCafetoriaLogin, rmvCafetoriaLogin } from "../cafetoria/cafetoria_db";

const testUser: User = {
    username: 'maxmust',
    grade: '5a',
    group: 1,
    lastActive: new Date().toISOString()
};
const testDevUser: User = {
    username: 'maxadmi',
    grade: 'q1',
    group: 5,
    lastActive: new Date().toISOString()
};
const testDevice: Device = {
    os: 'TestOS',
    name: 'TestPhone',
    appVersion: '1.0.0',
    firebaseId: 'my-firebase-id-123'
};
const testCafetoriaLogin: CafetoriaLogin = {
    id: 'encrypted_id',
    password: 'encrypted_password',
    timestamp: new Date().toISOString()
};
const testSelection: Selection = {
    block: '999',
    courseID: 'course-id',
    timestamp: new Date().toISOString()
};
const testExam: Exam = {
    subject: 'sbj',
    writing: true,
    timestamp: new Date().toISOString()
};
const testNotification = 'hashed-notification';
const testPreference = 'pref_key';

describe('database', () => {
    test('init db', done => {
        initDatabase().then(connected => {
            expect(connected).toBe(true);
            done();
        });
    });
    test('add user', done => {
        expect(() => setUser(testUser)).not.toThrow();
        expect(() => setUser(testDevUser)).not.toThrow();
        getUser(testUser.username).then(user => {
            expect(user).toBeDefined();
            if (user) {
                expect(user.username).toBe(testUser.username);
                expect(user.grade).toBe(testUser.grade);
                expect(user.group).toBe(testUser.group);
                expect(user.lastActive).toBe(testUser.lastActive);
            }
            done();
        });
    });
    test('change user', done => {
        testUser.grade = '6a';
        expect(() => setUser(testUser)).not.toThrow();
        getUser(testUser.username).then(user => {
            expect(user).toBeDefined();
            if (user) {
                expect(user.grade).toBe(testUser.grade);
            }
            done();
        });
    });
    test('dev users', done => {
        // Get all users
        getUsers().then(users => {
            const count = users.length;
            // Get only dev users
            getUsers(true).then(users => {
                expect(users.length).toBe(count - 1);
                done();
            });
        });
    });
    test('remove user', done => {
        expect(() => rmvUser(testUser)).not.toThrow();
        expect(() => rmvUser(testDevUser)).not.toThrow();
        getUser(testUser.username).then(user => {
            expect(user).toBeUndefined();
            done();
        });
    });
    test('add device', done => {
        expect(() => setDevice(testUser.username, testDevice)).not.toThrow();
        getDevice(testUser.username, testDevice.firebaseId).then(device => {
            expect(device).toBeDefined();
            if (device) {
                expect(device.appVersion).toBe(device.appVersion);
                expect(device.firebaseId).toBe(device.firebaseId);
                expect(device.name).toBe(device.name);
                expect(device.os).toBe(device.os);
            }
            done();
        });
    });
    test('get user devices', done => {
        getDevices(testUser.username).then(devices => {
            expect(devices.length).toBe(1);
            done();
        });
    });
    test('get all devices', done => {
        getAllDevices().then(devices => {
            expect(devices.length).toBe(1);
            done();
        });
    });
    test('remove device', done => {
        expect(() => rmvDevice(testDevice)).not.toThrow();
        getDevice(testUser.username, testDevice.firebaseId).then(device => {
            expect(device).toBeUndefined();
            done();
        });
    });
    test('set cafetoria login with login date', done => {
        expect(() => setCafetoriaLogin(testUser.username, testCafetoriaLogin)).not.toThrow();
        getCafetoriaLogin(testUser.username).then(cafetoriaLogin => {
            expect(cafetoriaLogin).toBeDefined();
            expect(cafetoriaLogin.id).toBe(testCafetoriaLogin.id);
            expect(cafetoriaLogin.password).toBe(testCafetoriaLogin.password);
            expect(cafetoriaLogin.timestamp).toBe(testCafetoriaLogin.timestamp);
            done();
        });
    });
    test('set cafetoria login without login date', done => {
        testCafetoriaLogin.id = undefined;
        testCafetoriaLogin.password = undefined;
        expect(() => setCafetoriaLogin(testUser.username, testCafetoriaLogin)).not.toThrow();
        getCafetoriaLogin(testUser.username).then(cafetoriaLogin => {
            expect(cafetoriaLogin.id).toBe(undefined);
            expect(cafetoriaLogin.password).toBe(undefined);
            expect(cafetoriaLogin.timestamp).toBe(testCafetoriaLogin.timestamp);
            done();
        });
    });
    test('delete cafetoria login', done => {
        expect(() => rmvCafetoriaLogin(testUser.username)).not.toThrow();
        getCafetoriaLogin(testUser.username).then(cafetoriaLogin => {
            expect(new Date(cafetoriaLogin.timestamp).getFullYear()).toBe(2000);
            done();
        });
    });
    test('add selection', done => {
        expect(() => setSelection(testUser.username, testSelection)).not.toThrow();
        getSelection(testUser.username, testSelection.block).then(selection => {
            expect(selection).toBeDefined();
            if (selection) {
                expect(selection.timestamp).toBe(testSelection.timestamp);
                expect(selection.courseID).toBe(testSelection.courseID);
                expect(selection.block).toBe(testSelection.block);
            }
            done();
        });
    });
    test('change selection to undefined', done => {
        testSelection.courseID = undefined;
        expect(() => setSelection(testUser.username, testSelection)).not.toThrow();
        getSelection(testUser.username, testSelection.block).then(selection => {
            expect(selection).toBeDefined();
            if (selection) {
                expect(selection.timestamp).toBe(testSelection.timestamp);
                expect(selection.courseID).toBe(null);
                expect(selection.block).toBe(testSelection.block);
            }
            done();
        });
    });
    test('remove selections for user', done => {
        expect(() => clearSelections(testUser.username)).not.toThrow();
        getSelections(testUser.username).then(selections => {
            expect(selections).toBeDefined();
            if (selections) {
                expect(selections.length).toBe(0);
            }
            done();
        });
    });
    test('add exam', done => {
        expect(() => setExam(testUser.username, testExam)).not.toThrow();
        getExam(testUser.username, testExam.subject).then(exam => {
            expect(exam).toBeDefined();
            if (exam) {
                expect(exam.timestamp).toBe(testExam.timestamp);
                expect(exam.subject).toBe(testExam.subject);
                expect(exam.writing).toBe(testExam.writing);
            }
            done();
        });
    });
    test('change exam to undefined', done => {
        testExam.writing = undefined;
        expect(() => setExam(testUser.username, testExam)).not.toThrow();
        getExam(testUser.username, testExam.subject).then(exam => {
            expect(exam).toBeDefined();
            if (exam) {
                expect(exam.timestamp).toBe(testExam.timestamp);
                expect(exam.subject).toBe(testExam.subject);
                expect(exam.writing).toBe(undefined);
            }
            done();
        });
    });
    test('remove exams for user', done => {
        getExams(testUser.username).then(exams => {
            expect(exams).toBeDefined();
            expect((exams || []).length).toBe(1);
            expect(() => clearExams(testUser.username)).not.toThrow();
            getExams(testUser.username).then(exams => {
                expect(exams).toBeDefined();
                if (exams) {
                    expect(exams.length).toBe(0);
                }
                done();
            });
        });
    });
    const dayIndex = 0;
    test('add notification', done => {
        expect(() => setNotification(testUser.username, dayIndex, testNotification)).not.toThrow();
        getNotification(testUser.username, dayIndex).then(notification => {
            expect(notification).toBeDefined();
            if (notification) {
                expect(notification).toBe(testNotification);
            }
            done();
        });
    });
    test('clear notifications for user', done => {
        expect(() => clearNotifications(testUser.username)).not.toThrow();
        getNotification(testUser.username, dayIndex).then(notification => {
            expect(notification).toBeUndefined();
            done();
        });
    });

    const value = true;
    test('add preference', done => {
        expect(() => setPreference(testUser.username, testPreference, value)).not.toThrow();
        getPreference(testUser.username, testPreference).then(dbValue => {
            expect(dbValue).toBeDefined();
            if (dbValue) {
                expect(dbValue).toBe(value);
            }
            done();
        });
    });
    test('remove preference', done => {
        expect(() => clearPreferences(testUser.username)).not.toThrow();
        getPreference(testUser.username, testPreference).then(dbValue => {
            expect(dbValue).toBeUndefined();
            done();
        });
    });
});