// /**
//  * @module node-filesystem-space-types
//  *
//  * mostly interfaces, some constants
//  */

// import { IbGibRel8ns_V1, } from '@ibgib/ts-gib/dist/V1/index.mjs';

// // import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
// import { INDEXED_DB_LONG_PATH_LENGTH } from './web-filesystem-space-constants.mjs';
// import { FilesystemSpaceData_V1, FilesystemSpaceOptionsData, FilesystemSpaceOptionsIbGib, FilesystemSpaceOptionsRel8ns, FilesystemSpaceResultData, FilesystemSpaceResultIbGib, FilesystemSpaceResultRel8ns } from '@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-space-v1.mjs';
// import { DEFAULT_LOCAL_SPACE_POLLING_INTERVAL_MS, IBGIB_SPACE_NAME_DEFAULT, ZERO_SPACE_ID } from '@ibgib/core-gib/dist/witness/space/space-constants.mjs';
// import { DEFAULT_FILESYSTEM_SPACE_DESCRIPTION, IBGIB_BASE_DIR, IBGIB_BASE_SUBPATH, IBGIB_BIN_SUBPATH, IBGIB_DNA_SUBPATH, IBGIB_ENCODING, IBGIB_IBGIBS_SUBPATH, IBGIB_LONG_SUBPATH, IBGIB_META_SUBPATH, IBGIB_SPACE_SUBPATH_DEFAULT } from '@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-constants.mjs';
// import { BLANK_GIB_DB_NAME } from '../../../constants.mjs';


// /**
//  * This is the shape of data about this space itself (not the contained ibgibs' spaces).
//  */
// export interface WebFilesystemSpaceData_V1 extends FilesystemSpaceData_V1 {
// }

// /**
//  * Used in bootstrapping.
//  *
//  * If you change this, please bump the version
//  *
//  * (but of course won't be the end of the world when this doesn't happen).
//  *
//  * ## notes
//  *
//  * This is a terrible kluge port from NodeFilesystemSpaceData_V1. I am just
//  * moving "as fast as I can" (I can't move fast these days). Little of the
//  * filesystem internal details reallly matter I think, as this is just meant to
//  * be a local space living on indexeddb. The main thing is segregation of local
//  * spaces from each other, but I think this is covered to begin with via the
//  * space name used in the path somewhere.
//  */
// export const DEFAULT_WEB_FILESYSTEM_SPACE_DATA_V1: WebFilesystemSpaceData_V1 = {
//     version: '1',
//     uuid: ZERO_SPACE_ID,
//     name: IBGIB_SPACE_NAME_DEFAULT,
//     classname: 'WebFilesystemSpace_V1',
//     // baseDir: IBGIB_BASE_DIR,
//     /**
//      * I'm considering atow (12/6/2024) using this baseDir as the db name, and
//      * the spaceId as the store. To effect this, the writeFile will use the two
//      * lowest directories as the db & store names, e.g.,
//      *
//      *   blank^gib/[spaceId]/[other unnecessary paths from node port]/ib^gibaddr
//      *
//      * (This path will be spliced when "writing the file path".)
//      *
//      * So the db name is blank^gib, the store name is the spaceId. The other
//      * parts of the path are vestigial from node implementation, just as long as
//      * it resolves down to the right ibgib addr consistently. If something
//      * requires listing other spaces, then the indexed db.stores I think allows
//      * for this.
//      */
//     baseDir: BLANK_GIB_DB_NAME,
//     encoding: IBGIB_ENCODING,
//     baseSubPath: IBGIB_BASE_SUBPATH,
//     spaceSubPath: IBGIB_SPACE_SUBPATH_DEFAULT,
//     ibgibsSubPath: IBGIB_IBGIBS_SUBPATH,
//     metaSubPath: IBGIB_META_SUBPATH,
//     binSubPath: IBGIB_BIN_SUBPATH,
//     dnaSubPath: IBGIB_DNA_SUBPATH,
//     longSubPath: IBGIB_LONG_SUBPATH,
//     mitigateLongPaths: false,
//     longPathLength: INDEXED_DB_LONG_PATH_LENGTH,
//     persistOptsAndResultIbGibs: false,
//     validateIbGibAddrsMatchIbGibs: false,
//     longPollingIntervalMs: DEFAULT_LOCAL_SPACE_POLLING_INTERVAL_MS,
//     allowPrimitiveArgs: false,
//     catchAllErrors: true,
//     description: DEFAULT_FILESYSTEM_SPACE_DESCRIPTION,
//     trace: false,
// }

// /** Marker interface atm */
// export interface WebFilesystemSpaceRel8ns_V1 extends IbGibRel8ns_V1 { }

// /**
//  * Space options involve whether we're getting/putting ibgibs categorized as
//  * meta, bin, dna.
//  *
//  * We'll leverage the fact that we don't need to get dna very often, and that
//  * meta ibgibs act differently and are recorded differently.
//  *
//  * For example, we don't necessarily want to keep the past of certain meta
//  * objects, because it may change (and thus grow) too quickly.
//  */
// export interface WebFilesystemSpaceOptionsData extends FilesystemSpaceOptionsData {
// }

// export interface WebFilesystemSpaceOptionsRel8ns extends FilesystemSpaceOptionsRel8ns {
// }

// /** Marker interface atm */
// export interface WebFilesystemSpaceOptionsIbGib
//     extends FilesystemSpaceOptionsIbGib<WebFilesystemSpaceOptionsData, WebFilesystemSpaceOptionsRel8ns> {
// }

// /** Marker interface atm */
// export interface WebFilesystemSpaceResultData extends FilesystemSpaceResultData {
// }

// export interface WebFilesystemSpaceResultRel8ns extends FilesystemSpaceResultRel8ns {
// }

// export interface WebFilesystemSpaceResultIbGib
//     extends FilesystemSpaceResultIbGib<WebFilesystemSpaceResultData, WebFilesystemSpaceResultRel8ns> {
// }
// /**
//  * currently i'm just taking this from the definition of node's `Buffer` type.
//  *
//  * ## notes
//  *
//  * * using this with handle-reify-file.mts when reading the file.
//  * * 'binary' may resolve to 'latin1' per SO
//  *   * https://stackoverflow.com/questions/46441667/reading-binary-data-in-node-js
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

// export interface FileDataInfo {
//     inputPath: string;
//     detectedEncoding?: FileEncoding | undefined;
//     dataString?: string | undefined;
//     dataBuffer?: Uint8Array | undefined;
// }
// export const B2TFS_DEFAULT_ENCODINGS_TO_TRY: (FileEncoding | undefined)[] = [
//     FileEncoding.utf8,
//     FileEncoding.utf16le,
//     FileEncoding.base64,
//     FileEncoding.binary,
//     undefined,
// ];
