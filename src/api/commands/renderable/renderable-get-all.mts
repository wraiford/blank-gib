import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "@ibgib/web-gib/dist/api/commands/command-constants.mjs";
import { getCommandService } from "@ibgib/web-gib/dist/api/commands/command-service-v1.mjs";

import { RenderableGetAllHandlesResult, RenderableHandle, } from "../../../render/render-types.mjs";
import { getRenderService } from "../../../render/render-service-v1.mjs";
import { GEMINI_SCHEMA_RENDERABLE_SVC_ID } from "./renderable-constants.mjs";
import { RenderableCommandDataBase } from "./renderable-types.mjs";

export interface GetAllRenderablesOpts extends RenderableCommandDataBase<['get', 'all']> {
}

export interface GetAllRenderablesCommandData extends RenderableCommandDataBase<['get', 'all']> {
}

function renderableGetAllViaCmd(opts: GetAllRenderablesOpts): Promise<RenderableGetAllHandlesResult> {
    const commandService = getCommandService();
    const command: GetAllRenderablesCommandData = {
        renderSvcId: opts.renderSvcId,
        cmd: 'renderable',
        cmdModifiers: ['get', 'all'],
        repromptWithResult: opts?.repromptWithResult,
    };
    return new Promise<RenderableGetAllHandlesResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

async function renderableGetAllImpl(opts: GetAllRenderablesOpts): Promise<RenderableGetAllHandlesResult> {
    const renderService = getRenderService(opts);
    const statesMap = renderService.getRenderableStates().handleToStatesMap;
    const handles = Array.from(statesMap.keys());
    return { renderSvcId: opts.renderSvcId, handles };
}

export const renderableGetAllFunctionInfo: APIFunctionInfo<typeof renderableGetAllViaCmd> = {
    nameOrId: 'renderableGetAll',
    fnViaCmd: renderableGetAllViaCmd,
    functionImpl: renderableGetAllImpl,
    cmd: 'renderable',
    cmdModifiers: ['get', 'all'],
    schema: {
        name: 'renderableGetAll',
        description: 'Gets ALL of the current renderables on the canvas, and returns handles for them.',
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
            },
            required: ['renderSvcId']
        },
    } as const,
};
