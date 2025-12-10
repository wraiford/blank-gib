// import { Content, FunctionCall, FunctionCallPart, FunctionResponse, FunctionResponsePart, TextPart } from "@google/generative-ai";
// import type { GoogleGenerativeAI, ModelParams } from "@google/generative-ai";

// import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { isComment, } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";

// import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
// import { getAllFunctionInfos } from "../../../api/api-index.mjs";
// import { APIFunctionInfo } from "../../../api/api-types.mjs";
// import { PromptInfo, } from "../agent-one-file.mjs";
// import { FUNCTION_CALL_REQUEST_COMMENT_TAG, TextSource, } from "../agent-constants.mjs";
// import { FunctionResponsePart_ResponseWrapper, PromptInfoEntryGemini, PromptInfoGemini } from "./gemini-types.mjs";
// import { FunctionInfoIbGib_V1 } from "../function-info/function-info-one-file.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// export function textSourceToGeminiRole(src: TextSource): string {
//     switch (src) {
//         case TextSource.HUMAN:
//             return 'user';
//         case TextSource.AI:
//             return 'model';
//         case TextSource.FUNCTION:
//             return 'function';
//         case TextSource.HARDCODED:
//             return 'user';
//         case TextSource.UNKNOWN:
//             return 'user';
//         default:
//             throw new Error(`(UNEXPECTED) src is not a valid TextSource? src: ${src} (E: 9d954fe0bc49cf4572a65b19b6173925)`);
//     }
// }
// // export function geminiRoleToTextSource(geminiRole: 'user' | 'model' | ''): TextSource {
// //     if (geminiRole === 'user') {
// //         return TextSource.HUMAN;
// //     } else if (geminiRole === 'model') {
// //         return TextSource.AI;
// //     } else {
// //         return TextSource.UNKNOWN;
// //     }
// // }

// export function isPromptInfoGemini(info: PromptInfo): info is PromptInfoGemini {
//     return info.api === 'gemini';
// }

// /**
//  * gemini api-specific helper that maps gemini function call returned from the
//  * model to our API function info interface
//  */
// export function geminiFunctionCallToAPIFunctionInfo({
//     functionCall,
// }: {
//     functionCall: FunctionCall
// }): { info: APIFunctionInfo, args: any } {
//     const lc = `[${geminiFunctionCallToAPIFunctionInfo.name}]`;
//     const functionInfo = getAllFunctionInfos().get(functionCall.name);
//     if (!functionInfo) {
//         throw new Error(`${lc} no APIFunctionInfo found matching name: ${functionCall.name} (E: 7c5c7c17988a666a86e72299630c7f25)`);
//     }
//     return {
//         info: functionInfo,
//         args: functionCall.args ?? undefined,
//     };
// }

// /**
//  * Takes 0 or more entries and combines them into a single {@link Content}
//  * object that Gemini API expects for `systemInstruction` when using the fn
//  * {@link GoogleGenerativeAI.getGenerativeModel} (@see {@link ModelParams}).
//  *
//  * @param entries for system instruction, probably from {@link AgentWitnessGemini_V1.systemPromptParts}
//  * @returns undefined if no entries, else single Gemini API Content object with role === "user" and combined parts from {@link systemPromptEntries}
//  */
// export function systemPromptEntriesToSystemInstructionContent({
//     systemPromptEntries,
// }: {
//     systemPromptEntries: PromptInfoEntryGemini[],
// }): Content | undefined {
//     const lc = `[${systemPromptEntriesToSystemInstructionContent.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 18693a97427939699285ef8c1a9cc425)`); }

//         if (systemPromptEntries.length === 0) { return undefined; /* <<<< returns early */ }
//         if (!systemPromptEntries.every(entry => entry.src === TextSource.HUMAN)) {
//             if (logalot) { console.warn(`${lc} not every system entry's src is human. We're still going to say that these are "user" origin in Gemini API. (W: 7115e2be876498ecb1e153c79a86e125)`); }
//         }
//         const sysInstructionContent: Content = {
//             role: "user",
//             parts: systemPromptEntries.flatMap(entry => entry.content.parts),
//         };
//         if (logalot) { console.log(`${lc} sysInstructionContent: ${pretty(sysInstructionContent)} (I: 011e5b865c23eb0b640df3f464ac2525)`); }
//         return sysInstructionContent;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * helper function (not a guard) that determines if the given ibgib has the
//  * expected shape of a Function Call Request comment (FCR).
//  *
//  * These objects are created when a model requests a function call.
//  *
//  * ATOW (01/2025) these FCRs should include both one or more infos for both
//  * function calls and function responses.
//  */
// export function isFunctionCallRequestComment({ ibGib }: { ibGib: IbGib_V1 }): boolean {
//     const lc = `[${isFunctionCallRequestComment.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 986d3edcd4f3aaf1d7eb0f8b59206b25)`); }

//         if (!ibGib) {
//             if (logalot) { console.warn(`${lc} ibGib falsy. (W: a70390e8bc3f420a92d3a84f4c78f12a)`); }
//             return false; /* <<<< returns early */
//         }
//         if (!isComment({ ibGib })) {
//             if (logalot) { console.log(`${lc} not a comment ibgib (I: 6a62c4f6e13776616855c4f237a5206b)`); }
//             return false; /* <<<< returns early */
//         }
//         if (!ibGib.data) {
//             if (logalot) { console.log(`${lc} ibGib.data falsy (I: 69eb86975640475395bb74944141a46d)`); }
//             return false; /* <<<< returns early */
//         }

//         const { text } = ibGib.data;
//         if (!text) {
//             if (logalot) { console.log(`${lc} text falsy (I: e348e38c841b4443b3f09e75c0215b24)`); }
//             return false; /* <<<< returns early */
//         }

//         if (text.includes(FUNCTION_CALL_REQUEST_COMMENT_TAG)) {
//             if (logalot) { console.log(`${lc} has tag. returning true. (I: 6d76b27d558d44f696582f41af561f29)`); }
//             return true;
//         }
//         // let { safeIbCommentMetadataText } = parseCommentIb({ ib: ibGib.ib });
//         // if (safeIbCommentMetadataText && safeIbCommentMetadataText.includes(FUNCTION_INFO_ATOM)) {
//         //  return true;
//         // }

//         if (logalot) { console.log(`${lc} no indicator found. returning false. (I: 815f181a0a08058362f76b08a8964674)`); }

//         return false;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }


// /**
//  * Helper function to create Gemini API FunctionCallPart and FunctionResponsePart
//  * objects from a FunctionInfoIbGib_V1.
//  *
//  * @param {object} arg - Arguments object.
//  * @param {FunctionInfoIbGib_V1} arg.functionInfoIbGib - The FunctionInfoIbGib_V1 instance containing function call details.
//  * @returns {{ call: FunctionCallPart; response: FunctionResponsePart }} - An object containing both FunctionCallPart and FunctionResponsePart objects.
//  * @throws {Error} If there's an error during the process, such as missing function name or arguments.
//  */
// export function getFunctionCallAndResponseParts({
//     functionInfoIbGib,
// }: {
//     functionInfoIbGib: FunctionInfoIbGib_V1,
// }): { call: FunctionCallPart, response: FunctionResponsePart } {
//     const lc = `[${getFunctionCallAndResponseParts.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 1a2b3c4d5e6f7a8b)`); }

//         if (!functionInfoIbGib) {
//             throw new Error(`${lc} functionInfoIbGib parameter is required. (E: 9c8f7a3b2d1e4a5b6c7d8e9f)`);
//         }
//         if (!functionInfoIbGib.data) {
//             throw new Error(`${lc} functionInfoIbGib.data is required. (E: 2b3c4d5e6f7a8b1c2d3e4f5a)`);
//         }

//         const { fnName, fnArgs, fnResult } = functionInfoIbGib.data;

//         if (!fnName) {
//             throw new Error(`${lc} functionInfoIbGib.data.fnName is required. (E: 6f7a8b1c2d3e4f5a6b7c8d9e)`);
//         }

//         // 1. Create FunctionCallPart
//         const functionCallPart: FunctionCallPart = {
//             functionCall: {
//                 name: fnName,
//                 args: fnArgs ?? {}, // Use empty object if fnArgs is not provided
//             } as FunctionCall,
//         } satisfies FunctionCallPart;


//         // 2. Create FunctionResponsePart
//         const responseWrapper: FunctionResponsePart_ResponseWrapper = {
//             value: fnResult,
//         };
//         const functionResponsePart: FunctionResponsePart = {
//             functionResponse: {
//                 name: fnName,
//                 response: responseWrapper, // Use empty object if fnResult is not provided
//             } as FunctionResponse,
//         } satisfies FunctionResponsePart;

//         return { call: functionCallPart, response: functionResponsePart };

//     } catch (error) {
//         console.error(`${lc} Error: ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
