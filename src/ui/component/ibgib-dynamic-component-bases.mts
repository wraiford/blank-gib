/**
 * @module component-one-file.mts contains all the types, helpers, constants and
 * classes for the **shell** ui component system. the differentiating factor
 * between this system and other front end ui frameworks is that this is
 * ibgib-driven, with especially ibgib addresses driving components' backing
 * model/data.
 *
 * this is not to be confused with "components" that may be dynamically
 * generated within a blank-canvas environment that the canvas agents will
 * build. this is for the old-school html shell.
 *
 * the ui component system is being built piecemeal as we go.
 *
 * ## approach
 *
 * there are two basic pieces to a component: the component metadata declaration
 * and the concrete component instance that that declaration instantiates. these
 * will be tightly coupled per use-case, with the intention that the meta object
 * will not need to be a descendant class, whereas the component instance will
 * most likely be the class that is extended from an abstract base class.
 *
 * @see {@link IbGibDynamicComponentMeta}
 * @see {@link IbGibDynamicComponentInstance}
 */

import { delay, extractErrorMsg, pickRandom_Letters, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { ROOT_ADDR } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { Gib, Ib, IbGibAddr, TjpIbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { getGibInfo, isDna, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { Factory_V1 } from "@ibgib/ts-gib/dist/V1/factory.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { getTimelinesGroupedByTjp, getTjpAddr, splitPerTjpAndOrDna, toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
import {
    exportIbGib, getDeterministicColorInfo, getGlobalMetaspace_waitIfNeeded,
    getIbGibGlobalThis_Common, getRawExportIbGibAndGraphFromJsonString
} from "../../helpers.web.mjs";
import { LiveProxyIbGib } from "../../witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";
import { AgentWitnessAny, } from "../../witness/agent/agent-one-file.mjs";
import { ElementsBase, FnHandleRouteType, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts, IbGibDynamicComponentMeta, ChildInfoBase } from "./component-types.mjs";
import { getComponentSvc } from "./ibgib-component-service.mjs";
import { getAgentForDomainIbGib } from "../../witness/agent/agent-helpers.mjs";
import { createSettings, getSectionName, getSettingsScope, getSettingsSection } from "../../common/settings/settings-helpers.mjs";
import { IbGibSettings, SettingsIbGib_V1, SettingsWithTabs } from "../../common/settings/settings-types.mjs";
import { SettingsType } from "../../common/settings/settings-constants.mjs";
import { coupleDomainIbGibWithLocalIbGibViaIndex, getLocalCoupledIbGibForDomainIbGib } from "../../helpers.mjs";
import { mut8Timeline } from "../../api/timeline/timeline-api.mjs";

const logalot = GLOBAL_LOG_A_LOT;


/**
 * Maybe yagni, but I have this base class for whatever reason.
 *
 * @see {@link IbGibDynamicComponentMeta}
 */
export abstract class IbGibDynamicComponentMetaBase
    implements IbGibDynamicComponentMeta {
    protected lc: string = `[${IbGibDynamicComponentMetaBase.name}]`;
    componentName: string = '';
    routeRegExp?: RegExp | undefined = undefined;
    fnHandleRoute?: FnHandleRouteType | undefined = undefined;
    abstract createInstance(arg: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance>;
}

/**
 * Base class for common ibgib component. This is the actual web component
 * instance.
 *
 * ## regarding HTMLElement
 *
 * This class extends HTMLElement, so you have access to things, e.g., the
 * parent element via the normal DOM interface.
 *
 * @see {@link IbGibDynamicComponentInstance}
 */
export abstract class IbGibDynamicComponentInstanceBase<TIbGib extends IbGib_V1 = IbGib_V1, TElements = any>
    extends HTMLElement
    implements IbGibDynamicComponentInstance<TIbGib, TElements> {
    protected lc: string = `[${IbGibDynamicComponentInstanceBase.name}]`;

    elements: TElements | undefined;
    createdPromise: Promise<void> | undefined;
    settings: LiveProxyIbGib<SettingsIbGib_V1> | undefined;

    /**
     * main agent for this component
     *
     * atow (04/2025), this is derived from {@link agents}, being the first one
     * in that array. So, other agents may exist for this component, but the
     * first one should be the main one for this component.
     */
    get agent(): AgentWitnessAny | undefined { return this.agents.at(0); }
    /**
     * @see {@link agent}
     */
    agents: AgentWitnessAny[] = [];

    get ib(): Ib {
        const { ib } = getIbAndGib({ ibGibAddr: this.ibGibAddr ?? ROOT_ADDR });
        return ib;
    }
    get gib(): Gib {
        const { gib } = getIbAndGib({ ibGibAddr: this.ibGibAddr ?? ROOT_ADDR });
        return gib;
    }
    ibGibAddr: IbGibAddr = ROOT_ADDR;
    /**
     * The proxy witness used for updating the backing ibGib.
     */
    ibGibProxy: LiveProxyIbGib<TIbGib> | undefined;
    /**
     * Backing ibgib getter via {@link ibGibProxy.ibGib}
     */
    get ibGib(): TIbGib | undefined {
        const ibGibAddr = this.ibGibAddr ?? ROOT_ADDR;
        const { ib, gib } = getIbAndGib({ ibGibAddr });
        return this.ibGibAddr && !isPrimitive({ gib }) ?
            this.ibGibProxy?.ibGib :
            Factory_V1.primitive({ ib }) as TIbGib;
        //  undefined; // should we return undefined?
    }
    get tjpAddr(): TjpIbGibAddr | undefined {
        return this.ibGib ?
            getTjpAddr({ ibGib: this.ibGib, defaultIfNone: "incomingAddr" })! :
            undefined;
    }

    /**
     * reference to the meta instance that created this component instance.
     */
    meta: IbGibDynamicComponentMeta | undefined;
    html: string | undefined;
    css: string[] | undefined;


    /**
     * not really used yet, since we're only testing with web1 which has a
     * static, primitive ibgib address.
     */
    static get observedAttributes() {
        return ['ibGibAddr'];
    }

    _instanceId: string;
    get instanceId() { return this._instanceId; }

    /**
     * we can initialize the agent(s) as soon as we load the ibgib, but we don't
     * want to await it immediately.
     */
    agentsInitialized: Promise<void> | undefined;

    /**
     * @internal number of times {@link connectedCallback} has been called.
     *
     * ## notes
     *
     * I'm making this because when the component is removed
     */
    protected connectedCount = 0;

    /**
     * override this as needed
     */
    public get isBusy(): boolean { return false; }

    constructor() {
        super();
        this._instanceId = pickRandom_Letters({ count: 8 });
    }

    async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        let { ibGibAddr, meta, html, css } = opts;

        // maybe remove this try..catch..finally to speed up perf when this is
        // more mature
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c9b94131bc2f0d20e1397c214dad6725)`); }

            this.ibGibAddr = ibGibAddr;
            this.meta = meta;
            this.html = html;
            this.css = css;

            // Attach shadow DOM
            this.attachShadow({ mode: 'open' });

            await getIbGibGlobalThis_Common().bootstrapPromise; // in the extension, this
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        if (logalot) { console.log(`${lc} does nothing in base class (I: 0b31a650b942619a0e36a1a7f763e825)`); }

    }

    async connectedCallback(): Promise<void> {
        const lc = `${this.lc}[${this.connectedCallback.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 01bbbf69f1c75b03a29e7a85ebd2c725)`); }

            this.connectedCount++;

            if (this.connectedCount === 1) {
                // first time this component has been created, so do full
                // template/styles/scripts init.
                await this.connectedCallback_initComponent();
            } else {
                await this.connectedCallback_reconnectComponent();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async connectedCallback_initComponent(): Promise<void> {
        const lc = `${this.lc}[${this.connectedCallback_initComponent.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: bc4af3f6751d841f51bad19e334efa25)`); }
            if (!this.html) { throw new Error(`(UNEXPECTED) this.html is falsy? (E: a0a0ab7c8f987d78058dd7cad09a5125)`); }

            // create template element and set innerHTML
            const template = document.createElement('template');
            template.innerHTML = this.css ?
                `
                <style>
                    ${this.css.join('\n')}
                </style>
                ${this.html}
                ` :
                this.html;

            // append content to shadow DOM
            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot is falsy? (E: 1a3cf77d87767aaff37d31657ee73f25)`); }
            this.shadowRoot.appendChild(template.content);

            this.createdPromise = this.created();
            await this.createdPromise;

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async connectedCallback_reconnectComponent(): Promise<void> {
        const lc = `${this.lc}[${this.connectedCallback_reconnectComponent.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7fccefbeff68c0dda15642ebaa1eb525)`); }
            console.log(`${lc} does nothing in base class (I: 724bc670d4ccb0fde2b2fa49830cd425)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async disconnectedCallback(): Promise<void> {
        const lc = `${this.lc}[${this.disconnectedCallback.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 6f3b25c23fb874b1ac513e8f0d1f4e25)`); }

            await this.disconnected();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * untested so far.
     *
     * @param name
     * @param oldValue
     * @param newValue
     */
    public async attributeChangedCallback(name: string, oldValue: any, newValue: any): Promise<void> {
        const lc = `${this.lc}[attributeChangedCallback]`;
        if (logalot) { console.log(`${lc} starting... (I: 33cd68579171582166d25d8898640f25): ${name} ${oldValue} => ${newValue}`); }
        // handle attribute changes if needed
        console.warn(`${lc} nothing done in base class atow (W: 9eb93eb8fde7c0058c79cea841936a25)`);
    }

    public abstract created(): Promise<void>;
    public abstract disconnected(): Promise<void>;
    /**
     * triggers {@link destroyed} handler
     *
     * Note there are NO web component lifecycles that trigger this. This must
     * be called explicitly in code.
     * @see {@link disconnected}
     * @see {@link disconnectedCallback}
     */
    public async destroy(): Promise<void> {
        const lc = `${this.lc}[${this.destroy.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 536989c9491b544105b6d01a688fbb25)`); }
            await this.destroyed();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    public async destroyed(): Promise<void> {
        const lc = `${this.lc}[${this.destroyed.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f34f3ca04b06b1e00ebe04df22331125)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
        if (logalot) { console.log(`${lc} does nothing in the base class. (I: d9437f962e0aec40d69ad6159e7b5725)`); }
        return Promise.resolve();
    }

    public async loadIbGib(opts?: { getLatest?: boolean }): Promise<void> {
        const lc = `${this.lc}[${this.loadIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4dcb1b7a3d86f3415ca7224c07126925)`); }

            const getLatest = opts?.getLatest ?? false;

            if (this.ibGib) {
                // this may be because we need to load the ibgib/have access to
                // it before the web component is attached to the DOM (which
                // triggers the component's created event)
                console.warn(`${lc} this.ibGib already loaded. idempotently returning early without doing anything. (W: 15498d346a32e884acec108cb3c8ee25)`);
                return; /* <<<< returns early */
            }

            if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: this.ibGibAddr ?? ROOT_ADDR }).gib })) {
                if (logalot) { console.log(`${lc} component loading primitive ibgib (I: 3349796ef6139c1e718c8626c7935625)`); }
                // no need to load, this.ibGib will be derived from the primitive addr
                return; /* <<<< returns early */
            }

            // live or not, we want to get the ibgib record itself.
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            /**
             * using default local space as the common shared space atow
             * (04/2025)
             */
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) local user space falsy? (E: bb093b7e9781064e8db9a4390b63bb25)`); }

            if (getLatest) {
                const latestAddr = await metaspace.getLatestAddr({ addr: this.ibGibAddr, space });
                if (latestAddr && latestAddr !== this.ibGibAddr) {
                    this.ibGibAddr = latestAddr;
                }
            }
            const resGet = await metaspace.get({
                addrs: [this.ibGibAddr],
                space,
                // space: undefined,
            });
            if (!resGet.success || resGet.ibGibs?.length !== 1) {
                throw new Error(`couldn't get ibGib (${this.ibGibAddr}) in space (${space?.ib ?? 'undefined'}) (E: 59c3461bebf3e0065df72bd1bd8dc125)`);
            }

            // get the initial ibGib and wrap it in the "live" (updating) proxy
            const ibGib = resGet.ibGibs.at(0)!;
            const ibGibProxy = new LiveProxyIbGib<TIbGib>();
            await ibGibProxy.initialized;
            if (!ibGibProxy.contextUpdated$) {
                throw new Error(`(UNEXPECTED) ibGibProxy.contextUpdated$ falsy? (E: 351dfc898d2c3da2d7928079cec14925)`);
            }
            ibGibProxy.contextUpdated$.subscribe(fnObs({
                next: async (nextIbGib) => {
                    const lcNext = `${lc}[ibGibProxy.contextUpdated$][next]`;
                    if (logalot) { console.log(`${lcNext} nextIbGib: ${pretty(nextIbGib)} (I: 96c846357b94fda2cefa615aed88c325)`); }
                    await this.handleContextUpdated();
                },
                error: async (e) => {
                    debugger; // error in component.ibGibProxy.contextUpdated$ observable?
                    console.error(`${lc}[ibGibProxy.contextUpdated$][error] what up? ${extractErrorMsg(e)}`);
                },
            }));

            if (!ibGibProxy.newContextChild$) { throw new Error(`(UNEXPECTED) ibGibProxy.newContextChild$ falsy? (E: 2cbde5ab402cc6d81259c74d68bca725)`); }
            ibGibProxy.newContextChild$.subscribe(fnObs({
                next: async (childIbGib) => {
                    const lcNext = `${lc}[ibGibProxy.contextUpdated$][next]`;
                    if (logalot) { console.log(`${lcNext} childIbGib: ${pretty(childIbGib)} (I: 96c846357b94fda2cefa615aed88c325)`); }
                    await this.handleNewContextChild({ childIbGib });
                },
                error: async (e) => {
                    debugger; // error in component.ibGibProxy.contextUpdated$ observable?
                    console.error(`${lc}[ibGibProxy.contextUpdated$][error] what up? ${extractErrorMsg(e)}`);
                },
            }));
            /**
             * not necessary, I'm just putting this here to remind myself that
             * we can dynamically assign a space (via spaceId) to a proxy ibgib.
             */
            const _ignoredSpace = await ibGibProxy.witness(space);
            const _ignored = await ibGibProxy.witness(ibGib);
            this.ibGibProxy = ibGibProxy;

            // update the addr in case the proxy is newer than the ibgib addr
            // that we started with.
            this.ibGibAddr = getIbGibAddr({ ibGib: ibGibProxy.ibGib });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * in base class, this sets {@link ibGibAddr} to reflect the {@link nextIbGib}.
     *
     * override this in child classes to do more when next context happens
     *
     * @see {@link handleNewContextChild}
     */
    protected async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            const { ibGib } = this; // derived from ibGibProxy
            this.ibGibAddr = ibGib ? getIbGibAddr({ ibGib }) : ROOT_ADDR;
            if (logalot) { console.log(`${lc} context updated. this.ibGibAddr (I: 64e5876f58cc54b5af777c94f13a4325)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }
    /**
     * does nothing (atow 04/2025) in base class
     *
     * override this to handle new children on {@link ibGibProxy}
     * @see {@link handleContextUpdated}
     */
    protected async handleNewContextChild({ childIbGib }: { childIbGib: IbGib_V1 }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} child added to contextcontext updated. childIbGib: ${pretty(childIbGib)} (I: 07d02c9182c6629cbbacd39fd0ff7f25)`); }
            console.log(getIbGibAddr({ ibGib: childIbGib })); // debug
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    /**
     * updates and renders the visual part of the component.
     */
    protected async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7e5704afe17fb937c8473e7801f56e25)`); }

            if (this.ibGib) {
                // const color = getUniqueColorInfo({ ibGib: this.ibGib, });
                // this.style.setProperty('--ibgib-color', color);
                const {
                    punctiliarColor,
                    punctiliarColorTranslucent,
                    punctiliarColorContrast,
                    tjpColor,
                    tjpColorTranslucent,
                    tjpColorContrast,
                    errorMsg
                } = getDeterministicColorInfo({ ibGib: this.ibGib, translucentAlpha: 10 });
                if (!errorMsg) {
                    this.style.setProperty('--ibgib-color', punctiliarColor);
                    this.style.setProperty('--ibgib-color-translucent', punctiliarColorTranslucent);
                    this.style.setProperty('--ibgib-color-contrast', punctiliarColorContrast);
                    this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                    this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
                    this.style.setProperty('--tjp-color-contrast', tjpColorContrast ?? 'lime');
                } else {
                    // don't set anything
                    console.error(`${lc} ${errorMsg} (E: 65e0d330d029c1fe39f3d6280dda3725)`);
                }
            }

            await this.renderUI_busy();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

    protected async renderUI_busy(): Promise<void> {
        // does nothing in base
    }

    /**
     * loads the agent(s) coupled to the domain ibgib (this.ibGib), if any.
     */
    protected async loadAgentsCoupledToIbGib({
        dontThrowIfNone,
    }: {
        /**
         * most components have an agent. set this to true if the component is small enough to NOT have an agent.
         */
        dontThrowIfNone?: boolean,
    } = {}): Promise<void> {
        const lc = `${this.lc}[${this.loadAgentsCoupledToIbGib.name}]`;
        try {
            // #region init/validation
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            // const { metaspace } = this;
            // if (!metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 230f36ee774eaaecddabd42540160325)`); }

            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) space falsy? we couldn't get the default local user space? (E: 06f5be2eec8abaa54d42ad982a155925)`); }

            // const domainIbGib = this.ibGib as (ProjectIbGib_V1 | undefined);
            // if (!domainIbGib) { throw new Error(`(UNEXPECTED) this.ibGib (projectIbGib) falsy? (E: a0281854c6312eadaa3420015d0d0925)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 9b24c4b4aa491a21b58fde9185eb9325)`); }
            // #endregion init/validation

            const agent = await getAgentForDomainIbGib({
                ibGib: this.ibGib,
                metaspace,
                space,
            });
            if (agent) {
                const initialN = agent.data!.n!;
                await agent.setActiveContext({ contextIbGib: this.ibGib, loggingInfo: this.lc }); // maybe too premature?
                await delay(32); // allow update of data.n kluge
                const afterN = agent.data!.n!;
                if (initialN !== afterN) {
                    console.warn(`${lc} setting active context for agent changed agent.data.n.\nagent.data: ${pretty(toDto({ ibGib: agent }))}\nibGib.data: ${toDto({ ibGib: this.ibGib })} (W: cb22e8b064d8c2d7b3b2c488ed169225)`)
                    // debugger; // dynamic comp base...why did data.n change?
                }
                this.agents = [agent];
            } else {
                // one day come back to visit this idea of mandatory agent per component, as some components seem small enough to warrant not requiring an agent.
                if (dontThrowIfNone) {
                    console.warn(`(UNEXPECTED) agent falsy? an agent should have been created and registered with the ibGib (${getIbGibAddr({ ibGib: this.ibGib })}) (W: e4219903462baab438a23c786d714825)`);
                } else {
                    throw new Error(`(UNEXPECTED) agent falsy? an agent should have been created and registered with the ibGib (${getIbGibAddr({ ibGib: this.ibGib })}) (E: 7182d1aa070b9578c78a5b8b401d8425)`);
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    /**
     * Gets the settings section.
     *
     * NOTE: this.settings and this.settings.ibGib must be initialized before
     * calling this, else will throw.
     *
     * @returns settings section corresponding to type/use case or undefined
     *
     * ## notes on settings
     *
     * AFAICT I have made this so that there is one single settings ibgib with
     * individual sections in its data. So use this function to get a section
     * within that settings ibgib that is based on a given domain ibgib (this.ibGib).
     *
     * So a component initializes/activates an ibGib (this.ibGib) and for those
     * components that use the settings, this.initSettings must be called. Then
     * you call getSettings or updateSettings (not implemented yet).
     */
    protected async getSettings<TSettings extends IbGibSettings>({
        settingsType,
        useCase,
    }: {
        settingsType: SettingsType,
        useCase: "current" | string,
    }): Promise<TSettings | undefined> {
        const lc = `${this.lc}[${this.getSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 00c8dbedd2e8a8b988cc45f4186efd25)`); }
            if (!this.settings) { throw new Error(`(UNEXPECTED) this.settings falsy? shouldn't this be initialized by now? (E: ceae480e28fab1da38b8def8b1060d25 (E: dc7d984c1c64293a3c3e0628dedadb25)`); }
            if (!this.settings.ibGib) { throw new Error(`(UNEXPECTED) this.settings.ibGib falsy? shouldn't this be initialized by now? especially since this.settings is truthy? (E: faef6878abaf00a4a6a6f6b85ce8c825)`); }

            const settingsSection = await getSettingsSection({
                sectionName: await getSectionName({ settingsType, useCase, }),
                settingsIbGib: this.settings.ibGib,
            }) as (TSettings | undefined);

            if (!settingsSection) {
                if (logalot) { console.log(`${lc} settingsSection does not exist. returning undefined. (I: 0462d83f5ae8049708274b88e9b0d825)`) }
            }
            return settingsSection;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async updateSettings<TSettings extends IbGibSettings>({
        settingsType,
        useCase,
        newSectionInfo,
    }: {
        settingsType: SettingsType,
        useCase: "current" | string,
        newSectionInfo: TSettings,
    }): Promise<void> {
        const lc = `${this.lc}[${this.updateSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 80ce98cf386e0c04d30e8b15ac0f2925)`); }

            const sectionName_current = await getSectionName({
                settingsType,
                useCase,
            });
            const _newSettings = await mut8Timeline({
                timeline: this.settings!.ibGib!,
                metaspace: await getGlobalMetaspace_waitIfNeeded(),
                mut8Opts: {
                    dataToAddOrPatch: {
                        sections: {
                            [sectionName_current]: newSectionInfo,
                        }
                    },
                },
            });
            await delay(100); // cheap kluge to allow settings ibgib to update
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * if this.ibGib has a coupled settings ibgib indexed in the local space,
     * then {@link settings} should be loaded with it. This is a convenience
     * fn to access the current settings section for the {@link settingsType}.
     */
    protected async getCurrentSettings<TSettings extends IbGibSettings>({ settingsType }: { settingsType: SettingsType }): Promise<TSettings | undefined> {
        const lc = `${this.lc}[${this.getCurrentSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: da0baee73e386089a8c059f83cc43825)`); }
            if (!this.settings) { return undefined; /* <<<< returns early */ }
            const sectionName = await getSectionName({ settingsType, useCase: 'current' });
            return getSettingsSection({ sectionName, settingsIbGib: this.settings.ibGib! });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    protected async initSettings(): Promise<void> {
        const lc = `${this.lc}[${this.initSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: acfee8787d32a6075442e2887a386a25)`); }

            // get the local space settings for this ibgib and update
            // this.lensMode appropriately
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 8ce2e73bea87b9330b131778a3981825)`); }
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: f77ce7269a6f0d7ad8978349b4c6cd25)`); }

            if (isPrimitive({ ibGib: this.ibGib })) {
                console.error(`${lc} this.ibGib is primitive, so what are we initializing settings for? (W: 9915089019b81c6935b32ae877095825)`);
                return; /* <<<< returns early */
            }

            const scope = await getSettingsScope({ ibGib: this.ibGib });
            let settingsIbGib =
                await getLocalCoupledIbGibForDomainIbGib<SettingsIbGib_V1>({
                    scope,
                    // scope: this.getSettingsScope(),
                    // scope: PROJECT_SETTINGS_SCOPE,
                    ibGib: this.ibGib,
                    metaspace,
                    space,
                });

            // we want to get the *current* general settings to reload. if they
            // do not exist, then we need to init the settings

            if (!settingsIbGib) {
                // create new project settings and couple to the project ibgib
                // const defaultGeneral = await getDefaultSettings({ settingsType: SettingsType.general });
                // const scope = await getSettingsScope({ ibGib: this.ibGib });
                const resNewSettings = await createSettings({
                    scope,
                    metaspace,
                    space,
                    saveInSpace: true,
                });
                settingsIbGib = resNewSettings.newIbGib;
                await coupleDomainIbGibWithLocalIbGibViaIndex({
                    scope,
                    domainIbGib: this.ibGib,
                    localIbGib: settingsIbGib,
                    metaspace,
                    space,
                });
            }
            if (!settingsIbGib) { throw new Error(`(UNEXPECTED) settings falsy still? should be initialized. (E: a179adcbbab800cff849b8aa95fbe425)`); }

            const settingsProxy = new LiveProxyIbGib();
            await settingsProxy.setWrappedIbGib({ ibGib: settingsIbGib, space });
            this.settings = settingsProxy as LiveProxyIbGib<SettingsIbGib_V1>;

            const generalSettings = await this.getCurrentSettings({ settingsType: SettingsType.general });

            // const sectionName_currentGeneral = await getSectionName({
            //     settingsType: SettingsType.general,
            //     useCase: 'current',
            // });
            // let generalSettings = await getSettingsSection<Settings_General>({
            //     sectionName: sectionName_currentGeneral,
            //     settingsIbGib: settingsIbGib,
            // });
            if (!generalSettings) {
                throw new Error(`(UNEXPECTED) no current general settings? the settings should have been updated with this upon creation. (E: d10fd8d42b58d917180293a713009825)`);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * exports a given ibgib to the default local userspace in the metaspace.
     */
    protected async exportIbGib({
        ibGib,
        compress,
    }: {
        ibGib: IbGib_V1,
        compress: boolean,
    }): Promise<void> {
        const lc = `${this.lc}[${this.exportIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 623d9463d919683be81f749821a95825)`); }
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: 3d15dbd074ac0c15b834a788d0b57d25)`); }
            if (isPrimitive({ ibGib })) {
                throw new Error(`ibGib is primitive. Can't export primitive. (E: dd42c42e9fda0707e81c692af1a2a225)`);
            }

            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 7bb735be58282f1bd7abe5d9ffabb525)`); }

            // const resGetExport = await getRawExportIbGib({
            //     ibGib,
            //     live: true,
            //     compress,
            //     metaspace: metaspace,
            //     space,
            // });

            // maybe can just dynamically add this anchor element with display: none and click it? hmm...i've done this, will test
            // if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 137f413b39a88fdc58c751c82efd3825)`); }
            // const downloadAnchorElId = 'export-ibgib-anchor';
            // const downloadAnchorEl = this.shadowRoot.getElementById(downloadAnchorElId) as HTMLAnchorElement;
            // if (!downloadAnchorEl) { throw new Error(`(UNEXPECTED) dlAnchorElem falsy? should be an element with id ${downloadAnchorElId}? (E: 51dfe2d823eedeefb8b9c9580090e625)`); }

            await exportIbGib({
                ibGib,
                compress,
                // downloadAnchorEl,
                metaspace,
                space,
            });

            // THE FOLLOWING CODE WAS **MOSTLY** PUT INTO THE ABOVE HELPER FUNCTION.

            // const { rawExportIbGib: exportIbGib, errors } = resGetExport;
            // const exportErrors = resGetExport.errors ?? [];
            // if (exportErrors.length > 0) {
            //     throw new Error(`Export had errors: ${exportErrors} (E: 05faf83f25d3449ab809dfd24eeaf825)`);
            // }

            // // at this point, we have a possibly quite large ibGib whose data includes
            // // every single ibgib that this.ibGib relates to (its dependency graph). This
            // // so now we can save this file and later import from it.

            // /**
            //  * exportIbGib is guaranteed to have a serializable structure, i.e.,
            //  * the data has only primitives. (there are no Uint8Array)
            //  */
            // const exportIbGibAsString = JSON.stringify(exportIbGib);

            // // thank you SO, OP and volzotan at https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
            // // set the anchor's href to a data stream
            // const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportIbGibAsString);

            // // get the filename for the anchor to suggest for the "download"
            // const exportAddr = getIbGibAddr({ ibGib: exportIbGib });
            // const filename = `${exportAddr}.json`;

            // // // if (this.web) {
            // // trigger the click
            // if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 137f413b39a88fdc58c751c82efd3825)`); }
            // const downloadAnchorElId = 'export-ibgib-anchor';
            // // const downloadAnchorEl = document.getElementById(downloadAnchorElId);
            // const downloadAnchorEl = this.shadowRoot.getElementById(downloadAnchorElId);
            // if (!downloadAnchorEl) { throw new Error(`(UNEXPECTED) dlAnchorElem falsy? should be an element with id ${downloadAnchorElId}? (E: 51dfe2d823eedeefb8b9c9580090e625)`); }
            // downloadAnchorEl.setAttribute("href", dataStr);
            // downloadAnchorEl.setAttribute("download", filename);
            // downloadAnchorEl.click();
            // // } else {
            // //     // let res = await Filesystem.requestPermissions();
            // //     await Filesystem.writeFile({
            // //         data: dataStr,
            // //         directory: Directory.ExternalStorage,
            // //         path: `/Download/${filename}`,
            // //         encoding: Encoding.UTF8,
            // //         recursive: true,
            // //     });
            // // }
            // // await Dialog.alert({ title: 'export succeeded', message: 'way to go, the export succeeded' });
            // // throw new Error(`not implemented (E: d17d28b80f2576c6e81298fffc2e7825)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * imports a given ibgib into this.ibGib's
     */
    protected async importIbGib({
        exportIbGibJsonString,
        rel8nName,
        force,
        skipRegisterTimelines,
        divergentTimelineStrategy,
    }: {
        /**
         * this is the contents of the export save file which should have been created with {@link exportIbGib}
         */
        exportIbGibJsonString: string,
        /**
         * named edge that we'll rel8 the ibGib in {@link exportIbGibJsonString}
         * to {@link ibGib}.
         */
        rel8nName: string,
        /**
         * if true, will add rel8n even if already rel8d.
         */
        force?: boolean,
        /**
         * if true, will not call metaspace.registerNew on imported timelines.
         *
         * ## notes
         *
         * may be yagni but meh, i see it as a distinct possibility when
         * importing that we just want to bring ibgibs in.
         */
        skipRegisterTimelines?: boolean,
        /**
         * If
         */
        divergentTimelineStrategy: 'supercede-timeline' | 'keep-existing-timeline' | 'optimistic-merge' | 'throw-error',
    }): Promise<void> {
        const lc = `${this.lc}[${this.importIbGib.name}]`;
        try {

            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 947c983e57a91aa00c8c185320354325)`); }

            let [rawExportIbGib, ibGibGraph] = await getRawExportIbGibAndGraphFromJsonString({ exportIbGibJsonString });
            if (!rawExportIbGib.data) { throw new Error(`(UNEXPECTED) rawExportIbGib.data falsy? this is assumed validated at this point. (E: 6bc4e84db08e3c6228b2c40c2ea50825)`); }
            /**
             * this is the actual addr of the ibgib we're importing and should
             * be the root of the export. if this exact addr already exists in the space, then the
             * entire dependency graph is assumed to exist. if force is true, then we'll ignore this step
             */
            const exportRootAddr = rawExportIbGib.data.contextIbGibAddr;

            let skipImportGraphIntoSpace = false;
            if (!force) {
                // double check to see if the import ibgib already exists in the
                // space. if it does, then we don't need to do any
                // saving/registering of the graph we're importing.

                const resGetExisting = await metaspace.get({
                    addr: exportRootAddr,
                    space,
                });
                if (resGetExisting.success && (resGetExisting.ibGibs ?? []).length === 1) {
                    console.log(`${lc} export's ibGib addr (${exportRootAddr}) already exists in the space, so we're skipping doing any physical importing of the export's graph. (I: 429b5bdcd0585c697869f568c4673825)`);
                    skipImportGraphIntoSpace = true;
                }
            }

            // before rel8ing the export to this.ibGib via rel8nName, we must
            // save the import in the space.
            if (!skipImportGraphIntoSpace) {
                splitPerTjpAndOrDna
                const graphIbGibs_dna: IbGib_V1[] = [];
                const graphIbGibs_nondna: IbGib_V1[] = [];
                Object.values(ibGibGraph).forEach(x => {
                    if (isDna({ ibGib: x })) {
                        graphIbGibs_dna.push(x);
                    } else {
                        graphIbGibs_nondna.push(x);
                    }
                });

                // do the dna first
                const resPutDna = await metaspace.put({
                    ibGibs: graphIbGibs_dna,
                    isDna: true,
                    space, force,
                });
                if (!resPutDna.success || !!resPutDna.errorMsg) {
                    throw new Error(`there was an error putting the export's dna ibgibs into the space (${space.ib}). error: ${resPutDna.errorMsg || '[unknown error (E: 7c7ef8d5281399b1d8f3fbeefba1b825)]'} (E: ce3e8b982208afc4889164ba20a31825)`);
                }

                // dna done, but we still may have stones (non-timeline, i.e.,
                // no tjp) so do those next (least amount of dependencies, no
                // need to register timelines)
                const { mapWithTjp_YesDna, mapWithTjp_NoDna, mapWithoutTjps } = splitPerTjpAndOrDna({ ibGibs: graphIbGibs_nondna });
                const resPutNonDnaStones = await metaspace.put({
                    ibGibs: Object.values(mapWithoutTjps),
                    space, force,
                });
                if (!resPutNonDnaStones.success || !!resPutNonDnaStones.errorMsg) {
                    throw new Error(`there was an error putting the export's non-dna stone ibgibs (no-tjp) into the space (${space.ib}). error: ${resPutNonDnaStones.errorMsg || '[unknown error (E: dc17f8ee7aed5c445f8b827f274b0825)]'} (E: 9561364961e89c132818f6784a607825)`);
                }

                // at this point, we only have timelines left. With timelines,
                // we need to not only put them in the space, but also register
                // the most recent one. (maybe we should register all of them
                // but that gets complicated.) since these are all imports,
                // there shouldn't be anything listening specifically for
                // updates to these timelines.

                const timelineIbGibsMap = { ...mapWithTjp_YesDna, ...mapWithTjp_NoDna, };
                const timelineIbGibs = Object.values(timelineIbGibsMap);


                // first, let's persist them
                const resPutTimelines = await metaspace.put({
                    ibGibs: timelineIbGibs,
                    space, force,
                });
                if (!resPutTimelines.success || !!resPutTimelines.errorMsg) {
                    throw new Error(`there was an error putting the export's timeline ibgibs into the space (${space.ib}). error: ${resPutTimelines.errorMsg || '[unknown error (E: be4a28961574765798c8d3686ae89c25)]'} (E: 066796a23da3c9f748558fd25bfdf525)`);
                }

                // now we want to register the latest in each timeline, so at
                // the very least if we call get latest on any of the timeline
                // ibgibs (at any point in time within one of those timelines),
                // the metaspace has registered the latest one.

                if (!skipRegisterTimelines) {
                    /**
                     * from getTimelinesGroupedByTjp documentation:
                     * > @returns filtered, sorted map of incoming `ibGibs` [tjpAddr] => timeline [ibgib0 (tjp), ibgib1, ibgib2, ..., ibgibN (latest)]
                     */
                    const timelineMap_groupdByTjp = getTimelinesGroupedByTjp({ ibGibs: timelineIbGibs });
                    const timelines = Object.values(timelineMap_groupdByTjp);
                    for (const timeline of timelines) {
                        // we want to register the latest in the export's
                        // timeline, BUT...  there may be a more recent ibgib
                        // already in the given space. ALSO there might even be
                        // a divergent timeline, such that the space has a
                        // different timeline evolutionary path than the one in
                        // the given export's timeline.
                        const latestIbGibInTimeline = timeline.at(-1);
                        if (!latestIbGibInTimeline) { throw new Error(`(UNEXPECTED) latestInTimeline falsy? this would mean that we had an empty timeline, and this doesn't make sense... (E: 3bec09e79768cc39d8029f4fe3af9825)`); }
                        const latestAddr = await metaspace.getLatestAddr({
                            ibGib: latestIbGibInTimeline,
                            space,
                        });
                        let spaceAlreadyHasMoreRecentThanLatest = false;
                        if (latestAddr) {

                        } else {
                            // no addrs registered with space, so
                        }

                        if (!spaceAlreadyHasMoreRecentThanLatest) {
                            await metaspace.registerNewIbGib({
                                ibGib: latestIbGibInTimeline,
                                space,
                            });
                        }
                    }
                }
            }


            // what if the export's timeline is already related to this.ibGib via rel8nName?
            // what if the ibgib already exists in the space?

            // OK, I'm leaving off for the moment, because I need to rethink
            // this whole strategy. may need to spawn a new local space and
            // attempt to do it in that space. this may be where we should do
            // the local merge/sync timelines, because what if the import has
            // one or more divergent timelines?
            // so importing requires some more thinking, because an import can
            // essentially be seen as a merge.

            throw new Error(`not implemented (E: 66c308e420e848c8d7cd01c8fddf8425)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async openChronology({
        ibGibAddr,
        ibGib,
    }: {
        ibGibAddr?: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<void> {
        const lc = `${this.lc}[${this.openChronology.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 14059d1a68c83b0c28da18f876c9b825)`); }

            if (!ibGibAddr && !ibGib) { throw new Error(`(UNEXPECTED) both ibGibAddr and ibGib falsy? (E: 2ef0c8e5c7ed3b6a4b88cfd2974e8725)`); }
            if (ibGibAddr && ibGib) {
                if (ibGibAddr !== getIbGibAddr({ ibGib })) {
                    console.warn(`${lc} ibGibAddr !== getIbGibAddr({ibGib}) ? This is expectd to be equal, but maybe it's a tjp thing? (W: cd1842c17a082173ca28e908cb25a825). Overriding/Going with ibGib itself`)
                    ibGibAddr = getIbGibAddr({ ibGib }); // override
                }
            }
            ibGibAddr ??= getIbGibAddr({ ibGib });

            let chronologysComponent = getIbGibGlobalThis_Common().chronologysComponent;

            // wait for it if it isn't defined yet
            let count = 0;
            while (!chronologysComponent) {
                console.warn(`${lc} global chronologysComponent is expected to be truthy by now. delaying (W: e43b814165489d87e8865451c66d5825)`)
                count++;
                if (count > 100) {
                    debugger; // error in web1 component expectation
                    throw new Error(`(UNEXPECTED) global chronologysComponent is falsy? (E: 407c48599e385fe10beb695849e7f125)`);
                }
                await delay(100);
            }

            await chronologysComponent.openIbGibAddr({ ibGibAddr, });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

/**
 * Common plumbing for any component that is meant to contain other ibgib
 * components as children.
 */
export abstract class IbGibDynamicComponentInstanceBase_Parent<TIbGib extends IbGib_V1 = IbGib_V1, TElements extends ElementsBase = any, TChildInfo extends ChildInfoBase<any> = ChildInfoBase<any>>
    extends IbGibDynamicComponentInstanceBase<TIbGib, TElements> {
    /**
     * @internal
     * @protected method that gets the project tab info for the given addr.
     *
     * creates and loads the child ibgib component, which itself loads the
     * ibgib internally (or throws) if not already loaded.
     *
     * @returns TChildInfo with fully loaded component and ibgib.
     */
    protected abstract getLoadedChildInfo({
        addr,
        ibGib,
    }: {
        addr: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<TChildInfo>;

    childInfos: TChildInfo[] = [];
    get activeChildInfo(): TChildInfo | undefined {
        return this.childInfos.find(x => x.active);
    }

    /**
     * Drives loading a child component from an {@link addr} or {@link ibGib}.
     *
     * - If a tab is already created for the ibgib and active, then does nothing.
     * - If it's already created but inactive, then activates tab and loads content
     * - if no tab, then creates it, activates it, loads content.
     *
     * To do this, creates/hydrates a concrete descendant of {@link ChildInfoBase}
     * and activates it via {@link getLoadedChildInfo}
     *
     * @see {@link ChildInfoBase.active}
     * @see {@link activeChildInfo}
     */
    public async activateIbGib({
        addr,
        ibGib,
    }: {
        addr?: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 05015d78983488496dcca4fa36718725)`); }

            while (!this.createdPromise) {
                await delay(50);
            }
            await this.createdPromise;

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: fa221c138f211ee93c717c9dd0cf3225)`); }
            const { contentEl } = this.elements;

            // #region init/validate
            // if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 0ddb82cc0f1550518fd57b65ee5d4625)`); }
            if (!ibGib && !addr) { throw new Error(`(UNEXPECTED) both ibGib and addr falsy? (E: 529fb88738cdacb10aea87b8450f2525)`); }
            if (ibGib && addr && getIbGibAddr({ ibGib }) !== addr) { throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (E: c99a94d8744e3a720cdbc094d53c4e25)`); }
            addr ??= getIbGibAddr({ ibGib });
            const componentSvc = await getComponentSvc();
            // #endregion init/validate

            /**
             * the point of this function is to populate this and make it active
             */
            let childInfo = await this.getLoadedChildInfo({ addr, ibGib });

            if (childInfo.active) {
                console.log(`${lc} same tab already active. returning early. childInfo.addr: ${childInfo.addr} (user just clicked on the same tab) (I: e67c0d02f3143c49c7a20c82d0730225)`);
                return; /* <<<< returns early */
            }

            // at this point, we are guaranteed to have a non-active childInfo, so
            // deactivate the old, and activate the new
            const currentlyActive = this.activeChildInfo;
            if (currentlyActive) {
                currentlyActive.childBtnEl.classList.remove('active');
                currentlyActive.active = false;
                contentEl.innerHTML = '';
            }

            // activate the new tab
            childInfo.childBtnEl.classList.add('active');
            childInfo.childBtnEl.scrollIntoView({ behavior: 'smooth' });

            childInfo.active = true;

            let gib = getIbAndGib({ ibGibAddr: addr }).gib;
            let gibInfo = getGibInfo({ gib });
            let tjpGib = gibInfo.tjpGib ?? gib;
            function tabInfoSharesTjpGib(tabInfo: TChildInfo): boolean {
                let tabGib = getIbAndGib({ ibGibAddr: tabInfo.addr }).gib;
                let tabGibInfo = getGibInfo({ gib: tabGib });
                let tabTjpGib = tabGibInfo.tjpGib ?? tabGib;
                return tabTjpGib === tjpGib;
            }
            // if (!this.childInfos.some(x => x.addr === childInfo.addr)) {
            if (!this.childInfos.some(x => tabInfoSharesTjpGib(x))) {
                this.childInfos.push(childInfo);
            }
            if (!childInfo.component) { throw new Error(`(UNEXPECTED) childInfo.component falsy? should be populated by this point in code (E: 77abfd1e8cd395605d46716bd087fb25)`); }
            await componentSvc.inject({
                parentEl: contentEl,
                componentToInject: childInfo.component,
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected abstract addChild({
        addr,
        ibGib,
    }: {
        ibGib: IbGib_V1,
        addr?: IbGibAddr,
    }): Promise<HTMLElement>;

}

export abstract class IbGibDynamicComponentInstanceBase_ParentOfTabs<TSettings extends IbGibSettings & SettingsWithTabs, TIbGib extends IbGib_V1 = IbGib_V1, TElements extends ElementsBase = any, TChildInfo extends ChildInfoBase<any> = ChildInfoBase<any>>
    extends IbGibDynamicComponentInstanceBase_Parent<TIbGib, TElements, TChildInfo> {
    protected lc: string = `[${IbGibDynamicComponentInstanceBase_ParentOfTabs.name}]`;

    public get isBusy(): boolean {
        // add other things to indicate busy
        return this._reloadingTabs;
    }

    protected abstract get settingsType(): SettingsType;

    protected _reloadingTabs = false;
    protected get reloadingTabs(): boolean { return this._reloadingTabs; }
    protected set reloadingTabs(value: boolean) {
        const valueIsDifferent = value !== this._reloadingTabs;
        this._reloadingTabs = value;
        if (valueIsDifferent) {
            this.renderUI_busy(); // spins off
        }
    }

    protected async closeTab({ ibGib }: { ibGib: IbGib_V1 }): Promise<void> {
        const lc = `${this.lc}[${this.closeTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e0d5f8ed67b8a7f43822fa3843fd4525)`); }
            const addrToClose = getIbGibAddr({ ibGib });
            const tjpAddrToClose = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            if (!tjpAddrToClose) { throw new Error(`(UNEXPECTED) tjpAddr false after incomingAddr default? ibGib: ${pretty(ibGib)} (E: 707988b4d22a27c1287aa5a815d88825)`); }
            const tabInfoToClose = await this.getLoadedChildInfo({ addr: addrToClose, ibGib });

            // if it's active, activate the tab to the left/right?

            // remove from project open tabs in settings for project ibgib
            // let projectSettings = await this.getCurrentProjectSettings();
            const settings_current = await this.getSettings<TSettings>({
                settingsType: this.settingsType,
                useCase: 'current',
            });
            if (!settings_current) { throw new Error(`(UNEXPECTED) settings_current falsy for this project? this.ibGib: ${pretty(this.ibGib)} (E: ecea08dcacd198bb38cc44a860cc6825)`); }

            if (!settings_current.openChildTjpAddrs.includes(tjpAddrToClose)) {
                throw new Error(`${lc} (UNEXPECTED) projectSettings didn't have the tjpAddr (${tjpAddrToClose})? projectSettings: ${pretty(settings_current)} (E: genuuid)`);
            }
            let newOpenChildTjpAddrs = settings_current.openChildTjpAddrs.filter(x => x !== tjpAddrToClose);
            let newActiveChildTjpAddr: TjpIbGibAddr | undefined = undefined;
            // settings_current.openChildTjpAddrs.push(tjpAddrToClose); // ????
            if (settings_current.activeChildTjpAddr === tjpAddrToClose) {
                // get the addr just before the current one that we're closing.
                // if it doesn't exist, use the project's tjpAddr.
                if (newOpenChildTjpAddrs.length > 0) {
                    // this implies that the old openChildTjpAddrs.length >= 2
                    let newIndex = settings_current.openChildTjpAddrs.indexOf(tjpAddrToClose) - 1;
                    if (newIndex < 0) { newIndex = 0; }
                    newActiveChildTjpAddr = settings_current.openChildTjpAddrs.at(newIndex);
                } else {
                    newActiveChildTjpAddr = this.tjpAddr!;
                    newOpenChildTjpAddrs.push(this.tjpAddr!);
                }
            }
            const sectionName_current = await getSectionName({
                settingsType: this.settingsType,
                useCase: 'current',
            });
            const newSectionSettings = {
                ...settings_current,
                openChildTjpAddrs: newOpenChildTjpAddrs,
            };
            // if (!!newActiveChildTjpAddr) {
            //     newProjectSettings.activeChildTjpAddr = newActiveChildTjpAddr;
            // }
            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const _newSettings = await mut8Timeline({
                timeline: this.settings!.ibGib!,
                metaspace,
                mut8Opts: {
                    dataToAddOrPatch: {
                        sections: {
                            [sectionName_current]: newSectionSettings,
                        }
                    },
                },
            });

            if (tabInfoToClose.active) {
                await this.activateIbGib({ addr: newActiveChildTjpAddr });
            }

            // physically remove component/tab btn
            this.childInfos = this.childInfos.filter(x => x.addr !== tabInfoToClose.addr);
            await this.removeTabBtn({ tabInfo: tabInfoToClose });
            // this.elements!.headerTabsEl!.removeChild(tabInfo.childBtnEl);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected abstract removeTabBtn({
        tabInfo,
    }: {
        tabInfo: TChildInfo,
    }): Promise<void>;

    protected async reopenOldTabs(): Promise<void> {
        const lc = `${this.lc}[${this.reopenOldTabs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 195e7d34b3f8b761aa78dd384011f825)`); }

            // let settings = await this.getCurrentProjectSettings();
            const settings = await this.getSettings<TSettings>({
                settingsType: this.settingsType,
                useCase: 'current',
            });
            if (!settings) { throw new Error(`(UNEXPECTED) settings falsy? these should be initialized before now. (E: 2003ab77e01448d638216fc82aff5f25)`); }

            this.reloadingTabs = true;
            await this.renderUI_busy();
            let currentChildTjpAddr: IbGibAddr | undefined;
            try {
                for (const childTjpAddr of settings.openChildTjpAddrs) {
                    // slow kluge I think...maybe it's ok I dunno.
                    currentChildTjpAddr = childTjpAddr;
                    await this.activateIbGib({ addr: childTjpAddr });
                }
            } catch (error) {
                console.error(`${lc} error during activating child ibGib tabs. childTjpAddr: ${currentChildTjpAddr ?? '[unset?]'} (E: 0396b2e24d08f42ac94510bb718a1725)`);
                throw error;
            } finally {
                this.reloadingTabs = false;
            }

            // not reloading, so now we can activate the recently active one
            await this.activateIbGib({ addr: settings.activeChildTjpAddr });

            // await this.activateLensMode({ lensMode: settings.lensMode, skipInject: false });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}
