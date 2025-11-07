export const HEADING_SCORE_H1 = 100;
export const HEADING_SCORE_H2 = 90;
export const HEADING_SCORE_H3 = 80;
export const HEADING_SCORE_H4 = 70;
export const HEADING_SCORE_H5 = 60;
export const HEADING_SCORE_H6 = 50;

export const MIN_TEXT_LENGTH_TO_CHUNK = 2048;

/**
 * never unwrap these uppercase tag names.
 *
 * ## intent
 *
 * I don't want to unwrap <p> tags, so that we can keep the navigation click
 * working. this is intended to fix this problem.
 */
export const TAGNAMES_UPPERCASE_UNWRAP_BLACKLIST = [
    'P', 'OL', 'UL', 'TABLE'
];

export const TAGNAMES_UPPERCASE_COLLAPSE_BLACKLIST = [
    'OL', 'UL', 'TABLE'
];
