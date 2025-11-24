import {
    KeystonePoolConfig
} from '../keystone-types.mjs';
import { KeystoneStrategyAny } from './keystone-strategy.mjs';
import { KeystoneStrategy_HashRevealV1 } from './hash-reveal-v1/hash-reveal-v1.mjs';

export class KeystoneStrategyFactory {

    /**
     * Instantiates the appropriate concrete KeystoneStrategy based on the
     * provided configuration type.
     *
     * @param config The configuration object for the pool (contains 'type').
     * @returns An instance of the specific strategy class.
     */
    static create({
        config,
    }: {
        config: KeystonePoolConfig,
    }): KeystoneStrategyAny {
        const lc = `[${KeystoneStrategyFactory.name}.create]`;
        try {
            switch (config.type) {
                case 'hash-reveal-v1':
                    return new KeystoneStrategy_HashRevealV1(config);

                default:
                    throw new Error(`Unknown strategy type: ${(config as any).type} (E: 4e3c2f7129a241c1b687555e678c1065)`);
            }
        } catch (error) {
            console.error(`${lc} ${error.message}`);
            throw error;
        }
    }
}
