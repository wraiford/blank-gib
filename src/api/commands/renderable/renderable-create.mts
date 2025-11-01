import { pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { RENDERABLE_HANDLE_TYPE, RenderableShape, } from "../../../render/render-constants.mjs";
import {
    GeometryParametersGroup, GeometryParametersPath, GeometryParametersRect,
    GeometryParametersText, RenderableCreateResult, RenderableHandle,
    RenderableState,
} from "../../../render/render-types.mjs";
import { getRenderService, } from "../../../render/render-service-v1.mjs";
import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { getCommandService } from "../command-service-v1.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "../../api-constants.mjs";
import { GEMINI_SCHEMA_RENDERABLE_COLOR, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_GROUP, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PATH, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_RECT, GEMINI_SCHEMA_RENDERABLE_GEOMETRY_TEXT, GEMINI_SCHEMA_RENDERABLE_ISVISIBLE, GEMINI_SCHEMA_RENDERABLE_POSITION, GEMINI_SCHEMA_RENDERABLE_SCALE, GEMINI_SCHEMA_RENDERABLE_SVC_ID } from "./renderable-constants.mjs";
import { RenderableCommandDataBase } from "./renderable-types.mjs";


// #region constants
const EXAMPLE_INPUT_RENDERABLE_CREATERECTS: Partial<RenderableCreateCommandData> = {
    notesToSelf: 'Example of renderableCreateRects function call to create multiple rects in one shot.',
    initialStates: [
        {
            isVisible: true,
            color: { r: 1, g: 0, b: 0, a: 1 }, // Red
            position: { x: 50, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.RECTANGLE,
                parameters: {
                    width: 50,
                    height: 50,
                } satisfies GeometryParametersRect,
            },
        },
        {
            isVisible: true,
            color: { r: 0, g: 1, b: 0, a: 1 }, // Green
            position: { x: 150, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.RECTANGLE,
                parameters: {
                    width: 50,
                    height: 50,
                } satisfies GeometryParametersRect,
            },
        },
    ],
    repromptWithResult: false,
};
const EXAMPLE_INPUT_RENDERABLE_CREATEPATHS: Partial<RenderableCreateCommandData> = {
    notesToSelf: 'Example of renderableCreatePaths function call to create multiple paths in one shot. The first example includes a line command that provides the optional x1,y1 coordinates. This will auto-generate a moveTo command before a lineTo in the HTML Canvas. The second example manually includes the moveTo before a line command that omits the x1,y1 coordinates.',
    initialStates: [
        {
            isVisible: true,
            color: { r: 1, g: 0, b: 0, a: 1 }, // Red
            position: { x: 50, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.PATH,
                parameters: {
                    commands: [
                        {
                            type: 'beginPath',
                            beginPath: { type: 'beginPath', beginPath: true },
                        },
                        {
                            type: 'line',
                            line: { type: 'line', x1: 10, y1: 105, x2: 15, y2: 200 },
                        },
                        {
                            type: 'stroke',
                            stroke: { type: 'stroke', color: { r: 0, g: 1, b: 0, a: 1 }, width: 5 },
                        },
                        {
                            type: 'beginPath',
                            beginPath: { type: 'beginPath', beginPath: true },
                        },
                    ],
                } satisfies GeometryParametersPath,
            },
        },
        {
            isVisible: true,
            color: { r: 0, g: 1, b: 0, a: 1 }, // Green
            position: { x: 150, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.PATH,
                parameters: {
                    // todo: fill out path geometry parameters example
                    commands: [
                        {
                            type: 'beginPath',
                            beginPath: { type: 'beginPath', beginPath: true },
                        },
                        {
                            type: 'moveTo',
                            moveTo: { type: 'moveTo', x: 500, y: 500 },
                        },
                        {
                            type: 'line',
                            line: { type: 'line', x2: 600, y2: 600 },
                        },
                        {
                            type: 'stroke',
                            stroke: { type: 'stroke', width: 15 },
                        },
                        {
                            type: 'beginPath',
                            beginPath: { type: 'beginPath', beginPath: true },
                        },
                        {
                            type: 'moveTo',
                            moveTo: { type: 'moveTo', x: 250, y: 250 },
                        },
                        {
                            type: 'line',
                            line: { type: 'line', x2: 275, y2: 300 },
                        },
                        {
                            type: 'bezierCurve',
                            bezierCurve: { type: 'bezierCurve', cp1x: 230, cp1y: 30, cp2x: 150, cp2y: 80, x2: 50, y2: 50 },
                        },
                        {
                            type: 'closePath',
                            closePath: { type: 'closePath', closePath: true },
                        },
                    ],
                } satisfies GeometryParametersPath,
            },
        },
    ],
    repromptWithResult: false,
};
const EXAMPLE_INPUT_RENDERABLE_CREATETEXTS: Partial<RenderableCreateCommandData> = {
    notesToSelf: 'Example of renderableCreateTexts function call to create multiple texts (labels, message) in one shot.',
    initialStates: [
        {
            isVisible: true,
            color: { r: 1, g: 0, b: 0, a: 1 }, // Red
            position: { x: 50, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.TEXT,
                parameters: {
                    fontSize: 10,
                    fontFamily: 'Arial',
                    text: 'Hello World!',
                } satisfies GeometryParametersText,
            },
        },
        {
            isVisible: true,
            color: { r: 0, g: 1, b: 0, a: 1 }, // Green
            position: { x: 150, y: 50, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.TEXT,
                parameters: {
                    fontSize: 10,
                    fontFamily: 'Arial',
                    text: 'Hello World!',
                } satisfies GeometryParametersText,
            },
        },
    ],
    repromptWithResult: false,
};

const EXAMPLE_INPUT_RENDERABLE_CREATEGROUP: Partial<RenderableCreateCommandData> = {
    notesToSelf: 'Example of initialStates to create a group.',
    initialStates: [
        {
            isVisible: true,
            color: { r: 1, g: 0, b: 0, a: 1 }, // Red
            position: { x: 25, y: 25, z: 0 },
            scale: { x: 1, y: 1 },
            geometry: {
                type: RenderableShape.GROUP,
                parameters: {
                    members: [
                        {
                            type: RENDERABLE_HANDLE_TYPE,
                            uuid: 'someUUID111',
                        },
                        {
                            type: RENDERABLE_HANDLE_TYPE,
                            uuid: 'someUUID222',
                        },
                    ],
                } satisfies GeometryParametersGroup,
            },
        },
    ],
    repromptWithResult: true,
};

const EXAMPLES_RECT = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_CREATERECTS),
].join('\n');
const EXAMPLES_PATH = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_CREATEPATHS),
].join('\n');
const EXAMPLES_TEXT = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_CREATETEXTS),
].join('\n');
const EXAMPLES_GROUP = [
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_RENDERABLE_CREATEGROUP),
].join('\n');
// #endregion constants


/**
 * @interface RenderableCreateOpts - Options for the renderableCreate command.
 * @extends RenderableCommandDataBase
 */
export interface RenderableCreateOpts extends RenderableCommandDataBase<['create']> {
    /**
     * @property initialStates - The initial states of the renderables to create.
     */
    initialStates: RenderableState[];
}

/**
 * @interface RenderableCreateCommandData - Command data for the renderableCreate command.
 * @extends RenderableCommandDataBase
 */
export interface RenderableCreateCommandData extends RenderableCommandDataBase<['create']> {
    /**
     * @property initialStates - The initial states of the renderables to create.
     */
    initialStates: RenderableState[];
}

/**
 * Wrapper function to enqueue the renderableCreate command.
 * @param {RenderableCreateOpts} opts - Options for creating the renderables.
 * @returns {Promise<RenderableHandle[]>} A promise that resolves with the handles to the newly created renderables.
 */
function renderableCreateViaCmd(opts: RenderableCreateOpts): Promise<RenderableCreateResult[]> {
    const commandService = getCommandService();
    const command: RenderableCreateCommandData = {
        renderSvcId: opts.renderSvcId,
        cmd: 'renderable',
        cmdModifiers: ['create'],
        initialStates: opts.initialStates,
        repromptWithResult: opts?.repromptWithResult,
        notesToSelf: opts?.notesToSelf,
    };
    return new Promise<RenderableCreateResult[]>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}
/**
 * Implementation function for the renderableCreate command.
 * @param {RenderableCreateOpts} opts - Options for creating the renderables.
 * @returns {Promise<RenderableHandle[]>} A promise that resolves with the handles to the newly created renderables.
 */
async function renderableCreateImpl(opts: RenderableCreateOpts): Promise<RenderableCreateResult[]> {
    const renderService = getRenderService(opts);
    const handles: RenderableHandle[] = [];
    for (const initialState of opts.initialStates) {
        const { handle } = await renderService.renderableCreate({
            renderSvcId: opts.renderSvcId,
            initialState,
        });
        handles.push(handle);
    }
    return handles.map(x => { return { renderSvcId: opts.renderSvcId, handle: x } });
}

/**
 * API function info for the renderableCreate command, but for rect renderables.
 */
export const renderableCreateRectsFunctionInfo: APIFunctionInfo<typeof renderableCreateViaCmd> = {
    nameOrId: 'renderableCreateRects',
    fnViaCmd: renderableCreateViaCmd,
    functionImpl: renderableCreateImpl,
    cmd: 'renderable',
    cmdModifiers: ['create'],
    schema: {
        name: 'renderableCreateRects',
        // description: `Creates one or more new rectangular renderable objects. This takes in an array of initial states.`,
        description: `Creates one or more new rectangular renderable objects. This takes in an array of initial states.\n\n${EXAMPLES_RECT}`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                initialStates: {
                    type: 'array',
                    description: 'The initial states of the rect renderables to create. If you have multiple renderables to create, you can call this a single time with multiple initial states.',
                    items: {
                        type: 'object',
                        description: 'The initial state of a single rect renderable.',
                        properties: {
                            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
                            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
                            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
                            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
                            geometry: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_RECT,
                        },
                        required: ['isVisible', 'color', 'position', 'scale', 'geometry'],
                    }
                },
            },
            required: ['renderSvcId', 'initialStates'],
        },
    }
};

/**
 * API function info for the renderableCreate command, but for path renderables.
 */
export const renderableCreatePathsFunctionInfo: APIFunctionInfo<typeof renderableCreateViaCmd> = {
    nameOrId: 'renderableCreatePaths',
    fnViaCmd: renderableCreateViaCmd,
    functionImpl: renderableCreateImpl,
    cmd: 'renderable',
    cmdModifiers: ['create'],
    schema: {
        name: 'renderableCreatePaths',
        description: `Creates one or more new path renderable objects. This takes in an array of initial states.\n\n${EXAMPLES_PATH}`,
        // description: `Creates one or more new path renderable objects. This takes in an array of initial states.`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                initialStates: {
                    type: 'array',
                    description: 'The initial states of the path renderables to create. If you have multiple renderables to create, you can call this a single time with multiple initial states.',
                    items: {
                        type: 'object',
                        description: 'The initial state of a single path renderable.',
                        properties: {
                            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
                            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
                            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
                            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
                            geometry: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PATH,
                        },
                        required: ['isVisible', 'color', 'position', 'scale', 'geometry'],
                    }
                },
            },
            required: ['renderSvcId', 'initialStates'],
        },
    }
};

/**
 * API function info for the renderableCreate command, but for text renderables.
 */
export const renderableCreateTextsFunctionInfo: APIFunctionInfo<typeof renderableCreateViaCmd> = {
    nameOrId: 'renderableCreateTexts',
    fnViaCmd: renderableCreateViaCmd,
    functionImpl: renderableCreateImpl,
    cmd: 'renderable',
    cmdModifiers: ['create'],
    schema: {
        name: 'renderableCreateTexts',
        description: `Creates one or more new text renderable objects. This takes in an array of initial states.\n\n${EXAMPLES_TEXT}`,
        // description: `Creates one or more new text renderable objects. This takes in an array of initial states.`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                initialStates: {
                    type: 'array',
                    description: 'The initial states of the text renderables to create. If you have multiple renderables to create, you can call this a single time with multiple initial states.',
                    items: {
                        type: 'object',
                        description: 'The initial state of a single text renderable.',
                        properties: {
                            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
                            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
                            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
                            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
                            geometry: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_TEXT,
                        },
                        required: ['isVisible', 'color', 'position', 'scale', 'geometry'],
                    }
                },
            },
            required: ['initialStates'],
        },
    }
};

/**
 * API function info for the renderableCreate command, but for group renderables.
 */
export const renderableCreateGroupsFunctionInfo: APIFunctionInfo<typeof renderableCreateViaCmd> = {
    nameOrId: 'renderableCreateGroups',
    fnViaCmd: renderableCreateViaCmd,
    functionImpl: renderableCreateImpl,
    cmd: 'renderable',
    cmdModifiers: ['create'],
    schema: {
        name: 'renderableCreateGroups',
        description: `Creates one or more new group renderable objects. This takes in an array of initial states, though of course this can be of size one.\n\n${EXAMPLES_GROUP}`,
        // description: `Creates one or more new group renderable objects. This takes in an array of initial states, though of course this can be of size one.`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                renderSvcId: GEMINI_SCHEMA_RENDERABLE_SVC_ID,
                initialStates: {
                    type: 'array',
                    description: 'The initial states of the group renderables to create. If you have multiple groups to create, you can call this a single time with multiple initial states.',
                    items: {
                        type: 'object',
                        description: 'The initial state of a single group renderable.',
                        properties: {
                            isVisible: GEMINI_SCHEMA_RENDERABLE_ISVISIBLE,
                            color: GEMINI_SCHEMA_RENDERABLE_COLOR,
                            position: GEMINI_SCHEMA_RENDERABLE_POSITION,
                            scale: GEMINI_SCHEMA_RENDERABLE_SCALE,
                            geometry: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_GROUP,
                        },
                        required: ['isVisible', 'color', 'position', 'scale', 'geometry'],
                    }
                },
            },
            required: ['initialStates'],
        },
    }
};
