// // import { extractErrorMsg, pretty, } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
// import { IbGib_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
// import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';
// import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';

// // import { GLOBAL_LOG_A_LOT } from '../../constants.mjs';
// import { APIFunctionInfo } from '../../api/api-types.mjs';
// import type { AgentWitness_V1 } from './agent-one-file.mjs';
// import {
//     AgentWitnessAny, AgentWitnessData_V1, AgentWitnessRel8ns_V1,
// } from './agent-one-file.mjs';
// import { GeminiModel } from './gemini/gemini-constants.mjs';

// export type AgentModel =
//     | GeminiModel;
// /**
//  * API discriminator of the underlying model.
//  *
//  * @see {@link AgentWitness_V1}
//  * @see {@link AgentWitnessData_V1.api}
//  */
// export type AgentAPI = 'gemini';

// /**
//  * shape of passed in arg of {@link createNewAgent}.
//  *
//  * ATOW (01/2024)
// */
// export interface CreateNewAgentArg {
//     /**
//      * metaspace singleton
//      */
//     metaspace: MetaspaceService;
//     /**
//      * optional space in which to save the agent itself (and dependency ibgibs).
//      * This is often (always?) different than
//      * @default superSpace is the metaspace's default local user space
//      */
//     superSpace?: IbGibSpaceAny;
//     /**
//      * optional name of new agent. Does not have to be unique, but that's always
//      * nice. if not provided, a random one will be created.
//      */
//     name?: string;
//     api: AgentAPI;
//     model: AgentModel;
//     /**
//      * what functions are available to the agent. if no functions are available
//      * to the agent, then provide an empty array.
//      * @see {@link AgentWitness_V1.getAvailableFunctions}
//      */
//     availableFunctions: APIFunctionInfo[];
//     initialSystemText: string;
//     /**
//      * initial text from the user to the agent.
//      */
//     initialChatText: string;
//     /**
//      * @see {@link AgentWitness_V1.fnGetAPIKey}
//      */
//     fnGetAPIKey: () => Promise<string>;
//     /**
//      * if true, will tag the agent with the agents tag in the {@link metaspace}
//      * and {@link superSpace}.
//      */
//     addToAgentsTag?: boolean;
//     /**
//      * will be used as the SpecialIbGibType
//      */
//     type: string;
// }

// /**
//  * shape of return value of {@link createNewAgent}.
//  *
//  * ATOW (01/2025)
//  */
// export type CreateNewAgentResult = AgentWitnessAny;

// /**
//  * factory to create concrete agents that correspond to a given {@link arg}.
//  *
//  * Specifically this is intended to look at the {@link CreateNewAgentArg.api}
//  */
// export interface CreateConcreteAgentWitnessFactory {
//     createInitialData(superSpace: IbGibSpaceAny): Promise<AgentWitnessData_V1>;
//     createInitialRel8ns(): Promise<AgentWitnessRel8ns_V1 | undefined>;
//     createWitness(): Promise<AgentWitnessAny>;
// }

// export type AgentDtoToWitnessFunction =
//     (dto: IbGib_V1) => Promise<{ applies: boolean, agent?: AgentWitnessAny }>;
