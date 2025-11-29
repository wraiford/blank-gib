export const KEYSTONE_ATOM = "keystone";

/**
 * The specific ibGib address for the 'revoke' verb.
 * Used in Claims to indicate the Keystone should be considered dead.
 *
 * NOTE: This is a primitive ibGib address (ib='revoke', gib='gib'),
 * _but with the `gib` being implied_.
 */
export const VERB_REVOKE = "revoke";

/**
 * Standard pool IDs can be conventionally named after their primary verb.
 */
export const POOL_ID_REVOKE = VERB_REVOKE;
export const POOL_ID_DEFAULT = "default";
