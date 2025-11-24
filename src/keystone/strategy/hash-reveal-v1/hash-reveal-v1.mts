import { hash } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { KeystoneStrategy } from '../keystone-strategy.mjs';
import {
    KeystonePoolConfig_HashV1,
    KeystoneChallenge_HashV1,
    KeystoneSolution_HashV1
} from '../../keystone-types.mjs';

/**
 * The concrete implementation of the "Salted Wrap" Hash Reveal strategy.
 */
export class KeystoneStrategy_HashRevealV1 extends KeystoneStrategy<
    KeystonePoolConfig_HashV1,
    KeystoneChallenge_HashV1,
    KeystoneSolution_HashV1
> {

    /**
     * Derives Pool Secret = Hash(PoolSalt + MasterSecret + PoolSalt) ^ Rounds
     */
    override async derivePoolSecret({
        masterSecret
    }: {
        masterSecret: string
    }): Promise<string> {
        const lc = `[${KeystoneStrategy_HashRevealV1.name}.${this.derivePoolSecret.name}]`;
        try {
            const { salt, rounds, algo } = this.config;
            // Map algo string to HashAlgorithm type if needed,
            // assuming config.algo matches the helper's expected inputs.

            let current = masterSecret;
            for (let i = 0; i < rounds; i++) {
                current = await hash({
                    s: `${salt}${current}${salt}`,
                    algorithm: algo
                });
            }
            return current;
        } catch (error) {
            console.error(`${lc} Error deriving pool secret: ${error.message}`);
            throw error;
        }
    }

    /**
     * Solution Value = Hash(IndexSalt + PoolSecret + IndexSalt) ^ Rounds
     */
    override async generateSolution({
        poolSecret,
        poolId,
        challengeId,
    }: {
        poolSecret: string;
        poolId: string;
        challengeId: string;
    }): Promise<KeystoneSolution_HashV1> {
        const lc = `[${KeystoneStrategy_HashRevealV1.name}.${this.generateSolution.name}]`;
        try {
            const { rounds, algo } = this.config;

            // The Index Salt is the unique identifier for this slot
            const indexSalt = challengeId;

            let current = poolSecret;
            for (let i = 0; i < rounds; i++) {
                current = await hash({
                    s: `${indexSalt}${current}${indexSalt}`,
                    algorithm: algo
                });
            }

            return {
                type: 'hash-reveal-v1',
                poolId,
                challengeId,
                value: current
            };
        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }

    /**
     * Challenge Hash = Hash(IndexSalt + SolutionValue + IndexSalt) ^ Rounds
     */
    override async generateChallenge({
        solution,
    }: {
        solution: KeystoneSolution_HashV1;
    }): Promise<KeystoneChallenge_HashV1> {
        const lc = `[${KeystoneStrategy_HashRevealV1.name}.${this.generateChallenge.name}]`;
        try {
            const { rounds, algo } = this.config;
            const { challengeId, value } = solution;
            const indexSalt = challengeId;

            let current = value;
            for (let i = 0; i < rounds; i++) {
                current = await hash({
                    s: `${indexSalt}${current}${indexSalt}`,
                    algorithm: algo
                });
            }

            return {
                type: 'hash-reveal-v1',
                hash: current
            };
        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }

    /**
     * Re-generates the challenge from the candidate solution and compares.
     */
    override async validateSolution({
        solution,
        challenge,
    }: {
        solution: KeystoneSolution_HashV1;
        challenge: KeystoneChallenge_HashV1;
    }): Promise<boolean> {
        const lc = `[${KeystoneStrategy_HashRevealV1.name}.${this.validateSolution.name}]`;
        try {
            // 1. Check Type Compatibility
            if (solution.type !== 'hash-reveal-v1' || challenge.type !== 'hash-reveal-v1') {
                console.warn(`${lc} Mismatched types provided.`);
                return false;
            }

            // 2. Generate the expected challenge hash from the solution provided
            const calculatedChallenge = await this.generateChallenge({ solution });

            // 3. Compare
            return calculatedChallenge.hash === challenge.hash;
        } catch (error) {
            console.error(`${lc} ${error.message}`);
            return false; // Fail closed
        }
    }
}
