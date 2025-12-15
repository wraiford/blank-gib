import { delay, extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

// console.timeLog(lc, 'initIbGibGlobalThis complete');

import { GLOBAL_LOG_A_LOT } from './constants.mjs';
import {
    dynamicallyLoadBootstrapScript,
    // initIbGibGlobalThis,
    initBlankGibStorage,
} from './helpers.web.mjs';

// await initIbGibGlobalThis();

import { simpleIbGibRouterSingleton as router } from './ui/router/router-one-file.mjs';
import { getAppShellSvc } from './ui/shell/app-shell-service.mjs';
// import { initRegisterServiceWorker } from './init-service-worker.mjs';

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
                // await initRegisterServiceWorker();
                // console.timeLog(lc, 'initRegisterServiceWorker complete');
                await initBlankGibStorage();
                console.timeLog(lc, 'initBlankGibStorage complete');
                const shellLayoutSvc = getAppShellSvc();
                console.timeLog(lc, 'getShellLayoutSvc complete (not initialized yet tho)');
                // await shellLayoutSvc.initialize(); // happens in ctor now
                console.timeLog(lc, 'initLayout complete');
                // await delay(9999999999);
                router.loadCurrentURLPath();
                console.timeLog(lc, 'loadCurrentURLPath complete');
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
