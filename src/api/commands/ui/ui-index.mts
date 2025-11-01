import { APIFunctionInfo } from "../../api-types.mjs";
import { updateCSSVariablesFunctionInfo } from './update-css-variables.mjs';

export const UIAgentFunctionInfos: APIFunctionInfo<any>[] = [
    updateCSSVariablesFunctionInfo,
];
