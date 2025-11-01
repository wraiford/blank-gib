import { Settings_Chronologys, Settings_General, Settings_Minigame, Settings_Project, Settings_TextEditor, SettingsData_V1 } from "./settings-types.mjs";

export const SETTINGS_ATOM = 'settings';

// #region SettingsType enum
export const SETTINGS_TYPE_GENERAL = 'general';
export const SETTINGS_TYPE_TEXTEDITOR = 'text-editor';
export const SETTINGS_TYPE_PROJECTS = 'projects';
export const SETTINGS_TYPE_PROJECTSEXPLORER = 'projects-explorer';
export const SETTINGS_TYPE_PROJECTSDROPDOWN = 'projects-dropdown';
export const SETTINGS_TYPE_PROJECT = 'project';
export const SETTINGS_TYPE_MINIGAME = 'minigame';
export const SETTINGS_TYPE_CHRONOLOGYS = 'chronologys';
/**
 * Discriminator for Settings info
 */
export type SettingsType =
    | typeof SETTINGS_TYPE_GENERAL
    | typeof SETTINGS_TYPE_TEXTEDITOR
    | typeof SETTINGS_TYPE_PROJECTS
    | typeof SETTINGS_TYPE_PROJECTSEXPLORER
    | typeof SETTINGS_TYPE_PROJECTSDROPDOWN
    | typeof SETTINGS_TYPE_PROJECT
    | typeof SETTINGS_TYPE_MINIGAME
    | typeof SETTINGS_TYPE_CHRONOLOGYS
    ;
export const SettingsType = {
    general: SETTINGS_TYPE_GENERAL satisfies SettingsType,
    textEditor: SETTINGS_TYPE_TEXTEDITOR satisfies SettingsType,
    projects: SETTINGS_TYPE_PROJECTS satisfies SettingsType,
    projectsExplorer: SETTINGS_TYPE_PROJECTSEXPLORER satisfies SettingsType,
    projectsDropdown: SETTINGS_TYPE_PROJECTSDROPDOWN satisfies SettingsType,
    project: SETTINGS_TYPE_PROJECT satisfies SettingsType,
    minigame: SETTINGS_TYPE_MINIGAME satisfies SettingsType,
    chronologys: SETTINGS_TYPE_CHRONOLOGYS satisfies SettingsType,
} satisfies { readonly [key: string]: SettingsType; };
export const SETTINGS_TYPE_VALID_VALUES: SettingsType[] = Object.values(SettingsType);
export function isSettingsType(value: any): value is SettingsType {
    return SETTINGS_TYPE_VALID_VALUES.includes(value);
}
// #endregion SettingsType enum

export const DEFAULT_SETTINGS_GENERAL: Settings_General = {
    type: SettingsType.general,
    editor: undefined,
    readonly: true,
    viewer: 'ibgib-raw-viewer',
}
export const DEFAULT_SETTINGS_TEXTEDITOR: Settings_TextEditor = {
    type: SettingsType.textEditor,
    wrap: 'wrap',
}
export const DEFAULT_SETTINGS_PROJECT: Settings_Project = {
    type: SettingsType.project,
    openChildTjpAddrs: [],
    activeChildTjpAddr: undefined,
    lensMode: 'raw',
}
export const DEFAULT_SETTINGS_MINIGAME: Settings_Minigame = {
    type: SettingsType.minigame,
}

export const DEFAULT_SETTINGS_CHRONOLOGYS: Settings_Chronologys = {
    type: SettingsType.chronologys,
    openChildTjpAddrs: [],
    activeChildTjpAddr: undefined,
}

export const DEFAULT_SETTINGS_DATA_V1: SettingsData_V1 = {
    sections: {},
    children: {},
}
