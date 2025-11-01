import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";

import { AgentWitnessAny } from "../../../witness/agent/agent-one-file.mjs";
import { LiveProxyIbGib } from "../../../witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";

/**
 * information about the current context of an input component.
 *
 * This drives the visual look of the input, e.g., {@link placeholderText}.
 *
 * Also, when input is given, the contextProxyIbGib is the place that will be
 * commented on.
 */
export interface InputInfo {
    agent?: AgentWitnessAny;
    /**
     * when a user submits input, this is the context within which the
     * conversation is happening.
     */
    contextProxyIbGib?: LiveProxyIbGib;
    spaceId?: SpaceId;
    placeholderText?: string;
}
