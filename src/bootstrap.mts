/**
 * @module bootstrap does the startup code for ibgib-specific things, like
 * initializing the metaspace and starting the blank-gib app.
 */

import { bootstrapIbGibApp } from "@ibgib/web-gib/dist/app-bootstrap/bootstrap.mjs";

import {
    APP_CONFIG, GLOBAL_LOG_A_LOT,
    TAG_AGENT_TEXT, TAG_AGENT_ICON, TAG_AGENT_DESCRIPTION,
    BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX
} from "./constants.mjs";
import { getIbGibGlobalThis_BlankGib } from "./helpers.web.mjs";
import { BlankCanvasApp_V1 } from "./witness/app/blank-canvas/blank-canvas-app-v1.mjs";
import { PARAM_INFOS } from "./witness/app/blank-canvas/blank-canvas-constants.mjs";
import { DEFAULT_BLANK_CANVAS_APP_DATA_V1 } from "./witness/app/blank-canvas/blank-canvas-types.mjs";
import { AUTO_GENERATED_VERSION } from "./AUTO-GENERATED-version.mjs";
import { registerDeprecatedFunctionNamesAndFunctionInfos_Web } from "./api/function-infos.web.mjs";
import { getAppShellSvc } from "./ui/shell/app-shell-service.mjs";

console.log(`[blank gib bootstrap] version: ${AUTO_GENERATED_VERSION}`);

/**
 * Idempotent bootstrap function for the blank-gib app.
 * Checks the ibgib globalThis to prevent double-initialization.
 */
export async function bootstrapBlankCanvasApp() {

    await bootstrapIbGibApp({
        config: APP_CONFIG,
        getGlobalThis: getIbGibGlobalThis_BlankGib,
        AppClass: BlankCanvasApp_V1,
        defaultAppData: DEFAULT_BLANK_CANVAS_APP_DATA_V1,
        paramInfos: PARAM_INFOS,
        registerAgentFunctionInfos: registerDeprecatedFunctionNamesAndFunctionInfos_Web,
        ensureTags: [
            { text: TAG_AGENT_TEXT, icon: TAG_AGENT_ICON, description: TAG_AGENT_DESCRIPTION }
        ],
        localSpaceNamePrefix: BLANK_GIB_INDEXEDDB_LOCAL_SPACE_NAME_PREFIX,
        onReady: async (app) => {
            if (GLOBAL_LOG_A_LOT) { console.log(`[bootstrapBlankCanvasApp] Engine ready. app: ${app?.ib}`); }
            getAppShellSvc().onEngineReady();
        },
    });
}
