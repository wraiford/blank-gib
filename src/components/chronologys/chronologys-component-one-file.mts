import thisHtml from './chronologys.html';
import thisCss from './chronologys.css';
import stylesCss from '../../styles.css';
import rootCss from '../../root.css';

import { delay, extractErrorMsg, getSaferSubstring, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { getGibInfo, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { IbGibTimelineUpdateInfo } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
import { execInSpaceWithLocking } from "@ibgib/core-gib/dist/witness/space/space-helper.mjs";
import { mut8Timeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
import { getDeterministicColorInfo, } from "@ibgib/web-gib/dist/helpers.mjs";
import { shadowRoot_getElementById } from '@ibgib/web-gib/dist/helpers.web.mjs';
import { tellUserFunctionInfo } from '@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs';
import {
    IbGibDynamicComponentInstanceBase_ParentOfTabs, IbGibDynamicComponentMetaBase
} from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts, ChildInfoBase
} from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { getComponentSvc } from "@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs";
import { getGlobalMetaspace_waitIfNeeded, } from "@ibgib/web-gib/dist/helpers.mjs";
import { AgentWitnessAny, } from "@ibgib/web-gib/dist/witness/agent/agent-one-file.mjs";
import { getAgents } from "@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs";
import { getAgentsSvc } from "@ibgib/web-gib/dist/witness/agent/agents-service-v1.mjs";
import { GeminiModel } from "@ibgib/web-gib/dist/witness/agent/gemini/gemini-constants.mjs";
import { isProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-helper.mjs";
import { SettingsType } from "@ibgib/web-gib/dist/common/settings/settings-constants.mjs";
import { getDefaultSettings, getSectionName } from "@ibgib/web-gib/dist/common/settings/settings-helpers.mjs";
import { Settings_Chronologys } from "@ibgib/web-gib/dist/common/settings/settings-types.mjs";
import {
    AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT,
    AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT,
} from "@ibgib/web-gib/dist/common/project/project-constants.mjs";

import { GLOBAL_LOG_A_LOT, } from "../../constants.mjs";
import { getComponentCtorArg, getDefaultFnGetAPIKey, getIbGibGlobalThis_BlankGib, } from "../../helpers.web.mjs";
import {
    AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF,
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
} from "../../agent-texts/common-agent-texts.mjs";
import { CHRONOLOGY_COMPONENT_NAME, ChronologyComponentInstance } from "../common/chronology/chronology-component-one-file.mjs";
import { simpleIbGibRouterSingleton } from "../../ui/router/router-one-file.mjs";
import { getAppShellSvc } from "../../ui/shell/app-shell-service.mjs";
import { CHAT_WITH_AGENT_PLACEHOLDER_AGENT } from "../../witness/app/blank-canvas/blank-canvas-constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

/**
 * hackish way to store info
 */
// export const OPEN_CHRONOLOGYS_ADDRS_KEY = 'open-chronology-addrs';

export const AGENT_SPECIAL_IBGIB_TYPE_CHRONOLOGYSAGENT = 'chronologysagent';
export const AGENT_AVAILABLE_FUNCTIONS_CHRONOLOGYSAGENT = [
    tellUserFunctionInfo,
    // ...RenderAgentFunctionInfos,
];

export const AGENT_GOAL_CHRONOLOGYSAGENT = [
    `In general, your goal is just to do your best to parse the chat texts and choose the best course of action in terms of one or more functions. Please refer to those available function schemas and descriptions.`,
    `Usually, you will want to talk with them via the tell user function.`,
    `As a chronologies agent, your job is mainly to act upon chronology views. These are views that show a linear timeline of an ibgib.`,
    `An example of a linear timeline is like a chat or a log view. Since ibgibs create a hypergraph, where nodes can link to multiple other nodes even with the same named edge, this can explode. But a linear timeline that selects certain link paths can be very useful.`,
    `Your job will not be to do that part, rather, your job is to manage other individual chronology view components that do that.`,
].join('\n');

export const AGENT_INITIAL_SYSTEM_TEXT_CHRONOLOGYSAGENT = [
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
    AGENT_GOAL_CHRONOLOGYSAGENT,
].join('\n');

export const CHRONOLOGYS_COMPONENT_NAME: string = 'ibgib-chronologys';

export class ChronologysComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ChronologysComponentMeta.name}]`;

    routeRegExp?: RegExp = new RegExp(CHRONOLOGYS_COMPONENT_NAME);

    componentName: string = CHRONOLOGYS_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, ChronologysComponentInstance);
    }

    async createInstance({
        path,
        ibGibAddr
    }: {
        /**
         * todo: store this in the instance (i think) but will change this when needed
         */
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7ead79dd8262702783917c6972182d25)`); }
            const component = document.createElement(this.componentName) as ChronologysComponentInstance;
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

interface ChronologysElements extends ElementsBase {
    headerEl: HTMLElement;
    headerTabsEl: HTMLElement;
    /**
     * container element for the projects component
     */
    contentEl: HTMLElement;
    footerEl: HTMLElement;
    // addProjectBtnEl: HTMLElement | undefined;
}

/**
 * helper interface for managing tabs and their associated ibgibs
 */
interface ChronologyTabInfo extends ChildInfoBase<ChronologyComponentInstance> {
}

export class ChronologysComponentInstance
    extends IbGibDynamicComponentInstanceBase_ParentOfTabs<Settings_Chronologys, IbGib_V1, ChronologysElements, ChronologyTabInfo>
    implements IbGibDynamicComponentInstance<IbGib_V1, ChronologysElements> {
    protected override lc: string = `[${ChronologysComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    protected get settingsType(): SettingsType {
        return SettingsType.chronologys;
    }

    // private _reloadingTabs = false;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c05cb7a3cb49cf800e23df2f31edb225)`); }
            // before any initialization, we want to ensure we are bootstrapped
            // await getIbGibGlobalThis_BlankGib().bootstrapPromise; // this is in the super call now

            if (!this.metaspace) {
                // wait for the metaspace to be initialized
                this.metaspace = await getGlobalMetaspace_waitIfNeeded({ delayIntervalMs: 50 });
            }

            if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: opts.ibGibAddr }).gib })) {
                const info = await simpleIbGibRouterSingleton.getCurrentPathInfo();
                opts.ibGibAddr = getIbGibAddr({ ib: info.ib, gib: info.gib });
            }

            await super.initialize(opts);
            this.agentsInitialized = this.initAgents(); // spins off
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
            if (logalot) { console.log(`${lc} starting... (I: 9b8a21e39584a6d78c97005785040d25)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;
            // does nothing atow
            await this.initElements();
            if (!this.elements) { throw new Error(`(UNEXPECTED) just initElements but this.elements falsy? (E: 753716ab06183a7787bf3ad649268e25)`); }

            const { } = this.elements;

            await this.agentsInitialized;

            // if we have a primitive ibgib addr
            const { gib } = getIbAndGib({ ibGibAddr: this.ibGibAddr });
            if (isPrimitive({ gib })) {
                if (this.ibGibAddr.includes('.html')) {
                    // we're on a web1 page
                    let web1CommentIbGib: IbGib_V1 | undefined = undefined;
                    let counter = 0;
                    do {
                        const { web1CommentIbGibProxy } = getIbGibGlobalThis_BlankGib();
                        if (web1CommentIbGibProxy) {
                            web1CommentIbGib = web1CommentIbGibProxy.ibGib;
                        }
                        if (web1CommentIbGib) {
                            break;
                        } else {
                            await delay(100);
                            counter++;
                            if (counter > 100) {
                                throw new Error(`(UNEXPECTED) couldn't init chronologys web1 comment after 10 seconds? we're assuming this is just waiting on the global web1 comment to be created/set. (E: fef57e0abdd891783af56f586d200825)`);
                            }
                        }
                    } while (!web1CommentIbGib);
                    this.ibGibAddr = getIbGibAddr({ ibGib: web1CommentIbGib });
                } else {
                    console.warn(`${lc} this.ibGib is primitive, so what are we initializing settings for? (W: 9915089019b81c6935b32ae877095825)`);
                    return; /* <<<< returns early */
                }
            }

            await this.loadIbGib();
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy after loadIbGib called? (E: ed266a3c51d12a6dedba8ad31c024425)`); }
            if (isProjectIbGib_V1(this.ibGib)) {
                // load project
                this.activateIbGib({ ibGib: this.ibGib }); // spin off because it requires created to finish
            } else {
                this.activateIbGib({ ibGib: this.ibGib }); // spin off because it requires created to finish
            }

            await this.initSettings();

            // spin off because created has to finish
            // const projectSettings = await this.getCurrentProjectSettings();
            const chronologysSettings = await this.getSettings<Settings_Chronologys>({
                settingsType: SettingsType.chronologys,
                useCase: 'current',
            });
            if ((chronologysSettings?.openChildTjpAddrs ?? []).length === 0) {
                // first run
                // do nothing
                // this.showProjectInfoTab();
            } else {
                // not first run, so just reopen the old tabs
                this.reopenOldTabs();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async initSettings(): Promise<void> {
        const lc = `${this.lc}[${this.initSettings.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c84688efbfd822966623d738f3456825)`); }

            // ensure the settings exists for this ibgib
            await super.initSettings();
            let chronologysSettings = await this.getSettings<Settings_Chronologys>({
                settingsType: SettingsType.chronologys,
                useCase: 'current',
            });
            if (chronologysSettings) {
                if ((chronologysSettings as any).activeAddr) {
                    // migrate
                    const existing = chronologysSettings as any;

                    chronologysSettings = await getDefaultSettings<Settings_Chronologys>({ settingsType: SettingsType.chronologys });
                    chronologysSettings.activeChildTjpAddr = existing.activeAddr;
                    chronologysSettings.openChildTjpAddrs = existing.openAddrs;
                    await this.updateSettings<Settings_Chronologys>({
                        settingsType: SettingsType.chronologys,
                        useCase: 'current',
                        newSectionInfo: chronologysSettings,
                    });
                }
                // reload previously open chronology components

                // this happens after initSettings in created() handler using
                // reopenOldTabs method

                // setTimeout(async () => {
                //     if (chronologysSettings) {
                //         for (const addr of chronologysSettings.openChildTjpAddrs) {
                //             await this.openIbGibAddr({ ibGibAddr: addr });
                //         }
                //     } else {
                //         debugger; // error?
                //     }
                // }, 100);
            } else {
                // first run
                chronologysSettings = await getDefaultSettings<Settings_Chronologys>({ settingsType: SettingsType.chronologys });
                chronologysSettings.activeChildTjpAddr = this.tjpAddr ?? this.ibGibAddr;
                // chronologysSettings.openChildTjpAddrs = [this.ibGibAddr];
                chronologysSettings.openChildTjpAddrs = [this.tjpAddr ?? this.ibGibAddr];
                await this.updateSettings<Settings_Chronologys>({
                    settingsType: SettingsType.chronologys,
                    useCase: 'current',
                    newSectionInfo: chronologysSettings,
                });

            }

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
            if (logalot) { console.log(`${lc} starting... (I: 615c03656d27356cda96ed4f5285d925)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Loads the ibGib if only addr is provided.
     *
     * Then manages the UI:
     *
     * - If a tab is already created for the ibgib and active, then does nothing.
     * - If it's already created but inactive, then activates tab and loads content
     * - if no tab, then creates it, activates it, loads content.
     *
     * To do this, it creates/hydrates a {@link ChronologyTabInfo} and activates
     * it.
     *
     * @see {@link ChildInfoBase.active}
     * @see {@link activeChildInfo}
     */
    public override async activateIbGib({
        addr,
        ibGib,
    }: {
        addr?: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 65b042ad19c214f27189db1f26b60d25)`); }
            const metaspace = this.metaspace ?? await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldnt get default local user space? (E: a6b75f4d02f82916282acc786d65a525)`); }
            const spaceId = space.data!.uuid!;

            const fn = async () => {
                await super.activateIbGib({ addr, ibGib });

                addr ??= getIbGibAddr({ ibGib });

                // set the color of the

                // debugger; // what is this value?
                // terrible fng hack to get the tab to be the same color. I'm so
                // tired
                let borderColor: string | undefined = undefined;
                let interval = setInterval(() => {
                    borderColor = this.activeChildInfo?.component?.style.getPropertyValue('--tjp-color');
                    if (borderColor) {
                        this.activeChildInfo!.childBtnEl.style.borderColor = borderColor;
                        clearInterval(interval);
                    }
                }, 100);

                // set the input to correspond to the

                const childTabInfo = await this.getLoadedChildInfo({ addr, ibGib });
                if (!childTabInfo.component) { throw new Error(`(UNEXPECTED) childTabInfo.component falsy? (E: 4d0db9333908041bc862fbe84799f825)`); }
                ibGib ??= childTabInfo.component.ibGib;

                const appShellSvc = getAppShellSvc();
                await appShellSvc.inputComponent!.setContextInfo({
                    info: {
                        agent: childTabInfo.agent,
                        placeholderText: CHAT_WITH_AGENT_PLACEHOLDER_AGENT,
                        contextProxyIbGib: childTabInfo.component.ibGibProxy,
                        // default to default local user space for now
                        spaceId,
                    },
                });

                // update the opened child tab info's agent available functions.
                // i'm not quite sure where to put this, but in this particular
                // use case it needs to be here.

                if (childTabInfo.agent) {
                    if (!ibGib) {
                        debugger; // chronologys activateIbGib ibGib falsy?
                        throw new Error(`(UNEXPECTED) ibGib falsy? (E: eca328378f668c41b13f69a3f9250825)`);
                    }
                    // available functions
                    if (isProjectIbGib_V1(ibGib!)) {
                        await childTabInfo.agent.updateAvailableFunctions({
                            availableFunctions: AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT,
                        });
                    } else {
                        // this can't be right but ...
                        await childTabInfo.agent.updateAvailableFunctions({
                            availableFunctions: AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT,
                        });
                    }
                } else {
                    console.error(`${lc} not sure if it's an error, but childTabInfo.agent is falsy? well, we can't update its available functions (E: bb29b8d0271889ba78606828b531e225)`)
                }

            };

            // instead of locking, i need to just change this to a
            // most-recent-wins queue
            await execInSpaceWithLocking({
                fn,
                scope: lc,
                secondsValid: 30,
                space,
                callerInstanceId: this.instanceId,
                maxDelayMs: 30_000,
                maxLockAttempts: 1_000,
            });

            if (!ibGib) {
                const resGet = await this.metaspace?.get({ addrs: [addr!], });
                if (!resGet || resGet.errorMsg || (resGet.ibGibs ?? []).length !== 1) {
                    throw new Error(`couldn't get addr (${addr}) from default local user space. wrong space? i need to figure out how I want the project space handled still (atow 06/2025) (E: 35cc487c5009b4628156573d47817425)`);
                }
                ibGib = resGet.ibGibs![0];
            }
            addr ??= getIbGibAddr({ ibGib });
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            if (!tjpAddr) { throw new Error(`(UNEXPECTED) tjpAddr falsy? 'incomingAddr' was used as the default option. (E: fb8491546c48bc66f8d55e2a9e891325)`); }

            if (this._reloadingTabs) {
                // we are loading the current child ibgib tabs and we shouldn't
                // do any updating tothe settings
                console.log(`${lc} just loading ibgib, so nothing further to do here. returning early (I: 3e02683a9f19bc7fddb53068f1a79825)`)
                return; /* <<<< returns early */
            } else {
                const chronologysSettings = await this.getSettings<Settings_Chronologys>({
                    settingsType: SettingsType.chronologys,
                    useCase: 'current',
                });
                if (!chronologysSettings) { throw new Error(`(UNEXPECTED) chronologysSettings falsy? (E: b66b0893bf4481d16bc4787573f36825)`); }

                // we are NOT loading and we should persist this change to
                // settings
                let modified = false;
                if (!chronologysSettings.openChildTjpAddrs.includes(tjpAddr)) {
                    chronologysSettings.openChildTjpAddrs.push(tjpAddr);
                    modified = true;
                }
                if (chronologysSettings.activeChildTjpAddr !== tjpAddr) {
                    chronologysSettings.activeChildTjpAddr = tjpAddr;
                    modified = true;
                }
                if (modified) {
                    const sectionName_current = await getSectionName({
                        settingsType: SettingsType.chronologys,
                        useCase: 'current',
                    });
                    const _newSettings = await mut8Timeline({
                        timeline: this.settings!.ibGib!,
                        metaspace: this.metaspace!,
                        mut8Opts: {
                            dataToAddOrPatch: {
                                sections: {
                                    [sectionName_current]: chronologysSettings,
                                }
                            },
                        },
                    });
                } else {
                    console.warn(`${lc} already activated? should this get this far if we're clicking a tab that's already activated? (W: 4c6d98e8809813a4f8a2075b113cb325)`)
                }


            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public async openIbGibAddr({ ibGibAddr }): Promise<void> {
        const lc = `${this.lc}[${this.openIbGibAddr.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2dc7ba5e8e3f9b6326d61dff666eec25)`); }
            if (isPrimitive({ gib: getIbAndGib({ ibGibAddr }).gib })) {
                await this.activateIbGib({
                    addr: ibGibAddr,
                });
            } else {
                await this.activateIbGib({
                    addr: ibGibAddr,
                });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * @internal
     * gets the project tab info for the given addr.
     *
     * creates and loads the project ibgib component, which itself loads the
     * ibgib internally (or throws) if not already loaded.
     *
     * @returns ChronologyTabInfo with fully loaded component and ibgib.
     *
     * @see {@link ChronologyTabInfo}
     */
    protected override async getLoadedChildInfo({
        addr,
        ibGib,
    }: {
        addr: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<ChronologyTabInfo> {
        const lc = `${this.lc}[${this.getLoadedChildInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a41937087adf2b3b132f48aa94326b25)`); }
            if (!addr) { throw new Error(`(UNEXPECTED) addr falsy? (E: 9ce2130c766a09771678c59a3e4b0425)`); }

            const fnCreateAndLoadChronologyComponent = async () => {
                try {
                    const componentSvc = await getComponentSvc();
                    const component = await componentSvc.getComponentInstance({
                        path: CHRONOLOGY_COMPONENT_NAME,
                        ibGibAddr: addr,
                        useRegExpPrefilter: true,
                    }) as ChronologyComponentInstance | undefined;
                    if (!component) {
                        debugger; // error couldn't create component instance for project?
                        throw new Error(`(UNEXPECTED) component falsy? couldn't create component instance for project? (E: abb22a24dc5cb5463ee3e454e69d3825)`);
                    }
                    await component.loadIbGib();
                    if (!component.ibGib) {
                        debugger; // error couldn't load ibGib for project?
                        throw new Error(`(UNEXPECTED) ibGib falsy? couldn't load ibGib for project? (E: 6e6aea01eaa7b18b0fcec9cdc74ab825)`);
                    }
                    // guaranteed loaded ibGib
                    return component;
                } catch (error) {
                    // debugger; // error in creating chronology component
                    console.error(`${lc}[fnCreateAndLoadChronologyComponent] ${extractErrorMsg(error)}`);
                    throw error;
                }
            }

            /** the point of this function is to populate this */
            let tabInfo: ChronologyTabInfo;

            // first check to see if an existing tab matches by tjp
            let gib = getIbAndGib({ ibGibAddr: addr }).gib;
            let gibInfo = getGibInfo({ gib });
            let tjpGib = gibInfo.tjpGib ?? gib;

            function tabInfoSharesTjpGib(tabInfo: ChronologyTabInfo): boolean {
                let tabGib = getIbAndGib({ ibGibAddr: tabInfo.addr }).gib;
                let tabGibInfo = getGibInfo({ gib: tabGib });
                let tabTjpGib = tabGibInfo.tjpGib ?? tabGib;
                return tabTjpGib === tjpGib;
            }

            if (this.childInfos.some(x => tabInfoSharesTjpGib(x))) {
                const filtered = this.childInfos.filter(x => tabInfoSharesTjpGib(x));
                if (filtered.length !== 1) { throw new Error(`(UNEXPECTED) filtered.length !== 1? (E: d856b4526718cd20ff6037426694d325)`); }
                tabInfo = filtered[0];
                if (tabInfo.component) {
                    // ? component is already created, do we need to do anything else?
                } else {
                    tabInfo.component = await fnCreateAndLoadChronologyComponent();
                    // ibGib = tabInfo.component!.ibGib!;
                }
            } else {
                // tab info does not exist, so create new tab info (requires new
                // component and tab els)
                const component = await fnCreateAndLoadChronologyComponent();
                ibGib = component.ibGib!; // guaranteed in above fn

                // both addr and ibGib guaranteed now
                const childBtnEl = await this.addChild({ addr, ibGib })
                tabInfo = {
                    agent: component.agent,
                    addr,
                    childBtnEl,
                    component,
                    active: false,
                };
                this.childInfos.push(tabInfo);
            }

            return tabInfo;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * creates a new tab element (span atow 03/2025), adds it to the
     * headerTabsEl and returns the new span element.
     *
     * @returns the newly created tab span element
     */
    protected override async addChild({
        addr,
        ibGib,
    }: {
        ibGib: IbGib_V1,
        addr?: IbGibAddr,
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.addChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4f1d5f010a59239ceeb2f2af255a9125)`); }

            // #region init/validate
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 35fe84a0edbfef2ff12f886602006725)`); }
            const { headerTabsEl } = this.elements;

            addr ??= getIbGibAddr({ ibGib });
            if (addr !== getIbGibAddr({ ibGib })) {
                const addr_tjpGib =
                    getGibInfo({ ibGibAddr: addr }).tjpGib ??
                    getIbAndGib({ ibGibAddr: addr }).gib;
                const ibGib_addr = getIbGibAddr({ ibGib });
                const ibGib_tjpGib =
                    getGibInfo({ ibGibAddr: ibGib_addr }).tjpGib ??
                    getIbAndGib({ ibGibAddr: ibGib_addr }).gib;
                if (addr_tjpGib === ibGib_tjpGib) {
                    // same timeline, so ignore it
                    addr = ibGib_addr;
                } else {
                    throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (${addr}) (${ibGib_addr}) (E: 4702e8b8e79292315b22574c9d063925)`);
                }
            }
            const tjpAddr = getTjpAddr({ ibGib });
            // #endregion init/validate

            // create the tab button element
            const childBtnEl = document.createElement('span');
            childBtnEl.id = `chronologys-tab-button-${addr}`;
            childBtnEl.classList.add('panel-tab-button');
            // if (activate) { span.classList.add('active'); }
            this.updateTabTitleAndText({ span: childBtnEl, ibGib });
            const {
                punctiliarColor,
                punctiliarColorTranslucent,
                tjpColor,
                tjpColorTranslucent,
                tjpColorContrast,
                errorMsg
            } = getDeterministicColorInfo({ ibGib, translucentAlpha: 10 });
            if (!errorMsg) {

                // let borderColor: string | undefined = undefined;
                // let interval = setInterval(() => {
                //     borderColor = this.activeChildInfo?.component?.style.getPropertyValue('--tjp-color');
                //     if (borderColor) {
                //         this.activeChildInfo!.childBtnEl.style.borderColor = borderColor;
                //         clearInterval(interval);
                //     }
                // }, 100);

                // happy birthday to me! (ty kelli). May the fifth be wifth you.

                childBtnEl.style.borderColor =
                    tjpColor ?? punctiliarColor;
                childBtnEl.style.backgroundColor =
                    tjpColor ?? punctiliarColor;
                // debugger; // contrast color?
                childBtnEl.style.color =
                    tjpColorContrast ?? tjpColorTranslucent ?? punctiliarColorTranslucent;

                // this.style.setProperty('--ibgib-color', punctiliarColor);
                // this.style.setProperty('--ibgib-color-translucent', punctiliarColor);
                // this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                // this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
            } else {
                // don't set anything
                console.error(`${lc} ${errorMsg} (E: 05fb07200acd505238e35669d19cf225)`);
            }

            // add a close button to the tab button proper, if the tab is not
            // our project tab Project tab is always open atow (06/2025) but
            // this is just because I want to always have a tab open right now,
            // as it simplifies early dev
            if (tjpAddr !== this.tjpAddr) {
                const closeBtnEl = document.createElement('span');
                closeBtnEl.classList.add('close-tab-button');
                closeBtnEl.textContent = '❌'; // or a Font Awesome icon
                childBtnEl.appendChild(closeBtnEl);
                closeBtnEl.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent activating the tab
                    await this.closeTab({ ibGib });
                });
            }

            childBtnEl.addEventListener('click', async () => {
                await this.openIbGibAddr({ ibGibAddr: addr, });
            });

            headerTabsEl.appendChild(childBtnEl);

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: e9f0bfecb8880b9fb84b4dd95aafd825)`); }
            if (!this.metaspace.latestObs) { throw new Error(`(UNEXPECTED) this.metaspace.latestObs falsy? (E: 71d7e8f0ee5c4b400811f0192a319825)`); }
            await this.metaspace.latestObs?.subscribe(fnObs({
                next: async (updateInfo: IbGibTimelineUpdateInfo) => {
                    if (updateInfo.tjpAddr !== tjpAddr) { return; /* <<<< returns early */ }
                    if (updateInfo.latestIbGib) {
                        this.updateTabTitleAndText({ span: childBtnEl, ibGib: updateInfo.latestIbGib })
                    } else {
                        console.error(`{lc}[next] updateInfo.latestIbGib falsy? (E: a8558bdc53889ee07d8d78178328ae25)`);
                    }
                },
                complete: async () => {
                    console.warn(`${lc}[complete] completed executed? (W: a2df080a4f8ef87df5266888109dfe25)`);
                },
                error: async (error) => {
                    debugger; // error in metaspace.latestObs dispatch?
                    console.error(`${lc}[error] ${extractErrorMsg(error)}`);
                },
            }));

            return childBtnEl;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async removeTabBtn({ tabInfo, }: { tabInfo: ChronologyTabInfo; }): Promise<void> {
        this.elements!.headerTabsEl!.removeChild(tabInfo.childBtnEl);
    }

    private updateTabTitleAndText({
        span,
        ibGib,
    }: {
        span: HTMLElement,
        ibGib: IbGib_V1,
    }): void {
        const lc = `[${this.updateTabTitleAndText.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2ceddea7093d27938127cb1fe2c3b225)`); }
            const ibGibAddr = getIbGibAddr({ ibGib });

            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: a64e99f222f2ba84c8852ac8c263fa25)`); }
            if (!ibGib.data.name) { console.warn(`${lc} ibGib.data.name falsy? (W: ab854c8f802179d84463f674e43fec25)`); }
            let title: string;
            if (!ibGib.data.name) {
                // if (ibGib.ib.startsWith('comment --interactive')) {
                if (simpleIbGibRouterSingleton.isCurrentPageWeb1) {
                    // needs to change to look at router
                    console.warn(`${lc} web1 chronologys tab btn title hack. (W: 292af18fc411b6176d8e23e49201ef25)`);
                    title = 'Web1';
                } else {
                    title = 'untitled';
                }
            } else {
                title = ibGib.data.name;
            }
            const desc = ibGib.data.description ?? '';
            span.title = desc ? `${title}\n${desc}` : title;
            const MAX_TAB_TEXT_LENGTH = 12;
            span.textContent = getSaferSubstring({ text: title, length: MAX_TAB_TEXT_LENGTH, });
            if (title.length > MAX_TAB_TEXT_LENGTH) {
                span.textContent += '…';
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async activateTab({
        addr,
        tabSpan,
    }: {
        addr: IbGibAddr,
        tabSpan: HTMLSpanElement,
    }): Promise<void> {
        const lc = `${this.lc}[${this.activateTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e6d0420eb8e31a486859edbf02f97625)`); }
            // if (!this.elementsheaderEl) { throw new Error(`(UNEXPECTED) this.headerEl falsy? (E: cbba6780bb44f801233a7bcf19e4bf25)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 305745140004d907e7174bf10ea1bc25)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: ddbff9ccd2ddb1b281ec9797786cf825)`); }

            const headerEl = shadowRoot_getElementById(this.shadowRoot, 'chronologys-header');

            const busyEl = shadowRoot_getElementById(this.shadowRoot, 'chronologys-header-busy-indicator')

            // headerTabsEl
            const headerTabsEl = this.shadowRoot.getElementById('chronologys-header-tabs') as HTMLElement;
            if (!headerTabsEl) { throw new Error(`(UNEXPECTED) headerTabsEl not found in this.shadowRoot? (E: d5b7651c724d017532777f5dc096da25)`); }

            const contentEl = this.shadowRoot.getElementById('chronologys-content') as HTMLElement;
            if (!contentEl) { throw new Error(`(UNEXPECTED) contentEl not found in this.shadowRoot? (E: 5acf36fbd068fd00ae1a7a1abad5c825)`); }
            const pContent = document.createElement('p');
            pContent.textContent = '[no project loaded...try creating one]';
            // pContent.style.lineHeight = `${contentEl.clientHeight}px`;
            pContent.style.textAlign = 'center';
            pContent.style.fontStyle = 'italic';
            contentEl.appendChild(pContent);

            const footerEl = this.shadowRoot.getElementById('chronologys-footer') as HTMLElement;
            if (!footerEl) { throw new Error(`(UNEXPECTED) footerEl not found in this.shadowRoot? (E: dd2f3f2e1ce805c3f69a4abebc710425)`); }
            footerEl.style.display = 'none';

            this.elements = {
                headerEl, headerTabsEl,
                contentEl,
                footerEl,
                busyEl,
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
            if (logalot) { console.log(`${lc} starting... (I: 2f680c5b3bc502d816b2e13d964d5125)`); }
            // if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 9fca9ad8cb57caeb495f872b58232625)`); }
            // const {} = this.elements;

            this.metaspace = await getGlobalMetaspace_waitIfNeeded();

            let agent: AgentWitnessAny | undefined = undefined;
            let agents = await getAgents({
                metaspace: this.metaspace,
                type: AGENT_SPECIAL_IBGIB_TYPE_CHRONOLOGYSAGENT,
                spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
            });
            if (agents.length > 0) {
                agent = agents.at(0)!;
            } else {
                const agentsSvc = getAgentsSvc();
                agent = await agentsSvc.createNewAgent({
                    metaspace: this.metaspace,
                    superSpace: undefined, // uses default local user space as the super space
                    name: `ChronologysAgent-${this.instanceId}`,
                    api: 'gemini',
                    model: GeminiModel.GEMINI_2_0_FLASH,
                    availableFunctions: [
                        ...AGENT_AVAILABLE_FUNCTIONS_CHRONOLOGYSAGENT,
                    ],
                    initialSystemText: [
                        AGENT_INITIAL_SYSTEM_TEXT_CHRONOLOGYSAGENT,
                    ].join('\n'),
                    initialChatText: [
                        AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF,
                    ].join('\n'),
                    // fnGetAPIKey: this.getFnGetAPIKey(),
                    fnGetAPIKey: getDefaultFnGetAPIKey(),
                    type: AGENT_SPECIAL_IBGIB_TYPE_CHRONOLOGYSAGENT,
                    addToAgentsTag: true,
                });
            }

            this.agents = [agent];

            if (!this.agent) {
                debugger; // do we care?
                console.error(`(UNEXPECTED) agent falsy after createNewAgent? just logging error, no throw. (E: b6954a552e23ed83421c45f9ed781c25)`);
                // throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: b6954a552e23ed83421c45f9ed781c25)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async renderUI_busy(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_busy.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8a23e88fc1d4294f98d1cf0552d41825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 7d67d87197b8f38548670b48a4c4f525)`); }
            const { busyEl } = this.elements;
            if (!busyEl) { throw new Error(`(UNEXPECTED) busyEl falsy? (E: 48c488350a588ecbe8309c05df8b7825)`); }
            if (this.isBusy) {
                busyEl.style.display = 'flex';
            } else {
                busyEl.style.display = 'none';
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
