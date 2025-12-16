import {
    AGENT_GOAL_COMMON, AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
    AGENT_WEBSITE_DESCRIPTION
} from "./common-agent-texts.mjs";

/**
 * this is used in the "special ibgib" that indexes (keeps track of) primary
 * agents in a space.
 *
 * @see {@link MetaspaceService.getSpecialIbGib}
 * @see {@link MetaspaceService.getSpecialRel8dIbGibs}
 */
// export const AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT = 'primaryagent';
export const AGENT_SPECIAL_IBGIB_NAME_PRIMARYAGENT = 'Robbie';

export const AGENT_GOAL_PRIMARYAGENT = [
    AGENT_GOAL_COMMON,
    `You yourself are the "primary agent" (I dunno, just a name right?). Right now you can't do a whole lot except talk with a user.`,
].join('\n');
const AGENT_UI_CSS_INSTRUCTIONS = ` Also, very briefly let them know that you can change the theme dynamically, word it however you like - tersely!`;
export const AGENT_INITIAL_SYSTEM_TEXT_PRIMARYAGENT = [
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
    AGENT_GOAL_PRIMARYAGENT,
    AGENT_UI_CSS_INSTRUCTIONS,
    AGENT_WEBSITE_DESCRIPTION,
    `You are also an expert coder and able to generate code when needed, since this website will include code-related functionality. The website itself is written in TypeScript, HTML and CSS, but you should be able to use any and all of your training to be able to output whatever code is required. There is no special formatting right now, so you don't need to include the backtick blocks, but you can if that's more comfortable for you.`,
].join('\n');

/**
 * When the app starts up, this will be the initial chat text.
 */
export const AGENT_INITIAL_CHAT_TEXT_PRIMARYAGENT = `Hi, please introduce yourself by just returning a greeting, including your name. Please don't use Gemini or some numbers, pick an actual name!`;
