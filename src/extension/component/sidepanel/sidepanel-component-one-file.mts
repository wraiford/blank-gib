import thisHtml from './sidepanel.html';
import thisCss from './sidepanel.css';
import stylesCss from '../../styles.css';
import rootCss from '../../../root.css';

import {
    delay,
    extractErrorMsg, getSaferSubstring, pickRandom_Letters, pretty,
} from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { ROOT_ADDR } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { getTjpAddr } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';
import { appendToTimeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';

import { GLOBAL_LOG_A_LOT, } from "../../../constants.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "../../../ui/component/ibgib-dynamic-component-bases.mjs";
import { ElementsBase, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "../../../ui/component/component-types.mjs";
import { alertUser, highlightElement, shadowRoot_getElementById } from "../../../helpers.web.mjs";
import { createProjectIbGib, getProjects } from '../../../common/project/project-helper.mjs';
import { ProjectIbGib_V1 } from '../../../common/project/project-types.mjs';
import {
    getChunkRel8nName, getGlobalMetaspace_waitIfNeeded,
    createChunkCommentIbGibs,
    getProjectTitleFromPageOrContent,
} from '../../helpers.mjs';
import { ChromeAIAvailability, } from '../../chrome-ai.mjs';
import { DOMElementInfo, PageContentInfo } from '../../page-analyzer/page-analyzer-types.mjs';
import { addThinkingEntry, showThinkingLog, updateThinkingEntry } from '../../thinking-log.mjs';
import { mut8Timeline } from '../../../api/timeline/timeline-api.mjs';
import { PROJECT_TJP_ADDR_PROPNAME } from '../../constants.mjs';
import { getComponentSvc } from '../../../ui/component/ibgib-component-service.mjs';
import { RABBIT_HOLE_COMMENT_COMPONENT_NAME, RabbitHoleCommentComponentInstance } from '../rabbit-hole-comment/rabbit-hole-comment-component-one-file.mjs';
import { getCurrentTabURL } from '../../helpers.ext.mjs';
import { autoChunkByHeadings, getHeadingInfo, getNodeTextContent_keepspaces, } from '../../page-analyzer/page-analyzer-helpers.mjs';

const logalot = GLOBAL_LOG_A_LOT || true;

export const PHASE_INFO_TEXTS_PREPARE = [
    `CLICK THESE HEADINGS AND FIND THE ROOT!`,
    `Select the root of the page and click "Make Root".`,
    ``,
    `Note that you can click each item to navigate to it on the page.`,
    ``,
];
export const PHASE_INFO_TEXTS_POLISH = [
    `Go through the sections, both for a high-level overview and to prune any additional cruft. Then enter a title.`,
    ``,
    `Reading experts agree that this is a crucial phase of learning to get an overview of the material.`,
];
export const PHASE_INFO_TEXTS_DIGEST = [`🧠🧠🧠`];

/**
 * how long to highlight the active phase div
 */
export const HIGHLIGHT_ACTIVE_PHASE_MS = 2_000;

export const SIDEPANEL_COMPONENT_NAME: string = 'ibgib-sidepanel';
export const SIDEPANEL_AUTONEWPROJECT_TEXT = 'Auto-Create New Project';
export const SIDEPANEL_NEWPROJECT_TEXT = 'Create New Project';

export const PROJECTS_DROPDOWN_COMPONENT_NAME: string = 'ibgib-projects-dropdown';

function getProjectsDropdownOption_selectProject(): HTMLOptionElement {
    const optionEl = document.createElement('option');
    optionEl.value = '';
    optionEl.textContent = 'Select a Project';
    optionEl.disabled = true;
    optionEl.hidden = true;
    return optionEl;
}
function getProjectsDropdownOption_newProject(): HTMLOptionElement {
    const optionEl = document.createElement('option');
    optionEl.value = SIDEPANEL_NEWPROJECT_TEXT;
    optionEl.textContent = SIDEPANEL_NEWPROJECT_TEXT;
    return optionEl;
}
function getProjectsDropdownOption_autoNewProject(): HTMLOptionElement {
    const optionEl = document.createElement('option');
    optionEl.value = SIDEPANEL_AUTONEWPROJECT_TEXT;
    optionEl.textContent = SIDEPANEL_AUTONEWPROJECT_TEXT;
    return optionEl;
}

export type BreakItDownScope = 'selection' | 'page';

export class SidepanelComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${SidepanelComponentMeta.name}]`;

    routeRegExp: RegExp = new RegExp(`^${SIDEPANEL_COMPONENT_NAME}$`);

    componentName: string = SIDEPANEL_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, SidepanelComponentInstance);
    }

    async createInstance(arg: { path: string; ibGibAddr: IbGibAddr; }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const component = document.createElement(this.componentName) as SidepanelComponentInstance;
            await component.initialize({
                ibGibAddr: arg.ibGibAddr,
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

interface SidepanelElements extends ElementsBase {
    // api availability
    apiAvailabilityOverlay: HTMLDivElement;
    summarizerStatus: HTMLLIElement;
    summarizerDownloadProgressContainer: HTMLDivElement;
    summarizerDownloadProgress: HTMLProgressElement;
    translatorStatus: HTMLLIElement;
    translatorDownloadProgressContainer: HTMLDivElement;
    translatorDownloadProgress: HTMLProgressElement;
    retryApiCheckBtn: HTMLButtonElement;

    // header
    currentHrefEl: HTMLHeadingElement;
    projectsDropdown: HTMLSelectElement;
    scopeDropdown: HTMLSelectElement;
    breakItDownBtn: HTMLButtonElement;
    showThinkingLogBtn: HTMLButtonElement;

    // phases
    phasesInfoEl: HTMLDivElement;
    beginDivEl: HTMLDivElement;
    prepareDivEl: HTMLDivElement;
    prepareSpanEl: HTMLSpanElement;
    prepareDoneBtn: HTMLButtonElement;
    polishDivEl: HTMLDivElement;
    polishSpanEl: HTMLSpanElement;
    polishDoneBtn: HTMLButtonElement;
    digestDivEl: HTMLDivElement;
    digestSpanEl: HTMLSpanElement;

    // content
    titleContainer: HTMLDivElement;
    titleInputEl: HTMLInputElement;
    // contentEl is required in ElementsBase
    domTwinContainer: HTMLDivElement;
    domTwinNodeTemplate: HTMLTemplateElement;
    domTwinGlobalCommands: HTMLDivElement;
    deleteSelectedNodesBtn: HTMLButtonElement;
    makeRootGlobalBtn: HTMLButtonElement;
    domTwinNodesContainer: HTMLDivElement;
    rabbitHoleContainer: HTMLDivElement;
}

export class SidepanelComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, SidepanelElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, SidepanelElements> {

    protected override lc: string = `[${SidepanelComponentInstance.name}]`;

    /**
     * for handling reverting selection of what to use to generate project.
     *
     * there were originally two dropdowns for what project and what scope (whole page vs selected text)
     */
    protected selectedProjectAddr: IbGibAddr = ROOT_ADDR;
    /**
     * for handling reverting selection of what to use to generate project.
     *
     * there were originally two dropdowns for what project and what scope (whole page vs selected text)
     */
    private _lastScope: string = 'page'; // to handle reverting selection
    /**
     * for making a node root
     */
    private _fullDomTree: DOMElementInfo | undefined;
    /**
     * for making a node root
     */
    private _currentDomRoot: DOMElementInfo | undefined;
    /**
     * for shift+click range selection
     */
    private _lastCheckboxClicked: HTMLInputElement | undefined;

    /**
     * When true, shows extra debugging UI elements.
     */
    private _debugMode: boolean = true;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            await super.initialize(opts);
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
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot is falsy. (E: a9b8c7d6e5f4d3c2b1a0b9c8d7e6f5a4)`); }

            const headerEl = shadowRoot_getElementById(this.shadowRoot, 'sidepanel-header');
            const currentHrefEl = shadowRoot_getElementById<HTMLHeadingElement>(this.shadowRoot, 'current-href');
            const projectsDropdown = shadowRoot_getElementById<HTMLSelectElement>(this.shadowRoot, 'projects-dropdown');
            const scopeDropdown = shadowRoot_getElementById<HTMLSelectElement>(this.shadowRoot, 'scope-dropdown');
            const contentEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'sidepanel-content');
            const breakItDownBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'break-it-down-btn');
            const apiAvailabilityOverlay = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'api-availability-overlay');
            const summarizerStatus = shadowRoot_getElementById<HTMLLIElement>(this.shadowRoot, 'summarizer-status');
            const summarizerDownloadProgressContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'summarizer-download-progress-container');
            const summarizerDownloadProgress = shadowRoot_getElementById<HTMLProgressElement>(this.shadowRoot, 'summarizer-download-progress');
            const translatorStatus = shadowRoot_getElementById<HTMLLIElement>(this.shadowRoot, 'translator-status');
            const translatorDownloadProgressContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'translator-download-progress-container');
            const translatorDownloadProgress = shadowRoot_getElementById<HTMLProgressElement>(this.shadowRoot, 'translator-download-progress');

            const retryApiCheckBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'retry-api-check');
            const showThinkingLogBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'show-thinking-log-btn');

            // phases
            const phasesInfoEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'sidepanel-phases-info');
            const beginDivEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'begin-phase-div');
            const prepareDivEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'prepare-phase-div');
            const prepareSpanEl = shadowRoot_getElementById<HTMLSpanElement>(this.shadowRoot, 'prepare-span');
            const prepareDoneBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'prepare-done-btn');
            const polishDivEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'polish-phase-div');
            const polishSpanEl = shadowRoot_getElementById<HTMLSpanElement>(this.shadowRoot, 'polish-span');
            const polishDoneBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'polish-done-btn');
            const digestDivEl = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'digest-phase-div');
            const digestSpanEl = shadowRoot_getElementById<HTMLSpanElement>(this.shadowRoot, 'digest-span');

            const titleContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'title-container');
            const titleInputEl = shadowRoot_getElementById<HTMLInputElement>(this.shadowRoot, 'title-input');


            // dom twin UI
            const domTwinContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'dom-twin-container');
            const domTwinNodeTemplate = shadowRoot_getElementById<HTMLTemplateElement>(this.shadowRoot, 'dom-twin-node-template');
            const domTwinGlobalCommands = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'dom-twin-global-commands');
            const deleteSelectedNodesBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'delete-selected-nodes-btn');
            deleteSelectedNodesBtn.addEventListener('click', () => this.handleClick_deleteSelectedNodesBtn());
            const makeRootGlobalBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'make-root-global-btn');
            makeRootGlobalBtn.addEventListener('click', () => this.handleClick_makeRootGlobalBtn());
            // const autoChunkBtn = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'auto-chunk-btn');
            // autoChunkBtn.addEventListener('click', () => this.handleClick_autoChunkBtn());
            const domTwinNodesContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'dom-twin-nodes-container');
            const rabbitHoleContainer = shadowRoot_getElementById<HTMLDivElement>(this.shadowRoot, 'rabbit-hole-container');

            this.elements = {
                headerEl,
                currentHrefEl,
                projectsDropdown,
                scopeDropdown,
                contentEl,
                breakItDownBtn,
                apiAvailabilityOverlay,
                summarizerStatus,
                summarizerDownloadProgressContainer,
                summarizerDownloadProgress,
                translatorStatus,
                translatorDownloadProgressContainer,
                translatorDownloadProgress,
                retryApiCheckBtn,
                showThinkingLogBtn,
                phasesInfoEl,
                beginDivEl,
                prepareDivEl,
                prepareSpanEl,
                prepareDoneBtn,
                polishDivEl,
                polishSpanEl,
                polishDoneBtn,
                digestDivEl,
                digestSpanEl,
                titleContainer,
                titleInputEl,
                domTwinContainer,
                domTwinNodeTemplate,
                domTwinGlobalCommands,
                deleteSelectedNodesBtn,
                makeRootGlobalBtn,
                // autoChunkBtn,
                domTwinNodesContainer,
                rabbitHoleContainer,
            };

            // Set default scope to 'page' and disable the selection option initially.
            const selectionOption = this.elements.scopeDropdown.querySelector('option[value=\"selection\"]') as HTMLOptionElement;
            this.elements.scopeDropdown.value = 'page';
            if (selectionOption) { selectionOption.disabled = true; }

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
            if (logalot) { console.log(`${lc} starting...`); }
            await this.initElements();
            await this.checkApiAvailabilityAndInit();
            await this.agentsInitialized;

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements is falsy after init. (E: 2c1a8d9b6c094f9b8b9a8d9c24094f9b)`); }

            const {
                projectsDropdown, scopeDropdown,
                beginDivEl,
                breakItDownBtn, prepareDoneBtn, polishDoneBtn,
            } = this.elements;

            projectsDropdown.addEventListener('change', (event) => {
                const lcChange = `${this.lc}[dropdown change]`;

                // get the option associated with the newly selected project
                // get the address from the option element's data-addr
                // this.selectedProjectAddr =

                console.log(`${lcChange} selected project via event.target.value: ${(event as any).target.value}`);
                console.log(`${lcChange} selected project via projectsDropdown.value: ${projectsDropdown.value}`)
            });

            scopeDropdown.addEventListener('change', () => {
                if (scopeDropdown.value !== 'selection') {
                    this._lastScope = scopeDropdown.value;
                }
            });


            // add event listener for break it down button
            breakItDownBtn.addEventListener('click', () => this.handleClick_begin());
            prepareDoneBtn.addEventListener('click', () => this.handleClick_prepareDoneBtn());
            polishDoneBtn.addEventListener('click', () => this.handleClick_polishDoneBtn());

            if (!this.elements.showThinkingLogBtn) { throw new Error(`(UNEXPECTED) showThinkingLogBtn falsy? (E: d222b64775d742e9a781c0c663a033b0)`); }
            this.elements.showThinkingLogBtn.addEventListener('click', () => showThinkingLog());


            chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
                const lc = `${this.lc}[onMessage]`;
                if (message.type === 'selectionChange') {
                    if (logalot) { console.log(`${lc} received selectionChange message:`, message); }

                    if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: e7b558114c9862a1d8461f7294332e25)`); }
                    const { scopeDropdown, } = this.elements;

                    const selectionOption = scopeDropdown.querySelector('option[value="selection"]') as HTMLOptionElement;
                    if (!selectionOption) { return; }

                    if (message.hasSelection) {
                        selectionOption.disabled = false;
                        // only set the last scope if the current scope isn't already selection
                        if (scopeDropdown.value !== 'selection') {
                            this._lastScope = scopeDropdown.value;
                        }
                        scopeDropdown.value = 'selection';
                    } else {
                        // if we are currently on selection, revert to the last known scope
                        if (scopeDropdown.value === 'selection') {
                            scopeDropdown.value = this._lastScope;
                        }
                        selectionOption.disabled = true;
                    }
                } else if (message.type === 'navigationComplete') {
                    if (logalot) { console.log(`${lc} received navigationComplete message. Resetting UI.`); }
                    if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }

                    // await this.renderUI_currentTarget();
                    // this.resetSidepanelView();
                }
            });

            this.renderUI(); // spin off so created finishes
            this.renderUI_currentURL(); // spin off
            highlightElement({ el: beginDivEl, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS });
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
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region handleClick

    private async handleClick_begin_getPageContentInfoFromTab(): Promise<PageContentInfo> {
        const lc = `${this.lc}[${this.handleClick_begin_getPageContentInfoFromTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) { throw new Error(`(UNEXPECTED) tab or tab.id is falsy.`); }

            const response = await chrome.tabs.sendMessage(tab.id, { type: 'getPageContentInfo' });

            if (response && response.success && response.data) {
                if (logalot) { console.log(`${lc} received successful pageContentInfo response.`); }
                return response.data;
            } else {
                const errorMsg = response?.error || 'Received an empty or invalid response from the content script.';
                console.error(`${lc} ${errorMsg}`);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async handleClick_begin(): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_begin.name}]`;
        let thinkingId: string | undefined;
        try {
            if (logalot) { console.log(`${lc} starting...`); }

            // =================================================================
            // RUN THE HEADING TESTS
            this._runHeadingScoringTests();
            // =================================================================

            thinkingId = addThinkingEntry('Getting page content...');

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy.`); }
            const {
                currentHrefEl,
                domTwinContainer, domTwinNodesContainer,
                titleContainer,
                beginDivEl,
                domTwinGlobalCommands,
                breakItDownBtn,
                prepareDivEl,
                prepareSpanEl, prepareDoneBtn,
            } = this.elements;

            await this.renderUI_currentURL();

            domTwinNodesContainer.innerHTML = '<h1>a few moments later...</h1>';
            domTwinContainer.classList.remove('collapsed');

            const pageContentInfo = await this.handleClick_begin_getPageContentInfoFromTab();
            updateThinkingEntry(thinkingId, 'Received page content info. Rendering interactive tree...');
            if (logalot) { console.log(`${lc} result.bestCandidate: ${pretty(pageContentInfo.bestCandidate)} (I: 0494281af202ed4718ab50f82372c825)`); }

            domTwinNodesContainer.innerHTML = ''; // Clear previous content
            if (pageContentInfo.bestCandidate?.domInfoTree) {
                this._fullDomTree = pageContentInfo.bestCandidate.domInfoTree;
                this._currentDomRoot = this._fullDomTree;
                new Promise(async (resolve) => {
                    this.elements!.titleInputEl.disabled = true;
                    try {
                        const title = await getProjectTitleFromPageOrContent({ pageContentInfo, content: getNodeTextContent_keepspaces(this._currentDomRoot!), });
                        if (title)
                            this.elements!.titleInputEl.value = title;
                    } finally {
                        this.elements!.titleInputEl.disabled = false;
                        resolve(undefined);
                    }
                }); // spin off
                this._renderDomFromRoot();

                // Get the first expand button in the newly rendered tree and
                // click it.
                const firstExpandBtn = this.elements.domTwinNodesContainer.querySelector<HTMLButtonElement>('.expand-btn');
                if (firstExpandBtn) { firstExpandBtn.click(); }
            } else {
                const msg = `Could not find best candidate or DOM info tree in page content.`;
                console.error(`${lc} ${msg}`);
                updateThinkingEntry(thinkingId, msg, true, true);
                return; /* <<<< returns early */
            }


            this.renderUI_updateGlobalCommandsState(); // call this to ensure disabled at start

            domTwinGlobalCommands.classList.remove('collapsed');

            beginDivEl.classList.remove('active-phase');
            prepareDivEl.classList.add('active-phase');
            prepareSpanEl.style.display = 'flex';
            this.renderUI_updatePhaseInfo({ paragraphs: PHASE_INFO_TEXTS_PREPARE });
            highlightElement({ el: prepareDivEl, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS });

            updateThinkingEntry(thinkingId, 'Render complete.', true);

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            if (thinkingId) { updateThinkingEntry(thinkingId, `Error: ${extractErrorMsg(error)}`, true, true); }
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleClick_prepareDoneBtn(): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_prepareDoneBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: ce575a5ccb58480d07ea89b1280f0b25)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 2b2c884023e8c87db80821b55ca4e125)`); }
            const {
                titleContainer,
                prepareDivEl, prepareDoneBtn,
                polishDivEl, polishSpanEl, polishDoneBtn
            } = this.elements;

            await this.autoChunk();

            this.renderUI_updateGlobalCommandsState(); // call this to ensure disabled at start

            prepareDivEl.classList.remove('active-phase');
            polishDivEl.classList.add('active-phase');
            polishSpanEl.style.display = 'flex';
            highlightElement({ el: polishDivEl, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS }); // spin off
            this.renderUI_updatePhaseInfo({ paragraphs: PHASE_INFO_TEXTS_POLISH });

            delay(HIGHLIGHT_ACTIVE_PHASE_MS).then(() => {
                highlightElement({ el: titleContainer, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS });
                titleContainer.classList.remove('collapsed');
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleClick_polishDoneBtn(): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_polishDoneBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cd108beb4e4ef608b861ae683ce77c25)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 1b2d4505092879ff287d58886a9bc825)`); }
            const {
                titleInputEl, currentHrefEl,
                polishDivEl,
                digestDivEl, digestSpanEl,
                domTwinContainer,
                rabbitHoleContainer,
                phasesInfoEl,
            } = this.elements;

            let title: string;
            if (titleInputEl.value) {
                title = titleInputEl.value;
            } else {
                alertUser({
                    title: 'Doh! Need title',
                    msg: `Have to have a title`,
                });
                return; /* <<<< returns early */
            }

            const href = currentHrefEl.textContent;
            if (!href) { throw new Error(`(UNEXPECTED) href falsy? (E: 0f4a3874cfa3b6186497311753eaf825)`); }

            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space from metaspace? (E: 868fc8607daedae7d5e3b636bb4c0b25)`); }

            // show loading screen
            domTwinContainer.style.display = 'none';
            rabbitHoleContainer.style.display = 'flex';
            rabbitHoleContainer.innerHTML = '<h1>a few moments later...</h1>';

            // create the root src comment ibgib from the dom root
            if (!this._currentDomRoot) { throw new Error(`(UNEXPECTED) this._currentDomRoot falsy? (E: 697b45590a88301589f6eae864338825)`); }
            let [srcCommentIbGib] = await createChunkCommentIbGibs({
                domNodesOrStrings: this._currentDomRoot,
                metaspace,
                space,
                recursive: false,
            });

            // now we can create the project based off this root ibgib
            let project: ProjectIbGib_V1;
            project = await this.createNewProject({
                title,
                href,
                srcCommentIbGib,
                metaspace,
                space,
            });

            // add a soft link back from the comment to the project
            const projectTjpAddr = getTjpAddr({ ibGib: project, defaultIfNone: 'incomingAddr' });
            if (!projectTjpAddr) { throw new Error(`(UNEXPECTED) projectTjpAddr falsy? (E: 951fd86d451aaf5028f635f89e781825)`); }
            srcCommentIbGib = await mut8Timeline({
                timeline: srcCommentIbGib,
                mut8Opts: {
                    dataToAddOrPatch: {
                        [PROJECT_TJP_ADDR_PROPNAME]: projectTjpAddr,
                    }
                }, // also adding title to ibgib data
                metaspace,
                space,
                skipLock: true, // newly created timeline that no one knows about
            });

            project = await appendToTimeline({
                timeline: project,
                rel8nInfos: [{
                    rel8nName: getChunkRel8nName({
                        contextScope: 'default'
                    }),
                    ibGibs: [srcCommentIbGib],
                }],
                metaspace,
                space,
                skipLock: false,
            }) as ProjectIbGib_V1;

            // create the rest of the root comment's children and relate to the root comment
            if (!this._currentDomRoot) { throw new Error(`(UNEXPECTED) this._currentDomRoot falsy? (E: c293381ba4df029a38b5181788881825)`); }
            let childrenChunkIbGibs = await createChunkCommentIbGibs({
                domNodesOrStrings: this._currentDomRoot.content,
                project,
                parentCommentIbGib: srcCommentIbGib,
                recursive: true,
                metaspace,
                space,
            });
            srcCommentIbGib = await appendToTimeline({
                timeline: srcCommentIbGib,
                rel8nInfos: [{
                    rel8nName: getChunkRel8nName({ contextScope: 'default' }),
                    ibGibs: childrenChunkIbGibs,
                }],
                metaspace,
                space,
            }) as CommentIbGib_V1;


            // create and inject the comment component corresponding to the
            // newSrcCommentIbGib
            const srcCommentAddr = getIbGibAddr({ ibGib: srcCommentIbGib });
            const componentSvc = await getComponentSvc();
            const commentComponent =
                await componentSvc.getComponentInstance({
                    path: RABBIT_HOLE_COMMENT_COMPONENT_NAME,
                    ibGibAddr: srcCommentAddr,
                    useRegExpPrefilter: true,
                }) as RabbitHoleCommentComponentInstance;
            if (!commentComponent) { throw new Error(`(UNEXPECTED) commentComponent falsy? couldn't get a commentComponent? (E: genuuid)`); }
            await componentSvc.inject({
                parentEl: rabbitHoleContainer,
                componentToInject: commentComponent,
            });

            // // FINALLY, UPDATE THE UI
            // await this.renderUI_projectsDropdown();

            polishDivEl.classList.remove('active-phase');
            digestDivEl.classList.add('active-phase');
            digestSpanEl.style.display = 'flex';
            highlightElement({ el: digestDivEl, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS }); // spin off
            this.renderUI_updatePhaseInfo({ paragraphs: PHASE_INFO_TEXTS_DIGEST });
            delay(HIGHLIGHT_ACTIVE_PHASE_MS).then(() => {
                phasesInfoEl.style.display = 'none';
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private handleClick_deleteSelectedNodesBtn(): void {
        const lc = `${this.lc}[${this.handleClick_deleteSelectedNodesBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy?`); }
            if (!this._currentDomRoot) {
                console.error(`${lc} _currentDomRoot is not set. Cannot delete nodes.`);
                return;
            }

            const { domTwinNodesContainer } = this.elements;
            const checkedBoxes = domTwinNodesContainer.querySelectorAll<HTMLInputElement>('.node-select-checkbox:checked');

            // Step 1: Collect all gibIds to be deleted.
            const gibIdsToRemove = new Set<string>();
            checkedBoxes.forEach(checkbox => {
                const nodeEl = checkbox.closest<HTMLElement>('.dom-twin-node');
                const gibId = nodeEl?.dataset.gibId;
                if (gibId) {
                    gibIdsToRemove.add(gibId);
                }
            });

            if (gibIdsToRemove.size === 0) { return; } // Nothing selected

            // Step 2: Actually remove the nodes from the underlying data tree.
            this._recursivelyRemoveNodesByGibId(gibIdsToRemove, this._currentDomRoot);

            // Step 3: Remove the nodes from the UI, now that data is updated.
            checkedBoxes.forEach(checkbox => {
                checkbox.closest('.dom-twin-node')?.remove();
            });

            // Step 4: Update the state of the global command buttons.
            this.renderUI_updateGlobalCommandsState();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private handleClick_makeRootGlobalBtn(): void {
        const lc = `${this.lc}[${this.handleClick_makeRootGlobalBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: fa88c471b37d6c1f18d00c28ae149825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3d5e388e0b5868d737dbb828c3369825)`); }
            const { domTwinNodesContainer } = this.elements;
            const checkedCheckbox = domTwinNodesContainer.querySelector('.node-select-checkbox:checked') as HTMLInputElement;
            if (checkedCheckbox) {
                const nodeEl = checkedCheckbox.closest('.dom-twin-node') as HTMLElement;
                const gibId = nodeEl?.dataset.gibId;
                if (gibId) {
                    this.makeNodeRoot(gibId);
                } else {
                    console.error(`${lc} Global "Make Root" button clicked, but could not find gibId on the selected node.`);
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion handleClick

    // #region renderUI methods

    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2a679810c7a800276cc8c8687c23f725)`); }

            await super.renderUI();

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: a890781e65c6a3ea68c7ff7f73dac825)`); }
            const { } = this.elements;

            await this.renderUI_projectsDropdown();
            // await this.renderUI_currentTarget();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private renderUI_DomInfoNode(nodeInfo: DOMElementInfo, parentEl: HTMLElement): void {
        const lc = `${this.lc}[${this.renderUI_DomInfoNode.name}]`;
        try {
            if (!this.elements) { throw new Error("(UNEXPECTED) this.elements falsy."); }
            const { domTwinNodeTemplate } = this.elements;

            const nodeClone = domTwinNodeTemplate.content.cloneNode(true) as DocumentFragment;
            const nodeEl = nodeClone.querySelector('.dom-twin-node') as HTMLElement;
            const nodeHeader = nodeClone.querySelector('.node-header') as HTMLElement;
            const expandBtn = nodeClone.querySelector('.expand-btn') as HTMLButtonElement;
            const checkbox = nodeClone.querySelector('.node-select-checkbox') as HTMLInputElement;
            const tagNameSpan = nodeClone.querySelector('.node-tag-name') as HTMLSpanElement;
            const textPreviewSpan = nodeClone.querySelector('.node-text-preview') as HTMLSpanElement;
            const childrenContainer = nodeClone.querySelector('.node-children-container') as HTMLDivElement;
            const deleteBtn = nodeClone.querySelector('.delete-node-btn') as HTMLButtonElement;
            const makeRootBtn = nodeClone.querySelector('.make-root-btn') as HTMLButtonElement;

            tagNameSpan.textContent = `<${nodeInfo.tagName}>`;
            if (nodeInfo.gibId) {
                nodeEl.dataset.gibId = nodeInfo.gibId;
            }

            // const textContent = this._getNodeTextContent(nodeInfo);
            const textContent = this._getNodeTextContent(nodeInfo);
            if (textContent) {
                const previewText = textContent.substring(0, 30);
                textPreviewSpan.textContent = previewText + (textContent.length > 30 ? '...' : '');
            }

            const headingScore = getHeadingInfo(nodeInfo).headingScore;
            // if (headingScore > 0) {
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = ` (Score: ${headingScore})`;
            scoreSpan.style.fontSize = '0.8em';
            scoreSpan.style.color = '#999';
            scoreSpan.style.marginLeft = '5px';
            textPreviewSpan.insertAdjacentElement('afterend', scoreSpan);

            checkbox.addEventListener('click', (e) => {
                const currentCheckbox = e.target as HTMLInputElement;

                if (e.shiftKey && this._lastCheckboxClicked) {
                    // Shift-click logic
                    if (!this.elements) { return; }
                    const { domTwinNodesContainer } = this.elements;
                    const allCheckboxes = Array.from(domTwinNodesContainer.querySelectorAll('.node-select-checkbox')) as HTMLInputElement[];

                    const lastClickedIndex = allCheckboxes.indexOf(this._lastCheckboxClicked);
                    const currentIndex = allCheckboxes.indexOf(currentCheckbox);

                    if (lastClickedIndex !== -1 && currentIndex !== -1) {
                        const start = Math.min(lastClickedIndex, currentIndex);
                        const end = Math.max(lastClickedIndex, currentIndex);
                        const shouldBeChecked = currentCheckbox.checked;

                        for (let i = start; i <= end; i++) {
                            allCheckboxes[i].checked = shouldBeChecked;
                        }
                    }
                }

                this._lastCheckboxClicked = currentCheckbox;
                this.renderUI_updateGlobalCommandsState();
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                if (!this._currentDomRoot) {
                    console.error(`${lc} _currentDomRoot is not set. Cannot delete node.`);
                    // still remove the element from the UI for user feedback
                    nodeEl.remove();
                    return;
                }

                // Get the gibId for the node we want to remove.
                const gibId = nodeEl.dataset.gibId;
                if (gibId) {
                    // Create a set with just this one ID.
                    const gibIdsToRemove = new Set<string>([gibId]);
                    // Call the recursive function to remove it from the data tree.
                    this._recursivelyRemoveNodesByGibId(gibIdsToRemove, this._currentDomRoot);
                } else {
                    console.warn(`${lc} Could not find gibId on node to delete.`);
                }

                // Now remove the element from the UI and update global state.
                nodeEl.remove();
                this.renderUI_updateGlobalCommandsState();
            });

            // deleteBtn.addEventListener('click', (e) => {
            //     e.stopPropagation();
            //     nodeEl.remove();
            //     this.renderUI_updateGlobalCommandsState();
            // });

            makeRootBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gibId = nodeEl.dataset.gibId;
                if (gibId) {
                    this.makeNodeRoot(gibId);
                } else {
                    console.error(`${lc} make-root-btn clicked, but node element has no gibId. (UNEXPECTED)`);
                }
            });

            if (this._debugMode) {
                const debugBtn = document.createElement('button');
                debugBtn.textContent = '🐞';
                debugBtn.classList.add('node-action-btn'); // Use same class as other buttons for styling
                debugBtn.title = 'Show Debug Info';

                // We want to insert it alongside the other action buttons.
                // Assuming deleteBtn is present and has a parent.
                if (deleteBtn.parentElement) {
                    deleteBtn.parentElement.insertBefore(debugBtn, deleteBtn.nextSibling);
                }

                debugBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    alertUser({
                        title: 'Node Info',
                        msg: pretty(nodeInfo),
                    });
                });
            }

            nodeHeader.addEventListener('click', async (e) => {
                if (e.target === expandBtn || (e.target as HTMLElement).tagName === 'INPUT' || e.target === deleteBtn || e.target === makeRootBtn) { return; }

                const gibId = nodeEl.dataset.gibId;
                if (!gibId) { return; }

                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab && tab.id) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'scrollToGib',
                            gibId: gibId,
                        });
                    }
                } catch (error) {
                    console.error(`${lc} Error sending message to content script: ${extractErrorMsg(error)}`);
                }
            });

            const hasChildElements = nodeInfo.content?.some(c => typeof c !== 'string');
            const hasChildText = nodeInfo.content?.some(c => typeof c === 'string' && c.trim().length > 0);

            if (hasChildElements || hasChildText) {
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    childrenContainer.classList.toggle('collapsed');
                    expandBtn.textContent = childrenContainer.classList.contains('collapsed') ? '›' : '˅';
                });

                for (const child of nodeInfo.content) {
                    if (typeof child === 'string') {
                        if (child.trim()) {
                            const textDiv = document.createElement('div');
                            textDiv.textContent = `"${child.trim()}"`;
                            textDiv.classList.add('dom-twin-text');
                            childrenContainer.appendChild(textDiv);
                        }
                    } else if (child) {
                        this.renderUI_DomInfoNode(child, childrenContainer);
                    }
                }
            } else {
                expandBtn.style.visibility = 'collapsed';
            }

            parentEl.appendChild(nodeClone);

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private _renderDomFromRoot(): void {
        const lc = `${this.lc}[${this._renderDomFromRoot.name}]`;
        try {
            if (!this.elements) { throw new Error("(UNEXPECTED) this.elements falsy."); }
            if (!this._currentDomRoot) { throw new Error("(UNEXPECTED) this._currentDomRoot is not set."); }
            const { domTwinNodesContainer } = this.elements;
            domTwinNodesContainer.innerHTML = ''; // Clear the current view
            this.renderUI_DomInfoNode(this._currentDomRoot, domTwinNodesContainer);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private async renderUI_currentURL(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_currentURL.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5ddcb8ede6885f97d80c13274fa9c625)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy. (E: 2811587dc348ac76dc8372c813545d25)`); }
            const { currentHrefEl, } = this.elements;

            const href = await getCurrentTabURL();
            currentHrefEl.textContent = href;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderUI_projectsDropdown(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_projectsDropdown.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 409fa21e57087fd81884e2532777c825)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 6e35785bb31b548ad8373918928e5625)`); }
            const { projectsDropdown } = this.elements;

            // init the dropdown
            projectsDropdown.innerHTML = '';
            // let's get the auto new project option implemented first
            // const newProjectOptionEl =getProjectsDropdownOption_newProject();
            // projectsDropdown.appendChild(newProjectOptionEl);
            const autoNewProjectOptionEl = getProjectsDropdownOption_autoNewProject();
            projectsDropdown.appendChild(autoNewProjectOptionEl);

            // load the projects into the dropdown
            const projectIbGibs = await this.getFilteredProjects();
            const projectOptionEls: HTMLOptionElement[] = [];
            const erroredOptions: HTMLOptionElement[] = [];
            for (const projectIbGib of projectIbGibs) {
                const optionEl = document.createElement('option');
                try {
                    if (!projectIbGib.data) { throw new Error(`(UNEXPECTED) projectIbGib.data falsy? (E: 7a6a689860c3fdbbb8a411bc87ff2125)`); }
                    if (!projectIbGib.data.name) { throw new Error(`(UNEXPECTED) project.data.name falsy? (E: 31b432799d037984ca5ba6682f21f225)`); }

                    // set the option's props
                    optionEl.value = getIbGibAddr(projectIbGib);
                    optionEl.textContent = projectIbGib.data.name;

                    // don't add the option to the dropdown yet, because of
                    // nuances with Select Project option and currently selected addr.
                    projectOptionEls.push(optionEl);
                } catch (error) {
                    // maybe overkill here but don't want UI to error out, so
                    // catch all errors
                    const randomLetters = pickRandom_Letters({ count: 5 });
                    console.error(`${lc}[subcode: ${randomLetters}] ${extractErrorMsg(error)}`);
                    optionEl.value = '';
                    optionEl.textContent = `ERROR See Console ${randomLetters} for details`;
                    optionEl.disabled = true;
                    erroredOptions.push(optionEl);
                }
            }

            // configure what is the selected option in the dropdown, and if
            // applicable, deselect the current selection if it's been filtered
            // out.

            if (projectOptionEls.length > 0) {
                // we have valid projects, so either we already have one
                // selected via this.selectedProjectAddr, or we want to tell the
                // user to select one

                // only add the select project if we have any projects to select
                const selectAProjectOptionEl = getProjectsDropdownOption_selectProject();
                projectsDropdown.insertBefore(selectAProjectOptionEl, projectsDropdown.firstChild);
                projectOptionEls.forEach(x => projectsDropdown.appendChild(x));

                if (this.selectedProjectAddr === ROOT_ADDR) {
                    // no selected addr set
                    projectsDropdown.value = selectAProjectOptionEl.value;
                } else {
                    // we are RE-rendering the dropdown, as can be inferred by
                    // this.selectedProjectAddr not being the root ib^gib addr.
                    // The only thing ATOW (10/2025) that would trigger this is
                    // a filter.

                    /**
                     * this is a naive check. We really should check for the
                     * same tjp addr/tjpGib, but we'll implement this first
                     */
                    const selectedOptionEl = projectOptionEls.find(x => x.value === this.selectedProjectAddr);
                    if (selectedOptionEl) {
                        // the selectedProjectAddr is still valid after the
                        // filter, so we continue to select it.
                        projectsDropdown.value = selectedOptionEl.value;
                    } else {
                        // the selectedProjectAddr is now filtered out, so we deselect it.
                        await this.deselectProjectAddr();
                        projectsDropdown.value = selectAProjectOptionEl.value;
                    }
                }
            } else {
                // we have no valid existing project options, so we don't
                // include the select a project option, and we default to the
                // auto-new-project option
                projectsDropdown.value = autoNewProjectOptionEl.value;
                await this.deselectProjectAddr();
            }

            // append errored ones last
            erroredOptions.forEach(x => projectsDropdown.appendChild(x));
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private renderUI_updateGlobalCommandsState(): void {
        const lc = `${this.lc}[${this.renderUI_updateGlobalCommandsState.name}]`;
        try {
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements is falsy.`); }
            const { domTwinContainer, deleteSelectedNodesBtn, makeRootGlobalBtn } = this.elements;

            const checkedCheckboxes = domTwinContainer.querySelectorAll('.node-select-checkbox:checked');
            const checkedCount = checkedCheckboxes.length;

            // The "Delete" button should be enabled if one or more are checked.
            deleteSelectedNodesBtn.disabled = checkedCount === 0;

            // The global "Make Root" button should only be enabled if exactly one is checked.
            makeRootGlobalBtn.disabled = checkedCount !== 1;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private renderUI_updatePhaseInfo({ paragraphs }: { paragraphs: string[] }): void {
        const lc = `${this.lc}[${this.renderUI_updatePhaseInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 114d083452c82430fe85e2f9ad7f0825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) ? (E: 8071dfc3b0c3cf65a7694a486dc0e125)`); }
            const { phasesInfoEl } = this.elements;
            phasesInfoEl.innerHTML = '';
            if (paragraphs && paragraphs.length > 0) {
                phasesInfoEl.style.display = 'flex';
                for (let x of paragraphs) {
                    const pEl = document.createElement('p');
                    pEl.textContent = x;
                    phasesInfoEl.appendChild(pEl);
                }
                highlightElement({ el: phasesInfoEl, magicHighlightTimingMs: HIGHLIGHT_ACTIVE_PHASE_MS });
            } else {
                phasesInfoEl.style.display = 'none';
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion renderUI methods

    // #region test kluge

    private _runHeadingScoringTests(): void {
        const lc = `${this.lc}[${this._runHeadingScoringTests.name}]`;
        console.log(`${lc} Running heading scoring tests...`);

        const tests: { name: string, node: DOMElementInfo, expectedMinScore: number }[] = [
            {
                name: "Plain Paragraph",
                node: { tagName: 'p', content: ['Just some normal text.'], gibId: 'a' },
                expectedMinScore: 0
            },
            {
                name: "Wikipedia H2",
                node: {
                    tagName: 'div', content: [
                        { tagName: 'h2', content: ['Function'], gibId: 'b' },
                        { tagName: 'span', content: [' edit '], gibId: 'm' },
                    ], gibId: 'c'
                },
                expectedMinScore: 90
            },
            {
                name: "Hackathon Main Title",
                node: {
                    tagName: 'p',
                    content: [{
                        tagName: 'span',
                        content: [{
                            tagName: 'strong',
                            content: ['Google Chrome Built-in AI Challenge 2025 Official Rules'],
                            gibId: 'd'
                        }],
                        gibId: 'e',
                    }],
                    gibId: 'f',
                },
                expectedMinScore: 100
            },
            {
                name: "Hackathon Numbered Section",
                node: {
                    tagName: 'p',
                    content: [
                        { tagName: 'strong', content: ['1. BINDING AGREEMENT:'], gibId: 'g' },
                        ' In order to enter the Contest, you must agree...'
                    ],
                    gibId: 'h',
                },
                expectedMinScore: 90
            },
            {
                name: "Hackathon Italic Sub-heading",
                node: {
                    tagName: 'p',
                    content: [
                        {
                            tagName: 'strong',
                            content: [
                                {
                                    tagName: 'em',
                                    content: ['Application Requirements:'],
                                    gibId: 'h'
                                }
                            ],
                            gibId: 'i'
                        },
                    ],
                    gibId: 'j',
                },
                expectedMinScore: 70
            },
            {
                name: "Simple H1",
                node: {
                    tagName: 'h1',
                    content: ['Main Title'],
                    gibId: 'k'
                },
                expectedMinScore: 100
            }
        ];

        let allTestsPassed = true;
        for (const test of tests) {
            const headingInfo = getHeadingInfo(test.node);
            const score = headingInfo.headingScore;
            const pass = score >= test.expectedMinScore;
            if (!pass) { allTestsPassed = false; }
            console.log(
                `${lc} [${pass ? '✅ PASS' : '❌ FAIL'}] Test: "${test.name}". Score: ${score}. (Expected >= ${test.expectedMinScore})`
            );
        }
        console.log(`${lc} All tests ${allTestsPassed ? 'passed' : 'failed'}.`);
        console.log(`${lc} Tests complete.`);
    }

    // #endregion test kluge

    // #region checkApiAvailabilityAndInit

    private async checkApiAvailabilityAndInit_summarizer(availability: ChromeAIAvailability): Promise<boolean> {
        const lc = `${this.lc}[checkApiAvailabilityAndInit_summarizer]`;
        if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements is falsy.`); }
        const { summarizerStatus, summarizerDownloadProgress, summarizerDownloadProgressContainer } = this.elements;
        const statusSpan = summarizerStatus.querySelector<HTMLElement>('.status');
        if (!statusSpan) { throw new Error(`(UNEXPECTED) summarizer statusSpan is falsy.`); }

        switch (availability) {
            case ChromeAIAvailability.available:
                statusSpan.textContent = 'Available';
                statusSpan.style.color = 'green';
                summarizerDownloadProgressContainer.classList.add('collapsed');
                return true;

            case ChromeAIAvailability.downloading:
                statusSpan.textContent = 'Downloading...';
                statusSpan.style.color = 'orange';
                summarizerDownloadProgressContainer.classList.remove('collapsed');
                // We monitor the download and then throw a specific error to signal that the parent
                // function needs to restart the entire availability check process from the top.
                await Summarizer.create({ monitor: (p) => p.addEventListener('downloadprogress', (e) => { summarizerDownloadProgress.value = e.loaded * 100; }) });
                throw new Error('RESTART_CHECK');

            case ChromeAIAvailability.downloadable:
                statusSpan.textContent = 'Download Required';
                statusSpan.style.color = 'orange';
                return false;

            default: // unavailable
                statusSpan.textContent = 'Not Available';
                statusSpan.style.color = 'red';
                summarizerDownloadProgressContainer.classList.add('collapsed');
                return false;
        }
    }

    private async checkApiAvailabilityAndInit_translator(availability: ChromeAIAvailability): Promise<boolean> {
        const lc = `${this.lc}[checkApiAvailabilityAndInit_translator]`;
        if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements is falsy.`); }
        const { translatorStatus, translatorDownloadProgress, translatorDownloadProgressContainer } = this.elements;
        const statusSpan = translatorStatus.querySelector<HTMLElement>('.status');
        if (!statusSpan) { throw new Error(`(UNEXPECTED) translator statusSpan is falsy.`); }

        switch (availability) {
            case ChromeAIAvailability.available:
                statusSpan.textContent = 'Available';
                statusSpan.style.color = 'green';
                translatorDownloadProgressContainer.classList.add('collapsed');
                return true;

            case ChromeAIAvailability.downloading:
                statusSpan.textContent = 'Downloading...';
                statusSpan.style.color = 'orange';
                translatorDownloadProgressContainer.classList.remove('collapsed');
                // We monitor the download and then throw a specific error to signal that the parent
                // function needs to restart the entire availability check process from the top.
                await Translator.create({ sourceLanguage: 'en', targetLanguage: 'es', monitor: (p) => p.addEventListener('downloadprogress', (e) => { translatorDownloadProgress.value = e.loaded * 100; }) });
                throw new Error('RESTART_CHECK');

            case ChromeAIAvailability.downloadable:
                statusSpan.textContent = 'Download Required';
                statusSpan.style.color = 'orange';
                return false;

            default: // unavailable
                statusSpan.textContent = 'Not Available';
                statusSpan.style.color = 'red';
                translatorDownloadProgressContainer.classList.add('collapsed');
                return false;
        }
    }


    private async checkApiAvailabilityAndInit(): Promise<void> {
        const lc = `${this.lc}[${this.checkApiAvailabilityAndInit.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements is falsy.`); }

            const { apiAvailabilityOverlay, retryApiCheckBtn, breakItDownBtn } = this.elements;

            // First, get the current availability status of both APIs.
            const [summarizerAvailability, translatorAvailability] = await Promise.all([
                Summarizer.availability().catch(e => {
                    console.error(`${lc} Summarizer.availability() failed: ${extractErrorMsg(e)}`);
                    return ChromeAIAvailability.unavailable;
                }),
                Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' }).catch(e => {
                    console.warn(`${lc} Translator.availability() check failed: ${extractErrorMsg(e)}`);
                    return ChromeAIAvailability.unavailable;
                })
            ]);

            // The sub-methods handle UI updates and trigger downloads. A 'RESTART_CHECK' error
            // is thrown by a sub-method if a download completes, signaling a full re-check is needed.
            const [isSummarizerReady, isTranslatorReady] = await Promise.all([
                this.checkApiAvailabilityAndInit_summarizer(summarizerAvailability),
                this.checkApiAvailabilityAndInit_translator(translatorAvailability),
            ]);

            // If both APIs are ready, we can hide the overlay and enable the app.
            if (isSummarizerReady && isTranslatorReady) {
                apiAvailabilityOverlay.classList.add('collapsed');
                breakItDownBtn.disabled = false;
                return; // All good, we are done.
            }

            // If we reach here, at least one API is not ready. Show the overlay.
            apiAvailabilityOverlay.classList.remove('collapsed');
            breakItDownBtn.disabled = true;

            const isSummarizerDownloadable = summarizerAvailability === ChromeAIAvailability.downloadable;
            const isTranslatorDownloadable = translatorAvailability === ChromeAIAvailability.downloadable;

            // Configure the button to either trigger downloads or a simple retry.
            if (isSummarizerDownloadable || isTranslatorDownloadable) {
                retryApiCheckBtn.textContent = 'Download Models';
                retryApiCheckBtn.onclick = async () => {
                    retryApiCheckBtn.textContent = 'Starting Download...';
                    retryApiCheckBtn.disabled = true;
                    // We only need to call create() to trigger the download. The 'downloading'
                    // case in the sub-methods will handle monitoring on the subsequent check.
                    if (isSummarizerDownloadable) { Summarizer.create().catch(e => console.error(`${lc} Error triggering summarizer download: ${extractErrorMsg(e)}`)); }
                    if (isTranslatorDownloadable) { Translator.create({ sourceLanguage: 'en', targetLanguage: 'es' }).catch(e => console.error(`${lc} Error triggering translator download: ${extractErrorMsg(e)}`)); }
                    // Give a moment for the download to start before re-checking.
                    setTimeout(() => this.checkApiAvailabilityAndInit(), 500);
                };
            } else {
                retryApiCheckBtn.textContent = 'Retry API Check';
                retryApiCheckBtn.onclick = () => this.checkApiAvailabilityAndInit();
            }

        } catch (error: any) {
            if (error.message === 'RESTART_CHECK') {
                // This is our signal to re-run the entire check from the beginning.
                if (logalot) { console.log(`${lc} Restarting check after download completion.`); }
                setTimeout(() => this.checkApiAvailabilityAndInit(), 250); // Short delay allows API state to settle.
            } else {
                // Handle unexpected errors.
                console.error(`${lc} ${extractErrorMsg(error)}`);
                if (this.elements) {
                    this.elements.apiAvailabilityOverlay.classList.remove('collapsed');
                    const summarizerStatusSpan = this.elements.summarizerStatus.querySelector<HTMLElement>('.status');
                    if (summarizerStatusSpan) { summarizerStatusSpan.textContent = 'Error checking APIs.'; }
                    const translatorStatusSpan = this.elements.translatorStatus.querySelector<HTMLElement>('.status');
                    if (translatorStatusSpan) { translatorStatusSpan.textContent = 'See console for details.'; }
                }
            }
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    // #endregion checkApiAvailabilityAndInit


    private async getFilteredProjects(): Promise<ProjectIbGib_V1[]> {
        const lc = `${this.lc}[${this.getFilteredProjects.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 626d34b016b48d56ee0f2bd88e708d25)`); }

            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 5de728fad9988f0f620478585192e825)`); }
            const projectIbGibs = await getProjects({ metaspace, space });

            // todo: add filtering here

            return projectIbGibs;

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async deselectProjectAddr(): Promise<void> {
        const lc = `${this.lc}[${this.deselectProjectAddr.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5b0a759afa9af83806812c989871b925)`); }
            if (this.selectedProjectAddr === ROOT_ADDR) {
                if (logalot) { console.log(`${lc} no project selected. returning early... (I: 807525dde6980e4e5e9106e89fbcc425)`); }
                return; /* <<<< returns early */
            }

            // right now, this is all we do but this may be expanded in the near
            // future.
            this.selectedProjectAddr = ROOT_ADDR;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * @internal why do we have this and not just use the helper from page-analyzer-helpers.mts?
     */
    private _getNodeTextContent(nodeInfo: DOMElementInfo): string {
        const lc = `${this.lc}[${this._getNodeTextContent.name}]`;
        try {
            if (!nodeInfo) {
                throw new Error(`(UNEXPECTED) nodeInfo falsy? (E: 0e643e3a4068e217c49b2f088d41ba25)`);
            }

            if (nodeInfo.headingInfo?.headingText) {
                return nodeInfo.headingInfo.headingText; /* <<<< returns early */
            }

            if (!nodeInfo.content) {
                return ''; /* <<<< returns early */
            }

            return nodeInfo.content.map(child => {
                if (typeof child === 'string') {
                    return child.trim();
                } else if (child) {
                    return this._getNodeTextContent(child);
                }
                return '';
            }).join(' ').replace(/\s+/g, ' '); // a single space between text parts
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            return ''; // return empty string on error
        }
    }

    private _findNodeByGibId(gibId: string, node: DOMElementInfo | undefined = this._fullDomTree): DOMElementInfo | undefined {
        if (!node) { return undefined; }
        if (node.gibId === gibId) { return node; }
        if (node.content) {
            for (const child of node.content) {
                if (typeof child !== 'string') {
                    const found = this._findNodeByGibId(gibId, child);
                    if (found) { return found; }
                }
            }
        }
        return undefined;
    }

    private _recursivelyRemoveNodesByGibId(gibIdsToRemove: Set<string>, node: DOMElementInfo): void {
        const lc = `${this.lc}[${this._recursivelyRemoveNodesByGibId.name}]`;
        if (!node || !node.content || !Array.isArray(node.content)) {
            return;
        }

        // Filter out children whose gibId is in the set to remove
        node.content = node.content.filter(child => {
            if (typeof child === 'string') {
                return true; // Always keep string content
            }
            if (gibIdsToRemove.has(child.gibId)) {
                if (logalot) { console.log(`${lc} Removing node with gibId: ${child.gibId}`); }
                return false; // This is the node to remove, so filter it out
            }
            return true; // Keep this node
        });

        // Now, recurse on the remaining children to check their content
        node.content.forEach(child => {
            if (typeof child !== 'string') {
                this._recursivelyRemoveNodesByGibId(gibIdsToRemove, child);
            }
        });
    }

    private makeNodeRoot(gibId: string): void {
        const lc = `${this.lc}[${this.makeNodeRoot.name}]`;
        try {
            if (logalot) { console.log(`${lc} making gibId ${gibId} the root.`); }
            const newRoot = this._findNodeByGibId(gibId);
            if (newRoot) {
                newRoot.isRoot = true;
                this._currentDomRoot = newRoot;
                this._renderDomFromRoot();
                this.renderUI_updateGlobalCommandsState();
            } else {
                console.error(`${lc} Could not find node with gibId: ${gibId}`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    /**
     * Creates a project ibgib based on the given src comment ibgib.
     */
    private async createNewProject({
        title,
        href,
        srcCommentIbGib,
        metaspace,
        space,
        thinkingId,
    }: {
        title: string,
        href: string,
        srcCommentIbGib: CommentIbGib_V1,
        metaspace: MetaspaceService,
        space: IbGibSpaceAny,
        thinkingId?: string,
    }): Promise<ProjectIbGib_V1> {
        const lc = `${this.lc}[${this.createNewProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }

            const title_alphanumericsAndSpacesOnly = getSaferSubstring({
                text: title,
                keepLiterals: [' '],
                replaceMap: {
                    ':': ' -',
                },
            });

            if (thinkingId) {
                updateThinkingEntry(thinkingId, `Creating project: \"${title_alphanumericsAndSpacesOnly}\"...`);
            }
            const resProject = await createProjectIbGib({
                name: title_alphanumericsAndSpacesOnly,
                description: [`This project was auto-generated.`, '', `URL: ${href}`].join('\n'),
                saveInSpace: true,
                space,
                srcCommentIbGib,
            });

            const ibGib = resProject.newIbGib as ProjectIbGib_V1;
            if (logalot) { console.log(`${lc} newProject: ${pretty(ibGib)}`); }

            if (thinkingId) {
                updateThinkingEntry(thinkingId, 'Registering new project...');
            }
            await metaspace.registerNewIbGib({ ibGib, space, });

            return ibGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async autoChunk(): Promise<void> {
        const lc = `${this.lc}[${this.autoChunk.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8a1d5d6a8658bb8ba8a6814411a45825)`); }
            if (!this._fullDomTree) {
                console.warn(`${lc} Full DOM tree is not available. Cannot auto-chunk.`);
                return;
            }

            // Generate the new, chunked structure
            if (typeof this._fullDomTree.content === "string") {
                console.warn(`${lc} dom tree is string? (W: 9820488c5d48daad28d93ad80ded2825)`)
                return; /* <<<< returns early */
            }

            const chunkedTree = autoChunkByHeadings(this._currentDomRoot || this._fullDomTree);

            // Set the new structure as the current root and re-render
            this._currentDomRoot = chunkedTree;
            this._renderDomFromRoot();

            // Get the first expand button in newly chunked tree and click it.
            const firstExpandBtn = this.elements?.domTwinNodesContainer.querySelector<HTMLButtonElement>('.expand-btn');
            if (firstExpandBtn) { firstExpandBtn.click(); }

            if (logalot) { console.log(`${lc} Auto-chunking complete. DOM re-rendered.`); }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
