import {
    respecfully, iReckon, ifWe, firstOfAll, firstOfEach, lastOfAll, lastOfEach, respecfullyDear, ifWeMight
} from '@ibgib/helper-gib/dist/respec-gib/respec-gib.mjs';
const maam = `[${import.meta.url}]`, sir = maam;
import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { MetaspaceService, } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
import { Metaspace_Innerspace } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-innerspace/metaspace-innerspace.mts';

import { GLOBAL_LOG_A_LOT } from '../constants.mts';
import { KeystoneStrategyFactory } from './strategy/keystone-strategy-factory.mjs';
import { KeystoneClaim, KeystoneIbGib_V1, KeystonePoolConfig_HashV1 } from './keystone-types.mjs';
import { createStandardPoolConfig } from './keystone-config-builder.mjs';
import { POOL_ID_DEFAULT } from './keystone-constants.mts';
import { KeystoneService_V1 } from './keystone-service-v1.mjs';

const logalot = GLOBAL_LOG_A_LOT;


/**
 * not sure where to put this, but we probably will want to reuse this in the
 * future (assuming it works)
 * @returns metaspace service reference
 */
async function getNewInitializedInMemoryMetaspaceForTesting({
    defaultSpaceName,
}: {
    defaultSpaceName: string,
}): Promise<MetaspaceService> {
    const lc = `[${getNewInitializedInMemoryMetaspaceForTesting.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 766d7596addcb73f4820586469233b25)`); }

        let metaspace = new Metaspace_Innerspace(/*cacheSvc*/undefined);
        if (logalot) { console.log(`${lc} creating metaspace complete. initializing... (I: 61b74d62e8832c9fa853e4b8c4c2d825)`); }

        await metaspace.initialize({
            spaceName: defaultSpaceName,
            metaspaceFactory: undefined,
            getFnAlert: () => { return async ({ title, msg }) => console.log(title, msg) },
            getFnPrompt: () => {
                return async ({ title, msg }) => {
                    // if this is needed, we might set up some way for testing
                    // to prepare either a queue of prompts or some kind of map
                    // and put it on the metaspace itself
                    throw new Error(`not implemented (E: c7ef688a02f8cb74487260f9274ac825)`);
                    // promptForText({ title, msg, confirm: false });
                }
            },
            getFnPromptPassword: () => {
                return async () => {
                    return 'password';
                    // promptForSecret({ confirm: true })
                }
            },
        });
        return metaspace;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
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

        await ifWe(sir, 'derivePoolSecret with same inputs returns same output', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });

            const secretA = await strategy.derivePoolSecret({ masterSecret });
            const secretB = await strategy.derivePoolSecret({ masterSecret });

            iReckon(sir, secretA).asTo('secret consistency').willEqual(secretB);
            iReckon(sir, secretA).asTo('secret length').isGonnaBeTruthy();
        });

        await ifWe(sir, 'derivePoolSecret with different master secret returns different output', async () => {
            const strategy = KeystoneStrategyFactory.create({ config });

            const secretA = await strategy.derivePoolSecret({ masterSecret });
            const secretB = await strategy.derivePoolSecret({ masterSecret: masterSecret + "_diff" });

            iReckon(sir, secretA).asTo('secrets differ').not.willEqual(secretB);
        });

        await ifWe(sir, 'derivePoolSecret with different salt returns different output', async () => {
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

        await ifWe(sir, 'generateSolution -> generateChallenge -> validateSolution loop works', async () => {
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

        await ifWe(sir, 'validateSolution fails for mismatched values', async () => {
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

        await ifWe(sir, 'validateSolution fails for mismatched challenge hashes', async () => {
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

await respecfullyDear(sir, 'Suite B: Service Lifecycle', async () => {

    const service = new KeystoneService_V1();
    const masterSecret = "AliceSecretKey_987654321";
    let genesisKeystone: KeystoneIbGib_V1;
    let signedKeystone: KeystoneIbGib_V1;

    await respecfully(sir, 'Genesis', async () => {
        await ifWeMight(sir, 'creates a valid genesis frame with pools', async () => {
            const config = createStandardPoolConfig(POOL_ID_DEFAULT);

            genesisKeystone = await service.genesis({
                masterSecret,
                configs: [config]
            });

            iReckon(sir, genesisKeystone).asTo('genesis object').isGonnaBeTruthy();
            iReckon(sir, genesisKeystone.data).asTo('data exists').isGonnaBeTruthy();

            const pools = genesisKeystone.data!.challengePools;
            iReckon(sir, pools.length).asTo('has pools').willEqual(1);
            iReckon(sir, pools[0].id).asTo('correct pool id').willEqual(POOL_ID_DEFAULT);

            // Check challenges exist (size 100 per standard config)
            const challenges = Object.keys(pools[0].challenges);
            iReckon(sir, challenges.length).asTo('challenges populated').willEqual(100);
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
                frameDetails: details
            });

            iReckon(sir, signedKeystone).asTo('new frame created').isGonnaBeTruthy();
            iReckon(sir, signedKeystone).asTo('is different frame').not.isGonnaBe(genesisKeystone);

            // Verify Data Structure
            const data = signedKeystone.data!;
            iReckon(sir, data.proofs.length).asTo('has proof').willEqual(1);
            iReckon(sir, data.proofs[0].claim.target).asTo('claim target matches').willEqual(claim.target);

            // Verify Frame Details
            iReckon(sir, data.frameDetails).asTo('details persisted').isGonnaBeTruthy();
            iReckon(sir, data.frameDetails.note).asTo('details content').willEqual("First post!");

            // Verify Replenishment (Top-Up Strategy)
            // Should still have 100 challenges (consumed were replaced)
            const pool = data.challengePools.find(p => p.id === POOL_ID_DEFAULT)!;
            iReckon(sir, Object.keys(pool.challenges).length).asTo('pool topped up').willEqual(100);
        });
    });

    await respecfully(sir, 'Validation', async () => {
        await ifWeMight(sir, 'validates the genesis->signed transition', async () => {
            const isValid = await service.validate({
                prevIbGib: genesisKeystone,
                currentIbGib: signedKeystone
            });

            iReckon(sir, isValid).asTo('signature validation').isGonnaBeTrue();
        });

        await ifWeMight(sir, 'fails validation if previous frame is wrong', async () => {
            // Attempt to validate Signed Frame against ITSELF (as if it were the parent)
            // This should fail because the solution IDs won't exist in Signed Frame's pool (they were consumed!)
            // Or because the pools have changed state.
            const isValid = await service.validate({
                prevIbGib: signedKeystone,
                currentIbGib: signedKeystone
            });

            iReckon(sir, isValid).asTo('invalid parent validation').isGonnaBeFalse();
        });
    });
});
