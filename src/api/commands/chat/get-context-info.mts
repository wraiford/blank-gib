import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { GEMINI_SCHEMA_AGENT_ID, GEMINI_SCHEMA_AGENT_TYPE } from "../../../witness/agent/agent-constants.mjs";
import { getAgentsSvc } from "../../../witness/agent/agents-service-v1.mjs";
import { getGlobalMetaspace_waitIfNeeded } from "../../../helpers.web.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants
const EXAMPLE_INPUT_GETCONTEXTINFO: Partial<GetContextInfoOpts> = {
    agentId: 'someidprobablylookslikeahash',
    agentType: 'sometypehere',
    notesToSelf: 'Example of a getContextInfo function call. DO NOT USE THESE AS YOUR ACTUAL ARGS. THIS IS ONLY AN EXAMPLE TO SHOW THE SHAPE OF THE FUNCTION CALL!!',
    repromptWithResult: true,
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_GETCONTEXTINFO)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_GETCONTEXTINFO),
].join('\n');
// #endregion constants


/**
 * @interface CommandResultBase - Base interface for command results.
 *
 * ## notes
 *
 * I'm adding this after already having created several existing commands in
 * order to include an errorMsg. I want commands to return info about errors and
 * not re-throw. I am not integrating this with all existing commands at this
 * time though, so there will be some irregularity.
 *
 * I did go ahead and change the code in the command service to return
 * `{errorMsg}` if an exception is thrown.
 */
export interface CommandResultBase {
    /**
     * IIF the command errors out, this will be populated.
     */
    errorMsg?: string;
}

/**
 * @interface GetContextInfoOpts - Options for the getContextInfo command.
 * @extends CommandDataBase
 */
export interface GetContextInfoOpts extends CommandDataBase<'agent', ['getContextInfo']> {
    /**
     * @property agentId - the agent's unique identifier.
     */
    agentId: string;
    /**
     * @property agentType - type of the agent that corresponds to the basic
     * responsibilities of the agent
     */
    agentType: string;
}

export interface GetContextInfoResult extends CommandResultBase {
    contextAddr: IbGibAddr;
    contextIbGib: IbGib_V1;
    latestContextAddr?: IbGibAddr;
    latestContextIbGib?: IbGib_V1;
}

/**
 * @interface GetContextInfoCommandData - Command data for the getContextInfo command.
 * @extends CommandDataBase
 */
export interface GetContextInfoCommandData extends CommandDataBase<'agent', ['getContextInfo']> {
    /**
     * @property agentId - the agent's unique identifier.
     */
    agentId: string;
    /**
     * @property agentType - type of the agent that corresponds to the basic
     * responsibilities of the agent
     */
    agentType: string;
}

/**
 * Wrapper function to enqueue the getContextInfo command.
 * @param {GetContextInfoOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is enqueued.
 */
function getContextInfoViaCmd(opts: GetContextInfoOpts): Promise<GetContextInfoResult> {
    const commandService = getCommandService();
    const command: GetContextInfoCommandData = {
        cmd: 'agent',
        cmdModifiers: ['getContextInfo'],
        agentId: opts.agentId,
        agentType: opts.agentType,
        repromptWithResult: opts?.repromptWithResult,
        notesToSelf: opts?.notesToSelf,
    };
    return new Promise<GetContextInfoResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the getContextInfo command (atow, does nothing other than resolve).
 * @param {GetContextInfoOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is executed (immediately).
 */
async function getContextInfoImpl(opts: GetContextInfoOpts): Promise<GetContextInfoResult> {
    const lc = `[${getContextInfoImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        const { agentId, agentType, } = opts;

        // In the actual implementation, this function might trigger some UI update
        // or logging, but for now, it's just a placeholder.
        // debugger; // walk through get-context-info command

        // should get the agent
        const agentsSvc = getAgentsSvc();
        const agent = await agentsSvc.getAgentById({ agentId, agentType });
        if (!agent) { throw new Error(`agent not found for opts: ${pretty(opts)} (E: b0da990f27c85c29e5bf148299507225)`); }
        if (!agent.data) { throw new Error(`(UNEXPECTED) agent.data is falsy? opts: ${pretty(opts)} (E: a8b357b5c68e5485144e2358d1a60425)`); }

        // get the context info here
        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        const contextAddr = agent.data["@currentContextTjpAddr"];
        const superSpaceId = agent.data.superSpaceId;
        const superSpace = await metaspace.getLocalUserSpace({ localSpaceId: superSpaceId, lock: false });
        const resGetContext = await metaspace.get({
            addrs: [contextAddr],
            space: superSpace,
        });
        if (resGetContext.errorMsg || (resGetContext.ibGibs ?? []).length !== 1) {
            throw new Error(`couldn't get context ibgib (${contextAddr}) from super space (${superSpaceId}). errorMsg: ${resGetContext.errorMsg ?? '[unknown error]'} (E: 63514d4521e1dc26860354ccbcb02125)`);
        }
        const contextIbGib = resGetContext.ibGibs!.at(0)!
        let latestContextIbGib: IbGib_V1 | undefined = undefined;
        const latestContextAddr = await metaspace.getLatestAddr({ ibGib: contextIbGib, space: superSpace });
        if (latestContextAddr) {
            const resGetLatest = await metaspace.get({
                addrs: [latestContextAddr], space: superSpace
            });
            if (resGetLatest.errorMsg || (resGetLatest.ibGibs ?? []).length !== 1) {
                throw new Error(`couldn't get latest context ibgib (${latestContextAddr}) from super space (${superSpaceId}). errorMsg: ${resGetLatest.errorMsg ?? '[unknown error]'} (E: 450727cc12e226f8b741dd7b0efbfe25)`);
            }
            latestContextIbGib = resGetLatest.ibGibs!.at(0)!;
        }

        return {
            contextAddr,
            contextIbGib,
            latestContextAddr,
            latestContextIbGib,
        }
    } catch (error) {
        const errorMsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the getContextInfo command.
 */
export const getContextInfoFunctionInfo: APIFunctionInfo<typeof getContextInfoViaCmd> = {
    nameOrId: 'getContextInfo',
    fnViaCmd: getContextInfoViaCmd,
    functionImpl: getContextInfoImpl,
    cmd: 'agent',
    cmdModifiers: ['getContextInfo'],
    schema: {
        name: 'getContextInfo',
        description: `Gets context info *about your current context ibgib in which you are conversing*. For example, agent's must always "be" in a single location ibgib which is their current primary context. When this ibgib's timeline changes (when a mut8/rel8 happens on it and a new ibgib frame is registered with the metaspace and published via the metaspace's pubsub mechanism), then the agent will be made aware of the new children ibgibs added to that timeline. The context address will probably be the TJP address as this defines the timeline's starting point and is used to refer to the entire timeline. Note that the context will always be in the agent's super space.\nNOTE: This function DOES NOT get any and all context info, e.g., it does not get the website's current css colors. It is specifically to get info regarding YOUR CURRENT default context ibgib info.\n\n${EXAMPLES}`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                agentId: GEMINI_SCHEMA_AGENT_ID,
                agentType: GEMINI_SCHEMA_AGENT_TYPE,
            },
            required: ['agentId', 'agentType'],
        },
    },
};
