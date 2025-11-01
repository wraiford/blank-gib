import { APIFunctionInfo } from "../../api-types.mjs";
import { getIbGibsFunctionInfo } from "./get-ibgibs.mjs";
import { mut8IbGibFunctionInfo } from "./mut8-ibgib.mjs";

export const IbGibAPIFunctionInfos: APIFunctionInfo<any>[] = [
    getIbGibsFunctionInfo,
    mut8IbGibFunctionInfo,
];
