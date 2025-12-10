import { CommandDataBase } from "@ibgib/web-gib/dist/api/commands/command-types.mjs";

export interface RenderableCommandDataBase<TCmdModifiers extends string[]>
    extends CommandDataBase<'renderable', TCmdModifiers> {
    /**
     * @property renderSvcId - The ID of the render service to use.
     */
    renderSvcId: string;
}
