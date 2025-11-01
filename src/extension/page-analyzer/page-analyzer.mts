/**
 * @module page-analyzer
 *
 * @description
 * This module serves as the central orchestrator for analyzing and deconstructing
 * web page content for the purposes of interactive chunking.
 *
 * The core philosophy is a two-stage process:
 *
 * 1.  **DOM Analysis & Digital Twin Creation:** First, we identify candidate elements
 *     on the page that likely contain the main content. For each candidate, we
 *     build a lightweight, serializable "digital twin" of its DOM structure
 *     (a `DOMElementInfo` tree). As we build this tree, we "stamp" the real
 *     DOM elements with unique IDs, creating a link between the twin and the
 *     live page.
 *
 * 2.  **Interactive Sidepanel UX:** This digital twin is sent to the sidepanel,
 *     which renders an interactive representation. The user can then refine the
 *     chunking visually before any final processing occurs. The stamped IDs
 *     allow the sidepanel to highlight and reference the corresponding live
 *     elements.
 */

import { PageContentInfo, AnalyzedElement } from './page-analyzer-types.mjs';
import { buildDomInfoTree } from './dom-tree-builder.mjs';
import { pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

const logalot = true;
const lcFile = `[page-analyzer.mts]`;

// #region Helper Functions

/**
 * Creates a unique CSS selector path for a given element.
 * This is used to find the original element again after processing a clone.
 */
function getSelectorPath(el: Element): string {
    if (!(el instanceof Element)) { return ''; }
    const path: string[] = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break; // ID is unique
        } else {
            let sib = el;
            let nth = 1;
            while (sib.previousElementSibling) {
                sib = sib.previousElementSibling;
                if (sib.nodeName.toLowerCase() === selector) { nth++; }
            }
            if (nth !== 1) { selector += `:nth-of-type(${nth})`; }
        }
        path.unshift(selector);
        el = el.parentElement!;
    }
    return path.join(' > ');
}

/**
 * Extracts the main title of the document.
 */
function getTitle(doc: Document): string | undefined {
    // ... (implementation is unchanged)
    return doc.title || doc.querySelector('h1')?.innerText;
}

/**
 * Scans the document to find and score all potential main content elements.
 * It cleans the document by removing common non-content sections and then
 * scores candidates based on tag name, id, class, text length, and link density.
 * @returns A sorted array of candidates, with the best one first.
 */
function findBestCandidateElements(doc: Document): { el: HTMLElement, score: number }[] {
    if (logalot) { console.log(`${lcFile}[findBestCandidateElements] starting...`); }

    const cleanBody = doc.body.cloneNode(true) as HTMLElement;
    const selectorsToRemove = 'nav, footer, aside, script, style, [role="navigation"], [role="complementary"], [aria-label*="ad" i]';
    cleanBody.querySelectorAll(selectorsToRemove).forEach(el => el.remove());

    const allCandidates: { el: HTMLElement, score: number }[] = [];
    const candidateElements = Array.from(cleanBody.querySelectorAll('body div, body section, body article, body main'));

    for (const el of candidateElements) {
        const htmlEl = el as HTMLElement;
        const text = htmlEl.innerText || '';
        if (text.length < 250) { continue; }

        let score = 0;
        const tagName = htmlEl.tagName.toLowerCase();
        const className = htmlEl.className.toLowerCase();
        const id = htmlEl.id.toLowerCase();

        if (tagName === 'article' || id.includes('article') || className.includes('article')) { score += 25; }
        if (tagName === 'main' || id.includes('main') || className.includes('main')) { score += 20; }
        if (id.includes('content') || className.includes('content')) { score += 15; }

        score += Math.min(text.length / 100, 50);

        const linkDensity = htmlEl.querySelectorAll('a').length / (text.split(' ').length + 1);
        if (linkDensity > 0.3) { score -= 40; }

        const originalEl = doc.querySelector(getSelectorPath(htmlEl)) as HTMLElement;
        if (originalEl) {
            allCandidates.push({ el: originalEl, score });
        }
    }

    if (allCandidates.length === 0) {
        if (logalot) { console.log(`${lcFile}[findBestCandidateElements] No candidates found, returning body.`); }
        return [{ el: doc.body, score: 10 }];
    }

    // Sort by score descending.
    allCandidates.sort((a, b) => b.score - a.score);

    // Boost score of container elements.
    if (allCandidates.length > 1 && allCandidates[0].el.contains(allCandidates[1].el)) {
        allCandidates[0].score *= 1.2;
        allCandidates.sort((a, b) => b.score - a.score); // re-sort
    }

    if (logalot) { console.log(`${lcFile}[findBestCandidateElements] Found ${allCandidates.length} candidates. Top score: ${allCandidates[0].score}`); }
    return allCandidates;
}

// #endregion

/**
 * This is the main entry point called from the content script.
 * It finds candidate elements, builds a serializable DOM tree for each, and
 * returns the complete analysis to be consumed by the sidepanel UI.
 */
export async function getPageContentInfo_fromContentScript(): Promise<PageContentInfo> {
    const lc = `${lcFile}[getPageContentInfo_fromContentScript]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }

        const pageTitle = getTitle(document);
        const scoredCandidates = findBestCandidateElements(document);

        if (!scoredCandidates || scoredCandidates.length === 0) {
            throw new Error('Could not find any suitable candidate elements for content extraction.');
        }

        const analyzedElements: AnalyzedElement[] = [];
        for (const candidate of scoredCandidates) {
            const domInfoTree = await buildDomInfoTree(candidate.el);
            if (domInfoTree) {
                domInfoTree.isRoot = true;
                analyzedElements.push({
                    score: candidate.score,
                    domInfoTree: domInfoTree,
                });
            } else {
                console.error(`${lc} Failed to build DOM info tree for element: ${candidate.el.outerHTML}`)
            }
        }

        const result: PageContentInfo = {
            title: pageTitle,
            bestCandidate: analyzedElements[0],
            otherCandidates: analyzedElements.slice(1),
            url: window.location.href,
        };

        if (logalot) { console.log(`${lc} result.bestCandidate: ${pretty(result.bestCandidate)} (I: 3eb85770d29814084801c0a3db067825)`); }
        return result;

    } catch (error) {
        console.error(`${lc} ${error.message}`);
        throw error;
    }
}
