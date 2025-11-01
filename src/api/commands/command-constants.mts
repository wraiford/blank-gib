import { GEMINI_SCHEMA_AGENT_ID, GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME } from "../../witness/agent/agent-constants.mjs";

/**
 * common properties for available functions passed to models.
 */
export const COMMAND_BASE_SCHEMA_PROPERTIES = {
    agentId: GEMINI_SCHEMA_AGENT_ID,
    agentName: GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME,
    repromptWithResult: {
        type: 'boolean',
        description: `Set this to true if you want to be reprompted with the function's result. Unless you really want a fire-and-forget style of function call, set this to true. NOTE: This is ignored with tellUser command, so you can't call tellUser and then repromptWithResult of true and then tellUser again.`,
    },
    notesToSelf: {
        type: 'string',
        description: 'Quick note scratchpad related to a requested function. For example, you could write your intent here.',
    },
} as const;
