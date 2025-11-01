import { clone, extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { Ib, TransformResult } from "@ibgib/ts-gib/dist/types.mjs";
import { Factory_V1 } from "@ibgib/ts-gib/dist/V1/factory.mjs";
import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
import { IbGibSettings, SettingsIbGib_V1 } from "./settings-types.mjs";
import type { SettingsData_V1, SettingsIbInfo } from "./settings-types.mjs";
import {
    isSettingsType, DEFAULT_SETTINGS_GENERAL, SETTINGS_TYPE_VALID_VALUES,
    SettingsType, DEFAULT_SETTINGS_TEXTEDITOR,
    DEFAULT_SETTINGS_DATA_V1,
    SETTINGS_ATOM,
    DEFAULT_SETTINGS_PROJECT,
    DEFAULT_SETTINGS_MINIGAME,
    DEFAULT_SETTINGS_CHRONOLOGYS
} from "./settings-constants.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbAndGib } from "@ibgib/ts-gib/dist/helper.mjs";


const logalot = GLOBAL_LOG_A_LOT; // change this when you want to turn off verbose logging

export async function getSettingsScope({
    ibGib
}: {
    ibGib: IbGib_V1
}): Promise<string> {
    const lc = `[${getSettingsScope.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 57ac4c0a3448bc5e98ecf5bfb02ce825)`); }
        const { ib } = getIbAndGib({ ibGib });
        const atom = ib.split(' ').at(0);
        if (!atom) { throw new Error(`(UNEXPECTED) atom falsy? we split the ib by spaces (space-delimiter). this makes no sense. (E: 6a9ea640ae38823aeefc6ec82a05d625)`); }

        return `${SETTINGS_ATOM}_${atom}`;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getSectionName({
    settingsType,
    useCase,
}: {
    settingsType: SettingsType,
    useCase: string,
}): Promise<string> {
    const lc = `[${getSectionName.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f13dff111048421cad5453f821487825)`); }
        if (useCase.includes('_')) { throw new Error(`(UNEXPECTED) settingsType.includes('_')? should be kebab-cased or camelCased (E: 8f75e89b9378819ab882cc1870f1e825)`); }
        if (settingsType.includes('_')) { throw new Error(`(UNEXPECTED) settingsType.includes('_')? should be kebab-cased or camelCased (E: 1d316b0808287c12689d1e882648b825)`); }
        return [
            settingsType,
            useCase
        ].join('_');

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function parseSectionName({
    sectionName,
}: {
    sectionName: string,
}): { settingsType: SettingsType, useCase: string } {
    const lc = `[${parseSectionName.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f5867c51505a3c32f20d5489f2919f25)`); }
        if (!sectionName.includes('_')) { throw new Error(`invalid sectionName (${sectionName}). Should be a underscore-delimited value in form of "settingsType_useCase" (E: ec0208c6513878f028b68756a818b825)`); }
        const [
            settingsType,
            useCase
        ] = sectionName.split('_');
        if (!isSettingsType(settingsType)) { throw new Error(`invalid settingsType (${settingsType}) found in sectionName (${sectionName}). Must be one of ${SETTINGS_TYPE_VALID_VALUES} (E: 0e1078f6aaa871154182f239a639f825)`); }
        return { settingsType, useCase, };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getDefaultSettings<TSettings extends IbGibSettings>({
    settingsType,
}: {
    settingsType: SettingsType, // hard-coded for now
}): Promise<TSettings> {
    const lc = `[${getDefaultSettings.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f8a03b1bb6d1ecbf52552358f9ea0825)`); }
        switch (settingsType) {
            case SettingsType.general:
                return clone(DEFAULT_SETTINGS_GENERAL) as TSettings;
            case SettingsType.textEditor:
                return clone(DEFAULT_SETTINGS_TEXTEDITOR) as TSettings;
            case SettingsType.project:
                return clone(DEFAULT_SETTINGS_PROJECT) as TSettings;
            case SettingsType.minigame:
                return clone(DEFAULT_SETTINGS_MINIGAME) as TSettings;
            case SettingsType.chronologys:
                return clone(DEFAULT_SETTINGS_CHRONOLOGYS) as TSettings;
            default:
                throw new Error(`(UNEXPECTED) unknown settingsType (${settingsType})? right now, we're whitelisting only. SettingsTypes: ${SETTINGS_TYPE_VALID_VALUES} (E: 801a7ade4c0849b308d5c8f8f0318d25)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getSettingsSection<TSettings extends IbGibSettings>({
    sectionName,
    settingsIbGib,
}: {
    /**
     * key (i.e. name) of section to get from the `settingsIbGib.data.sections`.
     * @see {@link SettingsData_V1.sections}
     * @see {@link IbGibSettings}
     */
    sectionName: string,
    settingsIbGib: SettingsIbGib_V1,
}): Promise<TSettings | undefined> {
    const lc = `[${getSettingsSection.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 266554b13f6ce6daa85c882f04805825)`); }

        if (!settingsIbGib.data) { throw new Error(`(UNEXPECTED) settingsIbGib.data falsy? (E: dd3708f0515fb0b4d4024f4d336a3625)`); }
        if (!settingsIbGib.data.sections) { throw new Error(`(UNEXPECTED) settingsIbGib.data.sections falsy? what was the settingsIbGib even created for? (E: 31f85898a1c854e13440e278a79ceb25)`); }
        const sections = settingsIbGib.data.sections ?? {};
        const section = sections[sectionName];
        return section as (TSettings | undefined);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getSettingsIb({
    scope,
}: {
    scope: string,
}): Ib {
    const lc = `[${getSettingsIb.name}]`;
    try {
        if (scope.includes(' ')) {
            console.warn(`${lc} scope includes one or more spaces. These will be converted to double underscores. (W: 75a53c623d3110b5e874e5789b414325)`);
            scope = scope.replace(/ /g, '__');
        }
        return `${SETTINGS_ATOM} ${scope}`;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

export function parseSettingsIb({
    ib,
}: {
    ib: Ib,
}): SettingsIbInfo {
    const lc = `[${parseSettingsIb.name}]`;
    try {
        const pieces = ib.split(' ');
        if (pieces.length !== 2) {
            throw new Error(`invalid settings ib (${ib}). should be in the form of "atom scope" (a single space, scope should not have spaces, atom should be ${SETTINGS_ATOM}) (E: 7b3fd82f4b68a29b9890dc164d52dc25)`);
        }
        const [atom, scope] = pieces;
        if (atom !== SETTINGS_ATOM) { throw new Error(`invalid atom (${atom}) found in ib (${ib}). should be ${SETTINGS_ATOM} (E: b8a5ac4b940816ff6887a64dec05bf25)`); }
        return {
            atom,
            scope,
        };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * creates a new settings ibgib with default values set (and atow 05/2025 also
 * assigns "current" Settings as well).
 *
 * if {@link saveInSpace} is true, then will save the transform result AND
 * register the ibgib with the metaspace's latest index. This requires also
 * {@link metaspace} to be truthy, and throws if it is not. If {@link space} is
 * falsy, then will use the metaspace's default local user space.
 */
export async function createSettings({
    scope,
    metaspace,
    space,
    saveInSpace,
}: {
    scope: string,
    metaspace?: MetaspaceService,
    space?: IbGibSpaceAny,
    saveInSpace?: boolean,
}): Promise<TransformResult<SettingsIbGib_V1>> {
    const lc = `[${createSettings.name}]`;
    try {

        let ib = getSettingsIb({ scope });
        let data = await getDefaultSettingsData();
        let rel8ns = undefined;

        const resSettings = await Factory_V1.firstGen<SettingsData_V1>({
            parentIbGib: Factory_V1.primitive({ ib: SETTINGS_ATOM }),
            ib, data, rel8ns,
            dna: true,
            nCounter: true,
            tjp: { timestamp: true, uuid: true },
        }) as TransformResult<SettingsIbGib_V1>;

        if (saveInSpace) {
            if (!metaspace) { throw new Error(`metaspace falsy but saveInSpace is true (E: f91adfe38d78e6e4f8bca278fce37925)`); }
            await metaspace.persistTransformResult({ resTransform: resSettings, space });
            await metaspace.registerNewIbGib({ ibGib: resSettings.newIbGib, space });
        }

        return resSettings;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * hacky function that atow (05/2025) populates default/current
 * general/texteditor sections
 */
export async function getDefaultSettingsData(): Promise<SettingsData_V1> {
    const lc = `[${getDefaultSettingsData.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 3d7cc3f242cc88ad28dafaf85d646a25)`); }
        const data: SettingsData_V1 = clone(DEFAULT_SETTINGS_DATA_V1);
        const sectionName_generalDefault = await getSectionName({
            settingsType: 'general',
            useCase: 'default',
        });
        const sectionName_generalCurrent = await getSectionName({
            settingsType: 'general',
            useCase: 'current',
        });
        data.sections[sectionName_generalDefault] = clone(DEFAULT_SETTINGS_GENERAL);
        data.sections[sectionName_generalCurrent] = clone(DEFAULT_SETTINGS_GENERAL);

        const sectionName_textEditorDefault = await getSectionName({
            settingsType: 'text-editor',
            useCase: 'default',
        });
        const sectionName_textEditorCurrent = await getSectionName({
            settingsType: 'text-editor',
            useCase: 'current',
        });
        data.sections[sectionName_textEditorDefault] = clone(DEFAULT_SETTINGS_TEXTEDITOR);
        data.sections[sectionName_textEditorCurrent] = clone(DEFAULT_SETTINGS_TEXTEDITOR);

        return data;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
