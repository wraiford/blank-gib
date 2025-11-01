import thisHtml from './projects-explorer.html';
import thisCss from './projects-explorer.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg, getSaferSubstring, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { getGibInfo, } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { IbGibTimelineUpdateInfo } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

import { GLOBAL_LOG_A_LOT, } from "../../../constants.mjs";
import { AgentWitnessAny, } from "../../../witness/agent/agent-one-file.mjs";
import {
    getGlobalMetaspace_waitIfNeeded, getDeterministicColorInfo,
    getIbGibGlobalThis_BlankGib, getColorStrings, alertUser, copyToClipboard,
    highlightElement,
    shadowRoot_getElementById,
    getDefaultFnGetAPIKey,
} from "../../../helpers.web.mjs";
import { GeminiModel } from "../../../witness/agent/gemini/gemini-constants.mjs";
import { tellUserFunctionInfo } from "../../../api/commands/chat/tell-user.mjs";
import { getProjects, parseProjectIb, } from "../../../common/project/project-helper.mjs";
import { getAgentsSvc } from "../../../witness/agent/agents-service-v1.mjs";
import {
    IbGibDynamicComponentInstanceBase_ParentOfTabs,
    IbGibDynamicComponentMetaBase,
} from "../../../ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts, ChildInfoBase,
} from "../../../ui/component/component-types.mjs";
import { getComponentSvc } from "../../../ui/component/ibgib-component-service.mjs";
import {
    AGENT_INITIAL_CHAT_TEXT_PROJECTSAGENT,
    AGENT_INITIAL_SYSTEM_TEXT_PROJECTSAGENT
} from "../../../agent-texts/projects-agent-texts.mjs";
import { EXPLORERITEM_COMPONENT_NAME, ExplorerItemComponentInstance } from "../../common/explorer-item/explorer-item-component-one-file.mjs";
import { getAgents } from "../../../witness/agent/agent-helpers.mjs";
import { debounce } from "../../../helpers.mjs";
import { IbGibSettings, SettingsWithTabs } from "../../../common/settings/settings-types.mjs";
import { SettingsType } from "../../../common/settings/settings-constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT = 'projectsagent';
export const AGENT_AVAILABLE_FUNCTIONS_PROJECTSAGENT = [
    tellUserFunctionInfo,
    // ...RenderAgentFunctionInfos,
];

export const PROJECTS_EXPLORER_COMPONENT_NAME: string = 'ibgib-projects-explorer';

export class ProjectsExplorerComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ProjectsExplorerComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     *
     *
     * either the path is
     *   * /apps/projects/gib/projects
     *   * /apps/projects/ABC123.456DEF/project%20my-project%201744553032000
     *
     * The point is that it's either a bland projects^gib to indicate create a
     * new project or it's a valid gib and a valid project ib. lazy regexp here
     */
    // routeRegExp?: RegExp = /apps\/projects\/(gib|.*)\/(projects|project \/.*\/.*)?/;
    routeRegExp?: RegExp = new RegExp(`^${PROJECTS_EXPLORER_COMPONENT_NAME}$`);

    componentName: string = PROJECTS_EXPLORER_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, ProjectsExplorerComponentInstance);
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
            if (logalot) { console.log(`${lc} starting... (I: 75ddd5c933420026d8129cf5dfb5e825)`); }
            const component = document.createElement(this.componentName) as ProjectsExplorerComponentInstance;
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

/**
 * helper interface for managing tabs and their associated ibgibs
 */
interface ProjectChildInfo extends ChildInfoBase<ExplorerItemComponentInstance> {
    // tabBtnEl: HTMLElement;
    // addr: IbGibAddr;
    /**
     * access the ibGib via this component.
     *
     * This component wraps an ibgib proxy that automatically stays up-to-date
     * when new ibgib frames are added to the ibgib's timeline and published to
     * the metaspace. (via metaspace.registerNewIbGib)
     */
    // projectComponent?: ExplorerItemComponentInstance;
    // agent?: AgentWitnessAny;
    // active: boolean;
}

interface ProjectsExplorerElements extends ElementsBase {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement;
    projectListEl: HTMLElement;
    projectListFilterEl: HTMLInputElement;
    footerEl: HTMLElement;
    // addBtnEl: HTMLButtonElement;
    // ellipsisBtnEl: HTMLElement;
    // ellipsisPopoverEl: HTMLElement;
}

export class ProjectsExplorerComponentInstance
    extends IbGibDynamicComponentInstanceBase_ParentOfTabs<IbGibSettings & SettingsWithTabs, IbGib_V1, ProjectsExplorerElements, ProjectChildInfo>
    implements IbGibDynamicComponentInstance<IbGib_V1, ProjectsExplorerElements> {

    protected override lc: string = `[${ProjectsExplorerComponentInstance.name}]`;
    private projectListFilterText: string = '';

    // projectTabInfos: ProjectChildInfo[] = [];
    get activeProjectTabInfo(): ProjectChildInfo | undefined {
        return this.childInfos.find(x => x.active);
    }

    metaspace: MetaspaceService | undefined;

    protected get settingsType(): SettingsType {
        return SettingsType.projectsExplorer;
    }

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: efee75e15accb11b99113dd84aa91e25)`); }
            // before any initialization, we want to ensure we are bootstrapped
            // await getIbGibGlobalThis_BlankGib().bootstrapPromise; // this is in the super call now

            if (!this.metaspace) {
                // wait for the metaspace to be initialized
                this.metaspace = await getGlobalMetaspace_waitIfNeeded({ delayIntervalMs: 50 });
            }

            // opts.ibGibAddr = await this.metaspace.getLatestAddr({ addr: opts.ibGibAddr }) ?? opts.ibGibAddr;

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
            if (logalot) { console.log(`${lc} starting... (I: dbda48643e911488a96ccbc803111825)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;
            // does nothing atow
            await this.initElements();
            if (!this.elements) { throw new Error(`(UNEXPECTED) just initElements but this.elements falsy? (E: 322ce753a848fce61bef88f8bf724825)`); }

            const { } = this.elements;


            await this.agentsInitialized;

            const globalBlankGib = getIbGibGlobalThis_BlankGib();
            globalBlankGib.projectsExplorerComponent = this;

            // setTimeout(() => { });
            await this.renderUI();
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
            if (logalot) { console.log(`${lc} starting... (I: 4aa68862ac656ae6b540ed98e824e325)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8371d8c58d883becd8cacbd88ae07c25)`); }

            await this.renderUI_projectList();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    protected async renderUI_projectList(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_projectList.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: genuuid)`); }
            const { shadowRoot } = this;
            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: genuuid)`); }


            const projectList = shadowRoot_getElementById(shadowRoot, 'project-list');
            projectList.innerHTML = '';

            const addedGibs: string[] = [];

            const projectIbGibs = await getProjects({ metaspace: this.metaspace });
            for (const projectIbGib of projectIbGibs) {
                const projectAddr = getIbGibAddr({ ibGib: projectIbGib });
                const { ib: projectIb, gib: projectGib } =
                    getIbAndGib({ ibGibAddr: projectAddr });
                let projectName = parseProjectIb({ ib: projectIb }).safeName;
                if (!projectName) {
                    console.warn(`${lc} projectName falsy? changed project ib format? (W: genuuid)`)
                    projectName = projectIb;
                }

                // skip adding this project if it's filtered out
                let filterOut =
                    (!!this.projectListFilterText &&
                        !projectName.toLowerCase().includes(this.projectListFilterText.toLowerCase()))
                    || addedGibs.includes(projectGib)
                    ;

                if (!filterOut) {
                    addedGibs.push(projectGib);
                    const liProject = document.createElement('li');
                    const componentSvc = await getComponentSvc();
                    const itemComponent = await componentSvc.getComponentInstance({
                        useRegExpPrefilter: true,
                        path: EXPLORERITEM_COMPONENT_NAME,
                        ibGibAddr: projectAddr,
                    }) as ExplorerItemComponentInstance;

                    await componentSvc.inject({
                        parentEl: liProject,
                        componentToInject: itemComponent,
                    });
                    projectList.appendChild(liProject);
                } else {
                    if (logalot) { console.log(`${lc} case-insensitive filtered out ${projectName} with filter ${this.projectListFilterText} (I: genuuid)`); }
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

    public override async activateIbGib({ addr, ibGib, }: { addr?: IbGibAddr; ibGib?: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4a03e843bf98c3fa382e6a8598dec825)`); }
            if (!this.metaspace) { debugger; throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 1a72d80af929b77c0fa3a1f80a973825)`); }
            await super.activateIbGib({ addr, ibGib });

            // removed a bunch of stuff taken from projects-component

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
     * @returns ProjectChildInfo with fully loaded component and ibgib.
     *
     * @see {@link ProjectChildInfo}
     */
    protected async getLoadedChildInfo({
        addr,
        ibGib,
    }: {
        addr: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<ProjectChildInfo> {
        const lc = `${this.lc}[${this.getLoadedChildInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: ecaad8b7c0d5a3289edcacc8d5830825)`); }
            if (!addr) { throw new Error(`(UNEXPECTED) addr falsy? (E: c00d98024143d46ac885f0d9fc098c25)`); }
            const tjpGib = getGibInfo({ ibGibAddr: addr }).tjpGib ?? getIbAndGib({ ibGibAddr: addr }).gib;

            const fnCreateAndLoadProjectComponent = async () => {
                const componentSvc = await getComponentSvc();
                const childComponent = await componentSvc.getComponentInstance({
                    path: EXPLORERITEM_COMPONENT_NAME,
                    ibGibAddr: addr,
                    useRegExpPrefilter: true,
                }) as ExplorerItemComponentInstance | undefined;
                if (!childComponent) {
                    debugger; // error couldn't create component instance for project?
                    throw new Error(`(UNEXPECTED) projectComponent falsy? couldn't create component instance for project? (E: c6b248bc481f21dc74eb6b993692d825)`);
                }
                // await projectComponent.loadIbGib();
                // await projectComponent.initialized;
                if (!childComponent.ibGib) {
                    debugger; // error couldn't load ibGib for project?
                    throw new Error(`(UNEXPECTED) ibGib falsy? couldn't load ibGib for project? (E: 2b1558512458ec70497f1d58a7b00825)`);
                }
                // guaranteed loaded ibGib
                return childComponent;
            }

            /** the point of this function is to populate this */
            let childInfo: ProjectChildInfo;

            /**
             * filtered for same timeline of addr via tjpGib
             */
            const filtered = this.childInfos.filter(x => {
                const tabGibInfo = getGibInfo({ ibGibAddr: x.addr });
                const tabTjpGib = tabGibInfo.tjpGib ?? getIbAndGib({ ibGibAddr: x.addr }).gib;
                return tabTjpGib === tjpGib;
            });
            if (filtered.length > 0) {
                // already have an existing tab
                // const filtered = this.childInfos.filter(x => x.addr === addr);
                if (filtered.length !== 1) { throw new Error(`(UNEXPECTED) filtered.length !== 1? (E: ebcc484b751821619a3985bfd194b825)`); }
                childInfo = filtered[0];
                if (childInfo.component) {
                    console.log(`${lc} childInfo.component already truthy. (I: 3639381951e8478068cd7688fb954f25)`);
                } else {
                    childInfo.component = await fnCreateAndLoadProjectComponent();
                    // ibGib = childInfo.component!.ibGib!;
                }
            } else {
                // no existing tab, so create new project tab info
                const projectComponent = await fnCreateAndLoadProjectComponent();
                ibGib = projectComponent.ibGib!; // guaranteed in above fn

                // both addr and ibGib guaranteed now
                const tabBtnEl = await this.addChild({ addr, ibGib })
                childInfo = {
                    addr,
                    childBtnEl: tabBtnEl,
                    component: projectComponent,
                    active: false,
                };
            }

            return childInfo;
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
            if (logalot) { console.log(`${lc} starting... (I: d5a6d80fb9e8df427f5bc293143ab825)`); }

            // #region init/validate
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: b937c8169f5840a5e878ac58d013e725)`); }
            // const { headerTabsEl } = this.elements;

            addr ??= getIbGibAddr({ ibGib });
            if (addr !== getIbGibAddr({ ibGib })) {
                throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (E: a349d8d20ca86cac682c87f8898be125)`);
            }
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            const { gib: tjpGib } = getIbAndGib({ ibGibAddr: tjpAddr });
            // #endregion init/validate

            // create the tab button element
            const span = document.createElement('span');
            span.id = `projects-tab-button-${addr}`;
            span.classList.add('panel-tab-button');
            // if (activate) { span.classList.add('active'); }
            this.updateTabTitleAndText({ span, ibGib });
            let {
                punctiliarColor,
                punctiliarColorTranslucent,
                tjpColor,
                tjpColorContrast,
                tjpColorTranslucent,
                errorMsg
            } = getDeterministicColorInfo({ ibGib, translucentAlpha: 70 });
            if (!errorMsg) {
                span.style.borderColor = tjpColor ?? punctiliarColor;
                span.style.backgroundColor = tjpColorTranslucent ?? punctiliarColorTranslucent;
                span.style.color = tjpColorContrast ?? getColorStrings(90, tjpGib).at(2) ?? 'red'

                // this.style.setProperty('--ibgib-color', punctiliarColor);
                // this.style.setProperty('--ibgib-color-translucent', punctiliarColor);
                // this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                // this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
            } else {
                // don't set anything
                console.error(`${lc} ${errorMsg} (E: b855d82bb8af0a2468aef54d983b6825)`);
            }

            // headerTabsEl.appendChild(span);
            span.addEventListener('click', async (event) => {
                // if (logalot) { console.log(`${lc} activating...`); }
                // await this.activateProject({ projectAddr: addr });
                await this.activateIbGib({ addr });
            });

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 692f4e402551f41beba2bca88ad6c125)`); }
            if (!this.metaspace.latestObs) { throw new Error(`(UNEXPECTED) this.metaspace.latestObs falsy? (E: a1423ef1c978672ad9a72ae9188ac825)`); }
            await this.metaspace.latestObs?.subscribe(fnObs({
                next: async (updateInfo: IbGibTimelineUpdateInfo) => {
                    if (updateInfo.tjpAddr !== tjpAddr) { return; /* <<<< returns early */ }
                    if (updateInfo.latestIbGib) {
                        this.updateTabTitleAndText({ span, ibGib: updateInfo.latestIbGib })
                    } else {
                        console.error(`{lc}[next] updateInfo.latestIbGib falsy? (E: 3df9efd911e8d84ddd9f3fafa45a8825)`);
                    }
                },
                complete: async () => {
                    console.warn(`${lc}[complete] completed executed? (W: 8bf2c8723158050e5861bf885fbe4925)`);
                },
                error: async (error) => {
                    debugger; // error in metaspace.latestObs dispatch?
                    console.error(`${lc}[error] ${extractErrorMsg(error)}`);
                },
            }));

            return span;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected removeTabBtn({ tabInfo, }: { tabInfo: ProjectChildInfo; }): Promise<void> {
        throw new Error("Method not implemented.");
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
            if (logalot) { console.log(`${lc} starting... (I: bf99b7f4991876f96986d1814b6ad825)`); }

            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: 4b4a1aef1f362a411811d733b18f6825)`); }
            if (!ibGib.data.name) { console.warn(`${lc} ibGib.data.name falsy? (W: 07c1e8963bad9e12cda272a237c42d25)`); }
            const title = ibGib.data.name ?? 'untitled'
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

    async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 757cf5efc3e99ffca3dbad4ec11d4825)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 292b82f80698b67e9ec9d44dd2f13825)`); }
            const { shadowRoot } = this;

            const headerEl = shadowRoot_getElementById(shadowRoot, 'projects-explorer-header');

            // headerTabsEl
            // const headerTabsEl = shadowRoot_getElementById(shadowRoot, 'projects-explorer-header-tabs');

            const contentEl = shadowRoot_getElementById(shadowRoot, 'projects-explorer-content');

            const projectListFilterEl = shadowRoot_getElementById<HTMLInputElement>(shadowRoot, 'project-list-filter');
            const fnApplyFilter = async (text: string) => {
                this.projectListFilterText = text;
                await this.renderUI_projectList();
            }
            const fnApplyFilter_debounced = debounce(fnApplyFilter, 1_000);
            // Add an event listener to the textarea
            projectListFilterEl.addEventListener('input', async (event) => {
                const target = event.target as HTMLInputElement;
                fnApplyFilter_debounced(target.value);
            });

            const projectListEl = shadowRoot_getElementById(shadowRoot, 'project-list');
            const pContent = document.createElement('p');
            pContent.textContent = '[loading...]';
            pContent.style.textAlign = 'center';
            pContent.style.fontStyle = 'italic';
            projectListEl.appendChild(pContent);

            const footerEl = shadowRoot_getElementById(shadowRoot, 'projects-explorer-footer');
            footerEl.style.display = 'none';

            // ellipsisBtnEl
            // const ellipsisBtnEl = shadowRoot_getElementById(shadowRoot, 'projects-explorer-header-ellipsis-btn');
            // // ellipsisPopoverEl - when user clicks ellipsis
            // const ellipsisPopoverEl = shadowRoot_getElementById(shadowRoot, 'ellipsis-popover');
            // const ellipsisPopoverOptions = ellipsisPopoverEl.querySelectorAll('.ellipsis-popover-option');
            // ellipsisBtnEl.addEventListener('click', async (event) => {
            //     ellipsisPopoverEl.style.position = 'absolute';
            //     ellipsisPopoverEl.style.top = `${ellipsisBtnEl.offsetTop + ellipsisBtnEl.clientHeight}px`;
            //     ellipsisPopoverEl.style.left = `${ellipsisBtnEl.offsetLeft}px`;
            // });
            // // Event listeners for popover options
            // ellipsisPopoverOptions.forEach(option => {
            //     option.addEventListener('click', async (event: Event) => {
            //         try {
            //             const target = event.target as HTMLElement;
            //             const optionType = target.getAttribute('data-option');
            //             if (optionType) {
            //                 await this.handleEllipsisPopoverSelected(optionType);
            //             }
            //         } catch (error) {
            //             const emsg = `${lc}[ellipsisPopoverOption] ${extractErrorMsg(error)} (E: f0d1c840dfc809d39f2b8cd83ddb3225)`;
            //             console.error(emsg);
            //             alertUser({ msg: emsg, title: 'export failed...' }); // spins off
            //         } finally {
            //             // Hide popover after selection
            //             ellipsisPopoverEl.hidePopover();
            //         }
            //     });
            // });

            this.elements = {
                headerEl,
                // headerTabsEl,
                // addBtnEl,
                // ellipsisBtnEl,
                // ellipsisPopoverEl,
                contentEl,
                projectListEl,
                projectListFilterEl,
                footerEl,
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * exports the current project. If more than one is open, exports the currently active project.
     *
     * Should this also include exporting the project's agent? As a flag
     */
    private async exportProject({ compress }: { compress: boolean }): Promise<void> {
        const lc = `${this.lc}[${this.exportProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7b8ac4cbe6382312b8b3416318fc0425)`); }

            // if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: ec92b82f7708e9bbe89ff8e8ddfca825)`); }
            if (!this.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo falsy? (E: ebee7ed1a098abcb38cf0258270e7825)`); }
            if (!this.activeProjectTabInfo.component) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component falsy? (E: 57a2d854006843f9781bef68b3e49d25)`); }
            if (!this.activeProjectTabInfo.component.ibGib) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component.ibGib falsy? (E: 71b8d460d4c8e4b0fd62894f4c3a0825)`); }
            await this.exportIbGib({
                ibGib: this.activeProjectTabInfo.component.ibGib,
                compress,
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async importProject(): Promise<void> {
        const lc = `[${this.importProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 232821cbc758065f8d8be84a4728f225)`); }
            throw new Error(`not implemented (yet!!) ...delayed because of thinking about import as basically being the same thing as a merge, which is non-trivial. work is mostly located in ibgib-dynamic-component-bases.mts importibGib, but need to pull out into a helper. that should actually just call the helper, passing in the components this.ibGib (can be overridden in descending concrete component classes, in case this.ibGib isn't what we want) (E: 6ae10a989a46095ad867a5a83368f325)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Handler for when an option is selected from the add popover.
     */
    private async handleEllipsisPopoverSelected(optionType: string): Promise<void> {
        const lc = `${this.lc}[${this.handleEllipsisPopoverSelected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... optionType: ${optionType} (I: 4ee4d8f38618d34151b4d28853bdaa25)`); }

            switch (optionType) {
                case 'copy-active-project-address':
                    if (this.activeProjectTabInfo) {
                        copyToClipboard({ data: { text: this.activeProjectTabInfo.addr }, });
                        highlightElement({ el: this.activeProjectTabInfo.childBtnEl, magicHighlightTimingMs: 1_000 }); // spin off so options disappear
                    } else {
                        await alertUser({ title: 'No Project?', msg: `There was no project tab found? This seems like a bug so you should report it please. (E: 3c82e358dd89822a9f7b4bc89b372925)` });
                    }
                    break;
                case 'export-project':
                    await this.exportProject({ compress: false });
                    break;
                case 'export-project-gzip':
                    await this.exportProject({ compress: true });
                    break;
                case 'import-project':
                    await this.importProject();
                    break;
                default:
                    throw new Error(`(UNEXPECTED) invalid optionType (${optionType})? (E: 4c175e5f7ad48f9f9320c51b157c2825)`);
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
            if (logalot) { console.log(`${lc} starting... (I: ef8d186a78582cd22f17d7a8eb887a25)`); }

            this.metaspace = await getGlobalMetaspace_waitIfNeeded();

            let agent: AgentWitnessAny | undefined = undefined;
            let agents = await getAgents({
                metaspace: this.metaspace,
                type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT,
                spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
            });
            if (agents.length > 0) {
                agent = agents.at(0)!;
            } else {
                const agentsSvc = getAgentsSvc();
                agent = await agentsSvc.createNewAgent({
                    metaspace: this.metaspace,
                    superSpace: undefined, // uses default local user space as the super space
                    name: `ProjectsAgent-${this.instanceId}`,
                    api: 'gemini',
                    model: GeminiModel.GEMINI_2_0_FLASH,
                    availableFunctions: [
                        ...AGENT_AVAILABLE_FUNCTIONS_PROJECTSAGENT,
                    ],
                    initialSystemText: AGENT_INITIAL_SYSTEM_TEXT_PROJECTSAGENT,
                    initialChatText: AGENT_INITIAL_CHAT_TEXT_PROJECTSAGENT,
                    fnGetAPIKey: getDefaultFnGetAPIKey(),
                    type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT,
                    addToAgentsTag: true,
                });
            }

            this.agents = [agent];

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: 8e7ef1336958e674934288ac1078cb25)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
