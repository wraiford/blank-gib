/**
 * @module typing-types
 *
 * I'm going for this not beinga full ibgib but just an info for the minigame ibgib.
 */

import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1, IbGibData_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { AnalysisResult, ComparisonReport, DocumentReport } from "../../text-analysis/types.mjs";
import { ExpectedResponseType, MinigameGameVariant_Typing } from "./typing-constants.mjs";
import { Timespan } from "./typing-helper.mjs";
// import { TextAnalysisInfo } from "../../text-analysis/text-analysis-types.mjs";

/**
 * Exactly what is the user pressing?
 */
export interface RawKeyInfo {
    timestampInTicks_keydown: number;
    metachars_keydown: string[];
    timestampInTicks_keyup: number;
    metachars_keyup: string[];
}

export interface Minigame_TypingEntry {
    /**
     * some relatively unique identifier for this entry. right now I'm doing a
     * 16 char hex string (substring of a uuid)
     */
    id: string;
    /**
     * right now, this is just text
     */
    entryType: 'text';
    /**
     * actual *final* content of the entry (stimulus or response, maybe
     * something else I dunno). For text entries, then this is the text.
     *
     * I'm thinking that for pictures, the standard seems to be base64 encoding
     * of images, so this may end up being that.
     */
    value: string;
    /**
     * if the {@link entryType} is text, then this corresponds to the natural
     * language of the {@link value}.
     *
     * NOT NORMALIZED: Unknown/flexible format, so this doesn't have to be,
     * e.g., "en-US", rather, it may be "English", or "Eng" or "american",
     * "Amerikanisch", "ingles", etc...but might be who knows)
     */
    language?: string;
    /**
     * optional additional metadata
     */
    notes?: string;
    /**
     * if this is a stimulus entry, this corresponds to the timestamp that the
     * stimulus was shown.
     *
     * if this is a response entry, this corresponds to when the response was
     * given.
     */
    timestampInTicks?: string;
    /**
     * What is the source of inspiration for this entry?
     *
     * ## notes
     *
     * These entries are intended to be "JIT-compiled" instantiations of focus
     * reinforcement. So for foreign language learning, the focus could be a
     * single word, but the entry (stimulus) might be the word itself
     * (parrot/define), or it could be a line with the word in it or a
     * fill-in-the-blank line with the focus word blanked out.
     *
     * So for example, if the focus is "volare" (to fly in italian), there could
     * be multiple minigame stimuli created for this focus:
     * * "volare" -> parrot
     * * "volare" -> define in target language
     * * "volare" -> define in native language
     * * "____ oh, cantare ooh" -> provide the blank for the lyric line
     *   * From the song Volare by Domenico Modugno
     *
     * In the future, the focus of "volare" could be an agent-created picture or
     * short video clip to which the user is intended to type volare, or
     * whatever, given the context of the game.
     */
    focus?: string;
}

export interface Minigame_TypingStimulus extends Minigame_TypingEntry {
    /**
     * some stimuli have an expected response. Not all games' stimuli will require this.
     */
    expectedResponse?: string;
    /**
     * @see {@link ExpectedResponseType}
     */
    expectedResponseType?: ExpectedResponseType;
    /**
     * parrot, fitb, antiphony, etc.
     *
     * ## notes
     *
     * Originally I had this at the minigame level. But really it should be at
     * this individual stimulus level I think.
     */
    variant?: MinigameGameVariant_Typing;
}

export interface Minigame_TypingResponse extends Minigame_TypingEntry {
    /**
     * I'm thinking this is the raw characters that the user types in. I have no
     * idea what is triggered, if anything, if the user is using some kind of
     * voice typing.
     */
    rawKeyInfos?: RawKeyInfo;
}

/**
 * one-to-one interaction between a stimulus and a player-created response.
 */
export interface Minigame_TypingInteraction {
    stimulus: Minigame_TypingStimulus;
    response: Minigame_TypingResponse;
}

/**
 * Metadata, e.g., config, for a typing minigame.
 */
export interface Minigame_TypingGameMeta {
    /**
     * list of all stimuli possible in this game
     */
    allStimuli?: Minigame_TypingStimulus[];
    /**
     * aggregating stats over multiple games played.
     */
    statsHistory?: MinigameTypingRawStats[];
}

/**
 * stats for a minigame successfully completed.
 */
export interface MinigameTypingRawStats {
    /**
     * for stimulus, this is the amount of time the stimulus was shown
     * for response, this is the amount of time it took to input from the user
     */
    elapsedMs: number;
    elapsedTimespan: Timespan,
    interactionCount: number;
    /**
     * average words per minute of response.
     */
    wpm: number;
    responses: {
        analysis: AnalysisResult;
        report: DocumentReport;
    },
    stimuli: {
        analysis: AnalysisResult;
        report: DocumentReport;
    },
    comparison: ComparisonReport;
}

/**
 * Instance state for a typing minigame.
 */
export interface Minigame_TypingGameState {
    /**
     * I want to basically understand if the gamestate is just freshly
     * initialized versus ongoing. So I'm just adding a best effort counter for
     * every time that we flush (save) the game state to the timeline.
     */
    flushCounter: number;
    currentStimulus?: Minigame_TypingStimulus | undefined;
    /**
     * subset of {@link Minigame_TypingGameMeta.allStimuli} that is still available to be shown.
     */
    remainingStimuli: Minigame_TypingStimulus[];
    /**
     *
     */
    interactions: Minigame_TypingInteraction[];
}


// import { IbGib_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { CommentData_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";

// import type { getTypingIb } from './typing-helper.mjs';
// import { TYPING_ATOM } from "./typing-constants.mjs";
// import { AGENT_REL8N_NAME } from "../../witness/agent/agent-constants.mjs";

// #region constants - Pulled in from typing-constants, but we need default data/rel8ns structure here

// export const DEFAULT_TYPING_TEXT = '';
// export const DEFAULT_TYPING_NAME = 'untitled_typing';
// export const DEFAULT_TYPING_DESCRIPTION = 'This is an ibgib typing minigame. The focus around this game is input via typing.';

// /**
//  * Default rel8ns values for a Typing. Includes inherited defaults from IbGib.
//  */
// export const DEFAULT_TYPING_REL8NS_V1: TypingRel8ns_V1 | undefined = undefined;

// // #endregion constants

// /**
//  * Represents the data structure for a Typing ibGib.
//  * Contains the core information defining a typing minigame.
//  */
// export interface TypingData_V1 extends CommentData_V1 {
//     /**
//      * Description of the typing minigame.
//      * This can be a more detailed explanation of the typing minigame's purpose or scope.
//      * Optional.
//      */
//     description?: string;
// }

// /**
//  * Represents the relationships structure for a Typing ibGib.
//  * Currently holds standard ibGib relationships but can be extended
//  * in the future if typing minigames require specific relationship types (e.g., rel8n_tasks).
//  */
// export interface TypingRel8ns_V1 extends IbGibRel8ns_V1 {
//     // Add any minigame-specific rel8ns here if needed.
//     // [AGENT_REL8N_NAME]?: IbGibAddr[];
// }

// /**
//  * Represents a fully formed Typing ibGib, combining its data and relationships.
//  * This is the primary type used when interacting with Typing ibGibs.
//  */
// export interface TypingIbGib_V1 extends IbGib_V1<TypingData_V1, TypingRel8ns_V1> {
// }

// /**
//  * Default data values for a Typing. Includes inherited defaults from Comment/IbGib.
//  */
// export const DEFAULT_TYPING_DATA_V1: TypingData_V1 = {
//     // Inherited from CommentData_V1 -> IbGibData_V1
//     name: DEFAULT_TYPING_NAME, // Default typing name
//     text: DEFAULT_TYPING_TEXT, // Default comment text
//     textTimestamp: '',

//     // TypingData_V1 specific (or CommentData_V1 overrides)
//     description: DEFAULT_TYPING_DESCRIPTION,
// };

// /**
//  * Represents the parsed information extracted from the `addlMetadataText`
//  * segment within a minigame's `ib` string. This segment follows the `safeName`
//  * and is delimited by underscores internally if multiple fields are present.
//  */
// export interface TypingAddlMetadataInfo {
//     /**
//      * Ticks version of the timestamp derived from ibgib.data.timestamp.
//      * This value is encoded within the addlMetadataText segment of the ib string.
//      */
//     timestampInTicks: number;
//     // Add other fields here if the addlMetadataText segment grows,
//     // ensuring they are underscore-delimited in the raw text.
// }


// /**
//  * Represents the parsed information extracted from a minigame's `ib` string.
//  * The `ib` string contains core metadata encoded for efficient referencing.
//  *
//  * @see {@link getTypingIb} for ib schema
//  */
// export interface TypingIbInfo {
//     /** The atom identifier (must be 'typingminigame'). Checked during parsing. */
//     atom: typeof TYPING_ATOM;
//     /**
//      * A 'saferized', often truncated, version of the name (minigame title).
//      * Extracted as the first space-delimited segment after the atom.
//      */
//     safeName: string;
//     /**
//      * The raw string containing underscore-delimited additional metadata (e.g., "1678886400000").
//      * Extracted as the second space-delimited segment after safeName.
//      *
//      * @see {@link addlMetadata}
//      */
//     addlMetadataText: string;
//     /**
//      * The parsed content of the addlMetadataText segment.
//      *
//      * @see {@link addlMetadataText}
//      */
//     addlMetadata: TypingAddlMetadataInfo;
// }


export interface StimulusEditInfo {
    action: 'add' | 'edit' | 'insert' | 'delete';
    newStimulus?: Partial<Minigame_TypingStimulus>;
    index?: number | undefined;
    stimulusId?: string | undefined;
}

/**
 * right now this has only stimulus. change when use case arises.
 */
export interface TypingEntryAndElementsInfo {
    stimulusEntry: Minigame_TypingStimulus,
    entryEl: HTMLElement;
    deleteBtnEl: HTMLButtonElement;
    editBtnEl: HTMLButtonElement;
}

export interface FocusAndElementsInfo {
    focusText: string;
    textEl: HTMLElement;
    entryEl: HTMLElement;
    deleteBtnEl: HTMLButtonElement;
    // editBtnEl: HTMLButtonElement;
    // genStimuliBtnEl: HTMLButtonElement;
    detailsParrotEl: HTMLElement;
    // detailsParrotAddBtn: HTMLButtonElement,
    detailsFitbEl: HTMLElement;
    // detailsFitbAddBtn: HTMLButtonElement,
    detailsTranslateEl: HTMLElement;
    // detailsTranslateAddBtn: HTMLButtonElement,
}
