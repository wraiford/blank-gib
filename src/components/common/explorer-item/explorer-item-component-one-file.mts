import thisHtml from './explorer-item.html';
import thisCss from './explorer-item.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { tellUserFunctionInfo } from '@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs';
import { helloWorldFunctionInfo } from '@ibgib/web-gib/dist/api/commands/chat/hello-world.mjs';
import { alertUser, highlightElement, promptForConfirm, promptForText, shadowRoot_getElementById, } from "@ibgib/web-gib/dist/helpers.web.mjs";
import { getGlobalMetaspace_waitIfNeeded, } from "@ibgib/web-gib/dist/helpers.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { ElementsBase, IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts, } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";

import {
    GLOBAL_LOG_A_LOT,
    // ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../../constants.mjs";
import { getPath } from "../../../ui/router/router-one-file.mjs";
import { getComponentCtorArg } from '../../../helpers.web.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_EXPLORERITEMAGENT = 'exploreritemagent';
export const CHAT_WITH_AGENT_PLACEHOLDER_EXPLORERITEMAGENT = '';
export const AGENT_AVAILABLE_FUNCTIONS_EXPLORERITEMAGENT = [
    helloWorldFunctionInfo,
    tellUserFunctionInfo,
];

export const EXPLORERITEM_COMPONENT_NAME: string = 'ibgib-explorer-item';

export class ExplorerItemComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ExplorerItemComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(EXPLORERITEM_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = EXPLORERITEM_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, ExplorerItemComponentInstance);
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
            const component = document.createElement(this.componentName) as ExplorerItemComponentInstance;
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

interface ExplorerItemElements {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement | undefined;
    nameEl: HTMLElement;
    /**
     * container element for the component
     */
    contentEl: HTMLElement;
    footerEl: HTMLElement;
}


export class ExplorerItemComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, ExplorerItemElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, ExplorerItemElements> {
    protected override lc: string = `[${ExplorerItemComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    linkEl: HTMLElement | undefined;

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

            const headerEl = shadowRoot_getElementById(shadowRoot, 'explorer-item-header') as HTMLElement;

            // #endregion header

            const contentEl = shadowRoot_getElementById(shadowRoot, 'explorer-item-content');
            const nameEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'explorer-item-name');

            const footerEl = shadowRoot_getElementById(shadowRoot, 'explorer-item-footer');
            footerEl.style.display = 'none';

            this.elements = {
                headerEl,
                contentEl,
                footerEl,
                nameEl,
            };

            // click anywhere on this component should go to the link (atow anyway 07/2025)
            shadowRoot.addEventListener('click', async (e: Event) => {
                if (e.target && !(e.target instanceof HTMLAnchorElement)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    if (this.linkEl) { this.linkEl.click(); }
                }
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

            if (!this.ibGib) {
                console.error(`${lc} this.ibGib falsy? (E: genuuid)`)
                return; /* <<<< returns early */
            }
            if (!this.ibGib.data) {
                console.error(`${lc} this.ibGib.data falsy? (E: genuuid)`)
                return; /* <<<< returns early */
            }
            const { ibGib } = this;
            const { ib, gib, data } = this.ibGib;
            if (!gib) { throw new Error(`(UNEXPECTED) gib falsy? (E: fc04c25e0f59a98fb8b7832c92b1fc25)`); }

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl,
                contentEl,
                footerEl,
                nameEl,
            } = this.elements;

            // prepare the name element (container)
            nameEl.innerHTML = '';

            // build up the data for the name
            const name = data.name ?? ibGib.ib;
            const maxLength = 16;
            const shortenedName = name.length > maxLength ?
                name.substring(0, maxLength).concat('…') :
                name;
            const labelText = `${shortenedName} (v${data.n ?? '?'})`;
            const title = [
                name,
                `version: ${data.n ?? '?'}`,
                data.description ?? '[no description]',
                `id: ${data.uuid ?? '[no uuid]'}`
            ].join('\n');

            // build a link to the item...this is hard-coding
            const link = document.createElement('a');
            this.linkEl = link;
            link.href = getPath({
                ibGibRouteInfo: {
                    base: 'apps',
                    appName: 'projects',
                    ib,
                    gib,
                }
            });
            link.textContent = labelText;
            link.title = title;

            // add the link to the name container
            nameEl.appendChild(link);

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

            // do nothing

            await this.loadAgentsCoupledToIbGib({ dontThrowIfNone: true });

            // if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: genuuid)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
