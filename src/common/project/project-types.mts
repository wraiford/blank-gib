// import { CommentData_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";
// import { IbGib_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import type { getProjectIb } from './project-helper.mjs';
// import { AGENT_REL8N_NAME } from "../../witness/agent/agent-constants.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

// // #region constants - Pulled in from project-constants, but we need default data/rel8ns structure here

// export const DEFAULT_PROJECT_TEXT = 'default project text';
// export const DEFAULT_PROJECT_NAME = 'untitled_project';
// export const DEFAULT_PROJECT_DESCRIPTION = 'This is an ibgib project. ';

// /**
//  * Default rel8ns values for a Project. Includes inherited defaults from IbGib.
//  */
// export const DEFAULT_PROJECT_REL8NS_V1: ProjectRel8ns_V1 | undefined = undefined;

// // #endregion constants

// /**
//  * Represents the data structure for a Project ibGib.
//  * Contains the core information defining a project.
//  */
// export interface ProjectData_V1 extends CommentData_V1 {
//     /**
//      * Description of the project.
//      * This can be a more detailed explanation of the project's purpose or scope.
//      * Optional.
//      */
//     description?: string;
// }

// /**
//  * Represents the relationships structure for a Project ibGib.
//  * Currently holds standard ibGib relationships but can be extended
//  * in the future if projects require specific relationship types (e.g., rel8n_tasks).
//  */
// export interface ProjectRel8ns_V1 extends IbGibRel8ns_V1 {
//     // Add any project-specific rel8ns here if needed.
//     [AGENT_REL8N_NAME]?: IbGibAddr[];
// }

// /**
//  * Represents a fully formed Project ibGib, combining its data and relationships.
//  * This is the primary type used when interacting with Project ibGibs.
//  */
// export interface ProjectIbGib_V1 extends IbGib_V1<ProjectData_V1, ProjectRel8ns_V1> {
// }

// /**
//  * Default data values for a Project. Includes inherited defaults from Comment/IbGib.
//  */
// export const DEFAULT_PROJECT_DATA_V1: ProjectData_V1 = {
//     // Inherited from CommentData_V1 -> IbGibData_V1
//     name: DEFAULT_PROJECT_NAME, // Default project name
//     text: DEFAULT_PROJECT_TEXT, // Default comment text
//     textTimestamp: '',

//     // ProjectData_V1 specific (or CommentData_V1 overrides)
//     description: DEFAULT_PROJECT_DESCRIPTION, // Default project description
// };

// /**
//  * Represents the parsed information extracted from the `addlMetadataText`
//  * segment within a project's `ib` string. This segment follows the `safeName`
//  * and is delimited by underscores internally if multiple fields are present.
//  */
// export interface ProjectAddlMetadataInfo {
//     /**
//      * Ticks version of the timestamp derived from ibgib.data.timestamp.
//      * This value is encoded within the addlMetadataText segment of the ib string.
//      */
//     timestampInTicks: number;
//     // Add other fields here if the addlMetadataText segment grows,
//     // ensuring they are underscore-delimited in the raw text.
// }


// /**
//  * Represents the parsed information extracted from a project's `ib` string.
//  * The `ib` string contains core metadata encoded for efficient referencing.
//  *
//  * @see {@link getProjectIb} for ib schema
//  */
// export interface ProjectIbInfo {
//     /** The atom identifier (must be 'project'). Checked during parsing. */
//     atom: 'project';
//     /**
//      * A 'saferized', often truncated, version of the name (project title).
//      * Extracted as the first space-delimited segment after the atom.
//      */
//     safeName: string;
//     /**
//      * The raw string containing underscore-delimited additional metadata (e.g., "1678886400000").
//      * Extracted as the second space-delimited segment after safeName.
//      *
//      * @see {@link addlMetadata}
//      */
//     addlMetadataText: string;
//     /**
//      * The parsed content of the addlMetadataText segment.
//      *
//      * @see {@link addlMetadataText}
//      */
//     addlMetadata: ProjectAddlMetadataInfo;
// }

// // #region LensMode
// export const LENS_MODE_RAW = 'raw';
// export const LENS_MODE_TEXT = 'text';
// export const LENS_MODE_MINIGAME = 'minigame';
// export type LensMode =
//     | typeof LENS_MODE_RAW
//     | typeof LENS_MODE_TEXT
//     | typeof LENS_MODE_MINIGAME;
// export const LensMode = {
//     raw: LENS_MODE_RAW,
//     text: LENS_MODE_TEXT,
//     minigame: LENS_MODE_MINIGAME,
// } satisfies { [key in LensMode]: LensMode };
// // #endregion LensMode
