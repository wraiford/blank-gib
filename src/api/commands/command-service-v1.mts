import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { APIFunctionInfo } from "../api-types.mjs";
import { CommandDataBase, CommandService, EnqueuedCommand } from "./command-types.mjs";
import { getAllFunctionInfos } from "../api-index.mjs";

/**
 * @class CommandService_V1 - Implementation of the command service.
 * Implements the {@link CommandService} interface.
 */
export class CommandService_V1 implements CommandService {
    protected lc: string = `[${CommandService_V1.name}]`;
    private commandQueue: EnqueuedCommand<CommandDataBase<string, string[]>>[] = [];
    private isProcessing = false;

    // private anonFns: Map<string, APIFunctionInfo<any>> = new Map();

    constructor() { }

    // registerAnonFn({ apiFnInfo }: { apiFnInfo: APIFunctionInfo<any> }): void {
    //     const lc = `${this.lc}[${this.registerAnonFn.name}]`;
    //     if (this.anonFns.has(apiFnInfo.nameOrId)) {
    //         console.warn(`${lc} anonFn already registered? (W: c6721a63affe97f5514d54bbe780f625)`)
    //     }
    //     this.anonFns.set(apiFnInfo.nameOrId, apiFnInfo);
    // }

    enqueueCommand<TCommand extends CommandDataBase<string, string[]>>(enqueuedCommand: EnqueuedCommand<TCommand>): void {
        this.commandQueue.push(enqueuedCommand);
        if (!this.isProcessing) {
            this.startProcessing();
        }
    }

    private startProcessing(): void {
        this.isProcessing = true;
        this.processQueue().finally(() => {
            this.isProcessing = false;
            if (this.commandQueue.length > 0) {
                this.startProcessing(); // If more commands were added, process them
            }
        });
    }

    async processQueue(): Promise<void> {
        const lc = `${this.lc}[${this.processQueue.name}]`;
        while (this.commandQueue.length > 0) {
            const enqueuedCommand = this.commandQueue.shift();
            if (enqueuedCommand) {
                try {
                    const result =
                        await this.executeCommand(enqueuedCommand.command, enqueuedCommand.anonApiFn);
                    enqueuedCommand.resolve(result);
                } catch (error: any) {
                    console.error(`Error executing command ${enqueuedCommand.command.cmd} ${enqueuedCommand.command.cmdModifiers?.join(',') ?? ''}:`, error);
                    enqueuedCommand.reject(error);
                }
            }
        }
    }

    private async executeCommand(cmdData: CommandDataBase<string, string[]>, anonApiFn?: APIFunctionInfo<any>): Promise<any | void> {
        const lc = `[${CommandService_V1.name}.${this.executeCommand.name}]`;
        try {
            const functionInfo =
                anonApiFn ??
                Array.from(getAllFunctionInfos().entries())
                    .map(x => x[1] as APIFunctionInfo<any>)
                    .find((info) => {
                        return info.cmd === cmdData.cmd &&
                            info.cmdModifiers.every(modifier => !!cmdData.cmdModifiers?.includes(modifier));
                    });

            if (functionInfo) {
                console.log(`${lc} command executing. cmdData: ${pretty(cmdData)}`)
                // Type checking and argument passing will need refinement based on schema
                if (cmdData.notesToSelf) {
                    console.log(`${lc} Notes to self: ${cmdData.notesToSelf}.  (I: ebcc5471b2b309ba186281c134f77e25)`);
                }
                const args = this.getCommandArgs(cmdData, functionInfo);
                const result = await functionInfo.functionImpl(args);
                return result;
            } else {
                throw new Error(`${lc} Unknown command: ${cmdData.cmd} with modifiers ${cmdData.cmdModifiers?.join(', ')} (E: cc9cb829f118de05b762020213ef2825)`);
            }
        } catch (error) {
            debugger; // error in command svc exec
            const errorMsg = `${lc} ${extractErrorMsg(error)}`;
            console.error(errorMsg);
            return { errorMsg };
        }
    }

    /**
     * todo: change the structure so these explicit calls aren't necessary.
     * @param cmdData about the cmd to invoke
     * @param functionInfo full function info corresponding to cmd
     * @returns args that the cmd expects depending on incoming {@link cmdData}
     */
    private getCommandArgs(cmdData: CommandDataBase<string, string[]>, functionInfo: APIFunctionInfo): any {
        return cmdData as any;
        // // This will need to be refined based on the actual function signature and schema
        // if (functionInfo.nameOrId === 'renderableCreate') {
        //     // return { initialStates: (cmdData as RenderableCreateCommandData).initialStates, };
        //     return cmdData as RenderableCreateCommandData;
        // } else if (functionInfo.nameOrId === 'renderableUpdate') {
        //     // return { handle: (cmdData as RenderableUpdateCommandData).handle,
        //     // updatedState: (cmdData as RenderableUpdateCommandData).updatedState
        //     // };
        //     return cmdData as RenderableUpdateCommandData;
        // } else if (functionInfo.nameOrId === 'renderableDestroy') {
        //     return cmdData as RenderableDestroyCommandData;
        // } else if (functionInfo.nameOrId === 'tellUser') {
        //     return { text: (cmdData as TellUserCommandData).text };
        // } else {
        //     throw new Error(`(UNEXPECTED) unknown command? functionInfo.nameOrId: ${functionInfo.nameOrId}, cmdData: ${pretty(cmdData)} (E: 376725f2024d48c5056a9f8989616125)`);
        // }
    }

}

/**
 * @private
 */
let globalCommandService: CommandService | undefined;

/**
 * Gets the singleton instance of the CommandService.
 * @returns {CommandService} The CommandService instance.
 */
export function getCommandService(): CommandService {
    if (!globalCommandService) {
        globalCommandService = new CommandService_V1();
    }
    return globalCommandService;
}
