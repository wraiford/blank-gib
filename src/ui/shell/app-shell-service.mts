import { delay, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { ROOT_ADDR } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

import {
    ARMY_STORE, BLANK_GIB_DB_NAME, CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP, GLOBAL_LOG_A_LOT,
    KEY_TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT,
    TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT_ENOUGH_ALREADY,
} from "../../constants.mjs";
import { getMaskedSecret } from "../../helpers.mjs";
import {
    handleLocalSPAAnchorClick,
    simpleIbGibRouterSingleton as router,
} from "../router/router-one-file.mjs";
import { RouterAppName } from "../../common/app-constants.mjs";
import {
    alertUser, document_getElementById, getDefaultFnGetAPIKey,
    getGlobalMetaspace_waitIfNeeded, getIbGibGlobalThis_BlankGib,
    highlightElement, isExecutingInBlankGibWebAppProper, promptForAPIKey,
    promptForConfirm, updateAPIKeyInStorage,
} from "../../helpers.web.mjs";
import { storageGet, storagePut } from "../../storage/storage-helpers.web.mjs";
import {
    ID_APP_SHELL, ID_HEADER_PANEL, ID_PANEL_CONTAINER, ID_LEFT_PANEL,
    ID_LEFT_PANEL_CONTENT, ID_LEFT_PANEL_FOOTER, ID_LEFT_PANEL_HEADER,
    ID_LEFT_PANEL_MAXIMIZE_HANDLE, ID_PROJECT_EXPLORER_TAB_BUTTON,
    ID_PROJECT_EXPLORER_TAB_CONTENT, ID_RIGHT_PANEL, ID_RIGHT_PANEL_CONTENT,
    ID_RIGHT_PANEL_FOOTER, ID_RIGHT_PANEL_HEADER,
    ID_RIGHT_PANEL_MAXIMIZE_HANDLE, ID_FOOTER_PANEL, ID_FOOTER_INPUT_CONTAINER,
    ID_WEB10_TAB_BUTTON, ID_WEB10_TAB_CONTENT, ID_TAG_NAV,
    ID_LEFT_PANEL_COLLAPSE_HANDLE, ID_LEFT_PANEL_EXPAND_HANDLE,
    ID_RIGHT_PANEL_COLLAPSE_HANDLE, ID_RIGHT_PANEL_EXPAND_HANDLE,
    ID_FOOTER_PANEL_COLLAPSE_HANDLE, ID_FOOTER_PANEL_EXPAND_HANDLE,
    ID_FOOTER_PANEL_MAXIMIZE_HANDLE, ID_CENTER_PANEL_CONTENT, ID_WEB_1_NAV,
    ID_TAB_BUTTON_CHRONOLOGYS, ID_HEADER_PANEL_CONTENT, ID_IBGIB_COM_TITLE_LINK,
    ID_CHRONOLOGYS_CONTENT, ID_LEFT_PANEL_PROJECT_LIST,
} from './shell-constants.mjs';
import { getComponentSvc, IbGibComponentService } from "../component/ibgib-component-service.mjs";
import { IbGibDynamicComponentMeta } from "../component/component-types.mjs";
import { CanvasComponentMeta } from "../../components/canvas/canvas-component-one-file.mjs";
import { ProjectsComponentMeta } from "../../components/projects/projects-component-one-file.mjs";
import { ProjectComponentMeta } from "../../components/projects/project/project-component-one-file.mjs";
import { BREADCRUMB_COMPONENT_NAME, BreadcrumbComponentInstance, BreadcrumbComponentMeta } from "../../components/common/breadcrumb/breadcrumb-component-one-file.mjs";
import { INPUT_COMPONENT_NAME, InputComponentInstance, InputComponentMeta } from "../../components/common/input/input-component-one-file.mjs";
import { CHRONOLOGYS_COMPONENT_NAME, ChronologysComponentInstance, ChronologysComponentMeta } from "../../components/chronologys/chronologys-component-one-file.mjs";
import { ChronologyComponentMeta } from "../../components/common/chronology/chronology-component-one-file.mjs";
import { RawComponentMeta } from "../../components/common/raw/raw-component-one-file.mjs";
import { TextEditorComponentMeta } from "../../components/common/text-editor/text-editor-component-one-file.mjs";
import { getExistingUIInfo } from "../ui-helpers.mjs";
import { MinigameComponentMeta } from "../../components/minigame/minigame-component-one-file.mjs";
import { TypingComponentMeta } from "../../components/minigame/typing/typing-component-one-file.mjs";
import { PROJECTS_EXPLORER_COMPONENT_NAME, ProjectsExplorerComponentInstance, ProjectsExplorerComponentMeta } from "../../components/projects/projects-explorer/projects-explorer-component-one-file.mjs";
import { componentsMeta_Web1 } from "../../components/web1/web1-constants.mjs";
import { ExplorerItemComponentMeta } from "../../components/common/explorer-item/explorer-item-component-one-file.mjs";


const logalot = GLOBAL_LOG_A_LOT;

type PanelType = 'leftPanel' | 'rightPanel' | 'footerPanel' | 'headerPanel' | 'centerPanel';

type PanelStatus = 'collapsed' | 'expanded' | 'maximized' | 'default';

interface PanelState {
    status: PanelStatus; // Use the new PanelState type here
    width?: string | null;
    height?: string | null;
}
/**
 * For use with maximizing center panel. We want to capture the panel states so
 * that if the center panel is restored (either "expanded" or "collapsed"), then
 * we restore the exact state.
 */
interface PanelStates {
    headerPanel: PanelState;
    leftPanel: PanelState;
    rightPanel: PanelState;
    footerPanel: PanelState;
}

export class AppShellService {
    /** log context */
    private lc: string = `[${AppShellService.name}]`;

    // #region elements

    private appShell: HTMLElement | null = null;
    private headerPanel: HTMLElement | null = null;
    private headerPanelContent: HTMLElement | null = null;
    private ibGibComTitleLink: HTMLElement | null = null;
    /**
     * this contains the left, center, and right panels.
     */
    private panelContainer: HTMLElement | null = null;
    private leftPanel: HTMLElement | null = null;
    private leftPanelHeader: HTMLElement | null = null;
    private leftPanelContent: HTMLElement | null = null;
    // private projectList: HTMLElement | null = null;
    private leftPanelFooter: HTMLElement | null = null;
    private leftPanelCollapseHandle: HTMLElement | null = null;
    private leftPanelExpandHandle: HTMLElement | null = null;
    private leftPanelMaximizeHandle: HTMLElement | null = null;
    private leftPanelHamburgerBtn: HTMLButtonElement | null = null;
    private leftPanelCloseBtn: HTMLButtonElement | null = null;

    private rightPanel: HTMLElement | null = null;
    private rightPanelHeader: HTMLElement | null = null;
    private rightPanelContent: HTMLElement | null = null;
    private chronologysContent: HTMLElement | null = null;
    private rightPanelFooter: HTMLElement | null = null;
    private rightPanelCollapseHandle: HTMLElement | null = null;
    private rightPanelExpandHandle: HTMLElement | null = null;
    private rightPanelMaximizeHandle: HTMLElement | null = null;
    private footerPanel: HTMLElement | null = null;
    private footerInputContainer: HTMLElement | null = null;
    private footerPanelCollapseHandle: HTMLElement | null = null;
    private footerPanelExpandHandle: HTMLElement | null = null;
    private footerPanelMaximizeHandle: HTMLElement | null = null;
    private centerPanelContent: HTMLElement | null = null;

    private leftHandles: HTMLElement[] = [];
    private leftPanels: HTMLElement[] = [];
    private leftAll: HTMLElement[] = [];
    private rightHandles: HTMLElement[] = [];
    private rightPanels: HTMLElement[] = [];
    private rightAll: HTMLElement[] = [];
    private footerHandles: HTMLElement[] = [];
    private footerPanels: HTMLElement[] = [];
    private footerAll: HTMLElement[] = [];

    // #endregion elements

    /**
     * When true, the app is in a mobile-first view (i.e., small screen).
     */
    private isMobileView: boolean = false;
    private mobileMediaQuery: MediaQueryList | null = null;

    /**
     * if scroll down, then this number will be negative. if scroll up this will be
     * positive.
     *
     * ## driving intent
     *
     * hide the header as we scroll center panel content
     */
    private centerPanelScrollOffset = 0;
    private lastCenterPanelScrollTop = 0;
    private initialHeaderPanelHeight = 0;
    private initialHeaderPanelHeightPctOfAppShell = 0;

    /**
     * ## driving use case
     *
     * for use when maximizing/expanding/collapsing center panel
     */
    private lastPanelStates: PanelStates | undefined = undefined;

    /**
     * flag to track center panel maximized state
     */
    private isCenterPanelMaximized = false;
    /**
     * publicly exposed so consumers can just manually change this as needed
     * from anywhere (since this service is a singleton)
     */
    breadcrumbComponent: BreadcrumbComponentInstance | undefined;

    inputComponent: InputComponentInstance | undefined;

    componentSvc: IbGibComponentService | undefined;

    initialized: Promise<void>;

    constructor() {
        this.initialized = this.initialize();
    }

    // #region private init methods

    /**
     * does the initializing of all of the elements based on getting elements
     * from the current HTML document.
     */
    private initElements(): void {
        const lc = `[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5a7c48a369f95589c5d2b1867549cf25)`); }

            this.appShell = document_getElementById<HTMLElement>(ID_APP_SHELL);
            this.headerPanel = document_getElementById<HTMLElement>(ID_HEADER_PANEL);
            this.headerPanelContent = document_getElementById<HTMLElement>(ID_HEADER_PANEL_CONTENT);
            this.ibGibComTitleLink = document_getElementById<HTMLElement>(ID_IBGIB_COM_TITLE_LINK);
            this.panelContainer = document_getElementById<HTMLElement>(ID_PANEL_CONTAINER);
            this.leftPanel = document_getElementById<HTMLElement>(ID_LEFT_PANEL);
            this.leftPanelHeader = document_getElementById<HTMLElement>(ID_LEFT_PANEL_HEADER);
            this.leftPanelContent = document_getElementById<HTMLElement>(ID_LEFT_PANEL_CONTENT);
            // this.projectList = document_getElementById<HTMLElement>(ID_LEFT_PANEL_PROJECT_LIST);
            this.leftPanelFooter = document_getElementById<HTMLElement>(ID_LEFT_PANEL_FOOTER);
            this.leftPanelCollapseHandle = document_getElementById<HTMLElement>(ID_LEFT_PANEL_COLLAPSE_HANDLE);
            this.leftPanelExpandHandle = document_getElementById<HTMLElement>(ID_LEFT_PANEL_EXPAND_HANDLE);
            this.leftPanelMaximizeHandle = document_getElementById<HTMLElement>(ID_LEFT_PANEL_MAXIMIZE_HANDLE);
            this.leftPanelHamburgerBtn = document_getElementById<HTMLButtonElement>('left-panel-hamburger-btn');
            this.leftPanelCloseBtn = document_getElementById<HTMLButtonElement>('left-panel-close-btn');


            this.rightPanel = document_getElementById<HTMLElement>(ID_RIGHT_PANEL);
            this.rightPanelContent = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_CONTENT);
            this.chronologysContent = document_getElementById<HTMLElement>(ID_CHRONOLOGYS_CONTENT);
            this.rightPanelHeader = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_HEADER);
            this.rightPanelFooter = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_FOOTER);
            this.rightPanelCollapseHandle = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_COLLAPSE_HANDLE);
            this.rightPanelExpandHandle = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_EXPAND_HANDLE);
            this.rightPanelMaximizeHandle = document_getElementById<HTMLElement>(ID_RIGHT_PANEL_MAXIMIZE_HANDLE);

            this.footerPanel = document_getElementById<HTMLElement>(ID_FOOTER_PANEL);
            this.footerInputContainer = document_getElementById<HTMLElement>(ID_FOOTER_INPUT_CONTAINER);
            this.footerPanelCollapseHandle = document_getElementById<HTMLElement>(ID_FOOTER_PANEL_COLLAPSE_HANDLE);
            this.footerPanelExpandHandle = document_getElementById<HTMLElement>(ID_FOOTER_PANEL_EXPAND_HANDLE);
            this.footerPanelMaximizeHandle = document_getElementById<HTMLElement>(ID_FOOTER_PANEL_MAXIMIZE_HANDLE);

            this.centerPanelContent = document_getElementById<HTMLElement>(ID_CENTER_PANEL_CONTENT) as HTMLElement;

            // if (!this.appShell) { throw new Error(`(UNEXPECTED) app shell falsy? (E: 51c5045e4b84c4f92647d61430370c25)`); }
            // if (!this.headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? (E: d00a3c546396bac9edb9b7cb38be1a25)`); }
            // if (!this.ibGibComTitleLink) { throw new Error(`(UNEXPECTED) ibgib.com title link not found? (E: 3a28eb148a9db4752ef7b06da4dfbf25)`); }
            // if (!this.headerPanelContent) { throw new Error(`(UNEXPECTED) Header panel content not found? (E: 5e4e7aaaa6cd68cdf994da75f0192a25)`); }

            // if (!this.panelContainer) { throw new Error(`(UNEXPECTED) Panel container not found? (E: 6efcd4bbe32653a40cd7af2ed7a84825)`); }
            // if (!this.leftPanel) { throw new Error(`(UNEXPECTED) Left panel not found? (E: 5507ecca9fb6d3a90dcff6f577d78225)`); }
            // if (!this.rightPanel) { throw new Error(`(UNEXPECTED) Right panel not found? (E: d9373f83bd7f021ab2c478467c576f25)`) };
            // if (!this.leftPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Left panel collapse handle not found? (E: 53f3c27a8443c13cdf08c612a744ea25)`); }
            // if (!this.rightPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Right panel collapse handle not found? (E: 60c56dc2e54ea0d34abcda7ac6b98325)`); }
            // if (!this.leftPanelExpandHandle) { throw new Error(`(UNEXPECTED) Left panel expand handle not found? (E: 1da50cae5fee165954c2830a8f538225)`); }
            // if (!this.rightPanelExpandHandle) { throw new Error(`(UNEXPECTED) Right panel expand handle not found? (E: b578747f8da1ed7c8c663309ed3c9625)`); }
            // if (!this.leftPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) Left panel maximize handle not found? (E: 6969dc4cd84df10b3bc73f75e6a1a225)`); }
            // if (!this.rightPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) Right panel maximize handle not found? (E: aea0bd86f7c4e9c41b326d83dbdddf25)`); }
            // if (!this.leftPanelFooter) { throw new Error(`(UNEXPECTED) Left panel footer not found? (E: 62d11cbe41943b1ef736a002fdca1c25)`); }
            // if (!this.leftPanelContent) { throw new Error(`(UNEXPECTED) left panel content falsy? (E: f59fbaabff0a14f88b5fad9803bb1125)`); }
            // if (!this.projectList) { throw new Error(`(UNEXPECTED) left panel project list falsy? (E: 5e79d62788a6c2625fa2d32c17e88325)`); }
            // if (!this.leftPanelHeader) { throw new Error(`(UNEXPECTED) left panel header falsy? (E: 96e2cf5bbc92de30fc4af8baf4c3c925)`); }
            // if (!this.rightPanelFooter) { throw new Error(`(UNEXPECTED) Right panel footer not found? (E: 5e15a334ba68394e41ce5fae1c35dd25)`); }
            // if (!this.rightPanelContent) { throw new Error(`(UNEXPECTED) right panel content falsy? (E: e97e4bca7edbfb4a965487fb30f47225)`); }
            // if (!this.rightPanelHeader) { throw new Error(`(UNEXPECTED) right panel header falsy? (E: df42a4074a6f005bcf6f3c827cdf3325)`); }

            // footer panel
            // if (!this.footerPanel) { throw new Error(`(UNEXPECTED) Footer panel not found? (E: c5e4ce4d48f59ffe0b724df1aa664c25)`); }
            // if (!this.footerInputContainer) { throw new Error(`(UNEXPECTED) Primary agent input (footer-input-container) not found? (E: b8119a25544681d2695d0e0360fbd425)`); }
            // if (!this.footerPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Footer panel collapse handle not found? (E: f06e9874c54c2a029ea7b59307348725)`); }
            // if (!this.footerPanelExpandHandle) { throw new Error(`(UNEXPECTED) footerPanelExpandHandle not found? (E: b9429cf155d87f4f2277df2a20c2af25)`); }
            // if (!this.footerPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) footerPanelMaximizeHandle not found? (E: 2eab4faf2592f9482241f37533765725)`); }

            // if (!this.centerPanelContent) { throw new Error(`(UNEXPECTED) Center panel content not found? (E: a1367b39ec61ca44b879ec389e9f6f25)`); }

            this.leftHandles = [
                this.leftPanelCollapseHandle, this.leftPanelExpandHandle,
                this.leftPanelMaximizeHandle
            ];
            this.leftPanels = [
                this.leftPanel, this.leftPanelFooter, this.leftPanelContent,
                this.leftPanelHeader
            ];
            this.leftAll = [...this.leftPanels, ...this.leftHandles];
            this.rightHandles = [
                this.rightPanelCollapseHandle, this.rightPanelExpandHandle,
                this.rightPanelMaximizeHandle
            ];
            this.rightPanels = [
                this.rightPanel, this.rightPanelFooter, this.rightPanelContent,
                this.rightPanelHeader
            ];
            this.rightAll = [...this.rightPanels, ...this.rightHandles];
            this.footerPanels = [this.footerPanel, this.footerInputContainer];
            this.footerHandles = [
                this.footerPanelCollapseHandle, this.footerPanelExpandHandle,
                this.footerPanelMaximizeHandle
            ];
            this.footerAll = [...this.footerPanels, ...this.footerHandles];

            this.initPanelEventHandlers();
            this.initPanelState();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private initHideHeaderOnScroll(): void {
        const lc = `[${this.initHideHeaderOnScroll.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f57dd8b3a8ff88958b35f07c3a341e25)`); }
            if (!this.appShell) { throw new Error(`(UNEXPECTED) appShell not found? (E: fa55d5cac07ede4bfd7f3bace7026d25)`); }
            if (!this.headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? (E: 4ce8f134611b8781a5a82a32e20ccf25)`); }
            if (!this.centerPanelContent) { throw new Error(`(UNEXPECTED) centerPanelContent falsy? (E: 86daea2e4c676990a3287cb79d00a825)`); }

            const updateCenterPanelScrollHidesHeader = (headerPanelHeight: number) => {
                if (!this.centerPanelContent) { throw new Error(`(UNEXPECTED) centerPanelContent falsy? (E: d593fee7525b3c9308ba0df32c9d0625)`); }
                if (!this.headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? this was originally truthy but in this scroll handler, it's falsy? (E: e22be78e20522e61ea245c7ec87b7325)`); }

                const oldScroll = this.lastCenterPanelScrollTop;
                const newScroll = this.centerPanelContent.scrollTop;
                /**
                 * scrolling down => positive delta
                 * scrolling up => negative delta
                 *
                 * we want to hide the header as we scroll down, so we take the height
                 * of the header panel and subtract the delta up until the height is 1.
                 *
                 * when we scroll back up, we want to slowly reshow the header.
                 */
                this.centerPanelScrollOffset += newScroll - oldScroll;

                if (this.centerPanelScrollOffset > headerPanelHeight) {
                    this.centerPanelScrollOffset = headerPanelHeight;
                } else if (this.centerPanelScrollOffset < 0) {
                    this.centerPanelScrollOffset = 0;
                }
                if (this.centerPanelScrollOffset > 0) {
                    // don't just transform but actually change the height.
                    // otherwise, our overall layout has problems
                    const scale = (headerPanelHeight - this.centerPanelScrollOffset) / headerPanelHeight;
                    const scaledHeight = scale * headerPanelHeight;
                    this.headerPanel.style.height = `${scaledHeight}px`;
                    /** document.documentElement corresponds to :root css selector */
                    document.documentElement.style.setProperty('--header-calculated-height-loss', (headerPanelHeight - scaledHeight) + "px");

                } else {
                    // restore the original height
                    this.headerPanel.style.height = `${headerPanelHeight}px`;
                    /** document.documentElement corresponds to :root css selector */
                    document.documentElement.style.setProperty('--header-calculated-height-loss', "0px");
                }

                // set for next time
                this.lastCenterPanelScrollTop = this.centerPanelContent.scrollTop;
            }

            this.initialHeaderPanelHeight = this.headerPanel.clientHeight;
            this.initialHeaderPanelHeightPctOfAppShell = this.initialHeaderPanelHeight / this.appShell.clientHeight;
            let appShellResizeObserver = new ResizeObserver((_entries) => {
                if (!this.headerPanel) { throw new Error(`(UNEXPECTED) headerPanel falsy in resize handler? (E: 69327376be54c87da86361a7c3156925)`); }
                if (!this.appShell) { throw new Error(`(UNEXPECTED) appShell falsy? (E: 8141efedd3f1c9aaa8b94316b0423125)`); }
                this.lastCenterPanelScrollTop = 0;
                this.centerPanelScrollOffset = 0;
                this.initialHeaderPanelHeight = this.appShell?.clientHeight * this.initialHeaderPanelHeightPctOfAppShell;
                // updateCenterPanelScrollHidesHeader(this.initialHeaderPanelHeight);
                this.headerPanel.style.height = `${this.initialHeaderPanelHeight}px`;
                /** document.documentElement corresponds to :root css selector */
                document.documentElement.style.setProperty('--header-calculated-height-loss', "0px");

            });
            appShellResizeObserver.observe(this.appShell);

            this.centerPanelContent.addEventListener('scroll', (ev: Event) => {
                updateCenterPanelScrollHidesHeader(this.initialHeaderPanelHeight);
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private initPanelEventHandlers() {
        const lc = `[${this.initPanelEventHandlers.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b02f038bc4fdc8a39ecc0eba2687c325)`); }

            if (!this.leftPanelCollapseHandle || !this.leftPanelExpandHandle || !this.leftPanelMaximizeHandle ||
                !this.rightPanelCollapseHandle || !this.rightPanelExpandHandle || !this.rightPanelMaximizeHandle ||
                !this.footerPanelCollapseHandle || !this.footerPanelExpandHandle || !this.footerPanelMaximizeHandle) {
                throw new Error(`(UNEXPECTED) Panel handles are not initialized. (E: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d)`);
            }
            if (!this.leftPanel || !this.leftPanelContent || !this.leftPanelFooter || !this.leftPanelHeader ||
                !this.rightPanel || !this.rightPanelContent || !this.rightPanelFooter || !this.rightPanelHeader ||
                !this.footerPanel || !this.footerInputContainer || !this.panelContainer) {
                throw new Error(`(UNEXPECTED) Panels are not initialized. (E: 8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e)`);
            }

            // wire up click handlers for all buttons (handles)
            this.leftPanelCollapseHandle.addEventListener('click', () => {
                this.collapse({ panelNames: ['leftPanel'] });
            });
            this.leftPanelExpandHandle.addEventListener('click', () => {
                this.expand({ panelNames: ['leftPanel'] });
            });
            this.leftPanelMaximizeHandle.addEventListener('click', () => {
                this.maximize({ panelNames: ['leftPanel'] });

            });

            this.rightPanelCollapseHandle.addEventListener('click', () => {
                this.collapse({ panelNames: ['rightPanel'] });
            });
            this.rightPanelExpandHandle.addEventListener('click', () => {
                this.expand({ panelNames: ['rightPanel'] });
            });
            this.rightPanelMaximizeHandle.addEventListener('click', () => {
                this.maximize({ panelNames: ['rightPanel'] });
            });

            // footer panel
            this.footerPanelCollapseHandle.addEventListener('click', () => {
                this.collapse({ panelNames: ['footerPanel'] });
            });
            this.footerPanelExpandHandle.addEventListener('click', () => {
                this.expand({ panelNames: ['footerPanel'] });
            });
            this.footerPanelMaximizeHandle.addEventListener('click', () => {
                this.maximize({ panelNames: ['footerPanel'] });
            });

            // hamburger and close button setup
            if (!this.leftPanelHamburgerBtn) { throw new Error(`(UNEXPECTED) leftPanelHamburgerBtn not found? (E: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d)`); }
            this.leftPanelHamburgerBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // prevent the global click listener from immediately closing the menu
                if (this.isMobileView) {
                    if (!this.leftPanel) { throw new Error(`(UNEXPECTED) leftPanel not found? (E: 2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e)`); }
                    this.leftPanel.classList.toggle('mobile-visible');
                    if (this.leftPanel.classList.contains('mobile-visible')) {
                        this.maximize({ panelNames: ['leftPanel'] });
                    }
                }
            });

            if (!this.leftPanelCloseBtn) { throw new Error(`(UNEXPECTED) leftPanelCloseBtn not found? (E: 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f)`); }
            this.leftPanelCloseBtn.addEventListener('click', () => {
                if (this.isMobileView) {
                    if (!this.leftPanel) { throw new Error(`(UNEXPECTED) leftPanel not found? (E: 4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a)`); }
                    this.leftPanel.classList.remove('mobile-visible');
                }
            });

            // Add a global click listener to close the mobile menu when clicking outside of it
            document.addEventListener('click', (event) => {
                if (this.isMobileView) {
                    if (!this.leftPanel) { throw new Error(`(UNEXPECTED) leftPanel not found? (E: 5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b)`); }
                    const isClickInside = this.leftPanel.contains(event.target as Node);
                    if (this.leftPanel.classList.contains('mobile-visible') && !isClickInside) {
                        this.leftPanel.classList.remove('mobile-visible');
                    }
                }
            });



        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * helper to update a variable to hack the left/right panel height when
     * they are collapsed. Basically when we collapse either one, we update css
     * variables which drive the width.
     *
     * The problem stems from the fact that we are rotating the panel headers
     * 90/270 degrees, and I can't figure out how to get the panel itself to
     * conform to this rotated height.
     */
    private updateCollapsedPanelWidthOverride() {
        const lc = `${this.lc}[${this.updateCollapsedPanelWidthOverride.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c495c20291c39eea19020a1c28627125)`); }



            // kluge ah well
            // [100, 200, 300, 400, 500].forEach(ms => {
            [100, 500].forEach(ms => {
                setTimeout(() => {
                    if (!this.leftPanelHeader) { throw new Error(`(UNEXPECTED) this.leftPanelHeader falsy? (E: 5a23c55f2938ac218fb5fd73ad828e25)`); }
                    const leftMagicNumberTweak = 2;
                    document.documentElement.style.setProperty('--left-panel-header-calculated-height', `${this.leftPanelHeader.clientHeight + leftMagicNumberTweak}px`);

                    if (!this.rightPanelHeader) { throw new Error(`(UNEXPECTED) this.rightPanelHeader falsy? (E: b7eb697acb3a72f64afa587a6b5f2b25)`); }
                    const rightMagicNumberTweak = 3;
                    document.documentElement.style.setProperty('--right-panel-header-calculated-height', `${this.rightPanelHeader!.clientHeight + rightMagicNumberTweak}px`);
                }, ms)
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private initPanelState() {
        const lc = `[${this.initPanelState.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b4e1fa3e7be418452ade0a43ea0fb625)`); }

            if (!this.leftPanel || !this.leftPanelContent || !this.leftPanelFooter || !this.leftPanelHeader ||
                !this.rightPanel || !this.rightPanelContent || !this.rightPanelFooter || !this.rightPanelHeader ||
                !this.footerPanel || !this.footerInputContainer) {
                throw new Error(`(UNEXPECTED) Panels are not initialized. (E: 9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4)`);
            }
            if (!this.leftPanelExpandHandle || !this.rightPanelExpandHandle || !this.footerPanelExpandHandle) {
                throw new Error(`(UNEXPECTED) Expand handles are not initialized. (E: a0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f)`);
            }

            const leftPanels = [this.leftPanel, this.leftPanelFooter, this.leftPanelContent, this.leftPanelHeader];
            const rightPanels = [this.rightPanel, this.rightPanelFooter, this.rightPanelHeader];
            const footerPanels = [this.footerPanel, this.footerInputContainer];

            const fnClearAllClasses = ({ footerAlso }: { footerAlso: boolean }) => {
                this.clearClasses([this.panelContainer, this.leftPanel, this.rightPanel]);
                if (footerAlso) { this.clearClasses([this.footerPanel]); }
            };

            fnClearAllClasses({ footerAlso: true });
            this.expandElements([
                ...leftPanels,
                ...rightPanels,
                ...footerPanels,
            ]);
            this.collapseElements([
                this.leftPanelExpandHandle,
                this.rightPanelExpandHandle,
                this.footerPanelExpandHandle,
            ]);


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private initMobileView(): void {
        const lc = `${this.lc}[${this.initMobileView.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 9c2a7e7d6b3a4e9b8a8e3d6b3a4e9b8a)`); }

            // Using a media query to detect screen size for mobile view
            this.mobileMediaQuery = window.matchMedia('(max-width: 768px)');

            // Set the initial state by calling the handler
            this.handleScreenSizeChange(this.mobileMediaQuery);

            // Add a listener for when the screen size crosses the 768px threshold
            this.mobileMediaQuery.addEventListener('change', this.handleScreenSizeChange.bind(this));

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private initTabButtonsLeftPanel() {
        const lc = `[${this.initTabButtonsLeftPanel.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 564a084b92a4e90b7560248afcfc2425)`); }

            const { web10TabButton, projectExplorerTabButton } = this.getLeftPanelTabButtons();

            web10TabButton.addEventListener('click', () => this.activateLeftPanelTab({ tabName: RouterAppName.web1 }));
            projectExplorerTabButton.addEventListener('click', () => this.activateLeftPanelTab({ tabName: RouterAppName.projects }));
            // tagExplorerTabButton.addEventListener('click', () => this.activateLeftPanelTab({ tabName: RouterAppName.tags }));

            // default to web 1.0 nav tab on load
            this.activateLeftPanelTab({ tabName: RouterAppName.web1 });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private initTabButtonsRightPanel() {
        const lc = `[${this.initTabButtonsRightPanel.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e2c3667f4aa97480138f9a469614fc25)`); }

            const { chronologysTabButton } = this.getRightPanelTabButtons();

            chronologysTabButton.addEventListener('click', () => this.activateRightPanelTab({ tabName: 'chronologys' }));

            // default to web 1.0 nav tab on load
            // this.activateRightPanelTab({ tabName: 'chronologys' });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private initNav() {
        const lc = `[${this.initNav.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f4efbf831b16e293af5b83c13487cc25)`); }

            const headerPanel = document.getElementById(ID_HEADER_PANEL);
            if (!headerPanel) { throw new Error(`(UNEXPECTED) #header-panel not found (E: 7f35a780801e3bfa056fb9f6d55e6825)`); }
            headerPanel.addEventListener('click', async (event) => {
                if ((event.target as HTMLElement).tagName === 'A') {
                    await handleLocalSPAAnchorClick({ event });
                }
            });

            const web10Nav = document.getElementById(ID_WEB_1_NAV);
            if (!web10Nav) { throw new Error(`(UNEXPECTED) #web1-nav not found (E: 7843992b049b7a2a77e12b2b3b032a25)`); }
            web10Nav.addEventListener('click', async (event) => {
                if ((event.target as HTMLElement).tagName === 'A') {
                    await handleLocalSPAAnchorClick({ event });
                }
            });

            const tagNav = document.getElementById(ID_TAG_NAV);
            if (!tagNav) { throw new Error(`(UNEXPECTED) #tag-nav not found (E: bc672beb0f2f266ced0d240c5445ac25)`); }
            tagNav.addEventListener('click', async (event) => {
                if ((event.target as HTMLElement).tagName === 'A') {
                    await handleLocalSPAAnchorClick({ event });
                }
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * When the browser popstate happens (back button is pressed), we want to load the URL.
     */
    private initPopstateListener(): void {
        const lc = `[${this.initPopstateListener.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 1f987e79acef11b9c54eab811a2eb425)`); }

            window.addEventListener('popstate', () => {
                if (logalot) { console.log(`${lc} popstate event triggered. (I: 89b959b770a50e241f3e6afb4364ce25)`); }

                const lcPopstate = `${lc}[popstate]`;

                if (!isExecutingInBlankGibWebAppProper()) {
                    if (logalot) { console.log(`${lcPopstate} executing in iframe so returning early (I: b84172ceedb5fea0c5d0c1cfbd911b25)`); }
                    return; /* <<<< returns early */
                }

                router.loadCurrentURLPath();
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initHeader({ componentSvc }: { componentSvc: IbGibComponentService }): Promise<void> {
        const lc = `${this.lc}[${this.initHeader.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 3717bfd6a9ae8a8c7a8b88f29b947b25)`); }
            const breadcrumbComponent =
                await componentSvc.getComponentInstance({
                    path: BREADCRUMB_COMPONENT_NAME,
                    ibGibAddr: ROOT_ADDR,
                    useRegExpPrefilter: true,
                }) as BreadcrumbComponentInstance;

            if (!this.headerPanelContent) { throw new Error(`(UNEXPECTED) this.headerPanelContent falsy? (E: f96ed2a402b891d72d56c73ffcb17625)`); }
            if (!breadcrumbComponent) { throw new Error(`(UNEXPECTED) breadcrumbComponent falsy? (E: fb26e6efe94f3e49de6e93910b479e25)`); }
            await componentSvc.inject({
                parentEl: this.headerPanelContent,
                componentToInject: breadcrumbComponent,
            });
            this.breadcrumbComponent = breadcrumbComponent;

            // configBtnEl
            const configBtnEl = document_getElementById<HTMLButtonElement>('header-panel-config-btn');
            // configPopoverEl - when user clicks config, this popover has the options
            // of what exactly to config
            const configPopoverEl = document_getElementById('config-popover');
            const configPopoverOptions = configPopoverEl.querySelectorAll('.config-popover-option');
            configBtnEl.addEventListener('click', async (event) => {
                // debugger; // walkthru config btn click, is stlye.right right?
                configPopoverEl.style.position = 'absolute';
                configPopoverEl.style.top = `${configBtnEl.offsetTop + configBtnEl.clientHeight + 5}px`;
                let widestWidth = 0;
                for (let i = 0; i < configPopoverOptions.length; i++) {
                    const optionEl = configPopoverOptions[i];
                    // calculate once browser has actually rendered the options (width starts as 0)
                    while (optionEl.clientWidth === 0) { await delay(8); }
                    if (optionEl.clientWidth > widestWidth) { widestWidth = optionEl.clientWidth; }
                    configPopoverEl.style.left = `${document.body.clientWidth - widestWidth - 10}px`;
                }
            });
            // Event listeners for popover options
            configPopoverOptions.forEach(option => {
                option.addEventListener('click', async (event: Event) => {
                    const target = event.target as HTMLElement;
                    const optionType = target.getAttribute('data-option');
                    if (optionType) { await this.handleConfigPopoverSelected(optionType); }
                    configPopoverEl.hidePopover(); // idempotent
                });
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleConfigPopoverSelected(optionType: string): Promise<void> {
        const lc = `${this.lc}[${this.handleConfigPopoverSelected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: db1ef866696819b6110dbf0dc574a825)`); }
            switch (optionType) {
                case 'gemini-api-key':
                    await this.handleConfigPopoverSelected_geminiApiKey();
                    break;
                default:
                    debugger; // error unknown config type
                    throw new Error(`(UNEXPECTED) unknown config optionType (${optionType})? (E: 19b9eb257e58e1fe384f58b8ab58d825)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async handleConfigPopoverSelected_geminiApiKey(): Promise<void> {
        const lc = `${this.lc}[${this.handleConfigPopoverSelected_geminiApiKey.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 586cd8d6c5f8b1bb08076b387bf34325)`); }
            // 1. prompt user for gemini api key, populating the field
            // with the existing one, if any. be sure to mention how
            // this is stored locally and in plaintext
            // 2. update stored API key...right now we just delete it and reload
            // though, so there ya go.
            const existingApiKey = await getDefaultFnGetAPIKey()() ?? '';
            if (existingApiKey) {
                // user wants to read/update existing API key
                /**
                 * atow (07/2025) google's ai studio shows this exact same mask
                 * of the last 4 characters
                 */
                const existingApiKeyMasked = getMaskedSecret({ secret: existingApiKey, countToShow: 4 });
                // const existingApiKeyMasked = `****${existingApiKey.substring(existingApiKey.length - 4)}`;
                const clearAPIKey = await promptForConfirm({
                    msg: `Your existing (masked) Gemini API key is ${existingApiKeyMasked}.\n\nWould you like to CLEAR/DELETE this now?\n\nNote: This will prevent you from any further interaction with any Gemini agents on this site, but your data won't be deleted.\n\nTo re-enable agents, you will have to enter an API key again with ${CONFIG_OPTION_GEMINI_API_KEY_LOCATION_HELP}.\n\n(apologies for the crappy workflow, but this would be a great time for funding or contribution!)`
                });
                if (clearAPIKey) {
                    await updateAPIKeyInStorage({ apiKey: '', force: true }); // "deletes" the API key
                } else {
                    await alertUser({ title: 'cancelled...', msg: 'Clear API key cancelled' });
                }
            } else {
                // user wants to enter API key anew
                const apiKey = await promptForAPIKey();
                if (apiKey) {
                    await updateAPIKeyInStorage({ apiKey, force: false });
                } else {
                    console.log(`${lc} user cancelled (I: 4705481d1a7f629066737658ec455e25)`);
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private handleScreenSizeChange(event: MediaQueryList | MediaQueryListEvent): void {
        const lc = `${this.lc}[${this.handleScreenSizeChange.name}]`;
        this.isMobileView = event.matches;

        if (!this.leftPanelHamburgerBtn || !this.leftPanelCloseBtn || !this.leftPanel) {
            console.error(`${lc} hamburger button or left panel not initialized. (E: a9b8c7d6e5f4a3b2a1a9b8c7d6e5f4a3)`);
            return;
        }

        if (this.isMobileView) {
            // We are on a small screen (mobile view)
            if (logalot) { console.log(`${lc} Entering mobile view. (I: 8b7c6d5e4f3a2b1a9b8c7d6e5f4a3b2a)`); }
            this.leftPanelHamburgerBtn.classList.remove('collapsed');
            this.leftPanelCloseBtn.classList.remove('collapsed');
            // Ensure the mobile overlay is hidden by default when switching to mobile
            this.leftPanel.classList.remove('mobile-visible');
            // this.maximize({panelNames: ['leftPanel']});
        } else {
            // We are on a larger screen (desktop view)
            if (logalot) { console.log(`${lc} Exiting mobile view. (I: 7a6b5c4d3e2f1a9b8c7d6e5f4a3b2a1a)`); }
            this.leftPanelHamburgerBtn.classList.add('collapsed');
            this.leftPanelCloseBtn.classList.add('collapsed');
            // Make sure the mobile overlay is hidden when switching back to desktop
            this.leftPanel.classList.remove('mobile-visible');
        }
    }

    /**
     * The left panel has web1 and projects atow (05/2025).
     *
     * I'm making this so this init the left panel's projects explorer
     * component. atow (05/2025), this is just manually getting all projects
     */
    private async initLeftPanel({ componentSvc }: { componentSvc: IbGibComponentService }) {
        const lc = `${this.lc}[${this.initLeftPanel.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // #region projects explorer
            const projectsExplorerTabContent = document_getElementById(ID_PROJECT_EXPLORER_TAB_CONTENT);
            const explorerComponent =
                await componentSvc.getComponentInstance({
                    path: PROJECTS_EXPLORER_COMPONENT_NAME,
                    ibGibAddr: ROOT_ADDR,
                    useRegExpPrefilter: true,
                }) as ProjectsExplorerComponentInstance;

            await componentSvc.inject({
                componentToInject: explorerComponent,
                parentEl: projectsExplorerTabContent,
            });
            // #endregion projects explorer

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * right now, there are only "chats" (chronologys). so this init
     * automatically creates the chronologys component and injects it into the
     * right panel content.
     */
    private async initRightPanel({ componentSvc }: { componentSvc: IbGibComponentService }) {
        const lc = `${this.lc}[${this.initRightPanel.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c0eabc24bd4902f53a539ae1d99c7425)`); }

            if (!this.chronologysContent) { throw new Error(`(UNEXPECTED) this.chronologysContent falsy? (E: 2d93b3fe28d2cccec79b4419c1e09625)`); }
            const chronologysComponent =
                await componentSvc.getComponentInstance({
                    path: CHRONOLOGYS_COMPONENT_NAME,
                    ibGibAddr: ROOT_ADDR,
                    useRegExpPrefilter: true,
                }) as ChronologysComponentInstance;

            if (!chronologysComponent) { throw new Error(`(UNEXPECTED) chronologysComponent falsy? (E: 950d479e6dc3e9b559e883328b8f6a25)`); }
            await componentSvc.inject({
                parentEl: this.chronologysContent,
                componentToInject: chronologysComponent,
            });
            const globalIbGib = getIbGibGlobalThis_BlankGib();
            globalIbGib.chronologysComponent = chronologysComponent;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initFooter({ componentSvc }: { componentSvc: IbGibComponentService }): Promise<void> {
        const lc = `[${this.initFooter.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c0eabc24bd4902f53a539ae1d99c7425)`); }

            if (!this.footerInputContainer) { throw new Error(`(UNEXPECTED) this.footerInputContainer falsy? (E: bbbe3960c3876337c2676a0f26777825)`); }
            const inputComponent =
                await componentSvc.getComponentInstance({
                    path: INPUT_COMPONENT_NAME,
                    ibGibAddr: ROOT_ADDR,
                    useRegExpPrefilter: true,
                }) as InputComponentInstance;

            if (!inputComponent) { throw new Error(`(UNEXPECTED) inputComponent falsy? (E: 0e539c1fc7ddecc737741c33d61a2625)`); }
            await componentSvc.inject({
                parentEl: this.footerInputContainer,
                componentToInject: inputComponent,
            });
            this.inputComponent = inputComponent;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion private init methods

    // #region private element methods

    private clearAllClasses({ footerAlso }: { footerAlso: boolean; }): void {
        this.clearClasses([this.panelContainer, ...this.leftAll, ...this.rightAll,]);
        if (footerAlso) { this.clearClasses([...this.footerAll]); }
    };
    private clearResize = (els: (HTMLElement | null)[]) => {
        els.forEach(el => {
            if (!el) { throw new Error(`(UNEXPECTED) el is falsy? (E: 67b2eeb874a2090f8763edb62d9a7325)`); }
            // el.style.setProperty('resize', 'none');
            el.style.removeProperty('width');
            el.style.removeProperty('height');
        })
    }
    private clearClasses = (els: (HTMLElement | null)[]) => {
        els.forEach(el => {
            if (!el) { throw new Error(`(UNEXPECTED) el is falsy? (E: 344bb8c7602e551327ab9a0ff8fe0325)`); }
            el.classList.remove('collapsed');
            el.classList.remove('expanded');
            el.classList.remove('maximized');
        })
    };
    private collapseElements = (els: (HTMLElement | null)[]) => {
        this.clearClasses(els);
        els.forEach(el => {
            if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: a5d739f683aa91d8eeb1ab8955f00c25)`); }
            el.classList.add('collapsed');
        });
    };
    private expandElements = (els: (HTMLElement | null)[]) => {
        this.clearClasses(els);
        els.forEach(el => {
            if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: 57b021c90bb8d1738307146b79c39125)`); }
            el.classList.add('expanded');
        })
    };
    private maximizeElements = (els: (HTMLElement | null)[]) => {
        this.clearClasses(els);
        els.forEach(el => {
            if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: aa2dab40b7cbce96448756ededf82725)`); }
            el.classList.add('maximized');
        })
    };

    // #endregion private element methods

    // #region private state methods

    private getPanelVisualState(el: HTMLElement): PanelStatus {
        if (el.classList.contains('maximized')) return 'maximized';
        if (el.classList.contains('expanded')) return 'expanded';
        if (el.classList.contains('collapsed')) return 'collapsed';
        return 'default'; // or perhaps 'expanded' as default? depends on initial state.
    }
    private restorePanelStates(): void {
        const lc = `${this.lc}[${this.restorePanelStates.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8debefde7d44e8b371f7ca1f1e16cd25)`); }

            const states = this.lastPanelStates;
            if (!states) {
                if (logalot) { console.log(`${lc} lastPanelStates falsy. returning early. (I: acc5b2640bc40b9271c9adb597ced425)`); }
                return; /* <<<< returns early */
            }

            if (logalot) { console.log(`[${this.restorePanelStates.name}] restoring state:`, states); }
            if (!this.leftPanel) { throw new Error(`(UNEXPECTED) leftPanel falsy? (E: 80997e37f2fcb1787caa51a3ead1b225)`); }
            if (!this.rightPanel) { throw new Error(`(UNEXPECTED) rightPanel falsy? (E: c2e889af5d9f3a9138a1f3b280b52c25)`); }
            if (!this.footerPanel) { throw new Error(`(UNEXPECTED) footerPanel falsy? (E: 84e21a9393dab76d530cdc0fe7ea2a25)`); }

            this.setPanelVisualState('leftPanel', states.leftPanel.status);
            if (states.leftPanel.width) { this.leftPanel.style.width = states.leftPanel.width; }
            if (states.leftPanel.height) { this.leftPanel.style.height = states.leftPanel.height; }
            this.setPanelVisualState('rightPanel', states.rightPanel.status);
            if (states.rightPanel.width) { this.rightPanel.style.width = states.rightPanel.width; }
            if (states.rightPanel.height) { this.rightPanel.style.height = states.rightPanel.height; }
            this.setPanelVisualState('footerPanel', states.footerPanel.status);
            if (states.footerPanel.width) { this.footerPanel.style.width = states.footerPanel.width; }
            if (states.footerPanel.height) { this.footerPanel.style.height = states.footerPanel.height; }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * @internal helper that collapses/expands/maximizes UI based on passed in {@link status}
     * @param panelName - which panel we're working on
     * @param status - determines what action to perform on the panel
     */
    private setPanelVisualState(panelName: PanelType, status: PanelStatus): void {
        const lc = `${this.lc}[${this.setPanelVisualState.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c60c1af7149d32ff06414e483334e125)`); }

            switch (status) {
                case 'collapsed': this.collapse({ panelNames: [panelName] }); break;
                case 'expanded': this.expand({ panelNames: [panelName] }); break;
                case 'maximized': this.maximize({ panelNames: [panelName] }); break;
                case 'default': this.expand({ panelNames: [panelName] }); break;
                case undefined:
                    this.expand({ panelNames: [panelName] }); break;
                default: throw new Error(`(UNEXPECTED) hit default in switch? (E: a8045655f5f3a61c360907457c2d2a25)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion private state methods

    // #region private other methods

    private getLeftPanelTabButtons(): {
        web10TabButton: HTMLElement;
        projectExplorerTabButton: HTMLElement;
        // tagExplorerTabButton: HTMLElement;
    } {
        const lc = `[${this.getLeftPanelTabButtons.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8675bae85fab6164daa088d8e5bd9925)`); }

            const web10TabButton = document_getElementById(ID_WEB10_TAB_BUTTON);
            const projectExplorerTabButton = document_getElementById(ID_PROJECT_EXPLORER_TAB_BUTTON);
            // const tagExplorerTabButton = document_getElementById(ID_TAG_EXPLORER_TAB_BUTTON);


            // return { web10TabButton, projectExplorerTabButton, tagExplorerTabButton };
            return { web10TabButton, projectExplorerTabButton, };
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private getRightPanelTabButtons(): {
        chronologysTabButton: HTMLElement;
    } {
        const lc = `[${this.getRightPanelTabButtons.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8675bae85fab6164daa088d8e5bd9925)`); }

            const chronologysTabButton = document.getElementById(ID_TAB_BUTTON_CHRONOLOGYS)

            if (!chronologysTabButton) { throw new Error(`(UNEXPECTED) chronologysTabButton not found? (E: fef8517cc1af60197219fc81c9721925)`); }

            return { chronologysTabButton };
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async registerComponents(): Promise<void> {
        const lc = `[${this.registerComponents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: c4635960bdd3fd41dc03b7bbfb236f25)`); }

            const componentsMeta: IbGibDynamicComponentMeta[] = [
                // add components here (we don't have any modules or anything like that at this time)
                ...componentsMeta_Web1,
                new CanvasComponentMeta(),
                new ProjectsComponentMeta(),
                new ProjectComponentMeta(),
                new ChronologysComponentMeta(),
                new ChronologyComponentMeta(),
                new BreadcrumbComponentMeta(),
                new InputComponentMeta(),
                new RawComponentMeta(),
                new TextEditorComponentMeta(),
                new MinigameComponentMeta(),
                new TypingComponentMeta(),
                new ProjectsExplorerComponentMeta(),
                new ExplorerItemComponentMeta(),
            ];
            const componentSvc = await getComponentSvc();
            for (let componentMeta of componentsMeta) {
                componentSvc.registerComponentMeta(componentMeta);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async sillyDrawEyeToElements(): Promise<void> {
        const lc = `[${this.sillyDrawEyeToElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b63771f8769a5a41016e1cbb6fac6725)`); }

            const tutorial_panelsExpandAnimationCount = Number.parseInt(await storageGet({
                dbName: BLANK_GIB_DB_NAME,
                storeName: ARMY_STORE,
                key: KEY_TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT,
            }) || "0");

            // if we've already done the animation a couple times, we don't need to
            // keep doing it. in the future, we should have a better tutorial
            // mechanism.
            if (tutorial_panelsExpandAnimationCount < TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT_ENOUGH_ALREADY) {

                await delay(1000);
                this.maximize({ panelNames: ['centerPanel'] });
                await delay(1000);
                this.expand({ panelNames: ['centerPanel'] });

                await delay(1000);
                this.collapse({ panelNames: ['leftPanel'] });
                await delay(600);
                this.collapse({ panelNames: ['footerPanel'] });
                await delay(600);
                this.collapse({ panelNames: ['rightPanel'] });

                await delay(1000);
                this.expand({ panelNames: ['footerPanel', 'leftPanel', 'rightPanel'] });

                storagePut({
                    dbName: BLANK_GIB_DB_NAME,
                    storeName: ARMY_STORE,
                    key: KEY_TUTORIAL_PANELS_EXPAND_ANIMATION_COUNT,
                    value: (tutorial_panelsExpandAnimationCount + 1).toString(),
                }); // spin off/no await, don't care about multithreadedness here
                await delay(200);

                await highlightElement({
                    el: this.ibGibComTitleLink!,
                    magicHighlightTimingMs: 1000,
                    scrollIntoView: false,
                });
            } else {
                await delay(200);
                this.maximize({ panelNames: ['centerPanel'] });
                await delay(200);
                this.expand({ panelNames: ['centerPanel'] });
                await delay(200);
                this.expand({ panelNames: ['footerPanel', 'rightPanel'] });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            // don't rethrow in this silly function. just log the error
            // throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion private other methods

    // #region public api

    public async initialize(): Promise<void> {
        const lc = `[${this.initialize.name}]`;
        console.time(lc);
        return new Promise(async (resolve, reject) => {
            try {
                if (!isExecutingInBlankGibWebAppProper()) {
                    if (logalot) { console.log(`${lc} executing in iframe so returning early (I: 7118fb26f44e791f46bb0301172bbd25)`); }
                    return; /* <<<< returns early */
                }
                this.registerComponents();
                console.timeLog(lc, 'registerComponents complete');
                this.initElements();
                console.timeLog(lc, 'initElements complete');
                this.initMobileView(); // <-- Add this line
                console.timeLog(lc, 'initMobileView complete');
                // this is waaaay early. but this is only acceptable because
                // we're just setting css variables. if this changes, we may
                // need to reorder this.
                await this.initTheme();
                console.timeLog(lc, 'initTheme complete');
                this.initTabButtonsLeftPanel();
                console.timeLog(lc, 'initTabButtonsLeftPanel complete');
                this.initTabButtonsRightPanel();
                console.timeLog(lc, 'initTabButtonsRightPanel complete');
                this.sillyDrawEyeToElements().then(() => {
                    console.timeLog(lc, 'sillyDrawEyeToElements complete');
                }); // spin off
                this.initHideHeaderOnScroll();
                console.timeLog(lc, 'initHideHeaderOnScroll complete');
                // this.initLeftPanelWidthTweak();
                // console.timeLog(lc, 'initLeftPanelWidthTweak complete');
                this.initNav();
                console.timeLog(lc, 'initNav complete');
                this.initPopstateListener();
                console.timeLog(lc, 'initPopstateListener complete');

                getGlobalMetaspace_waitIfNeeded().then(async () => {
                    // at this point, we have initialized the metaspace, because
                    // these require the metaspace to be initialized and the
                    // component architecture to be up
                    this.componentSvc ??= await getComponentSvc();
                    const { componentSvc } = this;
                    await this.initHeader({ componentSvc });
                    console.timeLog(lc, 'initHeader complete');
                    await this.initRightPanel({ componentSvc });
                    await this.initLeftPanel({ componentSvc });
                    await this.initFooter({ componentSvc });
                    console.timeLog(lc, 'initFooter complete');
                    console.timeEnd(lc);
                    resolve();
                }); // spin off. can't await because metaspace happens after this shell layout finishes

            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                reject(error);
            } finally {
                //
            }
        });
    }
    private async initTheme(): Promise<void> {
        const lc = `${this.lc}[${this.initTheme.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7ff768702108c6f7495f6e4eae06a825)`); }
            // restore the theme if it exists
            const existingUIInfo = await getExistingUIInfo();
            if (existingUIInfo) {
                for (const [variableName, value] of Object.entries(existingUIInfo.cssVariableOverrides)) {
                    document.documentElement.style.setProperty(variableName, value);
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public expand({ panelNames }: { panelNames: PanelType[] }): void {
        const lc = `${this.lc}[${this.expand.name}]`;
        for (const panelName of panelNames) {
            switch (panelName) {
                case 'centerPanel':
                    if (this.isCenterPanelMaximized) {
                        // Restore state if coming from maximized center
                        this.restorePanelStates();
                        this.isCenterPanelMaximized = false;
                    } else {
                        // no-op since it's not maximized right now.
                        console.log(`${lc} centerPanel not maximized. (I: d8bd34a3adcd4afb0ac3954e9afea925)`);
                        // // if not maximized, just expand left/right/footer in case they were collapsed independently?
                        // if (this.leftPanel && this.leftPanelContent && this.leftPanelFooter && this.leftPanelHeader) {
                        //     els.push(this.leftPanel, this.leftPanelContent, this.leftPanelFooter, this.leftPanelHeader);
                        // }
                        // if (this.rightPanel && this.rightPanelContent && this.rightPanelFooter && this.rightPanelHeader) {
                        //     els.push(this.rightPanel, this.rightPanelContent, this.rightPanelFooter, this.rightPanelHeader);
                        // }
                        // if (this.footerPanel && this.footerInputContainer) {
                        //     els.push(this.footerPanel, this.footerInputContainer);
                        // }
                    }
                    break;
                case 'leftPanel':
                    this.clearResize([this.leftPanel]);
                    this.clearClasses(this.leftAll);
                    this.expandElements(this.leftPanels);
                    this.collapseElements([this.leftPanelExpandHandle]);
                    break;
                case 'rightPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearClasses(this.rightAll);
                    this.expandElements(this.rightPanels);
                    this.collapseElements([this.rightPanelExpandHandle]);
                    break;
                case 'footerPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearClasses([this.panelContainer, ...this.footerAll]);
                    this.expandElements(this.footerPanels);
                    this.collapseElements([this.footerPanelExpandHandle]);
                    break;
                case 'headerPanel':
                    break;
                default:
                    throw new Error(`(UNEXPECTED) Unknown panel name: ${panelName} (E: b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6)`);
            }
        }
    }

    public collapse({ panelNames }: { panelNames: PanelType[] }): void {
        const lc = `${this.lc}[${this.collapse.name}]`;
        for (const panelName of panelNames) {
            switch (panelName) {
                case 'centerPanel':
                    console.warn(`${lc} 'centerPanel' collapse is a no-op for now. (W: 16e79f41e5442eba7141bb8af2907125)`);
                    return;
                case 'leftPanel':
                    this.clearResize([this.leftPanel]);
                    this.clearClasses(this.leftAll!);
                    this.collapseElements([...this.leftPanels, this.leftPanelCollapseHandle]);
                    this.updateCollapsedPanelWidthOverride();
                    break;
                case 'rightPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearClasses(this.rightAll);
                    this.collapseElements([...this.rightPanels, this.rightPanelCollapseHandle]);
                    this.updateCollapsedPanelWidthOverride();
                    break;
                case 'footerPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearClasses([this.panelContainer, ...this.footerAll]);
                    this.collapseElements([...this.footerPanels, this.footerPanelCollapseHandle]);
                    break;
                case 'headerPanel':
                    break;
                default:
                    throw new Error(`(UNEXPECTED) Unknown panel name: ${panelName} (E: c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7)`);
            }
        }
    }

    public maximize({ panelNames }: { panelNames: PanelType[] }): void {
        const lc = `${this.lc}[${this.maximize.name}]`;
        for (const panelName of panelNames) {
            switch (panelName) {
                case 'centerPanel':
                    if (!this.isCenterPanelMaximized) {
                        // Capture current state before maximizing center
                        this.lastPanelStates = this.getPanelStates();
                        if (logalot) { console.log(`${lc} captured state: ${pretty(this.lastPanelStates)} (I: c02e17707fcacc7e16ecb73e2dbf2925)`); }
                        this.isCenterPanelMaximized = true;
                        this.collapse({ panelNames: ['leftPanel', 'rightPanel', 'footerPanel'] });
                    } else {
                        console.log(`${lc} already maximized (I: 6dc6ae73f11442a14129bb42438d0e25)`)
                    }
                    break;
                case 'leftPanel':
                    this.clearResize([this.leftPanel]);
                    this.clearAllClasses({ footerAlso: false });
                    this.collapseElements([
                        ...this.leftPanels,
                        ...this.rightPanels, this.rightPanelCollapseHandle,
                        // ...footerPanels, this.footerPanelCollapseHandle
                    ]);
                    this.maximizeElements(this.leftPanels);
                    this.collapseElements([this.leftPanelMaximizeHandle]);
                    break;
                case 'rightPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearAllClasses({ footerAlso: false });
                    this.collapseElements([
                        ...this.rightPanels,
                        ...this.leftPanels, this.leftPanelCollapseHandle,
                        // ...footerPanels, this.footerPanelCollapseHandle
                    ]);
                    this.maximizeElements(this.rightPanels);
                    this.collapseElements([this.rightPanelMaximizeHandle]);
                    break;
                case 'footerPanel':
                    this.clearResize([this.rightPanel]);
                    this.clearAllClasses({ footerAlso: true });
                    this.collapseElements([
                        ...this.rightPanels, this.rightPanelCollapseHandle,
                        ...this.leftPanels, this.leftPanelCollapseHandle,
                        this.panelContainer,
                    ]);
                    this.maximizeElements(this.footerPanels);
                    this.collapseElements([this.rightPanelMaximizeHandle]);
                    break;
                case 'headerPanel':
                    console.log(`${lc} no op? (I: d6dda6aa1455cd37622a46541683df25)`)
                    break;
                default:
                    throw new Error(`(UNEXPECTED) Unknown panel name: ${panelName} (E: d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8)`);
            }
        }
    }

    public getPanelStates(): PanelStates {
        const lc = `${this.lc}[${this.getPanelStates.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 501341aed7f205240a024f26e0889c25)`); }

            let states: PanelStates | undefined = undefined;
            if (!this.headerPanel) { throw new Error(`(UNEXPECTED) this.headerPanel falsy? (E: c56ae78f8395764d234add5fca025425)`); }
            if (!this.leftPanel) { throw new Error(`(UNEXPECTED) this.leftPanel falsy? (E: a0fba68516d2c7cd1fa0df92fc777725)`); }
            if (!this.rightPanel) { throw new Error(`(UNEXPECTED) this.rightPanel falsy? (E: 764bbf40a9186fb3fb7afe3c8c369a25)`); }
            if (!this.footerPanel) { throw new Error(`(UNEXPECTED) this.footerPanel falsy? (E: 807a9baf4afbe6471d0708840595b625)`); }
            states = {
                headerPanel: {
                    status: this.getPanelVisualState(this.headerPanel),
                },
                leftPanel: {
                    status: this.getPanelVisualState(this.leftPanel),
                    width: this.leftPanel.style.width || null,
                    height: this.leftPanel.style.height || null,
                },
                rightPanel: {
                    status: this.getPanelVisualState(this.rightPanel),
                    width: this.rightPanel.style.width || null,
                    height: this.rightPanel.style.height || null,
                },
                footerPanel: {
                    status: this.getPanelVisualState(this.footerPanel),
                    width: this.footerPanel.style.width || null,
                    height: this.footerPanel.style.height || null,
                },
            }
            if (logalot) { console.log(`${lc} states: ${pretty(states)} (I: cfcdfa42b285e81154073abe87532525)`); }
            return states;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public getPanelStatus({ panelName }: { panelName: PanelType }): PanelStatus {
        const lc = `${this.lc}[${this.getPanelStatus.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: eb49bf7425ff05460be38f59ebda7e25)`); }
            const states = this.getPanelStates();
            let panelStateInfo = states[panelName] as PanelState;
            return panelStateInfo.status;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * helper function that activates one of the left panel's tabs, based on the
     * given {@link tabName}
     */
    public activateLeftPanelTab({
        tabName,
    }: {
        tabName: RouterAppName,
    }): void {
        const lc = `[${this.activateLeftPanelTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5bada68f957da3cf7520a2c2ed249125)`); }

            // first show the left panel if it's not already shown
            const status = this.getPanelStatus({ panelName: 'leftPanel' });
            if (status === 'collapsed') {
                this.expand({ panelNames: ['leftPanel'] });
            }

            // now do the highlighting of the element

            const { web10TabButton, projectExplorerTabButton, } = this.getLeftPanelTabButtons();
            // const { web10TabButton, projectExplorerTabButton, tagExplorerTabButton } = this.getLeftPanelTabButtons();

            const web10TabContent = document.getElementById(ID_WEB10_TAB_CONTENT);
            const projectExplorerTabContent = document_getElementById(ID_PROJECT_EXPLORER_TAB_CONTENT);
            // const tagExplorerTabContent = document.getElementById(ID_TAG_EXPLORER_TAB_CONTENT);

            if (!web10TabContent) { throw new Error(`(UNEXPECTED) web10TabContent not found? (E: 25a8907b3b7c11e434057c939d322725)`); }
            if (!projectExplorerTabContent) { throw new Error(`(UNEXPECTED) projectExplorerTabContent not found? (E: 664b2e2b0990950a4280d2c1a1a19325)`); }
            // if (!tagExplorerTabContent) { throw new Error(`(UNEXPECTED) tagExplorerTabContent not found? (E: 468cc54110fa840edd89256a519cd125)`); }

            const tabButtons = [web10TabButton, projectExplorerTabButton];
            const tabContents = [web10TabContent, projectExplorerTabContent];

            let tabButtonToShow: HTMLElement;
            switch (tabName) {
                case RouterAppName.web1:
                    tabButtonToShow = web10TabButton;
                    break;
                case RouterAppName.projects:
                    tabButtonToShow = projectExplorerTabButton;
                    break;
                // case RouterAppName.tags:
                //     tabButtonToShow = tagExplorerTabButton;
                //     break;
                default:
                    throw new Error(`(UNEXPECTED) unknown tabName: ${tabName}? (E: fc075a2f1c8daf80c29e3c114ccb4d25)`);
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabButtonToShow.classList.add('active');
            let contentToShow: HTMLElement | null;
            if (tabButtonToShow === web10TabButton) {
                contentToShow = web10TabContent;
            } else if (tabButtonToShow === projectExplorerTabButton) {
                contentToShow = projectExplorerTabContent;
                // } else if (tabButtonToShow === tagExplorerTabButton) {
                //     contentToShow = tagExplorerTabContent;
            } else {
                throw new Error(`(UNEXPECTED) unknown tab button: ${tabButtonToShow.id} (E: 36a601b1c90f8656024b2b34e9831525)`);
            }
            tabContents.forEach(content => content.classList.add('collapsed'));
            contentToShow.classList.remove('collapsed');
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private chronologysActiveIbGibAddr: IbGibAddr = ROOT_ADDR;

    public async activateRightPanelTab({
        tabName,
        ibGibAddr,
    }: {
        tabName: 'chronologys',
        ibGibAddr?: IbGibAddr,
    }): Promise<void> {
        const lc = `[${this.activateRightPanelTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 08c97c33eddef98c9983d95150763b25)`); }

            if (tabName === 'chronologys') {
                this.chronologysActiveIbGibAddr = ibGibAddr ?? ROOT_ADDR;
            }

            // first show the right panel if it's not already shown
            const status = this.getPanelStatus({ panelName: 'rightPanel' });
            if (status === 'collapsed') {
                this.expand({ panelNames: ['rightPanel'] });
            }

            // now do the highlighting of the tab btn element
            if (!this.chronologysContent) { throw new Error(`(UNEXPECTED) this.chronologysContent falsy? (E: d89e3fa5aa2202926276a19ace872a25)`); }

            const { chronologysTabButton } = this.getRightPanelTabButtons();

            const tabButtons = [chronologysTabButton];
            const tabContents = [this.chronologysContent];

            let tabButtonToShow: HTMLElement;
            switch (tabName) {
                case 'chronologys':
                    tabButtonToShow = chronologysTabButton;
                    break;
                default:
                    throw new Error(`(UNEXPECTED) unknown tabName: ${tabName}? (E: fb06833f125858bc8e6f5ce68f5cc925)`);
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabButtonToShow.classList.add('active');
            let contentToShow: HTMLElement | null;
            if (tabButtonToShow === chronologysTabButton) {
                contentToShow = this.chronologysContent;
            } else {
                throw new Error(`(UNEXPECTED) unknown tab button: ${tabButtonToShow.id} (E: c850c5511b2b1e0218fdc729ab228625)`);
            }
            tabContents.forEach(content => content.classList.add('collapsed'));
            contentToShow.classList.remove('collapsed');
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion public api
}

/**
 * Singleton {@link AppShellService} instance.
 *
 * This provides access to app shell's panels for, e.g.,
 * expand/maximize/collapse functionality.
 */
let appShellSvc: AppShellService;
export function getAppShellSvc(): AppShellService {
    if (!appShellSvc) {
        appShellSvc = new AppShellService();
    }
    return appShellSvc;
}

// fnObs
