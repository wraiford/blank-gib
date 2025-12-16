import thisHtml from "./chronology.html";
import thisCss from "./chronology.css";
import stylesCss from "../../../styles.css";
import rootCss from "../../../root.css";

import { delay, extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { getTimestampInfo } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
import { IbGibAddr, } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { isComment, parseCommentIb } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
import { tellUserFunctionInfo } from "@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs";
import { getGlobalMetaspace_waitIfNeeded } from "@ibgib/web-gib/dist/helpers.mjs";
import { IbGibDynamicComponentInstanceBase, IbGibDynamicComponentMetaBase } from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import { IbGibDynamicComponentInstance, IbGibDynamicComponentInstanceInitOpts } from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { parseAddlMetadataTextForAgentText, } from "@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs";
import { AgentWitnessAny, } from "@ibgib/web-gib/dist/witness/agent/agent-one-file.mjs";
import { TextSource } from "@ibgib/web-gib/dist/witness/agent/agent-constants.mjs";
import { ProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-types.mjs";
import { getAgentsSvc } from "@ibgib/web-gib/dist/witness/agent/agents-service-v1.mjs";
import { AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT } from '@ibgib/web-gib/dist/witness/agent/agent-constants.mjs';

import { GLOBAL_LOG_A_LOT, } from "../../../constants.mjs";
import { getComponentCtorArg, getIbGibGlobalThis_BlankGib, } from "../../../helpers.web.mjs";
import { ID_PRIMARY_AGENT_CHAT_LOG } from "../../../ui/shell/shell-constants.mjs";
import {
    AGENT_GOAL_COMMON, AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF,
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
} from "../../../agent-texts/common-agent-texts.mjs";
import { simpleIbGibRouterSingleton } from "../../../ui/router/router-one-file.mjs";
import { isMinigameIbGib_V1 } from "../../../common/minigame/minigame-helper.mjs";
import { MinigameIbGib_V1 } from "../../../common/minigame/minigame-types.mjs";
import { ProjectComponentInstance } from "../../projects/project/project-component-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_CHRONOLOGYAGENT = 'chronologyagent';
export const AGENT_GOAL_CHRONOLOGYAGENT = [
    AGENT_GOAL_COMMON,
    `You yourself are a "chronology" agent. Your job is to help show the chronology of an ibgib.`,
    `A "chronology" is just a synonym for "timeline" in our case right now. I use the word "timeline" generally when speaking about ibgibs and I wanted a different word in code. But semantically, the "chronology" is meant to give some condensed view of an ibgib's evolution.`,
    `The use case right now is to show the equivalent of what others call "chats". A "chat" in their sense is a linear sequence of some context that has text, and possibly pics and other artifacts, added to it over time. In ibgib, since we create a hypergraph, the timeline aspect is a little more complicated. The context ibgib itself may add "child" items, and so may those child items effectively ad infinitum. This is truly parallel computing.`,
    `So a chronology is some view on what could be a complicated timeline.`,
    `Keep in mind though that we're still early dev stage so you may not be able to do much at the moment.`,
].join('\n');

export const AGENT_INITIAL_SYSTEM_TEXT_CHRONOLOGYAGENT = [
    AGENT_SYSTEM_PROMPT_COMMON_INSTRUCTIONS,
    AGENT_GOAL_CHRONOLOGYAGENT,
].join('\n');
export const AGENT_INITIAL_CHAT_TEXT_CHRONOLOGYAGENT = [
    AGENT_INITIAL_CHAT_HI_PLEASEINTRO_YOURSELF,
].join('\n');
export const CHAT_WITH_AGENT_PLACEHOLDER_CHRONOLOGYAGENT = '';
export const AGENT_AVAILABLE_FUNCTIONS_CHRONOLOGYAGENT = [
    tellUserFunctionInfo,
];

export const CHRONOLOGY_COMPONENT_NAME: string = 'ibgib-chronology';


export class ChronologyComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ChronologyComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     */
    routeRegExp?: RegExp = new RegExp(CHRONOLOGY_COMPONENT_NAME);
    // routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

    componentName: string = CHRONOLOGY_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, ChronologyComponentInstance);
    }

    /**
     * for a chronology, we don't have any additional info in the path.
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
            if (logalot) { console.log(`${lc} starting... (I: 19ed38829f8693c83889ff3d151b4e25)`); }
            const component = document.createElement(this.componentName) as ChronologyComponentInstance;
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

interface ChronologyElements {
    headerEl: HTMLElement;
    // headerTabsEl: HTMLElement | undefined;
    textEl: HTMLHeadingElement;
    /**
     *
     */
    descEl: HTMLParagraphElement;
    /**
     * container element for the chronologys component
     */
    contentEl: HTMLElement;
    footerEl: HTMLElement;
    // inputEl: HTMLTextAreaElement;
}

export class ChronologyComponentInstance
    extends IbGibDynamicComponentInstanceBase<ProjectIbGib_V1, ChronologyElements>
    implements IbGibDynamicComponentInstance<IbGib_V1, ChronologyElements> {
    protected override lc: string = `[${ChronologyComponentInstance.name}]`;

    metaspace: MetaspaceService | undefined;

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4764f8b8d8a801a008e85328752f7825)`); }
            await super.initialize(opts);
            await this.loadIbGib();
            this.agentsInitialized = this.initAgents();

            await this.agentsInitialized; // Wait for metaspace to be initialized
            // await this.eoadChildIbGibs();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async loadChildIbGibs(): Promise<void> {
        const lc = `${this.lc}[${this.loadChildIbGibs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: beb5c41d17a52fcb53511f97c8301625)`); }

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) metaspace should have been initialized. (E: 3a4c4876a0904b499f09112674b8a925)`) }
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 77428a4a60f81a1a9e9d17d041e39125)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: e9802057b36b692985b7e32633e20525)`); }
            const { contentEl } = this.elements;
            contentEl.innerHTML = ''; //clear the content

            const excludeRel8nNames: string[] = [
                'ancestor', 'dna', 'past', 'tjp',
            ];
            // const rel8nNames = ['comment', 'pic', 'minigame'];
            if (!this.ibGib.rel8ns) { throw new Error(`(UNEXPECTED) this.ibGib.rel8ns falsy? (E: 5c530af755a37f89ac51810b61dc2d25)`); }
            const rel8nNames = Object.keys(this.ibGib.rel8ns).filter(x => !excludeRel8nNames.includes(x));
            const childAddrs: IbGibAddr[] = [];
            for (const rel8nName of rel8nNames) {
                const rel8dAddrs = this.ibGib.rel8ns[rel8nName] ?? [];
                childAddrs.push(...rel8dAddrs);
            }

            const childIbGibs: IbGib_V1[] = [];
            for (const childAddr of childAddrs) {
                const resGet = await this.metaspace.get({ addr: childAddr });
                if (resGet.errorMsg) { throw new Error(`Could not retrieve ibGib: ${resGet.errorMsg} (E: 5c77a680328c49e085557e7a7c20b425)`) }
                if (!resGet.ibGibs || resGet.ibGibs.length === 0) { throw new Error(`Could not retrieve ibGib: No IbGibs returned from metaspace. (E: 4e657a262a784b339873976b3288d125)`); }
                childIbGibs.push(resGet.ibGibs[0])
            }

            childIbGibs.sort((a, b) => {
                const aRes = getTimestampInfo({ ibGib: a });
                if (!aRes.valid) { throw new Error(`(UNEXPECTED) invalid a timestamp: ${aRes.emsg} (E: 81a4c81e25e65a971922626f0a08a825)`); }
                const aTicks = Number.parseInt(aRes.ticks);
                const bRes = getTimestampInfo({ ibGib: b });
                if (!bRes.valid) { throw new Error(`(UNEXPECTED) invalid b timestamp: ${bRes.emsg} (E: 41813b26a8c92d4c8a293e426d202f25)`); }
                const bTicks = Number.parseInt(bRes.ticks);
                if (aTicks < bTicks) {
                    return -1;
                } else if (aTicks > bTicks) {
                    return 1;
                } else {
                    return 0;
                }
            });

            // childIbGibs.sort((a, b) => {
            //     const aTicks = getTimestampInfo({ ib: a.ib }).timestampTicks;
            //     const bTicks = getTimestampInfo({ ib: b.ib }).timestampTicks;
            //     return aTicks > b.ib ? 1 : -1;
            // });

            for (const childIbGib of childIbGibs) {
                let errored = false;
                try {
                    const itemElement = await this.renderIbGibItem({ ibGib: childIbGib });
                    contentEl.appendChild(itemElement)
                } catch (error) {
                    console.error(`${lc} Error rendering ibGib: ${extractErrorMsg(error)} (E: b2a7592d1a5743d6b4e7b9241561e325)`);
                    errored = true;
                }
                if (errored) {
                    try {
                        const itemElement = await this.renderIbGibItem_fallback({ ibGib: childIbGib });
                        contentEl.appendChild(itemElement)
                    } catch (error) {
                        console.error(`${lc} Error rendering ibGib during fallback?: ${extractErrorMsg(error)} (E: 7d37888dc85e37141877eb786dbaaf25)`);
                        errored = true;
                    }
                }
            }
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
            if (logalot) { console.log(`${lc} starting... (I: 95d9e84448669a0db81410c810e83b25)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;

            // at this point, this.ibGib should be loaded with the latest
            // project ibgib

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? It is assumed at this point that we have a valid ibGib to work with. (E: 15af5db05175b88a629e52a335625b25)`); }

            await this.initElements();

            /**
             * for the moment, we're just re-using the primary agent's chat log...eesh!!
             *
             * This is obviously the wrong thing to do in the long run...
             */
            const primaryAgentChatLog =
                document.getElementById(ID_PRIMARY_AGENT_CHAT_LOG) as HTMLDivElement;
            if (!primaryAgentChatLog) { throw new Error(`(UNEXPECTED) primaryAgentChatLog not found in document? (E: fe663fd60a5820040d5bacb845ed1825)`); }

            await this.agentsInitialized;
            await this.loadChildIbGibs();
            await this.renderUI();

            setTimeout(() => {
                if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3a1c7d612aeadee515218cca2ad0c225)`); }
                const { contentEl } = this.elements;
                if (contentEl.lastElementChild) {
                    contentEl.lastElementChild.scrollIntoView({ behavior: 'smooth' });
                }
            }, 1000);
            // await this.agent!.witness(ROOT); // not the responsibility of the chronology component to initiate prompt
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
            if (logalot) { console.log(`${lc} starting... (I: 1cec5212626b1700aa09c2e3d6966225)`); }
            console.log(`${lc} this.ibGib: ${pretty(this.ibGib)}`)
            await super.handleContextUpdated();
            await this.renderUI();
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * renders a single ibgib into the chronology content element
     */
    private async renderIbGibItem({
        ibGib,
    }: {
        ibGib: IbGib_V1;
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.renderIbGibItem.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: d59d1e05b804665e8ee9bc28d56ec825)`); }

            let resEl: HTMLElement;
            if (isComment({ ibGib })) {
                resEl = await this.renderIbGibItem_comment({ ibGib });
            } else if (isMinigameIbGib_V1(ibGib)) {
                resEl = await this.renderIbGibItem_minigame({ ibGib });
            } else {
                resEl = await this.renderIbGibItem_fallback({ ibGib });
            }
            return resEl;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderIbGibItem_comment({
        ibGib,
    }: {
        ibGib: IbGib_V1;
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.renderIbGibItem_comment.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2948f102f3a6d51d35b26a9339113325)`); }
            if (!ibGib.data) { throw new Error(`(UNEXPECTED) childIbGib.data falsy? (E: a1c4e1a657f764c98e7f919663058325)`); }

            let text = ibGib.data.text;

            if (!text) { throw new Error(`childIbGib.data.text falsy? what kind of child are we tracking at this point? we only do comments. ${pretty(ibGib)} (E: 0e5e2e1c7b5c692f295979a03c617625)`); }

            const ib = ibGib.ib;
            // what is the

            const { safeIbCommentMetadataText } = parseCommentIb({ ib });
            let textSrc: TextSource;
            try {
                const resParse = parseAddlMetadataTextForAgentText({
                    addlMetadataText: safeIbCommentMetadataText ?? '',
                    ifError: 'ignore',
                });
                textSrc = resParse.textSrc;
            } catch (error) {
                textSrc = 'unknown';
            }

            let who: string;
            switch (textSrc) {
                case 'ai':
                    who = 'agent'; break;
                case 'human':
                    who = 'user'; break;
                case 'hardcoded':
                    who = 'code'; break;
                case 'function':
                    who = 'func'; break;
                default:
                    who = '[who?]';
            }
            const timestampInfo = getTimestampInfo({ ibGib });
            if (!timestampInfo.valid) {
                throw new Error(`(UNEXPECTED) invalid timestamp: ${timestampInfo.emsg} (E: 42643858345b58538f09a71287a19f25)`);
            }
            const date = timestampInfo.date;
            const timestampString = date.toLocaleString(); // Use toLocaleString for a more readable format
            const timestampParagraph = document.createElement('p');
            timestampParagraph.textContent = timestampString;
            timestampParagraph.classList.add('timestamp');
            if (who === 'agent') {
                who = 'An AI agent (🤖)';
            } else {
                who = 'A human';
            }
            timestampParagraph.title = `${who} created this message ${timestampString}`;

            const chatEntry = document.createElement('section');
            const identityInfoDiv = document.createElement('div');
            identityInfoDiv.classList.add('identity-info');
            const identityInfoP = document.createElement('p');
            if (textSrc === 'ai') {
                // right now we're encoding it in "other" agent text addl
                // metadata.  see tell-user.mts tellUserImpl and
                // agent-helpers.mts getAddlMetadataTextForAgentText.
                const agentName = safeIbCommentMetadataText?.split('_').at(2) ?? 'Agent';
                identityInfoP.textContent = `🤖 ${agentName}`;
                chatEntry.classList.add('agent-message');
            } else if (textSrc === 'human') {
                chatEntry.classList.add('human-message');
                identityInfoP.textContent = `user`;
            }
            identityInfoDiv.appendChild(identityInfoP);
            chatEntry.appendChild(identityInfoDiv)

            const textContentDiv = document.createElement('div');
            const textParagraphs: string[] = text.split('\n');
            textParagraphs.forEach(textParagraph => {
                const pElement = document.createElement('p');
                pElement.textContent = textParagraph;
                textContentDiv.appendChild(pElement);
            });

            const copyButton = document.createElement('button');
            copyButton.textContent = '🗐';
            copyButton.classList.add('copy-button');
            copyButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                navigator.clipboard.writeText(text);
                const feedbackSpan = document.createElement('span');
                feedbackSpan.textContent = "Copied!";
                feedbackSpan.classList.add('copied-feedback');
                feedbackSpan.style.position = 'absolute';
                feedbackSpan.style.bottom = '30px';
                feedbackSpan.style.left = '20px';
                chatEntry.appendChild(feedbackSpan);
                await delay(100);
                chatEntry.classList.add('copied-animation');
                chatEntry.classList.add('highlight');
                await delay(500);
                chatEntry.classList.remove('copied-animation');
                await delay(400);
                chatEntry.classList.remove('highlight');
                await delay(1000);
                feedbackSpan.remove();
            });

            chatEntry.dataset.clicked = "false";
            chatEntry.addEventListener('click', () => {
                const clicked = chatEntry.dataset.clicked;
                chatEntry.dataset.clicked = clicked === "true" ? "false" : "true";
                if (chatEntry.dataset.clicked === "true") {
                    chatEntry.classList.add('show-details');
                } else {
                    chatEntry.classList.remove('show-details');
                }
            });

            chatEntry.addEventListener('mouseover', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.add('show-details');
                }
            });

            chatEntry.addEventListener('mouseout', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.remove('show-details');
                }
            });
            chatEntry.appendChild(copyButton);

            chatEntry.appendChild(textContentDiv);
            chatEntry.appendChild(timestampParagraph);

            return chatEntry;


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderIbGibItem_minigame({
        ibGib,
    }: {
        ibGib: MinigameIbGib_V1;
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.renderIbGibItem_minigame.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? This is expected to be a minigame ibgib. (E: 5fe49d9c7bd87fb2284fad28f4916925)`); }

            const chatEntry = document.createElement('section');

            // identity
            // const identityInfoDiv = document.createElement('div');
            // identityInfoDiv.classList.add('identity-info');
            // const identityInfoP = document.createElement('p');
            // chatEntry.classList.add('code-message');
            // identityInfoP.textContent = `identityhere`;
            // identityInfoDiv.appendChild(identityInfoP);

            // body
            const textContentDiv = document.createElement('div');
            const pElement = document.createElement('p');
            const name = ibGib.data.name;
            const iElement = document.createElement('i');
            iElement.style.fontSize = 'small';
            iElement.textContent = `${ibGib.data.name || '[no name?]'} minigame added.`;
            pElement.appendChild(iElement);
            textContentDiv.appendChild(pElement);

            // timestamp footer
            const timestampInfo = getTimestampInfo({ ibGib });
            if (!timestampInfo.valid) {
                throw new Error(`(UNEXPECTED) invalid timestamp: ${timestampInfo.emsg} (E: genuuid)`);
            }
            const date = timestampInfo.date;
            const timestampString = date.toLocaleString(); // Use toLocaleString for a more readable format
            const timestampParagraph = document.createElement('p');
            timestampParagraph.textContent = timestampString;
            timestampParagraph.classList.add('timestamp');
            timestampParagraph.title = `This ibgib message was created ${timestampString}`;
            chatEntry.dataset.clicked = "false";
            chatEntry.addEventListener('click', () => {
                const clicked = chatEntry.dataset.clicked;
                chatEntry.dataset.clicked = clicked === "true" ? "false" : "true";
                if (chatEntry.dataset.clicked === "true") {
                    chatEntry.classList.add('show-details');
                } else {
                    chatEntry.classList.remove('show-details');
                }
            });
            chatEntry.addEventListener('mouseover', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.add('show-details');
                }
            });
            chatEntry.addEventListener('mouseout', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.remove('show-details');
                }
            });

            // compose the chatEntry itself
            // chatEntry.appendChild(identityInfoDiv)
            chatEntry.appendChild(textContentDiv);
            chatEntry.appendChild(timestampParagraph);

            // when clicking the chatEntry, should activate the ibgib on the
            // projects component

            chatEntry.addEventListener('click', async () => {
                const globalBlankGib = getIbGibGlobalThis_BlankGib();
                if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: 5c0e3e92ea2dcdb1f1e8eaa828ad5825)`); }
                const projectsComponent = globalBlankGib.projectsComponent;
                if (!projectsComponent) { throw new Error(`(UNEXPECTED) globalBlankGib.projectsComponent falsy? (E: 27ec3b3738872869d80064381cebe825)`); }
                if (!projectsComponent.activeProjectTabInfo) {
                    throw new Error(`(UNEXPECTED) projectsComponent.activeProjectTabInfo falsy? (E: a9d3de3612f858f818eb1eb85f0c7825)`);
                }
                const projectComponent = projectsComponent.activeProjectTabInfo.component as ProjectComponentInstance;
                if (!projectComponent) { throw new Error(`(UNEXPECTED) projectComponent falsy? projectsComponent.activeProjectTabInfo.component is expected to be truthy at this point. (E: 66cc452486787f8b881a20b35333ac25)`); }
                await projectComponent.activateIbGib({ ibGib });
            });

            return chatEntry;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async renderIbGibItem_fallback({
        ibGib,
    }: {
        ibGib: IbGib_V1;
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.renderIbGibItem_fallback.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

            const chatEntry = document.createElement('section');

            // identity
            // const identityInfoDiv = document.createElement('div');
            // identityInfoDiv.classList.add('identity-info');
            // const identityInfoP = document.createElement('p');
            // chatEntry.classList.add('code-message');
            // identityInfoP.textContent = `identityhere`;
            // identityInfoDiv.appendChild(identityInfoP);

            // body
            const textContentDiv = document.createElement('div');
            const pElement = document.createElement('p');
            pElement.textContent = getIbGibAddr({ ibGib });
            textContentDiv.appendChild(pElement);

            // timestamp footer
            const timestampInfo = getTimestampInfo({ ibGib });
            if (!timestampInfo.valid) {
                throw new Error(`(UNEXPECTED) invalid timestamp: ${timestampInfo.emsg} (E: genuuid)`);
            }
            const date = timestampInfo.date;
            const timestampString = date.toLocaleString(); // Use toLocaleString for a more readable format
            const timestampParagraph = document.createElement('p');
            timestampParagraph.textContent = timestampString;
            timestampParagraph.classList.add('timestamp');
            timestampParagraph.title = `This ibgib message was created ${timestampString}`;
            chatEntry.dataset.clicked = "false";
            chatEntry.addEventListener('click', () => {
                const clicked = chatEntry.dataset.clicked;
                chatEntry.dataset.clicked = clicked === "true" ? "false" : "true";
                if (chatEntry.dataset.clicked === "true") {
                    chatEntry.classList.add('show-details');
                } else {
                    chatEntry.classList.remove('show-details');
                }
            });
            chatEntry.addEventListener('mouseover', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.add('show-details');
                }
            });
            chatEntry.addEventListener('mouseout', () => {
                if (chatEntry.dataset.clicked !== "true") {
                    chatEntry.classList.remove('show-details');
                }
            });

            // compose the chatEntry itself
            // chatEntry.appendChild(identityInfoDiv)
            chatEntry.appendChild(textContentDiv);
            chatEntry.appendChild(timestampParagraph);

            return chatEntry;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }
    /**
     * right now, in witnesswith context base, these children are hard-coded as
     * pic/comment/link rel8ns. need to change core-gib to make this a property
     * on the class that drives which rel8nNames to track for new context
     * children.
     */
    protected override async handleNewContextChild({
        childIbGib
    }: {
        childIbGib: IbGib_V1;
    }): Promise<void> {
        const lc = `${this.lc}[${this.handleNewContextChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 118ee1579105ab6bae507272041e4925)`); }

            // for starters, we'll just add a new item for the child, since it's
            // just a simple "chat log" right now.

            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3a1c7d612aeadee515218cca2ad0c225)`); }
            const { contentEl } = this.elements;

            const chatEntry = await this.renderIbGibItem({ ibGib: childIbGib });
            contentEl.appendChild(chatEntry);
            chatEntry.scrollIntoView({ behavior: 'smooth' });

            // super.handleNewContextChild
            // let animation happen. we are not expecting a lot of messages to just come
            // pouring in. If that becomes the case, then we need to reduce/remove this
            // delay.
            await delay(500);
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
            if (logalot) { console.log(`${lc} starting... (I: 98c5bd4e6796961b7672cb3258e4da25)`); }

            const shadowRoot = this.shadowRoot;

            if (!shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot falsy? (E: 2669d84403e65a091850a118cc1e8e25)`); }

            // #region header

            const headerEl = shadowRoot.getElementById('chronology-header') as HTMLElement;
            if (!headerEl) { throw new Error(`(UNEXPECTED) headerEl not found in shadowRoot? (E: 12ba48a30b586c7268577f8a76c0b825)`); }

            const textEl = shadowRoot.getElementById('chronology-text') as HTMLHeadingElement;
            if (!textEl) { throw new Error(`(UNEXPECTED) textEl not found in shadowRoot? (E: c0c11d642bc26eb224a714740f6c7225)`); }
            const descEl = shadowRoot.getElementById('chronology-description') as HTMLParagraphElement;
            if (!descEl) { throw new Error(`(UNEXPECTED) descEl not found in shadowRoot? (E: 8b82a81eb058ee783553b1888c1b3325)`); }

            // #endregion header

            const contentEl = shadowRoot.getElementById('chronology-content') as HTMLElement;
            if (!contentEl) { throw new Error(`(UNEXPECTED) contentEl not found in shadowRoot? (E: aa90dd17107658d79d8e346f99085a25)`); }

            const footerEl = shadowRoot.getElementById('chronology-footer') as HTMLElement;
            if (!footerEl) { throw new Error(`(UNEXPECTED) footerEl not found in shadowRoot? (E: 5a4b78703d0e0547f8d8eab86d67d825)`); }
            footerEl.style.display = 'none';
            // this.footerEl = footerEl as HTMLElement;

            this.elements = {
                headerEl,
                // headerTabsEl,
                contentEl,
                footerEl,
                textEl,
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
            if (logalot) { console.log(`${lc} starting... (I: 5415ec9be03ca640cb1a3d6a17d22625)`); }

            await super.renderUI();

            if (!this.elements) {
                console.warn(`${lc} (UNEXPECTED) tried to render but haven't initialized elements? (W: 2b9f6893b449d7a72861c148ec428925)`);
                return; /* <<<< returns early */
            }

            const {
                headerEl, contentEl, footerEl,
                // tabBtnEl,
                // inputEl,
                textEl, descEl,
            } = this.elements;

            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: a2e31a4cfcd763a5c6e5133919aa0725)`); }



            // if (this.ibGib.ib.startsWith('comment --interactive')) {
            if (simpleIbGibRouterSingleton.isCurrentPageWeb1) {
                // the current hack is that we set the chronology's context to
                // the initial comment ibgib that we hacked to bootstrap the web
                // app. in the future, we just need a better mechanism for web1
                // chronology, which may just be an entirely separate app for
                // web1 and projects/dev
                if (logalot) { console.warn(`${lc} web1 chronologys tab btn title hack. (W: bc3ed81fdd48f351580c2f7b035e6825)`); }
                textEl.style.display = 'none';
                descEl.style.display = 'none';
            } else {
                // we are in a regular project/other ibgib
                textEl.textContent = this.ibGib?.data?.name ?? '[no name?]'
                textEl.textContent += ` (v${this.ibGib?.data?.n ?? '?'})`
                const description = this.ibGib?.data?.description;
                if (description) {
                    descEl.textContent = description;
                } else {
                    descEl.style.display = 'none';
                }
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
            if (logalot) { console.log(`${lc} starting... (I: 8e0719f027b8e25dc836b4a8adbf2925)`); }
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
            if (logalot) { console.log(`${lc} starting... (I: a16821cfe4d8dce0483ec60879005425)`); }

            const metaspace = await getGlobalMetaspace_waitIfNeeded();
            this.metaspace = metaspace;
            if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: f09cc2b636e83410bd7a89ec954e3825)`); }

            // do {
            if (simpleIbGibRouterSingleton.isCurrentPageWeb1) {
                let agent: AgentWitnessAny | undefined = undefined;
                const agentsSvc = getAgentsSvc();
                do {
                    let agents = await agentsSvc.getAgents({
                        metaspace,
                        type: AGENT_SPECIAL_IBGIB_TYPE_PRIMARYAGENT,
                        spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
                    });
                    if (agents.length > 0) {
                        agent = agents.at(0)!;
                    } else {
                        await delay(200);
                    }
                } while (!agent);
                this.agents = [agent];
            } else {
                await this.loadAgentsCoupledToIbGib();
            }
            if (!this.agent) {
                // do we care
                console.error(`(UNEXPECTED) this.agent falsy after load agents? (E: 7ab4a8a82c48c3161ab20f3c6f624b25)`);
                // throw new Error(`(UNEXPECTED) this.agent falsy after load agents? (E: 7ab4a8a82c48c3161ab20f3c6f624b25)`);
            }
            //     if (!this.agent) {
            //         if (logalot) { console.log(`${lc} no agents related to project? delaying and trying again... (I: 1a3acf5c8083b7f23bc665eec8256e25)`); }
            //         await delay(100)
            //     }
            // } while (!this.agent)
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
