// import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { storagePut } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
// import { UIThemeInfo } from "@ibgib/web-gib/dist/ui/ui-types.mjs";
// import { getExistingUIInfo } from "@ibgib/web-gib/dist/ui/ui-helpers.mjs";
// import { UI_THEME_INFO_KEY, VALID_CSS_VARIABLES } from "@ibgib/web-gib/dist/ui/ui-constants.mjs";

// import { ARMY_STORE, BLANK_GIB_DB_NAME, GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
// import { APIFunctionInfo } from "../../api-types.mjs";
// import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
// import { getCommandService } from "../command-service-v1.mjs";
// import { CommandDataBase } from "../command-types.mjs";
// import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// // #region constants
// /**
//  * camelCased name of the command itself.
//  */
// const FUNCTION_NAME = 'updateCSSVariables';

// /**
//  * 'ui' is the broad command which basically acts like a category of commands at this point.
//  */
// const CMD_CATEGORY = 'ui';

// /**
//  * This should be camelCased actual name of the function.
//  */
// const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

// const EXAMPLE_INPUT_UPDATECSS: Partial<UpdateCSSVariablesOpts> = {
//     cssVariables: {
//         '--button-background-color-base': '#4CAF50',
//         '--button-text-color-base': 'white',
//         '--button-border-color-base': '#4CAF50',
//         '--button-border-width-base': '1px',
//         '--button-border-style-base': 'solid',
//         '--button-border-radius-base': '4px',
//         '--button-padding-base': '10px 20px',
//         '--button-hover-background-color': '#45a049',
//         '--button-hover-text-color': 'white',
//         '--button-hover-border-color': '#45a049',
//     },
//     notesToSelf: 'Example of an updateCSSVariables function call that is updating a theme section that corresponds to the buttons. I still will do the other sections.',
//     repromptWithResult: true,
// };

// const EXAMPLES = [
//     FUNCTION_CALL_EXAMPLES_HEADER,
//     pretty(EXAMPLE_INPUT_UPDATECSS),
// ].join('\n');

// const FUNCTION_DESCRIPTION = [
//     `Use this to update global CSS variables, effectively changing the visual theme of the application. Provide an object where keys are CSS variable names (e.g., '--text-color-base') and values are their new values (e.g., 'blue'). REMEMBER! When you are asked to change an entire theme, BE SURE TO CHANGE ALL PARTS TO MATCH THE THEME! BUT...apply the changes to related sections of variables together (e.g., all tab-related variables, all button-related variables, etc.) instead of individual properties, otherwise you'll hit the reprompt limit if you try to do each one by itself. To help do this, _first_ categorize ALL the properties into smaller sections, and then tell the user your plan for each section: primary bases (fonts, main text, main background), buttons, tabs, scrollbars, fonts, and any others I might have forgotten. THEN do each group with a single function call but be sure to prompt yourself until you have gone through all of them.`,
//     '',
//     EXAMPLES,
// ].join('\n');

// // #endregion constants


// /**
//  * @interface UpdateCSSVariablesOpts - Options for the updateCSSVariables command.
//  * @extends CommandDataBase
//  */
// export interface UpdateCSSVariablesOpts
//     extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
//     /**
//      * @property cssVariables - An object where keys are CSS variable names
//      * (e.g., '--text-color-base') and values are their new values (e.g., 'blue').
//      */
//     cssVariables: { [key: string]: string };
// }

// // export interface UpdateCSSVariablesCommandData extends CommandDataBase<'ui', ['updateCSSVariables']> {
// /**
//  * @interface UpdateCSSVariablesCommandData - Command data for the updateCSSVariables command.
//  * @extends CommandDataBase
//  *
//  */
// export interface UpdateCSSVariablesCommandData extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
//     /**
//      * @see {@link UpdateCSSVariablesOpts.cssVariables}
//      */
//     cssVariables: { [key: string]: string };
// }

// /**
//  * Wrapper function to enqueue the updateCSSVariables command.
//  * @param {UpdateCSSVariablesOpts} opts - Options for updating CSS variables.
//  * @returns {Promise<void>} A promise that resolves when the command is enqueued.
//  */
// function updateCSSVariablesViaCmd(opts: UpdateCSSVariablesOpts): Promise<void> {
//     const commandService = getCommandService();
//     const command: UpdateCSSVariablesCommandData = {
//         ...opts, // Spread to include notesToSelf and repromptWithResult
//         cmd: CMD_CATEGORY,
//         cmdModifiers: [FUNCTION_NAME],
//         // cssVariables: opts.cssVariables,
//         // repromptWithResult: opts?.repromptWithResult,
//         // notesToSelf: opts?.notesToSelf,
//     };
//     return new Promise<void>((resolve, reject) => {
//         commandService.enqueueCommand({ command, resolve, reject });
//     });
// }

// /**
//  * Implementation function for the updateCSSVariables command (atow, does nothing other than resolve).
//  * @param {UpdateCSSVariablesOpts} opts - Options for updating CSS variables.
//  * @returns {Promise<void>} A promise that resolves when the command is executed (immediately).
//  */
// async function updateCSSVariablesImpl(opts: UpdateCSSVariablesOpts): Promise<void> {
//     const lc = `[${updateCSSVariablesImpl.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: badce195ed1817dd686c7098511e1f25)`); }

//         // In the actual implementation, this function would update the CSS variables.
//         console.log(`${lc} Updating CSS variables: ${JSON.stringify(opts.cssVariables)}`);
//         // Actual implementation to be added here:
//         for (const [variableName, value] of Object.entries(opts.cssVariables)) {
//             document.documentElement.style.setProperty(variableName, value);
//         }

//         // update the theme in the options
//         const existingUIInfo = await getExistingUIInfo({dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,}) ?? { cssVariableOverrides: {}, };
//         const newUIInfo: UIThemeInfo = {
//             ...existingUIInfo,
//             cssVariableOverrides: {
//                 ...existingUIInfo.cssVariableOverrides,
//                 ...opts.cssVariables,
//             },
//         };

//         await storagePut({
//             dbName: BLANK_GIB_DB_NAME,
//             storeName: ARMY_STORE,
//             key: UI_THEME_INFO_KEY,
//             value: JSON.stringify(newUIInfo),
//         });
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }


// /**
//  * API function info for the updateCSSVariables command.
//  */
// export const updateCSSVariablesFunctionInfo: APIFunctionInfo<typeof updateCSSVariablesViaCmd> = {
//     nameOrId: FUNCTION_NAME,
//     fnViaCmd: updateCSSVariablesViaCmd,
//     functionImpl: updateCSSVariablesImpl,
//     cmd: CMD_CATEGORY,
//     cmdModifiers: CMD_MODIFIERS,
//     schema: {
//         name: FUNCTION_NAME,
//         description: FUNCTION_DESCRIPTION,
//         parameters: {
//             type: 'object',
//             properties: {
//                 ...COMMAND_BASE_SCHEMA_PROPERTIES,
//                 cssVariables: {
//                     type: 'object',
//                     description: 'CSS variables to update when theming or otherwise changing these visual aspects of the web app per user preferences or the user directly asking for it. (atow there are no preferences saved or anything, so this is just user-driven if they ask for it.)',
//                     properties: Object.fromEntries(
//                         VALID_CSS_VARIABLES.map(varName => [
//                             varName,
//                             {
//                                 type: 'string',
//                                 description: `configurable css variable`,
//                             },
//                         ])
//                     ),
//                 }
//             },
//             required: ['cssVariables'],
//         },
//     },
// };
