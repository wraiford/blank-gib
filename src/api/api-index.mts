// import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

// import { GLOBAL_LOG_A_LOT } from "../constants.mjs";
// import { APIFunctionInfo } from "./api-types.mjs";

// const logalot = GLOBAL_LOG_A_LOT || true;

// let AllFunctionInfos: Map<string, APIFunctionInfo<any>> = new Map();
// // /**
// //  * Map of all available API functions for agents.
// //  *
// //  * NOTE: Any and all functions should be added to this.
// //  */
// // // export const AllFunctionInfos: { [nameOrId: string]: APIFunctionInfo<any> } = {
// // //     ...RenderAgentFunctionInfos.reduce((acc, info) => ({ ...acc, [info.nameOrId]: info }), {}),
// // // }
// // export const AllFunctionInfos: Map<string, APIFunctionInfo<any>> = new Map([
// //     ...ChatAPIFunctionInfos,
// //     ...TextAPIFunctionInfos,

// //     fetchWeb1PageFunctionInfo,

// //     ...RenderAgentFunctionInfos,
// //     ...ProjectFunctionInfos,
// //     ...UIAgentFunctionInfos,
// //     ...IbGibAPIFunctionInfos,
// //     ...MinigameFunctionInfos,
// // ].map(x => [x.nameOrId, x]));

// let DeprecatedFunctionInfoNames: string[] = [];

// // export const DeprecatedFunctionInfoNames: string[] = [
// //     'minigameBuilderAddStimuli',
// //     // 'minigameBuilderEditStimuli', // debug only...this is a valid function and this needs to be removed from this list. i'm just trying to cause the prune action to happen for debugging.
// // ];

// export function getAllFunctionInfos(): Map<string, APIFunctionInfo<any>> {
//     const lc = `[${getAllFunctionInfos.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: a5cf5821b42e1c71182dd61431977e25)`); }
//         return AllFunctionInfos;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function getDeprecatedFunctionInfoNames(): string[] {
//     const lc = `[${getDeprecatedFunctionInfoNames.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 82c9a8fc91d8121fb843af32e76c2e25)`); }
//         return DeprecatedFunctionInfoNames;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function registerDeprecatedFunctionInfoName({
//     nameOrId,
// }: {
//     nameOrId: string,
// }): void {
//     const lc = `[${registerDeprecatedFunctionInfoName.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 7519b74f49fc1d0e7b65e1ef28974225)`); }
//         if (!DeprecatedFunctionInfoNames.includes(nameOrId)) {
//             DeprecatedFunctionInfoNames.push(nameOrId);
//             if (AllFunctionInfos.has(nameOrId)) {
//                 console.warn(`${lc} AllFunctionInfos contained deprecated function name (${nameOrId}). Removing from active AllFunctionInfos, but really this should not have been added as the deprecated name should have happened first. (W: fcb5681023987f258777ea18cdb90325)`);
//                 AllFunctionInfos.delete(nameOrId);
//             }
//         } else {
//             console.warn(`${lc} name (${nameOrId}) already in DeprecatedFunctionInfoNames. Skipping add. (W: 6710621153282dd78c9c4aaaa4173a25)`);
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function registerFunctionInfos({
//     functionInfos,
// }: {
//     functionInfos: Map<string, APIFunctionInfo<any>>,
// }): void {
//     const lc = `[${registerFunctionInfos.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 14fee8e27384a040494542182031ae25)`); }
//         if (functionInfos.size === 0) { console.warn(`${lc} empty functionInfos? (W: 97fcb8fc47689bc418893c09a16a2525)`); }
//         for (const [nameOrId, functionInfo] of functionInfos) {
//             if (!DeprecatedFunctionInfoNames.includes(nameOrId)) {
//                 AllFunctionInfos.set(nameOrId, functionInfo);
//             } else {
//                 if (logalot) { console.log(`${lc} functionInfo.nameOrId (${nameOrId}) is deprecated. Skipping add. (I: 3256eadf54f8087088a704798e2fd825)`); }
//             }
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
