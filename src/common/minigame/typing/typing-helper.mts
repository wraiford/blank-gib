import { delay, extractErrorMsg, getSaferSubstring, getTimestamp, getTimestampInTicks, getUUID, pickRandom, pickRandom_Letters, pretty, unique } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { Ib, IbGibAddr, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import {
    Minigame_TypingGameMeta, Minigame_TypingStimulus,
    Minigame_TypingInteraction, StimulusEditInfo,
    TypingEntryAndElementsInfo,
    FocusAndElementsInfo
} from './typing-types.mjs';
import { MinigameData_V1, MinigameIbGib_V1 } from '../minigame-types.mjs';
import { getLatestTimelineIbGibDto_nonLocking, mut8Timeline } from '../../../api/timeline/timeline-api.mjs';
import { alertUser, getGlobalMetaspace_waitIfNeeded, highlightElement, shadowRoot_getElementById } from '../../../helpers.web.mjs';
import { MinigameGameType } from '../minigame-constants.mjs';
import { AnalysisResult } from '../../text-analysis/types.mjs';
import { debounce, deleteAt, getShortenedStringWithEllipsis, insertAt } from '../../../helpers.mjs';
import { AnalysisEngine } from '../../text-analysis/analysis-engine.mjs';
import { DEFAULT_TOKEN_CONSTRUCT_RULE } from '../../text-analysis/analysis-engine-constants.mjs';
import { CorpusAnalyzer } from '../../text-analysis/corpus-analyzer.mjs';
import { sentenceSplitter } from './sentence-helper.mjs';
import { AgentWitnessAny } from '../../../witness/agent/agent-one-file.mjs';
import { ExpectedResponseType } from './typing-constants.mjs';

const logalot = GLOBAL_LOG_A_LOT;

/**
 * edits stimuli in the `minigame.data.gameMeta` (NOT in actual minigame
 * instances)
 *
 * @returns new minigame ibgib updated with edited stimuli
 */
export async function editStimuli_typing({
    stimuliEditInfos,
    minigameIbGib,
    minigameAddr,
}: {
    stimuliEditInfos: StimulusEditInfo[],
    minigameIbGib?: MinigameIbGib_V1,
    minigameAddr?: IbGibAddr,
}): Promise<MinigameIbGib_V1> {
    const lc = `[${editStimuli_typing.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 47ab6f7a4198c302c84df8afa30b4825)`); }

        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        const space = await metaspace.getLocalUserSpace({ lock: false });
        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 178328ba5588da03e83b8efccf107b25)`); }

        if (!minigameIbGib && !minigameAddr) { throw new Error(`either minigameIbGib or minigameAddr required. (E: 7b65cd92cc48de0fd88d6a58fd727b25)`); }
        minigameAddr ??= getIbGibAddr({ ibGib: minigameIbGib });

        /**
         * does not lock. if we are to the point of online collaboration, this
         * should be changed to a single locking call to ensure we have the
         * latest data (latest ibgib in the timeline) probably yagni thought
         * since we won't get there with this iteration, but hey.
         */
        let latestMinigameIbGib = await getLatestTimelineIbGibDto_nonLocking({
            timelineAddr: minigameAddr,
            metaspace,
            space,
        }) as MinigameIbGib_V1;
        if (!latestMinigameIbGib.data) { throw new Error(`(UNEXPECTED) latestMinigameIbGib.data falsy? (E: 2f344d548d79589813cd94c8ad86aa25)`); }



        const gameMeta_existing = latestMinigameIbGib.data.gameMeta as Minigame_TypingGameMeta;
        let allStimuli_new = [...(gameMeta_existing.allStimuli ?? [])];
        // const gameMeta_new = { ...gameMeta_existing };
        // gameMeta_new.allStimuli ??= [];

        for (const info of stimuliEditInfos) {
            let existingIndex: number | undefined;
            switch (info.action) {
                case "add":
                    allStimuli_new.push(info.newStimulus as Minigame_TypingStimulus); // just pretend it's valid
                    // info.index info.stimulusId unused
                    break;
                case "insert":
                    if (typeof info.index !== 'number') {
                        throw new Error(`info.index type is not 'number'. info: ${pretty(info)} (E: ce218f07b29a93f148257793343e9925)`);
                    }
                    // maybe yagni
                    if (info.stimulusId) {
                        console.warn(`${lc} info.stimulusId set, but we're ignoring this. info.index drives where the insert happens. info: ${pretty(info)} (W: fc6c3682ce29462b79008c11949a5525)`);
                    }
                    allStimuli_new = insertAt({
                        newItems: [info.newStimulus as Minigame_TypingStimulus], // just pretend it's valid
                        index: info.index,
                        targetArray: allStimuli_new,
                    });
                    break;
                case "edit":
                    if (info.stimulusId) {
                        existingIndex = allStimuli_new.findIndex(x => x.id === info.stimulusId);
                    } else if (typeof info.index === 'number') {
                        if (info.index < 0 || info.index >= allStimuli_new.length) {
                            throw new Error(`info.index (${info.index}) out of range of allStimuli_new (allStimuli_new.length: ${allStimuli_new.length}). this may be due to the fact that this edit happens after previous edits, so indexes may have changed. use stimulusId instead of trying to calculate indexes to avoid this (E: db75d65be8f6080fa88851180e9e9a25)`);
                        }
                        existingIndex = info.index;
                    } else {
                        throw new Error(`either info.stimulusId or info.index required when editing. info: ${pretty(info)} (E: 2d38bd7c11b8adba0af23626befd6625)`);
                    }
                    if (existingIndex === -1) { throw new Error(`(UNEXPECTED) existingIndex === -1? this should be guaranteed at this point. (E: 54d3e86cc3f81992b8b656289edef825)`); }
                    allStimuli_new[existingIndex] = info.newStimulus as Minigame_TypingStimulus; // just pretend it's valid
                    break;
                case "delete":
                    if (info.stimulusId) {
                        existingIndex = allStimuli_new.findIndex(x => x.id === info.stimulusId);
                    } else if (typeof info.index === 'number') {
                        if (info.index < 0 || info.index >= allStimuli_new.length) {
                            throw new Error(`info.index (${info.index}) out of range of allStimuli_new (allStimuli_new.length: ${allStimuli_new.length}). this may be due to the fact that this edit happens after previous edits, so indexes may have changed. use stimulusId instead of trying to calculate indexes to avoid this (E: 011bd8fae1d883dd1f4fe2f41aaff825)`);
                        }
                        existingIndex = info.index;
                    } else {
                        throw new Error(`either info.stimulusId or info.index required when editing. info: ${pretty(info)} (E: 2d38bd7c11b8adba0af23626befd6625)`);
                    }
                    if (existingIndex === -1) { throw new Error(`(UNEXPECTED) existingIndex === -1? this should be guaranteed at this point. (E: 54d3e86cc3f81992b8b656289edef825)`); }

                    allStimuli_new = deleteAt({
                        index: existingIndex,
                        targetArray: allStimuli_new,
                    });
                    break;
                default:
                    throw new Error(`(UNEXPECTED) invalid stimuliEditInfo.action (${info.action})? only add/insert/edit/delete atow (E: 680aa6d051d9b4ee98035fb84e570625)`);
            }
        }


        // const allStimuli_new = [
        //     ...gameMeta_existing.allStimuli ?? [],
        //     ...stimuliEditInfos,
        // ];

        // if any are deletes, we must first clear out allStimuli completely,
        // otherwise, the mut8 call will not work properly. (this is slightly
        // inefficient but at this scale shouldn't be a big deal)
        if (stimuliEditInfos.some(x => x.action === 'delete')) {
            latestMinigameIbGib = await mut8Timeline({
                timelineAddr: minigameAddr,
                mut8Opts: {
                    dataToRemove: {
                        gameMeta: { allStimuli: true },
                    },
                },
                metaspace,
                space,
            });
        }

        /**
         * this should leave other existing gameMeta data as-is.
         */
        const dataToAddOrPatch: Partial<MinigameData_V1> = {
            gameMeta: { allStimuli: allStimuli_new },
            /**
             * not playable until game is validated.
             */
            playable: false,
        }
        const newMinigameIbGib = await mut8Timeline({
            timelineAddr: minigameAddr,
            mut8Opts: {
                dataToAddOrPatch,
            },
            metaspace,
            space,
        });

        if (logalot) { console.log(`${lc} newMinigameIbGib: ${pretty(newMinigameIbGib)} (I: 41d2d8d3e0f88e9bf8a517089e21f525)`); }

        return newMinigameIbGib;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function validateMinigameIsReady_typing({
    minigameIbGib,
    data,
}: {
    minigameIbGib: MinigameIbGib_V1,
    data?: MinigameData_V1,
}): Promise<string[]> {
    const lc = `[${validateMinigameIsReady_typing.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 9f14f89cbbaa9dfdc83f0b3814cac825)`); }

        if (!minigameIbGib.data) { throw new Error(`(UNEXPECTED) minigameIbGib.data falsy? (E: 9d30081f4cc8eaec112d9ad769218125)`); }

        data ??= minigameIbGib.data;
        if (data.gameType !== MinigameGameType.typing) { throw new Error(`(UNEXPECTED) data.gameType !== 'typing'? (E: 403cdb545ab81ac618b9ed859eb92825)`); }

        const errors: string[] = [];

        const gameMeta = data.gameMeta as Minigame_TypingGameMeta;
        if (!gameMeta.allStimuli || gameMeta.allStimuli.length === 0) {
            errors.push(`No stimuli added to the game. (E: genuuid)`);
        }

        // do I care about game state here? I think I'm just looking to start a
        // new game based off of this ibgib.
        // const gameState = data.gameState as Minigame_TypingGameState;

        return errors;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

interface ElapsedInfo {
    /**
     * if undefined, the others will be undefined
     */
    startingTimestampInTicks?: number;
    /**
     * if there is no response, maybe caller wants last stimulus
     */
    elapsedMs_toLastInteractionStimulus?: number;
    /**
     * most recent interaction
     */
    elapsedMs_toLastInteractionResponse?: number;
    elapsedMs_toNow?: number;
    /**
     * undefined if no errors
     */
    errors?: string[];
}

/**
 *
 * @returns elapsedMs between {@link a} and {@link b}
 */
export function getElapsedInfo({
    a,
    b,
}: {
    /** starting interaction */
    a: Minigame_TypingInteraction,
    /**
     * ending interaction. if no response has been givenyet, then this will be ignored
     */
    b: Minigame_TypingInteraction,
}): ElapsedInfo {
    const lc = `[${getElapsedInfo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 0368a7efc608341ac863fd989f646425)`); }
        const startTimestampString: string | undefined = a.stimulus.timestampInTicks;
        if (startTimestampString === undefined) { throw new Error(`a.stimulus.timestampInTicks undefined, so no starting point and no elapsed possible. (E: b38d473042687aef02395bdab04afc25)`); }

        let errors: string[] = [];
        const result: ElapsedInfo = {};

        const startTimestampInTicksInt = Number.parseInt(startTimestampString);
        if (Number.isNaN(startTimestampInTicksInt)) { throw new Error(`a.stimulus.timestampInTicks is not an integer string. (E: d40578dabe08b6ecb81092f5e94b1625)`); }


        if (b.stimulus.timestampInTicks) {
            const end_stimulusInTicksInt = Number.parseInt(b.stimulus.timestampInTicks);
            if (!Number.isNaN(end_stimulusInTicksInt)) {
                result.elapsedMs_toLastInteractionStimulus =
                    end_stimulusInTicksInt - startTimestampInTicksInt;
            } else {
                errors.push(`end timestamp is not an integer string (E: 45bfc98e3dc8743b459951c419408a25)`);
            }
        }
        if (b.response.timestampInTicks) {
            const end_responseInTicksInt = Number.parseInt(b.response.timestampInTicks);
            if (!Number.isNaN(end_responseInTicksInt)) {
                result.elapsedMs_toLastInteractionResponse =
                    end_responseInTicksInt - startTimestampInTicksInt;
            } else {
                errors.push(`end timestamp is not an integer string (E: 45bfc98e3dc8743b459951c419408a25)`);
            }
        }

        const now_timestampInTicks = getTimestampInTicks();
        const now_timestampInTicksInt = Number.parseInt(now_timestampInTicks);
        result.elapsedMs_toNow = now_timestampInTicksInt - startTimestampInTicksInt;

        if (errors.length > 0) { result.errors = errors; }

        return result;
    } catch (error) {
        const emsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(emsg);
        return { errors: [emsg] };
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getWpm({
    responsesAnalysis,
    elapsedMs,
}: {
    responsesAnalysis: AnalysisResult,
    elapsedMs: number,
}): number {
    const lc = `[${getWpm.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c0d406b91c0f3776e99c871834477a25)`); }
        const elapsedMinutes = elapsedMs * 1 / 1000 * 1 / 60;
        const wpmRaw = responsesAnalysis.tokenCount / elapsedMinutes;
        return Math.round(wpmRaw);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export interface Timespan {
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Converts elapsed milliseconds into hours, minutes, and seconds.
 */
export function toHoursMinutesSeconds({
    elapsedMs,
}: {
    elapsedMs: number;
}): Timespan {
    const lc = `[${toHoursMinutesSeconds.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 483c177d8a99f9942e18ff441f708625)`); }

        if (elapsedMs < 0) { throw new Error(`elapsedMs cannot be negative (E: ab1c234d6789e0f123456789abcd1234)`); }

        const totalSeconds = Math.floor(elapsedMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export type TypingFocusLevel = 'character' | 'word' | 'sentence' | 'newline' | 'paragraph';
export const TypingFocusLevel = {
    character: 'character',
    word: 'word',
    sentence: 'sentence',
    newline: 'newline',
    paragraph: 'paragraph',
} satisfies { [key: string]: TypingFocusLevel }

export async function getUniqueTokens({
    text,
    tokensToIgnore,
}: {
    text: string
    /**
     * will ignore these.
     *
     * ## notes
     *
     * use this for ignore running list of existing tokens
     */
    tokensToIgnore?: string[],
}): Promise<string[]> {
    const lc = `[${getUniqueTokens.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 353b99880015c1edce5b2ba8321d6425)`); }

        tokensToIgnore ??= [];

        const docId = pickRandom_Letters({ count: 8 });
        const topN = 15;
        const engine = new AnalysisEngine([
            DEFAULT_TOKEN_CONSTRUCT_RULE,
            // ...DEFAULT_SPANISH_RULES,
        ]);
        // const analyzer = new CorpusAnalyzer(AnalysisEngine.DEFAULT);
        const analyzer = new CorpusAnalyzer(engine);
        analyzer.addDocumentFromText({
            id: docId,
            text,
        });
        const analysis = analyzer.getDocumentAnalysis({ id: docId });
        if (!analysis) { throw new Error(`(UNEXPECTED) responses_analysis falsy? (E: 02a658aa66a93b9118a83f38ec3c4f25)`); }
        if (logalot) { console.dir(analysis); }
        const report = analyzer.generateDocumentReport({
            docId: docId,
            topN,
            constructsToReport: [AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME]
        });
        if (logalot) { console.dir(report); }

        const tokenFreqMap = analysis.constructs[AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME]!;
        const tokenFreqMapEntriesSortedByCount = Object.entries(tokenFreqMap).sort((a, b) => b[1] - a[1]);
        if (logalot) { console.dir(tokenFreqMapEntriesSortedByCount) }

        const uniqueTokens = Object.keys(tokenFreqMap).filter(x => !tokensToIgnore!.includes(x.toLocaleLowerCase()));

        if (logalot) { console.log(`${lc} uniqueTokens: ${uniqueTokens} (I: 0e5df96e0ca560be08971a45b03bc325)`); }

        return uniqueTokens;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * We want to pull some focus from {@link text} but we don't want to repeat
 * anything that is already in {@link existingFocuses}.
 *
 * So we split the text into pieces depending on {@link focusLevel}, and then
 * pick one of those that isn't already encoded in the {@link existingFocuses}.
 *
 * If nothing is new, will returned undefined.
 */
export async function getAnotherFocusText({
    text,
    focusLevel,
    existingFocuses,
    randomize,
}: {
    text: string,
    focusLevel: TypingFocusLevel,
    existingFocuses: string[],
    randomize: boolean,
}): Promise<string | undefined> {
    const lc = `[${getAnotherFocusText.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 60c22940b1c89e2a02a4a311a9b97825)`); }
        if (!text) {
            alertUser({ msg: `The text to draw from is empty? Add some text from which we will choose our focus. (E: 2b4cfab9bfdb3771a15e63683dc8c825)` });
            return undefined; /* <<<< returns early */
        }
        const allFocuses = existingFocuses.join('\n');
        /** pool among which to choose */
        let focusPool: string[];
        switch (focusLevel) {
            case 'character':
                const uniqueCharacters = unique(text.split(''));
                const allFocusesChars = unique(allFocuses.split(''));
                focusPool = uniqueCharacters
                    .filter(x => !!x)
                    .filter(x => !allFocusesChars.includes(x));
                break;
            case 'word':
                const existingFocuses_lower = existingFocuses.map(x => x.toLocaleLowerCase());
                focusPool = await getUniqueTokens({ text, tokensToIgnore: existingFocuses_lower });
                break;
            case 'sentence':
                const sentences = sentenceSplitter.split(text)
                    .filter(x => !!x)
                    .filter(x => !allFocuses.includes(x));
                focusPool = sentences;
                break;
            case 'newline':
                const lines = text.split('\n')
                    .filter(x => !!x)
                    .filter(x => !existingFocuses.includes(x));
                focusPool = lines;
                break;
            case 'paragraph':
                const paragraphs = text.split('\n\n')
                    .filter(x => !!x)
                    .filter(x => !allFocuses.includes(x));
                focusPool = paragraphs;
                break;
            default:
                throw new Error(`(UNEXPECTED) focusLevel is ${focusLevel}?  (E: ca6618ea99784ad0285cc142b13a7625)`);
        }
        const resFocusText = randomize ?
            pickRandom({ x: focusPool }) :
            focusPool.at(0);
        if (!resFocusText || logalot) { console.log(`${lc} resFocusText: ${resFocusText} (I: ed8989737268966aa824fd78deda6825)`); }
        return resFocusText;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getGoogleTranslateLink({ text }: { text: string }): string {
    const lc = `[${getGoogleTranslateLink.name}]`;
    if (text) {
        return `https://translate.google.com/details?text=${encodeURI(text)}`;
    } else {
        console.warn(`${lc} incoming text is empty/falsy. (W: b45e876a4a98396eeda23a4564b84825)`);
        return `https://translate.google.com/details`;
    }
}

export async function getStimulusEntryEl({
    shadowRoot,
    stimulusEntry,
}: {
    shadowRoot: ShadowRoot,
    stimulusEntry: Minigame_TypingStimulus,
}): Promise<TypingEntryAndElementsInfo> {
    const lc = `[${getStimulusEntryEl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 952d0fc7900fcf80640b7947e6749825)`); }

        // the stimulus entry element is driven by the stimulus-entry-template

        const entryTemplate = shadowRoot_getElementById<HTMLTemplateElement>(shadowRoot, 'stimulus-entry-template');
        const entryTemplateContentNode = entryTemplate.content.cloneNode(true) as DocumentFragment;
        const entryEl = document.createElement('li');
        const entryTemplateDiv = entryTemplateContentNode.firstElementChild;
        if (!entryTemplateDiv) { throw new Error(`(UNEXPECTED) !templateDiv? (E: f0a8980037fabe1fd814b9fc044d3d25)`); }
        entryEl.append(entryTemplateDiv);
        // how to query children of the entryEl:
        // const entryTextEl = entryTemplateDiv.querySelector('#focus-template-focus-text') as HTMLElement;
        const entryTextEl = entryTemplateDiv.querySelector('#stimulus-entry-text') as HTMLElement;
        entryTextEl.textContent = stimulusEntry.value;

        // #region buttons
        const deleteBtnEl = entryTemplateDiv.querySelector('#stimulus-entry-delete-btn') as HTMLButtonElement;
        const editBtnEl = entryTemplateDiv.querySelector('#stimulus-entry-edit-btn') as HTMLButtonElement;
        const expandBtnEl = entryTemplateDiv.querySelector('#stimulus-entry-expand-btn') as HTMLButtonElement;
        expandBtnEl.addEventListener('click', async () => {
            const detailsEl = entryTemplateDiv.querySelector('.stimulus-entry-details-section') as HTMLElement;
            const variantEl = entryTemplateDiv.querySelector('.stimulus-entry-variant') as HTMLParagraphElement;
            variantEl.textContent = stimulusEntry.variant ?? '';
            const focusTextEl = entryTemplateDiv.querySelector('.stimulus-entry-focus-text') as HTMLParagraphElement;
            focusTextEl.textContent = stimulusEntry.focus ?? '';
            const languageEl = entryTemplateDiv.querySelector('.stimulus-entry-language') as HTMLParagraphElement;
            // if languageEl is falsy, use src language typing-fullscreen-dialog-text-language-input
            const srcLanguageEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-text-language-input');
            languageEl.textContent = stimulusEntry.language ?? srcLanguageEl?.value ?? '';

            // span for readonly, select for edit
            const expectedTypeEl = entryTemplateDiv.querySelector('.stimulus-entry-expected-response-type-p') as HTMLSpanElement;
            expectedTypeEl.textContent =
                stimulusEntry.expectedResponseType ?? ExpectedResponseType.exact;
            const expectedTypeSelectEl = entryTemplateDiv.querySelector('.stimulus-entry-expected-response-type-select') as HTMLSelectElement;
            expectedTypeSelectEl.value = stimulusEntry.expectedResponseType ?? ExpectedResponseType.exact;
            const expectedTextEl = entryTemplateDiv.querySelector('.stimulus-entry-expected-response-text') as HTMLParagraphElement;
            expectedTextEl.textContent = stimulusEntry.expectedResponse ?? '';

            // expectedResponse // :
            // "Ay candela, candela, candela, me quemo aé."
            // expectedResponseType // : // "equivalent"
            // notes
            // :
            // "auto-generated from user"
            // timestampInTicks
            // :
            // "1756046646203"
            // value
            // :
            // "Oh fire, fire, fire, I'm burning up."
            // variant
            // :
            // "translate"

            // animation
            detailsEl.style.display = 'flex';
            await delay(50);
            detailsEl.style.maxHeight = '1000px';
            await highlightElement({ el: detailsEl, magicHighlightTimingMs: 1_000 });
            detailsEl.style.maxHeight = 'none';
        });
        // #endregion buttons

        return {
            stimulusEntry,
            entryEl,
            deleteBtnEl,
            editBtnEl
        };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

function getTextTargetMappingString({
    fromText,
    toText,
    maxChars = 12,
}: {
    fromText: string,
    toText: string,
    maxChars?: number,
}): string {
    return `${getShortenedStringWithEllipsis({ str: fromText, maxChars })} -> ${getShortenedStringWithEllipsis({ str: toText, maxChars })}`;
}

export async function askAgentTranslateOneOff({
    text,
    agent,
    contextSrcText,
}: {
    text: string,
    agent: AgentWitnessAny,
    contextSrcText: string,
}): Promise<string | undefined> {
    const lc = `[${askAgentTranslateOneOff.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c4c5bf3a072a4bf1d82c7be8a18c5825)`); }

        const resTranslation = await agent.promptOneOff({
            text: [
                `Hi. Please translate "${text}" into en-US.`
            ].join('\n'),
            systemInstructions: [
                'You are an expert translator and are helping the user learn a foreign language. The context source text for translating is:',
                '```',
                contextSrcText,
                '```',
                'The user is creating one or more dynamic flashcards with a focus on this text:',
                '```',
                text,
                '```',
                `In your response, don't use a full sentence, just say the translation. So if the user asks to translate "cane" from italian, just say "dog". Or if they ask a full line from a song like "A Chan Chan le daba pena", just say "It gave Chan Chan pain" (or whatever you think is the best translation).`,
                `Thank you in advance! ;-)`,
            ].join('\n'),
        });

        return resTranslation;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getFocusAndElementsInfo({
    shadowRoot,
    dialogSrcText,
    text,
    language,
    fnHandleStimuliGenerated,
    agent,
}: {
    shadowRoot: ShadowRoot,
    dialogSrcText: string,
    text: string,
    language?: string,
    fnHandleStimuliGenerated: (stimuli: Minigame_TypingStimulus[]) => Promise<void>,
    agent?: AgentWitnessAny,
}): Promise<FocusAndElementsInfo> {
    const lc = `[${getFocusAndElementsInfo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 077b4beeb0582d64ebe6b3e80ba58825)`); }

        const focusTemplate = shadowRoot_getElementById<HTMLTemplateElement>(shadowRoot, 'focus-template');
        const focusTemplateContentNode = focusTemplate.content.cloneNode(true) as DocumentFragment;
        const entryEl = document.createElement('li');
        const focusTemplateDiv = focusTemplateContentNode.firstElementChild;
        if (!focusTemplateDiv) { throw new Error(`(UNEXPECTED) !templateDiv? (E: 3d8f38fcf5d87b9a52576f68a8b4ad25)`); }
        entryEl.append(focusTemplateDiv);
        const focusTextEl = focusTemplateDiv.querySelector('#focus-template-focus-text') as HTMLElement;
        focusTextEl.textContent = text;
        const focusTextTranslateEl = focusTemplateDiv.querySelector('#focus-text-translate-link') as HTMLAnchorElement;
        focusTextTranslateEl.href = getGoogleTranslateLink({ text });
        const deleteBtnEl = focusTemplateDiv.querySelector('#focus-template-delete-btn') as HTMLButtonElement;
        // const editBtnEl = templateDiv.querySelector('#focus-template-edit-btn') as HTMLButtonElement;
        // const genStimuliBtnEl = templateDiv.querySelector('#focus-template-add-btn') as HTMLButtonElement;

        const detailsParrotEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-parrot') as HTMLElement;
        const detailsFitbEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-fitb') as HTMLElement;
        const detailsTranslateEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-translate') as HTMLElement;
        const detailsEls: HTMLElement[] = [
            detailsParrotEl,
            detailsFitbEl,
            detailsTranslateEl,
        ];

        const fnOutroEl = async (el: HTMLElement) => {
            await highlightElement({ el });
            await delay(200);
            await slideRightAndFade({ el, durationMs: 500 });
            el.style.display = 'none';
            if (el !== entryEl) {
                // only recurse if we're not already recursing the entryEl
                // itself
                if (detailsEls.every(x => x.style.display === 'none')) {
                    await delay(250);
                    await fnOutroEl(entryEl);
                }
            }
        }

        // #region parrot

        const detailsParrot_expectedResponse = focusTemplateDiv.querySelector('#focus-template-stimuli-details-parrot-text') as HTMLParagraphElement;
        // detailsParrot_expectedResponse.textContent = text;
        detailsParrot_expectedResponse.textContent = getTextTargetMappingString({
            fromText: text,
            toText: text,
            maxChars: 12,
        });
        const detailsParrotAddBtn = focusTemplateDiv.querySelector('#focus-template-details-parrot-add-btn') as HTMLButtonElement;
        detailsParrotAddBtn.addEventListener('click', async () => {
            const stimulusEntry: Minigame_TypingStimulus = {
                id: await getNewTypingEntryId(),
                entryType: 'text',
                variant: 'parrot',
                value: text,
                expectedResponse: text,
                expectedResponseType: 'exact',
                language,
                focus: text,
                notes: `auto-generated from user`,
                timestampInTicks: getTimestampInTicks(),
            };
            await fnHandleStimuliGenerated([stimulusEntry]);
            await fnOutroEl(detailsParrotEl);
        });

        // #endregion parrot

        // #region fitb

        const uniqueTokens = await getUniqueTokens({ text, });
        if (uniqueTokens.length > 1) {
            const detailsFitbNumBlanksEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-fitb-numblanks') as HTMLInputElement;
            const fnGetBlankedText: (str: string, numBlanks: number, blank: string) => Promise<[string, string[]] | undefined> = async (str, numBlanks, blank) => {
                if (numBlanks < uniqueTokens.length) {
                    // build blanked text and get info on each blank's 1st location
                    let blankedText = str.concat();
                    const answerMap: { [blankIndex: number]: string } = {};
                    const availableTokens = new Set(uniqueTokens);
                    for (let i = 0; i < numBlanks; i++) {
                        const token = pickRandom({ x: Array.from(availableTokens) })!;
                        availableTokens.delete(token);
                        const blankIndex = str.toLocaleLowerCase().indexOf(token.toLocaleLowerCase());
                        answerMap[blankIndex] = token;
                        blankedText = blankedText.replace(new RegExp(token, 'ig'), blank);
                    }
                    // get sorted answers from the answerMap
                    const answerIndices = Object.keys(answerMap).map(Number).sort((a, b) => a - b);
                    const answers = answerIndices.map(index => answerMap[index]);

                    return [blankedText, answers];
                } else {
                    await alertUser({ msg: 'too many blanks!' });
                    return undefined; /* <<<< returns early */
                }
            }
            const detailsFitb_blankedTextEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-fitb-blanked-text') as HTMLParagraphElement;
            const detailsFitb_expectedResponseEl = focusTemplateDiv.querySelector('#focus-template-stimuli-details-fitb-expected') as HTMLParagraphElement;
            const fnUpdateFitbInfo = async () => {
                const resBlank = await fnGetBlankedText(text, detailsFitbNumBlanksEl.valueAsNumber, '____');
                if (!resBlank) { return; /* <<<< returns early */ }
                const [blankedText, answers] = resBlank;
                detailsFitb_blankedTextEl.textContent = blankedText;
                (detailsFitb_blankedTextEl as any).answers = answers;
                // detailsFitb_blankedTextEl.dataset.answers = answers.join('|');
                detailsFitb_expectedResponseEl.textContent = answers.join(' ');
            }
            detailsFitbNumBlanksEl.addEventListener('input', debounce(fnUpdateFitbInfo, 1_000));
            await fnUpdateFitbInfo();
            const detailsFitbAddBtn = focusTemplateDiv.querySelector('#focus-template-details-fitb-add-btn') as HTMLButtonElement;
            detailsFitbAddBtn.addEventListener('click', async () => {
                if (!detailsFitb_blankedTextEl.textContent) { throw new Error(`(UNEXPECTED) !detailsFitb_blankedTextEl.textContent? should be text with blanks (E: c7eaf21d604ef15a880c67cf636e2c25)`); }
                if (!detailsFitb_expectedResponseEl.textContent) { throw new Error(`(UNEXPECTED) !detailsFitb_expectedResponseEl.textContent? should be the text that goes in the blank(s) (E: 2f9122d26a288b797d582e4812790a25)`); }
                const stimulusEntry: Minigame_TypingStimulus = {
                    id: await getNewTypingEntryId(),
                    entryType: 'text',
                    variant: 'fitb',
                    value: detailsFitb_blankedTextEl.textContent,
                    expectedResponse: detailsFitb_expectedResponseEl.textContent,
                    expectedResponseType: 'fill-in-the-blank',
                    language,
                    focus: text,
                    notes: `auto-generated from user`,
                    timestampInTicks: getTimestampInTicks(),
                };
                await fnHandleStimuliGenerated([stimulusEntry]);
                await fnOutroEl(detailsFitbEl);
            });
        } else {
            // focus text has only one token so can't do fitb
            detailsFitbEl.style.display = 'none';
        }

        // #endregion fitb

        // #region translate

        const detailsTranslateTranslatedFocusTextEl = focusTemplateDiv.querySelector('#stimulus-gen-translated-focus-text') as HTMLTextAreaElement;
        const fnUpdateTranslationLabels = async (translation: string) => {
            console.log(translation);
            detailsTranslateTranslatedFocusTextEl.textContent = translation?.trim() ?? '';
            const detailsTranslate_stimulusGenTargetNative = focusTemplateDiv.querySelector('#stimulus-gen-target-native') as HTMLParagraphElement;
            detailsTranslate_stimulusGenTargetNative.textContent = getTextTargetMappingString({
                fromText: text,
                toText: translation ?? '[?]',
                maxChars: 12,
            });
            detailsTranslate_stimulusGenTargetNative.title = `${text}\n\n->\n\n${translation}`;
            const detailsTranslate_stimulusGenNativeTarget = focusTemplateDiv.querySelector('#stimulus-gen-native-target') as HTMLParagraphElement;
            detailsTranslate_stimulusGenNativeTarget.textContent = getTextTargetMappingString({
                toText: text,
                fromText: translation ?? '[?]',
                maxChars: 12,
            });
            detailsTranslate_stimulusGenNativeTarget.title = `${translation}\n\n->\n\n${text}`;
        };
        detailsTranslateTranslatedFocusTextEl.addEventListener('input', async () => {
            await fnUpdateTranslationLabels(detailsTranslateTranslatedFocusTextEl.value);
        });

        const regenTranslateBtnEl = focusTemplateDiv.querySelector('#focus-template-details-translate-regen-btn') as HTMLButtonElement;
        regenTranslateBtnEl.addEventListener('click', async () => {
            if (agent) {
                const rawAgentTranslation = await askAgentTranslateOneOff({
                    text,
                    agent,
                    contextSrcText: dialogSrcText,
                });
                // update the translation itself
                // HACK/TODO: we're assuming the text is in the foreign language and native language is
                // pre-fill translate texts
                if (rawAgentTranslation) { await fnUpdateTranslationLabels(rawAgentTranslation); }
            } else {
                await alertUser({
                    title: 'Doh',
                    msg: `There ain't no agent to do the translation! To use this translation feature, you have to set up an API key first. Go to contact me for more help. If you already have an API key and you have already reloaded the web site and can talk with agents in other contexts, then contact me and tell me about the bug. (E: 17386843536c7a4fd821e9882a15b525)`,
                });
            }
        });


        const languageOptionsCheckboxEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'typing-fullscreen-dialog-language-options-checkbox');
        if (agent && languageOptionsCheckboxEl.checked) {
            const rawAgentTranslation = await askAgentTranslateOneOff({
                text,
                agent,
                contextSrcText: dialogSrcText,
            });
            // update the translation itself
            // HACK/TODO: we're assuming the text is in the foreign language and native language is
            // pre-fill translate texts
            if (rawAgentTranslation) { await fnUpdateTranslationLabels(rawAgentTranslation); }
        }

        // const detailsTranslateNativeTargetTextEl = templateDiv.querySelector('#stimulus-gen-native-target') as HTMLTextAreaElement;
        const detailsTranslateTargetNativeCheckboxEl = focusTemplateDiv.querySelector('#focus-option-target-native') as HTMLInputElement;
        const detailsTranslateNativeTargetCheckboxEl = focusTemplateDiv.querySelector('#focus-option-native-target') as HTMLInputElement;
        // const detailsTranslateTargetTargetTextEl = templateDiv.querySelector('#stimulus-gen-target-target') as HTMLTextAreaElement;
        // const detailsTranslateTargetTargetCheckboxEl = templateDiv.querySelector('#focus-option-target-target') as HTMLInputElement;
        const detailsTranslateAddBtn = focusTemplateDiv.querySelector('#focus-template-translate-add-btn') as HTMLButtonElement;
        detailsTranslateAddBtn.addEventListener('click', async () => {
            const translatedText = detailsTranslateTranslatedFocusTextEl.value;
            if (!translatedText) {
                await alertUser({ title: 'doh', msg: 'need to add translation text' });
                return; /* <<<< returns early */
            }
            if (!detailsTranslateTargetNativeCheckboxEl.checked && !detailsTranslateNativeTargetCheckboxEl.checked) {
                await alertUser({ title: 'doh', msg: 'need to select one or more translation options.' });
                return; /* <<<< returns early */
            }
            if (detailsTranslateTargetNativeCheckboxEl.checked) {
                // translating direction is target -> native
                // (understanding/hearing foreign language)
                const stimulusEntry: Minigame_TypingStimulus = {
                    id: await getNewTypingEntryId(),
                    entryType: 'text',
                    variant: 'translate',
                    value: text,
                    expectedResponse: translatedText,
                    expectedResponseType: 'equivalent',
                    language,
                    focus: text,
                    notes: `auto-generated from user`,
                    timestampInTicks: getTimestampInTicks(),
                };
                await fnHandleStimuliGenerated([stimulusEntry]);
            }
            if (detailsTranslateNativeTargetCheckboxEl.checked) {
                // translating direction is native -> target
                // (speaking/typing foreign language)
                const stimulusEntry: Minigame_TypingStimulus = {
                    id: await getNewTypingEntryId(),
                    entryType: 'text',
                    variant: 'translate',
                    value: translatedText,
                    expectedResponse: text,
                    expectedResponseType: 'equivalent',
                    language,
                    focus: text,
                    notes: `auto-generated from user`,
                    timestampInTicks: getTimestampInTicks(),
                };
                await fnHandleStimuliGenerated([stimulusEntry]);
            }
            await fnOutroEl(detailsTranslateEl);
            // const stimulusEntry: Minigame_TypingStimulus = {
            //     id: await getNewTypingEntryId(),
            //     entryType: 'text',
            //     variant: 'parrot',
            //     value: text,
            //     expectedResponse: text,
            //     expectedResponseType: 'exact',
            //     language,
            //     focus: text,
            //     notes: `auto-generated from user`,
            //     timestampInTicks: getTimestampInTicks(),
            // };
            // await fnHandleStimuliGenerated([stimulusEntry]);
        });

        // #endregion translate

        return {
            focusText: text,
            textEl: focusTextEl,
            entryEl,
            deleteBtnEl,
            detailsParrotEl,
            detailsFitbEl,
            detailsTranslateEl,
        };

        // start entry
        // const entryEl = document.createElement('li');


        // the entry has 4 sections: focus text, options, btns (cmds), and
        // generated stimuli

        // focus text span
        // const focusTextEl = document.createElement('span')
        // focusTextEl.textContent = text;
        // entryEl.appendChild(focusTextEl);

        // // The options dictate what concrete stimuli to create when
        // // genStimuliBtnEl is clicked
        // const optionsDivEl = document.createElement('div');
        // entryEl.appendChild(optionsDivEl);

        // const btnsDivEl = document.createElement('div');
        // entryEl.appendChild(btnsDivEl);
        // // delete btn
        // const deleteBtnEl = document.createElement('button')
        // deleteBtnEl.textContent = '❌';
        // btnsDivEl.appendChild(deleteBtnEl);
        // // edit btn
        // const editBtnEl = document.createElement('button')
        // editBtnEl.textContent = '✎';
        // btnsDivEl.appendChild(editBtnEl);
        // // genStimuli btn
        // const genStimuliBtnEl = document.createElement('button')
        // genStimuliBtnEl.textContent = '➕';
        // btnsDivEl.appendChild(genStimuliBtnEl);

        // const stimuliEl = document.createElement('ul');
        // entryEl.appendChild(stimuliEl);



        // // stimuli container
        // const stimuli = document.createElement('ul')
        // entryEl.appendChild(editBtnEl);


        // return {
        //     text,
        //     textEl: focusTextEl,
        //     entryEl,
        //     deleteBtnEl,
        //     editBtnEl,
        //     genStimuliBtnEl,
        // };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * @returns atow 16-char substring of a hash (arbitrary)
 */
export async function getNewTypingEntryId(): Promise<string> {
    return (await getUUID()).substring(0, 16);
}

// export async function getTranslateText({
//     focusText,
//     focusLanguage,
//     nativeLanguage,
//     targetLanguage,
// }): Promise<string> {
//     trylogging
// }


export async function slideRightAndFade({
    el,
    durationMs = 500,
}: {
    el: HTMLElement,
    durationMs?: number,
}): Promise<void> {
    const lc = `[${slideRightAndFade.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 819e678e11526c6276a271999774b825)`); }

        if (!el) { throw new Error(`${lc} el required (E: b0332924f44330e71a87136e9128e725)`); }

        const width = el.offsetWidth;
        if (width === 0) {
            console.warn(`${lc} el has width 0, skipping animation. (W: b8e7284d7f9496f02a169602d8393a25)`);
            return;
        }

        el.style.transition = `transform ${durationMs}ms ease-in-out, opacity ${durationMs}ms ease-in-out`;
        el.style.transform = `translateX(${width}px)`;
        el.style.opacity = '0';

        // Wait for the transition to complete
        await new Promise(resolve => setTimeout(resolve, durationMs));

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function unfadeEl({
    el,
}: {
    el: HTMLElement,
}): Promise<void> {
    const lc = `[${unfadeEl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: bb9bd8bc8a887b2f461e19489e7d2825)`); }
        el.style.transition = ``;
        el.style.transform = ``;
        el.style.opacity = '1';
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
