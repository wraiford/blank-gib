// const logalot = true;

import { AUTO_GENERATED_VERSION } from "./AUTO-GENERATED-version.mjs";

// AUTO_GENERATED_VERSION
// export const CACHE_NAME = 'blank-gib-web1-cache-v3'; // Cache name (bump version to invalidate cache)
export const CACHE_NAME = `blank-gib-web1-cache-v${AUTO_GENERATED_VERSION}`; // Cache name (bump version to invalidate cache)
export const FILES_TO_CACHE = [ // Array of URLs to cache
    // '#/apps/web1/gib/home.html',
    // '#/apps/web1/gib/about.html',
    // '#/apps/web1/gib/funding.html',
    // '#/apps/web1/gib/links.html',
    // '/components/web1/about/about.html',

    '/icons/icon-256x256.png',
    '/icons/icon-512x512.png',

    '/index.mjs', // Cache your main index.html too, if needed
    '/index.html', // Cache your main index.html too, if needed
    '/root.css', // Cache your root vars CSS file too
    '/styles.css', // Cache your main CSS file too
    '/',           // Cache the root path for offline access
];
