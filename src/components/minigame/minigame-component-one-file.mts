import thisHtml from './minigame.html';
import thisCss from './minigame.css';
import stylesCss from '../../styles.css';
import rootCss from '../../root.css';

import { clone, delay, extractErrorMsg, getSaferSubstring, getTimestampInTicks, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { GIB_DELIMITER } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

import {
    GLOBAL_LOG_A_LOT,
    // ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../constants.mjs";
import {
    alertUser,
    getCurrentActiveProjectComponent,
    getGlobalMetaspace_waitIfNeeded,
    promptForConfirm,
    shadowRoot_getElementById,
} from "../../helpers.web.mjs";
// import { storageGet, } from "../../storage/storage-helpers.web.mjs";
import { MinigameData_V1, MinigameFiniteStateMachine, MinigameGamePhase, MinigameIbGib_V1 } from "../../common/minigame/minigame-types.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "../../ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts,
} from "../../ui/component/component-types.mjs";
import { mut8Timeline } from "../../api/timeline/timeline-api.mjs";
import { isMinigameIbGib_V1, } from "../../common/minigame/minigame-helper.mjs";
import {
    AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT,
    MINIGAME_REL8N_NAME,
} from "../../common/minigame/minigame-constants.mjs";
import { Settings_Minigame, } from "../../common/settings/settings-types.mjs";
import { getSectionName, getSettingsSection } from "../../common/settings/settings-helpers.mjs";
import { SettingsType } from "../../common/settings/settings-constants.mjs";
// import {
//     Minigame_TypingGameState, Minigame_TypingGameMeta,
// } from "../../common/minigame/typing/typing-types.mjs";
// import {
//     MINIGAME_GAME_VARIANT_TYPING_VALUES, MinigameGameVariant_Typing
// } from "../../common/minigame/typing/typing-constants.mjs";
import { TYPING_COMPONENT_NAME, TypingComponentInstance } from "./typing/typing-component-one-file.mjs";
import { getComponentSvc } from "../../ui/component/ibgib-component-service.mjs";
import { getAppShellSvc } from "../../ui/shell/app-shell-service.mjs";
import { Metronome } from "../../common/minigame/metronome.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const MINIGAME_COMPONENT_NAME: string = 'ibgib-minigame';

export class MinigameComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${MinigameComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(MINIGAME_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = MINIGAME_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, MinigameComponentInstance);
    }

    /**
     * for a minigame, we don't have any additional info in the path.
     */
    async createInstance({
        path,
        ibGibAddr
    }: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            const component = document.createElement(this.componentName) as MinigameComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: thisHtml,
                css: [rootCss, stylesCss, thisCss],
            });
            return component;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

interface MinigameElements extends ElementsBase {
    nameEl: HTMLElement;
    timerEl: HTMLElement;
    /**
     * sets beats per minute
     */
    metronomeBpmEl: HTMLInputElement;
    /**
     * toggle metronome tick
     */
    metronomeBtnEl: HTMLButtonElement;
    pauseBtnEl: HTMLButtonElement;
    playBtnEl: HTMLButtonElement;
    /**
     * aka stop button
     */
    abortBtnEl: HTMLButtonElement;
    nextGameBtnEl: HTMLButtonElement;
    restartBtnEl: HTMLButtonElement;
    maximizeBtnEl: HTMLButtonElement;
    minigameInstructionsBtnEl: HTMLButtonElement;
    /**
     * used when pausing the game
     */
    pauseScreenEl: HTMLDivElement;
    // minigameResumeBtnEl: HTMLButtonElement;
    /**
     * contains the concrete minigame component, (i.e. where the actual game is
     * injected)
     */
    minigameComponentDivEl: HTMLDivElement;
}

export type MinigameChildComponentInstance = any;// RawComponentInstance | TextEditorComponentInstance;

export class MinigameComponentInstance
    extends IbGibDynamicComponentInstanceBase<MinigameIbGib_V1, MinigameElements>
    implements IbGibDynamicComponentInstance<MinigameIbGib_V1, MinigameElements> {
    protected override lc: string = `[${MinigameComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    private gameFSM: MinigameFiniteStateMachine | undefined = undefined;

    private isMinigame = true;

    constructor() {
        super();

        if (!window.AudioContext && !(window as any).webkitAudioContext) {
            console.error(`no audio context available (E: c094e8547495c99c0898cfd8ebb37c25)`);
        }
    }

    /**
     * creates the concrete minigame component to be injected.
     *
     * atow (06/2025) only the typing component is available.
     *
     * ## notes
     *
     * I've kept the name the same as the tabbed component's that activate child
     * ibgibs, e.g., in the projects and project components. Not sure if this is the right thing to do,
     * but I figure the minigame is basically a parent component and we're
     * activating - in this case - a single concrete "child".
     */
    protected async activateIbGib({ addr, ibGib, }: { addr?: IbGibAddr; ibGib?: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!addr && !ibGib) { throw new Error(`(UNEXPECTED) both addr and ibGib falsy? either addr or ibGib required. (E: genuuid)`); }

            addr ??= getIbGibAddr({ ibGib });
            this.ibGibAddr = addr;
            await this.loadIbGib({ getLatest: true });
            ibGib = this.ibGib;
            if (!ibGib) { throw new Error(`(UNEXPECTED) ibGib false after loading? (E: cc3cb678360b6c23b843fe58b58dee25)`); }
            addr = getIbGibAddr({ ibGib });

            // let minigameSettings: Settings_Minigame | undefined = await this.getCurrentMinigameSettings();
            // if (!minigameSettings) {
            //     throw new Error(`(UNEXPECTED) couldn't get current minigame settings? i thought this would initialized by now. (E: genuuid)`);
            // }
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            if (!tjpAddr) { throw new Error(`(UNEXPECTED) tjpAddr falsy? 'incomingAddr' was used as the default option. (E: genuuid)`); }

            // ibgib is loaded.

            this.isMinigame = isMinigameIbGib_V1(ibGib);
            if (!this.isMinigame) { return; /* <<<< returns early */ }

            // we know we have a minigame. load the concrete component that
            // corresponds to the exact details of the minigame ibgib.
            const { data } = ibGib;
            if (!data) { throw new Error(`(UNEXPECTED) ibGib.data falsy after verifying that it is a MinigameIbGib_V1? (E: 178b183483fde4e4e8491a88d8a76825)`); }

            if (data.gameType !== 'typing') {
                throw new Error(`${data.gameType} not implemented. only "typing" is implemented right now. (E: dd3f080b752f6ba0af08d4082984ad25)`);
            }

            // get typing component and inject it
            const componentSvc = await getComponentSvc();
            const typingComponent =
                await componentSvc.getComponentInstance({
                    path: TYPING_COMPONENT_NAME,
                    ibGibAddr: addr,
                    useRegExpPrefilter: true,
                }) as TypingComponentInstance;

            if (!typingComponent) { throw new Error(`(UNEXPECTED) typingComponent falsy? couldn't get a typingComponent? (E: d316285d8fd80adf986f46038279d325)`); }
            if (this.gameFSM) {
                debugger; // minigame comp: unload fsm when activating new minigame ibgib? does this ever hit?
                // this.gameFSM.phase
            }
            this.gameFSM = typingComponent;

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? how did we get here before init of elements? (E: 349b58bdd3e8e1c976a7f6fb257aef25)`); }
            const { minigameComponentDivEl } = this.elements;

            // anything before injecting?

            await componentSvc.inject({
                parentEl: minigameComponentDivEl,
                componentToInject: typingComponent,
            });

            // update settings for currently active ibgib


            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // private async activateIbGib_typing({
    //     addr,
    //     ibGib,
    //     data,
    // }: {
    //     addr: string;
    //     ibGib: MinigameIbGib_V1;
    //     data: MinigameData_V1;
    // }): Promise<void> {
    //     const lc = `${this.lc}[${this.activateIbGib_typing.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 0df74db944783bbec8a0537f58c9d225)`); }
    //         switch (data.gameVariant) {
    //             case MinigameGameVariant_Typing.parrot:
    //                 await this.forwardGame_parrot({
    //                     addr,
    //                     ibGib,
    //                     data,
    //                 });
    //                 break;
    //             case MinigameGameVariant_Typing.antiphony:
    //                 throw new Error(`not implemented antiphony variant (E: da104857e4887cbd384f75e8a8fe0725)`);
    //                 // await this.forwardGame_parrot({
    //                 //     addr,
    //                 //     ibGib,
    //                 //     data,
    //                 // });
    //                 break;
    //             default:
    //                 throw new Error(`(UNEXPECTED) unknown MinigameGameVariant (${data.gameVariant})? expected one of ${MINIGAME_GAME_VARIANT_TYPING_VALUES} (E: 2af65880dfa89b1cd5c83ffa4e00b825)`);
    //         }

    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initialize(opts);
            await this.loadIbGib({ getLatest: true });
            this.metaspace = await getGlobalMetaspace_waitIfNeeded();
            this.agentsInitialized = this.initAgents();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async created(): Promise<void> {
        const lc = `${this.lc}[${this.created.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            // at this point, this.ibGib should be loaded with the latest
            // minigame ibgib

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: genuuid)`); }

            await this.initElements();
            await this.initSettings();

            await this.agentsInitialized;
            await this.activateIbGib({ ibGib: this.ibGib });
            await this.renderUI();
            // await this.agent!.witness(ROOT); // don't auto-prompt at this time because during dev it's extremely annoying and stresses out the agents

            // spin off because created has to finish
            const minigameSettings = await this.getCurrentMinigameSettings();
            // i think this is where we would "start"/"resume" based on the
            // current game state/phase/variant

            // if ((minigameSettings?.openChildTjpAddrs ?? []).length === 0) {
            //     // first run
            //     this.showInfoTab();
            // } else {
            //     // not first run, so just reopen the old tabs
            //     this.reopenOldTabs();
            // }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.handleContextUpdated();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: genuuid)`); }

            // #region header

            const headerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'minigame-header');

            const timerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'minigame-timer');

            // #endregion header

            const contentEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'minigame-content');

            const nameEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'minigame-name');

            const minigameInstructionsBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-instructions-btn');
            minigameInstructionsBtnEl.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                alertUser({ title: this.ibGib?.data?.name, msg: `${this.ibGib?.data?.description}\n\nInstructions:\n\n${this.ibGib?.data?.instructions}` });
            });

            const maximizeBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'maximize-btn');
            maximizeBtnEl.addEventListener('click', () => {
                const appShellSvc = getAppShellSvc();
                appShellSvc.collapse({
                    panelNames: ['leftPanel', 'rightPanel', 'footerPanel'],
                });
            });

            const minigameComponentDivEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'minigame-component-div');

            const pauseScreenEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'minigame-pause-screen');
            pauseScreenEl.style.display = 'none';
            pauseScreenEl.style.zIndex = "5";

            // #region footer
            const footerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'minigame-footer');

            // metronomeBtnEl - metronome play/pause toggle
            const metronomeBpmEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'metronome-bpm');
            metronomeBpmEl.addEventListener('input', async (event) => {
                this.metronome.info.bpm = Number.parseInt(metronomeBpmEl.value || "120");
            })
            const metronomeBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'metronome-play-pause-btn');
            metronomeBtnEl.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                await this.toggleMetronome();
            });

            // pauseBtnEl
            const pauseBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-header-pause-btn');
            pauseBtnEl.addEventListener('click', async (event) => {
                await this.pause();
            });
            // playBtnEl
            const playBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-header-play-btn');
            playBtnEl.addEventListener('click', async (event) => {
                await this.play();
            });
            // abortBtnEl
            const abortBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-header-abort-btn');
            abortBtnEl.addEventListener('click', async (event) => {
                await this.abort();
            });
            // nextGameBtnEl
            const nextGameBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-header-next-btn');
            nextGameBtnEl.addEventListener('click', async (event) => {
                await this.nextGame();
            });
            // restartBtnEl
            const restartBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-header-restart-btn');
            restartBtnEl.addEventListener('click', async (event) => {
                await this.restart();
            });

            // #endregion footer

            this.elements = {
                headerEl,
                contentEl,
                nameEl,
                pauseScreenEl,
                // minigameResumeBtnEl,
                minigameComponentDivEl,
                metronomeBpmEl,
                metronomeBtnEl,
                footerEl,
                timerEl,
                playBtnEl,
                pauseBtnEl,
                abortBtnEl,
                nextGameBtnEl,
                restartBtnEl,
                minigameInstructionsBtnEl,
                maximizeBtnEl,
            };

            // has to run after this.elements set
            await this.initSettings();
            // await this.initTimer();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private metronome = new Metronome({
        bpm: 120,
        duration: 0.1,
        frequency: 440,
        volume: 0.5,
        audioCtx: new (window.AudioContext || (window as any).webkitAudioContext)(),
    });

    private async toggleMetronome(): Promise<void> {
        const lc = `${this.lc}[${this.toggleMetronome.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 005fe78b1f51d2d7f4055688f13d6825)`); }

            // todo: update metronome bpm from UI
            const bpmStr = this.elements!.metronomeBpmEl.value || '60';
            const bpm = Number.parseInt(bpmStr);
            this.metronome.info.bpm = bpm;

            if (this.metronome.isTicking) {
                await this.metronome.stop();
            } else {
                await this.metronome.start();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async pause(): Promise<void> {
        const lc = `${this.lc}[${this.pause.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 268c84faf1ec217571de75e8d3ef6825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 48ef4c6ed678779324821aa8ed44c425)`); }
            const { pauseScreenEl, minigameComponentDivEl } = this.elements;
            if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: 7b7abfac43c845d4c8eb8938c1312825)`); }
            if (this.gameFSM.gamePhase === MinigameGamePhase.paused) {
                console.warn(`${lc} (UNEXPECTED) already paused? (W: 119d83ea5c0849c5066b0a78fb244525)`)
                return; /* <<<< returns early */
            }
            // const dialog = document.getElementById('fullscreen-dialog') as HTMLDivElement;
            // dialog.showModal();
            pauseScreenEl.style.display = 'flex';
            minigameComponentDivEl.style.display = 'none';
            await this.gameFSM.pause();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async play(): Promise<void> {
        const lc = `${this.lc}[${this.play.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            const { pauseScreenEl, minigameComponentDivEl } = this.elements;
            // const dialog = document.getElementById('fullscreen-dialog') as HTMLDivElement;
            if (!this.ibGib?.data?.playable) {
                console.warn(`${lc} not playable (W: 3680a81400efea0728940af8bec0c125)`);
                return; /* <<<< returns early */
            }
            if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: bcf0088119668a4ec3bbd5a8f9e20f25)`); }
            if (this.gameFSM.gamePhase === MinigameGamePhase.playing) {
                console.warn(`${lc} already playing... (W: 119d83ea5c0849c5066b0a78fb244525)`)
                return; /* <<<< returns early */
            }
            await this.gameFSM.play();
            this.startTimer();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async restart(): Promise<void> {
        const lc = `${this.lc}[${this.restart.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if ([MinigameGamePhase.playing, MinigameGamePhase.paused].includes(this.ibGib!.data!.gamePhase as any)) {
                const confirm = await promptForConfirm({
                    msg: `Abort playing this game and restart?`,
                    yesLabel: `Yes, this game was lame but had promise.`,
                    noLabel: `No, this is good. I just screwed up.`,
                });
                if (!confirm) {
                    console.log(`${lc} user canceled restart. (I: 0aa4c8c182e87a838853bef42ce78f25)`);
                    return; /* <<<< returns early */
                }
            }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            const { pauseScreenEl, minigameComponentDivEl } = this.elements;
            // if (!this.ibGib?.data?.playable) {
            //     console.warn(`${lc} not playable (W: 3680a81400efea0728940af8bec0c125)`);
            //     return; /* <<<< returns early */
            // }
            if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: bcf0088119668a4ec3bbd5a8f9e20f25)`); }
            pauseScreenEl.style.display = 'none';
            minigameComponentDivEl.style.display = 'flex';
            await this.gameFSM.restart();
            this.stopTimer();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async abort(): Promise<void> {
        const lc = `${this.lc}[${this.abort.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            const confirm = await promptForConfirm({
                msg: `Abort playing this game?`,
                yesLabel: `Yes, I'm done with this one.`,
                noLabel: `No, let's keep going.`,
            });
            if (!confirm) {
                console.log(`${lc} user canceled aborting. (I: eef296edf4bd1340e1d78d7860c61825)`);
                return; /* <<<< returns early */
            }
            const { pauseScreenEl, minigameComponentDivEl } = this.elements;
            // const dialog = document.getElementById('fullscreen-dialog') as HTMLDivElement;
            if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: genuuid)`); }
            if (this.gameFSM.gamePhase !== MinigameGamePhase.playing) {
                console.warn(`${lc} not playing... (W: genuuid)`)
                return; /* <<<< returns early */
            }
            await this.gameFSM.abort();
            this.stopTimer();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async nextGame(): Promise<void> {
        const lc = `${this.lc}[${this.nextGame.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: genuuid)`); }
            const confirm = this.gameFSM.gamePhase === MinigameGamePhase.playing ?
                await promptForConfirm({
                    msg: `Abort playing this game and start the next one in the project?`,
                    yesLabel: `Yes, I'm done with this one.`,
                    noLabel: `No, let's keep going.`,
                }) :
                await promptForConfirm({
                    msg: `Start the next game in the project?`,
                    yesLabel: `Yes, next please.`,
                    noLabel: `No, let's keep playing this game.`,
                });

            if (!confirm) {
                console.log(`${lc} user canceled skip to next game. (I: genuuid)`);
                return; /* <<<< returns early */
            }

            // get the current project ibgib
            const currentProjectComponent = getCurrentActiveProjectComponent();
            const projectIbGib = currentProjectComponent.ibGib!;

            // find the index of the the current minigame
            let nextIndex: number;
            const minigameAddrs = projectIbGib.rel8ns![MINIGAME_REL8N_NAME]!;
            const currentMinigameIndex = minigameAddrs.findIndex(addr => {
                const { gib } = getIbAndGib({ ibGibAddr: addr });
                const tjpGib = gib.includes(GIB_DELIMITER) ?
                    gib.split(GIB_DELIMITER).at(-1)! :
                    gib;
                const thisTjpGib = getIbAndGib({ ibGibAddr: this.tjpAddr }).gib;
                return thisTjpGib === tjpGib;
            });
            if (currentMinigameIndex >= 0) {
                if (currentMinigameIndex === (minigameAddrs.length - 1)) {
                    // current minigame is the last in the list
                    const startAtBeginning = await promptForConfirm({
                        msg: `This is the last minigame. Would you like to load the first one?`,
                        yesLabel: `Yes, load the very first minigame`,
                        noLabel: `Nevermind, stay here.`,
                    });
                    if (startAtBeginning) {
                        nextIndex = 0;
                    } else {
                        return; /* <<<< returns early */
                    }
                } else {
                    // guaranteed to have an index one higher than the current
                    // index
                    nextIndex = currentMinigameIndex + 1;
                }
            } else {
                console.error(`${lc} could not find the index of the current minigame? Does this minigame (${this.ibGibAddr}) exist on the current active project? Or have we moved on to minigames on project child ibgibs? (E: a247f4ce8469ba5ed848207365579e25)`);
                await alertUser({ title: 'whoops', msg: `We seem to not be able to find another minigame. Sorry about that! Hey at least you have the current game.` });
                return; /* <<<< returns early */
            }

            // load the next minigame
            let nextMinigameAddr = minigameAddrs.at(nextIndex);
            if (nextMinigameAddr) {
                await currentProjectComponent.activateIbGib({
                    // activateIbGib loads the latest in the timeline
                    addr: nextMinigameAddr,
                });
            } else {
                await alertUser({
                    title: 'hmm...',
                    msg: `Well, we thought we had it but something seems to have gone wrong and we lost it. You'll have to manually load another minigame. Contact us about this error though please. (E: 370e6bc457e5d37564cb4fe83cbc7525)`,
                });
                return; /* <<<< returns early */
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async initSettings(): Promise<void> {
        const lc = `${this.lc}[${this.initSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initSettings();

            if (!this.settings) { throw new Error(`(UNEXPECTED) this.settings falsy after init? (E: genuuid)`); }
            if (!this.settings.ibGib) { throw new Error(`(UNEXPECTED) this.settings.ibGib falsy after init? (E: genuuid)`); }

            let minigameSettings = await this.getCurrentMinigameSettings();

            if (!minigameSettings) {
                // need to create a new minigame settings section
                minigameSettings = { type: 'minigame', }
                // update the current settings and persist
                const sectionName_default = await getSectionName({
                    settingsType: SettingsType.minigame,
                    useCase: 'default',
                });
                const sectionName_current = await getSectionName({
                    settingsType: SettingsType.minigame,
                    useCase: 'current',
                });
                const _newSettings = await mut8Timeline({
                    timeline: this.settings!.ibGib!,
                    metaspace: this.metaspace!,
                    mut8Opts: {
                        dataToAddOrPatch: {
                            sections: {
                                [sectionName_default]: minigameSettings,
                                [sectionName_current]: minigameSettings,
                            }
                        }
                    },
                });
            }

            // const sectionName_generalCurrent = await getSectionName({
            //     settingsType: 'general',
            //     useCase: 'current',
            // });
            // data.sections[sectionName_generalDefault] = clone(DEFAULT_SETTINGS_GENERAL);
            // data.sections[sectionName_generalCurrent] = clone(DEFAULT_SETTINGS_GENERAL);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async getCurrentMinigameSettings(): Promise<Settings_Minigame | undefined> {
        const lc = `${this.lc}[${this.getCurrentMinigameSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.settings) { throw new Error(`(UNEXPECTED) this.settings falsy? shouldn't this be initialized by now? (E: genuuid (E: genuuid)`); }
            if (!this.settings.ibGib) { throw new Error(`(UNEXPECTED) this.settings.ibGib falsy? shouldn't this be initialized by now? especially since this.settings is truthy? (E: genuuid)`); }

            const minigameSettings = await getSettingsSection({
                sectionName: await getSectionName({
                    settingsType: 'minigame',
                    useCase: 'current',
                }),
                settingsIbGib: this.settings.ibGib,
            }) as (Settings_Minigame | undefined);

            if (!minigameSettings) {
                if (logalot) { console.log(`${lc} minigameSettings does not exist. returning undefined. (I: genuuid)`) }
            }
            return minigameSettings;
            // if (!minigameSettings) { throw new Error(`(UNEXPECTED) couldn't get minigame settings? should be guaranteed after init. (E: genuuid)`); }

            // return minigameSettings;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * rerender
     */
    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            await super.renderUI();

            const { elements, ibGib } = this;
            if (!elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }
            if (!ibGib) {
                debugger; // warning - this.ibGib falsy? in minigame comp
                console.log(`${lc} this.ibGib falsy? returning early... (W: genuuid)`)
                return; /* <<<< returns early */
            }
            const { data } = ibGib;
            if (!data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: df3f386eb978cc232921e668e16af825)`); }

            const {
                // headerEl, contentEl, footerEl,
                nameEl,
                playBtnEl, pauseBtnEl, abortBtnEl, restartBtnEl,
                pauseScreenEl, minigameComponentDivEl,
                // maximizeBtnEl,
            } = elements;

            if (!this.isMinigame) {
                minigameComponentDivEl.textContent = `This ibGib ain't a minigame 🤨`
                return; /* <<<< returns early */
            }

            const minigameSettings = await this.getCurrentMinigameSettings();
            if (!minigameSettings) {
                console.error(`${lc} (UNEXPECTED) minigameSettings falsy? NOTE: THIS DID NOT THROW. ONLY LOGGED ERROR. (E: 6fb9fd2fda681dee94b355389ee2c225)`);
            }

            nameEl.textContent = data.name ?? '[minigame no name?]'
            nameEl.textContent += ` (v${data.n ?? '?'})`
            nameEl.title = data.description;

            // if (!this.gameFSM) { throw new Error(`(UNEXPECTED) this.gameFSM falsy? (E: 0b3e91927fb8b6ca285de925821ef825)`); }

            const { gamePhase } = data;
            if (!gamePhase) { throw new Error(`(UNEXPECTED) gamePhase falsy? (E: 095462d507ea7db7b78658486d01db25)`); }
            playBtnEl.disabled =
                !data.playable ||
                [MinigameGamePhase.playing, MinigameGamePhase.aborted, MinigameGamePhase.complete].includes(gamePhase as any);
            pauseBtnEl.disabled =
                gamePhase !== MinigameGamePhase.playing;
            abortBtnEl.disabled =
                gamePhase !== MinigameGamePhase.playing;
            restartBtnEl.disabled =
                [MinigameGamePhase.init, MinigameGamePhase.ready].includes(gamePhase as any);
            // data.gamePhase !== MinigameGamePhase.playing;

            // const description = this.ibGib?.data?.description;
            // if (description) {
            //     descEl.textContent = description;
            // } else {
            //     descEl.style.display = 'none';
            // }

            if (gamePhase === MinigameGamePhase.paused) {
                pauseScreenEl.style.display = 'flex';
                minigameComponentDivEl.style.display = 'none';
            } else {
                pauseScreenEl.style.display = 'none';
                minigameComponentDivEl.style.display = 'flex';
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // private async calculatePlayingTimeInTicks(): Promise<number> {
    //     const lc = `${this.lc}[${this.calculatePlayingTimeInTicks.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 51828b278e0889887d238e05fb691325)`); }
    //         if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: bb27a8b3ed5838cdffba61f471112d25)`); }
    //         if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: bd335e090cd26ee7e8d3f8595d087a25)`); }

    //         const { gameMeta, gameState, gamePhase } = this.ibGib.data;
    //         const interactions = gameState as Minigame_TypingInteraction[]; // code smell here of course. I need to add interactions to all

    //         // should calculate the playing time based on the
    //         // gameState.interactions via the timestamps.
    //         let totalTime = 0;
    //         if (gamePhase === MinigameGamePhase.init) {
    //             totalTime = 0;
    //             return totalTime; /* <<<< returns early */
    //         }

    //         const firstStimulus = interactions.at(0)?.stimulus ?? gameState.currentStimulus;
    //         if (!firstStimulus) {
    //             console.warn(`${lc} no firstStimulus? returning 0. (W: genuuid)`)
    //             return 0; /* <<<< returns early */
    //         }
    //         const startTimestamp = firstStimulus.timestampInTicks;
    //         if (!startTimestamp) {
    //             console.error(`${lc} firstStimulus didn't have a timestamp? returning 0. (E: genuuid)`);
    //             return 0; /* <<<< returns early */
    //         }
    //         const startTime = Number.parseInt(startTimestamp);

    //         let pauseFound = false;
    //         let currentIndex = 1; // index 0 is first stimulus above
    //         do {
    //             // look for the next game phase being paused in the history
    //             const remainingInteractions = interactions.slice(currentIndex);
    //             remainingInteractions.findIndex
    //         } while (pauseFound);


    //         const now_timestampInTicks = getTimestampInTicks();
    //         const now_number = Number.parseInt(now_timestampInTicks);


    //         if (gamePhase === MinigameGamePhase.playing) {
    //             totalTime = now_number - startTime;
    //         } else if ([MinigameGamePhase.aborted, MinigameGamePhase.complete].includes(gamePhase as any)) {

    //             let lastTimestamp: string;
    //             const lastResponse = gameState.interactions.at(-1)?.response;
    //             if (lastResponse) {
    //                 if (lastResponse.timestampInTicks) {
    //                     lastTimestamp = lastResponse.timestampInTicks;
    //                 } else {
    //                     console.error(`${lc} (UNEXPECTED) lastResponse.timestampInTicks falsy? returning 0 (E: genuuid)`);
    //                     return 0; /* <<<< returns early */
    //                 }
    //             } else {
    //                 lastTimestamp = now_timestampInTicks;
    //             }
    //             const lastTime = Number.parseInt(lastTimestamp);

    //             totalTime = lastTime - startTime;
    //         } else if ([MinigameGamePhase.paused].includes(gamePhase as any)) {
    //             return this.#timerValueInTicks;
    //         } else {
    //             // debugger; // typing comp calc timestamp when does this hit?
    //             return 0;
    //         }

    //         if (logalot) { console.log(`${lc} totalTime: ${totalTime} ticks (I: 4f2cd7eac4740a9a48a8ecf80adfb525)`); }

    //         return totalTime;
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    #timerInterval: any | undefined;
    #timerValueInSeconds: number = 0;
    private startTimer(): void {
        const lc = `${this.lc}[${this.startTimer.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a9b8281444c8523b68de98e85cbc1825)`); }
            if (this.#timerInterval) {
                if (logalot) { console.log(`${lc} timer already started. (we were paused?) (I: b09df8d777f80dafd1c2b2dd2ef29825)`); }
                return; /* <<<< returns early */
            }
            this.#timerInterval = setInterval(async () => {
                const { gamePhase } = this.gameFSM!;
                if (!gamePhase) {
                    console.warn(`${lc} gamePhase falsy?  what? this is expected to be truthy. (W: 25a87ffdb683d197587d2c6e30557825)`);
                    debugger; // want to see if gamePhase is ever falsy
                    return; /* <<<< returns early */
                }

                switch (gamePhase) {
                    case MinigameGamePhase.ready:
                        // this.#timerValueInTicks++; // don't increment during ready
                        break;
                    case MinigameGamePhase.playing:
                        this.#timerValueInSeconds++;
                        break;
                    case MinigameGamePhase.paused:
                        // this.#timerValueInTicks++; // don't increment when paused
                        break;
                    default:
                        this.stopTimer();
                        break;
                }

                this.renderUI_updateTimer();
            }, 1000);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }
    private stopTimer(): void {
        const lc = `[${this.stopTimer.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 630d585c15acae8dff0a6b28c8c36825)`); }
            if (this.#timerInterval) {
                clearInterval(this.#timerInterval);
                this.#timerInterval = undefined;
            } else {
                console.error(`${lc} no timer started? (E: genuuid)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private renderUI_updateTimer() {
        const lc = `${this.lc}[${this.renderUI_updateTimer.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            const { elements, } = this;
            if (!elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            const { timerEl, } = elements;
            // convert #timerValueInTicks to show as HH:MM:SS
            /**
             * going to pull out hours and minutes. this will be the working
             * seconds remaining after each time we pull time out.
             */
            let runningTotalSeconds = this.#timerValueInSeconds; // Assuming ticks are milliseconds
            const hours = Math.floor(runningTotalSeconds / 3600);
            runningTotalSeconds -= hours * 3600;
            const minutes = Math.floor((runningTotalSeconds % 3600) / 60);
            runningTotalSeconds -= minutes * 60;
            const seconds = runningTotalSeconds % 60;

            const formattedTime = hours === 0 ?
                [
                    // hours.toString().padStart(2, '0'),
                    minutes.toString().padStart(2, '0'),
                    seconds.toString().padStart(2, '0'),
                ].join(':') :
                [
                    hours.toString().padStart(2, '0'),
                    minutes.toString().padStart(2, '0'),
                    seconds.toString().padStart(2, '0'),
                ].join(':');

            timerEl.textContent = formattedTime;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            await this.loadAgentsCoupledToIbGib();

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after loadAgentsCoupledToIbGib? (E: genuuid)`); }
            await this.agent.updateAvailableFunctions({
                availableFunctions: AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT,
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // private getAPIKey(): Promise<string> {
    //     const fn = this.getFnGetAPIKey();
    //     return fn();
    // }
    // private getFnGetAPIKey(): () => Promise<string> {
    //     const lc = `${this.lc}[${this.getFnGetAPIKey.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

    //         const fn = async () => {
    //             let apiKey = await storageGet({
    //                 dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
    //                 key: BEE_KEY,
    //             });
    //             return apiKey ?? '';
    //         };
    //         return fn;
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

}
