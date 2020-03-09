import mysql from 'mysql';
import config from './config';
import sqlString from 'sqlstring';

let dbConnection: mysql.Connection;

export const escapeString = (text: string) => {
    return sqlString.escape(text);
}

export const unescapeString = (sql: string) => {
    return sqlString.raw(sql);
}

export const updateOnlyNonNullAttributes = (values: any, escape = false) => {
    const filtered = Object.keys(values).filter((key) => values[key] != undefined);
    if (filtered.length === 0) return '';

    return 'ON DUPLICATE KEY UPDATE ' + filtered.map((key) => {
        return `${key} = ${toSqlValue(values[key], escape)}`;
    }).join(', ');
}

export const updateAllAttributes = (values: any, escape = false) => {
    if (Object.keys(values).length === 0) {
        return '';
    }
    return 'ON DUPLICATE KEY UPDATE ' + Object.keys(values).map((key) => {
        return `${key} = ${toSqlValue(values[key], escape)}`;
    }).join(', ');
}

export const toSqlValue = (value: any, escape = false): string => {
    if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        return `null`;
    }
    if (typeof value === 'boolean') {
        return `${value}`;
    }
    if (escape) {
        return escapeString(value);
    }
    return `'${value}'`;
}

export const fromSqlBoolean = (value: number): boolean | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }
    return value === 1 ? true : false;
}

export const fromSqlValue = <sqlType>(value: sqlType): sqlType | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }
    return value;
}

export const insertMultipleRows = (values: any[][]): string => {
    return values.map((row) => {
        return `(${row.join(', ')})`;
    }).join(', ');
}

/** Initialize the database connection */
export const initDatabase = (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        dbConnection = mysql.createConnection({
            host: config.dbHost,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
            port: config.dbPort
        });
        dbConnection.connect((err) => {
            if (err) {
                console.log('Failed to connect to the database!');

                resolve(false);
                return;
            }
            console.log('Connected to database');
            createDefaultTables();
            resolve(true);
        });
    });
}

/** Executes a sql command */
export const runDbCmd = (options: string): void => {
    if (!checkDatabaseStatus()) return;
    dbConnection.query(options);
}

/** Returns all results for the given options */
export const getDbResults = async (options: string): Promise<any[]> => {
    if (!checkDatabaseStatus()) return [];
    return new Promise<any[]>((resolve, reject) => {
        dbConnection.query(options, (err, results) => {
            if (err) {
                console.log('Failed to get values: ' + err);
                resolve(undefined);
            } else {
                resolve(results);
            }
        });
    });
}

/** Creates all default database tables */
const createDefaultTables = (): void => {
    if (!checkDatabaseStatus()) return;
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users (username VARCHAR(8) NOT NULL, grade TEXT NOT NULL, user_group INT NOT NULL, last_active VARCHAR(24) NOT NULL, UNIQUE KEY unique_username (username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_selections (username VARCHAR(8) NOT NULL, block VARCHAR(5) NOT NULL, course_id VARCHAR(12), timestamp VARCHAR(24) NOT NULL, UNIQUE KEY unique_username_block (username, block)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_exams (username VARCHAR(8) NOT NULL, subject VARCHAR(3) NOT NULL, writing BOOLEAN, timestamp VARCHAR(24) NOT NULL, UNIQUE KEY unique_exam (username, subject)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_cafetoria (username VARCHAR(8) NOT NULL, keyfob_id TEXT, keyfob_key TEXT, timestamp VARCHAR(24) NOT NULL, UNIQUE KEY unique_username (username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_settings (token VARCHAR(255) NOT NULL, key_name VARCHAR(60) NOT NULL, value BOOLEAN NOT NULL, UNIQUE KEY unique_preference (token, key_name)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_devices (username VARCHAR(8) NOT NULL, token VARCHAR(255) NOT NULL, os TEXT NOT NULL, version TEXT NOT NULL, package TEXT NOT NULL, last_active VARCHAR(24) NOT NULL, UNIQUE KEY unique_username (username, token)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_notifications (username VARCHAR(8) NOT NULL, day_index INT NOT NULL, hash TEXT, UNIQUE KEY unique_notification (username, day_index)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS data_substitution_plan (date_time VARCHAR(24) NOT NULL, updated VARCHAR(24) NOT NULL, data LONGTEXT NOT NULL, UNIQUE KEY unique_date_time (date_time, updated)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS data_aixformation (name VARCHAR(8) NOT NULL, data VARCHAR(40) NOT NULL, UNIQUE KEY unique_name (name)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS data_loaded (name VARCHAR(19) NOT NULL, data LONGTEXT NOT NULL, UNIQUE KEY unique_name (name)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS data_updates (name VARCHAR(19) NOT NULL, value VARCHAR(40) NOT NULL, UNIQUE KEY unique_name (name)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users_login (username VARCHAR(8) NOT NULL, password VARCHAR(64) NOT NULL, UNIQUE KEY unique_username (username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
}
/** Checks if the database connection is already initialized */
const checkDatabaseStatus = (): boolean => {
    if (!dbConnection || (dbConnection.state != 'authenticated' && dbConnection.state != 'connected')) {
        console.error('The database must be initialized:', dbConnection.state);
        return false;
    }
    return true;
}

if (module.parent === null) {
    initDatabase().then(() => {
        createDefaultTables();
        dbConnection.end();
    });
}
