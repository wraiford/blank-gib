import { tagTextToIb } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

export const GLOBAL_LOG_A_LOT = false;
export const GLOBAL_TIMER_NAME = '[blank^gib timer]';


/**
 * I'm debating whether or not to have a single db.
 */
export const BLANK_GIB_DB_NAME = 'blank^gib';
/**
 * don't remember why this is named this
 */
export const ARMY_STORE = 'army store';
/**
 * don't remember why this is named this
 */
export const BEE_KEY = 'bee key';
export const BLANK_GIB_INDEXEDDB_KEY_LOCAL_SPACE_NAME = 'local_space_name';
/**
 * user's default local space will be first initialized on first visit to this
 * plus some random id.
 */
export const BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX = 'ibgib_dot_com';

/**
 * regex for what we think of as a gemini api key.
 */
export const GEMINI_API_KEY_REGEXP = /^[a-zA-Z0-9\-_]{32,64}$/;
export const CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP = `Gemini API Key Config option (⚙️ icon in the top right)`;

/**
 * if the app should show expand panels animation
 */
export const KEY_TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT = 'tutorial panels expand animation count';
export const TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT_ENOUGH_ALREADY = 3;

/**
 * this is used to differentiate the shell from embedded sites. I can't just
 * test for iframe embedded because project idx shows the entire app in an
 * iframe, and this throws things off.
 */
export const HTML_META_APP_ID_NAME = "ibgib-app-id";
/**
 * @see {@link HTML_META_APP_ID_NAME}
 */
export const HTML_META_APP_ID_CONTENT = "8d6217327e6490650169be9cb22a0b25";

/**
 * used for the agent tag, in ibgib.data.text
 */
export const TAG_AGENT_TEXT = "agent";
/**
 * used for the agent tag, in ibgib.data.icon
 */
export const TAG_AGENT_ICON = "body-outline";
/**
 * used for the agent tag, in ibgib.data.description
 */
export const TAG_AGENT_DESCRIPTION = "This tag tracks the active agents for the current local user space.";
/**
 * the ib value of the tag ibgib for the agents.
 */
export const TAG_AGENT_IB = tagTextToIb(TAG_AGENT_TEXT);

export const DEFAULT_IBGIB_COLOR = '#78f87e88';
export const DEFAULT_IBGIB_TRANSLUCENT = '#78f87e10';
export const DEFAULT_IBGIB_COLOR_CONTRAST = '#ffffff';
export const DEFAULT_TJP_COLOR = '#78f87e88';
export const DEFAULT_TJP_COLOR_TRANSLUCENT = '#78f87e10';
export const DEFAULT_TJP_COLOR_CONTRAST = '#ffffff';

/**
 * I am toying with tagging hardcoded prompts at the moment (atow 05/2025)
 */
export const HARDCODED_PROMPT_TAG_TEXT = 'AUTOMATED_TEXT';
