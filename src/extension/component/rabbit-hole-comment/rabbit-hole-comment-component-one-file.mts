import thisHtml from './rabbit-hole-comment.html';
import thisCss from './rabbit-hole-comment.css';
import stylesCss from '../../styles.css';
import rootCss from '../../../root.css';

import { delay, extractErrorMsg, getSaferSubstring, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getGibInfo, } from '@ibgib/ts-gib/dist/V1/index.mjs';
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { getLatestTimelineIbGibDto_nonLocking, mut8Timeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';
import { fnObs } from '@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from '../../../ui/component/ibgib-dynamic-component-bases.mjs';
import { ElementsBase, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "../../../ui/component/component-types.mjs";
import { getGlobalMetaspace_waitIfNeeded, getSummaryTextKeyForIbGib, getTitleFromSummarizer, getTocHeader_FromIbGib, getTranslationTextKeyForIbGib, isChunkCommentIb, } from '../../helpers.mjs';
import { getChunkRel8nName } from '../../helpers.mjs';
import { promptForConfirm, shadowRoot_getElementById } from '../../../helpers.web.mjs';
import { CHUNK_REL8N_NAME_DEFAULT_CONTEXT_SCOPE, PROJECT_TJP_ADDR_PROPNAME, } from '../../constants.mjs';
import { ProjectIbGib_V1 } from '../../../common/project/project-types.mjs';
import { LiveProxyIbGib } from '../../../witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs';
import { updateThinkingEntry } from '../../thinking-log.mjs';
import { SummarizerLength, SummarizerType } from '../../chrome-ai.mjs';
import { getComponentSvc } from '../../../ui/component/ibgib-component-service.mjs';
import { getPriorityQueueSvc, SUMMARY_PRIORITY_TITLE, SUMMARY_PRIORITY_USER_JUST_CLICKED, SummaryQueueInfo } from '../../priority-queue-service-one-file.mjs';
import { ChunkCommentData_V1 } from '../../types.mjs';


const logalot = GLOBAL_LOG_A_LOT || true;

export const RABBIT_HOLE_COMMENT_COMPONENT_NAME = 'rabbit-hole-comment';

export type SummaryFlavor = `${SummarizerType}_${SummarizerLength}`;
export type TranslationFlavor = `translation_${string}`; // e.g., translation_es, translation_fr
export type CommentViewMode = 'original' | 'children' | SummaryFlavor | TranslationFlavor;
export type ViewType = 'children' | 'tldr' | 'translation';

export class RabbitHoleCommentComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${RabbitHoleCommentComponentMeta.name}]`;

    // this is a one-off component, so no route for now.
    routeRegExp: RegExp = new RegExp(`^${RABBIT_HOLE_COMMENT_COMPONENT_NAME}$`);
    componentName: string = RABBIT_HOLE_COMMENT_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, RabbitHoleCommentComponentInstance);
    }

    async createInstance(arg: { path: string; ibGibAddr: IbGibAddr; }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const component = document.createElement(this.componentName) as RabbitHoleCommentComponentInstance;
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

/**
 * ## notes
 * * ElementsBase has headerEl, contentEl, footerEl.
 * * By convention, contentEl is  #rabbit-hole-comment-content. It serves as our
 *   main container for the details panel.
 */
interface RabbitHoleCommentElements extends ElementsBase {
    // top level elements
    /**
     * redeclared to be non-optional
     */
    headerEl: HTMLDivElement;
    expandBtn: HTMLButtonElement;
    textEl: HTMLParagraphElement;

    // #region command bar elements
    /**
     * command bar that lives in the expanded details view
     */
    commandBar: HTMLDivElement;

    highlightBtn: HTMLButtonElement;
    viewTypeGroup: HTMLDivElement;
    /**
     * choosing this view triggers the "break it down" functionality
     */
    keyPointsBtn: HTMLButtonElement;
    tldrBtn: HTMLButtonElement;
    translateBtn: HTMLButtonElement;


    viewLengthGroup: HTMLDivElement;
    shortBtn: HTMLButtonElement;
    longBtn: HTMLButtonElement;

    translationGroup: HTMLDivElement;
    languageDropdown: HTMLSelectElement;
    // #endregion command bar elements

    // view container
    /**
     * shown in the details section when a component is expanded. this contains
     * dynamically-generated summary views, as well as the {@link childrenView}.
     */
    viewContainer: HTMLDivElement;
    /**
     * contains any child rabbit hole components (composite pattern)
     */
    childrenView: HTMLDivElement;
}

export type TaskStatus = 'started' | 'complete';

export class RabbitHoleCommentComponentInstance
    extends IbGibDynamicComponentInstanceBase<CommentIbGib_V1, RabbitHoleCommentElements>
    implements IbGibDynamicComponentInstance<CommentIbGib_V1, RabbitHoleCommentElements> {

    protected override lc: string = `[${RabbitHoleCommentComponentInstance.name}]`;

    // #region state properties
    private _breakingDown = false;
    private isThinking: boolean = false;
    /**
     *
     */
    private queuedSummaryTasks: { [type_length: string]: TaskStatus } = {};
    private isHighlighted: boolean = false;
    /**
     * The user's desired view *type*, if selected.
     * This acts as the state for the view type radio button group.
     * @default undefined
     */
    private selectedType?: ViewType;
    /**
     * The user's desired summary *length*, if selected.
     * This acts as the state for the view length radio button group.
     * @default undefined
     */
    private selectedLength?: SummarizerLength;
    /**
     * The user's desired translation language, if selected.
     * This acts as the state for the language dropdown.
     * @default 'en-US'
     */
    private selectedTranslationLanguage: string = 'en-US';

    /**
     * The actual view being displayed.
     * This is derived from `selectedType` and `selectedLength`.
     */
    private viewMode: CommentViewMode = 'children';
    /**
     * Tracks the expanded/collapsed state of the details panel.
     * @default false
     */
    private _isExpanded: boolean = false; // Start collapsed
    private childComponents: RabbitHoleCommentComponentInstance[] = [];
    private get hasChildren(): boolean { return (this.childComponents ?? []).length > 0; }
    // #endregion state properties

    // #region project (ibGib, proxy, etc.)
    /**
     * The proxy witness used for updating the backing project ibGib.
     */
    private _projectProxy: LiveProxyIbGib<ProjectIbGib_V1> | undefined;
    /**
     * Backing ibgib getter via {@link _projectProxy.ibGib}
     */
    private get projectIbGib(): ProjectIbGib_V1 | undefined {
        return this._projectProxy?.ibGib;
    }
    /**
     * @internal helper to initialize proxy for this.project
     */
    private async setProject({
        project,
        space,
    }: {
        project: ProjectIbGib_V1,
        space: IbGibSpaceAny,
    }): Promise<void> {
        const lc = `${this.lc}[${this.setProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const projectProxy = new LiveProxyIbGib<ProjectIbGib_V1>();
            await projectProxy.initialized;
            if (!projectProxy.contextUpdated$) {
                throw new Error(`(UNEXPECTED) projectProxy.contextUpdated$ falsy? (E: genuuid)`);
            }
            projectProxy.contextUpdated$.subscribe(fnObs({
                next: async (nextIbGib) => {
                    const lcNext = `${lc}[projectProxy.contextUpdated$][next]`;
                    if (logalot) { console.log(`${lcNext} nextIbGib: ${pretty(nextIbGib)} (I: genuuid)`); }
                    // await this.handleContextUpdated_project(); // maybe will need this?
                },
                error: async (e) => {
                    debugger; // error in component.projectProxy.contextUpdated$ observable?
                    console.error(`${lc}[projectProxy.contextUpdated$][error] what up? ${extractErrorMsg(e)} (E: genuuid)`);
                },
            }));

            if (!projectProxy.newContextChild$) { throw new Error(`(UNEXPECTED) projectProxy.newContextChild$ falsy? (E: genuuid)`); }
            projectProxy.newContextChild$.subscribe(fnObs({
                next: async (childIbGib) => {
                    const lcNext = `${lc}[projectProxy.contextUpdated$][next]`;
                    if (logalot) { console.log(`${lcNext} childIbGib: ${pretty(childIbGib)} (I: genuuid)`); }
                    // await this.handleNewContextChild_project({ childIbGib });
                },
                error: async (e) => {
                    debugger; // error in component.projectProxy.contextUpdated$ observable?
                    console.error(`${lc}[projectProxy.contextUpdated$][error] what up? ${extractErrorMsg(e)}`);
                },
            }));
            /**
             * not necessary, I'm just putting this here to remind myself that
             * we can dynamically assign a space (via spaceId) to a proxy ibgib.
             */
            const _ignoredSpace = await projectProxy.witness(space);
            const _ignored = await projectProxy.witness(project);
            this._projectProxy = projectProxy;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    // #endregion project (ibGib, proxy, etc.)

    get isRootSrc(): boolean {
        const data = this.ibGib?.data as ChunkCommentData_V1 | undefined;
        return !!data?.domInfo?.isRoot;
    }

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            await super.initialize(opts);
            await this.loadIbGib({ getLatest: true });
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) ibGib is falsy? (E: genuuid)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data is falsy? (E: genuuid)`) }

            const data: any = this.ibGib.data;

            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: b25cc31e4c88aa26b831e46809418825)`); }

            // #region init this project ibgib
            if (!data[PROJECT_TJP_ADDR_PROPNAME]) { throw new Error(`(UNEXPECTED) data[${PROJECT_TJP_ADDR_PROPNAME}] falsy? (E: 517fe831ccd85cea9c95cb484ed2a825)`); }
            const projectAddr: IbGibAddr = data[PROJECT_TJP_ADDR_PROPNAME];
            const project =
                await getLatestTimelineIbGibDto_nonLocking<ProjectIbGib_V1>({
                    timelineAddr: projectAddr,
                    metaspace,
                    space,
                });
            await this.setProject({ project, space });
            // #endregion init this project ibgib

            // if (logalot) { console.log(`${lc} Context loaded. Project: ${this.project?.data?.name}, Page Title: ${this.pageContentInfo?.title}`); }
        } catch (error) {
            // we need an actual error mechanism proper in the component
            // architecture that shows an error message and sets an error flag,
            // but for now we just log
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
            await this.agentsInitialized;

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy after initElements? (E: 0f121994516f32b99808eff8e86f5825)`); }

            // Set up event listeners
            const {
                headerEl, expandBtn, highlightBtn,
                keyPointsBtn, tldrBtn, shortBtn, longBtn,
                translateBtn,
                languageDropdown,
            } = this.elements;
            headerEl.addEventListener('click', () => this.handleClick_header());
            expandBtn.addEventListener('click', (event) => this.handleClick_expandBtn(event));
            highlightBtn.addEventListener('click', (event) => this.handleClick_highlight(event));

            keyPointsBtn.addEventListener('click', () => this.handleClick_viewType('children'));
            tldrBtn.addEventListener('click', () => this.handleClick_viewType('tldr'));
            shortBtn.addEventListener('click', () => this.handleClick_viewLength('short'));
            longBtn.addEventListener('click', () => this.handleClick_viewLength('long'));

            translateBtn.addEventListener('click', () => this.handleClick_viewType('translation'));
            languageDropdown.addEventListener('change', (e) => this.handleChange_languageDropdown(e));

            // Perform an initial render to get the component on the screen.
            await this.renderUI();

            if (!this.ibGib) {
                console.error(`${lc} this.ibGib falsy? maybe this is ok but hmm... (E: genuuid)`);
                return; /* <<<< returns early */
            }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: a6e7f8b43bf118f085d8db9d3011d225)`); }
            if (!this.ibGib.data.text) { throw new Error(`(UNEXPECTED) this.ibGib.data.text falsy? (E: 8e658d099d76e93f38d23429f1af5825)`); }

            const queueSvc = getPriorityQueueSvc();
            const { data } = this.ibGib;

            // If component is a stub, enqueue title generation.
            if (!data.title) {
                if (logalot) { console.log(`${lc} I am a stub. Enqueuing title generation.`); }
                this.isThinking = true;
                await this.renderUI();
                queueSvc.enqueue({
                    type: 'summary',
                    ibGib: this.ibGib!,
                    priority: SUMMARY_PRIORITY_TITLE,
                    thinkingId: this.getThinkingIdFromTjpGib(),
                    options: {
                        text: data.text, type: 'headline', length: 'short', isTitle: true,
                    } as SummaryQueueInfo,
                });
            }

            // Set the initial view mode based on whether children already exist.
            const chunkRel8nName = getChunkRel8nName({ contextScope: CHUNK_REL8N_NAME_DEFAULT_CONTEXT_SCOPE });
            const childAddrs = this.ibGib?.rel8ns?.[chunkRel8nName] ?? [];
            if (childAddrs.length > 0) {
                // It's a branch, so default to children view.
                await this.renderUI_children({ childAddrs });
                this.viewMode = 'children';
                this.selectedType = 'children';
            } else {
                // It's a leaf, so default to tldr_short view.
                // this.viewMode = 'tldr_short';
                // this.selectedType = 'tldr';
                // this.selectedLength = 'short';
            }
            // Re-render to show correct button states, etc.
            await this.renderUI();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getThinkingIdFromTjpGib(): string | undefined {
        if (this.ibGib) {
            const tjpGib = getGibInfo({ gib: this.gib }).tjpGib ?? this.gib;
            return tjpGib.substring(0, 16);
        } else {
            return undefined;
        }
    }

    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            await super.renderUI();

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: f02db8c33382a16dc846e0d8f1d4b825)`); }
            const {
                textEl, contentEl, commandBar, keyPointsBtn, tldrBtn,
                shortBtn, longBtn,
                translateBtn,
                headerEl, highlightBtn,
            } = this.elements;

            // Reset UI state
            this.classList.remove('thinking');
            if (this.isThinking) { this.classList.add('thinking'); }

            // Set the header text
            const displayText = getTocHeader_FromIbGib({ ibGib: this.ibGib });
            textEl.textContent = displayText;

            // Manage visibility of the details panel
            if (this._isExpanded) {
                contentEl.classList.remove('collapsed');
                headerEl.classList.add('expanded');
            } else {
                contentEl.classList.add('collapsed');
                headerEl.classList.remove('expanded');
            }

            // #region Command Bar UI Logic
            if (this.isRootSrc) {
                // The root comment is just a container for the ToC; it has no summaries of its own.
                commandBar.classList.add('collapsed');
            } else {
                commandBar.classList.remove('collapsed');

                // reset active states
                keyPointsBtn.classList.remove('active');
                tldrBtn.classList.remove('active');
                translateBtn.classList.remove('active'); // new
                shortBtn.classList.remove('active');
                longBtn.classList.remove('active');

                // Set active class on the correct type button
                if (this.selectedType === 'children') {
                    keyPointsBtn.classList.add('active');
                } else if (this.selectedType === 'tldr') {
                    tldrBtn.classList.add('active');
                } else if (this.selectedType === 'translation') { // new
                    translateBtn.classList.add('active'); // new
                }

                // The length group is ONLY visible when 'tldr' has been chosen.
                const { viewLengthGroup, translationGroup, languageDropdown } = this.elements; // new
                if (this.selectedType === 'tldr') {
                    viewLengthGroup.classList.remove('collapsed');
                    // Set active class on the correct length button
                    if (this.selectedLength === 'short') {
                        shortBtn.classList.add('active');
                    } else if (this.selectedLength === 'long') {
                        longBtn.classList.add('active');
                    }
                } else {
                    viewLengthGroup.classList.add('collapsed');
                }

                // The translation group is ONLY visible when 'translation' has been chosen. (new)
                if (this.selectedType === 'translation') { // new
                    translationGroup.classList.remove('collapsed'); // new
                    languageDropdown.value = this.selectedTranslationLanguage; // new
                } else { // new
                    translationGroup.classList.add('collapsed'); // new
                }
            }
            // #endregion


            await this.renderUI_highlightBtn();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async renderUI_highlightBtn(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_highlightBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: dc571bb1253b2ea3e2dc9ab815139825)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 60eda849f8a44e0d6df64348c97a5825)`); }
            const { highlightBtn } = this.elements;

            highlightBtn.classList.toggle('active', this.isHighlighted);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

    private async renderUI_children({
        childAddrs,
    }: {
        childAddrs: IbGibAddr[],
    }): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_children.name}]`;
        try {
            if (logalot) { console.log(`${lc}[${childAddrs.length} children] starting... (I: aa38f12e5a581356d8e23ab8d4697825)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy (E: genuuid)`); }

            this.elements.childrenView.innerHTML = ''; // clear existing DOM

            this.childComponents = []; // clear existing component instances

            const componentSvc = await getComponentSvc();

            for (const childAddr of childAddrs) {
                // Use the service to get an instance of the child component.
                const childInstance =
                    await componentSvc.getComponentInstance({
                        path: RABBIT_HOLE_COMMENT_COMPONENT_NAME,
                        ibGibAddr: childAddr,
                        useRegExpPrefilter: true,
                    }) as RabbitHoleCommentComponentInstance;

                if (!childInstance) {
                    console.error(`${lc} (UNEXPECTED) childInstance falsy? couldn't get a component for addr: ${childAddr}?`);
                    continue; // skip this child if it can't be created
                }

                // Add the new instance to our internal tracking array.
                this.childComponents.push(childInstance);

                // Use the service to inject the component into the DOM.
                const divChild = document.createElement('div');
                divChild.classList.add('comment-child');
                this.elements.childrenView.appendChild(divChild);

                await componentSvc.inject({
                    parentEl: divChild,
                    componentToInject: childInstance,
                });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region handleClick

    private async handleClick_expandBtn(event: MouseEvent): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_expandBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }

            // Stop the click from bubbling up to the header's navigation handler.
            event.stopPropagation();

            // Toggle the internal state
            this._isExpanded = !this._isExpanded;

            // The renderUI method is the single source of truth for applying CSS classes.
            // If we are expanding, we may also need to load a specific view.
            if (this._isExpanded) {
                if (this.selectedType) {
                    await this.switchToView({ view: this.viewMode });
                } else if (this.isRootSrc && this.hasChildren) {
                    await this.switchToView({ view: 'children' });
                } else {
                    await this.renderUI();
                }
            } else {
                // When collapsing, we just need to re-render to hide the content.
                await this.renderUI();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private async handleClick_highlight(event: MouseEvent): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_highlight.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            event.stopPropagation(); // Prevent header navigation

            // Kick off the recursive highlight, starting with the new state.
            await this.setHighlightState(!this.isHighlighted);

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    /**
     * Sets the highlight state for this component and all its descendants.
     * It also sends the message to the content script to update the DOM twin.
     */
    private async setHighlightState(shouldBeHighlighted: boolean): Promise<void> {
        const lc = `${this.lc}[${this.setHighlightState.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... shouldBeHighlighted: ${shouldBeHighlighted}`); }

            // 1. Set the state for the current component.
            this.isHighlighted = shouldBeHighlighted;

            // 2. Send the message to the content script to update the DOM twin.
            const gibId = this.ibGib?.data?.domInfo?.gibId ?? '';
            if (gibId) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'toggleHighlight',
                        gibId: gibId,
                        shouldBeHighlighted: this.isHighlighted,
                    });
                }
            }

            // 3. Update this component's UI.
            await this.renderUI();

            // 4. Recursively call for all children.
            for (const child of this.childComponents) {
                await child.setHighlightState(shouldBeHighlighted);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    /**
     * Handles clicks on the view length buttons (e.g., Short, Long).
     * This is the final step that triggers a summary task.
     */
    private async handleClick_viewLength(length: SummarizerLength): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_viewLength.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... length: ${length}`); }
            this.selectedLength = length;

            if (this.selectedType === 'tldr') {
                // Construct the viewMode and switch to it, which will trigger AI if needed.
                this.viewMode = `${this.selectedType}_${this.selectedLength}`;
                await this.switchToView({ view: this.viewMode });
            } else {
                // This case shouldn't be reachable if buttons are collapsed, but as a fallback,
                // we'll just render the button states.
                await this.renderUI();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private async handleClick_header(): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_header.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (expanded: ${this._isExpanded})`); }

            await this.scrollToGib();
            this.isHighlighted = false;
            this.renderUI_highlightBtn();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    /**
     * Handles clicks on the view type buttons (e.g., Children, TLDR).
     */
    private async handleClick_viewType(type: ViewType): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_viewType.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... type: ${type}`); }

            // Hide any previous views when switching types.
            if (this.elements) {
                this.elements.viewContainer.querySelectorAll<HTMLDivElement>('.view')
                    .forEach(v => v.classList.add('collapsed'));
            }

            this.selectedType = type;
            this.selectedLength = undefined; // Reset length selection on type change

            if (type === 'children') {
                if (this.hasChildren) {
                    await this.switchToView({ view: 'children' });
                } else {
                    await this.breakItDown();
                }
            } else if (type === 'tldr') {
                // Just re-render to show the length options. Don't trigger AI yet.
                await this.renderUI();
            } else if (type === 'translation') {
                // Construct the viewMode from state and switch to it.
                this.viewMode = `translation_${this.selectedTranslationLanguage}`;
                await this.switchToView({ view: this.viewMode });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }


    private async handleChange_languageDropdown(event: Event): Promise<void> {
        const lc = `${this.lc}[${this.handleChange_languageDropdown.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const target = event.target as HTMLSelectElement;
            const newLanguage = target.value;
            this.selectedTranslationLanguage = newLanguage;

            if (this.selectedType === 'translation') {
                // If we are already in translation mode, switching the language should
                // immediately trigger a new translation.
                this.viewMode = `translation_${this.selectedTranslationLanguage}`;
                await this.switchToView({ view: this.viewMode });
            } else {
                // If not in translation mode, we don't need to do anything besides
                // updating the state, which we've already done.
                await this.renderUI();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }


    // #endregion handleClick

    private async scrollToGib(): Promise<void> {
        const lc = `${this.lc}[${this.scrollToGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 660978e4ac2832399f6f70a80b3dc725)`); }
            if (!this.ib) { throw new Error(`(UNEXPECTED) this.ib falsy? (E: b12d98e127c3306178d70ff81ca93125)`); }

            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 159e2542c5a8e3ac88e2f8e279236225)`); }

            const gibId = this.ibGib.data.domInfo?.gibId ?? '';

            if (logalot) { console.log(`${lc} Found gibId: ${gibId}. Sending message to content script.`); }
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) { throw new Error(`(UNEXPECTED) could not find active tab to message.`); }

            chrome.tabs.sendMessage(tab.id, {
                type: 'scrollToGib',
                gibId: gibId,
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            // Don't rethrow, as this is a non-critical UI interaction.
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region switchToView
    private async switchToView({ view }: { view: CommentViewMode }): Promise<void> {
        const lc = `${this.lc}[${this.switchToView.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... view: ${view}`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 8a7c6d5e4f3b4c9e8a1b2c3d4e5f6a7b)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e)`); }

            this.viewMode = view; // Set the current view mode
            const { viewContainer } = this.elements;

            // 1. Hide all views to start fresh
            const allViews = viewContainer.querySelectorAll<HTMLDivElement>('.view');
            allViews.forEach(v => v.classList.add('collapsed'));

            // 2. Get the container for the target view, creating it if it doesn't exist.
            const targetViewEl = this.getOrCreateView(view);

            // 3. Dispatch to the appropriate sub-method to populate the view.
            if (view === 'children') {
                await this.switchToView_children({ targetViewEl });
            } else if (view === 'original') {
                await this.switchToView_original({ targetViewEl });
            } else if (view.startsWith('translation_')) {
                await this.switchToView_translation({ view: view as TranslationFlavor, targetViewEl });
            } else {
                // This is a summary view, e.g., 'tldr_short'
                await this.switchToView_summary({ view: view as SummaryFlavor, targetViewEl });
            }

            // 4. Show the target view.
            targetViewEl.classList.remove('collapsed');

            // 5. Render the component's chrome (header, buttons, etc.).
            await this.renderUI();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            this.isThinking = false;
            await this.renderUI();
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async switchToView_children({
        targetViewEl,
    }: {
        targetViewEl: HTMLDivElement
    }): Promise<void> {
        const lc = `${this.lc}[${this.switchToView_children.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy?`); }

            const childAddrs = this.ibGib.rel8ns?.[getChunkRel8nName({ contextScope: 'default' })] ?? [];
            // Only re-render children if the count has changed to avoid DOM thrashing.
            if (childAddrs.length !== this.childComponents.length) {
                await this.renderUI_children({ childAddrs });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async switchToView_original({
        targetViewEl,
    }: {
        targetViewEl: HTMLDivElement
    }): Promise<void> {
        const lc = `${this.lc}[${this.switchToView_original.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy?`); }

            if (targetViewEl.innerHTML === '') {
                targetViewEl.innerHTML = `<p>${this.ibGib.data?.text ?? '(No text)'}</p>`;
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async switchToView_summary({
        view,
        targetViewEl,
    }: {
        view: SummaryFlavor,
        targetViewEl: HTMLDivElement,
    }): Promise<void> {
        const lc = `${this.lc}[${this.switchToView_summary.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.ibGib?.data) { throw new Error(`(UNEXPECTED) ibGib.data is falsy?`); }

            const [type, length] = view.split('_');
            const summaryKey = getSummaryTextKeyForIbGib({ type: type as SummarizerType, length: length as SummarizerLength });
            const summaryText = this.ibGib.data[summaryKey];

            if (summaryText) {
                this.isThinking = false;
                targetViewEl.innerHTML = `<p>${summaryText}</p>`;
            } else {
                this.isThinking = true;
                targetViewEl.textContent = `Generating ${view.replace('_', ' ')}...`;

                if (!this.queuedSummaryTasks[summaryKey]) {
                    this.queuedSummaryTasks[summaryKey] = 'started';
                    const queueSvc = getPriorityQueueSvc();
                    queueSvc.enqueue({
                        type: 'summary',
                        ibGib: this.ibGib,
                        priority: SUMMARY_PRIORITY_USER_JUST_CLICKED,
                        thinkingId: this.getThinkingIdFromTjpGib(),
                        options: {
                            text: this.ibGib.data.text!,
                            type: type as SummarizerType,
                            length: length as SummarizerLength,
                            isTitle: false,
                        } as SummaryQueueInfo,
                    });
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async switchToView_translation({
        view,
        targetViewEl,
    }: {
        view: TranslationFlavor,
        targetViewEl: HTMLDivElement,
    }): Promise<void> {
        const lc = `${this.lc}[${this.switchToView_translation.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.ibGib?.data) { throw new Error(`(UNEXPECTED) ibGib.data is falsy?`); }

            const targetLang = view.split('_')[1];
            // As you specified, for now, we only translate the base .text property.
            const sourceDataKey = 'text';
            const translationKey = getTranslationTextKeyForIbGib({ dataKey: sourceDataKey, targetLanguage: targetLang });
            const translatedText = this.ibGib.data[translationKey];

            if (translatedText) {
                this.isThinking = false;
                targetViewEl.innerHTML = `<p>${translatedText}</p>`;
            } else {
                this.isThinking = true;
                targetViewEl.textContent = `Translating to ${targetLang}...`;

                (async () => {
                    try {
                        const textToTranslate = this.ibGib!.data![sourceDataKey]!;
                        if (!textToTranslate) { throw new Error(`Source text at data.${sourceDataKey} is empty.`); }

                        const detector = await LanguageDetector.create();
                        const langResults = await detector.detect(textToTranslate);
                        const sourceLang = (langResults[0]?.detectedLanguage) ?? 'en';

                        const optionToHide = this.elements?.languageDropdown.querySelector<HTMLOptionElement>(`option[value="${sourceLang}"]`);
                        if (optionToHide) { optionToHide.style.display = 'none'; }

                        const translator = await Translator.create({ sourceLanguage: sourceLang, targetLanguage: targetLang });
                        const translation = await translator.translate(textToTranslate);

                        const metaspace = await getGlobalMetaspace_waitIfNeeded();
                        const space = await metaspace.getLocalUserSpace({ lock: false });
                        if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space.`); }

                        const dataToAdd = { [translationKey]: translation };
                        await mut8Timeline({
                            timeline: this.ibGib,
                            mut8Opts: { dataToAddOrPatch: dataToAdd },
                            metaspace,
                            space,
                        });

                    } catch (error) {
                        console.error(`${lc} inline translation failed: ${extractErrorMsg(error)}`);
                        this.isThinking = false;
                        if (this.viewMode === view) {
                            targetViewEl.textContent = `Translation failed. See console for details.`;
                        }
                        await this.renderUI();
                    }
                })();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }
    // #endregion switchToView

    /**
     * Public method to initiate the chunking process.
     * This can be called from outside the component, e.g., by the sidepanel
     * after initial creation.
     */
    // public async breakItDown(): Promise<void> {
    //     const lc = `${this.lc}[${this.breakItDown.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting...`); }

    //         console.error(`${lc} not implemented...needs to be updated for new twin dom approach. (E: 9e4aec549ea63df5bcf2ac0a8598d525)`);
    //         // throw new Error(`not implemented...needs to be updated for new twin dom approach. (E: 9e4aec549ea63df5bcf2ac0a8598d525)`);

    //         // // Step 1: Set thinking state and update UI to show it.
    //         // this.isThinking = true;
    //         // await this.renderUI();

    //         // // Step 2: Gather data for the background chunking operation.
    //         // if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: f1f388d432988b84ba02fb48634b9a25)`); }
    //         // if (!this.projectIbGib) { throw new Error(`(UNEXPECTED) this.projectIbGib falsy? (E: a615c8102d14b83e181f55081c932a25)`); }

    //         // const content = this.ibGib.data?.text ?? '';
    //         // const thinkingId = addThinkingEntry(`breaking down "${getSaferSubstring({ text: content, length: 25 })}"...`);

    //         // const metaspace = await getGlobalMetaspace_waitIfNeeded();
    //         // const space = await metaspace.getLocalUserSpace({ lock: false });
    //         // if (!space) { throw new Error(`(UNEXPECTED) couldn't get space (E: genuuid)`); }

    //         // // Step 3: Kick off stub creation. This is fast.
    //         // // The component's ibGibProxy will automatically detect this change and
    //         // // trigger handleContextUpdated, which handles rendering the stubs.
    //         // await chunkCommentIbGib({
    //         //     srcCommentIbGib: this.ibGib as CommentIbGib_V1,
    //         //     // We pass pageContentInfo only if this is the root.
    //         //     pageContentInfo: this.isRootSrc ? this.pageContentInfo : undefined,
    //         //     project: this.projectIbGib,
    //         //     thinkingId,
    //         //     // title is no longer created or passed here
    //         //     metaspace,
    //         //     space,
    //         //     skipLock: true,
    //         // });
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         // If something goes wrong, reset the thinking state.
    //         this.isThinking = false;
    //         await this.renderUI();
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    public async breakItDown(): Promise<void> {
        const lc = `${this.lc}[${this.breakItDown.name}]`;
        if (this._breakingDown) {
            console.log(`${lc} already breaking down...(I: 784baa9d97376cf77cd4ea1804aa8825)`);
            return; /* <<<< returns early */
        }
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            this._breakingDown = true;

            // =================================================================
            // Step 1: CONFIRM with the user if children already exist.
            // =================================================================
            if (this.hasChildren) {
                const confirm = await promptForConfirm({
                    msg: "This action will replace the existing key points with new ones. Are you sure you want to continue?",
                    yesLabel: "YES, forget those",
                    noLabel: "NO, let's keep those",
                });
                if (!confirm) {
                    if (logalot) { console.log(`${lc} User cancelled the operation.`); }
                    // If they cancel, we need to revert the button state back to 'children' view
                    // without actually performing the breakdown.
                    this.selectedType = 'children';
                    await this.switchToView({ view: 'children' });
                    return; /* <<<< returns early */
                }
            }

            // If we've made it this far, either there were no children or the user confirmed.
            console.error(`${lc} not implemented...needs to be updated for new twin dom approach. (E: 9e4aec549ea63df5bcf2ac0a8598d525)`);
            // throw new Error(`not implemented...needs to be updated for new twin dom approach. (E: 9e4aec549ea63df5bcf2ac0a8598d525)`);

            // // Step 2: Set thinking state and update UI to show it.
            // this.isThinking = true;
            // await this.renderUI();

            // ... (rest of the implementation will go here)

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            // If something goes wrong, reset the thinking state.
            this.isThinking = false;
            await this.renderUI();
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    /**
     * Handles the click event from the component's own "Break It Down" button.
     */
    private async handleBreakItDownClick(): Promise<void> {
        await this.breakItDown();
    }

    /**
     * If this component's ibGib does not have a title, this will use the AI
     * to generate one and mut8 the ibGib, which will trigger a re-render.
     * This is intended to be called after the component has already been
     * rendered as a "stub".
     */
    public async generateTitle({
        thinkingId,
    }: {
        thinkingId?: string,
    }): Promise<string | undefined> {
        const lc = `${this.lc}[${this.generateTitle.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 58cfb85d41c80aac8c6d98059ab03425)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 3ec17829f1086bf99c26e1382e8b6a25)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 341d38298578e438b8ed633954ece825)`); }
            if (!this.ibGib.data.text) { throw new Error(`(UNEXPECTED) this.ibGib.data.text falsy? (E: 7e124ce0f698874198d1a9580c7d0825)`); }

            if (this.ibGib.data.title) {
                if (logalot) { console.log(`${lc} already has a title. (I: genuuid)`); }
                return undefined; /* <<<< returns early */
            }

            if (thinkingId) {
                updateThinkingEntry(thinkingId, `generating title for "${getSaferSubstring({ text: this.ibGib?.data?.text ?? 'hmm...wha?', length: 32 })}"...`);
            }

            const title = await getTitleFromSummarizer({
                content: this.ibGib.data.text,
                useCaseDescription: 'creating a heading in a table of contents',
                thinkingId,
            });

            if (logalot) { console.log(`${lc} generated title: "${title}" (I: genuuid)`); }
            if (thinkingId) { updateThinkingEntry(thinkingId, 'title created.'); }

            return title;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            if (thinkingId) { updateThinkingEntry(thinkingId, `title create failed: ${extractErrorMsg(error)}`, /*isComplete*/ true, /*isError*/ true); }
            //    throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 949cabfb12a57b69efa241b8fbad1825)`); }

            this.elements = {
                // top-level elements
                headerEl: shadowRoot_getElementById(this.shadowRoot, 'rabbit-hole-comment-header'),
                expandBtn: shadowRoot_getElementById(this.shadowRoot, 'expand-btn'),
                textEl: shadowRoot_getElementById(this.shadowRoot, 'comment-text'),
                contentEl: shadowRoot_getElementById(this.shadowRoot, 'rabbit-hole-comment-content'),

                // command bar elements
                commandBar: shadowRoot_getElementById(this.shadowRoot, 'command-bar'),
                highlightBtn: shadowRoot_getElementById(this.shadowRoot, 'highlight-btn'),
                viewTypeGroup: shadowRoot_getElementById(this.shadowRoot, 'view-type-group'),
                keyPointsBtn: shadowRoot_getElementById(this.shadowRoot, 'key-points-btn'),
                tldrBtn: shadowRoot_getElementById(this.shadowRoot, 'tldr-btn'),
                translateBtn: shadowRoot_getElementById(this.shadowRoot, 'translate-btn'),
                viewLengthGroup: shadowRoot_getElementById(this.shadowRoot, 'view-length-group'),
                shortBtn: shadowRoot_getElementById(this.shadowRoot, 'short-btn'),
                longBtn: shadowRoot_getElementById(this.shadowRoot, 'long-btn'),
                translationGroup: shadowRoot_getElementById(this.shadowRoot, 'translation-group'),
                languageDropdown: shadowRoot_getElementById(this.shadowRoot, 'language-dropdown'),

                // view container and specific views
                viewContainer: shadowRoot_getElementById(this.shadowRoot, 'view-container'),
                childrenView: shadowRoot_getElementById(this.shadowRoot, 'children-view'),
            };


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getOrCreateView(view: CommentViewMode): HTMLDivElement {
        const lc = `${this.lc}[${this.getOrCreateView.name}]`;
        if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy. (E: c8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4)`); }
        const { viewContainer } = this.elements;

        // View IDs are convention-based, e.g., 'tldr_short' -> 'tldr_short-view'
        const viewId = `${view}-view`;

        let viewEl = viewContainer.querySelector<HTMLDivElement>(`#${viewId}`);

        if (!viewEl) {
            if (logalot) { console.log(`${lc} creating new view: ${viewId}`); }
            // If it doesn't exist, create, append, and then select it.
            viewEl = document.createElement('div');
            viewEl.id = viewId;
            viewEl.classList.add('view');
            viewContainer.appendChild(viewEl);
        }

        return viewEl;
    }

    protected override async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            await super.handleContextUpdated(); // handles updating this.ibGibAddr
            if (logalot) { console.log(`${lc} starting... context updated.`); }
            if (!this.ibGib) { return; } // nothing to do

            /**
             * no matter what, we check our data to see if we have new summary
             * data that changed via the async task queue svc
             */
            await this.updateSummaryTaskStatus_andBreakingDownFlag();

            const chunkRel8nName = getChunkRel8nName({ contextScope: CHUNK_REL8N_NAME_DEFAULT_CONTEXT_SCOPE });
            const childAddrs = this.ibGib.rel8ns?.[chunkRel8nName] ?? [];

            // Scenario 1: Children were just added (e.g., after "break it down").
            // We check against this.childComponents.length to only trigger this on the FIRST population.
            if (childAddrs.length > 0 && childAddrs.length !== this.childComponents.length) {
                this.isThinking = false; // "break it down" background task is complete.
                await this.switchToView({ view: 'children' });
            } else {
                // Scenario 2: No new children. This is a data-only update (e.g., a summary finished).
                // We just need to refresh the current view.
                if (logalot) { console.log(`${lc} context updated. Assuming data change (e.g., summary finished). Refreshing current view: ${this.viewMode}`); }
                this.isThinking = false; // The background task is complete.
                // Re-running switchToView will find the new summary data on the ibGib
                // and populate the correct view container, replacing the "Generating..." message.
                await this.switchToView({ view: this.viewMode });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            this.isThinking = false;
            await this.renderUI(); // Safe fallback to update component chrome on error.
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async updateSummaryTaskStatus_andBreakingDownFlag(): Promise<void> {
        const lc = `${this.lc}[${this.updateSummaryTaskStatus_andBreakingDownFlag.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 68c98a597bf83f6338c2645ea2ea4e25)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 08f6c868ef287e4548a8e708952bdd25)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 08f6c868ef287e4548a8e708952bdd25)`); }

            const data = this.ibGib.data as ChunkCommentData_V1;
            const keysCompleted: string[] = [];
            Object.entries(this.queuedSummaryTasks)
                .filter(([_key, status]) => status === 'started')
                .forEach(([key, _status]) => {
                    if (!!data[key]) { keysCompleted.push(key); }
                });
            keysCompleted.forEach(key => {
                this.queuedSummaryTasks[key] = 'complete';
            });

            // const summaryKey = getSummaryTextKeyForIbGib({ type: view.split('_')[0] as SummarizerType, length: view.split('_')[1] as SummarizerLength });
            // const summaryText = this.ibGib.data?.[summaryKey];

            if (this._breakingDown && this.hasChildren) {
                this._breakingDown = false;
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async handleNewContextChild({ childIbGib }: { childIbGib: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        // We are using handleContextUpdated to handle all children at once.
        // So we don't need to do anything here for now.
        if (logalot) { console.log(`${lc} triggered but unhandled. (childIbGib: ${pretty(childIbGib)})`); }
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
}
