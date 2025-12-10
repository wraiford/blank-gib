// /**
//  * @module settings-types
//  *
//  * The idea is that some settings we want to rel8 to the ibgib itself, and some
//  * settings we will relate to the local user space (similar to the user). In the
//  * future, when we get identity going hopefully with keystones, then we may
//  * relate these to keystones.
//  *
//  * This is similar to how agents are associated with ibgibs. There is an agent
//  * special ibgib index that has a map of domainTjpAddr -> agentAddr
//  */

// import { IbGib_V1, IbGibData_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

// import {
//     SETTINGS_ATOM, SETTINGS_TYPE_CHRONOLOGYS, SETTINGS_TYPE_MINIGAME, SETTINGS_TYPE_PROJECT,
//     SETTINGS_TYPE_TEXTEDITOR, SettingsType,
// } from "./settings-constants.mjs";
// import { LensMode } from "../project/project-types.mjs";

// export interface SettingsBase {
//     /**
//      * Discriminator for Settings info
//      */
//     type: SettingsType;
//     /**
//      * to help determine competing settings. fudge factor basically.
//      */
//     priority?: number;
//     /**
//      * ibgib has been marked as readonly.
//      */
//     readonly?: boolean;
// }

// export interface SettingsWithTabs extends SettingsBase {
//     openChildTjpAddrs: IbGibAddr[];
//     activeChildTjpAddr: IbGibAddr | undefined;
// }

// /**
//  * general settings for any ibgib. This can be
//  */
// export interface Settings_General extends SettingsBase {
//     type: 'general';
//     /**
//      * type of viewing component to use when just viewing the ibgib.
//      */
//     viewer?: string;
//     /**
//      * type of editor component to use when editing ibgib.
//      */
//     editor?: string;
// }

// /**
//  * settings specifically when interfacing with an ibgib via a text-editor
//  * component.
//  */
// export interface Settings_TextEditor extends SettingsBase {
//     type: typeof SETTINGS_TYPE_TEXTEDITOR;
//     wrap?: boolean | 'normal' | 'break-word' | 'wrap' | 'nowrap';
// }

// export interface Settings_Project extends SettingsBase, SettingsWithTabs {
//     type: typeof SETTINGS_TYPE_PROJECT;
//     // openChildTjpAddrs: IbGibAddr[];
//     // activeChildTjpAddr: IbGibAddr | undefined;
//     lensMode: LensMode;
// }

// export interface Settings_Minigame extends SettingsBase {
//     type: typeof SETTINGS_TYPE_MINIGAME;
// }

// export interface Settings_Chronologys extends SettingsBase, SettingsWithTabs {
//     type: typeof SETTINGS_TYPE_CHRONOLOGYS;
//     // openChildTjpAddrs: IbGibAddr[];
//     // activeChildTjpAddr: IbGibAddr | undefined;
// }

// /**
//  * union type of known Settings interfaces for various use cases.
//  *
//  * ## notes
//  *
//  * This is more a union type of shapes that this app knows, not necessarily what
//  * settings must have. IOW, there might be other shapes in settings...
//  *
//  * @see {@link SettingsBase.type}
//  */
// export type IbGibSettings =
//     | Settings_General
//     | Settings_TextEditor
//     | Settings_Project
//     | Settings_Minigame
//     | Settings_Chronologys;

// export interface SettingsData_V1 extends IbGibData_V1 {
//     /**
//      * map of a use-case key to a Settings instance.
//      *
//      * I am thinking this will be 'general_default', 'text-editor_default',
//      * 'general_current', 'text-editor_current', etc., so the key will be in the
//      * form of:
//      *   `${type}_${useCase}`
//      */
//     sections: { [key: string]: IbGibSettings; }
//     /**
//      * composite pattern for settings.
//      *
//      * ## intent
//      *
//      * Does the ibgib have any children, i.e., if this ibgib has child tabs,
//      * which tabs are open? Which details pages are open? What are their
//      * rel8nNames? (I don't know which things I'll keep here or what).
//      *
//      * ## NOTE
//      *
//      * This is not a composite pattern of other *settings ibgibs*, but just the
//      * settings themselves.
//      *
//      * Also, I don't know which one wins as far as an ibgib's child's settings
//      * vs. that child ibgib's registered settings with the local space.
//      */
//     children: { [tjpAddr: IbGibAddr]: IbGibSettings; }
// }

// export interface SettingsRel8ns_V1 extends IbGibRel8ns_V1 { }

// export interface SettingsIbGib_V1 extends IbGib_V1<SettingsData_V1, SettingsRel8ns_V1> { }

// export interface SettingsIbInfo {
//     atom: typeof SETTINGS_ATOM;
//     scope: string;
// }
