import { Gib } from "@ibgib/ts-gib/dist/types.mjs";
import { GibInfo } from "@ibgib/ts-gib/dist/V1/types.mjs";

/**
 * deterministically driven colors based on a given {@link gib}
 */
export interface GibColorInfo {
    /**
     * Gib that was used to drive the color calculation
     */
    gib: Gib;
    gibInfo: GibInfo;
    /**
     * Color that corresponds to the punctiliar part of {@link gib}
     */
    punctiliarColor: string;
    /**
     * Translucent version of {@link punctiliarColor}
     */
    punctiliarColorTranslucent: string;
    /**
     * contrasting color against punctiliar color
     */
    punctiliarColorContrast: string;
    /**
     * Color that corresponds to the tjp (timeline) part of {@link gib}
     */
    tjpColor?: string;
    /**
     * Translucent version of {@link tjpColor}
     */
    tjpColorTranslucent?: string;
    /**
     * contrasting color against tjp color
     */
    tjpColorContrast?: string;
    /**
     * If there was an error deriving the color info, this will show the error
     * message.
     */
    errorMsg?: string;
}
