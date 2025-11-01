import { clone, extractErrorMsg, getUUID, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export interface NaiveLanguageFingerprintPatterns {
    el: RegExp;
    es: RegExp;
    fr: RegExp;
    de: RegExp;
    it: RegExp;
}

export const DEFAULT_LANGUAGE_FINGERPRINTS = {
    // Greek alphabet characters
    el: /[\u0370-\u03FF]/,
    // Spanish inverted punctuation and unique letters
    es: /[¿¡ñáóí]/,
    // French uses guillemets and has specific characters like 'ç'
    fr: /[«»çàâéèêëîïôùûü]/,
    // German has umlauts and the Eszett
    de: /[äöüÄÖÜß]/,
    // Italian has accented vowels, especially at the end of words
    it: /[àèéìíòóùú]/,
};

export type NaiveDetectedLanguage = 'en' | 'el' | 'es' | 'fr' | 'de' | 'it';
export function detectLanguage({
    text,
    fingerprints,
}: {
    text: string,
    fingerprints: NaiveLanguageFingerprintPatterns,
}): NaiveDetectedLanguage {
    const lc = `[${detectLanguage.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 5eda0827f5271aee78ae0d43ce403825)`); }

        let lang: NaiveDetectedLanguage = 'en'; // Default to English

        // Simple language scoring
        const scores: { [key in NaiveDetectedLanguage]: number } = { en: 0, el: 0, es: 0, fr: 0, de: 0, it: 0 };
        for (const char of text) {
            if (fingerprints.el.test(char)) { scores.el++; }
            if (fingerprints.es.test(char)) { scores.es++; }
            if (fingerprints.fr.test(char)) { scores.fr++; }
            if (fingerprints.de.test(char)) { scores.de++; }
            if (fingerprints.it.test(char)) { scores.it++; }
        }

        // Determine the language with the highest score
        let maxScore = 0;
        for (const [key, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                lang = key as NaiveDetectedLanguage;
            }
        }

        if (logalot) { console.log(`Detected language: ${lang}`); }

        return lang;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }

}
interface SentenceSplitter {
    sentenceRegex: {
        el: RegExp;
        es: RegExp;
        generic: RegExp;
    };
    fingerprints: NaiveLanguageFingerprintPatterns;
    split(text: string): string[];
}
export const sentenceSplitter: SentenceSplitter = {
    // Regex patterns tailored for each language
    sentenceRegex: {
        // Greek is special due to the semicolon as a question mark
        el: /[^.;…]+[.;…]+/g,
        // Spanish uses inverted marks
        es: /(¿|¡)?[^.?!;…]+[.?!;…]+/g,
        // A general regex for Germanic/Romance languages (EN, DE, FR, IT)
        // It handles various quotation styles.
        generic: /[^.?!…]+[.?!…]+(?!(\s*[a-z"”«„]))/g,
    },

    // Fingerprints for language detection based on unique characters
    fingerprints: DEFAULT_LANGUAGE_FINGERPRINTS,

    // The main function to split sentences
    split(text) {


        const lang = detectLanguage({ text, fingerprints: this.fingerprints });

        // Select the appropriate regex
        let regex: RegExp;
        switch (lang) {
            case 'el':
                regex = this.sentenceRegex.el;
                break;
            case 'es':
                regex = this.sentenceRegex.es;
                break;
            default:
                // Use the generic regex for English, German, French, and Italian
                regex = this.sentenceRegex.generic;
        }

        const sentences = text.match(regex);
        return sentences ? sentences.map(s => s.trim()) : [];
    }
};

// --- Example Usage ---

const spanishText = '¿Hola, cómo estás? ¡Espero que bien! Esto es una prueba.';
const greekText = 'Καλημέρα. Τι κάνεις; Ελπίζω να είσαι καλά.';
const germanText = 'Guten Tag. Wie geht es Ihnen? Er sagte: „Das ist gut.“';

if (logalot) {
    console.log('--- Spanish ---');
    console.log(sentenceSplitter.split(spanishText));

    console.log('\n--- Greek ---');
    console.log(sentenceSplitter.split(greekText));

    console.log('\n--- German ---');
    console.log(sentenceSplitter.split(germanText));
}
