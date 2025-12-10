/**
 * @module bootstrap does the startup code for ibgib-specific things, like
 * initializing the metaspace and starting the blank-canvas app.
 */

import {
    clone, extractErrorMsg, getUUID, pickRandom_Letters, pretty,
} from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { RCLIArgInfo, RCLIArgType } from "@ibgib/helper-gib/dist/rcli/rcli-types.mjs";
import { buildArgInfos } from "@ibgib/helper-gib/dist/rcli/rcli-helper.mjs";
import { IbGibAddr, TransformResult } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { Factory_V1 as factory } from "@ibgib/ts-gib/dist/V1/factory.mjs";
import { Rel8n } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAppAny } from "@ibgib/core-gib/dist/witness/app/app-base-v1.mjs";
import { getFromSpace } from "@ibgib/core-gib/dist/witness/space/space-helper.mjs";
import { createNewApp, getAppIb, getInfoFromAppIb } from "@ibgib/core-gib/dist/witness/app/app-helper.mjs";
import { AppIbGib_V1, AppPromptResult } from "@ibgib/core-gib/dist/witness/app/app-types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
import { APP_REL8N_NAME } from '@ibgib/core-gib/dist/witness/app/app-constants.mjs'
import { TAG_REL8N_NAME } from "@ibgib/core-gib/dist/common/tag/tag-constants.mjs";
import { TagIbGib_V1 } from "@ibgib/core-gib/dist/common/tag/tag-types.mjs";
import { SPACE_NAME_REGEXP } from "@ibgib/core-gib/dist/witness/space/space-constants.mjs";

import {
    GLOBAL_LOG_A_LOT,
    BLANK_GIB_DB_NAME, ARMY_STORE,
    TAG_AGENT_TEXT, TAG_AGENT_ICON, TAG_AGENT_DESCRIPTION,
    BLANK_GIB_INDEXEDDB_KEY_LOCAL_SPACE_NAME,
    BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX,
} from "./constants.mjs";
import { PARAM_INFOS, PARAM_INFO_INTERACTIVE, } from "./witness/app/blank-canvas/blank-canvas-constants.mjs";
import {
    createRequestCommentIbGib, validateArgInfos, validateParamInfos
} from "./witness/app/blank-canvas/blank-canvas-helper.mjs";
import { RequestCommentIbGib_V1 } from "./types.mjs";
import {
    alertUser, promptForSecret, promptForText, getIbGibGlobalThis_BlankGib,
} from "./helpers.web.mjs";
import type { IbGibGlobalThis_Common, } from "./types.mjs"
import { Metaspace_Webspace } from "./witness/space/metaspace/metaspace-webspace/metaspace-webspace.mjs";
import { BlankCanvasApp_V1, BlankCanvasApp_V1_Factory } from "./witness/app/blank-canvas/blank-canvas-app-v1.mjs";
import {
    BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1,
    DEFAULT_BLANK_CANVAS_APP_DATA_V1, DEFAULT_BLANK_CANVAS_APP_REL8NS_V1,
} from "./witness/app/blank-canvas/blank-canvas-types.mjs";
import { storageGet } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import { LiveProxyIbGib } from "./witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";
import { AUTO_GENERATED_VERSION } from "./AUTO-GENERATED-version.mjs";
import { registerDeprecatedFunctionNamesAndFunctionInfos_Web } from "./api/function-infos.web.mjs";

console.log(`[blank-gib bootstrap] version: ${AUTO_GENERATED_VERSION}`);

const logalot = GLOBAL_LOG_A_LOT;

let blankCanvasApp: BlankCanvasApp_V1 | undefined = undefined;

/**
 * idempotent function that checks the ibgib global this for blank gib.
 * @see {@link getIbGibGlobalThis_BlankGib}
 * @see {@link IbGibGlobalThis_Common.bootstrapStarted}
 * @see {@link IbGibGlobalThis_Common.bootstrapPromise}
 */
export async function bootstrapBlankCanvasApp() {
    const lc = `[${bootstrapBlankCanvasApp.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 9fed7a1e65fb9606f9ac78d68f69f424)\n`); }

        // await initIbGibGlobalThis(); // done in index.mts

        // if we're already bootstrapping, then return that promise.
        const ibGibGlobalThis = getIbGibGlobalThis_BlankGib();
        if (ibGibGlobalThis.bootstrapStarted) {
            if (ibGibGlobalThis.bootstrapPromise) {
                console.warn(`${lc} already bootstrapping... awaiting that promise instead. I don't know if this is normal or not at this point in dev. (W: ac67975e9926a2abc623fb3fbed30125)`);
            } else {
                throw new Error(`(UNEXPECTED) ibgib global bootstrapStarted but bootstrapPromise is falsy? (E: 076aaeaefd7727d148beadd42c879325)`);
            }
        } else {
            // not already bootstrapping
            ibGibGlobalThis.bootstrapStarted = true;
            ibGibGlobalThis.bootstrapPromise = new Promise<void>(async (resolve, reject) => {
                try {
                    const args = await bootstrapBlankCanvasApp_getOpeningArgs();

                    // #region validation

                    if (logalot) { console.warn(`${lc} todo: change logalot type to number | boolean in helper-gib`); }
                    const paramInfosValidationErrors = validateParamInfos({ paramInfos: PARAM_INFOS });
                    if (paramInfosValidationErrors.length > 0) { throw new Error(`(UNEXPECTED) invalid PARAM_INFOS configured? errors: ${paramInfosValidationErrors.join('|')} (E: ca8876579327c751cffa8fc651c66d24)`); }
                    const argInfos = buildArgInfos({ args, paramInfos: PARAM_INFOS, logalot: !!logalot });
                    if (logalot) { console.log(`${lc} argInfos: ${pretty(argInfos)} (I: c3f491187c8a8e6d4e37a2413a56bd24)`); }

                    const validationErrors = validateArgInfos({ argInfos });
                    if (validationErrors) {
                        throw new Error(`Uh oh, the args had validation errors (E: 1bcbebd1a02656b0865579f5b778fb24):\n\n${validationErrors}`);
                    }

                    if (logalot) {
                        console.log(`${lc} here are the validated args (I: 58b0068ac5dcac5caa27539dbc0a5d24)`);
                        for (let i = 0; i < args.length; i++) {
                            const arg = args[i];
                            console.log(`arg ${i}: ${arg}`);
                        }
                    }

                    // #endregion validation

                    await bootstrapBlankCanvas_execFromArgs({ args, argInfos });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        }

        await ibGibGlobalThis.bootstrapPromise;
    } catch (error) {

        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`\n${lc} complete.`); }
    }
}

/**
 * in this app, we are fudging to reuse the plumbing of the ibgib RCLI app. in
 * that ibgib RCLI app atow (12/2024), there are always args. so before
 * initializing the metaspace, it first creates the request comment ibgib
 * (though it doesn't save it in any space yet). so we will test to see if there
 * is any existing metaspace to work with. if there isn't, we will create/mimic
 * an --init arg. if there is already a metaspace initialized, then we will
 * create/mimic a --interactive arg.
 */
async function bootstrapBlankCanvasApp_getOpeningArgs(): Promise<string[]> {
    const lc = `[${bootstrapBlankCanvasApp_getOpeningArgs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 0a3c72b5227f7e6357635e45f5616524)`); }
        // what happens if we always do interactive?
        // this definitely fails in the RCLI version, but with the web version?
        // seems to work fine.
        return [`--${PARAM_INFO_INTERACTIVE.name}`];

        // check for existing metaspace
        // const exists = await storageDBExists({ dbName: BLANK_GIB_DB_NAME });
        // if (exists) {
        //     // metaspace already exists
        //     return [`--${PARAM_INFO_INTERACTIVE.name}`];
        // } else {
        //     // no metaspace exists so we must init
        //     return [`--${PARAM_INFO_INIT.name}`];
        // }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Subfunction from {@link bootstrapBlankCanvasApp} that converts the incoming args into a
 * comment ibgib. Then, depending on the contents of the args, routes to the
 * proper initialization and/or execution function.
 *
 * This is what will ultimately execute the BlankCanvas_App witness, but first we need
 * to establish the context space (web space impl) and initialize.
 */
async function bootstrapBlankCanvas_execFromArgs({
    args,
    argInfos,
}: {
    args: string[],
    argInfos: RCLIArgInfo[]
}): Promise<void> {
    const lc = `[${bootstrapBlankCanvas_execFromArgs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 85e346005ff482a116e3352fbd962a24)`); }

        const resRequestCommentIbGib = await createRequestCommentIbGib({
            args,
            interpretedArgInfos: argInfos,
            // space:        // no metaspace yet
            // saveInSpace?: // no metaspace yet
        });

        // "Three" cases:
        // 1. init a new metaspace
        // 2. start an interactive repl session
        // 3. exec some other rcli cmd as a one-off

        /**
         * if we're doing the very first --init, we only want to init the metaspace once.
         */
        let metaspace: MetaspaceService | undefined = undefined;

        metaspace = await bootstrap_execFromArgs_initMetaspace({
            argInfos,
        });
        // await initIbGibGlobalThis();
        const ibgibGlobalThis = getIbGibGlobalThis_BlankGib();
        ibgibGlobalThis.metaspace = metaspace;
        await ensureTagsExist({ metaspace });

        registerDeprecatedFunctionNamesAndFunctionInfos_Web();

        if (logalot) { console.log(`${lc} save resRequestCommentIbGib starting... (I: 683091820d4abc5a68e14177944d0e24)`); }
        await metaspace.persistTransformResult({ resTransform: resRequestCommentIbGib });
        if (logalot) { console.log(`${lc} save resRequestCommentIbGib complete. (I: bf860bc6bfaaf5ca4842204453423424)`); }
        ibgibGlobalThis.initialCommentIbGib = resRequestCommentIbGib.newIbGib;
        const proxy = new LiveProxyIbGib();
        await proxy.initialized;
        proxy.setWrappedIbGib({ ibGib: resRequestCommentIbGib.newIbGib });
        ibgibGlobalThis.initialCommentIbGibProxy = proxy;

        // if (argInfos.some((x, i) => argIs({ arg: x.name, paramInfo: PARAM_INFO_INTERACTIVE, argInfoIndex: i, }))) {
        //     if (logalot) { console.log(`${lc} start interactive repl session (I: d0f1cd50c46db64c4d2dc7cdcb5cd224)`); }

        //     // if we were in an angular app, we would navigate at this point
        //     // to the home page. in the mvp, this would be backed by the
        //     // ibgib base component plumbing.

        //     // instantiate an BlankCanvas app
        await execInteractive_BlankCanvasApp({
            argInfos,
            resRequestCommentIbGib,
            metaspace,
        });

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`\n${lc} complete.`); }
    }
}

async function bootstrap_execFromArgs_initMetaspace({
    argInfos,
}: {
    argInfos: RCLIArgInfo<string>[],
}): Promise<MetaspaceService> {
    const lc = `[${bootstrap_execFromArgs_initMetaspace.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 6728dd380e5910349cf8302fe638e224)`); }
        if (logalot) { console.log(`${lc} creating metaspace... (I: 295674fcc3310128385967c273bf7e24)`); }
        let metaspace = new Metaspace_Webspace(/*cacheSvc*/undefined);
        if (logalot) { console.log(`${lc} creating metaspace complete. initializing... (I: 36ceb45e98eb3f92052eccd2bf4cb324)`); }

        // this is now done in initBlankGibStorage in index.mts
        // await storageCreateStoreIfNotExist({
        //     dbName: BLANK_GIB_DB_NAME,
        //     storeName: ARMY_STORE,
        // });

        const existingLocalSpaceName = await storageGet({
            dbName: BLANK_GIB_DB_NAME,
            storeName: ARMY_STORE,
            key: BLANK_GIB_INDEXEDDB_KEY_LOCAL_SPACE_NAME,
        });

        const spaceName = existingLocalSpaceName ?
            // not the first time bootstrapping
            undefined :

            // first time bootstrapping
            await getNewIbGibDotComLocalSpaceName();

        await metaspace.initialize({
            spaceName,
            metaspaceFactory: undefined,
            getFnAlert: () => { return ({ title, msg }) => alertUser({ title, msg, }) },
            getFnPrompt: () => { return ({ title, msg }) => promptForText({ title, msg, confirm: false }); },
            getFnPromptPassword: () => { return () => promptForSecret({ confirm: true }) },
        });

        // initialize with web fs space for local space
        if (logalot) {
            console.log('\n\n\n')
            console.log(`${lc} metaspace.zerospace:\n${pretty(metaspace.zeroSpace)} (I: 5fa27f7ad604c66d058c2143a4642b24)`)
            console.log('\n\n\n')
            console.log(`${lc} metaspace localUserSpace:\n${pretty(await metaspace.getLocalUserSpace({ lock: false }))} (I: 9b4a515ce54d082e4ca04afe02691d24)`)
            console.log('\n\n\n')
            console.log(`${lc} initialize metaspace complete. (I: 10fac46f933e08e6914fe6a57a629624) (I: ef68cf31210d3f9ddff3e38ebb373f24)`);
        }

        return metaspace;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function execInteractive_BlankCanvasApp({
    argInfos,
    resRequestCommentIbGib,
    metaspace,
}: {
    argInfos: RCLIArgInfo<RCLIArgType>[],
    resRequestCommentIbGib: TransformResult<RequestCommentIbGib_V1>,
    metaspace: MetaspaceService,
}): Promise<void> {
    const lc = `[${execInteractive_BlankCanvasApp.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 0bd0a5e510d6a5df4b0a4a5ce6851625)`); }

        const localUserSpace = await metaspace.getLocalUserSpace({ lock: false });
        if (!localUserSpace) { throw new Error(`(UNEXPECTED) localUserSpace falsy? (E: 74cb78230abfa79e0d5444589141fd24)`); }

        // get app
        blankCanvasApp = await exec_getBlankCanvasApp({
            metaspace,
            space: localUserSpace,
        });

        // now that we have the app, we can pass it the comment.

        // but first, persist the comment ibgib (and dependency graph) first...
        if (logalot) { console.log(`${lc} saving resRequestCommentIbGib (I: e8278643e60460b582b7f38ae54a3725)`); }
        await metaspace.persistTransformResult({ resTransform: resRequestCommentIbGib });
        if (logalot) { console.log(`${lc} saving resRequestCommentIbGib complete. (I: 269883847c82d1a6a7e1466b1a11f725)`); }

        // initialize the render service
        // const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
        // if (!canvasEl) { throw new Error(`(UNEXPECTED) canvasEl falsy? (E: 55bc83af2137fb8cb93bc2768749ac25)`); }
        // const _renderSvc = getRenderService({ canvasEl, });
        // const canvas = renderSvc.getCanvas();

        // ...now pass this to the app
        const requestCommentIbGib = resRequestCommentIbGib.newIbGib;
        blankCanvasApp.metaspace = metaspace;
        // blankCanvasApp.canvas = canvasEl;
        const _resBlankCanvasApp = await blankCanvasApp.witness(requestCommentIbGib);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * ported from @ibgib/ibgib app in apps/ibgib, which explains some of the weird
 * structure.
 */
export async function exec_getBlankCanvasApp({
    metaspace,
    space,
}: {
    metaspace: MetaspaceService,
    space: IbGibSpaceAny,
}): Promise<BlankCanvasApp_V1> {
    const lc = `[${exec_getBlankCanvasApp.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 573cf303ef92dd91698460247ab46325)`); }

        // going to get the apps index and get the first BlankCanvasApp_V1. if
        // none found, will create one.

        let appsIbGib = await metaspace.getSpecialIbGib({
            type: "apps",
            initialize: false,
            lock: false,
            space,
        });
        if (!appsIbGib) { throw new Error(`(UNEXPECTED) no apps index special ibgib. not initialized as expected? (E: 539be80cd9513ab2695ded9769c0ce25)`); }
        if (!appsIbGib.rel8ns) { throw new Error(`(UNEXPECTED) appsIbGib.rel8ns falsy? (E: 0c9f27b4c891bda07ed0e0b5d4b68e25)`); }

        const appIbGibAddrs = appsIbGib.rel8ns[APP_REL8N_NAME] ?? [] as IbGibAddr[];
        const blankCanvasAppAddrs =
            appIbGibAddrs
                .filter(ibGibAddr => {
                    let { ib } = getIbAndGib({ ibGibAddr });
                    let info = getInfoFromAppIb({ appIb: ib });
                    if (info.appClassname !== BlankCanvasApp_V1.name) {
                        return false;
                    } else {
                        // no app id specified, so accept all blankCanvasApps
                        return true;
                    }
                });

        let blankCanvasApp: BlankCanvasApp_V1;
        let blankCanvasAppAddr: IbGibAddr;

        if (blankCanvasAppAddrs.length === 0) {
            // the user doesn't have any apps in the space yet, so create one.
            blankCanvasApp = await exec_CreateAndSaveNewBlankCanvasApp({ metaspace, space, });
            blankCanvasAppAddr = getIbGibAddr({ ibGib: blankCanvasApp });
        } else if (blankCanvasAppAddrs.length === 1) {
            blankCanvasAppAddr = blankCanvasAppAddrs[0];
        } else {
            // blankCanvasAppAddrs.length > 1
            let list = blankCanvasAppAddrs.map(x => getIbAndGib({ ibGibAddr: x }).ib).map((ib, idx) => `\n${idx}) ${ib}`);
            let idxPicked: number | undefined;
            let huh = false;
            do {
                let response = await promptForText({ title: 'Which Blank Canvas App?', msg: `${huh ? 'huh? ' : ''}Multiple Blank Canvas apps found. Which one?${list}` });
                let parsedInt = Number.parseInt(response);
                if (Number.isNaN(parsedInt)) {
                    huh = true;
                } else if (parsedInt >= blankCanvasAppAddrs.length) {
                    huh = true;
                } else {
                    huh = false;
                    idxPicked = parsedInt;
                }
            } while (huh);
            blankCanvasAppAddr = blankCanvasAppAddrs[idxPicked!];
        }
        if (!blankCanvasAppAddr) { throw new Error(`(UNEXPECTED) blankCanvasAppAddr assumed to be set at this point. (E: c64e2c9add14ab766202dfbdc09db325)`); }
        let resGet = await getFromSpace({ addr: blankCanvasAppAddr, space });
        if (resGet.success && resGet.ibGibs?.length === 1) {
            // the resGet only retrieves the dto. since the BlankCanvasApp is a witness,
            // we need to load the dto into the object in memory.
            blankCanvasApp = resGet.ibGibs[0] as BlankCanvasApp_V1;
        } else {
            throw new Error(`couldn't get app (${blankCanvasAppAddr}) in space (${space.data!.uuid}). error: ${resGet.errorMsg ?? 'unknown yo (E: 54bfcfd3e7b6a2f787416cc99aced625)'} (E: 7ea72a757cbf412da28e730bb91d2c25)`);
        }

        // we want the full witness object, not just the ibgib dto, so check for
        // existence of the witness function.
        if (!blankCanvasApp.witness) {
            const blankCanvasAppWitness = new BlankCanvasApp_V1(undefined, undefined);
            await blankCanvasAppWitness.loadIbGibDto(blankCanvasApp);
            blankCanvasApp = blankCanvasAppWitness;
        }

        return blankCanvasApp;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * "filled-in" prompt function to be used in factory function creating
 * BlankCanvasApp_V1.
 */
function getFnPromptApp_dontPrompt({
    space,
    ibGib,
}: {
    space: IbGibSpaceAny,
    ibGib: AppIbGib_V1 | null
}): (space: IbGibSpaceAny, ibGib: AppIbGib_V1 | null) => Promise<AppPromptResult | undefined> {
    const lc = `[${getFnPromptApp_dontPrompt.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d7dc2292001527619e88d7d859823a25)`); }
        if (!!ibGib) { throw new Error(`editing app ibgib not implemented yet. only create, i.e. pass in null for ibGib (E: 480f0870a82b2a249a8dcbe68060fb25)`); }

        // console.warn(`${lc} right now, only BlankCanvas app is implemented (W: 57b047ba496e85caa113743da0c97725)`);

        // let fnResult: (space: IbGibSpaceAny, ibGib: AppIbGib_V1 | null) => Promise<AppPromptResult | undefined> =
        return async () => {
            const name = `${BlankCanvasApp_V1.name}_${pickRandom_Letters({ count: 8 })}`;
            console.log(`${lc} generated random name: ${name}`);
            const data = clone(DEFAULT_BLANK_CANVAS_APP_DATA_V1) as BlankCanvasAppData_V1;
            data.name = name;
            data.uuid = await getUUID();

            // the following is taken from the createApp function in
            // core-gib space-helper.mts i can't use that though because it
            // does additional steps, whereas this prompt function is
            // supposed to just do the mechanics and not save in spaces.
            const rel8ns = DEFAULT_BLANK_CANVAS_APP_REL8NS_V1 ?
                clone(DEFAULT_BLANK_CANVAS_APP_REL8NS_V1) as BlankCanvasAppRel8ns_V1 :
                undefined;
            const { classname } = data;

            const ib = getAppIb({ appData: data, classname });

            const resNewApp = await factory.firstGen({
                ib,
                parentIbGib: factory.primitive({ ib: `app ${classname}` }),
                data: data,
                rel8ns,
                dna: true,
                linkedRel8ns: [Rel8n.ancestor, Rel8n.past],
                nCounter: true,
                tjp: { timestamp: true },
            }) as TransformResult<IbGibAppAny>;

            let f = new BlankCanvasApp_V1_Factory();
            f.newUp({});

            return resNewApp;
        };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function exec_CreateAndSaveNewBlankCanvasApp({
    metaspace,
    space,
}: {
    metaspace: MetaspaceService,
    space: IbGibSpaceAny,
}): Promise<BlankCanvasApp_V1> {
    const lc = `[${exec_CreateAndSaveNewBlankCanvasApp.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 33d979c008d648d28821727bc27d1925)`); }

        // creates, persists, registers with special apps index in given space
        let app = await createNewApp({
            fnPromptApp: getFnPromptApp_dontPrompt({ space, ibGib: null }),
            space,
            ibgibs: metaspace,
        });

        if (!app) { throw new Error(`failed to create app (falsy) (E: 611ee7faa1fa2ee36ac8820303f3ba25)`); }
        if (app?.data?.classname !== BlankCanvasApp_V1.name) { throw new Error(`(UNEXPECTED) app other than  (E: ed1b36c34855c86cbf671a547863d525)`); }

        return app as BlankCanvasApp_V1;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function ensureTagsExist({
    metaspace,
}: {
    metaspace: MetaspaceService,
}): Promise<void> {
    const lc = `[${ensureTagsExist.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 1af28bd2357255508ff8299a39497f25)`); }
        const tagIbGibs = await metaspace.getSpecialRel8dIbGibs({
            type: "tags",
            rel8nName: TAG_REL8N_NAME,
        }) as TagIbGib_V1[];

        const hasAgentTag = tagIbGibs.some(x => x.data!.text! === TAG_AGENT_TEXT);
        if (!hasAgentTag) {
            await metaspace.createTagIbGib({
                text: TAG_AGENT_TEXT,
                icon: TAG_AGENT_ICON,
                description: TAG_AGENT_DESCRIPTION,
                space: undefined, // default local user space
            });
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * I'm changing bootstrapping to be on demand for first-time experience and to
 * automatically create a local space name. This is a small helper to create
 * that name.
 */
async function getNewIbGibDotComLocalSpaceName(): Promise<string> {
    const lc = `[${getNewIbGibDotComLocalSpaceName.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f57e2a07f08e4f41b43c529d892cc525)`); }
        const name = BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX + '_' + pickRandom_Letters({ count: 12 });
        if (!SPACE_NAME_REGEXP.test(name)) {
            throw new Error(`(UNEXPECTED) automatically generated space name (${name}) does not match space name regexp? RegExp: ${SPACE_NAME_REGEXP.source} (E: 7022587c2903d17b94f99aee02e7ba25)`);
        }
        return name;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
