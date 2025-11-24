import { hash } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs'; // Import hash helper

import {
    KeystoneData_V1,
    KeystoneIbGib_V1,
    KeystonePoolConfig,
    KeystoneClaim,
    KeystoneProof,
    KeystoneChallengePool,
    KeystoneSolution,
    KeystoneReplenishStrategy,
    KeystoneRevocationInfo,
} from './keystone-types.mjs';
import { KeystoneStrategyFactory } from './strategy/factory.mjs';
import { POOL_ID_REVOKE, VERB_REVOKE } from './keystone-constants.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib';

/**
 * Facade for managing Keystone Identities.
 *
 * Handles Genesis, Authorized Evolution (Signing), and Validation.
 */
export class KeystoneService_V1 {

    /**
     * Creates a brand new Keystone Identity Timeline.
     */
    async genesis({
        masterSecret,
        configs,
    }: {
        masterSecret: string;
        configs: KeystonePoolConfig[];
    }): Promise<KeystoneIbGib_V1> {
        const lc = `[${KeystoneService_V1.name}.${this.genesis.name}]`;
        try {
            const challengePools: KeystoneChallengePool[] = [];

            for (const config of configs) {
                const strategy = KeystoneStrategyFactory.create({ config });
                const poolSecret = await strategy.derivePoolSecret({ masterSecret });
                const challenges: { [id: string]: any } = {};

                const targetSize = config.behavior.size;

                // Use a timestamp to ensure uniqueness across different genesis calls if needed
                const timestamp = Date.now().toString();

                for (let i = 0; i < targetSize; i++) {
                    // Opaque ID Generation
                    const challengeId = await this.generateChallengeId({
                        salt: config.salt,
                        timestamp,
                        index: i
                    });

                    const solution = await strategy.generateSolution({
                        poolSecret,
                        poolId: config.salt,
                        challengeId,
                    });
                    const challenge = await strategy.generateChallenge({ solution });
                    challenges[challengeId] = challenge;
                }

                challengePools.push({
                    id: config.salt,
                    config,
                    challenges,
                });
            }

            const data: KeystoneData_V1 = {
                challengePools,
                proofs: [],
            };

            return await this.createKeystoneIbGibImpl({ data });

        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }

    /**
     * Signs a claim using a hybrid selection strategy.
     * Supports: Mandatory IDs (Alice) + Sequential (FIFO) + Random (Stochastic).
     */
    async sign({
        latestKeystone,
        masterSecret,
        claim,
        poolId,
        requiredChallengeIds = [], // Alice's Demands
        frameDetails,
    }: {
        latestKeystone: KeystoneIbGib_V1;
        masterSecret: string;
        claim: Partial<KeystoneClaim>;
        poolId: string;
        requiredChallengeIds?: string[];
        frameDetails?: any;
    }): Promise<KeystoneIbGib_V1> {
        const lc = `[${KeystoneService_V1.name}.${this.sign.name}]`;
        try {
            const prevData = latestKeystone.data!;

            // 1. Locate Pool
            const pool = prevData.challengePools.find(p => p.id === poolId);
            if (!pool) { throw new Error(`Pool not found: ${poolId}`); }

            const { behavior } = pool.config;

            // 2. Hybrid Selection Logic
            // We rely on Object.keys() respecting insertion order for string keys in ES2015+
            let availableIds = Object.keys(pool.challenges);
            const selectedIds = new Set<string>();

            // A. Handle Mandatory Requirements (Alice's Demands)
            for (const reqId of requiredChallengeIds) {
                if (!pool.challenges[reqId]) {
                    throw new Error(`Required challenge ID not found in pool: ${reqId}`);
                }
                selectedIds.add(reqId);
            }

            // Filter out already selected IDs from available list
            availableIds = availableIds.filter(id => !selectedIds.has(id));

            // B. Select Sequentially (FIFO)
            // We take the first N available IDs
            const countSeq = behavior.selectSequentially;
            if (countSeq > 0) {
                if (availableIds.length < countSeq) throw new Error("Insufficient challenges for sequential requirement.");

                const seqIds = availableIds.slice(0, countSeq);
                seqIds.forEach(id => selectedIds.add(id));

                // Update available list
                availableIds = availableIds.slice(countSeq);
            }

            // C. Select Randomly (Stochastic)
            const countRand = behavior.selectRandomly;
            if (countRand > 0) {
                if (availableIds.length < countRand) throw new Error("Insufficient challenges for random requirement.");

                // Simple shuffle
                const shuffled = availableIds.sort(() => 0.5 - Math.random());
                const randIds = shuffled.slice(0, countRand);
                randIds.forEach(id => selectedIds.add(id));
            }

            // 3. Solve
            const strategy = KeystoneStrategyFactory.create({ config: pool.config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const solutions: KeystoneSolution[] = [];
            const finalSelectedIds = Array.from(selectedIds);

            for (const id of finalSelectedIds) {
                const sol = await strategy.generateSolution({
                    poolSecret,
                    poolId: pool.id,
                    challengeId: id,
                });
                solutions.push(sol);
            }

            // 4. Replenish & Build Next State
            const nextPools = await this.applyReplenishmentStrategy({
                prevPools: prevData.challengePools,
                targetPoolId: pool.id,
                consumedIds: finalSelectedIds,
                masterSecret,
                strategy,
                config: pool.config
            });

            const proof: KeystoneProof = {
                claim,
                solutions,
            };

            const newData: KeystoneData_V1 = {
                challengePools: nextPools,
                proofs: [proof],
                // We explicity set frameDetails here.
                // Note: We do NOT copy frameDetails from prevData.
                frameDetails: frameDetails
            };

            return await this.evolveKeystoneIbGibImpl({ prevIbGib: latestKeystone, newData });

        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }

    /**
     * Permanently revokes the Identity.
     *
     * Logic:
     * 1. Locates the 'revoke' pool.
     * 2. Consumes ALL available challenges in that pool (Scorched Earth).
     * 3. Sets the revocationInfo on the new frame.
     */
    async revoke({
        latestKeystone,
        masterSecret,
        reason = "User initiated revocation",
        frameDetails
    }: {
        latestKeystone: KeystoneIbGib_V1;
        masterSecret: string;
        reason?: string;
        frameDetails?: any;
    }): Promise<KeystoneIbGib_V1> {
        const lc = `[${KeystoneService_V1.name}.${this.revoke.name}]`;
        try {
            const prevData = latestKeystone.data!;

            // 1. Find Revocation Pool
            // We look for explicit ID, fallback to searching config for 'consume' strategy?
            // For V1, we enforce the constant ID.
            const pool = prevData.challengePools.find(p => p.id === POOL_ID_REVOKE);
            if (!pool) { throw new Error(`Revocation pool not found (E: genuuid)`); }

            // 2. Select ALL Challenges
            const allIds = Object.keys(pool.challenges);
            if (allIds.length === 0) { throw new Error(`Revocation pool empty. Already revoked? (E: genuuid)`); }

            // 3. Solve them all
            const strategy = KeystoneStrategyFactory.create({ config: pool.config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const solutions: KeystoneSolution[] = [];

            for (const id of allIds) {
                const sol = await strategy.generateSolution({
                    poolSecret,
                    poolId: pool.id,
                    challengeId: id,
                });
                solutions.push(sol);
            }

            // 4. Deplete the Pool (Replenish Strategy: Consume)
            // We assume the pool config is already set to 'consume',
            // but we pass it explicitly to our helper logic anyway.
            const nextPools = await this.applyReplenishmentStrategy({
                prevPools: prevData.challengePools,
                targetPoolId: pool.id,
                consumedIds: allIds,
                masterSecret,
                strategy,
                config: pool.config
            });

// 5. Construct Revocation Proof
const proof: KeystoneProof = {
    claim: {
        verb: VERB_REVOKE,
        target: getIbGibAddr({ ibGib: latestKeystone }), // Target THIS identity timeline (or address)
    },
    solutions,
};

            const revocationInfo: KeystoneRevocationInfo = {
                reason,
                proof
            };

            const newData: KeystoneData_V1 = {
                challengePools: nextPools,
                // Do we put the proof in the main 'proofs' array too?
                // Usually 'proofs' authorizes the transition.
                // Since this is a transition TO a dead state, yes, we include it.
                proofs: [proof],
                revocationInfo,
                frameDetails
            };

            return await this.evolveKeystoneIbGibImpl({ prevIbGib: latestKeystone, newData });

        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }

    // #region Helpers

    /**
     * Generates an opaque, collision-resistant ID for a challenge.
     * Hash(Salt + Timestamp + Index)
     */
    private async generateChallengeId({
        salt,
        timestamp,
        index
    }: {
        salt: string,
        timestamp: string,
        index: number
    }): Promise<string> {
        // Use full SHA-256 hash, or slice it?
        // User suggested substring is fine for pool uniqueness.
        // Let's use first 16 chars of hex (64 bits) for brevity + safety.
        const raw = await hash({ s: `${salt}${timestamp}${index}` });
        return raw.substring(0, 16);
    }

    private async applyReplenishmentStrategy({
        prevPools,
        targetPoolId,
        consumedIds,
        masterSecret,
        strategy,
        config
    }: {
        prevPools: KeystoneChallengePool[];
        targetPoolId: string;
        consumedIds: string[];
        masterSecret: string;
        strategy: any;
        config: KeystonePoolConfig;
    }): Promise<KeystoneChallengePool[]> {
        const newPools = JSON.parse(JSON.stringify(prevPools));
        const pool = newPools.find((p: any) => p.id === targetPoolId);
        const { behavior } = config;
        const poolSecret = await strategy.derivePoolSecret({ masterSecret });

        const timestamp = Date.now().toString();

        // Apply Replenishment Strategy
        const strategyType = config.behavior.replenish;
        if (strategyType === KeystoneReplenishStrategy.topUp) {
            // 1. Remove consumed
            consumedIds.forEach(id => delete pool.challenges[id]);

            // 2. Add New (Append)
            // We generate exactly as many as we removed
            for (let i = 0; i < consumedIds.length; i++) {
                const newId = await this.generateChallengeId({
                    salt: config.salt, timestamp, index: i
                });

                // Ensure no collision with existing (unlikely with timestamp, but possible)
                if (pool.challenges[newId]) {
                    // If collision, bump index or append entropy.
                    // For this impl, we'll just assume 64-bit space is sufficient.
                }

                const sol = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: newId
                });
                pool.challenges[newId] = await strategy.generateChallenge({ solution: sol });
            }
        } else if (strategyType === KeystoneReplenishStrategy.replaceAll) {
            pool.challenges = {};

            for (let i = 0; i < behavior.size; i++) {
                const newId = await this.generateChallengeId({
                    salt: config.salt, timestamp, index: i
                });
                const sol = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: newId
                });
                pool.challenges[newId] = await strategy.generateChallenge({ solution: sol });
            }
        } else if (strategyType === KeystoneReplenishStrategy.consume) {
            // CONSUME STRATEGY
            // Just delete the used IDs. Do NOT generate new ones.
            consumedIds.forEach(id => delete pool.challenges[id]);
        } else {
            throw new Error(`(UNEXPECTED) Unsupported Replenishment Strategy: ${strategyType}? (E: 5ac445366348d736487ae7385a74bd25)`);
        }

        return newPools;
    }

    // ... Stubs ...
    private async createKeystoneIbGibImpl({ data }: { data: KeystoneData_V1 }): Promise<KeystoneIbGib_V1> { throw new Error("Stub"); }
    private async evolveKeystoneIbGibImpl({ prevIbGib, newData }: { prevIbGib: KeystoneIbGib_V1, newData: KeystoneData_V1 }): Promise<KeystoneIbGib_V1> { throw new Error("Stub"); }
}
