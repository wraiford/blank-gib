import { CACHE_NAME, FILES_TO_CACHE } from "./service-worker-constants";

const logalot = true;

// const CACHE_NAME = 'blank-gib-web1-cache-v2'; // Cache name (bump version to invalidate cache)
// const FILES_TO_CACHE = [ // Array of URLs to cache
//     // '#/apps/web1/gib/home.html',
//     // '#/apps/web1/gib/about.html',
//     // '#/apps/web1/gib/funding.html',
//     // '#/apps/web1/gib/links.html',
//     // '/components/web1/about/about.html',

//     '/icons/icon-256x256.png',
//     '/icons/icon-512x512.png',

//     '/index.mjs', // Cache your main index.html too, if needed
//     '/index.html', // Cache your main index.html too, if needed
//     '/root.css', // Cache your root vars CSS file too
//     '/styles.css', // Cache your main CSS file too
//     '/',           // Cache the root path for offline access
// ];


/**
 * can't use esm import in service worker, so just copy/pasting this here
 */
function extractErrorMsg(error: any): string {
    if (!error && error !== 0) {
        return '[error is falsy]';
    } else if (typeof error === 'string') {
        return error;
    } else if (typeof error.message === 'string') {
        return error.message;
    } else if (typeof error === 'number') {
        return JSON.stringify(error);
    } else if (!!error.error) {
        // the caller has used the "wrong" signature type
        console.warn(`[${extractErrorMsg.name}] this fn takes the raw error object. no destructure required. change your call from extractErrorMsg({error}) to extractErrorMsg(error). (W: ea49af5fd76d4b80a55a108d73a3e9b4)`);
        return extractErrorMsg(error.error);
    } else {
        return `[error is not a string and error.message is not a string. typeof error: ${typeof error} (E: d5a7723ca59646838308bc9e53a43134)]`;
    }
}

/**
 * development using Project IDX right now, and the dev url is very long. this
 * is a helper function to shorten that out.
 * @param url
 */
function shortenDevUrl(url: string): string {
    if (url.includes('ibgib-on-idx')) {
        const urlStart = url.substring(0, 'https://'.length) + '.../';
        let urlEnd: string;
        if (url.includes('#')) {
            urlEnd = url.substring(url.lastIndexOf('#'));
        } else {
            urlEnd = url.substring(url.lastIndexOf('.dev'));
        }
        return urlStart + urlEnd;
    } else {
        // return the actual url
        return url;
    }


}

async function initServiceWorker({
    sw,
}: {
    sw: ServiceWorkerGlobalScope,
}): Promise<void> {
    const lc = `[${initServiceWorker.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: a06e8f633e9867e83a670203e3b16525)`); }

        sw.addEventListener('install', (event: ExtendableEvent) => {
            console.log(`${lc}[install] triggered. (I: 9a0a816bd30f799f63466cf37b3eff25)`);
            event.waitUntil(new Promise(async (resolve, reject) => {
                try {
                    const cache: Cache = await caches.open(CACHE_NAME);
                    console.log(`${lc}[install] Pre-caching assets list... (I: dad59c08eef3750ac553ec7da2105b25)`);
                    FILES_TO_CACHE.forEach(file => console.log(`${lc}    ${file}`)); // Log files being cached
                    console.log(`${lc}[install] Pre-caching assets list complete. (I: dad59c08eef3750ac553ec7da2105b25)`);
                    const resAddAll = cache.addAll(FILES_TO_CACHE); // Add files to cache
                    resolve(resAddAll);
                } catch (error) {
                    console.error(`${lc}[install] ${extractErrorMsg(error)}`);
                    reject(error);
                }
            }));
            sw.skipWaiting(); // Immediately activate service worker
        });

        sw.addEventListener('activate', event => {
            console.log(`${lc}[activate] triggered. (I: 6067e19c16d12f10abbc223a8d420425)`);
            event.waitUntil(new Promise(async (resolve, reject) => {
                try {
                    const keyList = await caches.keys();
                    const deleteAllPromises = Promise.all(keyList.map(key => {
                        if (key !== CACHE_NAME) {
                            console.log(`${lc}[activate] Removing old cache for key: ${key} (I: e172edfaa96b44212f9892416b4f9725)`);
                            return caches.delete(key);
                        } else {
                            return Promise.resolve();
                        }
                    }));
                    resolve(deleteAllPromises);
                } catch (error) {
                    console.error(`${lc}[activate] ${extractErrorMsg(error)}`);
                    reject(error);
                }
            }));
            sw.clients.claim();
        });

        sw.addEventListener('fetch', event => {
            const url = shortenDevUrl(event.request.url);
            if (logalot) { console.log(`${lc}[fetch] triggered. event.request.url: ${url} (I: 11d3632d4788f1b13d86fdc24ddeed25)`); }
            event.respondWith(
                new Promise(async (resolve, reject) => {
                    try {
                        // Serve from cache if available, otherwise fetch from network
                        let response = await caches.match(event.request);
                        if (response) {
                            // not really an error/warning, but i want to see when
                            // this actually works from cache
                            // console.warn(`${lc} service worker heard this. event.request.url: ${shortenDevUrl(event.request.url)}. (W: c6de314914cf524a473a666371cc0a25)`)
                            if (logalot) { console.log(`${lc} YES, FOUND in cache (${url}) (I: 15f2829ab289299ba75e8231c788ae25)`); }
                        } else {
                            if (logalot) { console.log(`${lc} NO, NOT found in cache (${url}) (I: 134a7314dc0b940fe4e3014a09ae1625)`); }
                            response = await fetch(event.request);
                        }
                        resolve(Promise.resolve(response));
                    } catch (error) {
                        console.error(`${lc}[fetch] ${extractErrorMsg(error)}`);
                        reject(error);
                    }
                })
            );
        });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

initServiceWorker({ sw: self as any as ServiceWorkerGlobalScope })
    .then(() => {
        console.log(`[service-worker.js] ${initServiceWorker.name} function has completed. (I: cc9687d2dc9e59b4f98e394b502ce425)`)
    });
