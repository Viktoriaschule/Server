import config from '../utils/config';

const useSimulation = (key: string): boolean => {
    const argv = process.argv;
    let index = argv.indexOf('-s');
    if (index === -1) {
        index = argv.indexOf('--simulation');
    }
    if (!index || index === -1) {
        return false;
    }
    for (var i = index + 1; i < argv.length; i++) {
        const argument = argv[i];
        if (argument.startsWith('-')) {
            break;
        }
        if (argument === key) {
            console.log('Use simulation for:', key);
            return true;
        }
    }
    return false;
};


export const getSubstitutionPlanUrl = (day: number) => {
    if (useSimulation('sp')) {
        return `${config.debugHost}/substitutionplan/${day}`;
    }
    return `https://www.viktoriaschule-aachen.de/sundvplan/vps/f${day}/subst_001.htm`;
};

export const getLdapUrl = (username: string) => {
    if (useSimulation('ldap') || config.testUsers?.includes(username)) {
        return `${config.debugHost}/ldap`;
    }
    return config.ldapUrl;
};