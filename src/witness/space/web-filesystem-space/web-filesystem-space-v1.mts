/**
 * @module web-filesystem-space-v1
 *
 * uuids unique
 */
import { clone, extractErrorMsg, } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { getIbAndGib, getIbGibAddr, } from '@ibgib/ts-gib/dist/helper.mjs';
import { getGib, getGibInfo, } from '@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs';
import {
    IbGib_V1, IbGibRel8ns_V1,
} from '@ibgib/ts-gib/dist/V1/types.mjs';
import { Gib, Ib, IbGibAddr } from '@ibgib/ts-gib/dist/types.mjs';
import { validateIbGibAddr } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
import { IBGIB_DELIMITER } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { isBinary, parseBinIb, toDto, } from '@ibgib/core-gib/dist/common/other/ibgib-helper.mjs';
import { FilesystemSpace_V1 } from '@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-space-v1.mjs';
import { getSpaceIb } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import {
    DeleteIbGibFileOpts, DeleteIbGibFilesResult,
    GetIbGibFileOpts,
    GetIbGibFileResult,
    PutIbGibFileOpts,
    PutIbGibFileResult
} from '@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-types.mjs';
import {
    IBGIB_BASE_SUBPATH, IBGIB_SPACE_SUBPATH_DEFAULT, IBGIB_BASE_DIR,
    IBGIB_ENCODING, IBGIB_IBGIBS_SUBPATH, IBGIB_META_SUBPATH,
    IBGIB_BIN_SUBPATH,
    IBGIB_DNA_SUBPATH,
    DEFAULT_LONG_PATH_LENGTH,
    IBGIB_LONG_SUBPATH,
} from '@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-constants.mjs';
import {
    WebFilesystemSpaceData_V1, WebFilesystemSpaceRel8ns_V1,
    WebFilesystemSpaceOptionsData, WebFilesystemSpaceOptionsRel8ns, WebFilesystemSpaceOptionsIbGib,
    WebFilesystemSpaceResultData, WebFilesystemSpaceResultRel8ns,
    DEFAULT_WEB_FILESYSTEM_SPACE_DATA_V1,
    FileDataInfo,
} from './web-filesystem-space-types.mjs';
import { META_STONE_ATOM } from '@ibgib/core-gib/dist/common/meta-stone/meta-stone-constants.mjs';
import { isMetaStone, validateCommonMetaStoneIb } from '@ibgib/core-gib/dist/common/meta-stone/meta-stone-helper.mjs';
import { BinIbGib_V1 } from '@ibgib/core-gib/dist/common/bin/bin-types.mjs';
import { readdir, rm, tryRead, tryRead_bin, writeFile } from './web-filesystem-space-helper.mjs';
import { PathUtilsHelper } from '../../../helpers.web.mjs';
import { INDEXED_DB_LONG_PATH_LENGTH } from './web-filesystem-space-constants.mjs';

const logalot = GLOBAL_LOG_A_LOT;
const pathUtils = new PathUtilsHelper();

/**
 * Base class convenience for a local space with V1 ibgibs working with the node
 * filesystem.
 *
 * Unfortunately, file systems have short file name requirements, where 255 is
 * often the max length of a filename. So this cannot store ibgibs directly by
 * their address.
 *
 * This naively caches ibGibs in memory. When not found there, will looks in
 * files using Ionic `FileSystem`.
 */
export class WebFilesystemSpace_V1<
    TData extends WebFilesystemSpaceData_V1 = WebFilesystemSpaceData_V1,
    TRel8ns extends WebFilesystemSpaceRel8ns_V1 = WebFilesystemSpaceRel8ns_V1
> extends FilesystemSpace_V1<
    WebFilesystemSpaceOptionsData,
    WebFilesystemSpaceOptionsRel8ns,
    WebFilesystemSpaceResultData,
    WebFilesystemSpaceResultRel8ns,
    TData,
    TRel8ns
> {

    /**
     * Log context for convenience with logging. (Ignore if you don't want to use this.)
     */
    protected lc: string = `[${WebFilesystemSpace_V1.name}]`;

    constructor(
        // /**
        //  * Default predicate value when putting an unknown ibGib.
        //  *
        //  * ## notes
        //  *
        //  * So when a repo witnesses another ibGib, it either defaults to
        //  * storing that ibGib or not storing that ibGib. This is what that
        //  * is referring to. If it's optimistic, then it stores any ibGib by
        //  * default and it passes its put predicate.
        //  */
        // public optimisticPut: boolean = true,
        initialData?: TData,
        initialRel8ns?: TRel8ns,
    ) {
        super(initialData ?? clone(DEFAULT_WEB_FILESYSTEM_SPACE_DATA_V1), initialRel8ns);
        const lc = `${this.lc}[ctor]`;

        // try {
        //     if (logalot) { console.log(`${lc} starting...`); }
        //     this.initialize();
        // } catch (error) {
        //     console.error(`${lc} ${extractErrorMsg(error)}`);
        //     throw error;
        // } finally {
        //     if (logalot) { console.log(`${lc} complete.`); }
        // }
    }

    /**
     * Factory static method to create the space with the given
     * `dto` param's ibGib properties.
     *
     * We do this because when we persist this space (and its settings
     * located in `data`), we do not save the actual class instantiation
     * but just the ibgib properties. Use this factory method to
     * create a new space instance and rehydrate from that saved dto.
     *
     * ## notes
     *
     * * DTO stands for data transfer object.
     *
     * @param dto space ibGib dto that we're going to load from
     * @returns newly created space built upon `dto`
     */
    static async createFromDto<
        TData extends WebFilesystemSpaceData_V1 = WebFilesystemSpaceData_V1,
        TRel8ns extends IbGibRel8ns_V1 = IbGibRel8ns_V1
    >(dto: IbGib_V1<TData, TRel8ns>): Promise<WebFilesystemSpace_V1<TData, TRel8ns>> {
        const lc = `[${FilesystemSpace_V1.name}][${this.createFromDto.name}]`;
        if (logalot) { console.log(`${lc}`); }
        const space = new WebFilesystemSpace_V1<TData, TRel8ns>();
        await space.initialized;
        await space.loadIbGibDto(dto);
        return space;
    }

    protected async validateWitnessArg(arg: WebFilesystemSpaceOptionsIbGib): Promise<string[]> {
        const lc = `${this.lc}[${this.validateWitnessArg.name}]`;
        let errors: string[] = [];
        try {
            errors = (await super.validateWitnessArg(arg)) || [];
            if (arg.data?.cmd === 'put' && (arg.ibGibs || []).length === 0) {
                errors.push(`when "put" cmd is called, ibGibs required.`);
            }
            if (arg.data?.cmd === 'get' && (arg.data?.ibGibAddrs || []).length === 0) {
                errors.push(`when "get" cmd is called, ibGibAddrs required.`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (errors?.length > 0) { console.error(`${lc} errors: ${errors}`); }
        }

        return errors;
    }

    // _pathUtils: PathUtilsHelper | undefined;
    // get pathUtils(): PathUtilsHelper {
    //     if (!this._pathUtils) { this._pathUtils = new PathUtilsHelper(); }
    //     return this._pathUtils;
    // }

    /**
     * Initializes to default space values.
     */
    protected async initialize(): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.data) {
                this.data = clone(DEFAULT_WEB_FILESYSTEM_SPACE_DATA_V1);
                this.data = this.data!; // why does ts compiler need this?
            }
            // if (!this.data?.classname) { this.data!.classname = WebFilesystemSpace_V1.name }
            if (this.data!.classname !== WebFilesystemSpace_V1.name) {
                if (this.data.classname) {
                    // only warn if the consumer has explicitly set a different classname
                    console.warn(`${lc} this.data.classname (${this.data.classname}) !== ${WebFilesystemSpace_V1.name}. overriding this. (W: 400ef8f8626132bf763b5c68bc1d3424)`);
                }
                this.data!.classname = WebFilesystemSpace_V1.name; // always set?
            }
            if (!this.data.encoding) { this.data.encoding = IBGIB_ENCODING; }
            if (!this.data.baseDir) { this.data.baseDir = IBGIB_BASE_DIR; }
            // if (!this.data.baseSubPath) { this.data.baseSubPath = IBGIB_BASE_SUBPATH; }
            if (!this.data.uuid) { throw new Error(`this.data.uuid is falsy. right now i'm assuming data.uuid is truthy. this is what i'm using atow (12/2024) as the indexeddb db.store to be the uuid via the baseSubPath (E: cd3475cc43d1384dccf0b20dd322b124)`); }
            this.data.baseSubPath = this.data.uuid;
            if (!this.data.spaceSubPath) { this.data.spaceSubPath = IBGIB_SPACE_SUBPATH_DEFAULT; }
            if (!this.data.ibgibsSubPath) { this.data.ibgibsSubPath = IBGIB_IBGIBS_SUBPATH; }
            if (!this.data.metaSubPath) { this.data.metaSubPath = IBGIB_META_SUBPATH; }
            if (!this.data.binSubPath) { this.data.binSubPath = IBGIB_BIN_SUBPATH; }
            if (!this.data.dnaSubPath) { this.data.dnaSubPath = IBGIB_DNA_SUBPATH; }

            // do nothing, allow falsy
            if (this.data.longSubPath === undefined) { this.data.longSubPath = IBGIB_LONG_SUBPATH; }
            if (this.data.longPathLength === undefined) { this.data.longPathLength = INDEXED_DB_LONG_PATH_LENGTH; }
            if (this.data.mitigateLongPaths === undefined) { this.data.mitigateLongPaths = false; }

            this.ib = getSpaceIb({ space: this, classname: this.data!.classname });
            this.gib = await getGib({ ibGib: this });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async putFile({
        ibGib,
        isDna,
    }: PutIbGibFileOpts): Promise<PutIbGibFileResult> {
        const lc = `${this.lc}[${this.putFile.name}]`;

        let result: PutIbGibFileResult = {};

        try {
            if (!ibGib) { throw new Error(`ibGib required. (E: bb41678a0e46f60782db4641e7355a24)`) };

            const thisData = this.data!;
            // await this.ensureAllDirsExist();
            let path: string = "";
            let data: any = "";

            const addr = getIbGibAddr({ ibGib });
            const isBin = isBinary({ addr });
            path = await this.buildPath({
                addr, isDna: isDna ?? false, isBin, ensureMetaStonePaths: true,
            });
            // await this.ensureDirsImpl([pathUtils.dirname(path)]); // needed in web fs space?

            let fullPath = pathUtils.join(thisData.baseDir, path);

            if (logalot) { console.log(`${lc} fullPath: ${fullPath} (I: accfac2f2ee924da0184e241c2408624)`); }
            if (logalot) { console.log(`${lc} path: ${path}, directory: ${thisData.baseDir}, thisData.encoding: ${thisData.encoding} (I: 498dd4e293f7da0eef4b3dea2ee32524)`); }


            let encoding: string | undefined;

            if (!isBin) {
                // not binary - most ibgibs will not be bins.

                // we only want to persist the ibGib protocol properties (not
                // any functions or other properties that might exist on the
                // incoming ibGib arg)
                const bareIbGib = toDto({ ibGib })
                data = JSON.stringify(bareIbGib);

                encoding = thisData.encoding || 'utf8';
                await writeFile(fullPath, data, encoding as BufferEncoding);
            } else {
                // binary
                const binIbGib = ibGib as BinIbGib_V1;
                data = binIbGib.data;
                if (!data) { throw new Error(`(UNEXPECTED) binIbGib.data falsy? I'm trying to have data always populated for bin ibgibs even if it is an empty Uint8Array. (E: 861489baffc294baf7b463333f389824)`); }
                await writeFile(fullPath, data);
            }

            result.success = true;
        } catch (error) {
            const errorMsg = `${lc} ${extractErrorMsg(error)}`;
            console.error(errorMsg);
            result.errorMsg = errorMsg;
        }

        return result;
    }

    protected async deleteFile({
        addr,
        isDna,
    }: DeleteIbGibFileOpts): Promise<DeleteIbGibFilesResult> {
        const lc = `${this.lc}[${this.deleteFile.name}]`;

        const result: DeleteIbGibFilesResult = {};

        try {
            if (!addr) { throw new Error(`addr required. (E: a2ca4b3ae9bb79891fd86c98af3de624)`) };

            if (!this.data) { throw new Error(`this.data required (E: 6b6163a397c42adf5b03ca5117c0d624)`); }
            const data = this.data;
            let path: string = "";

            if (!isBinary({ addr })) {
                // regular ibGib
                path = await this.buildPath({
                    addr, isDna: isDna ?? false, ensureMetaStonePaths: true,
                });
            } else {
                path = await this.buildPath({
                    addr, isDna: false, isBin: true, ensureMetaStonePaths: false,
                });
            }
            if (logalot) { console.log(`${lc} path: ${path}, directory: ${data.baseDir}`); }
            const fullPath = pathUtils.join(this.data.baseDir, path);
            await rm(fullPath, { force: true });
            if (logalot) { console.log(`${lc} deleted. path: ${path}`); }
            result.success = true;
        } catch (error) {
            const errorMsg = `${lc} ${extractErrorMsg(error)}`;
            if (!errorMsg.includes('File does not exist')) {
                console.error(errorMsg);
            } else {
                if (logalot) { console.log(`${lc} attempted to delete non-existent file. ${errorMsg} (I: 839257fb70d62a3273335d8536b15724)`); }
            }
            result.errorMsg = errorMsg;
        }

        return result;
    }

    protected async getFile({
        addr,
        isDna,
    }: GetIbGibFileOpts): Promise<GetIbGibFileResult> {
        let lc = `${this.lc}[${this.getFile.name}(${addr})]`;

        const result: GetIbGibFileResult = {};
        try {
            if (logalot) { console.log(`${lc} starting... (I: 07e34fff2d9c7108dd79e5d6f93ed724)`); }
            if (!addr) { throw new Error(`addr required`) };

            const data = this.data!;
            const { ib } = getIbAndGib({ ibGibAddr: addr });

            const addrIsBin = isBinary({ addr });
            const knownTransformIbs = ['fork', 'mut8', 'rel8', 'plan']; // hack/kluge here
            const addrMightBeDna =
                knownTransformIbs.some(x => x === ib || x.startsWith(ib + ' '));

            const pathsToLook: string[] = [];

            if (isDna || addrMightBeDna) {
                pathsToLook.push(await this.buildPath({
                    addr, isDna: true, ensureMetaStonePaths: false
                }));
            } else if (addrIsBin) {
                pathsToLook.push(await this.buildPath({
                    addr, isDna: false, isBin: true, ensureMetaStonePaths: false
                }));
            }

            // always look in the main location as a last resort
            pathsToLook.push(await this.buildPath({
                addr, isDna: false, ensureMetaStonePaths: false
            }));

            // ...(pretend shortened as well as an absolute last last resort)
            if (!isMetaStone({ addr })) {
                pathsToLook.push(await this.buildPath({
                    addr, isDna: false, ensureMetaStonePaths: false,
                    pretendItsALongPath: true,
                }));
            }

            // this is ugly atow (02/2024) because i'm struggling a bit of
            // changing bin ibgibs to actually support binaries. i apologize.

            if (!addrIsBin) {
                // non-bin ibGib(s) retrieved (most ibgibs are non-bin)
                let resRead: any = null;
                for (const tryPath of pathsToLook) {
                    const x = await tryRead({ path: tryPath, directory: data.baseDir, encoding: data.encoding });
                    if (x) { resRead = x; break; }
                }
                if (resRead) {
                    result.ibGib = JSON.parse(resRead) as IbGib_V1;
                } else {
                    if (logalot) { console.log(`${lc} paths not found: ${JSON.stringify(pathsToLook)} (I: 52287b4a0fb3e3fa5f893fa92bc15324)`); }
                    // will return success since it's not really an error, but ibgib
                    // will not be populated, indicating the addr was not found.
                }
            } else {
                // bin
                let resRead: FileDataInfo | null = null;
                let { binEncoding, binHash } = parseBinIb({ addr });
                if (binHash === '0') {
                    // special case: if the binHash is 0, then it is an empty file.
                    const { ib, gib } = getIbAndGib({ ibGibAddr: addr });
                    result.ibGib = {
                        ib,
                        gib,
                        data: new Uint8Array(0),
                        // data: '',
                        // rawData: Buffer.from([]),
                    } as BinIbGib_V1;
                } else {
                    for (const tryPath of pathsToLook) {
                        const x = await tryRead_bin({
                            path: tryPath, directory: data.baseDir, encoding: binEncoding ?? data.encoding,
                        });
                        if (x) { resRead = x; break; }
                    }

                    if (resRead) {
                        // all bins are buffers
                        const { ib, gib } = getIbAndGib({ ibGibAddr: addr });
                        const binIbGib: BinIbGib_V1 = {
                            ib, gib, data: resRead.dataBuffer,
                            // rawData: resRead.dataBuffer,
                        }
                        result.ibGib = binIbGib;
                    } else {
                        if (logalot) { console.log(`${lc} paths not found: ${JSON.stringify(pathsToLook)} (I: 9116435fa6198d1e2e40ed4467e72924)`); }
                        // will return success since it's not really an error, but ibgib
                        // will not be populated, indicating the addr was not found.
                    }
                }
            }

            result.success = true;
        } catch (error) {
            const errorMsg = `${lc} ${extractErrorMsg(error)}`;
            console.error(errorMsg);
            result.errorMsg = errorMsg;
        } finally {
            if (logalot) { console.log(`${lc} complete. (I: d648c9b72261e509dac1e36279f8eb24)`); }
        }

        return result;
    }

    protected async ensurePermissions(): Promise<boolean> {
        const lc = `${this.lc}[${this.ensurePermissions.name}]`;
        if (logalot) { console.log(`${lc} always returns true in base class (I: eaa254b35aadb047b2c4af58f9ec6f24)`); }
        return true;
    }

    protected async ensureAllDirsExist(): Promise<void> {
        const lc = `${this.lc}[${this.ensureAllDirsExist.name}]`;
        try {
            console.warn(`${lc} does nothing in web filesystem space. do I need to do anything in this concrete class? (W: 6f71512c4b32df68e483cf54e17e3124)`);
            // if (logalot) { console.log(`${lc} starting... (I: d8ed5f71c09fc6124c36cd688edd8b24)`); }

            // if (!this.data) { throw new Error(`this.data required (E: 48d1c9d922377d6c8693fd1b0a13e224)`); }
            // if (!this.data.uuid) { throw new Error(`this.data.uuid required (E: 0257b3a432121db943f5e13e3c6b2d24)`); }

            // const data = this.data!;

            // /** these are the paths we're ensuring exist. all ibgibs are stored here. */
            // const paths = [
            //     data.baseSubPath, // = 'ibgib';
            //     data.baseSubPath + '/' + data.spaceSubPath,
            //     data.baseSubPath + '/' + data.spaceSubPath + '/' + data.ibgibsSubPath,
            //     data.baseSubPath + '/' + data.spaceSubPath + '/' + data.metaSubPath,
            //     data.baseSubPath + '/' + data.spaceSubPath + '/' + data.binSubPath,
            //     data.baseSubPath + '/' + data.spaceSubPath + '/' + data.dnaSubPath,
            // ];

            // if (data.mitigateLongPaths) {
            //     paths.push(data.baseSubPath + '/' + data.spaceSubPath + '/' + data.longSubPath);
            // }

            // await this.ensureDirsImpl(paths);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * actually executes the ensure functionality for given `paths`. If they
     * don't exist, then this tries to make the dirs.
     * @param paths to ensure exist.
     */
    protected async ensureDirsImpl(paths: string[]): Promise<void> {
        const lc = `${this.lc}[${this.ensureDirsImpl.name}]`;
        try {
            console.warn(`${lc} not implemented in this web-based class. do i need this? (W: 0c50f3eb750f11108e7cd2a1263d8124)`);

            // if (logalot) { console.log(`${lc} starting... (I: 1edfc39f91edea3e92db02e95c740c24)`); }
            // if (paths.length === 0) {
            //     console.warn(`${lc} paths empty? returning early. (W: 0722ea869cad228463151cde8ee07f24)`)
            //     return; /* <<<< returns early */
            // }

            // const directory = this.data!.baseDir;

            // const getPathKey = (p: string) => { return directory.toString() + '/' + p; }

            // let allExist = paths.every(p => this.pathExistsMap[getPathKey(p)]);
            // if (allExist) {
            //     if (logalot) { console.log(`${lc} allExist (I: 00a417b53878e2fd77bce374da2aae24)`); }
            //     return; /* <<<< returns early */
            // }

            // const permitted = await this.ensurePermissions();
            // if (!permitted) {
            //     console.error(`${lc} permission not granted.`);
            //     return; /* <<<< returns early */
            // }

            // for (let i = 0; i < paths.length; i++) {
            //     const path = paths[i];
            //     const lc2 = `${lc}[(path: ${path}, directory: ${directory})]`;
            //     const fullPath = pathUtils.join(directory, path);

            //     // check if we've already ensured for this path
            //     const pathExistsKey = getPathKey(path);
            //     let exists = this.pathExistsMap[pathExistsKey] || false;

            //     if (!exists) {
            //         // we've not checked this path (or it didn't exist)
            //         try {
            //             exists = existsSync(fullPath);
            //             this.pathExistsMap[pathExistsKey] = exists;
            //         } catch (error) {
            //             if (logalot) { console.log(`${lc2} Did not exist`); }
            //         }
            //     }

            //     if (!exists) {
            //         // try full path
            //         if (logalot) { console.log(`${lc2} creating...`); }
            //         try {
            //             mkdirSync(fullPath, { recursive: true });
            //             exists = existsSync(fullPath);
            //             if (logalot) { console.log(`${lc} exists: ${exists}`); }
            //             this.pathExistsMap[pathExistsKey] = exists;
            //         } catch (error) {
            //             if (logalot) { console.log(`${lc2} Error creating. Trying next`); }
            //         } finally {
            //             if (logalot) { console.log(`${lc2} complete.`); }
            //         }
            //     }
            // }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /** */
    protected async getMetaStoneAddrs({
        ibGibAddr,
        tjpGib,
        fnFilterIb,
    }: {
        /**
         * addr of ibGib for which we're getting the metastones.
         */
        ibGibAddr: IbGibAddr,
        /**
         * tjpGib of the metastone's target ibgib
         */
        tjpGib: Gib,
        fnFilterIb?: (ib: Ib) => boolean,
    }): Promise<string[]> {
        const lc = `${this.lc}[${this.getMetaStoneAddrs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f9da77d2c1920dc33efabee27847d624)`); }

            // first build the path with the given tjpGib
            let pathSansBaseDir = await this.buildPath({
                addr: ibGibAddr, ensureMetaStonePaths: false, isDna: false,
                addrIsForAMetaStone: true,
            });
            let fullPath = pathUtils.join(this.data!.baseDir, pathSansBaseDir);
            if (logalot) { console.log(`${lc} fullPath: ${fullPath} (I: 7d69faa728f178ef5261291b4a44a424)`); }

            // the given ibgib's containing dir is the one that should contain
            // the metastones.
            let gibInfo = getGibInfo({ ibGibAddr });

            let containingDir = !!gibInfo.tjpGib ?
                pathUtils.dirname(pathUtils.join(fullPath, '..')) :
                pathUtils.dirname(fullPath);
            if (logalot) { console.log(`${lc} containingDir: ${containingDir} (I: 867174fbd4b3640d023dce741208b624)`); }

            // iterate through the files for metastones.
            const fnFilter = fnFilterIb ?
                (s: string) => s.startsWith(META_STONE_ATOM) && fnFilterIb(s) :
                (s: string) => s.startsWith(META_STONE_ATOM);
            let filenames: string[] = [];
            try {
                if (logalot) { console.log(`${lc} calling readdir(containingDir) (I: 9adcee17e5b5121a36f3d6e29d3fb224)`); }
                filenames = await readdir(containingDir, {
                    recursive: false,
                    withFileTypes: false,
                });
            } catch (error) {
                let emsg = extractErrorMsg(error);
                if (!emsg.includes('ENOENT')) { // no such file or directory
                    console.warn(`${lc} readdir error did not contain ENOENT...not sure what this is...maybe a different OS no dir exists emsg? Treating this as if dir does not exist. (W: 4fee7ed52dc4c987559eead57c89f724)`);
                } else {
                    if (logalot) { console.log(`${lc} readdir errors: ${extractErrorMsg(error)} (I: 95d041a148844dd09700875a1a82c424)`); }
                }
                filenames = [];
            }
            if (filenames.length === 0) {
                if (logalot) { console.log(`${lc} filenames: [empty]. no metastones found. (I: b42abb33f7636b49c195b36fca6dce24)`); }
                return []; /* <<<< returns early */
            }
            if (logalot) { console.log(`${lc} filenames: ${filenames} (I: 18e77f7451ce57bbbccddf9bef768624)`); }

            /**
             * atow (11/2023) extensions are hard-coded to ".json",
             */
            const dotExt = '.json';
            const dotExtLength = 5;
            const metaStoneAddrs = filenames
                .filter(x => {
                    // some filenames may be adjusted and not the full ibs.
                    // however, the metastones are never shortened (atow
                    // 11/2023), so those that don't have the delimiter will be
                    // stored in ibIsh but they should get filtered out.
                    const [ibIsh, gibPlusExt] = x.split(IBGIB_DELIMITER);
                    return !!gibPlusExt?.endsWith(dotExt) && fnFilter(ibIsh);
                }).map(addrPlusExt => {
                    // strip the extension
                    return addrPlusExt.substring(0, addrPlusExt.length - dotExtLength);
                }).filter(metaStoneAddr => {
                    // atow (11/2023) I'm not sure what other metastones are
                    // going to be in this dir, so I'm saying it has to
                    // explicitly contain the tjpGib.
                    return isMetaStone({ addr: metaStoneAddr }) && metaStoneAddr.includes(tjpGib);
                });

            if (logalot) { console.log(`${lc} filtered/mapped filenames -> metaStoneAddrs: ${metaStoneAddrs} (I: d0396296e7de1167d226f3c84a283424)`); }

            // do some basic validation
            // throw (which could cripple in the future...), or silent fail
            // (which could lead to corrupt data)...  hmm...going to throw for
            // now.
            for (let i = 0; i < metaStoneAddrs.length; i++) {
                const metaStoneAddr = metaStoneAddrs[i];
                let basicErrors = validateIbGibAddr({ addr: metaStoneAddr });
                if ((basicErrors ?? []).length > 0) {
                    throw new Error(`(UNEXPECTED) invalid metastone found? metaStoneAddr (${metaStoneAddr}) had basic validation errors: ${basicErrors!.join('|')} (E: c41e8797d56833c55e32d5b4c8f79524)`);
                }
                const { ib } = getIbAndGib({ ibGibAddr: metaStoneAddr });
                let metaStoneErrors = validateCommonMetaStoneIb({ ib });
                if (metaStoneErrors.length > 0) {
                    throw new Error(`(UNEXPECTED) metaStoneIb had validation errors? metaStoneErrors: ${metaStoneErrors.join('|')} (E: 28ab913c2d7376843e7d94584fc94324)`);
                }
            }

            // all good, return 'em!
            if (logalot) { console.log(`${lc} returning metaStoneAddrs: ${metaStoneAddrs} (I: 491d7c31691e4938eb9d087f5854fa24)`); }
            return metaStoneAddrs;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}
export async function convertData({
    data,
    encoding,
}: {
    data: string,
    encoding: any,
}): Promise<any> {
    const lc = `[${convertData.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 9de827dcf4715d3f1a81e6dd9ee9ff24)`); }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
