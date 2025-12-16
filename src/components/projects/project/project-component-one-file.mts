import thisHtml from './project.html';
import thisCss from './project.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { clone, delay, extractErrorMsg, getSaferSubstring, getTimestampInTicks, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, TjpIbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getGibInfo, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { createCommentIbGib } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { IbGibTimelineUpdateInfo } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
import { appendToTimeline, mut8Timeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
import {
    getDeterministicColorInfo, getGlobalMetaspace_waitIfNeeded,
} from "@ibgib/web-gib/dist/helpers.mjs";
import {
    IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase,
    IbGibDynamicComponentInstanceBase_ParentOfTabs,
} from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, ChildInfoBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts,
} from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { getComponentSvc } from "@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs";
import { getColorStrings, } from "@ibgib/web-gib/dist/helpers.mjs";
import {
    alertUser, copyToClipboard, highlightElement, promptForText,
    shadowRoot_getElementById,
} from "@ibgib/web-gib/dist/helpers.web.mjs";
import { askForPersistStorage, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import { LensMode, ProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-types.mjs";
import { isProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-helper.mjs";
import {
    AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT, AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT, PROJECT_CHILD_TEXT_REL8N_NAME,
} from "@ibgib/web-gib/dist/common/project/project-constants.mjs";
import { getAgentsSvc } from "@ibgib/web-gib/dist/witness/agent/agents-service-v1.mjs";
import { GEMINI_DEFAULT_MODEL_STR, } from "@ibgib/web-gib/dist/witness/agent/gemini/gemini-constants.mjs";
import { registerDomainIbGibWithAgentIndex } from "@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs";
import { Settings_General, Settings_Project, } from "@ibgib/web-gib/dist/common/settings/settings-types.mjs";
import { getSectionName, } from "@ibgib/web-gib/dist/common/settings/settings-helpers.mjs";
import { SettingsType } from "@ibgib/web-gib/dist/common/settings/settings-constants.mjs";

import { GLOBAL_LOG_A_LOT, } from "../../../constants.mjs";
import {
    getComponentCtorArg,
    getDefaultFnGetAPIKey,
    getIbGibGlobalThis_BlankGib, getIbGibGlobalThis_Common,
} from "../../../helpers.web.mjs";
import { RAW_COMPONENT_NAME, RawComponentInstance } from "../../common/raw/raw-component-one-file.mjs";
import { TEXTEDITOR_COMPONENT_NAME, TextEditorComponentInstance } from "../../common/text-editor/text-editor-component-one-file.mjs";
import { AGENT_INITIAL_CHAT_TEXT_PROJECTCHILDTEXTAGENT, AGENT_INITIAL_SYSTEM_TEXT_PROJECTCHILDTEXTAGENT, AGENT_SPECIAL_IBGIB_TYPE_PROJECTCHILDTEXTAGENT } from "../../../agent-texts/project-child-text-agent-texts.mjs";
import { isMinigameIbGib_V1 } from "../../../common/minigame/minigame-helper.mjs";
import { MINIGAME_COMPONENT_NAME } from "../../minigame/minigame-component-one-file.mjs";
import { minigameBuilderStartFunctionInfo, MinigameBuilderStartResult } from "../../../api/commands/minigame/minigame-builder-start.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const PROJECT_COMPONENT_NAME: string = 'ibgib-project';

export class ProjectComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ProjectComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    // routeRegExp?: RegExp = new RegExp(PROJECT_COMPONENT_NAME);
    routeRegExp?: RegExp = new RegExp(`^${PROJECT_COMPONENT_NAME}$`);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = PROJECT_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, ProjectComponentInstance);
    }

    /**
     * for a project, we don't have any additional info in the path.
     */
    async createInstance({
        path,
        ibGibAddr
    }: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            const component = document.createElement(this.componentName) as ProjectComponentInstance;
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

interface ProjectElements extends ElementsBase {
    headerEl: HTMLElement;
    headerTabsEl: HTMLElement | undefined;
    // nameEl: HTMLHeadingElement;
    // descEl: HTMLParagraphElement;
    footerEl: HTMLElement;
    lensBarEl: HTMLElement;
    rawLensBtnEl: HTMLButtonElement;
    textLensBtnEl: HTMLButtonElement;
    minigameLensBtnEl: HTMLButtonElement;
    addBtnEl: HTMLElement | undefined;
    addPopoverEl: HTMLElement | undefined;
    ellipsisBtnEl: HTMLElement | undefined;
    ellipsisPopoverEl: HTMLElement | undefined;
}

export type ProjectChildComponentInstance = RawComponentInstance | TextEditorComponentInstance;

/**
 * A project's children are ibgibs
 */
export interface ProjectChildTabInfo
    extends ChildInfoBase<IbGibDynamicComponentInstance<any, any>> {
    componentCache: { [lensMode: string]: ProjectChildComponentInstance }
}

export class ProjectComponentInstance
    extends IbGibDynamicComponentInstanceBase_ParentOfTabs<Settings_Project, ProjectIbGib_V1, ProjectElements, ProjectChildTabInfo>
    implements IbGibDynamicComponentInstance<ProjectIbGib_V1, ProjectElements> {
    protected override lc: string = `[${ProjectComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    protected get settingsType(): SettingsType {
        return SettingsType.project;
    }

    // private _reloadingTabs = false;

    /**
     * using this as a temporary hack to decide which concrete component to view
     * the child ibgib with.
     */
    private _lensMode: LensMode = LensMode.raw;
    get lensMode(): LensMode { return this._lensMode; }

    constructor() {
        super();
    }

    public override async activateIbGib({ addr, ibGib, }: { addr?: IbGibAddr; ibGib?: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 9b05f2064bc86002d8399af9e6e15825)`); }
            if (!addr && !ibGib) { throw new Error(`(UNEXPECTED) both addr and ibGib falsy? either addr or ibGib required. (E: 1762be0d11e851dbc8d639882671c825)`); }

            addr ??= getIbGibAddr({ ibGib });

            await super.activateIbGib({ addr, ibGib });

            // check the current settings. add the ibGib's tjpAddr to
            // the project settings list of open child tjp addrs if it's not
            // there already.

            // let projectSettings: Settings_Project | undefined = await this.getCurrentProjectSettings();
            const settings_current = await this.getSettings<Settings_Project>({
                settingsType: this.settingsType,
                useCase: 'current',
            });
            if (!settings_current) {
                throw new Error(`(UNEXPECTED) couldn't get current settings? i thought this would initialized by now. (E: 065648bc2c58dfa25d58796bed6a8e25)`);
            }

            const metaspace = await getGlobalMetaspace_waitIfNeeded();

            if (!ibGib) {
                const resGet = await metaspace.get({ addrs: [addr], });
                if (!resGet || resGet.errorMsg || (resGet.ibGibs ?? []).length !== 1) {
                    throw new Error(`couldn't get addr (${addr}) from default local user space. wrong space? i need to figure out how I want the project space handled still (atow 06/2025) (E: 37dc4cb82971bce8652bb934bd757825)`);
                }
                ibGib = resGet.ibGibs![0];
            }
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            if (!tjpAddr) { throw new Error(`(UNEXPECTED) tjpAddr falsy? 'incomingAddr' was used as the default option. (E: d42478a570da8ccc1804ea58fc5f4825)`); }

            if (this._reloadingTabs) {
                // we are loading the current child ibgib tabs and we shouldn't
                // do any updating tothe settings
                console.log(`${lc} just loading ibgib, so nothing further to do here. returning early (I: a856887a5858e6d7efc297c80e2d0825)`)
                return; /* <<<< returns early */
            } else {
                // we are NOT loading and we should persist this change to
                // settings
                let modified = false;
                if (!settings_current.openChildTjpAddrs.includes(tjpAddr)) {
                    settings_current.openChildTjpAddrs.push(tjpAddr);
                    modified = true;
                }
                if (settings_current.activeChildTjpAddr !== tjpAddr) {
                    settings_current.activeChildTjpAddr = tjpAddr;
                    modified = true;
                }
                if (modified) {
                    const sectionName_current = await getSectionName({
                        settingsType: this.settingsType,
                        useCase: 'current',
                    });
                    const _newSettings = await mut8Timeline({
                        timeline: this.settings!.ibGib!,
                        metaspace,
                        mut8Opts: {
                            dataToAddOrPatch: {
                                sections: {
                                    [sectionName_current]: settings_current,
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

    protected async createAndLoadChildComponent({
        addr,
    }: {
        addr: IbGibAddr,
    }): Promise<ProjectChildComponentInstance> {
        const lc = `${this.lc}[${this.createAndLoadChildComponent.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a080988fa988782fe898352a3a0aa825)`); }
            const componentSvc = await getComponentSvc();
            let componentPath: string;

            // hack to fix this last bug. take this out
            // if (this.lensMode === LensMode.minigame) {
            //     await this.activateLensMode({ lensMode: 'raw', skipInject: true });
            // }

            // hack while dev to force injecting minigame component when
            // activating a minigame ibgib.
            let useLensMode = this.lensMode;
            // if (addr.split(' ').at(0)! === MINIGAME_ATOM) {
            //     useLensMode = LensMode.minigame;
            // }

            switch (useLensMode) {
                case LensMode.raw:
                    componentPath = RAW_COMPONENT_NAME; break;
                case LensMode.text:
                    componentPath = TEXTEDITOR_COMPONENT_NAME; break;
                case LensMode.minigame:
                    componentPath = MINIGAME_COMPONENT_NAME; break;
                default:
                    throw new Error(`(UNEXPECTED) unknown lensMode (${this.lensMode})? (E: b2b8895cee48fea7c18c225d7e2b3825)`);
            }
            const component = await componentSvc.getComponentInstance({
                path: componentPath,
                ibGibAddr: addr,
                useRegExpPrefilter: true,
            }) as ProjectChildComponentInstance | undefined;
            if (!component) {
                debugger; // error couldn't create component instance for project?
                throw new Error(`(UNEXPECTED) projectComponent falsy? couldn't create component instance for project? (E: efeee6b003f5b0af9b0fda679593c725)`);
            }
            // await projectComponent.loadIbGib();
            // await projectComponent.initialized;
            if (!component.ibGib) {
                debugger; // error couldn't load ibGib for project?
                throw new Error(`(UNEXPECTED) ibGib falsy? couldn't load ibGib for project? (E: 352f152063a97e67f769babfadfe1e25)`);
            }

            // if (component.agent) {
            //     this.loadAgentsCoupledToIbGib({dontThrowIfNone: true});
            // }

            // guaranteed loaded ibGib
            return component;

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
     * @returns ProjectTabInfo with fully loaded component and ibgib.
     *
     * @see {@link ProjectChildTabInfo}
     */
    protected async getLoadedChildInfo({
        addr,
        ibGib,
    }: {
        addr: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<ProjectChildTabInfo> {
        const lc = `${this.lc}[${this.getLoadedChildInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8bc42ecb105f4ca9dff6590c1a9c2f25)`); }
            if (!addr) { throw new Error(`(UNEXPECTED) addr falsy? (E: 25e89572d09ae8dd581ba60bde1c9825)`); }
            const tjpGib = getGibInfo({ ibGibAddr: addr }).tjpGib ?? getIbAndGib({ ibGibAddr: addr }).gib;

            /** the point of this function is to populate this */
            let tabInfo: ProjectChildTabInfo;

            /**
             * filtered for same timeline of addr via tjpGib
             */
            const filtered = this.childInfos.filter(x => {
                const tabGibInfo = getGibInfo({ ibGibAddr: x.addr });
                const tabTjpGib = tabGibInfo.tjpGib ?? getIbAndGib({ ibGibAddr: x.addr }).gib;
                return tabTjpGib === tjpGib;
            });
            if (filtered.length > 0) {
                // already have an existing tab, but maybe not component for the current lens mode
                if (filtered.length !== 1) { console.error(`(UNEXPECTED) filtered.length !== 1? logging error here but we're just going to use the first one. filtered addrs:\n${filtered.map(x => x.addr).join('\n')}(E: ef126a918a93f1c13d0c4b41d5194b25)`); }
                tabInfo = filtered[0];
                let component = tabInfo.componentCache[this.lensMode];
                if (!component) {
                    component = await this.createAndLoadChildComponent({ addr });
                    tabInfo.componentCache[this.lensMode] = component;
                }
                tabInfo.component = component;
            } else {
                // no existing tab, so create new project tab info
                // const component = await fnCreateAndLoadProjectComponent();
                const component = await this.createAndLoadChildComponent({ addr });
                ibGib = component.ibGib!; // guaranteed in above fn

                // both addr and ibGib guaranteed now creating the child
                // component could have gotten the latest ibgib which would make
                // the addr be different than the ibGib's addr proper. so put
                // these back in sync
                addr = getIbGibAddr({ ibGib });
                const tabBtnEl = await this.addChild({ addr, ibGib });
                tabInfo = {
                    addr,
                    childBtnEl: tabBtnEl,
                    component,
                    active: false,
                    componentCache: { [this.lensMode]: component }
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

    private updateTabTitleAndText({
        span,
        ibGib,
    }: {
        span: HTMLElement,
        ibGib: IbGib_V1,
    }): void {
        const lc = `[${this.updateTabTitleAndText.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: d1c34e159aecc0bf06f57a759b06a625)`); }

            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: a22dd936f38a779c0d61489c7d7c9125)`); }
            if (!ibGib.data.name) { console.warn(`${lc} ibGib.data.name falsy? (W: genuuid)`); }
            const title = ibGib.data.name ?? 'untitled'
            const desc = ibGib.data.description ?? '';
            span.title = desc ? `${title}\n${desc}` : title;
            const MAX_TAB_TEXT_LENGTH = 12;
            const titleText = getSaferSubstring({
                text: title, length: MAX_TAB_TEXT_LENGTH,
            }) + (title.length > MAX_TAB_TEXT_LENGTH ?
                '…' :
                '')
            const textNode = document.createTextNode(titleText);

            // the span has text node child and (usually) a close "button"
            // (span).  we want to only update the text node.
            // (the project tab is different, it has no close button atow
            // 06/2025)
            if (span.firstChild) {
                span.replaceChild(textNode, span.firstChild);
            } else {
                span.appendChild(textNode);
            }
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
            if (logalot) { console.log(`${lc} starting... (I: e6657888d2b42cfdef6df03d89f3e625)`); }

            // #region init/validate
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 9f5ad8d5f35ded4496a68ac6b73ac725)`); }
            const { headerTabsEl } = this.elements;

            if (!headerTabsEl) { throw new Error(`(UNEXPECTED) headerTabsEl falsy? (E: 21e658ececa8a893168598b8837ba825)`); }

            addr ??= getIbGibAddr({ ibGib });
            if (addr !== getIbGibAddr({ ibGib })) {
                throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (E: 1981efb1b691c154670376934336d125)`);
            }
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            if (!tjpAddr) {
                debugger; // why is tjpAddr falsy?
            }
            const { gib: tjpGib } = getIbAndGib({ ibGibAddr: tjpAddr });
            // #endregion init/validate

            // create the tab button element
            const childBtnEl = document.createElement('span');
            childBtnEl.id = `project-tab-button-${addr}`;
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
            } = getDeterministicColorInfo({ ibGib, translucentAlpha: 70 });
            if (!errorMsg) {
                childBtnEl.style.borderColor = tjpColor ?? punctiliarColor;
                childBtnEl.style.backgroundColor = tjpColorTranslucent ?? punctiliarColorTranslucent;
                childBtnEl.style.color = tjpColorContrast ?? getColorStrings(90, tjpGib).at(2) ?? 'red'
                // this.style.setProperty('--ibgib-color', punctiliarColor);
                // this.style.setProperty('--ibgib-color-translucent', punctiliarColor);
                // this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                // this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
            } else {
                // don't set anything
                console.error(`${lc} ${errorMsg} (E: f837c92aa2876b444707f0b229fb8e25)`);
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

            headerTabsEl.appendChild(childBtnEl);
            childBtnEl.addEventListener('click', async (event) => {
                await this.activateIbGib({ addr });
            });

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 56ed15004c98e40a95db20144e726825)`); }
            if (!this.metaspace.latestObs) { throw new Error(`(UNEXPECTED) this.metaspace.latestObs falsy? (E: bab9882340fcdc29242045e8c2d2fe25)`); }
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

    protected async removeTabBtn({ tabInfo, }: { tabInfo: ProjectChildTabInfo; }): Promise<void> {
        // throw new Error("Method not implemented.");
        this.elements!.headerTabsEl!.removeChild(tabInfo.childBtnEl);
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initialize(opts);
            await this.loadIbGib({ getLatest: true });
            this.metaspace = await getGlobalMetaspace_waitIfNeeded();
            this.agentsInitialized = this.initAgents();
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
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            // at this point, this.ibGib should be loaded with the latest
            // project ibgib

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: 15af5db05175b88a629e52a335625b25)`); }

            await this.initElements();

            await this.agentsInitialized;
            await this.initChronology();
            await this.renderUI();
            // await this.agent!.witness(ROOT); // don't auto-prompt at this time because during dev it's extremely annoying and stresses out the agents

            // seems at random, and it is somewhat arbitrary, but if the user is
            // creating a project, then they've used the site enough to possibly
            // care enough for persistent storage. should be silent/idempotent
            // (not do anything if the user has already persisted)
            await askForPersistStorage();

            // spin off because created has to finish
            // const projectSettings = await this.getCurrentProjectSettings();
            const projectSettings = await this.getSettings<Settings_Project>({
                settingsType: SettingsType.project,
                useCase: 'current',
            });
            if ((projectSettings?.openChildTjpAddrs ?? []).length === 0) {
                // first run
                this.showProjectInfoTab();
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
    protected override async reopenOldTabs(): Promise<void> {
        const lc = `${this.lc}[${this.reopenOldTabs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 0476d804371846b4087821cc3fdba125)`); }
            await super.reopenOldTabs();
            const settings = await this.getSettings<Settings_Project>({
                settingsType: 'project',
                useCase: 'current'
            });
            if (!settings) {
                console.error(`${lc} couldn't get current project settings? (E: 13447c074422d32088c42c08b1a44a25)`);
                return;
            }
            await this.activateLensMode({ lensMode: settings.lensMode, skipInject: false });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    // private async reopenOldTabs(): Promise<void> {
    //     const lc = `${this.lc}[${this.reopenOldTabs.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 195e7d34b3f8b761aa78dd384011f825)`); }

    //         // let projectSettings = await this.getCurrentProjectSettings();
    //         const projectSettings = await this.getSettings<Settings_Project>({
    //             settingsType: SettingsType.project,
    //             useCase: 'current',
    //         });
    //         if (!projectSettings) { throw new Error(`(UNEXPECTED) projectSettings falsy? these should be initialized before now. (E: 2003ab77e01448d638216fc82aff5f25)`); }

    //         this._reloadingTabs = true;
    //         let currentChildTjpAddr: IbGibAddr | undefined;
    //         try {
    //             for (const childTjpAddr of projectSettings.openChildTjpAddrs) {
    //                 // slow kluge I think...maybe it's ok I dunno.
    //                 currentChildTjpAddr = childTjpAddr;
    //                 await this.activateIbGib({ addr: childTjpAddr });
    //             }
    //         } catch (error) {
    //             console.error(`${lc} error during activating child ibGib tabs. childTjpAddr: ${currentChildTjpAddr ?? '[unset?]'} (E: 0396b2e24d08f42ac94510bb718a1725)`);
    //             throw error;
    //         } finally {
    //             this._reloadingTabs = false;
    //         }

    //         // not reloading, so now we can activate the recently active one
    //         await this.activateIbGib({ addr: projectSettings.activeChildTjpAddr });

    //         await this.activateLensMode({ lensMode: projectSettings.lensMode, skipInject: false });
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    /**
     * show project info tab tells the project component to load itself, which
     * is like a dashboard...in the future, this should actually show a project
     * dashboard/status component
     *
     * atow (05/2025), this will show a ibgib-raw component, the most
     * rudimentary of ibgib components.
     */
    private async showProjectInfoTab(): Promise<void> {
        const lc = `${this.lc}[${this.showProjectInfoTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 717c77253cb468d40d37e23d00da9825)`); }
            await this.activateIbGib({ ibGib: this.ibGib });
            await this.activateLensMode({ lensMode: 'raw', skipInject: false });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 1cec5212626b1700aa09c2e3d6966225)`); }
            await super.handleContextUpdated();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async handleNewContextChild({
        childIbGib,
    }: {
        childIbGib: IbGib_V1;
    }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 118ee1579105ab6bae507272041e4925)`); }

            // hack to get the ball rolling with minigames (drills). not sure
            // how structure the workflow

            // we're going to assume that if a project's timeline is updated
            // with a new minigame child, that someone (the user or agent) has
            // initiated a new game to play

            if (isMinigameIbGib_V1(childIbGib)) {
                // I'm guessing I want to spin this off after the event loop
                // execution but I'm not sure on this.
                setTimeout(() => {
                    this.activateIbGib({ ibGib: childIbGib }); // spin off?
                }, 500);
            } else {
                if (logalot) { console.log(`${lc} new childIbGib (${childIbGib.ib}) is not a minigame ibgib, which is the only thing this is configured to handle right now. (I: 790ed8745a5736d8e6bf866a4a6d2f25)`); }
                return; /* <<<< returns early */
            }

            // if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3a1c7d612aeadee515218cca2ad0c225)`); }
            // const { contentEl } = this.elements;

            // const chatEntry = await this.renderIbGibItem({ ibGib: childIbGib });
            // contentEl.appendChild(chatEntry);
            // chatEntry.scrollIntoView({ behavior: 'smooth' });

            // let animation happen. we are not expecting a lot of messages to
            // just come pouring in. If that becomes the case, then we need to
            // reduce/remove this delay.
            // await delay(500);
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
            if (logalot) { console.log(`${lc} starting... (I: 98c5bd4e6796961b7672cb3258e4da25)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: genuuid)`); }

            // #region header

            const headerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'project-header');

            const headerTabsEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'project-header-tabs');

            // const nameEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'project-name');
            // const descEl = shadowRoot_getElementById<HTMLParagraphElement>(shadowRoot, 'project-description');

            // addBtnEl
            const addBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'project-header-add-btn');
            // addPopoverEl - when user clicks add, this popover has the options
            // of what exactly to add
            const addPopoverEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'add-popover');
            const addPopoverOptions = addPopoverEl.querySelectorAll('.add-popover-option');
            addBtnEl.addEventListener('click', async (event) => {
                addPopoverEl.style.position = 'absolute';
                addPopoverEl.style.top = `${addBtnEl.offsetTop + addBtnEl.clientHeight}px`;
                addPopoverEl.style.left = `${addBtnEl.offsetLeft}px`;
            });
            // Event listeners for popover options
            addPopoverOptions.forEach(option => {
                option.addEventListener('click', async (event: Event) => {
                    const target = event.target as HTMLElement;
                    const optionType = target.getAttribute('data-option');
                    if (optionType) { await this.handleAddPopoverSelected(optionType); }
                    addPopoverEl.hidePopover(); // idempotent
                });
            });

            // ellipsisBtnEl
            const ellipsisBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'project-header-ellipsis-btn');
            // ellipsisPopoverEl - when user clicks ellipsis, this popover has the options
            // of what exactly to add
            const ellipsisPopoverEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'ellipsis-popover');
            const ellipsisPopoverOptions = ellipsisPopoverEl.querySelectorAll('.ellipsis-popover-option');
            ellipsisBtnEl.addEventListener('click', async (event) => {
                ellipsisPopoverEl.style.position = 'absolute';
                ellipsisPopoverEl.style.top = `${ellipsisBtnEl.offsetTop + ellipsisBtnEl.clientHeight}px`;
                ellipsisPopoverEl.style.left = `${ellipsisBtnEl.offsetLeft}px`;
            });
            // Event listeners for popover options
            ellipsisPopoverOptions.forEach(option => {
                option.addEventListener('click', async (event: Event) => {
                    try {
                        const target = event.target as HTMLElement;
                        const optionType = target.getAttribute('data-option');
                        if (optionType) {
                            await this.handleEllipsisPopoverSelected(optionType);
                        }
                    } catch (error) {
                        const emsg = `${lc}[ellipsisPopoverOption] ${extractErrorMsg(error)} (E: 8468587582a85f00f8a71e12282a7825)`;
                        console.error(emsg);
                        alertUser({ msg: emsg, title: 'export failed...' }); // spins off
                    } finally {
                        // Hide popover after selection
                        // if (ellipsisPopoverEl.matches(':open')) {
                        ellipsisPopoverEl.hidePopover();
                        // }
                    }
                });
            });

            // #endregion header

            const contentEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'project-content');

            // #region footer
            const footerEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'project-footer');

            const lensBarEl = shadowRoot_getElementById<HTMLElement>(shadowRoot, 'ibgib-lens-bar');
            const rawLensBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'raw-lens-btn');
            const textLensBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'text-lens-btn');
            const minigameLensBtnEl = shadowRoot_getElementById<HTMLButtonElement>(shadowRoot, 'minigame-lens-btn');

            // #endregion footer

            this.elements = {
                headerEl,
                headerTabsEl,
                contentEl,
                footerEl,
                lensBarEl,
                rawLensBtnEl,
                textLensBtnEl,
                minigameLensBtnEl,
                // nameEl,
                // descEl,
                addBtnEl,
                addPopoverEl,
                ellipsisBtnEl,
                ellipsisPopoverEl,
            };

            // has to run after this.elements set
            await this.initSettings();
            await this.initLensBarAndRelated();
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
            if (logalot) { console.log(`${lc} starting... (I: 40015889cf08f03801c0ac08de4e3d25)`); }
            await super.initSettings();

            if (!this.settings) { throw new Error(`(UNEXPECTED) this.settings falsy after init? (E: 15ea55484aa8a9c78dd67bf88e468b25)`); }
            if (!this.settings.ibGib) { throw new Error(`(UNEXPECTED) this.settings.ibGib falsy after init? (E: 048901c6c03c8c6c7400d279fdf37825)`); }

            // let projectSettings = await this.getCurrentProjectSettings();
            let projectSettings = await this.getSettings<Settings_Project>({
                settingsType: SettingsType.project,
                useCase: 'current',
            });

            if (!projectSettings) {
                // need to create a new project settings section
                projectSettings = {
                    type: 'project',
                    openChildTjpAddrs: [],
                    activeChildTjpAddr: undefined,
                    lensMode: this.lensMode,
                }
                // update the current settings and persist
                const sectionName_default = await getSectionName({
                    settingsType: SettingsType.project,
                    useCase: 'default',
                });
                const sectionName_current = await getSectionName({
                    settingsType: SettingsType.project,
                    useCase: 'current',
                });
                const _newSettings = await mut8Timeline({
                    timeline: this.settings!.ibGib!,
                    metaspace: this.metaspace!,
                    mut8Opts: {
                        dataToAddOrPatch: {
                            sections: {
                                [sectionName_default]: projectSettings,
                                [sectionName_current]: projectSettings,
                            }
                        }
                    },
                });
            }


            // const sectionName_generalCurrent = await getSectionName({
            //     settingsType: 'general',
            //     useCase: 'current',
            // });
            // data.sections[sectionName_generalDefault] = clone(DEFAULT_SETTINGS_GENERAL);
            // data.sections[sectionName_generalCurrent] = clone(DEFAULT_SETTINGS_GENERAL);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initLensBarAndRelated(): Promise<void> {
        const lc = `${this.lc}[${this.initLensBarAndRelated.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 82f048513a35a0f1fa6b7e4803522725)`); }

            for (const lensBtn of this.lensBtns) {
                lensBtn.addEventListener('click', async () => {
                    const lensMode = lensBtn.getAttribute('data-mode') as LensMode;
                    await this.activateLensMode({ lensMode, skipInject: false });

                    // update the coupled UIInfo Settings for the domain ibgib so that
                    // the same viewer/editor

                    // const projectSettings = await this.getCurrentProjectSettings();
                    const projectSettings = await this.getSettings<Settings_Project>({
                        settingsType: SettingsType.project,
                        useCase: 'current',
                    });
                    if (!projectSettings) { throw new Error(`(UNEXPECTED) projectSettings falsy? (E: f7e328479b488df068abc1b28867ce25)`); }
                    if (projectSettings.lensMode !== lensMode) {
                        projectSettings.lensMode = lensMode;
                        const sectionName_current = await getSectionName({
                            settingsType: SettingsType.project,
                            useCase: 'current',
                        });
                        const _newSettings = await mut8Timeline({
                            timeline: this.settings!.ibGib!,
                            metaspace: this.metaspace!,
                            mut8Opts: {
                                dataToAddOrPatch: {
                                    sections: {
                                        [sectionName_current]: projectSettings,
                                    }
                                },
                            },
                        });
                    }
                });
            }

            const generalSettings = await this.getCurrentSettings<Settings_General>({ settingsType: SettingsType.general });
            if (!generalSettings) { throw new Error(`(UNEXPECTED) generalSettings falsy? settings not initialized with a general section? (E: d1f3e8c250489c548de42a55efba2825)`); }


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private get lensBtns(): HTMLButtonElement[] {
        return this.elements ?
            [
                this.elements.rawLensBtnEl,
                this.elements.textLensBtnEl,
                this.elements.minigameLensBtnEl,
            ]
            : [];
    }

    private updateLensBtnsUI(): void {
        const lc = `${this.lc}[${this.updateLensBtnsUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c20518af0bade4fde8772b91f4c88825)`); }

            const lensMode = this.lensMode;

            // update the lens buttons' UI
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 2e1b5a513b6e3e0678fa8dfba5a8c825)`); }
            this.lensBtns.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-mode') === lensMode);
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async activateLensMode({ lensMode, skipInject }: { lensMode: LensMode; skipInject: boolean; }) {
        const lc = `${this.lc}[${this.activateLensMode.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 3687fb48fde881cf12423fb2b413f925)`); }

            if (this._lensMode === lensMode) { return; /* <<<< returns early */ }

            // guaranteed different lens mode
            this._lensMode = lensMode;
            this.updateLensBtnsUI();

            // updating the project settings current general settings

            if (skipInject) { return; /* <<<< returns early */ }

            // instantiate or reload the tab's component
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: f1cc886fc78870d198062c88f4a78825)`); }

            if (!this.activeChildInfo) { throw new Error(`(UNEXPECTED) this.activeChildInfo falsy? (E: 233fb3b04de80b8b1736fcabc0f32c25)`); }

            // klugy hack loads the new component based on the lensMode, if
            // required.  if it's already in the componentCache for the tab
            // info, then that will be set properly
            await this.getLoadedChildInfo({ addr: this.activeChildInfo.addr, });

            if (!this.activeChildInfo.component) { throw new Error(`(UNEXPECTED) tabInfo.component falsy? should be populated by this point in code (E: 2466c8a016e813be29a953a83b0fa525)`); }
            const componentSvc = await getComponentSvc();
            await componentSvc.inject({
                parentEl: this.elements.contentEl,
                componentToInject: this.activeChildInfo.component,
            });
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
    private async handleAddPopoverSelected(optionType: string): Promise<void> {
        const lc = `${this.lc}[${this.handleAddPopoverSelected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... optionType: ${optionType} (I: genuuid)`); }

            // TODO: Implement logic to create new ibGib based on optionType
            // and add it as a tab.
            switch (optionType) {
                case 'text':
                    await this.addChildIbGib_text();
                    break;
                case 'minigame':
                    await this.addChildIbGib_minigameActiveTab();
                    break;
                default:
                    throw new Error(`(UNEXPECTED) invalid optionType (${optionType})? (E: 3856754562e8e7971822581899a6f825)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async addChildIbGib_minigameActiveTab(): Promise<void> {
        const lc = `${this.lc}[${this.addChildIbGib_minigameActiveTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 28edda58994adcca1362419bef442e25)`); }

            const name = await promptForText({
                title: 'Game Title?',
                msg: `What's it called?`,
                cancelable: true,
            });
            if (!name) {
                console.error(`${lc} User cancelled (E: 5d1c5eacde514b03ab6304685337e825)`);
                return; /* <<<< returns early */
            }

            const metaspace = this.metaspace;
            if (!metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 2bf487419e280ea32aef13b4ba7e2325)`); }
            const space = await metaspace.getLocalUserSpace({ lock: false });

            //     {
            //         // gameVariant,
            //         name,
            //         description,
            //         instructions,
            //         keywords,
            //     }: {
            //         // gameVariant: MinigameGameVariant,
            //         name: string,
            //         description: string,
            //         instructions: string,
            //         keywords: string[],
            //     }

            const activeTabIbGib = await this.getActiveTabIbGib();
            if (!activeTabIbGib.data) { throw new Error(`(UNEXPECTED) activeTabIbGib.data falsy? (E: fc6e98d473ba3ee3bee9d67894640b25)`); }
            const activeTjpAddr = getTjpAddr({ ibGib: activeTabIbGib, defaultIfNone: 'incomingAddr' }) ?? getIbGibAddr({ ibGib: activeTabIbGib });

            const resNewMinigame = await minigameBuilderStartFunctionInfo.fnViaCmd({
                cmd: minigameBuilderStartFunctionInfo.cmd,
                cmdModifiers: minigameBuilderStartFunctionInfo.cmdModifiers.concat(),
                // contextIbGibAddr: this.tjpAddr!,
                contextIbGibAddr: activeTjpAddr,
                gameType: 'typing',
                name,
                description: 'This is a minigame created by da human.',
                instructions: 'Play!',
                keywords: [],
            }) as MinigameBuilderStartResult;

            // necessary?
            const latestMinigameAddr = await metaspace.getLatestAddr({
                addr: resNewMinigame.minigameAddr,
                space,
            }) ?? resNewMinigame.minigameAddr;

            // const resGet = await metaspace.get({ addrs: [latestMinigameAddr], space, });
            // if (!resGet.success || resGet.errorMsg) {
            //     throw new Error(`(UNEXPECTED) couldn't get minigame that we just created? error: ${resGet.errorMsg} (E: 4f06c7e5c8884adcb895afbfac70ab25)`);
            // }
            // if (!resGet.ibGibs) { throw new Error(`(UNEXPECTED) resGet.ibGibs falsy? (E: babb1d865a9e4512784e9b96b1b7d825)`); }
            // if (resGet.ibGibs.length !== 1) {
            //     throw new Error(`(UNEXPECTED) resGet.ibGibs length !== 1 for latestMinigameAddr (${latestMinigameAddr})? (E: b94736ace7589dc8191de6de5e8ff725)`);
            // }
            // const latestMinigameIbGib = resGet.ibGibs.at(0)! as MinigameIbGib_V1;
            await this.activateIbGib({ addr: latestMinigameAddr });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async addChildIbGib_text(): Promise<void> {
        const lc = `${this.lc}[${this.addChildIbGib_text.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 02800232ba6d5d16187e8f938fc80225)`); }

            const { metaspace } = this;
            if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: 8ec06d4d8608ead318e3538870059825)`); }
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) space falsy? couldn't even get default local user space? (E: a81178540d08a3dbd9e0552826abc825)`); }

            const title = await promptForText({
                title: `title`,
                msg: `what's it all about? this can be a filename.ext or just your intent about what the thing is. or just hit enter`,
                cancelable: true,
            });

            if (!title) {
                // await alertUser({ msg: 'cancelled, got it.', title: 'cancelled' });
                console.log(`${lc} user cancelled. (I: a999335c4acf58eb6825af28f1733d25)`);
                return; /* <<<< returns early */
            }

            // create the comment ibgib
            const resCommentIbGib = await createCommentIbGib({
                text: title,
                addlMetadataText: `${getTimestampInTicks()}_${getSaferSubstring({ text: title, length: 16 })}`,
                saveInSpace: true,
                space,
            });
            let commentIbGib = resCommentIbGib.newIbGib;
            commentIbGib = await mut8Timeline({
                timeline: commentIbGib,
                mut8Opts: {
                    dataToAddOrPatch: { name: title, description: title, },
                },
                metaspace,
                space,
            });

            // create an agent for the new child
            const agentsSvc = getAgentsSvc(); // Assuming getAgentsSvc is available
            const newAgentIbGib = await agentsSvc.createNewAgent({
                metaspace,
                superSpace: undefined, // uses default local user space as the super space
                name: `TextAgent-${this.instanceId}`,
                api: 'gemini',
                model: GEMINI_DEFAULT_MODEL_STR,
                availableFunctions: clone(AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT),
                initialSystemText: [
                    AGENT_INITIAL_SYSTEM_TEXT_PROJECTCHILDTEXTAGENT,
                ].join('\n'),
                initialChatText: [
                    AGENT_INITIAL_CHAT_TEXT_PROJECTCHILDTEXTAGENT,
                ].join('\n'),
                // fnGetAPIKey: this.getFnGetAPIKey(),
                fnGetAPIKey: getDefaultFnGetAPIKey(),
                type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTCHILDTEXTAGENT,
                addToAgentsTag: true,
            });

            await registerDomainIbGibWithAgentIndex({
                domainIbGib: commentIbGib,
                agentIbGib: newAgentIbGib,
                metaspace,
                space,
            });

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? should be truthy and a project at that. (E: 23d1b4dcda88940c68c9a08df843b825)`); }
            if (!isProjectIbGib_V1(this.ibGib)) { throw new Error(`(UNEXPECTED) this.ibGib is not a project ibgib? (E: 4004c8156dbdf6e40855ad54b3d00525)`); }

            // append the comment to the project's timeline
            await appendToTimeline({
                timeline: this.ibGib,
                rel8nInfos: [{
                    ibGibs: [commentIbGib],
                    rel8nName: PROJECT_CHILD_TEXT_REL8N_NAME,
                }],
                metaspace,
                space,
            });

            // this.lensMode = 'text';
            await this.activateLensMode({ lensMode: 'text', skipInject: true });
            await this.activateIbGib({ ibGib: commentIbGib });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async getActiveTabIbGib(): Promise<IbGib_V1> {
        const lc = `${this.lc}[${this.getActiveTabIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 10e8819318c842e417523fbdf6956a25)`); }

            if (!this.activeChildInfo) { throw new Error(`this.activeChildInfo falsy (E: 3ade8fe5f95b2ddb286d5008f17aff25)`); }
            if (!this.activeChildInfo.component) { throw new Error(`this.activeChildInfo.component falsy. (E: 49ba441797b1595ce9b8e7cc62b53825)`); }
            const ibGib = this.activeChildInfo.component.ibGib;
            if (!ibGib) { throw new Error(`(UNEXPECTED) active tab's component's ibgib falsy? (E: a6917818f2ee9bf51326982886347825)`); }
            return ibGib;
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

    /**
     * Handler for when an option is selected from the add popover.
     */
    private async handleEllipsisPopoverSelected(optionType: string): Promise<void> {
        const lc = `${this.lc}[${this.handleEllipsisPopoverSelected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... optionType: ${optionType} (I: genuuid)`); }

            // const getActiveTabIbGib: () => IbGib_V1 = () => {
            //     if (!this.activeChildInfo) { throw new Error(`this.activeChildInfo falsy (E: 3ade8fe5f95b2ddb286d5008f17aff25)`); }
            //     if (!this.activeChildInfo.component) { throw new Error(`this.activeChildInfo.component falsy. (E: 49ba441797b1595ce9b8e7cc62b53825)`); }
            //     const ibGib = this.activeChildInfo.component.ibGib;
            //     if (!ibGib) { throw new Error(`(UNEXPECTED) active tab's component's ibgib falsy? (E: a6917818f2ee9bf51326982886347825)`); }
            //     return ibGib;
            // }
            switch (optionType) {
                case 'chat-active-tab':
                    if (this.activeChildInfo?.addr) {
                        await this.openChronology({ ibGibAddr: this.activeChildInfo.addr });
                    } else {
                        await alertUser({ title: 'No Active Tab??', msg: `There was no active tab found. This seems like a bug so you should report it please. (E: 7304e579bd5e398468e8cd333e5f9825)` });
                    }
                    break;
                case 'copy-project-address':
                    const addr = getIbGibAddr({ ibGib: this.ibGib });
                    copyToClipboard({ data: { text: addr }, });
                    highlightElement({ el: this.elements!.contentEl, magicHighlightTimingMs: 1_000, }); // spin off so options disappear
                    break;
                case 'copy-active-tab-address':
                    if (this.activeChildInfo?.addr) {
                        copyToClipboard({ data: { text: this.activeChildInfo.addr }, });
                        highlightElement({ el: this.activeChildInfo.component?.elements?.contentEl, magicHighlightTimingMs: 1_000, }); // spin off so options disappear
                    } else {
                        await alertUser({ title: 'No Active Tab??', msg: `There was no active tab found. This seems like a bug so you should report it please. (E: 4451dd7d60381f8f08557b479eb5bb25)` });
                    }
                    break;
                case 'export-project':
                    await this.exportProject({ compress: false });
                    break;
                case 'export-project-gzip':
                    await this.exportProject({ compress: true });
                    break;
                case 'export-active-tab':
                    await this.exportIbGib({
                        ibGib: await this.getActiveTabIbGib(),
                        compress: false
                    });
                    break;
                case 'export-active-tab-gzip':
                    await this.exportIbGib({
                        ibGib: await this.getActiveTabIbGib(),
                        compress: true,
                    });
                    break;
                default:
                    throw new Error(`(UNEXPECTED) invalid optionType (${optionType})? (E: 3856754562e8e7971822581899a6f825)`);
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
            if (logalot) { console.log(`${lc} starting... (I: 719052c3bb285cdfd8d2b21258c71825)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: bf40bc1beae6b34c9c8544b888b51425)`); }
            await this.exportIbGib({
                ibGib: this.ibGib,
                compress,
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * rerender
     */
    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5415ec9be03ca640cb1a3d6a17d22625)`); }

            await super.renderUI();

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl, contentEl, footerEl,
                // nameEl,
                // descEl,
            } = this.elements;

            // const projectSettings = await this.getCurrentProjectSettings();
            const projectSettings = await this.getSettings<Settings_Project>({
                settingsType: SettingsType.project,
                useCase: 'current',
            });
            if (!projectSettings) { throw new Error(`(UNEXPECTED) projectSettings falsy? (E: 052b322abcc5856f28e44cc89c373825)`); }

            this.updateLensBtnsUI();

            // nameEl.textContent = this.ibGib?.data?.name ?? '[project no name?]'
            // nameEl.textContent += ` (v${this.ibGib?.data?.n ?? '?'})`

            // const description = this.ibGib?.data?.description;
            // if (description) {
            //     descEl.textContent = description;
            // } else {
            //     descEl.style.display = 'none';
            // }

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
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            // no action atow
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
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            await this.loadAgentsCoupledToIbGib();

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: 4a5042d2e1b2de0eb15d39e406549125)`); }
            await this.agent.updateAvailableFunctions({
                availableFunctions: AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT,
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

}
