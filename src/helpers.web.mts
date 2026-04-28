/**
 * @module helpers.web
 *
 * Web-specific helpers for the blank-gib app.
 *
 * Shared helpers (initIbGibStorage, initIbGibGlobalThis,
 * dynamicallyLoadBootstrapScript, getComponentCtorArg, getDefaultFnGetAPIKey)
 * are delegated to libs/web-gib and re-exported here.
 */

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibDynamicComponentMetaCtorOpts } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import {
    initIbGibGlobalThis as _initIbGibGlobalThis,
    initIbGibStorage as _initIbGibStorage,
    dynamicallyLoadBootstrapScript as _dynamicallyLoadBootstrapScript,
    getComponentCtorArg as _getComponentCtorArg,
    getDefaultFnGetAPIKey as _getDefaultFnGetAPIKey,
} from "@ibgib/web-gib/dist/app-bootstrap/init-orchestration.mjs";
import { IbGibGlobalThis_Common } from "@ibgib/web-gib/dist/app-bootstrap/types.mjs";

import { GLOBAL_LOG_A_LOT, APP_CONFIG, } from "./constants.mjs";
import { AUTO_GENERATED_VERSION } from "./AUTO-GENERATED-version.mjs";
import { IbGibGlobalThis_BlankGib, } from "./types.mjs";
import { ProjectComponentInstance } from "./components/projects/project/project-component-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;
const GLOBALTHIS_KEY = 'blankgib';

/**
 * Initializes the IndexedDB stores required by the blank-gib app.
 */
export async function initBlankGibStorage(): Promise<void> {
    return _initIbGibStorage(APP_CONFIG);
}

/**
 * Dynamically imports the bootstrap module for the blank-gib app.
 */
export async function dynamicallyLoadBootstrapScript(
    path: string = './bootstrap.mjs',
    bootstrapFnName: string = 'bootstrapBlankCanvasApp',
): Promise<void> {
    return _dynamicallyLoadBootstrapScript(path, bootstrapFnName);
}

/**
 * Returns the standard ctor options object for Blank Gib dynamic components.
 */
export function getComponentCtorArg(): IbGibDynamicComponentMetaCtorOpts {
    return _getComponentCtorArg(GLOBALTHIS_KEY);
}

/**
 * Returns a function that retrieves the AI API key for the blankgib app namespace.
 */
export function getDefaultFnGetAPIKey(): () => Promise<string> {
    return _getDefaultFnGetAPIKey(GLOBALTHIS_KEY);
}

// ---------------------------------------------------------------------------
// Blank-gib specific globalThis init / accessors
// ---------------------------------------------------------------------------

/**
 * Initializes globalThis.ibgib.blankgib from the given config.
 * Idempotent — safe to call multiple times.
 */
export function initIbGibGlobalThis(config: any = APP_CONFIG): void {
    _initIbGibGlobalThis(config, GLOBALTHIS_KEY, AUTO_GENERATED_VERSION);
}

/**
 * Returns the typed globalThis for the blank-gib app.
 * Initializes from config if not yet present.
 */
export function getIbGibGlobalThis_BlankGib(
    config: any = APP_CONFIG,
): IbGibGlobalThis_BlankGib {
    if (!(globalThis as any).ibgib?.[GLOBALTHIS_KEY]) {
        initIbGibGlobalThis(config);
    }
    return (globalThis as any).ibgib[GLOBALTHIS_KEY] as IbGibGlobalThis_BlankGib;
}

/**
 * helper...since this base file works for both web app proper and the
 * extension, I need a way of not pulling in (hard) imports in esbuild.
 */
export function getIbGibGlobalThis_Common(): IbGibGlobalThis_Common {
    const lc = `[${getIbGibGlobalThis_Common.name}]`;
    const g = (globalThis as any).ibgib?.[GLOBALTHIS_KEY] ?? (globalThis as any).ibgib?.blankgib_ext;
    if (!g) {
        throw new Error(`${lc} (UNEXPECTED) no IbGibGlobalThis (globalThis.ibgib.blankgib || globalThis.ibgib.blankgib_ext)?`);
    }
    return g as IbGibGlobalThis_Common;
}

// ---------------------------------------------------------------------------
// Blank-gib specific helpers
// ---------------------------------------------------------------------------

/**
 * Returns a reference to the currently active project component (center panel
 * active tab). Gives access to the project ibgib itself.
 */
export function getCurrentActiveProjectComponent(): ProjectComponentInstance {
    const lc = `[${getCurrentActiveProjectComponent.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d5e9a28ef5c17452988b35097f9e0825)`); }

        const ibGibGlobalThis = getIbGibGlobalThis_BlankGib();
        if (!ibGibGlobalThis.projectsComponent) {
            throw new Error(`${lc} (UNEXPECTED) ibGibGlobalThis.projectsComponent falsy? (E: 67bde84c865844e922f008d36dc2b925)`);
        }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo) {
            throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo falsy? (E: bbccb81938887dc5a8a309b59c841825)`);
        }
        if (!ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component) {
            throw new Error(`(UNEXPECTED) ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component falsy? (E: f485687d525ebecc28b749f3fd283825)`);
        }

        return ibGibGlobalThis.projectsComponent.activeProjectTabInfo.component;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
