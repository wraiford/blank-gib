import thisHtml from './input.html';
import thisCss from './input.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { delay, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr, TransformResult } from "@ibgib/ts-gib/dist/types.mjs";
import { ROOT } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { CommentIbGib_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";
import { createCommentIbGib } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
import { appendToTimeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
import { getDeterministicColorInfo, getGlobalMetaspace_waitIfNeeded, } from "@ibgib/web-gib/dist/helpers.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts, } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { getAddlMetadataTextForAgentText } from '@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs';
import { storageGet, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import { promptForAPIKey, updateAPIKeyInStorage } from '@ibgib/web-gib/dist/helpers.web.mjs';

import { GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME, } from "../../../constants.mjs";
import { InputInfo } from "./input-types.mjs";
import { CHAT_WITH_AGENT_NEED_API_KEY } from '../../../witness/app/blank-canvas/blank-canvas-constants.mjs';
import { getComponentCtorArg } from '../../../helpers.web.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export const INPUT_COMPONENT_NAME: string = 'ibgib-input';

export class InputComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${InputComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(INPUT_COMPONENT_NAME);

    componentName: string = INPUT_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, InputComponentInstance);
    }

    /**
     * for a input, we don't have any additional info in the path.
     */
    async createInstance({
        path,
        ibGibAddr
    }: {
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            const component = document.createElement(this.componentName) as InputComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: thisHtml,
                css: [rootCss, stylesCss, thisCss],
            });
            return component;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
}

interface InputElements {
    componentEl: HTMLElement;
    inputTextEl: HTMLTextAreaElement;
    inputSendBtnEl: HTMLButtonElement;
}

const DEFAULT_INPUT_INFO: InputInfo = {

}

export class InputComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, InputElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, InputElements> {
    protected override lc: string = `[${InputComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    inputInfo: InputInfo = DEFAULT_INPUT_INFO;

    private _apiKey: string = '';
    private _submitting = false;
    private _queuedSubmitTexts: string[] = [];

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initialize(opts);

            this.metaspace = await getGlobalMetaspace_waitIfNeeded();
            // await this.loadIbGib();
            // await super.subscribeToIbGibUpdates();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async created(): Promise<void> {
        const lc = `${this.lc}[${this.created.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            await this.initUI();

            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initUI(): Promise<void> {
        const lc = `${this.lc}[${this.initUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: genuuid)`); }

            const componentEl = shadowRoot.getElementById('input-component') as HTMLElement;
            if (!componentEl) { throw new Error(`(UNEXPECTED) componentEl not found in shadowRoot? (E: genuuid)`); }

            const inputTextEl = shadowRoot.getElementById('input-text') as HTMLTextAreaElement;
            if (!inputTextEl) { throw new Error(`(UNEXPECTED) inputTextEl not found in shadowRoot? (E: genuuid)`); }

            const inputSendBtnEl = shadowRoot.getElementById('input-send-btn') as HTMLButtonElement;
            if (!inputSendBtnEl) { throw new Error(`(UNEXPECTED) inputSendBtnEl not found in shadowRoot? (E: genuuid)`); }

            this.elements = {
                componentEl,
                inputTextEl,
                inputSendBtnEl,
            };

            // inputSendBtnEl.addEventListener('click', this.handleSubmit);
            inputSendBtnEl.addEventListener('click', async () => {
                await this.handleSubmit();
            });

            inputTextEl.addEventListener('keydown', async (event) => {
                if (event.key === 'Enter' && event.ctrlKey === true) {
                    event.preventDefault(); // Prevent default behavior (new line)
                    await this.handleSubmit();
                }
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async handleKeydown(event: any): Promise<void> {
    }

    /**
     * rerender
     */
    protected async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: genuuid)`); }
            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }

            // const color = getDeterministicColorInfo({
            //     ibGib: this.inputInfo.contextProxyIbGib?.ibGib,
            // });
            // this.style.setProperty('--ibgib-border-color', color);
            const {
                punctiliarColor,
                punctiliarColorTranslucent,
                tjpColor,
                tjpColorTranslucent,
                errorMsg
            } = getDeterministicColorInfo({
                ibGib: this.inputInfo.contextProxyIbGib?.ibGib,
                translucentAlpha: 10
            });
            if (!errorMsg) {
                this.style.setProperty('--ibgib-color', punctiliarColor);
                this.style.setProperty('--ibgib-color-translucent', punctiliarColor);
                this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
            } else {
                // don't set anything
                console.error(`${lc} ${errorMsg} (E: 65e0d330d029c1fe39f3d6280dda3725)`);
            }

            const {
                componentEl,
                inputSendBtnEl,
                inputTextEl,
            } = this.elements;

            const { agent, contextProxyIbGib } = this.inputInfo;

            if (agent || contextProxyIbGib?.ibGib) {
                inputTextEl.ariaPlaceholder = this.inputInfo.placeholderText ?? '';
                inputTextEl.placeholder = this.inputInfo.placeholderText ?? '';
                inputTextEl.removeAttribute('readonly');
                // inputTextEl.readOnly = false;
                // inputTextEl.ariaReadOnly = false.toString();
            } else {
                inputTextEl.ariaPlaceholder = 'loading...';
                inputTextEl.placeholder = 'loading...';
                inputTextEl.textContent = '';
                inputTextEl.setAttribute('readonly', 'true');
                // inputTextEl.readOnly = true;
                // inputTextEl.ariaReadOnly = true.toString();
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            // no action atow

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3768c106edf32adc8eedee1b5adc6625)`); }

            // unhook events...necessary?
            // const { inputSendBtnEl, inputTextEl } = this.elements;
            // inputSendBtnEl.removeEventListener('click', this.handleSubmit);
            // inputTextEl.removeEventListener('keydown', this.handleKeydown);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * adds a comment to the current context ibgib.
     *
     * todo: also submit pic(s)
     */
    private async handleSubmit(): Promise<void> {
        const lc = `${this.lc}[${this.handleSubmit.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 6e5d020950ab3c161c3b023772af1a25)`); }

            // #region init & validation

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: genuuid)`); }
            const { inputTextEl, } = this.elements;
            // const inputText = inputTextEl.textContent?.trim() ?? '';
            const inputText = inputTextEl.value?.trim() ?? '';
            if (!inputText) {
                console.warn(`${lc} no text to submit. returning early. (W: genuuid)`);
                return; /* <<<< returns early */
            }
            inputTextEl.value = '';
            const { agent, contextProxyIbGib, spaceId, } = this.inputInfo;
            if (!contextProxyIbGib && !agent) { throw new Error(`(UNEXPECTED) both contextProxyIbGib AND agent falsy? (E: bb4cb430269b64e07a532e5ae2df5c25)`); }
            const { metaspace } = this;
            if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: 18b602faa9b1a52edef603480fa5ce25)`); }

            // #endregion init & validation
            if (!this._apiKey) {
                this._apiKey = await storageGet({
                    dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                    key: BEE_KEY,
                }) ?? '';
            }
            if (!this._apiKey) {
                await this.doPromptForAPIKey();
                // this reloads if they enter the API key. If they don't enter
                // it, then we just leave it there until they submit again and
                // are prompted again. so return early. not the best but not the
                // worst workflow
                return; /* <<<< returns early */
            }

            // first determine if we're already submitting.
            this._queuedSubmitTexts.push(inputText);
            if (this._submitting) {
                console.warn(`${lc} already submitting. queueing text. (W: genuuid)`);
                this._queuedSubmitTexts.push(inputText);
                return; /* <<<< returns early */
            }

            const space = await metaspace.getLocalUserSpace({
                localSpaceId: spaceId, lock: false
            });
            if (contextProxyIbGib) {
                if (!contextProxyIbGib.ibGib) {
                    throw new Error(`(UNEXPECTED) contextProxyIbGib truthy but contextProxyIbGib.ibGib falsy? (E: c52bdfa29268be0fb968f16940723525)`);
                }
                this._submitting = true;
                do {
                    const text = this._queuedSubmitTexts.shift();
                    if (!text) { continue; }

                    // create the comment ibgib
                    /** atow (04/2025) adds a timestampInTicks and textSrc */
                    const addlMetadataText = getAddlMetadataTextForAgentText({
                        textSrc: 'human',
                    });
                    const resCreateComment: TransformResult<CommentIbGib_V1> =
                        await createCommentIbGib({
                            text,
                            addlMetadataText,
                            saveInSpace: true,
                            space,
                        });
                    const commentIbGib = resCreateComment.newIbGib;
                    await metaspace.registerNewIbGib({ ibGib: commentIbGib, space, });

                    // rel8 to our current context
                    await appendToTimeline({
                        timeline: contextProxyIbGib.ibGib,
                        metaspace,
                        rel8nInfos: [{ rel8nName: 'comment', ibGibs: [commentIbGib], }],
                        space,
                    });

                } while (this._queuedSubmitTexts.length > 0);
            } else {
                // submitting to agent
                if (!agent) { throw new Error(`(UNEXPECTED) agent falsy? at this point should be logically guaranteed? (E: 94b982c0bbeb133a52c2bee537404f25)`); }
                await this.handleSubmit_toAgent({
                    texts: this._queuedSubmitTexts.concat(),
                });
                this._queuedSubmitTexts = [];
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
            this._submitting = false;
        }
    }

    private async handleSubmit_toAgent({
        texts,
    }: {
        texts: string[];
    }): Promise<void> {
        const lc = `[${this.handleSubmit_toAgent.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const { agent, } = this.inputInfo;

            // first ensure our best to see if we have an api key already

            const fnSubmitToAgent = async () => {
                try {
                    // Add to the primary agent's chat
                    if (!agent) { throw new Error(`agent falsy. (E: genuuid)`); }
                    if (logalot) { console.log(`Adding to agent chat: ${pretty(texts)} (I: genuuid)`); }
                    await agent.addTexts({
                        infos: texts.map(text => {
                            return {
                                textSrc: 'human',
                                text,
                                isSystem: text.startsWith('system: ')
                            };
                        }),
                        // infos: [{
                        //     textSrc: 'human',
                        //     text,
                        //     isSystem: text.startsWith('system: ') }
                        // ],
                    });
                    // for (const text of texts) {
                    //     await addToChatLogKluge({
                    //         text,
                    //         who: 'user',
                    //         chatLog: undefined, // primary chat log for now...
                    //         scrollAfter: true,
                    //     });
                    // }
                    const _ = await agent.witness(ROOT);
                } catch (error) {
                    console.error(`error adding chat to agent (E: genuuid): ${extractErrorMsg(error)}`);
                }
            };

            // if we have an apikey, submit the chat. else we'll have to
            // do some work to get the user to enter an api key (and
            // fund us!)
            if (this._apiKey) {
                await fnSubmitToAgent();
            } else {
                await this.doPromptForAPIKey();
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * ## notes
     * changed this to "do" function name because I'm refactoring to an external
     * function {@link promptForAPIKey}
     */
    private async doPromptForAPIKey(): Promise<void> {
        const lc = `${this.lc}[${this.doPromptForAPIKey.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b475d2686686ac016f0ea48ab51ef325)`); }

            let resAPIKey = await promptForAPIKey({
                msg: CHAT_WITH_AGENT_NEED_API_KEY,
            });
            if (resAPIKey === undefined) {
                console.log(`${lc} user cancelled entering API key. (I: genuuid)`);
                return; /* <<<< returns early */
            }
            this._apiKey = resAPIKey;
            if (this._apiKey) {
                await updateAPIKeyInStorage({
                    dbName: BLANK_GIB_DB_NAME,
                    storeName: ARMY_STORE,
                    key: BEE_KEY,
                    apiKey: this._apiKey,
                    force: false
                });
            } else {
                // clear it out b/c empty string?
                // await updateAPIKeyInStorage({ apiKey: this._apiKey, force: true }); // clears it if empty string
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region public api

    public async setContextInfo({
        info,
    }: {
        info: InputInfo,
    }): Promise<void> {
        const lc = `${this.lc}[${this.setContextInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            // edge case: don't want to change context in the middle of submitting.
            while (this._submitting) {
                if (logalot) { console.log(`${lc} still submitting. don't want to change context in the middle of submitting. (I: d14b2bb9704945be991db24903bf3625)`); }
                await delay(50);
            }

            this.inputInfo = info;

            // init agent to subscribe to events in the context?

            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #endregion public api
}
