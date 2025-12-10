// import { clone, extractErrorMsg, getTimestampInTicks } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { IbGib_V1, Rel8n } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
// import { mut8 } from "@ibgib/ts-gib/dist/V1/transforms/mut8.mjs";
// import { getSpecialConfigKey, getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
// import { execInSpaceWithLocking, persistTransformResult } from "@ibgib/core-gib/dist/witness/space/space-helper.mjs";
// import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
// import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
// import { SpecialIbGibType } from "@ibgib/core-gib/dist/common/other/other-types.mjs";

// import { GLOBAL_LOG_A_LOT, } from "./constants.mjs";

// const logalot = GLOBAL_LOG_A_LOT; // change this when you want to turn off verbose logging

// export async function getTagsIbGib({
//     metaspace,
//     space,
// }: {
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny | undefined,
// }): Promise<IbGib_V1> {
//     const lc = `[${getTagsIbGib.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 2ccb79537a75e7896bace84e6c710d25)`); }

//         const tagsIbGib = await metaspace.getSpecialIbGib({ type: SpecialIbGibType.tags, space });
//         if (!tagsIbGib) { throw new Error(`tagsIbGib not found in metaspace. space: ${!!space ? space.ib : 'default local user space'} (E: 4734c510a411274315c0add8f70e1925)`); }

//         return tagsIbGib;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * NOTE: This was originally written only for agents and I'm generalizing it to
//  * any "coupled" ibgib. The idea is that for local-space-specific ibgibs that
//  * are related to domain ibgibs, but where we don't want to modify the domain
//  * ibgib directly, we create this "coupled" ibgib. We then index it in a local
//  * space special (index) ibgib and associate it by tjpAddr.
//  *
//  * Generates a consistent special name for the agent index ibGib based on the
//  * domain ibGib's primitive ancestor's ib or the ibGibAddr's ib atom.
//  *
//  * RIGHT NOW I"M PRIORITIZING THE ATOM. I THINK IT ALWAYS RETURNS THE ATOM, I.E., THE FIRST SPACE-DELIMITED PIECE OF THE `ib`.
//  *
//  * I am doing this because the project ibgib actually forks from a comment
//  * ibgib, so its primitive ancestor is "comment^gib".
//  *
//  * ## notes
//  *
//  * We are trying to get a special ibgib index that maps from ibgibs (the domain)
//  * to what local agent is registered to handle that ibgib's timeline.
//  *
//  * Concretely, we're working on the project ibgibs and we need a way to get at
//  * the agent that is assigned to that project. But we can't just mut8 the
//  * project itself because this would cause issues once the project is spread out
//  * among multiple execution contexts (similar to "remotes" in git).
//  *
//  * So we will have a special ibgib registered with the local space which will
//  * act as this index that maps ibgib -> handling agent. This function helps get
//  * the *name* of that special indexing ibgib.
//  *
//  * This can be driven either by the ibgib itself, via the last primitive ancestor
//  * ibgib's address, or via the ib's atom (the first space-delimited term in the
//  * `ib` metadata).
//  *
//  * So if an ancestor is [comment^gib, specialComment^gib, specialComment
//  * abc123^ABC123.DEF456] (where the abc123 things are representative of the full
//  * hashes 64 characters long atow since we're using sha256), then the *last*
//  * primitive address is specialComment^gib.
//  */
// export function getIndexNameFromIbGib({
//     scope,
//     ibGib,
//     ibGibAddr,
//     defaultNameIfError,
// }: {
//     /**
//      * what kind of index are we talking in general?
//      */
//     scope: string,
//     ibGib?: IbGib_V1,
//     ibGibAddr?: IbGibAddr,
//     /**
//      * if truthy and an error is produced, then this will be returned.
//      */
//     defaultNameIfError?: string,
// }): string {
//     const lc = `[${getIndexNameFromIbGib.name}]`;
//     try {
//         if (!ibGib && !ibGibAddr) { throw new Error(`${lc} Must provide either ibGib or ibGibAddr. (E: genuuid)`); }
//         if (scope.includes(' ')) {
//             console.warn(`${lc} scope includes one or more spaces. These will be converted to double underscores. (W: 1554a81454e8ae0a6858ea5dd17f8925)`);
//             scope = scope.replace(/ /g, '__');
//         }
//         /**
//          * note: non-alphanumerics are replaced with underscores
//          */
//         let primitiveAncestorIb: IbGibAddr | undefined = undefined;
//         let atom: string | undefined = undefined;
//         /**
//          * This is what we're trying to extract. once we have this, then we can
//          * simply append our index name, e.g. `${ancestorIbOrAtom}-agent-index`
//          */
//         let ancestorIbOrAtom: string | undefined = undefined;
//         if (ibGib) {
//             // go by the ibgib's full data
//             if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: genuuid)`); }
//             if (!ibGib.rel8ns) { throw new Error(`(UNEXPECTED) ibGib.rel8ns falsy? (E: genuuid)`); }
//             if (!ibGib.rel8ns.ancestor) { throw new Error(`(UNEXPECTED) ibGib.rel8ns.ancestor falsy? (E: genuuid)`); }
//             if (ibGib.rel8ns.ancestor.length === 0) {
//                 throw new Error(`(UNEXPECTED) ibGib.rel8ns.ancestor.length === 0? there should be at least one ancestor (E: genuuid)`);
//                 // this may turn into a warning later on down the road and return based on the ibGib's addr
//             }
//             if (ibGib && ibGibAddr) {
//                 if (getIbGibAddr({ ibGib }) !== ibGibAddr) {
//                     throw new Error(`(UNEXPECTED) both ibGib and ibGibAddr provided, but addr of ibGib doesn't equal ibGibAddr? (E: genuuid)`);
//                 }
//             }

//             // const primitiveAncestor = getPrimitiveAncestor({ ibGib });
//             const primitiveAncestorAddrs =
//                 ibGib.rel8ns.ancestor!.filter(x => isPrimitive({ gib: getIbAndGib({ ibGibAddr: x }).gib }));
//             if (primitiveAncestorAddrs.length === 0) {
//                 debugger; // error no primitive ancestor addrs?
//                 console.error(`${lc} ibGib has no primitive ancestor addrs? Still going to work off of the ib then, which should have the atom as the first space-delimited term. (E: genuuid)`)
//             }
//             const primitiveAncestorAddr = primitiveAncestorAddrs.at(-1)!;
//             primitiveAncestorIb =
//                 getIbAndGib({ ibGibAddr: primitiveAncestorAddr }).ib;
//             // replace ALL spaces with underscores
//             ancestorIbOrAtom = primitiveAncestorIb;
//         }

//         // get the atom from the address
//         ibGibAddr ??= getIbGibAddr({ ibGib });

//         // try to get at it from the ibGibAddr
//         const { ib } = getIbAndGib({ ibGibAddr });
//         atom = (ib.split(' ').at(0) ?? '');

//         // at this point we have a raw atom and possibly a raw primitive
//         // ancestor ib.  we want to compare the two, which usually should be the
//         // same (i think?). if different, warn and return
//         atom = atom.replace(/\W/g, '_');

//         primitiveAncestorIb ??= atom;
//         primitiveAncestorIb = primitiveAncestorIb.replace(/\W/g, '_');

//         if (!primitiveAncestorIb && !atom) {
//             throw new Error(`(UNEXPECTED) both primitiveAncestorIb and atom falsy? one should be truthy at this point. (E: genuuid)`);
//         }

//         // if (primitiveAncestorIb !== atom) {
//         //     // warn and do per arg
//         //     console.warn(`${lc} ibGib primitive ancestor ib (${primitiveAncestorIb}) doesn't match atom (${atom}). going with ancestorIbOrAtom: ${ancestorIbOrAtom} (W: genuuid)`);
//         // }
//         ancestorIbOrAtom = atom.toLowerCase();
//         if (logalot) { console.log(`${lc} ancestorIbOrAtom: ${ancestorIbOrAtom} (I: genuuid)`); }

//         /**
//          * I forgot, this cannot be kebab-cased because we only allow \w regexp
//          * on the special ibgib name. I don't remember the reasoning for this,
//          * may be arbitrary. But for now, going to change this to underscore,
//          * even though the atom or ancestor ib may have underscores in it. Ah
//          * well.
//          */
//         const indexName = `${ancestorIbOrAtom}_${scope}index`;
//         if (logalot) { console.log(`${lc} indexName: ${indexName} (I: genuuid)`); }
//         return indexName;
//     } catch (error) {
//         if (!!defaultNameIfError) {
//             console.warn(`${lc} error happened but defaultNameIfError (${defaultNameIfError}) provided. So will return this value. error that was thrown: ${extractErrorMsg(error)}`);
//             return defaultNameIfError;
//         } else {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         }
//     }
// }

// /**
//  * NOTE: This was originally written only for agents and I'm generalizing it to
//  * any "coupled" ibgib. The idea is that for local-space-specific ibgibs that
//  * are related to domain ibgibs, but where we don't want to modify the domain
//  * ibgib directly, we create this "coupled" ibgib. We then index it in a local
//  * space special (index) ibgib and associate it by tjpAddr.
//  * Retrieves the agent ibGib associated with a domain ibGib from the special agent index ibGib.
//  *
//  * may have to change this to require the ibgib, not give an optional
//  * domainIbGibAddr
//  */
// export async function getLocalCoupledIbGibForDomainIbGib<TIbGib extends IbGib_V1>({
//     scope,
//     ibGib,
//     metaspace,
//     space,
//     skipGetLatest,
// }: {
//     scope: string,
//     ibGib: IbGib_V1,
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny,
//     /**
//      * if true, will not call getLatest on the coupled ibgib if found.
//      */
//     skipGetLatest?: boolean,
// }): Promise<TIbGib | undefined> {
//     const lc = `[${getLocalCoupledIbGibForDomainIbGib.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: f19dc86aab380fe809aef27ccc7a7425)`); }

//         if (!scope) { throw new Error(`scope required to be a non-empty string (E: 73e702495c38c7d8747d1cf8850af825)`); }
//         if (!ibGib) { throw new Error(`ibGib required (E: genuuid)`); }

//         // Get the index name and domain TJP address
//         const indexSpecialIbGibType: SpecialIbGibType =
//             getIndexNameFromIbGib({ scope, ibGib, }) as SpecialIbGibType;

//         const domainTjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' })!;

//         // Get the index ibGib
//         const fn: () => Promise<TIbGib | undefined> = async () => {
//             const specialIndex = await metaspace.getSpecialIbGib({
//                 type: indexSpecialIbGibType,
//                 space,
//                 initialize: false, // Do not create if it doesn't exist when retrieving
//                 dontWarnIfNotExist: true, // Don't warn if the index doesn't exist
//                 lock: true,
//             });

//             // If the index ibGib doesn't exist, nothing is registered for this domain ibgib
//             if (!specialIndex || !specialIndex.data) {
//                 if (logalot) { console.log(`${lc} special ${scope} index ibGib not found for indexSpecialIbGibType (${indexSpecialIbGibType}). No coupled ibgib registered, returning undefined. (I: genuuid)`); }
//                 return undefined; /* <<<< returns early */
//             }

//             // Get the address from the map
//             const coupleMap: { [tjpAddr: string]: IbGibAddr } =
//                 specialIndex.data.coupleMap ??
//                 specialIndex.data.agentMap ??
//                 {};
//             const coupledAddr = coupleMap[domainTjpAddr];

//             if (!coupledAddr) {
//                 if (logalot) { console.log(`${lc} No coupled ${scope} ibgib address found for domain ${domainTjpAddr} in the coupled index map. indexSpecialIbGibType: ${indexSpecialIbGibType}. returning undefined. (I: genuuid)`); }
//                 return undefined; /* <<<< returns early */
//             }

//             let addrToGet = skipGetLatest ?
//                 coupledAddr :
//                 await metaspace.getLatestAddr({ addr: coupledAddr, space }) ?? coupledAddr;

//             let resGet = await metaspace.get({
//                 addrs: [addrToGet],
//                 space,
//             });

//             if (resGet.errorMsg || (resGet.ibGibs ?? []).length !== 1) {
//                 throw new Error(`couldn't get latest coupled ibgib (${addrToGet}) for domain ${domainTjpAddr}.  (E: 8aa7b25f5cd4ebadd8bf2f8807dfe825)`);
//             }

//             return resGet.ibGibs![0] as TIbGib;
//         }

//         const result = await execInSpaceWithLocking({
//             scope: indexSpecialIbGibType,
//             secondsValid: 180,     // Example timeout
//             maxDelayMs: 100,       // Example delay
//             maxLockAttempts: 1800, // Example attempts
//             space,
//             callerInstanceId: lc + getTimestampInTicks(),
//             fn,
//         });

//         return result;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Registers a domain ibGib with its associated agent ibGib in the special agent
//  * index ibGib.  This creates or updates a mapping from the domain ibGib's TJP
//  * address to the agent's address.
//  *
//  * ## intent
//  *
//  * we want to rel8 ibgibs but not directly change the domain ibgib. Like if we
//  * have an ibgib that we want to collaborate on, we want a mechanism for the
//  * local space (later local user via keystone) to have settings, agents, etc.,
//  * for that domain ibgib. But each space has its own version, like a local/user
//  * settings vs. a workspace settings.
//  *
//  * So this gets/creates an index on the local space and associates the domain
//  * with the local.
//  *
//  * @example
//  * use this to couple a local agent to a domain ibgib or a local settings ibgib
//  * to a domain ibgib, that you do not want to share with others who will have
//  * their own versions.
//  */
// export async function coupleDomainIbGibWithLocalIbGibViaIndex({
//     scope,
//     domainIbGib,
//     localIbGib,
//     metaspace,
//     space,
// }: {
//     scope: string,
//     domainIbGib: IbGib_V1,
//     localIbGib: IbGib_V1,
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny,
// }): Promise<void> {
//     const lc = `[${coupleDomainIbGibWithLocalIbGibViaIndex.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 217ae68e0c820e48f4c00409f7f14325)`); }

//         const indexSpecialIbGibType: SpecialIbGibType =
//             getIndexNameFromIbGib({ scope, ibGib: domainIbGib, });

//         const domainTjpAddr = getTjpAddr({ ibGib: domainIbGib });
//         const localAddr = getIbGibAddr({ ibGib: localIbGib });

//         if (!domainTjpAddr) { throw new Error(`${lc} Could not get TJP address for domain ibGib. (E: 35a4e8ac291b0b85cb958e28dd812f25)`); }
//         if (!localAddr) { throw new Error(`${lc} Could not get address for agent ibGib. (E: 2fce1187630b45934c4155a23204d125)`); }

//         const fn = async () => {

//             // Get or create the agent index ibGib
//             const agentSpecialIndex = await metaspace.getSpecialIbGib({
//                 type: indexSpecialIbGibType,
//                 space,
//                 initialize: true, // Create if it doesn't exist
//                 dontWarnIfNotExist: true,
//                 lock: false,
//             });

//             if (!agentSpecialIndex) { throw new Error(`${lc} Could not get or create agent index ibGib.`); }

//             // Initialize data if it doesn't exist
//             if (!agentSpecialIndex.data) {
//                 throw new Error(`(UNEXPECTED) agentSpecialIndex.data falsy? (E: 74299eed147debf6398ca37e7b8d5c25)`);
//             }

//             // Get the current mapping or initialize an empty one
//             const map = agentSpecialIndex.data.coupleMap ?? agentSpecialIndex.data.agentMap;
//             const coupleMap: { [tjpAddr: string]: IbGibAddr } =
//                 !!map ? clone(map) : {};

//             // Update the mapping
//             const existingMappedAgentAddr = coupleMap[domainTjpAddr];
//             if (existingMappedAgentAddr) {
//                 if (existingMappedAgentAddr === localAddr) {
//                     if (logalot) { console.log(`${lc} domain ibGib (${domainTjpAddr}) already mapped to agent (${localAddr}). returning early (I: cb5d4dcef8cf14de7336120fb8ffef25)`); }
//                     return; /* <<<< returns early */
//                 } else {
//                     console.warn(`${lc} domainTjpAddr (${domainTjpAddr}) already assigned to existingMappedAgentAddr (${existingMappedAgentAddr}). We will be changing to new localAddr (${localAddr}). (W: eb993e33f7731e570fa76f24a2d80625)`)
//                 }
//             }
//             coupleMap[domainTjpAddr] = localAddr;

//             // Assign the updated map back to data Save the updated index ibGib.
//             // there is extra plumbing involved with special index ibgibs. see
//             // `rel8ToSpecialIbGib` for an example in
//             // libs/core-gib/src/witness/space/space-helper.mts
//             // await updateSpecialIndex({
//             //     metaspace,
//             //     type: indexSpecialIbGibType,
//             //     dataToAddOrPatch: { coupleMap },
//             //     space,
//             // });
//             const resNewSpecial = await mut8({
//                 src: agentSpecialIndex,
//                 dataToAddOrPatch: { coupleMap },
//                 dna: false,
//                 linkedRel8ns: [Rel8n.past],
//                 nCounter: true,
//             });

//             const newSpecialIbGib = resNewSpecial.newIbGib;

//             // persist
//             await persistTransformResult({ resTransform: resNewSpecial, space });

//             // update the space ibgib which contains the special/config information
//             const configKey = getSpecialConfigKey({ type: indexSpecialIbGibType });
//             await metaspace.setConfigAddr({
//                 key: configKey,
//                 addr: getIbGibAddr({ ibGib: newSpecialIbGib }),
//                 space,
//             });

//             await metaspace.registerNewIbGib({ ibGib: newSpecialIbGib, space, });
//         }

//         await execInSpaceWithLocking({
//             scope: indexSpecialIbGibType, // Use the special index type as the lock scope.
//             secondsValid: 60, // Example timeout
//             maxDelayMs: 100, // Example delay
//             maxLockAttempts: 600, // Example attempts
//             space,
//             // callerInstanceId: // You might need a way to generate a unique ID for the caller
//             fn,
//         });

//         if (logalot) { console.log(`${lc} Registered domain ${domainTjpAddr} with agent ${localAddr}`); }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Returns a function, that, as long as it continues to be invoked, will not
//  * be triggered. The function will be called after it stops being called for
//  * N milliseconds. If `immediate` is passed, trigger the function on the
//  * leading edge, instead of the trailing.
//  *
//  * @param func The function to debounce.
//  * @param wait The number of milliseconds to wait after the last call.
//  * @param immediate If true, trigger the function on the leading edge.
//  * @returns A debounced version of the function.
//  */
// export function debounce<T extends (...args: any[]) => void>(
//     func: T,
//     wait: number,
//     immediate?: boolean
// ): (...args: Parameters<T>) => void {
//     let timeout: ReturnType<typeof setTimeout> | null = null;

//     return function (this: any, ...args: Parameters<T>): void {
//         const context = this;

//         const later = function (): void {
//             timeout = null;
//             if (!immediate) {
//                 func.apply(context, args);
//             }
//         };

//         const callNow = immediate && !timeout;

//         if (timeout) {
//             clearTimeout(timeout);
//         }

//         timeout = setTimeout(later, wait);

//         if (callNow) {
//             func.apply(context, args);
//         }
//     };
// }

// export function getMaskedSecret({ secret, countToShow }: { secret: string, countToShow: number }): string {
//     const lc = `[${getMaskedSecret.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 4d479c342b77f12568501c085b4b0425)`); }
//         if (secret) {
//             if (countToShow > secret.length) {
//                 if (secret.length === 1) {
//                     console.warn(`${lc} secret is one character? (W: genuuid)`);
//                     return secret; // whatever
//                 } else {
//                     console.warn(`${lc} countToShow is longer than the entire secret! just showing the last two (W: genuuid)`);
//                     return `****${secret.substring(secret.length - 2)}`;
//                 }
//             } else {
//                 // show the last countToShow
//                 const secretMasked = `****${secret.substring(secret.length - countToShow)}`;
//                 return secretMasked;
//             }
//         } else {
//             console.error(`${lc} secret falsy? empty? returning empty string. (E: genuuid)`);
//             return '';
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function insertAt<T>({
//     newItems,
//     index,
//     targetArray,
// }: {
//     newItems: T[],
//     index: number,
//     targetArray: T[],
// }): T[] {
//     const lc = `[${insertAt.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 5fc3c84d9e08f4ee88978be8bd117a25)`); }

//         if (index < 0 || index >= targetArray.length) {
//             throw new Error(`index (${index}) is out of bounds for targetArray (length ${targetArray.length}) (E: genuuid)`);
//         }

//         const arrayCopy = [...targetArray];
//         arrayCopy.splice(index, 0, ...newItems);
//         return arrayCopy;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function deleteAt<T>({
//     targetArray,
//     index,
// }: {
//     targetArray: T[],
//     index: number,
// }): T[] {
//     const lc = `[${deleteAt.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 6f2df80039f897a0883714686af97925)`); }

//         if (index < 0 || index >= targetArray.length) {
//             throw new Error(`index (${index}) is out of bounds for targetArray (length ${targetArray.length}) (E: genuuid)`);
//         }

//         const arrayCopy = [...targetArray];
//         arrayCopy.splice(index, 1);
//         return arrayCopy;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// export function getShortenedStringWithEllipsis({
//     str,
//     maxChars,
// }: {
//     str: string,
//     maxChars: number,
// }): string {
//     const lc = `[${getShortenedStringWithEllipsis.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 228729c84d2805bc186e96c8cbc56825)`); }

//         if (str.length <= maxChars) {
//             return str;
//         } else {
//             return str.substring(0, maxChars - 1) + '…';
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
