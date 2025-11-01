// import { TextAnalysisInfo, WordFrequencyMap } from "./text-analysis-types.mjs";

// /**
//  * Analyzes a given text to provide statistics like character count, word count,
//  * unique words, and word frequency.
//  *
//  * This function is designed to work with multiple languages by using Unicode
//  * property escapes and handles intra-word apostrophes (e.g., "don't", "c'est").
//  *
//  * @param text The input string to analyze.
//  * @returns An object containing the analysis results.
//  */
// // export function analyzeText(text: string): TextAnalysisResult {
// //   // ... (edge case handling remains the same)
// //   if (!text || text.trim() === '') {
// //     return {
// //       characterCount: text?.length || 0,
// //       wordCount: 0,
// //       uniqueWordCount: 0,
// //       wordFrequency: {},
// //     };
// //   }

// //   const characterCount = text.length;

// //   // UPDATED REGEX: Handles intra-word apostrophes for contractions, etc.
// //   // It matches a letter, followed by zero or more groups of an apostrophe and letters.
// //   const wordRegex = /\p{L}+(?:'\p{L}+)*/gu;

// //   const words = text.match(wordRegex)?.map(word => word.toLowerCase()) || [];

// //   const wordCount = words.length;
// //   const wordFrequency: WordFrequencyMap = {};

// //   for (const word of words) {
// //     wordFrequency[word] = (wordFrequency[word] || 0) + 1;
// //   }

// //   const uniqueWordCount = Object.keys(wordFrequency).length;

// //   return {
// //     characterCount,
// //     wordCount,
// //     uniqueWordCount,
// //     wordFrequency,
// //   };
// // }

// export function analyzeText(text: string): TextAnalysisInfo {
//     if (!text || text.trim() === '') {
//         return {
//             characterCount: text?.length || 0,
//             wordCount: 0,
//             uniqueWordCount: 0,
//             wordFrequency: {},
//         };
//     }

//     const characterCount = text.length;

//     // FINAL REGEX: Matches words with internal apostrophes and hyphens.
//     // It requires words to start and end with a letter, but allows separators
//     // like ' and - in the middle.
//     const wordRegex = /\p{L}+(?:['\-]\p{L}+)*/gu;

//     const words = (text.match(wordRegex) ?? [])
//         .filter(word => !word.startsWith('http'))
//         .map(word => word.toLowerCase()) || [];

//     const wordCount = words.length;
//     const wordFrequency: WordFrequencyMap = {};

//     for (const word of words) {
//         wordFrequency[word] = (wordFrequency[word] || 0) + 1;
//     }

//     const uniqueWordCount = Object.keys(wordFrequency).length;

//     return {
//         characterCount,
//         wordCount,
//         uniqueWordCount,
//         wordFrequency,
//     };
// }

// // --- Example with complex words ---
// const complexText = "This state-of-the-art analyzer handles rock'n'roll and names like O'Malley. It won't match a trailing hyphen-";
// const complexAnalysis = analyzeText(complexText);

// console.log('--- Complex Analysis ---');
// console.log(complexAnalysis.wordFrequency);
// /*
// --- Complex Analysis ---
// {
//   this: 1,
//   'state-of-the-art': 1,
//   analyzer: 1,
//   handles: 1,
//   "rock'n'roll": 1,
//   and: 1,
//   names: 1,
//   like: 1,
//   "o'malley": 1,
//   it: 1,
//   "won't": 1,
//   match: 1,
//   a: 1,
//   trailing: 1,
//   hyphen: 1  // Notice 'hyphen-' was correctly tokenized as just 'hyphen'
// }

// // --- Example Usage with Contractions ---
// const contractionText = "It's a beautiful day, don't you think? C'est la vie.";
// const contractionAnalysis = analyzeText(contractionText);
// console.log("--- Contraction Analysis ---");
// console.log(contractionAnalysis);
// /*
// --- Contraction Analysis ---
// {
//   characterCount: 52,
//   wordCount: 9,
//   uniqueWordCount: 9,
//   wordFrequency: {
//     "it's": 1,
//     a: 1,
//     beautiful: 1,
//     day: 1,
//     "don't": 1,
//     you: 1,
//     think: 1,
//     "c'est": 1,
//     la: 1,
//     vie: 1
//   }
// }
// */
