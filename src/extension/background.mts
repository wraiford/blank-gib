/**
 * @fileoverview This script is the background service worker for the extension.
 *
 * It's responsible for managing the side panel's behavior on a per-tab basis.
 */

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

const logalot = true;

// This listener is triggered when the user clicks the extension's icon in the toolbar.
chrome.action.onClicked.addListener(async (tab) => {
    const lc = `[chrome.action.onClicked]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: e00f9c16161533f458a9197ebfcb9825)`); }

        if (!tab.id || !tab.windowId) {
            console.error("The active tab has no ID or windowId. Cannot open side panel.");
            return;
        }

        // First, open the panel for the current window. This is a direct response
        // to the user gesture and satisfies Chrome's security policy.
        await chrome.sidePanel.open({ windowId: tab.windowId });

        // This does NOT really work.

        // Then, set the options for the specific tab. This tells Chrome to associate
        // the panel's content and enabled state with this tab only.
        // await chrome.sidePanel.setOptions({
        //     tabId: tab.id,
        //     path: "index.sidepanel.ext.html", // The side panel's HTML file
        //     enabled: true
        // });

        // const test = await sha256v1(ROOT);
        // console.log(`${lc} test (should be some hash): ${test} (I: bab8d87e301bb2a3699a5ae869edd825)`);
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
});


/**
 * Listens for when a user navigates to a new page within a tab
 * and sends a message to the side panel to reset its view.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only care about the main frame, when it's fully loaded, and has a real URL.
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Send a message to the side panel to reset itself.
        // We wrap this in a try/catch because the side panel may not be open,
        // in which case sendMessage will throw an error.
        // With per-tab panels, this message will only go to the active tab's panel context if it exists.
        try {
            // Note: We don't specify a tabId here. The message goes to the extension's runtime,
            // and the active side panel component (if any) will pick it up.
            chrome.runtime.sendMessage({
                type: 'navigationComplete',
                url: tab.url,
            });
        } catch (error) {
            // This is expected if the side panel is not open for the current context.
            console.log('Could not send navigationComplete message. Side panel likely not enabled for this tab or is closed.');
        }
    }
});
