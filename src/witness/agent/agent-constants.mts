
/**
 * beginning of agent.ib
 */
export const AGENT_ATOM = 'witness_agent';
export const AGENT_NAME_REGEXP = /^[a-zA-Z0-9_\-.]{1,32}$/;
export const AGENT_DESC_REGEXP = /.{1,255}/;

export const DEFAULT_UUID_AGENT = '';
export const DEFAULT_NAME_AGENT = 'Manco';
export const DEFAULT_DESCRIPTION_AGENT = 'This is a generic, unspecified agent.';


/**
 * demarcates a block of entries loaded from ibgibs requested by the model on a
 * one-time basis.
 */
export const CONTEXT_DECOMPRESSION_TAG = 'CONTEXT_DECOMPRESSION_REFERENCE';
/**
 * demarcates a block of function info ibgib addresses
 */
export const FUNCTION_CALL_REQUEST_COMMENT_TAG = 'List of function info ibgib addresses. These contain info on both the requests you made and the resultant values.';

// export const PRIMARY_AGENT_SPECIAL_IBGIB_TYPE = 'primaryagent';
// export const PRIMARY_AGENT_SPECIAL_IBGIB_NAME = 'Robbie';

/**
 * this is the rel8nName ON the special ibgib index that points to its agents.
 *
 * So `agentIndex.rel8ns[AGENT_REL8N_NAME]` is a list of the agents (addrs)
 * registered in the space.
 *
 * @see {@link MetaspaceService.getSpecialIbGib}
 * @see {@link MetaspaceService.getSpecialRel8dIbGibs}
 */
export const AGENT_REL8N_NAME = 'agent';

export const GEMINI_SCHEMA_AGENT_ID = {
    type: 'string',
    description: 'unique identifier for the agent. Should be provided to the agent in system instructions upon creation.',
};

export const GEMINI_SCHEMA_AGENT_TYPE = {
    type: 'string',
    description: 'type of the agent that governs basic responsibilities. Should be provided to the agent in system instructions upon creation.',
}

export const GEMINI_SCHEMA_SPACE_ID_FORAGENTS = {
    type: 'string',
    description: 'the id of a space, usually local user space. Each agent, atow (04/2025), has two spaces: a superSpace and a subSpace. The superSpace right now is just the default local user space for all agents, though this may change. The subSpace is particular only to the agent and corresponds to where internal ibgib notes/memories should be stored. So use the subSpace for internal notes, and superSpace for any user/interagent communications/notes.',
}

// #region TextSource enum
/**
 * @see {@link TextSource.HARDCODED}
 */
const TEXT_SOURCE_HARDCODED = 'hardcoded';
/**
 * @see {@link TextSource.HUMAN}
 */
const TEXT_SOURCE_HUMAN = 'human';
/**
 * @see {@link TextSource.AI}
 */
const TEXT_SOURCE_AI = 'ai';
/**
 * @see {@link TextSource.FUNCTION}
 */
const TEXT_SOURCE_FUNCTION = 'function';
/**
 * @see {@link TextSource.UNKNOWN}
 */
const TEXT_SOURCE_UNKNOWN = 'unknown';

/**
 * @see {@link TextSource}
 */
export type TextSource =
    | typeof TEXT_SOURCE_HARDCODED
    | typeof TEXT_SOURCE_HUMAN
    | typeof TEXT_SOURCE_AI
    | typeof TEXT_SOURCE_FUNCTION
    | typeof TEXT_SOURCE_UNKNOWN
    ;

/**
 * The source of the text, which helps the LLM differentiate
 */
export const TextSource = {
    /**
     * The text was hardcoded in the system.
     */
    HARDCODED: TEXT_SOURCE_HARDCODED as TextSource,
    /**
     * The text originated from a human.
     */
    HUMAN: TEXT_SOURCE_HUMAN as TextSource,
    /**
     * The text originated from an AI.
     */
    AI: TEXT_SOURCE_AI as TextSource,
    /**
     * The text originated from a function, e.g. a function response/result.
     */
    FUNCTION: TEXT_SOURCE_FUNCTION as TextSource,
    /**
     * The origin is unknown.
     */
    UNKNOWN: TEXT_SOURCE_UNKNOWN as TextSource,
} satisfies { [key: string]: TextSource };

export const TEXT_SOURCE_VALUES = Object.freeze(Object.values(TextSource));
export function isTextSource(str: string): str is TextSource {
    return !!str && TEXT_SOURCE_VALUES.includes(str as TextSource);
}

// #endregion TextSource enum

export const GEMINI_SCHEMA_AGENTS_SELF_IDENTIFIED_NAME = {
    type: 'string',
    description: `The agent should pick a name with which to represent him/her/itself to the user. This should not be "Gemini" or something bland like that, rather, it should be a name that the agent likes. Should contain no spaces, only alphanumerics. Note that the example given has a name, but really it should be up to the agent's own preference. Please be consistent with this with yourself, i.e., don't change it once established. Must pass regex: ${AGENT_NAME_REGEXP.source}`,
};
