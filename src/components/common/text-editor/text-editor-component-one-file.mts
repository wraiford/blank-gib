import thisHtml from './text-editor.html';
import thisCss from './text-editor.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { delay, extractErrorMsg, getTimestamp, getTimestampInTicks, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { mut8Timeline } from "@ibgib/core-gib/dist/timeline/timeline-api.mjs";
import {
    getDeterministicColorInfo, getGlobalMetaspace_waitIfNeeded,
} from "@ibgib/web-gib/dist/helpers.mjs";
import {
    IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase,
    IbGibDynamicComponentInstanceBase_ParentOfTabs,
} from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, ChildInfoBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts,
} from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { getComponentSvc } from "@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs";
import { getColorStrings, } from "@ibgib/web-gib/dist/helpers.mjs";
import {
    alertUser, copyToClipboard, highlightElement, promptForText,
    shadowRoot_getElementById,
} from "@ibgib/web-gib/dist/helpers.web.mjs";
import { askForPersistStorage, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import { tellUserFunctionInfo } from "@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs";
import { helloWorldFunctionInfo } from "@ibgib/web-gib/dist/api/commands/chat/hello-world.mjs";
import { storageGet, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../../constants.mjs";
import { getComponentCtorArg, getIbGibGlobalThis_BlankGib, } from "../../../helpers.web.mjs";
import { debounce } from "../../../helpers.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_AVAILABLE_FUNCTIONS_TEXTEDITORAGENT = [
    tellUserFunctionInfo,
];

export const TEXTEDITOR_COMPONENT_NAME: string = 'ibgib-text-editor';

export class TextEditorComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${TextEditorComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(TEXTEDITOR_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = TEXTEDITOR_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, TextEditorComponentInstance);
    }

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
            const component = document.createElement(this.componentName) as TextEditorComponentInstance;
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

interface TextEditorElements {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement | undefined;
    nameEl: HTMLHeadingElement;
    versionEl: HTMLSpanElement;
    /**
     *
     */
    descEl: HTMLParagraphElement;
    /**
     * container element for the component
     */
    contentEl: HTMLElement;
    /**
     * where the text-editor is shown
     */
    editorEl: HTMLTextAreaElement;
    footerEl: HTMLElement;
    // addTextEditorBtnEl: HTMLElement | undefined;
}


export class TextEditorComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, TextEditorElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, TextEditorElements> {
    protected override lc: string = `[${TextEditorComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    busy: boolean = false;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initialize(opts);
            await this.loadIbGib({ getLatest: true });
            this.metaspace = await getGlobalMetaspace_waitIfNeeded();
            this.agentsInitialized = this.initAgents();
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

            // at this point, this.ibGib should be loaded with the latest ibgib
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: genuuid)`); }

            await this.initElements();
            await this.agentsInitialized;
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    override async handleContextUpdated(): Promise<void> {
        const lc = `${this.lc}[${this.handleContextUpdated.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.handleContextUpdated();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: genuuid)`); }

            // #region header

            const headerEl = shadowRoot.getElementById('text-editor-header') as HTMLElement;
            if (!headerEl) { throw new Error(`(UNEXPECTED) headerEl not found in shadowRoot? (E: genuuid)`); }

            const nameEl = shadowRoot.getElementById('text-editor-name') as HTMLHeadingElement;
            if (!nameEl) { throw new Error(`(UNEXPECTED) nameEl not found in shadowRoot? (E: genuuid)`); }
            const versionEl = shadowRoot.getElementById('text-editor-version') as HTMLHeadingElement;
            if (!versionEl) { throw new Error(`(UNEXPECTED) versionEl not found in shadowRoot? (E: genuuid)`); }
            const descEl = shadowRoot.getElementById('text-editor-description') as HTMLParagraphElement;
            if (!descEl) { throw new Error(`(UNEXPECTED) descEl not found in shadowRoot? (E: genuuid)`); }

            // #endregion header

            const contentEl = shadowRoot.getElementById('text-editor-content') as HTMLElement;
            if (!contentEl) { throw new Error(`(UNEXPECTED) contentEl not found in shadowRoot? (E: genuuid)`); }

            const editorEl = shadowRoot.getElementById('text-editor') as HTMLTextAreaElement;
            if (!editorEl) { throw new Error(`(UNEXPECTED) editorEl not found in shadowRoot? (E: genuuid)`); }

            const footerEl = shadowRoot.getElementById('text-editor-footer') as HTMLElement;
            if (!footerEl) { throw new Error(`(UNEXPECTED) footerEl not found in shadowRoot? (E: genuuid)`); }
            footerEl.style.display = 'none';
            // this.footerEl = footerEl as HTMLElement;

            this.elements = {
                headerEl,
                // headerTabsEl,
                contentEl,
                editorEl,
                footerEl,
                nameEl,
                versionEl,
                descEl,
            };

            await this.initTextEditor({ editorEl });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async initTextEditor({
        editorEl,
    }: {
        editorEl: HTMLTextAreaElement;
    }): Promise<void> {
        const lc = `${this.lc}[${this.initTextEditor.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e357a2aacec86dbed87087c2316a6325)`); }

            // const debouncedSave: ((content: string) => Promise<void>) | undefined = undefined;

            // Assuming you have a method like saveContent that handles saving the textarea content
            let saving = false;
            const saveContent = async (text: string) => {
                // Your save logic here (e.g., calling mut8Timeline to update the ibGib data)
                while (saving) {
                    console.warn(`${lc} already saving. waiting for previous save to finish.`);
                    await delay(100);
                }
                saving = true;
                this.busy = true;
                try {
                    if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy?? (E: b857c8b781184ca347b69fe820af7825)`); }
                    if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: 3f1bc222c2ad2e559ca15e0c8907b825)`); }
                    if (text === this.ibGib.data.text) {
                        console.log(`${lc} text unchanged. save unnecessary. (I: 20140db9a5538374f80a35e230fcd825)`);
                        return; /* <<<< returns early */
                    }
                    if (logalot) { console.log(`${lc}[${getTimestampInTicks()}] Saving content: ${text} (I: 60eb382b3078c40308a55f289d081825)`); }
                    if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: bbe5380b4198bedfe8a7a7e8d1b05f25)`); }
                    await mut8Timeline({
                        metaspace: this.metaspace,
                        mut8Opts: {
                            dataToAddOrPatch: {
                                text,
                                textTimestamp: getTimestamp(),
                            }
                        },
                        space: undefined,// ? where should the space reside? this editor component? the project? what about if we're editing an agent's internal space ibgib? or just some other ibgib? this forces us to only edit in the default local user space
                        timeline: this.ibGib,
                    });
                } catch (error) {
                    console.error(`${lc} ${extractErrorMsg(error)}`);
                    throw error;
                } finally {
                    saving = false;
                    this.busy = false;
                }
            };

            // Create the debounced version of the saveContent function
            // Debounce with a wait time of, say, 5 seconds
            const debouncedSave = debounce(saveContent, 5_000);

            // Add an event listener to the textarea
            editorEl.addEventListener('input', async (event) => {
                const target = event.target as HTMLTextAreaElement;
                this.busy = true;
                await this.renderUI_status();
                debouncedSave(target.value);
            });

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * rerender
     */
    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            await super.renderUI();

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl,
                contentEl,
                editorEl,
                footerEl,
                nameEl, versionEl, descEl,
            } = this.elements;

            nameEl.textContent = this.ibGib?.data?.name ?? '[ibGib no name?]'

            const description = this.ibGib?.data?.description;
            if (description) {
                descEl.textContent = description;
            } else {
                descEl.style.display = 'none';
            }

            // editorEl.innerHTML = '';
            if (this.ibGib) {
                if (!this.ibGib.data) { throw new Error(`(UNEXPECTED) this.ibGib.data falsy? (E: f65e38b3c0cbf66d5db5fd9a6b404125)`); }
                editorEl.textContent = this.ibGib.data.text ?? '';
            } else {
                console.warn(`${lc} this.ibGib falsy? skipping init text(W: genuuid)`)
            }
            await this.renderUI_status();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderUI_status(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI_status.name}]`;
        if (!this.elements) {
            console.warn(`${lc} this.elements falsy?returning early. (W: bce618e9c22184e16884835840fdf825)`);
            return; /* <<<< returns early */
        }
        const { versionEl } = this.elements;
        versionEl.textContent = this.busy ? `(...)` : `(v${this.ibGib?.data?.n ?? '?'})`
    }

    override async disconnected(): Promise<void> {
        const lc = `${this.lc}[${this.disconnected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async initAgents(): Promise<void> {
        const lc = `${this.lc}[${this.initAgents.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            await this.loadAgentsCoupledToIbGib();

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: genuuid)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * inits the chronology in the right panel for web1 components
     */
    private async initChronology(): Promise<void> {
        const lc = `${this.lc}[${this.initChronology.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const globalIbGib = getIbGibGlobalThis_BlankGib();
            let chronologysComponent = globalIbGib.chronologysComponent;

            let count = 0;
            while (!chronologysComponent) {
                console.warn(`${lc} global chronologysComponent is expected to be truthy by now. delaying (W: genuuid)`)
                count++;
                if (count > 100) {
                    debugger; // error in web1 component expectation
                    throw new Error(`(UNEXPECTED) global chronologysComponent is falsy? (E: genuuid)`);
                }
                await delay(100);
            }

            if (!this.ibGibProxy) { throw new Error(`(UNEXPECTED) this.ibGibProxy falsy? (E: genuuid)`); }
            // ibGibProxy.ibGib is a comment ibgib that is data.n=2. the 2 is
            // because it is already related to an agent.

            await chronologysComponent.openIbGibAddr({
                ibGibAddr: getIbGibAddr({ ibGib: this.ibGibProxy.ibGib }),
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getAPIKey(): Promise<string> {
        const fn = this.getFnGetAPIKey();
        return fn();
    }
    private getFnGetAPIKey(): () => Promise<string> {
        const lc = `${this.lc}[${this.getFnGetAPIKey.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const fn = async () => {
                let apiKey = await storageGet({
                    dbName: BLANK_GIB_DB_NAME, storeName: ARMY_STORE,
                    key: BEE_KEY,
                });
                return apiKey ?? '';
            };
            return fn;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
