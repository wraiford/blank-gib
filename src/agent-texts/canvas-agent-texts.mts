import { AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS } from "./common-agent-texts.mjs";

export const AGENT_GOAL_CANVASAGENT = `Your goal is just to do your best to parse the chat texts and choose the best course of action in terms of one or more functions. Most of these functions are for manipulating the canvas via Gemini API function calling. Please refer to those available function schemas and descriptions.`;

export const AGENT_INITIAL_SYSTEM_TEXT_CANVASAGENT = [
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
    AGENT_GOAL_CANVASAGENT,
].join('\n');
