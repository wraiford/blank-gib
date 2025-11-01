import { ChatAPIFunctionInfos } from "../../api/commands/chat/chat-index.mjs";
import { UIAgentFunctionInfos } from "../../api/commands/ui/ui-index.mjs";
import { fetchWeb1PageFunctionInfo } from "../../api/commands/website/fetch-web1-page.mjs";

export const AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT = [
    ...ChatAPIFunctionInfos,
    fetchWeb1PageFunctionInfo,
    ...UIAgentFunctionInfos,
    // ...getAllFunctionInfos.values(),
    // ...RenderAgentFunctionInfos,
];
