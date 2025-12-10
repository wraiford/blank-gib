// /**
//  * @module web-filesystem-space-helper
//  */

// import { extractErrorMsg, pretty, unique, } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { IbGibAddr } from '@ibgib/ts-gib/dist/types.mjs';
// import { getIbAndGib, } from '@ibgib/ts-gib/dist/helper.mjs';
// import { GIB, } from '@ibgib/ts-gib/dist/V1/index.mjs';
// import { validateIbGibIntrinsically } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
// import { parseSpaceIb } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';
// import { SPACE_NAME_REGEXP } from '@ibgib/core-gib/dist/witness/space/space-constants.mjs';
// import { storageGet, storagePut, storageReaddir, storageRmRF, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
// import { Dirent } from "@ibgib/web-gib/dist/storage/storage-types.web.mjs";

// import { BLANK_GIB_DB_NAME, GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
// import { WebFilesystemSpace_V1 } from './web-filesystem-space-v1.mjs';
// import { B2TFS_DEFAULT_ENCODINGS_TO_TRY, FILE_ENCODINGS, FileDataInfo, FileEncoding } from './web-filesystem-space-types.mjs';
// import { PathUtilsHelper, uint8ArrayToString } from '../../../helpers.web.mjs';

// const logalot = GLOBAL_LOG_A_LOT;
// const pathUtils = new PathUtilsHelper();

// /**
//  * tries to read the given path. if fails **FOR ANY REASON**, @returns `null`.
//  *
//  * does not throw
//  *
//  * @returns file contents as string or `null`
//  */
// export async function tryRead({
//     path,
//     directory,
//     encoding,
// }: {
//     path: string,
//     directory: string,
//     encoding: string,
// }): Promise<string | Uint8Array | null> {
//     const lc = `[${tryRead.name}]`;
//     try {
//         if (logalot) {
//             console.log(`${lc} starting...`);
//             // console.log(`${lc} cwd: ${cwd()}`);
//             if (path.includes('bootstrap^gib') || path.includes('gib/bootstrap.json')) { console.log(`${lc} trying bootstrap^gib... (I: cde10726c55737e5c5a2e0a66a188e24)`); }
//         }
//         const fullPath = pathUtils.join(directory, path);
//         if (logalot) { console.log(`${lc} fullPath: ${fullPath} (I: e5cfdd62247c6ba05dffb64d8f25d424)`); }
//         encoding ||= 'utf8';
//         let resRead: string | undefined = undefined;

//         let resRead_uncasted = await readFile(fullPath, { encoding });
//         if (resRead_uncasted instanceof Uint8Array) {
//             resRead = uint8ArrayToString(resRead_uncasted);
//         } else if (typeof resRead_uncasted === 'string') {
//             resRead = resRead_uncasted;
//         }

//         if (logalot) {
//             console.log(`${lc} record found. data length: ${resRead?.length ?? 0}. fullPath: ${fullPath}. console.dir(resRead)... (I: be5cfbf04874b4e8e4787ad966cb8424)`);
//             console.dir(resRead)
//         }
//         return resRead ?? null;
//     } catch (error) {
//         if (logalot) { console.log(`${lc} fullPath not found from directory (${directory}) and path (${path})\nerror:\n${extractErrorMsg(error)} (I: 8f93e583c048fac0682f55ca74df0324)`); }
//         return null;
//     } finally {
//         if (logalot) { console.log(`${lc} complete. (I: 22a6958aee350e4d99b76057ec8b9224)`); }
//     }
// }

// export async function tryRead_bin({
//     path,
//     directory,
//     encoding,
// }: {
//     path: string,
//     directory: string,
//     encoding: string,
// }): Promise<FileDataInfo | null> {
//     const lc = `[${tryRead_bin.name}]`;
//     try {
//         if (logalot) {
//             console.log(`${lc} starting...`);
//             // console.log(`${lc} cwd: ${cwd()}`);
//             if (path.includes('bootstrap^gib')) { console.log(`${lc} trying bootstrap^gib... (I: acdb59d399ca16c45456392d935c0524)`); }
//         }
//         const fullPath = pathUtils.join(directory, path);
//         if (logalot) { console.log(`${lc} fullPath: ${fullPath} (I: abef0200a4b823b446713349ca102924)`); }
//         encoding ||= 'utf8';
//         let resRead: string | Uint8Array | undefined = undefined;
//         let encodingsToTry: FileEncoding[] = unique<FileEncoding>([
//             encoding as FileEncoding,
//             ...FILE_ENCODINGS,
//         ]);
//         let { dataBuffer, dataString, inputPath, detectedEncoding } = await getFileDataAndEncoding({
//             inputPath: path,
//             encodingsToTry,
//         });
//         if (!dataBuffer) { throw new Error(`getFileDataAndEncoding yielded falsy dataBuffer (E: f748ffc8c71c92be06a3566102ba8e24)`); }
//         resRead = dataBuffer;

//         if (logalot) {
//             console.log(`${lc} record found. data length: ${resRead?.length ?? 0}. fullPath: ${fullPath}. console.dir(resRead)... (I: b0c1da7e3849edd3edef899d74b21a24)`);
//             console.dir(resRead)
//         }

//         return {
//             dataBuffer, dataString, inputPath, detectedEncoding
//         };
//     } catch (error) {
//         if (logalot) { console.log(`${lc} fullPath not found from directory (${directory}) and path (${path})\nerror:\n${extractErrorMsg(error)} (I: 04b11599387ab37adf2b18a5f767cd24)`); }
//         return null;
//     } finally {
//         if (logalot) { console.log(`${lc} complete. (I: baa1e9d18134bc451b56bb5a56150824)`); }
//     }
// }

// /**
//  * basic validation for a web fs space ibgib
//  */
// export async function validateWebFilesystemSpace_V1Intrinsically({ space }: { space: WebFilesystemSpace_V1<any, any> }): Promise<string[] | null> {
//     const lc = `[${validateWebFilesystemSpace_V1Intrinsically.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 7dab564254813390c30b082da3c18224)`); }
//         const errors: string[] = (await validateIbGibIntrinsically({ ibGib: space })) ?? [];

//         const { ib, gib, data, rel8ns } = space;

//         if (!ib) { errors.push('ib required. (E: f86c9e618fb11b4ac6036e5ff494ba24)'); }
//         if (!gib) { errors.push('gib required. (E: 18481a93f7fa0b8e44617b8ef49b6a24)'); }
//         if (gib === GIB) { errors.push('gib cannot be primitive. (E: fe6a5111f6d1647458c5a60ed337ee24)'); }

//         if (!data) {
//             errors.push('data required. (E: 50d2f1aaa72f61f09efed2361e88d124)');
//             return errors;
//         }

//         if (data.name) {
//             if (!SPACE_NAME_REGEXP.test(data.name)) {
//                 errors.push(`space name (${data.name}) does not match space name regexp (${SPACE_NAME_REGEXP.source}). (E: 2eb2399e14f11f66a5f06ff9855bf225)`);
//             }
//         } else {
//             errors.push('space name required. (E: 3f3f85315602ee06d1d371a4729f0624)')
//         }
//         // if (!data.classname) { errors.push('classname required. (E: 5078a2ce307cce02b11c9c393db7c224)') }
//         if (data.classname && data.classname !== WebFilesystemSpace_V1.name) {
//             errors.push(`unknown classname (${data.classname}). data.classname !== FilesystemSpace_V1.name (E: 251aee62590dd6894144d8b4f9b7ab24)`);
//         }
//         if (!data.baseDir) { errors.push(`data.baseDir required (E: 66d5467064c4b794bf91218b14d53e24).`) }
//         if (!data.baseSubPath) { errors.push(`data.baseSubPath required. (E: 8545b7e9ea9a9b6265f447d9da2bac24)`) }
//         if (!data.binSubPath) { errors.push(`data.binSubPath required. (E: c9ca181a8b7979470669e2f7a081d624)`) }
//         if (!data.dnaSubPath) { errors.push(`data.dnaSubPath required. (E: 25a3b7a4c4820efa2e092fb122d3fe24)`) }
//         if (!data.ibgibsSubPath) { errors.push(`data.ibgibsSubPath required. (E: 8c2552c720bc1470d3566e1b87fe3824)`) }
//         if (!data.metaSubPath) { errors.push(`data.metaSubPath required. (E: 5f4d2c846717d21908569dab4b09a224)`) }
//         if (data.n && typeof data.n !== 'number') { errors.push(`data.n must be a number. (E: 0e4a25fd447dc835c68ee8657e455724)`) }
//         if (data.n === undefined) {
//             // the very first space record (tjp) has an undefined n and no rel8ns
//             if (rel8ns) { errors.push(`rel8ns not expected when data.n is falsy (custom temporal junction point indicator I suppose...) (E: 43714a88a1f248cdc827a97644d1c124)`); }
//         }
//         if (!data.spaceSubPath) { errors.push(`data.spaceSubPath required. (E: a49c78b367c5d8b9ddba92d50db8a624)`) }
//         if (!data.uuid) { errors.push(`data.uuid required. (E: bf6997ccf542adc15bc31e84012e9524)`) }
//         if (!data.encoding) { errors.push(`data.encoding required. (E: 4c61e1a5acc41b5f15f53535177b9124)`) }
//         /** should probably get this from Capacitor... */
//         const validEncodings = ["utf8", "ascii", "utf16"];
//         if (!validEncodings.includes(data.encoding)) {
//             errors.push(`invalid encoding: ${data.encoding}. validEncodings: ${validEncodings.join(', ')} (E: 8d2ae9fed4f59ab72c0e7e17bdbda124)`);
//         }

//         // ensure ib matches up with internal data
//         const { spaceClassname, spaceId, spaceName } = parseSpaceIb({ spaceIb: ib });
//         if (data.classname && (spaceClassname !== data.classname)) {
//             errors.push(`ib's spaceClassname (${spaceClassname}) must match data.classname (${data.classname}) (E: 9d1fce5cf2d42de2d96b487ab3570a24)`);
//         }
//         if (spaceId !== data.uuid) {
//             errors.push(`ib's spaceId (${spaceId}) must match data.uuid (${data.uuid}) (E: 45f5b88a62ac830302e74b33270b0224)`);
//         }
//         if (spaceName !== data.name) {
//             errors.push(`ib's spaceName (${spaceName}) must match data.name (${data.name}) (E: a752c7bc00e251458dc72af76edcb924)`);
//         }

//         // ensure rel8ns make sense
//         if (data.n === undefined && (rel8ns?.past ?? []).length > 0) {
//             errors.push(`"past" rel8n not expected when data.n is falsy (E: f578bf87da6ab80144f8d879fa0d9724)`);
//         }
//         if (data.n && (rel8ns?.past ?? []).length === 0) {
//             errors.push(`"past" rel8n required when data.n is truthy (E: 7b1e06b911c6f4a1e313ea6cfcdc3a24)`);
//         }
//         if (data.n === 0 && (rel8ns?.past ?? []).length !== 1) {
//             errors.push(`"past" rel8n expected to have a single record when data.n === 0 (E: 47998507925497bb8b25dbf70e542a24)`);
//         }
//         if (rel8ns && (rel8ns.past?.length ?? -1) > 0) {
//             const pastAddrs = rel8ns.past as IbGibAddr[];
//             pastAddrs.forEach(x => {
//                 const { ib: pastIb } = getIbAndGib({ ibGibAddr: x });
//                 const pastIbInfo = parseSpaceIb({ spaceIb: pastIb });
//                 if (pastIbInfo.spaceClassname && (pastIbInfo.spaceClassname !== spaceClassname)) {
//                     errors.push(`rel8ns.past address classname (${pastIbInfo.spaceClassname}) must match current spaceClassname (${spaceClassname}) (E: 71bdfd2c7235c6854963a451ddcd9f24)`);
//                 }
//                 if (pastIbInfo.spaceId !== spaceId) {
//                     errors.push(`rel8ns.past address spaceId (${pastIbInfo.spaceId}) must match current spaceId (${spaceId}) (E: 8b01f47268c34b8a638e397230331824)`);
//                 }
//                 // i want to allow this, but for now we're going to require not changing the name...
//                 if (pastIbInfo.spaceName !== spaceName) {
//                     errors.push(`rel8ns.past address spaceName (${pastIbInfo.spaceName}) must match current spaceName (${spaceName}) (E: 323ce598506b19ae791377a449aa8e24)`);
//                 }
//             });
//         }

//         return errors;
//     } catch (error) {
//         console.error(`${lc} ${error.message}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * gets the data and encoding of a given {@link inputPath} if that file exists.
//  * if it doesn't exist, this will throw an ENOENT error, but this is not logged
//  * as an error.
//  *
//  * this is because atow (03/2024) this is only used in a tryRead_bin function
//  * where the file often does not exist.
//  */
// export async function getFileDataAndEncoding({
//     inputPath,
//     encodingsToTry = B2TFS_DEFAULT_ENCODINGS_TO_TRY,
// }: {
//     inputPath: string,
//     /**
//      * ignored in web version
//      */
//     encodingsToTry?: (FileEncoding | undefined)[],
// }): Promise<FileDataInfo> {
//     const lc = `[${getFileDataAndEncoding.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: be8a697780bd9f2dcc4e55ed557d3b24)`); }

//         if (encodingsToTry) {
//             console.warn(`${lc} encodingsToTry (${pretty(encodingsToTry)}) is ignored in this web version of this function. (W: 1dda04d8e0b7fb046cff5d89d3903924)`);
//         }

//         const resRead = await readFile(inputPath);
//         if (resRead instanceof Uint8Array) {
//             // uint8array
//             if (resRead.length === 0) {
//                 console.warn(`${lc} file at inputPath (${inputPath}) has dataBuffer.length === 0, i.e., no data content. we are treating this as utf8. (W: 8159ac120ec276df17484c1d32870424)`)
//                 return {
//                     inputPath,
//                     dataBuffer: resRead,
//                     detectedEncoding: FileEncoding.utf8,
//                     dataString: '',
//                 };
//             } else {
//                 const resRead_str = uint8ArrayToString(resRead);
//                 return {
//                     inputPath,
//                     dataString: resRead_str,
//                     detectedEncoding: FileEncoding.utf8,
//                     dataBuffer: resRead,
//                 };
//             }

//             // encodingsToTry ??= ['utf-8', 'utf8'];

//             // const tryEncoding = async (encoding: FileEncoding | undefined) => {
//             //     let res: [boolean, string | undefined];
//             //     try {

//             //         // const str = resRead.toString(encoding ?? undefined);
//             //        const str = uint8ArrayToString(resRead);
//             //         /**
//             //          * doesn't include the node.js replacement unicode char
//             //          */
//             //         const isProbablyCorrect = !str.includes('\ufffd');
//             //         res = [isProbablyCorrect, str];
//             //         return res;
//             //     } catch (error) {
//             //         res = [false, undefined];
//             //     }
//             //     return res;
//             // }

//             // for (let i = 0; i < encodingsToTry.length; i++) {
//             // const maybeEncoding = encodingsToTry[i];
//             // const [isProbablyCorrectEncoding, dataString] = await tryEncoding(maybeEncoding);
//             // if (isProbablyCorrectEncoding) {
//             //     resDataAndEncoding = {
//             //         inputPath,
//             //         dataString,
//             //         detectedEncoding: maybeEncoding,
//             //         dataBuffer,
//             //     };
//             //     break;
//             // }
//             // }

//         } else if (typeof resRead === 'string') {
//             // utf8 on web
//             return {
//                 inputPath,
//                 dataString: resRead,
//                 detectedEncoding: FileEncoding.utf8,
//                 dataBuffer: undefined,
//             };
//         } else if (!resRead) {
//             // not found
//             return {
//                 inputPath,
//                 dataString: undefined,
//                 detectedEncoding: undefined,
//                 dataBuffer: undefined,
//             };
//         } else {
//             throw new Error(`(UNEXPECTED) resRead not Uint8Array, not string, not falsy? (E: bdeceb4c354da36708e31406adb30124)`);
//         }
//     } catch (error) {
//         // i'm just suppressing ENOENT at this time because in context, this is
//         // often the case. we do, however, rethrow the error for proper flow.
//         const emsg = extractErrorMsg(error);
//         if (!emsg.startsWith('ENOENT:')) { console.error(`${lc} ${emsg}`); }
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// interface FullPathInfo {
//     dbName: string,
//     storeName: string,
//     key: string,
// }

// function parseFullPath(fullPath: string): FullPathInfo {
//     const lc = `[${parseFullPath.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: c911bff0cb7333dfd45bde6925cce524)`); }

//         const pieces = fullPath.split('/');

//         // must be at least 3 pieces in path
//         if (pieces.length < 3) { throw new Error(`fullPath (${fullPath}) must have at least 3 pieces (E: d99c38d035551af3e85b7f767d911324)`); }

//         // dbName is the first piece
//         let dbName = pieces.shift()!;
//         if (dbName === '.') { dbName = BLANK_GIB_DB_NAME; }
//         // storeName is the second piece of the path
//         const storeName = pieces.shift()!;
//         // key is the rest of the path
//         const key = pieces.join('/');
//         return { dbName, storeName, key };
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Writes a "file" to the "filesystem" using IndexedDB.
//  *
//  * This overload in the node version is used for writing string files (i.e.
//  * non-binary utf-8 files).
//  *
//  * @param fullPath path to write to
//  * @param data data to write
//  * @param encoding ignored atow (11/2024) in this web version of this function.
//  */
// export function writeFile(fullPath: string, data: any, encoding: any): Promise<void>;
// /**
//  * Writes a "file" to the "filesystem" using IndexedDB.
//  *
//  * ATOW (12/2024) this assumes the fullPath is in the form of
//  *
//  *   [dbName]/
//  *
//  * This overload in the node version is used for writing binary files.
//  *
//  * @param fullPath path to write to
//  * @param data data to write
//  */
// export function writeFile(fullPath: string, data: any): Promise<void>;
// export async function writeFile(fullPath: string, data: any, encoding?: any): Promise<void> {
//     const lc = `[${writeFile.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 18c4f3558ab1f150382948556ab5f924)`); }

//         const { dbName, storeName, key } = parseFullPath(fullPath);

//         if (typeof data === 'string' || data instanceof Uint8Array) {
//             // utf8/string/binary on web
//             // maybe separate this later if we want to log type?
//             await storagePut({ dbName, storeName, key, value: data, });
//         } else {
//             throw new Error(`(UNEXPECTED) data not string or Uint8Array? (E: ac3e1c15484dbc7188c75e62ab78b124)`);
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }


// // export function readFile(fullPath: any, opts: { encoding: string; }): string | Promise<string | undefined> | undefined;
// // export function readFile(fullPath: any): string | Promise<string | undefined> | Uint8Array | Promise<Uint8Array | undefined> | undefined;
// export async function readFile(
//     fullPath: any,
//     opts?: { encoding: string; },
// ): Promise<string | Uint8Array | undefined> {
//     const lc = `[${readFile.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 37fd6ea3d79fc1ab797049ef00f6e224)`); }
//         // implement the read complement to writeFile
//         const { dbName, storeName, key } = parseFullPath(fullPath);
//         const resGet = await storageGet({ dbName, storeName, key });
//         return resGet;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export async function rm(fullPath: string, opts: {
//     /**
//      * ignored in web version atow (11/2024)
//      */
//     force: boolean
// }): Promise<void> {
//     const lc = `[${rm.name}]`;
//     if (logalot) {
//         console.log(fullPath);
//         console.log(JSON.stringify(opts));
//     }
//     const { dbName, storeName, key: pathToRm } = parseFullPath(fullPath);
//     await storageRmRF({ dbName, storeName, pathToRm: pathToRm });
// }

// /**
//  * is this necessary in web version?
//  * @param fullPath
//  * @param opts
//  */
// export function mkdirSync(fullPath: string, opts: { recursive: boolean }): void {
//     const lc = `[${mkdirSync.name}]`;
//     throw new Error(`${lc} not implemented (E: da4684557038657662e5d0d17a0c9224)`);
// }

// /**
//  * mimic node's readdir when `withFileTypes` is true.
//  *
//  * in this overload, returns mimicked `Dirent[]`
//  */
// export async function readdir(
//     containingDir: string,
//     opts: { withFileTypes: true; recursive?: boolean }
// ): Promise<Dirent[]>;
// /**
//  * mimic node's readdir when `withFileTypes` is falsy.
//  *
//  * in this overload, returns `string[]`
//  */
// export async function readdir(
//     containingDir: string,
//     opts?: { withFileTypes?: false; recursive?: boolean }
// ): Promise<string[]>;
// export async function readdir(
//     containingDir: string,
//     opts?: {
//         withFileTypes?: boolean;
//         recursive?: boolean;
//     }
// ): Promise<string[] | Dirent[]> {
//     const lc = `[${readdir.name}]`;
//     const { dbName, storeName, key: dirPath } = parseFullPath(containingDir);

//     return await storageReaddir({
//         dbName, storeName, dirPath,
//         withFileTypes: opts?.withFileTypes ?? false,
//     });
// }

// // export function existsSync(fullPath: string): boolean {
// //     const lc = `[${existsSync.name}]`;
// //     throw new Error(`${lc} not implemented (E: 2e2577807b69b6f2e475783d59cd1c24)`);
// // }
