import {
    respecfully, iReckon, ifWe, firstOfAll, firstOfEach, lastOfAll, lastOfEach, respecfullyDear, ifWeMight
} from '@ibgib/helper-gib/dist/respec-gib/respec-gib.mjs';
const maam = `[${import.meta.url}]`, sir = maam;
import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { MetaspaceService, } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
import { Metaspace_Innerspace } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-innerspace/metaspace-innerspace.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';

import { GLOBAL_LOG_A_LOT } from '../constants.mjs';
import { KeystoneStrategyFactory } from './strategy/keystone-strategy-factory.mjs';
import { KeystoneClaim, KeystoneIbGib_V1, KeystonePoolConfig_HashV1 } from './keystone-types.mjs';
import { createRevocationPoolConfig, createStandardPoolConfig } from './keystone-config-builder.mjs';
import { POOL_ID_DEFAULT, POOL_ID_REVOKE, VERB_REVOKE } from './keystone-constants.mjs';
import { KeystoneService_V1 } from './keystone-service-v1.mjs';

const logalot = GLOBAL_LOG_A_LOT;


// /**
//  * not sure where to put this, but we probably will want to reuse this in the
//  * future (assuming it works)
//  * @returns metaspace service reference
//  */
// async function getNewInitializedInMemoryMetaspaceForTesting({
//     defaultSpaceName,
// }: {
//     defaultSpaceName: string,
// }): Promise<MetaspaceService> {
//     const lc = `[${getNewInitializedInMemoryMetaspaceForTesting.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 766d7596addcb73f4820586469233b25)`); }

//         let metaspace = new Metaspace_Innerspace(/*cacheSvc*/undefined);
//         if (logalot) { console.log(`${lc} creating metaspace complete. initializing... (I: 61b74d62e8832c9fa853e4b8c4c2d825)`); }
//         getGibInfo()

//         await metaspace.initialize({
//             spaceName: defaultSpaceName,
//             /**
//              * passing in undefined will use the defaults. probably will need to
//              * adjust this for testing purposes, but let's see what happens with
//              * this first.
//              */
//             metaspaceFactory: {
//                 fnDtoToSpace: async () => {
//                     if (!currentSpace) { currentSpace = new IbGibTestSpace(); }
//                     return currentSpace;
//                 },
//                 fnZeroSpaceFactory: () => {
//                     if (!currentZeroSpace) { currentZeroSpace = new IbGibTestSpace(); }
//                     return currentZeroSpace;
//                 },
//                 fnDefaultLocalSpaceFactory: async () => {
//                     if (!currentSpace) { currentSpace = new IbGibTestSpace(); }
//                     return currentSpace;
//                 },

//                 // export type DtoToSpaceFunction = (spaceDto: IbGib_V1) => Promise<IbGibSpaceAny>;
//                 // export type ZeroSpaceFactoryFunction = () => IbGibSpaceAny;
//                 // export type LocalSpaceFactoryFunction = (opts: CreateLocalSpaceOptions) => Promise<IbGibSpaceAny | undefined>;
//             },
//             getFnAlert: () => { return async ({ title, msg }) => console.log(title, msg) },
//             getFnPrompt: () => {
//                 return async ({ title, msg }) => {
//                     // if this is needed, we might set up some way for testing
//                     // to prepare either a queue of prompts or some kind of map or getter
//                     // and put it on the metaspace itself
//                     throw new Error(`not implemented (E: c7ef688a02f8cb74487260f9274ac825)`);
//                     // promptForText({ title, msg, confirm: false });
//                 }
//             },
//             getFnPromptPassword: () => {
//                 return async () => {
//                     // similar to getFnPrompt, if we need a _different_
//                     // password, we might set up some way for testing to prepare
//                     // either a queue of passwords or some kind of map or getter
//                     // and put it on the metaspace itself
//                     return 'password';
//                     // promptForSecret({ confirm: true })
//                 }
//             },
//         });
//         return metaspace;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

/**
 * A simple in-memory map acting as a Space.
 * Pure Storage. No Indexing logic.
 */
class MockIbGibSpace {
    store = new Map<string, IbGib_V1>();

    constructor(public name: string = "mock_space") { }

    async put({ ibGib }: { ibGib: IbGib_V1 }): Promise<void> {
        const addr = getIbGibAddr({ ibGib });
        this.store.set(addr, JSON.parse(JSON.stringify(ibGib))); // Deep copy
    }

    async get({ addr }: { addr: string }): Promise<IbGib_V1 | null> {
        const data = this.store.get(addr);
        return data ? JSON.parse(JSON.stringify(data)) : null;
    }
}

/**
 * A partial mock of Metaspace.
 * Handles:
 * 1. Retrieving the local space.
 * 2. Delegating 'put' to the space.
 * 3. 'registerNewIbGib': Tracking the HEAD of a timeline.
 */
class MockMetaspaceService {

    /**
     * Map of TJP Gib (Timeline ID) -> Latest IbGib Addr (Head)
     */
    timelineHeads = new Map<string, string>();

    constructor(public space: MockIbGibSpace) { }

    async getLocalUserSpace({ lock }: { lock: boolean }): Promise<MockIbGibSpace> {
        return this.space;
    }

    /**
     * Metaspace often acts as a facade for put, defaulting to local space.
     */
    async put(args: any): Promise<void> {
        const target = args.space || this.space;
        return target.put(args);
    }

    /**
     * Tracks the latest version of an ibGib timeline.
     */
    async registerNewIbGib(args: { ibGib: IbGib_V1, space?: any }): Promise<void> {
        const { ibGib } = args;
        const targetSpace = args.space || this.space;

        // 1. Ensure it is stored
        await targetSpace.put({ ibGib });

        // 2. Extract TJP (Timeline Identifier)
        // Simplified logic mirroring getGibInfo
        const gib = ibGib.gib || '';
        let tjpGib = gib;

        if (gib.includes('.')) {
            // It's a frame in a timeline: "punctiliarHash.tjpHash"
            // The TJP is the suffix.
            const parts = gib.split('.');
            tjpGib = parts.slice(1).join('.');
        }
        // Else: It's a Primitive or a TJP itself (Genesis).
        // If Genesis (isTjp=true), the gib IS the tjpGib.

        const addr = getIbGibAddr({ ibGib });
        this.timelineHeads.set(tjpGib, addr);
    }
}

// ===========================================================================
// SUITE A: STRATEGY VECTORS (The Math)
// ===========================================================================

await respecfully(sir, 'Suite A: Strategy Vectors (HashRevealV1)', async () => {

    // Setup generic variables
    const masterSecret = "TestSecret_12345";
    const salt = "TestPool";
    let config: KeystonePoolConfig_HashV1;

    firstOfAll(sir, async () => {
        // Use our standard builder to get a valid config object
        config = createStandardPoolConfig(salt) as KeystonePoolConfig_HashV1;
    });

    await respecfully(sir, 'Derivation Logic', async () => {

        await ifWeMight(sir, 'derivePoolSecret with same inputs returns same output', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });

            const secretA = await strategy.derivePoolSecret({ masterSecret });
            const secretB = await strategy.derivePoolSecret({ masterSecret });

            iReckon(sir, secretA).asTo('secret consistency').willEqual(secretB);
            iReckon(sir, secretA).asTo('secret length').isGonnaBeTruthy();
        });

        await ifWeMight(sir, 'derivePoolSecret with different master secret returns different output', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });

            const secretA = await strategy.derivePoolSecret({ masterSecret });
            const secretB = await strategy.derivePoolSecret({ masterSecret: masterSecret + "_diff" });

            iReckon(sir, secretA).asTo('secrets differ').not.willEqual(secretB);
        });

        await ifWeMight(sir, 'derivePoolSecret with different salt returns different output', async () => {
            // Modify salt in a copy of config
            const configB = { ...config, salt: "OtherPool" };
            const strategyA = KeystoneStrategyFactory.create({ config });
            const strategyB = KeystoneStrategyFactory.create({ config: configB });

            const secretA = await strategyA.derivePoolSecret({ masterSecret });
            const secretB = await strategyB.derivePoolSecret({ masterSecret });

            iReckon(sir, secretA).asTo('salt affects secret').not.willEqual(secretB);
        });
    });

    await respecfully(sir, 'Challenge/Solution Logic', async () => {

        await ifWeMight(sir, 'generateSolution -> generateChallenge -> validateSolution loop works', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const challengeId = "a3ff7843552870fc28bef2b"; // arbitrary random challengeId

            // 1. Generate Solution
            const solution = await strategy.generateSolution({ poolSecret, poolId: salt, challengeId });
            iReckon(sir, solution.value).asTo('solution value exists').isGonnaBeTruthy();
            iReckon(sir, solution.challengeId).asTo('id matches').willEqual(challengeId);

            // 2. Generate Public Challenge from Solution
            const challenge = await strategy.generateChallenge({ solution });
            iReckon(sir, challenge.hash).asTo('challenge hash exists').isGonnaBeTruthy();

            // 3. Validate
            const isValid = await strategy.validateSolution({ solution, challenge });
            iReckon(sir, isValid).asTo('valid pair should pass').isGonnaBeTrue();
        });

        await ifWeMight(sir, 'validateSolution fails for mismatched values', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });
            const challengeId = "8c994f3ed598f150e25513"; // arbitrary random challengeId

            // Generate real pair
            const solution = await strategy.generateSolution({ poolSecret, poolId: salt, challengeId });
            const challenge = await strategy.generateChallenge({ solution });

            // Tamper with solution value
            const badSolution = { ...solution, value: "hacked_value" };

            const isValid = await strategy.validateSolution({ solution: badSolution, challenge });
            iReckon(sir, isValid).asTo('tampered solution should fail').isGonnaBeFalse();
        });

        await ifWeMight(sir, 'validateSolution fails for mismatched challenge hashes', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });
            const poolSecret = await strategy.derivePoolSecret({ masterSecret });

            // Generate pair A
            const challengeId_A = "416c38cfd6ee63dbf8d4e5ef36"; // arbitrary random challengeId
            const solutionA = await strategy.generateSolution({ poolSecret, poolId: salt, challengeId: challengeId_A });

            // Generate pair B
            const challengeId_B = "c487ef6b7878fae798c3"; // arbitrary random challengeId
            const solutionB = await strategy.generateSolution({ poolSecret, poolId: salt, challengeId: challengeId_B });
            const challengeB = await strategy.generateChallenge({ solution: solutionB });

            // Check A against B
            const isValid = await strategy.validateSolution({ solution: solutionA, challenge: challengeB });
            iReckon(sir, isValid).asTo('mismatched pair should fail').isGonnaBeFalse();
        });
    });
});

// ===========================================================================
// SUITE B: SERVICE LIFECYCLE (Genesis -> Sign -> Validate)
// ===========================================================================

await respecfully(sir, 'Suite B: Service Lifecycle', async () => {

    const service = new KeystoneService_V1();
    const masterSecret = "AliceSecretKey_987654321";

    let mockSpace: MockIbGibSpace;
    let mockMetaspace: any;

    let genesisKeystone: KeystoneIbGib_V1;
    let signedKeystone: KeystoneIbGib_V1;

    firstOfAll(sir, async () => {
        mockSpace = new MockIbGibSpace();
        mockMetaspace = new MockMetaspaceService(mockSpace);
    });

    await respecfully(sir, 'Genesis', async () => {
        await ifWeMight(sir, 'creates a valid genesis frame and persists it', async () => {
            const config = createStandardPoolConfig(POOL_ID_DEFAULT);

            genesisKeystone = await service.genesis({
                masterSecret,
                configs: [config],
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            // Verify Object
            iReckon(sir, genesisKeystone).asTo('genesis object').isGonnaBeTruthy();
            iReckon(sir, genesisKeystone.data?.isTjp).asTo('isTjp').isGonnaBeTrue();

            // Verify Persistence
            const addr = getIbGibAddr({ ibGib: genesisKeystone });
            const saved = await mockSpace.get({ addr });

            iReckon(sir, saved).asTo('persisted to space').isGonnaBeTruthy();

            // Verify Registration (Timeline Tracking)
            // Genesis gib should be registered as a timeline head
            const head = mockMetaspace.timelineHeads.get(genesisKeystone.gib!);
            iReckon(sir, head).asTo('genesis registered as timeline head').willEqual(addr);
        });
    });

    await respecfully(sir, 'Signing (Evolution)', async () => {
        await ifWeMight(sir, 'evolves the keystone with a valid proof', async () => {
            const claim: Partial<KeystoneClaim> = {
                target: "comment 123^gib",
                verb: "post"
            };

            const details = { note: "First post!" };

            signedKeystone = await service.sign({
                latestKeystone: genesisKeystone,
                masterSecret,
                claim,
                poolId: POOL_ID_DEFAULT,
                frameDetails: details,
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            iReckon(sir, signedKeystone).asTo('new frame created').isGonnaBeTruthy();
            iReckon(sir, signedKeystone).asTo('is different frame').not.isGonnaBe(genesisKeystone);

            // NOTE: If this fails, check if 'sign' calls 'space.put' or 'metaspace.put'!
            // In your current 'sign' implementation, you return the object but might have missed the save step.
            const addr = getIbGibAddr({ ibGib: signedKeystone });
            const saved = await mockSpace.get({ addr });
            iReckon(sir, saved).asTo('persisted to space').isGonnaBeTruthy();
        });
    });

    await respecfully(sir, 'Validation', async () => {
        await ifWeMight(sir, 'validates the genesis->signed transition', async () => {
            const errors = await service.validate({
                prevIbGib: genesisKeystone,
                currentIbGib: signedKeystone,
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            iReckon(sir, errors.length).asTo('signature validation has no errors').willEqual(0);
        });
    });
});

// ===========================================================================
// SUITE C: SECURITY & SAD PATHS
// ===========================================================================

await respecfully(sir, 'Suite C: Security Vectors', async () => {

    const service = new KeystoneService_V1();
    const aliceSecret = "AliceSecret_111";
    const eveSecret = "EveSecret_666";

    let mockSpace: MockIbGibSpace;
    let mockMetaspace: any;
    let genesisKeystone: KeystoneIbGib_V1;

    firstOfAll(sir, async () => {
        mockSpace = new MockIbGibSpace();
        mockMetaspace = new MockMetaspaceService(mockSpace);

        // Setup Alice's Identity
        const config = createStandardPoolConfig(POOL_ID_DEFAULT);
        config.behavior.size = 10;
        genesisKeystone = await service.genesis({
            masterSecret: aliceSecret,
            configs: [config],
            metaspace: mockMetaspace,
            space: mockSpace as any,
        });
    });

    await respecfully(sir, 'Wrong Secret (Forgery)', async () => {
        await ifWeMight(sir, 'prevents creation of forged frames', async () => {
            const claim: Partial<KeystoneClaim> = { target: "comment 123^gib", verb: "post" };

            let errorCaught = false;
            let errorMsg = "";

            try {
                // Eve tries to sign Alice's keystone.
                // This MUST fail because sign() calls evolve(), which calls validate().
                await service.sign({
                    latestKeystone: genesisKeystone,
                    masterSecret: eveSecret,
                    claim,
                    poolId: POOL_ID_DEFAULT,
                    metaspace: mockMetaspace,
                    space: mockSpace as any,
                });
            } catch (e: any) {
                errorCaught = true;
                errorMsg = e.message;
            }

            iReckon(sir, errorCaught).asTo('service rejected forgery').isGonnaBeTrue();
            // Verify it was a crypto error, not something else
            iReckon(sir, errorMsg).asTo('error mentions crypto violation').includes('Crypto Violation');
        });
    });

    await respecfully(sir, 'Policy Violation (Restricted Verbs)', async () => {
        await ifWeMight(sir, 'throws error if signing forbidden verb with restricted pool', async () => {
            // Create a specific restricted pool config manually
            const restrictedPoolId = "read_only_pool";
            const restrictedConfig = createStandardPoolConfig(restrictedPoolId);
            // Manually restrict it (since Builder defaults to undefined/allow-all)
            restrictedConfig.allowedVerbs = ['read'];

            const restrictedGenesis = await service.genesis({
                masterSecret: aliceSecret,
                configs: [restrictedConfig],
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            // Try to sign "write" using "read_only_pool"
            const claim: Partial<KeystoneClaim> = { target: "data^gib", verb: "write" };

            let errorCaught = false;
            try {
                await service.sign({
                    latestKeystone: restrictedGenesis,
                    masterSecret: aliceSecret,
                    claim,
                    poolId: restrictedPoolId, // Force use of restricted pool
                    metaspace: mockMetaspace,
                    space: mockSpace as any,
                });
            } catch (e) {
                errorCaught = true;
                // Optional: Check error message contains "not authorized"
            }

            iReckon(sir, errorCaught).asTo('policy enforced').isGonnaBeTrue();
        });
    });
});

// ===========================================================================
// SUITE D: REVOCATION
// ===========================================================================

await respecfullyDear(sir, 'Suite D: Revocation', async () => {

    const service = new KeystoneService_V1();
    const masterSecret = "AliceSecret_RevokeTest";

    let mockSpace: MockIbGibSpace;
    let mockMetaspace: any;
    let genesisKeystone: KeystoneIbGib_V1;

    firstOfAll(sir, async () => {
        mockSpace = new MockIbGibSpace();
        mockMetaspace = new MockMetaspaceService(mockSpace);

        // Setup Identity WITH a Revocation Pool
        const stdConfig = createStandardPoolConfig(POOL_ID_DEFAULT);
        const revokeConfig = createRevocationPoolConfig(POOL_ID_REVOKE); // Special Config

        genesisKeystone = await service.genesis({
            masterSecret,
            configs: [stdConfig, revokeConfig],
            metaspace: mockMetaspace,
            space: mockSpace as any,
        });
    });

    await respecfully(sir, 'Revoke Lifecycle', async () => {
        let revokedKeystone: KeystoneIbGib_V1;

        await ifWeMight(sir, 'successfully creates a revocation frame', async () => {
            revokedKeystone = await service.revoke({
                latestKeystone: genesisKeystone,
                masterSecret,
                reason: "Key compromised",
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            iReckon(sir, revokedKeystone).isGonnaBeTruthy();

            // Check Data
            const data = revokedKeystone.data!;
            iReckon(sir, data.revocationInfo).asTo('revocation info present').isGonnaBeTruthy();
            iReckon(sir, data.revocationInfo!.reason).willEqual("Key compromised");
            iReckon(sir, data.revocationInfo!.proof.claim.verb).willEqual(VERB_REVOKE);
        });

        await ifWeMight(sir, 'validates the revocation frame', async () => {
            const errors = await service.validate({
                prevIbGib: genesisKeystone,
                currentIbGib: revokedKeystone!,
                metaspace: mockMetaspace,
                space: mockSpace as any,
            });

            iReckon(sir, errors.length).asTo('no validation errors').willEqual(0);
        });

        await ifWeMight(sir, 'consumed the revocation pool (Scorched Earth)', async () => {
            const data = revokedKeystone!.data!;
            const revokePool = data.challengePools.find(p => p.id === POOL_ID_REVOKE);

            // The pool should exist...
            iReckon(sir, revokePool).isGonnaBeTruthy();

            // Should be empty (0 challenges)
            const remaining = Object.keys(revokePool!.challenges);
            iReckon(sir, remaining.length).asTo('pool depleted').willEqual(0);
        });
    });
});
