// import { extractErrorMsg, getUUID, pickRandom_Letters, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
// import { createCommentIbGib } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
// import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";

// import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
// import { APIFunctionInfo } from "../../api-types.mjs";
// import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
// import { getCommandService } from "../command-service-v1.mjs";
// import { CommandDataBase } from "../command-types.mjs";
// import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
// import {
//     getGlobalMetaspace_waitIfNeeded, promptForText,
// } from "../../../helpers.web.mjs";
// // import { GeminiModel } from "../../../witness/agent/gemini/gemini-constants.mjs";
// // import { ProjectAgentFunctionInfos } from "./project-index.mjs";
// // import {
// //     AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF, AGENT_INITIAL_SYSTEM_TEXT_PROJECTAGENT
// // } from "../../../witness/agent/agent-constants.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// // #region constants

// /**
//  * camelCased name of the command itself.
//  */
// const FUNCTION_NAME = 'projectCreate';

// /**
//  * agent is the broad command which basically acts like a category of commands at this point.
//  */
// const CMD_CATEGORY = 'project';

// /**
//  * mut8IbGib here is the specific command modifier which narrows down to a command
//  * instance, similar to a fully curried function.
//  *
//  * This should be camelCased actual name of the function.
//  */
// const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

// const EXAMPLE_INPUT_PROJECTCREATE: Partial<ProjectCreateOpts> = {
//     initialCommentText: 'I want to create a simple button component with red text.',
//     srcIbGibAddr: 'comment some comment ib^abc123def456...', // Optional: provide if starting from specific comment
//     notesToSelf: 'Start a new project for a button component based on user request.',
//     repromptWithResult: true, // Usually true, to get the project handle back
// };

// const EXAMPLES = [
//     FUNCTION_CALL_EXAMPLES_HEADER,
//     pretty(EXAMPLE_INPUT_PROJECTCREATE),
// ].join('\n');

// // #endregion constants

// /**
//  * @interface ProjectCommandDataBase - Base interface for all project-related commands.
//  * @extends CommandDataBase
//  */
// export interface ProjectCommandDataBase<TCmdModifiers extends string[]>
//     extends CommandDataBase<typeof CMD_CATEGORY, TCmdModifiers> {
//     // No additional properties needed for the base project command yet
// }

// /**
//  * @interface ProjectCreateCommandData - Options for the projectCreate command.
//  * @extends ProjectCommandDataBase
//  */
// export interface ProjectCreateCommandData extends ProjectCommandDataBase<typeof CMD_MODIFIERS> {
//     /**
//      * @property projectSpaceId - id of the local space in which the project's
//      * ibgib will be accessed.
//      */
//     projectSpaceId: SpaceId;
//     /**
//      * @property initialCommentText - Optional text the model provides as context
//      * for the project. This will be used to pre-fill the prompt for the user
//      * when confirming project creation.
//      */
//     initialCommentText?: string;
//     /**
//      * @property srcIbGibAddr - Optional address of an existing ibGib (likely a
//      * comment) to use as the initial source or context for the new project.
//      */
//     srcIbGibAddr?: IbGibAddr;
// }

// /**
//  * @interface ProjectCreateOpts - Command data for the projectCreate command.
//  * @extends ProjectCreateCommandData
//  */
// export interface ProjectCreateOpts extends ProjectCreateCommandData {
// }

// /**
//  * shared for all project command results.
//  */
// export interface ProjectResultBase {
//     /**
//      * true if errored out.
//      *
//      * (not true if user just cancelled)
//      */
//     errorMsg?: string;
// }

// /**
//  * result shape for project create commands
//  */
// export interface ProjectCreateResult extends ProjectResultBase {
//     /**
//      * true if the user cancelled during creation process
//      */
//     userCancelled?: boolean;
//     /**
//      * if successful, this should be populated
//      */
//     projectAddr?: IbGibAddr;
// }

// /**
//  * Wrapper function to enqueue the projectCreate command.
//  * @param {ProjectCreateOpts} opts - Options for creating the new project.
//  * @returns {Promise<ProjectCreateResult>} A promise that resolves with the address of the new project's root ibGib, or undefined if canceled/error.
//  */
// function projectCreateViaCmd(opts: ProjectCreateOpts): Promise<ProjectCreateResult> {
//     const commandService = getCommandService();
//     const command: ProjectCreateCommandData = {
//         cmd: 'project',
//         cmdModifiers: ['create'], // <-- Changed from ['createNew']
//         projectSpaceId: opts.projectSpaceId,
//         initialCommentText: opts.initialCommentText,
//         srcIbGibAddr: opts.srcIbGibAddr,
//         repromptWithResult: opts?.repromptWithResult,
//         notesToSelf: opts?.notesToSelf,
//     };
//     return new Promise<ProjectCreateResult>((resolve, reject) => {
//         commandService.enqueueCommand({ command, resolve, reject });
//     });
// }

// /**
//  * Implementation function for the projectCreate command.
//  * @param {ProjectCreateOpts} opts - Options for creating the new project.
//  * @returns {Promise<IbGibAddr | undefined>} A promise that resolves with the address of the new project's root ibGib, or undefined if canceled/error.
//  */
// async function projectCreateImpl(opts: ProjectCreateOpts): Promise<ProjectCreateResult> {
//     const lc = `[${projectCreateImpl.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: ...)`); }

//         const { initialCommentText, } = opts;

//         /**
//          * this is the title of what we're prompting to the user. we will
//          * capture this in our project history because it's actually relevant.
//          */
//         const promptUserText_Title = `Enter some context for the project`;
//         /**
//          * this is the msg of what we're prompting to the user. we will capture
//          * this in our project history because it's actually relevant.
//          */
//         const promptUserText_Msg = [
//             `Enter the context for the new project.`,
//             `This can be the primary intent and/or goal of the project, or the title if you want.`,
//             `The term "project" is actually a little heavy. Just write something to get the ball rolling on the "thing" you want to do/create. We'll come up with "title" and other things as we go.`,
//         ].join('\n')

//         /**
//          * This is what the user has decided as the initial context of the
//          * project.
//          */
//         const genesisCommentText = await promptForText({
//             title: promptUserText_Title,
//             msg: promptUserText_Msg,
//             defaultValue: initialCommentText,
//             confirm: false,
//         });

//         debugger;// what is here?
//         if (!genesisCommentText) {
//             if (logalot) { console.log(`${lc} user canceled. returning early... (I: genuuid)`); }
//             return { userCancelled: true };
//         }

//         // prepare for the big show
//         const metaspace = await getGlobalMetaspace_waitIfNeeded();
//         const zeroSpace = metaspace.zeroSpace;

//         debugger;// step through the rest of this project create

//         // create the project agent
//         const projectGenesisCommentIbGib = (await createCommentIbGib({
//             text: genesisCommentText,
//             addlMetadataText: 'ProjectGenesisComment',
//             saveInSpace: true,
//         })).newIbGib;
//         const projectGenesisCommentAddr = getIbGibAddr({ ibGib: projectGenesisCommentIbGib });
//         /**
//          * the project agent's outerspace will be the default local user space.
//          */
//         // const projectAgent = await createNewAgent({
//         //     api: 'gemini',
//         //     model: GeminiModel.GEMINI_2_0_FLASH,
//         //     availableFunctions: ProjectAgentFunctionInfos,
//         //     initialChatText: [
//         //         ``,
//         //         AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF,
//         //         `The user is looking to create a project. A project genesis comment ibgib has already been created and saved in your superspace.`,
//         //         `Its address is ${projectGenesisCommentAddr}.`,
//         //         `The full ibgib is:`,
//         //         pretty(projectGenesisCommentIbGib),
//         //     ].join('\n'),
//         //     initialSystemText: [
//         //         AGENT_INITIAL_SYSTEM_TEXT_PROJECTAGENT
//         //     ].join('\n'),
//         //     fnGetAPIKey: () => getIbGibGlobalThis_BlankGib()!.fnDefaultGetAPIKey(),
//         //     metaspace,
//         // });

//         // create the project space
//         const projectSpaceName = `project_${(await getUUID()).substring(0, 16)}`;
//         // /**
//         //  * create new space for the project. i believe this will double as the
//         //  * project agent's innerSpace as well.
//         //  */
//         // const projectSpace = await metaspace.createLocalSpaceAndUpdateBootstrap({
//         //     zeroSpace,
//         //     allowCancel: false,
//         //     spaceName: projectSpaceName,
//         //     createBootstrap: false,
//         // });
//         // if (!projectSpace) { throw new Error(`(UNEXPECTED) couldn't create projectSpace? (E: ece5a354ce64370abea2ca2934819125)`); }



//         // Placeholder Implementation (REMAINS THE SAME LOGIC):
//         // 1. Prompt user for confirmation and project name/description using `showFullscreenDialog`
//         //    Use opts.initialCommentText to pre-fill the prompt message.
//         // 2. If user confirms:
//         //    a. Create the new genesis comment ibGib for the project.
//         //    b. Implement "soft clone" logic (if opts.srcIbGibAddr is provided)
//         //    c. Spawn the new project agent (using createNewAgent).
//         //    d. Relate agent and project ibgibs.
//         //    e. Tag the project ibGib with "projects" tag.
//         //    f. Persist all created ibgibs.
//         //    g. Return the address of the project's genesis ibGib.
//         // 3. If user cancels, return undefined.

//         console.warn(`${lc} Placeholder implementation - needs to be fully implemented!`);
//         throw new Error(`not implemented (E: 970cfc482e16b31ebcf36eb3115e0e25)`);
//         // return undefined; // Placeholder

//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * API function info for the projectCreate command.
//  */
// export const projectCreateFunctionInfo: APIFunctionInfo<typeof projectCreateViaCmd> = {
//     nameOrId: FUNCTION_NAME, // <-- Changed from createNewProject
//     fnViaCmd: projectCreateViaCmd,
//     functionImpl: projectCreateImpl,
//     cmd: 'project',
//     cmdModifiers: ['create'],
//     schema: {
//         name: FUNCTION_NAME,
//         description: `Initiates the workflow to create a new project. This will prompt the user for confirmation and details. Returns the address of the newly created project's root ibGib.\n\n${EXAMPLES}`,
//         parameters: {
//             type: 'object',
//             properties: {
//                 ...COMMAND_BASE_SCHEMA_PROPERTIES,
//                 initialCommentText: {
//                     type: 'string',
//                     description: 'Optional: Initial text or description provided by the user (or agent based on chat context) for the new project. This will be shown to the user when confirming project creation.',
//                 },
//                 srcIbGibAddr: {
//                     type: 'string',
//                     description: 'Optional: The ibGib address (ib^gib) of an existing comment or other ibGib to use as the starting context or source for the new project.',
//                 },
//             },
//             required: [],
//         },
//     },
// };
