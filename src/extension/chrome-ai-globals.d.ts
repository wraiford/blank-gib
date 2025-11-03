// This file is for global declarations for the Chrome AI APIs.
// It ensures that the API entry points (Summarizer, LanguageModel) are available
// in the global scope without needing to be imported.
// Type definitions for the experimental Chrome Built-in AI APIs
// Based on the documentation available at:
// https://developer.chrome.com/docs/ai/built-in

import type { LanguageModel, Summarizer, Translator, LanguageDetector } from './chrome-ai.mjs';

declare global {
    const Summarizer: Summarizer;
    /** not yet implemented */
    const LanguageModel: LanguageModel;
    const Translator: Translator;
    const LanguageDetector: LanguageDetector;
}

// We need to export something to make this a module file, but since we're just
// declaring globals, we export an empty object.
export { };
