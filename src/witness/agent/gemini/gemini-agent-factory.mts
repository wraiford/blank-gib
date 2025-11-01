import {
    clone, extractErrorMsg, getUUID,
} from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';

import { ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME, GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { AgentWitnessAny, AgentWitnessData_V1, AgentWitnessIbGib_V1, AgentWitnessRel8ns_V1, DEFAULT_AGENT_DATA_V1, DEFAULT_AGENT_REL8NS_V1, } from '../agent-one-file.mjs';
import { AgentWitnessGemini_V1 } from './agent-witness-gemini-v1.mjs';
import { storageGet } from '../../../storage/storage-helpers.web.mjs';
import { CreateConcreteAgentWitnessFactory, CreateNewAgentArg } from '../agent-types.mjs';
import type { AgentsService_V1 } from '../agents-service-v1.mjs';

const logalot = GLOBAL_LOG_A_LOT;

/**
 * factory class to create gemini api agents.
 *
 * This doesn't need to be instantiated necessarily, as this is used via the
 * more general factory function {@link AgentsService_V1.createNewAgent}
 */
export class CreateConcreteAgentWitnessFactory_Gemini
    implements CreateConcreteAgentWitnessFactory {
    private lc: string = `[${CreateConcreteAgentWitnessFactory_Gemini.name}]`;

    private arg: CreateNewAgentArg;

    constructor(arg: CreateNewAgentArg) {
        this.arg = arg;
    }

    async createInitialData(superSpace: IbGibSpaceAny): Promise<AgentWitnessData_V1> {
        const lc = `${this.lc}[${this.createInitialData.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f4c8ac488804666077cfc2237972d625)`); }

            const { name, api, model, type, availableFunctions, } = this.arg;
            if (!model) { throw new Error(`(UNEXPECTED) model falsy? (E: ee7286c772a37fa86236c85f96233625)`); }
            if (!superSpace.data) { throw new Error(`(UNEXPECTED) superSpace.data falsy? (E: 858d5950b9ef7a0175482a51caaf9c25)`); }
            if (!superSpace.data.uuid) { throw new Error(`(UNEXPECTED) superSpace.data.uuid falsy? (E: 08867535db1b254d73c050bd5086e525)`); }

            const data = clone(DEFAULT_AGENT_DATA_V1) as AgentWitnessData_V1;
            if (name) { data.name = name; }
            data.uuid = await getUUID();
            data.superSpaceId = superSpace.data.uuid;
            data.api = api;
            data.model = model;
            data.type = type;
            data.availableFunctionNameOrIds = availableFunctions.map(x => x.nameOrId);
            data.classname = AgentWitnessGemini_V1.name;

            // if (model) { data.model = model; }

            return data;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    async createInitialRel8ns(): Promise<AgentWitnessRel8ns_V1 | undefined> {
        const lc = `${this.lc}[${this.createInitialRel8ns.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2d4933ea3761bd7df701d8d306fb2825)`); }

            const rel8ns = !!DEFAULT_AGENT_REL8NS_V1 ?
                clone(DEFAULT_AGENT_REL8NS_V1) as AgentWitnessRel8ns_V1 :
                undefined;

            return rel8ns;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    async createWitness(): Promise<AgentWitnessAny> {
        const lc = `[${this.createWitness.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 36709dfa0c398d63d64c4f6ba9055625)`); }
            const { api, model } = this.arg;
            if (api === 'gemini') {
                // model is ignored atow 1/2025
                const witness = new AgentWitnessGemini_V1();
                await witness.initialized;
                return witness;
            } else {
                throw new Error(`(UNEXPECTED) unknown api: ${api}? only 'gemini' currently implemented (E: 2d1cb22ce787c6c42d4532c260320125)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

}

/**
 * Takes an incoming {@link agentIbGib} (dto), creates a new agent witness,
 * initializes it and loads that {@link agentIbGib} dto into it.
 *
 * @returns the full agent witness
 */
export async function agentIbGibDtoToWitness({
    agentIbGib,
}: {
    agentIbGib: AgentWitnessIbGib_V1,
}): Promise<AgentWitnessAny> {
    const lc = `[${agentIbGibDtoToWitness.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 5a4efefba9e4bdfb942afbe7919fff25)`); }
        const agentWitness = new AgentWitnessGemini_V1();
        await agentWitness.initialized;
        await agentWitness.loadIbGibDto(agentIbGib);
        agentWitness.fnGetAPIKey = async () => {
            let apiKey = await storageGet({
                dbName: BLANK_GIB_DB_NAME,
                storeName: ARMY_STORE,
                key: BEE_KEY,
            });
            return apiKey ?? '';
        }
        return agentWitness;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
