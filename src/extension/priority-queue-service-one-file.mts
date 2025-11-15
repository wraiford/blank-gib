import { extractErrorMsg, pickRandom_Letters, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { mut8Timeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";

import { GLOBAL_LOG_A_LOT } from "../constants.mjs";
import { SummarizerFormat, SummarizerLength, SummarizerType } from "./chrome-ai.mjs";
import { updateThinkingEntry } from "./thinking-log.mjs";
import {
    getGlobalMetaspace_waitIfNeeded, getSummary, getSummaryTextKeyForIbGib,
    getTranslationTextKeyForIbGib
} from "./helpers.mjs";


/**
 * @see {@link PriorityQueueInfo.priority}
 */
export const QUEUE_SERVICE_PRIORITY_USER_JUST_CLICKED = 1;
/**
 * @see {@link PriorityQueueInfo.priority}
 */
export const QUEUE_SERVICE_PRIORITY_SUMMARY_TITLE = 10;
/**
 * @see {@link PriorityQueueInfo.priority}
 */
export const QUEUE_SERVICE_PRIORITY_BACKGROUND = 100;

export type TaskStatus = 'queued' | 'started' | 'complete' | 'errored';

/**
 * Information for a summary task.
 */
export interface SummaryQueueInfo {
    /**
     */
    id?: string;
    /**
     * text to summarize
     */
    text: string;
    /**
     * @see {@link SummarizerType}
     */
    type: SummarizerType;
    /**
     * set to true if we are setting ibGib.data.title
     */
    isTitle?: boolean;
    /**
     * @see {@link SummarizerLength}
     */
    length: SummarizerLength;
    /**
     * @default 'plain-text'
     * @see {@link SummarizerFormat}
     */
    format?: SummarizerFormat;
    /**
     * @optional context to pass to summarizer
     */
    context?: string;
}

/**
 * Information for a translation task.
 */
export interface TranslationQueueInfo {
    /**
     * actual text to be translated
     */
    text: string;
    /**
     * the key into ibgib.data for the translated text. IOW, {@link text} should
     * be `ibGib.data[dataKey]`.
     *
     * {@see getTranslationTextKeyForIbGib}
     */
    dataKey: string;
    /**
     * The language of {@link text}
     */
    sourceLanguage: string;
    /**
     * The language into which we are translating {@link text}
     *
     * {@see getTranslationTextKeyForIbGib}
     */
    targetLanguage: string;
}

/**
 * maybe yagni, but to show we can use the priority queue for anon fns related
 * to priority.
 */
export interface AnonFnQueueInfo {
    /**
     * fn to execute when the priority queue gets to this item
     */
    fn: (info: PriorityQueueInfo) => Promise<void>;
}

export type PriorityQueueInfoOptions =
    | SummaryQueueInfo
    | TranslationQueueInfo
    | AnonFnQueueInfo
    ;

export type PriorityQueueType = 'summary' | 'translation' | 'anon-fn';

export interface PriorityQueueInfo {
    /**
     * this is set once the item is added to the queue.
     */
    id?: string;
    /**
     * this is set once the item is added to the queue.
     */
    status?: TaskStatus;
    /**
     * discriminator
     */
    type: PriorityQueueType;
    /**
     * lower is more urgent
     */
    priority: number;
    /**
     * the ibgib we're summarizing
     */
    ibGib: IbGib_V1;
    /**
     * specific options for the priority queue.
     *
     * ## notes
     *
     *initially, we're just doing summarizing, but this priority queue could be
     *expanded to other things, including just a general-purpose fn execution
     *(as long as it's related to priority and an ibGib).
     */
    options: PriorityQueueInfoOptions;
    /**
     * provided here for convenience only
     */
    metaspace?: MetaspaceService;
    /**
     * space in which the {@link ibGib} resides
     * @default localUserSpace from metaspace
     */
    space?: IbGibSpaceAny;
    /**
     * if truthy, will add an entry. Will NOT create an entry if falsy.
     */
    thinkingId?: string;
    result?: any;
    fnOnQueued?: (info: PriorityQueueInfo) => Promise<void>;
    fnOnComplete?: (info: PriorityQueueInfo) => Promise<void>;
    fnOnError?: (info: PriorityQueueInfo, error: any) => Promise<void>;
}

// Add this code below the existing interface definitions

const lc = `[PriorityQueueService]`;
const logalot = GLOBAL_LOG_A_LOT || true;

/**
 * A singleton service to manage a queue of tasks, primarily for interacting
 * with on-device AI models like the Summarizer. It ensures that tasks are
 * executed one at a time and in order of priority.
 */
class PriorityQueueService {
    private lc: string = `${lc}[svc]`;
    private queue: PriorityQueueInfo[] = [];
    private isProcessing: boolean = false;

    /**
     * Adds an item to the processing queue and starts the processing loop if it's not already running.
     * The queue is sorted by priority after each item is added.
     *
     * @param info The information for the task to be enqueued.
     */
    public enqueue(info: PriorityQueueInfo): void {
        const lc = `${this.lc}[${this.enqueue.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: beb3980fa4d6406b443a2f4d499fd525)`); }

            info.id ??= pickRandom_Letters({ count: 8 });
            if (!info.status) {
                info.status = 'queued';
            } else {
                throw new Error(`(UNEXPECTED) info.status (${info.status}) already truthy? This is expected to be falsy when enqueueing (E: c08346c19a84a913870351687b546425)`);
            }

            if (logalot) { console.log(`${lc} adding to queue new item with priority ${info.priority} (I: genuuid)`); }

            this.queue.push(info);

            if (info.fnOnQueued) {
                info.fnOnQueued(info)
                    .catch(e => {
                        console.error(`${lc}[info.fnOnQueued] ${extractErrorMsg(e)}`);
                    }); // spins off
            }

            // sort will happen in processing loop

            // If we aren't already processing, kick off the loop.
            if (!this.isProcessing) {
                this.startProcessingQueue();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private sortQueue(): void {
        const lc = `${this.lc}[${this.sortQueue.name}]`;
        try {
            // Sort the queue after adding a new item. Lower priority numbers are processed first.
            this.queue.sort((a, b) => a.priority - b.priority);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {

        }
    }

    /**
     * Processes items from the queue one by one until the queue is empty.
     * Sets `this.isProcessing` to true while active and false when the queue is clear.
     */
    private async startProcessingQueue(): Promise<void> {
        const lc = `${this.lc}[${this.startProcessingQueue.name}]`;

        // check isProcessing before the following try..finally block, because
        // finally sets isProcessing to false
        if (this.isProcessing) {
            if (logalot) { console.log(`${lc} already processing. bailing.`); }
            return; /* <<<< returns early */
        }

        try {
            if (this.queue.length === 0) {
                if (logalot) { console.log(`${lc} queue is empty. stopping.`); }
                return; /* <<<< returns early */
            }

            if (logalot) { console.log(`${lc} starting... queue length: ${this.queue.length}`); }
            this.isProcessing = true;

            // Dequeue the highest-priority item (at the front of the sorted array).
            this.sortQueue();
            let item: PriorityQueueInfo | undefined = this.queue.shift();
            while (!!item) {
                try {
                    if (logalot) { console.log(`${lc} processing item (priority ${item.priority})...`); }

                    // Check the type of the task and execute it.
                    // For now, we only have Summarizer tasks, but this is extensible.
                    switch (item.type) {
                        case 'summary':
                            await this.processQueue_summarize(item);
                            break;
                        case 'translation': // Add this case
                            await this.processQueue_translate(item);
                            break;
                        case 'anon-fn':
                            await (item.options as AnonFnQueueInfo).fn(item);
                            break;
                        default:
                            throw new Error(`(UNEXPECTED) unknown item.type (${item.type})? (E: 81e8eb4866dc1822c84606c8dee66d25)`);
                    }

                    item.status = 'complete';
                    if (item.fnOnComplete) {
                        try {
                            await item.fnOnComplete(item);
                        } catch (error) {
                            console.error(`${lc}[item.fnOnComplete] ${extractErrorMsg(error)}`);
                        }
                    }
                } catch (error) {
                    console.error(`${lc} Error processing queue item: ${extractErrorMsg(error)}`);
                    item.status = 'errored';
                    if (item.fnOnError) {
                        try {
                            await item.fnOnError(item, error);
                        } catch (error_fnOnError) {
                            // an inner error? sheesh
                            console.error(`${lc}[item.fnOnError] ${extractErrorMsg(error_fnOnError)}`);
                        }
                    }

                    // do NOT rethrow, i.e., continue to the next item even if
                    // one fails.
                    // throw error;
                } finally {
                    if (logalot) { console.log(`${lc} processing item complete.`); }
                }

                this.sortQueue();
                item = this.queue.shift();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private async processQueue_summarize(item: PriorityQueueInfo): Promise<void> {
        const lc = `${this.lc}[${this.processQueue_summarize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // Type guard to ensure we have summary options.
            const summaryOpts = item.options as SummaryQueueInfo;
            if (!summaryOpts.text || !summaryOpts.type || !summaryOpts.length) {
                throw new Error(`Invalid summary options. text, type, and length are required. (E: genuuid)`);
            }

            // Get/Create the instance based on the item's requirements. (We'll
            // need a helper for this to cache this later, but for now, we
            // create it)
            const summarizer = await Summarizer.create({
                type: summaryOpts.type,
                length: summaryOpts.length,
                format: summaryOpts.format ?? 'plain-text',
            });

            // Perform the summarization.
            if (item.thinkingId) { updateThinkingEntry(item.thinkingId, `Summarizing (p${item.priority})...`); }
            const summaryText = await getSummary({
                summarizer,
                text: summaryOpts.text,
                context: summaryOpts.context,
                thinkingId: item.thinkingId,
            });

            // Get the necessary space and metaspace to save the result.
            const metaspace = item.metaspace ?? await getGlobalMetaspace_waitIfNeeded();
            const space = item.space ?? await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) could not get default user space from metaspace? (E: genuuid)`); }

            /**
             * always store the summary via the specific type/length.
             *
             * this helper atow just builds e.g. "text_tldr_long" or
             * "text_headline_short", etc.
             */
            const key = getSummaryTextKeyForIbGib({ type: summaryOpts.type, length: summaryOpts.length });
            const dataToAddOrPatch: any = { [key]: summaryText };
            // optionally store it in the data.title if it's expected to be the title
            if (summaryOpts.isTitle) { dataToAddOrPatch.title = summaryText; }

            // Mutate the ibGib's timeline to save the new data. This updated
            // timeline will be heard by the subscribed ibgib's component and
            // reacted to.
            await mut8Timeline({
                timeline: item.ibGib,
                metaspace,
                space,
                mut8Opts: { dataToAddOrPatch },
                skipLock: false,
            });

            if (item.thinkingId) { updateThinkingEntry(item.thinkingId, `Summarizing (p${item.priority}) complete.`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            if (item.thinkingId) { updateThinkingEntry(item.thinkingId, `error summarizing (p${item.priority}): ${extractErrorMsg(error)}`); }
            // We throw here to allow the main processing loop to handle the error,
            // but we could also implement more specific retry logic if needed.
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async processQueue_translate(item: PriorityQueueInfo): Promise<void> {
        const lc = `${this.lc}[${this.processQueue_translate.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (item.type !== 'translation') { throw new Error(`(UNEXPECTED) invalid info type: ${item.type}`); }
            const translateOpts = item.options as TranslationQueueInfo;
            const { text, dataKey, sourceLanguage, targetLanguage } = translateOpts;
            const { ibGib, thinkingId } = item;

            // Get/Create the instance based on the item's requirements. (We'll
            // need a helper for this to cache this later, but for now, we
            // create it)
            const translator = await Translator.create({
                sourceLanguage,
                targetLanguage,
            });

            // Perform the translation.
            if (thinkingId) { updateThinkingEntry(thinkingId, `Translating (p${item.priority})...`); }
            const translationText = await translator.translate(text);

            item.result = translationText;

            // 3. Get the necessary space and metaspace to save the result.
            const metaspace = item.metaspace ?? await getGlobalMetaspace_waitIfNeeded();
            const space = item.space ?? await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) could not get default user space from metaspace? (E: genuuid)`); }


            /**
             * always store the translation via the key.
             *
             * atow (11/2024) e.g. `translationtext__text__es` or
             * `translationtext__summarytext_tldr_short__en-US`
             *
             * @see {@link getTranslationTextKeyForIbGib}
             */
            const key = getTranslationTextKeyForIbGib({
                dataKey,
                targetLanguage,
            });

            // Mutate the ibGib's timeline to save the new data. This updated
            // timeline will be heard by the subscribed ibgib's component and
            // reacted to.
            const dataToAddOrPatch = { [key]: translationText };
            await mut8Timeline({
                timeline: ibGib,
                metaspace,
                space,
                mut8Opts: { dataToAddOrPatch },
                skipLock: false,
            });

            if (thinkingId) { updateThinkingEntry(thinkingId, `Translating (p${item.priority}) complete.`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            if (item.thinkingId) { updateThinkingEntry(item.thinkingId, `error translating (p${item.priority}): ${extractErrorMsg(error)}`); }
            // We throw here to allow the main processing loop to handle the error,
            // but we could also implement more specific retry logic if needed.
            throw error;
        }
    }


}

/**
 * Singleton instance of the PriorityQueueService.
 */
const _priorityQueueSvc = new PriorityQueueService();

/**
 * Accessor function for the singleton PriorityQueueService instance.
 *
 * @returns The singleton instance of the PriorityQueueService.
 */
export function getPriorityQueueSvc(): PriorityQueueService {
    return _priorityQueueSvc;
}
