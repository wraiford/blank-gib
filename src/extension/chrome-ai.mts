
// #region ChromeAIAvailability enum
export const CHROME_AI_AVAILABILITY_UNAVAILABLE = 'unavailable';
export const CHROME_AI_AVAILABILITY_DOWNLOADABLE = 'downloadable';
export const CHROME_AI_AVAILABILITY_DOWNLOADING = 'downloading';
export const CHROME_AI_AVAILABILITY_AVAILABLE = 'available';

/**
 * The availability of a Chrome AI API.
 *
 * @see https://developer.chrome.com/docs/ai/built-in
 */
export type ChromeAIAvailability =
    | typeof CHROME_AI_AVAILABILITY_UNAVAILABLE
    | typeof CHROME_AI_AVAILABILITY_DOWNLOADABLE
    | typeof CHROME_AI_AVAILABILITY_DOWNLOADING
    | typeof CHROME_AI_AVAILABILITY_AVAILABLE
    ;

export const ChromeAIAvailability = {
    /**
     * The user's device or requested session options are not supported.
     * The device may have insufficient power or disk space.
     */
    unavailable: CHROME_AI_AVAILABILITY_UNAVAILABLE satisfies ChromeAIAvailability,
    /**
     * Additional downloads are needed to create a session, which may include
     * an expert model, a language model, or fine-tuning. User activation may
     * be required to call create().
     */
    downloadable: CHROME_AI_AVAILABILITY_DOWNLOADABLE satisfies ChromeAIAvailability,
    /**
     * Downloads are ongoing and must complete before you can use a a session.
     */
    downloading: CHROME_AI_AVAILABILITY_DOWNLOADING satisfies ChromeAIAvailability,
    /**
     * You can create a session immediately.
     */
    available: CHROME_AI_AVAILABILITY_AVAILABLE satisfies ChromeAIAvailability,
} satisfies { readonly [key: string]: ChromeAIAvailability; };

export const CHROME_AI_AVAILABILITY_VALID_VALUES: ChromeAIAvailability[] = Object.values(ChromeAIAvailability);

export function isChromeAIAvailability(value: any): value is ChromeAIAvailability {
    return CHROME_AI_AVAILABILITY_VALID_VALUES.includes(value);
}
// #endregion ChromeAIAvailability enum

// #region Summarizer API
// https://developer.chrome.com/docs/ai/built-in/summarizer-api

export type SummarizerAvailability = ChromeAIAvailability;

export interface SummarizerDownloadProgressEvent extends Event {
    loaded: number; // A percentage from 0 to 1
}

type SummarizerCallback = (this: SummarizerMonitor, ev: SummarizerDownloadProgressEvent) => any;
export interface SummarizerMonitor {
    addEventListener(
        type: 'downloadprogress',
        listener: SummarizerCallback | null,
        options?: AddEventListenerOptions | boolean
    ): void;
}
export type SummarizerType = 'key-points' | 'tldr' | 'teaser' | 'headline';
export type SummarizerFormat = 'markdown' | 'plain-text';
export type SummarizerLength = 'short' | 'medium' | 'long';
/**
 * maybe turn into list later
 */
export type SummarizerLanguage = string;
export type SummarizerLanguages = SummarizerLanguage[];

export interface SummarizerCreateOptions {
    sharedContext?: string;
    type?: SummarizerType;
    format?: SummarizerFormat;
    length?: SummarizerLength;
    monitor?: (monitor: SummarizerMonitor) => void;
    outputLanguage?: SummarizerLanguage;
    expectedInputLanguages?: SummarizerLanguages;
}

export interface SummarizerSummarizeOptions {
    context?: string;
}

export interface SummarizerInfo {
    sharedContext?: string;
    expectedContextLanguages: SummarizerLanguages;
    expectedInputLanguages: SummarizerLanguages;
    format: SummarizerFormat;
    inputQuota: number;
}
export interface Summarizer extends SummarizerInfo {
    availability(): Promise<SummarizerAvailability>;
    create(options?: SummarizerCreateOptions): Promise<Summarizer>;
    summarize(text: string, options?: SummarizerSummarizeOptions): Promise<string>;
    summarizeStreaming(text: string, options?: SummarizerSummarizeOptions): AsyncIterable<string>;
    measureInputUsage(): Promise<number>;
}

// #endregion Summarizer API

// #region LanguageModel API
// https://developer.chrome.com/docs/ai/built-in/prompt-api

export type LanguageModelAvailability = ChromeAIAvailability;

export interface LanguageModelDownloadProgressEvent extends Event {
    loaded: number; // A percentage from 0 to 1
}

export interface LanguageModelMonitor {
    addEventListener(type: 'downloadprogress', listener: (this: LanguageModelMonitor, ev: LanguageModelDownloadProgressEvent) => any, options?: boolean | AddEventListenerOptions): void;
}

export interface LanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
}

export interface LanguageModelAvailabilityOptions {
    expectedInputs: { type: 'text' | 'audio' | 'image' }[]
}
export interface LanguageModelCreateOptions {
    temperature?: number;
    topK?: number;
    initialPrompts?: { role: 'system' | 'user' | 'assistant', content: string }[];
    expectedInputs?: { type: 'text' | 'audio' | 'image', language?: string }[];
    signal?: AbortSignal;
    monitor?: (monitor: LanguageModelMonitor) => void;
}

export interface LanguageModelPromptOptions {
    signal?: AbortSignal;
    responseConstraint?: any; // JSON Schema
    omitResponseConstraintInput?: boolean;
}

/**
 * Type of the global LanguageModel
 */
export interface LanguageModel {
    availability(options?: LanguageModelAvailabilityOptions): Promise<LanguageModelAvailability>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
    params(): Promise<LanguageModelParams>;
}

export interface LanguageModelSession {
    readonly inputUsage: number;
    readonly inputQuota: number;
    prompt(prompt: string, options?: LanguageModelPromptOptions): Promise<string>;
    prompt(prompt: { role: 'user' | 'assistant', content: string | any[], prefix?: boolean }[], options?: LanguageModelPromptOptions): Promise<string>;
    promptStreaming(prompt: string, options?: LanguageModelPromptOptions): ReadableStream<string>;
    promptStreaming(prompt: { role: 'user' | 'assistant', content: string | any[], prefix?: boolean }[], options?: LanguageModelPromptOptions): ReadableStream<string>;
    append(prompt: { role: 'user' | 'assistant', content: string | any[] }[]): Promise<void>;
    clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
    destroy(): void;
    measureInputUsage(options: { responseConstraint: any }): Promise<{ withResponseConstraint: number, withoutResponseConstraint: number }>;
}

// #endregion LanguageModel API
