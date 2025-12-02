import { extractErrorMsg, hash, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { mut8 } from '@ibgib/ts-gib/dist/V1/transforms/mut8.mjs';
import { Factory_V1 } from '@ibgib/ts-gib/dist/V1/factory.mjs';
import { getGib } from '@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs';
import { TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
import { validateIbGibIntrinsically } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';

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
    KEYSTONE_REPLENISH_STRATEGY_VALID_VALUES,
} from './keystone-types.mjs';
import { KeystoneStrategyFactory } from './strategy/keystone-strategy-factory.mjs';
import { KEYSTONE_ATOM, POOL_ID_REVOKE, VERB_REVOKE } from './keystone-constants.mjs';
import {
    addToBindingMap, getDeterministicRequirements, getKeystoneIb,
    removeFromBindingMap,
} from './keystone-helpers.mjs';
import { getDependencyGraph } from '@ibgib/core-gib/dist/common/other/graph-helper.mjs';

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
                // FIX: Check length > 0. If empty, it's a default pool (allow all).
                if (pool.config.allowedVerbs && pool.config.allowedVerbs.length > 0 && claim.verb) {
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
                // isTjp: false,
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
     *
     * @returns Array of validation error strings. Empty array means Valid.
     */
    async validate({
        currentIbGib,
        prevIbGib,
    }: {
        currentIbGib: KeystoneIbGib_V1;
        prevIbGib: KeystoneIbGib_V1;
        metaspace: MetaspaceService;
        space: IbGibSpaceAny;
    }): Promise<string[]> {
        const lc = `${this.lc}[${this.validate.name}]`;
        const errors: string[] = [];
        try {
            if (!currentIbGib) { throw new Error(`(UNEXPECTED) currentIbGib falsy? (E: 3c0f02655fa8279e386a079ebb604b25)`); }
            if (!prevIbGib) { throw new Error(`(UNEXPECTED) prevIbGib falsy? (E: 0d07c812634d839c784f31b8848ba825)`); }

            validateIbGibIntrinsically
            getDependencyGraph

            const currData = currentIbGib.data!;
            const prevData = prevIbGib.data!;

            for (const proof of currData.proofs) {
                if (proof.solutions.length === 0) {
                    errors.push(`Proof ${proof.id || 'unknown'} has no solutions.`);
                    continue;
                }

                const poolId = proof.solutions[0].poolId;
                const pool = prevData.challengePools.find(p => p.id === poolId);
                if (!pool) {
                    errors.push(`Proof references unknown pool: ${poolId}`);
                    continue;
                }

                // -----------------------------------------------------------
                // 0. VALIDATE VERB AUTHORIZATION
                // -----------------------------------------------------------
                if (pool.config.allowedVerbs && pool.config.allowedVerbs.length > 0) {
                    if (!proof.claim.verb || !pool.config.allowedVerbs.includes(proof.claim.verb)) {
                        errors.push(`Policy Violation: Pool ${poolId} used for unauthorized verb ${proof.claim.verb}`);
                    }
                }

                // 1. Reconstruct Deterministic Requirements
                const { mandatoryIds, availableIds } = getDeterministicRequirements({
                    pool,
                    requiredChallengeIds: proof.requiredChallengeIds,
                    targetAddr: proof.claim.target
                });

                const proofIds = new Set(proof.solutions.map(s => s.challengeId));

                // 2. Verify Mandatory Compliance
                for (const id of mandatoryIds) {
                    if (!proofIds.has(id)) {
                        errors.push(`Policy Violation: Missing mandatory challenge ${id}`);
                    }
                }

                // 3. Verify Stochastic Compliance
                const randomCandidates = [...proofIds].filter(id => !mandatoryIds.has(id));
                const requiredRandomCount = pool.config.behavior.selectRandomly;

                if (randomCandidates.length < requiredRandomCount) {
                    errors.push(`Policy Violation: Insufficient random count. Need ${requiredRandomCount}, got ${randomCandidates.length}`);
                }

                // 4. Verify Validity (Existence & Double-Dip Check)
                for (const id of randomCandidates) {
                    if (!availableIds.includes(id)) {
                        errors.push(`Policy Violation: ID ${id} is invalid or double-dipped.`);
                    }
                }

                // 5. Verify Crypto
                const strategy = KeystoneStrategyFactory.create({ config: pool.config });
                for (const solution of proof.solutions) {
                    const challenge = pool.challenges[solution.challengeId];
                    if (!challenge) {
                        errors.push(`Crypto Violation: Challenge ${solution.challengeId} not found in pool.`);
                    } else {
                        const isValid = await strategy.validateSolution({ solution, challenge });
                        if (!isValid) {
                            errors.push(`Crypto Violation: Solution for ${solution.challengeId} is invalid.`);
                        }
                    }
                }
            }

            // Revocation Logic
            if (currData.revocationInfo) {
                const target = currData.revocationInfo.proof.claim.target;
                const expectedTarget = getIbGibAddr({ ibGib: prevIbGib });
                if (target !== expectedTarget) {
                    errors.push(`Revocation target mismatch. Expected ${expectedTarget}, got ${target}`);
                }
            }

            return errors;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error; // System errors still throw
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
            space ??= await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) space falsy and couldn't get default local user space from the metaspace? (E: 73c8bfc0e7383a540ea1d6b14b020125)`); }

            // 1. Find Revocation Pool
            const pool = prevData.challengePools.find(p => p.id === POOL_ID_REVOKE);
            if (!pool) { throw new Error(`Revocation pool not found (E: 8c4f18c5461c1d601283108878c79825)`); }

            // 2. Select Challenges (Standard Policy, NOT ALL)
            // We want to satisfy the security policy (e.g. 10 sequential + 10 random)
            // without revealing the all of the keys in the pool.
            const claim: Partial<KeystoneClaim> = {
                verb: VERB_REVOKE,
                target: getIbGibAddr({ ibGib: latestKeystone })
            };

            const { mandatoryIds, availableIds } = getDeterministicRequirements({
                pool,
                requiredChallengeIds: [], // Revocation usually doesn't have external demands
                targetAddr: claim.target
            });

            // Stochastic Selection
            const randomCount = pool.config.behavior.selectRandomly;
            const randomIds: string[] = [];
            if (randomCount > 0) {
                if (availableIds.length < randomCount) { throw new Error(`Insufficient challenges. availableIds.length (${availableIds.length}) is less than required random count (${randomCount}) (E: b2e3570ab998dfdbab5fbdda1e43d825)`); }
                const shuffled = availableIds.sort(() => 0.5 - Math.random());
                randomIds.push(...shuffled.slice(0, randomCount));
            }

            const selectedIds = [...mandatoryIds, ...randomIds];
            if (selectedIds.length === 0) { throw new Error(`Revocation policy selected 0 challenges? Check config for pool. id: ${pool.id}. pool.config: ${pretty(pool.config)} (E: 97e5a8356d241ae7b882db791cb1f825)`); }

            // 3. Solve Selected
            const strategy = KeystoneStrategyFactory.create({ config: pool.config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const solutions: KeystoneSolution[] = [];

            for (const id of selectedIds) {
                const solution = await strategy.generateSolution({
                    poolSecret, poolId: pool.id, challengeId: id,
                });
                solutions.push(solution);
            }

            // 4. The default revocation behavior is to delete all of the
            // challenges so that the challenge pool is empty.
            // see KeystoneReplenishStrategy.scorchedEarth
            const nextPools = await this.applyReplenishmentStrategy({
                prevPools: prevData.challengePools,
                targetPoolId: pool.id,
                consumedIds: selectedIds,
                masterSecret,
                strategy,
                config: pool.config
            });

            // 5. Construct Proof
            const proof: KeystoneProof = {
                claim,
                solutions,
            };

            const revocationInfo: KeystoneRevocationInfo = { reason, proof };

            const newData: KeystoneData_V1 = {
                challengePools: nextPools,
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

                // Collision Check? No. Better than this is the configuration
                // that requires multiple challenges. So we should assume that a
                // very small number of repeats is going to happen, but that the
                // overall security remains intact due to multiple layers of
                // challenges (multiple FIFO, Stochastic, Binding, etc.).

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
        } else if (strategyType === KeystoneReplenishStrategy.scorchedEarth) {
            // SCORCHED EARTH: Delete EVERYTHING.
            pool.challenges = {};
            pool.bindingMap = {};
        } else {
            throw new Error(`Unknown replenish strategy: ${strategyType}. Valid list: ${pretty(KEYSTONE_REPLENISH_STRATEGY_VALID_VALUES)} (E: 0acf56f1e1486240080e11e8046d0825)`);
        }

        return newPools;
    }

    /**
     * Creates a new keystone ibgib that has no dna and no past.
     */
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

            // create the actual keystoneIbGib
            const resFirstGen = await Factory_V1.firstGen({
                parentIbGib: Factory_V1.primitive({ ib: KEYSTONE_ATOM }),
                ib: await getKeystoneIb({ keystoneData: data }),
                data,
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
            const keystoneIbGib = resFirstGen.newIbGib;

            // at this point, the first gen result has an interstitial ibgib and
            // its past is not empty. We need to change this so that the past is
            // indeed empty. We then will drop the interstitial and re-calculate
            // the gib (hash).
            // console.error(`${lc} PART 1 - NOT AN ERROR. JUST A TEMP LOG MSG TO BE REMOVED. I WANT TO SEE WHAT THIS LOOKS LIKE IN DEBUGGING. specifically, I am looking at n & isTjp and whether we need to manually adjust them.\nkeystoneIbGib... (I: 2ce3b821ba739cd3e821625811315525)`);
            // console.dir(keystoneIbGib);
            // console.log(pretty(keystoneIbGib)); // uncomment this to see the actual full object (it's big though)
            if (!keystoneIbGib.data) { throw new Error(`(UNEXPECTED) keystoneIbGib.data falsy? We expect the data to be populated with real keystone data. (E: 38a358facdb89d16d81d48c8520d3d25)`); }
            if (!keystoneIbGib.rel8ns) { throw new Error(`(UNEXPECTED) keystoneIbGib.rel8ns falsy? we expect the rel8ns to have ancestor and past. (E: 20cb7723dc33ae1ef808fe76d1bf4b25)`); }
            if (!keystoneIbGib.rel8ns.past || keystoneIbGib.rel8ns.past.length === 0) {
                throw new Error(`(UNEXPECTED) keystoneIbGib.rel8ns.past falsy or empty? we expect the firstGen call to generate an interstitial ibgib that we will splice out. (E: 0fd8388d045ab9f37834c27d67e78825)`);
            }

            // reset n
            keystoneIbGib.data.n = 0;
            // reset tjp
            keystoneIbGib.data.isTjp = true;
            delete keystoneIbGib.rel8ns.tjp;
            // reset past
            delete keystoneIbGib.rel8ns.past;

            // recalculate gib
            keystoneIbGib.gib = await getGib({ ibGib: keystoneIbGib });

            // console.error(`${lc} PART 2 - NOT AN ERROR. JUST A TEMP LOG MSG TO BE REMOVED. I WANT TO SEE WHAT THIS LOOKS LIKE IN DEBUGGING. specifically, I am looking at n & isTjp and whether we need to manually adjust them.\nkeystoneIbGib... (I: db9f181938184d9d9832fac8fa25a325)`);
            // console.dir(keystoneIbGib);
            // console.log(pretty(keystoneIbGib)); // uncomment this to see the actual full object (it's big though)

            // save and register
            await metaspace.put({ ibGib: keystoneIbGib, space, });
            await metaspace.registerNewIbGib({ ibGib: keystoneIbGib, space, });

            return keystoneIbGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * for signing/revoking, the newData is entirely new per frame, i.e., we
     * replace all relevant keystone information. IOW we are not just patching
     * the data by adding or replacing keys, we are providing all pools, claim,
     * solutions, required, and frameDetails. So this implementation is required
     * to remove each of the old keys in the call to {@link mut8}.
     */
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

            const prevData = prevIbGib.data;
            /**
             * we want to completely replace these keys, so we will remove them
             * from the data. This occurs first in the underlying mut8
             * transform.
             * @see {@link mut8}
             */
            let dataToRemove: Partial<KeystoneData_V1> | undefined = {}
            if (prevData.proofs) { dataToRemove.proofs = []; }
            if (prevData.challengePools) { dataToRemove.challengePools = []; }
            if (prevData.frameDetails) { dataToRemove.frameDetails = {}; }
            if (Object.keys(dataToRemove).length === 0) { dataToRemove = undefined; }

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
            // --- VALIDATION UPDATE ---
            const errors = await this.validate({
                currentIbGib: newKeystoneIbGib,
                prevIbGib,
                metaspace,
                space,
            });
            if (errors.length > 0) {
                // console.error(`${lc} invalid keystone immediately after evolution. newKeystoneIbGib:\n${pretty(newKeystoneIbGib)} (E: 466a52230e7ece724fd119f39fbce825)`)
                console.error(`${lc} Validation Failed:\n${errors.join('\n')}`);
                throw new Error(`(UNEXPECTED) invalid keystone after we just evolved it? Errors: ${errors.join('; ')} (E: ae2c58406c1db7687879dfb89fc1f825)`);
            }

            // save and register
            await metaspace.put({ ibGib: newKeystoneIbGib, space, });
            await metaspace.registerNewIbGib({ ibGib: newKeystoneIbGib, space, });

            return newKeystoneIbGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}
