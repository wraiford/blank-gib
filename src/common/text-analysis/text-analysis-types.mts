// /**
//  * @module text-types.mts includes types for analyzing text.
//  */

// import { AnalysisResult } from "./types.mjs";

// /**
//  * An object representing the frequency of each word in a text.
//  * The keys are the unique words, and the values are their counts.
//  * e.g., { "hello": 2, "world": 1 }
//  */
// export interface WordFrequencyMap {
//     [word: string]: number;
// }

// // /**
// //  * The analysis information object returned by the text analysis function.
// //  */
// // export interface TextAnalysisInfo {
// //     /**
// //      * Total number of characters in the original text, including whitespace and
// //      * punctuation.
// //      */
// //     characterCount: number;

// //     /** Total number of words found in the text. */
// //     wordCount: number;

// //     /** The count of unique words after normalization. */
// //     uniqueWordCount: number;

// //     /** A map containing each unique word and its frequency. */
// //     wordFrequency: WordFrequencyMap;
// // }

// // src/types.ts (Additions)

// /**
//  * A map where keys are unique words (terms) across the entire corpus
//  * and values are their Inverse Document Frequency scores.
//  */
// export type IdfMap = Map<string, number>;

// // Let's create a richer document type for our corpus
// export interface CorpusDocument {
//     /** A unique identifier for the document, e.g., an ibgib address. */
//     id: string;
//     /** The original text content. */
//     text: string;
//     /** The analysis result from analyzeText. */
//     analysis: AnalysisResult;
// }
