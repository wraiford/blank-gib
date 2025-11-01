/**
 * @module blank-canvas constants for use with BlankCanvasApp
 *
 * app constants are in this file!
 */

// #region some enum
// /**
//  * example enum-like type+const that I use in ibgib. sometimes i put
//  * these in the types.mts and sometimes in the const.mts, depending
//  * on context.
//  */
// export type SomeEnum =
//     'ib' | 'gib';
// export const SomeEnum = {
//     ib: 'ib' as SomeEnum,
//     gib: 'gib' as SomeEnum,
// } satisfies { [key: string]: SomeEnum };
// export const SOME_TYPE_VALUES: SomeEnum[] = Object.values(SomeEnum);
// #endregion some enum

export const BLANK_CANVAS_APP_NAME_REGEXP = /^[a-zA-Z0-9_\-.]{1,255}$/;
export const BLANK_CANVAS_ATOM = 'blank-canvas';
export const BLANK_CANVAS_NAME_REGEXP = /^[a-zA-Z0-9_\-. @~]{1,1024}$/;

export const CHAT_WITH_AGENT_PLACEHOLDER_SUBMITKEYSTROKE = `Ctrl+ENTER to send`;
export const CHAT_WITH_AGENT_PLACEHOLDER_AGENT = `Chat with the agent. Ctrl+ENTER to send`;
// export const CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT = `Chat with the primary agent about ibgib and this website.\nCtrl+ENTER to send`;
export const CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT = [
    `Chat with the primary AI agent here, like...`,
    `What's ibgib?`,
    `What exactly makes ibgib's addressing schema unique?`,
    `What's this website?`,
    `Where's the src for ibgib libs & this website?`,
    CHAT_WITH_AGENT_PLACEHOLDER_SUBMITKEYSTROKE,
].join('\n');
export const CHAT_WITH_AGENT_PLACEHOLDER_PROJECTSAGENT = `Chat with the projects agent. Ctrl+ENTER to send`;
export const CHAT_WITH_AGENT_NEED_API_KEY = `This website currently is BYO-Key, so enter your Gemini API key here. Be aware this will be stored LOCALLY in PLAINTEXT in your browser's IndexedDB.\n\nThis will enable not only a website-wide chatbot that you may already be familiar with, but also other UX agents that power some of the advanced, dynamic UX features.\n\nDonate! Invest! Help fund us to improve this groundbreaking website and protocol, enabling others to create their own sovereign websites downstream via the protocol. See the funding page for more info.`;

import { RCLIParamInfo } from "@ibgib/helper-gib/dist/rcli/rcli-types.mjs"
import { COMMON_PARAM_INFOS, PARAM_PREFIXES, getParam_dest, getParam_src, } from "@ibgib/helper-gib/dist/rcli/rcli-constants.mjs";
import { clone } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import {
    PARAM_INFO_DECRYPT, PARAM_INFO_ENCRYPT,
    PARAM_INFO_INDEXING_MODE, PARAM_INFO_SALT,
    // PARAM_INFO_STRENGTH, // maybe will use this later?
    PARAM_INFO_BLOCKMODE_FLAG, PARAM_INFO_BLOCKMODE_BLOCK_SIZE,
    PARAM_INFO_BLOCKMODE_NUM_OF_PASSES, PARAM_INFO_HASH_ALGORITHM,
    PARAM_INFO_SALT_STRATEGY, PARAM_INFO_INITIAL_RECURSIONS, PARAM_INFO_RECURSIONS_PER_HASH,
} from '@ibgib/encrypt-gib/dist/rcli/rcli-constants.mjs';
import { TransformOpts_Fork, TransformOpts_Mut8, TransformOpts_Rel8 } from "@ibgib/ts-gib/dist/types.mjs";
import { ROOT_ADDR } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { BOOTSTRAP_IBGIB_ADDR } from "@ibgib/core-gib/dist/witness/space/bootstrap/bootstrap-constants.mjs";

// import { FileEncoding } from "./rcli-types.mjs";

/**
 * Used in npm test
 */
export const RCLI_TEST_PATH = 'test-rcli';

/**
 * the path used for the ibgib subpath if not set by args.
 */
export const RCLI_DEFAULT_OUTPUT_PATH = '.ibgib';

/**
 * used when prompting the user.
 */
export const DEFAULT_PROMPT_TEMPLATE = `[$id]> `;

/**
 * this is the thing that comes before a command.
 *
 * you can also just use the --[cmd] format (i think).
 */
export const DEFAULT_COMMAND_ESCAPE_STRING = ':';

/**
 * the max length of a command escape string.
 */
export const RCLI_MAX_ESCAPE_STRING_LENGTH = 8;

/**
 * options that you start with when performing a fork operation.
 *
 * parts of this are what get overridden by parameters.
 */
export const DEFAULT_FORK_OPTIONS: TransformOpts_Fork = {
    type: 'fork',
    srcAddr: ROOT_ADDR,
    cloneData: true,
    cloneRel8ns: true,
    destIb: undefined,
    dna: true,
    linkedRel8ns: undefined,
    nCounter: true,
    noTimestamp: false,
    tjp: {
        timestamp: true,
        uuid: true,
    },
    uuid: undefined,
};

/**
 * options that you start with when performing a mut8 operation.
 *
 * parts of this are what get overridden by parameters.
 */
export const DEFAULT_MUT8_OPTIONS: TransformOpts_Mut8 = {
    type: 'mut8',
    dna: true,
    linkedRel8ns: undefined,
    nCounter: true,
    noTimestamp: false,
};

/**
 * options that you start with when performing a rel8 operation.
 *
 * parts of this are what get overridden by parameters.
 */
export const DEFAULT_REL8_OPTIONS: TransformOpts_Rel8 = {
    type: 'rel8',
    dna: true,
    linkedRel8ns: undefined,
    nCounter: true,
    noTimestamp: false,
};

/**
 * using when reading a file from the command line.
 *
 * ## notes
 *
 * * currently working on handle-reify-file.mts
 */
// export const DEFAULT_FILE_ENCODING: FileEncoding = 'utf8';

/**
 * maximum number of chars when generating name
 */
export const MAX_GENERATE_FILE_NAME_LENGTH = 32;

// #region param info related

// #region command defs

/**
 * command typescript type literal.
 *
 * this is useful (i guess?) in locking down commands.
 *
 * # when creating new commands
 *
 * * Add it to the BlankCanvasCommand type here
 * * add to the constant of the same name
 * * add any synonyms
 */
export type BlankCanvasCommand =
    'help' |
    'init' |
    'quit' |
    'cwd' |
    'fork' |
    'mut8' |
    'rel8' |
    'version' |
    'add-comment' | // add-link, add-pic
    'list-chat' |
    'secret' |
    'encryption' |
    'sync' |
    'add-stone' |
    'reify-file' |
    'generate-source-file' |
    'info' |
    'export' |
    'import' |
    'space' |
    'b2tfs-init' |
    'b2tfs-branch' |
    'b2tfs-activate-branch' |
    'b2tfs-info' |
    'b2tfs-diff' |
    'b2tfs-sync'
    ;
export const BlankCanvasCommand = {
    help: 'help' as BlankCanvasCommand,
    init: 'init' as BlankCanvasCommand,
    quit: 'quit' as BlankCanvasCommand,
    cwd: 'cwd' as BlankCanvasCommand,
    fork: 'fork' as BlankCanvasCommand,
    mut8: 'mut8' as BlankCanvasCommand,
    rel8: 'rel8' as BlankCanvasCommand,
    version: 'version' as BlankCanvasCommand,
    add_comment: 'add-comment' as BlankCanvasCommand,
    list_chat: 'list-chat' as BlankCanvasCommand,
    secret: 'secret' as BlankCanvasCommand,
    encryption: 'encryption' as BlankCanvasCommand,
    sync: 'sync' as BlankCanvasCommand,
    create_stone: 'add-stone' as BlankCanvasCommand,
    reify_file: 'reify-file' as BlankCanvasCommand,
    generate_source_file: 'generate-source-file' as BlankCanvasCommand,
    info: 'info' as BlankCanvasCommand,
    export: 'export' as BlankCanvasCommand,
    import: 'import' as BlankCanvasCommand,
    space: 'space' as BlankCanvasCommand,
    b2tfs_init: 'b2tfs-init' as BlankCanvasCommand,
    b2tfs_branch: 'b2tfs-branch' as BlankCanvasCommand,
    b2tfs_activate_branch: 'b2tfs-activate-branch' as BlankCanvasCommand,
    b2tfs_info: 'b2tfs-info' as BlankCanvasCommand,
    b2tfs_diff: 'b2tfs-diff' as BlankCanvasCommand,
    b2tfs_sync: 'b2tfs-sync' as BlankCanvasCommand,
} satisfies { [key: string]: BlankCanvasCommand };
export const RCLI_COMMANDS: BlankCanvasCommand[] = Object.values(BlankCanvasCommand);

/**
 * B2tFS command synonyms can be built with these instead of the full "b2tfs".
 */
export const B2TFS_CMD_PREFIXES: string[] = ['b2', 'fs', 'vcs'];
/**
 * small helper function to generate variants of b2tfs commands. so if you have
 * a cmd "activate", this will add `b2tfs-activate`, `b2-activate
 * @param cmdOrSynonymBase is the thing you want to create b2tfs variants for.
 * @returns array of synonyms for given `cmdOrSynonymBase`
 */
const fnGetB2PrefixedVariants = (cmdOrSynonymBase: string): string[] => {
    if (cmdOrSynonymBase.startsWith("b2tfs-")) {
        // no need to add a b2tfs- variant and strip off the b2tfs from cmd
        return B2TFS_CMD_PREFIXES.map(prefix => `${prefix}-${cmdOrSynonymBase.substring("b2tfs-".length)}`);
    } else {
        // we want the b2tfs variant in there, and we don't need to strip the
        // b2tfs- from the incoming cmd.
        return [
            `b2tfs-${cmdOrSynonymBase}`,
            ...B2TFS_CMD_PREFIXES.map(prefix => `${prefix}-${cmdOrSynonymBase}`)
        ];
    }
}
export const RCLI_COMMAND_SYNONYMS: { [key: string]: string[] } = {
    [BlankCanvasCommand.help]: ['h', 'huh', 'wat'],
    [BlankCanvasCommand.init]: ['initialize',],
    [BlankCanvasCommand.quit]: ['q', 'exit'],
    [BlankCanvasCommand.fork]: [],
    [BlankCanvasCommand.mut8]: [],
    [BlankCanvasCommand.rel8]: [],
    [BlankCanvasCommand.cwd]: ['pwd'],
    [BlankCanvasCommand.add_comment]: [],
    [BlankCanvasCommand.secret]: [],
    [BlankCanvasCommand.encryption]: [],
    [BlankCanvasCommand.sync]: [],
    [BlankCanvasCommand.version]: ['v'],
    [BlankCanvasCommand.list_chat]: ['view-chat', 'replay', 'ls-chat'],
    [BlankCanvasCommand.create_stone]: ['new-stone'],
    [BlankCanvasCommand.reify_file]: ['reify'],
    [BlankCanvasCommand.generate_source_file]: [
        'generate-src', 'generate-src-file', 'g-src', 'g-src-file'
    ],
    [BlankCanvasCommand.info]: ['status', 'details', 'deets', 'cat'],
    [BlankCanvasCommand.export]: [],
    [BlankCanvasCommand.import]: [],
    [BlankCanvasCommand.space]: ['spaces'], // hmm may be changing this in the future
    [BlankCanvasCommand.b2tfs_init]: [...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_init)],
    [BlankCanvasCommand.b2tfs_branch]: [...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_branch)],
    [BlankCanvasCommand.b2tfs_activate_branch]: [
        ...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_activate_branch),
        ...fnGetB2PrefixedVariants('activate'),
    ],
    [BlankCanvasCommand.b2tfs_info]: [
        ...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_info),
        ...fnGetB2PrefixedVariants('status'), // maybe change later to different cmd? hmm...
    ],
    [BlankCanvasCommand.b2tfs_diff]: [
        ...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_diff),
    ],
    [BlankCanvasCommand.b2tfs_sync]: [
        ...fnGetB2PrefixedVariants(BlankCanvasCommand.b2tfs_sync),
    ],
};
export const RCLI_COMMAND_IDENTIFIERS: string[] = [
    ...RCLI_COMMANDS,
    ...Object.values(RCLI_COMMAND_SYNONYMS).flatMap(x => x),
];
// do a quick validation to avoid duplicate command names/synonyms.
if (RCLI_COMMAND_IDENTIFIERS.length !== new Set(RCLI_COMMAND_IDENTIFIERS).size) {
    throw new Error(`duplicate rcli command identifier found. (E: 8a962a60050a506e14ff49b81ffd2423)`);
}
if (RCLI_COMMAND_IDENTIFIERS.some(x => x === '')) {
    throw new Error(`empty string rcli command identifier found (E: 6bcff3c0f333544a583a24c47d161823)`);
}

/**
 * generated constant whose values are param infos for the command in
 * BlankCanvasCommand constant.
 *
 * ATOW all of these are boolean flags, some with synonyms, that do not allow
 * mutiple.
 */
export const RCLI_COMMAND_PARAM_INFOS: Record<BlankCanvasCommand, RCLIParamInfo> =
    Object
        .values(RCLI_COMMANDS)
        .reduce((agg: Record<BlankCanvasCommand, RCLIParamInfo>, cmdName: BlankCanvasCommand) => {
            agg[cmdName] = {
                name: cmdName,
                argTypeName: 'boolean',
                allowMultiple: false,
                isFlag: true,
                synonyms: RCLI_COMMAND_SYNONYMS[cmdName],
            } as RCLIParamInfo;
            return agg;
        }, {} as Record<BlankCanvasCommand, RCLIParamInfo>);
;

// /**
//  * The keys of this object are the primary prefixes. The values are the arrays
//  * of alternate param prefixes.
//  *
//  * primary-param-prefix -> alt-param-prefix[]
//  *
//  * this is for making synonyms in a more normalized way.
//  */
// const PARAM_PREFIXES: { [paramName: string]: string[] } = {
//     'src': ['source', 'from', 'in', 'input'],
//     'dest': ['destination', 'to', 'out', 'output'],
// }

// // #endregion command defs
// function getParam_src({ paramName, noBare }: {
//     paramName: string,
//     /**
//      * set to true if you don't want a synonym that is just {@link paramName}
//      * (without a prefix).
//      *
//      * For example, i differentiate between PARAM_INFO_NAME and
//      * PARAM_INFO_SRC_NAME, so on src_name I don't want the bare "name" because
//      * that is in PARAM_INFO_NAME.
//      */
//     noBare?: boolean
// }): RCLIParamInfo {
//     const rcliParam: RCLIParamInfo = {
//         name: `src-${paramName}`,
//         argTypeName: 'string',
//         synonyms: [...PARAM_PREFIXES['src'].map(x => `${x}-${paramName}`),],
//     }
//     if (!noBare) { rcliParam.synonyms!.push(paramName); }
//     return rcliParam;
// }
// function getParam_dest({ paramName }: {
//     paramName: string,
// }): RCLIParamInfo {
//     const rcliParam: RCLIParamInfo = {
//         name: `dest-${paramName}`,
//         argTypeName: 'string',
//         synonyms: [...PARAM_PREFIXES['dest'].map(x => `${x}-${paramName}`),],
//     }
//     return rcliParam;
// }

/**
 * name of the src
 */
export const PARAM_INFO_SRC_NAME = getParam_src({ paramName: 'name', noBare: true });
['src', ...PARAM_PREFIXES['src']].forEach(x => { PARAM_INFO_SRC_NAME.synonyms!.push(x) });
export const PARAM_INFO_SRC_ALIAS = getParam_src({ paramName: 'alias', noBare: false });
export const PARAM_INFO_DEST_ALIAS = getParam_dest({ paramName: 'alias', });
/**
 * used as a general param in various cases when only a single ibgib addr is
 * expected.
 *
 * when fork, use this for srcAddr of ibGib that you're forking
 *
 * when doing --fs --init (atow in progress/not impl), this will reference
 * an existing fs tag, essentially like doing an import.
 */
export const PARAM_INFO_SRC_ADDR = getParam_src({ paramName: 'addr', noBare: false });
/**
 * used as a general param in various cases when executing operations where you
 * have to provide a source and destination and are referencing via ids (as
 * opposed to say, addrs).
 */
export const PARAM_INFO_SRC_ID = getParam_src({ paramName: 'id', noBare: false });
/**
 * used as a general param in various cases when executing operations where you
 * have to provide a source and destination and are referencing via addrs.
 */
export const PARAM_INFO_DEST_ADDR = getParam_dest({ paramName: 'addr', });
/**
 * used as a general param in various cases when executing operations where you
 * have to provide a source and destination and are referencing via ids.
 */
export const PARAM_INFO_DEST_ID = getParam_dest({ paramName: 'id', });
/**
 * used as a general param in various cases when executing operations where you
 * have to provide a source and destination and are referencing via names.
 *
 * this is a special dest param, in that some of the prefixes can be used by
 * themselves, e.g., '--to="some name"'.
 */
export const PARAM_INFO_DEST_NAME: RCLIParamInfo = getParam_dest({ paramName: 'name' });
['dest', ...PARAM_PREFIXES['dest']].forEach(x => { PARAM_INFO_DEST_NAME.synonyms!.push(x) });

// #region param_info for commands

/**
 * inits/bootstraps a local space
 * should be used in conjunction with data-path, output-path
 * @see {@link PARAM_INFO_DATA_PATH}
 * @see {@link PARAM_INFO_OUTPUT_PATH}
 */
export const PARAM_INFO_INIT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.init];
/**
 * execute a fork transform
 *
 * @see {@link TransformOpts_Fork}
 */
export const PARAM_INFO_FORK: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.fork];
/**
 * execute a mut8 transform
 *
 * @see {@link TransformOpts_Mut8}
 */
export const PARAM_INFO_MUT8: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.mut8];
/**
 * execute a rel8 transform
 *
 * @see {@link TransformOpts_Rel8}
 */
export const PARAM_INFO_REL8: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.rel8];
export const PARAM_INFO_QUIT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.quit];
export const PARAM_INFO_CWD: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.cwd];
export const PARAM_INFO_ADD_COMMENT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.add_comment];
export const PARAM_INFO_SECRET: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.secret];
export const PARAM_INFO_ENCRYPTION: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.encryption];
export const PARAM_INFO_SYNC: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.sync];
export const PARAM_INFO_VERSION: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.version];
export const PARAM_INFO_LIST_CHAT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.list_chat];
export const PARAM_INFO_CREATE_STONE: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.create_stone];
/**
 * takes a file in a filesystem that is not an ibgib (with a hash) and reifies
 * it to an ibgib that includes the full ib^gib address with hash.
 *
 * @example if you have a '.ibgibignore' file, then you do not have any kind of
 * metadata/hash associated with that. this will take that file and convert it
 * into an ibgib file.
 */
export const PARAM_INFO_REIFY_FILE: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.reify_file];
export const PARAM_INFO_GENERATE_SOURCE_FILE: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.generate_source_file];
export const PARAM_INFO_INFO: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.info];
/**
 * export an ibgib graph to a single file (or group of files/compressed file?)
 */
export const PARAM_INFO_EXPORT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.export];
/**
 * import an ibgib graph from a single file (or group of files/compressed file?)
 * that was created via an export.
 */
export const PARAM_INFO_IMPORT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.import];
export const PARAM_INFO_SPACE: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.space];

export const PARAM_INFO_B2TFS_INIT: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_init];
export const PARAM_INFO_B2TFS_BRANCH: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_branch];
export const PARAM_INFO_B2TFS_ACTIVATE_BRANCH: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_activate_branch];
export const PARAM_INFO_B2TFS_INFO: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_info];
export const PARAM_INFO_B2TFS_DIFF: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_diff];
export const PARAM_INFO_B2TFS_SYNC: RCLIParamInfo = RCLI_COMMAND_PARAM_INFOS[BlankCanvasCommand.b2tfs_sync];

// #endregion param_info for commands

/**
 * we want this just to be a known flag so that we don't throw an error when we
 * see this. rcli will not directly use this, but it will be used for debugging.
 */
export const PARAM_INFO_INSPECT: RCLIParamInfo = {
    name: 'inspect',
    isFlag: true,
    synonyms: ['inspect-brk'],
    argTypeName: 'boolean',
};

// #region ibgib params


/**
 * when fork, use for "destIb"
 * when mut8, use for "mut8Ib"
 */
export const PARAM_INFO_IB: RCLIParamInfo = {
    name: 'ib',
    argTypeName: 'string',
};

/**
 * when rel8, use multiple of these for addrs
 *
 * the value should contain both rel8nName and addr with double vertical bar
 * delimiter.
 *
 * @example --+addr="comment||abc^123hash"
 */
export const PARAM_INFO_ADD_ADDR: RCLIParamInfo = {
    name: 'add-addr',
    argTypeName: 'string',
    allowMultiple: true,
    synonyms: ['+addr', '+@'],
};

/**
 * when rel8, use multiple of these for addrs to remove (unrel8)
 */
export const PARAM_INFO_RM_ADDR: RCLIParamInfo = {
    name: 'rm-addr',
    argTypeName: 'string',
    allowMultiple: true,
    synonyms: ['-addr', '-@'],
};

/**
 * tjp defaults to both uuid and timestamp.
 *
 * if one of this param is provided, this will be used **exclusively**. So if
 * you pass ing tjp="uuid", then the timestamp tjp will be falsy.
 *
 * @param {('uuid'|'timestamp'|'none')}
 */
export const PARAM_INFO_TJP: RCLIParamInfo = {
    name: 'tjp',
    argTypeName: 'string',
};

/**
 * specifies a "special" ibgib (usually an index). if is an empty string, will
 * return the meta special ibgib (index of special ibgibs).
 *
 * used in conjunction with
 * * {@link PARAM_INFO_INFO}
 */
export const PARAM_INFO_SPECIAL: RCLIParamInfo = {
    name: 'special',
    argTypeName: 'boolean',
    synonyms: [],
    allowMultiple: false,
    description: `specifies a "special" ibgib (usually an index).`,
    isFlag: true,
};

/**
 * flag that indicates when forking, the parent's data should be cloned.
 */
export const PARAM_INFO_CLONE_DATA: RCLIParamInfo = {
    name: 'clone-data',
    isFlag: true,
    argTypeName: 'boolean',
};
/**
 * flag that indicates when forking, the parent's rel8ns should be cloned.
 */
export const PARAM_INFO_CLONE_REL8NS: RCLIParamInfo = {
    name: 'clone-rel8ns',
    isFlag: true,
    argTypeName: 'boolean',
};

/**
 * json string for data key(s) to rename
 */
export const PARAM_INFO_DATA_TO_RENAME: RCLIParamInfo = {
    name: 'data-to-rename',
    argTypeName: 'string',
    synonyms: ['rename-data'],
};
/**
 * json string for data key(s) to remove
 */
export const PARAM_INFO_DATA_TO_REMOVE: RCLIParamInfo = {
    name: 'data-to-remove',
    argTypeName: 'string',
    synonyms: ['remove-data'],
};
/**
 * json string for data to add/patch when mut8ing
 */
export const PARAM_INFO_DATA_TO_ADD_OR_PATCH: RCLIParamInfo = {
    name: 'data-to-add-or-patch',
    argTypeName: 'string',
    synonyms: ['+data', 'add-data', 'patch-data'],
};
/**
 * json string for rel8ns to add options object
 */
export const PARAM_INFO_REL8NS_TO_ADD: RCLIParamInfo = {
    name: 'rel8ns-to-add',
    argTypeName: 'string',
    synonyms: ['+rel8ns', 'add-rel8ns', 'rel8ns-to-add-by-addr'],
};
/**
 * json string for rel8ns to remove options object
 */
export const PARAM_INFO_REL8NS_TO_REMOVE: RCLIParamInfo = {
    name: 'rel8ns-to-remove',
    argTypeName: 'string',
    synonyms: ['-rel8ns', 'remove-rel8ns', 'rm-rel8ns', 'rel8ns-to-remove-by-addr'],
};

/**
 * used when creating comments with comment command
 */
export const PARAM_INFO_TEXT: RCLIParamInfo = {
    name: 'text',
    synonyms: ['txt', 'message', 'm', 'msg'],
    argTypeName: 'string',
};

// #endregion ibgib params

/**
 * @todo
 * path to resolve the bootstrap ibgib.
 *
 * this can be used to use a specific file or a directory to use in
 * conjunction with the default bootstrap filename (bootstrap ibgib addr "bootstrap^gib").
 *
 * @see {@link BOOTSTRAP_IBGIB_ADDR}
 */
export const PARAM_INFO_BOOTSTRAP_PATH: RCLIParamInfo = {
    name: 'bootstrap-path',
    argTypeName: 'string',
};

/**
 * when using `--init`, this name will be used for the initialized space. if
 * this is not provided, the rcli will prompt the user for a space name.
 *
 * when using `--interactive`, this specifies space by name
 */
export const PARAM_INFO_SPACE_NAME: RCLIParamInfo = {
    name: 'space-name',
    argTypeName: 'string',
    allowMultiple: false,
};

/**
 * when using `--interactive`, this specifies space by id
 * when b2tfs, this can specify the space to act on/look in.
 */
export const PARAM_INFO_SPACE_ID: RCLIParamInfo = {
    name: 'space-id',
    argTypeName: 'string',
    allowMultiple: false,
};

/**
 * space id used to initialize the metaspace's local user space.
 *
 * note that this is not the id of the actual metaspace (which doesn't have an
 * id) but rather points to the local space that the metaspace will use.
 *
 * using this to differentiate from just bare --space-id which is used in
 * various commands.
 */
export const PARAM_INFO_LOCAL_SPACE_ID: RCLIParamInfo = {
    name: 'local-space-id',
    argTypeName: 'string',
    synonyms: ['context-space-id'],
    allowMultiple: false,
};

/**
 * space name used to initialize the metaspace's local user space.
 *
 * note that this is not the name of the actual metaspace (which doesn't have an
 * name) but rather points to the local space that the metaspace will use.
 *
 * using this to differentiate from just bare --name which is used in
 * various commands.
 */
export const PARAM_INFO_LOCAL_SPACE_NAME: RCLIParamInfo = {
    name: 'local-space-name',
    argTypeName: 'string',
    synonyms: ['context-space-name'],
    allowMultiple: false,
};

/**
 * space id used to identify an outer space.
 *
 * for now, `allowMultiple` is false. this is because i'm simplifying the
 * process of syncing to artificially restrict to one outer (sync) space. in the
 * future, this should be able to synchronize among more than 2 spaces.
 */
export const PARAM_INFO_OUTER_SPACE_ID: RCLIParamInfo = {
    name: 'outer-space-id',
    argTypeName: 'string',
    synonyms: ['sync-space-id', 'remote-id'],
    allowMultiple: false,
};

/**
 * space name used to initialize the metaspace's local user space.
 *
 * note that this is not the name of the actual metaspace (which doesn't have an
 * name) but rather points to the local space that the metaspace will use.
 *
 * using this to differentiate from just bare --name which is used in
 * various commands.
 */
export const PARAM_INFO_OUTER_SPACE_NAME: RCLIParamInfo = {
    name: 'outer-space-name',
    argTypeName: 'string',
    synonyms: ['sync-space-name', 'remote-name', 'remote'],
    allowMultiple: false,
};

/**
 * specify an app id for a cmd
 */
export const PARAM_INFO_APP_ID: RCLIParamInfo = {
    name: 'app-id',
    argTypeName: 'string',
    allowMultiple: false,
};

// commenting this out because I'm just going to put all of this into a "details"
// file with a shape that contains the information. the point is to consume with
// something like `ibgib --sync --add --input-file=space-details.json`
// will default to the default local user space
/**
 * only value atow (02/2024)
 * 'sync'
 *
 * in the future, we may have...
 *
 * * 'push' space
 *   * don't worry about timelines with multiple branching paths, it's
 *     last-one-wins
 *   * similar to a dendrite?
 * * 'connector' space
 *   * acts as a proxy that connects to another outerspace.
 *   * provides a layer of indirection
 *   * similar to an axon?
 * * something else...
 *   * the point is that we're communicating from a local, relatively fast space
 *     to a foreign, relatively latent space.
 */
export const PARAM_INFO_SPACE_TYPE: RCLIParamInfo = {
    name: 'space-type',
    argTypeName: 'string',
    synonyms: [],
    allowMultiple: false,
    description: 'specifies the broad category of a space, i.e., how it functions. atow this can be "user", "outer", "inner"',
};

/**
 * arg to specify a space subtype (concrete implementation)
 *
 * atow (02/2024), valid values:
 *
 * 'aws-dynamodb'
 *
 * @see {@link SpaceSubtype}
 *
 * ## intent
 *
 * when we sync with a cloud outerspace (this is similar to a remote node or
 * network drive), this specifies the sync subtype (adapter) to use.
 */
export const PARAM_INFO_SPACE_SUBTYPE: RCLIParamInfo = {
    name: 'space-subtype',
    argTypeName: 'string',
    synonyms: [],
    allowMultiple: false,
};

/**
 * atow (02/2024) only 'password' is implemented.
 */
export const PARAM_INFO_SECRET_TYPE: RCLIParamInfo = {
    name: 'secret-type',
    argTypeName: 'string',
    synonyms: [],
    allowMultiple: false,
    description: `Specifies the type of secret. ATOW (02/2024) this is only 'password'.`
};

/**
 * for selecting a secret via the name. if more than one secret has the same name, this
 * will not be enough
 */
export const PARAM_INFO_SECRET_NAME: RCLIParamInfo = {
    name: 'secret-name',
    argTypeName: 'string',
    synonyms: [],
    allowMultiple: false,
    description: `Specifies the name of secret.`
};
/**
 * for reading a secret from a file instead of prompting the user.
 */
export const PARAM_INFO_SECRET_INPUT_PATH: RCLIParamInfo = {
    name: 'secret-input-path',
    argTypeName: 'string',
    synonyms: ['secret-path', 'secret-input', 'secret-file'],
    allowMultiple: false,
    description: `Specifies the path to a secret's contents that avoids needing to prompt for the secret.`
};

/**
 * making this for encryption method, but right now it seems like i can just
 * reuse it for others as well without worrying too much about overlap.
 *
 * atow (02/2024) only 'encrypt-gib' for encryption is implemented.
 */
export const PARAM_INFO_METHOD: RCLIParamInfo = {
    name: 'method',
    argTypeName: 'string',
    synonyms: ['encryption-method'],
    allowMultiple: false,
    description: `Specifies a method. ATOW (02/2024) this is only for encryption, and specifically one value: 'encrypt-gib'.`
};

/**
 * name specifier for encryption (configuration) ibgib. use this for specifying
 * an encryption configuration to be associated with an operation.
 */
export const PARAM_INFO_ENCRYPTION_NAME: RCLIParamInfo = {
    name: 'encryption-name',
    argTypeName: 'string',
    synonyms: [],
    allowMultiple: false,
    description: `name specifier for encryption (configuration) ibgib. use this for specifying an encryption configuration to be associated with an operation.`,
};

/**
 * flag to indicate if, e.g. when getting an ibgib, we want to get the latest in
 * the timeline.
 */
export const PARAM_INFO_LATEST: RCLIParamInfo = {
    name: 'latest',
    argTypeName: 'boolean',
    synonyms: ['latest-only', 'live'],
    isFlag: true,
};

/**
 * flag to indicate to use an aws-dynamodb sync space
 */
export const PARAM_INFO_AWS_DYNAMODB_SYNC_SPACE: RCLIParamInfo = {
    name: 'aws-dynamodb',
    argTypeName: 'boolean',
    synonyms: ['aws-dynamodb-s3'],
    isFlag: true,
    description: 'flag to indicate the aws dynamodb sync space is selected. this also uses s3 for binaries/large ibgibs.',
};

/**
 * @todo
 * when creating an ibgib, if we want to make it private, i.e. encrypt,
 * use this flag
 *
 * should be used in conjunction with data-path/data-string, output-path
 */
export const PARAM_INFO_PRIVATE: RCLIParamInfo = {
    name: 'private',
    isFlag: true,
    argTypeName: 'boolean',
};

/**
 * create a temporary in-memory space for ibgibs.
 * i.e., don't store anything on disk.
 */
export const PARAM_INFO_IN_MEMORY: RCLIParamInfo = {
    name: 'in-memory',
    isFlag: true,
    argTypeName: 'boolean',
};

/**
 * if true, start a repl.
 */
export const PARAM_INFO_INTERACTIVE: RCLIParamInfo = {
    name: 'interactive',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['repl'],
};

/**
 * specify encoding for a non-binary file.
 *
 * @see {@link PARAM_INFO_BINARY}
 */
export const PARAM_INFO_FILE_ENCODING: RCLIParamInfo = {
    name: 'file-encoding',
    argTypeName: 'string',
    synonyms: ['encoding', 'text-encoding'],
};

/**
 * flag to indicate if pretty print
 */
export const PARAM_INFO_PRETTY: RCLIParamInfo = {
    name: 'pretty',
    description: 'flag to indicate if pretty print output',
    argTypeName: 'boolean',
    synonyms: ['pretty-print'],
    isFlag: true,
};

/**
 * flag to indicate if verbose wordy lots of stuff
 */
export const PARAM_INFO_VERBOSE: RCLIParamInfo = {
    name: 'verbose',
    description: 'flag to indicate if verbose wordy lots of stuff',
    argTypeName: 'boolean',
    synonyms: [],
    isFlag: true,
};

/**
 * flag to indicate if eligible confirm(s) are auto-answered as "yes".
 */
export const PARAM_INFO_YES: RCLIParamInfo = {
    name: 'yes',
    description: 'flag to indicate if eligible confirm(s) are auto-answered as "yes"',
    argTypeName: 'boolean',
    synonyms: ['auto-yes'],
    isFlag: true,
};

/**
 * used when creating new ibgibs.
 *
 * ## driving use case
 *
 * creating a new SecretIbGib_V1, but really I should have this is more
 * commands.
 */
export const PARAM_INFO_DESCRIPTION: RCLIParamInfo = {
    name: 'description',
    synonyms: ['desc'],
    argTypeName: 'string',
    description: 'It\'s a description...self-explanatory really.',
};

/**
 * used when creating new ibgibs.
 *
 * ## driving use case
 *
 * creating a new SecretIbGib_V1, but really I should have this is more
 * commands.
 */
export const PARAM_INFO_HINT: RCLIParamInfo = {
    name: 'hint',
    synonyms: [],
    argTypeName: 'string',
    description: 'Hints are used in things like secrets, where you want to provide some minor context.',
};

/**
 * if true, the command should treat a file/whatever as being binary.
 *
 * @see {@link PARAM_INFO_REIFY_FILE}
 */
export const PARAM_INFO_BINARY: RCLIParamInfo = {
    name: 'binary',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['is-binary'],
};

/**
 * boolean flag to indicate the output/whatever is a witness.
 *
 * i'm making this for * {@link PARAM_INFO_GENERATE_SOURCE_FILE}
 */
export const PARAM_INFO_WITNESS: RCLIParamInfo = {
    name: 'witness',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['is-witness', 'basic-witness'],
};

/**
 * boolean flag to indicate the output/whatever is specifically an app witness.
 *
 * i'm making this for * {@link PARAM_INFO_GENERATE_SOURCE_FILE}
 */
export const PARAM_INFO_APP: RCLIParamInfo = {
    name: 'app',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['is-app'],
};

/**
 * boolean flag to indicate the output/whatever is specifically a robbot
 * witness.
 *
 * i'm making this for * {@link PARAM_INFO_GENERATE_SOURCE_FILE}
 */
export const PARAM_INFO_ROBBOT: RCLIParamInfo = {
    name: 'robbot',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['is-robbot'],
};

/**
 * if true, skip doing respec unit tests
 *
 * ## use case
 *
 * i'm making this for * {@link PARAM_INFO_GENERATE_SOURCE_FILE}
 */
export const PARAM_INFO_NO_RESPEC: RCLIParamInfo = {
    name: 'no-respec',
    isFlag: true,
    argTypeName: 'boolean',
    synonyms: ['no-spec', 'no-specs', 'no-test', 'no-tests'],
};

/**
 * flag to indicate if we want to apply during some command.
 *
 * kind of the opposite of a dry-run.
 *
 * ## intent
 *
 * I'm making this for B2tFS diff. so when this flag is true, the diff should be
 * applied.
 */
export const PARAM_INFO_APPLY: RCLIParamInfo = {
    name: 'apply',
    argTypeName: 'boolean',
    synonyms: ['apply-cmd', 'apply-diff', 'apply-changes'],
    isFlag: true,
};

/**
 * flag to indicate if we want to keep output to a minimum.
 *
 * the opposite of verbose.
 *
 * ## intent
 *
 * I'm making this for B2tFS diff. so when this flag is true, the diff should
 * just show files/folders changed.
 */
export const PARAM_INFO_BRIEF: RCLIParamInfo = {
    name: 'brief',
    argTypeName: 'boolean',
    synonyms: [],
    isFlag: true,
};

/**
 * flag to indicate if we want to add during some command.
 *
 * ## intent
 *
 * I'm making this for B2tFS branch. so when this flag is true, the cmd should
 * be adding a branh.
 */
export const PARAM_INFO_ADD: RCLIParamInfo = {
    name: 'add',
    description: 'adds something...not necessarily new, yada yada, todo here.',
    argTypeName: 'boolean',
    synonyms: [],
    isFlag: true,
};

/**
 * flag to indicate if we want to only do the fs (files/folders).
 *
 * ## intent
 *
 * I'm making this for B2tFS branch command similar to an export. so when this
 * flag is true, the cmd should only be snapshotting the files/folders into the
 * target folder and not copying the .ibgib folder.
 */
export const PARAM_INFO_FS_ONLY: RCLIParamInfo = {
    name: 'fs-only',
    description: 'only do the fs-side of things (not the ibgibs).',
    argTypeName: 'boolean',
    synonyms: ['files-only', 'files'],
    isFlag: true,
};

/**
 * ## driving intent
 *
 * import - force import even if existing timeline
 */
export const PARAM_INFO_FORCE: RCLIParamInfo = {
    name: 'force',
    description: 'override some setting',
    argTypeName: 'boolean',
    synonyms: [],
    isFlag: true,
};

/**
 * ## driving intent
 *
 * add/mut8 secret password
 */
export const PARAM_INFO_PROMPT: RCLIParamInfo = {
    name: 'prompt',
    description: 'prompt for some data, e.g., if entering a password',
    argTypeName: 'boolean',
    synonyms: ['prompt-me', 'ask', 'ask-me'],
    isFlag: true,
};

export const PARAM_INFO_MOVE: RCLIParamInfo = {
    name: 'move',
    argTypeName: 'string',
    synonyms: ['mv'],
    isFlag: true,
    description: 'Common use case is to move something. This is being created specifically for moving a branch.',
};

/**
 * customize the imported common param infos here:
 * * add documentation/description specific to this project's use case
 */
const CUSTOMIZED_COMMON_PARAM_INFOS = clone(COMMON_PARAM_INFOS) as RCLIParamInfo[];
CUSTOMIZED_COMMON_PARAM_INFOS.forEach(x => {
    // for example, this is the code atow (11/2024) for @ibgib/ibgib rcli init
    //     if (x.name === PARAM_INFO_NAME.name) {
    //         const gSrcDesc = `PARAM_INFO_GENERATE_SOURCE_FILE
    // * name will be used as folder generated, as well as generated files, ibgib/data/rel8n/witness/class types.
    // * will automatically be converted to various casings
    //   (camelCase,PascalCase,hyphenated-case,snake_case, etc.) depending on where name is used.
    //   * e.g. camelCase for params/vars, PascalCase for class names, hyphenated-case for filenames, etc.
    // `;
    //         x.description += gSrcDesc;
    //     }
});

/**
 * Array of all parameters this library's RCLI supports.
 */
export const PARAM_INFOS: RCLIParamInfo[] = [
    ...CUSTOMIZED_COMMON_PARAM_INFOS,
    // atow... 11/2023
    // PARAM_INFO_BARE,
    // PARAM_INFO_HELP,
    // PARAM_INFO_DRY_RUN,
    // PARAM_INFO_DATA_PATH,
    // PARAM_INFO_INPUT_PATH,
    // PARAM_INFO_OUTPUT_PATH,
    // PARAM_INFO_DATA_STRING,
    // PARAM_INFO_DATA_INTEGER,
    // PARAM_INFO_DATA_BOOLEAN,
    // PARAM_INFO_NAME,
    //  * i'm adding this for {@link PARAM_INFO_GENERATE_SOURCE_FILE}, but should be
    //  * reusable. used for when you have a name. need to move this into the base lib
    //  * at some point.

    // ...ENCRYPT_GIB_PARAM_INFOS, // also includes common constants from helper-gib
    PARAM_INFO_ENCRYPT,
    PARAM_INFO_DECRYPT,
    // PARAM_INFO_STRENGTH,
    PARAM_INFO_SALT,
    PARAM_INFO_INDEXING_MODE,
    PARAM_INFO_BLOCKMODE_FLAG,
    PARAM_INFO_BLOCKMODE_BLOCK_SIZE,
    PARAM_INFO_BLOCKMODE_NUM_OF_PASSES,
    PARAM_INFO_HASH_ALGORITHM,
    PARAM_INFO_SALT_STRATEGY,
    PARAM_INFO_INITIAL_RECURSIONS,
    PARAM_INFO_RECURSIONS_PER_HASH,


    // command flags
    PARAM_INFO_INIT,
    PARAM_INFO_FORK,
    PARAM_INFO_MUT8,
    PARAM_INFO_REL8,
    PARAM_INFO_QUIT,
    PARAM_INFO_CWD,
    PARAM_INFO_ADD_COMMENT,
    PARAM_INFO_SECRET,
    PARAM_INFO_ENCRYPTION,
    PARAM_INFO_SYNC,
    PARAM_INFO_VERSION,
    PARAM_INFO_LIST_CHAT,
    PARAM_INFO_CREATE_STONE,
    PARAM_INFO_REIFY_FILE,
    PARAM_INFO_GENERATE_SOURCE_FILE,
    PARAM_INFO_INFO,
    PARAM_INFO_EXPORT,
    PARAM_INFO_IMPORT,
    PARAM_INFO_SPACE,

    // B2tFS
    PARAM_INFO_B2TFS_INIT, // command
    PARAM_INFO_B2TFS_BRANCH, // command
    PARAM_INFO_B2TFS_ACTIVATE_BRANCH, // command
    PARAM_INFO_B2TFS_INFO, // command
    PARAM_INFO_B2TFS_DIFF, // command
    PARAM_INFO_B2TFS_SYNC, // command

    // other flags
    PARAM_INFO_IN_MEMORY,
    PARAM_INFO_INTERACTIVE,
    PARAM_INFO_BINARY,
    PARAM_INFO_WITNESS,
    PARAM_INFO_APP,
    PARAM_INFO_NO_RESPEC,
    PARAM_INFO_APPLY,
    PARAM_INFO_BRIEF,
    PARAM_INFO_ADD,
    PARAM_INFO_FS_ONLY,
    PARAM_INFO_FORCE,
    PARAM_INFO_PROMPT,
    PARAM_INFO_MOVE,

    // ibgib
    PARAM_INFO_SRC_NAME,
    PARAM_INFO_SRC_ADDR,
    PARAM_INFO_DEST_ADDR,
    PARAM_INFO_IB,
    PARAM_INFO_ADD_ADDR,
    PARAM_INFO_RM_ADDR,
    PARAM_INFO_TEXT,
    PARAM_INFO_SPACE_NAME,
    PARAM_INFO_SPACE_ID,
    PARAM_INFO_LOCAL_SPACE_NAME,
    PARAM_INFO_LOCAL_SPACE_ID,
    PARAM_INFO_OUTER_SPACE_NAME,
    PARAM_INFO_OUTER_SPACE_ID,
    PARAM_INFO_APP_ID,
    PARAM_INFO_SPACE_TYPE,
    PARAM_INFO_SPACE_SUBTYPE,
    PARAM_INFO_SECRET_TYPE,
    PARAM_INFO_SECRET_NAME,
    PARAM_INFO_SECRET_INPUT_PATH,
    PARAM_INFO_METHOD,
    PARAM_INFO_ENCRYPTION_NAME,
    PARAM_INFO_TJP,
    PARAM_INFO_SPECIAL,

    // IBGIB FLAGS
    PARAM_INFO_CLONE_DATA,
    PARAM_INFO_CLONE_REL8NS,
    PARAM_INFO_DATA_TO_RENAME,
    PARAM_INFO_DATA_TO_REMOVE,
    PARAM_INFO_DATA_TO_ADD_OR_PATCH,
    PARAM_INFO_REL8NS_TO_ADD,
    PARAM_INFO_REL8NS_TO_REMOVE,
    PARAM_INFO_LATEST,
    PARAM_INFO_AWS_DYNAMODB_SYNC_SPACE,

    // other
    PARAM_INFO_SRC_ID,
    PARAM_INFO_DEST_ID,
    PARAM_INFO_DEST_NAME,
    PARAM_INFO_BOOTSTRAP_PATH,
    PARAM_INFO_FILE_ENCODING,
    PARAM_INFO_PRETTY,
    PARAM_INFO_VERBOSE,
    PARAM_INFO_YES,
    PARAM_INFO_DESCRIPTION,
    PARAM_INFO_HINT,

    // meta
    PARAM_INFO_INSPECT,
];

// #endregion param info related

/**
 * if the user says `spaceId=${DEFAULT_LOCAL_USER_SPACE_VAR}` in a command parameter, then
 * the default local user space will be used.
 */
export const DEFAULT_LOCAL_USER_SPACE_VAR = '.';
