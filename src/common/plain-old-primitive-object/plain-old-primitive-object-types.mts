import { IbGib_V1, IbGibData_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";

export interface PlainOldPrimitiveObjectData_V1<TObj = any> extends IbGibData_V1 {
    obj: TObj;
}

/**
 * Wrapper for simple ibgib objects.
 *
 * These are going to be basic helper/minor objects that are not important/big
 * enough to require their own interfaces/helpers/constants.
 *
 * The idea is that the atom will start with plain_, e.g. plain_stats.
 */
export interface PlainOldPrimitiveObject_V1<TObj> extends IbGib_V1<PlainOldPrimitiveObjectData_V1<TObj>, any> {
}
