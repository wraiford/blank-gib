import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { updateCSSVariablesFunctionInfo } from '@ibgib/web-gib/dist/api/commands/ui/update-css-variables.mjs';

export const UIAgentFunctionInfos: APIFunctionInfo<any>[] = [
    updateCSSVariablesFunctionInfo,
];
