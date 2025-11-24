import { IbGib_V1, IbGibData_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";

/**
 * The discriminator for the mechanism.
 * 'hash-reveal-v1': Standard Hash chain (Sigma-like).
 */
export type KeystoneChallengeType =
    | 'hash-reveal-v1'
    | 'decrypt-v1' // Future
    | 'pow-v1';    // Future

// ===========================================================================
// CONFIGURATION
// ===========================================================================

// #region KeystoneReplenishStrategy
/**
 * replaces each used challenge, "topping up" the pool to the pool's size
 */
export const KEYSTONE_REPLENISH_STRATEGY_TOP_UP = 'top-up';
/**
 * replaces the entire pool with the new challenges
 */
export const KEYSTONE_REPLENISH_STRATEGY_REPLACE_ALL = 'replace-all';
/**
 * do not replenish, only consume
 *
 * ## intent
 * adding this for revocation
 */
export const KEYSTONE_REPLENISH_STRATEGY_CONSUME = 'consume';
export type KeystoneReplenishStrategy =
    | typeof KEYSTONE_REPLENISH_STRATEGY_TOP_UP
    | typeof KEYSTONE_REPLENISH_STRATEGY_REPLACE_ALL
    | typeof KEYSTONE_REPLENISH_STRATEGY_CONSUME
    ;
/**
 * @see {@link KeystonePoolBehavior.replenish}
 */
export const KeystoneReplenishStrategy = {
    /**
     * @see {@link KEYSTONE_REPLENISH_STRATEGY_TOP_UP}
     */
    topUp: KEYSTONE_REPLENISH_STRATEGY_TOP_UP,
    /**
     * @see {@link KEYSTONE_REPLENISH_STRATEGY_REPLACE_ALL}
     */
    replaceAll: KEYSTONE_REPLENISH_STRATEGY_REPLACE_ALL,
    /**
     * @see {@link KEYSTONE_REPLENISH_STRATEGY_CONSUME}
     */
    consume: KEYSTONE_REPLENISH_STRATEGY_CONSUME,
} satisfies { [key: string]: KeystoneReplenishStrategy };
export const KEYSTONE_REPLENISH_STRATEGY_VALID_VALUES = Object.values(KeystoneReplenishStrategy);
export function isKeystoneReplenishStrategy(x: any): x is KeystoneReplenishStrategy {
    return KEYSTONE_REPLENISH_STRATEGY_VALID_VALUES.includes(x);
}
// #endregion KeystoneReplenishStrategy

export interface KeystonePoolBehavior {
    /**
     * Target number of challenges to maintain in the pool.
     */
    size: number;

    /**
     * How do we fill the void left by consumed challenges?
     */
    replenish: KeystoneReplenishStrategy;

    /**
     * Minimum number of challenges to consume from the "front" (oldest) of the pool.
     * Mitigates sequence prediction attacks if high, allows strictly ordered audit if used alone.
     */
    selectSequentially: number;

    /**
     * Minimum number of challenges to consume randomly from the remainder.
     * Mitigates pre-computation attacks on the sequence.
     */
    selectRandomly: number;
}

export interface KeystonePoolConfigBase {
    type: KeystoneChallengeType;
    /**
     * Unique salt for this pool's derivation path from the Master Secret.
     */
    salt: string;
    behavior: KeystonePoolBehavior;
}

export interface KeystonePoolConfig_HashV1 extends KeystonePoolConfigBase {
    type: 'hash-reveal-v1';
    algo: 'SHA-256' | 'SHA-512';
    rounds: number;
}

export type KeystonePoolConfig = KeystonePoolConfig_HashV1;

// ===========================================================================
// CHALLENGES (Public Puzzles)
// ===========================================================================

export interface KeystoneChallengeBase {
    type: KeystoneChallengeType;
}

export interface KeystoneChallenge_HashV1 extends KeystoneChallengeBase {
    type: 'hash-reveal-v1';
    /**
     * The hash that must be matched by the solution.
     */
    hash: string;
}

export type KeystoneChallenge = KeystoneChallenge_HashV1;

// ===========================================================================
// SOLUTIONS (Private Answers revealed in Proofs)
// ===========================================================================

export interface KeystoneSolutionBase {
    type: KeystoneChallengeType;
    /**
     * The ID of the pool this solution comes from.
     */
    poolId: string;
    /**
     * The ID of the specific challenge being solved.
     */
    challengeId: string;
}

export interface KeystoneSolution_HashV1 extends KeystoneSolutionBase {
    type: 'hash-reveal-v1';
    /**
     * The Pre-image value.
     */
    value: string;
}

export type KeystoneSolution = KeystoneSolution_HashV1;

// ===========================================================================
// HIGH-LEVEL STRUCTURES
// ===========================================================================

/**
 * A container for a set of challenges.
 */
export interface KeystoneChallengePool {
    /**
     * Unique ID (e.g. "default", "admin").
     */
    id: string;

    config: KeystonePoolConfig;

    /**
     * Default claim values for this pool.
     * Useful for "verb-stones".
     */
    defaultClaim?: Partial<KeystoneClaim>;

    /**
     * The currently active challenges.
     * Key: The unique Challenge ID (e.g. "poolSalt_0").
     */
    challenges: { [challengeId: string]: KeystoneChallenge };
}

/**
 * Semantic intent.
 */
export interface KeystoneClaim {
    target: string; // ibGib address
    verb: string;   // ibGib address (primitive)
    scope?: string; // ibGib address (primitive)
}

/**
 * Authorization Proof.
 */
export interface KeystoneProof {
    id?: string;

    /**
     * The claim being made.
     */
    claim: Partial<KeystoneClaim>;

    /**
     * The solutions required to validate this claim.
     */
    solutions: KeystoneSolution[];
}

/**
 * Revocation Context.
 */
export interface KeystoneRevocationInfo {
    reason: string;
    proof: KeystoneProof;
}

// ===========================================================================
// TOP LEVEL IBGIB DATA
// ===========================================================================

export interface KeystoneData_V1 extends IbGibData_V1 {
    /**
     * The pools containing the FUTURE challenges.
     * (Always topped up in V1 implementation).
     */
    challengePools: KeystoneChallengePool[];

    /**
     * The proofs authorizing THIS frame's evolution.
     */
    proofs: KeystoneProof[];

    /**
     * If present, this Keystone is dead.
     */
    revocationInfo?: KeystoneRevocationInfo;

    /**
     * Ephemeral details specific to this frame's creation context.
     * Meant to be observed on this frame, but NOT automatically carried forward
     * to the next frame's data during evolution.
     */
    frameDetails?: any;
}

export interface KeystoneRel8ns_V1 extends IbGibRel8ns_V1 {
    // Standard ibGib relations (ancestor, past, etc.)
    // Specific hard-links for composite keystones go here later.
}

export interface KeystoneIbGib_V1 extends IbGib_V1<KeystoneData_V1, KeystoneRel8ns_V1> { }
