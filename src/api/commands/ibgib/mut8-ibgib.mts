/**
 * @module mut8IbGib.api-function-info Provides the API Function Info for the `mut8IbGib` command,
 * which allows editing an existing ibGib using the `mut8` transform.
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


import { extractErrorMsg, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { getIbAndGib } from '@ibgib/ts-gib/dist/helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { getGlobalMetaspace_waitIfNeeded } from '../../../helpers.web.mjs';
import { mut8Timeline } from '../../timeline/timeline-api.mjs';
import { FUNCTION_CALL_EXAMPLES_HEADER } from '../../api-constants.mjs';
import { getProjectSafeName, parseProjectIb } from '../../../common/project/project-helper.mjs';

const logalot = GLOBAL_LOG_A_LOT;

// #region constants

/**
 * camelCased name of the command itself.
 */
export const FUNCTION_NAME = 'mut8IbGib';

/**
 * agent is the broad command which basically acts like a category of commands at this point.
 */
const CMD_CATEGORY = 'ibgib';
/**
 * mut8IbGib here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 *
 * This should be camelCased actual name of the function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

/**
 * The ibgib.data map has certain keys that are not allowed to be edited, renamed, or removed.
 */
const DISALLOWED_DATA_KEYS = ['uuid', 'timestamp', 'timestampMs', 'n', 'textTimestamp',];

const EXAMPLE_INPUT_MUT8IBGIB_MUT8PROJECTNAME: Partial<Mut8IbGibOpts> = {
    ibGibAddr: 'project SomeProject 1748386170000^A2D75E05B14E264619D24ABA4F1A1B2328E183B4524CC26029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
    dataToAddOrPatchJSONString: JSON.stringify({ name: 'New Title' }),
    mut8Ib: 'project NewTitle 1748386170000',
    notesToSelf: `Example of editing/adding a project ibgib's "title". In project ibgibs, this is in the "data.name" field, and the 2nd spot in the ib is a alphanumerics-only version of the name.`,
    repromptWithResult: false,
};
const EXAMPLE_INPUT_MUT8IBGIB_MUT8DESCRIPTION: Partial<Mut8IbGibOpts> = {
    ibGibAddr: 'project SomeProject^A2D75E05B14E264619D24ABA4F1A1B2328E183B4524CC26029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
    dataToAddOrPatchJSONString: JSON.stringify({ description: 'Updated description for the project. You do not have to include all the properties, only the ones you want to change/patch.' }),
    notesToSelf: `Example of editing/adding an ibGib's description. This will change the description in the ibGib's data map.`,
    repromptWithResult: false,
};
const EXAMPLE_INPUT_MUT8IBGIB_REMOVEKEY: Partial<Mut8IbGibOpts> = {
    ibGibAddr: 'project SomeProject^AAAA2827879982375961098098B239047928374987987F6029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
    dataToRemoveJSONString: JSON.stringify({ identity: { middleInitial: '' } }),
    notesToSelf: `Example of removing a nested key. This will delete the "middleInitial" property from the "identity" object in an ibgib's data map.`,
    repromptWithResult: true,
};
const EXAMPLE_INPUT_MUT8IBGIB_RENAMEKEY: Partial<Mut8IbGibOpts> = {
    ibGibAddr: 'project SomeProject^AAAA2827879982375961098098B239047928374987987F6029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
    dataToRenameJSONString: JSON.stringify({ identity: { oldKeyName: 'newKeyName' } }),
    notesToSelf: `Example of renaming a key. This will rename the "oldKeyName" key to "newKeyName" in an ibgib's data map.`,
    repromptWithResult: false,
};
const EXAMPLE_INPUT_MUT8IBGIB_MUT8IB: Partial<Mut8IbGibOpts> = {
    ibGibAddr: 'project SomeProject^AAAA2827879982375961098098B239047928374987987F6029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
    mut8Ib: 'project SomeNewIb',
    notesToSelf: `Example of renaming a key. This will rename the "ib" value, in this case "project SomeProject" to the new value. Empty values will throw.`,
    repromptWithResult: true,
};
const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_MUT8IBGIB_MUT8PROJECTNAME),
    pretty(EXAMPLE_INPUT_MUT8IBGIB_MUT8DESCRIPTION),
    pretty(EXAMPLE_INPUT_MUT8IBGIB_REMOVEKEY),
    pretty(EXAMPLE_INPUT_MUT8IBGIB_RENAMEKEY),
    pretty(EXAMPLE_INPUT_MUT8IBGIB_MUT8IB),
].join('\n');
const FUNCTION_DESCRIPTION = [
    `Edits an ibGib's intrinsic data map via the mut8 transform.`,
    `This can include setting/updating an ibgib's data, renaming keys or removing data properties entirely, or changing the ib.`,
    `It operates on a specific ibGib identified by its address.`,
    `**Note**: Certain intrinsic data properties are disallowed from being edited, renamed, or removed, including: \`${DISALLOWED_DATA_KEYS.join('`, `')}\`. Any attempts to modify these paths will be ignored.`,
    `In the business domain, this can include multiple things, like editing a name, description, or other internal property. The following are only a couple of examples, but really it's any internal data for an ibgib.`,
    ``,
    EXAMPLES,
    `**Note**: Even though each one individually is optional, at least one of dataToRenameJSONString, dataToRemoveJSONString, dataToAddOrPatchJSONString, or mut8Ib is required.`,
].join('\n');

const JSON_CAVEAT = `Ibgib data can have any structure, so there is no way to know the keys beforehand. OpenAPI schema only allows for known props. So this arg should be a valid JSON string, i.e., the output of JSON.stringify(actualArg).`;
const DISALLOWED_CAVEAT = `Disallowed paths like "uuid" or "timestamp" cannot be added or patched. See function description for all disallowed keys.`;

const MUT8_IBGIB_SCHEMA = {
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
            dataToRenameJSONString: {
                type: 'object',
                description: [
                    `Specifies data properties to rename the key.`,
                    DISALLOWED_CAVEAT,
                    JSON_CAVEAT,
                ].join('\n'),
            },
            dataToRemoveJSONString: {
                type: 'string',
                description: [
                    `Specifies data properties to remove entirely.`,
                    DISALLOWED_CAVEAT,
                    JSON_CAVEAT,
                ].join('\n'),
            },
            dataToAddOrPatchJSONString: {
                type: 'string',
                description: [
                    `Subset of ibgib.data to be added or patched (or upserted if you like). So if you want to change the "name" property, then you specify that as the stringified version of { "name": "Some Name" }.`,
                    DISALLOWED_CAVEAT,
                    JSON_CAVEAT,
                ].join('\n'),
            },
            mut8Ib: {
                type: 'string',
                description: 'Optional. If provided, will mutate the ib of the ibGib.',
            },
        },
        required: [
            'ibGibAddr',
        ],
    },
};

/**
 * @interface Mut8IbGibOpts - Options for the mut8IbGib command.
 *
 * @extends CommandDataBase
 */
export interface Mut8IbGibOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    spaceId?: string;
    /**
     * @property ibGibAddr - The address (or tjp address) of the project ibGib to edit.
     */
    ibGibAddr: string;
    /**
     * @property dataToRenameJSONString - Info to rename keys. Should be an object where each value should either be
     * a string or an object. If it's a string, then the corresponding key will
     * be renamed to that value. If it's an object, then it will recurse at that
     * key. Disallowed paths include: \`${DISALLOWED_DATA_PATHS.join('`, `')}\`.
     */
    dataToRenameJSONString?: string;
    /**
     * @property dataToRemoveJSONString - Info to remove keys. Should be an object where each value should either be
     * a string or an object. If it's a string, then the corresponding key (and its value)
     * will be removed (the string value in the dataToRemove object is ignored). If it's an object,
     * then it will recurse at that key. Disallowed paths include: \`${DISALLOWED_DATA_PATHS.join('`, `')}\`.
     */
    dataToRemoveJSONString?: string;
    /**
     * @property dataToAddOrPatchJSONString - Data object that contains only additive information for ibGib's intrinsic data.
     * Disallowed paths include: \`${DISALLOWED_DATA_PATHS.join('`, `')}\`.
     *
     * JSON.stringified version of the dataToAddOrPatchJSONString. This is to overcome the
     * poor OpenAPI schema limitations, because we do not know the exact allowed
     * properties ahead of time.
     */
    dataToAddOrPatchJSONString?: string;
    /**
     * @property mut8Ib - If given, will mut8 the ib (without forking the entire ibGib).
     */
    mut8Ib?: string;
    /**
     * used in simplified functions
     */
    newName?: string;
    /**
     * used in simplified functions
     */
    newDescription?: string;
}

/**
 * @interface Mut8IbGibCommandData - Command data for the mut8IbGib command.
 * @extends CommandDataBase
 */
export interface Mut8IbGibCommandData extends CommandDataBase<typeof CMD_CATEGORY, [typeof FUNCTION_NAME]> {
    spaceId?: string;
    /**
     * @see {@link Mut8IbGibOpts.ibGibAddr}
     */
    ibGibAddr: string;
    /**
     * @see {@link Mut8IbGibOpts.dataToRenameJSONString}
     */
    dataToRenameJSONString?: string;
    /**
     * @see {@link Mut8IbGibOpts.dataToRemoveJSONString}
     */
    dataToRemoveJSONString?: string;
    /**
     * @see {@link Mut8IbGibOpts.dataToAddOrPatchJSONString}
     */
    dataToAddOrPatchJSONString?: string;
    /**
     * @see {@link Mut8IbGibOpts.mut8Ib} If given, will mut8 the ib (without forking the entire ibGib).
     */
    mut8Ib?: string;
    /**
     * used in simplified functions
     */
    newName?: string;
    /**
     * used in simplified functions
     */
    newDescription?: string;
}

/**
 * Wrapper function to enqueue the mut8IbGib command.
 * @param {Mut8IbGibOpts} opts - @see {@link Mut8IbGibOpts}
 * @returns {Promise<void>} A promise that resolves when the command finishes execution.
 */
export function mut8IbGibViaCmd(opts: Mut8IbGibOpts): Promise<IbGib_V1> {
    const commandService = getCommandService();
    const command: Mut8IbGibCommandData = {
        ...opts,
        cmd: CMD_CATEGORY,
        cmdModifiers: CMD_MODIFIERS,
        mut8Ib: opts.mut8Ib?.trim() || undefined, // Ensure mut8Ib is not an empty string
    };
    return new Promise<IbGib_V1>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the mut8IbGib command.
 *
 * @param {Mut8IbGibOpts} opts - @see {@link Mut8IbGibOpts}
 * @returns {Promise<IbGib_V1>} the new timeline ibgib
 */
export async function mut8IbGibImpl(opts: Mut8IbGibOpts): Promise<IbGib_V1> {
    const lc = `[${mut8IbGibImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        console.log(`${lc} ${CMD_CATEGORY} ${CMD_MODIFIERS} opts: ${pretty(opts)}`);

        let {
            spaceId,
            ibGibAddr, dataToRenameJSONString, dataToRemoveJSONString,
            dataToAddOrPatchJSONString, mut8Ib, newName, newDescription,
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

        if (newName || newDescription !== undefined) {
            if (newName) {
                if (dataToAddOrPatchJSONString) { throw new Error(`cannot have newName and dataToAddOrPatchJSONString in the same function call. (E: 72bf6c3c8d8e18a9284f5b0e16d63525)`); }
                dataToAddOrPatchJSONString = JSON.stringify({ name: newName });
                const newSafeName = getProjectSafeName({ name: newName });
                const latestIbGibAddr = await metaspace.getLatestAddr({ addr: ibGibAddr, space });
                const { ib: projectIb } = getIbAndGib({ ibGibAddr: latestIbGibAddr });
                const { addlMetadataText, atom, } = parseProjectIb({ ib: projectIb });
                mut8Ib = `${atom} ${newSafeName} ${addlMetadataText}`;
                if (newDescription) {
                    dataToAddOrPatchJSONString = JSON.stringify({ description: newDescription });
                }
            } else {
                dataToAddOrPatchJSONString = JSON.stringify({ description: newDescription });
            }
        }
        const dataToRename = dataToRenameJSONString ?
            JSON.parse(dataToRenameJSONString) :
            undefined;
        const dataToRemove = dataToRemoveJSONString ?
            JSON.parse(dataToRemoveJSONString) :
            undefined;
        const dataToAddOrPatch = dataToAddOrPatchJSONString ?
            JSON.parse(dataToAddOrPatchJSONString) :
            undefined;

        if (!ibGibAddr) { throw new Error(`${lc} ibGibAddr is required. (E: genuuid)`); }

        // 1. Load the project ibGib

        // 2. Filter out disallowed paths from the mut8 options.
        // Note: filterDisallowedPaths handles nested paths as well.
        const fnValidateMap = (map: any, paramName: string) => {
            if (!map) { return; /* <<<< returns early */ }
            const mapKeys = Object.keys(map);
            mapKeys.forEach(key => {
                if (DISALLOWED_DATA_KEYS.includes(key)) {
                    throw new Error(`invalid map. includes disallowed path/key: ${key}. cannot contain any of the following keys: ${DISALLOWED_DATA_KEYS} (E: 855afe854d78e4bf68e7ad88798d0825) (E: fc9c2c9549783685c859c3c4fbb84825)`);
                }
            })
        }

        if (dataToRename) { fnValidateMap(dataToRename, 'dataToRename'); }
        if (dataToRemove) { fnValidateMap(dataToRemove, 'dataToRemove'); }
        if (dataToAddOrPatch) { fnValidateMap(dataToAddOrPatch, 'dataToAddOrPatch'); }
        if (mut8Ib) {
            const invalidChars = ['^'];
            invalidChars.forEach(x => {
                if (mut8Ib!.includes(x)) {
                    throw new Error(`invalid mut8Ib property. includes character: ${x}. Cannot include any of the following characters: ${invalidChars} (E: 855afe854d78e4bf68e7ad88798d0825)`);
                }
            });
            if (typeof mut8Ib !== 'string' || mut8Ib.length === 0) {
                throw new Error(`${lc} mut8Ib must be a non-empty string. (E: 392678cef0a5458e0e4bca6869dc6825)`);
            }
        }

        // 3. Perform the mut8 transform
        if (logalot) { console.log(`${lc} Mutating timeline ibGib... (I: genuuid)`); }
        const newTimelineIbGib = await mut8Timeline({
            timelineAddr: ibGibAddr,
            mut8Opts: {
                dataToRename,
                dataToRemove,
                dataToAddOrPatch,
                mut8Ib,
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
 * OpenAPI schema for the ibGibAddr parameter.
 */
const GEMINI_SCHEMA_PROJECT_ADDR = {
    type: 'string',
    description: 'The address (or tjp address) of the project ibGib to edit.',
};

/**
 * Helper to create OpenAPI schema for data objects with disallowed paths.
 */
function getDataSchema({
    description,
    disallowedPaths,
}: {
    description: string,
    disallowedPaths: string[],
}): any {
    return {
        type: 'object',
        description: `${description} Disallowed paths include: ${disallowedPaths.join(', ')}.`,
        // We can't define specific properties here because the structure is dynamic,
        // but we emphasize the disallowed paths in the description.
        additionalProperties: true, // Allow any other properties
    };
}

/**
 * API function info for the mut8IbGib command.
 */
export const mut8IbGibFunctionInfo: APIFunctionInfo<typeof mut8IbGibViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: mut8IbGibViaCmd,
    functionImpl: mut8IbGibImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: MUT8_IBGIB_SCHEMA,
};
