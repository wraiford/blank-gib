import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { Ib, TransformResult } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbAndGib } from "@ibgib/ts-gib/dist/helper.mjs";
import { Factory_V1 } from "@ibgib/ts-gib/dist/V1/factory.mjs";

import { GLOBAL_LOG_A_LOT } from "../constants.mjs";
import { KEYSTONE_ATOM } from "./keystone-constants.mjs";
import { KeystoneData_V1, KeystoneIbGib_V1, KeystoneIbInfo_V1, KeystoneChallengePool } from "./keystone-types.mjs";

const logalot = GLOBAL_LOG_A_LOT;

/**
 * space-delimited keystone ib containing select keystone metadata.
 *
 * NOTE: This must match {@link parseKeystoneIb}
 * @see {@link KeystoneIbInfo_V1}
 */
export async function getKeystoneIb({
    keystoneData,
}: {
    keystoneData: KeystoneData_V1,
}): Promise<Ib> {
    const lc = `[${getKeystoneIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c3022a146faac9730154f34d1439a225)`); }

        const atom = KEYSTONE_ATOM;

        const ib = [
            atom,
        ].join(' ');

        return ib;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * NOTE: This must match {@link getKeystoneIb}
 * @see {@link KeystoneIbInfo_V1}
 */
export async function parseKeystoneIb({
    ib,
}: {
    ib: Ib,
}): Promise<KeystoneIbInfo_V1> {
    const lc = `[${parseKeystoneIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 73cb6832984255ed48b2f44db6a21e25)`); }
        const [
            atom
        ] = ib.split(' ');

        if (atom !== KEYSTONE_ATOM) {
            throw new Error(`invalid keystone ib. atom found in ib (${atom}) does not match keystone atom (${KEYSTONE_ATOM}) (E: 79b3d587824c4271b6e60acc76e0c825)`);
        }

        return {
            atom,
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Creates the initial keystone.
 *
 * Note that keystones are slightly different than other ibgibs, as each
 * iteration of the keystone must be valid.
 */
export async function getKeystoneIbGib({
    keystoneData,
}: {
    keystoneData: KeystoneData_V1,
}): Promise<TransformResult<KeystoneIbGib_V1>> {
    const lc = `[${getKeystoneIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f557bbe2e61d446658a2e13980e96d25)`); }

        const parentIbGib = Factory_V1.primitive({ ib: KEYSTONE_ATOM });

        const resFirstGen = await Factory_V1.firstGen({
            parentIbGib,
            ib: await getKeystoneIb({ keystoneData }),
            data: keystoneData,
            // just showing rel8ns for completeness. in the future when we have
            // composite keystones, this will probably change to a truthy value
            // rel8ns: undefined,
            dna: false,
            nCounter: true,
            tjp: {
                timestamp: true,
                uuid: true,
            },
        }) as TransformResult<KeystoneIbGib_V1>;

        // at this point, the first gen has an interstitial ibgib and its past
        // is not empty. We need to change this so that the past is indeed
        // empty.

        const keystoneIbGib = resFirstGen.newIbGib;
        if (!keystoneIbGib.rel8ns) { throw new Error(`(UNEXPECTED) keystoneIbGib.rel8ns falsy? we expect the rel8ns to have ancestor and past. (E: 20cb7723dc33ae1ef808fe76d1bf4b25)`); }
        if (!keystoneIbGib.rel8ns.past || keystoneIbGib.rel8ns.past.length === 0) {
            throw new Error(`(UNEXPECTED) keystoneIbGib.rel8ns.past falsy or empty? we expect the firstGen call to generate an interstitial ibgib that we will splice out. (E: 0fd8388d045ab9f37834c27d67e78825)`);
        }

        keystoneIbGib.rel8ns.past = [];
        keystoneIbGib.gib


        return resFirstGen;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}


export interface DeterministicResult {
    /**
     * The Set of IDs that MUST be present in the solution.
     * Includes Alice's Demands + Target Binding Matches + FIFO.
     */
    mandatoryIds: Set<string>;

    /**
     * The IDs remaining in the pool that are valid candidates for
     * the Random/Stochastic step.
     */
    availableIds: string[];
}

/**
 * The Policy Engine.
 * Calculates exactly which challenges MUST be consumed based on config and demands.
 * Enforces STRICT DISTINCTNESS (No double-dipping).
 */
export function getDeterministicRequirements({
    pool,
    requiredChallengeIds,
    targetAddr
}: {
    pool: KeystoneChallengePool;
    requiredChallengeIds?: string[];
    targetAddr?: string;
}): DeterministicResult {
    const behavior = pool.config.behavior;
    const mandatory = new Set<string>();

    // Start with all available IDs.
    // We assume Object.keys respects insertion order (ES2015+), crucial for FIFO.
    let available = Object.keys(pool.challenges);

    // ---------------------------------------------------------
    // 1. Alice's Demands (Explicit Requirements)
    // ---------------------------------------------------------
    if (requiredChallengeIds && requiredChallengeIds.length > 0) {
        for (const id of requiredChallengeIds) {
            if (!pool.challenges[id]) {
                throw new Error(`(UNEXPECTED) Required challenge ID not found in pool: ${id} (E: 2c9f8...)`);
            }
            // Strict: Consume it.
            if (!available.includes(id)) {
                 // Should be caught by check above, but handles duplicates in 'demands'
                 continue;
            }
            mandatory.add(id);
        }
        // Remove from available pool
        available = available.filter(id => !mandatory.has(id));
    }

    // ---------------------------------------------------------
    // 2. Target Binding (Explicit Buckets)
    // ---------------------------------------------------------
    if (behavior.targetBindingChars > 0 && targetAddr) {
        const { gib } = getIbAndGib({ ibGibAddr: targetAddr });
        if (gib) {
            // Get required hex prefixes (e.g. 'a', 'b', 'c', '1')
            const prefixes = gib.substring(0, behavior.targetBindingChars).toLowerCase();

            for (const char of prefixes) {
                // Look in the Explicit Bucket
                const bucket = pool.bindingMap[char] || [];

                // Find the first ID in this bucket that is still in 'available'
                const match = bucket.find(id => available.includes(id));

                if (!match) {
                    throw new Error(`Entropy Exhaustion. Cannot satisfy binding for char '${char}'. (E: 8d3a1...)`);
                }

                // Strict: Consume it.
                mandatory.add(match);
                available = available.filter(id => id !== match);
            }
        }
    }

    // ---------------------------------------------------------
    // 3. FIFO (Sequential)
    // ---------------------------------------------------------
    if (behavior.selectSequentially > 0) {
        // Take the first N from the remaining available list
        if (available.length < behavior.selectSequentially) {
            throw new Error(`Entropy Exhaustion. Insufficient challenges for FIFO requirement. (E: 9c2b4...)`);
        }

        const fifoIds = available.slice(0, behavior.selectSequentially);
        fifoIds.forEach(id => mandatory.add(id));

        // Remove from available
        available = available.slice(behavior.selectSequentially);
    }

    return { mandatoryIds: mandatory, availableIds: available };
}

/**
 * Helper to update the Binding Map when adding new Challenge IDs.
 * Uses "Implicit Bucketing" (ID start char) but can be extended for full coverage.
 */
export function addToBindingMap(
    map: { [char: string]: string[] },
    challengeId: string
): void {
    const firstChar = challengeId.charAt(0).toLowerCase();
    // Validate it is hex
    if (/[0-9a-f]/.test(firstChar)) {
        if (!map[firstChar]) map[firstChar] = [];
        map[firstChar].push(challengeId);

        // OPTIONAL: Implement Full Coverage Strategy here?
        // e.g. map[challengeId[1]].push(challengeId) ...
        // For V1, we stick to Native/Implicit bucket (Index 0).
    }
}

/**
 * Helper to clean up Binding Map when removing IDs.
 */
export function removeFromBindingMap(
    map: { [char: string]: string[] },
    challengeId: string
): void {
    // Since we don't know exactly which buckets an ID is in (if we did multi-bucket),
    // we strictly should scan all. For V1 Native, we check first char.
    // SAFE IMPLEMENTATION: Scan all buckets.
    for (const key of Object.keys(map)) {
        map[key] = map[key].filter(id => id !== challengeId);
    }
}
