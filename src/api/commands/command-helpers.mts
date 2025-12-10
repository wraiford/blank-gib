// import { clone, extractErrorMsg, pickRandom_Letters } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

// import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
// import { APIFunctionInfo } from "../api-types.mjs";
// import { getCommandService } from "./command-service-v1.mjs";
// import { CommandDataBase } from "./command-types.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// /**
//  * customizing function to create the schema specific to some concrete schema
//  * description/instructions.
//  */
// export function tweakGeminiSchema({
//     baseSchema,
//     addlDescription,
// }: {
//     /**
//      * starting schema which we will customize.
//      */
//     baseSchema: any,
//     /**
//      * additional description, to be used for concrete schema descriptions.
//      * If there is no description to begin with, this will simply set the
//      * description.
//      *
//      * For example, with destroy renderable, describe that this will recursively
//      * destroy children. With update renderable, this will apply the changes
//      * recursively to all children (like setting color).
//      */
//     addlDescription?: string,
// }): { type: 'boolean', description: string } {
//     if (!baseSchema) { throw new Error(`(UNEXPECTED) baseSchema falsy? (E: 338a083d88ab9ae5286edc7d0c20c825)`); }
//     const resSchema = clone(baseSchema);
//     resSchema.description = `${resSchema.description ?? ''}\n${addlDescription}`;
//     return resSchema;
// }

// /**
//  * wraps the given {@link fn} inside of a {@link APIFunctionInfo} that can be
//  * executed on the api command service.
//  *
//  * ## intent
//  *
//  * I want to be able to execute certain functions serially similar to a barrier
//  * or critical section. This was the "easiest" way for me to do it, since each
//  * command is executed serially on the commanding service. And I didn't want to
//  * have to create APIFunctionInfo objects for things that will not be exposed to
//  * agents proper.
//  *
//  * ## NOT for agents' use
//  *
//  * because this is anon function, there is NO schema generated. So this can't be
//  * used with agents directly.
//  */
// export function commandifyAnonFn<TFunc extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<void>>({
//     fn,
//     nameOrId,
//     cmdCategory,
// }: {
//     fn: TFunc,
//     nameOrId?: string,
//     cmdCategory?: string,
// }): APIFunctionInfo<TFunc> {
//     const lc = `[${commandifyAnonFn.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: e302e6a0f13584968379c9149406f225)`); }

//         const cmdName =
//             (nameOrId ?? fn.name) + `_${pickRandom_Letters({ count: 8 })}`;
//         cmdCategory ??= 'anon';
//         const cmdModifiers = [cmdName];

//         const fnViaCmd: any = async (opts: any) => {
//             cmdCategory ??= 'anon';
//             const commandService = getCommandService();
//             const command: CommandDataBase<typeof cmdCategory, typeof cmdModifiers> = {
//                 cmd: cmdCategory,
//                 cmdModifiers,
//                 ...opts,
//             };
//             return new Promise<any>((resolve, reject) => {
//                 commandService.enqueueCommand({ command, resolve, reject, anonApiFn });
//             });
//         }

//         const anonApiFn: APIFunctionInfo<TFunc> = {
//             nameOrId: cmdName,
//             cmd: cmdCategory,
//             cmdModifiers: [cmdName],
//             fnViaCmd,
//             functionImpl: fn,
//             schema: undefined,
//             isAnon: true,
//         }

//         return anonApiFn;

//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
