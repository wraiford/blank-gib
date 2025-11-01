import type { RenderableHandle, GeometryParametersPath } from "../../../render/render-types.mjs";
import { PATH_COMMAND_TYPE_VALUES } from "./path-command/path-command-types.mjs";

export const GEMINI_SCHEMA_RENDERABLE_SVC_ID = {
    type: 'string',
    description: 'Id for the render service. Each canvas is tied to a render service. There can be more than one canvas associated with the same render service, but there can only be one render service for each canvas. If you are working with more than one canvas, be sure to keep track of which render service is associated with which canvas.',
} as const;

/**
 * OpenAPI schema object for use with Gemini.
 *
 * @see {@link RenderableHandle}
 */
export const GEMINI_SCHEMA_RENDERABLE_HANDLE = {
    type: 'object',
    description: 'The identifying handle of the renderable.',
    properties: {
        uuid: { type: 'string', description: 'UUID for renderable handle. This uniquely identifies the renderable.' },
        type: { type: 'string', description: 'Type for renderable handle. Must be the string: "Renderable".' },
    },
    required: ['uuid',],
} as const;

/**
 * OpenAPI schema object for use with Gemini.
 *
 * @see {@link RenderableHandle}
 */
export const GEMINI_SCHEMA_RENDERABLE_HANDLES = {
    type: 'array',
    description: 'list of handles',
    items: GEMINI_SCHEMA_RENDERABLE_HANDLE,
} as const;

export const GEMINI_SCHEMA_RENDERABLE_COLOR = { // <--- NOTE: updatedColor, not updatedState
    type: 'object',
    description: 'Renderable color in RGBA format.',
    properties: {
        r: { type: 'number', format: 'float', description: 'RGBA red component (0-1)' },
        g: { type: 'number', format: 'float', description: 'RGBA green component (0-1)' },
        b: { type: 'number', format: 'float', description: 'RGBA blue component (0-1)' },
        a: { type: 'number', format: 'float', description: 'RGBA alpha component (0-1)' },
    },
    required: ['r', 'g', 'b', 'a'], // Color components are required for this function
} as const;

export const GEMINI_SCHEMA_RENDERABLE_POSITION = {
    type: 'object',
    description: 'Position of the renderable.',
    properties: {
        x: { type: 'number', description: 'x-coordinate (horizontal position)' },
        y: { type: 'number', description: 'y-coordinate (vertical position)' },
        z: { type: 'number', description: 'ATOW z-index/depth since we are working in 2d (ATOW, not really used). Just use 0 for now.' },
    },
    required: ['x', 'y', 'z'],
} as const;

export const GEMINI_SCHEMA_RENDERABLE_SCALE = {
    type: 'object',
    description: 'The scale/size of the renderable.',
    properties: {
        x: { type: 'number', description: 'scale factor in x dimension (horizontal in 2d)' },
        y: { type: 'number', description: 'scale factor in y dimension (vertical in 2d)' },
    },
    required: ['x', 'y'],
} as const;

export const GEMINI_SCHEMA_RENDERABLE_ISVISIBLE = {
    type: 'boolean',
    description: 'Indicates whether the renderable is visible or hidden.',
} as const;

export const GEMINI_SCHEMA_RENDERABLE_RECURSIVE = {
    type: 'boolean',
    description: 'If true, the operation will apply recursively to the children. If falsy, the operation will only apply to the target. Only applicable to group renderables.',
} as const;

export const GEMINI_SCHEMA_RENDERABLE_TEXT_TEXT = {
    type: 'string',
    description: 'Text content for TEXT renderables only.',
};

export const GEMINI_SCHEMA_RENDERABLE_TEXT_FONTFAMILY = {
    type: 'string',
    description: 'Font family for TEXT renderables only.',
};
export const GEMINI_SCHEMA_RENDERABLE_TEXT_FONTSIZE = {
    type: 'number',
    description: 'Font size for TEXT renderables only.',
};

export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_TEXT = {
    type: 'object',
    description: 'The definition of a text renderable.',
    properties: {
        text: GEMINI_SCHEMA_RENDERABLE_TEXT_TEXT,
        fontFamily: GEMINI_SCHEMA_RENDERABLE_TEXT_FONTFAMILY,
        fontSize: GEMINI_SCHEMA_RENDERABLE_TEXT_FONTSIZE,
    },
    required: ['text', 'fontFamily', 'fontSize'],
};
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_GROUP = {
    type: 'object',
    description: 'The definition of a group renderable.',
    properties: {
        members: GEMINI_SCHEMA_RENDERABLE_HANDLES,
    },
    required: ['members'],
};

export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_RECT = {
    type: 'object',
    description: 'Geometry details specifically for rect renderables.',
    properties: {
        width: { type: 'number', description: 'Width of the rectangle.' },
        height: { type: 'number', description: 'Height of the rectangle.' },
    },
    required: ['width', 'height'],
};

// #region Path command related

const XY_COORD_IF_TRUTHY_NOTE = `If truthy, in the current HTML Canvas implementation, this will generate a moveTo to this coordinate.`;

const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE = {
    type: 'string',
    enum: PATH_COMMAND_TYPE_VALUES.concat(),
    description: `Note that the command type is doubled: once in the "super" command object and once in the "concrete" command object (if the concrete command object has actual state. boolean commands like beginPath are just boolean and don't have this.)`
}

/**
 * OpenAPI schema object for Gemini's function calling, for beginPath command geometry parameters in paths.
 *
 * @see {@link BeginPathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_BEGINPATH = { // NEW - beginPath command schema
    type: 'boolean',
    description: 'If true, begins a new path. Typically used to start a new subpath within a larger path. The very first command in a path must be a beginPath command.',
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for line command geometry parameters in paths.
 *
 * @see {@link LinePathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_LINE = {
    type: 'object',
    description: 'Parameters for a line segment path command. If x1,y1 are provided, a moveTo will be generated to this position before executing the lineTo to x2,y2.',
    properties: {
        // type: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE,
        x1: { type: 'number', description: `x-coordinate of the starting point of the line. ${XY_COORD_IF_TRUTHY_NOTE}` },
        y1: { type: 'number', description: `y-coordinate of the starting point of the line. If truthy, in the current HTML Canvas implementation, this will generate a moveTo to this coordinate.` },
        x2: { type: 'number', description: `x-coordinate of the ending point of the line. In the current HTML Canvas implementation, this will generate a lineTo to this coordinate.` },
        y2: { type: 'number', description: `y-coordinate of the ending point of the line. In the current HTML Canvas implementation, this will generate a lineTo to this coordinate` },
    },
    required: ['x2', 'y2'],
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for arc command geometry parameters in paths.
 *
 * @see {@link ArcPathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_ARC = {
    type: 'object',
    description: 'Parameters for an arc segment path command.',
    properties: {
        type: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE,
        x: { type: 'number', description: 'x-coordinate of the arc\'s center.' },
        y: { type: 'number', description: 'y-coordinate of the arc\'s center.' },
        radius: { type: 'number', description: 'Arc\'s radius.' },
        startAngle: { type: 'number', format: 'float', description: 'Starting angle of the arc in radians.' },
        endAngle: { type: 'number', format: 'float', description: 'Ending angle of the arc in radians.' },
        anticlockwise: { type: 'boolean', description: 'Optional. Specifies if the arc should be drawn anticlockwise. Defaults to clockwise (false).' },
    },
    required: ['x', 'y', 'radius', 'startAngle', 'endAngle'],
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for bezier curve command geometry parameters in paths.
 *
 * @see {@link BezierCurvePathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_BEZIERCURVE = {
    type: 'object',
    description: 'Parameters for a bezier curve segment path command (cubic bezier curve).',
    properties: {
        // type: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE,
        cp1x: { type: 'number', description: 'x-coordinate of the first control point.' },
        cp1y: { type: 'number', description: 'y-coordinate of the first control point.' },
        cp2x: { type: 'number', description: 'x-coordinate of the second control point.' },
        cp2y: { type: 'number', description: 'y-coordinate of the second control point.' },
        x1: { type: 'number', description: `x-coordinate of the starting point. ${XY_COORD_IF_TRUTHY_NOTE}` },
        y1: { type: 'number', description: `y-coordinate of the starting point. ${XY_COORD_IF_TRUTHY_NOTE}` },
        x2: { type: 'number', description: 'x-coordinate of the ending point (anchor).' },
        y2: { type: 'number', description: 'y-coordinate of the ending point (anchor).' },
    },
    required: ['cp1x', 'cp1y', 'cp2x', 'cp2y', 'x2', 'y2'],
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for quadratic bezier curve command geometry parameters in paths.
 *
 * @see {@link QuadraticBezierCurveCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_QUADRATICBEZIERCURVE = {
    type: 'object',
    description: 'Parameters for a quadratic bezier curve segment path command.',
    properties: {
        // type: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE,
        cpx: { type: 'number', description: 'x-coordinate of the control point.' },
        cpy: { type: 'number', description: 'y-coordinate of the control point.' },
        x1: { type: 'number', description: `x-coordinate of the starting point. ${XY_COORD_IF_TRUTHY_NOTE}` },
        y1: { type: 'number', description: `y-coordinate of the starting point. ${XY_COORD_IF_TRUTHY_NOTE}` },
        x2: { type: 'number', description: 'x-coordinate of the ending point (anchor).' },
        y2: { type: 'number', description: 'y-coordinate of the ending point (anchor).' },
    },
    required: ['cpx', 'cpy', 'x2', 'y2'],
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for moveTo command geometry parameters in paths.
 *
 * @see {@link MoveToPathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_MOVETO = {
    type: 'object',
    description: `Parameters for a moveTo path command (just moves the cursor, doesn't draw anything).`,
    properties: {
        x: { type: 'number', description: `x-coordinate of the cursor's new position.` },
        y: { type: 'number', description: `y-coordinate of the cursor's new position.` },
    },
    required: ['x', 'y'],
} as const;

/**
 * OpenAPI schema object for Gemini's function calling, for closePath command geometry parameters in paths.
 *
 * @see {@link ClosePathPathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_CLOSEPATH = {
    type: 'boolean',
    description: `If true, closes the current path subpath by drawing a straight line back to the subpath's starting point.`,
} as const;
/**
 * OpenAPI schema object for Gemini's function calling, for stroke command geometry parameters in paths.
 *
 * @see {@link StrokePathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_STROKE = {
    type: 'object',
    description: `Closes the current path subpath by a stroke() call. Can optionally set overriding stroke color and width.`,
    properties: {
        color: GEMINI_SCHEMA_RENDERABLE_COLOR,
        width: { type: 'number', description: 'Stroke width.' },
    },
    required: [],
} as const;
// export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_STROKE = {
//     type: 'boolean',
//     description: `If true, closes the current path subpath by a stroke() call.`,
// } as const;

/**
 * OpenAPI schema object for Gemini's function calling, for stroke command geometry parameters in paths.
 *
 * @see {@link FillPathCommand}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_FILL = {
    type: 'boolean',
    description: `If true, closes the current path subpath by a fill() call.`,
} as const;

/**
 * This is a single *part* of a path geometry commands.
 *
 * @see {@link GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH}
 * @see {@link GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDS}
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_ITEM = {
    type: 'object',
    description: 'Details for a single *part* of a path geometry.',
    properties: {
        type: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDTYPE,
        beginPath: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_BEGINPATH,
        line: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_LINE,
        arc: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_ARC,
        bezierCurve: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_BEZIERCURVE,
        quadraticBezierCurve: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_QUADRATICBEZIERCURVE,
        moveTo: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_MOVETO,
        closePath: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_CLOSEPATH,
        stroke: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_STROKE,
        fill: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_FILL,
    },
    required: ['type'],
} as const;

/**
 * Schema of the {@link GeometryParametersPath.commands}.
 *
 *
 * This is used in {@link GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH}
 *
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDS = {
    type: 'array',
    description: `Ordered list of commands for the path. Each individual item should be a command with a single 'type' and a single property set, e.g. 'line' OR 'arc' but not both.`,
    items: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_ITEM,
} as const;

/**
 * Schema of the full Path geometry.
 */
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH = {
    type: 'object',
    description: `Geometry of a fully defined canvas path, i.e. a list of canvas command infos. You can make compound/complex paths by combining multiple commands in this array.`,
    properties: {
        commands: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH_COMMANDS,
    },
    required: ['commands'],
} as const;

// #endregion Path command related


export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_RECT = {
    type: 'object',
    description: 'The geometry definition of the renderable.',
    properties: {
        type: { type: 'string', enum: ['rect'] },
        parameters: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_RECT,
    },
    required: ['type', 'parameters'],
};
export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PATH = {
    type: 'object',
    description: 'The geometry definition of the renderable.',
    properties: {
        type: { type: 'string', enum: ['path'] },
        parameters: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_PATH,
    },
    required: ['type', 'parameters'],
};

export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_TEXT = {
    type: 'object',
    description: 'The geometry definition of a text renderable.',
    properties: {
        type: { type: 'string', enum: ['text'] },
        parameters: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_TEXT,
    },
    required: ['type', 'parameters'],
};

export const GEMINI_SCHEMA_RENDERABLE_GEOMETRY_GROUP = {
    type: 'object',
    description: 'The geometry definition of a group renderable.',
    properties: {
        type: { type: 'string', enum: ['group'] },
        parameters: GEMINI_SCHEMA_RENDERABLE_GEOMETRY_PARAMS_GROUP,
    },
    required: ['type', 'parameters'],
};
