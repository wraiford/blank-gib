
import { hash } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { SemanticChunkInfo } from './page-analyzer-types.mjs';

const logalot = true;
const lc = `[semantic-chunker.mts]`;

// The threshold at which an element's score is considered a heading.
const HEADING_SCORE_THRESHOLD = 30;
// The maximum character length for a single chunk before it's broken down further.
const MAX_CHUNK_CHAR_LENGTH = 2000;


/**
 * Calculates a "heading score" for a given element to determine if it should be
 * treated as a semantic heading for chunking purposes.
 *
 * @returns A score where a higher number indicates a higher likelihood of being a heading.
 *
 * ## intent
 *
 * some pages do not use conventional headings, rather, they use some sort of
 * manual semantic headings. this is an attempt at providing a likelihood that
 * such an element is a heading.
 *
 * For example, if the following is found:
 *
 * <p><strong>1. TOPIC YO</strong>: here is some things some paragraph</p>
 * <p><string>Sub-topic here</strong> and here is some more text as a sub-topic...</p>
 * <p><string>Sub-topic here as well</strong> and here is some more text as a sub-topic...</p>
 * <p>maybe just another paragraph</p>
 * <p><strong>2. TOPIC TWO YO</strong>: here is some things some paragraph</p>
 * <p><string>Another sub-topic here</strong> and here is some more text as a sub-topic...</p>
 *
 * Some of these are actually headings or parts of them include headings and
 * this is a specific use case this function should be handling.
 */
function getHeadingScore(el: HTMLElement): number {
    if (!el?.tagName) { return 0; }

    let score = 0;
    const text = el.innerText?.trim() ?? '';
    if (!text) { return 0; }

    const tagName = el.tagName.toLowerCase();

    // Assign base scores for traditional heading tags.
    switch (tagName) {
        case 'h1': score += 50; break;
        case 'h2': score += 45; break;
        case 'h3': score += 40; break;
        case 'h4': score += 35; break;
        case 'h5': score += 30; break;
        case 'h6': score += 25; break;
    }

    // Strong signal: A <p> tag that contains ONLY a <strong> tag with a numbered format.
    // This is common in legal documents or rules.
    const hasSingleStrongChild = el.children.length === 1 && el.children[0].tagName.toLowerCase() === 'strong';
    if (tagName === 'p' && hasSingleStrongChild) {
        const strongText = (el.children[0] as HTMLElement).innerText?.trim() ?? '';
        if (/^\d+\.\s/.test(strongText)) {
            score += 50; // Very strong signal
        }
    }

    // Another strong signal: Text is all uppercase (and of reasonable length).
    if (text.length > 5 && text.length < 100 && text === text.toUpperCase()) {
        score += 40;
    }

    // Moderate signal: Element contains a <strong> tag.
    if (el.querySelector('strong')) {
        score += 15;
    }

    // Negative signal: Text is too long to be a heading.
    if (text.length > 150) {
        score -= 20;
    }

    // Negative signal: Contains significant text OUTSIDE of its children,
    // indicating it's a paragraph with some bolding, not a heading.
    const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        .map(n => n.textContent!.trim())
        .join(' ');
    if (directText.length > 30) {
        score -= 15;
    }

    return score;
}

/**
 * Recursively builds a tree of SemanticChunkInfo nodes from a list of DOM nodes.
 *
 * This function works by iterating through a list of sibling nodes.
 * - If it finds a "heading" (based on getHeadingScore), it creates a new chunk.
 * - It then groups all subsequent siblings under that heading until it finds another
 *   heading of the same or higher importance.
 * - It calls itself recursively on the collected group of child nodes.
 * - If it encounters simple content nodes, it groups them into a single "content" chunk.
 * - If a content chunk exceeds MAX_CHUNK_CHAR_LENGTH, it recursively breaks it down.
 */
// async function buildSemanticTree(nodes: NodeList): Promise<SemanticChunkInfo[]> {
//     const chunks: SemanticChunkInfo[] = [];
async function buildSemanticTree(nodes: NodeList): Promise<any[]> {
    const chunks: any[] = [];
    let currentContentNodes: HTMLElement[] = [];

    // Helper to process and flush the collected content nodes into a chunk
    const flushContentChunk = async () => {
        if (currentContentNodes.length === 0) { return; }

        const text = currentContentNodes.map(n => n.innerText?.trim()).join('\n\n');

        if (text.trim()) {
            if (text.length > MAX_CHUNK_CHAR_LENGTH) {
                // If the combined text is too long, don't create one big chunk.
                // Instead, recursively call buildSemanticTree on the children of each node in the group.
                // This will "zoom in" and apply the same logic to the smaller pieces.
                if (logalot) { console.log(`[semantic-chunker] Content chunk is too large (${text.length} > ${MAX_CHUNK_CHAR_LENGTH}). Recursively breaking it down.`); }
                for (const node of currentContentNodes) {
                    const subChunks = await buildSemanticTree(node.childNodes);
                    chunks.push(...subChunks);
                }
            } else {
                // The chunk is a reasonable size, create it as a single unit.
                chunks.push({
                    gibId: await hash({ s: text }),
                    text: text,
                    tags: currentContentNodes.map(n => n.tagName.toLowerCase()),
                });
            }
        }
        currentContentNodes = [];
    };

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nodeType !== Node.ELEMENT_NODE) { continue; } // Skip text/comment nodes

        const el = node as HTMLElement;
        const score = getHeadingScore(el);

        if (score >= HEADING_SCORE_THRESHOLD) {
            // Found a heading. First, flush any preceding content.
            await flushContentChunk();

            // This is the new heading chunk.
            const title = el.innerText.trim();
            // const headingChunk: SemanticChunkInfo = {
            const headingChunk: any = {
                gibId: await hash({ s: title }),
                title: title,
                text: '', // Will be populated by children
                tags: [el.tagName.toLowerCase()],
                children: [],
            };

            // Collect all subsequent nodes that belong to this new heading section.
            const childNodesForHeading: Node[] = [];
            let j = i + 1;
            for (; j < nodes.length; j++) {
                const nextNode = nodes[j];
                if (nextNode.nodeType === Node.ELEMENT_NODE) {
                    const nextEl = nextNode as HTMLElement;
                    const nextScore = getHeadingScore(nextEl);
                    if (nextScore >= score) {
                        break; // Found another heading of same or greater importance.
                    }
                }
                childNodesForHeading.push(nextNode);
            }

            // Recursively build the tree for the collected child nodes.
            headingChunk.children = await buildSemanticTree(childNodesForHeading as any);

            // The parent's text is a concatenation of its children's text.
            headingChunk.text = headingChunk.children
                .map(c => c.title ? `${c.title}\n${c.text}` : c.text)
                .join('\n\n');

            chunks.push(headingChunk);

            // Advance the outer loop past the nodes we just processed.
            i = j - 1;

        } else {
            // This node is not a heading.
            // If this element itself is very large, flush what we have and then process it.
            // This prevents a small paragraph from being grouped with a massive div that follows it.
            const elText = el.innerText?.trim();
            if (elText && elText.length > MAX_CHUNK_CHAR_LENGTH) {
                await flushContentChunk(); // Flush anything before this large element
                currentContentNodes.push(el);
                await flushContentChunk(); // Immediately process the large element (which will trigger recursion)
            } else {
                // Add it to the list of simple content nodes to be grouped.
                currentContentNodes.push(el);
            }
        }
    }

    // Flush any remaining content at the very end.
    await flushContentChunk();

    return chunks;
}


/**
 * Creates a semantic tree structure from the provided HTML element by analyzing
 * its content for "semantic headings" based on styling and structure cues,
 * not just h1-h6 tags.
 *
 * This builds a full, granular tree of the document's structure.
 *
 * @returns A promise that resolves to the root-level array of SemanticChunkInfo nodes.
 */
// export async function semanticChunker(bestCandidateEl: HTMLElement): Promise<SemanticChunkInfo[]> {
export async function semanticChunker(bestCandidateEl: HTMLElement): Promise<any[]> {
    const lcChunker = `${lc}[semanticChunker]`;
    if (logalot) { console.log(`${lcChunker} starting...`); }

    if (!bestCandidateEl) {
        if (logalot) { console.warn(`${lcChunker} bestCandidateEl is falsy, returning empty array.`); }
        return [];
    }

    const tree = await buildSemanticTree(bestCandidateEl.childNodes);

    if (logalot) {
        console.log(`${lcChunker} complete. Built tree:`);
        console.dir(tree);
    }

    return tree;
}
