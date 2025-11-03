import { extractErrorMsg, pickRandom_Letters } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { DOMElementInfo } from "./page-analyzer-types.mjs";

const logalot = true;

/**
 * These are tags that we want to completely ignore when building our simplified
 * DOM tree.
 */
const BLACKLISTED_TAGS = [
    'style', 'script', 'noscript', 'link', 'meta', 'img', 'aside'
];
/**
 * The name of the custom data attribute used to link a DOM element to its
 * corresponding DOMElementInfo object.
 */
export const DATA_IBGIB_EXT_ID_ATTR_NAME = 'data-ibgibext-id';


/**
 * Builds a simplified, serializable tree structure (DOMElementInfo) from a live
 * DOM element and its descendants.
 *
 * As it builds the tree, it "stamps" each real DOM element with a unique
 * `data-ibgibext-id` attribute, which contains the `gibId` from the corresponding
 * DOMElementInfo. This allows the sidepanel to easily reference and interact
 * with live page elements.
 *
 * @param element The root HTMLElement to start building the tree from.
 * @returns A promise that resolves to the root DOMElementInfo object of the generated tree, or null if the root element is blacklisted.
 */
export async function buildDomInfoTree(element: HTMLElement): Promise<DOMElementInfo | null> {
    const lc = `[${buildDomInfoTree.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: e01148e84ee31e42d7b7248e2ae8a825)`); }

        const tagName = element.tagName.toLowerCase();

        // If the element's tag is in our blacklist, skip it and its children entirely.
        if (BLACKLISTED_TAGS.includes(tagName)) {
            return null;
        }
        if (element.innerText === '') {
            if (logalot) { console.log(`${lc} tagName (${tagName}) element.innerText === ''. returning null. (I: aedcf81f443fad7d58454098e6e9f825)`); }
            return null;
        }

        let gibId: string | null = element.getAttribute(DATA_IBGIB_EXT_ID_ATTR_NAME);
        if (!gibId) {
            // Stamp the DOM element with a unique ID if it doesn't have one.
            gibId = pickRandom_Letters({ count: 12 });
            element.setAttribute(DATA_IBGIB_EXT_ID_ATTR_NAME, gibId);
        }

        const content: (DOMElementInfo | string)[] = [];

        // Recursively process all child nodes.
        for (const childNode of Array.from(element.childNodes)) {
            if (childNode.nodeType === Node.TEXT_NODE) {
                const text = childNode.textContent;
                if (text) {
                    content.push(text);
                }
            } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                // Await the result of the recursive call for the child element.
                const childInfo = await buildDomInfoTree(childNode as HTMLElement);
                // Only add the child to the content array if it's not null (i.e., not blacklisted).
                if (childInfo) {
                    content.push(childInfo);
                }
            }
            // We are ignoring comment nodes, etc. for now.
        }

        // Collect desired attributes.
        const attributes: { [key: string]: string } = {};
        if (element.id) { attributes['id'] = element.id; }
        if (element.className && typeof element.className === 'string') {
            attributes['class'] = element.className;
        }

        const info: DOMElementInfo = {
            gibId,
            tagName,
            attributes,
            content,
        };

        return info;

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
