import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { GLOBAL_LOG_A_LOT } from "./constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

/**
 * service worker for caching primarily
 */
export async function initRegisterServiceWorker(): Promise<void> {
    const lc = `[${initRegisterServiceWorker.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c1c0d1a80dd4d163dd901a9f53526625)`); }

        if ('serviceWorker' in navigator) {
            /** note that this is an absolute path from url root */
            const pathToSvcWorker = 'service-worker.mjs';
            const registration =
                await navigator.serviceWorker.register(pathToSvcWorker, { type: 'module' });
            console.log(`${lc} Registered successfully with scope: ${registration.scope}. (I: 8ad3ba091e4d54e7d993ac7252167f25)`);
        } else {
            console.log(`${lc} Service workers are not supported in this browser. (I: ce371335abc5231734c7a9cd2c89e125)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
