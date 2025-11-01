import { extractErrorMsg, getTimestampInTicks, getUUID, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { PARAM_INFO_OUTPUT_PATH } from "@ibgib/helper-gib/dist/rcli/rcli-constants.mjs";
import { RCLIArgInfo, RCLIArgType, RCLIParamInfo, } from "@ibgib/helper-gib/dist/rcli/rcli-types.mjs";
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { isComment } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { ExpectPathType, } from './blank-canvas-types.mjs';
import { DEFAULT_COMMAND_ESCAPE_STRING } from './blank-canvas-constants.mjs';
import { stripQuotes } from './blank-canvas-helper.mjs';
import { ID_PRIMARY_AGENT_CHAT_LOG } from '../../../ui/shell/shell-constants.mjs';
// import {
//     RCLI_DEFAULT_COMMAND_ESCAPE_STRING, RCLI_MAX_ESCAPE_STRING_LENGTH,
//     PARAM_INFO_INIT, PARAM_INFO_IN_MEMORY,
//     PARAM_INFO_SPACE_ID, PARAM_INFO_SPACE_NAME,
//     DEFAULT_PROMPT_TEMPLATE,
//     RCLI_DEFAULT_OUTPUT_PATH,
//     PARAM_INFO_SRC_ADDR,
//     DEFAULT_LOCAL_USER_SPACE_VAR,
//     PARAM_INFO_OUTER_SPACE_ID,
//     PARAM_INFO_OUTER_SPACE_NAME,
// } from "./rcli-constants.mjs";


/**
 * used in verbose logging
 */
const logalot = GLOBAL_LOG_A_LOT;


/**
 * helper that checks a given `relOrAbsPath` against expectations per
 * `expectType`.
 *
 * @returns true if path points to something as given with `expectType`, else false.
 */
export function pathIsAsExpected({
    relOrAbsPath,
    expectType,
    throwIfNotExpected,
    warnIfNotExpected,
    mkdirIfNotExist,
}: {
    /**
     * path to check
     */
    relOrAbsPath: string,
    /**
     * expectations about path. is it a file, is it a folder, does it exist, is it undefined
     */
    expectType: ExpectPathType,
    /**
     * side effect on if does not meet expectation
     */
    throwIfNotExpected?: boolean,
    /**
     * side effect on if does not meet expectation
     */
    warnIfNotExpected?: boolean,
    /**
     * if true and expectType is directory, then this will mkdir before deciding if expected.
     */
    mkdirIfNotExist?: boolean,
}): boolean {
    const lc = `[${pathIsAsExpected.name}]`;
    try {
        throw new Error(`not implemented (E: cc4361fe749f73bb068030247e15ea24)`);
        // if (logalot) { console.log(`${lc} starting... (I: e20eb5de572d0d0a68b3b182dbcc4624)`); }

        // const stat = statSync(relOrAbsPath, { throwIfNoEntry: false });
        // if (stat === undefined) {
        //     if (expectType === undefined) {
        //         // good, it's as expected
        //         return true; /* <<<< returns early */
        //     } else {
        //         if (expectType === 'directory' && mkdirIfNotExist) {
        //             mkdirSync(relOrAbsPath);
        //             const statTryAgain = statSync(relOrAbsPath, { throwIfNoEntry: false });
        //             if (statTryAgain?.isDirectory()) {
        //                 return true; /* <<<< returns early */
        //             }
        //         }
        //         // no existing file or folder of this path? A relOrAbsPath should
        //         const emsg = `relOrAbsPath not found. relOrAbsPath was expected as ${expectType}. initialize relOrAbsPath before proceeding. relOrAbsPath from args: ${relOrAbsPath}`;
        //         if (throwIfNotExpected) {
        //             throw new Error(`${emsg} (E: 4ab864c77045c025017a2e829045b424)`);
        //         } else if (warnIfNotExpected) {
        //             console.warn(`${lc} ${emsg} (W: 616009ed5b0d63cf6b78389ec60c8a24)`);
        //         }
        //         return false; /* <<<< returns early */
        //     }
        // } else if (expectType === 'exists') {
        //     // good, it's as expected
        //     return true; /* <<<< returns early */
        // } else if (stat.isFile()) {
        //     if (expectType === 'file') {
        //         // good, it's as expected
        //         return true; /* <<<< returns early */
        //     } else {
        //         const emsg = `relOrAbsPath found pointed to a file. relOrAbsPath was expected as ${expectType}. initialize relOrAbsPath before proceeding. relOrAbsPath from args: ${relOrAbsPath}`;
        //         if (throwIfNotExpected) {
        //             throw new Error(`${emsg} (E: 9fb8c885cd4ecaee0bf8a43eea8e3424)`);
        //         } else if (warnIfNotExpected) {
        //             console.warn(`${lc} ${emsg} (W: 398385b626adc55f2c0a7928ca9b3e24)`);
        //         }
        //         return false; /* <<<< returns early */
        //     }
        // } else if (stat.isDirectory()) {
        //     if (expectType === 'directory') {
        //         // good, it's as expected
        //         return true; /* <<<< returns early */
        //     } else if (expectType === 'empty-directory') {
        //         // it's a directory, but we need to ensure there are no children
        //         const children = readdirSync(relOrAbsPath);
        //         return children.length === 0; /* <<<< returns early */
        //     } else {
        //         const emsg = `relOrAbsPath found pointed to a directory. relOrAbsPath was expected as ${expectType}. initialize relOrAbsPath before proceeding. relOrAbsPath from args: ${relOrAbsPath}`;
        //         if (throwIfNotExpected) {
        //             throw new Error(`${emsg} (E: 2532ecc8c6d363e27a4e890361a03d24)`);
        //         } else if (warnIfNotExpected) {
        //             console.warn(`${lc} ${emsg} (W: 4141696d491aa585aeb2d03693f22d24)`);
        //         }
        //         return false; /* <<<< returns early */
        //     }
        // } else {
        //     throw new Error(`(UNEXPECTED) unknown stat from statSync call? (E: 3e64675d739e41b56c00a2763439f424)`);
        // }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * atow this is for an output file
 */
export async function extractArg_outputPath({
    argInfos,
    doIfExists = 'throw',
    createUniqueSubdirIfExists,
    defaultPathIfNotFound,
    throwIfNotFound,
}: {
    argInfos: RCLIArgInfo<RCLIArgType>[],
    doIfExists: 'warn' | 'throw' | 'nada',
    createUniqueSubdirIfExists: boolean,
    defaultPathIfNotFound?: string,
    throwIfNotFound?: boolean,
}): Promise<string> {
    const lc = `[${extractArg_outputPath.name}]`;
    try {
        throw new Error(`not implemented (E: 32382e33b56e2f7c361ed8cf182e8d24)`);
        // if (logalot) { console.log(`${lc} starting... (I: 24506dca24df15046ef27ce11ce32b24)`); }

        // let relOrAbsPath: string;
        // if (argInfos.some(x => x.name === PARAM_INFO_OUTPUT_PATH.name)) {
        //     const argInfo = argInfos.filter(x => x.name === PARAM_INFO_OUTPUT_PATH.name)[0];
        //     if (!argInfo.value) {
        //         throw new Error(`(UNEXPECTED) output path arg found but value is falsy? (E: f18f86120133830cfa91f0cfba87fa24)`);
        //     }
        //     relOrAbsPath = argInfo.value! as string;
        // } else if (throwIfNotFound) {
        //     throw new Error(`output path is required. PARAM_INFO_OUTPUT_PATH: ${pretty(PARAM_INFO_OUTPUT_PATH)} (E: 279f7700cc922add449f0a73edf2f624)`);
        // } else {
        //     defaultPathIfNotFound ??= RCLI_DEFAULT_OUTPUT_PATH;
        //     if (defaultPathIfNotFound) {
        //         // only warn if we're initializing without specifying the path explicitly.
        //         if (argInfos.some(x => x.name === PARAM_INFO_INIT.name)) {
        //             console.warn(`no output path arg provided. using default path: ${defaultPathIfNotFound} (E: 874f0d53f1bfd25e979e132d9eb95b24)`);
        //         }
        //     } else {
        //         console.warn(`no output path arg provided and defaultPathIfNotFound is empty string. (E: c32d6277382f65136eb9b5d6fec4c324)`);
        //     }
        //     relOrAbsPath = defaultPathIfNotFound;
        // }

        // const stat = statSync(relOrAbsPath, { throwIfNoEntry: false });
        // if (stat === undefined) {
        //     // no existing file or folder of this path, so we're good
        // } else {
        //     switch (doIfExists) {
        //         case 'warn':
        //             if (createUniqueSubdirIfExists) {
        //                 console.warn(`${lc}[WARNING] output path already exists. creating unique sub-directory. (W: c7ed5b7ef3cf8c559a36d91dada94224)`);
        //             } else {
        //                 console.warn(`${lc}[WARNING] output path already exists. (W: b979d4fa0f98c1c61615097d77d3bc24)`);
        //             }
        //             break;
        //         case 'throw':
        //             throw new Error(`data output path already exists. (E: 568ec79cb7b224f8663948363ac02f24`);
        //         case 'nada':
        //             if (logalot) { console.log(`${lc} doIfExists === 'nada' (I: 639d4e477b5b4511dcf3b5cffa4a4d24)`); }
        //             break;
        //         default:
        //             throw new Error(`(UNEXPECTED) unknown value for doIfExists: ${doIfExists}? (E: 67bcd5ef4aff1c638463ce6daf24f424)`);
        //     }
        //     const getSubdirName = async () => {
        //         return getTimestampInTicks() + (await getUUID()).slice(0, 6);
        //     }
        //     if (stat.isFile()) {
        //         if (createUniqueSubdirIfExists) {
        //             // create subdir in relOrAbsPath but use the same filename
        //             const subdirName = await getSubdirName();
        //             const filenameWithExt = pathUtils.basename(relOrAbsPath);
        //             const pathWithoutFilename = pathUtils.parse(relOrAbsPath).dir;
        //             relOrAbsPath = pathUtils.join(pathWithoutFilename, subdirName, filenameWithExt);
        //         } else {
        //             // relOrAbsPath already set to existing file but create unique
        //             // dir didn't happen, so overwrite
        //             throw new Error(`overwriting existing outputPath file ain't happening yet (E: 1e072594b24c7324992fb48f3f6a9224)`);
        //         }
        //     } else if (stat.isDirectory()) {
        //         if (createUniqueSubdirIfExists) {
        //             const subdirName = await getSubdirName();
        //             relOrAbsPath = pathUtils.join(relOrAbsPath, subdirName);
        //         } else {
        //             // relOrAbsPath already set to existing dir
        //         }
        //     }
        // }

        // // add file extension only if we're encrypting and it isn't already there
        // // const isEncrypt = argInfos.some(x => x.name === PARAM_INFO_ENCRYPT.name);
        // // if (isEncrypt && !relOrAbsPath.endsWith(ENCRYPTED_OUTPUT_FILE_EXT)) {
        // //     console.log(`${lc} adding file extension .${ENCRYPTED_OUTPUT_FILE_EXT}`);
        // //     relOrAbsPath += (relOrAbsPath.endsWith('.') ? ENCRYPTED_OUTPUT_FILE_EXT : `.${ENCRYPTED_OUTPUT_FILE_EXT}`);
        // // }

        // return relOrAbsPath;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}


/**
 * In blank-gib (@ibgib/blank-gib am I making this a package?), this is in the
 * rcli-comment helper. in this hack of a port from rcli (@ibgib/ibgib), i'm
 * just shoving this here.
 *
 * @returns true if it finds the expected contract of a request comment, else false.
 */
export function isRequestComment({ ibGib }: { ibGib: IbGib_V1 }): boolean {
    const lc = `[${isRequestComment.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 2c2b47ce3b58a60594af650475b5b124)`); }

        if (!isComment({ ibGib })) { return false; /* <<<< returns early */ }

        let { data } = ibGib;
        if (!data) { return false; /* <<<< returns early */ }

        // let castedData = data as RCLICommentData_V1;
        let castedData = data as any;
        if ((castedData.args ?? []).length === 0) {
            return false; /* <<<< returns early */
        }

        if ((castedData.interpretedArgInfos ?? []).length === 0) {
            return false; /* <<<< returns early */
        }

        return true;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export function parseCommandRawTextIntoArgs({
    rawText,
    validCommandIdentifiers,
    logErrors = false,
}: {
    rawText: string,
    validCommandIdentifiers: string[],
    logErrors?: boolean,
}): {
    /**
     * true if the incoming `rawText` was a valid args string, i.e., represented
     * something a user should type into a command line.
     */
    validArgsString: boolean,
    /**
     * firstArg should be a command.
     */
    cmd_ie_firstArgSansPrefix?: string,
    /**
     * hopefully a recreation of what would get passed to process.vargs
     */
    args?: string[],
    validationErrorMsg?: string,
} {
    const lc = `[${parseCommandRawTextIntoArgs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 21f7a3bba0e4c339abcaa7bb7b62cf24)`); }

        if (rawText === '') { throw new Error(`rawText is empty string (E: 89ce8662adc84e5cc1620538e0c7a324)`); }

        /**
         * we will mutate this, splicing off/combining as we go from the first arg
         */
        const mutatingNaiveSpaceDelimited = rawText.split(' ');

        // first do the first arg, which must be a valid command identifier with
        // either a command prefix or a regular arg prefix
        const doubleDashPrefix = '--';
        const commandPrefix = DEFAULT_COMMAND_ESCAPE_STRING;
        const rawFirstArg = mutatingNaiveSpaceDelimited.splice(0, 1)[0];
        /**
         * first arg must be the command
         */
        let cmd_ie_firstArgSansPrefix: string;
        if (rawFirstArg.startsWith(commandPrefix)) {
            cmd_ie_firstArgSansPrefix = rawFirstArg.substring(commandPrefix.length);
        } else if (rawFirstArg.startsWith(doubleDashPrefix)) {
            cmd_ie_firstArgSansPrefix = rawFirstArg.substring(doubleDashPrefix.length);
        } else {
            throw new Error(`first arg must be a command without spaces that starts with either the command prefix (${commandPrefix}) or regular arg prefix (${doubleDashPrefix}) (E: 77a878c3c6a9c413238eb75c55e7d424)`);
        }

        if (!validCommandIdentifiers.includes(cmd_ie_firstArgSansPrefix)) {
            throw new Error(`first arg (${cmd_ie_firstArgSansPrefix}) must be a valid command. validCommandIdentifiers: ${validCommandIdentifiers} (E: b1a14dac1b0665860c8234a5fc752f24)`);
        }

        // if we have nothing left, then we have a bare command and we're done
        if (mutatingNaiveSpaceDelimited.length === 0) {
            return {
                validArgsString: true,
                cmd_ie_firstArgSansPrefix,
                args: [`--${cmd_ie_firstArgSansPrefix}`], // args always contains double-dash
            }; /* <<<< returns early */
        }

        // we have at least one additional arg
        /**
         * once we have a double-dash arg (not the command), we cannot have a bare arg.
         */
        let doubleDashFound = false;
        // const resArgs: string[] = [rawFirstArg.startsWith(doubleDashPrefix) ? rawFirstArg : `--${rawFirstArg}`]; // args always contains double-dash
        const resArgs: string[] = [`--${cmd_ie_firstArgSansPrefix}`]; // args always contains double-dash
        let tmpArgWhileBuilding: string = '';
        for (let i = 0; i < mutatingNaiveSpaceDelimited.length; i++) {
            const textPiece = mutatingNaiveSpaceDelimited[i];
            if (textPiece.startsWith(doubleDashPrefix)) {
                doubleDashFound = true;
                if (textPiece === doubleDashPrefix) { throw new Error(`invalid rawText. textPiece is just -- with no additional text, which is invalid. flags should be --my-flag (no spaces) and args with values should be like --key=value or --key="value here" or --key='value here' (E: 8a7962b6f8c3e120cad8f192e1ae6f24)`); }
                if (tmpArgWhileBuilding.length > 0) {
                    // we have been building an arg and have hit a new argPrefix
                    // which means our previous building is done so flush it to
                    // the remainderArgs. this is guaranteed not to be a
                    // quote-surrounded value because that is flushed elsewhere.
                    // (so we don't need to strip the quotes at this point)
                    resArgs.push(tmpArgWhileBuilding.concat());
                    tmpArgWhileBuilding = '';
                }
                if (textPiece.includes('=')) {
                    // --identifier=value
                    // --identifier='value
                    // --identifier="value
                    // --identifier="value"
                    // --identifier='value'
                    if (textPiece.endsWith('"') || textPiece.endsWith("'")) {
                        // --identifier="value"
                        // --identifier='value'
                        resArgs.push(stripQuotes(textPiece.concat()));
                        tmpArgWhileBuilding = '';
                    } else {
                        // --identifier=value
                        // --identifier='value
                        // --identifier="value
                        tmpArgWhileBuilding = textPiece.concat();
                    }
                } else {
                    // flag arg needs no more processing, e.g., --my-flag
                    tmpArgWhileBuilding = textPiece.concat();
                }
            } else if (textPiece.startsWith("'") || textPiece.startsWith('"')) {
                if (doubleDashFound) { throw new Error(`invalid (edge case?) rawText. textPiece starts with a quote to indicate a bare arg, but bare args can only come immediately after the command. IOW You can't have a --key=value arg and then a bare arg. (E: b01dd628b299fbad42047064957df424)`); }
                if (textPiece.endsWith("'") || textPiece.endsWith('"')) {
                    // starts and ends with quote, so we have an unnecessarily quoted value
                    if (tmpArgWhileBuilding) {
                        throw new Error(`invalid (edge case?) rawText. testPiece starts and ends with quote which is only expected if we were doing a bare arg immediately after the cmd. but tmpArgWhileBuilding is truthy, which means we have a weird quote edge case. (E: 4972edcf2c4ab1fbf63e954136d52224)`);
                    } else {
                        resArgs.push(stripQuotes(textPiece.concat()));
                    }
                } else {
                    // start of single or double quote entry
                    if (tmpArgWhileBuilding) {
                        // we have already started a tmp arg meaning found one with a quote and now we have another one started...so throw
                        throw new Error(`invalid (edge case?) rawText. While parsing the  (E: e281aed3e9e91ff8882e9647c166fb24)`);
                    } else {
                        // start of a tmp
                        tmpArgWhileBuilding = textPiece.concat();
                    }
                }
            } else if (textPiece.endsWith("'") || textPiece.endsWith('"')) {
                if (textPiece.length === 1) {
                    // textPiece is only a quote
                    throw new Error(`invalid (edge case?) rawText. textPiece is only a single or double quote. does the text inside the quotes end in a space? (E: 2a4134a410852ec762055f35e3a49524)`);
                }
                // end of single or double quote entry with guaranteed text of at least length 1
                if (tmpArgWhileBuilding) {

                    // complete tmp arg
                    tmpArgWhileBuilding += ` ${textPiece}`; // add the space + textPiece

                    // at this point, tmpArgWhileBuilding has completed a quoted
                    // segment. but this might be a bare arg or a name=value arg
                    // and we need to strip the quotes

                    if (tmpArgWhileBuilding.includes('=')) {
                        if (logalot) { console.log(`${lc} key=value arg closed with quotes (I: 2398c644afd78c833fba2274a4ef1424)`); }
                        const subPieces = tmpArgWhileBuilding.split('=');
                        if (subPieces.length !== 2) { throw new Error(`textPiece has more than one equals sign? (=) (E: 333acd4130763e7c09ea57285bf55d24)`); }
                        let [left, right] = subPieces;
                        if (!right.startsWith('"') && !right.startsWith("'")) { throw new Error(`we had a close quote in a --key=value arg but the value did not start with a quote? (E: 1cbdf326c56566a497b4dedb329e5624)`); }
                        tmpArgWhileBuilding = `${left}=${stripQuotes(right)}`;
                    } else {
                        if (logalot) { console.log(`${lc} bare arg closed with quotes (I: 602aeba88cc3631ebc79b5fe796f7824)`); }
                        if (!tmpArgWhileBuilding.startsWith('"') && !tmpArgWhileBuilding.startsWith("'")) { throw new Error(`we had a close quote in a bare arg but the bare arg did not start with a quote? (E: 5a8e2e8dbe36736d1c586b8c9c7e8e24)`); }
                        tmpArgWhileBuilding = stripQuotes(tmpArgWhileBuilding);
                    }

                    // now tmp arg is stripped of quotes if applicable
                    resArgs.push(tmpArgWhileBuilding.concat());
                    tmpArgWhileBuilding = '';
                } else {
                    // textPiece ends with quote but tmp hasn't started?
                    throw new Error(`invalid (edge case?) rawText. textPiece ends with quote but there wasn't a starting quote? quotes should only be used to entirely surround options (E: 4b6b4408a8538c561be7309e2f783524)`);
                }
            } else {
                // could be adding to bare arg, could be adding to double-dash arg
                if (tmpArgWhileBuilding.startsWith(doubleDashPrefix)) {
                    // verify that we're quoting the kv value
                    if (tmpArgWhileBuilding.includes('=')) {
                        let [left, right] = tmpArgWhileBuilding.split('=');
                        if (!right.startsWith('"') && !right.startsWith("'")) {
                            throw new Error(`non-quoted value in double-dash key-value arg followed by a space. if you have a bare arg, it has to immediately follow the first (cmd) arg. (E: 070fca149eacef7f18767f9a27422f24)`);
                        }
                        if (right.endsWith("'") || right.endsWith('"')) {
                            throw new Error(`quoted non-space value in double-dash key-value arg followed by a space. if you have a bare arg, it has to immediately follow the first (cmd) arg. (E: 8d7fd323236f23e5c95e5925f362ba24)`);
                        }
                        // adding to quoted value in --key="value here"
                        tmpArgWhileBuilding += ` ${textPiece}`;
                    } else {
                        throw new Error(`double-dash flag cannot contain spaces (E: 2033486210ce1aa52e546ad9b26e6f24)`);
                    }
                } else {
                    // adding to bare arg
                    if (!doubleDashFound) {
                        // if we already have tmpArgWhileBuilding then we add
                        // the space, otherwise it's the first bare arg and
                        // there is no initial space
                        tmpArgWhileBuilding += tmpArgWhileBuilding ? ` ${textPiece}` : textPiece;
                    } else {
                        throw new Error(`bare arg must be immediately after the cmd atow (11/2023) (E: f3e42f5696c3e100c335ca2dc85b7f24)`);
                    }
                }
            }
        }
        if (tmpArgWhileBuilding.length > 0) { resArgs.push(tmpArgWhileBuilding); }

        const result = {
            validArgsString: true,
            cmd_ie_firstArgSansPrefix,
            args: resArgs,
        };

        return result;
        // the first first should be a command, with no spaces
        // the second arg might be a bare arg (doesn't start with --)
    } catch (error) {
        const emsg = `${lc} ${extractErrorMsg(error)}`;
        if (!!logErrors) { console.error(emsg); }
        return { validArgsString: false, validationErrorMsg: emsg };
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * Creates a canvas element and sets it up in the DOM.
 * @returns {HTMLCanvasElement} The created canvas element.
 */
export function createCanvas({
    width,
    height,
    parent,
}: {
    /**
     * if falsy, will use window.innerWidth
     */
    width?: number,
    /**
     * if falsy, will use window.innerHeight
     */
    height?: number
    /**
     * if falsy, will add to document.body
     */
    parent?: HTMLElement,
} = {}): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width ?? window.innerWidth;
    canvas.height = height ?? window.innerHeight;
    (parent ?? document.body).appendChild(canvas);
    return canvas;
};

export async function addToChatLogKluge({
    text,
    who,
    chatLog,
    scrollAfter,
}: {
    text: string,
    /**
     * could be the model's self-identified name.
     */
    who: 'user' | 'agent' | string,
    chatLog?: HTMLDivElement,
    scrollAfter?: boolean,
}): Promise<void> {
    const lc = `[${addToChatLogKluge.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: fb1a4deb37f471d73cf5c5f8ec938825)`); }

        if (!chatLog) {
            const primaryAgentChatLog = document.getElementById(ID_PRIMARY_AGENT_CHAT_LOG) as HTMLDivElement;
            if (!primaryAgentChatLog) { throw new Error(`(UNEXPECTED) #${ID_PRIMARY_AGENT_CHAT_LOG} falsy? right now we're kluging with this direct access to a singleton chat log in html (E: a8e4987729196b966b2b2d6813ea6825)`); }
            chatLog = primaryAgentChatLog;
        }

        const chatEntry = document.createElement('section');
        const textParagraphs = text.split('\n');
        textParagraphs[0] = `${who.padEnd(5)} > ${textParagraphs[0]}`;
        textParagraphs.forEach(text => {
            const pElement = document.createElement('p');
            pElement.textContent = text;
            chatEntry.appendChild(pElement);
        });
        // chatEntry.textContent = `${who.padEnd(5)} > ${text}`;
        chatLog.appendChild(chatEntry);
        if (scrollAfter) {
            chatEntry.scrollIntoView({ behavior: 'smooth' });
            // chatLog.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
