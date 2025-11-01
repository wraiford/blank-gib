import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
import { AnalysisEngine } from './analysis-engine.mjs';
import type {
    AnalysisResult, DocumentReport, ComparisonReport, IdfMap, Keyword,
    TermFrequencyMap
} from './types.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export class CorpusAnalyzer {
    private lc: string = `[${CorpusAnalyzer.name}]`;
    private engine: AnalysisEngine;
    private documents: Map<string, AnalysisResult>;
    private idfMaps: Map<string, IdfMap>;
    private isIdfCacheStale: boolean;

    /**
     * Initializes the Corpus Analyzer with a pre-configured AnalysisEngine.
     * @param engine The engine that knows how to parse text based on a set of rules.
     */
    constructor(engine: AnalysisEngine) {
        this.engine = engine;
        this.documents = new Map();
        this.idfMaps = new Map();
        this.isIdfCacheStale = true;
    }

    // --- Document Management API ---

    /**
     * [FAST] Adds a pre-analyzed document result to the corpus.
     * Use this when you have a cached/memoized result.
     * @param id A unique identifier for the document.
     * @param result The pre-computed AnalysisResult.
     */
    public addDocumentFromResult({
        id,
        result,
    }: {
        id: string,
        result: AnalysisResult,
    }): void {
        const lc = `${this.lc}[${this.addDocumentFromResult.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 835068262f68ea213d823aeca94a1825)`); }
            this.documents.set(id, result);
            this.isIdfCacheStale = true;
            this.idfMaps.clear();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * [HEAVY] Analyzes raw text using the engine and adds the result to the corpus.
     * Use this when analyzing a document for the first time.
     * @param id A unique identifier for the document.
     * @param text The raw text of the document.
     */
    public addDocumentFromText({ id, text }: { id: string, text: string }): void {
        const lc = `${this.lc}[${this.addDocumentFromText.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 64feb4d14b884465477dba275940c825)`); }
            const result = this.engine.analyze({ text });
            this.addDocumentFromResult({ id, result });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Retrieves the raw, unprocessed analysis result for a given document.
     * @param id The ID of the document.
     * @returns The AnalysisResult object, or undefined if not found.
     */
    public getDocumentAnalysis({ id }: { id: string }): AnalysisResult | undefined {
        return this.documents.get(id);
    }

    // --- Reporting API ---

    /**
     * Generates a detailed report for a single document, calculating TF-IDF scores
     * for significant terms and constructs.
     * @param docId The ID of the document to report on.
     * @param topN The number of top keywords to return for each construct.
     * @param constructsToReport An array of construct names to analyze. Defaults to just the primordial token.
     */
    public generateDocumentReport({
        docId,
        topN = 10,
        constructsToReport = [AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME]
    }: {
        docId: string,
        topN: number,
        constructsToReport: string[],
    }): DocumentReport {
        this.ensureIdfIsFresh(); // Lazy-load IDF cache if needed

        const analysis = this.documents.get(docId);
        if (!analysis) {
            throw new Error(`Document with id "${docId}" not found in corpus.`);
        }

        const keywordsByConstruct: { [key: string]: Keyword[] } = {};

        for (const constructName of constructsToReport) {
            const termFreqMap = analysis.constructs[constructName];
            if (!termFreqMap) continue;

            const totalTermsInConstruct = Object.values(termFreqMap).reduce((s, c) => s + c, 0);
            const idfMap = this.idfMaps.get(constructName) || new Map();
            const keywords: Keyword[] = [];

            for (const [term, count] of Object.entries(termFreqMap)) {
                const tf = totalTermsInConstruct > 0 ? count / totalTermsInConstruct : 0;
                const idf = idfMap.get(term) || Math.log(this.documents.size) + 1; // Default IDF for terms not in other docs

                keywords.push({
                    term,
                    count,
                    tf,
                    idf,
                    score: tf * idf,
                });
            }

            // Sort by score descending and take the top N
            keywordsByConstruct[constructName] = keywords
                .sort((a, b) => b.score - a.score)
                .slice(0, topN);
        }

        return {
            docId,
            tokenCount: analysis.tokenCount,
            uniqueTokenCount: analysis.uniqueTokenCount,
            keywordsByConstruct,
        };
    }

    /**
     * Generates a report comparing a target document against a source document.
     * This is ideal for comparing a learner's response to a prompt.
     * @param sourceDocId The ID of the source/reference document.
     * @param targetDocId The ID of the target/learner document.
     * @param constructName The specific construct to compare (e.g., 'token').
     * @param topN The number of keywords to consider for the comparison.
     */
    public generateComparisonReport({
        sourceDocId,
        targetDocId,
        constructName = AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME,
        topN = 20
    }: {
        sourceDocId: string,
        targetDocId: string,
        constructName: string,
        topN: number,
    }): ComparisonReport {
        const lc = `${this.lc}[${this.generateComparisonReport.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 994218ae04b8f058c88b8e693c2d2825)`); }

            const sourceReport = this.generateDocumentReport({
                docId: sourceDocId,
                topN,
                constructsToReport: [constructName]
            });
            const targetReport = this.generateDocumentReport({
                docId: targetDocId,
                topN,
                constructsToReport: [constructName],
            });

            const sourceKeywords = sourceReport.keywordsByConstruct[constructName] || [];
            const targetKeywords = targetReport.keywordsByConstruct[constructName] || [];

            const sourceTerms = new Set(sourceKeywords.map(k => k.term));
            const targetTerms = new Set(targetKeywords.map(k => k.term));

            const sharedKeywords = sourceKeywords.filter(k => targetTerms.has(k.term));
            const sourceUniqueKeywords = sourceKeywords.filter(k => !targetTerms.has(k.term));
            const targetUniqueKeywords = targetKeywords.filter(k => !sourceTerms.has(k.term));

            return {
                sourceDocId,
                targetDocId,
                constructName,
                sharedKeywords,
                sourceUniqueKeywords,
                targetUniqueKeywords,
            };
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Scans a document's analysis for any found instances of "error" constructs.
     * @param docId The ID of the document to scan.
     * @param errorPrefix The prefix used to name error rules in the engine (e.g., 'error-').
     * @returns An object containing any found error constructs and their terms.
     */
    public findErrorPatterns({
        docId,
        errorPrefix = 'error-'
    }: {
        docId: string,
        errorPrefix: string,
    }): { [errorName: string]: TermFrequencyMap } {
        const lc = `${this.lc}[${this.findErrorPatterns.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 20b84cdc228836b07ee40a68085f4825)`); }

            const analysis = this.documents.get(docId);
            if (!analysis) return {};

            const foundErrors: { [errorName: string]: TermFrequencyMap } = {};
            for (const [constructName, terms] of Object.entries(analysis.constructs)) {
                if (constructName.startsWith(errorPrefix) && Object.keys(terms).length > 0) {
                    foundErrors[constructName] = terms;
                }
            }
            return foundErrors;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // --- Private Helpers ---

    /**
     * [LAZY] Ensures the IDF cache is up-to-date. This is the main corpus-wide
     * calculation, run only when necessary.
     */
    private ensureIdfIsFresh(): void {
        if (!this.isIdfCacheStale) return;

        const docFrequencies: Map<string, Map<string, number>> = new Map();
        const totalDocs = this.documents.size;

        // Stage 1: Count document frequency for each term within each construct.
        for (const analysis of this.documents.values()) {
            for (const [constructName, terms] of Object.entries(analysis.constructs)) {
                if (!docFrequencies.has(constructName)) {
                    docFrequencies.set(constructName, new Map());
                }
                const constructDocFreq = docFrequencies.get(constructName)!;
                for (const term of Object.keys(terms)) {
                    constructDocFreq.set(term, (constructDocFreq.get(term) || 0) + 1);
                }
            }
        }

        // Stage 2: Calculate IDF score for each term.
        this.idfMaps.clear();
        for (const [constructName, termCounts] of docFrequencies.entries()) {
            const idfMap: IdfMap = new Map();
            for (const [term, count] of termCounts.entries()) {
                const idf = Math.log(totalDocs / count) + 1; // Smoothed IDF
                idfMap.set(term, idf);
            }
            this.idfMaps.set(constructName, idfMap);
        }

        this.isIdfCacheStale = false;
    }
}
