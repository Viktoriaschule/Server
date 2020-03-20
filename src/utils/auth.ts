import config from './config';

export const getAuth = (req: any): { username: string, password: string } => {
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    return {username: username, password: password}
};

export const isDeveloper = (username: string): boolean => {
    return config.developers.includes(username);
};

export const getUserType = (username: string, isTeacher: boolean) => {
    let userType = isTeacher ? 2 : 1;
    if (isDeveloper(username)) userType += 4;
    return userType;
};

export const isTeacher = (userType: number): boolean => {
    return [2, 3, 6, 10].includes(userType);
};

export default getAuth;