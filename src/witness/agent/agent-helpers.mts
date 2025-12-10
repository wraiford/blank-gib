// import { extractErrorMsg, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { IbGib_V1, } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
// import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";
// import { SpecialIbGibType } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
// import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
// import { TAG_REL8N_NAME } from "@ibgib/core-gib/dist/common/tag/tag-constants.mjs";
// import { getTjpAddr, toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
// import { TagIbGib_V1 } from "@ibgib/core-gib/dist/common/tag/tag-types.mjs";
// import { updateSpecialIndex } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";

// import {
//     GLOBAL_LOG_A_LOT, TAG_AGENT_DESCRIPTION, TAG_AGENT_IB, TAG_AGENT_ICON,
//     TAG_AGENT_TEXT,
// } from "../../constants.mjs";
// import { AgentWitnessAny, AgentWitnessIbGib_V1 } from "./agent-one-file.mjs";
// import { AGENT_REL8N_NAME } from "./agent-constants.mjs";
// import {
//     coupleDomainIbGibWithLocalIbGibViaIndex, getIndexNameFromIbGib,
//     getLocalCoupledIbGibForDomainIbGib, getTagsIbGib
// } from "../../helpers.mjs";
// import { getAgentsSvc } from "./agents-service-v1.mjs";
// import { CreateConcreteAgentWitnessFactory, CreateNewAgentArg } from "./agent-types.mjs";
// import { CreateConcreteAgentWitnessFactory_Gemini } from "./gemini/gemini-agent-factory.mjs";

// const logalot = GLOBAL_LOG_A_LOT; // change this when you want to turn off verbose logging

// // #region snapshot of the component src file

// // #endregion snapshot of the component src file

// /**
//  * helper that gets/creates the agents tag in the given {@link space}, or in the
//  * default local user space if {@link space} is falsy.
//  * @returns agents tag ibgib
//  */
// export async function getTag_Agents({
//     metaspace,
//     space,
//     createIfNone,
// }: {
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny | undefined,
//     createIfNone?: boolean,
// }): Promise<TagIbGib_V1> {
//     const lc = `[${getTag_Agents.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: ad1594767abce66ca80fea8c8d89f325)`); }
//         space ??= await metaspace.getLocalUserSpace({ lock: false });
//         if (!space) { throw new Error(`(UNEXPECTED) space falsy after getting local user space? (E: bc68d97d46dcf1d15dd74edba200b725)`); }

//         const tagsIbGib: IbGib_V1 = await getTagsIbGib({ metaspace, space });
//         if (!tagsIbGib.rel8ns) { throw new Error(`(UNEXPECTED) tagsIbGib.rel8ns falsy? (E: dc50e8d218fe5e30bbaec7f37d484525)`); }
//         const tagAddrs = tagsIbGib.rel8ns[TAG_REL8N_NAME] ?? [];
//         const agentTagAddrs = tagAddrs.filter(x => {
//             const { ib } = getIbAndGib({ ibGibAddr: x });
//             return ib === TAG_AGENT_IB;
//         });
//         let agentTagAddr: IbGibAddr | undefined = undefined;
//         let agentTagIbGib: TagIbGib_V1 | undefined = undefined;
//         if (agentTagAddrs.length === 0) {
//             if (createIfNone) {
//                 if (logalot) { console.log(`${lc} creating new agents tag... (I: 47f4f4fa89f1a1bba960e0a6ff5f5225)`); }

//                 const { newTagIbGib, } = await metaspace.createTagIbGib({
//                     text: TAG_AGENT_TEXT,
//                     icon: TAG_AGENT_ICON,
//                     description: TAG_AGENT_DESCRIPTION,
//                     space,
//                 });
//                 agentTagIbGib = newTagIbGib;
//                 if (logalot) { console.log(`${lc} creating new agents tag complete. (I: 5f41d644f2b692348377f918057cf225)`); }
//                 return newTagIbGib; /* <<<< returns early */
//             }
//         } else if (agentTagAddrs.length === 1) {
//             agentTagAddr = agentTagAddrs.at(0)!;
//             if (logalot) { console.log(`${lc} exactly one agent tag addr found (${agentTagAddr}) in space (${space.ib}) (I: 7ef995963313c966216097760d0cdb25)`); }
//         } else {
//             // more than one agent tag?
//             agentTagAddr = agentTagAddrs.at(0)!;
//             console.error(`${lc} more than one agent tag found in space (${space.ib})? Well, we're returning just the first one (${agentTagAddr}), but really we've not coded for this edge/future case. (E: 52a4e2e49d3c0d644df483119b46f125)`);
//         }

//         if (agentTagAddr) {
//             const resGet = await metaspace.get({ addrs: [agentTagAddr], space });
//             if (resGet.success && resGet.ibGibs?.length === 1) {
//                 agentTagIbGib = resGet.ibGibs.at(0)! as TagIbGib_V1;
//                 return agentTagIbGib;
//             } else {
//                 throw new Error(`couldn't get agentTagAddr (${agentTagAddr}) in space (${space.ib}) (E: 53d9cdb7b769014a2de15871484cc325)`);
//             }
//         } else {
//             throw new Error(`agentTagAddr not found, so there ain't no agents tag, and createIfNone was ${createIfNone}. (E: 54cb3164a118105f187e936613ff4625)`);
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * gets agents of a certain {@link type} in the local space corresponding to
//  * {@link spaceId} (or default local user space if falsy) via the agents tag.
//  */
// export async function getAgents({
//     metaspace,
//     type,
//     spaceId,
//     space,
// }: {
//     metaspace: MetaspaceService,
//     type: SpecialIbGibType,
//     spaceId?: SpaceId,
//     space?: IbGibSpaceAny,
// }): Promise<AgentWitnessAny[]> {
//     const lc = `[${getAgents.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 41037d1926051c4b051769069f518f25)`); }

//         space ??= await metaspace.getLocalUserSpace({ localSpaceId: spaceId, lock: false });
//         if (!space) { throw new Error(`couldn't get local user space by id (${spaceId}) (E: fe96076e79fb227c0ae2de077eb5e225)`); }

//         // initialize the agent index if it hasn't already been created we
//         // don't actually use this (and thus it's slightly inefficient)
//         // because we use the next getSpecialRel8dIbGibs call
//         const agentsIndexIbGib = await metaspace.getSpecialIbGib({
//             type,
//             initialize: true,
//             dontWarnIfNotExist: true,
//             lock: false, // not worried about this atow 01/2024
//             space,
//         });
//         if (!agentsIndexIbGib) { throw new Error(`(UNEXPECTED) couldn't initialize/get agents special ibgib? (E: 1abe0e2543711744adbdb7026b242e25)`); }
//         const agentIbGibs = (await metaspace.getSpecialRel8dIbGibs({
//             rel8nName: AGENT_REL8N_NAME,
//             type,
//             // type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
//             space,
//         }) ?? []) as AgentWitnessAny[]; // NOT actually witnesses yet!!!!!

//         /**
//          * convert to witnesses...right now, I'm realizing I screwed up the
//          * factory pattern to not be generalized enough and I' msoooooooo fing
//          * tired. I mean, wtf am I doing with my life right.  Project IDX is
//          * SLOOOOOW as hell and as usual, I'm fing too poor to do anything about
//          * fing anything. Anyway, we have ibgib (dtos) not witnesses which have
//          * actual OOP properties/methods. atow (04/2025) we only have gemini
//          * witnesses, so going to hardcode that in. But this needs to be changed
//          * to use a proper factory
//          */
//         const resAgentWitnessesProper: AgentWitnessAny[] = [];
//         for (const agentIbGib of agentIbGibs) {
//             if (agentIbGib.data?.api !== 'gemini') {
//                 throw new Error(`(UNEXPECTED) agentIbGib.data.api !== gemini? only gemini is implemented right now. (E: 7348fe8c68565bcf88a4052458f42d25)`);
//             }

//             const agentsSvc = getAgentsSvc();

//             let actualWitness = await agentsSvc.getLatestAgent({ id: agentIbGib.data.uuid! });
//             if (!actualWitness) {
//                 actualWitness = await agentsSvc.getAgentWitnessFromDto({ dto: agentIbGib });
//                 if (!actualWitness) {
//                     debugger; // error couldn't get agent from dto?
//                     throw new Error(`(UNEXPECTED) couldn't get actual agent witness from agent dto? have we registered classname (${agentIbGib.data?.classname}) and factory fn with agents service? (E: bcbfdf6446793ac34d6f6118e050d325)`);
//                 }
//                 // actualWitness = await agentIbGibDtoToWitness({ agentIbGib });
//                 await agentsSvc.updateOrSetLatestAgent({
//                     agent: actualWitness,
//                     throwIfNewerFound: false, // we just got this from the special index
//                 });
//             }
//             resAgentWitnessesProper.push(actualWitness);
//         }
//         return resAgentWitnessesProper;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * i'm updating the index proactively so we don't need to rely on jit getLatest
//  * any time we want to get the agent.
//  */
// export async function updateAgentIndex({
//     metaspace,
//     type,
//     space,
//     newAgentIbGib,
// }: {
//     metaspace: MetaspaceService,
//     type: SpecialIbGibType, // has | string in it
//     space: IbGibSpaceAny,
//     newAgentIbGib: AgentWitnessIbGib_V1,
// }): Promise<void> {
//     // await commandifyAnonFn({

//     const fn: () => Promise<void> = async () => {
//         const lc = `[${updateAgentIndex.name}]`;
//         try {
//             // d ebugger; // is this hit as expected? yes
//             if (logalot) { console.log(`${lc} starting... (I: bf6ff6bf4132eaa943eaa3af1ee17225)`); }
//             if (!newAgentIbGib.data) { throw new Error(`(UNEXPECTED) newAgentIbGib.data falsy? (E: 26e03d0a8e286ac3a13b678a50c87a25)`); }
//             if (!newAgentIbGib.data.uuid) { throw new Error(`(UNEXPECTED) newAgentIbGib.data.uuid falsy? (E: 31b753e01275272484ea93e3dfe53225)`); }



//             const agentsSvc = getAgentsSvc();

//             const latestAgentInMemory = await agentsSvc.getLatestAgent({
//                 id: newAgentIbGib.data.uuid,
//             });
//             if (latestAgentInMemory) {
//                 // make sure that we have a higher n than the existing latest
//                 if (latestAgentInMemory.data!.n! > newAgentIbGib.data.n!) {
//                     debugger; // error: latest in memory is newer than the new agent trying to update index
//                     throw new Error(`latestInMemory.data!.n! > newAgentIbGib.data.n! ... in plain english, this means that there is a more recent (higher n) agent with the given agent's id (${newAgentIbGib.data.uuid}) already in existence, but the caller is trying to update the special ibgib index with the older agent. (E: 5c0c028075736f22072c55e20a0c7e25)`);
//                 }
//             }

//             const newAgentAddr = getIbGibAddr({ ibGib: newAgentIbGib });

//             await updateSpecialIndex({
//                 type: newAgentIbGib.data.type,
//                 rel8nInfos: [
//                     {
//                         rel8nName: AGENT_REL8N_NAME,
//                         ibGibs: [toDto({ ibGib: newAgentIbGib })],
//                     },
//                 ],
//                 metaspace,
//                 space,
//             });

//             // const agentsIndexIbGib = await metaspace.getSpecialIbGib({
//             //     type,
//             //     space,
//             //     initialize: true,
//             // });
//             // if (!agentsIndexIbGib) { throw new Error(`(UNEXPECTED) couldn't initialize/get agents special ibgib (index)? (E: 3c1c21305b256d468b2be9d12243c825)`); }

//             // /**
//             //  * find ibgib(s) to unrel8. should only be one at most but will cover if multiple
//             //  */
//             // let ibGibsToUnRel8: IbGib_V1[] | undefined = undefined;
//             // const agentAddrs = (agentsIndexIbGib?.rel8ns ?? {})[AGENT_REL8N_NAME] ?? [];
//             // if (agentAddrs.some(x => x === newAgentAddr)) {
//             //     if (logalot) { console.log(`${lc} agent addr (${newAgentAddr}) already registered with special ibgib index. (I: 2d0f370b0f9f3ec263489228f801ee25)`); }
//             // }
//             // const toRemoveAddrs: IbGibAddr[] | undefined = newAgentIbGib.rel8ns?.past?.filter(x => agentAddrs.includes(x)) ?? [];
//             // if (toRemoveAddrs.length > 0) {
//             //     const resGetToRemove = await metaspace.get({
//             //         addrs: toRemoveAddrs,
//             //         space,
//             //     });
//             //     if (resGetToRemove.success &&
//             //         (resGetToRemove.ibGibs ?? []).length === toRemoveAddrs.length) {
//             //         ibGibsToUnRel8 = resGetToRemove.ibGibs;
//             //     } else {
//             //         debugger; // error in getting previous agents when attempting to unrel8 past agents after an update to the agent index
//             //         throw new Error(`failed to get previous agents? wrong space maybe? space.ib: ${space.ib} (E: 97d77376bccdb44dec65a5b725108e25)`);
//             //     }
//             // }

//             // // update the index by relating the new ibgib and removing any
//             // // old ones if applicable
//             // await metaspace.rel8ToSpecialIbGib({
//             //     type,
//             //     rel8nName: AGENT_REL8N_NAME,
//             //     ibGibsToRel8: [toDto({ ibGib: newAgentIbGib })],
//             //     ibGibsToUnRel8,
//             //     space,
//             // });
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     await fn();

//     // await execInSpaceWithLocking({
//     //     fn,
//     //     scope: type,
//     //     secondsValid: 60,
//     //     maxDelayMs: 100,
//     //     maxLockAttempts: 600, // 60 seconds worth
//     //     space,
//     //     callerInstanceId: getTimestampInTicks() + '_' + newAgentIbGib.gib,
//     // });
// }

// /**
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
// export function getAgentIndexNameFromIbGib({
//     ibGib,
//     ibGibAddr,
//     defaultNameIfError,
// }: {
//     ibGib?: IbGib_V1,
//     ibGibAddr?: IbGibAddr,
//     /**
//      * if truthy and an error is produced, then this will be returned.
//      */
//     defaultNameIfError?: string,
// }): string {
//     const lc = `[${getAgentIndexNameFromIbGib.name}]`;
//     try {
//         if (!ibGib && !ibGibAddr) { throw new Error(`${lc} Must provide either ibGib or ibGibAddr. (E: 712592bd51cabec9d23aee3a8ec2d625)`); }

//         let res = getIndexNameFromIbGib({
//             scope: 'agent',
//             ibGib,
//             ibGibAddr,
//             defaultNameIfError,
//         });
//         return res;

//         // /**
//         //  * note: non-alphanumerics are replaced with underscores
//         //  */
//         // let primitiveAncestorIb: IbGibAddr | undefined = undefined;
//         // let atom: string | undefined = undefined;
//         // /**
//         //  * This is what we're trying to extract. once we have this, then we can
//         //  * simply append our index name, e.g. `${ancestorIbOrAtom}-agent-index`
//         //  */
//         // let ancestorIbOrAtom: string | undefined = undefined;
//         // if (ibGib) {
//         //     // go by the ibgib's full data
//         //     if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: 31514bbd270384cc9a300fdab7603525)`); }
//         //     if (!ibGib.rel8ns) { throw new Error(`(UNEXPECTED) ibGib.rel8ns falsy? (E: e011d3ac53fb33bd82b4075e57f46825)`); }
//         //     if (!ibGib.rel8ns.ancestor) { throw new Error(`(UNEXPECTED) ibGib.rel8ns.ancestor falsy? (E: a2dcd5c706cfca2781cb13a76f1ff625)`); }
//         //     if (ibGib.rel8ns.ancestor.length === 0) {
//         //         throw new Error(`(UNEXPECTED) ibGib.rel8ns.ancestor.length === 0? there should be at least one ancestor (E: 1c7645024de35a4ca114631b2ab38c25)`);
//         //         // this may turn into a warning later on down the road and return based on the ibGib's addr
//         //     }
//         //     if (ibGib && ibGibAddr) {
//         //         if (getIbGibAddr({ ibGib }) !== ibGibAddr) {
//         //             throw new Error(`(UNEXPECTED) both ibGib and ibGibAddr provided, but addr of ibGib doesn't equal ibGibAddr? (E: ef241d9cece84e0a5aa93a35fae5bc25)`);
//         //         }
//         //     }

//         //     // const primitiveAncestor = getPrimitiveAncestor({ ibGib });
//         //     const primitiveAncestorAddrs =
//         //         ibGib.rel8ns.ancestor!.filter(x => isPrimitive({ gib: getIbAndGib({ ibGibAddr: x }).gib }));
//         //     if (primitiveAncestorAddrs.length === 0) {
//         //         debugger; // error no primitive ancestor addrs?
//         //         console.error(`${lc} ibGib has no primitive ancestor addrs? Still going to work off of the ib then, which should have the atom as the first space-delimited term. (E: e5ad2e057daa539d3de2c0f78eb5de25)`)
//         //     }
//         //     const primitiveAncestorAddr = primitiveAncestorAddrs.at(-1)!;
//         //     primitiveAncestorIb =
//         //         getIbAndGib({ ibGibAddr: primitiveAncestorAddr }).ib;
//         //     // replace ALL spaces with underscores
//         //     ancestorIbOrAtom = primitiveAncestorIb;
//         // }

//         // // get the atom from the address
//         // ibGibAddr ??= getIbGibAddr({ ibGib });

//         // // try to get at it from the ibGibAddr
//         // const { ib } = getIbAndGib({ ibGibAddr });
//         // atom = (ib.split(' ').at(0) ?? '');

//         // // at this point we have a raw atom and possibly a raw primitive
//         // // ancestor ib.  we want to compare the two, which usually should be the
//         // // same (i think?). if different, warn and return
//         // atom = atom.replace(/\W/g, '_');

//         // primitiveAncestorIb ??= atom;
//         // primitiveAncestorIb = primitiveAncestorIb.replace(/\W/g, '_');

//         // if (!primitiveAncestorIb && !atom) {
//         //     throw new Error(`(UNEXPECTED) both primitiveAncestorIb and atom falsy? one should be truthy at this point. (E: 5c7af3e1cc042aff674640ee4c7f2c25)`);
//         // }

//         // if (primitiveAncestorIb !== atom) {
//         //     // warn and do per arg
//         //     console.warn(`${lc} ibGib primitive ancestor ib (${primitiveAncestorIb}) doesn't match atom (${atom}). going with ancestorIbOrAtom: ${ancestorIbOrAtom} (W: fc2301a4a4b4ee20d90265c7bf650425)`);
//         // }
//         // ancestorIbOrAtom = atom.toLowerCase();
//         // if (logalot) { console.log(`${lc} ancestorIbOrAtom: ${ancestorIbOrAtom} (I: d1ebc76770f110d2631e369f5b094925)`); }

//         // /**
//         //  * I forgot, this cannot be kebab-cased because we only allow \w regexp
//         //  * on the special ibgib name. I don't remember the reasoning for this,
//         //  * may be arbitrary. But for now, going to change this to underscore,
//         //  * even though the atom or ancestor ib may have underscores in it. Ah
//         //  * well.
//         //  */
//         // const indexName = `${ancestorIbOrAtom}_agentindex`;
//         // if (logalot) { console.log(`${lc} indexName: ${indexName} (I: ffef5d9037d62758032aa73f252f3625)`); }
//         // return indexName;
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
//  * Registers a domain ibGib with its associated agent ibGib in the special agent index ibGib.
//  * This creates or updates a mapping from the domain ibGib's TJP address to the agent's address.
//  */
// export async function registerDomainIbGibWithAgentIndex({
//     domainIbGib,
//     agentIbGib,
//     metaspace,
//     space,
// }: {
//     domainIbGib: IbGib_V1,
//     agentIbGib: AgentWitnessIbGib_V1,
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny,
// }): Promise<void> {
//     const lc = `[${registerDomainIbGibWithAgentIndex.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 217ae68e0c820e48f4c00409f7f14325)`); }

//         await coupleDomainIbGibWithLocalIbGibViaIndex({
//             scope: 'agent',
//             domainIbGib,
//             localIbGib: agentIbGib,
//             metaspace,
//             space,
//         });

//         // Delete the following commented out code (and related code) after
//         // awhile (atow 05/2025). I have confirmed it looks like it's working
//         // with the above refactored, more generalized code, but meh...

//         // const agentIndexSpecialIbGibType: SpecialIbGibType =
//         //     // getAgentIndexNameFromIbGib({ ibGib: domainIbGib }) as SpecialIbGibType;
//         //     getIndexNameFromIbGib({ scope: 'agent', ibGib: domainIbGib, });

//         // const domainTjpAddr = getTjpAddr({ ibGib: domainIbGib });
//         // const agentAddr = getIbGibAddr({ ibGib: agentIbGib });

//         // if (!domainTjpAddr) { throw new Error(`${lc} Could not get TJP address for domain ibGib. (E: 35a4e8ac291b0b85cb958e28dd812f25)`); }
//         // if (!agentAddr) { throw new Error(`${lc} Could not get address for agent ibGib. (E: 2fce1187630b45934c4155a23204d125)`); }

//         // const fn = async () => {

//         //     // Get or create the agent index ibGib
//         //     const agentSpecialIndex = await metaspace.getSpecialIbGib({
//         //         type: agentIndexSpecialIbGibType,
//         //         space,
//         //         initialize: true, // Create if it doesn't exist
//         //         dontWarnIfNotExist: true,
//         //         lock: false,
//         //     });

//         //     if (!agentSpecialIndex) { throw new Error(`${lc} Could not get or create agent index ibGib.`); }

//         //     // Initialize data if it doesn't exist
//         //     if (!agentSpecialIndex.data) {
//         //         throw new Error(`(UNEXPECTED) agentSpecialIndex.data falsy? (E: 74299eed147debf6398ca37e7b8d5c25)`);
//         //     }

//         //     // Get the current mapping or initialize an empty one
//         //     const agentMap: { [tjpAddr: string]: IbGibAddr } =
//         //         !!agentSpecialIndex.data.agentMap ?
//         //             clone(agentSpecialIndex.data.agentMap) :
//         //             {};

//         //     // Update the mapping
//         //     const existingMappedAgentAddr = agentMap[domainTjpAddr];
//         //     if (existingMappedAgentAddr) {
//         //         if (existingMappedAgentAddr === agentAddr) {
//         //             if (logalot) { console.log(`${lc} domain ibGib (${domainTjpAddr}) already mapped to agent (${agentAddr}). returning early (I: cb5d4dcef8cf14de7336120fb8ffef25)`); }
//         //             return; /* <<<< returns early */
//         //         } else {
//         //             console.warn(`${lc} domainTjpAddr (${domainTjpAddr}) already assigned to existingMappedAgentAddr (${existingMappedAgentAddr}). We will be changing to new agentAddr (${agentAddr}). (W: eb993e33f7731e570fa76f24a2d80625)`)
//         //         }
//         //     }
//         //     agentMap[domainTjpAddr] = agentAddr;

//         //     // Assign the updated map back to data Save the updated index ibGib.
//         //     // there is extra plumbing involved with special index ibgibs. see
//         //     // `rel8ToSpecialIbGib` for an example in
//         //     // libs/core-gib/src/witness/space/space-helper.mts
//         //     // await updateSpecialIndex({
//         //     //     metaspace,
//         //     //     type: agentIndexSpecialIbGibType,
//         //     //     dataToAddOrPatch: { agentMap },
//         //     //     space,
//         //     // });
//         //     const resNewSpecial = await mut8({
//         //         src: agentSpecialIndex,
//         //         dataToAddOrPatch: { agentMap },
//         //         dna: false,
//         //         linkedRel8ns: [Rel8n.past],
//         //         nCounter: true,
//         //     });

//         //     const newSpecialIbGib = resNewSpecial.newIbGib;

//         //     // persist
//         //     await persistTransformResult({ resTransform: resNewSpecial, space });

//         //     // update the space ibgib which contains the special/config information
//         //     const configKey = getSpecialConfigKey({ type: agentIndexSpecialIbGibType });
//         //     await metaspace.setConfigAddr({
//         //         key: configKey,
//         //         addr: getIbGibAddr({ ibGib: newSpecialIbGib }),
//         //         space,
//         //     });

//         //     await metaspace.registerNewIbGib({ ibGib: newSpecialIbGib, space, });
//         // }

//         // await execInSpaceWithLocking({
//         //     scope: agentIndexSpecialIbGibType, // Use the special index type as the lock scope.
//         //     secondsValid: 60, // Example timeout
//         //     maxDelayMs: 100, // Example delay
//         //     maxLockAttempts: 600, // Example attempts
//         //     space,
//         //     // callerInstanceId: // You might need a way to generate a unique ID for the caller
//         //     fn,
//         // });

//         // if (logalot) { console.log(`${lc} Registered domain ${domainTjpAddr} with agent ${agentAddr}`); }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }

// /**
//  * Retrieves the agent ibGib associated with a domain ibGib from the special agent index ibGib.
//  *
//  * may have to change this to require the ibgib, not give an optional
//  * domainIbGibAddr
//  */
// export async function getAgentForDomainIbGib({
//     ibGib,
//     metaspace,
//     space,
// }: {
//     ibGib: IbGib_V1,
//     metaspace: MetaspaceService,
//     space: IbGibSpaceAny,
// }): Promise<AgentWitnessAny | undefined> {
//     const lc = `[${getAgentForDomainIbGib.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting...`); }

//         if (!ibGib) { throw new Error(`ibGib required (E: 753a0aa13e4e5ea20d7f6bb92d963625)`); }

//         // // Get the index name and domain TJP address
//         // const agentIndexSpecialIbGibType: SpecialIbGibType =
//         //     // getAgentIndexNameFromIbGib({ ibGib: ibGib, }) as SpecialIbGibType;
//         //     getIndexNameFromIbGib({ scope: 'agent', ibGib, });

//         // const domainTjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' })!;

//         // // Get the agent index ibGib
//         // const agentSpecialIndex = await metaspace.getSpecialIbGib({
//         //     type: agentIndexSpecialIbGibType,
//         //     space,
//         //     initialize: false, // Do not create if it doesn't exist when retrieving
//         //     dontWarnIfNotExist: true, // Don't warn if the index doesn't exist
//         //     lock: false,
//         // });

//         // // If the index ibGib doesn't exist, no agent is registered for this domain
//         // if (!agentSpecialIndex || !agentSpecialIndex.data) {
//         //     if (logalot) { console.log(`${lc} Agent index ibGib not found for agentIndexSpecialIbGibType (${agentIndexSpecialIbGibType}). No agent registered, returning undefined. (I: a10a4621aa629384f838ec74456ed925)`); }
//         //     return undefined; /* <<<< returns early */
//         // }

//         // // Get the agent address from the map
//         // const agentMap: { [tjpAddr: string]: IbGibAddr } = agentSpecialIndex.data.agentMap ?? {};
//         // const agentAddr = agentMap[domainTjpAddr];

//         // if (!agentAddr) {
//         //     if (logalot) { console.log(`${lc} No agent address found for domain ${domainTjpAddr} in the agent index map. agentIndexSpecialIbGibType: ${agentIndexSpecialIbGibType}. returning undefined. (I: a1666e226ca916918c051cdbb08ff425)`); }
//         //     return undefined; /* <<<< returns early */
//         // }

//         const agentIbGib = await getLocalCoupledIbGibForDomainIbGib({
//             ibGib,
//             metaspace,
//             space,
//             scope: 'agent',
//             skipGetLatest: false,
//         });
//         if (!agentIbGib) {
//             console.warn(`${lc} couldn't find agent for domain ibGib (${ibGib.ib}) (W: 9536a8e67fe83ddc819c476f5a50c825)`);
//             return undefined; /* <<<< returns early */
//         }
//         const domainTjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' })!;

//         // Load the agent ibGib
//         const agentAddr = getIbGibAddr({ ibGib: agentIbGib });
//         const agentSvc = getAgentsSvc();
//         const agentWitness =
//             await agentSvc.getAgentByAddr({ agentAddr, metaspace, spaceId: space.data!.uuid })

//         if (logalot) {
//             if (agentWitness) {
//                 console.log(`${lc} complete. Found agent ${getIbGibAddr({ ibGib: agentWitness })} for domain ${domainTjpAddr}`);
//             } else {
//                 console.log(`${lc} complete. No agent found for ibgib tjp ${domainTjpAddr}`);
//             }
//         }

//         return agentWitness;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     }
// }

// /**
//  * @internal
//  * @returns factory to create concrete agent witnesses per given {@link arg}
//  */
// export function getConcreteAgentFactory(arg: CreateNewAgentArg): CreateConcreteAgentWitnessFactory {
//     const lc = `[${getConcreteAgentFactory.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 2a9899514ac6e478eb55819a57fd9725)`); }
//         const { api } = arg;
//         switch (api) {
//             case 'gemini':
//                 return new CreateConcreteAgentWitnessFactory_Gemini(arg);
//             default:
//                 throw new Error(`(UNEXPECTED) api: ${api}? only 'gemini' currently implemented? (E: 071fedab181fda80666858c14ea73625)`);
//         }
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
