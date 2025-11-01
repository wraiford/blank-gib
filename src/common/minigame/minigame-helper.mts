import { extractErrorMsg, getSaferSubstring, getTimestamp, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { Ib, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
import { validateIbGibIntrinsically } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
import { IbGib_V1, } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { fork } from '@ibgib/ts-gib/dist/V1/transforms/fork.mjs';
import { Factory_V1 } from '@ibgib/ts-gib/dist/V1/factory.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { persistTransformResult } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { getTimestampInfo } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../constants.mjs';
import { getGlobalMetaspace_waitIfNeeded } from '../../helpers.web.mjs';
import {
    MINIGAME_ATOM, MINIGAME_DESC_REGEXP, MINIGAME_NAME_REGEXP,
    DEFAULT_MINIGAME_SAFE_NAME_LENGTH, DEFAULT_MINIGAME_ADDL_METADATA_LENGTH,
    MINIGAME_PROTOTYPE_REL8N_NAME,
    MinigameGameType,
} from './minigame-constants.mjs'; // Constants file to be created
import {
    MinigameData_V1, MinigameIbGib_V1, MinigameIbInfo, MinigameAddlMetadataInfo,
    DEFAULT_MINIGAME_DATA_V1,
} from './minigame-types.mjs';
import { validateMinigameIsReady_typing } from './typing/typing-helper.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export function getMinigameSafeName({ name }: { name: string }): string {
    const lc = `[${getMinigameSafeName.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        const safeName = getSaferSubstring({
            text: name,
            length: DEFAULT_MINIGAME_SAFE_NAME_LENGTH,
        });
        if (!safeName) { throw new Error(`${lc} Could not generate safeName from name: ${name}. (E: genuuid)`); }
        return safeName;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Generates the `ib` string for a MinigameIbGib based on its data.
 * The structure is: `${MINIGAME_ATOM} ${safeName} ${addlMetadataText}`
 * where addlMetadataText contains underscore-delimited fields like timestampInTicks.
 *
 * ## notes
 *
 * atow (04/2025), we are "descending" (forking) from a source comment ibgib to
 * create the project. As such, we are positioning the project ibgib itself to
 * have a similar structure to a comment ibgib. So the schema for the `ib`
 * purposefully has the safeName in the second position just like a comment
 * ibgib has a saferized version of the comment.data.text in its ib schema.
 *
 * WARNING
 * WARNING
 * ATOW (05/2025) THIS FUNCTION'S DETAILS ARE USED IN MUT8-IBGIB
 * APIFUNCTIONINFO.  IF THIS CHANGES, THEN THAT FUNCTION MUST BE CHANGED TOO.
 * WARNING
 * WARNING
 *
 * @see {@link MinigameIbInfo}
 * @see {@link MinigameAddlMetadataInfo}
 *
 */
export function getMinigameIb({
    data,
}: {
    data: MinigameData_V1;
}): string {
    const lc = `[${getMinigameIb.name}]`;
    try {
        const validationErrors = validateMinigameData_V1({ data }) ?? [];
        if (validationErrors.length > 0) {
            throw new Error(`invalid Minigame data. errors: ${validationErrors} (E: genuuid)`);
        }

        // Get saferized name segment
        const safeName = getMinigameSafeName({ name: data.name });

        // Prepare additional metadata text (add more fields with underscores here later)

        // timestampInTicks
        const timestampInfo = getTimestampInfo({ timestamp: data.timestamp });
        if (!timestampInfo.valid) { throw new Error(`(UNEXPECTED) validated data but invalid data.timestamp? (E: genuuid)`); }
        const timestampInTicks = Number.parseInt(timestampInfo.ticks);

        // compose addlMetadataText
        const addlMetadataFields: string[] = [
            timestampInTicks.toString(),
            // add more fields here as needed in the future
        ];
        addlMetadataFields.push();
        const addlMetadataText = addlMetadataFields.join('_');
        if (addlMetadataText.length > DEFAULT_MINIGAME_ADDL_METADATA_LENGTH) {
            throw new Error(`(UNEXPECTED) addlMetadataText.length > DEFAULT_MINIGAME_ADDL_METADATA_LENGTH (${DEFAULT_MINIGAME_ADDL_METADATA_LENGTH})? (E: genuuid)`);
        }

        // Construct the final ib string
        return `${MINIGAME_ATOM} ${safeName} ${addlMetadataText}`;
    } catch (error) {
        console.error(`${lc} ${error.message}`);
        throw error;
    }
}

export function validateMinigameIb({
    ib,
}: {
    ib: Ib;
}): string[] | undefined {
    const lc = `[${validateMinigameIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        // major hack here...I'm tired of doing this plumbing shit.

        try {
            const _info = parseMinigameIb({ ib });
        } catch (error) {
            return [extractErrorMsg(error)];
        }

        return undefined;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Parses a project `ib` string into its components.
 *
 * @see {@link getMinigameIb} for expected ib schema
 */
export function parseMinigameIb({
    ib,
}: {
    ib: Ib;
}): MinigameIbInfo {
    const lc = `[${parseMinigameIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... parsing ib: ${ib}`); }
        if (!ib) { throw new Error(`${lc} ib required (E: genuuid)`); }

        const pieces = ib.split(' ');
        if (pieces.length !== 3) { throw new Error(`${lc} Invalid project ib format. Expected 3 space-delimited pieces. Got: ${pieces.length}. ib: ${ib} (E: genuuid)`); }

        const [atom, safeName, addlMetadataText] = pieces;

        if (atom !== MINIGAME_ATOM) { throw new Error(`${lc} Invalid atom. Expected '${MINIGAME_ATOM}', got '${atom}'. ib: ${ib} (E: genuuid)`); }

        if (!safeName) { throw new Error(`${lc} safeName segment is empty. ib: ${ib} (E: genuuid)`); }

        if (!addlMetadataText) { throw new Error(`${lc} addlMetadataText segment is empty. ib: ${ib} (E: genuuid)`); }

        // Parse the underscore-delimited addlMetadataText
        const metadataPieces = addlMetadataText.split('_');
        if (metadataPieces.length !== 1) { throw new Error(`${lc} Could not parse addlMetadataText. Expected 1 underscore-delimited piece. Got: ${metadataPieces.length}. addlMetadataText: ${addlMetadataText} (E: genuuid)`); }

        const timestampInTicksStr = metadataPieces[0];
        const timestampInTicks = parseInt(timestampInTicksStr, 10);
        if (isNaN(timestampInTicks)) { throw new Error(`${lc} Could not parse timestampInTicks from addlMetadataText. isNan.  Expected a decimal number. timestampInTicksStr: ${timestampInTicksStr}. addlMetadataText: ${addlMetadataText} (E: genuuid)`); }

        const addlMetadata: MinigameAddlMetadataInfo = {
            timestampInTicks,
            // otherField, // if added
        };

        const result: MinigameIbInfo = {
            atom: MINIGAME_ATOM,
            safeName,
            addlMetadataText,
            addlMetadata,
        };

        if (logalot) { console.log(`${lc} parsed info: ${pretty(result)}`); }
        return result;

    } catch (error) {
        console.error(`${lc} ${error.message}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Validates the MinigameData_V1 structure.
 * Returns array of error messages if invalid, otherwise undefined.
 */
export function validateMinigameData_V1({
    data,
}: {
    data: MinigameData_V1 | any;
}): string[] | undefined {
    const lc = `[${validateMinigameData_V1.name}]`;
    const errors: string[] = [];
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        if (!data) {
            errors.push("Data is required.");
            return errors; /* <<<< returns early */
        }

        if (data.name) {
            if (typeof data.name === 'string') {
                if (!MINIGAME_NAME_REGEXP.test(data.name)) {
                    errors.push(`data.name must match regexp: ${MINIGAME_NAME_REGEXP.source}`);
                }
            } else {
                errors.push("Name must be a string.");
            }
        } else {
            errors.push("name required")
        }

        if (data.description) {
            if (typeof data.description === 'string') {
                if (!MINIGAME_DESC_REGEXP.test(data.description)) {
                    errors.push(`data.description must match regexp: ${MINIGAME_DESC_REGEXP.source}`);
                }
            } else {
                errors.push("Description must be a string.");
            }
        } else {
            errors.push("description required")
        }

        if (data.text) {
            if (typeof data.text === 'string') {
                // any more checks on text?
            } else {
                errors.push("data.text must be string.");
            }
        } else {
            // not required
            // errors.push(`data.text required`);
        }

        if (data.textTimestamp) {
            if (typeof data.textTimestamp === 'string') {
                const resValid = getTimestampInfo({ timestamp: data.textTimestamp });
                if (!resValid.valid) {
                    errors.push(`data.textTimestamp (${data.textTimestamp}) is not a valid timestamp: ${resValid.emsg}`);
                }
            } else {
                errors.push("data.textTimestamp must be a string.");
            }
        } else {
            // why would this be falsy?
            console.warn(`${lc} data.textTimestamp not provided. (W: genuuid)`);
        }

        if (data.timestamp) {
            if (typeof data.timestamp === 'string') {
                const resValid = getTimestampInfo({ timestamp: data.timestamp });
                if (!resValid.valid) {
                    errors.push(`data.timestamp (${data.timestamp}) is not a valid timestamp: ${resValid.emsg}`);
                }
            } else {
                errors.push("data.timestamp must be a string.");
            }
        } else {
            // why would this be falsy?
            console.warn(`${lc} data.timestamp not provided. (W: genuuid)`);
        }

        // todo: validate other minigame data fields

        return errors.length > 0 ? errors : undefined;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        return [`Unexpected error during validation: ${extractErrorMsg(error)} (E: genuuid)`];
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }

}

/**
 * Validates a MinigameIbGib_V1 intrinsically, its data, and the consistency
 * between the ib string and the data content.
 * Returns an array of error messages if invalid, otherwise undefined.
 */
export async function validateMinigameIbGib_V1({
    ibGib,
}: {
    ibGib: IbGib_V1;
}): Promise<string[] | undefined> {
    const lc = `[${validateMinigameIbGib_V1.name}]`;
    const allErrors: string[] = [];
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        if (!ibGib) {
            allErrors.push('ibGib is required.');
            return allErrors;
        }

        // 1. Basic intrinsic validation (ib, gib, data, rel8ns presence, gib calc)
        const intrinsicErrors = await validateIbGibIntrinsically({ ibGib }) ?? [];
        if (intrinsicErrors.length > 0) {
            return intrinsicErrors; /* <<<< returns early */
        }

        const dataErrors = validateMinigameData_V1({ data: ibGib.data as MinigameData_V1 }) ?? [];
        dataErrors.forEach(x => allErrors.push(x));

        const ibErrors = validateMinigameIb({ ib: ibGib.ib }) ?? [];
        ibErrors.forEach(x => allErrors.push(x));

        // not doing this for now
        const rel8nsErrors = [];
        rel8nsErrors.forEach(x => allErrors.push(x));

        return allErrors.length > 0 ? allErrors : undefined;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)} (E: genuuid)`);
        // Return validation data indicating an unexpected error occurred
        return [`Unexpected error during validation: ${extractErrorMsg(error)} (E: genuuid)`];
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Type guard to check if an object conforms to MinigameData_V1 structure.
 */
export function isMinigameData_V1(data: any): data is MinigameData_V1 {
    const lc = `[${isMinigameData_V1.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        const errors = validateMinigameData_V1({ data }) ?? [];
        return errors.length === 0;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        return false;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Type guard to check if an IbGib_V1 is structurally a MinigameIbGib_V1.
 * Verifies the atom in the ib and checks data structure using isMinigameData_V1.
 */
export function isMinigameIbGib_V1(ibGib: IbGib_V1): ibGib is MinigameIbGib_V1 {
    if (!ibGib || !ibGib.ib || !ibGib.data) { return false; }
    // Check if atom is 'project'
    if (!ibGib.ib.startsWith(`${MINIGAME_ATOM} `)) { return false; }
    // Check data structure
    return isMinigameData_V1(ibGib.data);
}

/**
 * Creates a new Minigame ibGib.
 */
export async function createMinigameIbGib({
    srcMinigameIbGib,
    data,
    saveInSpace,
    space,
    registerNewIbGib,
}: {
    srcMinigameIbGib?: MinigameIbGib_V1,
    /**
     * data for new game.
     *
     * if {@link srcMinigameIbGib} is provided, then that ibGib's data will be
     * OVERRIDDEN with this.
     *
     * just pass in the {@link srcMinigameIbGib} if you want to keep it the same
     */
    data: MinigameData_V1,
    /**
     * If true, saves the newly created project ibgib and all intermediate
     * dependency ibgibs (dna and others) in the given {@link space}, or default
     * local space if that is falsy.
     */
    saveInSpace?: boolean;
    /**
     * If set and {@link saveInSpace} is true, then this will be where all
     * ibgibs are saved.
     */
    space?: IbGibSpaceAny;
    /**
     * if true, will call metaspace.registerNewIbGib
     */
    registerNewIbGib?: boolean;
}): Promise<TransformResult<MinigameIbGib_V1>> {
    const lc = `[${createMinigameIbGib.name}]`;
    if (logalot) { console.log(`${lc} starting...`); }
    try {
        const { name, description, instructions, gameType, gameVariants, gameState, keywords } = data;

        let startingData = { ...DEFAULT_MINIGAME_DATA_V1 };
        if (srcMinigameIbGib) {
            startingData = { ...startingData, ...srcMinigameIbGib.data!, };
        }
        startingData = { ...startingData, ...data, };
        const now = new Date();
        const timestamp = getTimestamp(now);
        const timestampMs = now.getMilliseconds();
        startingData.timestamp = timestamp;
        startingData.timestampMs = timestampMs;

        // build a src that has the data we want, esp the timestamp info that
        // drives the ib
        const src = Factory_V1.primitive({ ib: MINIGAME_ATOM });
        src.data = startingData;
        // keep gib primitive, we're just setting data because of the limitation
        // of the fork API atow (06/2025)
        if (srcMinigameIbGib) {
            // add a rel8n to the src
            src.rel8ns = {
                [MINIGAME_PROTOTYPE_REL8N_NAME]: [getIbGibAddr({ ibGib: srcMinigameIbGib })],
            }
        }

        const resNewMinigameFork = await fork({
            src,
            destIb: getMinigameIb({ data: startingData }),
            tjp: { uuid: true, timestamp: false },
            cloneData: true,
            cloneRel8ns: !!src.rel8ns,
            dna: true,
            nCounter: true,
            noTimestamp: true, // we provided our own above
        }) as TransformResult<MinigameIbGib_V1>;
        const { newIbGib: newMinigameIbGib } = resNewMinigameFork;
        const newMinigameAddr = getIbGibAddr({ ibGib: newMinigameIbGib });

        if (saveInSpace) {
            if (!space) {
                throw new Error(`(UNEXPECTED) saveInSpace true but space falsy? (E: genuuid)`);
            }
            await persistTransformResult({ resTransform: resNewMinigameFork, space });
            if (logalot) { console.log(`${lc} persisted resNewMinigameFork (newMinigameIbGib et al). newMinigameIbGib: ${pretty(newMinigameIbGib)} (I: 9dd3588c16282f84e822ed683e6dc825)`); }
        }

        if (registerNewIbGib) {
            if (!space) {
                throw new Error(`(UNEXPECTED) registerNewIbGib true but space falsy? (E: genuuid)`);
            }
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            await metaspace.registerNewIbGib({ ibGib: newMinigameIbGib, space });
            if (logalot) { console.log(`${lc} registered new ibgib (${pretty(newMinigameIbGib)}) (I: a179915f0a7882e9e8b18348234ae825)`); }
        }

        return resNewMinigameFork;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function validateMinigameIsReady({
    minigameIbGib,
}: {
    minigameIbGib: MinigameIbGib_V1,
}): Promise<string[]> {
    const lc = `[${validateMinigameIsReady.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 69ba588f3fc8f2a2ec188afc0715a825)`); }
        if (!minigameIbGib.data) { throw new Error(`(UNEXPECTED) minigameIbGib.data falsy? (E: 83e201eccb0bf926d4697e88a377fe25)`); }
        switch (minigameIbGib.data.gameType) {
            case MinigameGameType.typing:
                return validateMinigameIsReady_typing({
                    minigameIbGib,
                    data: minigameIbGib.data,
                });
            default:
                throw new Error(`(UNEXPECTED) unknown Minigame.data.gameType (${minigameIbGib.data.gameType})? (E: f74e4afca2d88cfd142e9789e7342825)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

