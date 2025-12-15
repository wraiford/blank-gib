import thisHtml from './rabbit-hole-comment.html';
import thisCss from './rabbit-hole-comment.css';
import stylesCss from '../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg, getSaferSubstring, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getGibInfo, } from '@ibgib/ts-gib/dist/V1/index.mjs';
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { getLatestTimelineIbGibDto_nonLocking, mut8Timeline } from '@ibgib/core-gib/dist/timeline/timeline-api.mjs';
import { fnObs } from '@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
import { debounce } from '@ibgib/web-gib/dist/helpers.mjs';
import { promptForConfirm, shadowRoot_getElementById } from "@ibgib/web-gib/dist/helpers.web.mjs";
import { LiveProxyIbGib } from '@ibgib/web-gib/dist/witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs';
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { ElementsBase, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { getComponentSvc } from '@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs';
import { ProjectIbGib_V1 } from '@ibgib/web-gib/dist/common/project/project-types.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import {
    getChunkRel8nName, getGlobalMetaspace_waitIfNeeded,
    getSummaryTextKeyForIbGib, getTitleFromSummarizer, getTocHeader_FromIbGib,
    getTranslationTextKeyForIbGib,
} from '../../helpers.mjs';
import { PROJECT_TJP_ADDR_PROPNAME, } from '../../constants.mjs';
import { updateThinkingEntry } from '../../thinking-log.mjs';
import { SummarizerLength, SummarizerType } from '../../chrome-ai.mjs';
import {
    getPriorityQueueSvc, PriorityQueueInfo,
    QUEUE_SERVICE_PRIORITY_SUMMARY_TITLE,
    QUEUE_SERVICE_PRIORITY_USER_JUST_CLICKED, SummaryQueueInfo,
    TranslationQueueInfo
} from '../../priority-queue-service-one-file.mjs';
import { ChunkCommentData_V1 } from '../../types.mjs';
import { getComponentCtorArg } from '../../../helpers.web.mjs';


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
        super(getComponentCtorArg());
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
    /** redeclared to be non-optional */
    headerEl: HTMLDivElement;
    expandBtn: HTMLButtonElement;
    commentText: HTMLParagraphElement;

    // main command bar buttons
    commandBar: HTMLDivElement;
    highlightBtn: HTMLButtonElement;
    keyPointsBtn: HTMLButtonElement;
    tldrBtn: HTMLButtonElement;
    translateBtn: HTMLButtonElement;

    // content/view areas
    contentEl: HTMLDivElement;
    viewContainer: HTMLDivElement;

    // templates for dynamic views
    tldrViewTemplate: HTMLTemplateElement;
    translationViewTemplate: HTMLTemplateElement;
    keyPointsViewTemplate: HTMLTemplateElement;
}


export class RabbitHoleCommentComponentInstance
    extends IbGibDynamicComponentInstanceBase<CommentIbGib_V1, RabbitHoleCommentElements>
    implements IbGibDynamicComponentInstance<CommentIbGib_V1, RabbitHoleCommentElements> {

    protected override lc: string = `[${RabbitHoleCommentComponentInstance.name}]`;

    // #region state properties
    private _breakingDown = false;
    /**
     * ref counter for long-running tasks
     *
     * if this is greater than 0, then the thinking animation shows.
     */
    private isThinking_refCount: number = 0;
    /**
     * long running tasks, for when we call the built-in AI API calls using the
     * queue service.
     */
    private allTasks: { [key: string]: PriorityQueueInfo } = {};
    /**
     * {@link allTasks} tasks that have a {@link PriorityQueueInfo.status} of
     * 'queued'
     */
    private get enqueuedTasks(): { [key: string]: PriorityQueueInfo } {
        const filteredTasks: { [key: string]: PriorityQueueInfo } = {};
        for (const key in this.allTasks) {
            if (this.allTasks[key].status === 'queued') {
                filteredTasks[key] = this.allTasks[key];
            }
        }
        return filteredTasks;
    }
    /**
     * {@link allTasks} tasks that have a {@link PriorityQueueInfo.status} of
     * 'complete'
     */
    private get completeTasks(): { [key: string]: PriorityQueueInfo } {
        const filteredTasks: { [key: string]: PriorityQueueInfo } = {};
        for (const key in this.allTasks) {
            if (this.allTasks[key].status === 'complete') {
                filteredTasks[key] = this.allTasks[key];
            }
        }
        return filteredTasks;
    }
    /**
     * {@link allTasks} tasks that have a {@link PriorityQueueInfo.status} of
     * 'errored'
     */
    private get erroredTasks(): { [key: string]: PriorityQueueInfo } {
        const filteredTasks: { [key: string]: PriorityQueueInfo } = {};
        for (const key in this.allTasks) {
            if (this.allTasks[key].status === 'errored') {
                filteredTasks[key] = this.allTasks[key];
            }
        }
        return filteredTasks;
    }

    private isHighlighted: boolean = false;

    /**
     * Tracks the expanded/collapsed state of the details panel.
     * @default false
     */
    private _isExpanded: boolean = false; // Start collapsed
    private childComponents: RabbitHoleCommentComponentInstance[] = [];
    protected get hasChildren(): boolean {
        const chunkRel8nName = getChunkRel8nName({ contextScope: 'default' });
        const childAddrs = this.ibGib?.rel8ns?.[chunkRel8nName] ?? [];
        return childAddrs.length > 0;
    }

    private activeTldrLength: SummarizerLength | undefined;
    private activeDetailViews: {
        [key in 'tldr' | 'translation' | 'keyPoints']: boolean
    } = {
            tldr: false,
            translation: false,
            keyPoints: false,
        };

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
                keyPointsBtn, tldrBtn,
                translateBtn,
            } = this.elements;

            headerEl.addEventListener('click', () => this.handleClick_header());
            expandBtn.addEventListener('click', (event) => this.handleClick_expandBtn(event));
            highlightBtn.addEventListener('click', (event) => this.handleClick_highlight(event));

            // UPDATED: Pointing to new toggle handlers
            // handleClick_toggleView
            tldrBtn.addEventListener('click', () => this.handleClick_toggleView({ viewName: 'tldr' }));
            translateBtn.addEventListener('click', () => this.handleClick_toggleView({ viewName: 'translation' }));
            keyPointsBtn.addEventListener('click', () => this.handleClick_toggleView({ viewName: 'keyPoints' }));
            // tldrBtn.addEventListener('click', () => this.handleClick_toggleTldrView());
            // translateBtn.addEventListener('click', () => this.handleClick_toggleTranslationView());
            // keyPointsBtn.addEventListener('click', () => this.handleClick_toggleKeyPointsView());

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
                queueSvc.enqueue({
                    type: 'summary',
                    ibGib: this.ibGib!,
                    priority: QUEUE_SERVICE_PRIORITY_SUMMARY_TITLE,
                    thinkingId: this.getThinkingIdFromTjpGib(),
                    options: {
                        text: data.text, type: 'headline', length: 'short', isTitle: true,
                    } as SummaryQueueInfo,
                    fnOnQueued: async (info) => {
                        this.isThinking_refCount++;
                        await this.renderUI_thinking();
                    },
                    fnOnComplete: async (info) => {
                        this.isThinking_refCount--;
                        await this.renderUI_thinking();
                    },
                    fnOnError: async (info) => {
                        this.isThinking_refCount--;
                        await this.renderUI_thinking();
                    },
                });
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            console.log(`${lc} no implementation right now (I: genuuid)`);
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
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 949cabfb12a57b69efa241b8fbad1825)`); }

            this.elements = {
                headerEl: shadowRoot_getElementById(this.shadowRoot, 'rabbit-hole-comment-header'),
                expandBtn: shadowRoot_getElementById(this.shadowRoot, 'expand-btn'),
                commentText: shadowRoot_getElementById(this.shadowRoot, 'comment-text'),

                // main command bar buttons
                commandBar: shadowRoot_getElementById(this.shadowRoot, 'command-bar'),
                highlightBtn: shadowRoot_getElementById(this.shadowRoot, 'highlight-btn'),
                keyPointsBtn: shadowRoot_getElementById(this.shadowRoot, 'key-points-btn'),
                tldrBtn: shadowRoot_getElementById(this.shadowRoot, 'tldr-btn'),
                translateBtn: shadowRoot_getElementById(this.shadowRoot, 'translate-btn'),

                // content/view areas
                contentEl: shadowRoot_getElementById(this.shadowRoot, 'rabbit-hole-comment-content'),
                viewContainer: shadowRoot_getElementById(this.shadowRoot, 'view-container'),

                // templates for dynamic views
                tldrViewTemplate: shadowRoot_getElementById(this.shadowRoot, 'tldr-view-template'),
                translationViewTemplate: shadowRoot_getElementById(this.shadowRoot, 'translation-view-template'),
                keyPointsViewTemplate: shadowRoot_getElementById(this.shadowRoot, 'key-points-view-template'),
            };

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    protected override async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            await super.handleContextUpdated();
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 8cfa3f53f5582c4348b21ab897c38a25)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 2f1e180d29264ab738e917789df87e25)`); }

            await this.updateBreakingDownFlag();

            // Finally, call the main render function to update the entire component
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            await this.renderUI();
        }
    }

    protected override async handleNewContextChild({ childIbGib }: { childIbGib: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        // We are using handleContextUpdated to handle all children at once.
        // So we don't need to do anything here for now.
        if (logalot) { console.log(`${lc} triggered but unhandled. (childIbGib: ${pretty(childIbGib)})`); }
    }

    // #region renderUI

    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            await super.renderUI();

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy?`); }
            const {
                commentText, contentEl, headerEl,
                keyPointsBtn, tldrBtn, translateBtn,
            } = this.elements;

            // header text
            const headerText = getTocHeader_FromIbGib({ ibGib: this.ibGib });
            commentText.textContent = headerText;

            await this.renderUI_highlightBtn();

            // buttons states
            tldrBtn.classList.toggle('active', this.activeDetailViews.tldr);
            translateBtn.classList.toggle('active', this.activeDetailViews.translation);
            keyPointsBtn.classList.toggle('active', this.activeDetailViews.keyPoints);
            keyPointsBtn.disabled = !this.hasChildren;

            // expanded-related
            if (this._isExpanded) {
                contentEl.classList.remove('collapsed');
                headerEl.classList.add('expanded');
                await this.renderUI_tldrView();
                await this.renderUI_translationView();
                await this.renderUI_keyPointsView();
            } else {
                contentEl.classList.add('collapsed');
                headerEl.classList.remove('expanded');
            }

            await this.renderUI_thinking();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    protected async renderUI_thinking(): Promise<void> {
        this.classList.toggle('thinking', this.isThinking_refCount > 0);
    }

    /**
     * renders the tldr view, creating it if needed.
     *
     * this will trigger the tldr summarization if not already started, which
     * isn't strictly good for a render method, but there it is.
     */
    private async renderUI_tldrView(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_tldrView.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8fe038f13d669c1c483887e2bcd97725)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: e7ae18b272977f21baa90e7857841825)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 8146c8feba88da8ca889f97357fd0725)`); }

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: da0a18037c587f607833149e9ed73825)`); }
            const { viewContainer } = this.elements;

            let tldrView = viewContainer.querySelector<HTMLDivElement>('#tldr-detail-view');
            if (this.activeDetailViews.tldr && !tldrView) {
                // If view is active but doesn't exist in DOM, create it.
                this.createDetailView_tldr();
                // And re-select it after creation.
                tldrView = viewContainer.querySelector<HTMLDivElement>('#tldr-detail-view');
            }
            if (!tldrView || !this.activeTldrLength) { return; /* <<<< returns early */ }

            // the view exists, toggle its visibility based on the active state.
            tldrView.classList.toggle('collapsed', !this.activeDetailViews.tldr);

            // Update button states
            tldrView.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            tldrView.querySelector<HTMLButtonElement>(`[data-view-length="${this.activeTldrLength}"]`)?.classList.add('active');

            const contentView = tldrView.querySelector<HTMLDivElement>('.detail-view-content');
            if (!contentView) { console.error(`${lc} contentView not found in view.`); return; }

            const length = this.activeTldrLength;
            const key = getSummaryTextKeyForIbGib({ type: 'tldr', length });
            const tldrText = this.ibGib.data[key];
            if (tldrText) {
                // Data exists, render it.
                contentView.innerHTML = `<p>${tldrText}</p>`;
            } else {
                // Data does not exist, so show the generating message and queue
                // task if not already done so.
                contentView.innerHTML = `<p>Generating ${length} tl;dr summary...</p>`;

                const alreadyQueued = Object.keys(this.enqueuedTasks).some((k) => k === key);
                if (!alreadyQueued) {
                    const queueSvc = getPriorityQueueSvc();
                    queueSvc.enqueue({
                        type: 'summary',
                        ibGib: this.ibGib!,
                        priority: QUEUE_SERVICE_PRIORITY_USER_JUST_CLICKED,
                        thinkingId: this.getThinkingIdFromTjpGib(),
                        options: {
                            text: this.ibGib?.data?.text!,
                            type: 'tldr',
                            length,
                            isTitle: false,
                        } as SummaryQueueInfo,
                        fnOnQueued: async (info) => {
                            this.allTasks[key] = info;
                            this.isThinking_refCount++;
                            await this.renderUI_thinking();
                        },
                        fnOnComplete: async (info) => {
                            this.isThinking_refCount--;
                            await this.renderUI_thinking();
                        },
                        fnOnError: async (info) => {
                            this.isThinking_refCount--;
                            await this.renderUI_thinking();
                        },
                    });
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderUI_translationView(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_translationView.name}]`;
        try {
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: e6ac285ebf68a4d5b8dbbc757edd1c25)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: b65d0855667875be489410989a0d3525)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }

            let translationView = this.elements.viewContainer.querySelector<HTMLDivElement>('#translation-detail-view');

            if (!this.activeDetailViews.translation) {
                if (translationView) { translationView.classList.add('collapsed'); }
                return; /* <<<< returns early */
            }

            // Create the view if needed
            translationView ??= await this.createDetailView_translation();
            const sourceInput = translationView.querySelector<HTMLInputElement>('.source-language-input');
            if (!sourceInput) { throw new Error(`(UNEXPECTED) couldn't get sourceInput from translationView? (E: a3de9a298718e47248208b0b2c8e5825)`); }
            const languageDropdown = translationView.querySelector<HTMLSelectElement>('.language-dropdown');
            if (!languageDropdown) { throw new Error(`(UNEXPECTED) couldn't get languageDropdown from translationView? (E: 15a8c2118a9763993d7dd688a89cec25)`); }

            const translationViewContent = translationView.querySelector<HTMLDivElement>('.detail-view-content');
            if (!translationViewContent) { throw new Error(`(UNEXPECTED) couldn't get translationViewContent from translationView? (E: d1d5822919e8d08aa1700a2360d83325)`); }

            const sourceLanguage = sourceInput.value;
            const targetLanguage = languageDropdown.value;
            if (sourceLanguage && targetLanguage) {
                /**
                 * right now, we're only doing ibGib.data.text translations. in
                 * the future, we will be doing tldr translations I think, but
                 * may be yagni.
                 */
                const dataKey = 'text';
                const key = getTranslationTextKeyForIbGib({
                    dataKey,
                    targetLanguage,
                });
                const translationText = this.ibGib.data[key] as (string | undefined);
                if (translationText) {
                    const paragraphs = translationText.split('\n');
                    const paragraphsHtml = paragraphs.map(x => `<p>${x}</p>`).join('\n');
                    translationViewContent.innerHTML = paragraphsHtml;
                } else {
                    translationViewContent.innerHTML = `<p>Translating from ${sourceLanguage} into ${targetLanguage}...</p>`;
                }

            } else {
                translationViewContent.innerHTML = '<p>Select a language...</p>';
            }

            // Toggle visibility based on the active flag.
            translationView.classList.toggle('collapsed', !this.activeDetailViews.translation);

            if (this.activeDetailViews.translation) {
                // If the view is visible, ensure its content is up-to-date.
                if (sourceInput?.value && languageDropdown?.value) {
                    this.renderUI_translationView_content(translationView, sourceInput.value, languageDropdown.value);
                } else {
                    // Clear content if no language is selected.
                    const contentView = translationView.querySelector<HTMLDivElement>('.detail-view-content');
                    if (contentView) { contentView.innerHTML = ''; }
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private renderUI_translationView_content(view: HTMLDivElement, sourceLanguage: string, targetLanguage: string): void {
        const lc = `${this.lc}[${this.renderUI_translationView_content.name}]`;
        if (!this.ibGib?.data || !view) { return; }

        const contentView = view.querySelector<HTMLDivElement>('.detail-view-content');
        if (!contentView) { console.error(`${lc} contentView not found in view.`); return; }

        const dataKey = 'text'; // we only do this.ibGib.text atow 11/2025
        const translationKey = getTranslationTextKeyForIbGib({
            dataKey,
            targetLanguage,
        });
        const translationText = this.ibGib.data[translationKey] as string | undefined;

        if (translationText) {
            const paragraphs = translationText.split('\n');
            const paragraphsHtml = paragraphs.map(x => `<p>${x}</p>`).join('\n');
            contentView.innerHTML = paragraphsHtml;
        } else {
            //
            // Check if this task is queued or in-progress.
            let resFilter = Object.entries(this.enqueuedTasks).filter(([key, x]) => {
                if (x.type !== 'translation') { return false; };
                let opts = x.options as TranslationQueueInfo;
                return (opts.dataKey === dataKey && opts.targetLanguage === targetLanguage);
            });
            if (resFilter.length === 1) {
                // we just finished this task, so why no translationText?

            } else if (resFilter.length > 1) {
                throw new Error(`(UNEXPECTED) more than one task for the same translation opts? (E: 2bc578a50ff8b9fad25953f4b9022825)`);
            } else {
                // length === 0, i.e., task is just started
                contentView.innerHTML = `<p>Translating from ${sourceLanguage} into ${targetLanguage}...</p>`;
            }
        }
    }

    private async renderUI_keyPointsView(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_keyPointsView.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8fe038f13d669c1c483887e2bcd97725)`); }

            // createDetailView_keyPoints
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: genuuid)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }

            let keypointsView = this.elements.viewContainer.querySelector<HTMLDivElement>('#key-points-detail-view');

            if (!this.activeDetailViews.keyPoints) {
                if (keypointsView) { keypointsView.classList.add('collapsed'); }
                return; /* <<<< returns early */
            }

            // Create the view if needed
            keypointsView ??= await this.createDetailView_keyPoints();

            // don't do anything further atm
            // console.error(`${lc} not implemented yet (E: cb04c863a828d357c7ef0a08196f6825)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
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

    // #endregion renderUI

    // #region handleClick

    private async handleClick_expandBtn(event: MouseEvent): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_expandBtn.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }

            // Stop the click from bubbling up to the header's navigation handler.
            event.stopPropagation();

            // Toggle the internal state
            this._isExpanded = !this._isExpanded;

            // If we are EXPANDING and this component HAS children, default to
            // showing the key points view automatically.
            if (this._isExpanded && this.hasChildren) {
                this.activeDetailViews.keyPoints = true;
            }

            // The renderUI method is now the single source of truth for visibility.
            // It will show/hide the content panel and any active detail views based on component state.
            await this.renderUI();

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

    private async handleClick_toggleView({
        viewName,
    }: {
        viewName: keyof RabbitHoleCommentComponentInstance['activeDetailViews']
    }): Promise<void> {
        const lc = `${this.lc}[_handleViewToggle]`;
        try {
            if (logalot) { console.log(`${lc} starting... viewName: ${viewName}`); }

            // Determine if the view is about to become active.
            const becomingActive = !this.activeDetailViews[viewName];
            this.activeDetailViews[viewName] = becomingActive;

            if (becomingActive) {
                // If we're turning a view ON, always ensure the main panel is expanded.
                this._isExpanded = true;
            } else {
                // If we're turning a view OFF, check if any other views are still active.
                const anyViewsActive = Object.values(this.activeDetailViews).some(isActive => isActive);
                if (!anyViewsActive) {
                    // If no views are left, collapse the main panel.
                    this._isExpanded = false;
                }
            }

            // Special case: If we're activating "Key Points" for the first time, generate them.
            if (viewName === 'keyPoints' && becomingActive && !this.hasChildren) {
                await this.breakItDown();
                // The breakItDown process calls renderUI itself, so we can exit early.
                return;
            }

            // For all other cases, call the main render function to update the DOM.
            await this.renderUI();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
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
     * Handles a click on a length button within a TLDR detail view.
     * This is where the AI summary task would be triggered.
     */
    private async handleClick_tldrLength(length: SummarizerLength, view: HTMLDivElement): Promise<void> {
        const lc = `${this.lc}[${this.handleClick_tldrLength.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... length: ${length}`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 7e6c0b4623116a4759f006760433a825)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 3c15480612df256a1d05ddb803fb1825)`); }

            this.activeTldrLength = length;

            await this.renderUI_tldrView();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    // #endregion handleClick

    private async handleChange_translationLanguage(event: Event): Promise<void> {
        const lc = `${this.lc}[${this.handleChange_translationLanguage.name}]`;
        try {
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: genuuid)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: c16d4fe6e948d79f310acafee3597425)`); }

            const select = event.target as HTMLSelectElement;
            const view = select.closest<HTMLDivElement>('.detail-view');
            if (!view) { throw new Error(`(UNEXPECTED) could not find parent view.`); }

            const targetLanguage = select.value;
            if (!targetLanguage) {
                // User selected "Select...", so clear the content.
                const contentView = view.querySelector<HTMLDivElement>('.detail-view-content');
                if (contentView) { contentView.innerHTML = ''; }
                return;
            }

            const sourceInput = view.querySelector<HTMLInputElement>('.source-language-input');
            const sourceLanguage = sourceInput?.value ?? 'en';
            const text = this.ibGib.data?.text ?? '';
            if (!text) { return; } // Nothing to translate

            const dataKey = 'text'; // we only do this.ibGib.text atow 11/2025
            const translationKey = getTranslationTextKeyForIbGib({
                dataKey,
                targetLanguage,
            });
            const existingTranslation = this.ibGib.data[translationKey];

            // If we don't already have this translation and it's not already started...
            if (existingTranslation) {
                await this.renderUI_translationView();
            } else if (!existingTranslation && !this.enqueuedTasks[translationKey]) {
                const queueSvc = getPriorityQueueSvc();
                queueSvc.enqueue({
                    type: 'translation',
                    ibGib: this.ibGib,
                    priority: QUEUE_SERVICE_PRIORITY_USER_JUST_CLICKED,
                    thinkingId: this.getThinkingIdFromTjpGib(),
                    options: { dataKey, sourceLanguage, targetLanguage, text } as TranslationQueueInfo,
                    fnOnQueued: async (info) => {
                        // Defer to the main render loop to show "Translating..." or the result.
                        this.enqueuedTasks[translationKey] = info;

                        this.isThinking_refCount++;
                        await this.renderUI_thinking();
                    },
                    fnOnComplete: async (info) => {
                        this.isThinking_refCount--;
                        await this.renderUI_thinking();
                    },
                    fnOnError: async (info) => {
                        this.isThinking_refCount--;
                        await this.renderUI_thinking();
                        // do what here?
                        console.error(`${lc} the translation info failed. now what? (E: genuuid)`);
                        // this.tasksToHandle.push(info);
                        // Defer to the main render loop to show "Translating..." or the result.
                        await this.renderUI();
                    },
                });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    // #region createDetailView

    private createDetailView_tldr(): void {
        const lc = `${this.lc}[${this.createDetailView_tldr.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }

            // Clone the template
            const tldrTemplate = this.elements.tldrViewTemplate;
            const tldrViewClone = tldrTemplate.content.cloneNode(true) as DocumentFragment;
            const tldrView = tldrViewClone.firstElementChild as HTMLDivElement;

            if (!tldrView) { throw new Error(`(UNEXPECTED) Cloning tldr-view-template failed? (E: genuuid)`); }

            // Wire up internal controls
            const shortBtn = tldrView.querySelector<HTMLButtonElement>('[data-view-length="short"]');
            const longBtn = tldrView.querySelector<HTMLButtonElement>('[data-view-length="long"]');

            if (!shortBtn || !longBtn) { throw new Error(`(UNEXPECTED) Could not find length buttons in TLDR template clone? (E: genuuid)`); }

            shortBtn.addEventListener('click', () => this.handleClick_tldrLength('short', tldrView));
            longBtn.addEventListener('click', () => this.handleClick_tldrLength('long', tldrView));

            // Append to the DOM
            this.elements.viewContainer.appendChild(tldrView);

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async createDetailView_translation(): Promise<HTMLDivElement> {
        const lc = `${this.lc}[${this.createDetailView_translation.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) elements not initialized.`); }

            const template = this.elements.translationViewTemplate;
            const viewClone = template.content.cloneNode(true) as DocumentFragment;
            const view = viewClone.firstElementChild as HTMLDivElement;
            if (!view) { throw new Error(`(UNEXPECTED) Cloning translation-view-template failed? (E: genuuid)`); }

            const sourceInput = view.querySelector<HTMLInputElement>('.source-language-input');
            const languageDropdown = view.querySelector<HTMLSelectElement>('.language-dropdown');
            if (!sourceInput || !languageDropdown) { throw new Error(`Could not find controls in Translation template clone. (E: genuuid)`); }

            const updateDropdown = () => {
                const sourceLang = sourceInput.value.toLowerCase();
                languageDropdown.querySelectorAll('option').forEach(opt => {
                    const shouldHide = opt.value !== '' && opt.value === sourceLang;
                    opt.style.display = shouldHide ? 'none' : '';
                    if (shouldHide && opt.selected) { languageDropdown.value = ''; }
                });
            };

            sourceInput.addEventListener('input', debounce(updateDropdown, 300));
            // Attach our new handler to the 'change' event.
            languageDropdown.addEventListener('change', (e) => this.handleChange_translationLanguage(e));

            this.elements.viewContainer.appendChild(view);

            // --- Language Detection ---
            sourceInput.value = 'Detecting...';
            sourceInput.disabled = true;
            let detectedLanguage = 'en';
            try {
                const textToDetect = this.ibGib?.data?.text ?? '';
                if (textToDetect) {
                    const detector = await LanguageDetector.create();
                    const langResults = await detector.detect(textToDetect);
                    detectedLanguage = (langResults[0]?.detectedLanguage) ?? 'en';
                }
            } catch (error) {
                console.error(`${lc} Language detection failed. Defaulting to 'en'. ${extractErrorMsg(error)} (E: genuuid)`);
            } finally {
                sourceInput.value = detectedLanguage;
                sourceInput.disabled = false;
                updateDropdown();
            }

            return view;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    private async createDetailView_keyPoints(): Promise<HTMLDivElement> {
        const lc = `${this.lc}[${this.createDetailView_keyPoints.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: genuuid)`); }

            // 1. Clone the template
            const template = this.elements.keyPointsViewTemplate;
            const viewClone = template.content.cloneNode(true) as DocumentFragment;
            const view = viewClone.firstElementChild as HTMLDivElement;
            if (!view) { throw new Error(`(UNEXPECTED) Cloning key-points-view-template failed. (E: genuuid)`); }

            // Append the view ahead of time so we see progress as children are
            // added to DOM
            this.elements.viewContainer.appendChild(view);

            const contentView = view.querySelector<HTMLDivElement>('.detail-view-content');
            if (!contentView) { throw new Error(`(UNEXPECTED) Could not find content area in Key Points template clone. (E: genuuid)`); }

            // Get Child Data
            const chunkRel8nName = getChunkRel8nName({ contextScope: 'default' });
            const childAddrs = this.ibGib.rel8ns?.[chunkRel8nName] ?? [];

            if (childAddrs.length === 0) {
                if (logalot) { console.log(`${lc} No children to render. (I: genuuid)`); }
                // We could put a message here, but for now, we'll just be blank if there are no children.
            }

            // Render Child Components into the new view's content area
            this.childComponents = []; // clear existing component instances
            const componentSvc = await getComponentSvc();

            for (const childAddr of childAddrs) {
                const childInstance =
                    await componentSvc.getComponentInstance({
                        path: RABBIT_HOLE_COMMENT_COMPONENT_NAME,
                        ibGibAddr: childAddr,
                        useRegExpPrefilter: true,
                    }) as RabbitHoleCommentComponentInstance;

                if (!childInstance) {
                    console.error(`${lc} (UNEXPECTED) could not get a component for addr: ${childAddr} (E: genuuid)`);
                    continue;
                }

                this.childComponents.push(childInstance);
                const divChild = document.createElement('div');
                divChild.classList.add('comment-child');
                contentView.appendChild(divChild); // Append to the content area of our new clone

                await componentSvc.inject({
                    parentEl: divChild,
                    componentToInject: childInstance,
                });
            }

            return view;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    // #endregion createDetailView

    // #region other helpers

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

    private async breakItDown(): Promise<void> {
        const lc = `${this.lc}[${this.breakItDown.name}]`;
        if (this._breakingDown) { return; /* <<<< returns early */ }

        try {
            this._breakingDown = true;

            // Confirm with user if children already exist.
            if (this.hasChildren) {
                const confirm = await promptForConfirm({
                    msg: "This will replace the existing key points. Are you sure?",
                    yesLabel: "YES, Replace Them",
                    noLabel: "NO, Keep Them",
                });
                if (!confirm) {
                    this.activeDetailViews.keyPoints = false; // Revert state
                    await this.renderUI(); // Update button to be inactive
                    this._breakingDown = false; // Reset flag
                    return; /* <<<< returns early */
                }
            }

            // Set thinking state and update UI to show it.
            this.isThinking_refCount++;
            await this.renderUI_thinking();

            // NOTE: The actual chunking implementation is still pending.
            // We will eventually re-integrate the `chunkCommentIbGib` call here.
            console.error(`${lc} not fully implemented...needs to call chunkCommentIbGib. (E: 9e4aec549ea63df5bcf2ac0a8598d525)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            this.isThinking_refCount--;
            this._breakingDown = false;
            await this.renderUI();
        }
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

            // 3. Update just this component's highlight button UI.
            await this.renderUI_highlightBtn();

            // 4. Recursively call for all children.
            for (const child of this.childComponents) {
                await child.setHighlightState(shouldBeHighlighted);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private async updateBreakingDownFlag(): Promise<void> {
        const lc = `${this.lc}[${this.updateBreakingDownFlag.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 68c98a597bf83f6338c2645ea2ea4e25)`); }

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 08f6c868ef287e4548a8e708952bdd25)`); }
            if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 08f6c868ef287e4548a8e708952bdd25)`); }

            const data = this.ibGib.data as ChunkCommentData_V1;
            // const keysCompleted: string[] = [];
            // Object.entries(this.queuedTasks)
            //     .filter(([_key, status]) => status === 'started')
            //     .forEach(([key, _status]) => {
            //         if (!!data[key]) { keysCompleted.push(key); }
            //     });
            // keysCompleted.forEach(key => {
            //     this.queuedTasks[key] = 'complete';
            // });

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

    private getThinkingIdFromTjpGib(): string | undefined {
        if (this.ibGib) {
            const tjpGib = getGibInfo({ gib: this.gib }).tjpGib ?? this.gib;
            return tjpGib.substring(0, 16);
        } else {
            return undefined;
        }
    }

    // #endregion other helpers
}
