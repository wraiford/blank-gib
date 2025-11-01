import { clone, extractErrorMsg, getIdPool, pretty, } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../constants.mjs';
import {
    CanvasHandle, GeometryParametersGroup, GeometryParametersPath, GeometryParametersRect,
    GeometryParametersText, HandleBase, RenderableCreateOpts,
    RenderableCreateResult, RenderableDestroyOpts, RenderableDestroyResult,
    RenderableGetAllStatesResult,
    RenderableGetOpts, RenderableGetResult, RenderableHandle, RenderableState, RenderableStateMap,
    RenderableUpdateOpts, RenderableUpdateResult, RenderService,
    Vector3
} from './render-types.mjs';
import {
    CANVAS_HANDLE_TYPE, RENDERABLE_HANDLE_TYPE, RenderableShape,
} from './render-constants.mjs';
import { PathCommand, } from '../api/commands/renderable/path-command/path-command-types.mjs';

const logalot = GLOBAL_LOG_A_LOT;

/**
 * @interface RenderServiceCtorOpts - Options for the RenderService constructor.
 */
interface RenderServiceCtorOpts {
    /**
     * @property renderSvcId - optional id of the render service. if falsy, will
     * generate a new one.
     */
    renderSvcId?: string;
    /**
     * @property parentContainerEl - An optional container where new canvas
     * should be dynamically added when not explicitly provided.
     */
    parentContainerEl?: HTMLElement;
    /**
     * @property canvasEl - An optional existing HTMLCanvasElement to use. If
     * not provided, a new one will be created.
     */
    canvasEl?: HTMLCanvasElement;
}

/**
 * @class RenderService_V1 - Implementation of the rendering service.
 * Implements the {@link RenderService} interface.
 */
export class RenderService_V1 implements RenderService {
    protected lc = `[${RenderService_V1.name}]`;
    /**
     * @property initialized - A promise that resolves when the rendering service is fully initialized.
     */
    public readonly initialized: Promise<void>;

    /**
     * @private
     * @property uuidPool - A pool of pre-generated UUIDs for handles.
     */
    private uuidPool: string[] = [];

    /**
     * @private
     * @property canvas - The HTMLCanvasElement used for rendering.
     */
    private canvas: HTMLCanvasElement;

    /**
     * @private
     * @property context - The 2D rendering context of the canvas.
     */
    private context: CanvasRenderingContext2D | null;

    /**
     * @private
     * @property renderables - A map of renderable handles to their current state.
     */
    private renderables: Map<RenderableHandle, RenderableState> = new Map();

    /**
     * @private
     * @property handleToUUID - A map to quickly lookup the UUID string given a handle.
     */
    private handleToUUID: Map<HandleBase, string> = new Map();

    /**
     * @private
     * @property uuidToHandle - A map for reverse lookup from UUID to handle.
     */
    private uuidToHandle: Map<string, HandleBase> = new Map();

    /**
       * @private
       * @property canvasHandle - The handle for the managed canvas element.
       */
    private canvasHandle: CanvasHandle;

    /**
     * @private
     * @property dirty - A flag indicating whether the canvas needs to be re-rendered.
     */
    private dirty: boolean = false;

    /**
     * used with correlating render service to canvas instance.
     */
    public renderSvcId: string;

    /**
     * Constructs a new RenderService instance.
     * @param {RenderServiceCtorOpts} [opts] - Options for initializing the rendering service.
     */
    constructor(opts?: RenderServiceCtorOpts) {
        const { renderSvcId, canvasEl, parentContainerEl, } = opts ?? {};
        this.renderSvcId = renderSvcId ?? this.getUUID();

        if (canvasEl) {
            this.canvas = canvasEl;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;

            if (parentContainerEl) {
                parentContainerEl.appendChild(this.canvas);
            } else {
                document.body.appendChild(this.canvas);
            }
        }

        this.context = this.canvas.getContext('2d');
        this.canvasHandle = this.createNewCanvasHandle(); // Create the canvas handle here
        this.initialized = this.initialize(); // spins off
        this.startRenderLoop();
    }

    /**
     * Marks the canvas as dirty, triggering a re-render on the next animation frame.
     */
    private markDirty(): void {
        this.dirty = true;
    }

    /**
     * Starts the rendering loop using requestAnimationFrame.
     * @private
     */
    private startRenderLoop(): void {
        const renderFrame = () => {
            if (this.dirty) {
                this.render();
                this.dirty = false;
            }
            requestAnimationFrame(renderFrame);
        };
        requestAnimationFrame(renderFrame);
    }

    /**
     * Returns the handle associated with the managed canvas.
     * @returns {CanvasHandle} The handle for the canvas.
     */
    public getCanvasHandle(): CanvasHandle {
        return this.canvasHandle;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Initializes the rendering service, including pre-generating UUIDs.
     * @private
     * @returns {Promise<void>} A promise that resolves when the service is initialized.
     */
    private async initialize(): Promise<void> {
        await this.generateUUIDs(1000);

        // Any other async initialization can go here.
    }

    /**
     * Generates a batch of UUIDs and adds them to the pool.
     * @private
     * @param {number} count - The number of UUIDs to generate.
     */
    private async generateUUIDs(count: number): Promise<void> {
        const ids = await getIdPool({ n: count });
        this.uuidPool.push(...ids);
    }

    /**
     * Gets a UUID from the pool. If the pool is empty, generates more.
     * @private
     * @returns {string} A UUID.
     */
    private getUUID(): string {
        const lc = `[${this.getUUID.name}]`;
        if (!this.uuidPool) {
            console.warn(`${lc} (UNEXPECTED) this.uuidPool not initialized even with an empty array? Are we calling getUUID in a property initializer before this prop? We will go ahead and initialize with empty array, but this should be fixed in code. (W: 089ebedc858276b89ee3f1e4ad0ede25)`);
            this.uuidPool = [];
        }

        // arbitrary low threshold. turn this into a constant later
        if (this.uuidPool.length < 50) {
            this.generateUUIDs(1000); // spins off to generate more
        }
        if (this.uuidPool.length === 0) {
            // return an emergency sync uuid using crypto.randomUUID, stripping away the dashes
            return crypto.randomUUID().replace(/-/g, '');
        } else {
            return this.uuidPool.pop()!;
        }
    }

    /**
     * Creates a new renderable handle.
     * @private
     * @returns {RenderableHandle} The newly created renderable handle.
     */
    private createNewRenderableHandle(): RenderableHandle {
        const uuid = this.getUUID();
        const handle: RenderableHandle = { type: RENDERABLE_HANDLE_TYPE, uuid };
        this.handleToUUID.set(handle, uuid);
        this.uuidToHandle.set(uuid, handle);
        return handle;
    }

    /**
     * Creates a new canvas handle.
     * @private
     * @returns {CanvasHandle} The newly created canvas handle.
     */
    private createNewCanvasHandle(): CanvasHandle {
        const uuid = this.getUUID();
        const handle: CanvasHandle = { type: CANVAS_HANDLE_TYPE, uuid };
        this.handleToUUID.set(handle, uuid);
        this.uuidToHandle.set(uuid, handle);
        return handle;
    }

    /**
     * @inheritdoc
     */
    public async renderableCreate(opts: RenderableCreateOpts): Promise<RenderableCreateResult> {
        const lc = `${this.lc}[${this.renderableCreate.name}]`;
        if (opts.renderSvcId !== this.renderSvcId) { throw new Error(`${lc} wrong render svc. opts.renderSvcId (${opts.renderSvcId}) !== this.renderSvcId (${this.renderSvcId}) (E: 59ec231939f4ddafde37d536f440a225)`); }
        const handle = this.createNewRenderableHandle();
        if (opts.initialState.geometry?.parameters) {
            const { type, parameters } = opts.initialState.geometry;
            switch (type) {
                case RenderableShape.RECTANGLE:
                    const paramsRect = parameters as GeometryParametersRect;
                    // if the model only provides height or width, make the other one the same
                    paramsRect.height ??= paramsRect.width;
                    paramsRect.width ??= paramsRect.height;
                    break;
                case RenderableShape.TEXT:
                    const paramsText = parameters as GeometryParametersText;
                    if (!paramsText.fontSize) {
                        // the model passes in just width sometimes instead of font size.
                        paramsText.fontSize = (parameters as any).width ?? (parameters as any).height ?? 1;
                    }
                    break;
                case RenderableShape.GROUP:
                    // do we do anything additional for groups?
                    // const paramsGroup = parameters as GeometryParametersGroup;
                    break;
                case RenderableShape.PATH:
                    // do we do anything additional for groups?
                    const paramsPath = parameters as GeometryParametersPath;
                    break;
                default:
                    throw new Error(`(UNEXPECTED) opts.initialState.geometry.type: ${type}? (E: 941a165e137a7cb548d2665bb0399625)`);
            }
        }
        this.renderables.set(handle, opts.initialState);
        this.markDirty();
        return { handle, renderSvcId: this.renderSvcId, };
    }

    /**
     * @inheritdoc
     */
    public async renderableUpdate(opts: RenderableUpdateOpts): Promise<RenderableUpdateResult> {
        const lc = `${this.lc}[${this.renderableUpdate.name}]`;
        if (opts.renderSvcId !== this.renderSvcId) { throw new Error(`${lc} wrong render svc. opts.renderSvcId (${opts.renderSvcId}) !== this.renderSvcId (${this.renderSvcId}) (E: 59ec231939f4ddafde37d536f440a225)`); }

        for (const targetInfo of opts.targets) {
            const rawHandle = targetInfo.handle;
            const handle = this.getRenderableHandle({ rawHandle });
            if (!handle) { throw new Error(`handle not found. uuid: ${rawHandle.uuid} (E: 9cd5187a2addf64748ca6e1907291825)`); }
            const resGetRenderableState = await this.getRenderableState({ renderSvcId: opts.renderSvcId, handles: [handle] });
            const currentStateMap = resGetRenderableState.stateMap;
            const stateMapEntry = currentStateMap[handle.uuid];
            if (!stateMapEntry) { throw new Error(`stateMapEntry not found for handle.uuid: ${handle.uuid} (E: ec05ef7a7b064813b1782db7d71a7c25)`); }
            const currentState = stateMapEntry.state;
            if (!currentState) { throw new Error(`currentState not found for handle.uuid: ${handle.uuid} (E: ad8ef415e7d194dcfdbcffc8b013b825)`); }
            if (currentState) {
                if (currentState.geometry.type === RenderableShape.GROUP) {
                    // update a renderable group. there are two possibilities:

                    // 1. group.members is changing
                    // 2. group members' states are changing

                    const currentGeometryGroupParameters = currentState.geometry.parameters as GeometryParametersGroup;
                    if (targetInfo.updatedState.geometry) {
                        // geometry being truthy indicates that we are changing
                        // the group's members

                        // 1. group.members is changing
                        if (opts.recursive) { throw new Error(`opts.recursive is true but targetInfo.updatedState.geometry is truthy. This indicates that the updatedState is changing a group's members (else geometry would be undefined). This does not make sense. You can use recursive IF AND ONLY IF you are changing a common renderable property like color or scale. (E: eb8298c3133f2662e39f1d5877ec2825)`); }
                        const updatedStateKeys = Object.keys(targetInfo.updatedState);
                        if (updatedStateKeys.length > 1) {
                            // geometry is truthy, so the others are incorrect
                            throw new Error(`cannot update both group geometry and group members' other state properties in the same update call. UpdatedStateKeys: ${updatedStateKeys} (E: 08c2c87f4528d7563890d16208cbd825)`);
                        }
                        const updatedMembers =
                            (targetInfo.updatedState.geometry.parameters as GeometryParametersGroup).members;
                        currentGeometryGroupParameters.members = updatedMembers;
                    } else {
                        // 2. group members' states are changing
                        // so we update the group's members recursively

                        // NOTE: this MAY be a bug WRT recursive groups? will have to see
                        await this.renderableUpdate({
                            renderSvcId: opts.renderSvcId,
                            targets: currentGeometryGroupParameters.members.map(memberHandle => {
                                return {
                                    handle: memberHandle,
                                    updatedState: targetInfo.updatedState,
                                }
                            }),
                            recursive: opts.recursive,
                        });
                    }
                } else {
                    // not a group
                    if (targetInfo.updatedState?.color) {
                        // there is some issue with color that the LLMs refuse to output the full rgba value.
                        targetInfo.updatedState.color = { ...currentState.color, ...targetInfo.updatedState.color };
                    }
                    this.renderables.set(handle, { ...currentState, ...targetInfo.updatedState });
                    this.markDirty();
                }
            } else {
                console.warn(`${lc} Attempting to update non-existent renderable with handle: ${handle.uuid} (W: 8071c40f941a39d39e104f4fe2279d24)`);
            }
        }

        return { renderSvcId: this.renderSvcId, };
    }

    /**
     * @inheritdoc
     */
    public async renderableDestroy(opts: RenderableDestroyOpts): Promise<RenderableDestroyResult> {
        const lc = `${this.lc}[${this.renderableDestroy.name}]`;
        if (opts.renderSvcId !== this.renderSvcId) { throw new Error(`${lc} wrong render svc. opts.renderSvcId (${opts.renderSvcId}) !== this.renderSvcId (${this.renderSvcId}) (E: 59ec231939f4ddafde37d536f440a225)`); }
        const { recursive } = opts;
        for (const rawHandle of opts.handles) {
            const handle = this.getRenderableHandle({ rawHandle });
            if (handle) {
                if (recursive) {
                    // first check the state. if it's a group, we need to
                    // recursively call destroy.
                    const stateMap =
                        await this.getRenderableState({
                            renderSvcId: opts.renderSvcId,
                            handles: [handle]
                        });
                    const stateInfo = stateMap[handle.uuid];
                    if (stateInfo) {
                        if (stateInfo.state.geometry.type === RenderableShape.GROUP) {
                            const paramsGroup =
                                stateInfo.state.geometry.parameters as GeometryParametersGroup;
                            await this.renderableDestroy({
                                renderSvcId: opts.renderSvcId,
                                handles: paramsGroup.members,
                            });
                        }
                    } else {
                        console.warn(`${lc} destroying renderable but couldn't get the state? (W: 9986ddab9c425f361df75703ef710725)`);
                    }
                }
                this.renderables.delete(handle);
                this.handleToUUID.delete(handle);
                this.uuidToHandle.delete(handle.uuid);
                this.markDirty();
            } else {
                console.warn(`${lc} handle does not exist (W: 6e7a646b7e88e13a9ed76ab8d54ce825)`)
            }
        }

        return { renderSvcId: this.renderSvcId, };
    }

    /**
     * helper to get the renderable handle by uuid, even if it isn't the actual
     * object reference.
     *
     * ## driving use case
     * The agent will call functions via the uuid not handle instances
     *
     * @returns renderable handle with matching uuid
     * @throws if rawHandle is not a renderable handle (type is not 'Renderable')
     */
    private getRenderableHandle({ rawHandle }: { rawHandle: HandleBase }): RenderableHandle | undefined {
        if (rawHandle.type !== RENDERABLE_HANDLE_TYPE) {
            throw new Error(`(UNEXPECTED) rawHandle is not a renderable handle. rawHandle: ${pretty(rawHandle)} (E: 1c10ed31b288d39314e7175d085c4225)`);
        }
        const handle = this.uuidToHandle.get(rawHandle.uuid) as RenderableHandle | undefined;
        return handle;
    }

    /**
     * @inheritdoc
     *
     * tries via the raw handle, then via the uuid
     */
    public async getRenderableState(opts: RenderableGetOpts): Promise<RenderableGetResult> {
        const lc = `${this.lc}[${this.getRenderableState.name}]`;
        if (opts.renderSvcId !== this.renderSvcId) { throw new Error(`${lc} wrong render svc. opts.renderSvcId (${opts.renderSvcId}) !== this.renderSvcId (${this.renderSvcId}) (E: 59ec231939f4ddafde37d536f440a225)`); }
        const resMap: RenderableStateMap = {};
        for (let { uuid } of opts.handles) {
            if (!uuid) { throw new Error(`(UNEXPECTED) uuid falsy? opts.handles should only contain actual truthy uuids at the very least (even if the renderable doesn't exist) (E: bfc41840b854aad226e3f70e53eb4e25)`); }
            const handle =
                this.getRenderableHandle({ rawHandle: { type: 'Renderable', uuid } });
            if (handle) {
                const state: RenderableState | undefined = this.renderables.get(handle);
                if (state) {
                    resMap[uuid] = { handle, state };
                } else {
                    throw new Error(`(UNEXPECTED) handle is truthy for uuid (${uuid}) but state is falsy? (E: 47e278636df8c208581bb47835356e25)`);
                }
            } else {
                console.warn(`${lc} uuid not found: ${uuid} (W: ac320db2a5086d864c371092c2ce7825)`);
                resMap[uuid] = undefined;
            }
        }
        return { renderSvcId: opts.renderSvcId, stateMap: resMap };
    }

    /**
     *  Returns the internal map.
     *
     * @returns  ReadonlyMap<RenderableHandle, RenderableState> The renderables map, but immutable.
     */
    public getRenderableStates(): RenderableGetAllStatesResult {
        return {
            renderSvcId: this.renderSvcId,
            handleToStatesMap: this.renderables,
        }
    }

    // #region render and render sub-methods

    /**
     * @inheritdoc
     */
    public render(): void {
        const lc = `${this.lc}[${this.render.name}]`;
        if (!this.context) {
            console.error(`${lc} Canvas context not initialized. (E: 7d5755ca9a4148e1141298c59ce94b24)`);
            return;
        }

        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const [handle, state] of this.renderables) {
            if (state.isVisible) {
                switch (state.geometry.type) {
                    case RenderableShape.RECTANGLE: { this.render_rect({ handle, state }); break; }
                    case RenderableShape.TEXT: { this.render_text({ handle, state }); break; }
                    case RenderableShape.PATH: { this.render_path({ handle, state }); break; }
                    default: console.error(`${lc}[${handle.uuid}] (UNEXPECTED) unknown state.geometry.type: ${state.geometry.type}? (E: a60c479e9e389ae4f7f78782643a4925)`);
                }
            } else {
                if (logalot) { console.log(`${lc}[${handle.uuid}] state.isVisible is false, skipping rendering. (I: a0e437dd9938c2a1677f47ddb2f97525)`); }
            }
        }
    }
    private render_rect({ handle, state }: { handle: RenderableHandle, state: RenderableState }): void {
        const lc = `${this.lc}[${this.render_text.name}][${handle.uuid}]`;
        if (!this.context) {
            console.error(`${lc} Canvas context not initialized. (E: cd8ac97c4656ebf78c101c8fa3f58125)`);
            return;
        }
        const { geometry, position, scale, color } = state;
        this.context.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
        const { width, height } = geometry.parameters as GeometryParametersRect;
        this.context.fillRect(
            position.x,
            position.y,
            width * scale.x,
            height * scale.y
        );
    }
    private render_text({ handle, state }: { handle: RenderableHandle, state: RenderableState }): void {
        const lc = `${this.lc}[${this.render_text.name}][${handle.uuid}]`;
        if (!this.context) {
            console.error(`${lc} Canvas context not initialized. (E: 9aa66a49052c48d743f3aaa1799cbf25)`);
            return;
        }
        const { geometry, position, scale, color } = state;
        this.context.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
        const { text, fontFamily, fontSize } = geometry.parameters as GeometryParametersText;
        this.context.font = `${fontSize}px ${fontFamily}`;
        this.context.fillText(text, position.x, position.y);
    }
    private render_path({ handle, state }: { handle: RenderableHandle, state: RenderableState }): void {
        const lc = `${this.lc}[${this.render_text.name}][${handle.uuid}]`;
        // usually in these render calls I am trying not to wrap in try..catch
        // but this is a more complicated renderable
        try {
            if (!this.context) { throw new Error(`(UNEXPECTED) !this.context? not initialized? (E: a26bcd9b76237b3deefa2b8dc3f3f325)`); }
            const ctx = this.context;

            const { geometry, position, scale, color } = state;
            ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
            ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`; // Set strokeStyle to same color for now - can be separate property later
            ctx.lineWidth = 2; // Example line width - can be a property later

            const { commands } = geometry.parameters as GeometryParametersPath;
            if (!commands || commands.length === 0) {
                console.warn(`${lc} no commands in geometry.parameters.commands (W: de39da7bac141055c7e02c7326a89d25)`);
                return; /* <<<< returns early, nothing to render */
            }

            const fnCheapValidateCmd: (command: PathCommand) => void = (command) => {
                const actualCmd = command[command.type!];
                if (!actualCmd) { throw new Error(`invalid path command. command.type === ${command.type} but command[${command.type}] is falsy (E: 9842c2e8fd3e257f53ba61d9de8eb725)`); }
                // if (actualCmd.type !== command.type) { throw new Error(`actualCmd.type (${actualCmd.type}) !== command.type (${command.type}). command: ${pretty(command)} (E: e7065c95f8330b1a7a7196a383e89925)`); }
            }

            /**
             * keep track of moveTo, lineTo, etc.
             *
             * this is NOT scale-adjusted yet...
             */
            // let runningStartPos = clone(position) as Vector3;

            for (const command of commands) {
                if (!command.type) {
                    debugger; // improper command generated by agent. command.type is falsy. want to see in what context here.
                    console.warn(`${lc} command.type falsy, skipping command (W: a27ba1df32047dd541a672b85b0e6e25)`);
                    // todo: manually figure out the type here via state.geometry.parameters
                    continue; /* <<<< continue to next command */
                }

                // at this point, we have asserted that our commands are properly formed.

                switch (command.type) {
                    case 'moveTo': {
                        // todo: flesh out better runtime path command validation
                        fnCheapValidateCmd(command);
                        const cmd = (command as PathCommand).moveTo!;
                        // runningStartPos = {
                        //     x: position.x + cmd.x,
                        //     y: position.y + cmd.y,
                        //     z: 0, // position.z + cmd.z * scale.z,
                        // }
                        ctx.moveTo(position.x + cmd.x * scale.x, position.y + cmd.y * scale.y); // Apply position and scale
                        // ctx.moveTo(runningStartPos.x * scale.x, runningStartPos.y * scale.y); // Apply position and scale
                        break;
                    }
                    case 'line': {
                        // todo: flesh out better runtime path command validation
                        fnCheapValidateCmd(command);
                        const cmd = (command as PathCommand).line!;
                        if (cmd.x1 !== undefined || cmd.y1 !== undefined) {
                            // origin point given, so create a moveTo to that point
                            ctx.moveTo(position.x + (cmd.x1 ?? 0) * scale.x, position.y + (cmd.y1 ?? 0) * scale.y); // Apply position and scale
                        }
                        ctx.lineTo(position.x + cmd.x2 * scale.x, position.y + cmd.y2 * scale.y); // Apply position and scale to end point
                        break;
                    }
                    case 'arc': {
                        // todo: flesh out better runtime path command validation
                        fnCheapValidateCmd(command);
                        const cmd = (command as PathCommand).arc!;
                        ctx.arc(
                            position.x + cmd.x * scale.x,  // Apply position and scale to center
                            position.y + cmd.y * scale.y,  // Apply position and scale to center
                            cmd.radius * scale.x,            // Apply scale to radius (assume uniform scale for now)
                            cmd.startAngle,
                            cmd.endAngle,
                            cmd.anticlockwise
                        );
                        break;
                    }
                    case 'bezierCurve': {
                        // todo: flesh out better runtime path command validation
                        fnCheapValidateCmd(command);
                        const cmd = (command as PathCommand).bezierCurve!;
                        if (cmd.x1 !== undefined || cmd.y1 !== undefined) {
                            // origin point given, so create a moveTo to that point
                            ctx.moveTo(position.x + (cmd.x1 ?? 0) * scale.x, position.y + (cmd.y1 ?? 0) * scale.y); // Apply position and scale
                        }
                        ctx.bezierCurveTo(
                            position.x + cmd.cp1x * scale.x, // Apply position and scale to control point 1
                            position.y + cmd.cp1y * scale.y, // Apply position and scale to control point 1
                            position.x + cmd.cp2x * scale.x, // Apply position and scale to control point 2
                            position.y + cmd.cp2y * scale.y, // Apply position and scale to control point 2
                            position.x + cmd.x2 * scale.x,    // Apply position and scale to end point
                            position.y + cmd.y2 * scale.y     // Apply position and scale to end point
                        );
                        break;
                    }
                    case 'quadraticBezierCurve': {
                        // todo: flesh out better runtime path command validation
                        fnCheapValidateCmd(command);
                        const cmd = (command as PathCommand).quadraticBezierCurve!;
                        if (cmd.x1 !== undefined || cmd.y1 !== undefined) {
                            // origin point given, so create a moveTo to that point
                            ctx.moveTo(position.x + (cmd.x1 ?? 0) * scale.x, position.y + (cmd.y1 ?? 0) * scale.y); // Apply position and scale
                        }
                        ctx.quadraticCurveTo(
                            position.x + cmd.cpx * scale.x, // Apply position and scale to control point
                            position.y + cmd.cpy * scale.y, // Apply position and scale to control point
                            position.x + cmd.x2 * scale.x,    // Apply position and scale to end point
                            position.y + cmd.y2 * scale.y     // Apply position and scale to end point
                        );
                        break;
                    }

                    // #region boolean commands

                    // NOTE: These do NOT follow the PathCommand interface. So
                    // we are not validating them.  Seemed like a lot of waste,
                    // and it's kind of lame and a code smell. But this entire
                    // interface structure smells because of the lack of OpenAPI
                    // schema support in the Gemini function calling API.

                    case 'closePath': { ctx.closePath(); break; }
                    case 'beginPath': {
                        ctx.beginPath();
                        break;
                    }
                    case 'stroke': {
                            // ctx.stroke();
                        const cmd = (command as PathCommand).stroke;
                        if (cmd) {
                            const initialWidth = ctx.lineWidth;
                            // do overrides
                            if (cmd.color) {
                                ctx.strokeStyle = `rgba(${cmd.color.r * 255}, ${cmd.color.g * 255}, ${cmd.color.b * 255}, ${cmd.color.a})`;
                            }
                            if (cmd.width !== undefined) { ctx.lineWidth = cmd.width; }

                            // execute
                            ctx.stroke();

                            // return it back from overrides
                            if (cmd.color) {
                                ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
                            }
                            if (cmd.width !== undefined) { ctx.lineWidth = initialWidth; }
                        } else {
                            // no cmd so no override options. just call stroke()
                            ctx.stroke();
                        }
                        break;
                    }
                    case 'fill': { ctx.fill(); break; }

                    // #endregion boolean commands

                    default:
                        console.error(`${lc} Unknown path command type: ${command.type} (E: 74fba72be5451c6509fe305afd4e1125)`);
                }
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            // throw error; // does not rethrow
        }
    }

    // #endregion render and render sub-methods

    /**
     * @inheritdoc
     */
    public getContext(): CanvasRenderingContext2D | null {
        return this.context;
    }
}

// render-service-factory

/**
 * @private
 * @type {RenderService_V1 | undefined} - A singleton instance of the RenderService.
 */
let globalRenderService: { [svcId: string]: RenderService_V1 } = {};

/**
 * Options for getting the Render Service.
 */
interface GetRenderServiceOpts extends RenderServiceCtorOpts {
    /**
     * Id of the render service to get.
     */
    renderSvcId: string;
    /**
     * If true, forces the creation of a new RenderService instance.
     */
    forceNew?: boolean;
}

/**
 * Gets the singleton instance of the RenderService.
 * @param {GetRenderServiceOpts} [opts] - Options for getting the service.
 * @returns {RenderService_V1} The RenderService instance.
 */
export function getRenderService(opts: GetRenderServiceOpts): RenderService_V1 {
    const { renderSvcId, forceNew } = opts;
    if (forceNew) {
        globalRenderService[renderSvcId] = new RenderService_V1(opts);
    }

    let renderSvc: RenderService_V1;
    if (globalRenderService[renderSvcId]) {
        renderSvc = globalRenderService[renderSvcId];
    } else {
        renderSvc = new RenderService_V1(opts);
        globalRenderService[renderSvcId] = renderSvc;
    }
    if (renderSvc.renderSvcId !== opts.renderSvcId) {
        debugger; // error get render svc
        throw new Error(`(UNEXPECTED) renderSvc.renderSvcId (${renderSvc.renderSvcId}) !== opts.renderSvcId (${opts.renderSvcId})? This means there is something incorrect in logic in the code. (E: fbdde2ae97f973ba3bcf34edc39e9425)`);
    }

    return renderSvc;
}

// #region test functions

function testGetCanvas(): HTMLCanvasElement {
    // Get the body element
    const body = document.querySelector('body')!;

    // Create the canvas element if it doesn't exist
    let canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
        canvas = document.createElement('canvas');
        body.appendChild(canvas);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    return canvas;
}

export async function testRendering() {
    const lc = `[${testRendering.name}]`;
    // const canvasEl = testGetCanvas();
    // const canvasEl = undefined;
    // const renderService = getRenderService({ canvasEl, forceNew: true }); // Use the factory
    // await renderService.initialized;
    const renderService = new RenderService_V1({ canvasEl: undefined }); // Use the factory
    const { renderSvcId } = renderService;

    const canvasHandle = renderService.getCanvasHandle();
    console.log(`${lc} Canvas Handle: ${pretty(canvasHandle)} (I: 4ddb17bbbb1f783c16290f91269ed724)`);

    const rectState: RenderableState = {
        isVisible: true,
        color: { r: 1, g: 0, b: 0, a: 1 }, // Red
        position: { x: 50, y: 50, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'rect',
            parameters: {
                width: 100,
                height: 50,
            } satisfies GeometryParametersRect,
        },
    };

    const textState: RenderableState = {
        isVisible: true,
        color: { r: 0, g: 0, b: 1, a: 1 }, // Blue
        position: { x: 75, y: 150, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'text',
            parameters: {
                text: 'Hello World',
                fontFamily: 'Arial',
                fontSize: 24,
            } satisfies GeometryParametersText,
        },
    };

    const rectHandle = await renderService.renderableCreate({ renderSvcId, initialState: rectState });
    const textHandle = await renderService.renderableCreate({ renderSvcId, initialState: textState });

    renderService.render();
}

export async function testReRendering() {
    const canvasEl = testGetCanvas();
    // const renderService = getRenderService({ canvasEl, forceNew: true }); // Use the factory
    const renderService = new RenderService_V1({ canvasEl, });
    const { renderSvcId } = renderService;
    await renderService.initialized;

    const rectState: RenderableState = {
        isVisible: true,
        color: { r: 1, g: 0, b: 0, a: 1 }, // Red
        position: { x: 50, y: 50, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'rect',
            parameters: {
                width: 100,
                height: 50,
            } satisfies GeometryParametersRect,
        },
    };

    const textState: RenderableState = {
        isVisible: true,
        color: { r: 0, g: 0, b: 1, a: 1 }, // Blue
        position: { x: 75, y: 150, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'text',
            parameters: {
                text: '(Re)Hello World',
                fontFamily: 'Arial',
                fontSize: 24,
            } satisfies GeometryParametersText,
        },
    };

    const rectHandle = (await renderService.renderableCreate({ renderSvcId, initialState: rectState })).handle as RenderableHandle; // Explicit cast
    const textHandle = (await renderService.renderableCreate({ renderSvcId, initialState: textState })).handle as RenderableHandle; // Explicit cast

    renderService.render();

    // Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update the rectangle's state
    const updatedRectState: Partial<RenderableState> = {
        position: { x: 150, y: 75, z: 0 },
        color: { r: 0, g: 1, b: 0, a: 1 }, // Green
    };

    await renderService.renderableUpdate({
        renderSvcId,
        targets: [{ handle: rectHandle, updatedState: updatedRectState }],
    });

    // Re-render
    renderService.render();
}

export async function testRenderableDestroy() {
    const canvasEl = testGetCanvas();
    // const renderService = getRenderService({ canvasEl, forceNew: true }); // Use the factory
    const renderService = new RenderService_V1({ canvasEl, }); // Use the factory
    const { renderSvcId } = renderService;
    await renderService.initialized;

    const rectState1: RenderableState = {
        isVisible: true,
        color: { r: 1, g: 0, b: 0, a: 1 }, // Red
        position: { x: 50, y: 50, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'rect',
            parameters: {
                width: 50,
                height: 50,
            } satisfies GeometryParametersRect,
        },
    };

    const rectState2: RenderableState = {
        isVisible: true,
        color: { r: 0, g: 1, b: 0, a: 1 }, // Green
        position: { x: 150, y: 50, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'rect',
            parameters: {
                width: 50,
                height: 50,
            } satisfies GeometryParametersRect,
        },
    };

    const textState: RenderableState = {
        isVisible: true,
        color: { r: 0, g: 0, b: 1, a: 1 }, // Blue
        position: { x: 100, y: 150, z: 0 },
        scale: { x: 1, y: 1 },
        geometry: {
            type: 'text',
            parameters: {
                text: 'To be destroyed',
                fontFamily: 'Arial',
                fontSize: 16,
            } satisfies GeometryParametersText,
        },
    };

    const rectHandle1 = (await renderService.renderableCreate({ renderSvcId, initialState: rectState1 })).handle as RenderableHandle;
    const rectHandle2 = (await renderService.renderableCreate({ renderSvcId, initialState: rectState2 })).handle as RenderableHandle;
    const textHandle = (await renderService.renderableCreate({ renderSvcId, initialState: textState })).handle as RenderableHandle;

    renderService.render();

    // Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Destroy the text renderable
    await renderService.renderableDestroy({ renderSvcId, handles: [textHandle] });

    // Re-render
    renderService.render();
}

// #endregion test functions
