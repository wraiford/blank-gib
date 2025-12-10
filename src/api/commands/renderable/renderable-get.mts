import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "@ibgib/web-gib/dist/api/commands/command-constants.mjs";
import { getCommandService } from "@ibgib/web-gib/dist/api/commands/command-service-v1.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "@ibgib/web-gib/dist/api/api-constants.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import {
    RenderableGetOpts, RenderableGetResult, RenderableHandle,
} from "../../../render/render-types.mjs";
import { getRenderService } from "../../../render/render-service-v1.mjs";
import { GEMINI_SCHEMA_RENDERABLE_HANDLES, GEMINI_SCHEMA_RENDERABLE_SVC_ID } from "./renderable-constants.mjs";
import { RenderableCommandDataBase } from "./renderable-types.mjs";

const logalot = GLOBAL_LOG_A_LOT;


// #region constants
const EXAMPLE_INPUT_RENDERABLE_GET: Partial<RenderableGetCommandData> = {
    repromptWithResult: true,
    handles: [{
        uuid: 'e4c2c866adc89840cefa72f2fc495825',
        type: 'Renderable',
    }],
}
const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_GET),
].join('\n');

// #endregion constants

/**
 * @interface RenderableGetCommandData -  Command data for getting a single
 * renderable by handle or uuid.
 */
export interface RenderableGetCommandData
    extends RenderableCommandDataBase<['get']>, RenderableGetOpts {
    /**
    * The uuid of the renderable to get.
    */
    handles: RenderableHandle[];
}

/**
 * Command service method for getting a single renderable by handle or uuid.
 * @param {RenderableGetOpts} opts - Options for getting a single renderable.
 * @returns {Promise<RenderableState | undefined>} A promise that resolves with
 * the handle to the newly created renderable.
 */
function renderableGetViaCmd(opts: RenderableGetCommandData): Promise<RenderableGetResult> {
    const commandService = getCommandService();
    const command: RenderableGetCommandData = {
        ...opts,
        cmd: 'renderable',
        cmdModifiers: ['get'],
        repromptWithResult: opts?.repromptWithResult,
        // handles: opts.handles,
    };
    return new Promise<RenderableGetResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation for getting a renderable state.
 * @param {RenderableGetOpts} opts
 * @returns {Promise<RenderableStateMap>}
 */
async function renderableGetImpl(opts: RenderableGetOpts): Promise<RenderableGetResult> {
    const lc = `[${renderableGetImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 113d1a264d89c79a4d343c9b1b5d9225)`); }
        const renderService = getRenderService(opts);
        // debugger; // renderableGetImpl
        return await renderService.getRenderableState({ ...opts });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the command that gets a single renderable.
 */
export const renderableGetFunctionInfo: APIFunctionInfo<typeof renderableGetViaCmd> = {
    nameOrId: 'renderableGet',
    fnViaCmd: renderableGetViaCmd,
    functionImpl: renderableGetImpl,
    cmd: 'renderable',
    cmdModifiers: ['get'],
    schema: {
        name: 'renderableGet', // easier name for agent?
        description: `Gets one or more renderables by its handle (primarily uuid), and returns the full state.\n${EXAMPLES}`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                handles: GEMINI_SCHEMA_RENDERABLE_HANDLES,
            },
            required: ['renderSvcId', 'handles'],
        },
    } as const,
};
