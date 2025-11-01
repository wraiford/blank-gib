import { delay, extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export interface MetronomeInfo {
    bpm: number,
    frequency: number,
    duration: number,
    volume: number,
    audioCtx: AudioContext,
}

export class Metronome {
    private lc: string = `[${Metronome.name}]`;
    #isTicking = false;
    // metronomeIntervalId: any | undefined = undefined;
    public get isTicking(): boolean {
        return this.#isTicking;
    };
    constructor(public info: MetronomeInfo) {
        if (!info) { throw new Error(`(UNEXPECTED) info falsy? (E: 58635a4f0b98774a288647e841dee825)`); }
        const { bpm, frequency, duration, volume, audioCtx } = this.info;
    }
    public async start(): Promise<void> {
        const lc = `${this.lc}[${this.start.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2b53eee8f22370d20ef406e871ed2625)`); }
            const { bpm, frequency, duration, volume, audioCtx } = this.info;

            if (this.isTicking) {
                console.warn(`${lc} already ticking (W: genuuid)`);
                return; /* <<<< returns early */
            }

            // #region validate
            if (bpm <= 0) { throw new Error(`bpm must be positive integer (E: 7aaa36aafdc8623c5c1f3e98f170d825)`); }
            if (frequency <= 0) { throw new Error(`frequency must be positive integer (E: genuuid)`); }
            if (duration <= 0) { throw new Error(`duration must be positive integer (E: genuuid)`); }
            if (volume <= 0) { throw new Error(`volume must be positive integer (E: genuuid)`); }
            if (!audioCtx) { throw new Error(`audioCtx required (E: genuuid)`); }
            // #endregion validate

            this.#isTicking = true;
            setTimeout(async () => {
                while (this.isTicking) {
                    this.playMetronomeTick();
                    await delay(this.beatIntervalMs);
                }
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * getter derived from bpm
     */
    private get beatIntervalMs(): number {
        const lc = `${this.lc}[get beatIntervalMs]`
        if (!this.info.bpm || this.info.bpm < 0) {
            console.error(`${lc} this.info.bpm must be positive integer. using default 1000 (E: 52d1a82a6d64c3188f345ff74e2b2825)`);
            return 1000;
        }
        const result = Math.floor(60 / this.info.bpm * 1000);
        // want to see result for debugger, so separate var
        return result;
    }
    public async stop(): Promise<void> {
        const lc = `${this.lc}[${this.stop.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f5218be7a209348b78f61db8b2c67725)`); }

            if (this.isTicking) {
                this.#isTicking = false;
            } else {
                console.warn(`${lc} already stopped. (W: 8831132d8ea8b78b78eee887c7980125)`);
                return; /* <<<< returns early */
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

    private playMetronomeTick(): void {
        const lc = `[${this.playMetronomeTick.name}]`;
        console.log(lc);
        const { frequency, duration, volume, audioCtx } = this.info;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine"; // You can experiment with other types like "square", "triangle", etc.
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }
}
