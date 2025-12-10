import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { SETTINGS_ATOM } from "@ibgib/web-gib/dist/common/settings/settings-constants.mjs";
import { getContextInfoFunctionInfo } from "@ibgib/web-gib/dist/api/commands/chat/get-context-info.mjs";
import { getIbGibsFunctionInfo } from "@ibgib/web-gib/dist/api/commands/ibgib/get-ibgibs.mjs";
// import { ChatAPIFunctionInfos } from "../../../api/commands/chat/chat-index.mjs";
// import { IbGibAPIFunctionInfos } from "../../../api/commands/ibgib/ibgib-index.mjs";
// import { editProjectFunctionInfo } from "../../../api/commands/project/project-edit.mjs";
// import { TextAPIFunctionInfos } from "../../../api/commands/text/text-index.mjs";
import { Minigame_TypingGameState, Minigame_TypingGameMeta } from "./typing-types.mjs";

export const TYPING_ATOM = 'typingminigame';
export const TYPING_NAME_REGEXP = /^[a-zA-Z0-9_\-. ]{1,128}$/;
export const TYPING_DESC_REGEXP = /.{1,255}/;

export const TYPING_SETTINGS_SCOPE = `${SETTINGS_ATOM}_${TYPING_ATOM}`;

export const DEFAULT_TYPING_SAFE_NAME_LENGTH = 32;
/**
 * change this in the future if we add more fields
 */
export const DEFAULT_TYPING_ADDL_METADATA_LENGTH = 32;

export const DEFAULT_TYPING_GAMEMETA: Minigame_TypingGameMeta = {
    allStimuli: [],
    statsHistory: [],
}
export const DEFAULT_TYPING_GAMESTATE: Minigame_TypingGameState = {
    flushCounter: 0,
    remainingStimuli: [],
    interactions: [],
}

// export const DEFAULT_TYPING_DATA_V1 ,
// export const DEFAULT_TYPING_REL8NS_V1,

export const TYPING_REL8N_NAME = TYPING_ATOM;

/**
 * @constant TypingAgentFunctionInfos - An array of all available API functions for typing agents.
 *
 * this seems to be a narrowly scoped agent whose job is to execute a specific
 * minigame. we'll see...
 */
export const TypingFunctionInfos: APIFunctionInfo<any>[] = [
    // editProjectFunctionInfo,
    getContextInfoFunctionInfo,
    getIbGibsFunctionInfo,
];

export const AGENT_AVAILABLE_FUNCTIONS_TYPINGAGENT: APIFunctionInfo<any>[] = [
    // ...ChatAPIFunctionInfos,
    // ...TextAPIFunctionInfos,
    // ...IbGibAPIFunctionInfos,
    ...TypingFunctionInfos,
];

/**
 * show text, retype that text, used not only for getting familiar with keyboard
 * BUT ALSO does a decent job at light reinforcement at a higher volume (once
 * you get familiar with said keyboard).
 *
 * Note that with voice-to-text input, this can also be used for pronunciation
 * games.
 */
export const MINIGAME_GAMEVARIANT_TYPING_PARROT = 'parrot';
/**
 * call-and-response cycle with some stimulation (the call) and the user
 * provides some kind of feedback or answer (the response). This applies to
 * translations, as well as Q & A, etc.
 *
 * Note that this is a musical slant on flashcards, i.e., it has an implied
 * rhythm.
 *
 * @see {@link https://en.wikipedia.org/wiki/Call_and_response_(music)}
 */
export const MINIGAME_GAMEVARIANT_TYPING_ANTIPHONY = 'antiphony';
/**
 * Fill-in-the-blank
 */
export const MINIGAME_GAMEVARIANT_TYPING_FITB = 'fitb';
/**
 * Translate native -> target OR target -> native.
 */
export const MINIGAME_GAMEVARIANT_TYPING_TRANSLATE = 'translate';
export type MinigameGameVariant_Typing =
    | typeof MINIGAME_GAMEVARIANT_TYPING_PARROT
    | typeof MINIGAME_GAMEVARIANT_TYPING_ANTIPHONY
    | typeof MINIGAME_GAMEVARIANT_TYPING_FITB
    | typeof MINIGAME_GAMEVARIANT_TYPING_TRANSLATE
    ;
export const MinigameGameVariant_Typing = {
    parrot: MINIGAME_GAMEVARIANT_TYPING_PARROT,
    antiphony: MINIGAME_GAMEVARIANT_TYPING_ANTIPHONY,
    fitb: MINIGAME_GAMEVARIANT_TYPING_FITB,
    translate: MINIGAME_GAMEVARIANT_TYPING_TRANSLATE,
} satisfies { [key in MinigameGameVariant_Typing]: MinigameGameVariant_Typing };
export const MINIGAME_GAME_VARIANT_TYPING_VALUES = Object.values(MinigameGameVariant_Typing);

export const MINIGAME_FOCUS_INFO = [
    `Focuses are pieces of some text/content that you want to center your learning/reinforcement around. If you want to learn 1000 words, you don't learn them all equally all at once. Rather, you focus on certain ones and build around those with various glue words like conjunctions, pronouns, prepositions, etc. Then later, you can focus on others as needed to fill it out.`,
    `So choose some group of focuses per section of text that you will process thoroughly, and you will learn the other surrounding content as a matter of course through various iterations. This will help keep things fresh and fun to maximize learning efficiency.`,
].join('\n');

export const MINIGAME_STIMULTI_TO_ADD_INFO = [
    `These are the stimuli that will ultimately be added to your minigame if you click OK.`,
    `"Stimuli" is my nerdy way of saying "question" or "prompt" or the "front side" of something like a dynamic flashcard.`
].join('\n');

// #region ExpectedResponseType
/**
 * @see {@link ExpectedResponseType.exact}
 */
export const EXPECTED_RESPONSE_TYPE_EXACT = 'exact';
/**
 * @see {@link ExpectedResponseType.equivalent}
 */
export const EXPECTED_RESPONSE_TYPE_EQUIVALENT = 'equivalent';
/**
 * @see {@link ExpectedResponseType.fitb}
 */
export const EXPECTED_RESPONSE_TYPE_FITB = 'fill-in-the-blank';
/**
 * @see {@link ExpectedResponseType.answer}
 */
export const EXPECTED_RESPONSE_TYPE_ANSWER = 'answer';
/**
 * Determines how expectedResponse to a stimulus is to be interpreted.
 */
export type ExpectedResponseType =
    | typeof EXPECTED_RESPONSE_TYPE_EXACT
    | typeof EXPECTED_RESPONSE_TYPE_EQUIVALENT
    | typeof EXPECTED_RESPONSE_TYPE_FITB
    | typeof EXPECTED_RESPONSE_TYPE_ANSWER
    ;
/**
 * Determines how expectedResponse to a stimulus is to be interpreted.
 */
export const ExpectedResponseType = {
    /**
     * The user should type the expectedResponse exactly.
     */
    exact: EXPECTED_RESPONSE_TYPE_EXACT,
    /**
     * The user should type something equivalent in meaning/semantic value as
     * expectedResponse .
     */
    equivalent: EXPECTED_RESPONSE_TYPE_EQUIVALENT,
    /**
     * The blanked out text(s) should be provided
     */
    fitb: EXPECTED_RESPONSE_TYPE_FITB,
    /**
     * The stimulus is a question and the response should be the answer.
     */
    answer: EXPECTED_RESPONSE_TYPE_ANSWER,
} satisfies { [key: string]: ExpectedResponseType };
export const EXPECTED_RESPONSE_TYPE_VALID_VALUES = Object.values(ExpectedResponseType);
// #endregion ExpectedResponseType


/**
 * hack...i'm going to store the user's native language code in storage using
 * this key, since we don't have real user identity/profile stuff yet.
 *
 * this should be updated whenever the user indicates their native language, which
 * atow (08/2025)
 */
export const USER_NATIVE_LANGUAGE_KEY = 'native-language';

/**
 * These are the defaults that I am setting up, but they are not exclusive.
 * Agents will be shown this list as guidance for their own determinations of
 * languages, when applicable.
 *
 * @see {@link https://en.wikipedia.org/wiki/ISO_639}
 * @see {@link https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes}
 */
export const DEFAULT_ISO_639_LANGUAGE_CODES = [
    "en-GB",
    "en-US",
    "fr-FR",
    "de-DE",
    "el-GR",
    "grc",
    "he-IL",
    "hbo",
    "it-IT",
    "pt-BR",
    "pt-PT",
    "ru-RU",
    "es-ES",
    "es-MX",
    "es-CU",
];
