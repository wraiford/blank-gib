import { ChatAPIFunctionInfos } from "@ibgib/web-gib/dist/api/commands/chat/chat-index.mjs";
import { IbGibAPIFunctionInfos } from "@ibgib/web-gib/dist/api/commands/ibgib/ibgib-index.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { SETTINGS_ATOM } from "@ibgib/web-gib/dist/common/settings/settings-constants.mjs";
import { TextAPIFunctionInfos } from "@ibgib/web-gib/dist/api/commands/text/text-index.mjs";

// import { MinigameFunctionInfos } from "../../api/commands/minigame/minigame-index.mjs";
import { MinigameGameVariant_Typing } from "./typing/typing-constants.mjs";

export const MINIGAME_ATOM = 'minigame';
export const MINIGAME_NAME_REGEXP = /^[a-zA-Z0-9_\-. ]{1,128}$/;
export const MINIGAME_DESC_REGEXP = /.{1,255}/;

export const MINIGAME_SETTINGS_SCOPE = `${SETTINGS_ATOM}_${MINIGAME_ATOM}`;

export const DEFAULT_MINIGAME_SAFE_NAME_LENGTH = 32;
/**
 * change this in the future if we add more fields
 */
export const DEFAULT_MINIGAME_ADDL_METADATA_LENGTH = 32;

// export const DEFAULT_MINIGAME_DATA_V1 ,
// export const DEFAULT_MINIGAME_REL8NS_V1,


/**
 * if a minigame descends from another minigame, this will be set.
 */
export const MINIGAME_PROTOTYPE_REL8N_NAME = 'prototype';
export const MINIGAME_REL8N_NAME = MINIGAME_ATOM;

export const AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT: APIFunctionInfo<any>[] = [
    ...ChatAPIFunctionInfos,
    ...TextAPIFunctionInfos,
    ...IbGibAPIFunctionInfos,
    // ...MinigameFunctionInfos,
];
// ugly hack for some circular dependency that I can't find
// had to comment this out, really getting into solving this circular dependency mess 2025/12/15
// setTimeout(async () => {
//     while (!MinigameFunctionInfos) {
//         await delay(100);
//         debugger;
//     }
//     MinigameFunctionInfos.forEach(x => {
//         AGENT_AVAILABLE_FUNCTIONS_MINIGAMEAGENT.push(x);
//     }); // hasn't initialized yet
// });

// #region MinigameGameType
export const MINIGAME_GAMETYPE_TYPING = 'typing';
export type MinigameGameType =
    | typeof MINIGAME_GAMETYPE_TYPING
    ;
export const MinigameGameType = {
    typing: MINIGAME_GAMETYPE_TYPING,
} satisfies { [key in MinigameGameType]: MinigameGameType };
export const MINIGAME_GAME_TYPE_VALUES = Object.values(MinigameGameType);
// #endregion MinigameGameType

// #region MinigameGameVariant
export const MINIGAME_GAMEVARIANT_COMMON_DEFAULT = 'default';
export const MINIGAME_GAMEVARIANT_COMMON_MULTI = 'multi';
export type MinigameGameVariant_Common =
    | typeof MINIGAME_GAMEVARIANT_COMMON_DEFAULT
    | typeof MINIGAME_GAMEVARIANT_COMMON_MULTI
    ;
export const MinigameGameVariant_Common = {
    default: MINIGAME_GAMEVARIANT_COMMON_DEFAULT,
    multi: MINIGAME_GAMEVARIANT_COMMON_MULTI,
} satisfies { [key in MinigameGameVariant_Common]: MinigameGameVariant_Common };
export const MINIGAME_GAME_VARIANT_COMMON_VALUES = Object.values(MinigameGameVariant_Common);
/**
 * Discriminated union for the specific variant of a given minigame gameType.
 */
export type MinigameGameVariant =
    | MinigameGameVariant_Common
    | MinigameGameVariant_Typing;
export const MinigameGameVariant = {
    ...MinigameGameVariant_Common,
    ...MinigameGameVariant_Typing,
}
export const MINIGAME_GAME_VARIANT_VALUES = Object.values(MinigameGameVariant);
// #endregion MinigameGameVariant

// #region Gemini Schemas
export const GEMINI_SCHEMA_MINIGAME_GAMETYPE = {
    type: 'string',
    enum: MINIGAME_GAME_TYPE_VALUES.concat(),
    description: 'Broad category of minigame. May have multiple variants.',
};

export const GEMINI_SCHEMA_MINIGAME_GAMEVARIANT_COMMON_DESCRIPTION = [
    `${MinigameGameVariant.default} will be a single single game variant.`,
    `${MinigameGameVariant.multi} will have multiple, varying kinds of specific items.`,
].join('\n');
export const GEMINI_SCHEMA_MINIGAME_GAMEVARIANT_TYPING_DESCRIPTION = [
    `${MinigameGameVariant_Typing.parrot} (${MinigameGameType.typing})(${MinigameGameVariant.default}) is just typing the stimulus.`,
    `${MinigameGameVariant_Typing.antiphony} (${MinigameGameType.typing}) is typing some kind of expectedResponse. Stimuli should have expectedResponse values and expectedResponseIsExact should be set true or false.`,
    `${MinigameGameVariant_Typing.fitb} (${MinigameGameType.typing}) is "Fill-in-the-Blank". These stimuli have one or more blanks. Stimuli should have expectedResponse be a comma-delimited list that match the number of blanks. expectedResponseIsExact values should be either true or false.`,
].join('\n');

// export const GEMINI_SCHEMA_MINIGAME_GAMEVARIANT = {
//     type: 'string',
//     enum: MINIGAME_GAME_VARIANT_VALUES.concat(),
//     description: [
//         `Specific variant (sub-category) of the minigame's type.`,
//         GEMINI_SCHEMA_MINIGAME_GAMEVARIANT_COMMON_DESCRIPTION,
//         GEMINI_SCHEMA_MINIGAME_GAMEVARIANT_TYPING_DESCRIPTION,
//     ].join('\n'),
// };

export const GEMINI_SCHEMA_MINIGAME_NAME = {
    type: 'string',
    description: 'The name of the game which you want to create.',
};
export const GEMINI_SCHEMA_MINIGAME_DESCRIPTION = {
    type: 'string',
    description: 'The description of the game which you want to create. Can be in Markdown.',
};
export const GEMINI_SCHEMA_MINIGAME_INSTRUCTIONS = {
    type: 'string',
    description: 'Brief instructions to show at the beginning of a game instance. Can be in Markdown.',
};

export const GEMINI_SCHEMA_MINIGAME_KEYWORDS = {
    type: 'array',
    description: 'Keywords related to the minigame. Can be used for searching.',
    items: {
        type: 'string',
        description: 'keyword (or small phrase)'
    }
};

export const GEMINI_SCHEMA_MINIGAME_CONTEXT_ADDR = {
    type: 'string',
    description: `This is the address of the ibgib in which you want to start the minigame. Often this is the active child tab's ibgib in a project, or possibly the project itself. This should contain the source material that is the primary driver of the minigame. For typing/text games, this should contain the bulk of the text.`,
};

export const GEMINI_SCHEMA_MINIGAME_MINIGAME_ADDR = {
    type: 'string',
    description: `This is the address of the minigame ibgib itself.`,
};

// #endregion Gemini Schemas
