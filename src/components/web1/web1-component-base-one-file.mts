import { delay, extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { createCommentIbGib } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
import { getTjpAddr, toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

import { GLOBAL_LOG_A_LOT, HARDCODED_PROMPT_TAG_TEXT } from "../../constants.mjs";
import { getAppShellSvc } from "../../ui/shell/app-shell-service.mjs";
import { CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT } from "../../witness/app/blank-canvas/blank-canvas-constants.mjs";
import { AgentWitnessAny, getAddlMetadataTextForAgentText, taggifyForPrompt, } from "../../witness/agent/agent-one-file.mjs";
import { getGlobalMetaspace_waitIfNeeded, getIbGibGlobalThis_BlankGib, highlightElement, unhighlightElement } from "../../helpers.web.mjs";
import { TextSource } from "../../witness/agent/agent-constants.mjs";
import { AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT, } from "../../agent-texts/primary-agent-texts.mjs";
import { LiveProxyIbGib } from "../../witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";
import { getAgentsSvc } from "../../witness/agent/agents-service-v1.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "../../ui/component/ibgib-dynamic-component-bases.mjs";
import { FnHandleRouteType, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "../../ui/component/component-types.mjs";
import { appendToTimeline } from "../../api/timeline/timeline-api.mjs";
import { AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT } from "../../witness/agent/agent-one-file.app.mjs";

const logalot = GLOBAL_LOG_A_LOT;


export abstract class Web1ComponentMetaBase
    extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${Web1ComponentMetaBase.name}]`;

    /**
     * @see {@link IbGibDynamicComponentMeta.componentName}
     */
    componentName: string = this.getComponentName();

    /**
     * @see {@link IbGibDynamicComponentMeta.routeRegExp}
     */
    routeRegExp?: RegExp = undefined;

    /**
     * @see {@link IbGibDynamicComponentMeta.fnHandleRoute}
     */
    fnHandleRoute?: FnHandleRouteType = undefined;

    /**
     * @see {@link IbGibDynamicComponentMeta.componentName}
     */
    protected abstract getComponentName(): string;
        protected abstract getHtml(): string;
    protected abstract getCss(): string[] | undefined;


    /**
     * override this with the `customElements.define` call that will register
     * the web component.
     *
     * @example
     *
     * customElements.define(this.componentName, Web1ComponentInstance_Funding);
     */
    protected abstract registerCustomElements(): void;

    /**
     *
     */
    constructor() {
        super();
        this.registerCustomElements();
    }


    /**
     * creates the instance of a web1 funding.html component.
     *
     * note that since this is web 1.0, this doesn't really use the incoming
     * args, but that other more ibgib-related components may do so.
     */
    async createInstance({
        path,
        ibGibAddr,
    }: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: baf75543b6da9f117ae76fc76703fd25)`); }
            const component = document.createElement(this.componentName) as IbGibDynamicComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: this.getHtml(),
                css: this.getCss(),
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

export abstract class Web1ComponentInstanceBase
    extends IbGibDynamicComponentInstanceBase
    implements IbGibDynamicComponentInstance<IbGib_V1, any> {
    protected override lc: string = `[${Web1ComponentInstanceBase.name}]`;

    // protected abstract _getName(): string;

    // get name(): string { return this._getName(); }

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b3964c3b9f3f5100870f1106226eb325)`); }
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
        console.log(`${lc} created (I: 3a2fe4eea594c46f8f84374461e12f25)`);
        delay(4000).then(async () => { await this.unblurAsides(); });
        await this.setBreadcrumbs();
        while (!getIbGibGlobalThis_BlankGib().bootstrapPromise) {
            await delay(30);
            console.log(`${lc} waiting for bootstrapPromise to be truthy, let alone complete.`);
        }
        await getIbGibGlobalThis_BlankGib().bootstrapPromise;
        this.agentsInitialized = this.initAgents(); // spins off but we await
        // we are awaiting because this was screwing up local space special
        // ibgib indexes because it was running in parallel with bootstrap
        await this.agentsInitialized;
    }

    private async initInput(): Promise<void> {
        const lc = `${this.lc}[${this.initInput.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 478954ef685613d2217601dfa2deae25)`); }

            const appShellSvc = getAppShellSvc();
            await appShellSvc.initialized;
            while (!appShellSvc.inputComponent) {
                console.log(`${lc} appShellSvc.inputComponent falsy. waiting until it's created. (I: b045c1f5ba4a94a66178ecbeec70c725)`);
                await delay(100);
            }

            // make the call to update the input component
            await appShellSvc.inputComponent!.setContextInfo({
                info: {
                    agent: this.agent,
                    placeholderText: CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT,
                    // default to default local user space for now
                    spaceId: undefined,
                    contextProxyIbGib: this.ibGibProxy,
                },
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * inits the chronology in the right panel for web1 components
     */
    private async initChronology(): Promise<void> {
        const lc = `${this.lc}[${this.initChronology.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const globalIbGib = getIbGibGlobalThis_BlankGib();
            let chronologysComponent = globalIbGib.chronologysComponent;

            let count = 0;
            while (!chronologysComponent) {
                console.warn(`${lc} global chronologysComponent is expected to be truthy by now. delaying (W: genuuid)`)
                count++;
                if (count > 100) {
                    debugger; // error in web1 component expectation
                    throw new Error(`(UNEXPECTED) global chronologysComponent is falsy? (E: 3d68459066ee7ef9fbdfea4ea3904825)`);
                }
                await delay(100);
            }

            if (!this.ibGibProxy) { throw new Error(`(UNEXPECTED) this.ibGibProxy falsy? (E: 4e91911bf6ce45d398c04a256fceb825)`); }
            // ibGibProxy.ibGib is a comment ibgib that is data.n=2. the 2 is
            // because it is already related to an agent.

            await chronologysComponent.openIbGibAddr({
                ibGibAddr: getIbGibAddr({ ibGib: this.ibGibProxy.ibGib }),
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * web1 components use the primary agent
     */
    protected override async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: bb6228de92a7552ff389cec83f9a0825)`); }

            getGlobalMetaspace_waitIfNeeded().then(async (metaspace) => {
                let agent: AgentWitnessAny | undefined = undefined;
                const agentsSvc = getAgentsSvc();
                do {
                    let agents = await agentsSvc.getAgents({
                        metaspace,
                        type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                        spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
                    });
                    if (agents.length > 0) {
                        agent = agents.at(0)!;
                    } else {
                        await delay(200);
                    }
                } while (!agent);

                this.agents = [agent];
                if (!this.agent) { throw new Error(`(UNEXPECTED) this.agent falsy just after loading? (E: cc4f770e59d771a13411d32aa42ccd25)`); }

                await this.initProxyIbGib();
                await this.initInput(); // footer
                await this.initChronology(); // right panel
                if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy even though we just initialized proxy ibgib? (E: f2b1093291e30d420c3f5909b9d0d125)`); }
                await agent.updateAvailableFunctions({
                    availableFunctions: AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT,
                });
                await agent.setActiveContext({
                    contextIbGib: this.ibGib,
                });
                const contextTjpAddr = getTjpAddr({ ibGib: this.ibGib });
                await this.agent.addTexts({
                    infos: [
                        {
                            textSrc: TextSource.HARDCODED,
                            text: taggifyForPrompt({
                                contentText: `Current URL path: "${window.location.href.substring((window.location.protocol + '//' + window.location.host).length) || "/"}".\nCurrent web 1.0 context ibgib tjp address: ${contextTjpAddr}`,
                                tagText: HARDCODED_PROMPT_TAG_TEXT,
                            }),
                        }
                    ]
                });
                // await this.agent.doPrompt(); // this will not await any subsequent function calls made by the agent.
            }); // spin off

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * at this point, this.agent is set
     */
    protected async initProxyIbGib(): Promise<void> {
        const lc = `${this.lc}[${this.initProxyIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8e7885645d473e564c524657644e9425)`); }
            if (!this.agent) { throw new Error(`(UNEXPECTED) this.agent falsy? this is assumed to be populated at this point. (E: dbe35604778c4049f5f8ef6a0f660f25)`); }

            const ibgibGlobalThis = getIbGibGlobalThis_BlankGib();
            if (!ibgibGlobalThis.web1CommentIbGibProxy) {
                // initialize a new comment as the ibgib context for all web1 interactions
                const metaspace = await getGlobalMetaspace_waitIfNeeded();
                const space = await metaspace.getLocalUserSpace({ lock: false }); // default space

                // need to create/load an agent for the comment

                // let agent: AgentWitnessAny;
                // const agentsSvc = getAgentsSvc();
                // const agents = await agentsSvc.getAgents({
                //     metaspace,
                //     type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                //     space,
                // });
                // if (agents.length === 0) {
                //     // no agents so create one

                //     agent = await agentsSvc.createNewAgent({
                //         metaspace,
                //         superSpace: space, // uses default local user space as the super space
                //         name: `PrimaryAgent-${this.instanceId}`,
                //         api: 'gemini',
                //         model: GeminiModel.GEMINI_2_0_FLASH,
                //         availableFunctions: clone(AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT),
                //         initialSystemText: [
                //             AGENT_INITIAL_SYSTEM_TEXT_PRIMARYAGENT,
                //         ].join('\n'),
                //         initialChatText: [
                //             AGENT_INITIAL_CHAT_TEXT_PRIMARYAGENT
                //         ].join('\n'),
                //         fnGetAPIKey: getIbGibGlobalThis_BlankGib().fnDefaultGetAPIKey,
                //         type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                //         addToAgentsTag: true,
                //     });
                // } else {
                //     agent = agents[0];
                // }
                const agentAddr = getIbGibAddr({ ibGib: this.agent });

                // create the new comment
                const resCommentIbGib = await createCommentIbGib({
                    text: 'This is a web 1 context.',
                    addlMetadataText: getAddlMetadataTextForAgentText({
                        textSrc: 'hardcoded',
                    }),
                    saveInSpace: true,
                    space,
                });
                const commentIbGib = resCommentIbGib.newIbGib;
                await metaspace.registerNewIbGib({ ibGib: commentIbGib, space });

                // associate to the comment
                const latestCommentIbGib = await appendToTimeline({
                    timeline: toDto({ ibGib: commentIbGib }),
                    metaspace,
                    rel8nInfos: [{ rel8nName: 'comment', ibGibs: [commentIbGib], }],
                    space,
                });
                // const resRel8 = await rel8({
                //     type: 'rel8',
                //     src: toDto({ ibGib: commentIbGib }),
                //     rel8nsToAddByAddr: {
                //         [AGENT_REL8N_NAME]: [agentAddr],
                //     },
                //     dna: true,
                //     nCounter: true,
                // }) as TransformResult<CommentIbGib_V1>;
                // const newCommentIbGib = resRel8.newIbGib;
                // await metaspace.persistTransformResult({
                //     resTransform: resRel8,
                //     space,
                // });
                // await metaspace.registerNewIbGib({
                //     ibGib: newCommentIbGib,
                //     space,
                // });
                // latestCommentIbGib = newCommentIbGib;

                // create the proxy
                const proxy = new LiveProxyIbGib();
                await proxy.initialized;
                await proxy.setWrappedIbGib({ ibGib: latestCommentIbGib });

                // set the global comment proxy
                ibgibGlobalThis.web1CommentIbGibProxy = proxy;
            }
            if (!ibgibGlobalThis.web1CommentIbGibProxy) {
                throw new Error(`(UNEXPECTED) ibgibGlobalThis.web1CommentIbGibProxy falsy? we just should have initialized it (E: 596f92ead59186c374e36e1356924925)`);
            }
            const proxy = ibgibGlobalThis.web1CommentIbGibProxy;
            this.ibGibProxy = proxy;
            this.ibGibAddr = getIbGibAddr({ ibGib: proxy.ibGib });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async setBreadcrumbs(): Promise<void> {
        const lc = `${this.lc}[${this.setBreadcrumbs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b18e0977f9213dca453689fa75326b25)`); }

            let appShellSvc = getAppShellSvc();
            appShellSvc.initialized.then(async () => {
                try {
                    const { breadcrumbComponent } = appShellSvc;
                    if (!breadcrumbComponent) { throw new Error(`(UNEXPECTED) breadcrumbComponent is falsy? (E: 1d5b0148882b0a7f68aab9198ddf7925)`); }
                    if (!this.meta) { throw new Error(`(UNEXPECTED) this.meta falsy? (E: f85649a6574eb111078faeca6dea5325)`); }
                    await breadcrumbComponent.addBreadcrumb({
                        info: {
                            text: this.meta.componentName.replace('web1-', '').replace('-component', ''),
                            type: 'web1',
                            fnClickAction: () => Promise.resolve(), // do nothing
                        },
                        clear: true,
                    });
                } catch (error) {
                    console.error(`${lc} couldn't set breadcrumbs for web1 component. (E: 5d255d9c91fdc126a46884cc74fada25)`);
                }
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        console.log(`${lc} destroyed (I: 385596be521e5e859317324c9703e725)`);
    }

    async unblurAsides(): Promise<void> {
        const lc = `[${this.unblurAsides.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b7a52438e3a3b656d2b75a71bf94ac25)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot is falsy? (E: 1d5b0148882b0a7f68aab9198ddf7925)`); }
            const asideElements = this.shadowRoot.querySelectorAll('.web1-page aside'); // Get aside element

            console.log(`${lc} asideElements.length: ${asideElements.length} (I: d04f31d8cff89078ebec56f8994c5f25)`);

            /**
             * we want to focus one element at a time and have a delay in
             * between them. So if two asides are on the screen at the same
             * time, we want to stagger unblurring. So this is like a lock to do
             * that.
             */
            let focusOneAtATime_focusing = false;
            let focusQueue: HTMLElement[] = [];
            /**
             * indirect helper fn needed to get focusOneAtATime_focusing working
             * right.
             */
            async function changeFocus({
                el,
                toUnblur,
                delayMs = 1000,
            }: {
                el: HTMLElement,
                toUnblur: boolean,
                delayMs?: number,
            }): Promise<void> {
                delayMs ??= 1000;
                while (focusOneAtATime_focusing) { await delay(delayMs); }
                if (toUnblur) {
                    if (el.classList.contains('unblurred')) {
                        return; /* <<<< returns early */
                    }
                    focusOneAtATime_focusing = true;
                    await delay(1000);
                    el.classList.add('unblurred');
                    await highlightElement({ el });
                    focusOneAtATime_focusing = false;
                } else {
                    el.classList.remove('unblurred'); // blur the entry
                    await unhighlightElement({ el });
                }
            }
            // no iterator on NodeListOf<Element> so regular for statement.
            // can't forEach for async and ensure order is correct (i think).
            for (let i = 0; i < asideElements.length; i++) {
                const el = asideElements[i] as HTMLElement;
                const observer = new IntersectionObserver(async (entries) => {
                    for (let entry of entries) {
                        await changeFocus({ el, toUnblur: entry.isIntersecting, delayMs: 1000 });
                    }
                }, { threshold: 0.5 });
                observer.observe(el);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
