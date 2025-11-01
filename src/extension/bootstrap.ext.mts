
import { extractErrorMsg, pretty, pickRandom_Letters } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { SPACE_NAME_REGEXP } from "@ibgib/core-gib/dist/witness/space/space-constants.mjs";

import {
    GLOBAL_LOG_A_LOT, BLANK_GIB_DB_NAME, ARMY_STORE,
    BLANK_GIB_INDEXEDDB_KEY_LOCAL_SPACE_NAME,
    BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX,
} from "../constants.mjs";
import { Metaspace_Webspace } from "../witness/space/metaspace/metaspace-webspace/metaspace-webspace.mjs";
import { storageGet } from "../storage/storage-helpers.web.mjs";
import { getIbGibGlobalThis_BlankGibExt, initIbGibGlobalThis_BlankGibExt } from "./helpers.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export async function bootstrapMetaspace(): Promise<MetaspaceService> {
    const lc = `[bootstrapMetaspace]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }


        const bootstrapPromise = initIbGibGlobalThis_BlankGibExt();
        await bootstrapPromise;
        const ibgibGlobal = getIbGibGlobalThis_BlankGibExt();
        ibgibGlobal.bootstrapStarted = true;
        ibgibGlobal.bootstrapPromise = bootstrapPromise;

        if (ibgibGlobal.metaspace) {
            if (logalot) { console.log(`${lc} metaspace already initialized.`); }
            return ibgibGlobal.metaspace;
        }

        if (logalot) { console.log(`${lc} creating metaspace...`); }
        let metaspace = new Metaspace_Webspace(/*cacheSvc*/undefined);
        if (logalot) { console.log(`${lc} creating metaspace complete. initializing...`); }

        const existingLocalSpaceName = await storageGet({
            dbName: BLANK_GIB_DB_NAME,
            storeName: ARMY_STORE,
            key: BLANK_GIB_INDEXEDDB_KEY_LOCAL_SPACE_NAME,
        });

        const spaceName = existingLocalSpaceName ?
            undefined :
            await getNewIbGibDotComLocalSpaceName();

        await metaspace.initialize({
            spaceName,
            metaspaceFactory: undefined,
            getFnAlert: () => { return ({ title, msg }) => Promise.resolve(console.log(`alert: ${title}: ${msg}`)) },
            getFnPrompt: () => { return ({ title, msg }) => { console.log(`prompt: ${title}: ${msg}`); return Promise.resolve('not implemented'); } },
            getFnPromptPassword: () => { return () => { console.log('prompt password not implemented'); return Promise.resolve('not implemented'); } },
        });

        if (logalot) {
            console.log('\n\n\n')
            console.log(`${lc} metaspace.zerospace:\n${pretty(metaspace.zeroSpace)}`)
            console.log('\n\n\n')
            console.log(`${lc} metaspace localUserSpace:\n${pretty(await metaspace.getLocalUserSpace({ lock: false }))}`)
            console.log('\n\n\n')
            console.log(`${lc} initialize metaspace complete.`);
        }

        ibgibGlobal.metaspace = metaspace;
        return metaspace;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function getNewIbGibDotComLocalSpaceName(): Promise<string> {
    const lc = `[getNewIbGibDotComLocalSpaceName]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        const name = BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX + '_' + pickRandom_Letters({ count: 12 });
        if (!SPACE_NAME_REGEXP.test(name)) {
            throw new Error(`(UNEXPECTED) automatically generated space name (${name}) does not match space name regexp? RegExp: ${SPACE_NAME_REGEXP.source}`);
        }
        return name;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
