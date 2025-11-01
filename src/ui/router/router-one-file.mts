import { delay, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { GIB, ROOT_ADDR } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { Gib, Ib, IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { validateGib, validateIb } from "@ibgib/ts-gib/dist/V1/validate-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
import {
    ROUTER_APP_NAME_WEB1, RouterAppName, VALID_ROUTER_APP_NAMES,
    WEB1_FILENAME_HOME, isValidRouterAppName,
} from "../../common/app-constants.mjs";
import {
    document_getElementById,
    isExecutingInBlankGibWebAppProper,
} from "../../helpers.web.mjs";
import { getComponentSvc } from "../component/ibgib-component-service.mjs";
import { ID_CENTER_PANEL_CONTENT } from "../shell/shell-constants.mjs";
import { AppShellService, getAppShellSvc } from "../shell/app-shell-service.mjs";
import { isPrimitive } from "@ibgib/ts-gib/dist/V1/index.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants

export const DEFAULT_PATH_APPS_WEB1 = `/apps/${ROUTER_APP_NAME_WEB1}/gib/${WEB1_FILENAME_HOME}`;

// #endregion constants

// #region types

export interface IbGibRouteInfo {
    base: 'apps' | string,
    appName: RouterAppName,
    gib: Gib,
    ib: Ib,
}

// #endregion types

// #region helpers


export function getPath({
    ibGibRouteInfo,
}: {
    ibGibRouteInfo: IbGibRouteInfo,
}): string {
    const lc = `[${getPath.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 9c9f46b8cdf54d0b1e7284b5f73b6725)`); }

        // const EXPECTED_PATH_SCHEMA = '/#/apps/[appName]/[gib]/[ib/filename], e.g., /#/apps/web1/gib/home.html';

        const { base, appName, gib, ib } = ibGibRouteInfo;

        const path = `/#/${base}/${appName}/${encodeURI(gib)}/${encodeURI(ib)}`;
        if (logalot) { console.log(`${lc} path: ${path} (I: 7fe027b8872c57389fd980eb8ddb0d25)`); }
        return path;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function parseRoute({
    path,
}: {
    path: string,
}): Promise<IbGibRouteInfo> {
    const lc = `[${parseRoute.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 68ac065368c70f81cc3f7c6b9a720225)`); }

        path ||= DEFAULT_PATH_APPS_WEB1;

        let pathPieces = path.split('/');
        if (path.startsWith('/')) { pathPieces = pathPieces.slice(1); }
        if (path.startsWith('#')) { pathPieces = pathPieces.slice(1); }
        if (pathPieces.some(x => !x)) { throw new Error(`(UNEXPECTED) empty route path piece? path: ${path} (E: 3727076b99b54328095c4d1862b2fe25)`); }

        const EXPECTED_PATH_SCHEMA = '/#/apps/[appName]/[gib]/[ib/filename], e.g., /#/apps/web1/gib/home.html';

        if (pathPieces.length !== 4) {
            throw new Error(`${lc} (UNEXPECTED) pathPieces.length !== 3? Right now we're just doing a simple router that expects route in form of ${EXPECTED_PATH_SCHEMA} (E: 82838aff61c4a68ec6ba273a0ed07e25)`)
        }

        let [base_shouldbeappsrightnow, appName, gib, ib] = pathPieces;
        ib = decodeURI(ib);
        gib = decodeURI(gib);

        if (base_shouldbeappsrightnow !== "apps") { throw new Error(`(UNEXPECTED) _apps path piece isn't "apps" literal? Right now we're just expecting "apps" as this path piece? ${EXPECTED_PATH_SCHEMA} (E: 0232cb52674ab47f3a26fd572283c125)`); }
        const ibValidationErrors = validateIb({ ib }) ?? [];
        if (ibValidationErrors.length > 0) {
            throw new Error(`invalid ib in path (${path}). ibValidationErrors: ${pretty(ibValidationErrors)} (E: 3df241dc41963cdfcde541b3b289b225)`);
        }
        if (gib !== GIB) {
            const gibValidationErrors = validateGib({ gib }) ?? [];
            if (gibValidationErrors.length > 0) {
                throw new Error(`invalid gib in path (${path}). gibValidationErrors: ${pretty(gibValidationErrors)} (E: 7a4a73f2bd85bfe69ce98d1b9ca54325)`);
            }
            // throw new Error(`(UNEXPECTED) gib path piece isn't "gib" literal? Right now we're just expecting "gib" as this path piece? ${EXPECTED_PATH_SCHEMA} (E: 18a003dd692675787f02a7c113029d25)`);
        }
        if (!isValidRouterAppName(appName)) { throw new Error(`invalid appName (${appName}) in path (${path}). valid app names: ${VALID_ROUTER_APP_NAMES} (E: bc407d787dbe6ff66cf4ea6892157f25)`); }

        return { base: base_shouldbeappsrightnow, appName, gib, ib };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * when html has an anchor tag but we just want to route to something, use this.
 */
export async function handleLocalSPAAnchorClick({ event }: { event: any }): Promise<void> {
    const lc = `[${handleLocalSPAAnchorClick.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: a94f18a96df6cb3e46a3cddeb777df25)`); }
        // Prevent default link navigation
        event.preventDefault();

        // modify the browser history quietly (without triggering a page
        // reload)
        const href = (event.target as HTMLAnchorElement).getAttribute('href')!;
        window.history.pushState({}, '', href);

        // update the document title to reflect the new location for
        // accurate browser history and tab name
        const { appName, ib } = await parseRoute({
            path: href.startsWith('#') ? href.substring(1) : href
        });
        document.title = `${ib} - ibgib ${appName}`;

        // we have now set the new URL and we need to trigger the actual
        // load via the router
        simpleIbGibRouterSingleton.loadCurrentURLPath();
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

// #endregion helpers

async function route(path: string): Promise<void> {
    const lc = `[${route.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: a1b2c3d4e5f67890)`); }

        if (!isExecutingInBlankGibWebAppProper()) {
            if (logalot) { console.log(`${lc} executing in iframe so returning early without routing (I: b84172ceedb5fea0c5d0c1cfbd911b25)`); }
            return; /* <<<< returns early */
        }

        if (path === '' || path === '/') { path = DEFAULT_PATH_APPS_WEB1; }

        let info = await parseRoute({ path });

        const { appName, ib, gib } = info;
        const ibGibAddr = getIbGibAddr({ ib, gib });

        const appShellSvc = getAppShellSvc();

        await route_centerPanel({ path, ibGibAddr });
        await route_leftPanel({ path, appName, ib, gib, ibGibAddr, appShellSvc });

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        // Display a generic error message in the center pane if routing fails
        document.getElementById('center-canvas-area')!.innerHTML = `<p class="error">Error loading page.</p><p>${extractErrorMsg(error)}</p>`;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function route_centerPanel({
    path,
    ibGibAddr,
}: {
    path: string,
    ibGibAddr: IbGibAddr,
}): Promise<void> {
    const lc = `[${route_centerPanel.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c4c0c83822783d0fc8cdefda75391c25)`); }

        const centerPanelContent = document_getElementById(ID_CENTER_PANEL_CONTENT);

        const componentSvc = await getComponentSvc();
        const componentToInject = await componentSvc.getComponentInstance({
            useRegExpPrefilter: true,
            path,
            ibGibAddr,
        });

        if (componentToInject) {
            await componentSvc.inject({
                parentEl: centerPanelContent,
                componentToInject,
            });
            // since this is a route-level injection, we will style it as a page.
            componentToInject.classList.add('ibgib-page');
        } else {
            console.warn(`${lc} No component found to handle route: ${path} (W: db04f7fdfbd32caf817d0122a292ae25)`);
            centerPanelContent.innerHTML = `<p class="error">No component found for route: ${path}</p>`;
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function route_leftPanel({
    path,
    appName,
    ib, gib,
    ibGibAddr,
    appShellSvc,
}: {
    path: string,
    appName: string,
    ib: Ib, gib: Gib,
    ibGibAddr: IbGibAddr,
    appShellSvc: AppShellService,
}): Promise<void> {
    const lc = `[${route_leftPanel.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c4c0c83822783d0fc8cdefda75391c25)`); }

        if (isPrimitive({ gib })) {
            appShellSvc.activateLeftPanelTab({ tabName: 'web1' })
        } else if (appName === 'projects') {
            appShellSvc.activateLeftPanelTab({ tabName: 'projects' })
        } else {
            appShellSvc.activateLeftPanelTab({ tabName: 'web1' })
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function route_rightPanel({
    path,
    appName,
    ib, gib,
    ibGibAddr,
    appShellSvc,
}: {
    path: string,
    appName: string,
    ib: Ib, gib: Gib,
    ibGibAddr: IbGibAddr,
    appShellSvc: AppShellService,
}): Promise<void> {
    const lc = `[${route_rightPanel.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: c4c0c83822783d0fc8cdefda75391c25)`); }

        if (isPrimitive({ gib })) {
            // don't need to do anything?...
            // appShellSvc.chronolo;
        } else if (appName === 'projects') {
            // should this be done some other way...expose current ibgib addr?
            appShellSvc.activateLeftPanelTab({ tabName: 'projects' })
        } else {
            appShellSvc.activateLeftPanelTab({ tabName: 'web1' })
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * simplistic SPA-like router, but focused on routing ibgib addresses.
 */
export class SimpleIbGibRouter {
    protected lc: string = `[${SimpleIbGibRouter.name}]`;

    get currentURLPath(): string {
        const path = window.location.hash.substring(1); // Remove the leading '#'
        return path;
    }

    /**
     *
     */
    constructor() {

    }

    getCurrentPathInfo(): Promise<IbGibRouteInfo> {
        return parseRoute({ path: this.currentURLPath });
    }


    async loadCurrentURLPath(): Promise<void> {
        const lc = `${this.lc}[${this.loadCurrentURLPath.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2301ec8af3d848230826f3799a462725)`); }
            await route(this.currentURLPath);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            await route('/');
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    get isCurrentPageWeb1(): boolean {
        const path = window.location.hash.substring(1); // Remove the leading '#'
        const isWeb1 = path.startsWith('/apps/web1') || path === "";
        return isWeb1;
    }

    /**
     * updates the current URL with the given {@link ibGibAddr}. If that is
     * falsy, then will remove any existing ibGibAddr from the URL, if
     * there is one.
     */
    async updateCurrentURLPathIbGibAddr({
        ibGibAddr,
        replace,
    }: {
        ibGibAddr?: IbGibAddr,
        replace?: boolean,
    }): Promise<void> {
        const lc = `${this.lc}[${this.updateCurrentURLPathIbGibAddr.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 6adcf3cf5e489c2d036f8391dc858825)`); }

            let currentPath = window.location.hash.substring(1); // Remove the leading '#'
            let currentPathInfo = await parseRoute({ path: currentPath });
            let { ib, gib } = getIbAndGib({ ibGibAddr: ibGibAddr ?? ROOT_ADDR });
            if (currentPathInfo.ib === ib && currentPathInfo.gib === gib) {
                if (logalot) { console.log(`${lc} current path ibGibAddr === incoming ibGibAddr so no need to update. returning early. (I: 0f67662a76f96ec5c60ff08bced73c25)`); }
                return; /* <<<< returns early */
            }
            let fullPath = getPath({
                ibGibRouteInfo: {
                    appName: currentPathInfo.appName,
                    base: currentPathInfo.base,
                    ib,
                    gib,
                }
            });
            if (replace) {
                // replace current browser nav stack entry
                window.history.replaceState({}, '', fullPath);
            } else {
                // add to browser nav stack
                window.history.pushState({}, '', fullPath);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

/**
 * maybe YAGNI, but we're doing this for now.
 */
export const simpleIbGibRouterSingleton = new SimpleIbGibRouter();
