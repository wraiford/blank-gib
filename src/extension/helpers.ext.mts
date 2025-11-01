import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../constants.mjs';

const logalot = GLOBAL_LOG_A_LOT || true;

export async function getCurrentTabURL(): Promise<string> {
    const lc = `[${getCurrentTabURL.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: b50a08ececd86ed028276548f16ab225)`); }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const href = tab.url ?? window.location.href;
        if (!href) { throw new Error(`(UNEXPECTED) href falsy? couldn't get from tab.url or window.location.href? (E: genuuid)`); }

        return href;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
