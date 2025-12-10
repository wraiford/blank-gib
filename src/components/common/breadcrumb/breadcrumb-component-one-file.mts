import thisHtml from './breadcrumb.html';
import breadcrumbCss from './breadcrumb.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts, } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../../constants.mjs";
import { BreadcrumbInfo } from "./breadcrumb-types.mjs";
import { getComponentCtorArg } from '../../../helpers.web.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export const BREADCRUMB_COMPONENT_NAME: string = 'ibgib-breadcrumb';

export class BreadcrumbComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${BreadcrumbComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(BREADCRUMB_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = BREADCRUMB_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, BreadcrumbComponentInstance);
    }

    /**
     * for a breadcrumb, we don't have any additional info in the path.
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
            const component = document.createElement(this.componentName) as BreadcrumbComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: thisHtml,
                css: [rootCss, stylesCss, breadcrumbCss],
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

interface BreadcrumbElements {
    componentEl: HTMLElement;
    itemEls: HTMLElement[];
}

export class BreadcrumbComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, BreadcrumbElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, BreadcrumbElements> {
    protected override lc: string = `[${BreadcrumbComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    breadcrumbs: BreadcrumbInfo[] = [];

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            await super.initialize(opts);

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
            if (logalot) { console.log(`${lc} starting... (I: 98c5bd4e6796961b7672cb3258e4da25)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: genuuid)`); }

            const componentEl = shadowRoot.getElementById('breadcrumb-component') as HTMLElement;
            if (!componentEl) { throw new Error(`(UNEXPECTED) componentEl not found in shadowRoot? (E: genuuid)`); }


            this.elements = {
                componentEl,
                itemEls: [],
            };
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
    protected async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 5415ec9be03ca640cb1a3d6a17d22625)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: 48b0f7d56fda65b40a57a11a8557ef25)`); }
            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: genuuid)`);
                return; /* <<<< returns early */
            }

            const { componentEl, } = this.elements;

            // render buttons here and hook them up
            componentEl.innerHTML = '';

            for (let i = 0; i < this.breadcrumbs.length; i++) {
                const breadcrumb = this.breadcrumbs[i];
                const delim = document.createElement('span');
                delim.textContent = '>';
                componentEl.appendChild(delim);

                // most breadcrumbs are navigable, but the last one is supposed
                // to be our current location (so we can't nav via the current
                // breadcrumb)
                if (i < (this.breadcrumbs.length - 1) && !!breadcrumb.fnClickAction) {
                    const link = document.createElement('a');
                    link.textContent = breadcrumb.text;
                    componentEl.appendChild(link);
                    link.addEventListener('click', async (e) => {
                        await this.execNav({ breadcrumb, breadcrumbIndex: i });
                    });
                } else {
                    const text = document.createElement('span');
                    text.textContent = breadcrumb.text;
                    componentEl.appendChild(text);
                }
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    private async execNav({
        breadcrumb,
        breadcrumbIndex,
    }: {
        breadcrumb: BreadcrumbInfo,
        breadcrumbIndex: number,
    }): Promise<void> {
        const lc = `${this.lc}[${this.execNav.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: f5cb2b0797ed11f0ef21e3ada0b02225)`); }

            if (breadcrumb.fnClickAction) {
                // clear any downstream breadcrumbs
                for (let i = breadcrumbIndex + 1; i < this.breadcrumbs.length; i++) {
                    this.breadcrumbs.pop();
                }

                // update the breadcrumb UI first because it should be quick and
                // the action might take awhile
                await this.renderUI();

                // execute it
                await breadcrumb.fnClickAction();
            } else {
                console.warn(`${lc} executing nav but fnClickAction is falsy? (W: f36c438110be36a11494d5e4d3c56625)`);
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
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // #region public api

    public async addBreadcrumb({
        info,
        clear,
    }: {
        info: BreadcrumbInfo,
        clear?: boolean,
    }): Promise<void> {
        const lc = `${this.lc}[${this.addBreadcrumb.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 705301d430c4f65b18e005e3020c7825)`); }

            if (clear) { this.breadcrumbs = []; }

            // do the business
            this.breadcrumbs.push(info);

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
