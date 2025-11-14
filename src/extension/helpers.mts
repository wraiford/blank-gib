import { GoogleGenerativeAI } from '@google/generative-ai';

import { delay, extractErrorMsg, getSaferSubstring, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { ROOT, } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { Ib, } from '@ibgib/ts-gib/dist/types.mjs';
import { encodeStringToHexString } from '@ibgib/encrypt-gib/dist/helper.mjs';
import { fooClone } from '@ibgib/core-gib/dist/core-helper.mjs';
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { appendToTimeline, mut8Timeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';
import { createCommentIbGib, parseCommentIb } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';
import { getTjpAddr } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../constants.mjs';
import { IbGibGlobalThis_BlankGibExt } from "./types.ext.mjs";
import { SummarizerInfo, SummarizerType, SummarizerLength } from './chrome-ai.mjs';
/**
 * import type is required because we have a global const declaration as well,
 * which interferes at build time.
 */
import type { Summarizer, SummarizerCreateOptions, } from './chrome-ai.mjs';
import { sentenceSplitter } from '../common/minigame/typing/sentence-helper.mjs';
import { updateThinkingEntry } from './thinking-log.mjs';
import {
    CHUNK_REL8N_NAME_DEFAULT_DELIMITER, CHUNK_REL8N_NAME_PREFIX, CHUNK_ATOM,
    PROJECT_TJP_ADDR_PROPNAME,
    SUMMARY_TEXT_ATOM,
    TRANSLATION_TEXT_ATOM,
} from './constants.mjs';
import { DOMElementInfo, PageContentInfo } from './page-analyzer/page-analyzer-types.mjs';
import { ProjectIbGib_V1 } from '../common/project/project-types.mjs';
import { ChunkCommentAddlMetadataInfo, ChunkCommentData_V1, } from './types.mjs';
import { PROJECT_MAX_NAME_LENGTH } from '../common/project/project-constants.mjs';
import { getNodeTextContent_keepspaces } from './page-analyzer/page-analyzer-helpers.mjs';

const lc = '[extension][helpers]';
const logalot = GLOBAL_LOG_A_LOT || true;

export function getIbGibGlobalThis_BlankGibExt(): IbGibGlobalThis_BlankGibExt {
    return (globalThis as any).ibgib.blankgib_ext as IbGibGlobalThis_BlankGibExt;
}

export async function initIbGibGlobalThis_BlankGibExt(): Promise<void> {
    const lc = `[${initIbGibGlobalThis_BlankGibExt.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        if (!!(globalThis as any).ibgib) {
            console.log(`${lc} globalThis.ibgib already truthy.`);
        } else {
            (globalThis as any).ibgib = {};
        }

        if (!!(globalThis as any).ibgib.blankgib_ext) {
            console.log(`${lc} globalThis.ibgib.blankgib_ext already truthy.`);
        } else {
            (globalThis as any).ibgib.blankgib_ext = {
                // version: AUTO_GENERATED_VERSION, // don't have this in extension
            } satisfies IbGibGlobalThis_BlankGibExt;
        }

        if (logalot) {
            console.log(`${lc} console.dir(globalThis.ibgib)...`);
            console.dir((globalThis as any).ibgib);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getGlobalMetaspace_waitIfNeeded(
    {
        delayIntervalMs = 50,
        maxRetries = 100, // wait up to 5 seconds
    }: {
        delayIntervalMs?: number,
        maxRetries?: number,
    } = {})
    : Promise<MetaspaceService> {
    const lc = `[${getGlobalMetaspace_waitIfNeeded.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        let metaspace: MetaspaceService | undefined;
        let retries = 0;
        while (!metaspace) {
            if (getIbGibGlobalThis_BlankGibExt().metaspace) {
                metaspace = getIbGibGlobalThis_BlankGibExt().metaspace!;
            } else {
                retries++;
                if (retries > maxRetries) { throw new Error(`metaspace not initialized after ${maxRetries} retries.`); }
                if (logalot) { console.log(`${lc} metaspace still not initialized. delaying ${delayIntervalMs}ms... (retry #${retries})`); }
                await delay(delayIntervalMs);
            }
        }
        return metaspace;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Checks if the execution context has the built-in Summarizer API available.
 *
 * It also logs the result to the console for immediate feedback during development.
 *
 * @returns {Promise<boolean>} True if `Summarizer` is available, otherwise false.
 */
export async function isSummarizerApiAvailable(): Promise<boolean> {
    const lcCheck = `${lc}[isSummarizerApiAvailable]`;
    try {
        if ('Summarizer' in self) {
            console.log(`${lcCheck} >>> SUCCESS! The Summarizer API is available.`);
            return true;
        } else {
            console.error(`${lcCheck} >>> FAILURE: The Summarizer API is NOT available. Check your Chrome version and configuration.`);
            return false;
        }
    } catch (error) {
        console.error(`${lcCheck} Error checking for Summarizer API: ${error.message}`);
        return false;
    }
}

/**
 * Checks for the built-in LanguageModel API.
 */
export async function isLanguageModelApiAvailable(): Promise<boolean> {
    const lcCheck = `${lc}[isLanguageModelApiAvailable]`;
    try {
        if ('LanguageModel' in self) {
            console.log(`${lcCheck} >>> SUCCESS! The LanguageModel API is available.`);
            return true;
        } else {
            console.error(`${lcCheck} >>> FAILURE: The LanguageModel API is NOT available.`);
            return false;
        }
    } catch (error) {
        console.error(`${lcCheck} Error checking for LanguageModel API: ${error.message}`);
        return false;
    }
}

/**
 * Checks for the built-in LanguageDetector API.
 */
export async function isLanguageDetectorApiAvailable(): Promise<boolean> {
    const lcCheck = `${lc}[isLanguageDetectorApiAvailable]`;
    try {
        if ('LanguageDetector' in self) {
            console.log(`${lcCheck} >>> SUCCESS! The LanguageDetector API is available.`);
            return true;
        } else {
            console.error(`${lcCheck} >>> FAILURE: The LanguageDetector API is NOT available.`);
            return false;
        }
    } catch (error) {
        console.error(`${lcCheck} Error checking for LanguageDetector API: ${error.message}`);
        return false;
    }
}

/**
 * Checks for the built-in Translator API.
 */
export async function isTranslatorApiAvailable(): Promise<boolean> {
    const lcCheck = `${lc}[isTranslatorApiAvailable]`;
    try {
        if ('Translator' in self) {
            console.log(`${lcCheck} >>> SUCCESS! The Translator API is available.`);
            return true;
        } else {
            console.error(`${lcCheck} >>> FAILURE: The Translator API is NOT available.`);
            return false;
        }
    } catch (error) {
        console.error(`${lcCheck} Error checking for Translator API: ${error.message}`);
        return false;
    }
}

export async function testOtherApis(): Promise<void> {
    const lc = `[${testOtherApis.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 036f4a36d68b2f70364743988e9b9825)`); }

        console.log('helper-gib test waiting 1 second...');
        await delay(1000);
        console.log('helper-gib test done waiting.');

        let ibGib: IbGib_V1 = ROOT;
        let addr = getIbGibAddr({ ibGib });
        console.log(`${lc} ts-gib test getIbGibAddr result: ${addr}`);

        let clone = fooClone(ibGib);
        addr = getIbGibAddr({ ibGib: clone });
        console.log(`${lc} core-gib test getIbGibAddr of fooClone result: ${addr}`);

        let str = 'some string';
        let hexString = await encodeStringToHexString(str);
        console.log(`${lc} encrypt-gib test hexString: ${hexString}`)

        const apiKey = ''; // what happens if empty?
        try {
            const ai = new GoogleGenerativeAI(apiKey);
            if (ai) {
                console.log(`${lc} @google/generative-ai test truthy ai`);
            } else {
                throw new Error(`ai is falsy, maybe expected? (E: b0dfea4ddba8cf5ce154e1880ed4a825)`);
            }
        } catch (error) {
            console.log(`${lc} google test, maybe is ok if google error because we're calling ctor of GoogleGenerativeAI with an empty apiKey arg. actual error thrown: ${extractErrorMsg(error)}`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getSummarizerInfo({
    summarizer,
}: {
    summarizer: Summarizer,
}): SummarizerInfo {
    return {
        sharedContext: summarizer.sharedContext,
        expectedContextLanguages: summarizer.expectedContextLanguages,
        expectedInputLanguages: summarizer.expectedInputLanguages,
        format: summarizer.format,
        inputQuota: summarizer.inputQuota,
    }
}

/**
 * small helper to build the key for a summary text that will be stored on an ibGib.data.
 *
 * basically concatenates "text" prefix with the type and length, underscore-delimited
 *
 * @example `text_tldr_short` or `text_headline_long`
 */
export function getSummaryTextKeyForIbGib({
    type,
    length,
    delimiter = '_',
}: {
    type: SummarizerType,
    length: SummarizerLength,
    /**
     * @default '_' (single underscore)
     */
    delimiter?: string,
}): string {
    delimiter ??= '_';
    return [
        SUMMARY_TEXT_ATOM, type, length
    ].join(delimiter);
}

/**
 * Builds the key for a translation text that will be stored on an ibGib.data.
 *
 * @example `translationtext__text__es` or `translationtext__summarytext_tldr_short__en-US`
 */
export function getTranslationTextKeyForIbGib({
    dataKey,
    targetLanguage,
    delimiter = '__',
}: {
    /**
     * This is the key/path into ibGib.data that contains the text we are
     * referring to for our translation text.
     *
     * implementation should anticipate that both of the args {@link dataKey}
     * AND {@link targetLanguage} may contain SINGLE underscores.
     */
    dataKey: string,
    /**
     * this is the language into which we are translating the text found at
     * ibGib.data[{@link dataKey}]
     */
    targetLanguage: string,
    /**
     * @default '__' (double underscore)
     */
    delimiter?: string,
}): string {
    delimiter ??= '__';
    return [
        TRANSLATION_TEXT_ATOM, dataKey, targetLanguage
    ].join(delimiter);
}

export async function getSummary({
    summarizer,
    text,
    context,
    thinkingId,
}: {
    summarizer: Summarizer,
    text: string,
    context?: string,
    thinkingId?: string,
}): Promise<string> {
    const lc = `[${getSummary.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 319df8c1af4f9d02c834f9b709f2c225)`); }

        const { inputQuota } = getSummarizerInfo({ summarizer });
        let quotaAdjustFactor = 0.4;
        let maxLength = Math.floor(inputQuota * quotaAdjustFactor);


        let shortener: Summarizer | undefined = undefined;
        /**
         * text is too long. so we're going to break it down with as much detail
         * as possible. Because of this, we will use a different summarizer
         * because we want to retain as much detail as possible before our final
         * summary that will be done by the incoming summarizer
         */
        const fnShorten = async (str: string) => {
            if (!shortener) {
                const opts: SummarizerCreateOptions = {
                    type: 'key-points',
                    // expectedInputLanguages: summarizer.expectedInputLanguages,
                    format: 'plain-text',
                    length: 'long',
                };
                if (summarizer.sharedContext) {
                    opts.sharedContext = summarizer.sharedContext;
                }
                shortener = await Summarizer.create(opts);
            }

            /** blocks sized by input quota */
            const blocks: string[] = [];
            /** aggregating block, sentence by sentence */
            let currentBlock: string = '';
            // break into sentences first, then build up blocks of sentences
            // until we hit maxLength
            const sentences = sentenceSplitter.split(str).filter(x => !!x);
            for (const sentence of sentences) {
                if (currentBlock.length + sentence.length <= maxLength) {
                    currentBlock += sentence;
                } else {
                    blocks.push(currentBlock.concat());
                    currentBlock = sentence;
                }
            }

            // add the last block
            if (currentBlock.length > 0) {
                blocks.push(currentBlock);
                currentBlock = '';
            }

            const summaryBlocks: string[] = [];
            for (const block of blocks) {
                if (thinkingId) { updateThinkingEntry(thinkingId, `shortening block: ${block.length}`); }
                const summary = await shortener.summarize(block);
                if (thinkingId) { updateThinkingEntry(thinkingId, `shortened block: ${summary.length}`); }
                summaryBlocks.push(summary);
            }

            const shortenedText = summaryBlocks.join(' ');
            return shortenedText;
        }

        let textToSummarize = text;
        if (textToSummarize.length > maxLength) {
            if (thinkingId) {
                updateThinkingEntry(thinkingId, `Text to summarize too big (length: ${textToSummarize.length}), breaking it down even further...`);
            }
            textToSummarize = await fnShorten(textToSummarize);
        }

        // at this point, textToSummarize is within the maxLength
        const summary = await summarizer.summarize(textToSummarize, { context });
        return summary;
    } catch (error) {
        debugger; // error in getSummary built-in AI
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * navigator.userInteraction.isActive is true after first summarizer call but
 * false in second languageModel test call. I'm seeing if it fails if both in
 * the same method.
 */
export async function testSummarizerANDLanguageModelInOneCall(): Promise<void> {
    const lc = `[${testSummarizerANDLanguageModelInOneCall.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 0074736c84b8dd6d38da2e482af3e825)`); }

        console.log(`${lc} navigator.userActivation.isActive: ${navigator.userActivation.isActive}`,)

        const availabilitySummarizer = await Summarizer.availability();
        console.log(`availabilitySummarizer: ${availabilitySummarizer}`);
        let availabilityLanguageModel = await LanguageModel.availability();
        console.log(`availabilityLanguageModel (immediately): ${availabilityLanguageModel}`);
        if (availabilitySummarizer === 'unavailable') {
            console.log(`${lc} summarizer api unavailable. skipping test.`);
            return;
        }

        const summarizer = await Summarizer.create({
            format: 'plain-text',
            type: 'key-points',
            expectedInputLanguages: ["en-US"],
            outputLanguage: "en-US",
        });
        console.log(`${lc} summarizer info: ${pretty(getSummarizerInfo({ summarizer }))} (I: aa4bb85aa1cc6aa9082c2198a0301125)`);

        const text = 'This is a long text that needs summarization. It is a very long text, with many words. It is so long that it is hard to read. It is a good candidate for summarization.';
        const summary = await summarizer.summarize(text);
        console.log(`${lc} summary: ${summary}`);

        console.log(`${lc} navigator.userActivation.isActive: ${navigator.userActivation.isActive}`,)

        availabilityLanguageModel = await LanguageModel.availability();
        console.log(`availabilityLanguageModel (after summarizer): ${availabilityLanguageModel}`);
        if (availabilityLanguageModel === 'unavailable') {
            console.log(`${lc} language model api unavailable. skipping test.`);
            return;
        }

        const session = await LanguageModel.create();
        const response = await session.prompt('give me a good knock knock joke');
        console.log(`${lc} knock knock joke response: ${response}`);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }

}

export async function testSummarizer() {
    const lc = `[${testSummarizer.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 7aefb8039b9830637ede092d65018825)`); }

        if (logalot) { console.log(`${lc} starting...`); }

        console.log(`${lc} navigator.userActivation.isActive: ${navigator.userActivation.isActive}`,)

        const availability = await Summarizer.availability();
        if (availability === 'unavailable') {
            console.log(`${lc} summarizer api unavailable. skipping test.`);
            return;
        }

        const summarizer = await Summarizer.create({
            format: 'plain-text',
            type: 'key-points',
            expectedInputLanguages: ["en-US"],
            outputLanguage: "en-US",
        });
        const summary = await summarizer.summarize('This is a long text that needs summarization. It is a very long text, with many words. It is so long that it is hard to read. It is a good candidate for summarization.');
        console.log(`${lc} summary: ${summary}`);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        // throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }

}

export async function testLanguageModel() {
    const lc = `[${testLanguageModel.name}]`;
    if (logalot) { console.log(`${lc} starting... (I: 691b78df0dc64e58ad91a78c53f38525)`); }
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        console.log(`${lc} navigator.userActivation.isActive: ${navigator.userActivation.isActive}`,)

        const availability = await LanguageModel.availability();
        if (availability === 'unavailable') {
            console.log(`${lc} language model api unavailable. skipping test.`);
            return;
        }

        const session = await LanguageModel.create();
        const response = await session.prompt('give me a good knock knock joke');
        console.log(`${lc} knock knock joke response: ${response}`);

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function pingMetaspace(): Promise<void> {
    const lc = `[pingMetaspace]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        if (metaspace) {
            console.log(`${lc} metaspace seems to be initialized. (I: c4526844f54391f08e048848d110a825)`);
            console.log(`${lc} metaspace.zeroSpace addr: ${getIbGibAddr({ ibGib: metaspace.zeroSpace })}`);
        } else {
            throw new Error(`metaspace not initialized (E: 7acca8fd4cc8f7b6e980ec4865ca4925)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * builds a rel8nName that indicates the relationship is a chunk according to
 * some {@link contextScope}.
 *
 * @returns concatenated rel8nName for chunk according to {@link contextScope}
 */
export function getChunkRel8nName({
    contextScope,
    delimiter = CHUNK_REL8N_NAME_DEFAULT_DELIMITER,
}: {
    contextScope: string,
    delimiter?: string,
}): string {
    const lc = `[${getChunkRel8nName.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c3d6198123621c257863fac5569ace25)`); }

        if (!delimiter) {
            console.error(`${lc} delimiter is falsy, which is a no-no. error but this isn't being thrown. Instead, delimiter is being set to default (${CHUNK_REL8N_NAME_DEFAULT_DELIMITER}). (E: 343e67d56af89d6648a42b5582f5df25)`);
            delimiter = CHUNK_REL8N_NAME_DEFAULT_DELIMITER;
        }
        if (contextScope.includes(delimiter)) {
            throw new Error(`contextScope (${contextScope}) includes delimiter (${delimiter}) (E: 366ce88d637a35e7d861534811249825)`);
        }

        const safeName = getSaferSubstring({
            text: contextScope,
            replaceMap: {
                ' ': '__',
            }
        });

        const resRel8nName = [CHUNK_REL8N_NAME_PREFIX, safeName].join(delimiter);

        if (logalot) { console.log(`${lc} resRel8nName: ${resRel8nName} (I: ee4d6987ea685ee798f73c15bfe66e25)`); }

        return resRel8nName;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Creates the underscore-delimited string for a chunk's metadata.
 * NOTE: This must match the {@link parseChunkCommentAddlMetadataText}
 */
export function getChunkCommentAddlMetadataText({
    gibId,
}: ChunkCommentAddlMetadataInfo): string {
    const lc = `[${getChunkCommentAddlMetadataText.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d0ae29dafc03310cf87de8d850c6be25)`); }
        if (!gibId) { throw new Error(`(UNEXPECTED) gibId falsy? (E: 85af54b41a3a7611780cdf88c2bdb125)`); }

        /**
         * must be in the same order as the parse function
         */
        return [
            CHUNK_ATOM,
            getSaferSubstring({ text: gibId, length: 64, replaceMap: { '^': '' } }),
        ].join('_');
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function isChunkCommentIb({
    ib,
}: {
    ib: Ib,
}): boolean {
    const lc = `[${isChunkCommentIb.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 988ee81a151ada6e9832aca8fc9d9e25)`); }

        let result: boolean;
        try {
            const { safeIbCommentMetadataText } = parseCommentIb({ ib });
            if (safeIbCommentMetadataText) {
                const resultParse = parseChunkCommentAddlMetadataText({
                    addlMetadataText: safeIbCommentMetadataText,
                });
                result = !!resultParse;
            } else {
                result = false;
            }
        } catch (error) {
            result = false;
        }
        return result;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Parses the underscore-delimited metadata string from a chunk's ibGib.
 * It assumes the last part is always the index.
 *
 * NOTE: This must match the {@link getChunkCommentAddlMetadataText}
 */
export function parseChunkCommentAddlMetadataText({
    addlMetadataText,
}: {
    addlMetadataText: string,
}): ChunkCommentAddlMetadataInfo | undefined {
    const lc = `[${parseChunkCommentAddlMetadataText.name}]`;
    if (!addlMetadataText) { return undefined; }
    try {
        const EXPECTED_PARTS_CHUNK_COMMENT_ADDL_METADATA_TEXT = 2;
        const parts = addlMetadataText.split('_');
        if (parts.length !== EXPECTED_PARTS_CHUNK_COMMENT_ADDL_METADATA_TEXT) {
            throw new Error(`invalid addlMetadataText. should have ${EXPECTED_PARTS_CHUNK_COMMENT_ADDL_METADATA_TEXT} parts: atom, gibId (E: c7f568b756c84301e8559e088759b825)`);
        }

        /**
         * must be in the same order as the get function
         */
        const [
            atom,
            gibId,
        ] = parts;

        if (atom !== CHUNK_ATOM) {
            throw new Error(`invalid addlMetadataText. atom is not "${CHUNK_ATOM}" (E: 1d0bd5ec44abc3d79daebb481dbee825)`);
        }

        return { atom, gibId, };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        return undefined; // error on parsing
    }
}

/**
 * Factory function that maps incoming {@link domNodesOrStrings} to chunk comment ibgibs.
 *
 * if {@link recursive} is set, then this recursively iterates {@link domNodesOrStrings}
 * to create the entire tree of comment ibgibs that correspond to a tree of
 * DOMElementInfo nodes.
 *
 * This is the core function for transforming the user-curated DOM twin tree
 * into a persistent, hierarchical structure of ibgibs.
 *
 * ## intent
 *
 * the src root dom info is a special case since the project ibgib actually forks *FROM* this
 * comment ibgib. So this fn creates the src root comment chunk ibgib and then
 * immediately forks the project from it. then its children/grandchildren will
 * be created with project being set.
 *
 * @returns A promise that resolves to an array of the top-level comment ibgibs created.
 */
export async function createChunkCommentIbGibs({
    domNodesOrStrings,
    parentCommentIbGib,
    project,
    recursive,
    metaspace,
    space,
}: {
    /**
     * The DOM twin node(s) to convert into comment ibgibs.
     */
    domNodesOrStrings: DOMElementInfo | string | (DOMElementInfo | string)[],
    /**
     * The immediate parent for the ibgibs that will be created.
     * If creating the absolute root source ibgib, this should be undefined.
     */
    parentCommentIbGib?: CommentIbGib_V1,
    /**
     * The project that these chunks belong to.
     * Optional because the root chunk is created before the project exists.
     */
    project?: ProjectIbGib_V1,
    /**
     * If true, will recursively create comment ibgibs for all descendants.
     */
    recursive: boolean,
    metaspace: MetaspaceService,
    space: IbGibSpaceAny,
}): Promise<CommentIbGib_V1[]> {
    const lc = `[${createChunkCommentIbGibs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        const nodesArray = Array.isArray(domNodesOrStrings) ? domNodesOrStrings : [domNodesOrStrings];
        const createdIbGibs: CommentIbGib_V1[] = [];

        for (let i = 0; i < nodesArray.length; i++) {
            const node = nodesArray[i];

            let text: string;
            let title: string;
            let gibId: string;
            let domInfo: DOMElementInfo;

            if (typeof node === 'string') {
                // node is a string, so our comment ibgib is just the text and
                // uses the parent for the domInfo
                if (!parentCommentIbGib) {
                    throw new Error(`(UNEXPECTED) node is a string but parentCommentIbGib falsy? (E: 01a07898a8e82e1ec8679b32e382e825)`);
                }
                if (!parentCommentIbGib.data) { throw new Error(`(UNEXPECTED) parentCommentIbGib.data falsy? (E: cbc79f9da818d785a856239817250825)`); }
                domInfo = (parentCommentIbGib.data as ChunkCommentData_V1).domInfo;
                if (logalot) { console.log(`${lc} node is a string, using parent domInfo: ${pretty(domInfo)} (I: 3a183884e428e2a67de7a4f8b3f45a25)`); }
                text = node;
                title = text.substring(0, 64);
                gibId = domInfo.gibId;
            } else {
                // node is a DOMElementInfo
                text = getNodeTextContent_keepspaces(node);
                title = node.headingInfo?.headingText || text.substring(0, 64);
                gibId = node.gibId;
                domInfo = node;
            }

            const addlMetadataText = getChunkCommentAddlMetadataText({
                atom: CHUNK_ATOM,
                gibId,
            });
            if (text.replace(/\s+/g, '').trim() === '') {
                text = '[empty text?]';
            }
            /** contains no dom-specific info yet */
            const resFirstGenComment = await createCommentIbGib({
                text,
                addlMetadataText,
                saveInSpace: true,
                space,
            });
            let chunkCommentIbGib = resFirstGenComment.newIbGib as CommentIbGib_V1;
            await metaspace.registerNewIbGib({ ibGib: chunkCommentIbGib, space });

            // 2. Mutate the timeline to add our new, simpler data model.
            const dataToAdd: Partial<ChunkCommentData_V1> = {
                title,
                /**
                 * All chunks created from this function map to the DOM.
                 */
                isSynthetic: false,
                domInfo,
            };

            if (project) {
                dataToAdd[PROJECT_TJP_ADDR_PROPNAME] =
                    getTjpAddr({ ibGib: project, defaultIfNone: 'incomingAddr' })!;
            }

            if (typeof node === 'string') {
                dataToAdd.isTextOnly = true;
            }

            chunkCommentIbGib = await mut8Timeline({
                timeline: chunkCommentIbGib,
                mut8Opts: { dataToAddOrPatch: dataToAdd },
                metaspace,
                space,
                skipLock: true, // It's a new timeline, no lock needed.
            });

            // 3. If recursive, create and relate all children.
            if (recursive && typeof node !== 'string' && node.content.length > 0) {
                const grandChildCommentIbGibs = await createChunkCommentIbGibs({
                    domNodesOrStrings: node.content,
                    parentCommentIbGib: chunkCommentIbGib,
                    project,
                    recursive: true,
                    metaspace,
                    space,
                });

                if (grandChildCommentIbGibs.length !== node.content.length) {
                    throw new Error(`(UNEXPECTED) grandChildCommentIbGibs.length !== node.content.length? (E: 37a992911d0d3b1ec9255d1b6721c825)`);
                }

                chunkCommentIbGib = await appendToTimeline({
                    timeline: chunkCommentIbGib,
                    rel8nInfos: [{
                        rel8nName: getChunkRel8nName({ contextScope: 'default' }),
                        ibGibs: grandChildCommentIbGibs,
                    }],
                    metaspace,
                    space,
                }) as CommentIbGib_V1;
            }

            createdIbGibs.push(chunkCommentIbGib);
        }

        return createdIbGibs;

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

// /**
//  * Creates child chunks from a given {@link srcCommentIbGib}.
//  *
//  * This function is recursive.
//  * - If {@link srcCommentIbGib} is the root source comment (i.e., not a chunk
//  *   itself), this will create the initial child chunks based on the parsed
//  *   {@link pageContentInfo}.
//  * - If {@link srcCommentIbGib} is ALREADY a chunk, this will use the Summarizer
//  *   API to break down that chunk's own text content into key-point headlines,
//  *   which become the sub-chunks.
//  */
// export async function chunkCommentIbGib({
//     srcCommentIbGib,
//     pageContentInfo,
//     project,
//     metaspace,
//     space,
//     thinkingId,
//     skipLock,
// }: {
//     srcCommentIbGib: CommentIbGib_V1,
//     /**
//      * Required if the srcCommentIbGib is the root source comment.
//      * If srcCommentIbGib is a chunk itself, this is ignored.
//      */
//     pageContentInfo?: PageContentInfo,
//     project: ProjectIbGib_V1,
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny,
//     thinkingId: string,
//     /**
//      * IIF {@link srcCommentIbGib} is new, then we can safely skip locking its
//      * timeline. Otherwise, this should be falsy.
//      */
//     skipLock: boolean,
// }): Promise<[newSrcCommentIbGib: CommentIbGib_V1, chunkCommentIbGibs: CommentIbGib_V1[]]> {
//     const lc = `[${chunkCommentIbGib.name}]`;
//     try {
//         throw new Error(`not implemented since we're pivoting to the dom tree builder (E: a2507c557b48c36f58f47b084964f925)`);
//         // if (logalot) { console.log(`${lc} starting...`); }

//         // if (!srcCommentIbGib.data) { throw new Error(`(UNEXPECTED) srcCommentIbGib.data falsy? (E: db24a847dd8aa7096d6737c81b665325)`); }
//         // if (!project.data) { throw new Error(`(UNEXPECTED) project.data falsy? (E: cfa941764078067e5833e79cc9f14825)`); }

//         // let chunks: SemanticChunkInfo[] = [];
//         // const isSrcIbGibAChunk = isChunkCommentIb({ ib: srcCommentIbGib.ib });

//         // if (isSrcIbGibAChunk) {
//         //     // RECURSIVE CASE: The source is a chunk. Use the Summarizer API to create sub-chunks.
//         //     const parentText = srcCommentIbGib.data.text ?? '';
//         //     if (logalot) { console.log(`${lc} source is a chunk. breaking down via Summarizer (text length: ${parentText.length}).`); }
//         //     updateThinkingEntry(thinkingId, `Summarizing chunk into key points...`);

//         //     const summarizer = await Summarizer.create({ type: 'key-points', length: 'long', format: 'plain-text' });
//         //     const keyPointsSummary = await getSummary({ summarizer, text: parentText, thinkingId });

//         //     // The summary is a single string with newline-separated points.
//         //     const headlines = keyPointsSummary.split('\n')
//         //         .map(line => line.replace(/^- /, '').trim()) // remove leading list markers
//         //         .filter(line => line.length > 0);

//         //     chunks = headlines.map((headline) => {
//         //         // This gibId is local to this sub-chunking, not a DOM element.
//         //         const gibId = `sub-${pickRandom_Letters({ count: 12 })}`;
//         //         const resChunk: SemanticChunkInfo = {
//         //             gibId,
//         //             title: headline, // The headline is both title and text.
//         //             text: headline,
//         //             tags: ['p'],
//         //         };
//         //         return resChunk;
//         //     });
//         // } else {
//         //     // ROOT CASE: This is the first breakdown. Use the pageContentInfo from DOM parsing.
//         //     if (!pageContentInfo) { throw new Error(`pageContentInfo is required when chunking the root source comment. (E: 2a9b4c0d4e98f0b7e2d9b4c0d4e98f0b)`); }
//         //     if (logalot) { console.log(`${lc} source is the root. breaking down pageContentInfo.`); }
//         //     chunks = pageContentInfo.bestCandidate.chunks ?? [];
//         // }

//         // if (chunks.length === 0) {
//         //     updateThinkingEntry(thinkingId, `No further sub-chunks could be created. This branch is a leaf.`, true, true);
//         //     return [srcCommentIbGib, []];
//         // }

//         // const chunkCommentIbGibs: CommentIbGib_V1[] = [];
//         // updateThinkingEntry(thinkingId, `Creating ${chunks.length} new sub-chunk(s)...`);

//         // for (let i = 0; i < chunks.length; i++) {
//         //     const chunkCommentIbGib = await getChunkCommentIbGib({
//         //         chunk: chunks[i],
//         //         chunkIdx: i,
//         //         srcCommentIbGib,
//         //         project,
//         //         metaspace,
//         //         space,
//         //         skipLock,
//         //     });
//         //     chunkCommentIbGibs.push(chunkCommentIbGib);
//         // }

//         // const newSrcCommentIbGib = await appendToTimeline({
//         //     timeline: srcCommentIbGib,
//         //     rel8nInfos: [{
//         //         rel8nName: getChunkRel8nName({ contextScope: 'default' }),
//         //         ibGibs: chunkCommentIbGibs,
//         //     }],
//         //     metaspace,
//         //     space,
//         //     skipLock,
//         // }) as CommentIbGib_V1;

//         // return [newSrcCommentIbGib, chunkCommentIbGibs];
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         if (thinkingId) { updateThinkingEntry(thinkingId, `Error while breaking down: ${extractErrorMsg(error)}`, true, true); }
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

let _titleMaker: Promise<Summarizer> | undefined = undefined;
export async function getTitleMaker(): Promise<Summarizer> {
    if (!_titleMaker) {
        _titleMaker = Summarizer.create({
            format: 'plain-text',
            length: 'short',
            type: 'headline',
        });
    }
    return _titleMaker;
}

export async function getTitleFromSummarizer({
    content,
    useCaseDescription,
    thinkingId,
}: {
    content: string
    useCaseDescription?: string,
    thinkingId?: string,
}): Promise<string> {
    const lc = `[${getTitleFromSummarizer.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: e2e4b8af5736cab338da6d98103f7825)`); }

        const MAX_TITLE_MAKER_INCOMING_STRING_LENGTH = 816;
        const titleSrcStr =
            content.length <= MAX_TITLE_MAKER_INCOMING_STRING_LENGTH ?
                content :
                content.substring(0, MAX_TITLE_MAKER_INCOMING_STRING_LENGTH);
        const titleMaker = await getTitleMaker();
        const context = !!useCaseDescription ?
            `Provide an extremely short title for this content that will be used for ${useCaseDescription}.` :
            'Provide an extremely short title for this content.';
        const title = await getSummary({
            summarizer: titleMaker,
            context,
            text: titleSrcStr,
            thinkingId,
        });

        return title;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Extracts the title from the page content if available (saferized), else
 * generates via summary.
 */
export async function getProjectTitleFromPageOrContent({
    pageContentInfo,
    content,
    thinkingId,
}: {
    pageContentInfo: PageContentInfo,
    content: string,
    thinkingId?: string,
}): Promise<string> {
    const lc = `[${getProjectTitleFromPageOrContent.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        let title: string;

        if (pageContentInfo.title) {
            // Use the title from the page extractor if it exists
            if (thinkingId) { updateThinkingEntry(thinkingId, 'Using extracted page title...'); }

            title = getSaferSubstring({
                text: pageContentInfo.title,
                length: PROJECT_MAX_NAME_LENGTH,
                keepLiterals: [' ', '-', '_', '.'],
            });
        } else {
            // Otherwise, fall back to AI-based title generation
            if (thinkingId) { updateThinkingEntry(thinkingId, 'No title found, generating with AI...'); }
            title = await getTitleFromSummarizer({
                content,
                thinkingId,
                useCaseDescription: 'creating a project',
            });
        }
        return title;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * Generates a short, readable header string suitable for a "Table of Contents" view
 * from a given ibGib. It prioritizes the `ibGib.data.title` field and falls
 * back to a truncated snippet of `ibGib.data.text`.
 */
export function getTocHeader_FromIbGib({
    ibGib,
    maxLength = 65,
    defaultText = '[no content]',
}: {
    ibGib: IbGib_V1 | undefined,
    maxLength?: number,
    defaultText?: string,
}): string {
    const lc = `[${getTocHeader_FromIbGib.name}]`;
    try {
        if (!ibGib?.data) { return defaultText; }

        // Prefer the explicit title if it exists. Titles are intentional and shouldn't be truncated.
        if (typeof ibGib.data.title === 'string' && ibGib.data.title.length > 0) {
            return ibGib.data.title;
        }

        // If no title, create a snippet from the text content.
        if (typeof ibGib.data.text === 'string' && ibGib.data.text.length > 0) {
            const text = ibGib.data.text;
            if (text.length > maxLength) {
                // A simple substring is unicode-friendly and avoids complex regex.
                return `${text.substring(0, maxLength).trim()}...`;
            } else {
                return text;
            }
        }

        // If no title and no text, return the default.
        return defaultText;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        // It's a UI helper, so returning a safe string is better than throwing.
        return ibGib?.data?.text?.substring(0, 64) || `[error generating header]`;
    }
}
