// import {
//     extractErrorMsg, getTimestamp, getTimestampInTicks,
// } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { UUID_REGEXP } from '@ibgib/helper-gib/dist/constants.mjs';
// import { Ib, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
// import { IbGibData_V1, IbGibRel8ns_V1, IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
// import { Factory_V1 } from '@ibgib/ts-gib/dist/V1/factory.mjs';
// import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
// import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
// import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
// import { getTimestampInfo } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';

// import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
// import { AgentAPI } from '../agent-types.mjs';

// const logalot = GLOBAL_LOG_A_LOT;

// /**
//  * used as a rel8nName to link a Function Call Request (FCR) comment ibgib to
//  * the actual function call info ibgibs that represent each FCR.
//  */
// export const FUNCTION_INFO_REL8N_NAME = 'function_info';

// export const FUNCTION_INFO_ATOM = 'function_info';

// /**
//  * @interface FunctionInfoIbInfo - Type for parsed function info ib.
//  * Used by parseFunctionInfoIb
//  */
// export interface FunctionInfoIbInfo {
//     atom: string;
//     timestampInTicks: string;
//     model: string;
//     api: AgentAPI;
//     agentId: string;
// }

// /**
//  * builds the function info ibgib's ib based on given {@link data}
//  * @see {@link parseFunctionInfoIb}
//  */
// export function getFunctionInfoIb({
//     data,
// }: {
//     /** function info data, should be valid */
//     data: FunctionInfoData_V1,
// }): string {
//     const lc = `[${getFunctionInfoIb.name}]`;
//     const { model, api, agentId, timestamp, } = data;
//     if (!model) { throw new Error(`${lc} data.model falsy (E: 6f47a28c0a8a45d794149c83e8f27e25)`); }
//     if (!api) { throw new Error(`${lc} data.api falsy (E: a0a812508a952a87c619d38084b7e325)`); }
//     if (!agentId) { throw new Error(`${lc} data.agentId falsy (E: ac35c1592c458e2c0e5908f6a9a3e525)`); }
//     const timestampInTicks = getTimestampInTicks(timestamp);
//     const fields: string[] = [model, api, agentId, timestampInTicks];
//     if (fields.some(x => x.includes(' '))) { throw new Error(`invalid data. ib must not contain spaces (E: 36a56e4685163848458be06f51d4ad25)`); }

//     return [
//         FUNCTION_INFO_ATOM,
//         timestampInTicks,
//         model,
//         api,
//         agentId,
//     ].join(' ');
// }

// /**
//  * @returns parsed info from an ib
//  * @see {@link getFunctionInfoIb}
//  */
// export function parseFunctionInfoIb({
//     ib,
// }: {
//     ib: Ib,
// }): FunctionInfoIbInfo {
//     const lc = `[${parseFunctionInfoIb.name}]`;
//     /** getFunctionInfoIb must match parseFunctionInfoIb. If this array changes, change the other one. */
//     const [
//         atom,
//         timestampInTicks,
//         model,
//         api,
//         agentId,
//     ] = ib.split(' ');
//     if (atom !== FUNCTION_INFO_ATOM) { throw new Error(`invalid ib. first term expected to e an atom: ${FUNCTION_INFO_ATOM} (E: 3c01d42035d2e32c4bfd5c1bf363f725)`); }

//     return { atom, timestampInTicks, model, api: api as AgentAPI, agentId };
// }

// /**
//  * Validates a `FunctionInfoIb` and returns a list of any errors.
//  *
//  * @param {object} arg - Options for validating the `ib`.
//  * @param {string} arg.ib - `ib` to validate.
//  * @returns {string[]} - list of validation errors or an empty array if valid.
//  */
// export function validateFunctionInfoIb({
//     ib,
// }: {
//     ib: Ib,
// }): string[] {
//     const lc = `[${validateFunctionInfoIb.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting...`); }

//         const errors: string[] = [];
//         let parsed: FunctionInfoIbInfo;

//         try {
//             parsed = parseFunctionInfoIb({ ib });
//         } catch (error: any) {
//             errors.push(`${lc} error parsing ib: ${extractErrorMsg(error)} (E: a1c09537f9f6485427c30b74d27c9a25)`);
//             return errors; /* <<<< returns early if parsing fails */
//         }

//         const {
//             atom,
//             timestampInTicks,
//             model,
//             api,
//             agentId,
//         } = parsed;

//         if (atom !== FUNCTION_INFO_ATOM) {
//             errors.push(`${lc} invalid ib. atom is expected to be FUNCTION_INFO_ATOM: ${FUNCTION_INFO_ATOM} (E: a9812bffc18f44418aa091fb0ed260bd)`)
//         }

//         // timestampInTicks
//         if (timestampInTicks === 'undefined') {
//             // this happens when it's a binary ibgib or just doesn't have a timestamp in the data map
//             errors.push(`invalid ib. timestampInTicks is falsy (E: 0985656eb2084046a43845a8f9d47d25)`)
//         } else {
//             const timestampInfo = getTimestampInfo({ timestamp: timestampInTicks });
//             if (!timestampInfo.valid) {
//                 errors.push(`invalid ib. pieces[3] should be valid timestampInTicks. emsg: (${timestampInfo.emsg}) (E: 06dae01d66f54f54b71d9c920c730840)`);
//             }
//         }
//         if (!model) {
//             errors.push(`invalid ib. model is falsy (E: 654678f3a1e86f0c9811b8a3749d4e25)`);
//         }
//         if (!api) {
//             errors.push(`invalid ib. api is falsy (E: a20c879391850c9396e13f27e8469025)`);
//         }

//         if (agentId) {
//             if (!agentId.match(UUID_REGEXP)) {
//                 errors.push(`invalid ib. agentId does not match expected UUID_REGEXP: ${UUID_REGEXP} (E: 3e7a70c28190777178693150563d6725)`)
//             }
//         } else {
//             errors.push(`invalid ib. agentId is falsy (E: 9b5c4d2f74698557e2c1173947e35e25)`);
//         }

//         return errors;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Information required when creating an info ibgib.
//  *
//  * ATOW (01/2025) Note that this does NOT save the ibgib in any spaces.
//  */
// export interface CreateFunctionInfoIbGibArgs {
//     /**
//      * raw string of the function call requested by the model.
//      */
//     fnRawRequest: string;
//     /**
//      * which api (e.g. 'gemini') was used when generating the function call
//      * request.
//      * @see {@link model}
//      * @see {@link FunctionInfoData_V1.api}
//      */
//     api: AgentAPI;
//     /**
//      * model that generated the request
//      * @see {@link api}
//      * @see {@link FunctionInfoData_V1.model}
//      */
//     model: string;
//     /**
//      * id of the agent that this will be associated with
//      */
//     agentId: string;
//     /**
//      * name of the function.
//      *
//      * in gemini, this should be provided easily and we shouldn't need a regex for it.
//      */
//     fnName: string;
//     /**
//      * parsed args from the raw request string
//      */
//     fnArgs: any;
//     /**
//      * the result of a successful functionImpl, otherwise undefined.
//      * @see {@link FunctionInfoData_V1.fnResult}
//      */
//     fnResult?: any;
//     /**
//      * flag that indicates if the function completed successfully.
//      * @see {@link FunctionInfoData_V1.fnComplete}
//      */
//     fnComplete?: boolean;
//     /**
//      * This is the error msg if there was an error actually parsing the raw
//      * function info.
//      * @see {@link execErrorMsg}
//      */
//     parseErrorMsg?: string;
//     /**
//      * This is the error msg if there was an error actually executing the
//      * function.
//      * @see {@link parseErrorMsg}
//      */
//     execErrorMsg?: string;
//     /**
//      * corresponds to whether or not the model wanted to be notified upon function completion/error.
//      * @see {@link FunctionInfoData_V1.repromptWithResult}
//      */
//     repromptWithResult?: boolean;
//     /**
//      * should we save the newly created ibgib and its dependency graph?
//      * @see {@link metaspace}
//      */
//     saveInSpace?: boolean;
//     /**
//      * if {@link saveInSpace}, this is the required metaspace to handle saving.
//      * @see {@link space}
//      */
//     metaspace?: MetaspaceService;
//     /**
//      * if {@link saveInSpace}, this is the required space in which to save.
//      * @see {@link metaspace}
//      */
//     space?: IbGibSpaceAny;
// }

// /**
//  * Creates a new FunctionInfoIbGib_V1 object.
//  *
//  * @param {object} arg - Arguments for creating the new ibgib
//  * @returns {Promise<FunctionInfoIbGib_V1>} A promise that resolves to the new FunctionInfoIbGib_V1 object.
//  * @throws {Error} If there is an error during ibgib creation.
//  */
// export async function createFunctionInfoIbGib(arg: CreateFunctionInfoIbGibArgs): Promise<TransformResult<FunctionInfoIbGib_V1>> {
//     const lc = `[${createFunctionInfoIbGib.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: f4c9f0810a4d877f676297f6e6a96825)`); }
//         let {
//             fnRawRequest, api, model, agentId,
//             fnName, fnArgs,
//             fnResult, fnComplete,
//             parseErrorMsg, execErrorMsg,
//             repromptWithResult,
//             saveInSpace, metaspace, space,
//         } = arg;

//         const date = new Date();
//         const data: FunctionInfoData_V1 = {
//             name: model,
//             timestamp: getTimestamp(date),
//             timestampMs: date.getMilliseconds(),
//             agentId,
//             api, model,
//             fnRawRequest,
//             fnName, fnArgs,
//             fnResult, fnComplete,
//             repromptWithResult,
//         };
//         if (parseErrorMsg) { data.parseErrorMsg = parseErrorMsg };
//         if (execErrorMsg) { data.execErrorMsg = execErrorMsg };
//         const ib = getFunctionInfoIb({ data });

//         const resFunctionInfo = await Factory_V1.firstGen({
//             ib,
//             parentIbGib: Factory_V1.primitive({ ib: FUNCTION_INFO_ATOM }),
//             data,
//             nCounter: true, dna: true,
//             tjp: { uuid: true, }, // no timestamp because we're doing that manually
//         }) as TransformResult<FunctionInfoIbGib_V1>;
//         if (logalot) { console.log(`${lc} created functionInfoIbGib (I: e50d2e17f43312d4f4739899306bb725)`); }

//         if (saveInSpace) {
//             if (!metaspace) { throw new Error(`${lc} metaspace must be provided if saveInSpace is set to true (E: e74b76b00124d5874a6c5404e794b725)`); }
//             if (!space) { throw new Error(`${lc} space must be provided if saveInSpace is set to true (E: f3d5f1695a52707114117f72d932a025)`); }
//             await metaspace.persistTransformResult({ resTransform: resFunctionInfo, space });
//             if (logalot) { console.log(`${lc} persisted resFunctionInfo (${getIbGibAddr({ ibGib: resFunctionInfo.newIbGib })}) to space ${space.data?.uuid} (I: aa98e877d3b34e0d2a3b7711f8f27e25)`); }
//             await metaspace.registerNewIbGib({ ibGib: resFunctionInfo.newIbGib, space });
//             if (logalot) { console.log(`${lc} registered new function info ibgib (${getIbGibAddr({ ibGib: resFunctionInfo.newIbGib })}) with metaspace (I: aa98e877d3b34e0d2a3b7711f8f27e25)`); }
//         }

//         return resFunctionInfo;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * @interface FunctionInfoData_V1
//  * Data interface for a function call.
//  */
// export interface FunctionInfoData_V1 extends IbGibData_V1 {
//     /**
//      * which model generated this function request.
//      */
//     model: string;
//     /**
//      * Which api was used to generate this function request.
//      */
//     api: AgentAPI;
//     /**
//      *  This is the raw JSON string that was returned from the LLM function call
//      */
//     fnRawRequest: string;
//     /**
//      * name of the function.
//      *
//      * in gemini, this should be provided easily and we shouldn't need a regex for it.
//      */
//     fnName: string;
//     /**
//      * parsed args from the raw request string
//      */
//     fnArgs: any;
//     /**
//      * The results of the called function. If the function implementation called
//      * returns void/Promise<void> then this should remain undefined.
//      */
//     fnResult?: any;
//     /**
//      * Was the functionImpl completed without issue? If it returned void, this
//      * should be set to true, but this may be used for other workflows in the
//      * future.
//      */
//     fnComplete?: boolean;
//     /**
//      * Is the function call request intended to have its result reprompted to the model
//      * upon function completion or error?
//      */
//     repromptWithResult?: boolean;
// }

// /**
//  * @interface FunctionInfoRel8ns_V1 - Rel8ns interface for function info ibgibs.
//  * Extends {@link IbGibRel8ns_V1}
//  */
// export interface FunctionInfoRel8ns_V1 extends IbGibRel8ns_V1 {
// }

// /**
//  * @interface FunctionInfoIbGib_V1 - Interface for ibgibs of individual function calls.
//  * Extends {@link IbGib_V1} with {@link FunctionInfoData_V1} and {@link FunctionInfoRel8ns_V1}
//  */
// export interface FunctionInfoIbGib_V1 extends IbGib_V1<FunctionInfoData_V1, FunctionInfoRel8ns_V1> {
// }
