/**
 * Contains structured information about a node that has been identified as a
 * heading.
 */
export interface NodeHeadingInfo {
    /**
     * The calculated score of the heading (e.g., 100 for H1, 90 for H2, etc.).
     */
    headingScore: number;
    /**
     * The extracted and cleaned text of the heading itself.
     */
    headingText?: string;
    /**
     * If the original DOM element contained both the heading and subsequent
     * content (e.g., `<p><strong>Title:</strong> More text.</p>`), this property
     * will contain the "spilled over" text content.
     */
    spilledContent?: string;
}

/**
* Represents a serializable, lightweight "digital twin" of a real DOM element.
 * This is used to pass a snapshot of the page structure from the content script
 * to the sidepanel for interactive chunking.
 */
export interface DOMElementInfo {
    /**
     * A unique identifier (e.g., a hash) that is also stamped onto the actual
     * DOM element via a `data-ibgibext-id` attribute. This creates the link
     * between the virtual representation and the live page.
     */
    gibId: string;

    /**
     * The tag name of the element (e.g., 'p', 'div', 'h1').
     */
    tagName: string;

    /**
     * The content of the element, represented as a mixed array of strings (for
     * text nodes) and nested DOMElementInfo objects (for child elements). This
     * accurately models the structure of the real DOM.
     */
    content: (DOMElementInfo | string)[];

    /**
     * A key-value store for any other HTML attributes we want to preserve,
     * such as `class`, `id`, etc. This could be useful for styling the
     * interactive UI in the sidepanel.
     */
    attributes?: { [key: string]: string };

    /**
     * If this node is determined to be a heading, this will contain the
     * relevant information like its score, clean text, and any "spilled"
     * content that was part of the same DOM element but not part of the
     * heading itself.
     */
    headingInfo?: NodeHeadingInfo;
    /**
     * true if the dom element is the root of our page twin.
     */
    isRoot?: boolean;

    /**
     * probably should be required, but don't want to spend the time on it right now
     */
    href?: string;
}

/**
 * Represents the analysis performed on a single candidate element from the page.
 * It includes the element's score and a lightweight "digital twin" of its DOM structure.
 *
 * !IMPORTANT
 * NOTE: This must be serializable, i.e., no references to DOM elements.
 * !IMPORTANT
 */
export interface AnalyzedElement {
    /**
     * The score assigned to the element based on its content length and other factors.
     */
    score: number;
    /**
     * A tree of DOMElementInfo objects that represents the DOM structure of the
     * analyzed element. This is the "digital twin" sent to the sidepanel.
     */
    domInfoTree: DOMElementInfo;
}

/**
 * The main result of the page analysis. It contains the best candidate element
 * for the main content of the page, as well as a list of all other
 * candidates that were considered.
 *
 * !IMPORTANT
 * NOTE: This must be serializable, i.e., no references to DOM elements.
 * !IMPORTANT
 */
export interface PageContentInfo {
    /**
     * The title of the page, extracted from the `h1` or `title` tags.
     */
    title?: string;
    /**
     * The candidate that scored the highest, most likely representing the
     * main content of the page.
     */
    bestCandidate: AnalyzedElement;
    /**
     * All other candidates that were scored.
     */
    otherCandidates: AnalyzedElement[];
    /**
     * The URL of the page that was analyzed.
     */
    url: string;
}
