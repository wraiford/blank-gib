import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { CommentData_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";

import {
    CHUNK_ATOM, DOM_COMMENT_TJP_ADDR_PROPNAME, PROJECT_TJP_ADDR_PROPNAME,
    SRC_COMMENT_TJP_ADDR_PROPNAME,
} from "./constants.mjs";
import { DOMElementInfo, } from "./page-analyzer/page-analyzer-types.mjs";

export interface ChunkCommentAddlMetadataInfo {
    /**
     * indicator that this metadata pertains to a chunk atom.
     */
    atom: typeof CHUNK_ATOM;
    /**
     * The gibId of the source element in the original page content.
     * Will be an empty string if the chunk was not generated
     * from a page scan (e.g. a recursive breakdown).
     */
    gibId: string;
}

/**
 * we haven't created a dedicated chunk ibgib, but we are encapsulating the data
 * here for now.
 */
export interface ChunkCommentData_V1 extends CommentData_V1 {
    title?: string;
    /**
     * if true, then the {@link domInfo} originates from another chunk comment
     * ibgib
     */
    isSynthetic: boolean;
    /**
     * this chunk is just text, i.e., it's purely content and has no further
     * sub-composition.
     */
    isTextOnly?: boolean;
    /**
     * the root src of the entire page/src text
     */
    [SRC_COMMENT_TJP_ADDR_PROPNAME]: IbGibAddr;
    /**
     * project tjp addr.
     *
     * NOTE: if this is ROOT_ADDR, then it's temporary. this is the root src
     * chunk and it is in the process of initializing.
     */
    [PROJECT_TJP_ADDR_PROPNAME]?: IbGibAddr;
    /**
     * information about the raw DOM element(s) that this chunk corresponds
     * with.
     *
     * Note that if {@link isSynthetic} is true, then this info is duplicated
     * from another source that we do not (atow 10/31/2025) have linked/soft
     * linked to this comment ibgib.
     */
    domInfo: DOMElementInfo;
}

export interface TranslationTextKeyInfo {
    translationTextAtom: string,
    dataKey: string,
    targetLanguage: string,
}
