import { pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "@ibgib/web-gib/dist/api/commands/command-constants.mjs";
import { getCommandService } from "@ibgib/web-gib/dist/api/commands/command-service-v1.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "@ibgib/web-gib/dist/api/api-constants.mjs";
import { tweakGeminiSchema } from "@ibgib/web-gib/dist/api/commands/command-helpers.mjs";

import { RenderableShape, } from "../../../render/render-constants.mjs";
import {
    Geometry,
    GeometryParametersRect, RenderableState,
    RenderableUpdateOpts, RenderableUpdateResult, RenderableUpdateStateInfo,
} from "../../../render/render-types.mjs";
import {
    GEMINI_SCHEMA_RENDERABLE_COLOR, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PATH, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_RECT,
    GEMINI_SCHEMA_RENDERABLE_GEOMETRY_TEXT, GEMINI_SCHEMA_RENDERABLE_HANDLE,
    GEMINI_SCHEMA_RENDERABLE_ISVISIBLE, GEMINI_SCHEMA_RENDERABLE_POSITION,
    GEMINI_SCHEMA_RENDERABLE_RECURSIVE,
    GEMINI_SCHEMA_RENDERABLE_SCALE,
    GEMINI_SCHEMA_RENDERABLE_SVC_ID,
} from "./renderable-constants.mjs";
import { getRenderService } from "../../../render/render-service-v1.mjs";
import { RenderableCommandDataBase } from "./renderable-types.mjs";

// #region constants
const EXAMPLE_INPUT_UPDATEREDBOX_UNUSUAL_COLOR: Partial<RenderableUpdateCommandData> = {
    notesToSelf: 'Example of renderableUpdate to set the color to an unusual color. Note you MUST PROVIDE THE FULL COLOR OBJECT, like {color: {r:0,b:1,g:1,a:1}}. {color:{r:0}} is INVALID! But {color: {r:0,b:1,g:1,a:1}} is VALID',
    renderSvcId: 'someIDHere',
    targets: [
        {
            handle: {
                uuid: 'someUUID',
                type: 'Renderable',
            },
            updatedState: {
                color: { r: 0.142, g: 0.237, b: 0.512, a: 1 },
            }
        }
    ],
};
const EXAMPLE_INPUT_UPDATEREDBOX_ALL_PROPS: Partial<RenderableUpdateCommandData> = {
    notesToSelf: 'Example of renderableUpdate to set a bunch of properties of a single renderable target.',
    renderSvcId: 'someIDHere',
    targets: [
        {
            handle: {
                uuid: 'someUUID',
                type: 'Renderable',
            },
            updatedState: {
                geometry: {
                    type: RenderableShape.RECTANGLE,
                    parameters: {
                        height: 43,
                        width: 20,
                    } satisfies GeometryParametersRect,
                } satisfies Geometry,
                position: { x: 50, y: 75, z: 0 },
                scale: { x: 1, y: 1 },
                color: { r: 0, g: 0.1, b: 0.5, a: 1 },
                isVisible: true,
            } satisfies RenderableState,
        }
    ]
};
const EXAMPLE_INPUT_UPDATEREDBOX_POSITION: Partial<RenderableUpdateCommandData> = {
    notesToSelf: 'Example of renderableUpdate to set just the position. Note you must provide the full position object!',
    renderSvcId: 'someIDHere',
    targets: [
        {
            handle: {
                uuid: 'someUUID',
                type: 'Renderable',
            },
            updatedState: {
                position: { x: 50, y: 75, z: 0 },
            }
        }
    ]
};
const EXAMPLES = [
    'First gather data which may take multiple rounds before calling this function.',
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_UPDATEREDBOX_UNUSUAL_COLOR),
    pretty(EXAMPLE_INPUT_UPDATEREDBOX_ALL_PROPS),
    pretty(EXAMPLE_INPUT_UPDATEREDBOX_POSITION),
].join('\n');

const EXAMPLES_COLOR_ONLY = [
    'First gather data which may take multiple rounds before calling this function.',
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_UPDATEREDBOX_UNUSUAL_COLOR),
].join('\n');

const EXAMPLES_POSITION = [
    'First gather data which may take multiple rounds before calling this function.',
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_UPDATEREDBOX_POSITION),
].join('\n');

// #endregion constants


/**
 * @interface UpdateRenderableCommand - Command for updating an existing renderable object.
 * @extends CommandDataBase
 */
export interface RenderableUpdateCommandData extends RenderableCommandDataBase<['update']> {
    targets: RenderableUpdateStateInfo[];
    // /**
    //  * @property handle - The handle of the renderable to update.
    //  */
    // handle: RenderableHandle;
    // /**
    //  * @property updatedState - The partial state to update on the renderable.
    //  */
    // updatedState: Partial<RenderableState>;
}

function renderableUpdateViaCmd(opts: RenderableUpdateOpts): Promise<RenderableUpdateResult> {
    const commandService = getCommandService();
    const command: RenderableUpdateCommandData = {
        cmd: 'renderable',
        cmdModifiers: ['update'],
        ...opts,
    };
    return new Promise<RenderableUpdateResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}
async function renderableUpdateImpl(opts: RenderableUpdateOpts): Promise<RenderableUpdateResult> {
    const renderService = getRenderService({ renderSvcId: opts.renderSvcId });
    return await renderService.renderableUpdate(opts);
}

/**
 * API function to update a renderable object.
 * @param {RenderableUpdateOpts} opts - Options for updating the renderable.
 */
export function getRenderableUpdateFunctionInfo({
    nameOrId,
    geometrySchema,
    updatedStatePropertyNames,
    examples,
}: {
    /**
     * nameOrId of the function itself.
     *
     * this will be re-used both as the {@link APIFunctionInfo.nameOrId} and
     * {@link APIFunctionInfo.schema.name}.
     */
    nameOrId: string,
    /**
     * @optional OpenAPI (Gemini) schema for the geometry if the APIFunctionInfo
     * should include geometry-specific args for the model to use.
     *
     * If you are just updating general property/properties like
     * {@link  RenderableState.isVisible} and/or {@link RenderableState.color},
     * then you don't necessarily care about geometry.
     */
    geometrySchema?: any,
    /**
     * @optional whitelist of property names to include in the updatedState.
     *
     * Use this if you are filtering down the properties exposed to the model,
     * e.g., `['color']` if you just want to expose an updateColor function to
     * the model.
     *
     * If {@link geometrySchema} is provided (truthy), then `geometry` will
     * automatically be added to this list.
     */
    updatedStatePropertyNames?: ('isVisible' | 'color' | 'position' | 'scale' | 'geometry')[],
    /**
     * examples to be shown to the model on how to use this function. If not
     * provided, will use default EXAMPLES
     */
    examples?: string,
}): APIFunctionInfo<typeof renderableUpdateViaCmd> {
    if (!nameOrId) { throw new Error(`(UNEXPECTED) nameOrId falsy? (E: cfec88206448c970c8f0d2282076cd25)`); }

    let updatedStateProperties: any = {};
    /** defaults to empty */
    const requiredList: string[] = [];
    if (!!updatedStatePropertyNames && updatedStatePropertyNames.length > 0) {
        const schemas = {
            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
            geometry: geometrySchema,
            recursive: tweakGeminiSchema({
                baseSchema: GEMINI_SCHEMA_RENDERABLE_RECURSIVE,
                addlDescription: `Only applies to groups, otherwise will warn not throw. NOTE: you CANNOT use this when updating specific geometry parameters, e.g. Rect.parameters.width or Texts.parameters.fontSize. You CAN ONLY update properties COMMON to all renderables, e.g., position, color, scale, etc.`,
            })
        }
        const validNames = Object.keys(schemas);
        if (updatedStatePropertyNames.some(x => !validNames.includes(x))) {
            throw new Error(`invalid updatedStatePropertyNames: ${updatedStatePropertyNames} (E: df4f68fbf058fd4c58cd75a51d42ee25)`);
        }
        for (let propName of updatedStatePropertyNames) {
            updatedStateProperties[propName] = schemas[propName];
            requiredList.push(propName);
        }
    } else {
        updatedStateProperties = {
            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
            // geometry: geometrySchema,
        }
        if (geometrySchema) { updatedStateProperties.geometry = geometrySchema; }
    }

    const resAPIFunctionInfo: APIFunctionInfo<typeof renderableUpdateViaCmd> = {
        nameOrId,
        fnViaCmd: renderableUpdateViaCmd,
        functionImpl: renderableUpdateImpl,
        cmd: 'renderable',
        cmdModifiers: ['update'],
        schema: {
            name: nameOrId,
            description: `Updates the state of an existing renderable object on the canvas. Use this to change properties like color, position, size, visibility, text content, etc. BUT! You will need a definite handle uuid and existing state before trying to update the state. So you may need to do multiple functions to gather data before calling this function.\n${examples || EXAMPLES}`,
            parameters: {
                type: 'object',
                properties: {
                    ...COMMAND_BASE_SCHEMA_PROPERTIES, // Include common command properties
                    renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                    targets: {
                        type: 'array',
                        description: 'target infos for renderables whose state we will update.',
                        items: {
                            type: 'object',
                            description: 'target info containing handle and state to update',
                            properties: {
                                handle: GEMINI_SCHEMA_RENDERABLE_HANDLE,
                                updatedState: {
                                    type: 'object',
                                    description: 'The state to update on the renderable. You only need to include the properties you want to change at the first depth, but then you need to include the FULL value. For example, if you only want to update position and scale, you can provide only those values - but they MUST be the FULL value. The color must be the full RGBA object and the scale must include both x and y values.',
                                    // NOTE properties and required here will be overwritten if
                                    properties: updatedStateProperties,
                                    required: requiredList, // `updatedState` is required, but its PROPERTIES at this level are all optional
                                },
                            },
                            required: ['handle', 'updatedState'],
                        },
                    },
                },
                required: ['renderSvcId', 'targets'],
            },
        } as const, // schema
    };

    return resAPIFunctionInfo;
};

export const renderableUpdateRectFunctionInfo = getRenderableUpdateFunctionInfo({
    nameOrId: 'renderableUpdateRect',
    geometrySchema: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_RECT,
    examples: '',
});

export const renderableUpdatePathFunctionInfo = getRenderableUpdateFunctionInfo({
    nameOrId: 'renderableUpdatePath',
    geometrySchema: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PATH,
    examples: '',
});

export const renderableUpdateTextFunctionInfo = getRenderableUpdateFunctionInfo({
    nameOrId: 'renderableUpdateText',
    geometrySchema: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_TEXT,
    examples: '',
});

/**
 * not used at the moment, because just the update seems to be working now. I
 * think the bug that we had earlier was due to an inaccurate description in one
 * of the OpenAPI schemas. We have now centralized/DRY'd out the code and
 * changing colors and positions seems to be working without breaking down into
 * the simpler slices. But I'm leaving this here for now as an example going
 * forward if we do need/want to do this.
 */
export const renderableUpdateColorFunctionInfo = getRenderableUpdateFunctionInfo({
    nameOrId: 'renderableUpdateColor',
    updatedStatePropertyNames: ['color'],
    examples: '',
});
