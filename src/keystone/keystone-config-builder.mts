import {
    KeystonePoolConfig,
    KeystonePoolConfig_HashV1,
    KeystonePoolBehavior,
    KeystoneReplenishStrategy,
    KeystonePoolConfigBase
} from './keystone-types.mjs';
import { POOL_ID_DEFAULT, POOL_ID_REVOKE } from './keystone-constants.mjs';

/**
 * Abstract Base Builder.
 * Handles configuration common to ALL strategies (Salt, Size, Replenishment, Selection).
 *
 * @template TConfig The concrete config type being built.
 */
export abstract class KeystoneConfigBuilderBase<TConfig extends KeystonePoolConfigBase> {
    protected _salt: string = 'default';
    protected _size: number = 100;
    protected _replenish: KeystoneReplenishStrategy = 'top-up';
    protected _seq: number = 0;
    protected _rand: number = 0;

    /**
     * Sets the unique salt/ID for this pool.
     */
    withSalt(salt: string): this {
        this._salt = salt;
        return this;
    }

    /**
     * Sets the total number of challenges to maintain in the pool.
     */
    withSize(size: number): this {
        this._size = size;
        return this;
    }

    /**
     * Configures the pool to use strictly Sequential (FIFO) selection.
     * @param count Number of challenges to consume per sign.
     */
    withFIFO(count: number): this {
        this._seq = count;
        this._rand = 0;
        return this;
    }

    /**
     * Configures the pool to use strictly Random selection.
     * @param count Number of challenges to consume per sign.
     */
    withRandom(count: number): this {
        this._seq = 0;
        this._rand = count;
        return this;
    }

    /**
     * Configures the pool to use Hybrid (Both FIFO and Random) selection.
     */
    withHybrid(seqCount: number, randCount: number): this {
        this._seq = seqCount;
        this._rand = randCount;
        return this;
    }

    /**
     * Sets the replenishment strategy.
     */
    withReplenishStrategy(strategy: KeystoneReplenishStrategy): this {
        this._replenish = strategy;
        return this;
    }

    /**
     * Constructs the behavioral config object.
     * Helper for subclasses.
     */
    protected buildBehavior(): KeystonePoolBehavior {
        return {
            size: this._size,
            replenish: this._replenish,
            selectSequentially: this._seq,
            selectRandomly: this._rand,
        };
    }

    abstract build(): TConfig;
}

/**
 * Concrete Builder for Hash-Reveal V1 Strategy.
 */
export class KeystoneConfigBuilder_HashV1 extends KeystoneConfigBuilderBase<KeystonePoolConfig_HashV1> {
    private _algo: 'SHA-256' | 'SHA-512' = 'SHA-256';
    private _rounds: number = 1;

    /**
     * Sets the hashing strength.
     */
    withHash(algo: 'SHA-256' | 'SHA-512', rounds: number = 1): this {
        this._algo = algo;
        this._rounds = rounds;
        return this;
    }

    build(): KeystonePoolConfig_HashV1 {
        return {
            type: 'hash-reveal-v1',
            salt: this._salt,
            behavior: this.buildBehavior(),
            algo: this._algo,
            rounds: this._rounds,
        };
    }
}

// ===========================================================================
// STATIC ENTRY POINT (Optional Convenience)
// ===========================================================================

export class KeystoneConfig {
    static hash(): KeystoneConfigBuilder_HashV1 {
        return new KeystoneConfigBuilder_HashV1();
    }

    // Future:
    // static pow(): KeystoneConfigBuilder_PoW { ... }
}

// ===========================================================================
// FACTORY FUNCTIONS (Presets)
// ===========================================================================

export function createStandardPoolConfig(salt: string = POOL_ID_DEFAULT): KeystonePoolConfig {
    return KeystoneConfig.hash()
        .withSalt(salt)
        .withSize(100)
        .withHybrid(1, 1)
        .withReplenishStrategy('top-up')
        .build();
}

export function createRevocationPoolConfig(salt: string = POOL_ID_REVOKE): KeystonePoolConfig {
    return KeystoneConfig.hash()
        .withSalt(salt)
        .withHash('SHA-256', 10)
        .withSize(500)
        .withHybrid(10, 10)
        .withReplenishStrategy('replace-all')
        .build();
}
