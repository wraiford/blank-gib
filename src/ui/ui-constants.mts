/**
 * these are the variables able to be changed dynamically in the UI.
 */
export const VALID_CSS_VARIABLES = [
    '--text-color-base',
    '--background-color-base',
    '--border-color-base',
    '--border-width-base',
    '--border-style-base',
    '--font-family-base',
    '--font-size-base',
    '--highlight-border-color',
    '--highlight-box-shadow-color',
    '--side-panel-tab-content-background-color',

    '--light-background-color',
    '--very-light-background-color',

    // #region tabs
    '--tab-background-color',
    '--tab-background-color-active',
    '--tab-text-color',
    '--tab-text-color-active',
    '--tab-border-color',
    '--tab-border-color-active',
    '--tab-border-width',
    '--tab-border-width-active',
    '--tab-border-style',
    '--tab-border-radius',
    '--tab-padding',
    // #endregion tabs

    // #region links
    '--link-color',
    '--link-visited-color',
    '--link-hover-color',
    '--link-text-decoration',
    '--link-hover-text-decoration',
    // #endregion links

    // #region buttons
    '--button-background-color-base',
    '--button-text-color-base',
    '--button-border-color-base',
    '--button-border-width-base',
    '--button-border-style-base',
    '--button-border-radius-base',
    '--button-padding-base',
    '--button-hover-background-color',
    '--button-hover-text-color',
    '--button-hover-border-color',
    // #endregion buttons

    // #region inputs
    '--input-background-color',
    '--input-text-color',
    '--input-border-color',
    '--input-border-width',
    '--input-border-style',
    '--input-border-radius',
    '--input-padding',
    // #endregion inputs

    // #region headings
    '--h1-font-size',
    '--h1-font-weight',
    '--h1-margin',
    '--h2-font-size',
    '--h2-font-weight',
    '--h2-margin',
    '--h3-font-size',
    '--h3-font-weight',
    '--h3-margin',
    // #endregion headings

    // #region message types
    '--agent-background-color',
    '--agent-text-color',
    '--human-background-color',
    '--human-text-color',
    '--code-background-color',
    '--code-text-color',
    '--function-background-color',
    '--function-text-color',
    '--unknown-background-color',
    '--unknown-text-color',
    // #endregion message types

    // #region scrollbar
    '--scrollbar-thumb-color',
    '--scrollbar-track-color',
    // #endregion scrollbar
];

/**
 * 06/2025
 * going to use this for storing/restoring themes
 */
export const UI_THEME_INFO_KEY = 'ui-theme-info';
