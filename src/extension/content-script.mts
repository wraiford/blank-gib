import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { highlightElement, unhighlightElement } from "@ibgib/web-gib/dist/helpers.web.mjs";

import { getPageContentInfo_fromContentScript } from "./page-analyzer/page-analyzer.mjs";

const logalot = true;
const lcFile = `[content-script.mts]`;

console.log(`${lcFile} content script loaded. v3 (I: 15986877e3081109c8ad3b0822579d25)`);

// Listener for selection changes on the page
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection()?.toString() ?? '';
    // Let the sidepanel know if there is an active selection.
    chrome.runtime.sendMessage({ type: 'selectionChange', hasSelection: selection.length > 0 });
});

async function handleMsg_scroll({
    message,
    sendResponse,
}: {
    message: any,
    sendResponse: (response: any) => void,
}): Promise<void> {
    const lc = `[${lcFile}][${handleMsg_scroll.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 1ab788ee73a888bd587832e811b25125)`); }

        const { gibId } = message;
        console.log(`[content-script] Received scrollToGib message for gibId: ${gibId}`);

        if (gibId === "ibgib") {
            scrollTo({ top: 0, behavior: 'smooth', });
            sendResponse({ success: true });
        } else {
            const DATA_IBGIB_EXT_ID_ATTR_NAME = 'ibgibext-id';

            // Use querySelectorAll to find ALL elements belonging to the chunk.
            const elements = document.querySelectorAll(`[data-${DATA_IBGIB_EXT_ID_ATTR_NAME}="${gibId}"]`);

            if (elements.length > 0) {
                console.log(`[content-script] Found ${elements.length} elements, scrolling into view and highlighting.`);

                // 1. Scroll the FIRST element into view to position the viewport.
                elements[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });

                // 2. Iterate and highlight ALL of the elements.
                elements.forEach(el => {
                    highlightElement({ el: el as any, magicHighlightTimingMs: 2000, scrollIntoView: false });
                });

                sendResponse({ success: true });
            } else {
                console.warn(`[content-script] Could not find any elements with data-gib-id: ${gibId}`);
                sendResponse({ success: false, error: 'Elements not found' });
            }
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function handleMsg_getPageContentInfo({
    message,
    sendResponse,
}: {
    message: any,
    sendResponse: (response: any) => void,
}): Promise<void> {
    const lc = `[${handleMsg_getPageContentInfo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 54bb726a866182834a0ccefcbf540e25)`); }
        // const algorithm = message.algorithm || 'semantic-chunker'; // Default to the new semantic chunker
        // const pageContentInfo = await getPageContentInfo_fromContentScript(algorithm);
        const pageContentInfo = await getPageContentInfo_fromContentScript();
        sendResponse({ success: true, data: pageContentInfo });
    } catch (error) {
        let emsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(emsg);
        sendResponse({ success: false, error: `Failed to get page content: ${emsg}` });
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

async function handleMsg_toggleHighlight({
    message,
    sendResponse,
}: {
    message: any,
    sendResponse: (response: any) => void,
}): Promise<void> {
    const lc = `[${lcFile}][${handleMsg_toggleHighlight.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        const { gibId, shouldBeHighlighted } = message;
        if (logalot) { console.log(`${lc} Received toggleHighlight. gibId: ${gibId}, shouldBeHighlighted: ${shouldBeHighlighted}`); }

        const DATA_IBGIB_EXT_ID_ATTR_NAME = 'ibgibext-id';
        const elements = document.querySelectorAll(`[data-${DATA_IBGIB_EXT_ID_ATTR_NAME}="${gibId}"]`);

        if (elements.length > 0) {
            if (logalot) { console.log(`${lc} Found ${elements.length} elements to highlight/unhighlight.`); }

            elements.forEach(el => {
                if (shouldBeHighlighted) {
                    // passing no time parameter makes the highlight persist.
                    highlightElement({ el: el as HTMLElement });
                } else {
                    unhighlightElement({ el: el as HTMLElement });
                }
            });

            sendResponse({ success: true });
        } else {
            console.warn(`${lc} Could not find any elements with data-gib-id: ${gibId}`);
            sendResponse({ success: false, error: 'Elements not found for highlighting.' });
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        sendResponse({ success: false, error: extractErrorMsg(error) });
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}


/**
 * Listener for messages from the extension (e.g., the sidepanel)
 *
 * NOTE: we cannot put the async keyword on the listener directly. the chrome
 * runtime will interpret this empty Promise as the return value, i.e., even if
 * you sendResponse(someObj) the return value will be undefined (from the async
 * promise). You have to spin off the async task, but be sure that you always
 * use sendResponse
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const lc = `[${lcFile}][onMessage]`;
    if (message.type === 'scrollToGib') {
        handleMsg_scroll({ message, sendResponse });
    } else if (message.type === 'toggleHighlight') { // Add this else if
        handleMsg_toggleHighlight({ message, sendResponse });
    } else if (message.type === 'getPageContentInfo') {
        handleMsg_getPageContentInfo({ message, sendResponse }); // spin off
    } else {
        const emsg = `${lc} Unknown message type: ${message.type}`;
        console.error(emsg);
        sendResponse({ success: false, error: emsg });
    }

    // Return true to indicate you wish to send a response asynchronously.
    return true;
});
