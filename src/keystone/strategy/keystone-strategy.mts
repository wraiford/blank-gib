import {
    KeystonePoolConfigBase,
    KeystoneChallengeBase,
    KeystoneSolutionBase
} from '../keystone-types.mjs';

/**
 * Abstract base class for all Keystone Challenge Strategies.
 *
 * @template TConfig The specific configuration interface (e.g. HashV1).
 * @template TChallenge The specific public challenge interface.
 * @template TSolution The specific private solution interface.
 */
export abstract class KeystoneStrategy<
    TConfig extends KeystonePoolConfigBase,
    TChallenge extends KeystoneChallengeBase,
    TSolution extends KeystoneSolutionBase
> {
    constructor(protected config: TConfig) {}

    /**
     * Derives the secret specific to this pool from the master keystone secret.
     * This isolates the pool so the master secret is never used directly
     * in challenge generation.
     */
    abstract derivePoolSecret({
        masterSecret
    }: {
        masterSecret: string
    }): Promise<string>;

    /**
     * Generates the private solution (Pre-image) for a specific challenge ID.
     *
     * @returns The concrete solution object (not just the value string).
     */
    abstract generateSolution({
        poolSecret,
        poolId,
        challengeId,
    }: {
        poolSecret: string;
        poolId: string;
        challengeId: string;
    }): Promise<TSolution>;

    /**
     * Generates the public challenge from a given solution.
     * Used when creating the pool (Top Up) or verifying a solution.
     */
    abstract generateChallenge({
        solution,
    }: {
        solution: TSolution;
    }): Promise<TChallenge>;

    /**
     * Validates that a given solution mathematically solves the given challenge.
     *
     * @returns true if valid, false otherwise.
     */
    abstract validateSolution({
        solution,
        challenge,
    }: {
        solution: TSolution;
        challenge: TChallenge;
    }): Promise<boolean>;
}

export type KeystoneStrategyAny = KeystoneStrategy<any,any,any>;
