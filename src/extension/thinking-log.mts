import thisHtml from './thinking-log.html';
import thisCss from './thinking-log.css';
import rootCss from '../root.css';

import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

const logalot = true;

let thinkingLogOverlay: HTMLElement | null = null;
let thinkingLogContainer: HTMLElement | null = null;
let thinkingLogEntries: HTMLElement | null = null;
let thinkingLogCloseBtn: HTMLButtonElement | null = null;
let thinkingLogEntryTemplate: HTMLTemplateElement | null = null;

interface ThinkingEntry {
    id: string;
    messages: string[]; // Changed from message: string
    isComplete: boolean;
    isError: boolean;
    element: HTMLElement;
}

let thinkingEntries: ThinkingEntry[] = [];

let thinkingLogInitialized = false;

export function initializeThinkingLog(): void {
    const lc = `[${initializeThinkingLog.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: e5f4b950bf68f4f88a0fff880256d925)`); }

        if (thinkingLogInitialized) {
            if (logalot) { console.log(`${lc} thinkingLog already initialized (I: 1cf918b81a28eaa30344063d711b5e25)`); }
            return; /* <<<< returns early */
        } else {
            thinkingLogInitialized = true;
        }

        if (thinkingLogOverlay) {
            if (logalot) { console.log(`${lc} thinkingLogOverlay already truthy (I: e020082c2ab822257831c17894ea8825)`); }
            return; /* <<<< returns early */
        }

        document.body.insertAdjacentHTML('beforeend', thisHtml);

        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(rootCss + '\n' + thisCss);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];

        thinkingLogOverlay = document.getElementById('thinking-log-overlay');
        thinkingLogContainer = document.getElementById('thinking-log-container');
        thinkingLogEntries = document.getElementById('thinking-log-entries');
        thinkingLogCloseBtn = document.getElementById('thinking-log-close-btn') as HTMLButtonElement;
        thinkingLogEntryTemplate = document.getElementById('thinking-log-entry-template') as HTMLTemplateElement;

        if (!thinkingLogOverlay || !thinkingLogContainer || !thinkingLogEntries || !thinkingLogCloseBtn || !thinkingLogEntryTemplate) {
            console.error(`${lc} Failed to find all required thinking log elements.`);
            return;
        }

        thinkingLogCloseBtn.addEventListener('click', () => hideThinkingLog());
        thinkingLogOverlay.addEventListener('click', (e) => {
            if (e.target === thinkingLogOverlay) {
                hideThinkingLog();
            }
        });

    } catch (error) {
        thinkingLogInitialized = false;
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function showThinkingLog() {
    initializeThinkingLog();
    if (thinkingLogOverlay) {
        thinkingLogOverlay.classList.remove('collapsed');
    }
}

export function hideThinkingLog() {
    if (thinkingLogOverlay) {
        thinkingLogOverlay.classList.add('collapsed');
    }
}

export function addThinkingEntry(message: string, thinkingId?: string): string {
    const lc = `[addThinkingEntry]`;
    if (logalot) { console.log(`${lc} adding entry: ${message}`); }

    if (!thinkingLogEntryTemplate || !thinkingLogEntries) {
        initializeThinkingLog();
    }

    if (!thinkingLogEntryTemplate || !thinkingLogEntries) {
        console.error(`${lc} Thinking log not properly initialized even after calling initializeThinkingLog. (E: 9b25bd72eb56d94e889cd7a49c88b125)`);
        return '';
    }

    const newEntryId = thinkingId ?? `thinking-entry-${Date.now()}`;
    const newEntryFragment = thinkingLogEntryTemplate.content.cloneNode(true) as DocumentFragment;
    const newEntryElement = newEntryFragment.firstElementChild as HTMLElement;

    if (!newEntryElement) { return ''; }

    newEntryElement.id = newEntryId;
    const messagesContainer = newEntryElement.querySelector('.thinking-log-messages');
    if (messagesContainer) {
        const p = document.createElement('p');
        p.textContent = message;
        messagesContainer.appendChild(p);
    }

    thinkingLogEntries.prepend(newEntryElement); // prepend to show newest first

    const entryData: ThinkingEntry = {
        id: newEntryId,
        messages: [message],
        isComplete: false,
        isError: false,
        element: newEntryElement,
    };
    thinkingEntries.push(entryData);

    // showThinkingLog();

    return newEntryId;
}

/**
 *
 * todo: refactor this darn function to use named args so it's not all magic
 * throughout
 */
export function updateThinkingEntry(id: string, message: string, isComplete: boolean = false, isError: boolean = false) {
    const lc = `[updateThinkingEntry]`;
    const entry = thinkingEntries.find(e => e.id === id);
    if (entry) {
        if (logalot) { console.log(`${lc} updating entry ${id}: ${message}`); }
        entry.messages.push(message);
        entry.isComplete = isComplete;
        entry.isError = isError;

        const messagesContainer = entry.element.querySelector('.thinking-log-messages');
        if (messagesContainer) {
            const p = document.createElement('p');
            p.textContent = message;
            messagesContainer.appendChild(p);
        }

        if (isComplete) {
            const spinner = entry.element.querySelector('.thinking-log-spinner');
            if (spinner) { spinner.classList.add('collapsed'); }
        }

        if (isError) {
            entry.element.classList.add('error');
        }
    } else {
        console.warn(`${lc} Could not find thinking entry with id: ${id}`);
    }
}
