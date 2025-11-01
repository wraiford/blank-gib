import { IbGib_V1, IbGibData_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

import type { getMinigameIb } from './minigame-helper.mjs';
import { MINIGAME_PROTOTYPE_REL8N_NAME, MinigameGameType, MinigameGameVariant } from "./minigame-constants.mjs";

// #region constants - Pulled in from minigame-constants, but we need default data/rel8ns structure here

// #region MinigameGamePhase
export const MINIGAME_GAMEPHASE_INIT = 'init';
export const MINIGAME_GAMEPHASE_READY = 'ready';
export const MINIGAME_GAMEPHASE_PLAYING = 'playing';
export const MINIGAME_GAMEPHASE_PAUSED = 'paused';
export const MINIGAME_GAMEPHASE_ABORTED = 'aborted';
export const MINIGAME_GAMEPHASE_COMPLETE = 'complete';
export type MinigameGamePhase =
    | typeof MINIGAME_GAMEPHASE_INIT
    | typeof MINIGAME_GAMEPHASE_READY
    | typeof MINIGAME_GAMEPHASE_PLAYING
    | typeof MINIGAME_GAMEPHASE_PAUSED
    | typeof MINIGAME_GAMEPHASE_ABORTED
    | typeof MINIGAME_GAMEPHASE_COMPLETE
    ;
/**
 * generic finite state machine-like phase of a minigame. This is a general
 * phase, and there may be additional "sub-phases" (or whatever) for specific,
 * concrete minigames.
 */
export const MinigameGamePhase = {
    init: MINIGAME_GAMEPHASE_INIT,
    ready: MINIGAME_GAMEPHASE_READY,
    playing: MINIGAME_GAMEPHASE_PLAYING,
    paused: MINIGAME_GAMEPHASE_PAUSED,
    aborted: MINIGAME_GAMEPHASE_ABORTED,
    complete: MINIGAME_GAMEPHASE_COMPLETE,
} satisfies { [key in MinigameGamePhase]: MinigameGamePhase };
export const MINIGAME_GAME_PHASE_VALUES = Object.values(MinigameGamePhase);
export function isMinigameGamePhase(value: string): value is MinigameGamePhase {
    return MINIGAME_GAME_PHASE_VALUES.includes(value as MinigameGamePhase);
}
// #endregion MinigameGamePhase

export const DEFAULT_MINIGAME_TEXT = 'default minigame text';
export const DEFAULT_MINIGAME_NAME = 'untitled_minigame';
export const DEFAULT_MINIGAME_DESCRIPTION = 'This is an ibgib minigame. ';
export const DEFAULT_MINIGAME_INSTRUCTIONS = 'Try your best!';
export const DEFAULT_MINIGAME_GAMETYPE = MinigameGameType.typing;
export const DEFAULT_MINIGAME_GAMEVARIANT = MinigameGameVariant.default;
export const DEFAULT_MINIGAME_GAMEPHASE = MinigameGamePhase.init;
export const DEFAULT_MINIGAME_KEYWORDS = [];

/**
 * Default rel8ns values for a Minigame. Includes inherited defaults from IbGib.
 */
export const DEFAULT_MINIGAME_REL8NS_V1: MinigameRel8ns_V1 | undefined = undefined;

// #endregion constants


/**
 * Represents the data structure for a Minigame ibGib.
 * Contains the core information defining a minigame.
 */
export interface MinigameData_V1 extends IbGibData_V1 {
    /**
     * It's the name of the game.
     */
    name: string;
    /**
     * Description of the minigame.
     * This can be a more detailed explanation of the minigame's purpose or scope.
     */
    description: string;
    /**
     * how to play the game. shown before starting.
     */
    instructions: string;
    /**
     * if given, this is the address that provides the src of this minigame.
     */
    '@contextAddr'?: IbGibAddr;
    /**
     * Broad category of the minigame. Only one initially is "typing" (though
     * the user could use the voice typing).
     */
    gameType: MinigameGameType;
    /**
     * Specific sub-type of the {@link gameType}. This determines specifics of
     * the minigame gameplay.
     * @deprecated (moving this into the stimulus instead of the game itself)
     */
    gameVariant?: MinigameGameVariant;
    /**
     * Metadata, e.g. config, specific to the concrete minigame {@link gameType}
     * and {@link gameVariant}.
     */
    gameMeta?: any;
    /**
     * The state of the concrete minigame, which should include, e.g.,
     * interactions the player might have been involved with.
     *
     * in typing, this is where we include what stimuli we have shown to the
     * user, what their responses were, timestamps, etc.
     */
    gameState?: any;
    /**
     * * if init, then {@link gameState} is temporary state of the next game to
     *   be played.
     * * if playing or paused, then {@link gameState} is the current game state.
     * * if aborted or complete, then {@link gameState} is the previous game
     *   state that was aborted/completed.
     *
     * ## past game states and notes
     *
     * To see past game states, you have to walk the history of this ibgib
     * (the 'past', and possibly 'ancestor' rel8nNames - I don't know yet how
     * this will pan out).
     *
     * I am thinking that we will fork for new games, but this may be annoying
     * and we may end up just mutating this data and reserve forking for
     * creating prototypes.
     */
    gamePhase?: MinigameGamePhase;
    /**
     * List of keywords that describe/pertain to this minigame, e.g., 'spanish',
     * 'verbs', 'conjugation', 'cover-cropping', etc.
     *
     * Note that our learning model is not just subject-related but
     * trace-strength related. So the material itself is not the only important
     * thing, like when buliding a team it's good to have diversification such
     * as a comedian/light-hearted person. The learning equivalent is pairing
     * certain groups of text with some fun/humorous theme.
     */
    keywords: string[];
    /**
     * if false, this minigame is still being initialized and cannot yet be
     * played proper.
     */
    playable: boolean;
    gamesStarted: number;
    gamesCompleted: number;
    gamesAborted: number;
}

/**
 * Represents the relationships structure for a Minigame ibGib.
 * Currently holds standard ibGib relationships but can be extended
 * in the future if minigames require specific relationship types (e.g., rel8n_tasks).
 */
export interface MinigameRel8ns_V1 extends IbGibRel8ns_V1 {
    // Add any minigame-specific rel8ns here if needed.
    // [AGENT_REL8N_NAME]?: IbGibAddr[];
    [MINIGAME_PROTOTYPE_REL8N_NAME]?: IbGibAddr[];
}

/**
 * Represents a fully formed Minigame ibGib, combining its data and relationships.
 * This is the primary type used when interacting with Minigame ibGibs.
 */
export interface MinigameIbGib_V1 extends IbGib_V1<MinigameData_V1, MinigameRel8ns_V1> {
}

/**
 * Default data values for a Minigame. Includes inherited defaults from Comment/IbGib.
 */
export const DEFAULT_MINIGAME_DATA_V1: MinigameData_V1 = {
    // Inherited from CommentData_V1 -> IbGibData_V1
    name: DEFAULT_MINIGAME_NAME, // Default minigame name
    text: DEFAULT_MINIGAME_TEXT, // Default comment text
    textTimestamp: '',

    // MinigameData_V1 specific (or CommentData_V1 overrides)
    description: DEFAULT_MINIGAME_DESCRIPTION,
    instructions: DEFAULT_MINIGAME_INSTRUCTIONS,
    gameType: DEFAULT_MINIGAME_GAMETYPE,
    gameVariant: DEFAULT_MINIGAME_GAMEVARIANT,
    gamePhase: DEFAULT_MINIGAME_GAMEPHASE,
    keywords: DEFAULT_MINIGAME_KEYWORDS,
    playable: false,

    gamesStarted: 0,
    gamesAborted: 0,
    gamesCompleted: 0,
};

/**
 * Represents the parsed information extracted from the `addlMetadataText`
 * segment within a minigame's `ib` string. This segment follows the `safeName`
 * and is delimited by underscores internally if multiple fields are present.
 */
export interface MinigameAddlMetadataInfo {
    /**
     * Ticks version of the timestamp derived from ibgib.data.timestamp.
     * This value is encoded within the addlMetadataText segment of the ib string.
     */
    timestampInTicks: number;
    // Add other fields here if the addlMetadataText segment grows,
    // ensuring they are underscore-delimited in the raw text.
}


/**
 * Represents the parsed information extracted from a minigame's `ib` string.
 * The `ib` string contains core metadata encoded for efficient referencing.
 *
 * @see {@link getMinigameIb} for ib schema
 */
export interface MinigameIbInfo {
    /** The atom identifier (must be 'minigame'). Checked during parsing. */
    atom: 'minigame';
    /**
     * A 'saferized', often truncated, version of the name (minigame title).
     * Extracted as the first space-delimited segment after the atom.
     */
    safeName: string;
    /**
     * The raw string containing underscore-delimited additional metadata (e.g., "1678886400000").
     * Extracted as the second space-delimited segment after safeName.
     *
     * @see {@link addlMetadata}
     */
    addlMetadataText: string;
    /**
     * The parsed content of the addlMetadataText segment.
     *
     * @see {@link addlMetadataText}
     */
    addlMetadata: MinigameAddlMetadataInfo;
}

/**
 * actual game mechanics. This API will be used by the minigame (wrapper)
 * component.
 *
 * Concrete minigame components will implement this
 */
export interface MinigameFiniteStateMachine {
    get gamePhase(): MinigameGamePhase | undefined;
    play(): Promise<void>;
    pause(): Promise<void>;
    restart(): Promise<void>;
    abort(): Promise<void>;
    complete(): Promise<void>;
}
