/**
 * @module get-ibgibs.mts
 * Provides the API Function Info for the `getIbGibs` command, which allows
 * editing an existing ibGib using the `mut8` transform.
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
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { IbGibAddr } from '@ibgib/ts-gib/dist/types.mjs';
import { SpaceId } from '@ibgib/core-gib/dist/witness/space/space-types.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { getGlobalMetaspace_waitIfNeeded } from '../../../helpers.web.mjs';
import { FUNCTION_CALL_EXAMPLES_HEADER } from '../../api-constants.mjs';
import { getLatestAddrs } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';

const logalot = GLOBAL_LOG_A_LOT;

type IbGibMap = Record<IbGibAddr, IbGib_V1 | undefined>;

// #region constants

/**
 * camelCased name of the command itself.
 */
const FUNCTION_NAME = 'getIbGibs';

/**
 * agent is the broad command which basically acts like a category of commands at this point.
 */
const CMD_CATEGORY = 'ibgib';
/**
 * getIbGibs here is the specific command modifier which narrows down to a command
 * instance, similar to a fully curried function.
 *
 * This should be camelCased actual name of the function.
 */
const CMD_MODIFIERS: string[] = [FUNCTION_NAME];

const EXAMPLE_INPUT_GETIBGIBS_SINGLE: Partial<GetIbGibsOpts> = {
    ibGibAddrs: ['project SomeProject 1748386170000^A2D75E05B14E264619D24ABA4F1A1B2328E183B4524CC26029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994'],
    notesToSelf: `Example of getting a single ibgib. Note that even though it's only getting a single ibgib, it still passes in an array. Usually reprompt is set because you're calling this to see the full ibgib record(s).`,
    repromptWithResult: true,
};
const EXAMPLE_INPUT_GETIBGIBS_MULTIPLE: Partial<GetIbGibsOpts> = {
    ibGibAddrs: [
        'project SomeProject 1748386170000^A2D75E05B14E264619D24ABA4F1A1B2328E183B4524CC26029E54B84BF7BFD73.02544DDD1E042D481EAF62E36229EEC54F20C1899250D6F664ABB48A2013C994',
        'comment HelloWorld^98289357698348694683943689487958972634583644598269186EA90A3F4A73.298986986BC82792837498759817F9827395872AC87519CDAFFE8175786E5098',
    ],
    notesToSelf: `Example of getting multiple ibgibs. Usually reprompt is set because you're calling this to see the full ibgib record(s).`,
    repromptWithResult: true,
};
const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_GETIBGIBS_SINGLE),
    pretty(EXAMPLE_INPUT_GETIBGIBS_MULTIPLE),
].join('\n');
const FUNCTION_DESCRIPTION = [
    `Gets one or more full ibgib records via their addrs.`,
    `Note that all of these must be in a single space, determined by the spaceId arg. IF not provided, then the default local user space will be used.`,
    EXAMPLES,
].join('\n');

// #region gemini schemas
export const GEMINI_SCHEMA_IBGIB_ADDRS = {
    type: 'array',
    description: 'The ibGib addresses (ib^gib) of the ibGibs to load.',
    items: {
        type: 'string',
        description: 'caret-delimited ib^gib address, e.g., "comment HelloWorld^98289357698348694683943689487958972634583644598269186EA90A3F4A73.298986986BC82792837498759817F9827395872AC87519CDAFFE8175786E5098"',
    }
};
const GET_IBGIBS_SCHEMA = {
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
            ibGibAddrs: GEMINI_SCHEMA_IBGIB_ADDRS,
            getLatest: {
                type: 'boolean',
                description: 'Set to true if you want to get the latest ibgib in a timeline for the given incoming ibGibAddr. This is usually going to be true, unless you are specifically looking for ibGibs in the past or some other use case where you want the specific ibGib in time, so agents should explicitly decide this before calling this function (but no need to tell the user or anything, just make this decision).'
            }
        },
        required: [
            'ibGibAddrs',
        ],
    },
};
// #endregion gemini schemas

/**
 * @interface GetIbGibsOpts - Options for the getIbGibs command.
 *
 * @extends CommandDataBase
 */
export interface GetIbGibsOpts extends CommandDataBase<typeof CMD_CATEGORY, typeof CMD_MODIFIERS> {
    spaceId?: SpaceId;
    /**
     * @property ibGibAddr - The address (or tjp address) of the project ibGib to edit.
     */
    ibGibAddrs: IbGibAddr[];
    /**
     * @property getLatest - flag that if true will get the latest version of
     * the ibGib registered with the space.
     */
    getLatest?: boolean;
}

/**
 * @interface GetIbGibsCommandData - Command data for the getIbGibs command.
 * @extends CommandDataBase
 */
export interface GetIbGibsCommandData extends CommandDataBase<typeof CMD_CATEGORY, [typeof FUNCTION_NAME]> {
    /**
     * @see {@link GetIbGibsOpts.spaceId}
     */
    spaceId?: string;
    /**
     * @see {@link GetIbGibsOpts.ibGibAddrs}
     */
    ibGibAddrs: IbGibAddr[];
    /**
     * @see {@link GetIbGibsOpts.getLatest}
     */
    getLatest?: boolean;
}

export type GetIbGibsResult = IbGibMap;

/**
 * Wrapper function to enqueue the getIbGibs command.
 * @param {GetIbGibsOpts} opts - @see {@link GetIbGibsOpts}
 * @returns {Promise<void>} A promise that resolves when the command finishes execution.
 */
function getIbGibsViaCmd(opts: GetIbGibsOpts): Promise<GetIbGibsResult> {
    const commandService = getCommandService();
    const command: GetIbGibsCommandData = {
        ...opts,
        cmd: CMD_CATEGORY,
        cmdModifiers: CMD_MODIFIERS,
    };
    return new Promise<GetIbGibsResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the getIbGibs command.
 *
 * @param {GetIbGibsOpts} opts - @see {@link GetIbGibsOpts}
 * @returns {Promise<IbGib_V1>} the new timeline ibgib
 */
async function getIbGibsImpl(opts: GetIbGibsOpts): Promise<GetIbGibsResult> {
    const lc = `[${getIbGibsImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        console.log(`${lc} ${CMD_CATEGORY} ${CMD_MODIFIERS} opts: ${pretty(opts)}`);

        let { spaceId, ibGibAddrs, getLatest } = opts;

        if (!ibGibAddrs) { throw new Error(`(UNEXPECTED) ibGibAddrs falsy? (E: e9beaad8ab3cf56608dd5fc79c4c1825)`); }
        if (ibGibAddrs.length === 0) { throw new Error(`ibGibAddrs is empty (E: f0b1462f482872acba0612c8eb461925)`); }

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        if (!metaspace) { throw new Error(`${lc} metaspace falsy ($1: 85aa77c76e583edda3549ff59fadf825)`); }
        const space = await metaspace.getLocalUserSpace({ localSpaceId: spaceId });
        if (!space) {
            if (!spaceId) {
                throw new Error(`(UNEXPECTED) couldn't get default local user space? ($1: 9b1528024148052dd871b4f323881825)`);
            } else {
                throw new Error(`could not get local user space for spaceId (${spaceId}) ($1: genuuid)`);
            }
        }

        let addrToLatestAddrMap: { [addr: string]: IbGibAddr } = {};
        if (getLatest) {
            const resLatestAddrs = await getLatestAddrs({ addrs: ibGibAddrs, space });
            if (!resLatestAddrs.data) { throw new Error(`(UNEXPECTED) resLatestAddrs.data falsy? we tried calling getLatestAddrs and this means there is a problem lower in the lib. (E: 0baaf8072abd4feed8330ab503925b25)`); }
            if (resLatestAddrs.data.latestAddrsMap) {
                // addrToLatestAddrMap = resLatestAddrs.data.latestAddrsMap;
                Object.entries(resLatestAddrs.data.latestAddrsMap)
                    .forEach(([addr, latestAddr]) => {
                        if (latestAddr) {
                            addrToLatestAddrMap[addr] = latestAddr;
                        } else {
                            debugger; // warn - we're getting latest addrs and I don't know what it means downstream when we get a null for latest addr.
                            console.warn(`${lc} we're getting latest addrs and I don't know what it means downstream when we get a null for latest addr. (W: bb1db99ccf189afff83a1b5807263a25)`);
                            addrToLatestAddrMap[addr] = addr;
                        }
                    });
            } else {
                throw new Error(`(UNEXPECTED) resLatestAddrs.data.latestAddrsMap falsy? we tried calling getLatestAddrs and this was supposed to be the resulting map. This means there is a problem lower in the lib. (E: 9dcca8343a284dfb1a43cf282b82f825)`);
            }
        }

        const addrsToGet = getLatest ?
            Object.values(addrToLatestAddrMap) :
            ibGibAddrs;

        if (addrsToGet.length !== ibGibAddrs.length) {
            throw new Error(`(UNEXPECTED) addrsToGet.length !== ibGibAddrs.length? at this point it's assumed that these are the same length (E: 745698a1ba78a14077d648e8d0150825)`);
        }

        let resGet = await metaspace.get({
            addrs: addrsToGet,
            space,
        });

        if (resGet.errorMsg || (resGet.ibGibs ?? []).length !== addrsToGet.length) {
            throw new Error(`getIbGibs failed. error: ${extractErrorMsg(resGet.errorMsg ?? `[unknown error. resGet.ibGib length (${(resGet.ibGibs ?? []).length}). addrsToGet.length (${addrsToGet.length})]`)} (E: 09aca916068c6254580f5e29fb63e825)`);
        }

        const resMap: IbGibMap = {};

        resGet.ibGibs!.forEach(ibGib => {
            const ibGibAddr = getIbGibAddr({ ibGib });
            const addr = addrsToGet.find(x => x === ibGibAddr);
            if (!addr) { throw new Error(`ibGibAddr (${ibGibAddr}) in result ibGibs not found in addrsToGet (${addrsToGet})? Here are the original ibGibAddrs: ${ibGibAddrs}. Here is the resGet.ibGibs: ${pretty(resGet.ibGibs)} (E: 07535883a3a89fcb686f2409bf799825)`); }
            resMap[ibGibAddr] = ibGib;
        });

        if (logalot) { console.log(`${lc} resMap: ${pretty(resMap)} (I: 70d79d873dd271949b48d837c286d825)`); }

        return resMap;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error; // Re-throw the error to be caught by the command service
    } finally {
        // This finally block will execute regardless of whether the try block succeeds or fails.
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the getIbGibs command.
 */
export const getIbGibsFunctionInfo: APIFunctionInfo<typeof getIbGibsViaCmd> = {
    nameOrId: FUNCTION_NAME,
    fnViaCmd: getIbGibsViaCmd,
    functionImpl: getIbGibsImpl,
    cmd: CMD_CATEGORY,
    cmdModifiers: CMD_MODIFIERS,
    schema: GET_IBGIBS_SCHEMA,
};
