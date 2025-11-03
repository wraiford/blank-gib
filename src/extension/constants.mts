export const CHUNK_ATOM = 'chunk';
export const CHUNK_REL8N_NAME_DEFAULT_DELIMITER = '___';
export const CHUNK_REL8N_NAME_PREFIX = CHUNK_ATOM;
export const CHUNK_REL8N_NAME_DEFAULT_CONTEXT_SCOPE = 'default';

export const SUMMARY_TEXT_ATOM = 'summarytext';
export const TRANSLATION_TEXT_ATOM = 'translationtext';

/**
 * property in ibgib.data that maps a "soft link" (soft rel8n as opposed to being put in ibgib.rel8ns) to the root comment that generated it.
 *
 * ## intent
 *
 * ATOW (10/2025), we are creating a single comment ibgib to represent an entire page,
 * and then we chunk that comment with the ability to further chunk those chunks
 * recursively (composite pattern). this maps back to the **original "root"
 * source** comment that they all came from.
 */
export const SRC_COMMENT_TJP_ADDR_PROPNAME = '@srcCommentTjpAddr';
/**
 * property in ibgib.data that maps a "soft link" (soft rel8n as opposed to
 * being put in ibgib.rel8ns) to the originating chunk comment ibgib that is not
 * synthetic, i.e., that maps directly to a DOM element (via `domInfo`).
 */
export const DOM_COMMENT_TJP_ADDR_PROPNAME = '@domCommentTjpAddr';
// /**
//  * property in ibgib.data that maps a "soft link" (soft rel8n as opposed to
//  * being put in ibgib.rel8ns) to the **direct parent** comment that generated
//  * it.
//  *
//  * ## intent
//  * @see {@link SRC_COMMENT_TJP_ADDR_PROPNAME} for more details on intent.
//  */
// export const PARENT_COMMENT_TJP_ADDR_PROPNAME = '@parentCommentTjpAddr';

/**
 * project associated with chunk comment
 *
 * ## intent
 * @see {@link SRC_COMMENT_TJP_ADDR_PROPNAME} for more details on intent.
 */
export const PROJECT_TJP_ADDR_PROPNAME = '@projectTjpAddr';
