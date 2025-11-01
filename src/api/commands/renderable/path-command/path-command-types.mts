import { ColorRGBA } from "../../../../render/render-types.mjs";

// #region PathCommandType enum
/**
 * discriminator property for which concrete type a command part is.
 */
export type PathCommandType =
    | 'beginPath' | 'line' | 'arc' | 'bezierCurve' | 'quadraticBezierCurve'
    | 'moveTo' | 'closePath' | 'stroke' | 'fill';
export const PathCommandType = {
    beginPath: 'beginPath' satisfies PathCommandType,
    line: 'line' satisfies PathCommandType,
    arc: 'arc' satisfies PathCommandType,
    bezierCurve: 'bezierCurve' satisfies PathCommandType,
    quadraticBezierCurve: 'quadraticBezierCurve' satisfies PathCommandType,
    moveTo: 'moveTo' satisfies PathCommandType,
    closePath: 'closePath' satisfies PathCommandType,
    stroke: 'stroke' satisfies PathCommandType,
    fill: 'fill' satisfies PathCommandType,
} satisfies { [key: string]: PathCommandType };
export const PATH_COMMAND_TYPE_VALUES = Object.values(PathCommandType);
// #endregion PathCommandType enum

/**
 * @interface PathCommand - "Super object" interface for all path commands as
 * opposed to a parent class/interface that is descended from. The
 *
 * ## notes on design decision
 *
 * These concrete classes are defined as optional in this "super command" class
 * instead of inheriting with a `type` discriminator because discriminated union
 * types do not do well in gemini function calling API schemas. The OpenAPI
 * schemas supported are only a subset of the full OpenAPI spec.
 *
 * It is possible that a model will fill in more than one of these concrete
 * members even though the instructions say to only do one at a time, but in my
 * initial testing this is not the case.
 */
export interface PathCommand {
    type: PathCommandType;
    beginPath?: BeginPathPathCommand;
    line?: LinePathCommand;
    arc?: ArcPathCommand;
    bezierCurve?: BezierCurvePathCommand;
    quadraticBezierCurve?: QuadraticBezierCurvePathCommand;
    moveTo?: MoveToPathCommand;
    closePath?: ClosePathPathCommand;
    stroke?: StrokePathCommand;
    fill?: FillPathCommand;
}

/**
 * @interface ConcretePathCommandInfo - Represents a concrete path command which
 * will populate the {@link PathCommand} "super command".
 *
 * It is slightly annoying to fudge with the architecture here, but the LLM just
 * has deficits regarding the OpenAPI schema subset currently implemented.
 */
export interface ConcretePathCommandInfo {
    type: PathCommandType;
}

/**
 * @interface BeginPathPathCommand - Represents a beginPath command.
 * @extends ConcretePathCommandInfo
 */
export interface BeginPathPathCommand extends ConcretePathCommandInfo {
    type: 'beginPath';
    /**
     * boolean property to match schema for gemini model
     */
    beginPath: true;
}

/**
 * @interface LinePathCommand - Represents a line segment command.
 * @extends ConcretePathCommandInfo
 */
export interface LinePathCommand extends ConcretePathCommandInfo {
    type: 'line';
    x1?: number;
    y1?: number;
    x2: number;
    y2: number;
}

/**
 * @interface ArcPathCommand - Represents an arc segment command.
 * @extends ConcretePathCommandInfo
 */
export interface ArcPathCommand extends ConcretePathCommandInfo {
    type: 'arc';
    x: number;         // x-coordinate of the arc's center
    y: number;         // y-coordinate of the arc's center
    radius: number;    // arc's radius
    startAngle: number; // starting angle in radians
    endAngle: number;   // ending angle in radians
    anticlockwise?: boolean; // optional: direction of arc (default: clockwise)
}

/**
 * @interface BezierCurvePathCommand - Represents a bezier curve segment command (cubic bezier curve).
 * @extends ConcretePathCommandInfo
 */
export interface BezierCurvePathCommand extends ConcretePathCommandInfo {
    type: 'bezierCurve';
    cp1x: number;
    cp1y: number;
    cp2x: number;
    cp2y: number;
    x1?: number;
    y1?: number;
    x2: number;
    y2: number;
}

/**
 * @interface QuadraticBezierCurvePathCommand - Represents a quadratic bezier curve segment path command.
 * @extends ConcretePathCommandInfo
 */
export interface QuadraticBezierCurvePathCommand extends ConcretePathCommandInfo {
    type: 'quadraticBezierCurve';
    cpx: number;
    cpy: number;
    x1?: number;
    y1?: number;
    x2: number;
    y2: number;
}

/**
 * @interface MoveToPathCommand - Represents a moveTo command.
 * @extends ConcretePathCommandInfo
 */
export interface MoveToPathCommand extends ConcretePathCommandInfo {
    type: 'moveTo';
    x: number;
    y: number;
}

/**
 * @interface ClosePathPathCommand - Represents a closePath command.
 * @extends ConcretePathCommandInfo
 */
export interface ClosePathPathCommand extends ConcretePathCommandInfo {
    type: 'closePath';
    /**
     * boolean property to match schema for gemini model
     */
    closePath: true;
}

/**
 * @interface StrokePathCommand - Represents a stroke command. If provided, the
 * color/width style will be set before the stroke() call, and returned to the
 * default for the renderable.
 * @extends ConcretePathCommandInfo
 */
export interface StrokePathCommand extends ConcretePathCommandInfo {
    type: 'stroke';
    color?: ColorRGBA;
    width?: number;
    // stroke: true; // boolean property for stroke (to match schema)
}

/**
 * @interface FillPathCommand - Represents a fill command.
 * @extends ConcretePathCommandInfo
 */
export interface FillPathCommand extends ConcretePathCommandInfo {
    type: 'fill';
    fill: true;   // boolean property for fill (to match schema)
}
