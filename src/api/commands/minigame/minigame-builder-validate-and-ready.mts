import { clone, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { validateIbGibAddr } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { getIbAndGib, } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { getGlobalMetaspace_waitIfNeeded, getIbGibGlobalThis_BlankGib } from "../../../helpers.web.mjs";
import {
    GEMINI_SCHEMA_MINIGAME_MINIGAME_ADDR,
} from "../../../common/minigame/minigame-constants.mjs";
import { MinigameGamePhase, MinigameIbGib_V1 } from "../../../common/minigame/minigame-types.mjs";
import { validateMinigameIsReady } from "../../../common/minigame/minigame-helper.mjs";
import { mut8Timeline } from "../../timeline/timeline-api.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants
const FUNCTION_NAME = 'minigameBuilderValidateAndReady';

/**
 * chat category here as this is a chat-related command.
 */
const CMD_CATEGORY = 'minigame';
/**
 * helloWorld here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];
const EXAMPLE_INPUT_MINIGAMEBUILDER_VALIDATE_AND_READY: Partial<MinigameBuilderValidateAndReadyOpts> = {
    agentId: 'SomeAgentIdHash',
    notesToSelf: `Example of a ${FUNCTION_NAME} function call. Note repromptWithResult is false because this function will activate the minigame in the center panel in the ready-to-play state.`,
    repromptWithResult: false,
    minigameAddr: `minigame TestTypingGame 1750086232000^6E0E9E4934F9742A779D47150B0AB47D4C9F3847627F0E1EA37EC8E20B1BE8FF`,
};

const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_MINIGAMEBUILDER_VALIDATE_AND_READY),
].join('\n');
const FUNCTION_DESCRIPTION = `Validates that a minigame ibgib has enough data to begin. It may already be in progress or not, that doesn't matter. (For example, a typing game requires at least one stimulus.) Once validated, this will set the minigameIbGib.data.playable to true if not already set. If invalid, will return reasons why the minigame is not ready. NOTE: This is the last function REQUIRED for the minigame builder functions. You can still make calls later to augment the minigame, e.g., adding stimuli, but a minigame won't be able to be played until this is called successfully at least once after adding stimuli or any other operations on the minigame ibgib.\n\n${EXAMPLES}`;
// #endregion constants


/**
 * @interface MinigameBuilderValidateAndReadyOpts - Options for the
 * minigameBuilderValidateAndReady command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderValidateAndReadyOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the function
     */
    agentId?: string;
    /**
     * address of the minigame that we're adding stimuli to
     */
    minigameAddr: IbGibAddr;
}
export interface MinigameBuilderValidateAndReadyResult {
    minigameIbGib: MinigameIbGib_V1;

    ready: boolean;
    errors?: string[];
}

/**
 * @interface MinigameBuilderValidateAndReadyCommandData - Command data for the
 * minigameBuilderValidateAndReady command.
 * @extends CommandDataBase
 */
export interface MinigameBuilderValidateAndReadyCommandData extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    /**
     * agent's id doing the function
     */
    agentId?: string;
    /**
     * address of the minigame that we're adding stimuli to
     */
    minigameAddr: IbGibAddr;
}

/**
 * Wrapper function to enqueue the minigameBuilderValidateAndReady command.
 * @param {MinigameBuilderValidateAndReadyOpts} opts - Options for telling the user something.
 * @returns {Promise<MinigameIbGib_V1>} A promise that resolves when the command is enqueued.
 */
function minigameBuilderValidateAndReadyViaCmd(opts: MinigameBuilderValidateAndReadyOpts): Promise<MinigameBuilderValidateAndReadyResult> {
    const lc = `[${minigameBuilderValidateAndReadyViaCmd.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        if (logalot) { console.log(`${lc} minigameBuilderValidateAndReadyViaCmd raw incoming opts: ${pretty(opts)} (I: genuuid)`); }

        const commandService = getCommandService();
        const command: MinigameBuilderValidateAndReadyCommandData = {
            ...opts,
            cmd: CMD_CATEGORY,
            cmdModifiers: CMD_MODIFIERS,
        };
        if (logalot) { console.log(`${lc} minigameBuilderValidateAndReadyViaCmd command: ${pretty(command)} (I: genuuid)`); }
        return new Promise<MinigameBuilderValidateAndReadyResult>((resolve, reject) => {
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
 * Implementation function for the minigameBuilderValidateAndReady command.
 *
 * @param {MinigameBuilderValidateAndReadyOpts} opts
 * @returns {Promise<MinigameBuilderValidateAndReadyResult>} A promise that resolves when the command is executed (immediately).
 */
async function minigameBuilderValidateAndReadyImpl(opts: MinigameBuilderValidateAndReadyOpts): Promise<MinigameBuilderValidateAndReadyResult> {
    const lc = `[${minigameBuilderValidateAndReadyImpl.name}]`;
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

        const latestAddr = await metaspace.getLatestAddr({
            addr: minigameAddr,
            space,
        }) ?? minigameAddr;

        const resGet = await metaspace.get({
            addrs: [latestAddr],
            space,
        });
        if (resGet.errorMsg) { throw new Error(`Could not retrieve ibGib: ${resGet.errorMsg} (E: genuuid)`) }
        if (!resGet.ibGibs || resGet.ibGibs.length === 0) {
            throw new Error(`Could not retrieve minigameIbGib. errorMsg: ${resGet.errorMsg ?? '[unknown error? (E: genuuid)]'}(E: genuuid)`);
        }
        let minigameIbGib = resGet.ibGibs.at(0) as MinigameIbGib_V1;

        const isReadyErrors = await validateMinigameIsReady({ minigameIbGib });

        if (isReadyErrors.length > 0) {
            // go ahead and return the errors
            return {
                minigameIbGib,
                ready: false,
                errors: isReadyErrors,
            }; /* <<<< returns early */
        }

        // ready to go, so start the game and return
        if (!minigameIbGib.data) { throw new Error(`(UNEXPECTED) minigameIbGib.data falsy? (E: 9d5f3ae0d3c897ddda6a2ff8d07ca825)`); }
        if (!minigameIbGib.data.playable || minigameIbGib.data.gamePhase !== MinigameGamePhase.ready) {
            minigameIbGib = await mut8Timeline({
                timeline: minigameIbGib,
                metaspace,
                space,
                mut8Opts: {
                    dataToAddOrPatch: {
                        gamePhase: MinigameGamePhase.ready,
                        playable: true
                    },
                },
            })
        }

        // open the minigame in the currently active project. there is an edge
        // case here that maybe the currently active project is not the one that
        // "contains" the minigame, but wth? very edgy, probably an error
        const ibGibGlobalThis = getIbGibGlobalThis_BlankGib();
        if (!ibGibGlobalThis.projectsComponent) {
            throw new Error(`${lc} (UNEXPECTED) ibGibGlobalThis.projectsComponent falsy? (E: 67bde84c865844e922f008d36dc2b925)`)
        }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo falsy? (E: bbccb81938887dc5a8a309b59c841825)`); }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component) { throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component falsy? (E: f485687d525ebecc28b749f3fd283825)`); }
        ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component.activateIbGib({ ibGib: minigameIbGib }); // spin off

        // wtg
        return { minigameIbGib, ready: true, }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the minigameBuilderValidateAndReady command.
 */
export const minigameBuilderValidateAndReadyFunctionInfo: APIFunctionInfo<typeof minigameBuilderValidateAndReadyViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: minigameBuilderValidateAndReadyViaCmd,
    functionImpl: minigameBuilderValidateAndReadyImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: {
        name: FUNCTION_NAME,
        description: FUNCTION_DESCRIPTION,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                minigameAddr: GEMINI_SCHEMA_MINIGAME_MINIGAME_ADDR,
            },
            required: [
                'agentId', // base. not really required by function, but the schema requires it
                'minigameAddr',
            ],
        },
    },
};
