import { clone, extractErrorMsg, pickRandom_Letters, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import {
    HEADING_SCORE_H1, HEADING_SCORE_H2, HEADING_SCORE_H3, HEADING_SCORE_H4,
    HEADING_SCORE_H5, HEADING_SCORE_H6,
    MIN_TEXT_LENGTH_TO_CHUNK,
    TAGNAMES_UPPERCASE_COLLAPSE_BLACKLIST,
    TAGNAMES_UPPERCASE_UNWRAP_BLACKLIST,
} from "./page-analyzer-constants.mjs";
import { DOMElementInfo, NodeHeadingInfo } from "./page-analyzer-types.mjs";

const logalot = true;

export async function getSummarizerMaxChunkSize(): Promise<number> {
    const lc = `[${getSummarizerMaxChunkSize.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: da28dda705e4f1ec63d5d3d89ce4f825)`); }
        return 2000;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Recursively removes child nodes that are empty or only contain whitespace.
 * This is a crucial data cleaning step to handle junk text nodes.
 */
function cleanDomTreeRecursive(node: DOMElementInfo): DOMElementInfo {
    if (!node.content) { return node; }

    node.content = node.content.filter(child => {
        if (typeof child === 'string') {
            return child.trim() !== '';
        }
        return true; // Keep all DOMElementInfo objects for now
    }).map(child => {
        if (typeof child !== 'string') {
            // Recurse on element children to clean them
            return cleanDomTreeRecursive(child);
        }
        return child; // The string has already been validated
    });

    return node;
}

export function getNodeTextContent(nodeInfo: DOMElementInfo | string): string {
    if (typeof nodeInfo === 'string') { return nodeInfo.trim(); }
    if (!nodeInfo) { return ''; }
    const headingText = nodeInfo.headingInfo?.headingText ?? '';
    const spilledContent = nodeInfo.headingInfo?.spilledContent ?? '';
    const intrinsicText = nodeInfo.content.map(child => getNodeTextContent(child)).join('\n\n').replace(/\s+/g, ' ');
    const text = spilledContent ?
        [headingText, spilledContent, intrinsicText,].join('\n') :
        [headingText, intrinsicText,].join('\n');
    return text;
}

export function getNodeTextContent_keepspaces(nodeInfo: DOMElementInfo | string): string {
    if (typeof nodeInfo === 'string') { return nodeInfo.trim(); }
    if (!nodeInfo) { return ''; }
    const headingText = nodeInfo.headingInfo?.headingText ?? '';
    const spilledContent = nodeInfo.headingInfo?.spilledContent ?? '';
    const intrinsicText = nodeInfo.content.map(child => getNodeTextContent(child)).join('\n\n');
    const text = spilledContent ?
        [headingText, spilledContent, intrinsicText,].join('\n') :
        [headingText, intrinsicText,].join('\n');
    return text;
}

function _isTitleCase(text: string): boolean {
    if (!text) { return false; }
    if (text.toUpperCase() === text && text.length > 1) { return false; }
    const words = text.split(' ').filter(w => w.length > 0);
    if (words.length === 0) { return false; }
    const capitalizedWords = words.filter(word => word[0] && word[0] === word[0].toUpperCase()).length;
    return (capitalizedWords / words.length) >= 0.5;
}

/**
 * return all direct children in `content` with upperCase tagName of 'P'
 */
export function getChildParagraphs(nodeInfo: DOMElementInfo): DOMElementInfo[] {
    return nodeInfo.content.filter(x =>
        typeof x !== 'string' && x.tagName?.toUpperCase() === 'P'
    ) as DOMElementInfo[];
}

function isDivWithOneHeadingAndOthersOnlyParagraphs(nodeInfo: DOMElementInfo): boolean {
    const lc = `[${isDivWithOneHeadingAndOthersOnlyParagraphs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d8b018cfe7d8ea5a78556f78b3715925)`); }

        if (nodeInfo.content.length < 2) { return false; /* <<<< returns early */ }

        if (nodeInfo.tagName.toUpperCase() !== 'DIV') { return false; /* <<<< returns early */ }

        const firstChild = nodeInfo.content.at(0)!;
        if (typeof firstChild === 'string') { return false; /* <<<< returns early */ }

        const firstChildIsHeading = !!firstChild.tagName.toUpperCase().match(/^H[1-6]$/i);
        if (!firstChildIsHeading) { return false; /* <<<< returns early */ }

        const remainingChildren = nodeInfo.content.slice(1);
        const remainingAreParagraphs =
            remainingChildren.every(x => typeof x !== 'string' && x.tagName?.toUpperCase() === 'P');

        return remainingAreParagraphs;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * needs to be changed eventually to a more robust OOP approach. interface with
 * predicates, return undefined if not applicable, etc. The strategy, e.g.
 * "wikipedia" or "markdown", should be there as well. Something to reign in
 * this ever-expanding type of function.
 *
 * for now, it's just inlined.
 */
export function getHeadingInfo(nodeInfo: DOMElementInfo): NodeHeadingInfo {
    const lc = `[${getHeadingInfo.name}]`;
    try {
        let score = 0;
        if (!nodeInfo) { throw new Error(`(UNEXPECTED) nodeInfo falsy? (E: 8e3a28cfc288452038157315f16d9825)`); }

        if (typeof nodeInfo.content === 'string') {
            if (logalot) { console.log(`${lc} nodeInfo (${nodeInfo.gibId}) content is a string. not a heading. (I: b41374c8cc0af84115206887550c2825)`); }
            return { headingScore: 0 };
        }

        let headingText: string | undefined = undefined;
        let spilledContent: string | undefined = undefined;

        const tagNameUpper = nodeInfo.tagName.toUpperCase();
        const scoringLog: string[] = [];

        if (tagNameUpper.match(/^H[1-6]$/i)) {
            // 1. Simple in that it's straight up a heading tag
            switch (tagNameUpper) {
                case 'H1':
                    score += HEADING_SCORE_H1;
                    if (logalot) scoringLog.push('H1 tag -> 100');
                    break;
                case 'H2': score += HEADING_SCORE_H2;
                    if (logalot) scoringLog.push('H2 tag -> 90');
                    break;
                case 'H3': score += HEADING_SCORE_H3;
                    if (logalot) scoringLog.push('H3 tag -> 80');
                    break;
                case 'H4': score += HEADING_SCORE_H4;
                    if (logalot) scoringLog.push('H4 tag -> 70');
                    break;
                case 'H5': score += HEADING_SCORE_H5;
                    if (logalot) scoringLog.push('H5 tag -> 60');
                    break;
                case 'H6': score += HEADING_SCORE_H6;
                    if (logalot) scoringLog.push('H6 tag -> 50');
                    break;
                default:
                    throw new Error(`(UNEXPECTED) all h tags in regexp are covered? tagNameUpper: ${tagNameUpper} (E: bcc8195fc848696798220f68584d8825)`);
            }
            // headingText = nodeInfo.content.filter(x => typeof x === 'string').join(' ').trim();
            headingText = getNodeTextContent_keepspaces(nodeInfo).trim();
        } else if (nodeInfo.content &&
            tagNameUpper === 'DIV' &&
            nodeInfo.content.length === 2 &&
            typeof nodeInfo.content[0] === 'object' &&
            nodeInfo.content[0].tagName?.match(/^H[1-6]$/i) &&
            typeof nodeInfo.content[1] === 'object' &&
            nodeInfo.content[1].tagName?.toUpperCase() === 'SPAN'
        ) {
            // 2. Wikipedia-style headings: <div> <hN> <span> </div>
            const hTag = nodeInfo.content[0] as DOMElementInfo;
            const hChildInfo = getHeadingInfo(hTag);
            if (hChildInfo.headingScore > 0) {
                score += hChildInfo.headingScore;
                headingText = hChildInfo.headingText!;
                if (logalot) scoringLog.push(`Wikipedia-style H-child -> +${hChildInfo}`);
            } else {
                if (logalot) {
                    const emsg = `Wikipedia-style but hChildScore less than 0?`;
                    console.log(`${lc} ${emsg} (I: c0bc28d6dd285087bb451caf69211d25)`);
                    scoringLog.push(emsg);
                }
            }
        } else if (isDivWithOneHeadingAndOthersOnlyParagraphs(nodeInfo)) {
            // treat the div itself as a heading? unwrap somehow?
            // for now, we'll try returning the heading's heading info itself
            /** start with the inner heading as the headingInfo */
            const innerHeadingInfo = getHeadingInfo(nodeInfo.content[0] as DOMElementInfo);
            score = innerHeadingInfo.headingScore;
            headingText = innerHeadingInfo.headingText;
            if (!headingText) {
                console.error(`${lc} (UNEXPECTED) div with one heading and multi p tags has no headingText? Using substring of text, but this is unexpected. (E: 8cc2e8b230d8b6f1b8331b34a9ac0825)`);
                headingText = getNodeTextContent_keepspaces(nodeInfo).substring(0, 32);
            }
            spilledContent =
                getChildParagraphs(nodeInfo).map(p => getNodeTextContent_keepspaces(p)).join('\n\n');
        } else if (tagNameUpper === 'DIV' &&
            nodeInfo.content.length >= 2 &&
            nodeInfo.content.every(x => typeof x === 'object' && x.tagName?.toUpperCase() === 'P')
        ) {
            // div containing only child paragraphs, so this div is a
            // pseudo-heading. No way to know what type of heading though, so
            // we'll just do the lowest for now, and consider the child
            // paragraphs as spilled content.
            score = HEADING_SCORE_H6;
            headingText = nodeInfo.content.find(x => typeof x === 'string')?.trim();
            if (!headingText) {
                headingText =
                    getNodeTextContent_keepspaces(nodeInfo.content.at(0)! as DOMElementInfo);
            }
            // shorten it just in case
            headingText = headingText.substring(0, 32);
            const paragraphs = getChildParagraphs(nodeInfo);
            spilledContent = paragraphs.map(p => getNodeTextContent_keepspaces(p)).join('\n\n');
        } else if (tagNameUpper === 'P') {
            // debugger; // examine the p tag in hackathon at runtime
            // 3. Hackathon-style headings in <p> tags
            let strongChild: DOMElementInfo | undefined;
            let textToAnalyze: string = '';
            const firstChild = nodeInfo.content?.[0];
            if (typeof firstChild === 'object' && firstChild.tagName) {
                if (firstChild.tagName.toUpperCase() === 'SPAN') {
                    const grandChild = firstChild.content?.[0];
                    if (typeof grandChild === 'object' && grandChild.tagName?.toUpperCase() === 'STRONG') {
                        strongChild = grandChild;
                        score += 45; if (logalot) scoringLog.push('P>SPAN>STRONG structure -> +45');
                    }
                } else if (firstChild.tagName.toUpperCase() === 'STRONG') {
                    strongChild = firstChild;
                }
            }

            if (strongChild) {
                score += 45; if (logalot) scoringLog.push('P>STRONG structure -> +45');
                textToAnalyze = getNodeTextContent(strongChild).trim();
                headingText = textToAnalyze;

                const emChild = strongChild.content?.at(0);
                if (typeof emChild === 'object' && emChild.tagName?.toUpperCase() === 'EM') {
                    score += 15; if (logalot) scoringLog.push('P>STRONG>EM structure -> +15');
                    textToAnalyze = getNodeTextContent(emChild).trim();
                    headingText = textToAnalyze;
                }

                if (textToAnalyze) {
                    if (textToAnalyze.toUpperCase() === textToAnalyze && textToAnalyze.length > 3) {
                        score += 25; if (logalot) scoringLog.push(`ALL CAPS bonus -> +25`);
                    }
                    if (/^\d+\.\s+/.test(textToAnalyze)) {
                        score += 35; if (logalot) scoringLog.push(`Numbered list bonus -> +35`);
                    }
                    if (_isTitleCase(textToAnalyze)) {
                        score += 15; if (logalot) scoringLog.push(`Title Case bonus -> +15`);
                    }
                    if (textToAnalyze.endsWith(':')) {
                        score += 5; if (logalot) scoringLog.push(`Ends with colon bonus -> +5`);
                    }
                }

                // Check for a text node immediately following the heading-containing element (the <strong> or <span>).
                const potentialSpillNode = nodeInfo.content?.[1];
                if (typeof potentialSpillNode === 'string' && potentialSpillNode.trim() !== '') {
                    spilledContent = potentialSpillNode.trim();
                    if (logalot) scoringLog.push(`Found spilled content: \"${spilledContent.substring(0, 15)}...\"`);
                }
            }
        } else {
            scoringLog.push(`No scoring for this node?`);
        }

        let finalScore = 0;
        if (score >= 100) { finalScore = 100; }
        else if (score >= 90) { finalScore = 90; }
        else if (score >= 80) { finalScore = 80; }
        else if (score >= 70) { finalScore = 70; }
        else if (score >= 60) { finalScore = 60; }
        else if (score >= 50) { finalScore = 50; }

        if (logalot) {
            const nodeText = getNodeTextContent(nodeInfo);
            console.log(`${lc} Node <${tagNameUpper}> (text: "${nodeText.substring(0, 20)}..."): Final Score: ${finalScore} (Raw: ${score}). Log: ${scoringLog.join(' | ')}`)
        }

        return { headingScore: finalScore, headingText, spilledContent };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        return { headingScore: 0 };
    }
}

// function flattenDomTree(rootNode: DOMElementInfo): (DOMElementInfo | string)[] {
//     const flatList: (DOMElementInfo | string)[] = [];
//     const recurse = (node: DOMElementInfo | string) => {
//         flatList.push(node);
//         if (typeof node !== 'string' && node.content) {
//             for (const child of node.content) { recurse(child); }
//         }
//     };
//     recurse(rootNode);
//     return flatList;
// }

/**
 *
 * @param element
 * @returns
 */
function chunkIfElementIsSpecialCase(element: DOMElementInfo): DOMElementInfo | undefined {
    const lc = `[${chunkIfElementIsSpecialCase.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 0ca338c5a298671d680a605895ad1e25)`); }

        const tagName = element.tagName.toUpperCase();
        if (tagName === 'TABLE' || tagName === 'UL' || tagName === 'OL') {
            const newElement = clone(element);
            let childrenToChunk = newElement.content;
            if (tagName === 'TABLE') {
                const tbody = newElement.content.find((c: any) => typeof c === 'object' && c.tagName === 'tbody') as DOMElementInfo | undefined;
                if (tbody) { childrenToChunk = tbody.content; }
            }
            const childTag = tagName === 'TABLE' ? 'TR' : 'LI';
            newElement.content = childrenToChunk
                .filter((c: any) => typeof c === 'object' && c.tagName?.toUpperCase() === childTag);
            return newElement;
        } else if (tagName === 'LI' || tagName === 'TR') {
            return element;
        } else {
            return undefined;
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

function createSemanticChunks(nodes: (DOMElementInfo | string)[]): (DOMElementInfo | string)[] {
    const lc = `[${createSemanticChunks.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 3f3ea803c3a7f5cd58ec8d488814c625)`); }

        if (!nodes || nodes.length === 0) { return []; }

        // first make sure all of our nodes have heading scores
        const elementNodes = nodes.filter(n => typeof n !== 'string') as DOMElementInfo[];

        // edge case?
        if (elementNodes.length === 0) {
            // debugger; // all string nodes...is this common, rare? Common. very common
            // if (logalot) { console.log(`${lc} all string nodes...is this common, rare? (I: 14005896c668d3bd757c439857e47825)`); }
            const newChunk: DOMElementInfo = {
                tagName: 'chunk',
                gibId: 'ibgib',
                headingInfo: { headingScore: 0 },
                content: nodes.concat(),
            };
            return [newChunk]; /* <<<< returns early */
        } else {
            // guaranteed to have some elements
            if (logalot) { console.log(`${lc} elementNodes.length: ${elementNodes.length} (I: 5d3bb8d5b6b89724dee27448ffb98825)`); }
        }

        let maxHeadingScore = 0;
        elementNodes.forEach(x => {
            x.headingInfo ??= getHeadingInfo(x);
            if (x.headingInfo.headingScore > maxHeadingScore) {
                maxHeadingScore = x.headingInfo.headingScore;
            }
        });

        if (maxHeadingScore === 0) {
            // max score of 0 means we have no headings, so treat all of the
            // nodes as one semantic chunk whose content is the amalgamation of
            // each individual node semantically chunked. The intent here is to
            // attempt to address wikipedia nodes...we'll see...

            /**
             * iterate through node.content recursively (if applicable) and set
             * node.content to this chunked version
             */
            let semanticallyChunkedContent: (DOMElementInfo | string)[] = [];
            for (let node of nodes) {
                if (typeof node === 'string') {
                    semanticallyChunkedContent.push(node);
                } else {
                    const specialNode = chunkIfElementIsSpecialCase(node);
                    if (specialNode) {
                        semanticallyChunkedContent.push(specialNode);
                    } else {

                        if (node.content.length > 0) {
                            const newChunk: DOMElementInfo = {
                                tagName: 'chunk',
                                gibId: node.gibId,
                                headingInfo: node.headingInfo,
                                content: [...createSemanticChunks(node.content)],
                            };
                            semanticallyChunkedContent.push(newChunk);
                        } else {
                            semanticallyChunkedContent.push(node);
                        }
                    }
                }
            }
            const newChunk: DOMElementInfo = {
                tagName: 'chunk',
                // gibId: `chunk-${headingNode.gibId || pickRandom_Letters({ count: 5 })}`,
                gibId: elementNodes[0].gibId, // point to the first one for scrolling
                headingInfo: { headingScore: 0 },
                content: semanticallyChunkedContent,
            };
            return [newChunk];
            // if (nodes.length === 1 && typeof nodes[0] !== 'string') {
            //     return createSemanticChunks(nodes[0].content || []); /* <<<< returns early */
            // } else {
            //     if (logalot) { console.log(`${lc} maxHeadingScore === 0, so there are no heading nodes to semantically chunk. returning incoming nodes unchanged. (I: 4cb39faf00083b2d1260a2589e0a1825)`); }
            //     return nodes; /* <<<< returns early */
            // }
        }

        const result: (DOMElementInfo | string)[] = [];

        /** get the indices of the max headings */
        const splitIndices: number[] = [];
        nodes.forEach((node, index) => {
            if (typeof node !== 'string' && !node.headingInfo) { throw new Error(`(UNEXPECTED) node.headingInfo falsy? non-string nodes should have the heading info created by this point? (E: dba68b7a20587e2954f3d13851b52825)`); }
            if (typeof node !== 'string' && node.headingInfo!.headingScore === maxHeadingScore) {
                splitIndices.push(index);
            }
        });

        // if we don't start with the max heading, then we have a "preamble": an
        // array of nodes that are under the heading of the entire document. so
        // group those together as their own semantic chunk.
        if (splitIndices[0] > 0) {
            const preambleNodes = nodes.slice(0, splitIndices[0]);
            const firstPreambleNode = preambleNodes.filter(x => typeof x !== 'string').at(0);
            let gibId: string;
            if (firstPreambleNode) {
                gibId = firstPreambleNode.gibId;
            } else {
                // they're all just string nodes, so hmm...
                // debugger; // all nodes are strings...i want to see if/when this hits in creating semantic chunks
                gibId = 'ibgib'; // not particularly true (implies we'll scroll to very top of document), but we'll fix this later if this even ever hits
            }
            const preambleSemanticChunks = createSemanticChunks(preambleNodes);
            result.push({
                gibId,
                content: preambleSemanticChunks,
                tagName: 'preamble',
                headingInfo: { headingScore: 0 },
            });
        }


        for (let i = 0; i < splitIndices.length; i++) {
            const startIndex = splitIndices[i];
            const headingNode = nodes[startIndex] as DOMElementInfo;
            if (!headingNode.headingInfo) { throw new Error(`(UNEXPECTED) headingNode.headingInfo falsy? (E: 3732782eb828186988b686beeefe5825)`); }
            // if (!headingNode.headingInfo.headingText) { throw new Error(`(UNEXPECTED) headingNode.headingInfo.headingText falsy? (E: 34731473f68881d8982d375ceffc7825)`); }
            const endIndex = (i + 1 < splitIndices.length) ? splitIndices[i + 1] : nodes.length;
            /** nodes sans heading node */
            const contentNodes = nodes.slice(startIndex + 1, endIndex);
            const subContent = createSemanticChunks(contentNodes);
            const newChunk: DOMElementInfo = {
                tagName: 'chunk',
                // gibId: `chunk-${headingNode.gibId || pickRandom_Letters({ count: 5 })}`,
                gibId: headingNode.gibId,
                // headingInfo: { headingScore: maxHeadingScore },
                // content: [headingNode, ...createSemanticChunks(contentNodes)],
                content: subContent,
                headingInfo: headingNode.headingInfo,
                // headingText: headingNode.headingInfo?.headingText, // _getNodeTextContent(headingNode),
            };
            result.push(newChunk);
        }
        return result;

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

function unwrapSingleChildNodes(node: DOMElementInfo): DOMElementInfo {
    // Base case: If content is not an array or is empty, we can't unwrap.
    if (!Array.isArray(node.content) || node.content.length === 0) {
        return node;
    }

    if (TAGNAMES_UPPERCASE_UNWRAP_BLACKLIST.includes(node.tagName.toUpperCase())) {
        // node is a DOMElementInfo but on the blacklist
        return node;
    }

    // Recursive step: First, process all children of the current node.
    node.content = node.content.map(child => {
        if (typeof child === 'string') {
            return child; // Strings are left as-is.
        } else {
            return unwrapSingleChildNodes(child); // Recurse on element children.
        }
    });

    // Main Unwrap Logic: Check if the current node should be unwrapped.
    if (node.content.length === 1 && typeof node.content[0] !== 'string') {
        // This node has a single child that is an element. Unwrap it.
        const singleChild = node.content[0] as DOMElementInfo;

        // Preserve the parent's gibId and headingText, as they are more representative
        // of the original semantic block before unwrapping.
        singleChild.gibId = node.gibId;
        if (node.headingInfo) {
            singleChild.headingInfo = node.headingInfo;
        }

        // Return the child, effectively replacing the parent.
        return singleChild;
    }

    // If we're here, the node was not unwrapped, so return it as is.
    return node;
}

/**
 * Traverses a DOM info tree and if a node's total text content is less than
 * MIN_TEXT_LENGTH_TO_CHUNK, it replaces its complex `content` array with a
 * single string of its flattened text. This prevents over-chunking small items.
 *
 * NOTE: This is a post-order traversal. It processes children before their parents.
 */
function collapseSmallNodesRecursive(node: DOMElementInfo | string): DOMElementInfo | string {
    if (!node || typeof node === 'string') {
        return node;
    }

    if (TAGNAMES_UPPERCASE_COLLAPSE_BLACKLIST.includes(node.tagName.toUpperCase())) {
        return node;
    }

    // A node is a heading if it has a positive heading score.
    const { headingInfo } = node;

    const isHeading = headingInfo &&
        (
            (headingInfo?.headingScore ?? 0) > 0 ||
            !!headingInfo?.headingText
        );

    // For non-heading nodes, if the content is just a single string, we can
    // collapse the node itself and just return the string. We skip this for
    // headings to preserve their structure and metadata.
    if (!isHeading && node.content.length === 1 && typeof node.content[0] === 'string') {
        return node.content[0]; /* <<<< returns early */
    }

    // Recurse on all children to collapse them first.
    const processedContent =
        node.content.map(child => collapseSmallNodesRecursive(child));
    node.content = processedContent.filter(x => {
        if (typeof x === 'string' && x.trim() === '') {
            return false; // Remove empty or whitespace-only strings
        } else {
            return true;
        }
    });

    // Now, check if the *current* node should have its content flattened.
    const textContent = getNodeTextContent_keepspaces(node);

    // We only flatten the node's content if it's NOT a heading AND its text
    // content is below our minimum chunking threshold.
    if (!isHeading && textContent.length > 0 && textContent.length < MIN_TEXT_LENGTH_TO_CHUNK) {
        // The node's content is small. Flatten its entire content array
        // into a single string entry.
        node.content = [textContent];
    }

    return node;
}



export function autoChunkByHeadings(domInfoTree: DOMElementInfo): DOMElementInfo {
    const lc = `[${autoChunkByHeadings.name}]`;
    if (!domInfoTree) { throw new Error(`${lc} domInfoTree is required.`); }

    // 1. Sanitize the entire tree by removing empty/whitespace-only text nodes.
    const cleanedDomInfoTree = cleanDomTreeRecursive(JSON.parse(JSON.stringify(domInfoTree)));

    // debugger; // start the walk through of autochunk

    // i think flattening is the wrong approach
    // 2. Flatten the tree to get a single list of all nodes in document order.
    // const allNodes = flattenDomTree(cleanedDomInfoTree);
    const allNodes = cleanedDomInfoTree.content;

    // 3. We pass all nodes *except* the root node itself to the recursive chunker.
    // the first node seems to be a copy of all of the others? of course I'm not
    // flattening now so who knows
    // if (logalot) { console.log(`${lc} allNodes.at(0): ${pretty(allNodes.at(0))} (I: 6d59987e573855e508d3b0187107f825)`); }
    // const contentNodes = allNodes.slice(1);
    // if (logalot) { console.log(`${lc} contentNodes after slice: ${pretty(allNodes)} (I: 99f5896718df0e56ef1c8c68cd5c5825)`); }
    const contentNodes = allNodes;

    const firstPassContent = createSemanticChunks(contentNodes);
    const firstPassChunkedRoot: DOMElementInfo = {
        tagName: 'body',
        gibId: 'ibgib',
        headingInfo: { headingScore: 110 },
        content: firstPassContent,
    };

    const unwrappedChunkedRoot = unwrapSingleChildNodes(firstPassChunkedRoot);

    const collapsedChunkedRoot = collapseSmallNodesRecursive(unwrappedChunkedRoot);

    // hack to get the first child to always scroll to the top
    if (typeof collapsedChunkedRoot === 'string') {
        // does this ever hit?
        console.warn(`${lc} does this ever hit? we collapse down to a single text string? (W: genuuid)`)

        return {
            tagName: 'root',
            gibId: 'ibgib',
            headingInfo: { headingScore: 0 },
            content: [collapsedChunkedRoot],
        };
    } else {
        const firstChild = collapsedChunkedRoot.content.at(0);
        if (firstChild && typeof firstChild !== 'string') {
            firstChild.gibId = 'ibgib';
        }
        return collapsedChunkedRoot;
    }
}
