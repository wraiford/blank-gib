
/**
 * @constant RENDER_SERVICE_HANDLE_TYPE - The handle type for the rendering service.
 */
export const RENDER_SERVICE_HANDLE_TYPE = 'RenderService';
/**
 * @constant RENDERABLE_HANDLE_TYPE - The handle type for individual renderable objects.
 */
export const RENDERABLE_HANDLE_TYPE = 'Renderable';
/**
 * @constant CANVAS_HANDLE_TYPE - The handle type for the canvas element.
 */
export const CANVAS_HANDLE_TYPE = 'Canvas';

// #region RenderableShape
const RENDERABLE_SHAPE_RECTANGLE = 'rect';
const RENDERABLE_SHAPE_CIRCLE = 'circle';
const RENDERABLE_SHAPE_PATH = 'path';
const RENDERABLE_SHAPE_TEXT = 'text';
const RENDERABLE_SHAPE_GROUP = 'group';

export type RenderableShape =
    | typeof RENDERABLE_SHAPE_RECTANGLE
    | typeof RENDERABLE_SHAPE_CIRCLE
    | typeof RENDERABLE_SHAPE_PATH
    | typeof RENDERABLE_SHAPE_TEXT
    | typeof RENDERABLE_SHAPE_GROUP
    ;

export const RenderableShape = {
    RECTANGLE: RENDERABLE_SHAPE_RECTANGLE as RenderableShape,
    CIRCLE: RENDERABLE_SHAPE_CIRCLE as RenderableShape,
    PATH: RENDERABLE_SHAPE_PATH as RenderableShape,
    TEXT: RENDERABLE_SHAPE_TEXT as RenderableShape,
    GROUP: RENDERABLE_SHAPE_GROUP as RenderableShape, // <-- ADD THIS
} satisfies { [key: string]: RenderableShape };
// #endregion RenderableShape
