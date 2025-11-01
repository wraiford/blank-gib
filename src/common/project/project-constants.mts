import { delay } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { APIFunctionInfo } from "../../api/api-types.mjs";
import { SETTINGS_ATOM } from "../settings/settings-constants.mjs";
import { ChatAPIFunctionInfos } from "../../api/commands/chat/chat-index.mjs";
import { IbGibAPIFunctionInfos } from "../../api/commands/ibgib/ibgib-index.mjs";
import { editProjectFunctionInfo } from "../../api/commands/project/project-edit.mjs";
import { TextAPIFunctionInfos } from "../../api/commands/text/text-index.mjs";
import { MinigameFunctionInfos } from "../../api/commands/minigame/minigame-index.mjs";
import { updateCSSVariablesFunctionInfo } from "../../api/commands/ui/update-css-variables.mjs";

export const PROJECT_ATOM = 'project';
/**
 * must match {@link PROJECT_MAX_NAME_LENGTH}
 */
export const PROJECT_NAME_REGEXP = /^[a-zA-Z0-9_\-. ]{1,128}$/;
export const PROJECT_DESC_REGEXP = /.{1,255}/;
/**
 * must match {@link PROJECT_NAME_REGEXP}
 */
export const PROJECT_MAX_NAME_LENGTH = 128;

export const PROJECT_SETTINGS_SCOPE = `${SETTINGS_ATOM}_${PROJECT_ATOM}`;

export const DEFAULT_PROJECT_SAFE_NAME_LENGTH = 32;
/**
 * change this in the future if we add more fields
 */
export const DEFAULT_PROJECT_ADDL_METADATA_LENGTH = 32;

// export const DEFAULT_PROJECT_DATA_V1 ,
// export const DEFAULT_PROJECT_REL8NS_V1,

export const PROJECT_REL8N_NAME = PROJECT_ATOM;
/**
 * project children are ibgibs that are expected to be shown in a project tab.
 * These are _kinda_ like contained files/folders when viewing the project as a
 * folder.
 */
export const PROJECT_CHILD_DEFAULT_REL8N_NAME = 'child';
/**
 * all over the place, but the idea is here that barring a few key rel8nNames
 * (e.g. dna, ancestor, past, etc.), all other rel8nNames are considered
 * "children".
 */
export const PROJECT_CHILD_TEXT_REL8N_NAME = 'text';

/**
 * @constant ProjectAgentFunctionInfos - An array of all available API functions for project agents.
 */
export const ProjectFunctionInfos: APIFunctionInfo<any>[] = [
    editProjectFunctionInfo,
];

export const ProjectChildTextFunctionInfos: APIFunctionInfo<any>[] = [
    // ?
];

export const AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT: APIFunctionInfo<any>[] = [
    updateCSSVariablesFunctionInfo,
    ...ChatAPIFunctionInfos,
    ...TextAPIFunctionInfos,
    ...IbGibAPIFunctionInfos,
    ...ProjectFunctionInfos,
];

export const AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT: APIFunctionInfo<any>[] = [
    ...ChatAPIFunctionInfos,
    ...TextAPIFunctionInfos,
    ...IbGibAPIFunctionInfos,
];

// ugly hack for some circular dependency that I can't find
setTimeout(async () => {
    while (!MinigameFunctionInfos) {
        await delay(100);
        debugger;
    }
    MinigameFunctionInfos.forEach(x => {
        AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT.push(x);
        AGENT_AVAILABLE_FUNCTIONS_PROJECTCHILDTEXTAGENT.push(x);
    }); // hasn't initialized yet
});
