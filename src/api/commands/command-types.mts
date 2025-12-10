// import { WitnessCmdData } from "@ibgib/core-gib/dist/witness/witness-cmd/witness-cmd-types.mjs";
// import { APIFunctionInfo } from "../api-types.mjs";
// import type { getAllFunctionInfos } from "../api-index.mjs";

// /**
//  * @interface CommandBase - Base interface for all commands.
//  * Extends the structure for witness commands.
//  */
// export interface CommandDataBase<TCmds extends string, TCmdModifiers extends string[]> extends WitnessCmdData<TCmds, TCmdModifiers> {
//     /**
//      * notes to self for use by the LLM to describe their use of the command.
//      */
//     notesToSelf?: string;
//     /**
//      * set to true if the model desires notification as soon as the command is completed.
//      * Note that this is not part of the intrinsic command, rather it is
//      * metadata regarding agent (internal LLM model) workflow.
//      */
//     repromptWithResult?: boolean;
// }

// /**
//  * @interface EnqueuedCommand - Represents a command enqueued with its resolve
//  * and reject functions.
//  */
// export interface EnqueuedCommand<TCommand extends CommandDataBase<string, string[]>> {
//     command: TCommand;
//     resolve: (result: any) => void;
//     reject: (error: Error) => void;
//     /**
//      * If the command is anonymous, then this will be set. Otherwise, the APIFunctionInfo
//      * that will be used will be whitelisted from {@link getAllFunctionInfos}.
//      */
//     anonApiFn?: APIFunctionInfo<any>;
// }

// /**
//  * @interface CommandService - Interface for the command service.
//  */
// export interface CommandService {
//     // /**
//     //  * I'm adding this to enable anonymous functions. You must call this first
//     //  * and then you can call {@link enqueueCommand}. If you don't register, then
//     //  * you'll get an error.
//     //  *
//     //  * @see {@link commandifyAnonFn}
//     //  */
//     // registerAnonFn({ apiFnInfo }: { apiFnInfo: APIFunctionInfo<any> }): void;
//     /**
//      * Enqueues a command to be executed.
//      * @param {EnqueuedCommand<TCommand>} enqueuedCommand - The command to enqueue with its resolve and reject functions.
//      */
//     enqueueCommand<TCommand extends CommandDataBase<string, string[]>>(enqueuedCommand: EnqueuedCommand<TCommand>): void;

//     /**
//      * Starts processing the command queue.
//      * @returns {Promise<void>} A promise that resolves when the queue is empty.
//      */
//     processQueue(): Promise<void>;
// }

// // export const commandBaseSchemaProperties = {
// //     repromptWithResult: {
// //         type: 'boolean',
// //         description: `Set this to true if you want to be reprompted with the function's result.`,
// //     },
// //     notesToSelf: {
// //         type: 'string',
// //         description: `Use this as a note to yourself when looking at this function call and/or its result.`,
// //     },
// // } as const;
