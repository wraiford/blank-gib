import { clone, delay, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { validateIbGibAddr } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { getIbAndGib, getIbGibAddr, } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { getGibInfo, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
import { appendToTimeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
import { getGlobalMetaspace_waitIfNeeded, } from "@ibgib/web-gib/dist/helpers.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { getDefaultFnGetAPIKey, } from "../../../helpers.web.mjs";
import {
    AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT,
    GEMINI_SCHEMA_MINIGAME_CONTEXT_ADDR, GEMINI_SCHEMA_MINIGAME_DESCRIPTION,
    GEMINI_SCHEMA_MINIGAME_GAMETYPE,
    // GEMINI_SCHEMA_MINIGAME_GAMEVARIANT,
    GEMINI_SCHEMA_MINIGAME_INSTRUCTIONS, GEMINI_SCHEMA_MINIGAME_KEYWORDS,
    GEMINI_SCHEMA_MINIGAME_NAME, MINIGAME_REL8N_NAME, MinigameGameType,
    MinigameGameVariant,
} from "../../../common/minigame/minigame-constants.mjs";
import { createMinigameIbGib } from "../../../common/minigame/minigame-helper.mjs";
import { getAgentsSvc } from "../../../witness/agent/agents-service-v1.mjs";
import { GeminiModel } from "../../../witness/agent/gemini/gemini-constants.mjs";
import { registerDomainIbGibWithAgentIndex } from "../../../witness/agent/agent-helpers.mjs";
import { AGENT_INITIAL_CHAT_TEXT_MINIGAMEAGENT, AGENT_INITIAL_SYSTEM_TEXT_MINIGAMEAGENT, AGENT_SPECIAL_IBGIB_TYPE_MINIGAMEAGENT } from "../../../agent-texts/minigame-agent-texts.mjs";
import { DEFAULT_MINIGAME_DATA_V1, MinigameIbGib_V1 } from "../../../common/minigame/minigame-types.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants
const FUNCTION_NAME = 'minigameBuilderStart';

/**
 * chat category here as this is a chat-related command.
 */
const CMD_CATEGORY = 'minigame';
/**
 * helloWorld here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];
const EXAMPLE_INPUT_MINIGAMEBUILDER_START: Partial<MinigameBuilderStartOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: 'Example of a minigameBuilderStart function call. Note repromptWithResult is true to add stimuli next.',
    repromptWithResult: true,
    name: 'Example Minigame',
    description: 'In this contrived example minigame, you type random text!',
    instructions: 'Type the text exactly as it appears. First, be accurate and smooth, like a pianist, and only then push your speed.',
    gameType: MinigameGameType.typing,
    // gameVariant: MinigameGameVariant.default,
    keywords: ['example', 'english', 'typing-test', 'typing-focus'],
};
const EXAMPLE_INPUT_MINIGAMEBUILDER_START_ANTIPHONY: Partial<MinigameBuilderStartOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: 'Example of a minigameBuilderStart function call for a typing game, antiphony variant. Note repromptWithResult is true to add stimuli next.',
    repromptWithResult: true,
    name: 'Example Antiphony',
    description: 'In this contrived example minigame, you type the answer to the question!',
    instructions: 'Answer the questions.',
    gameType: MinigameGameType.typing,
    // gameVariant: MinigameGameVariant.antiphony,
    keywords: ['example', 'english', 'q-and-a', 'trivia'],
};
const EXAMPLE_INPUT_MINIGAMEBUILDER_START_FITB: Partial<MinigameBuilderStartOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: 'Example of a minigameBuilderStart function call for a typing game, fitb (fill-in-the-blank) variant. Note repromptWithResult is true to add stimuli next.',
    repromptWithResult: true,
    name: 'Example Fill-in-the-blank',
    description: 'In this contrived example minigame, you type what goes in the blank(s)!',
    instructions: 'Type what goes in each blank. For multiple blanks, use a comma to separate your answers.',
    gameType: MinigameGameType.typing,
    // gameVariant: MinigameGameVariant.fitb,
    keywords: ['example', 'german', 'de-DE', 'deutsch', 'vocabulary'],
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_TELLUSER)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_START),
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_START_ANTIPHONY),
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_START_FITB),
].join('\n');
const FUNCTION_DESCRIPTION = `Starts a builder to construct a minigame ibgib. The addr returned will be the tjpAaddr of the minigame, which acts as an id for the minigame ibgib's timeline. It is this address that you should pass to other builder steps.\n\n${EXAMPLES}`;
// #endregion constants


/**
 * @interface MinigameBuilderStartOpts - Options for the minigameBuilderStart command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderStartOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the telling
    */
    agentId?: string;
    /**
     * @property agentName - the name which the model chooses to
     * use to represent him/her/itself.
     */
    agentName?: string;
    /**
     * address to the context (project/project child atow 06/2025) in which the
     * minigame should be created (will be rel8d to).
     */
    contextIbGibAddr: IbGibAddr;

    /**
     * It's the name of the game.
     */
    name: string;
    /**
     * Description of the minigame.
     * This can be a more detailed explanation of the minigame's purpose or scope.
     */
    description: string;
    /**
     * how to play the game. shown before starting.
     */
    instructions: string;
    /**
     * Broad category of the minigame. Only one initially is "typing" (though
     * the user could use the voice typing).
     */
    gameType: MinigameGameType;
    /**
     * Specific sub-type of the {@link gameType}. This determines specifics of
     * the minigame gameplay.
     */
    gameVariant?: MinigameGameVariant;
    /**
     * Includes the state of the game, as well as any interactions any of the
     * player's have made.
     *
     * in typing, this is where we include what stimuli we have shown to the user,
     * what their responses were, timestamps, etc.
     */
    gameState?: any;
    /**
     * List of keywords that describe/pertain to this minigame, e.g., 'spanish',
     * 'verbs', 'conjugation', 'cover-cropping', etc.
     *
     * Note that our learning model is not just subject-related but
     * trace-strength related. So the material itself is not the only important
     * thing, like when buliding a team it's good to have diversification such
     * as a comedian/light-hearted person. The learning equivalent is pairing
     * certain groups of text with some fun/humorous theme.
     */
    keywords: string[];
}

export interface MinigameBuilderStartResult {
    // newContextIbGib: IbGib_V1;
    // minigameIbGib: MinigameIbGib_V1;
    // builderId: string;
    minigameAddr: IbGibAddr;
}

/**
 * @interface MinigameBuilderStartCommandData - Command data for the
 * minigameBuilderStart command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderStartCommandData
    extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the telling
     */
    agentId?: string;
    /**
     * @property agentName - the name which the model chooses to
     * use to represent him/her/itself.
     */
    agentName?: string;
    /**
     * address to the context (project/project child atow 06/2025) in which the
     * minigame should be created (will be rel8d to).
     */
    contextIbGibAddr: IbGibAddr;

    /**
     * It's the name of the game.
     */
    name: string;
    /**
     * Description of the minigame.
     * This can be a more detailed explanation of the minigame's purpose or scope.
     */
    description: string;
    /**
     * how to play the game. shown before starting.
     */
    instructions: string;
    /**
     * Broad category of the minigame. Only one initially is "typing" (though
     * the user could use the voice typing).
     */
    gameType: MinigameGameType;
    /**
     * Specific sub-type of the {@link gameType}. This determines specifics of
     * the minigame gameplay.
     */
    gameVariant?: MinigameGameVariant;
    /**
     * Includes the state of the game, as well as any interactions any of the
     * player's have made.
     *
     * in typing, this is where we include what stimuli we have shown to the user,
     * what their responses were, timestamps, etc.
     */
    gameState?: any;
    /**
     * List of keywords that describe/pertain to this minigame, e.g., 'spanish',
     * 'verbs', 'conjugation', 'cover-cropping', etc.
     *
     * Note that our learning model is not just subject-related but
     * trace-strength related. So the material itself is not the only important
     * thing, like when buliding a team it's good to have diversification such
     * as a comedian/light-hearted person. The learning equivalent is pairing
     * certain groups of text with some fun/humorous theme.
     */
    keywords: string[];
}

/**
 * Wrapper function to enqueue the minigameBuilderStart command.
 * @param {MinigameBuilderStartOpts} opts - Options for telling the user something.
 * @returns {Promise<MinigameBuilderStartResult>} A promise that resolves when the command is enqueued.
 */
function minigameBuilderStartViaCmd(opts: MinigameBuilderStartOpts): Promise<MinigameBuilderStartResult> {
    const lc = `[${minigameBuilderStartViaCmd.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        if (logalot) { console.log(`${lc} minigameBuilderStartViaCmd raw incoming opts: ${pretty(opts)} (I: genuuid)`); }

        const commandService = getCommandService();
        const command: MinigameBuilderStartCommandData = {
            ...opts,
            cmd: CMD_CATEGORY,
            cmdModifiers: CMD_MODIFIERS,
        };
        if (logalot) { console.log(`${lc} minigameBuilderStartViaCmd command: ${pretty(command)} (I: genuuid)`); }
        return new Promise<MinigameBuilderStartResult>((resolve, reject) => {
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
 * Implementation function for the minigameBuilderStart command.
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
 * @param {MinigameBuilderStartOpts} opts - Options for telling the user something.
 * @returns {Promise<MinigameBuilderStartResult>} A promise that resolves when the command is executed (immediately).
 */
async function minigameBuilderStartImpl(opts: MinigameBuilderStartOpts): Promise<MinigameBuilderStartResult> {
    const lc = `[${minigameBuilderStartImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        console.log(`${lc} opts: ${pretty(opts)}`);

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        const contextAddr = opts.contextIbGibAddr;
        if (!contextAddr) { throw new Error(`contextIbGibAddr is falsy (was not provided by model if this was a function call request). This should be required in the gemini schema. (E: genuuid)`); }

        const addrErrors = validateIbGibAddr({ addr: contextAddr }) ?? [];
        if (addrErrors.length > 0) {
            throw new Error(`${lc} agent has provided a non-ibgib addr for contextAddr: ${contextAddr}. addrErrors: ${addrErrors}. opts: ${pretty(opts)} (E: genuuid)`)
        }
        if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: contextAddr }).gib })) {
            throw new Error(`agent has tried calling this with a primitive context address. opts: ${pretty(opts)} (E: genuuid)`);
        }
        const space = await metaspace.getLocalUserSpace({ lock: false });
        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: genuuid)`); }

        // // adding agent name elsewhere
        // // const agentNamePlusText = `${opts.agentName}: ${opts.text}`;


        // create the minigame
        const { name, description, instructions, gameType, gameVariant, keywords, } = opts;
        const { newIbGib: minigameIbGib } = await createMinigameIbGib({
            srcMinigameIbGib: undefined, // ignore right now
            data: {
                ...DEFAULT_MINIGAME_DATA_V1,
                '@contextAddr': contextAddr,
                // ...opts,
                name, description, instructions,
                gameType,
                // gameVariant, moving gameVariant into stimulus
                gameMeta: {}, // to be edited by other function calls
                gameState: {}, // to be edited by other function calls
                keywords,

                // not playable yet, only initializing minigame prototype
                playable: false,
            },
            saveInSpace: true,
            space,
            registerNewIbGib: true,
        });
        const tjpAddr = getTjpAddr({ ibGib: minigameIbGib, defaultIfNone: 'incomingAddr' });
        if (!tjpAddr) { throw new Error(`(UNEXPECTED) tjpAddr falsy? we chose incomingAddr when getTjpAddr called, so should be set to incoming addr. (E: e25f482a29543d2c748f0de869914925)`); }
        const { gib: minigameTjpGib } = getIbAndGib({ ibGib: minigameIbGib });

        // create an agent specific to that minigame
        const agentsSvc = getAgentsSvc(); // Assuming getAgentsSvc is available
        const newAgentIbGib = await agentsSvc.createNewAgent({
            metaspace,
            superSpace: undefined, // uses default local user space as the super space
            name: `MinigameAgent-${minigameTjpGib}`,
            api: 'gemini',
            model: GeminiModel.GEMINI_2_0_FLASH,
            availableFunctions: clone(AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT),
            initialSystemText: [
                AGENT_INITIAL_SYSTEM_TEXT_MINIGAMEAGENT,
            ].join('\n'),
            initialChatText: [
                AGENT_INITIAL_CHAT_TEXT_MINIGAMEAGENT,
            ].join('\n'),
            fnGetAPIKey: getDefaultFnGetAPIKey(),
            type: AGENT_SPECIAL_IBGIB_TYPE_MINIGAMEAGENT,
            addToAgentsTag: true,
        });
        await registerDomainIbGibWithAgentIndex({
            domainIbGib: minigameIbGib,
            agentIbGib: newAgentIbGib,
            metaspace,
            space,
        });

        // get the latest context ibgib and rel8 the new minigame to it
        let latestContextIbGib: IbGib_V1 | undefined = undefined;
        const latestContextAddr = await metaspace.getLatestAddr({
            addr: contextAddr,
            space,
        });
        if (latestContextAddr) {
            const resGetLatest =
                await metaspace.get({ addrs: [latestContextAddr], space, });
            if (resGetLatest.errorMsg || (resGetLatest.ibGibs ?? []).length !== 1) {
                throw new Error(`couldn't get latest context ibgib (${latestContextAddr}) from super space (${space.ib}). errorMsg: ${resGetLatest.errorMsg ?? '[unknown error]'} (E: genuuid)`);
            }
            latestContextIbGib = resGetLatest.ibGibs!.at(0)!;
        }
        if (!latestContextIbGib) { throw new Error(`(UNEXPECTED) couldn't get latest context ibgib? (${latestContextAddr}) (E: genuuid)`); }
        const newContextIbGib = await appendToTimeline({
            timeline: latestContextIbGib,
            metaspace,
            rel8nInfos: [{ rel8nName: MINIGAME_REL8N_NAME, ibGibs: [minigameIbGib], }],
            space,
        });


        const minigameAddr = getTjpAddr({ ibGib: minigameIbGib });
        if (!minigameAddr) { throw new Error(`(UNEXPECTED) minigameIbGib wasn't created with a tjp? (E: 98bdb3d37237f8c3880c176840cab325)`); }

        return {
            // newContextIbGib,
            // minigameIbGib,
            // builderId: getTjpAddr({ibGib: minigameIbGib}),
            minigameAddr,
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the minigameBuilderStart command.
 */
export const minigameBuilderStartFunctionInfo: APIFunctionInfo<typeof minigameBuilderStartViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: minigameBuilderStartViaCmd,
    functionImpl: minigameBuilderStartImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                contextIbGibAddr: GEMINI_SCHEMA_MINIGAME_CONTEXT_ADDR,
                name: GEMINI_SCHEMA_MINIGAME_NAME,
                description: GEMINI_SCHEMA_MINIGAME_DESCRIPTION,
                instructions: GEMINI_SCHEMA_MINIGAME_INSTRUCTIONS,
                gameType: GEMINI_SCHEMA_MINIGAME_GAMETYPE,
                // gameVariant: GEMINI_SCHEMA_MINIGAME_GAMEVARIANT,
                keywords: GEMINI_SCHEMA_MINIGAME_KEYWORDS,
            },
            required: [
                'agentId', // base
                'contextIbGibAddr',
                'name',
                'description',
                'instructions',
                'gameType',
                // 'gameVariant',
                'keywords'
            ],
        },
    },
};
