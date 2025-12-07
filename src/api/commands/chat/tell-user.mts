import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { validateIbGibAddr } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { getIbAndGib, } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { createCommentIbGib } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { getGlobalMetaspace_waitIfNeeded } from "../../../helpers.web.mjs";
import {
    getAddlMetadataTextForAgentText,
} from "../../../witness/agent/agent-one-file.mjs";
import { GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME, TextSource } from "../../../witness/agent/agent-constants.mjs";
import { isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { appendToTimeline } from "../../timeline/timeline-api.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants
const FUNCTION_NAME = 'tellUser';

/**
 * chat category here as this is a chat-related command.
 */
const CMD_CATEGORY = 'agent';
/**
 * helloWorld here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];
const EXAMPLE_INPUT_TELLUSER: Partial<TellUserOpts> = {
    text: 'Hello user, this is an example of how I can tell you something!',
    agentName: 'Zarquon',
    notesToSelf: 'Example of a tellUser function call. Note repromptWithResult is false b/c it is ignored with tellUser cmd.',
    repromptWithResult: false,
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_TELLUSER)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_TELLUSER),
].join('\n');
const FUNCTION_DESCRIPTION = `Use this to talk with the user. DON'T just add text on the canvas! Use this function as it adds a comment to the chat log which the user can see.\n\n${EXAMPLES}`;
// #endregion constants


/**
 * @interface TellUserOpts - Options for the tellUser command.
 * @extends CommandDataBase
 */
export interface TellUserOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * @property text - The text to tell the user.
     */
    text: string;

    /**
     * agent's id doing the telling
     */
    agentId: string;

    /**
     * address to the context in which the agent is communicating to a user.
     */
    contextIbGibAddr: IbGibAddr;

    /**
     * @property agentName - the name which the model chooses to
     * use to represent him/her/itself.
     */
    agentName: string;
}

/**
 * @interface TellUserCommandData - Command data for the tellUser command.
 * @extends CommandDataBase
 */
export interface TellUserCommandData extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * @property text - The text to tell the user.
     */
    text: string;
}

/**
 * Wrapper function to enqueue the tellUser command.
 * @param {TellUserOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is enqueued.
 */
function tellUserViaCmd(opts: TellUserOpts): Promise<void> {
    const lc = `[${tellUserViaCmd.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 39ce6d58e154b8463170463f20d44925)`); }
        if (logalot) { console.log(`${lc} tellUserViaCmd raw incoming opts: ${pretty(opts)} (I: 2ff6e7fc49b12e335affa1cb3af11125)`); }

        const commandService = getCommandService();
        const command: TellUserCommandData = {
            ...opts,
            cmd: 'agent',
            cmdModifiers: ['tellUser'],
            repromptWithResult: false, // override for tellUser
            // text: opts.text,
            // repromptWithResult: opts?.repromptWithResult,
            // notesToSelf: opts?.notesToSelf,
        };
        if (logalot) { console.log(`${lc} tellUserViaCmd command: ${pretty(command)} (I: d7c86c41cf2578e1ccdd30f4dbc62625)`); }
        return new Promise<void>((resolve, reject) => {
            commandService.enqueueCommand({ command, resolve, reject });
        });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Implementation function for the tellUser command.
 *
 * ## notes on context
 *
 * LLMs are designed to say/do something upon being prompted. In code, however,
 * it is beneficial to sometimes just give information and let the agent decide
 * whether or not to act upon it. Right now I have this doubling as an "ack"
 * command that acts like a blackhole for when the agent decides no action is
 * required. So if the context is a primitive, then this will "fail" silently.
 *
 *
 * @param {TellUserOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is executed (immediately).
 */
async function tellUserImpl(opts: TellUserOpts): Promise<void> {
    const lc = `[${tellUserImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: badce195ed1817dd686c7098511e1f25)`); }

        console.log(`${lc} agent tell user opts: ${pretty(opts)}`);

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        const contextAddr = opts.contextIbGibAddr;
        if (!contextAddr) { throw new Error(`contextIbGibAddr is falsy (was not provided by model if this was a function call request). This should be required in the gemini schema. (E: 2585778dc7f6fc74322f40745d7f4d25)`); }

        const addrErrors = validateIbGibAddr({ addr: contextAddr }) ?? [];
        if (addrErrors.length > 0) {
            console.log(`${lc} returning early because agent has provided a non-ibgib addr for contextAddr: ${contextAddr}. addrErrors: ${addrErrors}. opts: ${pretty(opts)} (I: 66c39c5031723254de46c254b096dc25)`)
            return; /* <<<< returns early */
        }
        if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: contextAddr }).gib })) {
            console.log(`${lc} agent has acked by calling this with a primitive context address. This will not propagate to the user's current context. opts: ${pretty(opts)} (I: a0687328201af74ed9d9e24ad4a5b825)`);
            return; /* <<<< returns early */
        }
        const space = await metaspace.getLocalUserSpace({ lock: false });
        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 2fdac9f814d620ce6341cfc10942f525)`); }

        // adding agent name elsewhere
        // const agentNamePlusText = `${opts.agentName}: ${opts.text}`;

        // create the comment
        const { newIbGib: commentIbGib } = await createCommentIbGib({
            text: opts.text,
            addlMetadataText: getAddlMetadataTextForAgentText({
                textSrc: TextSource.AI,
                other: `${opts.agentName}_${opts.agentId}`,
            }),
            saveInSpace: true,
            space,
        });

        // get the latest context ibgib
        let latestContextIbGib: IbGib_V1 | undefined = undefined;
        const latestContextAddr = await metaspace.getLatestAddr({
            addr: contextAddr,
            space,
        });
        if (latestContextAddr) {
            const resGetLatest = await metaspace.get({
                addrs: [latestContextAddr],
                space,
            });
            if (resGetLatest.errorMsg || (resGetLatest.ibGibs ?? []).length !== 1) {
                throw new Error(`couldn't get latest context ibgib (${latestContextAddr}) from super space (${space.ib}). errorMsg: ${resGetLatest.errorMsg ?? '[unknown error]'} (E: 450727cc12e226f8b741dd7b0efbfe25)`);
            }
            latestContextIbGib = resGetLatest.ibGibs!.at(0)!;
        }
        if (!latestContextIbGib) { throw new Error(`(UNEXPECTED) couldn't get latest context ibgib? (${latestContextAddr}) (E: cb50a6cb984a60c139a4f16a26290d25)`); }

        await appendToTimeline({
            timeline: latestContextIbGib,
            metaspace,
            rel8nInfos: [{ rel8nName: 'comment', ibGibs: [commentIbGib], }],
            space,
        });

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

const GEMINI_SCHEMA_TELL_USER_TEXT = {
    type: 'string',
    description: 'The text content to display to the user in the chat log. This is how you, as the agent, communicate with the user.',
};

const GEMINI_SCHEMA_TELL_USER_CONTEXT_ADDR = {
    type: 'string',
    description: `This is the address of the ibgib in which you wish to communicate with the user (and/or other agents when implemented). If you don't know this, you should call the getContextInfo function (the actual name may vary slightly as we are in active development right now, but this should be included in your available functions).`,
};

/**
 * API function info for the tellUser command.
 */
export const tellUserFunctionInfo: APIFunctionInfo<typeof tellUserViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: tellUserViaCmd,
    functionImpl: tellUserImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                text: GEMINI_SCHEMA_TELL_USER_TEXT,
                contextIbGibAddr: GEMINI_SCHEMA_TELL_USER_CONTEXT_ADDR,
                agentName: GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME,
            },
            required: ['text', 'contextIbGibAddr', 'agentName'],
        },
    },
};
