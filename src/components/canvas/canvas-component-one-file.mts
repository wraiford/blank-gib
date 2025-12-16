import thisHtml from './canvas.html';
import thisCss from './canvas.css';
import stylesCss from '../../styles.css';
import rootCss from '../../root.css';

import { clone, delay, extractErrorMsg, getUUID } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { ROOT } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { tellUserFunctionInfo } from '@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs';
import { getGlobalMetaspace_waitIfNeeded, } from "@ibgib/web-gib/dist/helpers.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts, } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { AgentWitnessAny, } from "@ibgib/web-gib/dist/witness/agent/agent-one-file.mjs";
import { getAgents } from "@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs";
import { getAgentsSvc } from "@ibgib/web-gib/dist/witness/agent/agents-service-v1.mjs";
import { GEMINI_DEFAULT_MODEL_STR, } from "@ibgib/web-gib/dist/witness/agent/gemini/gemini-constants.mjs";
import { storageGet, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../constants.mjs";
import { getRenderService, RenderService_V1 } from "../../render/render-service-v1.mjs";
import { getAppShellSvc } from "../../ui/shell/app-shell-service.mjs";
import { RenderAgentFunctionInfos } from "../../api/commands/renderable/renderable-index.mjs";
import { AGENT_INITIAL_SYSTEM_TEXT_CANVASAGENT } from "../../agent-texts/canvas-agent-texts.mjs";
import { getComponentCtorArg } from '../../helpers.web.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_CANVASAGENT = 'canvasagent';
export const CHAT_WITH_AGENT_PLACEHOLDER_CANVASAGENT = `Chat with the canvas agent. Ctrl+ENTER to send`;
const AGENT_AVAILABLE_FUNCTIONS_CANVASAGENT = [
    tellUserFunctionInfo,
    ...RenderAgentFunctionInfos,
];


export const CANVAS_COMPONENT_NAME: string = 'ibgib-canvas';

export class CanvasComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${CanvasComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = /apps\/projects\/gib\/canvas/;
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = CANVAS_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, CanvasComponentInstance);
    }

    async createInstance({
        // parentEl,
        path,
        ibGibAddr
    }: {
        // parentEl: HTMLElement;
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: baf75543b6da9f117ae76fc76703fd25)`); }
            const component = document.createElement(this.componentName) as CanvasComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: thisHtml,
                css: [rootCss, stylesCss, thisCss],
            });
            return component;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

export interface CanvasComponentElements {
    canvasEl: HTMLCanvasElement;
}

export class CanvasComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, CanvasComponentElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, CanvasComponentElements> {
    protected override lc: string = `[${CanvasComponentInstance.name}]`;

    renderSvcId: string = '';
    renderSvc: RenderService_V1 | undefined;
    metaspace: MetaspaceService | undefined;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b3964c3b9f3f5100870f1106226eb325)`); }
            // before any initialization, we want to ensure we are bootstrapped
            // await getIbGibGlobalThis_BlankGib().bootstrapPromise; // this is in the super call now

            await super.initialize(opts);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async created(): Promise<void> {
        const lc = `${this.lc}[${this.created.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 3a2fe4eea594c46f8f84374461e12f25)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 14bbf25a34e34cdc0c4f88fb423e2325)`); }

            await this.initElements();
            this.agentsInitialized = this.initAgents(); // spins off

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 52b66c20807577b74f2a87d93b719725)`); }
            const { canvasEl } = this.elements;

            this.renderSvcId ||= await getUUID();
            this.renderSvc = getRenderService({
                canvasEl,
                renderSvcId: this.renderSvcId,
            });

            // const inputEl = this.shadowRoot.getElementById('canvas-agent-input') as HTMLTextAreaElement;
            // if (!inputEl) { throw new Error(`(UNEXPECTED) canvas-agent-input not found in this.shadowRoot? (E: 2cab312537c3b8c93e5aade8212ee825)`); }

            await this.agentsInitialized;
            await this.initInput();
            await this.agent!.witness(ROOT);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 385596be521e5e859317324c9703e725)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f917e333013af9d7543e90dbbde18a25)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 83348540068c2d607a77c631b1303825)`); }

            const canvasEl = this.shadowRoot.getElementById('ibgib-canvas') as HTMLCanvasElement;
            if (!canvasEl) { throw new Error(`(UNEXPECTED) canvasEl not found in this.shadowRoot? (E: 807ab134e7b602412a26abd35cd72b25)`); }

            this.elements = {
                canvasEl,
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    protected override async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 1963d663b5cfa8500df2799bbe71c125)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 52b66c20807577b74f2a87d93b719725)`); }

            const { canvasEl } = this.elements;

            this.metaspace = await getGlobalMetaspace_waitIfNeeded();

            console.warn(`${lc} always creating new canvas agent for now. todo: load previous canvas agent? (W: 549ebb2ff40ad408a410425151fd4925)`);

            let agent: AgentWitnessAny | undefined = undefined;
            let agents = await getAgents({
                metaspace: this.metaspace,
                type: AGENT_SPECIAL_IBGIB_TYPE_CANVASAGENT,
                spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
            });
            if (agents.length > 0) {
                agent = agents.at(0)!;
            } else {
                const agentsSvc = getAgentsSvc();
                agent = await agentsSvc.createNewAgent({
                    metaspace: this.metaspace,
                    superSpace: undefined, // uses default local user space as the super space
                    name: `CanvasAgent-${this.instanceId}`,
                    api: 'gemini',
                    model: GEMINI_DEFAULT_MODEL_STR,
                    availableFunctions: clone(AGENT_AVAILABLE_FUNCTIONS_CANVASAGENT),
                    initialSystemText: [
                        AGENT_INITIAL_SYSTEM_TEXT_CANVASAGENT,
                        // await getAgentSystemText({ agentType: 'canvas' }),
                        `IMPORTANT: Your renderSvcId is ${this.renderSvcId}. Use this when you make render function calls!!`,
                        `The size (width x height) of the canvas is ${canvasEl.width} x ${canvasEl.height}`,
                    ].join('\n'),
                    initialChatText: `Hi. Please introduce yourself as a canvas agent and give a very brief description of yourself. Choose a legit name, not some camelCase or other programming name, and not a name that sounds like a business name. Choose a real name, like a human, alien, and/or robbot name. And you can't use "Gemini"! ;-)`, // Initial chat message
                    fnGetAPIKey: this.getFnGetAPIKey(),
                    type: AGENT_SPECIAL_IBGIB_TYPE_CANVASAGENT,
                    addToAgentsTag: true,
                });
            }

            this.agents = [agent];

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: 6ea8e8b7aa551bcf467042dbabab9425)`); }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async initInput(): Promise<void> {
        const lc = `${this.lc}[${this.initInput.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4ffb333a2e89f51de4385b432ae69e25)`); }

            const appShellSvc = getAppShellSvc();
            await appShellSvc.initialized;
            while (!appShellSvc.inputComponent) {
                console.log(`${lc} appShellSvc.inputComponent falsy. waiting until it's created. (I: b045c1f5ba4a94a66178ecbeec70c725)`);
                await delay(100);
            }
            await appShellSvc.inputComponent!.setContextInfo({
                info: {
                    agent: this.agent,
                    placeholderText: CHAT_WITH_AGENT_PLACEHOLDER_CANVASAGENT,
                    // default to default local user space for now
                    spaceId: undefined,
                },
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getAPIKey(): Promise<string> {
        const fn = this.getFnGetAPIKey();
        return fn();
    }
    private getFnGetAPIKey(): () => Promise<string> {
        const lc = `${this.lc}[${this.getFnGetAPIKey.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 70797b0e43fe8be2ab9efc24b9abf725)`); }

            const fn = async () => {
                let apiKey = await storageGet({
                    dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                    key: BEE_KEY,
                });
                return apiKey ?? '';
            };
            return fn;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
