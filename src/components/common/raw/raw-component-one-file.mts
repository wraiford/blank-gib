import thisHtml from './raw.html';
import thisCss from './raw.css';
import stylesCss from '../../../styles.css';
import projectCss from '../../projects/project/project.css';
import rootCss from '../../../root.css';

import { delay, extractErrorMsg, pretty, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { isPrimitive } from "@ibgib/ts-gib/dist/V1/index.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../../constants.mjs";
import {
    getGlobalMetaspace_waitIfNeeded, getIbGibGlobalThis_BlankGib,
    shadowRoot_getElementById,
} from "../../../helpers.web.mjs";
import { storageGet, } from "../../../storage/storage-helpers.web.mjs";
import { tellUserFunctionInfo } from "../../../api/commands/chat/tell-user.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "../../../ui/component/ibgib-dynamic-component-bases.mjs";
import { IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "../../../ui/component/component-types.mjs";
import { helloWorldFunctionInfo } from "../../../api/commands/chat/hello-world.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_RAWAGENT = 'rawagent';
export const CHAT_WITH_AGENT_PLACEHOLDER_RAWAGENT = '';
export const AGENT_AVAILABLE_FUNCTIONS_RAWAGENT = [
    helloWorldFunctionInfo,
    tellUserFunctionInfo,
];

export const RAW_COMPONENT_NAME: string = 'ibgib-raw';

export class RawComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${RawComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(RAW_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = RAW_COMPONENT_NAME;

    constructor() {
        super();
        customElements.define(this.componentName, RawComponentInstance);
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
            if (logalot) { console.log(`${lc} starting... (I: a997669f5cb8709578292be435166e25)`); }
            const component = document.createElement(this.componentName) as RawComponentInstance;
            await component.initialize({
                ibGibAddr,
                meta: this,
                html: thisHtml,
                css: [rootCss, stylesCss, projectCss, thisCss],
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

interface RawElements {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement | undefined;
    nameEl: HTMLHeadingElement;
    /**
     *
     */
    descEl: HTMLParagraphElement;
    /**
     * container element for the component
     */
    contentEl: HTMLElement;
    /**
     * where the raw json is shown
     */
    rawJsonEl: HTMLPreElement;
    rawJsonHeaderEl: HTMLHeadingElement;

    summaryContentEl: HTMLDivElement;
    summaryHeaderEl: HTMLHeadingElement;
    ibContentEl: HTMLDivElement;
    ibHeaderEl: HTMLHeadingElement;
    gibContentEl: HTMLDivElement;
    gibHeaderEl: HTMLHeadingElement;
    dataContentEl: HTMLPreElement;
    dataHeaderEl: HTMLHeadingElement;
    rel8nsContentEl: HTMLDivElement;
    rel8nsHeaderEl: HTMLHeadingElement;
    footerEl: HTMLElement;
    // addRawBtnEl: HTMLElement | undefined;
}


export class RawComponentInstance
    extends IbGibDynamicComponentInstanceBase<IbGib_V1, RawElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, RawElements> {
    protected override lc: string = `[${RawComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8ba1143239f8fc55943f1ead0ed19825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: 21d2f2d6d4bd1dffa4e3a978d0013825)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            // at this point, this.ibGib should be loaded with the latest ibgib
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: 0a6ef8dd4ed81c2c987b5a938df15825)`); }

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
            if (logalot) { console.log(`${lc} starting... (I: 8e5798d584b8b9336d206c5cd4f91825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: ac8018ce75480022f8f696a88d1ac825)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: 2c22482fa1cfff6eb82ff6e85f36e825)`); }

            // #region header

            const headerEl = shadowRoot_getElementById(shadowRoot, 'raw-header') as HTMLElement;
            if (!headerEl) { throw new Error(`(UNEXPECTED) headerEl not found in shadowRoot? (E: 67e6710545181685280cd7f8d721a825)`); }

            const nameEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'raw-name');
            const descEl = shadowRoot_getElementById<HTMLParagraphElement>(shadowRoot, 'raw-description');

            // #endregion header

            const contentEl = shadowRoot_getElementById(shadowRoot, 'raw-content');
            if (!contentEl) { throw new Error(`(UNEXPECTED) contentEl not found in shadowRoot? (E: 28a7a8081c6d09fe59bd30ca94f9d225)`); }


            // summaryContentEl: HTMLDivElement;
            // summaryHeaderEl: HTMLHeadingElement;
            const summaryContentEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'accordion-summary-content');
            const summaryHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-summary-header');
            const ibContentEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'accordion-ib-content');
            const ibHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-ib-header');
            const gibContentEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'accordion-gib-content');
            const gibHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-gib-header');
            const dataContentEl = shadowRoot_getElementById<HTMLPreElement>(shadowRoot, 'accordion-data-content');
            const dataHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-data-header');
            const rel8nsContentEl = shadowRoot_getElementById<HTMLDivElement>(shadowRoot, 'accordion-rel8ns-content');
            const rel8nsHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-rel8ns-header');
            const rawJsonEl = shadowRoot_getElementById<HTMLPreElement>(shadowRoot, 'raw-json');
            const rawJsonHeaderEl = shadowRoot_getElementById<HTMLHeadingElement>(shadowRoot, 'accordion-raw-json-header');

            [
                [summaryHeaderEl, summaryContentEl],
                [ibHeaderEl, ibContentEl],
                [gibHeaderEl, gibContentEl],
                [dataHeaderEl, dataContentEl],
                [rel8nsHeaderEl, rel8nsContentEl],
                [rawJsonHeaderEl, rawJsonEl],
            ].forEach((entry: any) => {
                const [headerEl, contentEl] = entry as [HTMLElement, HTMLElement];
                headerEl.addEventListener('click', (_event: any) => {
                    contentEl.classList.toggle('expanded');
                    // if (contentEl.style.display === 'flex') {
                    //     contentEl.style.display = 'none';
                    // } else {
                    //     contentEl.style.display = 'flex';
                    // }
                });
            });


            const footerEl = shadowRoot_getElementById(shadowRoot, 'raw-footer');
            footerEl.style.display = 'none';
            // this.footerEl = footerEl as HTMLElement;

            this.elements = {
                headerEl,
                // headerTabsEl,
                contentEl,
                summaryContentEl, ibContentEl, gibContentEl, dataContentEl, rel8nsContentEl, rawJsonEl,
                summaryHeaderEl, ibHeaderEl, gibHeaderEl, dataHeaderEl, rel8nsHeaderEl, rawJsonHeaderEl,
                footerEl,
                nameEl,
                descEl,
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
    protected override async renderUI(): Promise<void> {
        const lc = `${this.lc}[${this.renderUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: d494833e5fdf2f093d3168bfe0311c25)`); }

            await super.renderUI();

            if (!this.ibGib) {
                console.error(`${lc} this.ibGib falsy? (E: 870c08ece4882245422c3921b43d0825)`)
                return; /* <<<< returns early */
            }

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: bb8368d991181d65c8a8e288725ebf25)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl,
                contentEl,
                summaryContentEl,
                ibContentEl, gibContentEl, dataContentEl, rel8nsContentEl,
                rawJsonEl,
                footerEl,
                nameEl, descEl,
            } = this.elements;

            nameEl.textContent = this.ibGib?.data?.name ?? this.ibGib?.ib;
            nameEl.textContent += ` (v${this.ibGib?.data?.n ?? '?'})`

            const description = this.ibGib?.data?.description;
            if (description) {
                descEl.textContent = description;
            } else {
                descEl.style.display = 'none';
            }


            summaryContentEl.innerHTML = '';
            const summaryUlEl = document.createElement('ul');
            const fnAddLi = (label: string, value: string) => {
                const liLabelEl = document.createElement('li');
                liLabelEl.textContent = `${label}: `;
                liLabelEl.style.fontWeight = 'bold';
                liLabelEl.style.listStyle = 'none';
                const liValueEl = document.createElement('li');
                liValueEl.textContent = value;
                liValueEl.style.marginLeft = '1em';
                liValueEl.style.fontWeight = '100';
                liLabelEl.appendChild(liValueEl);
                summaryUlEl.appendChild(liLabelEl);
            };
            fnAddLi('addr', this.ibGibAddr);
            fnAddLi('TJP addr', getTjpAddr({ ibGib: this.ibGib!, defaultIfNone: "incomingAddr" })!);
            const { data } = this.ibGib;
            if (data) {
                if (data.name) { fnAddLi("name", data.name); }
                if (data.description) { fnAddLi("description", data.description); }
                if (data.text) { fnAddLi("text", data.text); }
                if (data.textTimestamp) { fnAddLi("textTimestamp", data.textTimestamp); }
                if (data.timestamp) { fnAddLi("timestamp", data.timestamp) }
                if (data.timestampMs) { fnAddLi("timestampMs", data.timestampMs.toString()); }
                if (data.type) { fnAddLi("type", data.type) }
            }
            summaryContentEl.appendChild(summaryUlEl);


            ibContentEl.innerHTML = '';
            ibContentEl.textContent = this.ibGib?.ib ?? '';
            gibContentEl.innerHTML = '';
            gibContentEl.textContent = this.ibGib?.gib ?? '';
            dataContentEl.innerHTML = '';
            dataContentEl.textContent = this.ibGib?.data ? pretty(this.ibGib.data) : 'undefined';

            rel8nsContentEl.innerHTML = '';
            if (this.ibGib?.rel8ns) {
                const rel8nsSubAccordion = document.createElement('section');
                rel8nsSubAccordion.classList.add('accordion');
                rel8nsContentEl.appendChild(rel8nsSubAccordion);
                for (const rel8nName in this.ibGib.rel8ns) {
                    const rel8nNameSection = document.createElement('section');
                    rel8nNameSection.classList.add('accordion-section');
                    rel8nsSubAccordion.appendChild(rel8nNameSection);

                    const headerEl = document.createElement('h3');
                    headerEl.classList.add('accordion-header');
                    headerEl.textContent = rel8nName;
                    headerEl.addEventListener('click', (_event: any) => {
                        contentEl.classList.toggle('expanded');
                    });
                    rel8nNameSection.appendChild(headerEl);
                    const contentEl = document.createElement('div');
                    contentEl.classList.add('accordion-content');
                    rel8nNameSection.appendChild(contentEl);

                    const ulRel8dsEl = document.createElement('ul');
                    contentEl.appendChild(ulRel8dsEl);

                    this.ibGib.rel8ns[rel8nName]?.forEach(rel8dAddr => {
                        const liRel8dEl = document.createElement('li');
                        if (isPrimitive({ gib: getIbAndGib({ ibGibAddr: rel8dAddr }).gib })) {
                            // just add text, no need for a link
                            liRel8dEl.textContent = rel8dAddr;
                        } else {
                            // non-primitives get a link that can be opened as a
                            // tab in the project window
                            const addrEl = document.createElement('a');
                            addrEl.style.cursor = 'pointer';
                            addrEl.textContent = rel8dAddr;
                            addrEl.addEventListener('click', async (_event: Event) => {
                                _event.stopPropagation();
                                _event.preventDefault();
                                await getIbGibGlobalThis_BlankGib()
                                    .projectsComponent!
                                    .activeProjectTabInfo!
                                    .component!
                                    .activateIbGib({
                                        addr: rel8dAddr,
                                    });
                            });
                            liRel8dEl.appendChild(addrEl);
                        }
                        ulRel8dsEl.appendChild(liRel8dEl);
                    });
                }

                // const rel8nsUlEl = document.createElement('ul');
                // rel8nsContentEl.appendChild(rel8nsUlEl);
                // for (const rel8nName in this.ibGib.rel8ns) {
                //     const liEl = document.createElement('li');
                //     liEl.textContent = rel8nName;
                //     const ulRel8dsEl = document.createElement('ul');
                //     liEl.appendChild(ulRel8dsEl);
                //     this.ibGib.rel8ns[rel8nName]?.forEach(rel8dAddr => {
                //         const liRel8dEl = document.createElement('li');
                //         const addrEl = document.createElement('a');
                //         addrEl.style.cursor = 'pointer';
                //         addrEl.textContent = rel8dAddr;
                //         addrEl.addEventListener('click', async (_event: any) => {
                //             // TODO: navigate to the raw component for this rel8dAddr
                //             await getIbGibGlobalThis_BlankGib().projectsComponent!.activeProjectTabInfo!.component!.activateIbGib({
                //                 addr: rel8dAddr,
                //             });
                //         });
                //         liRel8dEl.appendChild(addrEl);
                //         ulRel8dsEl.appendChild(liRel8dEl);
                //     });
                //     rel8nsUlEl.appendChild(liEl);
                // }
            } else {
                rel8nsContentEl.textContent = 'undefined';
            }




            rawJsonEl.innerHTML = '';
            rawJsonEl.textContent = pretty(this.ibGib);
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
            if (logalot) { console.log(`${lc} starting... (I: 72d05cd42cf81ebf1a29051a290f7825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: 8f8081efdd78f10018ab5fa702e24725)`); }

            await this.loadAgentsCoupledToIbGib({ dontThrowIfNone: true });

            // if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: 37b04a4faae783e0b8d973d8956d2825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: 84f8e1a3e8a4ac1dc8d24244fb583f25)`); }

            const globalIbGib = getIbGibGlobalThis_BlankGib();
            let chronologysComponent = globalIbGib.chronologysComponent;

            let count = 0;
            while (!chronologysComponent) {
                console.warn(`${lc} global chronologysComponent is expected to be truthy by now. delaying (W: f5d8a2abb3c8015cd740da78e14fa725)`)
                count++;
                if (count > 100) {
                    debugger; // error in web1 component expectation
                    throw new Error(`(UNEXPECTED) global chronologysComponent is falsy? (E: cc1848e6910886ef1cc0ea536897d425)`);
                }
                await delay(100);
            }

            if (!this.ibGibProxy) { throw new Error(`(UNEXPECTED) this.ibGibProxy falsy? (E: 4546c939a8b835ede8d82e28effaa825)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: 80a71d5cb578b0f01f14c9a2ee67cd25)`); }

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
