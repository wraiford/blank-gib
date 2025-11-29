import { extractErrorMsg, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

import type { AnalysisResult, ConstructRule, TermFrequencyMap } from './types.mjs';
import type { CorpusAnalyzer } from './corpus-analyzer.mjs';
import { DEFAULT_TOKEN_CONSTRUCT_RULE } from './analysis-engine-constants.mjs';

/**
 * Internal representation of a compiled rule, separating the pattern
 * from the flags it requires.
 */
export interface CompiledInfo {
    pattern: string;
    flags: string;
}

/**
 * for this early dev implementation, this is hard-coded. But we absolutely have
 * to get this hooked up with ibgibs in code.
 */
const DEFAULT_ENGINE_CONSTRUCT_RULES: ConstructRule[] = [
    DEFAULT_TOKEN_CONSTRUCT_RULE,
];

/**
 * heart of the text analysis process that creates a slim composable DSL on top
 * of regex in order to extract information, e.g., TF-IDF, out of text.
 *
 * note that this started as a normal TF-IDF engine, but then the "term" was
 * abstracted to "construct" so that not only simple words but, e.g.,
 * grammatical constructs can be extracted and analyzed.
 *
 * ## usage
 *
 * This is consumed in {@link CorpusAnalyzer}
 *
 * ## broad idea with ibgib integration
 *
 * we want to build a text analyzing engine, but not one that has to be extended
 * via code. IOW, we want to avoid requiring code writing and recompilation.
 * Ibgib itself is excellent for "version control", and eventually it will be
 * used to version src code as a shim to how software is created nowadays (it
 * basically is a more generalized, more powerful version of git). But right
 * _now_ we can easily "version control" semantic text entities, and as it
 * happens, the {@link ConstructRule} that underpins this engine is entirely
 * text-based. This is not a coincidence.
 *
 * So we should be able to not only create these patterns on the fly at runtime,
 * but we should be able to expose this pattern creation and management to
 * agents, who can then manage them at runtime, create "tests" that it expects
 * to see, depending on how much you want the agent to process things.
 *
 * The purpose of this is to add analyses to learner's text responses and
 * speech, to clarify the learner's progression in a language - or any
 * text-encodable skill really, since all skills require tactics, strategies,
 * etc. (domain jargon), which can be codified.
 *
 * So an agent should ultimately be able to:
 *
 * * analyze learner's...
 *   * minigames AND
 *   * entire chat history that the agent has access to, i.e., the agent's
 *     context window
 * * create new ConstructRule entries to broaden the analysis as needed
 * * edit ConstructRule entries as needed, depending on how well they perform in
 *   reports according to the agent's opinion
 *
 * Using ibgib's protocol for the storage of these ConstructRule entries means
 * that we should be able to:
 *
 * * share the ibgibs reusing the ibgib protocol plumbing
 * * rel8 rules to create ibgib-stored rulesets
 * * fork/mut8 rules and rulesets
 * * basically do all the cool stuff that we can do with other ibgibs
 */
export class AnalysisEngine {
    private lc: string = `[${AnalysisEngine.name}]`;
    private rules: Map<string, ConstructRule>;
    // A cache for compiled info to avoid re-compiling the same rule repeatedly.
    private compiledInfoCache: Map<string, CompiledInfo>;

    public static readonly PRIMORDIAL_TOKEN_CONSTRUCT_NAME = 'token';
    public static readonly DEFAULT = new AnalysisEngine(DEFAULT_ENGINE_CONSTRUCT_RULES);

    constructor(rules: ConstructRule[]) {
        const lc = `${this.lc}[ctor]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 08cbaa69ce78baea98ac5f68b2cc6825)`); }

            // Use a Map for efficient rule lookup by name.
            this.rules = new Map(rules.map(r => [r.name, r]));
            this.compiledInfoCache = new Map();

            if (!this.rules.has(AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME)) {
                throw new Error(`A construct rule named "token" must be provided.`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * The core recursive compiler. It takes a rule name and returns its
     * compiled pattern and the set of flags it requires.
     */
    private getCompiledInfo({
        name,
        visited = new Set(),
    }: {
        name: string,
        visited?: Set<string> | undefined,
    }): CompiledInfo {
        const lc = `${this.lc}[${this.getCompiledInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2ecd741a862ed095ed01a0f874168625)`); }

            visited ??= new Set();

            // Return from cache if this rule has already been compiled.
            if (this.compiledInfoCache.has(name)) {
                return this.compiledInfoCache.get(name)!;
            }
            if (visited.has(name)) {
                throw new Error(`Circular dependency detected involving: ${name}`);
            }
            visited.add(name);

            const rule = this.rules.get(name);
            if (!rule) { throw new Error(`Rule not found: ${name}`); }

            let pattern = rule.pattern;
            const flagsSet = new Set<string>();

            // STEP 1: Process REGEX(...) definitions first.
            // This extracts the raw regex and collects any specified flags (like 'i').
            pattern = pattern.replace(
                /REGEX\(\/(.*?)\/([a-z]*)\)/g,
                (match, regexBody, regexFlags) => {
                    for (const flag of regexFlags) {
                        flagsSet.add(flag);
                    }
                    return regexBody; // Return just the content of the regex
                }
            );

            // STEP 2: Process [CONSTRUCT:...] definitions.
            // This recursively compiles child rules and merges their flags.
            pattern = pattern.replace(/\[CONSTRUCT:([\w-]+)\]/g, (match, subName) => {
                const childInfo = this.getCompiledInfo({
                    name: subName,
                    visited: new Set(visited),
                });
                for (const flag of childInfo.flags) {
                    flagsSet.add(flag);
                }
                // Use the child's pattern, wrapped in a NON-CAPTURING group `(?:...)`
                return `(?:${childInfo.pattern})`;
            });

            // STEP 3: Extract the content from the '<< ... >>' capture group.
            // This is done *after* all replacements to get the final combined pattern.
            const captureMatch = /<<\s*(.*)\s*>>/.exec(pattern);
            if (captureMatch) {
                pattern = captureMatch[1];
            } else {
                throw new Error(`Rule "${name}" must have a '<< ... >>' capture group.`);
            }

            // STEP 4: Clean up whitespace that acts as a delimiter between constructs.
            pattern = pattern.trim().replace(/\s+/g, `\\s+`);

            const result: CompiledInfo = {
                pattern: pattern,
                flags: Array.from(flagsSet).join('')
            };

            // Cache the result before returning.
            this.compiledInfoCache.set(name, result);
            return result;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public analyze({ text }: { text: string }): AnalysisResult {
        const lc = `${this.lc}[${this.analyze.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 9d9158bc8e18fa22d9ffa8c8be78f825)`); }

            const constructs: { [key: string]: TermFrequencyMap } = {};

            for (const name of this.rules.keys()) {
                try {
                    const compiledInfo = this.getCompiledInfo({ name });

                    // Combine collected flags with the required defaults ('gdu').
                    const finalFlags = Array.from(new Set('gdu' + compiledInfo.flags)).join('');

                    // The final regex is the compiled pattern wrapped in its own CAPTURING group.
                    const finalRegex = new RegExp(`(${compiledInfo.pattern})`, finalFlags);

                    constructs[name] = {};
                    const matches = text.matchAll(finalRegex);

                    for (const match of matches) {
                        // match[1] will be the content of our single, outer capture group.
                        const term = match[1]?.trim();
                        if (term) {
                            const normalizedTerm = term.toLowerCase();
                            constructs[name][normalizedTerm] = (constructs[name][normalizedTerm] || 0) + 1;
                        }
                    }
                } catch (error: any) {
                    console.error(`${lc} Error processing rule "${name}": ${extractErrorMsg(error)}`);

                    // If a rule fails to compile or run, log the error and mark it in the results.
                    console.error(``, error.message);
                    constructs[name] = { 'ERROR: See console for details': 1 };
                }
            }

            const tokenFrequencyMap = constructs[AnalysisEngine.PRIMORDIAL_TOKEN_CONSTRUCT_NAME] || {};
            const tokenCount = Object.values(tokenFrequencyMap).reduce((sum, count) => sum + count, 0);
            const uniqueTokenCount = Object.keys(tokenFrequencyMap).length;

            return {
                characterCount: text.length,
                tokenCount,
                uniqueTokenCount,
                constructs,
            };
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}
