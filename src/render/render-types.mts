import { PathCommand } from "../api/commands/renderable/path-command/path-command-types.mjs";
import { CANVAS_HANDLE_TYPE, RENDERABLE_HANDLE_TYPE, RENDER_SERVICE_HANDLE_TYPE, RenderableShape } from "./render-constants.mjs";


/**
 * @typedef ColorRGBA - Represents a color with red, green, blue, and alpha components.
 */
export type ColorRGBA = {
    /**
     * @property r - The red component of the color (0-1).
     */
    r: number;
    /**
     * @property g - The green component of the color (0-1).
     */
    g: number;
    /**
     * @property b - The blue component of the color (0-1).
     */
    b: number;
    /**
     * @property a - The alpha component of the color, representing opacity (0-1).
     */
    a: number;
};

/**
 * @typedef Vector2 - Represents a 2-dimensional vector.
 */
export type Vector2 = {
    /**
     * @property x - The x-component of the vector.
     */
    x: number;
    /**
     * @property y - The y-component of the vector.
     */
    y: number;
};

/**
 * @typedef Vector3 - Represents a 3-dimensional vector.
 */
export type Vector3 = {
    /**
     * @property x - The x-component of the vector.
     */
    x: number;
    /**
     * @property y - The y-component of the vector.
     */
    y: number;
    /**
     * @property z - The z-component of the vector (initially 0 for 2D).
     */
    z: number;
};

export type GeometryType =
    | RenderableShape;

/**
 * @interface GeometryParametersBase - Base interface for all geometry parameters.
 */
export interface GeometryParametersBase {
    // /**
    //  * @property type - The type of geometry, e.g., 'rect' or {@link RenderableShape.TEXT},
    //  *
    //  * @see {@link GeometryType}
    //  * @see {@link RenderableShape}
    //  */
    // type: GeometryType;
}

/**
 * @interface GeometryParametersRect - Parameters specific to rectangle geometry.
 * @extends GeometryParametersBase
 */
export interface GeometryParametersRect extends GeometryParametersBase {
    // /**
    //  * @inheritdoc
    //  */
    // type: GeometryType;
    /**
     * @property width - The width of the rectangle.
     */
    width: number;
    /**
     * @property height - The height of the rectangle.
     */
    height: number;
}

/**
 * @interface GeometryParametersPath - Parameters specific to path geometry.
 * @extends GeometryParametersBase
 */
export interface GeometryParametersPath extends GeometryParametersBase {
    // todo: implement GeometryParametersPath interface
    commands: PathCommand[];
}

/**
 * @interface GeometryParametersText - Parameters specific to text geometry.
 * @extends GeometryParametersBase
 */
export interface GeometryParametersText extends GeometryParametersBase {
    /**
     * @property text - The text string to render.
     */
    text: string;
    /**
     * @property fontFamily - The font family for the text.
     */
    fontFamily: string;
    /**
     * @property fontSize - The font size for the text.
     */
    fontSize: number;
}

/**
 * @interface GeometryParametersGroup - Parameters specific to text geometry.
 * @extends GeometryParametersBase
 */
export interface GeometryParametersGroup extends GeometryParametersBase {
    // /**
    //  * @inheritdoc
    //  */
    // type: typeof RenderableShape.GROUP;
    /**
     * @property members - The handles of the renderables that compose the
     * group.
     */
    members: RenderableHandle[];
}

/**
 * @typedef GeometryParameters - Union type for all specific geometry parameter interfaces.
 */
export type GeometryParameters =
    | GeometryParametersRect
    | GeometryParametersPath
    | GeometryParametersText
    | GeometryParametersGroup
    ;

/**
 * @interface Geometry - Defines the geometry of a renderable object.
 */
export interface Geometry {
    /**
     * @property type - The concrete, specific type of geometry, which should
     * correspond to {@link parameters}
     */
    type: GeometryType;
    /**
     * @property parameters - The parameters specific to the {@link type} that
     * provide the concrete details of the geometry.
     */
    parameters: GeometryParameters;
}

export interface RenderableOptsBase {
    /**
     * @property renderSvcId - id of the render service to use.
     */
    renderSvcId: string;
}
/**
 * all public facing renderable functions should return something descending
 * from this.
 */
export interface RenderableResultBase {
    /**
     * @property renderSvcId - id of the render service used in operation.
     *
     * ## notes
     *
     * I am including this in all return results so that the model always has a
     * reference to which svc was used.
     */
    renderSvcId: string;
}

/**
 * @interface - Options for creating a renderable object.
 */
export interface RenderableCreateOpts extends RenderableOptsBase {
    /**
     * @property initialState - The initial state of the renderable.
     */
    initialState: RenderableState;
}
export interface RenderableCreateResult extends RenderableResultBase {
    handle: RenderableHandle;
}

export interface RenderableUpdateStateInfo {
    /**
     * @property handle - The handle of the renderable to update.
     */
    handle: RenderableHandle;
    /**
     * @property updatedState - The partial state to update on the renderable.
     */
    updatedState: Partial<RenderableState>;
}

export interface RenderableUpdateOpts extends RenderableOptsBase {
    /**
     * @property targets - which renderables we are applying updates to.
     */
    targets: RenderableUpdateStateInfo[];
    /**
     * @property recursive - Whether to recursively update child renderables.
     * Only applies to groups, otherwise will warn not throw. NOTE: you CANNOT
     * use this when updating specific geometries. You can ONLY update
     * properties common to all renderables, e.g., position, color, scale, etc.
     */
    recursive?: boolean;
}
export interface RenderableUpdateResult extends RenderableResultBase { }

export interface RenderableDestroyOpts extends RenderableOptsBase {
    /**
     * @property handle - The handle of the renderable to destroy.
     */
    handles: RenderableHandle[];
    /**
     * @property recursive - Whether to recursively destroy child renderables.
     * Only applies to groups, otherwise will warn not throw.
     */
    recursive?: boolean;
}
export interface RenderableDestroyResult extends RenderableResultBase { }

/**
 * @interface RenderableGetOpts - Options for getting a single renderable by
 * handle or uuid.
 */
export interface RenderableGetOpts extends RenderableOptsBase {
    /**
     * The uuid of the renderable to get.
     */
    handles: RenderableHandle[];
    // later, we may add a throwIfNotFound option, but for now leave as-is
}
export interface RenderableGetResult extends RenderableResultBase {
    stateMap: RenderableStateMap;
}

export interface RenderableGetAllHandlesResult extends RenderableResultBase {
    handles: RenderableHandle[];
}

export interface RenderableGetAllStatesResult extends RenderableResultBase {
    handleToStatesMap: ReadonlyMap<RenderableHandle, RenderableState>;
}

/**
 * @interface RenderService - Interface for the rendering service.
 */
export interface RenderService {
    /**
     * @property initialized - A promise that resolves when the rendering service is fully initialized.
     */
    initialized: Promise<void>;

    /**
     * Creates a new renderable object.
     * @param {object} details - Options for creating the renderable.
     * @param {RenderableState} details.initialState - The initial state of the renderable.
     * @returns {Promise<RenderableHandle>} A promise that resolves with the handle to the newly created renderable.
     */
    renderableCreate(opts: RenderableCreateOpts): Promise<RenderableCreateResult>;

    /**
     * Updates the state of an existing renderable object.
     * @param {object} details - Options for updating the renderable.
     * @param {RenderableHandle} details.handle - The handle of the renderable to update.
     * @param {Partial<RenderableState>} details.updatedState - The partial state to update on the renderable.
     * @returns {Promise<void>} A promise that resolves when the renderable has been updated.
     */
    renderableUpdate(opts: RenderableUpdateOpts): Promise<RenderableUpdateResult>;

    /**
     * Destroys a renderable object, releasing its resources.
     * @param {object} details - Options for destroying the renderable.
     * @param {RenderableHandle} details.handle - The handle of the renderable to destroy.
     * @returns {Promise<void>} A promise that resolves when the renderable has been destroyed.
     */
    renderableDestroy(opts: RenderableDestroyOpts): Promise<RenderableDestroyResult>;

    /**
     * Retrieves the current state of a renderable object.
     * @param {object} details - Options for getting the renderable state.
     * @param {RenderableHandle} details.handle - The handle of the renderable to retrieve.
     * @returns {Promise<RenderableState | undefined>} A promise that resolves with the current state of the renderable, or undefined if the handle is invalid.
     */
    getRenderableStates(opts: {
        handles: RenderableHandle[];
    }): RenderableGetAllStatesResult;

    // }): ReadonlyMap<RenderableHandle, RenderableState>;
    // }): Promise<RenderableState[] | undefined>;

    /**
     * Renders all currently managed renderable objects to the canvas.
     */
    render(): void;

    /**
     * Gets the 2D rendering context of the canvas.
     * @returns {CanvasRenderingContext2D | null} The canvas rendering context, or null if not available.
     */
    getContext(): CanvasRenderingContext2D | null;
}

/**
 * @interface RenderServiceInitializerOpts - Options for initializing the rendering service.
 */
export interface RenderServiceInitializerOpts {
    /**
     * @property canvasHandle - An optional handle to an existing canvas element. If not provided, a new canvas will be created.
     */
    canvasHandle?: CanvasHandle;
}

/**
 * @interface RenderServiceInitializer - Signature for the rendering service initializer (factory function).
 */
export interface RenderServiceInitializer {
    /**
     * Initializes the rendering service.
     * @param {RenderServiceInitializerOpts} [opts] - Initialization options.
     * @returns {RenderService} The initialized rendering service instance.
     */
    getRenderService(opts?: RenderServiceInitializerOpts): RenderService;
}

/**
 * @interface HandleBase - Base interface for all handles.
 */
export interface HandleBase {
    /**
     * @property uuid - A unique identifier for the handle.
     */
    uuid: string;
    /**
     * @property type - The type of the handle (e.g., 'Renderable', 'Canvas').
     */
    type?: string;
}

/**
 * @interface RenderServiceHandle - Handle for the rendering service.
 * @extends HandleBase
 */
export interface RenderServiceHandle extends HandleBase {
    /**
     * @inheritdoc
     */
    type: typeof RENDER_SERVICE_HANDLE_TYPE;
}

/**
 * @interface RenderableHandle - Handle for an individual renderable object.
 * @extends HandleBase
 */
export interface RenderableHandle extends HandleBase {
    /**
     * @inheritdoc
     */
    type: typeof RENDERABLE_HANDLE_TYPE;
}

/**
 * @interface CanvasHandle - Handle for the HTMLCanvasElement.
 * @extends HandleBase
 */
export interface CanvasHandle extends HandleBase {
    /**
     * @inheritdoc
     */
    type: typeof CANVAS_HANDLE_TYPE;
}

/**
 * @interface RenderableState - Represents the state of a renderable object.
 */
export interface RenderableState {
    /**
     * @property isVisible - Indicates whether the renderable is currently visible.
     */
    isVisible: boolean;
    /**
     * @property color - The color of the renderable.
     */
    color: ColorRGBA;
    /**
     * @property position - The position of the renderable in 2D space (with Z always 0 initially).
     */
    position: Vector3;
    /**
     * @property scale - The scale of the renderable in the x and y dimensions.
     *
     * TODO: refactor this to a Vector3 like {@link position} with z always 0.
     */
    scale: Vector2;
    /**
     * @property geometry - The geometry definition of the renderable.
     */
    geometry: Geometry;
}

/**
 * map of renderable states, keyed by {@link RenderableHandle.uuid}
 *
 * if uuid is not found, the value of the map is undefined
 *
 * @see {@link RenderableHandle}
 * @see {@link RenderableState}
 */
export interface RenderableStateMap {
    [uuid: string]: { handle: RenderableHandle, state: RenderableState } | undefined;
}
