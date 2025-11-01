/**
 * @module helpers.web
 *
 * helper functions specific to the web version.
 */

import { delay, extractErrorMsg, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { Gib, IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { GIB } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { getGibInfo, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { validateIbGibIntrinsically } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { RawExportIbGib_V1 } from "@ibgib/core-gib/dist/common/import-export/import-export-types.mjs";
import { FlatIbGibGraph } from "@ibgib/core-gib/dist/common/other/graph-types.mjs";
import { decompressIbGibGraphFromString, deserializeStringToGraph } from "@ibgib/core-gib/dist/common/other/other-helper.web.mjs";
import { getRawExportIbGib } from "@ibgib/core-gib/dist/common/import-export/import-export-helper.web.mjs";
import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
    DEFAULT_IBGIB_COLOR, DEFAULT_IBGIB_COLOR_CONTRAST,
    DEFAULT_IBGIB_TRANSLUCENT, HTML_META_APP_ID_CONTENT, HTML_META_APP_ID_NAME,
    GEMINI_API_KEY_REGEXP,
    CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP
} from "./constants.mjs";
import { AUTO_GENERATED_VERSION } from "./AUTO-GENERATED-version.mjs";
import { IbGibGlobalThis_BlankGib, IbGibGlobalThis_Common } from "./types.mjs";
import { showFullscreenDialog } from "./ui/ui-helpers.mjs";
import { storageGet, storagePut } from "./storage/storage-helpers.web.mjs";
import { GibColorInfo } from "./types.web.mjs";
import { ProjectComponentInstance } from "./components/projects/project/project-component-one-file.mjs";
import { CHAT_WITH_AGENT_NEED_API_KEY } from "./witness/app/blank-canvas/blank-canvas-constants.mjs";


/**
 * used in verbose logging
 */
const logalot = GLOBAL_LOG_A_LOT;

/**
 * helper...since this base file works for both web app proper and the
 * extension, I need a way of not pulling in (hard) imports in esbuild.
 */
export function getIbGibGlobalThis_Common(): IbGibGlobalThis_Common {
    const lc = `[${getIbGibGlobalThis_Common.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: cce2af038b5e22022d22a16842a54825)`); }

        const globalThisIbGib: IbGibGlobalThis_Common | undefined =
            (globalThis as any).ibgib.blankgib ??
            (globalThis as any).ibgib.blankgib_ext;

        if (globalThisIbGib) {
            return globalThisIbGib;
        } else {
            throw new Error(`(UNEXPECTED) no IbGibGlobalThis (globalThis.ibgib.blankgib || globalThis.ibgib.blankgib_ext)? (E: 4f7e8ecb2ba852a48d2c5cbb0caa1e25)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getIbGibGlobalThis_BlankGib(): IbGibGlobalThis_BlankGib {
    return (globalThis as any).ibgib.blankgib as IbGibGlobalThis_BlankGib;
}

/**
 * sets a globalThis.ibgib
 *
 * ## driving use case
 *
 * in @ibgib/ibgib rcli, I wanted to be able to store the initial cwd() and not
 * have to pass this around.  since then, this is apparently a convenience
 * storage hack.
 *
 * @see {@link IbGibGlobalThis_BlankGib}
 */
export async function initIbGibGlobalThis(): Promise<void> {
    const lc = `[${initIbGibGlobalThis.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c71f63b0dcc3a6380e60765fb73b7924)`); }

        if (!!(globalThis as any).ibgib) {
            console.log(`${lc} globalThis.ibgib already truthy. (I: f26d8b274bd5734bb954427b4f091325)`);
        } else {
            (globalThis as any).ibgib = {};
        }

        if (!!(globalThis as any).ibgib.blankgib) {
            console.log(`${lc} globalThis.ibgib.blankgib already truthy. (I: 50c5a6a5b5cb3e5f0fb5072abe9c7724)`);
        } else {
            (globalThis as any).ibgib.blankgib = {
                // initialCwd: cwd(),
                version: AUTO_GENERATED_VERSION,
                spaceShim: {},
                fnDefaultGetAPIKey: async () => {
                    const apiKey = await storageGet({
                        dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                        key: BEE_KEY,
                    });
                    return apiKey ?? '';
                },
            } satisfies IbGibGlobalThis_BlankGib;
        }

        if (!!(globalThis as any))

            if (logalot) {
                console.log(`${lc} console.dir(globalThis.ibgib)... (I: 2b21982c9ae69f4d636d2a95b69a0824)`);
                console.dir((globalThis as any).ibgib);
            }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * converts string to Uint8Array.
 * @param str to convert
 * @returns array
 */
export function stringToUint8Array(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

/**
 * converts Uint8Array to string.
 * @param array to convert
 * @returns string
 */
export function uint8ArrayToString(array: Uint8Array) {
    const decoder = new TextDecoder();
    return decoder.decode(array);
}

/**
 * I'm pulling out node from @ibgib/ibgib rcli code. This interface is just to
 * aid in that transition.
 */
export interface PathUtilsHelper {
    isAbsolute(path: string): boolean;
    isRelative(path: string): boolean;

    // for now I'm taking out resolve since it requires being stateful and isn't
    // used AFAICT in the code I'm porting over
    // resolve(path: string): string;

    join(...paths: string[]): string;
    dirname(path: string): string;
    basename(path: string, ext?: string): string;
}

/**
 * Helper class that exposes pathUtils functions. Note that this is relative to
 * an individual space.
 */
export class PathUtilsHelper implements PathUtilsHelper {
    /** class-level log context */
    lc: string = `[${PathUtilsHelper.name}]`;

    // /**
    //  * this path utils helper is per space, so this is the id of that space.
    //  */
    // spaceId: SpaceId;
    /**
     *
     */
    // constructor({ spaceId, initialCwd, }: { spaceId: SpaceId, initialCwd: string }) {
    //     const lc = `${this.lc}[ctor]`;
    //     this.spaceId = spaceId;
    //     let ibGibGlobalThis = getIbGibGlobalThis();
    //     if (!ibGibGlobalThis.spaceShim[spaceId]) {
    //         console.log(`${lc} initializing IbGibGlobalThis data`);
    //         // initialize
    //         ibGibGlobalThis.spaceShim[spaceId] = {
    //             cwd: initialCwd,
    //             initialCwd,
    //         };
    //     } else {
    //         if (logalot) { console.log(`${lc} ibgib global this already initialized (I: e48b0cb4075e536d150919e87ddc1f24)`); }
    //     }
    // }
    /**
     *
     */
    constructor() { }

    isAbsolute(path: string): boolean {
        if (!path) { throw new Error(`(UNEXPECTED) path falsy? (E: dcb92e11770ba06205c0afe3e6560b24)`); }
        return path.startsWith('/');
    }

    isRelative(path: string): boolean {
        return !this.isAbsolute(path);
    }

    // resolve(path: string): string {
    //     const lc = `${this.lc}[${this.resolve.name}]`;
    //     if (!path) { throw new Error(`(UNEXPECTED) path falsy? (E: 76161b12dbd446a0c2a9e18f4847fc24)`); }

    //     // for our implementation, we will throw if there is a relative path
    //     // specifier (. or ..) in the middle of the path. the proper
    //     // implementation probably resolves these concretely.

    //     if (this.isAbsolute(path)) {
    //         if (path.includes('/../') || path.endsWith('/..')) { throw new Error(`path is absolute but contains "/../" in it or ends with "../"? (E: 16145bf37d874abc886111c32c035124)`); }
    //         return path;
    //     }

    //     // we have a relative path. get the cwd from global for this particular space. If this space has no
    //     let ibGibGlobalThis = getIbGibGlobalThis();
    //     let info = ibGibGlobalThis.spaceShim[this.spaceId];
    //     if (!info) { throw new Error(`(UNEXPECTED) no info for spaceId in ibgibglobalthis? (E: c063f34ed784e70ccd19a6b2026eb924)`); }

    //     const { cwd } = info;
    //     if (!cwd) { throw new Error(`(UNEXPECTED) cwd falsy? (E: 91cbd7418a51d9d152ae53d4f87b3a24)`); }
    //     if (path.startsWith(cwd)) {
    //         console.log(`${lc} path already resolved (starts with cwd). path: ${path} (I: 1d99a4bad47398174fe127b85088fb24)`);
    //     }
    //     if (cwd.endsWith('/')) {
    //         // cwd does end with slash, so slice off initial if needed
    //         return cwd + (path.startsWith('/') ? path.slice(1) : path);
    //     } else {
    //         // cwd does NOT end with slash, so add if needed
    //         return cwd + (path.startsWith('/') ? path : `/${path}`);
    //     }
    // }

    join(...paths: string[]): string {
        const lc = `${this.lc}[${this.join.name}]`;

        if (paths.length === 0) {
            console.log(`${lc} paths.length === 0. returning '.' per node convention. (I: 153da80765ff6160675fae895ebac225)`);
            return '.'; /* <<<< returns early */
        }
        if (paths.length === 1 && paths[0] === '..') {
            console.log(`${lc} paths.length === 1 && paths[0] === '..'.  returning '..' per node convention. (I: 9af242b7615430a8c6899b1a332e9925)`);
            return '..'; /* <<<< returns early */
        }

        let joined = '';
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (path === '..') {
                joined = joined.split('/').slice(0, -1).join('/');
            } else {
                if (path.startsWith('/')) { path = path.slice(1); }
                if (path.endsWith('/')) {
                    path = path.slice(0, -1);
                }
                joined += (i > 0 ? '/' : '') + path;
            }
        }

        return joined;
    }

    dirname(path: string): string {
        return path.split('/').slice(0, -1).join('/');
    }

    basename(path: string, ext?: string): string {
        return path.split('/').pop() ?? '';
    }
}


export async function copyToClipboard({
    data,
    logalot,
}: {
    data: { title?: string, text?: string, url?: string },
    logalot?: boolean,
}): Promise<void> {
    const lc = `[${copyToClipboard.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 37d6a4e3c3ee9fa46a0b1cd5c8a5cf24)`); }
        let { title, text, url } = data;
        const textToCopy = [
            `${data.title || ''}`,
            `${data.text || ''}`,
            `${data.url || ''}`,
        ].join('\n').trim();
        await navigator.clipboard.writeText(textToCopy);
        console.log('Content copied to clipboard!');
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * helper to trigger browser's share functionality (or fallback).
 */
export async function shareContent({
    data,
    logalot,
}: {
    data: { title?: string, text?: string, url?: string },
    logalot?: boolean,
}): Promise<void> {
    const lc = `[${shareContent.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: bfc7e484eba91f9126c3f5fc381e6424)`); }

        if (navigator.share) {
            await navigator.share(data);
            console.log('Content shared successfully!');
        } else {
            console.warn('Web Share API not supported. Copying to clipboard instead.');
            alert(`Share info copied to clipboard!`);
            await copyToClipboard({ data, logalot });
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * useful for knowing if we are executing in our website or within an iframe.
 *
 * ## driving use case
 *
 * When we are loading an embedded iframe for link-gib, it is trying to trigger
 * the router which is no bueno.
 *
 * This is causing a problem though when testing inside an iframe in Project
 * IDX...I guess I'll have to whitelist embedded sites like link-gib
 *
 * @returns true if we are executing in an iframe, false otherwise.
 */
export function isExecutingInBlankGibWebAppProper(): boolean {
    const metaElement =
        document.querySelector(`meta[name=${HTML_META_APP_ID_NAME}]`) as (HTMLMetaElement | null);
    return !!metaElement && metaElement.content === HTML_META_APP_ID_CONTENT;
}

/**
 * helper that waits until the global metaspace is initialized and then returns
 * that metaspace.
 *
 * NOTE: This does not have a max count breakout or cancellation. The metaspace
 * is simply integral to the website and this is not expected to fail (otherwise
 * the entire website is foo anyway).
 *
 * ## driving use case
 *
 * when the router tries to load a route that is based on an ibgib, the
 * metaspace is required.
 */
export async function getGlobalMetaspace_waitIfNeeded({
    delayIntervalMs = 50
}: {
    delayIntervalMs: number
} = { delayIntervalMs: 50 }): Promise<MetaspaceService> {
    const lc = `[${getGlobalMetaspace_waitIfNeeded.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 4acc22d08dd1100503f9b0423f302925)`); }
        let metaspace: MetaspaceService | undefined;
        while (!metaspace) {
            // global metaspace is loading. we have apparently loaded a tags route
            // immediately out the gate and the metaspace hasn't initialized yet.
            if (getIbGibGlobalThis_Common().metaspace) {
                metaspace = getIbGibGlobalThis_Common().metaspace!;
            }
            if (!metaspace) {
                console.log(`${lc} metaspace still not initialized, but we are trying to route an ibgib. So we're delaying until the metaspace is initialized. (I: 490f77ac4ded1d7d3c0340e460404125)`);
                await delay(delayIntervalMs);
            }
        }
        return metaspace;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Low-level plumbing for prompting the user for some text.
 *
 * ## notes
 *
 * * if an empty string is entered, confirm is automatic/always happens.
 * * if confirm is true, will confirm on any entry
 * * can just hit ENTER to confirm anything
 *   * this should be parameterized
 *
 * @returns the text the user entered.
 */
export async function promptForText({
    msg,
    title,
    confirm,
    noNewLine,
    rl,
    defaultValue,
    dontCloseRl,
    cancelable,
}: {
    msg: string,
    title?: string,
    confirm?: boolean,
    noNewLine?: boolean,
    /**
     * ignored in web version. used in node version. this is after all, a hack
     * port
     */
    rl?: any,
    defaultValue?: string,
    /**
     * ignored in web version. used in node version. this is after all, a hack
     * port
     */
    dontCloseRl?: boolean,
    /**
     * if true, cancel will show and an empty string will be returned
     */
    cancelable?: boolean,
}): Promise<string> {
    const lc = `[${promptForText.name}]`;
    try {
        if (!msg) { throw new Error(`msg required (E: 7f4d67bca4cf98ea95fa110aabc98924)`); }

        let result: string | undefined;

        let attempts = 0;
        let maxAttempts = 5;
        do {
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`max attempts reached (E: 1ef20ae955622d4b39479f3da91a1d25)`);
            }
            await delay(50);
            result = await showFullscreenDialog({
                title: title || 'Prompt for Info',
                msg,
                prompt: true,
                showInput: true,
                isPassword: false,
                defaultValue,
            });

        } while (result === undefined && !cancelable);

        return result ?? '';

        // let userText: string | undefined = undefined;
        // try {
        //     do {
        //         title = title ? `[${title}] ` : '';
        //         let promptMessage = `${title}${msg}${noNewLine ? ' ' : '\n'}`;
        //         let prompt = window.prompt;

        //         // Handle default value (Note: `prompt` can't pre-fill like readline.write)
        //         if (defaultValue) {
        //             if (defaultValue.includes('\n')) {
        //                 if (logalot) { console.log(`defaultValue includes newline. (I: 147d4ea942995d0f92a19c3534c18a24)`); }
        //                 // We can't pre-fill with newline in prompt, so we'll just inform if needed
        //             }
        //             promptMessage += ` (Default: ${defaultValue})`;
        //         }

        //         let userText1 = prompt(promptMessage);

        //         // Check for cancellation (prompt returns null on cancel)
        //         if (userText1 === null) {
        //             // return null; // User cancelled
        //             throw new Error(`user cancelled (E: bf3a221626f8cd14b2a945bfe661cb24)`);
        //         }

        //         if (userText1 === "") {
        //             let userText2 = prompt(`empty string entered. confirm:${noNewLine ? ' ' : '\n'}`);
        //             if (userText2 === userText1) {
        //                 userText = userText1;
        //                 break;
        //             } else {
        //                 console.log(`confirm failed. please try again.`);
        //             }
        //         } else if (confirm) {
        //             let userText2 = prompt(`confirm by either hitting ENTER (empty string) or retype input:${noNewLine ? ' ' : '\n'}`);
        //             if (userText2 === '' || userText2 === userText1) {
        //                 userText = userText1;
        //             } else {
        //                 console.log(`confirm failed. please try again.`);
        //             }
        //         } else {
        //             userText = userText1;
        //         }

        //     } while (userText === undefined);

        //     return userText;

        // } catch (error) {
        //     throw error;
        // }
    } catch (error) {
        debugger; // in error block promptForText
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * not implemented atow (12/2024). I think we'll have perhaps a modal dialog
 * with a known name and get at it that way.
 */
export async function promptForSecret({
    msg,
    confirm,
}: {
    msg?: string,
    confirm: boolean,
}): Promise<string> {
    const lc = `[${promptForSecret.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 795a4ce348ddb9a5119770f4c572ac24)`); }

        let result: string | undefined = undefined;

        let firstTry = true;
        let attempts = 0;
        let maxAttempts = 5;

        do {
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`max attempts reached (E: d4166b4bf37aff0c6d44567792e9ad25)`);
            }
            await delay(50);
            result = await showFullscreenDialog({
                title: firstTry ? 'Shh...' : 'Secrets didn\'t match, try again...',
                msg: msg || 'Enter Your Secret...',
                prompt: true,
                showInput: true,
                isPassword: true,
                defaultValue: undefined,
            });
            if (result === undefined) { throw new Error(`user cancelled (E: 91519d04378e84106f3df8eb36d99725)`); }

            if (confirm) {
                await delay(250);
                let result2 = await showFullscreenDialog({
                    title: 'Shh...',
                    msg: 'Confirm...',
                    prompt: true,
                    showInput: true,
                    isPassword: true,
                    defaultValue: undefined,
                });
                if (result2 === undefined) { result = undefined; }
                if (result !== result2) {
                    result = undefined;
                    firstTry = false;
                    await delay(250);
                }
            }


        } while (result === undefined);

        return result;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * prompt specifically looking to confirm something. if "cancelled", returns
 * false.
 */
export async function promptForConfirm({
    msg,
    yesLabel,
    noLabel,
}: {
    /**
     * if provided, this is the message displayed when confirming.
     */
    msg?: string,
    yesLabel?: string,
    noLabel?: string,
}): Promise<boolean> {
    const lc = `[${promptForConfirm.name}]`;
    try {
        await delay(50);
        let result = await showFullscreenDialog({
            title: 'Confirm?',
            msg: msg ?? 'Confirm?',
            okButtonTitle: yesLabel || undefined,
            cancelButtonTitle: noLabel || undefined,
            prompt: true,
        });
        return !!result;
        // msg ||= 'confirm?';
        // yesLabel ||= '(y)es';
        // noLabel ||= '(n)o';
        // try {
        //     const fnAnswerMatchesLabel = (answer: string, label: string) => {
        //         if (answer === label.replace(/[\(\)]/g, '').toLowerCase()) {
        //             // matched full label
        //             return true; /* <<<< returns early */
        //         } else {
        //             // check for short answers
        //             const regexCaptureCharsInsideParens = /\((\w+)\)/;
        //             const shortLabel = label.match(regexCaptureCharsInsideParens);
        //             if ((shortLabel ?? []).length >= 2) {
        //                 if (answer === shortLabel![1].toLowerCase()) {
        //                     // matched short label
        //                     return true; /* <<<< returns early */
        //                 }
        //             }
        //         }
        //         // if got this far, nothing positive matched
        //         return false;
        //     };

        //     const prompt = window.prompt;

        //     // try up to three times. if match found, either way, return early.
        //     const maxTries = 3;
        //     for (let i = 0; i < maxTries; i++) {
        //         let answer = prompt(`${msg} [${yesLabel}, ${noLabel}]\n`);
        //         if (answer) {
        //             answer = answer.toLowerCase();
        //             const matchesYesLabel = fnAnswerMatchesLabel(answer, yesLabel);
        //             if (matchesYesLabel) { return true; /* <<<< returns early */ }
        //             const matchesNoLabel = fnAnswerMatchesLabel(answer, noLabel);
        //             if (matchesNoLabel) { return false; /* <<<< returns early */ }
        //         } else {
        //             `no answer provided. defaulting to no...`;
        //             console.log('huh?');
        //         }
        //     }

        //     // max tries reached
        //     throw new Error(`could not confirm (E: ebbd2f642bde103c41d0102cf7e38d24)`);
        // } catch (error) {
        //     throw error;
        // }
    } catch (error) {
        console.error(`${lc} ${error.message}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function alertUser({
    msg,
    title,
    skipHitEnterToContinue,
}: {
    msg: string,
    title?: string,
    /**
     * ignored in web version atow (12/2024)
     */
    skipHitEnterToContinue?: boolean,
}): Promise<void> {
    const lc = `[${alertUser.name}]`;
    try {

        if (!msg) { throw new Error(`msg required (E: ffcf7dd00324df7cea2792223d229524)`); }
        try {
            title ??= '';
            await delay(50);
            await showFullscreenDialog({
                title,
                msg,
            });
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * If this is Dynamically import bootstrapBlankCanvasApp AFTER initial layout,
 * so we don't incur the speed penalty of loading all of the ibgib-related code.
 */
export async function dynamicallyLoadBootstrapScript(): Promise<void> {
    const lc = `[${dynamicallyLoadBootstrapScript.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 2308b22b90dbad13086d0c0d6ef9a325)`); }
        // const globalIbGib = getIbGibGlobalThis_BlankGib();
        const module = await import('./bootstrap.mjs');
        await module.bootstrapBlankCanvasApp();
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getUserPreferredColorScheme(): 'light' | 'dark' {
    const lc = `[${getUserPreferredColorScheme.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 196286d17b656bce5ce16f358f386525)`); }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * helper function to get a query param in the current url.
 *
 * # ONLY IN BROWSER
 *
 * not for use in node.js
 *
 * @returns raw
 */
export function getQueryParam<TValue>({ paramName, parseJSON, logalot, }: {
    paramName: string, parseJSON?: boolean, logalot?: boolean,
}): TValue | undefined {
    const lc = `[${getQueryParam.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f1a61ecdbb52cff1b958d1ceaea85f24)`); }

        const url = new URL(window.location.href);
        const rawValue = url.searchParams.get(paramName);
        if (rawValue) {
            const decodedValue = decodeURIComponent(rawValue);
            if (parseJSON) {
                try {
                    return JSON.parse(decodedValue) as TValue;
                } catch (parseError) {
                    console.error(`${lc} Error parsing JSON from query parameter ${paramName}: ${parseError} (E: fa8128dbe8ed41fc9fdf57a8146d88de)`);
                    throw parseError;
                }
            } else {
                return decodedValue as TValue;
            }
        } else {
            return undefined;
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * helper function to set a query param in the current url.
 *
 * # ONLY IN BROWSER
 *
 * not for use in node.js
 */
export function setQueryParam<TValue>({
    paramName, paramValue, rmParam, logalot,
}: {
    paramName: string,
    paramValue?: TValue,
    /**
     * if true, we will remove the param from the URL.
     */
    rmParam?: boolean,
    logalot?: boolean,
}): void {
    const lc = `[${setQueryParam.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f3c557d19f5b3a723611c59aa4a20324)`); }
        const url = new URL(window.location.href);

        if (rmParam) {
            url.searchParams.delete(paramName);
        } else {
            const actualValue = typeof paramValue === 'string' ?
                paramValue :
                JSON.stringify(paramValue);
            url.searchParams.set(paramName, actualValue);
        }

        // Update the URL without reloading the page
        window.history.replaceState({}, '', url.toString());
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * helper to highlight an element with border/background.
 *
 * ## intent
 *
 * Just making this to make highlighting things (drawing the user's eye)
 * easier and more consistent.
 */
export async function highlightElement({
    el,
    magicHighlightTimingMs,
    scrollIntoView,
}: {
    el: HTMLElement,
    magicHighlightTimingMs?: number,
    scrollIntoView?: boolean,
}): Promise<void> {
    const lc = `[${highlightElement.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 1820329f88bb937b21ff98e624c03e25)`); }

        if (scrollIntoView) { el.scrollIntoView({ behavior: 'smooth' }); }

        el.classList.add('highlight');
        if (magicHighlightTimingMs) {
            await delay(magicHighlightTimingMs);
            el.classList.add('unhighlight');
            el.classList.remove('highlight');
            await delay(magicHighlightTimingMs);
            el.classList.remove('unhighlight');
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function unhighlightElement({
    el,
}: {
    el: HTMLElement,
}): Promise<void> {
    const lc = `[${unhighlightElement.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: ee5894b05ec31085883098cc512e1c25)`); }

        el.classList.add('unhighlight');
        el.classList.remove('highlight');
        await delay(500);
        el.classList.remove('unhighlight');
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * builds a color schema based on the gib.
 *
 * note that the alpha drives the translucent property, but the solid color is
 * always built
 */
export function getDeterministicColorInfo({
    ibGibAddr,
    gib,
    ibGib,
    translucentAlpha = 10,
}: {
    ibGibAddr?: IbGibAddr,
    gib?: Gib,
    ibGib?: IbGib_V1,
    /**
     * drives the translucent color.
     *
     * @default 10
     */
    translucentAlpha?: number
}): GibColorInfo {
    const lc = `[${getDeterministicColorInfo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 3b70af42d1c4f6ae91870f3a15c6c625)`); }
        if (!ibGibAddr && !gib && !ibGib) { gib = GIB; }
        gib ??= ibGib?.gib ?? getIbAndGib({ ibGibAddr }).gib;
        const gibInfo = getGibInfo({ gib });
        translucentAlpha ??= 10;
        /**
         * we want to color coordinate according to timeline if possible, i.e.,
         * by tjpGib.
         */
        let drivingHash = '';
        if (gibInfo.isPrimitive) {
            return {
                gib,
                gibInfo,
                punctiliarColor: DEFAULT_IBGIB_COLOR,
                punctiliarColorTranslucent: DEFAULT_IBGIB_TRANSLUCENT,
                punctiliarColorContrast: DEFAULT_IBGIB_COLOR_CONTRAST,
            }; /* <<<< returns early */
        } else {
            drivingHash = gibInfo.tjpGib ?? gibInfo.punctiliarHash ?? gib; // hmm, gib should be punctiliar but meh
        }



        /**
         * gets the color string
         */
        // const fnGetColorStr = (drivingHash: string) => {
        //     function getContrastColor(hexcolor: string) {
        //         const c = hexcolor.concat().replace("#", "");
        //         var r = parseInt(c.substr(0, 2), 16);
        //         var g = parseInt(c.substr(2, 2), 16);
        //         var b = parseInt(c.substr(4, 2), 16);
        //         var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        //         return (yiq >= 128) ? '#000000' : '#FFFFFF';
        //     }
        //     let alphaStr = '';
        //     if (translucentAlpha || translucentAlpha === 0) {
        //         if (translucentAlpha < 0 || translucentAlpha > 100) {
        //             throw new Error(`alpha must be between 0 and 100 (E: c78faeb1477482c739b03dd32d2e1825)`);
        //         }
        //         if (translucentAlpha === 100) {
        //             alphaStr = '';
        //         } else if (translucentAlpha >= 0 && translucentAlpha < 10) {
        //             // single digit
        //             alphaStr = `0${translucentAlpha}`;
        //         } else {
        //             alphaStr = translucentAlpha.toString();
        //         }
        //     }
        //     const color = `#${drivingHash.substring(0, 6)}`;
        //     const colorTranslucent = `#${drivingHash.substring(0, 6)}${alphaStr}`;
        //     const colorContrast = getContrastColor(color);
        //     return [color, colorTranslucent, colorContrast];
        // };

        const [punctiliarColor, punctiliarColorTranslucent, punctiliarColorContrast] = getColorStrings(translucentAlpha, gibInfo.punctiliarHash ?? gib);
        const [tjpColor, tjpColorTranslucent, tjpColorContrast] = !!gibInfo.tjpGib ?
            getColorStrings(translucentAlpha, gibInfo.tjpGib) :
            [undefined, undefined, undefined];

        return {
            gib,
            gibInfo,
            punctiliarColor, punctiliarColorTranslucent, punctiliarColorContrast,
            tjpColor, tjpColorTranslucent, tjpColorContrast,
        };
    } catch (error) {
        const errorMsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(errorMsg);
        return {
            gib: gib ?? GIB,
            gibInfo: { isPrimitive: true },
            punctiliarColor: '#ff0000', // red
            punctiliarColorTranslucent: '#ff000010', // translucent red
            punctiliarColorContrast: '#ffffff', // black
            errorMsg,
        };
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * gets the color, colorTranslucent and colorContrast
 */
export function getColorStrings(translucentAlpha: number, drivingHash: string): [string, string, string] {
    function getContrastColor(hexcolor: string) {
        const c = hexcolor.concat().replace("#", "");
        var r = parseInt(c.substr(0, 2), 16);
        var g = parseInt(c.substr(2, 2), 16);
        var b = parseInt(c.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    }
    let alphaStr = '';
    if (translucentAlpha || translucentAlpha === 0) {
        if (translucentAlpha < 0 || translucentAlpha > 100) {
            throw new Error(`alpha must be between 0 and 100 (E: c78faeb1477482c739b03dd32d2e1825)`);
        }
        if (translucentAlpha === 100) {
            alphaStr = '';
        } else if (translucentAlpha >= 0 && translucentAlpha < 10) {
            // single digit
            alphaStr = `0${translucentAlpha}`;
        } else {
            alphaStr = translucentAlpha.toString();
        }
    }
    const color = `#${drivingHash.substring(0, 6)}`;
    const colorTranslucent = `#${drivingHash.substring(0, 6)}${alphaStr}`;
    const colorContrast = getContrastColor(color);
    return [color, colorTranslucent, colorContrast];
};

/**
 * Takes an incoming string. Assumes it's invalid. Does best effort at validating this.
 * Gets the raw export ibgib if it can. If so, and if it is compressed, decompresses the
 * compressed graph contained in the export ibgib.
 *
 * @returns RawExportIbGib_V1 and its decompressed graph
 */
export async function getRawExportIbGibAndGraphFromJsonString({
    exportIbGibJsonString,
}: {
    exportIbGibJsonString: string,
}): Promise<[RawExportIbGib_V1, FlatIbGibGraph]> {
    const lc = `[${getRawExportIbGibAndGraphFromJsonString.name}]`;
    try {
        debugger; // walk thru getRawExportIbGibAndGraphFromJsonString
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        const metaspace = await getGlobalMetaspace_waitIfNeeded();
        if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: genuuid)`); }

        const space = await metaspace.getLocalUserSpace({ lock: false });
        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: genuuid)`); }

        let parsedIbGib_notYetValidated: IbGib_V1;
        let parsedExportIbGib_dependenciesNotValidated: RawExportIbGib_V1;
        try {
            parsedIbGib_notYetValidated = JSON.parse(exportIbGibJsonString) as IbGib_V1;
        } catch (error) {
            const emsg = `Error during parse JSON. error: ${extractErrorMsg(error)} (E: genuuid)`;
            const errorHack = new Error(emsg);
            (errorHack as any).cause = error;
            throw errorHack;
        }
        try {
            const validationErrors = await validateIbGibIntrinsically({ ibGib: parsedIbGib_notYetValidated }) ?? [];
            if (validationErrors.length > 0) {
                throw new Error(`validation errors when validating the parsed ibgib that should be a RawExportIbGib_V1: ${validationErrors} (E: 8ba178d3b26e8eca28a67c182fe16825)`);
            }
            // todo: other validation raw export ibgib, maybe to see if it's a full dependency graph, etc.

            parsedExportIbGib_dependenciesNotValidated = parsedIbGib_notYetValidated as RawExportIbGib_V1;
            if (!parsedExportIbGib_dependenciesNotValidated.data) { throw new Error(`(UNEXPECTED) rawExportIbGib.data falsy? (E: ef1824d1cca5584ab8e34288346e9825)`); }
        } catch (error) {
            const emsg = `Error during parse JSON. error: ${extractErrorMsg(error)} (E: genuuid)`;
            const errorHack = new Error(emsg);
            (errorHack as any).cause = error;
            throw errorHack;
        }



        // at this point, we have a possibly quite large ibGib whose data
        // includes a dependencyGraphAsString. this could possibly be
        // compressed.
        let payloadGraph: FlatIbGibGraph;
        if (!!parsedExportIbGib_dependenciesNotValidated.data.compression) {
            switch (parsedExportIbGib_dependenciesNotValidated.data.compression) {
                case 'gzip':
                    payloadGraph = await decompressIbGibGraphFromString({
                        compressedBase64: parsedExportIbGib_dependenciesNotValidated.data.dependencyGraphAsString,
                    });
                    break;
                default:
                    throw new Error(`unknown value of rawExportIbGib.data.compression: ${parsedExportIbGib_dependenciesNotValidated.data.compression} (E: 784672fae568312d887ddbb841199925)`);
            }
        } else {
            payloadGraph = await deserializeStringToGraph({
                jsonString: parsedExportIbGib_dependenciesNotValidated.data.dependencyGraphAsString
            });
        }

        const validationErrorMap: { [addr: string]: string[] } = {};
        for (const [addr, payloadIbGib] of Object.entries(payloadGraph)) {
            const validationErrors = await validateIbGibIntrinsically({ ibGib: payloadIbGib }) ?? [];
            if (validationErrors.length > 0) { validationErrorMap[addr] = validationErrors; }
        }
        if (Object.keys(validationErrorMap).length > 0) {
            throw new Error(`there were validation errors for the RawExportIbGib_V1.data payload (contained in data.dependencyGraphAsString). Here is the validationErrorMap:\n${pretty({ validationErrorMap })} (E: e63f38b182a84122d83a55befb369825)`);
        }
        const exportIbGib_validated = parsedExportIbGib_dependenciesNotValidated;

        return [exportIbGib_validated, payloadGraph];
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * exports a given ibgib to the default local userspace in the metaspace.
 */
export async function exportIbGib({
    ibGib,
    compress,
    // downloadAnchorEl,
    metaspace,
    space,
}: {
    ibGib: IbGib_V1,
    compress: boolean,
    // downloadAnchorEl: HTMLAnchorElement,
    metaspace: MetaspaceService,
    space: IbGibSpaceAny,
}): Promise<void> {
    const lc = `[${exportIbGib.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 623d9463d919683be81f749821a95825)`); }
        if (isPrimitive({ ibGib })) { throw new Error(`ibGib is primitive. Can't export primitive. (E: dd42c42e9fda0707e81c692af1a2a225)`); }

        const resGetExport = await getRawExportIbGib({
            ibGib,
            live: true,
            compress,
            metaspace: metaspace,
            space,
        });

        const { rawExportIbGib: exportIbGib, errors: exportErrors } = resGetExport;
        if ((exportErrors ?? []).length > 0) { throw new Error(`Export had errors: ${exportErrors!} (E: 05faf83f25d3449ab809dfd24eeaf825)`); }

        // at this point, we have a possibly quite large ibGib whose data includes
        // every single other ibgib that ibGib relates to (its dependency graph). This
        // so now we can save this file and later import from it.

        /**
         * exportIbGib is guaranteed to have a serializable structure, i.e.,
         * the data has only primitives. (there are no Uint8Array)
         */
        const exportIbGibAsString = JSON.stringify(exportIbGib);

        // thank you SO, OP and volzotan at https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
        // set the anchor's href to a data stream
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportIbGibAsString);

        // get the filename for the anchor to suggest for the "download"
        const exportAddr = getIbGibAddr({ ibGib: exportIbGib });
        const filename = `${exportAddr}.json`;

        // trigger the click
        const downloadAnchorEl = document.createElement('a');
        downloadAnchorEl.setAttribute("style", "none");
        downloadAnchorEl.setAttribute("href", dataStr);
        downloadAnchorEl.setAttribute("download", filename);
        const div = document.getElementsByTagName('div')[0]; // just append to the first div then remove it
        div.appendChild(downloadAnchorEl);
        downloadAnchorEl.click();
        div.removeChild(downloadAnchorEl);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function getDefaultFnGetAPIKey(): () => Promise<string> {
    const lc = `[${getDefaultFnGetAPIKey.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        const fn = async () => {
            let apiKey = await storageGet({
                dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                key: BEE_KEY,
            });
            return apiKey ?? '';
        };
        return fn;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}



export async function promptForAPIKey(): Promise<string | undefined> {
    const lc = `[${promptForAPIKey.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
        let resAPIKey = '';
        let tryAgain = false;
        let attempts = 0;
        let maxAttempts = 5;
        do {
            attempts++;
            if (attempts >= maxAttempts) { throw new Error(`too many attempts (E: genuuid)`); }
            resAPIKey = await promptForSecret({
                msg: CHAT_WITH_AGENT_NEED_API_KEY,
                confirm: false,
            });
            if (resAPIKey) {
                if (resAPIKey.match(GEMINI_API_KEY_REGEXP)) {
                    tryAgain = false;
                    // return resAPIKey; /* <<<< returns early */
                } else {
                    await alertUser({
                        title: `That's an API Key?`,
                        msg: `That doesn't look like a valid API key, please try again, or hit cancel if you don't want to at this time.`,
                    });
                    tryAgain = true;
                }
            } else {
                console.log(`${lc} user cancelled entering API key. (I: genuuid)`);
                tryAgain = false;
            }
        } while (tryAgain);

        return resAPIKey;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * updates the given {@link apiKey}. if {@link force} is true and `apiKey` is
 * empty, then this will set an empty string for the apiKey, effectively
 * deleting it.
 */
export async function updateAPIKeyInStorage({ apiKey, force }: { apiKey: string, force: boolean }): Promise<void> {
    const lc = `[${updateAPIKeyInStorage.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 64951b38da35ec5ff847004d53b2d425)`); }

        const matches = apiKey.match(GEMINI_API_KEY_REGEXP);
        if (matches || force) {
            await storagePut({
                dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                key: BEE_KEY,
                value: apiKey,
            });
            if (apiKey) {
                // set a new truthy key
                await alertUser({ title: `need to reload...`, msg: `Cool! We successfully SAVED your Gemini API key in your browser's IndexedDB.\n\nIf you'd like to remove it later, you can clear it out by using the ${CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP}.\n\nWe must now reload the page to use the new API key... (investment would be a good thing to improve this UX workflow!)` });
            } else {
                // cleared out the key
                await alertUser({ title: `need to reload...`, msg: `Cool! We successfully CLEARED your Gemini API key from your browser's IndexedDB.\n\nIf you'd like to set a new key, use the ${CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP}.\n\nThe API key is already removed, but we must now reload the page for this to propagate throughout the web page... (investment would be a good thing to improve this UX workflow!)` });
            }
            window.location.reload();
        } else {
            throw new Error(`apiKey does not match apiKeyRegex (${GEMINI_API_KEY_REGEXP.source}) and force is false. (E: 2d6c798803e6b71bf6aa70bd60170825)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }

}

/**
 * wrapper for do
 * @param id
 */
export function getElementById_throwsIfFalsy<TElement extends Element>({
    id,
    shadowRoot,
}: {
    id: string;
    /**
     * If set, will get element here, else will use document
     */
    shadowRoot?: ShadowRoot;
}): TElement {
    const lc = `[${getElementById_throwsIfFalsy.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 18a338c6dab8690c72b8759b8d952925)`); }
        let resElement = !!shadowRoot ?
            shadowRoot.getElementById(id) as TElement | null :
            document.getElementById(id) as TElement | null;

        if (resElement) {
            return resElement;
        } else {
            throw new Error(`${!!shadowRoot ? 'shadowRoot' : 'document'}.getElementById(${id}) returned null. So...Element was not found. (E: 5e501f6835cc74cd4c2faf0d9e387825)`);
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * wrapper that throws if element not found.
 * @param id of Element
 * @returns Element of type TElement or throws.
 * @see {@link shadowRoot_getElementById}
 */
export function document_getElementById<TElement extends Element = HTMLElement>(id: string): TElement {
    return getElementById_throwsIfFalsy<TElement>({ id });
}

/**
 * wrapper that throws if element not found.
 * @param shadowRoot in which the element MUST be truthy or throws
 * @param id of Element
 * @returns Element of type TElement or throws.
 * @see {@link document_getElementById}
 */
export function shadowRoot_getElementById<TElement extends Element = HTMLElement>(shadowRoot: ShadowRoot, id: string): TElement {
    return getElementById_throwsIfFalsy<TElement>({ id, shadowRoot });
}

/**
 * helper that gets a reference to the currently active project component (center panel active tab).
 * this component gives access to the project ibgib itself.
 * @returns active project component (center panel active tab)
 */
export function getCurrentActiveProjectComponent(): ProjectComponentInstance {
    const lc = `[${getCurrentActiveProjectComponent.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d5e9a28ef5c17452988b35097f9e0825)`); }

        const ibGibGlobalThis = getIbGibGlobalThis_BlankGib();
        if (!ibGibGlobalThis.projectsComponent) {
            throw new Error(`${lc} (UNEXPECTED) ibGibGlobalThis.projectsComponent falsy? (E: 67bde84c865844e922f008d36dc2b925)`)
        }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo falsy? (E: bbccb81938887dc5a8a309b59c841825)`); }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component) { throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component falsy? (E: f485687d525ebecc28b749f3fd283825)`); }

        return ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
