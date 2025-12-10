// import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { getIbAndGib } from "@ibgib/ts-gib/dist/helper.mjs";
// import { Factory_V1 } from "@ibgib/ts-gib/dist/V1/factory.mjs";
// import { rel8ToTag } from "@ibgib/core-gib/dist/common/tag/tag-helper.mjs";
// import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";
// import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
// import { updateSpecialIndex } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
// import { SpecialIbGibType } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
// import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
// import { toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

// import { GLOBAL_LOG_A_LOT, HARDCODED_PROMPT_TAG_TEXT } from "../../constants.mjs";
// import { getGlobalMetaspace_waitIfNeeded } from "../../helpers.web.mjs";
// import { getAgents, getConcreteAgentFactory, getTag_Agents } from "./agent-helpers.mjs";
// import { AddTextInfo, AgentWitnessAny, AgentWitnessData_V1, AgentWitnessIbGib_V1, getAgentIb, parseAgentIb, taggifyForPrompt } from "./agent-one-file.mjs";
// import { AgentDtoToWitnessFunction, CreateNewAgentArg, CreateNewAgentResult } from "./agent-types.mjs";
// import { AGENT_ATOM, AGENT_REL8N_NAME } from "./agent-constants.mjs";

// const logalot = GLOBAL_LOG_A_LOT;


// /**
//  * I'm having an issue with agents being out of date. I don't want to have to
//  * update the agent to the latest which would require calling getLatest
//  * (relatively expensive).
//  *
//  * but I am having an issue where I update an agent, but before I can update the
//  * spcial ibgib index, it is being loaded again. So I am trying a hack to have a
//  * simple in-memory latest hack.
//  *
//  * So the idea is that we will consider agents to be singleton-like, i.e., only
//  * one local timeline allowed.
//  */
// export class AgentsService_V1 {
//     private lc: string = `[${AgentsService_V1.name}]`;

//     /**
//      * dtos of latest agents
//      */
//     private latestAgents: Map<string, AgentWitnessAny> = new Map();

//     private factoryFns: { [classname: string]: AgentDtoToWitnessFunction } = {};

//     constructor() {
//     }

//     async getAgentById(opts: {
//         agentId: string,
//         agentType: string,
//         spaceId?: SpaceId,
//     }): Promise<AgentWitnessAny | undefined> {
//         const lc = `${this.lc}[${this.getAgentById.name}]`;
//         try {
//             const {
//                 agentId,
//                 agentType,
//                 spaceId,
//             } = opts;
//             if (logalot) { console.log(`${lc} starting... (I: 0c4214b4614a43bd2825978e54aee325)`); }
//             let agent = this.latestAgents.get(agentId);
//             if (!agent) {
//                 const metaspace = await getGlobalMetaspace_waitIfNeeded();
//                 const agents = await getAgents({ metaspace, type: agentType, spaceId });
//                 agent = agents.find(x => x.data!.uuid === agentId);
//             }
//             if (!agent) { console.warn(`${lc} couldn't find any agent by id. opts: ${pretty(opts)} (W: 70cf51ecbe68dfdcfe1e9995a7468f25)`); }
//             return agent;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * SHOULD NOT NEED THIS... USE A GD PROXY.
//      *
//      * if the incoming {@link agent} is the most recent, then this will save
//      * this agent as the latest.
//      *
//      * if the incoming {@link agent} is equal, then nothing happens.
//      *
//      * if the incoming {@link agent} is older than the known latest agent, then
//      * the incoming {@link agent} will load the most recent agent's dto unless {@link throwIfNewerFound} is true.
//      */
//     async updateOrSetLatestAgent({
//         agent,
//         throwIfNewerFound,
//     }: {
//         agent: AgentWitnessAny,
//         throwIfNewerFound?: boolean,
//     }): Promise<void> {
//         const lc = `${this.lc}[${this.updateOrSetLatestAgent.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 9bb74f19b989fc0ee969cb4c2c2aa525)`); }
//             if (!agent.data) { throw new Error(`invalid agent. data falsy. agent.ib: ${agent.ib} (E: 7356db7395cb0c5664d13437dd62c425)`); }
//             if (!agent.data.uuid) { throw new Error(`invalid agent. data.uuid falsy. agent.ib: ${agent.ib} (E: 48afcd6658154bee1138fca31cbfbf25)`); }

//             const existing = await this.getLatestAgent({ id: agent.data.uuid });
//             if (existing) {
//                 // check existing against the one we're trying to set.
//                 if (!existing.data) { throw new Error(`(UNEXPECTED) existing.data falsy? should have thrown on previous set function call? (E: f3cbae9922ea9849ada25db2eea40825)`); }
//                 if (existing.data.n! === agent.data.n!) {
//                     if (existing.gib === agent.gib) {
//                         // already have this version
//                         return; /* <<<< returns early */
//                     } else {
//                         console.warn(`existing.data.n === agent.data.n but gibs are different. We have a branched timeline. just logging this error, need to figure out wth is going on here. we should not have this with the timeline being locked. The only thing I can think of is if the ibgib is updated very quickly, but even then, the n should be incremented. still the approach is valid. anyway, we're going ahead and taking the newer agent.\nexisting: ${pretty(toDto({ ibGib: existing }))}\nnew: ${pretty(toDto({ ibGib: agent }))} (E: 5e079b566ff3533acdb2d01359f08625)`);
//                         await existing.loadIbGibDto(agent.toIbGibDto())
//                         this.latestAgents.set(agent.data.uuid, agent);
//                         return; /* <<<< returns early */
//                     }
//                 } else if (existing.data.n! > agent.data.n!) {
//                     const msg = `existing.data.n > agent.data.n, i.e., the one we already have is newer. So why was the caller trying to set to the older agent thinking it was the most recent? Probably have a branched timeline.`;
//                     if (throwIfNewerFound) {
//                         throw new Error(`${lc} ${msg} (E: bb2cc3ce8cfa88b80fb62149b0e70225)`);
//                     } else {
//                         console.warn(`${lc} ${msg} (W: caaf66deb4e6fd8e2eb9261685dc0325)`);
//                     }
//                     return; /* <<<< returns early */
//                 } else {
//                     // happy path, the new one is newer than the existing one
//                     await existing.loadIbGibDto(agent.toIbGibDto())
//                     this.latestAgents.set(agent.data.uuid, agent);
//                     return; /* <<<< returns early */
//                 }
//             } else {
//                 this.latestAgents.set(agent.data.uuid, agent);
//                 return; /* <<<< returns early */
//             }

//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * gets the most recent agent witness corresponding to the given {@link id},
//      * if found. If not found, then returns undefined.
//      *
//      * ## atow 04/2025 - implementation note
//      *
//      * right now this executes sync but is promise-based, because in the future
//      * this has a decent chance of becoming truly promise-based.
//      */
//     getLatestAgent({
//         id,
//     }: {
//         id: string,
//     }): Promise<AgentWitnessAny | undefined> {
//         const lc = `${this.lc}[${this.getLatestAgent.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 8e85b55057760b712a913a92e88ead25)`); }
//             return Promise.resolve(this.latestAgents.get(id));
//             // const agents = this.latestAgents.filter(x => x.data!.uuid === id);
//             // if (agents.length === 1) {
//             //     return agents.at(0)!;
//             // } else if (agents.length === 0) {
//             //     return undefined;
//             // } else {
//             //     throw new Error(`(UNEXPECTED) more than one agent with the same agent.data.uuid (${id})? (E: a4e3bc9053523e0eb4ec5514e1825825)`);
//             // }
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     registerFactory({
//         classname,
//         fnDtoToAgentWitness,
//     }: {
//         classname: string,
//         fnDtoToAgentWitness: AgentDtoToWitnessFunction,
//     }): void {
//         this.factoryFns[classname] = fnDtoToAgentWitness;
//     }

//     async getAgentWitnessFromDto({
//         dto,
//         classname,
//     }: {
//         dto: IbGib_V1,
//         /**
//          * if provided, wills pecifically attempt to use the factory function
//          * registered for this classname. otherwise, will attempt to derive from
//          * {@link dto}.
//          */
//         classname?: string,
//     }): Promise<AgentWitnessAny | undefined> {
//         const lc = `${this.lc}[${this.getAgentWitnessFromDto.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 718837d4ee3d590177f3425b99106225)`); }
//             if (!dto.data) { throw new Error(`dto.data falsy (E: fad89dd4c787b687a657c13968946925)`); }

//             let agent: AgentWitnessAny | undefined = undefined;
//             classname ??= (dto.data as AgentWitnessData_V1).classname;
//             if (classname) {
//                 const fn = this.factoryFns[classname];
//                 const res = await fn(dto);
//                 if (res.applies) {
//                     if (!res.agent) { throw new Error(`(UNEXPECTED) factory function for agent dto applies: true, but the resulting agent is undefined? (E: b13cdf0f3d9c50f1fa419f2c409ebf25)`); }
//                     agent = res.agent;
//                 } else {
//                     throw new Error(`classname (${classname}) factory function found and attempted, but result says applied: false. (E: 751a2502c9a7e2d61c76c8ae2f7fb125)`);
//                 }
//             } else {
//                 // not found, try to brute force
//                 const fnClassnames = Object.keys(this.factoryFns);
//                 for (const fnClassname of fnClassnames) {
//                     const fn = this.factoryFns[fnClassname];
//                     const res = await fn(dto);
//                     if (res.applies) {
//                         if (!res.agent) { throw new Error(`(UNEXPECTED) factory function for agent dto applies: true, but the resulting agent is undefined? (E: 60e97c083a668baf11efcd6adf6a3525)`); }
//                         agent = res.agent;
//                         break;
//                     }
//                 }
//             }
//             return agent;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * Retrieves an agent instance by its ibGib address.
//      * Checks the in-memory cache first. If not found, retrieves the agent ibGib
//      * from the specified space, converts the DTO to a witness, and caches it.
//      */
//     async getAgentByAddr({
//         agentAddr,
//         spaceId,
//         metaspace, // Assuming metaspace might be needed here
//     }: {
//         agentAddr: IbGibAddr,
//         spaceId?: SpaceId,
//         metaspace?: MetaspaceService,
//     }): Promise<AgentWitnessAny | undefined> {
//         const lc = `${this.lc}[${this.getAgentByAddr.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 42dfecbe6d6b5a3a7d392af5a66cc625)`); }

//             if (!agentAddr) { throw new Error(`${lc} agentAddr is required. (E: 389351659a2e08fa179ceede16925a25)`); }

//             // first check to see if we have it in the agents service already
//             const { ib: agentIb } = getIbAndGib({ ibGibAddr: agentAddr });
//             let { uuid: agentId, type: agentType } = parseAgentIb({ ib: agentIb });

//             if (!agentId) {
//                 debugger; // error agent ib didn't have uuid?
//                 throw new Error(`(UNEXPECTED) agentAddr doesn't have uuid in the ib? agentAddr: ${agentAddr} (E: fedcacffed98fdc78b1e80e45c413925)`);
//             }

//             let resAgent = await this.getAgentById({
//                 agentId,
//                 agentType,
//             });

//             if (resAgent) {
//                 if (logalot) { console.log(`${lc} agent found already in agents svc so didn't need to go get it from the space. (I: ec6abaf3badd8e301d79a7476845bc25)`); }
//                 return resAgent; /* <<<< returns early */
//             }

//             // we do NOT yet have it in the agents svc. so get the ibgib,
//             // convert it to a witness, add it to this service's cache,
//             // and return it

//             // Let's try to get the ibGib from the space first to get the UUID.
//             // We'll need the metaspace and space instance.
//             metaspace ??= await getGlobalMetaspace_waitIfNeeded();
//             const space = await metaspace.getLocalUserSpace({
//                 localSpaceId: spaceId,
//                 lock: false
//             });
//             if (!space) {
//                 if (spaceId) {
//                     throw new Error(`couldn't get space with spaceId (${spaceId}) (E: 26b3f1414a93cc339e704d0162cb8b25)`);
//                 } else {
//                     throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: 2e19a1fae8b3f00595257f51426ac225)`);
//                 }
//             }

//             const resGet = await metaspace.get({ addrs: [agentAddr], space, });
//             if (!resGet.success || !resGet.ibGibs || resGet.ibGibs.length === 0) {
//                 if (logalot) { console.log(`${lc} Agent ibGib not found in space (${spaceId}) at address ${agentAddr}. (I: 29c5c7994fb3ed388b28a81a9ed68325)`); }
//                 return undefined; // Agent not found in the space
//             }
//             const agentIbGib = resGet.ibGibs[0] as AgentWitnessIbGib_V1;

//             // 3. Convert DTO to Witness
//             const agentWitness = await this.getAgentWitnessFromDto({ dto: agentIbGib });
//             if (!agentWitness) {
//                 debugger; // error couldn't get agent from dto?
//                 throw new Error(`${lc} Couldn't get actual agent witness from agent dto (${agentAddr}). Have we registered classname (${agentIbGib.data?.classname}) and factory fn with agents service? (E: e6e9da6c91d14bd7acb5c571c8de1a25)`);
//             }

//             // 4. Cache the witness
//             await this.updateOrSetLatestAgent({
//                 agent: agentWitness,
//                 throwIfNewerFound: true, // we just checked, it would be weird if already exists
//             });
//             if (logalot) { console.log(`${lc} Cached agent witness with id ${agentId}. (I: b862f63147a3fac3c6e6210d5ab87c25)`); }

//             if (logalot) { console.log(`${lc} complete. Retrieved and cached agent witness for address ${agentAddr}.`); }
//             return agentWitness;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         }
//     }

//     /**
//      * factory function that creates a new agent ibgib and witness. this **DOES**
//      * save all created ibgibs (including dependency and intermediate ibgibs) in the
//      * given {@link space} if provided, else the default local space according to
//      * the given {@link metaspace}.
//      */
//     async createNewAgent(arg: CreateNewAgentArg): Promise<CreateNewAgentResult> {
//         const lc = `[${this.createNewAgent.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: a3e07b54bb7bf45f7739eff2d738c825)`); }
//             let {
//                 metaspace,
//                 superSpace,
//                 name,
//                 // api, // extracted and used in getConcreteAgentFactory
//                 // model, // extracted and used in getConcreteAgentFactory
//                 availableFunctions,
//                 initialSystemText,
//                 initialChatText,
//                 fnGetAPIKey,
//                 addToAgentsTag,
//                 type,
//             } = arg;
//             superSpace ??= await metaspace.getLocalUserSpace({});
//             if (!superSpace) { throw new Error(`(UNEXPECTED) superSpace falsy? (E: ceb60d96ff25b6d6aaa5aa69a7a51d25)`); }
//             if (!superSpace.data) { throw new Error(`(UNEXPECTED) superSpace.data falsy? (E: 56b4ec127f8559da96e6f70c7cb13825)`); }

//             /**
//              * this sets the factory to the given {@link arg}
//              */
//             const agentFactory = getConcreteAgentFactory(arg);

//             // do the data (should be in concrete api function, pass in superSpaceId)
//             const data = await agentFactory.createInitialData(superSpace);
//             if (!data.uuid) { throw new Error(`(UNEXPECTED) data.uuid falsy? (E: 4e4f6fcf89d1e3775971ad843a083725)`); }

//             const newSubSpace = await metaspace.createLocalSpaceAndUpdateBootstrap({
//                 allowCancel: false,
//                 zeroSpace: metaspace.zeroSpace,
//                 spaceName: name + data.uuid.substring(0, 5), // arbitrary
//                 createBootstrap: false,
//             });
//             // let debugerrors = await validateIbGibIntrinsically({ ibGib: newSubSpace! }) ?? []; // debugging
//             // console.log(`${lc}\n${debugerrors?.join('\n')}`)
//             if (!newSubSpace) { throw new Error(`(UNEXPECTED) newSubSpace falsy after creating locally? (E: af8b5503c15d4292e2f591b316e7d825)`); }
//             data.subSpaceId = newSubSpace.data!.uuid;

//             // do the rel8ns (should be in concrete api function, pass in superSpaceId)
//             // const rel8ns = !!DEFAULT_AGENT_REL8NS_V1 ?
//             //     clone(DEFAULT_AGENT_REL8NS_V1) as AgentWitnessRel8ns_V1 :
//             //     undefined;
//             const rel8ns = await agentFactory.createInitialRel8ns();

//             const resFirstGen = await Factory_V1.firstGen({
//                 ib: getAgentIb({ data }),
//                 parentIbGib: Factory_V1.primitive({ ib: AGENT_ATOM }),
//                 data, rel8ns,
//                 nCounter: true, dna: true,
//                 tjp: { timestamp: true, },
//             });
//             await metaspace.persistTransformResult({ resTransform: resFirstGen });
//             // await metaspace.registerNewIbGib
//             // skipping registering new ibgib with metaspace for now. maybe should
//             // do this, I don't remember.
//             const agentIbGib = resFirstGen.newIbGib as AgentWitnessIbGib_V1;
//             const agentWitness = await agentFactory.createWitness();
//             // agentWitness.setMetaspace(metaspace); // must set metaspace 1st

//             agentWitness.fnGetAPIKey = fnGetAPIKey;
//             await agentWitness.loadIbGibDto(agentIbGib);

//             if (addToAgentsTag) {
//                 const agentsTagIbGib = await getTag_Agents({ metaspace, space: superSpace, });
//                 // this will persist the new agents tag and register it with the
//                 // given superSpace
//                 let _newAgentsTagIbGib = await rel8ToTag({
//                     ibGib: agentIbGib, // just need the dto
//                     metaspace,
//                     space: superSpace,
//                     tagIbGib: agentsTagIbGib,
//                 });
//             }

//             // always add to agent index
//             await updateSpecialIndex({
//                 type,
//                 rel8nInfos: [{ rel8nName: AGENT_REL8N_NAME, ibGibs: [agentIbGib], }],
//                 metaspace,
//                 space: superSpace,
//             });

//             // at this point, we should have a witness that is able to build itself
//             // up with its own functions.

//             if (availableFunctions.length > 0) {
//                 await agentWitness.addAvailableFunctions(availableFunctions);
//             }

//             const textsToAdd: AddTextInfo[] = [];
//             // always tell the agent their id, superSpaceId and subSpaceId
//             textsToAdd.push({
//                 textSrc: 'hardcoded',
//                 text: taggifyForPrompt({
//                     tagText: HARDCODED_PROMPT_TAG_TEXT,
//                     contentText: `Your id (agent id) is: ${data.uuid}. Your superSpaceId is: ${data.superSpaceId}. Your subSpaceId is: ${data.subSpaceId}. These may be useful/required in some functions, though you should refer to those functions' instructions/descriptions for applicability.`,
//                 }),
//                 isSystem: true,
//             });

//             if (initialSystemText) {
//                 textsToAdd.push({ textSrc: 'hardcoded', text: initialSystemText, isSystem: true, });
//             }
//             if (initialChatText) {
//                 textsToAdd.push({ textSrc: 'hardcoded', text: initialChatText, });
//             }
//             await agentWitness.addTexts({ infos: textsToAdd, });

//             this.latestAgents.set(agentWitness.data!.uuid!, agentWitness);

//             return agentWitness;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     getAgents(opts: {
//         metaspace: MetaspaceService,
//         type: SpecialIbGibType,
//         spaceId?: SpaceId,
//         space?: IbGibSpaceAny,
//     }): Promise<AgentWitnessAny[]> {
//         const lc = `${this.lc}[${this.getAgents.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 4663f125c3a21fa3ecccc2c5a38d1225)`); }
//             return getAgents(opts);
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

// }


// /**
//  * Singleton {@link AgentsService_V1} instance.
//  */
// let _agentsSvcInstance: AgentsService_V1 | undefined = undefined;
// export function getAgentsSvc(): AgentsService_V1 {
//     if (!_agentsSvcInstance) {
//         _agentsSvcInstance = new AgentsService_V1();
//     }
//     return _agentsSvcInstance;
// }
