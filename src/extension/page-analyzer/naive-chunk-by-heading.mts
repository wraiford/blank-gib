// import { pickRandom_Letters } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { SemanticChunkInfo } from './page-analyzer-types.mjs';

// const logalot = true;
// const lc = `[naive-chunk-by-heading.mts]`;
// const MAX_CHUNK_SIZE = 2000;

// // #region Local Interfaces

// /**
//  * Defines the shape of the chunks created in-memory during the initial
//  * content parsing, before they are finalized and assigned a gibId.
//  */
// interface InMemoryChunk {
//     elements: Element[];
//     text: string;
//     title: string;
//     tags: string[];
// }

// // #endregion

// /**
//  * Chunks the content of a given HTML element based on heading tags (h1-h6).
//  *
//  * It iterates through paragraph, list item, and other text-bearing elements,
//  * grouping them into chunks. Each time a heading tag is encountered, it flushes
//  * the preceding text into a chunk and uses the heading's content as the title
//  * for the *next* chunk.
//  *
//  * @param bestCandidateEl The HTML element identified as the main content container.
//  * @returns An array of structured {@link SemanticChunkInfo} objects representing the chunks.
//  */
// export function naiveChunkByHeading(bestCandidateEl: HTMLElement): SemanticChunkInfo[] {
//     const lcFunc = `${lc}[naiveChunkByHeading]`;
//     if (logalot) { console.log(`${lcFunc} starting...`); }

//     // PHASE 1: IDENTIFY CHUNKS (IN-MEMORY)
//     const inMemoryChunks: InMemoryChunk[] = [];
//     let currentChunkElements: Element[] = [];
//     let currentChunkText: string = '';
//     let currentChunkTitle: string = ''; // Holds the title for the *next* chunk of content.

//     const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'blockquote', 'td'];
//     const allContentNodes = Array.from(bestCandidateEl.querySelectorAll(selectors.join(',')));

//     function flushInMemoryChunk() {
//         const trimmedText = currentChunkText.trim();
//         if (currentChunkElements.length === 0 || trimmedText.length < 1) {
//             // Reset and abort if there's nothing to flush.
//             currentChunkElements = [];
//             currentChunkText = '';
//             return;
//         }

//         // Use the captured heading title, or generate one if this chunk had no preceding heading.
//         let titleToUse = currentChunkTitle;
//         if (!titleToUse) {
//             const sentenceEndMatch = trimmedText.match(/[^.!?]*[.!?]/);
//             titleToUse = sentenceEndMatch ? sentenceEndMatch[0] : (trimmedText.substring(0, 80) + (trimmedText.length > 80 ? '...' : ''));
//         }

//         const tags = currentChunkElements.map(el => el.tagName.toLowerCase());
//         inMemoryChunks.push({ elements: currentChunkElements, text: trimmedText, title: titleToUse, tags });

//         // Reset for the next chunk. Critically, the title is cleared as it has now been "used".
//         currentChunkElements = [];
//         currentChunkText = '';
//         currentChunkTitle = '';
//     }

//     for (const node of allContentNodes) {
//         // Heuristic to avoid double-counting text from nested elements (e.g., a <p> inside a <td>)
//         let isNested = false;
//         let parent = node.parentElement;
//         while (parent && parent !== bestCandidateEl) {
//             if (allContentNodes.includes(parent)) {
//                 isNested = true;
//                 break;
//             }
//             parent = parent.parentElement;
//         }
//         if (isNested) { continue; }

//         const text = (node as HTMLElement).innerText?.trim();
//         if (!text) { continue; }

//         const isHeading = /^[hH][1-6]$/.test(node.tagName);

//         if (isHeading) {
//             // A new heading signals the end of the previous content block.
//             flushInMemoryChunk();
//             // This heading's text becomes the title for the content that FOLLOWS it.
//             currentChunkTitle = text;
//             // We're done with the heading node itself for now.
//             continue;
//         }

//         // If it's not a heading, it's content. Add it to the current chunk.
//         currentChunkElements.push(node);
//         currentChunkText += text + '\n\n';

//         // If the content chunk gets too large, flush it as-is.
//         if (currentChunkText.length > MAX_CHUNK_SIZE) {
//             flushInMemoryChunk();
//         }
//     }
//     flushInMemoryChunk(); // Flush any final content left over at the end of the article.

//     // PHASE 2: Finalize Chunks and Tag Elements
//     const chunks: SemanticChunkInfo[] = [];
//     for (const chunk of inMemoryChunks) {
//         const gibId = `ibgibext-${pickRandom_Letters({ count: 8 })}`;
//         const { elements, text, title, tags } = chunk;
//         // Tag the actual DOM elements with the generated ID for this chunk.
//         for (const el of elements) {
//             if (el) { (el as HTMLElement).dataset.ibgibextId = gibId; }
//         }
//         chunks.push({ gibId, text, title, tags });
//     }

//     if (logalot) { console.log(`${lcFunc} Final Chunks (${chunks.length}):`, chunks); }

//     return chunks;
// }
