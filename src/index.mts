import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { GLOBAL_LOG_A_LOT, APP_CONFIG } from './constants.mjs';
import {
    dynamicallyLoadBootstrapScript,
    initIbGibGlobalThis,
    initBlankGibStorage,
} from './helpers.web.mjs';

import { simpleIbGibRouterSingleton as router } from './ui/router/router-one-file.mjs';

// 1. Initialize global namespace immediately
initIbGibGlobalThis(APP_CONFIG);

const logalot = GLOBAL_LOG_A_LOT;

/**
 * spin off to avoid forestalling the DOMContentLoaded from firing
 */
async function spinOffStartup(): Promise<void> {
    const lc = `[${spinOffStartup.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f653d425fdef1255ee08520f05458c25)`); }
        console.time(lc);

        document.addEventListener('DOMContentLoaded', async () => {
            try {
                console.timeLog(lc, 'DOMContentLoaded fired');

                // Initialize storage
                await initBlankGibStorage();
                console.timeLog(lc, 'initBlankGibStorage complete');

                // Initialize Router
                router.loadCurrentURLPath();
                console.timeLog(lc, 'loadCurrentURLPath complete');

                // Load Bootstrap (ibGib Engine, metaspace, etc.)
                await dynamicallyLoadBootstrapScript();
                console.timeLog(lc, 'dynamicallyLoadBootstrapScript complete');
                console.timeEnd(lc);
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                throw error;
            }
        });

    } catch (error) {
        console.timeEnd(lc);
        debugger; // error in index.mts not good
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

spinOffStartup();
