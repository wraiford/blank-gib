/*
 * @module blank-canvas helper/util/etc. functions
 *
 * this is where you will find helper functions like those that generate and
 * parse ibs for blank-canvas.
 */

// import * as pathUtils from 'path';
// import { statSync } from 'node:fs';
// import { readFile, } from 'node:fs/promises';
// import * as readline from 'node:readline/promises';
// import { stdin, stdout } from 'node:process'; // decide if use this or not

import {
    extractErrorMsg,
    getSaferSubstring,
    getTimestamp,
    getUUID,
    pretty,
    // delay, getSaferSubstring,
    // getTimestampInTicks, getUUID, pretty,
} from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { UUID_REGEXP, CLASSNAME_REGEXP, } from '@ibgib/helper-gib/dist/constants.mjs';
import { RCLIArgInfo, RCLIParamInfo } from '@ibgib/helper-gib/dist/rcli/rcli-types.mjs';
import { Ib, TransformResult, } from '@ibgib/ts-gib/dist/types.mjs';
import { validateIbGibIntrinsically, } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
import { Factory_V1 as factory } from '@ibgib/ts-gib/dist/V1/factory.mjs';
import { WitnessFormBuilder } from '@ibgib/core-gib/dist/witness/witness-form-builder.mjs';
import { isComment } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';
import { persistTransformResult } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
// import { IbGibBlankCanvasAppAny } from './blank-canvas-app-v1.mjs';
import {
    BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1, BlankCanvasAppIbGib_V1,
} from './blank-canvas-types.mjs';
import { BLANK_CANVAS_APP_NAME_REGEXP, DEFAULT_COMMAND_ESCAPE_STRING, DEFAULT_PROMPT_TEMPLATE, PARAM_INFO_INIT, PARAM_INFO_IN_MEMORY, } from './blank-canvas-constants.mjs';
import { RequestCommentData_V1, RequestCommentIbGib_V1 } from '../../../types.mjs';
import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';

/**
 * for logging. import this constant from your project.
 */
const logalot = GLOBAL_LOG_A_LOT;

if (logalot) { console.warn(`[TODO] do more COMMON_SPECIALS_REPLACE_MAP_BLANK_CANVAS (W: 083f629f91a9dd9dfbc3f49b0e102c24)`); }
export const COMMON_SPECIALS_REPLACE_MAP_BLANK_CANVAS: { [char: string]: string } = {
    " ": "__space__",
    "/": "__slash__",
    "\\\\": "__2backslash__", // not sure if this will work
    "\\": "__backslash__",
    ".": "__dot__",
    "=": "__equals__",
    "`": "__backtick__",
    "'": "__quote__",
    "\"": "__doublequote__",
    "?": "__question__",
    "$": "__dollar__",
    "&": "__ampersand__",
    ":": "__colon__",
    ";": "__semicolon__",
    // do more of these for fuller support
}

export function validateCommonBlankCanvasAppData({
    BlankCanvasAppData,
}: {
    BlankCanvasAppData?: BlankCanvasAppData_V1,
}): string[] {
    const lc = `[${validateCommonBlankCanvasAppData.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        if (!BlankCanvasAppData) { throw new Error(`BlankCanvasAppData required (E: 1059b99f79bb8e7ef8bdff4231895924)`); }
        const errors: string[] = [];

        const { name, uuid, classname, } = BlankCanvasAppData;

        if (name) {
            if (!name.match(BLANK_CANVAS_APP_NAME_REGEXP)) {
                errors.push(`name must match regexp: ${BLANK_CANVAS_APP_NAME_REGEXP}`);
            }
        } else {
            errors.push(`name required. (E: 926f32b8cb9857fc6402d073db2f3324)`);
        }

        if (uuid) {
            if (!uuid.match(UUID_REGEXP)) {
                errors.push(`uuid must match regexp: ${UUID_REGEXP}`);
            }
        } else {
            errors.push(`uuid required. (E: 3e1da2476137dcb7565ad51702611224)`);
        }

        if (classname) {
            if (!classname.match(CLASSNAME_REGEXP)) {
                errors.push(`classname must match regexp: ${CLASSNAME_REGEXP}`);
            }
        }

        return errors;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function validateCommonBlankCanvasAppIbGib({
    BlankCanvasIbGib,
}: {
    BlankCanvasIbGib: BlankCanvasAppIbGib_V1,
}): Promise<string[] | undefined> {
    const lc = `[${validateCommonBlankCanvasAppIbGib.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 3f4ca397ebf2f09f0422145304c83b24)`); }
        const intrinsicErrors: string[] = await validateIbGibIntrinsically({ ibGib: BlankCanvasIbGib }) ?? [];

        if (!BlankCanvasIbGib.data) { throw new Error(`BlankCanvasIbGib.data required (E: 1bac4b40b07798f2eafbbe72f3c19224)`); }
        const ibErrors: string[] = [];
        let { BlankCanvasClassname, BlankCanvasName, BlankCanvasId } =
            parseBlankCanvasAppIb({ BlankCanvasIb: BlankCanvasIbGib.ib });
        if (!BlankCanvasClassname) { ibErrors.push(`BlankCanvasClassname required (E: f66599ce4a551c53356e7dc4217ccc24)`); }
        if (!BlankCanvasName) { ibErrors.push(`BlankCanvasName required (E: 6df367875ed3398896719d46122ae524)`); }
        if (!BlankCanvasId) { ibErrors.push(`BlankCanvasId required (E: bfe3f4cd2ff352efeee5d4dacc162e24)`); }

        const dataErrors = validateCommonBlankCanvasAppData({ BlankCanvasAppData: BlankCanvasIbGib.data });

        let result = [...(intrinsicErrors ?? []), ...(ibErrors ?? []), ...(dataErrors ?? [])];
        if (result.length > 0) {
            return result;
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

export function getBlankCanvasAppIb({
    BlankCanvasAppData,
    classname,
}: {
    BlankCanvasAppData: BlankCanvasAppData_V1,
    classname?: string,
}): Ib {
    const lc = `[${getBlankCanvasAppIb.name}]`;
    try {
        const validationErrors = validateCommonBlankCanvasAppData({ BlankCanvasAppData });
        if (validationErrors.length > 0) { throw new Error(`invalid BlankCanvasAppData: ${validationErrors} (E: 3bf22fc28f79ccf8a158573377549824)`); }
        if (classname) {
            if (BlankCanvasAppData.classname && BlankCanvasAppData.classname !== classname) { throw new Error(`classname does not match BlankCanvasAppData.classname (E: 3a9c16a053acd665638c2a98e0daa924)`); }
        } else {
            classname = BlankCanvasAppData.classname;
            if (!classname) { throw new Error(`classname required (E: d6becb28769b82d74b39d9c6e4078c24)`); }
        }

        // ad hoc validation here. should centralize witness classname validation

        const { name, uuid } = BlankCanvasAppData;
        return `app typing_gib ${classname} ${name} ${uuid}`;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * Current schema is 'app [TYPING_GIB_ATOM] [classname] [BlankCanvasName] [BlankCanvasId]'
 *
 * NOTE this is space-delimited
 */
export function parseBlankCanvasAppIb({
    BlankCanvasIb,
}: {
    BlankCanvasIb: Ib,
}): {
    BlankCanvasClassname: string,
    BlankCanvasName: string,
    BlankCanvasId: string,
} {
    const lc = `[${parseBlankCanvasAppIb.name}]`;
    try {
        if (!BlankCanvasIb) { throw new Error(`BlankCanvasIb required (E: 4708f384e18e429a6a3c664e154b0c24)`); }

        const pieces = BlankCanvasIb.split(' ');

        return {
            BlankCanvasClassname: pieces[2],
            BlankCanvasName: pieces[3],
            BlankCanvasId: pieces[4],
        };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * stubbed validation function. there is also validation
 * when building the arg info objects.
 *
 * @returns error string if found, otherwise null
 *
 * @param argInfos
 */
export function validateArgInfos({ argInfos }: { argInfos: RCLIArgInfo[] }): string | undefined {
    const lc = `[${validateArgInfos.name}]`;
    let validationErrorIfAny: string | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 8f6f3df4b06b2b1838fcb90f2afe8f24)`); }
        // if (!argInfos || argInfos.length === 0) { throw new Error(`argInfos required. (E: fa4599a1181ad85b7e155d3bbec89c24)`); }

        // const hasInit = argInfos.some(x => x.name === PARAM_INFO_INIT.name);
        // const hasInMemory = argInfos.some(x => x.name === PARAM_INFO_IN_MEMORY.name);

        // if (hasInit && hasInMemory) {
        //     throw new Error(`cannot have both init and in-memory args (E: 61ac81a0ab222c6f4f0c5ddcf3e1d624)`);
        // }

        // // todo: flesh out argInfos validation
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        validationErrorIfAny = error.message;
    } finally {
        if (logalot) { console.log(`\n${lc} complete.`); }
        return validationErrorIfAny;
    }
}

export function getPrompt({
    id,
    promptTemplate = DEFAULT_PROMPT_TEMPLATE,
}: {
    /**
     * identifier, not necessarily a uuid.
     * so, e.g., a username or name of a witness
     */
    id: string
    /**
     * should have $id where the id will go.
     *
     * really i should be incorporating lex-gib here.
     */
    promptTemplate?: string,
}): string {
    promptTemplate ??= DEFAULT_PROMPT_TEMPLATE;
    let result: string;
    if (!!id && promptTemplate.includes('$id')) {
        result = promptTemplate.replace('$id', id);
    } else {
        result = id || '[?]>';
    }
    return result;
}

export class BlankCanvasAppFormBuilder extends WitnessFormBuilder {
    protected lc: string = `[${BlankCanvasAppFormBuilder.name}]`;

    constructor() {
        super();
        this.what = 'blank-canvas';
    }

    // exampleSetting({
    //     of,
    //     required,
    // }: {
    //     of: string,
    //     required?: boolean,
    // }): BlankCanvasAppFormBuilder {
    //     this.addItem({
    //         // BlankCanvas.data.exampleSetting
    //         name: "exampleSetting",
    //         description: `example description`,
    //         label: "Example Label",
    //         regexp: EXAMPLE_REGEXP,
    //         regexpErrorMsg: EXAMPLE_REGEXP_DESC,
    //         dataType: 'textarea',
    //         value: of,
    //         required,
    //     });
    //     return this;
    // }

}

/**
 * main priority is to ensure that there are no duplicate param infos.
 *
 * use this function at the start of application in order to check
 * that you have built a good parameter configuration.
 */
export function validateParamInfos({
    paramInfos,
}: {
    paramInfos: RCLIParamInfo[],
}): string[] {
    const lc = `[${validateParamInfos.name}]`;
    const errors: string[] = [];
    try {
        if (logalot) { console.log(`${lc} starting... (I: 476d92b192df5d06e81713ed99d2b924)`); }

        // verify no duplicate param identifiers
        const identifiers: string[] = [];
        const doIdentifier = (identifier: string) => {
            identifier = identifier.toLowerCase();
            if (identifiers.includes(identifier)) {
                const paramInfosWithDuplicates = paramInfos.filter(x => x.name === identifier || x.synonyms?.includes(identifier));
                errors.push(`${lc} identifier duplicate found: ${identifier}. paramInfosWithDuplicates: ${pretty(paramInfosWithDuplicates)} (E: 0df8d8da7055dbff18522213dd9d1424)`);
            } else {
                identifiers.push(identifier);
            }
        }
        paramInfos.forEach(paramInfo => {
            doIdentifier(paramInfo.name);
            (paramInfo.synonyms ?? []).forEach(x => doIdentifier(x));
        });

        return errors;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * creates an RCLI comment ibgib, returning the transform result,
 * optionally saving it in a given {@link space}.
 */
export async function createRequestCommentIbGib({
    args,
    interpretedArgInfos,
    addlMetadataText,
    saveInSpace,
    space,
}: {
    /**
     * As close to the raw args as we can get.
     */
    args: string[];
    /**
     * interpreted infos for args
     */
    interpretedArgInfos: RCLIArgInfo[];
    /**
     * Optional metadata string to be included in the comment's ib.
     * Should be underscore-delimited but not a hard rule atow.
     *
     * @example "comment thisisacomm here_is_addl_metadata"
     */
    addlMetadataText?: string;
    /**
     * If true, will save the ibgibs created in the given {@link space}.
     */
    saveInSpace?: boolean,
    /**
     * If {@link saveInSpace}, all ibgibs created in this function will be stored in
     * this space.
     */
    space?: IbGibSpaceAny,
}): Promise<TransformResult<RequestCommentIbGib_V1>> {
    const lc = `[${createRequestCommentIbGib.name}]`;

    if (logalot) { console.log(`${lc} starting...`); }
    try {
        if (!args) { throw new Error(`args required (E: b568890319dbea91e77180f4adf8df24)`); }
        if (args.length === 0) { throw new Error(`args.length must be at least 1 (E: af2c93ebda940d96bf8e904831904c24)`); }
        if (!interpretedArgInfos) { throw new Error(`interpretedArgInfos required (E: a3b1030a8bb64fc9e431d8b6bd9dd224)`); }
        if (!interpretedArgInfos.length) { throw new Error(`interpretedArgInfos.length must be at least 1 (E: 994254208957873a1700efe23ee77b24)`); }

        // if any of the args have spaces, then we want to quote them
        // const text = args.join(' ');
        const text = getOriginalCmdTextFromStrippedArgs({ args });

        const data: RequestCommentData_V1 = {
            uuid: await getUUID(),
            text,
            args,
            interpretedArgInfos,
            textTimestamp: getTimestamp(),
        };

        // create an ibgib with the filename and ext
        const opts: any = {
            parentIbGib: factory.primitive({ ib: 'comment' }),
            ib: getRequestCommentIb({ rcliCommentData: data, addlMetadataText }),
            data,
            dna: true,
            tjp: { uuid: true, timestamp: true },
            nCounter: true,
        };

        // this makes it more difficult to share/sync ibgibs...
        // if (this.addr) { opts.rel8ns = { 'comment on': [this.addr] }; }

        if (logalot) { console.log(`${lc} opts: ${pretty(opts)}`); }
        const resCommentIbGib = await factory.firstGen(opts) as TransformResult<RequestCommentIbGib_V1>;

        if (saveInSpace) {
            if (!space) { throw new Error(`space required if saveInSpace is truthy (E: bc87e2606d133c164f74d41856788124)`); }
            await persistTransformResult({ resTransform: resCommentIbGib, space });
        }

        return resCommentIbGib;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

export function getOriginalCmdTextFromStrippedArgs({
    args
}: {
    args: string[],
}): string {
    const lc = `[${getOriginalCmdTextFromStrippedArgs.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 61dbff42fd24820c7edc05d4d3078924)`); }

        const adjustedArgs: string[] = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.includes(' ')) {
                // includes space so we need to adjust

                /**
                 * helper fn to wrap
                 */
                const fnWrapInQuotesIfNeeded = (str: string) => {
                    str = str.concat();
                    let prefix = '';
                    if (str.startsWith('--')) {
                        prefix = '--';
                        str = str.substring(2)
                    } else if (str.startsWith(DEFAULT_COMMAND_ESCAPE_STRING)) {
                        prefix = DEFAULT_COMMAND_ESCAPE_STRING;
                        str = str.substring(DEFAULT_COMMAND_ESCAPE_STRING.length);
                    }
                    if (str.includes(' ')) {
                        // wrap str in single or double quotes
                        if (str.startsWith('"') || str.startsWith("'")) {
                            str = stripQuotes(str);
                        }
                        if (str.includes("'") && str.includes('"')) {
                            throw new Error(`edge case detected. value (${str}) includes both single and double quote. you win. (E: c1508b3a7cd8130153dcbcbf5601e724)`);
                        } else if (str.includes('"')) {
                            // includes double quotes, so wrap in single quotes
                            str = `'${str}'`;
                        } else {
                            // includes single quotes or none at all, so wrap in
                            // double quotes
                            str = `"${str}"`;
                        }
                    }
                    return prefix ? prefix + str : str;
                }

                if (arg.includes('=')) {
                    if (arg.indexOf('=') !== arg.lastIndexOf('=')) {
                        throw new Error(`more than one equals sign (=) found. these ='s in arg must only be to separate key=value. Neither key nor value can contain an equals sign. (E: b0dc97a5f19454da19284b3e811df824)`);
                    }

                    // adjust with quotes around value
                    let [key, value] = arg.split('=');
                    value = fnWrapInQuotesIfNeeded(value);
                    if (key.includes(' ')) { throw new Error(`arg key (${key}) cannot contain a space. (E: 2179ad43294dee4e038da9085c24d524)`); }
                    adjustedArgs.push(`${key}=${value}`);
                } else {
                    // just wrap the entire arg
                    adjustedArgs.push(fnWrapInQuotesIfNeeded(arg));
                }
            } else {
                // no space in arg so no need to adjust
                adjustedArgs.push(arg.concat());
            }
        }
        const result = adjustedArgs.join(' ');
        if (logalot) { console.log(`${lc} result: ${result} (I: 838d1d5c7646ef4ccc0c4521984d0b24)`); }
        return result;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}


export function validateCommonRequestCommentData({
    rcliCommentData,
}: {
    rcliCommentData?: RequestCommentData_V1,
}): string[] {
    const lc = `[${validateCommonRequestCommentData.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting...`); }
        if (!rcliCommentData) { throw new Error(`rcliCommentData required (E: 19bf1c3ac64de8bf1a0dd5cdf24aa524)`); }
        const errors: string[] = [];
        const {
            uuid,
            text,
            args,
            interpretedArgInfos,
        } = rcliCommentData;

        if (uuid) {
            if (!uuid.match(UUID_REGEXP)) {
                errors.push(`uuid must match regexp: ${UUID_REGEXP}`);
            }
        } else {
            errors.push(`uuid required.`);
        }

        if (!text) { errors.push(`text required`); }
        if (!args) { errors.push(`args required`); }
        if (!interpretedArgInfos) { errors.push(`interpretedArgInfos required`); }

        return errors;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function validateCommonRequestCommentIbGib({
    rcliCommentIbGib,
}: {
    rcliCommentIbGib: RequestCommentIbGib_V1,
}): Promise<string[] | undefined> {
    const lc = `[${validateCommonRequestCommentIbGib.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: ce94adde144fb23327ace37f3cf3b724)`); }
        const intrinsicErrors: string[] = await validateIbGibIntrinsically({ ibGib: rcliCommentIbGib }) ?? [];

        if (!rcliCommentIbGib.data) { throw new Error(`rcliCommentIbGib.data required (E: 20e0d6c75a464da4ac04e238231d8724)`); }
        const ibErrors: string[] = [];
        let { text } = parseRequestCommentIb({ rcliCommentIb: rcliCommentIbGib.ib });
        if (!text) { ibErrors.push(`ib text required (E: b25ccb5f2b69971c83741e85cba39724)`); }

        const dataErrors = validateCommonRequestCommentData({ rcliCommentData: rcliCommentIbGib.data });

        let result = [...(intrinsicErrors ?? []), ...(ibErrors ?? []), ...(dataErrors ?? [])];
        if (result.length > 0) {
            return result;
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
export function getRequestCommentIb({
    rcliCommentData,
    addlMetadataText,
}: {
    rcliCommentData: RequestCommentData_V1,
    addlMetadataText?: string,
}): Ib {
    const lc = `[${getRequestCommentIb.name}]`;
    try {
        const validationErrors = validateCommonRequestCommentData({ rcliCommentData });
        if (validationErrors.length > 0) { throw new Error(`invalid rcliCommentData: ${validationErrors} (E: 39a94de70943256271ca7ccbb4d9ce24)`); }
        if (addlMetadataText?.includes(' ')) { throw new Error(`addlMetadataText should not include a space, as this is a delimiter in the rcliCommentIb (E: 44a94ab6b474acabe785d1573d1df224)`); }

        const saferText = getSaferSubstring({
            text: rcliCommentData.text,
            keepLiterals: ["-", "."],
            length: 64,
            replaceMap: {
                ...COMMON_SPECIALS_REPLACE_MAP_BLANK_CANVAS,
            }
        });
        if (saferText.includes(' ')) { throw new Error(`saferText should not include a space, as this is a delimiter in the rcliCommentIb (E: e90757d4f2162e39c82eb7fce38a9d24)`); }

        return addlMetadataText ?
            `comment ${saferText} ${addlMetadataText}` :
            `comment ${saferText}`;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

/**
 * Current schema is `comment ${saferText} ${addlMetadataText}`;
 *
 * NOTE this is space-delimited
 */
export function parseRequestCommentIb({
    rcliCommentIb,
}: {
    rcliCommentIb: Ib,
}): {
    text: string,
    addlMetadataText?: string,
} {
    const lc = `[${parseRequestCommentIb.name}]`;
    try {
        if (!rcliCommentIb) { throw new Error(`rcliCommentIb required (E: df06f2c150de3e82a90b8ba3c5eea224)`); }

        const [_, text, addlMetadataText] = rcliCommentIb.split(' ');

        return {
            text,
            addlMetadataText,
        };
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}

export function isRequestComment({ ibGib }: { ibGib: IbGib_V1 }): boolean {
    const lc = `[${isRequestComment.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 1c8b1cc716b37601e76edd73d690ac24)`); }

        if (!isComment({ ibGib })) { return false; /* <<<< returns early */ }

        let { data } = ibGib;
        if (!data) { return false; /* <<<< returns early */ }

        let castedData = data as RequestCommentData_V1;
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

/**
 * utility to strip quotes in an unknown string format. the incoming str may be
 * a key=value, or empty or no quotes, or double-quoted, or single-quoted
 * warning, this is duplicated here and in @ibgib/ibgib package (rcli-helper?)
 * @param str is the string to strip
 * @returns original str if no quotes found, else  strips entire str or if has key=value format this will strip the value of quotes.
 */
export function stripQuotes(str: string): string {
    const lc = `[${stripQuotes.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 544d6f5b32d2a880b33692da1a201724)`); }
        let s = str.concat();
        if (!s.includes("'") && !s.includes('"')) {
            // doesn't contain quotes
            return s; /* <<<< returns early */
        }
        if (s.includes('=')) {
            let [key, value] = s.split('=');
            if (value.startsWith('"') && !value.endsWith('"')) {
                throw new Error(`invalid string. value starts with " but doesn't end with it (E: f710f3c9d99dc789abea460d61a59924)`);
            } else if (value.startsWith("'") && !value.endsWith("'")) {
                throw new Error(`invalid string. value starts with ' but doesn't end with it (E: 924bd700afa2e61fcf284578f944a624)`);
            } else {
                // strip the right side value
                value = value.substring(1);
                value = value.substring(0, value.length - 1);
            }
            s = `${key}=${value}`;
        } else {
            if (s.startsWith('"') && !s.endsWith('"')) {
                throw new Error(`invalid string. starts with " but doesn't end with it (E: 9778a4bba892d4cfd62f181590f7a724)`);
            } else if (s.startsWith("'") && !s.endsWith("'")) {
                throw new Error(`invalid string. starts with ' but doesn't end with it (E: ec1fcea648641f105b025424aabbd924)`);
            } else {
                // strip the right side value
                s = s.substring(1);
                s = s.substring(0, s.length - 1);
            }
        }
        return s;

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

