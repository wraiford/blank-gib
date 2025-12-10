// import { extractErrorMsg, getSaferSubstring, getTimestamp, getTimestampInTicks, pretty, unique } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { Ib, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
// import { IbGibAddr } from '@ibgib/ts-gib/dist/types.mjs';
// import { validateIbGibIntrinsically } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
// import { IbGib_V1, } from '@ibgib/ts-gib/dist/V1/types.mjs';
// import { mut8 } from '@ibgib/ts-gib/dist/V1/transforms/mut8.mjs';
// import { fork } from '@ibgib/ts-gib/dist/V1/transforms/fork.mjs';
// import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
// import { createCommentIbGib } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';
// import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
// import { getLatestAddrs, parseSpaceIb, persistTransformResult } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';
// import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
// import { getTimestampInfo } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';
// import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
// import { appendToTimeline, mut8Timeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";

// import { GLOBAL_LOG_A_LOT } from '../../constants.mjs';
// import {
//     PROJECT_ATOM, PROJECT_DESC_REGEXP, PROJECT_NAME_REGEXP,
//     DEFAULT_PROJECT_SAFE_NAME_LENGTH, DEFAULT_PROJECT_ADDL_METADATA_LENGTH,
//     PROJECT_CHILD_DEFAULT_REL8N_NAME,
// } from './project-constants.mjs'; // Constants file to be created
// import {
//     ProjectData_V1, ProjectIbGib_V1, ProjectIbInfo, ProjectAddlMetadataInfo,
// } from './project-types.mjs';
// import { getAgentsSvc } from '../../witness/agent/agents-service-v1.mjs';
// import { AGENT_SPECIAL_IBGIB_TYPE_PROJECTAGENT } from '../../agent-texts/project-agent-texts.mjs';

// const logalot = GLOBAL_LOG_A_LOT;

// export function getProjectSafeName({ name }: { name: string }): string {
//     const lc = `[${getProjectSafeName.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: ec0c81cb0e8ec820f882ecafc2fbc825)`); }
//         const safeName = getSaferSubstring({
//             text: name,
//             length: DEFAULT_PROJECT_SAFE_NAME_LENGTH,
//         });
//         if (!safeName) { throw new Error(`${lc} Could not generate safeName from name: ${name}. (E: genuuid)`); }
//         return safeName;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Generates the `ib` string for a ProjectIbGib based on its data.
//  * The structure is: `${PROJECT_ATOM} ${safeName} ${addlMetadataText}`
//  * where addlMetadataText contains underscore-delimited fields like timestampInTicks.
//  *
//  * ## notes
//  *
//  * atow (04/2025), we are "descending" (forking) from a source comment ibgib to
//  * create the project. As such, we are positioning the project ibgib itself to
//  * have a similar structure to a comment ibgib. So the schema for the `ib`
//  * purposefully has the safeName in the second position just like a comment
//  * ibgib has a saferized version of the comment.data.text in its ib schema.
//  *
//  * WARNING
//  * WARNING
//  * ATOW (05/2025) THIS FUNCTION'S DETAILS ARE USED IN MUT8-IBGIB
//  * APIFUNCTIONINFO.  IF THIS CHANGES, THEN THAT FUNCTION MUST BE CHANGED TOO.
//  * WARNING
//  * WARNING
//  *
//  * @see {@link ProjectIbInfo}
//  * @see {@link ProjectAddlMetadataInfo}
//  *
//  */
// export function getProjectIb({
//     data,
// }: {
//     data: ProjectData_V1;
// }): string {
//     const lc = `[${getProjectIb.name}]`;
//     try {
//         const validationErrors = validateProjectData_V1({ data }) ?? [];
//         if (validationErrors.length > 0) {
//             throw new Error(`invalid Project data. errors: ${validationErrors} (E: d93d821fcc256b4bcb4d785b08c2f425)`);
//         }

//         // Get saferized name segment
//         const safeName = getProjectSafeName({ name: data.name });

//         // Prepare additional metadata text (add more fields with underscores here later)

//         // timestampInTicks
//         const timestampInfo = getTimestampInfo({ timestamp: data.timestamp });
//         if (!timestampInfo.valid) { throw new Error(`(UNEXPECTED) validated data but invalid data.timestamp? (E: 679cbf1c92e8b9473becf8310e6b8225)`); }
//         const timestampInTicks = Number.parseInt(timestampInfo.ticks);

//         // compose addlMetadataText
//         const addlMetadataFields: string[] = [
//             timestampInTicks.toString(),
//             // add more fields here as needed in the future
//         ];
//         addlMetadataFields.push();
//         const addlMetadataText = addlMetadataFields.join('_');
//         if (addlMetadataText.length > DEFAULT_PROJECT_ADDL_METADATA_LENGTH) {
//             throw new Error(`(UNEXPECTED) addlMetadataText.length > DEFAULT_PROJECT_ADDL_METADATA_LENGTH (${DEFAULT_PROJECT_ADDL_METADATA_LENGTH})? (E: 8fed8709283f6be2d8deda13b67b3925)`);
//         }

//         // Construct the final ib string
//         return `${PROJECT_ATOM} ${safeName} ${addlMetadataText}`;
//     } catch (error) {
//         console.error(`${lc} ${error.message}`);
//         throw error;
//     }
// }

// export function validateProjectIb({
//     ib,
// }: {
//     ib: Ib;
// }): string[] | undefined {
//     const lc = `[${validateProjectIb.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 111f6b5630badb921accdc6c224c0425)`); }

//         // major hack here...I'm tired of doing this plumbing shit.

//         try {
//             const _info = parseProjectIb({ ib });
//         } catch (error) {
//             return [extractErrorMsg(error)];
//         }

//         return undefined;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Parses a project `ib` string into its components.
//  *
//  * @see {@link getProjectIb} for expected ib schema
//  */
// export function parseProjectIb({
//     ib,
// }: {
//     ib: Ib;
// }): ProjectIbInfo {
//     const lc = `[${parseProjectIb.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... parsing ib: ${ib}`); }
//         if (!ib) { throw new Error(`${lc} ib required (E: genuuid)`); }

//         const pieces = ib.split(' ');
//         if (pieces.length !== 3) { throw new Error(`${lc} Invalid project ib format. Expected 3 space-delimited pieces. Got: ${pieces.length}. ib: ${ib} (E: genuuid)`); }

//         const [atom, safeName, addlMetadataText] = pieces;

//         if (atom !== PROJECT_ATOM) { throw new Error(`${lc} Invalid atom. Expected '${PROJECT_ATOM}', got '${atom}'. ib: ${ib} (E: genuuid)`); }

//         if (!safeName) { throw new Error(`${lc} safeName segment is empty. ib: ${ib} (E: genuuid)`); }

//         if (!addlMetadataText) { throw new Error(`${lc} addlMetadataText segment is empty. ib: ${ib} (E: genuuid)`); }

//         // Parse the underscore-delimited addlMetadataText
//         const metadataPieces = addlMetadataText.split('_');
//         if (metadataPieces.length !== 1) { throw new Error(`${lc} Could not parse addlMetadataText. Expected 1 underscore-delimited piece. Got: ${metadataPieces.length}. addlMetadataText: ${addlMetadataText} (E: genuuid)`); }

//         const timestampInTicksStr = metadataPieces[0];
//         const timestampInTicks = parseInt(timestampInTicksStr, 10);
//         if (isNaN(timestampInTicks)) { throw new Error(`${lc} Could not parse timestampInTicks from addlMetadataText. isNan.  Expected a decimal number. timestampInTicksStr: ${timestampInTicksStr}. addlMetadataText: ${addlMetadataText} (E: genuuid)`); }

//         const addlMetadata: ProjectAddlMetadataInfo = {
//             timestampInTicks,
//             // otherField, // if added
//         };

//         const result: ProjectIbInfo = {
//             atom: PROJECT_ATOM,
//             safeName,
//             addlMetadataText,
//             addlMetadata,
//         };

//         if (logalot) { console.log(`${lc} parsed info: ${pretty(result)}`); }
//         return result;

//     } catch (error) {
//         console.error(`${lc} ${error.message}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Validates the ProjectData_V1 structure.
//  * Returns array of error messages if invalid, otherwise undefined.
//  */
// export function validateProjectData_V1({
//     data,
// }: {
//     data: ProjectData_V1 | any;
// }): string[] | undefined {
//     const lc = `[${validateProjectData_V1.name}]`;
//     const errors: string[] = [];
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: ac9c21893f38a2500fcb49ee26f0b325)`); }

//         if (!data) {
//             errors.push("Data is required.");
//             return errors; /* <<<< returns early */
//         }

//         if (data.name) {
//             if (typeof data.name === 'string') {
//                 if (!PROJECT_NAME_REGEXP.test(data.name)) {
//                     errors.push(`data.name must match regexp: ${PROJECT_NAME_REGEXP.source}`);
//                 }
//             } else {
//                 errors.push("Name must be a string.");
//             }
//         } else {
//             errors.push("name required")
//         }

//         if (data.description) {
//             if (typeof data.description === 'string') {
//                 if (!PROJECT_DESC_REGEXP.test(data.description)) {
//                     errors.push(`data.description must match regexp: ${PROJECT_DESC_REGEXP.source}`);
//                 }
//             } else {
//                 errors.push("Description must be a string.");
//             }
//         } else {
//             // not required
//         }

//         // export interface CommentData_V1 extends IbGibData_V1 {
//         //     text: string;
//         //     textTimestamp?: string;
//         //     timestamp?: string;
//         // }

//         if (data.text) {
//             if (typeof data.text === 'string') {
//                 // any more checks on text?
//             } else {
//                 errors.push("data.text must be a non-empty string. project's text is meant to be the primary reason/focus for the project.");
//             }
//         } else {
//             errors.push(`data.text required`);
//         }

//         if (data.textTimestamp) {
//             if (typeof data.textTimestamp === 'string') {
//                 const resValid = getTimestampInfo({ timestamp: data.textTimestamp });
//                 if (!resValid.valid) {
//                     errors.push(`data.textTimestamp (${data.textTimestamp}) is not a valid timestamp: ${resValid.emsg}`);
//                 }
//             } else {
//                 errors.push("data.textTimestamp must be a string.");
//             }
//         } else {
//             // why would this be falsy?
//             console.warn(`${lc} data.textTimestamp not provided. (W: genuuid)`);
//         }

//         if (data.timestamp) {
//             if (typeof data.timestamp === 'string') {
//                 const resValid = getTimestampInfo({ timestamp: data.timestamp });
//                 if (!resValid.valid) {
//                     errors.push(`data.timestamp (${data.timestamp}) is not a valid timestamp: ${resValid.emsg}`);
//                 }
//             } else {
//                 errors.push("data.timestamp must be a string.");
//             }
//         } else {
//             // why would this be falsy?
//             console.warn(`${lc} data.timestamp not provided. (W: genuuid)`);
//         }

//         return errors.length > 0 ? errors : undefined;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         return [`Unexpected error during validation: ${extractErrorMsg(error)} (E: genuuid)`];
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }

// }

// /**
//  * Validates a ProjectIbGib_V1 intrinsically, its data, and the consistency
//  * between the ib string and the data content.
//  * Returns an array of error messages if invalid, otherwise undefined.
//  */
// export async function validateProjectIbGib_V1({
//     ibGib,
// }: {
//     ibGib: IbGib_V1;
// }): Promise<string[] | undefined> {
//     const lc = `[${validateProjectIbGib_V1.name}]`;
//     const allErrors: string[] = [];
//     try {
//         if (logalot) { console.log(`${lc} starting...`); }
//         if (!ibGib) {
//             allErrors.push('ibGib is required.');
//             return allErrors;
//         }

//         // 1. Basic intrinsic validation (ib, gib, data, rel8ns presence, gib calc)
//         const intrinsicErrors = await validateIbGibIntrinsically({ ibGib }) ?? [];
//         if (intrinsicErrors.length > 0) {
//             return intrinsicErrors; /* <<<< returns early */
//         }

//         const dataErrors = validateProjectData_V1({ data: ibGib.data as ProjectData_V1 }) ?? [];
//         dataErrors.forEach(x => allErrors.push(x));

//         const ibErrors = validateProjectIb({ ib: ibGib.ib }) ?? [];
//         ibErrors.forEach(x => allErrors.push(x));

//         // not doing this for now
//         const rel8nsErrors = [];
//         rel8nsErrors.forEach(x => allErrors.push(x));

//         return allErrors.length > 0 ? allErrors : undefined;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)} (E: genuuid)`);
//         // Return validation data indicating an unexpected error occurred
//         return [`Unexpected error during validation: ${extractErrorMsg(error)} (E: genuuid)`];
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Type guard to check if an object conforms to ProjectData_V1 structure.
//  */
// export function isProjectData_V1(data: any): data is ProjectData_V1 {
//     const lc = `[${isProjectData_V1.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 959a0308e86d328cb1e68aab8385df25)`); }

//         const errors = validateProjectData_V1({ data }) ?? [];
//         return errors.length === 0;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         return false;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Type guard to check if an IbGib_V1 is structurally a ProjectIbGib_V1.
//  * Verifies the atom in the ib and checks data structure using isProjectData_V1.
//  */
// export function isProjectIbGib_V1(ibGib: IbGib_V1): ibGib is ProjectIbGib_V1 {
//     if (!ibGib || !ibGib.ib || !ibGib.data) { return false; }
//     // Check if atom is 'project'
//     if (!ibGib.ib.startsWith(`${PROJECT_ATOM} `)) { return false; }
//     // Check data structure
//     return isProjectData_V1(ibGib.data);
// }

// /**
//  * Creates a new Project ibGib.
//  */
// export async function createProjectIbGib({
//     name,
//     srcCommentIbGib,
//     description,
//     saveInSpace,
//     space,
// }: {
//     name: string;
//     /**
//      * NOT implemented yet
//      */
//     srcCommentIbGib?: CommentIbGib_V1,
//     description?: string;
//     /**
//      * If true, saves the newly created project ibgib and all intermediate
//      * dependency ibgibs (dna and others) in the given {@link space}, or default
//      * local space if that is falsy.
//      */
//     saveInSpace?: boolean;
//     /**
//      * If set and {@link saveInSpace} is true, then this will be where all
//      * ibgibs are saved.
//      */
//     space?: IbGibSpaceAny;
// }): Promise<TransformResult<ProjectIbGib_V1>> {
//     const lc = `[${createProjectIbGib.name}]`;
//     if (logalot) { console.log(`${lc} starting...`); }
//     try {
//         if (!name) { throw new Error(`${lc}  required. (E: genuuid)`); }

//         // start with a comment ibgib as the genesis of the project.
//         let resSrcCommentIbGib: TransformResult<CommentIbGib_V1> | undefined = undefined;
//         if (!srcCommentIbGib) {
//             resSrcCommentIbGib = await createCommentIbGib({
//                 text: [
//                     `# ${name}`,
//                     ``,
//                     description ?? `initial comment`, // a little programming humor
//                 ].join('\n'),
//                 saveInSpace,
//                 space,
//             });
//             srcCommentIbGib = resSrcCommentIbGib.newIbGib;
//         }

//         const safeName = getSaferSubstring({
//             text: name,
//             length: DEFAULT_PROJECT_SAFE_NAME_LENGTH,
//         });

//         const resNewProjectFork = await fork({
//             src: srcCommentIbGib,
//             destIb: `${PROJECT_ATOM} ${safeName}`, // will do the full destIb in the next mut8 step
//             cloneData: true,
//             cloneRel8ns: true,
//             tjp: { uuid: true, timestamp: true },
//             dna: true,
//             nCounter: true,
//         }) as TransformResult<CommentIbGib_V1>;

//         // we now have an intermediate ibgib that is essentially a clone of the
//         // src comment but with new tjp/timestamp metadata. We need to convert
//         // this to a project ibgib.

//         const now = new Date();
//         const timestamp = getTimestamp(now);
//         const timestampMs = now.getMilliseconds();
//         /**
//          * This drives the project.ib, but may not be 100% the final data. But
//          * the pieces that drive the ib should be accurate.
//          */
//         const fullNewDataSortOf: ProjectData_V1 = {
//             ...resNewProjectFork.newIbGib.data!,
//             timestamp, timestampMs,
//             name,
//             description,
//         }
//         const newIb = getProjectIb({ data: fullNewDataSortOf });
//         if (logalot) { console.log(`${lc} newIb: ${newIb}. (I: 60804a0c0e575d525855926a9712d825)`); }

//         const dataToAddOrPatch: Partial<ProjectData_V1> = {
//             ...resNewProjectFork.newIbGib.data,
//             timestamp, timestampMs,
//             name,
//             description,
//         };
//         if (logalot) { console.log(`${lc} dataToAddOrPatch: ${pretty(dataToAddOrPatch)} (I: 70129a2aeaa4e9df5d42137c479f4f25)`); }

//         /**
//          * finalizes the new project (not forever, but in terms of this fn)
//          */
//         const resNewProjectMut8 = await mut8({
//             src: resNewProjectFork.newIbGib,
//             mut8Ib: newIb,
//             dataToAddOrPatch,
//             noTimestamp: true,
//             dna: true,
//             nCounter: true,
//         }) as TransformResult<ProjectIbGib_V1>;
//         if (logalot) { console.log(`${lc} resNewProjectMut8.newIbGib: ${pretty(resNewProjectMut8.newIbGib)} (I: c0bca72cced2edbe69956774c09ad925)`); }

//         /**
//          * depending on if we created our own new srcCommentIbGib, contains all the
//          * newly created ibgibs required for the new project.
//          */
//         let resNewProject: TransformResult<ProjectIbGib_V1>;
//         if (resSrcCommentIbGib) {
//             // had to do a comment ibgib, so merge the transform results
//             resNewProject = {
//                 newIbGib: resNewProjectMut8.newIbGib,
//                 intermediateIbGibs: [
//                     ...resSrcCommentIbGib.intermediateIbGibs ?? [],
//                     resSrcCommentIbGib.newIbGib,
//                     ...resNewProjectFork.intermediateIbGibs ?? [],
//                     resNewProjectFork.newIbGib,
//                     ...resNewProjectMut8.intermediateIbGibs ?? [],
//                 ],
//                 dnas: [
//                     ...resSrcCommentIbGib.dnas ?? [],
//                     ...resNewProjectFork.dnas ?? [],
//                     ...resNewProjectMut8.dnas ?? [],
//                 ],
//             };
//         } else {
//             // had to do a comment ibgib, so merge the transform results
//             resNewProject = {
//                 newIbGib: resNewProjectMut8.newIbGib,
//                 intermediateIbGibs: [
//                     ...resNewProjectFork.intermediateIbGibs ?? [],
//                     resNewProjectFork.newIbGib,
//                     ...resNewProjectMut8.intermediateIbGibs ?? [],
//                 ],
//                 dnas: [
//                     ...resNewProjectFork.dnas ?? [],
//                     ...resNewProjectMut8.dnas ?? [],
//                 ],
//             };
//         }

//         if (saveInSpace) {
//             if (!space) {
//                 throw new Error(`(UNEXPECTED) saveInSpace true but space falsy? (E: 492e86a326fd099f4d28a5286809d625)`);
//             }
//             await persistTransformResult({ resTransform: resNewProject, space });
//         }

//         return resNewProject;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// interface AddChildOptsDetails_Text {
//     type: 'text';
//     title?: string;
//     text?: string;
// }
// interface AddChildOptsDetails_Canvas {
//     wakka: string
// }

// /**
//  * discriminate union other options here
//  */
// type AddChildOptsDetails = AddChildOptsDetails_Text | AddChildOptsDetails_Canvas;

// interface AddChildOpts<TDetails extends AddChildOptsDetails = any> {
//     type: 'text';
//     ibGib: IbGib_V1;
//     details: TDetails;
//     /**
//      * rel8nName to use to rel8 the child to the ibgib.
//      */
//     rel8nName?: string;
//     metaspace: MetaspaceService;
//     space: IbGibSpaceAny;
// }


// export function addChildIbGib(arg: AddChildOpts): Promise<IbGib_V1> {
//     const lc = `[${addChildIbGib.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 1d5cb8453e5a9e49bffd923da9c90825)`); }

//         switch (arg.type) {
//             case 'text':
//                 return addChildIbGib_text(arg);
//             default:
//                 throw new Error(`(UNEXPECTED) invalid add child type (${arg.type})? (E: bde41e94cb88a66aee56e2cfd4c88825)`);
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// async function addChildIbGib_text({
//     ibGib,
//     rel8nName,
//     details,
//     metaspace,
//     space,
// }: AddChildOpts<AddChildOptsDetails_Text>): Promise<IbGib_V1> {
//     const lc = `[${addChildIbGib_text.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

//         let { title, text } = details;

//         text ??= '';

//         title ||= 'SomeText';
//         rel8nName ||= PROJECT_CHILD_DEFAULT_REL8N_NAME;

//         // create the comment ibgib
//         const resCommentIbGib = await createCommentIbGib({
//             text,
//             addlMetadataText: `${getTimestampInTicks()}_${getSaferSubstring({ text: title, length: 16 })}`,
//             saveInSpace: true,
//             space,
//         });
//         let commentIbGib = resCommentIbGib.newIbGib;
//         commentIbGib = await mut8Timeline({
//             timeline: commentIbGib,
//             mut8Opts: {
//                 dataToAddOrPatch: { title, description: title, },
//             },
//             metaspace,
//             space,
//         });

//         if (!ibGib) { throw new Error(`(UNEXPECTED) ibGib falsy? should be a project ibgib (E: genuuid)`); }
//         if (!isProjectIbGib_V1(ibGib)) { throw new Error(`(UNEXPECTED) ibGib is not a project ibgib? (E: genuuid)`); }

//         // append the comment to the project's timeline
//         const newTimeline = await appendToTimeline({
//             timeline: ibGib,
//             rel8nInfos: [{ ibGibs: [commentIbGib], rel8nName }],
//             metaspace,
//             space,
//         });

//         return newTimeline;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }


// /**
//  * Retrieves all the latest project ibGibs from a given space (or the default
//  * local user space).
//  */
// export async function getProjects({
//     metaspace,
//     space,
// }: {
//     metaspace: MetaspaceService;
//     space?: IbGibSpaceAny;
// }): Promise<ProjectIbGib_V1[]> {
//     const lc = `[${getProjects.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting...`); }

//         // prepare space info
//         space ??= await metaspace.getLocalUserSpace({ lock: false });
//         if (!space) { throw new Error(`(UNEXPECTED) space falsy and couldn't even get default local user space? (E: ca5d383873a8ff9068709c7a39e67625)`); }
//         const { spaceId } = parseSpaceIb({ spaceIb: space.ib });

//         // get all project agents
//         const agentsSvc = getAgentsSvc();
//         const projectAgents = await agentsSvc.getAgents({
//             metaspace,
//             type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTAGENT,
//             spaceId,
//         });

//         // build up the list of projectTjpAddrs from the agents
//         const projectTjpAddrs: IbGibAddr[] = [];
//         for (const projectAgent of projectAgents) {
//             if (!projectAgent.data) { throw new Error(`(UNEXPECTED) projectAgent.data falsy? (E: 53256c9d2168fdf37b0cf5688b11b625)`); }
//             const projectTjpAddr = projectAgent.data['@currentContextTjpAddr'];
//             if (projectTjpAddr) {
//                 projectTjpAddrs.push(projectTjpAddr);
//             } else {
//                 console.warn(`${lc} projectAgent (${getIbGibAddr({ ibGib: projectAgent })}) has no @currentContextTjpAddr (W: 29c4d8d251945597086f4de8001bc825)`);
//             }
//         }
//         const uniqueTjpAddrs = unique(projectTjpAddrs);
//         if (uniqueTjpAddrs.length === 0) {
//             if (logalot) { console.log(`${lc} No project agents found with space (${space.ib}). Returning empty array. (I: cbc626e97598562d12b483d468082825)`); }
//             return []; /* <<<< returns early */
//         }

//         // get the latest addrs corresponding to those tjp addrs.
//         const resLatestIbGib = await getLatestAddrs({
//             addrs: uniqueTjpAddrs,
//             space,
//         });
//         if (!resLatestIbGib.data) { throw new Error(`(UNEXPECTED) resLatestIbGib.data falsy? (E: 0dc6f8692c02cef4112642184de79225)`); }
//         if (resLatestIbGib.data.errors && resLatestIbGib.data.errors.length > 0) {
//             console.error(`${lc} Error getting latest tjp addrs for projects: ${resLatestIbGib.data.errors}. addrsErrored: ${resLatestIbGib.data.addrsErrored ?? '[addrsErrored falsy?]'} (E: 9ee4e8a3329b464d280e3fb8318a6825)`);
//             if (resLatestIbGib.data.addrsErrored && resLatestIbGib.data.addrsErrored.length === uniqueTjpAddrs.length) {
//                 // all of them errored, so return an empty array
//                 throw new Error(`all project addrs errors. (E: 942bc8f6920865be18f09c98e06f9825)`);
//             } else {
//                 console.warn(`${lc} not all project addrs errored, so we're returning the ones we *were* able to get. addrsErrored: ${resLatestIbGib.data.addrsErrored ?? '[addrsErrored falsy?]'}(W: 20bc481170085fc3b8011f2ce50f9825)`)
//             }
//         }
//         const latestAddrsMap = resLatestIbGib.data.latestAddrsMap;
//         if (!latestAddrsMap) {
//             throw new Error(`(UNEXPECTED) resLatestIbGib.data.latestAddrsMap falsy? this should have contained the latest project addrs. returning empty array. (E: d89fe88d7488d1aaf8618b38db1aa825)`);
//         }
//         const latestAddrs: IbGibAddr[] = [];
//         for (let [addr, latestAddr] of Object.entries(latestAddrsMap)) {
//             latestAddrs.push(latestAddr ?? addr);
//         }

//         // get the actual ibgibs corresponding to the latest addrs
//         const resGet = await metaspace.get({
//             addrs: latestAddrs,
//             space,
//         });
//         if (resGet.errorMsg || (resGet.ibGibs ?? []).length !== latestAddrs.length) {
//             if ((resGet.ibGibs ?? []).length === 0) {
//                 throw new Error(`error in getting latest project ibgibs. (E: 3b2878e08db8b296e11463669d523825)`);
//             } else {
//                 console.error(`${lc} get project ibgibs had errors, but we did get some of the project ibgibs. resGet.errorMsg: ${resGet.errorMsg ?? '[unknown error (E: 733358e3894819cbd8364db8c5ac2725)]'}. (E: 24fcf830893ffadd78eaabd839103825)`);
//             }
//         }
//         const latestProjectIbGibs: ProjectIbGib_V1[] = [];
//         const ibGibsUnknownType = resGet.ibGibs!;
//         for (const ibGibUnknownType of ibGibsUnknownType) {
//             if (isProjectIbGib_V1(ibGibUnknownType)) {
//                 latestProjectIbGibs.push(ibGibUnknownType);
//             } else {
//                 console.error(`${lc} ibgib gotten (${getIbGibAddr({ ibGib: ibGibUnknownType })}) is NOT a ProjectIbGib_V1. (E: 656f18145928cca6481c4ee8547c0825)`);
//             }
//         }

//         // return them!
//         return latestProjectIbGibs;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         // We probably don't want to throw here, as it could break a UI component.
//         // Returning an empty array is safer for rendering.
//         return [];
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
