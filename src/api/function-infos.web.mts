/**
 * @module function-infos.web.mts
 *
 * Web app-specific function infos, as opposed to extension or other function
 * infos.
 *
 * funky structure because AllFunctionInfos started as just a global constant,
 * but when broke out extension, we needed to separate web extension function
 * infos from web app function infos.
 */

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { GLOBAL_LOG_A_LOT } from "../constants.mjs";
import { APIFunctionInfo } from "./api-types.mjs";
import { RenderAgentFunctionInfos } from "./commands/renderable/renderable-index.mjs";
import { UIAgentFunctionInfos } from "./commands/ui/ui-index.mjs";
import { fetchWeb1PageFunctionInfo } from "./commands/website/fetch-web1-page.mjs";
import { ProjectFunctionInfos } from "../common/project/project-constants.mjs";
import { IbGibAPIFunctionInfos } from "./commands/ibgib/ibgib-index.mjs";
import { ChatAPIFunctionInfos } from "./commands/chat/chat-index.mjs";
import { TextAPIFunctionInfos } from "./commands/text/text-index.mjs";
import { MinigameFunctionInfos } from "./commands/minigame/minigame-index.mjs";
import { registerDeprecatedFunctionInfoName, registerFunctionInfos } from "./api-index.mjs";

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
    ...ChatAPIFunctionInfos,
    ...TextAPIFunctionInfos,

    fetchWeb1PageFunctionInfo,

    ...RenderAgentFunctionInfos,
    ...ProjectFunctionInfos,
    ...UIAgentFunctionInfos,
    ...IbGibAPIFunctionInfos,
    ...MinigameFunctionInfos,
].map(x => [x.nameOrId, x]));

const DeprecatedFunctionInfoNames_Web: string[] = [
    'minigameBuilderAddStimuli',
    // 'minigameBuilderEditStimuli', // debug only...this is a valid function and this needs to be removed from this list. i'm just trying to cause the prune action to happen for debugging.
];

/**
 * This should be called early on when initializing the web app.
 */
export function registerDeprecatedFunctionNamesAndFunctionInfos_Web(): void {
    const lc = `[${registerDeprecatedFunctionNamesAndFunctionInfos_Web.name}]`;
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
