import type { AnalysisEngine } from './analysis-engine.mjs';

// src/types.ts (Additions)
export interface ConstructRule {
    name: string;
    description: string;
    pattern: string;
}


// Internal representation of a compiled rule
interface ExecutableConstruct extends ConstructRule {
    // The final, executable RegExp object for this rule
    regex: RegExp;
}

/**
 * A map representing the frequency of each captured term for a given construct.
 * e.g., for a 'german-noun' construct: { "mann": 2, "haus": 1 }
 */
export interface TermFrequencyMap { [term: string]: number; }

/**
 * The primary result object. All analysis, from basic tokens to complex
 * grammatical phrases, is stored in the `constructs` map.
 */
export interface AnalysisResult {
    /** Total number of characters in the original text, including whitespace. */
    characterCount: number;

    /** Total count of all tokens found. A convenience metric derived from the 'token' construct. */
    tokenCount: number;

    /** The count of unique tokens. A convenience metric derived from the 'token' construct. */
    uniqueTokenCount: number;

    /**
     * A map where each key is the name of a construct rule, and the value is
     * a map of the terms found for that construct and their frequencies.
     */
    constructs: {
        [constructName: string]: TermFrequencyMap;
    };
}

// src/types.ts


// --- Core Analysis & Rule Types ---

export interface ConstructRule {
    name: string;
    description: string;
    pattern: string;
}


export interface AnalysisResult {
    characterCount: number;
    tokenCount: number;
    uniqueTokenCount: number;
    constructs: {
        [constructName: string]: TermFrequencyMap;
    };
}

// --- Corpus Analyzer & Report Types ---

/** A map of term to its Inverse Document Frequency score. */
export type IdfMap = Map<string, number>;

/** A structured representation of a significant term or construct within a document. */
export interface Keyword {
    term: string;      // The identified term (e.g., "estoy hablando")
    score: number;     // The final TF-IDF score
    tf: number;        // Term Frequency in the document
    idf: number;       // Inverse Document Frequency across the corpus
    count: number;     // Raw count of the term in the document
}

/** A comprehensive report on the significant terms and constructs for a single document. */
export interface DocumentReport {
    docId: string;
    tokenCount: number;
    uniqueTokenCount: number;
    keywordsByConstruct: {
        [constructName: string]: Keyword[];
    };
}

/** A report that compares the keywords of a target document against a source document. */
export interface ComparisonReport {
    sourceDocId: string;
    targetDocId: string;
    constructName: string; // The construct used for comparison
    // Keywords significant in both documents
    sharedKeywords: Keyword[];
    // Keywords significant in the source but not the target (e.g., learning goals)
    sourceUniqueKeywords: Keyword[];
    // Keywords significant in the target but not the source (e.g., novel usage)
    targetUniqueKeywords: Keyword[];
}
