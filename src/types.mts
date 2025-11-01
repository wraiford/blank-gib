import { CommentData_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { RCLIArgInfo } from "@ibgib/helper-gib/dist/rcli/rcli-types.mjs";
import { IbGibRel8ns_V1, IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";

import { LiveProxyIbGib } from "./witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";
import { ChronologysComponentInstance } from "./components/chronologys/chronologys-component-one-file.mjs";
import { ProjectsComponentInstance } from "./components/projects/projects-component-one-file.mjs";
import { ProjectsExplorerComponentInstance } from "./components/projects/projects-explorer/projects-explorer-component-one-file.mjs";

// src/types.mts
// ... other imports

/**
 * Parameters for rendering a visual element.  These parameters are used by the
 * `draw()` function and provide instructions on how to render the element,
 * including its position, size, color, and other properties.
 */
// export interface RenderableParameters<TControlProps = Record<string, any>> {
//     /**
//      * Current position of the renderable in absolute coordinates within the
//      * canvas. This position is calculated based on the `relativePos` and the
//      * position of the parent renderable (if any).
//      */
//     absolutePos: number[];
//     /**
//      * Position of the renderable relative to its parent. If the renderable has
//      * no parent, this position is relative to the canvas itself.  Values are
//      * normalized (between 0 and 1).
//      */
//     relativePos: number[];
//     /**
//      * Parent renderable, if any. If `undefined`, the parent is the canvas itself.
//      */
//     parent?: Renderable;
//     /**
//      * Size of the renderable. For 2D, this is `[width, height]`. For 3D, this is
//      * `[width, height, depth]`.
//      */
//     size: number[];
//     /**
//      * Color of the renderable. Can be any valid CSS color string.
//      */
//     color?: string;

//     /**
//      * Convenience getter for the x-coordinate of the `absolutePos`.
//      */
//     get x(): number;
//     /**
//      * Convenience setter for the x-coordinate of the `absolutePos`.
//      */
//     set x(value: number);
//     /**
//      * Convenience getter for the x-coordinate of the `relativePos`.
//      */
//     get relativeX(): number;
//     /**
//      * Convenience setter for the x-coordinate of the `relativePos`.
//      */
//     set relativeX(value: number);
//     /**
//      * Convenience getter for the y-coordinate of the `absolutePos`.
//      */
//     get y(): number;
//     /**
//      * Convenience setter for the y-coordinate of the `absolutePos`.
//      */
//     set y(value: number);
//     /**
//      * Convenience getter for the y-coordinate of the `relativePos`.
//      */
//     get relativeY(): number;
//     /**
//      * Convenience setter for the y-coordinate of the `relativePos`.
//      */
//     set relativeY(value: number);
//     /**
//      * Convenience getter for the width component of the `size` vector.
//      */
//     get width(): number;
//     /**
//      * Convenience setter for the width component of the `size` vector.
//      */
//     set width(value: number);
//     /**
//      * Convenience getter for the height component of the `size` vector.
//      */
//     get height(): number;
//     /**
//      * Convenience setter for the height component of the `size` vector.
//      */
//     set height(value: number);

//     /**
//      * Text content to be rendered.
//      */
//     text?: string;
//     /**
//      * Font family to use for text rendering.
//      */
//     fontFamily?: string;
//     /**
//      * Font size to use for text rendering.
//      */
//     fontSize?: number;

//     /**
//      * Type of custom control, if applicable.  E.g., "Keyboard", "ColorPicker".
//      * Only used when `name` in `RenderableDrawOptions` is
//      * `RenderableShape.CUSTOM_CONTROL`.
//      */
//     controlType?: string;
//     /**
//      * Custom properties specific to the control type.
//      */
//     controlProps?: TControlProps;
// }


// ... (other interfaces/types)
// export interface RenderableDrawOptions {
//     name: RenderableShape;
//     parameters: RenderableParameters;
//     suggestions?: string[];
// }


/**
 * Fundamental behavior for an object that is renderable to a canvas, related to
 * JavaScript's `performance.now()` and `requestAnimationFrame` functions.
 */
export interface Renderable {
    render(timeMs: number): void;
}

/**
 * Fundamental construct capable of processing data and producing results.
 *
 * ## design notes
 *
 * * provides a single point of interaction to enable aspect-oriented behavior
 * * often is an implementation of an observer pattern.
 *
 * ## notes
 *
 * This is a simplified version of the `Witness` interface in the ibgib libs,
 * which we will eventually transition to.
 */
export interface Witness {
    /**
     * identifier. will use this more when we incorporate ibgib more fully.
     */
    gib: string;
    /**
     * Processes an input and returns a result.
     *
     * In the more fully described ibgib lib, this takes in an IbGib_V1 and
     * returns a Promise<IbGib_V1>
     *
     * @param arg The input to be processed.
     * @returns A Promise that resolves to the result of the processing.
     */
    witness(arg: any): Promise<any>;
}


/**
 * @see {@link RequestCommentIbGib_V1}
 */
export interface RequestCommentData_V1 extends CommentData_V1 {
    /**
     * As close to the raw args as we can get.
     */
    args: string[];
    /**
     * interpreted infos for args
     */
    interpretedArgInfos: RCLIArgInfo[];
}

export interface RequestCommentRel8ns_V1 extends IbGibRel8ns_V1 {

}

/**
 * Special Comment that acts as a "request". ("command" analog from RCLI)
 *
 * The raw text of the command is the `text` from `CommentData_V1`.
 *
 * Of course as always the timestamps are taken with a grain of salt.
 *
 * @see {@link RequestCommentData_V1}
 * @see {@link RequestCommentRel8ns_V1}
 */
export interface RequestCommentIbGib_V1 extends IbGib_V1<RequestCommentData_V1, RequestCommentRel8ns_V1> {
    /**
     * kluging this here to get one-off commandlines going for starters
     */
    oneOff: boolean;
}

/**
 * We are porting over swaths of code from the RCLI ibgib package.  This means
 * that we are faking things like pathing, cwd. This info is being conceived as
 * a per-space phenomenon atow (11/2024).
 */
export interface SpaceShimGlobalInfo {
    /**
     * initial `cwd()` when the rcli is started from the commandline.
     *
     * ## notes
     *
     * i am using this as the context path that the user is typing in commands from.
     * when this changes, i.e. when we get some kind of pass-through `cd` command
     * from within the interactive repl, thi
     */
    initialCwd: string;
    /**
     * mimic a global cwd context for the entire blank canvas app.
     */
    cwd: string;
}

export interface IbGibGlobalThis_Common {
    /**
     * only truthy after bootstrap loaded
     */
    metaspace?: MetaspaceService;
    /**
     * if true, then we've already started the bootstrap process.
     *
     * note that there is no "bootstrapComplete" property, rather, you should
     * await {@link bootstrapPromise}.
     */
    bootstrapStarted?: boolean;
    /**
     * if {@link bootstrapStarted}, then this promise should be truthy and set
     * to the promise from the bootstrap function.
     */
    bootstrapPromise?: Promise<void>;
    /**
     * atow (04/2025) there should only be one chronologys component and it
     * should not be destroyed for the duration of the page.
     */
    chronologysComponent?: ChronologysComponentInstance;
}

/**
 * globalThis state specific only to ibgib.
 *
 * ## driving use case
 *
 * I want to be able to store the initial cwd and not have to pass this around.
 */
export interface IbGibGlobalThis_BlankGib extends IbGibGlobalThis_Common {
    /**
     * should be initialized
     */
    version?: string;
    /**
     * @see {@link SpaceShimGlobalInfo}
     */
    spaceShim: { [spaceId: string]: SpaceShimGlobalInfo };
    /**
     * If true, then a boolean verbose flag has been set
     */
    verbose?: boolean;
    /**
     * kluge that always looks in storage/indexeddb for the api key if it
     * exists.  obviously this won't extend for other non-gemini api keys. ah
     * well.
     *
     * @returns API key if found, else empty string
     */
    fnDefaultGetAPIKey: () => Promise<string>;
    /**
     * when we bootstrap the app, this is the first "command" comment ibgib.
     */
    initialCommentIbGib?: IbGib_V1;
    /**
     * live proxy version of {@link initialCommentIbGib}
     */
    initialCommentIbGibProxy?: LiveProxyIbGib;
    /**
     * all web1 components share the same context ibgib. so when the app starts
     * up and if there is a web1 page landed on (i.e. a web1 component), then
     * this will be used as the context ibgib for any agent interactions.
     */
    web1CommentIbGibProxy?: LiveProxyIbGib;
    /**
     * atow (05/2025) there should only be one projects component and it
     * should not be destroyed for the duration of the page.
     */
    projectsComponent?: ProjectsComponentInstance;
    /**
     * atow (07/2025) there should only be one projects explorer component and
     * it should not be destroyed for the duration of the page.
     */
    projectsExplorerComponent?: ProjectsExplorerComponentInstance;
}

export interface GeminiAIModelCtorOptions {
    apiKey?: string;
    system?: string;
}
