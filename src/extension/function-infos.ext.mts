/**
 * @module function-infos.ext.mts
 *
 * Extension-specific function infos, as opposed to extension or other function
 * infos for the web app proper.
 *
 * funky structure because AllFunctionInfos started as just a global constant,
 * but when broke out extension, we needed to separate web extension function
 * infos from web app function infos.
 */

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { registerDeprecatedFunctionInfoName, registerFunctionInfos } from "@ibgib/web-gib/dist/api/api-index.mjs";
import { IbGibAPIFunctionInfos } from "@ibgib/web-gib/dist/api/commands/ibgib/ibgib-index.mjs";
import { TextAPIFunctionInfos } from "@ibgib/web-gib/dist/api/commands/text/text-index.mjs";

import { GLOBAL_LOG_A_LOT } from "../constants.mjs";
import { UIAgentFunctionInfos } from "../api/commands/ui/ui-index.mjs";

const logalot = GLOBAL_LOG_A_LOT;

/**
 * Map of all available API functions for agents.
 *
 * NOTE: Any and all functions should be added to this.
 */
// export const AllFunctionInfos: { [nameOrId: string]: APIFunctionInfo<any> } = {
//     ...RenderAgentFunctionInfos.reduce((acc, info) => ({ ...acc, [info.nameOrId]: info }), {}),
// }

const AllFunctionInfos_Web: Map<string, APIFunctionInfo<any>> = new Map([
    ...TextAPIFunctionInfos,
    ...UIAgentFunctionInfos,
    ...IbGibAPIFunctionInfos,
].map(x => [x.nameOrId, x]));

const DeprecatedFunctionInfoNames_Web: string[] = [
];

/**
 * This should be called early on when initializing the web app.
 */
export function registerDeprecatedFunctionNamesAndFunctionInfos_Ext(): void {
    const lc = `[${registerDeprecatedFunctionNamesAndFunctionInfos_Ext.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 31efff44c2be8ac45dac33d8824c4c25)`); }

        for (const nameOrId of DeprecatedFunctionInfoNames_Web) {
            registerDeprecatedFunctionInfoName({ nameOrId });
        }

        registerFunctionInfos({ functionInfos: AllFunctionInfos_Web });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
