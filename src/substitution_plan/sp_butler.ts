import express from 'express';
import download from './sp_download';
import {
    SubstitutionPlan,
    SubstitutionPlanGroup,
    SubstitutionPlanGroups,
    SubstitutionPlanInfo
} from '../utils/interfaces';
import {loadData, saveData, shouldForceUpdate} from '../utils/data';
import {cleanSubstitutionPlans, getSubstitutionPlanGroup, setSubstitutionPlanGroup} from "./sp_db";
import getAuth, {isTeacher} from "../utils/auth";
import {getUser} from "../tags/tags_db";
import getLocalization from "../utils/localizations";

export const substitutionPlanRouter = express.Router();
const defaultData: string[] = [];

substitutionPlanRouter.get('/', async (req, res) => {
    // Get all substitution plans for the grades or for one teacher
    const daysInfo = await loadData<SubstitutionPlanInfo[]>('substitution_plan', []);

    const user = await getUser(getAuth(req).username);
    if (user) {
        // Send for students all substitution plans and for a teacher only the own
        const groups: string[] = isTeacher(user.userType) ? [user.username] : getLocalization('grades');
        const days: SubstitutionPlan[] = [];
        for (let day = 0; day < daysInfo.length; day++) {
            const sp = await getSubstitutionPlanForGroups(groups, day);
            if (sp) {
                days.push(sp);
            } else {
                const data: SubstitutionPlanGroups = {};
                data[user.group] = [];
                days.push({
                    date: daysInfo[day].date,
                    updated: daysInfo[day].updated,
                    week: daysInfo[day].week,
                    data: data,
                    unparsed: data,
                })
            }
        }

        return res.json(days);
    }
    res.status(400);
    return res.json({'error': 'The user have to be registered first to request the substitution plan'});
});

/** Updates the substitution plan */
export const updateSubstitutionPlan = async (): Promise<void> => {
    const days = await loadData<SubstitutionPlanInfo[]>('substitution_plan', []);
    const newDays = await download(!(shouldForceUpdate(days, defaultData) || days[0] === undefined || days[1] === undefined));

    // Set the days in the loaded table and the groups in an extra table
    for (let i = 0; i < newDays.length; i++) {
        const day = newDays[i];
        if (day !== undefined) {
            days[i] = {
                date: day.date,
                updated: day.updated,
                week: day.week,
            };
            cleanSubstitutionPlans(i);
            for (const group of Object.keys(day.data || {})) {
                setSubstitutionPlanGroup(group, i, getSubstitutionPlanForGroup(group, day));
            }
        }
    }
    saveData('substitution_plan', days);
};

const getSubstitutionPlanForGroups = async (groups: string[], index: number): Promise<SubstitutionPlan | undefined> => {
    // Get all substitution plans for the given day and groups from the db
    const substitutionPlans = await Promise.all(groups.map((group) => getSubstitutionPlanGroup(group, index)));

    const firstGroup = substitutionPlans[0];
    if (firstGroup) {
        // Combine all separated substitution plans to a map
        const data: SubstitutionPlanGroups = {};
        const unparsed: SubstitutionPlanGroups = {};
        for (let i = 0; i < groups.length; i++) {
            const sp = substitutionPlans[i];
            if (sp) {
                data[groups[i]] = sp.data;
                unparsed[groups[i]] = sp.unparsed;
            }
        }

        return {
            date: firstGroup.date,
            updated: firstGroup.updated,
            week: firstGroup.week,
            data: data,
            unparsed: unparsed,
        }
    }
    return undefined;
};

export const getSubstitutionPlanForGroup =
    (group: string, sp: SubstitutionPlan): SubstitutionPlanGroup => {
        return {
            date: sp.date,
            week: sp.week,
            updated: sp.updated,
            data: sp.data[group] || [],
            unparsed: (sp.unparsed['other'] || []).concat(sp.unparsed[group] || []),
        };
    };
