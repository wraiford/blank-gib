/**
 * @module blank-canvas app types (and some enums/constants)
 */

import { DEFAULT_COMMAND_ESCAPE_STRING, BlankCanvasCommand } from "./blank-canvas-constants.mjs";
import { RCLIArgInfo, RCLIArgType } from "@ibgib/helper-gib/dist/rcli/rcli-types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { CommentIbGib_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";

import {
    AppData_V1, AppRel8ns_V1,
    AppCmdData, AppCmdRel8ns, AppCmdIbGib,
    // AppCmd, AppCmdModifier,
    AppResultData, AppResultRel8ns, AppResultIbGib,
    AppIbGib_V1,
} from "@ibgib/core-gib/dist/witness/app/app-types.mjs";

// /**
//  * example enum-like type+const that I use in ibgib. sometimes i put
//  * these in the types.mts and sometimes in the const.mts, depending
//  * on context.
//  */
// export type SomeEnum =
//     'ib' | 'gib';
// /**
//  * @see {@link SomeEnum}
//  */
// export const SomeEnum = {
//     ib: 'ib' as SomeEnum,
//     gib: 'gib' as SomeEnum,
// } satisfies { [key: string]: SomeEnum };
// /**
//  * values of {@link SomeEnum}
//  */
// export const SOME_ENUM_VALUES: SomeEnum[] = Object.values(SomeEnum);

export const DEFAULT_UUID_BLANK_CANVAS_APP = '';
export const DEFAULT_NAME_BLANK_CANVAS_APP = 'blank_canvas';
export const DEFAULT_DESCRIPTION_BLANK_CANVAS_APP =
    `HMM what is our description?`;

/**
 * ibgib's intrinsic data goes here.
 *
 * @see {@link IbGib_V1.data}
 */
export interface BlankCanvasAppData_V1 extends AppData_V1 {
    // ibgib data (settings/values/etc) goes here
    // /**
    //  * docs yo
    //  */
    // setting: string;
}

/**
 * rel8ns (named edges/links in DAG) go here.
 *
 * @see {@link IbGib_V1.rel8ns}
 */
export interface BlankCanvasAppRel8ns_V1 extends AppRel8ns_V1 {
    // /**
    //  * required rel8n. for most, put in blank-canvas-constants.mts file
    //  *
    //  * @see {@link REQUIRED_REL8N_NAME}
    //  */
    // [REQUIRED_REL8N_NAME]: IbGibAddr[];
    // /**
    //  * optional rel8n. for most, put in blank-canvas-constants.mts file
    //  *
    //  * @see {@link OPTIONAL_REL8N_NAME}
    //  */
    // [OPTIONAL_REL8N_NAME]?: IbGibAddr[];
}

/**
 * this is the ibgib DTO itself. this is NOT the ibgib app class.
 *
 * If this is a plain ibgib data only object, this acts as a dto. The app
 * witness class is slightly different, as this adds on a single method called
 * `witness`. The general design is to send commands and other ibgibs to the
 * witness and receive an ibgib as a result. this acts as a single point of
 * binding interaction and has many other consequences. see the `Witness`
 * interface in core-gib `witness-types.mts` for more information.
 *
 * @see {@link BlankCanvasAppData_V1}
 * @see {@link BlankCanvasAppRel8ns_V1}
 */
export interface BlankCanvasAppIbGib_V1 extends IbGib_V1<BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1> {
}

/**
 * Default data values for a BlankCanvas app.
 *
 * If you change this, please bump the version
 *
 * (but of course won't be the end of the world when this doesn't happen).
 */
export const DEFAULT_BLANK_CANVAS_APP_DATA_V1: BlankCanvasAppData_V1 = {
    version: '1',
    uuid: DEFAULT_UUID_BLANK_CANVAS_APP,
    name: DEFAULT_NAME_BLANK_CANVAS_APP,
    description: DEFAULT_DESCRIPTION_BLANK_CANVAS_APP,
    classname: `BlankCanvasApp_V1`,

    icon: 'square',

    /**
     * if true, then the app will attempt to persist ALL calls to
     * `app.witness`.
     */
    persistOptsAndResultIbGibs: false,
    /**
     * allow ibgibs like 42^gib ({ib: 42, gib: 'gib'} with `data` and `rel8ns` undefined)
     */
    allowPrimitiveArgs: true,
    /**
     * witnesses should be guaranteed not to throw uncaught exceptions.
     */
    catchAllErrors: true,
    /**
     * if true, would enable logging of all calls to `app.witness`
     */
    trace: false,

    cmdEscapeString: DEFAULT_COMMAND_ESCAPE_STRING,
}
export const DEFAULT_BLANK_CANVAS_APP_REL8NS_V1: BlankCanvasAppRel8ns_V1 | undefined = undefined;

/**
 * Cmds for interacting with ibgib apps.
 *
 * Not all of these will be implemented for every app.
 *
 * ## todo
 *
 * change these commands to better structure, e.g., verb/do/mod, can/get/addrs
 * */
export type BlankCanvasAppCmd =
    'ib' | 'gib' | 'ibgib';
/** Cmds for interacting with ibgib spaces. */
export const BlankCanvasAppCmd = {
    /**
     * it's more like a grunt that is intepreted by context.
     */
    ib: 'ib' satisfies BlankCanvasAppCmd,
    /**
     * it's more like a grunt that is intepreted by context.
     */
    gib: 'gib' satisfies BlankCanvasAppCmd,
    /**
     * third placeholder command.
     *
     * I imagine this will be like "what's up", but who knows.
     */
    ibgib: 'ibgib' satisfies BlankCanvasAppCmd,
} satisfies { [cmd: string]: BlankCanvasAppCmd }

/**
 * Flags to affect the command's interpretation.
 */
export type BlankCanvasAppCmdModifier =
    'ib' | 'gib' | 'ibgib';
/**
 * Flags to affect the command's interpretation.
 */
export const BlankCanvasAppCmdModifier = {
    /**
     * hmm...
     */
    ib: 'ib' satisfies BlankCanvasAppCmdModifier,
    /**
     * hmm...
     */
    gib: 'gib' satisfies BlankCanvasAppCmdModifier,
    /**
     * hmm...
     */
    ibgib: 'ibgib' satisfies BlankCanvasAppCmdModifier,
} satisfies { [cmdModifier: string]: BlankCanvasAppCmdModifier }

/** Information for interacting with spaces. */
export interface BlankCanvasAppCmdData
    extends AppCmdData<BlankCanvasAppCmd, BlankCanvasAppCmdModifier> {
}

export interface BlankCanvasAppCmdRel8ns extends AppCmdRel8ns {
}

/**
 * Shape of options ibgib if used for a command-based app.
 */
export interface BlankCanvasAppCmdIbGib
    extends AppCmdIbGib<
        IbGib_V1,
        BlankCanvasAppCmd, BlankCanvasAppCmdModifier,
        BlankCanvasAppCmdData, BlankCanvasAppCmdRel8ns
    > {
}

/**
 * Optional shape of result data to app interactions.
 *
 * This is in addition of course to {@link BlankCanvasAppResultData}.
 *
 * so if you're sending a cmd to this app, this should probably be the shape
 * of the result.
 *
 * ## notes
 *
 * * I'm not sure what to do with this atm, so I'm just stubbing out...
 */
export interface BlankCanvasAppResultData extends AppResultData {
}

/**
 * Marker interface rel8ns atm...
 *
 * so if you're sending a cmd to this app, this should probably be the shape
 * of the result.
 *
 * I'm not sure what to do with this atm, so I'm just stubbing out...
 */
export interface BlankCanvasAppResultRel8ns extends AppResultRel8ns { }

/**
 * Shape of result ibgib if used for a app.
 *
 * so if you're sending a cmd to this app, this should probably be the shape
 * of the result.
 *
 * I'm not sure what to do with this atm, so I'm just stubbing out...
 */
export interface BlankCanvasAppResultIbGib
    extends AppResultIbGib<IbGib_V1, BlankCanvasAppResultData, BlankCanvasAppResultRel8ns> {
}

/**
 * used with app's ib additional metadata. most app ibs I've made have this addl
 * metadata field which is an underscore-delimited field (which is why
 * underscores are removed). the purpose of this is to have per-use-case addl
 * metadata that would be useful to someone (person, api function, whatever)
 * looking at only the ib without loading the entire ibgib data (which could be
 * very expensive).
 */
export interface BlankCanvasAppAddlMetadata {
    /**
     * should be $snake_name
     */
    atom?: "blank_canvas_app";
    /**
     * classname of blank-canvas **with any underscores removed**.
     */
    classnameIsh?: string;
    /**
     * name of blank-canvas app witness **with any underscores removed**.
     */
    nameIsh?: string;
    /**
     * id of blank-canvas app witness **with any underscores removed**.
     */
    idIsh?: string;
}

import { BlankCanvasApp_V1 } from "./blank-canvas-app-v1.mjs";
// import {
//     WitnessArgData, WitnessArgRel8ns, WitnessArgIbGib,
//     WitnessResultData, WitnessResultRel8ns, WitnessResultIbGib,
// } from "@ibgib/core-gib/dist/witness/witness-types.mjs";

export const DEFAULT_UUID_RCLI_APP = '';
export const DEFAULT_NAME_RCLI_APP = 'rcli_gib';
export const DEFAULT_DESCRIPTION_RCLI_APP =
    `A RCLI (Request/Command Line Interface) app done ibgib style. Instead of rigid RCLI-style
commands, uses more flexible natural language with chat robbots for request
routing to interface with ibgib data space(s).`;


export interface BlankCanvasAppData_V1 extends AppData_V1 {
    /**
     * escape sequence when commanding this rcli app to do something.
     *
     * works basically the same as robbots' requestEscapeString.
     */
    cmdEscapeString: string;
}

export const RCLI_ROBBOT_REL8N_NAME = 'rliRobbot';
export interface BlankCanvasAppRel8ns_V1 extends AppRel8ns_V1 {
    /**
     * robbot(s) that this RCLI uses to interact with the user.
     *
     * the first robbot takes precedence(?)...hmm
     */
    [RCLI_ROBBOT_REL8N_NAME]: IbGibAddr[];
}

export interface BlankCanvasAppIbGib_V1 extends AppIbGib_V1<BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1> {

}

/**
 * Default data values for a random app.
 *
 * If you change this, please bump the version
 *
 * (but of course won't be the end of the world when this doesn't happen).
 */
export const DEFAULT_RCLI_APP_DATA_V1: BlankCanvasAppData_V1 = {
    version: '1',
    uuid: DEFAULT_UUID_RCLI_APP,
    name: DEFAULT_NAME_RCLI_APP,
    description: DEFAULT_DESCRIPTION_RCLI_APP,
    classname: `BlankCanvasApp_V1`,

    icon: 'code-slash',

    persistOptsAndResultIbGibs: false,
    allowPrimitiveArgs: true,
    catchAllErrors: true,
    trace: false,

    cmdEscapeString: DEFAULT_COMMAND_ESCAPE_STRING,
}
export const DEFAULT_RCLI_APP_REL8NS_V1: BlankCanvasAppRel8ns_V1 | undefined = undefined;

export interface BlankCanvasAppAddlMetadata {
    /**
     * should be rcli
     */
    atom?: 'blank_canvas_app';
    /**
     * classname of app **with any underscores removed**.
     */
    classnameIsh?: string;
    /**
     * name of app witness **with any underscores removed**.
     */
    nameIsh?: string;
    /**
     * id of app witness **with any underscores removed**.
     */
    idIsh?: string;
}

export type ExpectPathType = 'file' | 'directory' | 'exists' | 'empty-directory' | undefined;

export interface BlankCanvasCommandTextInfo {
    /**
     * raw text from the command ibgib. (i.e. ibgib.data.text)
     */
    rawText: string,
    /**
     * If the command is valid, then this should be the command name (i.e.
     * paramInfo.name not a synonym if that was what was provided in the raw
     * text).
     */
    cmd?: BlankCanvasCommand,
    /**
     * If the command is valid, then this should be populated with
     * the argInfos generated from parsing the command.
     */
    argInfos?: RCLIArgInfo<RCLIArgType>[],
    /**
     * If true, then there was an error with the command, not necessarily with
     * its processing.
     *
     * I think most likely this is a validation error.
     */
    errorMsg?: string
    /**
     * If true, then the command is either the bare help command or
     * we are showing the help for the command.
     */
    showHelp?: boolean;
}

export interface BlankCanvasCommandHandlerAddCommentFunctionArgs {
    text: string,
    contextIbGib: IbGib_V1,
    rel8nName: string,
}

/**
 * BlankCanvasApp_V1 handler for commands via comment ibgibs.
 */
export interface BlankCanvasCommandHandlerArg {
    fnAddComment: (arg: BlankCanvasCommandHandlerAddCommentFunctionArgs) => Promise<void>;
    cmdInfo: BlankCanvasCommandTextInfo;
    metaspace: MetaspaceService;
    contextIbGib: IbGib_V1;
    ibGib: CommentIbGib_V1;
    cmdEscapeString: string;
}

export type BlankCanvasCommandHandler =
    (arg: BlankCanvasCommandHandlerArg) => Promise<IbGib_V1 | undefined>;

// /**
//  * currently i'm just taking this from the definition of node's `Buffer` type.
//  *
//  * using this with handle-reify-file.mts when reading the file.
//  * note that 'binary' may reoslve to 'latin1' per SO at https://stackoverflow.com/questions/46441667/reading-binary-data-in-node-js
//  */
// export type FileEncoding =
//     | 'ascii'
//     | 'utf8'
//     | 'utf-8'
//     | 'utf16le'
//     | 'ucs2'
//     | 'ucs-2'
//     | 'base64'
//     | 'base64url'
//     | 'latin1'
//     | 'binary'
//     | 'hex';
// export const FileEncoding = {
//     ascii: 'ascii' as FileEncoding,
//     utf8: 'utf8' as FileEncoding,
//     utf_8: 'utf-8' as FileEncoding,
//     ['utf-8']: 'utf-8' as FileEncoding,
//     utf16le: 'utf16le' as FileEncoding,
//     ucs2: 'ucs2' as FileEncoding,
//     ucs_2: 'ucs-2' as FileEncoding,
//     ['ucs-2']: 'ucs-2' as FileEncoding,
//     base64: 'base64' as FileEncoding,
//     base64url: 'base64url' as FileEncoding,
//     latin1: 'latin1' as FileEncoding,
//     binary: 'binary' as FileEncoding,
//     hex: 'hex' as FileEncoding,
// };
// /**
//  * valid file encoding values per {@link FileEncoding}
//  */
// export const FILE_ENCODINGS = Object.values(FileEncoding);
