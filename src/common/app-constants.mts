/**
 * @module app-constants is a temporary home for constants specifically for app
 * names/subnames.
 *
 * This also contains type guards.
 */

// #region RouterAppName
/**
 * @see {@link RouterAppName.web1}
 */
export const ROUTER_APP_NAME_WEB1 = 'web1';
/**
 * projects is a terrible name but this is what ibgib "projects" will be, like
 * timelines. I dunno, terrible name, it will resolve with time.
 */
export const ROUTER_APP_NAME_PROJECTS = 'projects';
/**
 * tags is used for browsing tags...are these actually "app" names? hmm....
 */
export const ROUTER_APP_NAME_TAGS = 'tags';

/**
 * Enum-like type for valid app names. These are atow used in whitelisting and
 * parsing for the SPA routing.
 *
 * Currently, this is only 'web1', but we can add more in the future.
 */
export type RouterAppName =
    | typeof ROUTER_APP_NAME_WEB1
    | typeof ROUTER_APP_NAME_PROJECTS
    | typeof ROUTER_APP_NAME_TAGS
    ;

/**
 * @see {@link RouterAppName}
 */
export const RouterAppName = {
    /**
     * @see {@link ROUTER_APP_NAME_WEB1}
     */
    web1: ROUTER_APP_NAME_WEB1 satisfies RouterAppName,
    /**
     * @see {@link ROUTER_APP_NAME_PROJECTS}
     */
    projects: ROUTER_APP_NAME_PROJECTS satisfies RouterAppName,
    /**
     * @see {@link ROUTER_APP_NAME_TAGS}
     */
    tags: ROUTER_APP_NAME_TAGS satisfies RouterAppName,
} as const satisfies { [k: string]: RouterAppName };

/**
 * Valid values for {@link RouterAppName}.
 */
export const VALID_ROUTER_APP_NAMES =
    Object.freeze(Object.values(RouterAppName));

/**
 * Type guard to check if a string is a valid {@link RouterAppName}.
 *
 * @param str string to check
 * @returns true if the string is a value in {@link RouterAppName}, else false.
 */
export function isValidRouterAppName(str: string): str is RouterAppName {
    return !!str && VALID_ROUTER_APP_NAMES.includes(str as any);
}

// #endregion RouterAppName

// #region Web1Filename
export const WEB1_FILENAME_HOME = 'home.html';
export const WEB1_FILENAME_ABOUT = 'about.html';
export const WEB1_FILENAME_FUNDING = 'funding.html';
export const WEB1_FILENAME_LINKS = 'links.html';
export type Web1Filename =
    | typeof WEB1_FILENAME_HOME
    | typeof WEB1_FILENAME_ABOUT
    | typeof WEB1_FILENAME_FUNDING
    | typeof WEB1_FILENAME_LINKS
    ;
export const WEB1_FILENAMES = {
    home: WEB1_FILENAME_HOME,
    about: WEB1_FILENAME_ABOUT,
    funding: WEB1_FILENAME_FUNDING,
    links: WEB1_FILENAME_LINKS,
} as const satisfies { [k: string]: Web1Filename };
export const VALID_WEB1_FILENAMES = Object.freeze(Object.values(WEB1_FILENAMES));
export function isValidWeb1Filename(str: string): str is Web1Filename {
    return !!str && VALID_WEB1_FILENAMES.includes(str as any);
}
// #endregion Web1Filename
