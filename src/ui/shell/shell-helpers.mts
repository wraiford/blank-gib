import { delay, extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { GLOBAL_LOG_A_LOT, } from "../../constants.mjs";
import {
    handleLocalSPAAnchorClick,
    simpleIbGibRouterSingleton as router
} from "../router/router-one-file.mjs";
import { RouterAppName } from "../../common/app-constants.mjs";
import { isExecutingInBlankGibWebAppProper, } from "../../helpers.web.mjs";

import {
    ID_APP_SHELL, ID_HEADER_PANEL, ID_PANEL_CONTAINER, ID_LEFT_PANEL,
    ID_LEFT_PANEL_CONTENT, ID_LEFT_PANEL_FOOTER, ID_LEFT_PANEL_HEADER,
    ID_LEFT_PANEL_MAXIMIZE_HANDLE, ID_PROJECT_EXPLORER_TAB_BUTTON,
    ID_PROJECT_EXPLORER_TAB_CONTENT, ID_RIGHT_PANEL, ID_RIGHT_PANEL_CONTENT,
    ID_RIGHT_PANEL_FOOTER, ID_RIGHT_PANEL_HEADER,
    ID_RIGHT_PANEL_MAXIMIZE_HANDLE, ID_FOOTER_PANEL, ID_FOOTER_INPUT_CONTAINER,
    ID_WEB10_TAB_BUTTON, ID_WEB10_TAB_CONTENT, ID_TAG_NAV,
    ID_TAG_EXPLORER_TAB_CONTENT, ID_LEFT_PANEL_COLLAPSE_HANDLE,
    ID_LEFT_PANEL_EXPAND_HANDLE, ID_RIGHT_PANEL_COLLAPSE_HANDLE,
    ID_RIGHT_PANEL_EXPAND_HANDLE, ID_FOOTER_PANEL_COLLAPSE_HANDLE,
    ID_FOOTER_PANEL_EXPAND_HANDLE, ID_FOOTER_PANEL_MAXIMIZE_HANDLE,
    ID_CENTER_PANEL_CONTENT, ID_TAG_EXPLORER_TAB_BUTTON, ID_WEB_1_NAV,
} from './shell-constants.mjs';

const logalot = GLOBAL_LOG_A_LOT;

let appShell: HTMLElement | null;

let headerPanel: HTMLElement | null;

/**
 * this contains the left, center, and right panels.
 */
let panelContainer: HTMLElement | null;

let leftPanel: HTMLElement | null;
let leftPanelHeader: HTMLElement | null;
let leftPanelContent: HTMLElement | null;
let leftPanelFooter: HTMLElement | null;
let leftPanelCollapseHandle: HTMLElement | null;
let leftPanelExpandHandle: HTMLElement | null;
let leftPanelMaximizeHandle: HTMLElement | null;

let rightPanel: HTMLElement | null;
let rightPanelHeader: HTMLElement | null;
let rightPanelContent: HTMLElement | null;
let rightPanelFooter: HTMLElement | null;
let rightPanelCollapseHandle: HTMLElement | null;
let rightPanelExpandHandle: HTMLElement | null;
let rightPanelMaximizeHandle: HTMLElement | null;

let footerPanel: HTMLElement | null;
let footerInputContainer: HTMLElement | null;
let footerPanelCollapseHandle: HTMLElement | null;
let footerPanelExpandHandle: HTMLElement | null;
let footerPanelMaximizeHandle: HTMLElement | null;

let centerPanelContent: HTMLElement | null;

const fnClearResize = (els: (HTMLElement | null)[]) => {
    els.forEach(el => {
        if (!el) { throw new Error(`(UNEXPECTED) el is falsy? (E: 67b2eeb874a2090f8763edb62d9a7325)`); }
        // el.style.setProperty('resize', 'none');
        el.style.removeProperty('width');
        el.style.removeProperty('height');
    })
}
// const fnSetResize = (els: (HTMLElement | null)[]) => {
//     els.forEach(el => {
//         if (!el) { throw new Error(`(UNEXPECTED) el is falsy? (E: b8967edb11525179c4f7e0ac3883c825)`); }
//         el.style.setProperty('resize', 'auto');
//     });
// }

const fnClearClasses = (els: (HTMLElement | null)[]) => {
    els.forEach(el => {
        if (!el) { throw new Error(`(UNEXPECTED) el is falsy? (E: 344bb8c7602e551327ab9a0ff8fe0325)`); }
        el.classList.remove('collapsed');
        el.classList.remove('expanded');
        el.classList.remove('maximized');
    })
};
const fnCollapse = (els: (HTMLElement | null)[]) => {
    fnClearClasses(els);
    els.forEach(el => {
        if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: a5d739f683aa91d8eeb1ab8955f00c25)`); }
        el.classList.add('collapsed');
    });
};
const fnExpand = (els: (HTMLElement | null)[]) => {
    fnClearClasses(els);
    els.forEach(el => {
        if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: 57b021c90bb8d1738307146b79c39125)`); }
        el.classList.add('expanded');
    })
};
const fnMaximize = (els: (HTMLElement | null)[]) => {
    fnClearClasses(els);
    els.forEach(el => {
        if (!el) { throw new Error(`(UNEXPECTED) el falsy? (E: aa2dab40b7cbce96448756ededf82725)`); }
        el.classList.add('maximized');
    })
};

function expandLeftPanel(): void {

}

export function initLayout(): void {
    const lc = `[${initLayout.name}]`;
    document.addEventListener('DOMContentLoaded', () => {
        const lcDOM = `${lc}[DOMContentLoaded]`
        if (!isExecutingInBlankGibWebAppProper()) {
            if (logalot) { console.log(`${lcDOM} executing in iframe so returning early (I: 7118fb26f44e791f46bb0301172bbd25)`); }
            return; /* <<<< returns early */
        }
        initTabButtonsLeftPanel();
        initPanels();
        initNav();
        initPopstateListener();

        // Optional: Set initial debug borders (you can also toggle this in dev tools)
        // document.documentElement.style.setProperty('--debug-border-width', '3px');
    });
}

/**
 * if scroll down, then this number will be negative. if scroll up this will be
 * positive.
 *
 * ## driving intent
 *
 * hide the header as we scroll center panel content
 */
let centerPanelScrollOffset = 0;
let lastCenterPanelScrollTop = 0;
let initialHeaderPanelHeight = 0;
let initialHeaderPanelHeightPctOfAppShell = 0;

function initPanels(): void {
    const lc = `[${initPanels.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 5a7c48a369f95589c5d2b1867549cf25)`); }

        appShell = document.getElementById(ID_APP_SHELL);

        headerPanel = document.getElementById(ID_HEADER_PANEL);

        panelContainer = document.getElementById(ID_PANEL_CONTAINER);
        leftPanel = document.getElementById(ID_LEFT_PANEL);
        leftPanelHeader = document.getElementById(ID_LEFT_PANEL_HEADER);
        leftPanelContent = document.getElementById(ID_LEFT_PANEL_CONTENT);
        leftPanelFooter = document.getElementById(ID_LEFT_PANEL_FOOTER);
        leftPanelCollapseHandle = document.getElementById(ID_LEFT_PANEL_COLLAPSE_HANDLE);
        leftPanelExpandHandle = document.getElementById(ID_LEFT_PANEL_EXPAND_HANDLE);
        leftPanelMaximizeHandle = document.getElementById(ID_LEFT_PANEL_MAXIMIZE_HANDLE);

        rightPanel = document.getElementById(ID_RIGHT_PANEL);
        rightPanelContent = document.getElementById(ID_RIGHT_PANEL_CONTENT);
        rightPanelHeader = document.getElementById(ID_RIGHT_PANEL_HEADER);
        rightPanelFooter = document.getElementById(ID_RIGHT_PANEL_FOOTER);
        rightPanelCollapseHandle = document.getElementById(ID_RIGHT_PANEL_COLLAPSE_HANDLE);
        rightPanelExpandHandle = document.getElementById(ID_RIGHT_PANEL_EXPAND_HANDLE);
        rightPanelMaximizeHandle = document.getElementById(ID_RIGHT_PANEL_MAXIMIZE_HANDLE);

        footerPanel = document.getElementById(ID_FOOTER_PANEL);
        footerInputContainer = document.getElementById(ID_FOOTER_INPUT_CONTAINER);
        footerPanelCollapseHandle = document.getElementById(ID_FOOTER_PANEL_COLLAPSE_HANDLE);
        footerPanelExpandHandle = document.getElementById(ID_FOOTER_PANEL_EXPAND_HANDLE);
        footerPanelMaximizeHandle = document.getElementById(ID_FOOTER_PANEL_MAXIMIZE_HANDLE);

        centerPanelContent = document.getElementById(ID_CENTER_PANEL_CONTENT) as HTMLElement;

        if (!appShell) { throw new Error(`(UNEXPECTED) app shell falsy? (E: 51c5045e4b84c4f92647d61430370c25)`); }
        if (!headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? (E: d00a3c546396bac9edb9b7cb38be1a25)`); }

        if (!panelContainer) { throw new Error(`(UNEXPECTED) Panel container not found? (E: 6efcd4bbe32653a40cd7af2ed7a84825)`); }
        if (!leftPanel) { throw new Error(`(UNEXPECTED) Left panel not found? (E: 5507ecca9fb6d3a90dcff6f577d78225)`); }
        if (!rightPanel) { throw new Error(`(UNEXPECTED) Right panel not found? (E: d9373f83bd7f021ab2c478467c576f25)`) };
        if (!leftPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Left panel collapse handle not found? (E: 53f3c27a8443c13cdf08c612a744ea25)`); }
        if (!rightPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Right panel collapse handle not found? (E: 60c56dc2e54ea0d34abcda7ac6b98325)`); }
        if (!leftPanelExpandHandle) { throw new Error(`(UNEXPECTED) Left panel expand handle not found? (E: 1da50cae5fee165954c2830a8f538225)`); }
        if (!rightPanelExpandHandle) { throw new Error(`(UNEXPECTED) Right panel expand handle not found? (E: b578747f8da1ed7c8c663309ed3c9625)`); }
        if (!leftPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) Left panel maximize handle not found? (E: 6969dc4cd84df10b3bc73f75e6a1a225)`); }
        if (!rightPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) Right panel maximize handle not found? (E: aea0bd86f7c4e9c41b326d83dbdddf25)`); }
        if (!leftPanelFooter) { throw new Error(`(UNEXPECTED) Left panel footer not found? (E: 62d11cbe41943b1ef736a002fdca1c25)`); }
        if (!rightPanelFooter) { throw new Error(`(UNEXPECTED) Right panel footer not found? (E: 5e15a334ba68394e41ce5fae1c35dd25)`); }

        // footer panel
        if (!footerPanel) { throw new Error(`(UNEXPECTED) Footer panel not found? (E: c5e4ce4d48f59ffe0b724df1aa664c25)`); }
        if (!footerInputContainer) { throw new Error(`(UNEXPECTED) Primary agent input (footer-input-container) not found? (E: b8119a25544681d2695d0e0360fbd425)`); }
        if (!footerPanelCollapseHandle) { throw new Error(`(UNEXPECTED) Footer panel collapse handle not found? (E: f06e9874c54c2a029ea7b59307348725)`); }
        if (!footerPanelExpandHandle) { throw new Error(`(UNEXPECTED) footerPanelExpandHandle not found? (E: b9429cf155d87f4f2277df2a20c2af25)`); }
        if (!footerPanelMaximizeHandle) { throw new Error(`(UNEXPECTED) footerPanelMaximizeHandle not found? (E: 2eab4faf2592f9482241f37533765725)`); }

        if (!centerPanelContent) { throw new Error(`(UNEXPECTED) Center panel content not found? (E: a1367b39ec61ca44b879ec389e9f6f25)`); }

        const leftHandles = [leftPanelCollapseHandle, leftPanelExpandHandle, leftPanelMaximizeHandle];
        const leftPanels = [leftPanel, leftPanelFooter, leftPanelContent, leftPanelHeader];
        const leftAll = [...leftPanels, ...leftHandles];
        const rightHandles = [rightPanelCollapseHandle, rightPanelExpandHandle, rightPanelMaximizeHandle];
        const rightPanels = [rightPanel, rightPanelFooter, rightPanelHeader];
        const rightAll = [...rightPanels, ...rightHandles];
        const footerPanels = [footerPanel, footerInputContainer];
        const footerHandles = [footerPanelCollapseHandle, footerPanelExpandHandle, footerPanelMaximizeHandle];
        const footerAll = [...footerPanels, ...footerHandles];

        const fnClearAllClasses = ({ footerAlso }: { footerAlso: boolean }) => {
            fnClearClasses([panelContainer, ...leftAll, ...rightAll,]);
            if (footerAlso) { fnClearClasses([...footerAll]); }
        };

        leftPanelCollapseHandle.addEventListener('click', () => {
            fnClearResize([leftPanel]);
            fnClearClasses(leftAll);
            fnCollapse([...leftPanels, leftPanelCollapseHandle]);
        });

        leftPanelExpandHandle.addEventListener('click', () => {
            fnClearResize([leftPanel]);
            fnClearClasses(leftAll);
            fnExpand(leftPanels);
            fnCollapse([leftPanelExpandHandle]);
        });

        leftPanelMaximizeHandle.addEventListener('click', () => {
            fnClearResize([leftPanel]);
            fnClearAllClasses({ footerAlso: false });
            fnCollapse([
                ...leftPanels,
                ...rightPanels, rightPanelCollapseHandle,
                // ...footerPanels, footerPanelCollapseHandle
            ]);
            fnMaximize(leftPanels);
            fnCollapse([leftPanelMaximizeHandle]);
        });


        rightPanelCollapseHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearClasses(rightAll);
            fnCollapse([...rightPanels, rightPanelCollapseHandle]);
        });

        rightPanelExpandHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearClasses(rightAll);
            fnExpand(rightPanels);
            fnCollapse([rightPanelExpandHandle]);
        });

        rightPanelMaximizeHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearAllClasses({ footerAlso: false });
            fnCollapse([
                ...rightPanels,
                ...leftPanels, leftPanelCollapseHandle,
                // ...footerPanels, footerPanelCollapseHandle
            ]);
            fnMaximize(rightPanels);
            fnCollapse([rightPanelMaximizeHandle]);
        });

        // footer panel
        footerPanelCollapseHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearClasses([panelContainer, ...footerAll]);
            fnCollapse([...footerPanels, footerPanelCollapseHandle]);
        });
        footerPanelExpandHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearClasses([panelContainer, ...footerAll]);
            fnExpand(footerPanels);
            fnCollapse([footerPanelExpandHandle]);
        });
        footerPanelMaximizeHandle.addEventListener('click', () => {
            fnClearResize([rightPanel]);
            fnClearAllClasses({ footerAlso: true });
            fnCollapse([
                ...rightPanels, rightPanelCollapseHandle,
                ...leftPanels, leftPanelCollapseHandle,
                panelContainer,
            ]);
            fnMaximize(footerPanels);
            fnCollapse([rightPanelMaximizeHandle]);
        });

        // Initialize panels
        fnClearAllClasses({ footerAlso: true });
        fnExpand([
            ...leftPanels,
            ...rightPanels,
            ...footerPanels,
        ]);
        fnCollapse([
            leftPanelExpandHandle,
            rightPanelExpandHandle,
            footerPanelExpandHandle,
        ]);

        initHideHeaderOnScroll();

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * todo: change this to also hide the footer. Perhaps the side panels as well.
 */
function initHideHeaderOnScroll(): void {
    const lc = `[${initHideHeaderOnScroll.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f57dd8b3a8ff88958b35f07c3a341e25)`); }
        if (!appShell) { throw new Error(`(UNEXPECTED) appShell not found? (E: fa55d5cac07ede4bfd7f3bace7026d25)`); }
        if (!headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? (E: 4ce8f134611b8781a5a82a32e20ccf25)`); }
        if (!centerPanelContent) { throw new Error(`(UNEXPECTED) centerPanelContent falsy? (E: 86daea2e4c676990a3287cb79d00a825)`); }

        const updateCenterPanelScrollHidesHeader = (headerPanelHeight: number) => {
            if (!centerPanelContent) { throw new Error(`(UNEXPECTED) centerPanelContent falsy? (E: d593fee7525b3c9308ba0df32c9d0625)`); }
            if (!headerPanel) { throw new Error(`(UNEXPECTED) Header panel not found? this was originally truthy but in this scroll handler, it's falsy? (E: e22be78e20522e61ea245c7ec87b7325)`); }

            const oldScroll = lastCenterPanelScrollTop;
            const newScroll = centerPanelContent.scrollTop;
            /**
             * scrolling down => positive delta
             * scrolling up => negative delta
             *
             * we want to hide the header as we scroll down, so we take the height
             * of the header panel and subtract the delta up until the height is 1.
             *
             * when we scroll back up, we want to slowly reshow the header.
             */
            centerPanelScrollOffset += newScroll - oldScroll;

            if (centerPanelScrollOffset > headerPanelHeight) {
                centerPanelScrollOffset = headerPanelHeight;
            } else if (centerPanelScrollOffset < 0) {
                centerPanelScrollOffset = 0;
            }
            if (centerPanelScrollOffset > 0) {
                // don't just transform but actually change the height.
                // otherwise, our overall layout has problems
                const scale = (headerPanelHeight - centerPanelScrollOffset) / headerPanelHeight;
                headerPanel.style.height = `${scale * headerPanelHeight}px`;
            } else {
                // restore the original height
                headerPanel.style.height = `${headerPanelHeight}px`;
            }

            // set for next time
            lastCenterPanelScrollTop = centerPanelContent.scrollTop;
        }

        initialHeaderPanelHeight = headerPanel.clientHeight;
        initialHeaderPanelHeightPctOfAppShell = initialHeaderPanelHeight / appShell.clientHeight;
        let appShellResizeObserver = new ResizeObserver((_entries) => {
            if (!headerPanel) { throw new Error(`(UNEXPECTED) headerPanel falsy in resize handler? (E: 69327376be54c87da86361a7c3156925)`); }
            if (!appShell) { throw new Error(`(UNEXPECTED) appShell falsy? (E: 8141efedd3f1c9aaa8b94316b0423125)`); }
            lastCenterPanelScrollTop = 0;
            centerPanelScrollOffset = 0;
            initialHeaderPanelHeight = appShell?.clientHeight * initialHeaderPanelHeightPctOfAppShell;
            // updateCenterPanelScrollHidesHeader(initialHeaderPanelHeight);
            headerPanel.style.height = `${initialHeaderPanelHeight}px`;

        });
        appShellResizeObserver.observe(appShell);

        centerPanelContent.addEventListener('scroll', (ev: Event) => {
            updateCenterPanelScrollHidesHeader(initialHeaderPanelHeight);
        });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

function getLeftPanelTabButtons(): {
    web10TabButton: HTMLElement;
    projectExplorerTabButton: HTMLElement;
    tagExplorerTabButton: HTMLElement;
} {
    const lc = `[${getLeftPanelTabButtons.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 8675bae85fab6164daa088d8e5bd9925)`); }

        const web10TabButton = document.getElementById(ID_WEB10_TAB_BUTTON);
        const projectExplorerTabButton = document.getElementById(ID_PROJECT_EXPLORER_TAB_BUTTON);
        const tagExplorerTabButton = document.getElementById(ID_TAG_EXPLORER_TAB_BUTTON);

        if (!web10TabButton) { throw new Error(`(UNEXPECTED) web10TabButton not found? (E: 3b4cd02b129932783a52d47f0b353b25)`); }
        if (!projectExplorerTabButton) { throw new Error(`(UNEXPECTED) projectExplorerTabButton not found? (E: 7410c60953b56d47c1273e237612b425)`); }
        if (!tagExplorerTabButton) { throw new Error(`(UNEXPECTED) tagExplorerTabButton not found? (E: 2b6487d20de80988f6547cf9bd4dd825)`); }

        return { web10TabButton, projectExplorerTabButton, tagExplorerTabButton };
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
export function activateLeftPanelTab({
    tabName,
}: {
    tabName: RouterAppName,
}): void {
    const lc = `[${activateLeftPanelTab.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 5bada68f957da3cf7520a2c2ed249125)`); }

        const { web10TabButton, projectExplorerTabButton, tagExplorerTabButton } = getLeftPanelTabButtons();

        const web10TabContent = document.getElementById(ID_WEB10_TAB_CONTENT);
        const projectExplorerTabContent = document.getElementById(ID_PROJECT_EXPLORER_TAB_CONTENT);
        const tagExplorerTabContent = document.getElementById(ID_TAG_EXPLORER_TAB_CONTENT);

        if (!web10TabContent) { throw new Error(`(UNEXPECTED) web10TabContent not found? (E: 25a8907b3b7c11e434057c939d322725)`); }
        if (!projectExplorerTabContent) { throw new Error(`(UNEXPECTED) projectExplorerTabContent not found? (E: 664b2e2b0990950a4280d2c1a1a19325)`); }
        if (!tagExplorerTabContent) { throw new Error(`(UNEXPECTED) tagExplorerTabContent not found? (E: 468cc54110fa840edd89256a519cd125)`); }

        const tabButtons = [web10TabButton, projectExplorerTabButton, tagExplorerTabButton];
        const tabContents = [web10TabContent, projectExplorerTabContent, tagExplorerTabContent];

        let tabButtonToShow: HTMLElement;
        switch (tabName) {
            case RouterAppName.web1:
                tabButtonToShow = web10TabButton;
                break;
            case RouterAppName.projects:
                tabButtonToShow = projectExplorerTabButton;
                break;
            case RouterAppName.tags:
                tabButtonToShow = tagExplorerTabButton;
                break;
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
        } else if (tabButtonToShow === tagExplorerTabButton) {
            contentToShow = tagExplorerTabContent;
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

function initTabButtonsLeftPanel() {
    const lc = `[${initTabButtonsLeftPanel.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 564a084b92a4e90b7560248afcfc2425)`); }

        const { web10TabButton, projectExplorerTabButton, tagExplorerTabButton } = getLeftPanelTabButtons();

        web10TabButton.addEventListener('click', () => activateLeftPanelTab({ tabName: RouterAppName.web1 }));
        projectExplorerTabButton.addEventListener('click', () => activateLeftPanelTab({ tabName: RouterAppName.projects }));
        tagExplorerTabButton.addEventListener('click', () => activateLeftPanelTab({ tabName: RouterAppName.tags }));

        // default to web 1.0 nav tab on load
        activateLeftPanelTab({ tabName: RouterAppName.web1 });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

function initNav() {
    const lc = `[${initNav.name}]`;
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
function initPopstateListener(): void {
    const lc = `[${initPopstateListener.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 035c88bf564f5481e8ca9a139286a425)`); }

        window.addEventListener('popstate', () => {
            if (logalot) { console.log(`${lc} popstate event triggered. (I: fff1e3ffc9ac9d2573e6bd7a310dc825)`); }

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
