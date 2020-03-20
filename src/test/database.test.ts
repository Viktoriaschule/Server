import {initDatabase} from "../utils/database";
import {
    getDevice,
    getDevices,
    getExam,
    getExams,
    getNotification,
    getPreference,
    getSelection,
    getSelections,
    getUser,
    getUsers,
    rmvDevice,
    rmvExams,
    rmvNotifications,
    rmvPreferences,
    rmvSelections,
    rmvUser,
    setDevice,
    setExam,
    setNotification,
    setPreference,
    setSelection,
    setUser
} from "../tags/tags_db";
import {CafetoriaLogin, Device, Exam, Selection, User} from "../utils/interfaces";
import {getCafetoriaLogin, rmvCafetoriaLogin, setCafetoriaLogin} from "../cafetoria/cafetoria_db";

const testUser: User = {
    last_active: new Date().toISOString(),
    username: 'maxmust',
    group: '5a',
    userType: 1,
};
const testDevUser: User = {
    last_active: new Date().toISOString(),
    username: 'maxadmi',
    group: 'q1',
    userType: 5,
};
const testDevice: Device = {
    os: 'TestOS',
    appVersion: '1.0.0',
    firebaseId: 'my-firebase-id-123',
    package: 'com.example',
    lastActive: new Date().toISOString()
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
                expect(user.userType).toBe(testUser.userType);
                expect(user.group).toBe(testUser.group);
            }
            done();
        });
    });
    test('change user', done => {
        testUser.group = '6a';
        expect(() => setUser(testUser)).not.toThrow();
        getUser(testUser.username).then(user => {
            expect(user).toBeDefined();
            if (user) {
                expect(user.group).toBe(testUser.group);
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
                expect(device.os).toBe(device.os);
                expect(device.package).toBe(device.package);
                expect(device.lastActive).toBe(device.lastActive);
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
        expect(() => rmvSelections(testUser.username)).not.toThrow();
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
            expect(() => rmvExams(testUser.username)).not.toThrow();
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
        expect(() => rmvNotifications(testUser.username)).not.toThrow();
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
        expect(() => rmvPreferences(testUser.username)).not.toThrow();
        getPreference(testUser.username, testPreference).then(dbValue => {
            expect(dbValue).toBeUndefined();
            done();
        });
    });
});
