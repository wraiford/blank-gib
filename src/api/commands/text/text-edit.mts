/**
 * @module text-edit.mts Provides the API Function Info to edit an ibgib's `data.text`. This is commonly found on a CommentIbGib_V1.
 *
 * ## notes
 *
 * ### ordering imports
 *
 * import sections always go:
 * 1. non-ibgib deps first
 * 2. @ibgib/helper-gib, @ibgib/encrypt-gib, @ibgib/ts-gib, @ibgib/core-gib packages (in that order)
 * 3. import GLOBAL_LOG_A_LOT then remaining project imports
 * 4. code proper starts with the definition of `const logalot` (if applicable)
 *
 * Each section is separated by a blank line.
 */


import { extractErrorMsg, getTimestamp, getTimestampInTicks, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { getCommentIb } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { getGlobalMetaspace_waitIfNeeded } from '../../../helpers.web.mjs';
import { mut8Timeline } from '../../timeline/timeline-api.mjs';
import { FUNCTION_CALL_EXAMPLES_HEADER } from '../../api-constants.mjs';

const logalot = GLOBAL_LOG_A_LOT;

// #region constants

/**
 * camelCased name of the command itself.
 */
const FUNCTION_NAME = 'editText';

/**
 * agent is the broad command which basically acts like a category of commands at this point.
 */
const CMD_CATEGORY = 'ibgib';
/**
 *
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

const EXAMPLE_INPUT_EDIT_TEXT: Partial<EditIbGibTextOpts> = {
    ibGibAddr: 'comment HelloThereImBob 1748386170000^A2D75E05B14E264619D2ACCCCABF234128E183B4524CC26029E54B84BF7BFD73.61985691826359867236266716461787826378AFFF23984723987FDA2013C8CB',
    newText: `This is the newly edited text`,
    notesToSelf: `Example of an ibgib's data.text property.`,
    repromptWithResult: false,
};
const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_EDIT_TEXT),
].join('\n');
const FUNCTION_DESCRIPTION = [
    `Edits an ibGib's data.text property and performs additional business logic on other fields within the ibGib record, like timestamps, updating the ib, etc.`,
    ``,
    EXAMPLES,
].join('\n');

const FUNCTION_SCHEMA = {
    name: FUNCTION_NAME,
    description: FUNCTION_DESCRIPTION,
    parameters: {
        type: 'object',
        properties: {
            ...COMMAND_BASE_SCHEMA_PROPERTIES,
            spaceId: {
                type: 'string',
                description: `The id of the local user space. If not provided, will use the default local space. Only provide this if you don't want to use the default space. Agents should either leave this unset, or if they are trying to mut8 an ibGib that is inside *their* subspace, then they should provide this. Otherwise, it will look in the default space which will be incorrect. In the future, agents will have a different API for interacting with their subspaces, but for now this may be used (if the agent even has access to their subspace id. it's so early in dev, I'm not sure if this is true.)`,
            },
            ibGibAddr: {
                type: 'string',
                description: 'The content address of the ibGib to edit.',
            },
            newText: {
                type: 'string',
                description: 'The new text to set for the ibGib\'s data.text property.',
            },
        },
        required: [
            'ibGibAddr',
        ],
    },
};

/**
 * @interface EditIbGibTextOpts - Options for the mut8IbGib command.
 *
 * @extends CommandDataBase
 */
interface EditIbGibTextOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    spaceId?: string;
    /**
     * @property ibGibAddr - The address (or tjp address) of the project ibGib to edit.
     */
    ibGibAddr: string;
    /**
     * @property newText - The new text to set for the ibGib's data.text property.
     */
    newText: string;
}

/**
 * @interface EditIbGibTextCommandData - Command data for the mut8IbGib command.
 * @extends CommandDataBase
 */
interface EditIbGibTextCommandData extends CommandDataBase<typeof CMD_CATEGORY, [typeof FUNCTION_NAME]> {
    spaceId?: string;
    /**
     * @property ibGibAddr - The address (or tjp address) of the project ibGib to edit.
     */
    ibGibAddr: string;
    /**
     * @property newText - The new text to set for the ibGib's data.text property.
     */
    newText: string;
}

/**
 * Wrapper function to enqueue the mut8IbGib command.
 * @param {EditIbGibTextOpts} opts - @see {@link EditIbGibTextOpts}
 * @returns {Promise<void>} A promise that resolves when the command finishes execution.
 */
function viaCmd(opts: EditIbGibTextOpts): Promise<IbGib_V1> {
    const commandService = getCommandService();
    const command: EditIbGibTextCommandData = {
        ...opts,
        cmd: CMD_CATEGORY,
        cmdModifiers: CMD_MODIFIERS,
    };
    return new Promise<IbGib_V1>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the mut8IbGib command.
 *
 * @param {EditIbGibTextOpts} opts - @see {@link EditIbGibTextOpts}
 * @returns {Promise<IbGib_V1>} the new timeline ibgib
 */
async function fnImpl(opts: EditIbGibTextOpts): Promise<IbGib_V1> {
    const lc = `[${fnImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        console.log(`${lc} ${CMD_CATEGORY} ${CMD_MODIFIERS} opts: ${pretty(opts)}`);

        let {
            spaceId, ibGibAddr, newText,
        } = opts;

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        if (!metaspace) { throw new Error(`${lc} metaspace falsy (E: 1a3f5e6c8d9a7b01f2e3d4c5b6a708d9)`); }
        const space = await metaspace.getLocalUserSpace({ localSpaceId: spaceId });
        if (!space) {
            if (!spaceId) {
                throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 593028fc4038c1cb713a8b1d757da825)`);
            } else {
                throw new Error(`could not get local user space for spaceId (${spaceId}) (E: 61fc28fbdf3fd69ae7c9214fe74c2825)`);
            }
        }

        newText ??= '';

        if (!ibGibAddr) { throw new Error(`${lc} ibGibAddr is required. (E: genuuid)`); }


        const newIb = getCommentIb({ commentText: newText, addlMetadataText: getTimestampInTicks() });

        // 3. Perform the mut8 transform
        if (logalot) { console.log(`${lc} Mutating timeline ibGib... (I: genuuid)`); }
        const newTimelineIbGib = await mut8Timeline({
            timelineAddr: ibGibAddr,
            mut8Opts: {
                dataToAddOrPatch: {
                    text: newText,
                    textTimestamp: getTimestamp(),
                } as any,
                mut8Ib: newIb,
            },
            metaspace,
            space,
        });

        if (!newTimelineIbGib) {
            throw new Error(`${lc} Mutate timeline transform failed: No new timeline ibGib returned. (E: genuuid)`);
        }

        console.log(`${lc} Mutated timeline ibGib processed.`);

        return newTimelineIbGib;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error; // Re-throw the error to be caught by the command service
    } finally {
        // This finally block will execute regardless of whether the try block succeeds or fails.
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the mut8IbGib command.
 */
export const editTextFunctionInfo: APIFunctionInfo<typeof viaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: viaCmd,
    functionImpl: fnImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: FUNCTION_SCHEMA,
};
