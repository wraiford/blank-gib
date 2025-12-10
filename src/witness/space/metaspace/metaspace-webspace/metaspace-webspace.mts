// /**
//  * @module metaspace-webspace driven by a web indexeddb storage substrate
//  *
//  * a metaspace is a space of spaces. it adds/removes spaces and does
//  * inter-spatial composition related things. it's similar to what people think
//  * of in terms of a node in a p2p network.
//  */

// import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { IbGibAddr } from '@ibgib/ts-gib/dist/types.mjs';
// import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
// import { IbGibCacheService } from '@ibgib/core-gib/dist/common/cache/cache-types.mjs';
// import { MetaspaceBase } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-base.mjs';
// import { MetaspaceFactory, MetaspaceInitializeOptions } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
// import { ZERO_SPACE_ID } from '@ibgib/core-gib/dist/witness/space/space-constants.mjs';

// import { BLANK_GIB_DB_NAME, GLOBAL_LOG_A_LOT, GLOBAL_TIMER_NAME, } from '../../../../constants.mjs';
// import { fnCreateNewLocalSpace, fnDtoToSpace_webFilesystem } from './metaspace-webspace-helper.mjs';
// import { WebFilesystemSpace_V1 } from '../../web-filesystem-space/web-filesystem-space-v1.mjs';
// // import { storageCreateStoreIfNotExist, initializeStorage, storageDBExists, } from '../../../../helpers.web.mjs';
// import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
// import { storageCreateStoreIfNotExist } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
// import { SpaceId } from '@ibgib/core-gib/dist/witness/space/space-types.mjs';
// import { validateIbGibIntrinsically } from '@ibgib/ts-gib/dist/V1/validate-helper.mjs';
// import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
// import { commandifyAnonFn } from '../../../../api/commands/command-helpers.mjs';
// import { execInSpaceWithLocking } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';
// import { SpecialIbGibType } from '@ibgib/core-gib/dist/common/other/other-types.mjs';

// const logalot = GLOBAL_LOG_A_LOT;

// const NAIVE_SPACE_CACHE: Map<IbGibAddr, IbGibSpaceAny> = new Map();
// const ZERO_SPACE_CACHE_ADDR = 'zero_space^gib';
// const STORES_CONFIRMED: Set<string> = new Set();

// interface TempCacheEntry {
//     /**
//      * Password to the user's password.
//      */
//     tempMetaPassword: string;
//     /**
//      * Encrypted user password
//      */
//     encryptedPassword: string;
//     /**
//      * salt used in cached encryption.
//      */
//     salt: string;
// }


// /**
//  * All-purpose mega service (todo: which we'll need to break up!) to interact
//  * with ibgibs at the app/device level.
//  *
//  * This works with the local app user space.
//  *
//  * ## regarding special ibgibs
//  *
//  * Special ibgibs' behaviors are what hold in other apps configuration data.
//  * Of course the difference is that most special ibgibs can leverage the "on-chain"
//  * functionality of "regular" ibgibs.
//  *
//  * There are a couple meta ibgibs (which I also call "special"):
//  *   * roots^gib
//  *     * tracks other special root^gib ibgibs, which are like local app-level indexes.
//  *   * tags^gib
//  *     * tracks other special tag^gib ibgibs, which you can apply to any ibgib
//  *   * latest^gib
//  *     * tracks mappings between tjp -> latest ib^gib address
//  *     * ephemeral (deletes past rel8ns and past ibGib frames)
//  *   * ...
//  *
//  * ## regarding latest ibgibs
//  *
//  * The tjp (temporal junction point) defines atow the beginning of an ibGib
//  * timeline.  it's like the birthday for an ibGib. (Or you can think if it as
//  * the id for the stream of ibgib frames in a given timeline.)
//  *
//  * The latest ibGib in that timeline is also special, because it's often what
//  * you want to work with.
//  *
//  * So ideally, when an ibgib, A, has a tjp A1, and it is updated to A2, A3, An
//  * via `mut8` and/or `rel8` transforms, that ibgib creates a single timeline.
//  * This service attempts to track the relationship between that starting tjp
//  * address and its corresponding latest frame in that timeline, i.e., A1 -> An.
//  *
//  * ### mapping persistence implementation details
//  *
//  * The latest ibGib service is backed by a special ibgib that maintains the
//  * mapping index.  It does this by rel8-ing that special backing ibgib via the
//  * tjp pointer, e.g. [special latest ibgib^XXX000].rel8ns[A^TJP123] ===
//  * [A^N12345] . It does this via the ib^gib content address pointer, so this
//  * becomes a mapping from A^TJP123 to A^N12345.
//  *
//  * This backing ibGib is special (even for special ibGibs) in that:
//  *   * it does not relate itself with the current root of the application
//  *   * it does not maintain references to its past (i.e. rel8ns['past'] === [])
//  *   * it DELETES its previous incarnation from the files service
//  *
//  * In other words, this service is meant to be as ephemeral as possible. I am
//  * keeping it as an ibGib and not some other data format (like straight in
//  * storage/some other db) because I've found this is often useful and what I end
//  * up doing anyway to leverage other ibgib behavior. For example, in the future
//  * it may be good to take snapshots, which is a simple copy operation of the
//  * file persistence.
//  *
//  * ### current naive implementation notes
//  *
//  * questions:
//  *   * What do we want to do if we can't locate an ibGib record?
//  *   * How/when do we want to alert the user/our own code that we've found
//  *     multiple timelines for an ibGib with a tjp (usually a thing we want to
//  *     avoid)?
//  *   * Who do we want to notify when new ibGibs arrive?
//  *   * How often do we want to check external sources for latest?
//  *   * When do we get to merging ibGib timelines?
//  *
//  * This is behavior that is somewhat taken care of, e.g. in git, with the HEAD
//  * pointer for a repo.  But we're talking about here basically as a metarepo or
//  * "repo of repos", and unlike git, we don't want our HEAD metadata living "off
//  * chain" (outside of the DLT itself that it's modifying).  So eventually, what
//  * we want is just like what we want with ALL ibGibs: perspective. From "the
//  * app"'s perspective, the latest is mapped. But really, apps can't view slices
//  * of ibGib graphs in all sorts of interesting ways and still be productive &
//  * beneficial to the ecosystem as a whole.
//  */
// export class Metaspace_Webspace extends MetaspaceBase {

//     // we won't get an object back, only a DTO ibGib essentially
//     protected lc: string = `[${Metaspace_Webspace.name}]`;

//     get zeroSpace(): IbGibSpaceAny {
//         const lc = `[${this.lc}][get zeroSpace]`;
//         if (NAIVE_SPACE_CACHE.has(ZERO_SPACE_CACHE_ADDR)) {
//             return NAIVE_SPACE_CACHE.get(ZERO_SPACE_CACHE_ADDR)!;
//         } else if (this.metaspaceFactory.fnZeroSpaceFactory) {
//             const zeroSpace = this.metaspaceFactory.fnZeroSpaceFactory();
//             NAIVE_SPACE_CACHE.set(ZERO_SPACE_CACHE_ADDR, zeroSpace);
//             return zeroSpace;
//         } else {
//             throw new Error(`${lc} (UNEXPECTED) this.metaspaceFactory.fnZeroSpaceFactory falsy. not initialized? (E: 9e6c6954dacd868b18c9f34a71e63523)`);
//         }
//     }

//     constructor(
//         // public modalController: ModalController,
//         // public alertController: AlertController,
//         protected cacheSvc: IbGibCacheService | undefined,
//         // private latestCacheSvc: IonicStorageLatestIbgibCacheService,
//     ) {
//         super(cacheSvc);
//         const lc = `${this.lc}[ctor]`;
//         if (logalot) {
//             console.log(`${lc}${GLOBAL_TIMER_NAME}`);
//             console.timeLog(GLOBAL_TIMER_NAME);
//             console.log(`${lc} created. (I: 5690dc2ebf774df3a442bd463dee7455)`);
//         }

//     }

//     protected async initializeMetaspaceFactory({ metaspaceFactory }: {
//         metaspaceFactory: MetaspaceFactory,
//     }): Promise<void> {
//         const lc = `[${this.initializeMetaspaceFactory.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 5a29670439ac47634dcdfe25225c8223)`); }

//             await super.initializeMetaspaceFactory({ metaspaceFactory });

//             metaspaceFactory.fnDefaultLocalSpaceFactory ??= async (opts) => {
//                 const createdSpace = await fnCreateNewLocalSpace(opts);
//                 if (!createdSpace) { throw new Error(`(UNEXPECTED) createdSpace undefined? (E: 21258175efdd1a9cb1f9fc8ab59e0324)`); }
//                 if (!createdSpace.data?.uuid) { throw new Error(`(UNEXPECTED) createdSpace.data.uuid undefined? (E: 0a6c44c078d9e21e92f703adbc995c24)`); }

//                 // ensure the local space exists in storage (db & store)
//                 const storeNameForSpace = createdSpace.data.uuid;
//                 await storageCreateStoreIfNotExist({
//                     dbName: BLANK_GIB_DB_NAME,
//                     storeName: storeNameForSpace,
//                     logalot,
//                 });

//                 // cache newly created space
//                 const spaceAddr = getIbGibAddr({ ibGib: createdSpace });
//                 NAIVE_SPACE_CACHE.set(spaceAddr, createdSpace);

//                 // return it
//                 return createdSpace;
//             };
//             metaspaceFactory.fnDtoToSpace ??= async (spaceDto) => {
//                 // first ensure that the store exists in IndexedDB
//                 const storeNameForSpace = spaceDto.data?.uuid;
//                 if (!storeNameForSpace) { throw new Error(`spaceDto.data?.uuid falsy? (E: b73bded9ebede92b8ef53b8d05dca225)`); }
//                 if (!STORES_CONFIRMED.has(storeNameForSpace)) {
//                     await storageCreateStoreIfNotExist({
//                         dbName: BLANK_GIB_DB_NAME,
//                         storeName: storeNameForSpace,
//                         logalot,
//                     });
//                     STORES_CONFIRMED.add(storeNameForSpace);
//                 }

//                 // get the space from cache if available, else create it

//                 const spaceAddr = getIbGibAddr({ ibGib: spaceDto });
//                 let resSpace = NAIVE_SPACE_CACHE.get(spaceAddr);
//                 resSpace = undefined; // testing bug
//                 if (!resSpace) {
//                     resSpace = await fnDtoToSpace_webFilesystem(spaceDto);
//                     if (!resSpace.data?.uuid) { throw new Error(`(UNEXPECTED) resCreateNewSpace.data.uuid undefined? (E: f1e0e75f02b607b349b4102a8c8f7724)`); }
//                     NAIVE_SPACE_CACHE.set(spaceAddr, resSpace);
//                 }
//                 return resSpace;
//             };

//             this.metaspaceFactory.fnZeroSpaceFactory ??= () => {
//                 // default to web space
//                 const zeroSpace = new WebFilesystemSpace_V1(/*initialData*/ undefined, /*initialRel8ns*/ undefined);
//                 zeroSpace.gib = 'gib';
//                 return zeroSpace;
//             }
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     override async initialize(args: MetaspaceInitializeOptions): Promise<void> {
//         const lc = `${this.lc}[${this.initialize.name}]`;

//         // const {
//         //   spaceName,
//         //   metaspaceFactory,
//         //   getFnAlert, getFnPrompt, getFnPromptPassword,
//         // } = args;
//         await this.initializeZeroSpace();
//         await super.initialize(args);
//     }

//     async initializeZeroSpace(): Promise<void> {
//         const lc = `[${this.initializeZeroSpace.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: a3364e9601c70c8163e67868e5d67723)`); }

//             // make sure the db and store exist for the zero space.

//             // I'll reuse storagePut to ensure the store exists for the zero space?

//             // is this initilizeStorage necessary with the initialization as
//             // referenced in the proceeding code with storageCreateStoreIfNotExist?

//             // await initializeStorage({
//             //   dbName: BLANK_GIB_DB_NAME,
//             //   storeName: ZERO_SPACE_ID,
//             //   logalot,
//             // });

//             if (logalot) { console.log(`${lc} we are assuming zero space storage is initialized in indexed db. atow (03/2025), this is done in initBlankGibStorage in index.mts (I: cb1dd69b21efc2fc366956349e865125)`); }
//             // this is now done in initBlankGibStorage in index.mts
//             // await storageCreateStoreIfNotExist({
//             //   dbName: BLANK_GIB_DB_NAME,
//             //   storeName: ZERO_SPACE_ID,
//             //   logalot,
//             // });

//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * I'm overriding this to troubleshoot figuring out why the space is
//      * becoming invalid.
//      */
//     override async getLocalUserSpace({ lock, localSpaceId, }: { lock?: boolean; localSpaceId?: SpaceId; }): Promise<IbGibSpaceAny | undefined> {
//         const lc = `${this.lc}[${this.getLocalUserSpace.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: e68ae7f617e4a1af026ab1ac1c52f425)`); }
//             const space = await super.getLocalUserSpace({ lock, localSpaceId });
//             if (!space) {
//                 console.error(`(UNEXPECTED) local user space falsy? NOTE: This error is just logged, not thrown as I don't know if this is always improper behavior. (E: 3c7cac40d11b26c3fd95183d06ffc225)`);
//                 return space; /* <<<< returns early */
//             }

//             const errors = await validateIbGibIntrinsically({ ibGib: space }) ?? [];
//             if (errors.length > 0) {
//                 // debugger; // space is invalid intrinsically? I'm putting this here to try to troubleshoot how this is coming to be.
//                 console.error(`(UNEXPECTED) local user space is invalid intrinsically? when did this happen? (E: df5c8e62c204a6972e364fa33d9b7725)`);
//             }

//             return space;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * overriding to try to execute serially via commanding architecture.
//      *
//      * just wraps super call with {@link commandifyAnonFn}.
//      *
//      * @see {@link commandifyAnonFn}
//      */
//     override async rel8ToCurrentRoot(opts: { ibGib: IbGib_V1; linked?: boolean; rel8nName?: string; space?: IbGibSpaceAny; }): Promise<void> {
//         const lc = `${this.lc}[${this.rel8ToCurrentRoot.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 0f999532d51b1ad2084ed30670297125)`); }

//             // const cmd = commandifyAnonFn<any>({
//             //     fn: () => {
//             const space = opts.space ?? await this.getLocalUserSpace({});
//             if (!space) { throw new Error(`(UNEXPECTED) space falsy and couldn't get default local user space? (E: e8b63af1b0fb692c4761fe9627eaf525)`); }
//             await execInSpaceWithLocking({
//                 fn: async () => {
//                     const lc = `${this.lc}[${this.rel8ToCurrentRoot.name}]`;
//                     try {
//                         if (logalot) { console.log(`${lc} starting... (I: 5444c70bd93b13b59ef9cd06ee72d825)`); }

//                         return super.rel8ToCurrentRoot(opts);

//                     } catch (error) {
//                         console.error(`${lc} ${extractErrorMsg(error)}`);
//                         throw error;
//                     } finally {
//                         if (logalot) { console.log(`${lc} complete.`); }
//                     }
//                 },
//                 scope: lc,
//                 secondsValid: 60,
//                 maxDelayMs: 100,
//                 maxLockAttempts: 600, // 60 seconds worth
//                 space,
//                 callerInstanceId: this.instanceId,
//             });

//             // debugger; // before viacmd?
//             // const result = cmd.fnViaCmd();
//             // debugger; // after viacmd?
//             // return result;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }

//     }

//     override async rel8ToSpecialIbGib(opts: {
//         type: SpecialIbGibType;
//         rel8nName: string;
//         ibGibsToRel8?: IbGib_V1[];
//         ibGibsToUnRel8?: IbGib_V1[];
//         linked?: boolean;
//         severPast?: boolean;
//         deletePreviousSpecialIbGib?: boolean;
//         space?: IbGibSpaceAny;
//     }): Promise<IbGibAddr> {
//         const lc = `${this.lc}[${this.rel8ToSpecialIbGib.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 906d2e553f163405f3238f141ed6fb25)`); }
//             // const { type, rel8nName, ibGibsToRel8, ibGibsToUnRel8, linked, severPast, deletePreviousSpecialIbGib, space, } = opts;

//             const space = opts.space ?? await this.getLocalUserSpace({});
//             if (!space) { throw new Error(`(UNEXPECTED) space falsy and couldn't get default local user space? (E: 3c587503d08aa8b8cda25bb7064bf125)`); }
//             const result = await execInSpaceWithLocking({
//                 fn: async () => {
//                     const lc = `${this.lc}[${this.rel8ToCurrentRoot.name}]`;
//                     try {
//                         if (logalot) { console.log(`${lc} starting... (I: 3b9f44934d88196bc3d0087cadd23125)`); }

//                         return super.rel8ToSpecialIbGib(opts);

//                     } catch (error) {
//                         console.error(`${lc} ${extractErrorMsg(error)}`);
//                         throw error;
//                     } finally {
//                         if (logalot) { console.log(`${lc} complete.`); }
//                     }
//                 },
//                 scope: lc,
//                 secondsValid: 60,
//                 maxDelayMs: 100,
//                 maxLockAttempts: 600, // 60 seconds worth
//                 space,
//                 callerInstanceId: this.instanceId,
//             });

//             return result;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

// }
