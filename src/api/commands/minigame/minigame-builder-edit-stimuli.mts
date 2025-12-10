import { clone, extractErrorMsg, getUUID, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { validateIbGibAddr } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { getIbAndGib, } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { getGlobalMetaspace_waitIfNeeded } from "@ibgib/web-gib/dist/helpers.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "@ibgib/web-gib/dist/api/commands/command-constants.mjs";
import { getCommandService } from "@ibgib/web-gib/dist/api/commands/command-service-v1.mjs";
import { CommandDataBase } from "@ibgib/web-gib/dist/api/commands/command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "@ibgib/web-gib/dist/api/api-constants.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import {
    GEMINI_SCHEMA_MINIGAME_CONTEXT_ADDR,
} from "../../../common/minigame/minigame-constants.mjs";
import { Minigame_TypingStimulus, StimulusEditInfo } from "../../../common/minigame/typing/typing-types.mjs";
import { editStimuli_typing, getNewTypingEntryId } from "../../../common/minigame/typing/typing-helper.mjs";
import { EXPECTED_RESPONSE_TYPE_VALID_VALUES, ExpectedResponseType } from "../../../common/minigame/typing/typing-constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;


// #region constants
const FUNCTION_NAME = 'minigameBuilderEditStimuli';

/**
 * chat category here as this is a chat-related command.
 */
const CMD_CATEGORY = 'minigame';
/**
 * helloWorld here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];
const EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI: Partial<MinigameBuilderEditStimuliOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: `Example of a ${FUNCTION_NAME} function call. Note repromptWithResult is true because we usually want to either make additional changes to prepare the minigame or start the user playing it.`,
    repromptWithResult: true,
    minigameAddr: `minigame TypingStanda 1750442279000^7EB8A7894384CD897423AC760FAC376808BF87431660871928743632746BBB32`,
    stimulusEditInfos: [
        {
            action: 'add',
            newStimulus: {
                // srcCommentAddr: "comment TypingDrills^6FC469DC624B1438500E9AF22BC18D23FD192843B69994F2B89ADEA90A3F4A73.A779D746A68743156638756262876A16387626222637456872CDCCC297234672",
                entryType: 'text',
                value: 'Now is the time for all good men to come to the aid of their country.',
                language: 'en-US',
                notes: 'Standard English typing drills.'
            },
        },
        {
            action: 'add',
            newStimulus: {
                // srcCommentAddr: "comment TypingDrills^6FC469DC624B1438500E9AF22BC18D23FD192843B69994F2B89ADEA90A3F4A73.A779D746A68743156638756262876A16387626222637456872CDCCC297234672",
                entryType: 'text',
                value: 'The quick brown fox jumped over the lazy dogs.',
                language: 'en-US',
                notes: 'Standard English typing drills.'
            },
        },
    ]
};
const EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI_ANTIPHONY: Partial<MinigameBuilderEditStimuliOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: `Example of a ${FUNCTION_NAME} function call in a typing antiphony game. Note repromptWithResult is true because we usually want to either make additional changes to prepare the minigame or start the user playing it.`,
    repromptWithResult: true,
    minigameAddr: `minigame PartitaDue 1750442289000^0389D0F0CABC28767ED766F30C16D4E9061ED07F65D87F9F904193388EC61F79`,
    stimulusEditInfos: [
        {
            action: 'add',
            newStimulus: {
                // srcCommentAddr: "comment TypingDrills^6FC469DC624B1438500E9AF22BC18D23FD192843B69994F2B89ADEA90A3F4A73.A779D746A68743156638756262876A16387626222637456872CDCCC297234672",
                entryType: 'text',
                value: `Qual è la capitale dell'Italia?`,
                expectedResponse: 'Roma',
                expectedResponseType: ExpectedResponseType.exact,
                language: 'it-IT',
                notes: 'semplici curiosità italiane',
            }
        },
        {
            action: 'add',
            newStimulus: {
                // srcCommentAddr: "comment TypingDrills^6FC469DC624B1438500E9AF22BC18D23FD192843B69994F2B89ADEA90A3F4A73.A779D746A68743156638756262876A16387626222637456872CDCCC297234672",
                entryType: 'text',
                value: `Come ti chiami?`,
                expectedResponse: 'Mi chiamo Bill.',
                expectedResponseType: ExpectedResponseType.exact,
                language: 'it-IT',
                notes: 'frase semplice italiana',
            }
        },
    ]
};
const EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI_FITB: Partial<MinigameBuilderEditStimuliOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: `Example of a ${FUNCTION_NAME} function call in a typing FITB (fill-in-the-blank) game. Note repromptWithResult is true because we usually want to either make additional changes to prepare the minigame or start the user playing it.`,
    repromptWithResult: true,
    minigameAddr: `minigame PartitaTre 1750442289900^0DCCA695B825619571234964895718956AF2318731489658971986943860984C`,
    stimulusEditInfos: [
        {
            action: 'add',
            newStimulus: {
                entryType: 'text',
                value: `Qual è la capitale dell'Italia?`,
                expectedResponse: 'Roma',
                expectedResponseType: ExpectedResponseType.exact,
                language: 'it-IT',
                notes: 'semplici curiosità italiane',
            }
        },
        {
            action: 'add',
            newStimulus: {
                entryType: 'text',
                value: `Come ti chiami?`,
                expectedResponse: 'Mi chiamo Bill.',
                expectedResponseType: ExpectedResponseType.exact,
                language: 'it-IT',
                notes: 'frase semplice italiana',
            }
        },
    ]
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_TELLUSER)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI),
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI_ANTIPHONY),
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_EDIT_STIMULI_FITB),
].join('\n');
const FUNCTION_DESCRIPTION = `Continues building a minigame by adding one or more stimuli. Requires the game to be validated. If already previously validated, will be required to validate again.\n\n${EXAMPLES}`;
// #endregion constants


/**
 * @interface MinigameBuilderEditStimuliOpts - Options for the
 * minigameBuilderEditStimuli command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderEditStimuliOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the telling
     */
    agentId?: string;
    /**
     * address of the minigame that we're adding stimuli to
     */
    minigameAddr: IbGibAddr;
    /**
     * stimuli to add to the typing minigame
     */
    stimulusEditInfos: StimulusEditInfo[];
}

export interface MinigameBuilderEditStimuliResult {
    success: boolean;
    /**
     * This is ACTUALLY the tjp address, but I'm trying to keep it simple for
     * the model to understand during the builder process.
     */
    minigameAddr: IbGibAddr;
}

/**
 * @interface MinigameBuilderEditStimuliCommandData - Command data for the
 * minigameBuilderEditStimuli command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderEditStimuliCommandData extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the telling
     */
    agentId?: string;
    /**
     * address of the minigame that we're adding stimuli to
     */
    minigameAddr: IbGibAddr;
    /**
     * stimuli to add to the typing minigame
     *
     * ## notes on why Partial
     *
     * I have it partial because I don't want an agent passing in the id,
     * rather, we give the id here in the implementation.
     */
    stimulusEditInfos: StimulusEditInfo[];
}

/**
 * Wrapper function to enqueue the minigameBuilderEditStimuli command.
 * @param {MinigameBuilderEditStimuliOpts} opts - Options for telling the user something.
 * @returns {Promise<MinigameBuilderEditStimuliResult>} A promise that resolves when the command is enqueued.
 */
function minigameBuilderEditStimuliViaCmd(opts: MinigameBuilderEditStimuliOpts): Promise<MinigameBuilderEditStimuliResult> {
    const lc = `[${minigameBuilderEditStimuliViaCmd.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        if (logalot) { console.log(`${lc} minigameBuilderEditStimuliViaCmd raw incoming opts: ${pretty(opts)} (I: genuuid)`); }

        const commandService = getCommandService();
        const command: MinigameBuilderEditStimuliCommandData = {
            ...opts,
            cmd: CMD_CATEGORY,
            cmdModifiers: CMD_MODIFIERS,
        };
        if (logalot) { console.log(`${lc} minigameBuilderEditStimuliViaCmd command: ${pretty(command)} (I: genuuid)`); }
        return new Promise<MinigameBuilderEditStimuliResult>((resolve, reject) => {
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
 * Implementation function for the minigameBuilderEditStimuli command.
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
 * @param {MinigameBuilderEditStimuliOpts} opts - Options for telling the user something.
 * @returns {Promise<MinigameBuilderEditStimuliResult>} A promise that resolves when the command is executed (immediately).
 */
async function minigameBuilderEditStimuliImpl(opts: MinigameBuilderEditStimuliOpts): Promise<MinigameBuilderEditStimuliResult> {
    const lc = `[${minigameBuilderEditStimuliImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        console.log(`${lc} opts: ${pretty(opts)}`);

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        const minigameAddr = opts.minigameAddr;
        if (!minigameAddr) { throw new Error(`minigameAddr is falsy (was not provided by model if this was a function call request). This should be required in the gemini schema. (E: genuuid)`); }

        const addrErrors = validateIbGibAddr({ addr: minigameAddr }) ?? [];
        if (addrErrors.length > 0) {
            throw new Error(`${lc} agent has provided a non-ibgib addr for minigameAddr: ${minigameAddr}. addrErrors: ${addrErrors}. opts: ${pretty(opts)} (E: genuuid)`)
        }
        if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: minigameAddr }).gib })) {
            throw new Error(`agent has tried calling this with a primitive context address. opts: ${pretty(opts)} (E: genuuid)`);
        }
        const space = await metaspace.getLocalUserSpace({ lock: false });
        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: genuuid)`); }

        if ((opts.stimulusEditInfos ?? []).length === 0) {
            throw new Error(`opts.stimulusEditInfos is either falsy or empty.  (E: 84f6482680b85790e8ab21a837b39825)`);
        }

        for (const info of opts.stimulusEditInfos) {
            if (info.newStimulus) {
                info.newStimulus.id ??= await getNewTypingEntryId(); // arbitrary
            }
        }

        /**
         * we don't return this to avoid confusing the agent with extra detail.
         * the agent uses the tjpAddr when referencing the minigame.
         */
        const _newMinigameIbGib = await editStimuli_typing({
            stimuliEditInfos: opts.stimulusEditInfos,
            minigameAddr: minigameAddr,
        });

        return {
            success: true,
            minigameAddr: opts.minigameAddr, // tjpAddr
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

const GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'Id of the stimulus, should be unique. If you\'re adding/inserting a new stimulus, then this will be auto-generated.' },
        entryType: {
            type: 'string',
            enum: ['text'],
            description: `What type of stimulus. Right now, this is only "text" because we're only doing text-based stimulation. But in the future, this enum will include other types for other modalities.`
        },
        value: { type: 'string', description: `Actual content of the stimulus.` },
        language: {
            type: 'string',
            description: `natural name/identifier of the language. there is no form enforced, but an IETF code (locale) usable in JavaScript with, e.g., \`Intl\` is recommended, e.g., "en-US", "ko-Kore-KR"`
        },
        expectedResponse: { type: 'string', description: `Expected response value when this stimulus is shown to the user.` },
        expectedResponseType: {
            type: 'string',
            enum: EXPECTED_RESPONSE_TYPE_VALID_VALUES,
            description: [
                `Determines how to interpret expectedResponse as follows:`,
                `* exact: the user should type expectedResponse character by character to match this stimulus' value.`,
                `* fill-in-the-blank: the user should type what goes in the stimulus' blank(s).`,
                `* answer: the user should answer the question with something equivalent to expectedResponse. If there is only one exact answer, you can use this or 'exact'.`,
            ].join('\n'),
        },
    },
    required: [
        'entryType',
        'value',
        'language',
        'expectedResponse',
        'expectedResponseType',
    ],
}

// const GEMINI_SCHEMA_MINIGAME_TYPING_STIMULI = {
//     type: 'array',
//     items: GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS,
// }

const GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS_EDIT_INFO = {
    type: 'object',
    properties: {
        action: {
            type: 'string',
            enum: ['add', 'edit', 'insert', 'delete'],
            description: `What type of editing action to take. NOTE: When you are editing, inserting, or deleting, you MUST include either the index of the stimulus in minigame.data.gameMeta.allStimuli array or the correct id of the stimulus in that array. Note that the applicable index may change if you delete any stimuli, so often the stimulusId is the safer option. If you don't know the stimulus.id, then just call getIbGibs for the minigame, using "getLatest: true" and that result will have all of the stimuli in its data.gameMeta.`,
        },
        newStimulus: GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS,
        index: {
            type: 'number',
            description: `If you are editing/inserting/deleting a stimulus, then this or stimulusId is REQUIRED. You can get this id by looking in the minigame's data.gameMeta.allStimuli array.`,
        },
        stimulusId: {
            type: 'string',
            description: `If you are editing/inserting/deleting a stimulus, then this or stimulusId is REQUIRED. You can get this id by looking in the minigame's data.gameMeta.allStimuli array.`,
        },
    },
    required: [
        'action',
        'newStimulus'
    ],
}
const GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS_EDIT_INFOS = {
    type: 'array',
    items: GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS_EDIT_INFO,
}

/**
 * API function info for the minigameBuilderEditStimuli command.
 */
export const minigameBuilderEditStimuliFunctionInfo: APIFunctionInfo<typeof minigameBuilderEditStimuliViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: minigameBuilderEditStimuliViaCmd,
    functionImpl: minigameBuilderEditStimuliImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                minigameAddr: GEMINI_SCHEMA_MINIGAME_CONTEXT_ADDR,
                stimulusEditInfos: GEMINI_SCHEMA_MINIGAME_TYPING_STIMULUS_EDIT_INFOS,
            },
            required: [
                'agentId', // base, required when agent uses this cmd but not required in opts/cmd proper
                'minigameAddr',
                'stimulusEditInfos',
            ],
        },
    },
};
