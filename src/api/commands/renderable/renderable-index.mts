import { APIFunctionInfo } from '../../api-types.mjs';
import {
    RenderableCreateCommandData, renderableCreateGroupsFunctionInfo,
    renderableCreateRectsFunctionInfo, renderableCreatePathsFunctionInfo,
    renderableCreateTextsFunctionInfo,
} from './renderable-create.mjs';
import { RenderableDestroyCommandData, renderableDestroyFunctionInfo } from './renderable-destroy.mjs';
import { GetAllRenderablesCommandData, renderableGetAllFunctionInfo, } from './renderable-get-all.mjs';
import { renderableGetFunctionInfo } from './renderable-get.mjs';
import {
    RenderableUpdateCommandData,
    renderableUpdatePathFunctionInfo,
    renderableUpdateRectFunctionInfo,
    renderableUpdateTextFunctionInfo,
} from './renderable-update.mjs';

/**
 * @interface RenderCommand - A union of all possible render-related commands.
 */
export type RenderCommand =
    | RenderableCreateCommandData
    | RenderableDestroyCommandData
    | GetAllRenderablesCommandData
    | RenderableUpdateCommandData
    ;

/**
 * @constant RenderAgentFunctionInfos - An array of all available API functions for agents.
 */
export const RenderAgentFunctionInfos: APIFunctionInfo<any>[] = [
    // create
    renderableCreateRectsFunctionInfo,
    renderableCreatePathsFunctionInfo,
    renderableCreateTextsFunctionInfo,
    renderableCreateGroupsFunctionInfo,

    // destroy
    renderableDestroyFunctionInfo,

    // get
    renderableGetFunctionInfo,

    // get all
    renderableGetAllFunctionInfo,

    // update
    renderableUpdateRectFunctionInfo,
    // renderableUpdatePathFunctionInfo,
    renderableUpdateTextFunctionInfo,
];
