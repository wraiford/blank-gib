import { pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { RenderableDestroyOpts, RenderableDestroyResult, RenderableHandle, } from "../../../render/render-types.mjs";
import { getRenderService } from "../../../render/render-service-v1.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { CommandDataBase } from "../command-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { GEMINI_SCHEMA_RENDERABLE_HANDLES, GEMINI_SCHEMA_RENDERABLE_RECURSIVE, GEMINI_SCHEMA_RENDERABLE_SVC_ID } from "./renderable-constants.mjs";
import { tweakGeminiSchema } from "../command-helpers.mjs";
import { RenderableCommandDataBase } from "./renderable-types.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// /**
//  * @interface RenderableGetOpts - Options for getting a single renderable by
//  * handle or uuid.
//  */
// export interface RenderableGetOpts
//     extends CommandDataBase<'renderable', ['destroy']>, RenderableDestroyOpts {
//     /**
//      * The uuid of the renderable to get.
//      */
//     handle: RenderableHandle;
// }

// #region constants
const EXAMPLE_INPUT_RENDERABLE_DESTROY_SINGLE: Partial<RenderableDestroyCommandData> = {
    repromptWithResult: true,
    handles: [
        {
            uuid: 'd902a88cfe483bd712dd6fe88d783225',
            type: 'Renderable',
        }
    ],
}
const EXAMPLE_INPUT_RENDERABLE_DESTROY_MULTIPLE: Partial<RenderableDestroyCommandData> = {
    repromptWithResult: true,
    handles: [
        {
            uuid: 'aaa38cabbfc89f2ebf746ce892e4cf25',
            type: 'Renderable',
        },
        {
            uuid: 'df62484fd3e8f63e9bef4c980e0add25',
            type: 'Renderable',
        }
    ],
}
const EXAMPLES = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_DESTROY_SINGLE),
    pretty(EXAMPLE_INPUT_RENDERABLE_DESTROY_MULTIPLE),
].join('\n');

// #endregion constants
/**
 * @interface RenderableDestroyCommand - Command for destroying a renderable object.
 * @extends CommandDataBase
 */
export interface RenderableDestroyCommandData extends RenderableCommandDataBase<['destroy']> {
    /**
     * @see {@link RenderableDestroyOpts.handles}
     */
    handles: RenderableHandle[];
    /**
     * @see {@link RenderableDestroyOpts.recursive}
     */
    recursive?: boolean;
}

function renderableDestroyViaCmd(opts: RenderableDestroyOpts): Promise<RenderableDestroyResult> {
    const commandService = getCommandService();
    const command: RenderableDestroyCommandData = {
        cmd: 'renderable',
        cmdModifiers: ['destroy'],
        ...opts,
    };
    return new Promise<RenderableDestroyResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}
async function renderableDestroyImpl(opts: RenderableDestroyOpts): Promise<RenderableDestroyResult> {
    const renderService = getRenderService(opts);
    return await renderService.renderableDestroy(opts);
}

/**
 * API function to destroy a renderable object.
 * @param {RenderableDestroyOpts} opts - Options for destroying the renderable.
 */
export const renderableDestroyFunctionInfo: APIFunctionInfo<typeof renderableDestroyViaCmd> = {
    nameOrId: 'renderableDestroy',
    fnViaCmd: renderableDestroyViaCmd,
    functionImpl: renderableDestroyImpl,
    cmd: 'renderable',
    cmdModifiers: ['destroy'],
    schema: {
        name: 'renderableDestroy',
        description: `Destroys (removes from the canvas) one or more renderables specified by its handle (or uuid). This takes in a list of handles\n${EXAMPLES}`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                handles: GEMINI_SCHEMA_RENDERABLE_HANDLES,
                recursive: tweakGeminiSchema({
                    baseSchema: GEMINI_SCHEMA_RENDERABLE_RECURSIVE,
                    addlDescription: `Only applies to groups, otherwise will warn not throw. If true, will recursively destroy child renderables, including recursively destroying any child groups.`,
                }),
            },
            required: ['renderSvcId', 'handles'],
        },
    },
};
