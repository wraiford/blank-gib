// /**
//  * @module api-function-info.template is a template for implementing api function infos (obviously).
//  *
//  * ## notes
//  *
//  * ### ordering imports
//  *
//  * import sections always go:
//  * 1. non-ibgib deps first (rare)
//  * 2. @ibgib/helper-gib, @ibgib/encrypt-gib, @ibgib/ts-gib, @ibgib/core-gib packages (in that order)
//  * 3. import GLOBAL_LOG_A_LOT then remaining project imports
//  * 4. code proper starts with the definition of `const logalot` (if applicable)
//  *
//  * There is a blank line between these sections.
//  *
//  */


// import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// // import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// // import { rel8 } from "@ibgib/ts-gib/dist/V1/transforms/rel8.mjs";
// // import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
// // import { IbGibAddr, TransformResult } from "@ibgib/ts-gib/dist/types.mjs";
// // import { isPrimitive } from "@ibgib/ts-gib/dist/V1/index.mjs";
// // import { toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

// import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
// import { APIFunctionInfo } from "../../api-types.mjs";
// import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
// import { getCommandService } from "../command-service-v1.mjs";
// import { CommandDataBase } from "../command-types.mjs";
// import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
// // import { getGlobalMetaspace_waitIfNeeded } from "../../../helpers.web.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// // #region constants

// /**
//  * camelCased name of the command itself.
//  */
// const FUNCTION_NAME = 'fooBar';

// /**
//  * fooCategory could be 'agent', 'renderable', etc. It's the broad command which
//  * basically acts like a category of commands at this point.
//  *
//  * If an agent is generating this, ask me what this should be before going forward.
//  */
// const CMD_CATEGORY = 'fooCategory';
// /**
//  * fooBar here is the specific command modifier which narrows down to a command
//  * instance, similar to a fully curried function.
//  *
//  * This should be camelCased actual name of the function.
//  */
// const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

// const EXAMPLE_INPUT_FOOBAR: Partial<FooBarOpts> = {
//     fooArgString: 'This is an example string',
//     fooArgArray: 'This is an example string',
//     notesToSelf: `Example of a ${FUNCTION_NAME} function call.`,
//     repromptWithResult: false,
// };
// const EXAMPLES = [
//     // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_FOOBAR)}\n\`\`\``,
//     FUNCTION_CALL_EXAMPLES_HEADER,
//     pretty(EXAMPLE_INPUT_FOOBAR),
// ].join('\n');
// const FUNCTION_DESCRIPTION = [
//     `Enter the description here.`,
//     '',
//     EXAMPLES,
// ].join('\n');
// // #endregion constants

// /**
//  * @interface FooBarOpts - Options for the fooBar command.
//  *
//  * @extends CommandDataBase
//  */
// export interface FooBarOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
//     /**
//      * @property fooArgString - always include the docs here in the opts interface
//      */
//     fooArgString: string;
//     /**
//      * @property fooArgArray - always include the docs here in the opts interface
//      */
//     fooArgArray: string;
// }

// /**
//  * @interface FooBarCommandData - Command data for the fooBar command.
//  * @extends CommandDataBase
//  */
// export interface FooBarCommandData extends CommandDataBase<'agent', ['fooBar']> {
//     /**
//      * @see {@link FooBarOpts.fooArgString}
//      */
//     fooArgString: string;
//     /**
//      * @see {@link FooBarOpts.fooArgArray}
//      */
//     fooArgArray: string;
// }

// /**
//  * Wrapper function to enqueue the fooBar command.
//  * @param {FooBarOpts} opts - @see {@link FooBarOpts}
//  * @returns {Promise<void>} A promise that resolves when the command finishes execution.
//  */
// function fooBarViaCmd(opts: FooBarOpts): Promise<void> {
//     const commandService = getCommandService();
//     const command: FooBarCommandData = {
//         cmd: CMD_CATEGORY,
//         cmdModifiers: CMD_MODIFIERS,
//         fooArgString: opts.fooArgString,
//         fooArgArray: opts.fooArgArray,
//         repromptWithResult: opts.repromptWithResult,
//         notesToSelf: opts.notesToSelf,
//     };
//     return new Promise<void>((resolve, reject) => {
//         commandService.enqueueCommand({ command, resolve, reject });
//     });
// }

// /**
//  * Implementation function for the fooBar command.
//  *
//  * @param {FooBarOpts} opts - @see {@link FooBarOpts}
//  * @returns {Promise<void>} A promise that resolves when the command is executed.
//  */
// async function fooBarImpl(opts: FooBarOpts): Promise<void> {
//     const lc = `[${fooBarImpl.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

//         console.log(`${lc} ${CMD_CATEGORY} ${CMD_MODIFIERS} opts: ${pretty(opts)}`);

//         // actual implementation goes here

//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * example of OpenAPI shape of a string declaration
//  */
// const GEMINI_SCHEMA_FOO_ARG_STRING = {
//     type: 'string',
//     description: 'fooArgString is a prop that...',
// }

// function getGeminiArraySchemaOfItem({
//     itemSchema,
//     description,
// }: {
//     itemSchema: any,
//     description: string,
// }): any {
//     return {
//         type: 'array',
//         description,
//         items: itemSchema,
//     };
// }

// const GEMINI_SCHEMA_FOO_ARG_ARRAY_ITEM = {
//     type: 'object',
//     description: 'fooArgArray item is an item that...',
//     properties: {
//         someString: GEMINI_SCHEMA_FOO_ARG_STRING,
//     },
//     required: ['someString'],
// }

// const GEMINI_SCHEMA_FOO_ARG_ARRAY = getGeminiArraySchemaOfItem({
//     itemSchema: GEMINI_SCHEMA_FOO_ARG_ARRAY_ITEM,
//     description: 'fooArgArray is a prop that...',
// });

// /**
//  * API function info for the fooBar command.
//  */
// export const fooBarFunctionInfo: APIFunctionInfo<typeof fooBarViaCmd> = {
//     nameOrId: FUNCTION_NAME,
//     fnViaCmd: fooBarViaCmd,
//     functionImpl: fooBarImpl,
//     cmd: CMD_CATEGORY,
//     cmdModifiers: CMD_MODIFIERS,
//     schema: {
//         name: FUNCTION_NAME,
//         description: FUNCTION_DESCRIPTION,
//         parameters: {
//             type: 'object',
//             properties: {
//                 ...COMMAND_BASE_SCHEMA_PROPERTIES,
//                 fooArgString: GEMINI_SCHEMA_FOO_ARG_STRING,
//                 fooArgArray: GEMINI_SCHEMA_FOO_ARG_ARRAY,
//             },
//             required: [
//                 'fooArgString', // comment out/remove if optional
//                 'fooArgArray', // comment out/remove if optional
//             ],
//         },
//     },
// };
