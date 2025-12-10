// import { AGENT_NAME_REGEXP } from "../agent-constants.mjs";

// export const GEMINI_ERROR_STATUS_MODEL_OVERLOADED = 503;
// export const GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED = 429;

// /**
//  * the path error.errorDetails is an array of error info objects.
//  */
// export const GEMINI_ERROR_DETAILS_TYPE_QUOTA_FAILURE = "type.googleapis.com/google.rpc.QuotaFailure";
// export const GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO = "type.googleapis.com/google.rpc.RetryInfo";
// export const GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO_RETRY_DELAY_KEY = 'retryDelay';


// // #region GeminiModel enum
// /**
//  * @see {@link GeminiModel.GEMINI_2_0_FLASH}
//  */
// const GEMINI_MODEL_GEMINI_2_0_FLASH = 'gemini-2.0-flash';
// const GEMINI_MODEL_GEMINI_2_0_FLASH_LITE = 'gemini-2.0-flash-lite';
// // const GEMINI_MODEL_GEMINI_2_0_FLASH = 'gemini-2.0-flash-exp';
// // /**
// //  * @see {@link GeminiModel.GEMINI_1_5_FLASH}
// //  */
// // const GEMINI_MODEL_GEMINI_1_5_FLASH = 'gemini-1.5-flash';
// // /**
// //  * @see {@link GeminiModel.GEMINI_1_5_FLASH_8B}
// //  */
// // const GEMINI_MODEL_GEMINI_1_5_FLASH_8B = 'gemini-1.5-flash-8b';
// // /**
// //  * @see {@link GeminiModel.GEMINI_1_5_PRO}
// //  */
// // const GEMINI_MODEL_GEMINI_1_5_PRO = 'gemini-1.5-pro';

// /**
//  * Enum of Gemini models that are available to the agent.
//  */
// export type GeminiModel =
//     | typeof GEMINI_MODEL_GEMINI_2_0_FLASH
//     | typeof GEMINI_MODEL_GEMINI_2_0_FLASH_LITE
//     // | typeof GEMINI_MODEL_GEMINI_1_5_FLASH
//     // | typeof GEMINI_MODEL_GEMINI_1_5_FLASH_8B
//     // | typeof GEMINI_MODEL_GEMINI_1_5_PRO
//     ;

// /**
//  * @see {@link GeminiModel}
//  */
// export const GeminiModel = {
//     /**
//      * @see {@link GEMINI_MODEL_GEMINI_2_0_FLASH}
//      */
//     GEMINI_2_0_FLASH: GEMINI_MODEL_GEMINI_2_0_FLASH as GeminiModel,
//     /**
//      * @see {@link GEMINI_MODEL_GEMINI_2_0_FLASH_LITE}
//      */
//     GEMINI_2_0_FLASH_LITE: GEMINI_MODEL_GEMINI_2_0_FLASH_LITE as GeminiModel,
//     // /**
//     //  * @see {@link GEMINI_MODEL_GEMINI_1_5_FLASH}
//     //  */
//     // GEMINI_1_5_FLASH: GEMINI_MODEL_GEMINI_1_5_FLASH as GeminiModel,
//     // /**
//     //  * @see {@link GEMINI_MODEL_GEMINI_1_5_FLASH_8B}
//     //  */
//     // GEMINI_1_5_FLASH_8B: GEMINI_MODEL_GEMINI_1_5_FLASH_8B as GeminiModel,
//     // /**
//     //  * @see {@link GEMINI_MODEL_GEMINI_1_5_PRO}
//     //  */
//     // GEMINI_1_5_PRO: GEMINI_MODEL_GEMINI_1_5_PRO as GeminiModel,
// } satisfies { [key: string]: GeminiModel };

// export const GEMINI_MODEL_VALUES = Object.freeze(Object.values(GeminiModel));
// export function isGeminiModel(str: string): str is GeminiModel {
//     return !!str && GEMINI_MODEL_VALUES.includes(str as GeminiModel);
// }

// // #endregion GeminiModel enum

// export const GEMINI_BACKUP_MODEL_STR = GeminiModel.GEMINI_2_0_FLASH_LITE;
// export const GEMINI_MAX_TRY_COUNT = 5;
