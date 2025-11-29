import { extractErrorMsg, hash } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { mut8 } from '@ibgib/ts-gib/dist/V1/transforms/mut8.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
import { mut8Timeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';

import { GLOBAL_LOG_A_LOT } from '../constants.mjs';
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
import { KeystoneStrategyFactory } from './strategy/keystone-strategy-factory.mjs';
import { POOL_ID_REVOKE, VERB_REVOKE } from './keystone-constants.mjs';
import {
    addToBindingMap, getDeterministicRequirements, getKeystoneIbGib,
    removeFromBindingMap,
} from './keystone-helpers.mjs';

const logalot = GLOBAL_LOG_A_LOT;

/**
 * Facade for managing Keystone Identities.
 *
 * Handles Genesis, Authorized Evolution (Signing), and Validation.
 */
export class KeystoneService_V1 {
    protected lc: string = `[${KeystoneService_V1.name}]`;

    /**
     * Creates a brand new Keystone Identity Timeline.
     */
    async genesis({
        masterSecret,
        configs,
        metaspace,
        space,
    }: {
        masterSecret: string;
        configs: KeystonePoolConfig[];
        metaspace: MetaspaceService;
        space: IbGibSpaceAny;
    }): Promise<KeystoneIbGib_V1> {
        const lc = `${this.lc}[${this.genesis.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c98ae8adbc5888dbf84c5aced7610b25)`); }

            const challengePools: KeystoneChallengePool[] = [];

            for (const config of configs) {
                const strategy = KeystoneStrategyFactory.create({ config });
                const poolSecret = await strategy.derivePoolSecret({ masterSecret });
                const challenges: { [id: string]: any } = {};
                const bindingMap: { [char: string]: string[] } = {}; // <--- New

                const targetSize = config.behavior.size;
                const timestamp = Date.now().toString();

                for (let i = 0; i < targetSize; i++) {
                    const challengeId = await this.generateOpaqueChallengeId({
                        salt: config.salt, timestamp, index: i
                    });

                    const solution = await strategy.generateSolution({
                        poolSecret, poolId: config.salt, challengeId,
                    });
                    const challenge = await strategy.generateChallenge({ solution });
                    challenges[challengeId] = challenge;

                    // Populate Binding Map
                    addToBindingMap(bindingMap, challengeId);
                }

                // TODO: Check for empty buckets in bindingMap if config.targetBindingChars > 0?
                // For V1, we assume statistical probability of SHA256 is sufficient for size > 50.

                challengePools.push({
                    id: config.salt,
                    config,
                    challenges,
                    bindingMap
                });
            }

            const data: KeystoneData_V1 = { challengePools, proofs: [] };
            const keystoneIbGib = await this.createKeystoneIbGibImpl({ data, metaspace, space });
            return keystoneIbGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
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
        requiredChallengeIds = [],
        frameDetails,
        metaspace,
        space,
    }: {
        latestKeystone: KeystoneIbGib_V1;
        masterSecret: string;
        claim: Partial<KeystoneClaim>;
        poolId?: string;
        requiredChallengeIds?: string[];
        frameDetails?: any;
        metaspace: MetaspaceService;
        space: IbGibSpaceAny;
    }): Promise<KeystoneIbGib_V1> {
        const lc = `${this.lc}[${this.sign.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 519e0810cce8647ce83bdb3b5019a825)`); }

            const prevData = latestKeystone.data!;

            if (prevData.revocationInfo) { throw new Error(`keystone has been revoked (latestKeystone.data.revocationInfo is truthy).  (E: 4f2198c39116d15c48ba191940316825)`); }

            let pool: KeystoneChallengePool | undefined;

            // ---------------------------------------------------------------
            // 0. POOL RESOLUTION (Deterministic Mapping)
            // ---------------------------------------------------------------
            if (poolId) {
                // Explicit selection
                pool = prevData.challengePools.find(p => p.id === poolId);
                if (!pool) { throw new Error(`Pool not found: ${poolId} (E: genuuid)`); }

                // Enforce Policy on Explicit Selection
                if (pool.config.allowedVerbs && claim.verb) {
                    if (!pool.config.allowedVerbs.includes(claim.verb)) {
                        throw new Error(`Pool ${poolId} is not authorized for verb: ${claim.verb} (E: genuuid)`);
                    }
                }
            } else {
                // Automatic Resolution based on Verb
                if (!claim.verb) { throw new Error(`Cannot auto-resolve pool without a verb in the claim. (E: genuuid)`); }

                // 1. Look for Specific Match
                pool = prevData.challengePools.find(p =>
                    p.config.allowedVerbs && p.config.allowedVerbs.includes(claim.verb!)
                );

                // 2. Look for General/Default (No restrictions)
                if (!pool) {
                    pool = prevData.challengePools.find(p =>
                        !p.config.allowedVerbs || p.config.allowedVerbs.length === 0
                    );
                }

                if (!pool) { throw new Error(`No suitable pool found for verb: ${claim.verb} (E: genuuid)`); }
            }


            // 1. Get Deterministic Requirements (Demands -> Binding -> FIFO)
            const { mandatoryIds, availableIds } = getDeterministicRequirements({
                pool,
                requiredChallengeIds,
                targetAddr: claim.target
            });

            // 2. Stochastic Selection
            const randomCount = pool.config.behavior.selectRandomly;
            const randomIds: string[] = [];

            if (randomCount > 0) {
                if (availableIds.length < randomCount) {
                    throw new Error(`Insufficient challenges for random requirement. Need ${randomCount}, have ${availableIds.length}`);
                }
                // Shuffle & Pick
                const shuffled = availableIds.sort(() => 0.5 - Math.random());
                randomIds.push(...shuffled.slice(0, randomCount));
            }

            // 3. Combine & Solve
            const finalSelectedIds = [...mandatoryIds, ...randomIds];

            const strategy = KeystoneStrategyFactory.create({ config: pool.config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const solutions: KeystoneSolution[] = [];

            for (const id of finalSelectedIds) {
                const solution = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: id,
                });
                solutions.push(solution);
            }

            // 4. Replenish
            const nextPools = await this.applyReplenishmentStrategy({
                prevPools: prevData.challengePools,
                targetPoolId: pool.id,
                consumedIds: finalSelectedIds,
                masterSecret,
                strategy,
                config: pool.config
            });

            // 5. Build Proof (Include requiredChallengeIds!)
            const proof: KeystoneProof = {
                claim,
                solutions,
                requiredChallengeIds: requiredChallengeIds.length > 0 ? requiredChallengeIds : undefined
            };

            const newData: KeystoneData_V1 = {
                challengePools: nextPools,
                proofs: [proof],
                frameDetails,
            };

            const newIbGib = await this.evolveKeystoneIbGibImpl({ prevIbGib: latestKeystone, newData, metaspace, space });
            return newIbGib;

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Validates the transition from Prev -> Curr.
     * Enforces Cryptography AND Behavioral Policy.
     */
    async validate({
        currentIbGib,
        prevIbGib,
    }: {
        currentIbGib: KeystoneIbGib_V1;
        prevIbGib: KeystoneIbGib_V1;
        metaspace: MetaspaceService;
        space: IbGibSpaceAny;
    }): Promise<boolean> {
        const lc = `${this.lc}[${this.validate.name}]`;
        try {
            const currData = currentIbGib.data!;
            const prevData = prevIbGib.data!;

            for (const proof of currData.proofs) {
                if (proof.solutions.length === 0) { return false; }
                const poolId = proof.solutions[0].poolId;
                const pool = prevData.challengePools.find(p => p.id === poolId);
                if (!pool) { return false; }

                // -----------------------------------------------------------
                // 0. VALIDATE VERB AUTHORIZATION
                // -----------------------------------------------------------
                if (pool.config.allowedVerbs && pool.config.allowedVerbs.length > 0) {
                    // If the pool is restricted, the claim MUST match one of the verbs
                    if (!proof.claim.verb || !pool.config.allowedVerbs.includes(proof.claim.verb)) {
                        console.warn(`${lc} Policy Violation: Pool ${poolId} used for unauthorized verb ${proof.claim.verb} (E: genuuid)`);
                        return false;
                    }
                }

                // 1. Reconstruct Deterministic Requirements
                // We use the 'requiredChallengeIds' embedded in the Proof itself
                const { mandatoryIds, availableIds } = getDeterministicRequirements({
                    pool,
                    requiredChallengeIds: proof.requiredChallengeIds,
                    targetAddr: proof.claim.target
                });

                const proofIds = new Set(proof.solutions.map(s => s.challengeId));

                // 2. Verify Mandatory Compliance
                for (const id of mandatoryIds) {
                    if (!proofIds.has(id)) {
                        console.warn(`${lc} Policy Violation: Missing mandatory challenge ${id}`);
                        return false;
                    }
                }

                // 3. Verify Stochastic Compliance
                // Filter out mandatory ones from the proof
                const randomCandidates = [...proofIds].filter(id => !mandatoryIds.has(id));
                const requiredRandomCount = pool.config.behavior.selectRandomly;

                if (randomCandidates.length < requiredRandomCount) {
                    console.warn(`${lc} Policy Violation: Insufficient random count.`);
                    return false;
                }

                // 4. Verify Validity (Existence & Double-Dip Check)
                // Every candidate MUST be in 'availableIds' (meaning it wasn't used by deterministic step)
                for (const id of randomCandidates) {
                    if (!availableIds.includes(id)) {
                        console.warn(`${lc} Policy Violation: ID ${id} is invalid or double-dipped.`);
                        return false;
                    }
                }

                // 5. Verify Crypto
                const strategy = KeystoneStrategyFactory.create({ config: pool.config });
                for (const solution of proof.solutions) {
                    const challenge = pool.challenges[solution.challengeId];
                    if (!challenge || !(await strategy.validateSolution({ solution, challenge }))) {
                        return false;
                    }
                }
            }

            // Revocation Logic ... (Same as before)

            return true;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
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
        frameDetails,
        metaspace,
        space,
    }: {
        latestKeystone: KeystoneIbGib_V1;
        masterSecret: string;
        reason?: string;
        frameDetails?: any;
        metaspace: MetaspaceService;
        space?: IbGibSpaceAny;
    }): Promise<KeystoneIbGib_V1> {
        const lc = `${this.lc}[${this.revoke.name}]`;
        try {
            const prevData = latestKeystone.data!;
            space ??= await metaspace.getLocalUserSpace({ lock: true });
            if (!space) { throw new Error(`(UNEXPECTED) space falsy and couldn't get default local user space? (E: d6ec08fda858f0fe989f0faea3612825)`); }

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
                const solution = await strategy.generateSolution({
                    poolSecret,
                    poolId: pool.id,
                    challengeId: id,
                });
                solutions.push(solution);
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

            return await this.evolveKeystoneIbGibImpl({
                prevIbGib: latestKeystone,
                newData,
                metaspace,
                space,
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

    /**
     * Generates an opaque, collision-resistant ID for a challenge.
     * Hash(Salt + Timestamp + Index)
     */
    private async generateOpaqueChallengeId({
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
        const poolSecret = await strategy.derivePoolSecret({ masterSecret });
        const timestamp = Date.now().toString();

        const strategyType = config.behavior.replenish;

        // Clean up Binding Map for consumed IDs
        consumedIds.forEach(id => {
            if (pool.bindingMap) { removeFromBindingMap(pool.bindingMap, id); }
        });

        if (strategyType === KeystoneReplenishStrategy.topUp) {
            // Remove consumed
            consumedIds.forEach(id => delete pool.challenges[id]);

            // Add New
            for (let i = 0; i < consumedIds.length; i++) {
                const newId = await this.generateOpaqueChallengeId({
                    salt: config.salt, timestamp, index: i
                });

                // TODO: Collision Check?

                const solution = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: newId
                });
                pool.challenges[newId] = await strategy.generateChallenge({ solution });

                // Update Binding Map
                if (!pool.bindingMap) { pool.bindingMap = {}; }
                addToBindingMap(pool.bindingMap, newId);
            }
        } else if (strategyType === KeystoneReplenishStrategy.replaceAll) {
            pool.challenges = {};
            pool.bindingMap = {};

            for (let i = 0; i < config.behavior.size; i++) {
                const newId = await this.generateOpaqueChallengeId({
                    salt: config.salt, timestamp, index: i
                });
                const solution = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: newId
                });
                pool.challenges[newId] = await strategy.generateChallenge({ solution });
                addToBindingMap(pool.bindingMap, newId);
            }
        } else if (strategyType === KeystoneReplenishStrategy.consume) {
            consumedIds.forEach(id => delete pool.challenges[id]);
        }

        return newPools;
    }

    private async createKeystoneIbGibImpl({
        data,
        metaspace,
        space,
    }: {
        data: KeystoneData_V1,
        metaspace: MetaspaceService,
        space?: IbGibSpaceAny,
    }): Promise<KeystoneIbGib_V1> {
        const lc = `${this.lc}[${this.createKeystoneIbGibImpl.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5e32389700e9899e788cbefacef7c825)`); }

            space ??= await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) space was falsy and we couldn't get default local user space from metaspace? (E: 9a6498cf16a8801f19ec376749742225)`); }

            const keystoneIbGib = await getKeystoneIbGib({ keystoneData: data });

            await metaspace.put({
                ibGib: keystoneIbGib,
                space,
            });

            await metaspace.registerNewIbGib({
                ibGib: keystoneIbGib,
                space,
            });

            return keystoneIbGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async evolveKeystoneIbGibImpl({
        prevIbGib,
        newData,
        metaspace,
        space,
    }: {
        prevIbGib: KeystoneIbGib_V1,
        newData: KeystoneData_V1
        metaspace: MetaspaceService,
        space: IbGibSpaceAny,
    }): Promise<KeystoneIbGib_V1> {
        const lc = `${this.lc}[${this.evolveKeystoneIbGibImpl.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8b10e8920f08b7842803665834cf8925)`); }
            if (!prevIbGib.data) { throw new Error(`(UNEXPECTED) prevIbGib.data falsy? (E: 5e84875bf992c585b979e6c8ed5bf225)`); }
            if (prevIbGib.data.revocationInfo) { throw new Error(`Keystone has already been revoked (prevIbGib.data.revocationInfo truthy), so we cannot evolve the keystone. Keystone addr: ${getIbGibAddr({ ibGib: prevIbGib })} (E: 45d7f846556829de6b2a701838c3f825)`); }

            /**
             * we want to completely replace these keys, so we will remove them
             * from the data. This occurs first in the underlying mut8
             * transform.
             * @see {@link mut8}
             */
            const dataToRemove: Partial<KeystoneData_V1> = {
                proofs: [],
                challengePools: [],
                frameDetails: {},
            };

            const resMut8 = await mut8({
                src: prevIbGib,
                dataToRemove,
                dataToAddOrPatch: newData,
                // dna: false, // explicitly set to false just to show
                nCounter: true,
            });

            if (!!resMut8.intermediateIbGibs) { throw new Error(`(UNEXPECTED) resMut8.intermediateIbGibs truthy? I'm not sure if we expect there to be intermediateIbGibs, but I feel like we shouldn't. Pretty sure we shouldn't, definitely don't *want* them. (E: ba40d55d7c2d36d438c413886f148625)`); }
            if (!!resMut8.dnas) { throw new Error(`(UNEXPECTED) resMut8.dnas truthy? We do not want dnas with keystones. (E: 49470513d018f97d28024f4e82da3b25)`); }


            const newKeystoneIbGib = resMut8.newIbGib as KeystoneIbGib_V1;

            // run validation here? I think we should probably at least for awhile
            console.warn(`${lc} running possibly yagni validate after evolving keystone timeline. (W: d6bb476f27a84ef51cf65948544d7f25)`)
            await this.validate({
                currentIbGib: newKeystoneIbGib,
                prevIbGib,
                metaspace,
                space,
            });


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}
