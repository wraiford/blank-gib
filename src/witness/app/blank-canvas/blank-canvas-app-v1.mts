import {
    clone, extractErrorMsg, getIdPool, getUUID, pretty,
} from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { DEFAULT_DATA_PATH_DELIMITER } from '@ibgib/helper-gib/dist/constants.mjs';
import { buildArgInfos } from '@ibgib/helper-gib/dist/rcli/rcli-helper.mjs';
import { argIs, getParamInfo } from '@ibgib/helper-gib/dist/rcli/rcli-helper.mjs';
import { PARAM_INFO_HELP } from '@ibgib/helper-gib/dist/rcli/rcli-constants.mjs';
import { getIbAndGib, } from '@ibgib/ts-gib/dist/helper.mjs';
import { IbGib_V1, Rel8n, IbGibRel8ns_V1, } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { ROOT, } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { Factory_V1 as factory, } from '@ibgib/ts-gib/dist/V1/factory.mjs';
import { IbGibAddr, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
import { AppBase_V1 } from '@ibgib/core-gib/dist/witness/app/app-base-v1.mjs';
import { AppCmdIbGib, } from '@ibgib/core-gib/dist/witness/app/app-types.mjs';
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { DynamicForm, FormItemInfo } from '@ibgib/core-gib/dist/common/form/form-items.mjs';
import { WitnessFormBuilder } from '@ibgib/core-gib/dist/witness/witness-form-builder.mjs';
import { getAppIb, AppFormBuilder } from '@ibgib/core-gib/dist/witness/app/app-helper.mjs';
import { DynamicFormBuilder, } from '@ibgib/core-gib/dist/common/form/form-helper.mjs';
import { WitnessArgIbGib } from '@ibgib/core-gib/dist/witness/witness-types.mjs';
import { DynamicFormFactoryBase } from '@ibgib/core-gib/dist/witness/factory/dynamic-form-factory-base.mjs';
import { isComment } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';
import { WITNESS_CONTEXT_REL8N_NAME } from '@ibgib/core-gib/dist/witness/witness-constants.mjs';
import { IbGibRobbotAny } from '@ibgib/core-gib/dist/witness/robbot/robbot-base-v1.mjs';
import { TAG_REL8N_NAME, } from '@ibgib/core-gib/dist/common/tag/tag-constants.mjs';
import { SpecialIbGibType } from '@ibgib/core-gib/dist/common/other/other-types.mjs';
import { TagIbGib_V1 } from '@ibgib/core-gib/dist/common/tag/tag-types.mjs';

import { GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME, } from '../../../constants.mjs';
import {
    BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1, BlankCanvasAppIbGib_V1,
    BlankCanvasAppAddlMetadata,
    DEFAULT_BLANK_CANVAS_APP_DATA_V1,
    DEFAULT_DESCRIPTION_BLANK_CANVAS_APP,
    DEFAULT_BLANK_CANVAS_APP_REL8NS_V1,
} from './blank-canvas-types.mjs';
import {
    BlankCanvasCommandTextInfo, BlankCanvasCommandHandler,
    BlankCanvasCommandHandlerArg,
} from './blank-canvas-types.mjs';
import {
    BlankCanvasAppFormBuilder, getPrompt, validateArgInfos,
} from './blank-canvas-helper.mjs';
import {
    addToChatLogKluge, isRequestComment, parseCommandRawTextIntoArgs,
} from './blank-canvas-helper.web.mjs';
import {
    promptForConfirm, alertUser, promptForText, promptForSecret,
    getUserPreferredColorScheme,
} from '../../../helpers.web.mjs';
import {
    DEFAULT_COMMAND_ESCAPE_STRING, PARAM_INFOS, BlankCanvasCommand,
    RCLI_COMMANDS, RCLI_COMMAND_IDENTIFIERS, PARAM_INFO_INTERACTIVE,
    CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT,
    CHAT_WITH_AGENT_NEED_API_KEY,
} from './blank-canvas-constants.mjs';
import { RequestCommentIbGib_V1 } from '../../../types.mjs';
import { storageGet, storagePut } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import {
    AGENT_INITIAL_CHAT_TEXT_PRIMARYAGENT,
    AGENT_INITIAL_SYSTEM_TEXT_PRIMARYAGENT,
    AGENT_SPECIAL_IBGIB_NAME_PRIMARYAGENT,
    AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
} from '../../../agent-texts/primary-agent-texts.mjs';
import { GeminiModel } from '../../agent/gemini/gemini-constants.mjs';
import { AgentWitnessAny, } from '../../agent/agent-one-file.mjs';
import { ROUTER_APP_NAME_TAGS } from '../../../common/app-constants.mjs';
import { ID_TAG_NAV } from '../../../ui/shell/shell-constants.mjs';
import { getAgentsSvc } from '../../agent/agents-service-v1.mjs';
import { getAppShellSvc } from '../../../ui/shell/app-shell-service.mjs';
import { getAgents, getTag_Agents } from '../../agent/agent-helpers.mjs';
import { AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT } from '../../agent/agent-one-file.app.mjs';

// import { rcliCmdHandlerInit } from './rcli-cmd-handlers/handle-init.mjs';
// import { rcliCmdHandlerHelp } from './rcli-cmd-handlers/handle-help.mjs';
// import { rcliCmdHandlerQuit } from './rcli-cmd-handlers/handle-quit.mjs';
// import { rcliCmdHandlerFork } from './rcli-cmd-handlers/transforms/handle-fork.mjs';
// import { rcliCmdHandlerMut8 } from './rcli-cmd-handlers/transforms/handle-mut8.mjs';
// import { rcliCmdHandlerRel8 } from './rcli-cmd-handlers/transforms/handle-rel8.mjs';
// import { rcliCmdHandlerAddComment } from './rcli-cmd-handlers/handle-add-comment.mjs';
// import { rcliCmdHandlerInfo } from './rcli-cmd-handlers/handle-info.mjs';
// import { rcliCmdHandlerExport } from './rcli-cmd-handlers/handle-export.mjs';
// import { rcliCmdHandlerImport } from './rcli-cmd-handlers/handle-import.mjs';
// import { rcliCmdHandlerSecret } from './rcli-cmd-handlers/handle-secret.mjs';
// import { rcliCmdHandlerEncryption } from './rcli-cmd-handlers/handle-encryption.mjs';
// import { rcliCmdHandlerSync } from './rcli-cmd-handlers/handle-sync.mjs';
// import { rcliCmdHandlerVersion } from './rcli-cmd-handlers/handle-version.mjs';
// import { rcliCmdHandlerSpace } from './rcli-cmd-handlers/handle-space.mjs';


/**
 * for logging. import this constant from your project.
 */
const logalot = GLOBAL_LOG_A_LOT; // change this when you want to turn off verbose logging


/**
 * the app ibgib that contains configuration (meta)data.
 */
export class BlankCanvasApp_V1 extends AppBase_V1<
    // in
    any, IbGibRel8ns_V1, IbGib_V1<any, IbGibRel8ns_V1>,
    // out
    any, IbGibRel8ns_V1, IbGib_V1<any, IbGibRel8ns_V1>,
    // this
    BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1
> implements BlankCanvasAppIbGib_V1 {
    protected lc: string = `[${BlankCanvasApp_V1.name}]`;

    protected _rcliPrompt: string = '';
    protected _apiKey: string | undefined;
    get rcliPrompt(): string {
        if (!this._rcliPrompt) { this._rcliPrompt = getPrompt({ id: this.data!.name }); }
        return this._rcliPrompt;
    }
    _userPrompt: string = '';
    get userPrompt(): string {
        // todo: change user prompt once we have identity implemented
        if (!this._userPrompt) { this._userPrompt = getPrompt({ id: 'user' }); }
        return this._userPrompt;
    }

    /**
     * flag to indicate if we are currently prompting the user.
     */
    protected prompting = false;

    protected userFlaggedQuit: boolean = false;

    protected primaryAgent: AgentWitnessAny | undefined;

    /**
     * when receiving an update to the context, we want to know if the incoming
     * ibgib child is one that we've already handled. this is for idempotence
     * (to avoid double-handling).
     */
    protected alreadyHandledContextChildrenAddrs: IbGibAddr[] = [];

    /**
     * handlers for routing commands.
     *
     * order matters. the pipeline tries the first handler for a cmd, then
     * the next handler and so on.
     */
    protected cmdHandlerFns: { [cmd: string]: BlankCanvasCommandHandler[] } = {
        // [BlankCanvasCommand.init]: [rcliCmdHandlerInit],
        // [BlankCanvasCommand.help]: [rcliCmdHandlerHelp],
        // [BlankCanvasCommand.quit]: [rcliCmdHandlerQuit],
        // [BlankCanvasCommand.fork]: [rcliCmdHandlerFork],
        // [BlankCanvasCommand.mut8]: [rcliCmdHandlerMut8],
        // [BlankCanvasCommand.rel8]: [rcliCmdHandlerRel8],
        // [BlankCanvasCommand.add_comment]: [rcliCmdHandlerAddComment],
        // [BlankCanvasCommand.info]: [rcliCmdHandlerInfo],
        // [BlankCanvasCommand.export]: [rcliCmdHandlerExport],
        // [BlankCanvasCommand.import]: [rcliCmdHandlerImport],
        // [BlankCanvasCommand.secret]: [rcliCmdHandlerSecret],
        // [BlankCanvasCommand.encryption]: [rcliCmdHandlerEncryption],
        // [BlankCanvasCommand.sync]: [rcliCmdHandlerSync],
        // [BlankCanvasCommand.version]: [rcliCmdHandlerVersion],
        // [BlankCanvasCommand.space]: [rcliCmdHandlerSpace],
    };

    constructor(initialData?: BlankCanvasAppData_V1, initialRel8ns?: BlankCanvasAppRel8ns_V1) {
        super(initialData, initialRel8ns);
        const lc = `${this.lc}[ctor]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            this.initialized = this.initialize(); // spins off. caller should await this.initialized.
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * overridden (atow 12/2024) to handle Request comment which refers to a
     * user-sourced request (somewhat analogous to a command in a CLI).
     */
    protected async doNonArg({
        ibGib,
    }: {
        ibGib: IbGib_V1,
    }): Promise<IbGib_V1 | undefined> {
        const lc = `${this.lc}[${this.doNonArg.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cf68de0802e2e6fc4ae78ca986fcc823)`); }

            if (isRequestComment({ ibGib })) {
                return await this.doContextRequestComment({
                    requestCommentIbGib: ibGib as RequestCommentIbGib_V1
                });
            } else {
                return await super.doNonArg({ ibGib });
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async getAgentSystemText(): Promise<string> {
        const lc = `[${this.getAgentSystemText.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 615e2dc21cef2376211f35c8c3ff8f25)`); }

            /**
             * silly helper to load src for agent
             */
            async function getText(fileURL: string): Promise<string | null> {
                try {
                    const response = await fetch(fileURL);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const text = await response.text();
                    return text;
                } catch (error) {
                    console.error("Could not fetch the file:", error);
                    return null;
                }
            }

            const srcPaths = [
                '/ui/component/component-types.mjs',
                '/ui/component/ibgib-component-service.mjs',
                '/ui/component/ibgib-dynamic-component-bases.mjs',
            ];
            const srcTexts: string[] = [];
            for (const srcPath of srcPaths) {
                const srcText = (await getText(srcPath)) || '';
                if (!srcText) {
                    console.error(`${lc} (UNEXPECTED) src for component file (${srcPath}) couldn't be loaded? is file path (${srcPath}) not there anymore? (E: 915bd9c45db3f45882a9beba5f00ab25)`);
                }
                srcTexts.push(srcText);
            }
            // let srcComponentOneFile = (await getText(srcComponentOneFilePath)) || '';
            // if (!srcComponentOneFile) {
            //     console.error(`${lc} (UNEXPECTED) srcComponentOneFile couldn't be loaded? is file path (${srcComponentOneFilePath}) not there anymore? (E: 915bd9c45db3f45882a9beba5f00ab25)`);
            //     srcComponentOneFile = `[${srcComponentOneFilePath} not found. Moved? Doh!]`;
            // }
            const text = [
                AGENT_INITIAL_SYSTEM_TEXT_PRIMARYAGENT,
                `The current preferred color scheme is ${getUserPreferredColorScheme()}. This website is designed with 'light' by default. You should go ahead and ask if they'd like to set it to a darker theme in the intro if their preference is 'dark'. You may also offer to change it to a different light theme even if it's already light.`,
                'Here is the src for the component architecture: ',
                ...srcTexts,
                '\n',
            ].join('\n');
            return text;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async initializePrimaryAIAgent({
        requestCommentIbGib,
        fnGetAPIKey,
    }: {
        requestCommentIbGib: CommentIbGib_V1,
        fnGetAPIKey: () => Promise<string>,
    }): Promise<void> {
        const lc = `${this.lc}[${this.initializePrimaryAIAgent.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 548ea720676eba58647515ba14d33323)`); }

            const { metaspace } = this;

            if (!metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? This should already be initialized and set at this point in initialization. (E: 21456d6186e434848d907c4d05e11225)`); }
            const space = await metaspace.getLocalUserSpace({ lock: false });
            if (!space) { throw new Error(`(UNEXPECTED) local user space is falsy? (E: 84c9fe63f384b1cf1bc996a65b33ea25)`); }

            let agent: AgentWitnessAny;
            const agents = await getAgents({
                metaspace,
                type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                space,
            });
            // while (agents.length > 0) {
            //     console.warn(`${lc} DEBUG!!!! clearing agents to force createNewAgent (W: 994e6cc0d48bbdbd09dbe0437ec86a25)`)
            //     agents.pop();
            // } // debug


            if (agents.length > 0) {
                agent = agents.at(0)!;
                this.primaryAgent = agent;
            } else {
                // no primary agents, so we have to create one and register it.
                const agentsSvc = getAgentsSvc();
                agent = await agentsSvc.createNewAgent({
                    api: 'gemini',
                    metaspace,
                    fnGetAPIKey,
                    superSpace: undefined, // defaults to local user space
                    name: AGENT_SPECIAL_IBGIB_NAME_PRIMARYAGENT,
                    availableFunctions: [...AGENT_AVAILABLE_FUNCTIONS_PRIMARYAGENT],
                    // initialSystemText: AGENT_INITIAL_SYSTEM_TEXT_PRIMARYAGENT,
                    initialSystemText: await this.getAgentSystemText(),
                    initialChatText: AGENT_INITIAL_CHAT_TEXT_PRIMARYAGENT,
                    model: GeminiModel.GEMINI_2_0_FLASH,
                    type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                    addToAgentsTag: true,
                });
                if (!agent) { throw new Error(`(UNEXPECTED) agent falsy after creating new one? (E: ee915f82db5d395a04ad4bd8c4567225)`); }
                this.primaryAgent = agent;
                const _ = await this.primaryAgent.witness(ROOT);
            }

            if (!this.primaryAgent) { throw new Error(`(UNEXPECTED) this.primaryAgent still falsy even after creating a new one? (E: 6362dfcdd51e95b66a3a731c777ed725)`); }
            // this.initializeUIUserInputForPrimaryAgent();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * this should be in a node helper for the dynamic form plumbing.
     */
    protected async promptDynamicFormItem({
        item,
        /**
         * title for a group of prompts.
         */
        groupTitle,
    }: {
        /**
         *
         */
        item: FormItemInfo,
        /**
         * title for a group of prompts.
         */
        groupTitle: string,
    }): Promise<FormItemInfo> {
        const lc = `${this.lc}[${this.promptDynamicFormItem.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 871d6bb68f2e431b6b43ba4bc0cb5a23)`); }

            if (item.readonly) {
                item.value = item.defaultValue;
                return item; /* <<<< returns early */
            }

            let title = groupTitle ? `${groupTitle}] ${item?.label}?` : `${item?.label ?? item.name}?`;
            if (item.description) { title = `${title}\n${item.description}`; }

            let valid = false;

            let value: string | number | boolean | undefined;
            do {
                //   'text' | 'textarea' | 'select' | 'toggle' | 'number' | 'form';
                if (item.dataType === 'text' || item.dataType === 'textarea') {
                    value = await promptForText({
                        title,
                        msg: (item.label ?? item.name) + '?' + (item.defaultValue ? ` [ ${item.defaultValue} ]` : ''),
                        confirm: false,
                        noNewLine: false,
                        defaultValue: item.defaultValue?.toString(),
                    });
                } else if (item.dataType === 'number') {
                    value = await promptForText({
                        title,
                        msg: (item.label ?? item.name) + '?' + (item.defaultValue ? ` [ ${item.defaultValue} ]` : ''),
                        confirm: false,
                        noNewLine: false,
                    });
                    if (Number.isNaN(Number.parseInt(value))) {
                        console.error(`value is not a number. must be a number...hmm`);
                        valid = false;
                    }
                    value = Number.parseInt(value); // meh, was a string, now a number but we know this is possible in context
                } else if (item.dataType === 'toggle') {
                    console.log(`${lc} todo: need to improve/test this boolean prompt`);
                    value = await promptForConfirm({
                        msg: (item.label ?? item.name) + '?' + (item.defaultValue ? ` [ ${item.defaultValue} ]` : ''),
                        yesLabel: 'true',
                        noLabel: 'false',
                    }) as boolean;
                } else if (item.dataType === 'form') {
                    await this.promptDynamicFormItem({ item, groupTitle: groupTitle + (item.label ?? item.name), })
                } else if (item.dataType === 'select') {
                    if (!item.selectOptions && !item.selectOptionsWithIcons) { throw new Error(`(UNEXPECTED) invalid item. if type is 'select' must have either selectOptions or SelectOptionsWithIcons (E: 4d16dd9f88a7252264677cb32a865f23)`); }
                    let options = item.selectOptions ?
                        item.selectOptions!.concat() :
                        item.selectOptionsWithIcons!.map(x => `${x.label} - ${x.value}`);
                    let msg = (item.label ?? item.name) + '?' + (item.defaultValue ? ` [ ${item.defaultValue} ]` : '');
                    for (let i = 0; i < options.length; i++) {
                        const option = options[i];
                        msg += `\n${i}. ${option}`;
                    }
                    msg += '\nEnter the number of your selection.';
                    value = await promptForText({
                        title,
                        msg: msg,
                        confirm: false,
                        noNewLine: false,
                    });
                    let parsedSelectionIndex = Number.parseInt(value);
                    if (Number.isInteger(parsedSelectionIndex) && parsedSelectionIndex >= 0 && parsedSelectionIndex < options.length) {
                        value = item.selectOptions ?
                            item.selectOptions![parsedSelectionIndex] :
                            item.selectOptionsWithIcons![parsedSelectionIndex]!.value;
                    } else {
                        console.error(`Invalid selection. Please enter the NUMBER for your option.`);
                        value = undefined;
                    }
                } else {
                    throw new Error(`other item.dataType (${item.dataType}) not implemented yet in node prompt (E: bdadf312ed16054518a7fdb9a78ae723)`);
                }

                if (!value && item.defaultValue) { value = item.defaultValue as any; }

                let regexpIsValid = false;

                if (item.regexp) {
                    // regexp implies string
                    regexpIsValid = !!((value as string).match(item.regexp));
                    if (!regexpIsValid) {
                        console.error(item.regexpErrorMsg ?? item.defaultErrorMsg ?? 'invalid regexp');
                        console.error(`raw regexp source: ${item.regexp.source}`);
                    }
                } else {
                    regexpIsValid = true;
                }

                let fnValidIsValid = false;
                if (item.fnValid) {
                    fnValidIsValid = item.fnValid(item.value as any);
                    if (!fnValidIsValid) {
                        console.error(item.defaultErrorMsg ?? 'invalid value');
                    }
                } else {
                    fnValidIsValid = true;
                }

                valid = regexpIsValid && fnValidIsValid;
            } while (!valid)

            // use the item reference directly?
            item.value = value! ?? item.defaultValue ?? undefined;

            return item;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async initializeAIRobbot_createNewRobbotInDefaultSpace({
        requestCommentIbGib
    }: {
        requestCommentIbGib: CommentIbGib_V1
    }): Promise<IbGibRobbotAny | undefined> {
        const lc = `${this.lc}[${this.initializeAIRobbot_createNewRobbotInDefaultSpace.name}]`;
        try {
            console.warn(`${lc} doesn't do anything right now (W: 51cfb295d4339a416ef69f4203910124)`);
            return undefined;
            // throw new Error(`not implemented (E: c4f30cec51c89f803dd907a20bc16224)`);
            // if (logalot) { console.log(`${lc} starting... (I: ce78e26ece7f7b16ab62b3a24326e523)`); }
            // const dontPrompt =
            //     (requestCommentIbGib.data?.interpretedArgInfos ?? []).some(x => x.name === PARAM_INFO_YES.name);
            // let rollyFactory = new RollyRobbot_V1_Factory();
            // let blank = (await rollyFactory.newUp({})).newIbGib;
            // let form = await rollyFactory.witnessToForm({ witness: blank });
            // let items = form.items;
            // for (let i = 0; i < items.length; i++) {
            //     const item = items[i];
            //     if (!item.readonly) {
            //         if (dontPrompt) {
            //             item.value = item.defaultValue;
            //         } else {
            //             await this.promptDynamicFormItem({ item, groupTitle: RollyRobbot_V1.name });
            //         }
            //     } else {
            //         console.log(`${item.label ?? item.name}: ${item.value} (readonly)`);
            //     }
            // }
            // const resRobbot = await rollyFactory.formToWitness({ form });
            // const primaryAgent = resRobbot.newIbGib;

            // const allIbGibs: IbGib_V1[] = [];
            // allIbGibs.push(primaryAgent);
            // resRobbot.intermediateIbGibs?.forEach(x => allIbGibs.push(x));
            // resRobbot.dnas?.forEach(x => allIbGibs.push(x));
            // for (let i = 0; i < allIbGibs.length; i++) {
            //     const ibGib = allIbGibs[i];
            //     const validationErrors = await validateIbGibIntrinsically({ ibGib });
            //     if ((validationErrors ?? []).length > 0) { throw new Error(`(unexpected) invalid robbot ibgib created. validationErrors: ${validationErrors}. robbot: ${pretty(primaryAgent.toIbGibDto())} (E: a683268621cd6dd3dd60310b164c4d22)`); }
            // }

            // if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 6d7046456f8a48237249d885ea509823)`); }
            // await this.metaspace!.persistTransformResult({ resTransform: resRobbot });

            // await this.metaspace.registerNewIbGib({ ibGib: primaryAgent });

            // await this.metaspace.rel8ToSpecialIbGib({
            //     type: "robbots",
            //     rel8nName: ROBBOT_REL8N_NAME,
            //     ibGibsToRel8: [primaryAgent],
            // });

            // await this.rel8To({
            //     ibGibs: [primaryAgent],
            //     rel8nName: BLANK_CANVAS_ROBBOT_REL8N_NAME,
            //     metaspace: this.metaspace,
            //     linked: false,
            // });

            // primaryAgent.metaspace = this.metaspace;

            // return primaryAgent;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * User (or another agent?) has produced a request comment. This is
     * a comment analogous to a command in a CLI, where some action with
     * one or more args is being sent to the app.
     *
     * @example a comment with data.text === '--interactive'
     *
     * This particular example is a carryover from the @ibgib/ibgib RCLI app,
     * and the flag indicates that the command is intended to start an
     * interactive REPL as opposed to a single, one-off command executed from
     * the commandline proper (e.g. bash).
     */
    protected async doContextRequestComment({
        requestCommentIbGib
    }: {
        requestCommentIbGib: CommentIbGib_V1
    }): Promise<IbGib_V1> {
        const lc = `${this.lc}[${this.doContextRequestComment.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 7f084169817731807e31a9d9ae133423)`); }

            if (logalot) { console.log(`${lc} requestCommentIbGib.data: ${pretty(requestCommentIbGib.data)} (I: 6110bbb16202db1b6aa23eb2726b8324)`); }

            const { interpretedArgInfos } = (requestCommentIbGib as RequestCommentIbGib_V1).data!;

            // if it's the --interactive, then it resets/initializes the app
            if (interpretedArgInfos.some(x => x.name === PARAM_INFO_INTERACTIVE.name)) {
                // await storageCreateStoreIfNotExist({
                //     dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                // });

                if (this._currentWorkingContextIbGib) {
                    console.warn(`${lc} we're handling a comment but we've already established our context...not really tested yet. calling this.finalizeContext... (W: ac8d4437ebccba73bc8046879916a324)`);
                    await this.finalizeContext({ arg: undefined });
                }

                // this first comment is the context for this "session"
                await this.initializeContext({
                    contextIbGib: requestCommentIbGib,
                    rel8nName: WITNESS_CONTEXT_REL8N_NAME,
                });

                // #region apikey
                let apiKey = await storageGet({
                    dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                    key: BEE_KEY,
                });
                this._apiKey = apiKey;
                // #endregion apikey

                // initialize tags explorer in for left pane. this must happen
                // before initializing the primary agent, so that the agents tag is already created.
                await this.initializeTags();

                await this.initializePrimaryAIAgent({
                    requestCommentIbGib,
                    fnGetAPIKey: () => Promise.resolve(this._apiKey ?? ''),
                });

                if (!this.primaryAgent) { throw new Error(`(UNEXPECTED) this.primaryAgent falsy? we just init it (E: 3a81cee2c06c392e672148dab5858925)`); }
            } else {
                debugger; // error not impl - non-first --interactive request comment
                throw new Error(`other requests not implemented yet (E: 2c0b9c8a2b699ab366e8a9244af8bc24)`);
            }

            return ROOT;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * @see {@link handleContextUpdate}
     */
    protected async handleNewContextChild({ newChild }: { newChild: IbGib_V1 }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 88fe5e432fb872868f6faa46bc40d623)`); }

            if (logalot) { console.log(`${lc} this does nothing atow (04/2025). I'm shifting over this kind of thing to the input component and agents. this isn't set in stone though and this method needs to be implemented in any witness with context descendant (like this one). (I: 0cb9ec753e02ae18f9da3abb05b57125)`); }

            // const addr = getIbGibAddr({ ibGib: newChild });

            // if (this.alreadyHandledContextChildrenAddrs.includes(addr)) {
            //     if (logalot) { console.log(`${lc} already handled, returning early: ${addr} (I: 57adca7ed6454402bc7298425b48596d)`); }
            //     return; /* <<<< returns early */
            // } else {
            //     this.alreadyHandledContextChildrenAddrs.push(addr);
            // }

            // if (isComment({ ibGib: newChild })) {
            //     // console.log(`${lc} recvd yo`)
            //     // temporary here...need to get a better handle on what our
            //     // strategy is
            //     setTimeout(async () => {
            //         await this.doComment({ ibGib: newChild as CommentIbGib_V1 });
            //         console.log(`${lc} echo: ${newChild.data!.text}`);
            //     });
            // }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * overridden to convert comments to requests, if applicable.
     */
    protected async doComment({
        ibGib,
    }: {
        ibGib: CommentIbGib_V1,
    }): Promise<IbGib_V1 | undefined> {
        const lc = `${this.lc}[${this.doComment.name}]`;
        let result: IbGib_V1 | undefined = undefined;
        try {

            if (logalot) { console.log(`${lc} starting... (I: 2aff0c8c408280380e444937b51d2823)`); }

            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: 797d98487fd87e3cace0879258ad4323)`); }
            const { text } = ibGib.data;
            if (!text) { throw new Error(`(unexpected) ibGib.data.text falsy? should be a comment (E: ed245746863d53bb1449350d41392323)`); }

            // app is hard-coded atow to start requests with the colon (:), e.g., ":quit"
            const cmdEscapeString = this.data!.cmdEscapeString ?? DEFAULT_COMMAND_ESCAPE_STRING;
            if (isBlankCanvasCommandComment({ ibGib, cmdEscapeString })) {
                // put into command pipeline
                result = await this.routeAndDoBlankCanvasCommand({ commentIbGib: ibGib, cmdEscapeString });
            } else {
                // just echo atm. the ibgib itself has already been added to the
                // context via the "comment" rel8n name.
                // setTimeout(() => {
                //     // const msg = `echo: ${text}`;
                //     // stdout.write(`\x1b[2K\r${this.rcliPrompt} ${msg}`);
                //     console.log(`\n${text}`)
                // });

                result = ROOT;
            }

            return result;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            // don't rethrow ?
            // throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * If we've gotten here, the user/robbot/someone has added a comment to the
     * current context, and that comment has been interpreted as being a command
     * for this RCLI app to process.
     *
     * This is different than a request said to one of the robbots or someone
     * else, this is specifically a command for the app to handle.
     */
    protected routeAndDoBlankCanvasCommand({
        commentIbGib,
        cmdEscapeString,
    }: {
        commentIbGib: CommentIbGib_V1,
        cmdEscapeString: string,
    }): Promise<IbGib_V1 | undefined> {
        const lc = `${this.lc}[${this.routeAndDoBlankCanvasCommand.name}]`;
        return new Promise<IbGib_V1 | undefined>(async (resolve, reject) => {
            try {
                if (logalot) { console.log(`${lc} starting... (I: 206631a4d0dc2219f9d8b4dd24e2f923)`); }
                if (!this._currentWorkingContextIbGib) { throw new Error(`(UNEXPECTED) this._currentWorkingContextIbGib expected to be truthy/initialized. (E: 55f4538845b34b0b9760d588583fb02f)`); }

                if (logalot) {
                    console.log(`${lc} console.dir(commentIbGib)... (I: 784333205d9a737d7eed2b45d5edc123)`);
                    console.dir(commentIbGib);
                }

                let cmdInfo = await this.parseBlankCanvasCommandText({
                    ibGib: commentIbGib,
                    cmdEscapeString,
                });
                let { cmd, rawText, errorMsg, } = cmdInfo;
                // do on the next process loop after we have completed the
                // current handle next child...not sure i like this type of
                // hack. it seems to be because we're appending a child while
                // already handling a new context child. but we should
                // DEFINITELY be able to handle multiple children being added
                if (errorMsg) {
                    if (logalot) { console.log(`${lc} errorMsg(?): ${errorMsg} (I: 56ba860fe6431e204394519a27c1c923)`); }
                    // there was an error
                    await this.createCommentAndRel8ToContextIbGib({
                        text: `"${cmd ? this.data!.cmdEscapeString + cmd : rawText}" request not impl? error: ${errorMsg} (E: b2a5565f04734d4c80f504b3604b674f)`,
                        contextIbGib: this._currentWorkingContextIbGib!,
                        rel8nName: 'comment',
                        metaspace: this.metaspace,
                    });

                    resolve(ROOT);
                    return; /* <<<< returns early */
                }

                if (logalot) { console.log(`${lc} passed validation. routing... (I: bd0f1ce083aee606b2cde02433fc6f23)`); }
                // route
                // should be able to handle all BlankCanvasCommand's
                let result: IbGib_V1 | undefined = undefined;
                if (cmd === BlankCanvasCommand.quit) {
                    if (logalot) {
                        console.log(`${lc} cmd init. routing complete. (I: 5e62112423561ce74e8510db819bd723)`);
                        // console.log(`${lc} cwd: ${cwd()} (I: 1fbbe4d4d0790325fc88f9bf621a5223)`);
                    }
                    this.userFlaggedQuit = true;
                    result = ROOT;
                    // } else if (cmd === BlankCanvasCommand.init) {
                    //     // already handled before handoff to this app
                    //     if (logalot) { console.log(`${lc} cmd init: routing complete. (I: 1176df79d23db197dc94f2c9c0959523)`); }
                    //     result = ROOT;
                } else {
                    if (logalot) { console.log(`${lc} sending cmd to handler pipeline. (I: cc0d1cb45073cfb5d392a043480bd623)`); }
                    result = await this.handleCommandViaHandlerPipeline({
                        cmdInfo,
                        cmdEscapeString,
                        contextIbGib: this._currentWorkingContextIbGib!,
                        ibGib: commentIbGib,
                        metaspace: this.metaspace!,
                        fnAddComment: (arg) => this.createCommentAndRel8ToContextIbGib(arg),
                    });
                    if (logalot) { console.log(`${lc} pipeline complete. (I: 027153226eeb31d8442e488726a50123)`); }
                }
                if (!result) {
                    if (logalot) { console.log(`${lc} result still falsy. routing to default command handler. (I: 6b89ea11a37cffbdf48bb8369305a423)`); }
                }
                result ??= await this.handleCommand_default({
                    cmdInfo,
                    cmdEscapeString,
                    contextIbGib: this._currentWorkingContextIbGib!,
                    ibGib: commentIbGib,
                    metaspace: this.metaspace!,
                    fnAddComment: (arg) => this.createCommentAndRel8ToContextIbGib(arg),
                });

                if (logalot) { console.log(`${lc} routing complete. (I: 8805ec40ae0c7d9e0f7ba8cce0eee323)`); }
                // if (result?.ib === 'quit' || (commentIbGib as CommentIbGib_V1).oneOff) {
                //     this.userFlaggedQuit = true;
                // }

                resolve(result);
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                reject(error);
            } finally {
                if (logalot) { console.log(`${lc} complete.`); }
            }
        })
    }

    /**
     * Iterates through this.handlers until a result is produced.
     */
    protected async handleCommandViaHandlerPipeline(arg: BlankCanvasCommandHandlerArg): Promise<IbGib_V1 | undefined> {
        const lc = `${this.lc}[${this.handleCommandViaHandlerPipeline.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f25ed09ef3814d9e9299a5c9c8f1efb3)`); }
            let { cmdInfo, cmdEscapeString, contextIbGib, ibGib, metaspace, } = arg;
            if (!cmdInfo.cmd) { throw new Error(`cmdInfo.cmd falsy? maybe this is valid but atow i'm thinking this should be truthy. (E: 2f5e8e57170c2909d5b4e55bad3abf23)`); }
            const handlers = this.cmdHandlerFns[cmdInfo.cmd] ?? [];
            if (handlers.length === 0) {
                console.warn(`${lc} no handlers found for valid command name ${cmdInfo.cmd} (W: 4edc0b9cdb4c4febb53b638dc3fd4587)`);
                return undefined; /* <<<< returns early */
            }

            for (let i = 0; i < handlers.length; i++) {
                const fnHandler = handlers[i];
                const result = await fnHandler(arg);
                return result; /* <<<< returns early */
            }

            // if we've gotten here, then there was no result produced
            return undefined;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async handleCommand_default({
        cmdInfo,
        cmdEscapeString,
        contextIbGib,
        ibGib,
        metaspace,
    }: BlankCanvasCommandHandlerArg): Promise<IbGib_V1 | undefined> {
        const lc = `${this.lc}[${this.handleCommand_default.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 38693806745793a0636382d2d10fe423)`); }
            // unknown how to handle the command
            await this.createCommentAndRel8ToContextIbGib({
                text: `"${cmdEscapeString}${cmdInfo.cmd}" cmd not impl...or iow...huh?`,
                contextIbGib: this._currentWorkingContextIbGib!,
                rel8nName: 'comment',
                metaspace: this.metaspace,
            });
            return ROOT;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * hacky port from @ibgib/ibgib rcli app
     */
    protected async parseBlankCanvasCommandText({
        ibGib,
        cmdEscapeString,
    }: {
        ibGib: CommentIbGib_V1,
        cmdEscapeString: string,
    }): Promise<BlankCanvasCommandTextInfo> {
        const lc = `${this.lc}[${this.parseBlankCanvasCommandText.name}]`;
        let rawText = ibGib.data?.text ?? '';
        try {
            if (logalot) { console.log(`${lc} starting... (I: e5bbbb50174a6bdfafceeddcde156523)`); }
            let showHelp: boolean = false;

            if (!ibGib.data) { throw new Error(`ibGib.data required for comment ibgibs (E: c6ff0bd4be1521aee826d79abe28c423)`); }

            let {
                validArgsString,
                args,
                cmd_ie_firstArgSansPrefix: rawCmdText,
                validationErrorMsg
            } = parseCommandRawTextIntoArgs({
                rawText,
                validCommandIdentifiers: RCLI_COMMAND_IDENTIFIERS.concat(),
                logErrors: !!logalot,
            });
            if (!validArgsString) { throw new Error(`validationErrorMsg: ${validationErrorMsg ?? '(UNEXPECTED) validationErrorMsg falsy? (E: ef73b6dd91614dfeb0beff5b45481987)'} (E: 32be53bf7417562d09d6596c5776b423)`); }

            // at this point, args and cmd should be truthy
            if (!args || args.length === 0) { throw new Error(`(UNEXPECTED) validArgsString but args is falsy/empty? (E: 99c62a49478f7076026962b5466f4223)`); }
            if (!rawCmdText) { throw new Error(`(UNEXPECTED) validArgsString but returned cmd is falsy? (E: b4e4e6ac3f060566166302f585385223)`); }

            // if (!rawText.startsWith(cmdEscapeString)) {
            //     if (rawText.startsWith('--')) {
            //         // maybe is a command...
            //         const firstArg = rawText.split(' ')[0].slice(2).toLowerCase(); // 2 to slice off -- prefix
            //         if (!RCLI_COMMAND_IDENTIFIERS.includes(firstArg)) {
            //             throw new Error(`(UNEXPECTED) at this point atow, cmdEscapeString is expected to start the command's raw text or start with a command arg with -- prefix (E: 69ad38b36daddcaaddba1edfedc54823)`);
            //         }
            //     }
            // }

            // args = rawText.split(' ') ?? [];
            // let args: string[] = rawText.split(' ') ?? [];
            // args_spaceDelimited = rawText.split(' --') ?? []; // doesn't work if there is a bare arg
            // const firstArg = args[0]!;
            // let rawCmdText: string;
            // if (firstArg.startsWith(cmdEscapeString)) {
            //     rawCmdText = firstArg.substring(cmdEscapeString.length);
            // } else if (firstArg.startsWith('--')) {
            //     rawCmdText = firstArg.substring('--'.length);
            // } else {
            //     throw new Error(`(UNEXPECTED) expected a valid command at this point. the first arg must be a valid command. any bare args or others must come after the command arg. valid commands must not contain spaces. current valid commands (and synonyms): ${RCLI_COMMAND_IDENTIFIERS} (E: 2524e642dfbcd075cca2aa94a109b123)`);
            // }
            // let cmdParamInfo = getParamInfo({
            //     argIdentifier: rawCmdText,
            //     paramInfos: PARAM_INFOS
            // });

            let cmdParamInfo = getParamInfo({
                argIdentifier: rawCmdText,
                paramInfos: PARAM_INFOS,
                throwIfNotFound: false,
            });

            if (!cmdParamInfo) {
                return {
                    rawText,
                    errorMsg: `unknown command ${rawCmdText}`,
                }; /* <<<< returns early */
            }

            if (!cmdParamInfo.isFlag) { throw new Error(`(UNEXPECTED) atow I'm expecting this to always be a flag (E: f2ecc77d4bcc13373a7fccb3c2709b23)`); }
            if (!RCLI_COMMANDS.includes(cmdParamInfo.name as BlankCanvasCommand)) {
                throw new Error(`(unexpected) unknown RCLI command. rawCmdText: ${rawCmdText}. cmdParamInfo.name: ${cmdParamInfo.name} (E: b9136afd19c12838c2201b34eac38723)`);
            }
            const cmd = cmdParamInfo.name as BlankCanvasCommand;

            // I have everything prefixed with the double dashes atow
            // but we removed those dashes. manually with args[0] and
            // broadly when we split with raw.split(' --')
            // args[0] = `--${cmd}`;
            // args[0] = cmd;
            // args = args.map(x => `--${x}`);

            if (logalot) { console.log(`${lc} args.join(' '): ${args.join(' ')}`); }

            // const argInfos = buildArgInfos({ args, paramInfos: PARAM_INFOS, logalot: !!logalot });
            const argInfos = buildArgInfos({
                args: args,
                paramInfos: PARAM_INFOS,
                logalot: !!logalot
            });

            const validationErrors = validateArgInfos({ argInfos });
            if (validationErrors && validationErrors.length > 0) {
                // there was an error, so return early
                return {
                    rawText,
                    errorMsg: `There were validation errors for command args: ${validationErrors}`,
                }; /* <<<< returns early */
            }

            // showHelp = (argInfos.some(x => argIs({
            showHelp = (args.some((x, i) => argIs({
                arg: x,
                paramInfo: PARAM_INFO_HELP,
                argInfoIndex: i,
            })));

            if (logalot) {
                console.log(`${lc} here are the args received`);
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    console.log(`arg ${i}: ${arg}`);
                }
            }

            return { cmd, rawText, argInfos, showHelp, };
        } catch (error) {
            return {
                rawText,
                errorMsg: `There was an error: ${extractErrorMsg(error)}`,
            }; /* <<<< returns early */
            // console.error(`${lc} ${extractErrorMsg(error)}`);
            // throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     *
     * @returns addlmetadata string (atow default impl in base class)
     */
    protected getAddlMetadata(): string {
        return super.getAddlMetadata();
    }
    protected parseAddlMetadataString<TParseResult>({ ib }: { ib: string; }): TParseResult {
        // const addlMetadataText = `${atom}_${classnameIsh}_${nameIsh}_${idIsh}`;
        if (!ib) { throw new Error(`ib required (E: 4ec93595c12cc15ee71d92dd8a4f4f23)`); }
        const lc = `[${this.parseAddlMetadataString.name}]`;
        try {
            const [atom, classnameIsh, nameIsh, idIsh] = ib.split('_');
            const result = { atom, classnameIsh, nameIsh, idIsh, } as BlankCanvasAppAddlMetadata;
            return result as TParseResult; // i'm not liking the TParseResult...hmm
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    /**
     * Initializes to default space values.
     */
    protected async initialize(): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            if (!this.data) { this.data = clone(DEFAULT_BLANK_CANVAS_APP_DATA_V1); }
            if (!this.rel8ns && DEFAULT_BLANK_CANVAS_APP_REL8NS_V1) {
                this.rel8ns = clone(DEFAULT_BLANK_CANVAS_APP_REL8NS_V1);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleSubmit({
        primaryAgentInput,
        primaryAgentChatLog,
    }: {
        primaryAgentInput: HTMLTextAreaElement,
        primaryAgentChatLog: HTMLDivElement,
    }): Promise<void> {
        const lc = `${this.lc}[${this.handleSubmit.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b9afb275fbe234fbc7bf29a144a65d25)`); }

            const shellLayoutSvc = getAppShellSvc();
            const rightPanelStatus = shellLayoutSvc.getPanelStatus({ panelName: 'rightPanel' });
            if (rightPanelStatus !== 'expanded' && rightPanelStatus !== 'maximized') {
                shellLayoutSvc.expand({ panelNames: ['rightPanel'] });
            }

            const text = primaryAgentInput.value; // use value?
            primaryAgentInput.value = ""; // clear it.
            if (!text) {
                console.log(`${lc} no text entered but user tried to submit? (I: d41f58e9237f04f0cd49490970aeb125)`);
                return; /* <<<< returns early */
            }
            console.log(`${lc} user submitted text`)

            // first ensure our best to see if we have an api key already
            if (!this._apiKey) {
                this._apiKey = await storageGet({
                    dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                    key: BEE_KEY,
                });
            }

            const fnSubmitToAgent = async () => {
                try {
                    // Add to the primary agent's chat
                    if (!this.primaryAgent) { throw new Error(`this.primaryAgent falsy. (E: f27e865192c0638941f1e71415a89d25)`); }
                    if (logalot) { console.log(`Adding primary agent chat: ${text} (I: 5e4c863e892d53b913b40a7a3f635325)`); }
                    await this.primaryAgent.addTexts({
                        infos: [{ textSrc: 'human', text, isSystem: text.startsWith('system: ') }],
                    });
                    await addToChatLogKluge({
                        text,
                        who: 'user',
                        chatLog: primaryAgentChatLog,
                        scrollAfter: true,
                    });
                    const _ = await this.primaryAgent.witness(ROOT);
                } catch (error) {
                    console.error(`error adding chat to agent (E: 81b8a8b4a231c9448a712e4244b50e25): ${extractErrorMsg(error)}`);
                }
            };

            // if we have an apikey, submit the chat. else we'll have to
            // do some work to get the user to enter an api key (and
            // fund us!)
            if (this._apiKey) {
                await fnSubmitToAgent();
            } else {
                let tryAgain = false;
                let attempts = 0;
                let maxAttempts = 5;
                do {
                    attempts++;
                    if (attempts >= maxAttempts) { throw new Error(`too many attempts (E: 0bf28659ce5f405d44a56f19aced0225)`); }
                    let resAPIKey = await promptForSecret({
                        msg: CHAT_WITH_AGENT_NEED_API_KEY,
                        confirm: false,
                    });
                    if (resAPIKey) {
                        if (resAPIKey.match(/^[a-zA-Z0-9\-_]{32,64}$/)) {
                            tryAgain = false;
                            this._apiKey = resAPIKey;
                            await storagePut({
                                dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                                key: BEE_KEY,
                                value: resAPIKey,
                            });
                            await alertUser({ title: `need to reload...`, msg: `Cool! We've got the API key in your IndexedDB (clear this if you want to delete it). We must now reload the page... (investment would be a good thing to improve this experience!)` });
                            window.location.reload();
                            return; /* <<<< returns early */
                        } else {
                            await alertUser({
                                title: `That's an API Key?`,
                                msg: `That doesn't look like a valid API key, please try again, or hit cancel if you don't want to at this time.`,
                            });
                            tryAgain = true;
                        }
                    } else {
                        console.log(`${lc} user cancelled entering API key. (I: c79d394f3c91375a07a8f09adc2c2a25)`);
                        tryAgain = false;
                    }
                } while (tryAgain);
            }

            primaryAgentInput.placeholder = CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT;

            if (logalot) { console.log(`handling "enter" key complete (I: 4c001a41a9b9e10c8671b66624f68225)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }


    }

    // private initializeUIUserInputForPrimaryAgent(): void {
    //     const lc = `${this.lc}[${this.initializeUIUserInputForPrimaryAgent.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 01899912ba1dd310bfb26291ecd24125)`); }

    //         if (!this.primaryAgent) { throw new Error(`(UNEXPECTED) this.primaryAgent falsy? (E: f7715578afad09926fc0267183221825)`); }

    //         // Get references to the input element and the chat log div
    //         const primaryAgentInput = document.getElementById(ID_PRIMARY_AGENT_INPUT) as HTMLTextAreaElement;
    //         const primaryAgentChatLog = document.getElementById(ID_PRIMARY_AGENT_CHAT_LOG) as HTMLDivElement;
    //         const inputSendBtnEl = document.getElementById(ID_PRIMARY_AGENT_INPUT_SEND_BTN) as HTMLButtonElement;

    //         if (!primaryAgentInput) {
    //             console.error(`${lc} (UNEXPECTED) Could not find #${ID_PRIMARY_AGENT_INPUT} HTML element. (E: 56b16f720a97038c021a3b254a78d125)`);
    //         }
    //         if (!inputSendBtnEl) {
    //             console.error(`${lc} (UNEXPECTED) #${ID_PRIMARY_AGENT_INPUT_SEND_BTN} HTML element? (E: cc79ba330dc9fbb72629a164a4cc9125)`);
    //         }

    //         // Add an event listener to the input element
    //         primaryAgentInput.placeholder = CHAT_WITH_AGENT_PLACEHOLDER_PRIMARYAGENT;
    //         primaryAgentInput.readOnly = false;
    //         primaryAgentInput.addEventListener('keydown', async (event) => {
    //             if (event.key === 'Enter' && event.ctrlKey === true) {
    //                 event.preventDefault(); // Prevent default behavior (new line)
    //                 await this.handleSubmit({ primaryAgentInput, primaryAgentChatLog });
    //             }
    //         });

    //         inputSendBtnEl.addEventListener('click', async (event) => {
    //             await this.handleSubmit({ primaryAgentInput, primaryAgentChatLog });
    //         });


    //         // init the primary agent chat log
    //         // if (!primaryAgentChatLog) {
    //         //     console.error(`${lc} (UNEXPECTED) Could not find #${ID_PRIMARY_AGENT_CHAT_LOG} HTML element. (E: 42b54a972e053b3f026c8d861a68f725)`);
    //         // }
    //         const agent = this.primaryAgent;
    //         this.primaryAgent.fnOutputText = async (text) => {
    //             await agent.addTexts({ infos: [{ textSrc: 'ai', text, }], });
    //             const chatEntry = document.createElement('p');
    //             chatEntry.textContent = `agent> ${text}`;
    //             primaryAgentChatLog.appendChild(chatEntry);
    //             primaryAgentChatLog.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    //         };
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    /**
     * When the app starts up, we get the user's tags and load them in the left pane.
     */
    protected async initializeTags(): Promise<void> {
        const lc = `${this.lc}[${this.initializeTags.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e43c64cd856793130e1f44de03546b25)`); }
            const { metaspace } = this;

            if (!metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 40c9641100ff809ee85618b4e0424e25)`); }

            const resTagIbGibs: TagIbGib_V1[] = await metaspace.getSpecialRel8dIbGibs({
                type: SpecialIbGibType.tags,
                rel8nName: TAG_REL8N_NAME,
                space: undefined, // default local user space right now
            });

            const tagNav = document.getElementById(ID_TAG_NAV) as HTMLElement; // <nav> element
            // const tagNav = document.getElementById('tag-nav') as HTMLElement; // <nav> element
            if (!tagNav) { throw new Error(`(UNEXPECTED) tagNav (#tag-nav) falsy? (E: 49419cb0f317e02d95065ff5ac576525)`); }
            tagNav.innerHTML = '';
            const ul = document.createElement('ul');
            resTagIbGibs.forEach(tagIbGib => {
                const { ib, gib } = getIbAndGib({ ibGib: tagIbGib });
                const li = document.createElement('li');
                const anchor = document.createElement('a');
                anchor.href = `#/apps/${ROUTER_APP_NAME_TAGS}/${encodeURI(gib)}/${encodeURI(ib)}`;
                anchor.textContent = `${tagIbGib.data!.text}`;
                li.appendChild(anchor);
                ul.appendChild(li);
            });
            tagNav.appendChild(ul);

            // init the agents tag, if it doesn't exist already
            let _tagAgents =
                await getTag_Agents({ metaspace, space: undefined, createIfNone: true });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // /**
    //  * indicates the value of the last render time (`performance.now()`).
    //  *
    //  * should be in a base class? this is the type of state that is evidence for
    //  * the need for a separate renderable class hierarchy. they may be
    //  * tightly-coupled specialists or loosely/un-coupled generalists (like a
    //  * generic rect for any ibgib payload).
    //  */
    // // lastTime: number = 0;
    // /**
    //  * child renderables
    //  */
    // // renderables: Renderable[] = [];

    /**
   * overridden to do setup on new context ibgib.
   * this is where we should do things when the context ibgib is updated.
   * In my mind's eye, I foresee this happening when we do the equivalent of
   * a "restart app" type of command. I'm not sure of other requirements.
   *
   * I could comment this out (atow 12/2024)
   */
    protected async initializeContext({
        arg,
        contextIbGib,
        rel8nName,
    }: {
        arg?: WitnessArgIbGib<IbGib_V1, any, any>,
        contextIbGib?: IbGib_V1,
        rel8nName: string,
    }): Promise<void> {
        const lc = `${this.lc}[${this.initializeContext.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            await super.initializeContext({ arg, contextIbGib, rel8nName });

            // this context is analogous to a new "session", so we need to add
            // an index to the space that tracks this. Perhaps this could be a
            // root special ibgib? (this would be lazy on my part but hey)
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected initializeResizeObserver(): void {
        const resizeObserver = new ResizeObserver(entries => this.updateLayout(entries));
        resizeObserver.observe(document.body);
    }

    protected updateLayout(entries: ResizeObserverEntry[]): void {
        const lc = `${this.lc}[updateLayout]`;
        if (logalot) { console.log(`${lc} entries... (I: 489cb3b9dfd84caf8026317660b8eae9)`); }
        if (logalot) { console.dir(entries); }

        // if (!this.canvas) {
        //     console.warn(`${lc} this.canvas falsy (W: a61904ffb1e67066d88a00459e363a23)`);
        //     return; /* <<<< returns early */
        // }
    }

    protected async validateWitnessArg(arg: AppCmdIbGib): Promise<string[]> {
        const lc = `${this.lc}[${this.validateWitnessArg.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const errors = await super.validateWitnessArg(arg) ?? [];
            if (!this.metaspace) { throw new Error(`(unexpected) this.metaspace falsy. not initialized? (E: d8636847aa325fff2892621705b82923)`); }
            if ((arg.data as any).cmd) {
                // perform extra validation for cmds
                if ((arg.ibGibs ?? []).length === 0) {
                    errors.push(`ibGibs required. (E: a21da24eea0049128eeed253aae1218b)`);
                }
            }
            return errors;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async validateThis(): Promise<string[]> {
        const lc = `${this.lc}[${this.validateThis.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            const errors = [
                ...await super.validateThis(),
            ];
            const { data } = this;
            if (data) {
                if (!data.cmdEscapeString) {
                    errors.push('data.cmdEscapeString required (E: c18aac3fbdc44a90b090e1d77fac6378)');
                }
            }
            return errors;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}

export function isBlankCanvasCommandComment({
    ibGib,
    cmdEscapeString = DEFAULT_COMMAND_ESCAPE_STRING,
}: {
    ibGib: IbGib_V1,
    cmdEscapeString?: string,
}): boolean {
    const lc = `${isBlankCanvasCommandComment.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: d7c49619ffb7a9c26d9d74959b91ae22)`); }
        if (!isComment({ ibGib })) {
            return false; /* <<<< returns early */
        }
        let { ib } = ibGib;
        if (!ib) {
            throw new Error(`ib or ibGib.ib required (E: d92c26b15fc143977955a167b8b67522)`);
        }
        cmdEscapeString ||= DEFAULT_COMMAND_ESCAPE_STRING;

        let text = ibGib.data!.text!;
        // atow naively looks at start of text. todo: change this to either use a templating engine leveraging lex-gib or natural language processing ai

        // it's either a command that starts with a cmd escape string, or it starts with
        // the double-dash lines and the name is a boolean flag that is registered as one of
        // the command identifiers
        if (text.toLowerCase().startsWith(cmdEscapeString.toLowerCase())) {
            // yes command
            return true;
        } else if (text.startsWith('--')) {
            // maybe is a command...
            let firstArg = text.split(' ')[0].slice(2).toLowerCase(); // 2 to slice off -- prefix
            return RCLI_COMMAND_IDENTIFIERS.includes(firstArg);
        } else {
            // definitely not a command
            return false
        }
    }
    catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
    finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * factory for random app.
 *
 * @see {@link DynamicFormFactoryBase}
 */
export class BlankCanvasApp_V1_Factory
    extends DynamicFormFactoryBase<BlankCanvasAppData_V1, BlankCanvasAppRel8ns_V1, BlankCanvasApp_V1> {

    protected lc: string = `[${BlankCanvasApp_V1_Factory.name}]`;

    getName(): string { return BlankCanvasApp_V1.name; }

    async newUp({
        data,
        rel8ns,
    }: {
        data?: BlankCanvasAppData_V1,
        rel8ns?: BlankCanvasAppRel8ns_V1,
    }): Promise<TransformResult<BlankCanvasApp_V1>> {
        const lc = `${this.lc}[${this.newUp.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            data ??= clone(DEFAULT_BLANK_CANVAS_APP_DATA_V1);
            data = data!;
            rel8ns = rel8ns ?? DEFAULT_BLANK_CANVAS_APP_REL8NS_V1 ? clone(DEFAULT_BLANK_CANVAS_APP_REL8NS_V1) : undefined;
            data.uuid ||= await getUUID();
            let { classname } = data;

            const ib = getAppIb({ appData: data, classname });

            const resApp = await factory.firstGen({
                ib,
                parentIbGib: factory.primitive({ ib: `app ${classname}` }),
                data,
                rel8ns,
                dna: true,
                linkedRel8ns: [Rel8n.ancestor, Rel8n.past],
                nCounter: true,
                tjp: { timestamp: true },
            }) as TransformResult<BlankCanvasApp_V1>;

            // replace the newIbGib which is just ib,gib,data,rel8ns with loaded
            // witness class (that has the witness function on it)
            const appDto = resApp.newIbGib;
            let appIbGib = new BlankCanvasApp_V1(undefined, undefined);
            await appIbGib.loadIbGibDto(appDto);
            resApp.newIbGib = appIbGib;
            if (logalot) { console.log(`${lc} appDto: ${pretty(appDto)} (I: ef64d11af48148725913e2fb8c766fd9)`); }

            return resApp as TransformResult<BlankCanvasApp_V1>;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async witnessToForm({ witness }: { witness: BlankCanvasApp_V1; }): Promise<DynamicForm> {
        const lc = `${this.lc}[${this.witnessToForm.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting...`); }
            let { data } = witness;
            if (!data) { throw new Error(`(UNEXPECTED) witness.data falsy? (E: cc7eb55454585b16044879f207e719ea)`); }
            // We do the AppFormBuilder specific functions first, because of
            if (logalot) { console.log(`${lc} data: ${pretty(data)} (I: b2a0e79526d4dfcb9ae38261231b39cf)`); }
            const idPool = await getIdPool({ n: 100 });
            // type inference in TS! eesh...
            const form = new BlankCanvasAppFormBuilder()
                .with({ idPool })
                .name({ of: data.name, required: false, })
                .description({ of: data.description ?? DEFAULT_DESCRIPTION_BLANK_CANVAS_APP })
                .and<BlankCanvasAppFormBuilder>()
                .and<AppFormBuilder>()
                .icon({ iconsList: ['alert'], of: data.icon ?? 'alert', required: true })
                .and<DynamicFormBuilder>()
                .uuid({ of: data.uuid, required: true })
                .classname({ of: data.classname! })
                .and<WitnessFormBuilder>()
                .commonWitnessFields({ data })
                .outputForm({
                    formName: 'form',
                    label: 'blank-canvas',
                });
            return Promise.resolve(form);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    async formToWitness({ form }: { form: DynamicForm; }): Promise<TransformResult<BlankCanvasApp_V1>> {
        // let app = new BlankCanvasApp_V1(null, null);
        let data: BlankCanvasAppData_V1 = clone(DEFAULT_BLANK_CANVAS_APP_DATA_V1);
        this.patchDataFromItems({ data, items: form.items, pathDelimiter: DEFAULT_DATA_PATH_DELIMITER });
        let resApp = await this.newUp({ data });
        return resApp;
    }

}
