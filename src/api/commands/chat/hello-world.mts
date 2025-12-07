import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { AGENT_NAME_REGEXP, GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME } from "../../../witness/agent/agent-constants.mjs";
import { getAgentsSvc } from "../../../witness/agent/agents-service-v1.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants

/**
 * camelCased name of the command itself.
 */
const FUNCTION_NAME = 'helloWorld';

/**
 * chat category here as this is a chat-related command.
 */
const CMD_CATEGORY = 'agent';
/**
 * helloWorld here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

// #endregion constants

// #region constants
const EXAMPLE_INPUT_HELLOWORLD: Partial<HelloWorldOpts> = {
    agentsSelfIdentifiedName: 'Coolguy',
    agentId: 'someidprobablylookslikeahash',
    agentType: 'sometypehere',
    notesToSelf: 'Example of a helloWorld function call. DO NOT USE THESE AS YOUR ACTUAL NAME/ID/TYPE! THIS IS ONLY AN EXAMPLE TO SHOW THE SHAPE OF THE FUNCTION CALL!!',
    repromptWithResult: false,
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_HELLOWORLD)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_HELLOWORLD),
].join('\n');
// #endregion constants
const FUNCTION_DESCRIPTION = [
    `Introductory function that does a couple things. First, it just makes sure that the basic function calling plumbing is working with the agent. Next, it also confirms the agent is aware of his/her/its id and type. Also, it empowers the agent to choose his/her/its own name with which to interact with user(s) and other agent(s) (only one user implemented atow 04/2025).NOTE: This does not say anything to the user proper. You have to call tellUser (or some other function in the future possibly) to converse with the user. This function only does init.`,
    EXAMPLES,
].join('\n');


const GEMINI_SCHEMA_AGENT_ID = {
    type: 'string',
    description: 'unique identifier for the agent. Should be provided to the agent in system instructions upon creation.',
};

const GEMINI_SCHEMA_AGENT_TYPE = {
    type: 'string',
    description: 'type of the agent that governs basic responsibilities. Should be provided to the agent in system instructions upon creation.',
};

/**
 * @interface HelloWorldOpts - Options for the helloWorld command.
 * @extends CommandDataBase
 */
export interface HelloWorldOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * @property agentsSelfIdentifiedName - the name which the agent chooses to
     * use to represent him/her/itself.
     */
    agentsSelfIdentifiedName: string;
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
 * @interface HelloWorldCommandData - Command data for the helloWorld command.
 * @extends CommandDataBase
 */
export interface HelloWorldCommandData extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * @see {@link HelloWorldOpts.agentsSelfIdentifiedName}
     */
    agentsSelfIdentifiedName: string;
    /**
     * @see {@link HelloWorldOpts.agentId}
     */
    agentId: string;
    /**
     * @see {@link HelloWorldOpts.agentType}
     */
    agentType: string;
}

/**
 * Wrapper function to enqueue the helloWorld command.
 * @param {HelloWorldOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is enqueued.
 */
function helloWorldViaCmd(opts: HelloWorldOpts): Promise<void | { errorMsg: string }> {
    const commandService = getCommandService();
    const command: HelloWorldCommandData = {
        ...opts,
        cmd: CMD_CATEGORY,
        cmdModifiers: CMD_MODIFIERS,
        // agentsSelfIdentifiedName: opts.agentsSelfIdentifiedName,
        // agentId: opts.agentId,
        // agentType: opts.agentType,
        // repromptWithResult: opts?.repromptWithResult,
        // notesToSelf: opts?.notesToSelf,
    };
    return new Promise<void>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the helloWorld command (atow, does nothing other than resolve).
 * @param {HelloWorldOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is executed (immediately).
 */
async function helloWorldImpl(opts: HelloWorldOpts): Promise<void | { errorMsg: string }> {
    const lc = `[${helloWorldImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        const { agentId, agentType, agentsSelfIdentifiedName } = opts;

        // In the actual implementation, this function might trigger some UI update
        // or logging, but for now, it's just a placeholder.
        // debugger; // walk through hello-world command

        // should get the agent
        const agentsSvc = getAgentsSvc();
        const agent = await agentsSvc.getAgentById({ agentId, agentType });
        if (!agent) { throw new Error(`agent not found for opts: ${pretty(opts)} (E: b0da990f27c85c29e5bf148299507225)`); }

        // this does the name validation, throws if invalid
        await agent.updateName({ name: agentsSelfIdentifiedName });
        // debugger; // does this get hit?
    } catch (error) {
        debugger; // error in helloworld
        const errorMsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(errorMsg);
        return { errorMsg };
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the helloWorld command.
 */
export const helloWorldFunctionInfo: APIFunctionInfo<typeof helloWorldViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: helloWorldViaCmd,
    functionImpl: helloWorldImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                agentsSelfIdentifiedName: GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME,
                agentId: GEMINI_SCHEMA_AGENT_ID,
                agentType: GEMINI_SCHEMA_AGENT_TYPE,
            },
            required: ['agentsSelfIdentifiedName', 'agentId', 'agentType'],
        },
    },
};
