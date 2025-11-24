import { extractErrorMsg, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { firstOfAll, ifWe, ifWeMight, iReckon, lastOfAll, respecfully, respecfullyDear } from '@ibgib/helper-gib/dist/respec-gib/respec-gib.mjs';
const maam = `[${import.meta.url}]`, sir = maam;

import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

import type { AnalysisResult, ConstructRule, } from './types.mjs';
import { AnalysisEngine, } from './analysis-engine.mjs';
import {
    DEFAULT_GERMAN_RULES, DEFAULT_ITALIAN_RULES, DEFAULT_KOINEGREEK_RULES,
    DEFAULT_SPANISH_RULES, DEFAULT_TOKEN_CONSTRUCT_RULE,
} from './analysis-engine-constants.mjs';

export interface RuleTestRun {
    id: string;
    text: string;
    /**
     * just eyeball the results with this first, then capture result and put in {@link expectedResult}
     */
    expectedSketch: any,
    /**
     * generate this from actual test runs after the sketch looks good. used for
     * regression.
     */
    expectedResult?: AnalysisResult;
}
export interface TextAnalysisTestGroup {
    name: string;
    rules: ConstructRule[];
    runs: { [id: string]: RuleTestRun };
}

// debugger; // analysis engine walk through and look at log

// #region German
const germanTestGroup: TextAnalysisTestGroup = {
    name: 'German',
    rules: DEFAULT_GERMAN_RULES,
    runs: {
        basic: {
            id: 'basic',
            text: 'Ich fahre mit dem Auto nach Hause. Er kommt von der Arbeit zu mir.',
            expectedSketch: {
                "token": { "ich": 1, "fahre": 1, "mit": 1, "dem": 1, "auto": 1, "nach": 1, "hause": 1, "er": 1, "kommt": 1, "von": 1, "der": 1, "arbeit": 1, "zu": 1, "mir": 1 },
                "german-dative-preposition": { "mit": 1, "nach": 1, "von": 1, "zu": 1 },
                "german-noun": { "ich": 1, "auto": 1, "hause": 1, "er": 1, "arbeit": 1 },
                "german-dative-phrase": {
                    "mit dem auto": 1,
                    "nach hause": 1,
                    "von der arbeit": 1
                }
            },
        },
        separable: {
            id: 'separable',
            text: 'Ich rufe dich an. Steh bitte auf! Wir gehen aus.',
            expectedSketch: {
                "token": { "ich": 1, "rufe": 1, "dich": 1, "an": 1, "steh": 1, "bitte": 1, "auf": 1, "wir": 1, "gehen": 1, "aus": 1 },
                "german-separable-verb-end": {
                    "an": 1,
                    "auf": 1,
                    "aus": 1
                }
            },
        },
    }
}
// #endregion German

// #region Italian
const italianTestGroup: TextAnalysisTestGroup = {
    name: 'Italian',
    rules: DEFAULT_ITALIAN_RULES,
    runs: {
        basic: {
            id: 'basic',
            text: 'La luce del sole è più forte della luna. Vado al mercato degli agricoltori.',
            expectedSketch: {
                "token": { "la": 1, "luce": 1, "del": 1, "sole": 1, "è": 1, "più": 1, "forte": 1, "della": 1, "luna": 1, "vado": 1, "al": 1, "mercato": 1, "degli": 1, "agricoltori": 1 },
                "italian-articulated-preposition": {
                    "del": 1,
                    "della": 1,
                    "al": 1,
                    "degli": 1
                }
            },
        },
        enclitics: {
            id: 'enclitics',
            text: 'Devo parlarti. Puoi dirglielo? Voglio vederla subito. È difficile farlo.',
            expectedSketch: {
                "token": { "devo": 1, "parlarti": 1, "puoi": 1, "dirglielo": 1, "voglio": 1, "vederla": 1, "subito": 1, "è": 1, "difficile": 1, "farlo": 1 },
                "italian-verb-clitic": {
                    "parlarti": 1,
                    "dirglielo": 1,
                    "vederla": 1,
                    "farlo": 1
                }
            }
        },
    }
}
// #endregion Italian

// #region Spanish
const spanishTestGroup: TextAnalysisTestGroup = {
    name: 'Spanish',
    rules: DEFAULT_SPANISH_RULES,
    runs: {
        basic: {
            id: 'basic',
            text: 'Estoy hablando contigo. Él está comiendo. Estamos aprendiendo mucho.',
            expectedSketch: {
                "token": { "estoy": 1, "hablando": 1, "contigo": 1, "él": 1, "está": 1, "comiendo": 1, "estamos": 1, "aprendiendo": 1, "mucho": 1 },
                "spanish-estar-conjugation": { "estoy": 1, "está": 1, "estamos": 1 },
                "spanish-gerund": { "hablando": 1, "comiendo": 1, "aprendiendo": 1 },
                "spanish-present-progressive": {
                    "estoy hablando": 1,
                    "está comiendo": 1,
                    "estamos aprendiendo": 1
                }
            }
        }
    },
}
// #endregion Spanish

// #region Koine Greek
const koingGreekTestGroup: TextAnalysisTestGroup = {
    name: 'Koine Greek',
    rules: DEFAULT_KOINEGREEK_RULES,
    runs: {
        basic: {
            id: 'basic',
            text: 'ἡ ἀγάπη τοῦ θεοῦ ἐν ἡμῖν.',
            expectedSketch: {
                "token": { "ἡ": 1, "ἀγάπη": 1, "τοῦ": 1, "θεοῦ": 1, "ἐν": 1, "ἡμῖν": 1 },
                "greek-genitive-article": { "τοῦ": 1 },
                "greek-genitive-noun-ending": { "τοῦ": 1, "θεοῦ": 1 },
                "greek-genitive-phrase": {
                    "τοῦ θεοῦ": 1
                }
            },
        },
        enDative: {
            id: 'enDative',
            text: 'ἐν τῷ οἴκῳ μου.',
            expectedSketch: {
                "token": { "ἐν": 1, "τῷ": 1, "οἴκῳ": 1, "μου": 1 },
                "greek-preposition-en": { "ἐν": 1 },
                "greek-dative-ending": { "τῷ": 1, "οἴκῳ": 1 },
                "greek-en-dative-phrase": {
                    "ἐν τῷ": 1,
                    "ἐν οἴκῳ": 1
                }
            },
        }
    }
}
// #endregion Koine Greek

const tests: TextAnalysisTestGroup[] = [
    germanTestGroup,
    italianTestGroup,
    spanishTestGroup,
    koingGreekTestGroup,
]

for (const test of tests) {
    await respecfully(sir, `default rules: ${test.name}`, async () => {
        // debugger; // clear console log before next test
        console.log(`test STARTING: ${test.name}`);
        const engine = new AnalysisEngine([
            DEFAULT_TOKEN_CONSTRUCT_RULE,
            // nounRule, phraseRule
            ...test.rules,
        ]);

        for (const run of Object.values(test.runs)) {
            await ifWe(sir, `${run.id}: ${run.text.substring(0, 10)}...`, async () => {
                console.log(`run.text STARTING: ${run.text}`);
                console.log('EXPECTED SKETCH:');
                console.log(pretty(run.expectedSketch));

                const result = engine.analyze({ text: run.text });
                iReckon(sir, result).asTo('result').isGonnaBeTruthy();

                console.log('ACTUAL RESULT:');
                console.log(pretty(result));
                // todo: add more AnalysisEngine reckonings here

                console.log(`run.text COMPLETE: ${run.text}`);
            });

        }

        console.log(`test COMPLETE: ${test.name}`);
        // debugger; // copy results
    });
}
