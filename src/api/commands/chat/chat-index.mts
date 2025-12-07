import { APIFunctionInfo } from "../../api-types.mjs";
import { getContextInfoFunctionInfo } from "./get-context-info.mjs";
import { helloWorldFunctionInfo } from "./hello-world.mjs";
import { tellUserFunctionInfo } from "./tell-user.mjs";

export const ChatAPIFunctionInfos: APIFunctionInfo<any>[] = [
    tellUserFunctionInfo,
    helloWorldFunctionInfo,
    getContextInfoFunctionInfo,
];
