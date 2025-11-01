import { ConstructRule } from "./types.mjs";

/**
 * For western languages, delimits text into all tokens.
 *
 * Basically atow (07/2025) the pattern allows for unicode, conventional
 * alphanumerics, and apostrophe's and hyphens.
 */
export const DEFAULT_TOKEN_CONSTRUCT_RULE: ConstructRule = {
    "name": "token",
    "description": "Defines the fundamental unit of a 'word' or 'token'.",
    "pattern": "<< REGEX(/\\p{L}+(?:['\\-]\\p{L}+)*/u) >>"
};

export const DEFAULT_GERMAN_RULES = [
    {
        "name": "german-dative-preposition",
        "description": "Matches a common German dative preposition.",
        "pattern": "<< REGEX(/\\b(mit|nach|von|zu)\\b/u) >>"

    },
    {
        "name": "german-noun",
        "description": "Matches a probable German noun (capitalized, but not a common article).",
        "pattern": "<< REGEX(/\\b(?!(Der|Die|Das|Den|Dem|Des|Ein|Eine|Eines|Einem|Einen)\\b)[A-Z]\\p{L}*/u) >>"
    },
    {
        "name": "german-dative-phrase",
        "description": "A dative preposition followed by a noun, with or without an article.",
        "pattern": "<< [CONSTRUCT:german-dative-preposition] (?:[CONSTRUCT:token] )?[CONSTRUCT:german-noun] >>"
    },
    // {
    //     "name": "german-dative-phrase",
    //     "description": "A dative preposition followed by any token and a noun.",
    //     "pattern": "<< [CONSTRUCT:german-dative-preposition] [CONSTRUCT:token] [CONSTRUCT:german-noun] >>"
    // },
    {
        "name": "german-separable-verb-end",
        "description": "Identifies a common separable prefix at the end of a clause.",
        "pattern": "<< REGEX(/\\b(an|auf|aus)\\b(?=[\\.,!]|$)/i) >>"
    }
];

export const DEFAULT_ITALIAN_RULES = [
    {
        "name": "italian-articulated-preposition",
        "description": "Identifies prepositions combined with a definite article.",
        "pattern": "<< REGEX(/\\b(del|dello|della|degli|delle|al|allo|alla|agli|alle|dal|dallo|dalla|dagli|dalle)\\b/i) >>"
    },
    {
        "name": "italian-verb-clitic",
        "description": "Finds a verb infinitive stem with clitics, with a special case for 'dirglielo'.",
        "pattern": "<< REGEX(/\\b(?:\\p{L}+(?:ar|er|ir)(?:mi|ti|lo|la|ci|vi|li|le|ne|si|gli){1,2}|dirglielo)\\b/i) >>"
    },
];

export const DEFAULT_SPANISH_RULES = [
    {
        "name": "spanish-estar-conjugation",
        "description": "Matches a conjugation of the verb 'estar' using character classes for case.",
        "pattern": "<< REGEX(/(?<!\\p{L})[Ee]st(oy|ás|á|amos|áis|án)(?!\\p{L})/u) >>"
    },
    {
        "name": "spanish-gerund",
        "description": "Matches a gerund ending in -ando or -iendo.",
        "pattern": "<< REGEX(/(?<!\\p{L})\\p{L}+(ando|iendo)(?!\\p{L})/i) >>"
    },
    {
        "name": "spanish-present-progressive",
        "description": "Identifies the present progressive tense.",
        "pattern": "<< [CONSTRUCT:spanish-estar-conjugation] [CONSTRUCT:spanish-gerund] >>"
    }
];

export const DEFAULT_KOINEGREEK_RULES = [
    {
        "name": "greek-genitive-article",
        "description": "Matches the masculine/neuter singular genitive article.",
        "pattern": "<< τοῦ >>"
    },
    {
        "name": "greek-genitive-noun-ending",
        "description": "Matches a token ending in the genitive suffix -ου, with or without accent.",
        // **FIX:** Use [υῦ] to match both plain and accented upsilon.
        "pattern": "<< REGEX(/(?<!\\p{L})\\p{L}+ο[υῦ](?![\\p{L}])/u) >>"
    },
    {
        "name": "greek-genitive-phrase",
        "description": "A genitive article followed by a genitive noun.",
        "pattern": "<< [CONSTRUCT:greek-genitive-article] [CONSTRUCT:greek-genitive-noun-ending] >>"
    },
    {
        "name": "greek-preposition-en",
        "description": "Matches the preposition 'ἐν' (in).",
        "pattern": "<< ἐν >>"
    },
    {
        "name": "greek-dative-ending",
        "description": "Matches a token ending in the dative suffix 'ῳ', with or without accent.",
        "pattern": "<< REGEX(/(?<!\\p{L})\\p{L}+[ῳῷ](?![\\p{L}])/u) >>"
    },
    {
        "name": "greek-en-dative-phrase",
        "description": "The preposition 'ἐν' followed by a dative noun.",
        "pattern": "<< [CONSTRUCT:greek-preposition-en] [CONSTRUCT:greek-dative-ending] >>"
    },
];
