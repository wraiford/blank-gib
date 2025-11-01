import thisHtml from './typing.html';
import thisCss from './typing.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import {
    clone, delay, extractErrorMsg, getTimestampInTicks, getUUID, pickRandom, pretty,
    unique,
} from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { validateIbGibAddr } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";

import {
    GLOBAL_LOG_A_LOT,
} from "../../../constants.mjs";
import {
    alertUser,
    getGlobalMetaspace_waitIfNeeded, highlightElement, promptForConfirm, promptForText, shadowRoot_getElementById,
} from "../../../helpers.web.mjs";
import { tellUserFunctionInfo } from "../../../api/commands/chat/tell-user.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "../../../ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts,
} from "../../../ui/component/component-types.mjs";
import { helloWorldFunctionInfo } from "../../../api/commands/chat/hello-world.mjs";
import { MinigameFiniteStateMachine, MinigameGamePhase, MinigameIbGib_V1 } from "../../../common/minigame/minigame-types.mjs";
import { DEFAULT_ISO_639_LANGUAGE_CODES, DEFAULT_TYPING_GAMEMETA, DEFAULT_TYPING_GAMESTATE, ExpectedResponseType, MINIGAME_FOCUS_INFO, MINIGAME_STIMULTI_TO_ADD_INFO, MinigameGameVariant_Typing } from "../../../common/minigame/typing/typing-constants.mjs";
import { Minigame_TypingGameState, Minigame_TypingGameMeta, MinigameTypingRawStats, Minigame_TypingStimulus, TypingEntryAndElementsInfo, FocusAndElementsInfo, } from "../../../common/minigame/typing/typing-types.mjs";
import { mut8Timeline } from "../../../api/timeline/timeline-api.mjs";
import { AnalysisEngine, } from "../../../common/text-analysis/analysis-engine.mjs";
import { CorpusAnalyzer } from "../../../common/text-analysis/corpus-analyzer.mjs";
import {
    getElapsedInfo, getAnotherFocusText, getWpm, TypingFocusLevel,
    getGoogleTranslateLink, getStimulusEntryEl,
    getNewTypingEntryId,
    getFocusAndElementsInfo,
    slideRightAndFade,
    unfadeEl,
    toHoursMinutesSeconds,
} from "../../../common/minigame/typing/typing-helper.mjs";
import { DEFAULT_TOKEN_CONSTRUCT_RULE } from "../../../common/text-analysis/analysis-engine-constants.mjs";
import { minigameBuilderValidateAndReadyFunctionInfo, MinigameBuilderValidateAndReadyResult } from "../../../api/commands/minigame/minigame-builder-validate-and-ready.mjs";
import { minigameBuilderEditStimuliFunctionInfo } from "../../../api/commands/minigame/minigame-builder-edit-stimuli.mjs";
import { debounce } from "../../../helpers.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_TYPINGAGENT = 'typingagent';
export const CHAT_WITH_AGENT_PLACEHOLDER_TYPINGAGENT = '';
export const AGENT_AVAILABLE_FUNCTIONS_TYPINGAGENT = [
    helloWorldFunctionInfo,
    tellUserFunctionInfo,
];

export const TYPING_COMPONENT_NAME: string = 'ibgib-typing';

export class TypingComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${TypingComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(TYPING_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = TYPING_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, TypingComponentInstance);
    }

    async createInstance({
        path,
        ibGibAddr
    }: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: d88226a0a20c35abb8e046e8eb251825)`); }
            const component = document.createElement(this.componentName) as TypingComponentInstance;
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

interface TypingElements extends ElementsBase {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement | undefined;
    commandBarEl: HTMLElement;
    /**
     * Used for showing the title/instance name of the typing minigame
     */
    nameEl: HTMLHeadingElement;
    /**
     * Used for showing instructions
     */
    descEl: HTMLParagraphElement;
    /**
     * container element for the component
     *
     * contains the stimulus elements
     */
    stimulusEl: HTMLElement;
    /**
     * container element for the init screen during the init phase
     */
    screenInitEl: HTMLDivElement;
    initAllStimuliEl: HTMLElement;
    initAddStimulusBtnEl: HTMLButtonElement;
    initTranslateLinkEl: HTMLAnchorElement;

    initPlayableEl: HTMLButtonElement;
    initGameTypeEl: HTMLElement;
    // initGameVariantEl: HTMLElement;
    screenReadyEl: HTMLDivElement;
    readyCountdownEl: HTMLElement;
    /**
     * container element for the playing screen during the playing phase
     */
    screenPlayingEl: HTMLDivElement;
    /**
     * container element for the aborted screen during the aborted phase
     */
    screenAbortedEl: HTMLDivElement;
    /**
     * container element for the complete screen during the complete phase
     */
    screenCompleteEl: HTMLDivElement;
    summaryStatsEl: HTMLElement;
    /**
     * contains the input(?)
     */
    footerEl: HTMLElement;
    /**
     * where the user types in their response to the stimulus.
     */
    inputEl: HTMLTextAreaElement;
    inputSendBtnEl: HTMLButtonElement;
}

export class TypingComponentInstance
    extends IbGibDynamicComponentInstanceBase<MinigameIbGib_V1, TypingElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, TypingElements>,
    MinigameFiniteStateMachine {
    protected override lc: string = `[${TypingComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    get gamePhase(): MinigameGamePhase | undefined {
        const lc = `${this.lc}[get phase]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: bbd656f383c8fc7f9f40ac280eba0525)`); }

            if (!this.ibGib) {
                console.error(`${lc} (UNEXPECTED) this.ibGib falsy? i don't know if tihs is an error at this point... (E: bc2c1748509340f3e7568dc891494825)`);
                return undefined; /* <<<< returns early */
            }
            if (!this.ibGib.data) {
                console.error(`${lc} (UNEXPECTED) this.ibGib.data falsy? i don't know if tihs is an error at this point... (E: 02f2e820b028f590ecf1ec2889461225)`);
                return undefined; /* <<<< returns early */
            }
            return this.ibGib.data.gamePhase;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    get gameState(): Minigame_TypingGameState {
        if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: ef7aaf06088538c038d4e2fef0162325)`); }
        if (!this.ibGib?.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: db47983c1ed199a8d974ca085ee79825)`); }
        return this.ibGib.data.gameState as Minigame_TypingGameState;
    }
    get gameMeta(): Minigame_TypingGameMeta {
        if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 6d612b984548a3f998ab2836b4c01825)`); }
        if (!this.ibGib?.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 8833187787e8d5f7461e203844e42825)`); }
        return this.ibGib.data.gameMeta as Minigame_TypingGameMeta;
    }
    get minigameIbGib(): MinigameIbGib_V1 {
        if (!this.ibGib) {
            debugger; // error this.ibGib in minigame typing component
            throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 14cf3803cb595c01853f0558d23ec825)`);
        }
        return this.ibGib as MinigameIbGib_V1;
    }

    private readyCountdown: number = 0;

    constructor() {
        super();
    }

    // #region MinigameFiniteStateMachine
    public async play(): Promise<void> {
        const lc = `${this.lc}[${this.play.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b27a28ecb6923fcc584cac88c1e2da25)`); }

            const { gamePhase } = this.ibGib!.data!;
            const { } = this.gameState;

            switch (gamePhase) {
                case MinigameGamePhase.init:
                    await this.activatePhase_ready();
                    break;
                case MinigameGamePhase.ready:
                    await this.activatePhase_playing();
                    break;
                case MinigameGamePhase.playing:
                    await this.activatePhase_complete();
                    break;
                case MinigameGamePhase.paused:
                    await this.activatePhase_playing();
                    break;
                case MinigameGamePhase.aborted:
                    await this.activatePhase_init();
                    break;
                case MinigameGamePhase.complete:
                    await this.activatePhase_init();
                    break;
                default:
                    throw new Error(`(UNEXPECTED) unknown gamePhase (${gamePhase})? (E: de6a888ceb9e8e2098777ee8e689e125)`);
            }

            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    public async pause(): Promise<void> {
        const lc = `${this.lc}[${this.pause.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4baa7ab2e988c7dd28bb40226114d825)`); }
            await this.activatePhase_paused();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    public async restart(): Promise<void> {
        const lc = `${this.lc}[${this.restart.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a9399d610de88bfa8853343832f16825)`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 01a53b06f093d78ede496b47ce174125)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 8a3d883786fd1e7a584dd9a821a93825)`); }

            if (this.ibGib.data.playable) {
                // save current game state
                // if (this.phase === MinigameGamePhase.ready) {
                await this.initGameState();
                await this.activatePhase_init();
                await this.renderUI();
            } else {
                // player/agent has added stimuli or something else that has
                // reset the playable. it needs to be validated.
                await this.initGameState();
                await this.activatePhase_init();
                await this.renderUI();
            }

            // }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    public async abort(): Promise<void> {
        const lc = `${this.lc}[${this.abort.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 565fe6ac19981bb1f89161f86fe49825)`); }
            await this.activatePhase_aborted();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    public async complete(): Promise<void> {
        const lc = `${this.lc}[${this.complete.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: fca4183de61b5df9b886569d8b0e7925)`); }
            await this.activatePhase_complete();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    // #endregion MinigameFiniteStateMachine

    /**
     * should this just be left up to the gameFSM, since that already is
     * responsible for saving the concrete game state?
     */
    private async setGamePhase({ gamePhase }: { gamePhase: MinigameGamePhase }): Promise<void> {
        const lc = `${this.lc}[${this.setGamePhase.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f120ab31ae2e3fecb835d728df83b425)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 0c8fb8108578fa7908cf617bb8f25c25)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 676728b52d38bde0eccb8369d35d1825)`); }
            console.log(`${lc} BEFORE this.gamePhase: ${this.gamePhase} (I: ec8a689398a8936c6a99e202cdc0a825)`)
            if (this.ibGib.data.gamePhase !== gamePhase) {
                const newIbGib = await mut8Timeline({
                    timeline: this.ibGib, // minigame
                    metaspace: this.metaspace!,
                    mut8Opts: { dataToAddOrPatch: { gamePhase, } },
                });
                await delay(500); // hack to let proxy update...gotta find a better solution here. maybe need to add a function to the proxy to await an update.
                console.log(`${lc} AFTER this.gamePhase: ${this.gamePhase} (I: 534baae3a5f3c408a84191ef4a273e25)`)
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region activatePhase
    private async activatePhase_init(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_init.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 1a25e4dbb71610a31847a6483c1a1825)`); }
            await this.setGamePhase({ gamePhase: MinigameGamePhase.init });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async activatePhase_ready(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_ready.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 512f4ebc94184571037ae81f8235b825)`); }
            await this.setGamePhase({ gamePhase: MinigameGamePhase.ready });
            this.readyCountdown = 3;
            this.elements!.readyCountdownEl.innerHTML = '';
            setTimeout(async () => {
                while (this.readyCountdown <= 3 && this.readyCountdown > 0) {
                    this.renderUI_readyCountdown();
                    await delay(1000);
                    this.readyCountdown--;
                }
                this.elements!.readyCountdownEl.innerHTML = '';
                await this.play();
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async activatePhase_playing(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_playing.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cae208d0b038d9a12827744b62865825)`); }
            // start timer?
            // populate stimulus queue
            // enable the submit button
            if (this.gamePhase === MinigameGamePhase.paused) {
                await this.setGamePhase({ gamePhase: MinigameGamePhase.playing });
            } else {
                await this.initGameState();
                await this.flushGameStateToTimeline();
                await this.setGamePhase({ gamePhase: MinigameGamePhase.playing });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     *
     */
    private async initGameState(): Promise<void> {
        const lc = `${this.lc}[${this.initGameState.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cede184c1ef8b0156809312e32c6a825)`); }
            if (!this.gameMeta.allStimuli) { throw new Error(`(UNEXPECTED) this.gameMeta.allStimuli falsy? we are expecting at this point to be a valid game and thus this should be truthy, even if empty. (E: db1805280be88720e716676812485125)`); }
            this.gameState.remainingStimuli = this.gameMeta.allStimuli.concat();
            const firstStimulus = this.gameState.remainingStimuli.shift();
            firstStimulus!.timestampInTicks = getTimestampInTicks();
            this.gameState.currentStimulus = firstStimulus;
            this.gameState.interactions = [];
            this.gameState.flushCounter = 0;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async activatePhase_paused(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_paused.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2844b8dfd80cd75c1896e6588dc69b25)`); }
            await this.setGamePhase({ gamePhase: MinigameGamePhase.paused });
            // stop timer? does this happen in parent minigame component?
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async activatePhase_aborted(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_aborted.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a490ca8692d6ea6e6fbbd608e36fc825)`); }
            await this.setGamePhase({ gamePhase: MinigameGamePhase.aborted });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async calculateSummaryStats(): Promise<MinigameTypingRawStats | undefined> {
        const lc = `${this.lc}[${this.calculateSummaryStats.name}]`;
        try {

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: c670b4aca76bc2a348072858f0428825)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 7200288f70c82bf4e8c22f78964ea825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 5516b84e6a8890bbb280121941d3b825)`); }

            const { } = this.ibGib.data;
            const { interactions } = this.gameState;
            // calculate stats
            if (interactions.length === 0) {
                console.log(`${lc} we didn't do nothin'. interactions.length === 0. returning early (I: 4937e8f57438854d1ab5f2289be8e825)`);
                return; /* <<<< returns early */
            }

            /**
             * turn this into a constant? rather arbitrary, but the feel is that
             * it should be relatively short, but long enough for decent power
             */
            const topN = 16;

            const responses = interactions.map(x => x.response);
            const responses_string = responses.map(x => x.value).join('\n\n');
            const responses_docId = await getUUID();
            const stimuli = interactions.map(x => x.stimulus);
            const stimuli_string = stimuli.map(x => x.value).join('\n\n');
            const stimuli_docId = await getUUID();

            const engine = new AnalysisEngine([
                DEFAULT_TOKEN_CONSTRUCT_RULE,
                // ...DEFAULT_SPANISH_RULES,
            ]);
            // const analyzer = new CorpusAnalyzer(AnalysisEngine.DEFAULT);
            const analyzer = new CorpusAnalyzer(engine);
            analyzer.addDocumentFromText({
                id: responses_docId,
                text: responses_string,
            });
            analyzer.addDocumentFromText({
                id: stimuli_docId,
                text: stimuli_string,
            });
            const responses_analysis = analyzer.getDocumentAnalysis({ id: responses_docId });
            if (!responses_analysis) { throw new Error(`(UNEXPECTED) responses_analysis falsy? (E: 02a658aa66a93b9118a83f38ec3c4f25)`); }
            const responses_report = analyzer.generateDocumentReport({
                docId: responses_docId,
                topN,
                constructsToReport: [AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME]
                // constructsToReport: [...DEFAULT_SPANISH_RULES.map(x => x.name)],
            });
            const stimuli_analysis = analyzer.getDocumentAnalysis({ id: stimuli_docId });
            if (!stimuli_analysis) { throw new Error(`(UNEXPECTED) stimuli_analysis falsy? (E: c6809e78f3a8796f6e58ae68814de425)`); }
            const stimuli_report = analyzer.generateDocumentReport({
                docId: stimuli_docId,
                topN,
                constructsToReport: [AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME]
                // constructsToReport: [...DEFAULT_SPANISH_RULES.map(x => x.name)],
            });
            const comparison = analyzer.generateComparisonReport({
                sourceDocId: stimuli_docId,
                targetDocId: responses_docId,
                constructName: AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME, // 'token',
                // constructName: DEFAULT_SPANISH_RULES.at(0)!.name, // 'token',
                topN: 16,
            });

            // associate stats to minigame?
            // const testCorpus = new TfIdfCorpus();

            const {
                elapsedMs_toLastInteractionResponse,
                elapsedMs_toLastInteractionStimulus,
                elapsedMs_toNow,
                errors: elapsedErrors,
            } = getElapsedInfo({
                a: interactions.at(0)!,
                b: interactions.at(-1)!,
            });
            if (elapsedErrors) {
                console.warn(`${lc} there were errors when trying to getElapsedInfo: ${elapsedErrors} (W: ccc058ca6e24bd6368db8345ca879a25)`);
            }
            const elapsedMs =
                elapsedMs_toLastInteractionResponse ??
                elapsedMs_toLastInteractionStimulus ??
                -1;
            const wpm = getWpm({ responsesAnalysis: responses_analysis, elapsedMs });

            let numberCorrect = 0;
            const fnGetAgentsOpinion = async () => {
                // no "correct" available, ask the agent one-off if available
                if (!this.agent) {
                    // no agent
                    return -1;
                }
                // update the source & target languages, if not already selected
                const agentsOpinion = await this.agent.promptOneOff({
                    text: [
                        `Hi. We're trying to guage if a user's response to a stimulus was "correct". Please give your opinion on the level of correctness expressed as a decimal from 0 to 1. If the response was exactly correct, then give 1. If "correct" does not apply, return -1.`,
                    ].join('\n'),
                    systemInstructions: [
                        'You are an expert judge who will be given ais being asked to rate a response in a minigame. Usually these are for learning purposes and there is some meaning for "correct".',
                        `In your response, please don't use a full sentence, just say the answer because we'll be parsing it as a number. So if you believe the user's response was correct, like if it's a translation and they had a semantically correct translation, then just say '1'. If it's a typing question and they got a single type among 50 characters, then say '0.98'. If "correct" does not apply, return '-1'`,
                        `Thank you in advance! ;-)`,
                    ].join('\n'),
                });
                debugger;
                console.log(agentsOpinion);
                console.dir(agentsOpinion);

                if (agentsOpinion === undefined) { return -1; /* <<<< returns early */ }

                const asNumber = agentsOpinion.includes('.') ?
                    Number.parseFloat(agentsOpinion) :
                    Number.parseInt(agentsOpinion);
                return Number.isNaN(asNumber) ? -1 : asNumber;
            }
            for (const interaction of interactions) {
                if (interaction.stimulus.expectedResponse) {

                } else {
                    let correctness = await fnGetAgentsOpinion();
                    if (correctness > 0.7) {
                        numberCorrect++;
                    }
                }
            }

            const stats: MinigameTypingRawStats = {
                elapsedMs,
                elapsedTimespan: toHoursMinutesSeconds({ elapsedMs }),
                wpm,
                interactionCount: interactions.length,
                responses: {
                    analysis: responses_analysis,
                    report: responses_report,
                },
                stimuli: {
                    analysis: stimuli_analysis,
                    report: stimuli_report,
                },
                comparison,
            }; if (logalot) { console.log(`${lc} starting... (I: 39ebe887b356e81f23c65578269eaa25)`); }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async activatePhase_complete(): Promise<void> {
        const lc = `${this.lc}[${this.activatePhase_complete.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 6ca9ca11248ab608385da66c94f4e825)`); }
            await this.setGamePhase({ gamePhase: MinigameGamePhase.complete });

            const stats = await this.calculateSummaryStats();
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 0432d9d41c37ff4feaca233647038825)`); }

            if (!stats) {
                console.log(`${lc} stats was undefined. probably no interactions. (I: 9cbd2f0ad678978ab8e5b0180563c425)`);
                return; /* <<<< returns early */
            }

            const { screenCompleteEl, summaryStatsEl, } = this.elements;
            summaryStatsEl.innerHTML = '';
            // temporary pre. also `toHoursMinutesSeconds` helper created, but i
            // don't have it plugged in here yet
            const pre = document.createElement('pre');
            pre.textContent = pretty(stats);
            summaryStatsEl.appendChild(pre);

            this.gameMeta.statsHistory ??= [];
            this.gameMeta.statsHistory.push(stats);
            await this.flushGameMetaToTimeline();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    // #endregion activatePhase

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 41cb3607e798ace12380bb214f4a8e25)`); }
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

    protected override async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 244412de61988993e8ba91d8dd5c8825)`); }

            await this.loadAgentsCoupledToIbGib();

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: aa1f3b3748fad9aeea2bbba849cd5825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: aaf448463b08d2de68687248cf0bb425)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            // at this point, this.ibGib should be loaded with the latest ibgib
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: 2345d6121ced938c84035c6307559c25)`); }

            await this.initElements();
            await this.agentsInitialized;
            await this.renderUI();
            if (this.gamePhase === MinigameGamePhase.ready) {
                await this.restart();
            }
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
            if (logalot) { console.log(`${lc} starting... (I: dd2eaf80dc2f98dd187d4db8dda2c825)`); }
            // no action atow
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
            if (logalot) { console.log(`${lc} starting... (I: 60d7d8943d9806060865eb2ea29d0825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: e28e42cc888c77f578a83f9fee54ac25)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: e467eaa0af6876af981fd218944bd425)`); }

            // #region header

            const headerEl = shadowRoot.getElementById('typing-header') as HTMLElement;
            if (!headerEl) { throw new Error(`(UNEXPECTED) headerEl not found in shadowRoot? (E: 4cf9689204e88844d85fd3f1b6b9bc25)`); }

            const nameEl = shadowRoot.getElementById('typing-name') as HTMLHeadingElement;
            if (!nameEl) { throw new Error(`(UNEXPECTED) nameEl not found in shadowRoot? (E: b2794c9acf384c5391ae1728178af825)`); }
            const descEl = shadowRoot.getElementById('typing-description') as HTMLParagraphElement;
            if (!descEl) { throw new Error(`(UNEXPECTED) descEl not found in shadowRoot? (E: f16a181bb128359639f531a8529b4825)`); }

            const commandBarEl = shadowRoot.getElementById('typing-command-bar') as HTMLElement;
            if (!commandBarEl) { throw new Error(`(UNEXPECTED) commandBarEl not found in shadowRoot? (E: e680c88b6118d4950cad0078742a6825)`); }

            // #endregion header

            const contentEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'typing-content');

            const screenInitEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'typing-screen-init');
            screenInitEl.style.display = "flex";
            const initAllStimuliEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'init-all-stimuli');
            const initAddStimulusBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'add-stimulus-btn');
            initAddStimulusBtnEl.addEventListener('click', async () => {
                await this.handleAddStimulusBtnClick();
            })
            const initTranslateLinkEl = shadowRoot_getElementById<HTMLAnchorElement>(shadowRoot, "init-translate-link");
            const initPlayableEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'init-playable');
            initPlayableEl.addEventListener('click', async () => {
                await this.validateAndReadyMinigame();
            });
            const initGameTypeEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'init-game-type');
            // const initGameVariantEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'init-game-variant');

            const screenReadyEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'typing-screen-ready');
            screenReadyEl.style.display = "none";
            const readyCountdownEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'ready-countdown');

            const screenPlayingEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'typing-screen-playing');
            screenPlayingEl.style.display = "none";

            const screenAbortedEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'typing-screen-aborted');
            screenAbortedEl.style.display = "none";

            const screenCompleteEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'typing-screen-complete');
            screenCompleteEl.style.display = "none";

            const summaryStatsEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'summary-stats');

            const stimulusEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'typing-stimulus');

            const footerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'typing-footer');

            const inputEl = shadowRoot_getElementById<HTMLTextAreaElement>(shadowRoot, 'typing-input');
            inputEl.placeholder = 'loading...';

            const inputSendBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-input-send-btn');
            inputSendBtnEl.addEventListener('click', async () => {
                await this.handleSubmit();
            });
            inputEl.addEventListener('keydown', async (event) => {
                if (!this.gameState.currentStimulus) { return; /* <<<< returns early */ }

                switch (event.key) {
                    case 'Enter':
                        if (this.gameState.currentStimulus.value.includes('\n')) {
                            if (event.ctrlKey) {
                                event.preventDefault(); // Prevent default behavior (new line)
                                await this.handleSubmit();
                            }
                        } else if (!event.shiftKey) {
                            event.preventDefault(); // Prevent default behavior (new line)
                            await this.handleSubmit();
                        }
                        break;
                    default:
                        console.log(`${lc} event.key: ${event.key} (I: 5267a7eec5880ce5e8999e18dfdc3825)`);
                        break;
                }
            });

            this.elements = {
                headerEl,
                nameEl,
                descEl,
                commandBarEl,
                // headerTabsEl,
                contentEl,
                screenInitEl, initAllStimuliEl, initTranslateLinkEl, initAddStimulusBtnEl, initPlayableEl, initGameTypeEl,
                // initGameVariantEl,
                screenReadyEl, readyCountdownEl,
                screenPlayingEl, stimulusEl,
                screenAbortedEl,
                screenCompleteEl, summaryStatsEl,
                footerEl, inputEl, inputSendBtnEl,
            };

            await this.initElements_dialog();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async handleAddStimulusBtnClick(): Promise<void> {
        const lc = `${this.lc}[${this.handleAddStimulusBtnClick.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7ecea8e5063845f30bf6ded6d9a8d825)`); }

            const newStimulusText = await this.showFullscreenDialog();
            // if (!newStimulusText) {
            //     console.log(`${lc} user cancelled (I: f1c6b2ecb9281eee93e8d458bebfa825)`);
            //     return; /* <<<< returns early */
            // }

            // const newStimulusText = await promptForText({
            //     title: 'New Text',
            //     msg: [
            //         `Enter the new text.`,
            //     ].join('\n'),
            // });

            if (newStimulusText) {
                const newStimuli: Minigame_TypingStimulus[] = [];
                const newLines = newStimulusText.split('\n').filter(x => !!x);
                for (const line of newLines) {
                    const newStimulus: Minigame_TypingStimulus = {
                        id: await getNewTypingEntryId(),
                        entryType: 'text',
                        value: line,
                    };
                    newStimuli.push(newStimulus);
                }
                await minigameBuilderEditStimuliFunctionInfo.fnViaCmd({
                    cmd: minigameBuilderEditStimuliFunctionInfo.cmd,
                    cmdModifiers: minigameBuilderEditStimuliFunctionInfo.cmdModifiers.concat(),
                    minigameAddr: this.tjpAddr!,
                    stimulusEditInfos: newStimuli.map(x => {
                        return {
                            action: 'add',
                            newStimulus: x,
                        };
                    }),
                });
            } else {
                // empty === cancelled?
                // await alertUser({ title: 'Add Cancelled', msg: 'Add was cancelled' });
                return; /* <<<< returns early */
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async validateAndReadyMinigame(): Promise<void> {
        const lc = `${this.lc}[${this.validateAndReadyMinigame.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 41ec4768c9a2227c62e9e218e0174825)`); }
            if (!this.tjpAddr) { throw new Error(`(UNEXPECTED) tihs.tjpAddr falsy? (E: 82126e68dbca9c0f09ce74b96ac6a825)`); }

            const resReady = await minigameBuilderValidateAndReadyFunctionInfo.fnViaCmd({
                cmd: minigameBuilderValidateAndReadyFunctionInfo.cmd,
                cmdModifiers: minigameBuilderValidateAndReadyFunctionInfo.cmdModifiers.concat(),
                minigameAddr: this.tjpAddr,
            }) as MinigameBuilderValidateAndReadyResult;

            if (resReady.ready) {
                // update minigame ibgib, ui, re-render
                await delay(100); // does minigame ibgib get changed when ready? I think it does.
            } else if (resReady.errors) {
                await alertUser({
                    title: 'Minigame ain\'t ready',
                    msg: `The minigame is not ready yet. Here are the "errors":\n${resReady.errors}`
                });
                return; /* <<<< returns early */
            } else {
                await alertUser({
                    title: 'Minigame ain\'t ready',
                    msg: `The minigame is not ready yet, but there weren't any errors? This shouldn't happen and I'd appreciate it if you would let me know. (E: 6f664ad63f57e680621443581445c825).`
                });
                throw new Error(`(UNEXPECTED) resReady.ready is falsy, but resReady.errors is falsy? (E: 6f664ad63f57e680621443581445c825)`);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async flushGameStateToTimeline(): Promise<void> {
        const lc = `${this.lc}[${this.flushGameStateToTimeline.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f9494913d868dff83867302841524325)`); }

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 1624489054a87fce48a4d2eefc742325)`); }

            this.gameState.flushCounter++;
            await mut8Timeline({
                timeline: this.ibGib, // minigame
                metaspace: this.metaspace,
                mut8Opts: {
                    dataToAddOrPatch: { gameState: this.gameState }
                },
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async flushGameMetaToTimeline(): Promise<void> {
        const lc = `${this.lc}[${this.flushGameMetaToTimeline.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e215cc1cfab8e0d6b71493487b01cc25)`); }

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 2596c8b0676ee038eff6f9285e76b825)`); }

            // this.gameState.flushCounter++;
            await mut8Timeline({
                timeline: this.ibGib, // minigame
                metaspace: this.metaspace,
                mut8Opts: {
                    dataToAddOrPatch: { gameMeta: this.gameMeta }
                },
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleSubmit(): Promise<void> {
        const lc = `${this.lc}[${this.handleSubmit.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cd9ecc08f967c93bd88a689b2cb12e25)`); }

            // #region init & validation

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 046d7b8e9c4bcea148ca8d379b6d8825)`); }
            const { inputEl, } = this.elements;
            // const inputText = inputEl.textContent?.trim() ?? '';
            // const inputText = inputEl.value?.trim() ?? '';
            const inputText = inputEl.value ?? '';
            if (!inputText) {
                console.warn(`${lc} no text to submit. returning early. (W: dc710bf62f9422235a7bd70f39738825)`);
                return; /* <<<< returns early */
            }
            inputEl.value = '';

            // add the interaction
            this.gameState.interactions.push({
                stimulus: this.gameState.currentStimulus!,
                response: {
                    id: await getNewTypingEntryId(),
                    entryType: 'text',
                    value: inputText,
                    timestampInTicks: getTimestampInTicks(),
                }
            });

            const nextStimulus = this.gameState.remainingStimuli.shift();
            if (nextStimulus) {
                nextStimulus!.timestampInTicks = getTimestampInTicks();
                this.gameState.currentStimulus = nextStimulus;
                await this.flushGameStateToTimeline();
            } else {
                await this.flushGameStateToTimeline();
                await this.complete();
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region render

    /**
     * rerender
     */
    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5bd83ba3c5018c7ea4e8352886743825)`); }

            await super.renderUI();

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: ed6818255128fa1914407426476d9825)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl, contentEl, footerEl,
                nameEl, descEl,
                commandBarEl,
                inputEl, inputSendBtnEl,
                screenInitEl, initAllStimuliEl, initAddStimulusBtnEl, initPlayableEl, initGameTypeEl, initTranslateLinkEl,
                // initGameVariantEl,
                screenReadyEl,
                screenPlayingEl,
                stimulusEl,
                screenAbortedEl,
                screenCompleteEl,
            } = this.elements;

            const { ibGib } = this;
            if (!ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 46f70849b5c13810786e6244e64e3825)`); }
            const { data } = ibGib;
            if (!data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: c354c842903829168fa95a5fc5142d25)`); }
            const typingMeta = (data.gameMeta ?? DEFAULT_TYPING_GAMEMETA) as Minigame_TypingGameMeta;
            const typingGameState = (data.gameState ?? DEFAULT_TYPING_GAMESTATE) as Minigame_TypingGameState;

            // for now, not showing the header (don't know what goes there tbh)
            headerEl.style.display = 'none';
            nameEl.style.display = 'none';
            descEl.style.display = 'none';

            if (!!data.playable && data.gamePhase === MinigameGamePhase.playing) {
                inputEl.readOnly = false;
                inputSendBtnEl.disabled = true;
            } else {
                inputEl.readOnly = true;
                inputSendBtnEl.disabled = false;
            }

            // show the current phase's screen
            switch (data.gamePhase) {
                case MinigameGamePhase.init:
                    this.hideScreensExcept({ gamePhase: MinigameGamePhase.init });
                    // show ready screen? depends on if we have available stimuli?
                    initPlayableEl.textContent = data.playable ? 'true' : 'false';
                    initGameTypeEl.textContent = data.gameType;
                    const allStimuli = typingMeta.allStimuli ?? [];
                    // if the stimulus is fitb, we don't want the blank, rather,
                    // we want the full text
                    const allStimuliText = unique(
                        allStimuli.map(x =>
                            x.expectedResponseType === 'fill-in-the-blank' || x.variant === 'fitb' ?
                                (x.focus ?? x.value) :
                                x.value
                        ).filter(x => !!x)
                    ).join('\n');
                    initTranslateLinkEl.href = getGoogleTranslateLink({ text: allStimuliText });

                    initAllStimuliEl.innerHTML = '';
                    if (allStimuli.length > 0) {
                        for (const stimulusEntry of allStimuli!) {
                            if (logalot) { console.log(`${lc} stimulusEntry: ${pretty(stimulusEntry)} (I: 43c238ea824472ab0857eb92b0440825)`); }
                            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: cae6982ca08696f7880bbf88e8aea325)`); }
                            const { entryEl, deleteBtnEl, editBtnEl } = await getStimulusEntryEl({
                                shadowRoot: this.shadowRoot,
                                stimulusEntry,
                            });
                            deleteBtnEl.addEventListener('click', async () => {
                                // delete
                                await this.handleDeleteStimulus({ stimulusEntry });
                            });
                            editBtnEl.addEventListener('click', async () => {
                                // edit
                                await this.handleEditStimulus({ stimulusEntry });
                            });

                            // complete entry
                            initAllStimuliEl.appendChild(entryEl);
                        }
                    } else {
                        const noEntriesEl = document.createElement('li');
                        noEntriesEl.textContent = '[no stimuli added yet]';
                        initAllStimuliEl.appendChild(noEntriesEl);
                    }
                    footerEl.style.display = 'none';
                    break;
                case MinigameGamePhase.ready:
                    this.hideScreensExcept({ gamePhase: MinigameGamePhase.ready });
                    footerEl.style.display = 'none';

                    // inputEl.readOnly = true;
                    // inputSendBtnEl.disabled = true;
                    // inputEl.placeholder = 'pretending...'; // joke on screen saying "let's pretend that didn't happen"
                    break;
                case MinigameGamePhase.playing:
                    await this.renderUI_playing({
                        typingGameState,
                        stimulusEl,
                        footerEl,
                        inputEl,
                        inputSendBtnEl,
                    });
                    break;
                case MinigameGamePhase.paused:
                    this.hideScreensExcept({ gamePhase: MinigameGamePhase.paused });
                    inputEl.readOnly = true;
                    inputSendBtnEl.disabled = true;
                    inputEl.placeholder = 'paused...';
                    // don't do anything? minigame parent component will show
                    // paused screen.
                    break;
                case MinigameGamePhase.aborted:
                    this.hideScreensExcept({ gamePhase: MinigameGamePhase.aborted });
                    // anything else?
                    footerEl.style.display = 'none';
                    // inputEl.readOnly = true;
                    // inputSendBtnEl.disabled = true;
                    // inputEl.placeholder = 'pretending...'; // joke on screen saying "let's pretend that didn't happen"
                    break;
                case MinigameGamePhase.complete:
                    this.hideScreensExcept({ gamePhase: MinigameGamePhase.complete });
                    footerEl.style.display = 'none';

                    break;
                default:
                    throw new Error(`(UNEXPECTED) unknown gamePhase (${data.gamePhase})? (E: 94c4d8269838dc48285589682d571825)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async renderUI_playing({
        typingGameState,
        stimulusEl,
        footerEl,
        inputEl,
        inputSendBtnEl,
    }: {
        typingGameState: Minigame_TypingGameState,
        stimulusEl: HTMLElement,
        footerEl: HTMLElement,
        inputEl: HTMLTextAreaElement,
        inputSendBtnEl: HTMLButtonElement,
    }): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_playing.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 524a688d7724dee7ca3956083ec1de25)`); }

            this.hideScreensExcept({ gamePhase: MinigameGamePhase.playing });
            if (!typingGameState.currentStimulus) { throw new Error(`(UNEXPECTED) typingGameState.currentStimulus falsy? (E: 75fdbb36f018c2c3f707f028e7762425)`); }
            const { currentStimulus } = typingGameState;
            let variant: MinigameGameVariant_Typing | '' = currentStimulus.variant ?? '';
            if (!variant) {
                console.log(`${lc} currentStimulus.variant falsy? using default parrot (I: f2c4dbfdeb58928468377bb6d6478725)`);
                variant = MinigameGameVariant_Typing.parrot;
            }

            // fill out the stimulus element
            stimulusEl.innerHTML = '';
            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy even though we're within ${this.renderUI_playing.name}? (E: 34f678110cb8e5e9728c4f3eddf51625)`); }
            const shadowRoot = this.shadowRoot;

            const templateId = `playing-stimulus-template-${variant}`;
            const templateEl = shadowRoot_getElementById<HTMLTemplateElement>(shadowRoot, templateId);
            const templateContentNode = templateEl.content.cloneNode(true) as DocumentFragment;
            const templateRootDiv = templateContentNode.firstElementChild;
            if (!templateRootDiv) { throw new Error(`(UNEXPECTED) !templateDiv? (E: f30fe806a3d165660807bd278b653825)`); }
            // const testEl = templateRootDiv.querySelector(`.playing-stimulus-test-${variant}`) as HTMLElement;
            // if (!testEl) { throw new Error(`(UNEXPECTED) testEl falsy? (E: f6e2c8c7114b98aea80ebbb84d90e825)`); }
            // testEl.textContent = `${variant} yo this was inserted or something`;
            const stimulusTextDiv = templateRootDiv.querySelector(`.playing-stimulus-text`) as HTMLDivElement;
            currentStimulus.value.split('\n').forEach(line => {
                const lineEl = document.createElement('p');
                lineEl.textContent = line;
                stimulusTextDiv.appendChild(lineEl);
            });
            stimulusEl.appendChild(templateRootDiv); // debug testing only

            // currentStimulus.value.split('\n').forEach(line => {
            //     const lineEl = document.createElement('p');
            //     lineEl.textContent = line;
            //     stimulusEl.appendChild(lineEl);
            // });
            // stimulusEl.textContent = typingGameState.currentStimulus.value;

            // do the footer?
            footerEl.style.removeProperty('display'); // don't remember what this is, why is footer display:none?

            // prepare input for user to type in and focus it
            inputEl.readOnly = false;
            const stimTextEl = templateRootDiv.querySelector('.playing-stimulus-text') as HTMLDivElement;
            const diffEl = templateRootDiv.querySelector('.playing-stimulus-diff') as HTMLDivElement;
            let lastLength = 0;
            let pTagEls: HTMLParagraphElement[] = [];
            let pCurrent: HTMLParagraphElement = document.createElement('p') as HTMLParagraphElement;
            const fnRevealDiff = debounce(() => {

                let expectedResponse = currentStimulus.expectedResponse;
                if (variant === 'parrot' && currentStimulus.expectedResponseType === 'exact' && !expectedResponse) {
                    expectedResponse = currentStimulus.value;
                }
                if (!expectedResponse) {
                    // don't do anything
                    return; /* <<<< returns early */
                }
                const inputSoFarLength = inputEl.value.length;
                if (inputSoFarLength === 0) {
                    return; /* <<<< returns early */
                }

                if (inputEl.value && expectedResponse && inputEl.value.toLocaleLowerCase() === expectedResponse.toLocaleLowerCase()) {
                    // the same
                    inputEl.readOnly = true;
                    const durationMs = 1000;
                    highlightElement({ el: this, magicHighlightTimingMs: durationMs }); // spin off
                    slideRightAndFade({ el: this, durationMs });
                    setTimeout(async () => {
                        diffEl.innerHTML = '';
                        unfadeEl({ el: this });
                        inputEl.readOnly = false;
                        await this.handleSubmit();
                    }, durationMs);
                }
                const inputAsChars = inputEl.value.substring(0, inputSoFarLength).split('');
                const expectedResponseAsChars = expectedResponse.substring(0, inputSoFarLength).split('');

                if (inputSoFarLength === (lastLength + 1)) {
                    // just added a letter or new paragraph, so don't clear
                    const expectedChar = expectedResponseAsChars.at(-1)!;
                    if (expectedChar === '\n') {
                        // add a new paragraph to diff
                        pCurrent = document.createElement('p') as HTMLParagraphElement;
                        pTagEls.push(pCurrent);
                        diffEl.appendChild(pCurrent);
                    } else {
                        // add a new letter to diff
                        const inputChar = inputAsChars.at(-1)!;
                        // add to existing paragraph
                        pCurrent = pTagEls.at(-1)!;
                        if (!pCurrent) {
                            pCurrent = document.createElement('p') as HTMLParagraphElement;
                            pTagEls.push(pCurrent);
                            diffEl.appendChild(pCurrent);
                        }
                        const charSpan = document.createElement('span') as HTMLSpanElement;
                        charSpan.textContent = expectedChar;

                        if (expectedChar.match(/[\p{L}\d]/iu)) {
                            // it's an alphanumeric
                            if (inputChar.toLocaleLowerCase() === expectedChar.toLocaleLowerCase()) {
                                charSpan.style.color = 'green';
                            } else {
                                charSpan.style.color = 'red';
                            }
                        } else {
                            // it's punctuation or whatever, don't care
                            charSpan.style.color = 'gray';
                        }
                        pCurrent!.appendChild(charSpan);
                        // pCurrent.scrollIntoView({ behavior: 'instant' });
                        charSpan.scrollIntoView({ behavior: 'instant' });
                        // need to scroll text view to match current place

                        stimTextEl.children.item(pTagEls.length - 1)!.scrollIntoView({ behavior: 'smooth' });
                    }
                    lastLength++;
                } else {
                    // did NOT just add a letter/new p, so start everything fresh
                    diffEl.innerHTML = '';
                    pTagEls = [];
                    pCurrent = document.createElement('p') as HTMLParagraphElement;
                    pTagEls.push(pCurrent);
                    diffEl.appendChild(pCurrent);
                    for (let i = 0; i < inputSoFarLength; i++) {
                        const inputChar = inputAsChars.at(i) ?? '';
                        const expectedChar = expectedResponseAsChars.at(i) ?? '';
                        if (expectedChar === '\n') {
                            pCurrent = document.createElement('p') as HTMLParagraphElement;
                            pTagEls.push(pCurrent);
                            diffEl.appendChild(pCurrent);
                        } else {
                            // add to existing paragraph
                            pCurrent = pTagEls.at(-1)!;
                            const charSpan = document.createElement('span') as HTMLSpanElement;
                            charSpan.textContent = expectedChar;

                            if (expectedChar.match(/[\p{L}\d]/iu)) {
                                // it's an alphanumeric
                                if (inputChar.toLocaleLowerCase() === expectedChar.toLocaleLowerCase()) {
                                    charSpan.style.color = 'green';
                                } else {
                                    charSpan.style.color = 'red';
                                }
                            } else {
                                // it's punctuation or whatever, don't care
                                charSpan.style.color = 'gray';
                            }
                            pCurrent!.appendChild(charSpan);
                            // pCurrent.scrollIntoView({ behavior: 'instant' });
                            charSpan.scrollIntoView({ behavior: 'instant' });
                            // need to scroll text view to match current place
                        }
                        stimTextEl.children.item(pTagEls.length - 1)!.scrollIntoView({ behavior: 'smooth' });
                    }
                    lastLength = inputSoFarLength;
                }
            }, shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-stimulus-feedback-debounce-ms').valueAsNumber);
            if ((inputEl as any).handlerDiffFn) {
                inputEl.removeEventListener('input', (inputEl as any).handlerDiffFn);
                delete (inputEl as any).handlerDiffFn;
            }
            inputEl.addEventListener('input', fnRevealDiff);
            (inputEl as any).handlerDiffFn = fnRevealDiff;
            inputSendBtnEl.disabled = false;
            this.renderUI_updateInput();
            this.elements!.inputEl.focus();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private renderUI_updateInput(): void {
        const lc = `${this.lc}[${this.renderUI_updateInput.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 1a209f8132f4741e6ff1ede8ae52a825)`); }
            const { elements, gameState } = this;
            if (!elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 47ce681aed9815e1c40585a9ffec4225)`); }
            const { inputEl, } = elements;
            if (gameState.currentStimulus) {
                if (gameState.currentStimulus.value.includes('\n')) {
                    inputEl.placeholder = 'CTRL+ENTER to send';
                } else {
                    inputEl.placeholder = 'ENTER to send\nSHIFT+ENTER for new line';
                }
            } else {
                inputEl.placeholder = 'loading...';
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private renderUI_readyCountdown() {
        const lc = `${this.lc}[${this.renderUI_readyCountdown.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 054198a33328cb3488f2189b87b20a25)`); }
            this.elements!.readyCountdownEl.textContent = this.readyCountdown.toString();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleEditStimulus({
        stimulusEntry
    }: {
        stimulusEntry: Minigame_TypingStimulus;
    }): Promise<void> {
        const lc = `${this.lc}[${this.handleEditStimulus.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: dee12593b7a5d35e787bf218e450b625)`); }

            const newStimulusText = await promptForText({
                title: 'New Text',
                msg: [
                    `Enter the new text.`,
                    ``,
                    `original text: `,
                    stimulusEntry.value,
                ].join('\n'),
                defaultValue: stimulusEntry.value,
                cancelable: true,
            });

            if (newStimulusText) {
                if (newStimulusText === stimulusEntry.value) {
                    // no change
                    console.log(`${lc} no change to stimulus. ${newStimulusText} (I: b91e888648e8f6d62f5a9268ae393925)`);
                    return; /* <<<< returns early */
                }
                const newStimulus = clone(stimulusEntry);
                newStimulus.value = newStimulusText;
                await minigameBuilderEditStimuliFunctionInfo.fnViaCmd({
                    cmd: minigameBuilderEditStimuliFunctionInfo.cmd,
                    cmdModifiers: minigameBuilderEditStimuliFunctionInfo.cmdModifiers.concat(),
                    minigameAddr: this.tjpAddr!,
                    stimulusEditInfos: [
                        {
                            action: 'edit',
                            stimulusId: stimulusEntry.id,
                            newStimulus,
                        }
                    ],
                });
            } else {
                // empty === cancelled?
                console.log(`${lc} user cancelled edit. (I: fe83a4ed0b35421e8857779179c72825)`)
                return; /* <<<< returns early */
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async handleDeleteStimulus({
        stimulusEntry
    }: {
        stimulusEntry: Minigame_TypingStimulus;
    }): Promise<void> {
        const lc = `${this.lc}[${this.handleDeleteStimulus.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4d97089e0e18307aaff0a838bdec6d25)`); }

            // const confirmDelete = await promptForConfirm({
            //     msg: [
            //         `Delete stimulus?`,
            //         ``,
            //         `Stimulus Text:`,
            //         stimulusEntry.value,
            //     ].join('\n'),
            //     yesLabel: `yes, DELETE it.`,
            //     noLabel: `no, let's KEEP it.`
            // });
            const confirmDelete = true;

            if (confirmDelete) {
                await minigameBuilderEditStimuliFunctionInfo.fnViaCmd({
                    cmd: minigameBuilderEditStimuliFunctionInfo.cmd,
                    cmdModifiers: minigameBuilderEditStimuliFunctionInfo.cmdModifiers.concat(),
                    minigameAddr: this.tjpAddr!,
                    stimulusEditInfos: [
                        {
                            action: 'delete',
                            stimulusId: stimulusEntry.id,
                        }
                    ],
                });
            } else {
                console.log(`${lc} user cancelled delete. (I: c273d8abe43fd99e28b716187fdca825)`)
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private hideScreensExcept({
        gamePhase
    }: {
        gamePhase: MinigameGamePhase;
    }): void {
        if (gamePhase === MinigameGamePhase.paused) {
            // handled by the parent wrapper minigame component
            return; /* <<<< returns early */
        }
        const { screenInitEl, screenReadyEl, screenPlayingEl, screenAbortedEl, screenCompleteEl } = this.elements!;

        const screenMap: { [key: string]: any } = {
            [MinigameGamePhase.init]: screenInitEl,
            [MinigameGamePhase.ready]: screenReadyEl,
            [MinigameGamePhase.playing]: screenPlayingEl,
            [MinigameGamePhase.complete]: screenCompleteEl,
            [MinigameGamePhase.aborted]: screenAbortedEl,
        };
        const exceptEl = screenMap[gamePhase] as HTMLElement;
        exceptEl.style.removeProperty('display');
        delete screenMap[gamePhase];
        Object.values(screenMap).forEach(screen => {
            screen.style.display = 'none';
        });
    }

    // private buildStats(): Promise<MinigameTypingStats> {
    //     const lc = `${this.lc}[${this.buildStats.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: c760c583d96f1349d8e63a88567ad325)`); }
    //         // unique words
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }
    // #endregion render

    private dialogSrcAddr: IbGibAddr | undefined;
    private dialogSrcAddr_latest: IbGibAddr | undefined;
    private dialogSrcIbGib_latest: IbGib_V1 | undefined;
    private _dialogSrcText: string | undefined;
    private get dialogSrcText(): string | undefined {
        return this._dialogSrcText ?? this.dialogSrcIbGib_latest?.data?.text;
    }
    private dialogFocuses: FocusAndElementsInfo[] = [];
    private dialogStimuliToAdd: TypingEntryAndElementsInfo[] = [];

    private get dialogLanguageOptionsApplicable(): boolean {
        if (!this.shadowRoot) { return false; }
        const languageOptionsCheckboxEl = shadowRoot_getElementById<HTMLInputElement>(this.shadowRoot, 'typing-fullscreen-dialog-language-options-checkbox');
        return languageOptionsCheckboxEl.checked;
    }

    async initElements_dialog(): Promise<void> {
        const lc = `${this.lc}[${this.initElements_dialog.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 477e148762a887a168da926f66bb4825)`); }

            const { shadowRoot } = this;
            if (!shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 87d6d777abb1b69635d9699814c0e825)`); }

            // const dialog = shadowRoot_getElementById<HTMLDialogElement>(shadowRoot, 'typing-fullscreen-dialog');
            const dialogErrors = shadowRoot_getElementById<HTMLDialogElement>(shadowRoot, 'typing-fullscreen-dialog-errors');

            const srcTextTextArea = shadowRoot_getElementById<HTMLTextAreaElement>(shadowRoot, 'typing-fullscreen-dialog-src-text');
            const srcTextChanged = async (event: Event) => {
                const newText = srcTextTextArea.value ?? '';
                if (newText !== this._dialogSrcText) {
                    this._dialogSrcText = newText;
                }
            }
            srcTextTextArea.addEventListener('input', debounce(srcTextChanged, 1_000));

            const fnSrcIbGibIsInvalid = (errorMsg: string) => {
                dialogErrors.textContent = errorMsg;
                dialogErrors.style.display = 'flex';
                delete this.dialogSrcAddr;
                delete this.dialogSrcAddr_latest;
                delete this.dialogSrcIbGib_latest;
            }
            const fnSrcIbGibIsValid = () => {
                dialogErrors.style.display = 'none';
                this._dialogSrcText = this.dialogSrcIbGib_latest?.data?.text;
                srcTextTextArea.value = this.dialogSrcText ?? '';
            }

            const fnGetSrc_latest: ((addr: IbGibAddr) => Promise<IbGib_V1 | string>) = async (addr: IbGibAddr) => {
                const lcGetSrc = `${lc}[fnGetSrc]`;
                try {
                    if (logalot) { console.log(`${lcGetSrc} starting... (I: 285632f7b26828f2be3630b5b24dd525)`); }
                    if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: ae2ea5c2bb0ba54e04e32548ccf31b25)`); }
                    const space = await this.metaspace.getLocalUserSpace({ lock: false });
                    if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 185e78c4dbca1cbc5866f728a59c4825)`); }
                    const latestAddr = await this.metaspace.getLatestAddr({ addr, space }) ?? addr;
                    const resGet = await this.metaspace.get({ addr: latestAddr, space, });
                    if (resGet.errorMsg || (resGet.ibGibs?.length !== 1)) { throw new Error(`addr not found. ${resGet.errorMsg ?? ''} (E: 44dfecdf7f68e0f3084d2e9fc1adca25)`); }
                    return resGet.ibGibs!.at(0)!;
                } catch (error) {
                    const emsg = extractErrorMsg(error);
                    console.error(`${lcGetSrc} ${emsg}`);
                    return emsg;
                } finally {
                    if (logalot) { console.log(`${lcGetSrc} complete.`); }
                }
            };
            const srcAddrInput = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-src-addr');
            const fnSrcAddrChanged = async (event: Event) => {
                const srcAddr: IbGibAddr = srcAddrInput.value.trim();
                const srcAddrErrors = validateIbGibAddr({ addr: srcAddr }) ?? [];
                if (srcAddrErrors.length > 0) {
                    fnSrcIbGibIsInvalid(`Invalid srcAddr: ${srcAddrErrors.join('\n')}`);
                    return; /* <<<< returns early */
                }
                const srcIbGibOrEmsg = await fnGetSrc_latest(srcAddr);
                if (typeof srcIbGibOrEmsg === 'string') {
                    // if it's a string, then it's the error msg
                    fnSrcIbGibIsInvalid(`Coudn't get ibgib: ${srcIbGibOrEmsg}`);
                    return; /* <<<< returns early */
                }
                const srcIbGib_latest = srcIbGibOrEmsg as IbGib_V1;
                if (!srcIbGib_latest.data?.text) {
                    fnSrcIbGibIsInvalid(`Src ibgib.data.text is empty or doesn't exist.`);
                    return; /* <<<< returns early */
                }
                // we have a valid src text
                if (this._dialogSrcText) {
                    const confirm = await promptForConfirm({
                        msg: `Overwrite your existing src text with the one from addr:\n\n"${getIbAndGib({ ibGibAddr: srcAddr }).ib}"?`,
                        yesLabel: `YES, don't need the existing text`,
                        noLabel: `NO, wait a sec`
                    });
                    if (!confirm) {
                        console.log(`${lc} user cancelled`);
                        return; /* <<<< returns early */
                    }
                }
                this.dialogSrcAddr = srcAddr;
                this.dialogSrcAddr_latest = getIbGibAddr({ ibGib: srcIbGib_latest });
                this.dialogSrcIbGib_latest = srcIbGib_latest;
                fnSrcIbGibIsValid();
            };
            srcAddrInput.addEventListener('input', debounce(fnSrcAddrChanged, 1_000));
            if (this.dialogSrcAddr) {
                srcAddrInput.value = this.dialogSrcAddr;
            }

            const infoFocusBtn = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-focuses-info-btn');
            infoFocusBtn.addEventListener('click', () => {
                alertUser({
                    title: 'Focuses? What are they?',
                    msg: MINIGAME_FOCUS_INFO,
                });
            });
            const addFocusBtn = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-add-focus-btn');
            // typing-fullscreen-dialog-add-stimuli-btn
            addFocusBtn.addEventListener('click', async () => {
                await this.addFocus({ shadowRoot });
            });

            // language div
            const languageDetailsDiv = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'typing-fullscreen-dialog-language-details');
            const languageOptionsCheckboxEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-language-options-checkbox');
            const srcLanguageEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-text-language-input');
            const targetLanguageEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-target-language-input');

            const fnUpdateSrcAndTargetLanguage = async (languageCode: string) => {
                srcLanguageEl.value = languageCode;
                targetLanguageEl.value = languageCode;
            }
            let checkboxing = false;
            const fnHandleAutoTranslateCheckboxInput = async () => {
                if (checkboxing) { return; /* <<<< returns early */ }
                checkboxing = true;
                try {
                    if (this.dialogLanguageOptionsApplicable) {
                        languageDetailsDiv.style.display = 'flex';
                    } else {
                        languageDetailsDiv.style.display = 'none';
                    }
                    if (this.agent &&
                        this.dialogSrcText &&
                        languageOptionsCheckboxEl.checked &&
                        !srcLanguageEl.value
                    ) {
                        // update the source & target languages, if not already selected
                        const srcLanguage = await this.agent.promptOneOff({
                            text: [
                                `Hi. Please identify the language of the context src text. Choose from among the following codes, or if it is not listed, give your best guess using a similar ISO 639 code. `,
                                DEFAULT_ISO_639_LANGUAGE_CODES.join('\n'),
                            ].join('\n'),
                            systemInstructions: [
                                'You are an expert translator and are helping the user learn a foreign language. The context source text for translating is:',
                                '```',
                                this.dialogSrcText,
                                '```',
                                `In your response, don't use a full sentence, just say the code. So if the language is Italian, just say "it-IT" and not "The language code is it-IT" or anything similar.`,
                                `Thank you in advance! ;-)`,
                            ].join('\n'),
                        });
                        if (srcLanguage) { await fnUpdateSrcAndTargetLanguage(srcLanguage); }
                    }
                } catch (error) {
                    console.error(`${lc}[fnHandleAutoTranslateCheckboxInput] ${extractErrorMsg(error)}`);
                    throw error;
                } finally {
                    checkboxing = false;
                }
            }
            // languageOptionsCheckboxEl.addEventListener('change', async () => {
            //     await fnHandleAutoTranslateCheckboxInput();
            // });
            languageOptionsCheckboxEl.addEventListener('change', fnHandleAutoTranslateCheckboxInput);


            const infoStimuliToAddBtn = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-output-info-btn');
            infoStimuliToAddBtn.addEventListener('click', () => {
                alertUser({
                    title: 'Stimuli to Add? What are these stimuli?',
                    msg: MINIGAME_STIMULTI_TO_ADD_INFO,
                });
            });

            const fnAddStimuliToMinigame = async () => {
                if (this.dialogFocuses.length === 0) {
                    await alertUser({
                        title: `doh`,
                        msg: `First, you must add some focuses. These are used to generate stimuli. The point of stimuli is to present a focus.`,
                    });
                }
                for (const focusInfo of this.dialogFocuses) {
                    const stimulusEntry = await this.getDialogStimulusEntry({
                        focusInfo,
                        shadowRoot,
                    });

                    const containerEl = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-prompt-new-stimuli-div');
                    const info = await getStimulusEntryEl({
                        shadowRoot,
                        stimulusEntry,
                    });
                    info.deleteBtnEl.addEventListener('click', () => {
                        this.dialogStimuliToAdd = this.dialogStimuliToAdd.filter(x => x.deleteBtnEl === info.deleteBtnEl);
                        containerEl.removeChild(info.entryEl);
                    });
                    info.editBtnEl.addEventListener('click', () => {
                        alertUser({ msg: 'Doh, not implemented yet. Donate some funding and/or your time!' });
                    });
                    containerEl.appendChild(info.entryEl);
                    this.dialogStimuliToAdd.push(info);

                }
                this.dialogFocuses.forEach(x => { x.deleteBtnEl.click(); });
                this.dialogFocuses = [];
            }
            // const addStimuliBtn = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-add-stimuli-btn');
            // addStimuliBtn.addEventListener('click', async () => );


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async addFocus({
        shadowRoot,
    }: {
        shadowRoot: ShadowRoot,
    }): Promise<void> {
        const lc = `${this.lc}[${this.addFocus.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 13fb18f9c2887521c884b10ea88c1825)`); }

            const focusLevelEl = shadowRoot_getElementById<HTMLSelectElement>(shadowRoot, 'typing-fullscreen-dialog-focus-level');
            const focusNumberEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-focus-number');

            if (!this.dialogSrcIbGib_latest?.data?.text) { throw new Error(`(UNEXPECTED) this.dialogSrcIbGib_latest?.data?.text? (E: 5812986eeb78b13dce50064f868df825)`); }
            if (!this.dialogSrcText) {
                await alertUser({
                    msg: [
                        `No source text! `,
                        `Add some text via the src address and/or edit it yourself, then try again. `,
                        `(E: 6ede88b39d6e8bf8581d486892c01225)`,
                    ].join('\n')
                })
                return; /* <<<< returns early */
            }

            const existingStimuli: Minigame_TypingStimulus[] = this.ibGib?.data?.gameMeta?.allStimuli ?? [];

            // if () { throw new Error(`(UNEXPECTED) this.gameMeta.allStimuli falsy? we are expecting at this point to be a valid game and thus this should be truthy, even if empty. (E: genuuid)`); }

            const focusRandomize = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-focus-randomize').checked;
            const focusNumberToAdd = Number.parseInt(focusNumberEl.value || '1');
            for (let i = 0; i < focusNumberToAdd; i++) {
                const someFocusText = await getAnotherFocusText({
                    text: this.dialogSrcText,
                    focusLevel: focusLevelEl.selectedOptions.item(0)?.value as TypingFocusLevel,
                    existingFocuses: unique([
                        ...this.dialogFocuses.map(x => x.focusText),
                        ...existingStimuli.filter(x => !!x.focus).map(x => x.focus!),
                        ...existingStimuli.map(x => x.value)
                    ]),
                    randomize: focusRandomize,
                });
                if (someFocusText) {
                    const dialogFocus = await getFocusAndElementsInfo({
                        agent: this.agent,
                        shadowRoot,
                        dialogSrcText: this.dialogSrcText,
                        text: someFocusText,
                        language: undefined, // need to change this
                        fnHandleStimuliGenerated: async (stimuli) => {
                            for (const stimulusEntry of stimuli) {
                                const containerEl = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-prompt-new-stimuli-div');
                                const info = await getStimulusEntryEl({
                                    shadowRoot,
                                    stimulusEntry,
                                });
                                info.deleteBtnEl.addEventListener('click', () => {
                                    this.dialogStimuliToAdd = this.dialogStimuliToAdd.filter(x => x.deleteBtnEl === info.deleteBtnEl);
                                    containerEl.removeChild(info.entryEl);
                                });
                                // info.editBtnEl.addEventListener('click', () => {
                                //     alertUser({ msg: 'Doh, not implemented yet. Donate some funding and/or your time!' });
                                // });
                                containerEl.appendChild(info.entryEl);
                                this.dialogStimuliToAdd.push(info);
                            }
                        },
                    });
                    this.dialogFocuses.push(dialogFocus);
                    const focusesDivEl = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-focuses-div');
                    focusesDivEl.appendChild(dialogFocus.entryEl);
                    dialogFocus.deleteBtnEl.addEventListener('click', () => {
                        focusesDivEl.removeChild(dialogFocus.entryEl);
                        this.dialogFocuses = this.dialogFocuses.filter(x => x !== dialogFocus);
                    });
                    // info.editBtnEl.addEventListener('click', async () => {
                    //     let newText = await promptForText({
                    //         msg: `Original text:\n\n${info.focusText}\n\nEnter new text.`,
                    //         defaultValue: info.focusText,
                    //     });
                    //     if (newText) {
                    //         info.focusText = newText;
                    //         info.textEl.textContent = newText;
                    //     } else {
                    //         console.log(`${lc} user cancelled editing focus text (I: genuuid)`);
                    //         return; /* <<<< returns early */
                    //     }
                    // });
                } else {
                    alertUser({ title: `no mas words`, msg: `You have nothing new to focus on! Maybe do it manually if you're sure?` });
                    break;
                }
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * @internal generate the stimulus entry given the parameters set on the add
     * stimuli dialog
     */
    private async getDialogStimulusEntry({
        focusInfo,
        shadowRoot,
    }: {
        focusInfo: FocusAndElementsInfo;
        shadowRoot: ShadowRoot,
    }): Promise<Minigame_TypingStimulus> {
        const lc = `${this.lc}[${this.getDialogStimulusEntry.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 10f445688d09bd6508feaf18fab51825)`); }

            if (this.dialogLanguageOptionsApplicable) {
                /* returns early */
                return await this.getDialogStimulusEntry_language({ focusInfo, shadowRoot });
            }


            // create one stimulus per focus
            // need to make an enum construct or reuse an existing one?
            // const stimulusTypes: string[] = [
            //     'parrot',
            //     'fitb',
            // ];
            const inputParrot = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'stimuli-type-parrot');
            const inputFitb = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'stimuli-type-fitb');

            // need to analyze a little for fitb applicability (don't blank out single word stimulus)
            const engine = new AnalysisEngine([
                DEFAULT_TOKEN_CONSTRUCT_RULE,
            ]);
            const analysis = engine.analyze({ text: focusInfo.focusText });
            const tokenInfo = analysis.constructs[DEFAULT_TOKEN_CONSTRUCT_RULE.name];
            const uniqueTokens = Object.keys(tokenInfo);

            const availableVariants: MinigameGameVariant_Typing[] = [];
            if (inputParrot.checked) {
                availableVariants.push(MinigameGameVariant_Typing.parrot);
            }
            if (inputFitb.checked && uniqueTokens.length > 1) {
                // don't blank out single-token text
                availableVariants.push(MinigameGameVariant_Typing.fitb);
            }
            if (availableVariants.length === 0) {
                throw new Error(`There aren't any available stimuli types. Remember fill-in-the-blank requires more than one word. (E: c2c008cf02ad41b7df806ad8aa221825)`);
            }
            const variant = pickRandom({ x: availableVariants });
            let stimulusText: string;
            let expectedResponse: string;
            let expectedResponseType: ExpectedResponseType;
            switch (variant) {
                case 'parrot':
                    stimulusText = focusInfo.focusText;
                    expectedResponse = focusInfo.focusText;
                    expectedResponseType = ExpectedResponseType.exact;
                    break;
                case 'fitb':
                    /** guaranteed to be alphanumeric */
                    const blankedText = pickRandom({ x: uniqueTokens });
                    if (!blankedText) { throw new Error(`(UNEXPECTED) couldn't find a blankedText? (E: 9e1b4b2084b30fe9d30d35d4d4aaed25)`); }
                    const regex = new RegExp(blankedText, 'i'); // i = case-insensitive
                    // stimulusText = focusInfo.text.replace(regex, ''.padStart(blankedText.length, '_'));
                    stimulusText = focusInfo.focusText.replace(regex, ''.padStart(4, '_'));
                    expectedResponse = blankedText;
                    expectedResponseType = ExpectedResponseType.fitb;
                    break;
                default:
                    throw new Error(`(UNEXPECTED) variant of (${variant})? only expecting parrot, fitb (E: 65c09858939bfa859475e9a8ae69d825)`);
            }

            // const stimulusText = await this.buildStimulusText();
            // const stimulusText = 'some stimulus text based on the focus and existing stuff';
            // const expectedResponse = 'some response';
            // const expectedResponseType = ExpectedResponseType.exact;
            const language = 'en-US';

            const stimulusEntry: Minigame_TypingStimulus = {
                id: await getNewTypingEntryId(),
                entryType: 'text',
                variant,
                value: stimulusText,
                expectedResponse,
                expectedResponseType,
                language,
                focus: focusInfo.focusText,
                notes: `auto-generated from user`,
                timestampInTicks: getTimestampInTicks(),
            };

            return stimulusEntry;
        } catch (error) {
            alertUser({ title: 'oops', msg: extractErrorMsg(error) });
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getDialogStimulusEntry_language({
        focusInfo,
        shadowRoot,
    }: {
        focusInfo: FocusAndElementsInfo;
        shadowRoot: ShadowRoot,
    }): Promise<Minigame_TypingStimulus> {
        const lc = `${this.lc}[${this.getDialogStimulusEntry_language.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 0a7dc87c92a82cbf26731fe866958825)`); }


            // create one or more stimuli depending on language goal
            // const goalEl = shadowRoot_getElementById<HTMLSelectElement>(shadowRoot, 'typing-fullscreen-dialog-language-goal');
            // const selectedOption = goalEl.options[goalEl.selectedIndex];
            // const goal = selectedOption.value;
            // switch (goal) {
            //     case 'recognize':
            //         // parrot/fitb
            //         break;
            //     case 'understand':
            //         // parrot/fitb
            //         // target -> native
            //         // target -> pic (future)
            //         break;
            //     case 'speak':
            //         // parrot/fitb
            //         // target -> native
            //         // target -> pic (future)
            //         // native -> target
            //         break;
            //     case 'think':
            //         // parrot/fitb
            //         // target -> native
            //         // target -> pic (future)
            //         // native -> target
            //         // target -> target/definition (in target)
            //         break;
            //     default:
            //         throw new Error(`(UNEXPECTED) goal is ${goal}? Should be one of recognize, understand, speak, think. (E: 33008510b7183ce6d8d05445efeae825)`);
            // }


            throw new Error(`not implemented (E: 61a3091ea4aa4bc7c823df183d4d6825)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async showFullscreenDialog(): Promise<string | undefined> {
        const lc = `[${this.showFullscreenDialog.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            return new Promise<string | undefined>(async (resolve, _reject) => {

                const { shadowRoot } = this;
                if (!shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 87d6d777abb1b69635d9699814c0e825)`); }
                const dialog = shadowRoot_getElementById<HTMLDialogElement>(shadowRoot, 'typing-fullscreen-dialog');
                const dialogBody = shadowRoot_getElementById<HTMLDialogElement>(shadowRoot, 'typing-fullscreen-dialog-body');

                // const promptInput = shadowRoot_getElementById<HTMLTextAreaElement>(shadowRoot, 'typing-fullscreen-dialog-prompt-input');
                const okButton = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-ok-button');
                const cancelButton = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'typing-fullscreen-dialog-cancel-button');

                // elements to reset
                const dialogSrcAddrEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-src-addr');
                const dialogSrcTextEl = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-src-text');
                const focusesDiv = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-focuses-div');
                const stimuliDiv = shadowRoot_getElementById(shadowRoot, 'typing-fullscreen-dialog-prompt-new-stimuli-div');

                const fnResetDialog = () => {
                    dialogSrcAddrEl.value = '';
                    dialogSrcTextEl.innerHTML = '';
                    focusesDiv.innerHTML = '';
                    stimuliDiv.innerHTML = '';
                    this.dialogSrcAddr = undefined;
                    this.dialogSrcAddr_latest = undefined;
                    this.dialogSrcIbGib_latest = undefined;
                    this._dialogSrcText = undefined;
                    this.dialogFocuses = [];
                    this.dialogStimuliToAdd = [];
                }
                const removeEventListeners = () => {
                    okButton.removeEventListener('click', onOK);
                    cancelButton.removeEventListener('click', onCancel);
                    dialog.removeEventListener('close', onClose); // Remove dialog-level listener too
                };

                // #region wire up - these all should be in removeEventListeners
                /** user clicks OK or hits "ENTER" in input */
                const onOK = async () => {
                    removeEventListeners();
                    // let result = promptInput.value ?? '';
                    // promptInput.value = '';  // Clear input for next time
                    // move this.dialogFocuses to fully fledged stimuli

                    await minigameBuilderEditStimuliFunctionInfo.fnViaCmd({
                        cmd: minigameBuilderEditStimuliFunctionInfo.cmd,
                        cmdModifiers: minigameBuilderEditStimuliFunctionInfo.cmdModifiers.concat(),
                        minigameAddr: this.tjpAddr!,
                        stimulusEditInfos: this.dialogStimuliToAdd.map(x => {
                            return {
                                action: 'add',
                                newStimulus: x.stimulusEntry,
                            };
                        }),
                    });
                    fnResetDialog();
                    dialog.close(undefined); //
                    resolve(undefined);
                };
                okButton.addEventListener('click', onOK);
                /** user actively clicks Cancel */
                const onCancel = async () => {
                    removeEventListeners();
                    fnResetDialog();
                    dialog.close(undefined); //
                    resolve(undefined);
                };
                cancelButton.addEventListener('click', onCancel);
                /**
                 * Handle dialog.close() without button click (e.g., Esc key)
                 *
                 * NOTE: this does not trigger when dialog.close() is executed. This
                 * is only firing when esc is pressed.
                 */
                const onClose = async () => {
                    console.log(`${lc} onClose (I: 0a97e8f844e92ac7a8fb29a608d58125)`);
                    removeEventListeners();
                    // promptInput.value = '';  // Clear input for next time
                    dialog.close(undefined);
                    resolve(undefined);
                };
                dialog.addEventListener('close', onClose);
                // #endregion wire up - these all should be in removeEventListeners

                // show it
                dialog.showModal();
                await delay(500);
                dialogBody.scrollTo({ top: 0, behavior: 'smooth' });
                const srcAddrInput = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-src-addr');
                const contextAddr = this.ibGib?.data?.["@contextAddr"];
                if (contextAddr) {
                    srcAddrInput.value = contextAddr;
                    const manualInputEvent = new Event('input', { bubbles: true });
                    srcAddrInput.dispatchEvent(manualInputEvent);
                }
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

// *   character-level typing practice with parroting:
//     *   This is focused on character-level typing practice and active recognition through parroting. This would be particularly helpful for learners unfamiliar with the target language's keyboard layout or character set.
// *   word/phrase-level exercises with directional atomic associations:
//     *   This will be focused on word/phrase-level exercises with the following directional atomic associations between the target and native languages:
//         *   target -> target
//         *   target - native -> target - native
//         *   target - native -> native
//         *   target -> native
//         *   native - target -> native - target
//         *   native - target -> target
//         *   native -> target
//         *   target -> target
// *   fill-in-the-blanks (FITB) and scrambled sentences:
//     *   These types of minigames will help the learner focus on understanding and practicing grammar and sentence structure. The FITB blanks can be of one or more words, and scrambled sentences will require putting a series of words/chunks in the correct order.
// *   target - target definition -> target
//     *   This type of minigame would show a target word and its definition in the target language, prompting the learner to type the target word.
// *   target definition -> target
//     *   This type of minigame would show a target word's definition in the target language, prompting the learner to type the target word.
// *   picture - target -> target
//     *   This type of minigame would show a picture associated with a target word, prompting the learner to type the target word.
// *   target/picture composition -> target1, target2, target3, ...
//     *   In this type of exercise, the agent provides a composition (e.g., haiku, poem, short story) incorporating a set of target words or a picture depicting a scenario with associated vocabulary. The learner then provides a response, such as typing specific target words from the composition or describing elements of the picture in the target language.
