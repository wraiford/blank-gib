import thisHtml from './projects.html';
import thisCss from './projects.css';
import stylesCss from '../../styles.css';
import rootCss from '../../root.css';

import {
    clone, delay, extractErrorMsg, getSaferSubstring, pickRandom_Letters,
} from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { getIbAndGib, getIbGibAddr } from "@ibgib/ts-gib/dist/helper.mjs";
import { getGibInfo, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { MetaspaceService } from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { IbGibTimelineUpdateInfo } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
import { getTjpAddr } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";
import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";
import { CommentIbGib_V1 } from "@ibgib/core-gib/dist/common/comment/comment-types.mjs";
import { isComment } from "@ibgib/core-gib/dist/common/comment/comment-helper.mjs";
import { tellUserFunctionInfo } from "@ibgib/web-gib/dist/api/commands/chat/tell-user.mjs";
import {
    getDeterministicColorInfo, getGlobalMetaspace_waitIfNeeded,
} from "@ibgib/web-gib/dist/helpers.mjs";
import {
    IbGibDynamicComponentMetaBase,
    IbGibDynamicComponentInstanceBase_ParentOfTabs,
} from "@ibgib/web-gib/dist/ui/component/ibgib-dynamic-component-bases.mjs";
import {
    ElementsBase, ChildInfoBase, IbGibDynamicComponentInstance,
    IbGibDynamicComponentInstanceInitOpts,
} from "@ibgib/web-gib/dist/ui/component/component-types.mjs";
import { storageGet, } from "@ibgib/web-gib/dist/storage/storage-helpers.web.mjs";
import { getComponentSvc } from "@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs";
import { getColorStrings, } from "@ibgib/web-gib/dist/helpers.mjs";
import {
    alertUser, copyToClipboard, highlightElement, promptForText,
    shadowRoot_getElementById,
} from "@ibgib/web-gib/dist/helpers.web.mjs";
import {
    getAgentForDomainIbGib, getAgents, registerDomainIbGibWithAgentIndex
} from "@ibgib/web-gib/dist/witness/agent/agent-helpers.mjs";
import { AgentWitnessAny, } from "@ibgib/web-gib/dist/witness/agent/agent-one-file.mjs";
import { GEMINI_DEFAULT_MODEL_STR, } from "@ibgib/web-gib/dist/witness/agent/gemini/gemini-constants.mjs";
import { getAgentsSvc } from "@ibgib/web-gib/dist/witness/agent/agents-service-v1.mjs";
import { createProjectIbGib, isProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-helper.mjs";
import { DEFAULT_PROJECT_DESCRIPTION, ProjectIbGib_V1 } from "@ibgib/web-gib/dist/common/project/project-types.mjs";
import { IbGibSettings, SettingsWithTabs } from "@ibgib/web-gib/dist/common/settings/settings-types.mjs";
import { SettingsType } from "@ibgib/web-gib/dist/common/settings/settings-constants.mjs";
import {
    AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT, PROJECT_NAME_REGEXP,
} from "@ibgib/web-gib/dist/common/project/project-constants.mjs";

import {
    GLOBAL_LOG_A_LOT, ARMY_STORE, BEE_KEY, BLANK_GIB_DB_NAME,
} from "../../constants.mjs";
import { getComponentCtorArg, getIbGibGlobalThis_BlankGib, } from "../../helpers.web.mjs";
import {
    AGENT_INITIAL_CHAT_TEXT_PROJECTAGENT,
    AGENT_INITIAL_SYSTEM_TEXT_PROJECTAGENT,
    AGENT_SPECIAL_IBGIB_TYPE_PROJECTAGENT,
    CHAT_WITH_AGENT_PLACEHOLDER_PROJECTAGENT,
} from "../../agent-texts/project-agent-texts.mjs";
import {
    PROJECT_COMPONENT_NAME, ProjectComponentInstance,
} from "./project/project-component-one-file.mjs";
import { getAppShellSvc } from "../../ui/shell/app-shell-service.mjs";
import { simpleIbGibRouterSingleton } from "../../ui/router/router-one-file.mjs";
import {
    AGENT_INITIAL_CHAT_TEXT_PROJECTSAGENT,
    AGENT_INITIAL_SYSTEM_TEXT_PROJECTSAGENT
} from "../../agent-texts/projects-agent-texts.mjs";

const logalot = GLOBAL_LOG_A_LOT;

export const AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT = 'projectsagent';
export const AGENT_AVAILABLE_FUNCTIONS_PROJECTSAGENT = [
    tellUserFunctionInfo,
    // ...RenderAgentFunctionInfos,
];

export const PROJECTS_COMPONENT_NAME: string = 'ibgib-projects';

export class ProjectsComponentMeta extends IbGibDynamicComponentMetaBase {
    protected override lc: string = `[${ProjectsComponentMeta.name}]`;

    /**
     * temporary regexp path for our initial dev. this component will become
     * attached to actual ib^gib addrs
     *
     *
     * either the path is
     *   * /apps/projects/gib/projects
     *   * /apps/projects/ABC123.456DEF/project%20my-project%201744553032000
     *
     * The point is that it's either a bland projects^gib to indicate create a
     * new project or it's a valid gib and a valid project ib. lazy regexp here
     */
    routeRegExp?: RegExp = /apps\/projects\/(gib|.*)\/(projects|project \/.*\/.*)?/;

    componentName: string = PROJECTS_COMPONENT_NAME;

    constructor() {
        super(getComponentCtorArg());
        customElements.define(this.componentName, ProjectsComponentInstance);
    }

    async createInstance({
        path,
        ibGibAddr
    }: {
        /**
         * todo: store this in the instance (i think) but will change this when needed
         */
        path: string;
        ibGibAddr: IbGibAddr;
    }): Promise<IbGibDynamicComponentInstance> {
        const lc = `${this.lc}[${this.createInstance.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 65da57b67d533197f95d26aca2f03c25)`); }
            const component = document.createElement(this.componentName) as ProjectsComponentInstance;
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

/**
 * helper interface for managing tabs and their associated ibgibs
 */
interface ProjectTabInfo extends ChildInfoBase<ProjectComponentInstance> {
    // tabBtnEl: HTMLElement;
    // addr: IbGibAddr;
    /**
     * access the ibGib via this component.
     *
     * This component wraps an ibgib proxy that automatically stays up-to-date
     * when new ibgib frames are added to the ibgib's timeline and published to
     * the metaspace. (via metaspace.registerNewIbGib)
     */
    // projectComponent?: ProjectComponentInstance;
    // agent?: AgentWitnessAny;
    // active: boolean;
}

interface ProjectsElements extends ElementsBase {
    headerEl: HTMLElement;
    headerTabsEl: HTMLElement;
    footerEl: HTMLElement;
    addBtnEl: HTMLButtonElement;
    ellipsisBtnEl: HTMLElement;
    ellipsisPopoverEl: HTMLElement;
}

export class ProjectsComponentInstance
    extends IbGibDynamicComponentInstanceBase_ParentOfTabs<IbGibSettings & SettingsWithTabs, IbGib_V1, ProjectsElements, ProjectTabInfo>
    implements IbGibDynamicComponentInstance<IbGib_V1, ProjectsElements> {

    protected override lc: string = `[${ProjectsComponentInstance.name}]`;

    // projectTabInfos: ProjectTabInfo[] = [];
    get activeProjectTabInfo(): ProjectTabInfo | undefined {
        return this.childInfos.find(x => x.active);
    }

    metaspace: MetaspaceService | undefined;

    protected get settingsType(): SettingsType {
        return SettingsType.projects;
    }

    constructor() {
        super();
    }

    override async initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void> {
        const lc = `${this.lc}[${this.initialize.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: aec41edb278ffac62f77c757f8595725)`); }
            // before any initialization, we want to ensure we are bootstrapped
            // await getIbGibGlobalThis_BlankGib().bootstrapPromise; // this is in the super call now

            if (!this.metaspace) {
                // wait for the metaspace to be initialized
                this.metaspace = await getGlobalMetaspace_waitIfNeeded({ delayIntervalMs: 50 });
            }

            opts.ibGibAddr = await this.metaspace.getLatestAddr({ addr: opts.ibGibAddr }) ?? opts.ibGibAddr;

            await super.initialize(opts);
            await this.setBreadcrumbs();
            this.agentsInitialized = this.initAgents(); // spins off

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
            if (logalot) { console.log(`${lc} starting... (I: 4e3e670ab00fc2dad9c2912e6344d425)`); }

            // const { meta, htmlPath, scriptPaths, cssPaths } = opts;
            // does nothing atow
            await this.initElements();
            if (!this.elements) { throw new Error(`(UNEXPECTED) just initElements but this.elements falsy? (E: 931b47d386e41c3b8d58d67ad0ec4825)`); }

            const { } = this.elements;

            await this.agentsInitialized;

            const { gib } = getIbAndGib({ ibGibAddr: this.ibGibAddr });

            if (isPrimitive({ gib })) {
                if (logalot) { console.log(`${lc} ibGibAddr has primitive gib, so returning early. (I: c68201caad350aa385bf6b6bf58ee525)`); }
                return; /* <<<< returns early */
            }

            // await this.activateProject({ projectAddr: this.ibGibAddr, });
            this.activateIbGib({ addr: this.ibGibAddr, }); // spin off, because super.activateIbGib awaits this created promise

            const globalBlankGib = getIbGibGlobalThis_BlankGib();
            globalBlankGib.projectsComponent = this;
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
            if (logalot) { console.log(`${lc} starting... (I: d85a47973e435e5476265dbcfeba9c25)`); }
            // no action atow
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public async newProject({
        projectSpaceId,
        initialCommentText,
        srcIbGibAddr,
    }: {
        /**
         * @property projectSpaceId - id of the local space in which the project's
         * ibgib will be accessed.
         */
        projectSpaceId?: SpaceId;
        initialCommentText?: string;
        /**
         * @property srcIbGibAddr - Optional address of an existing ibGib (likely a
         * comment) to use as the initial source or context for the new project.
         */
        srcIbGibAddr?: IbGibAddr;
    }): Promise<ProjectIbGib_V1> {
        const lc = `${this.lc}[${this.newProject.name}]`;
        try {
            await this.disableNewProjectUI();

            // #region init/validate
            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: d0c5d3df962949420e641d9160b85625)`); }

            const space = await this.metaspace.getLocalUserSpace({ localSpaceId: projectSpaceId, lock: false });
            if (!space) { throw new Error(`couldn't get local user space (${projectSpaceId ?? '[default local user space]'}) from metaspace. (E: 1bc833e38cb231eedac30facf6d40325)`); }

            let srcCommentIbGib: CommentIbGib_V1 | undefined = undefined;
            if (srcIbGibAddr) {
                const resGetSrc = await this.metaspace.get({
                    addrs: [srcIbGibAddr],
                    space,
                });
                if (resGetSrc.errorMsg || resGetSrc.ibGibs?.length !== 1) {
                    throw new Error(`couldn't get srcIbGibAddr (${srcIbGibAddr}) from space (${space.ib}) (E: 0314d4c477e3aed3c75a4358625ee825)`);
                }
                srcCommentIbGib = resGetSrc.ibGibs![0] as CommentIbGib_V1;
                if (!isComment({ ibGib: srcCommentIbGib })) {
                    throw new Error(`srcIbGibAddr (${srcIbGibAddr}) is not a comment ibgib. (E: 2e68b8efcd11dd8428ee3d68bb6d7825)`);
                }
            }
            // #endregion init/validate

            let name: string = '';
            do {
                name = await promptForText({
                    title: 'project name?',
                    msg: [
                        `Name of the new project?`,
                        `(only alphanumerics, spaces, hyphens, underscores)`,
                        `If you leave this blank, a random "temporary" name will be used.`,
                    ].join('\n'),
                    cancelable: false, // should be cancelable, but we're going to interpret this as use a default name.
                    confirm: false,
                });
                if (name) {
                    // they've entered something truthy, so regexp test it
                    if (!PROJECT_NAME_REGEXP.test(name)) {
                        await alertUser({
                            title: 'invalid project name',
                            msg: `Doh. The project name can only contain alphanumerics (letters/digits), spaces, hyphens, and underscores. Here is the nerdy regex: ${PROJECT_NAME_REGEXP}`,
                        });
                        name = '';
                    }
                } else {
                    // cancelled/empty, so default it
                    name = `untitled-${pickRandom_Letters({ count: 8 })}`;
                }
            } while (!name);

            const resProjectIbGib = await createProjectIbGib({
                name,
                description: DEFAULT_PROJECT_DESCRIPTION,
                space,
                saveInSpace: true,
                srcCommentIbGib,
            });
            const projectIbGib = resProjectIbGib.newIbGib;
            const projectAddr = getIbGibAddr({ ibGib: projectIbGib });
            await this.metaspace.registerNewIbGib({ ibGib: projectIbGib });

            if (logalot) { console.log(`${lc} starting... (I: 87460f0ca94356520a6255981f6df725)`); }

            const agentsSvc = getAgentsSvc(); // Assuming getAgentsSvc is available
            const newAgentIbGib = await agentsSvc.createNewAgent({
                metaspace: this.metaspace,
                superSpace: undefined, // uses default local user space as the super space
                name: `ProjectAgent-${this.instanceId}`,
                api: 'gemini',
                model: GEMINI_DEFAULT_MODEL_STR,
                availableFunctions: clone(AGENT_AVAILABLE_FUNCTIONS_PROJECTAGENT),
                initialSystemText: [
                    AGENT_INITIAL_SYSTEM_TEXT_PROJECTAGENT,
                ].join('\n'),
                initialChatText: [
                    AGENT_INITIAL_CHAT_TEXT_PROJECTAGENT,
                ].join('\n'),
                fnGetAPIKey: this.getFnGetAPIKey(),
                type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTAGENT,
                addToAgentsTag: true,
            });

            // 2. Register the domain ibGib (project) with the new agent in the index
            await registerDomainIbGibWithAgentIndex({
                domainIbGib: projectIbGib,
                agentIbGib: newAgentIbGib,
                metaspace: this.metaspace,
                space,
            });

            await newAgentIbGib.setActiveContext({
                contextIbGib: projectIbGib,
            });

            // await this.activateProject({
            //     projectIbGib: projectIbGib,
            //     projectAddr: projectAddr,
            // });
            await this.activateIbGib({
                ibGib: projectIbGib,
                addr: projectAddr,
            });

            return projectIbGib;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            await this.enableNewProjectUI();
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * I'm sketching this thinking that it will be useful for commands (via
     * agents) to get the relevant project component.
     *
     * The Projects component atow (05/2025) is basically a singleton, so this
     * provides a way of getting at the component from a command. I'm not sure
     * if this is the right way or if it will be used though.
     *
     * @returns the corresponding project tab info if exists, else undefined.
     */
    public async getProjectTab({
        ibGibAddr,
        ibGib,
    }: {
        ibGibAddr?: IbGibAddr,
        ibGib?: ProjectIbGib_V1,
    }): Promise<ProjectTabInfo | undefined> {
        const lc = `${this.lc}[${this.getProjectTab.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 69c1d8b32ba9dd403a911bc5f0095425)`); }
            if (!ibGibAddr && !ibGib) { throw new Error(`either ibGibAddr or ibGib is required. (E: 42811cc61d78cc83a21b6528c6d58825)`); }
            ibGibAddr ??= getIbGibAddr({ ibGib });
            const gibInfo = getGibInfo({ ibGibAddr });
            const tjpGib = gibInfo.tjpGib ?? getIbAndGib({ ibGibAddr });
            const filtered = this.childInfos.filter(x => {
                const xGibInfo = getGibInfo({ ibGibAddr: x.addr });
                const xTjpGib = xGibInfo.tjpGib ?? getIbAndGib({ ibGibAddr: x.addr });
                return tjpGib === xTjpGib;
            });
            if (filtered.length === 0) {
                return undefined;
            } else if (filtered.length === 1) {
                return filtered[0];
            } else {
                console.warn(`${lc} more than one tab opened for the same tjpGib (${tjpGib})? returning the first one but this doesn't seem right. (W: 0c67f8e2f8eda7cb886343b8f1736b25)`);
                return filtered[0];
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async disableNewProjectUI(): Promise<void> {
        const lc = `${this.lc}[${this.disableNewProjectUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: ea9c02985442ca330759217f29b90c25)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: f0a77baed7c2e5acccd078baf8b0aa25)`); }

            const { addBtnEl } = this.elements;
            addBtnEl.disabled = true;
            addBtnEl.textContent = '…';
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async enableNewProjectUI(): Promise<void> {
        const lc = `${this.lc}[${this.enableNewProjectUI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 91e16b23d2271a6afe8852b8bc77f525)`); }
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 3a1ac8e82351a128fff208ccac468f25)`); }

            const { addBtnEl } = this.elements;
            addBtnEl.disabled = false;
            addBtnEl.textContent = '+';
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    public override async activateIbGib({ addr, ibGib, }: { addr?: IbGibAddr; ibGib?: IbGib_V1; }): Promise<void> {
        const lc = `${this.lc}[${this.activateIbGib.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: a178721ccbe8d7f753a06bc100b16825)`); }
            if (!this.metaspace) { debugger; throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 30b7489383281225fa3b768885c3dd25)`); }
            await super.activateIbGib({ addr, ibGib });

            if (!this.activeChildInfo) { throw new Error(`(UNEXPECTED) this.activeChildInfo falsy after calling activateIbGib? (E: 7a5845a43e9adf178d822b68336b3825)`); }
            ibGib ??= this.activeChildInfo.component?.ibGib

            if (ibGib && isProjectIbGib_V1(ibGib)) {
                // init the agent to listen for context events
                const space = await this.metaspace.getLocalUserSpace({ lock: false });
                if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: a524ecb58d65b524618a58dad7b07f25)`); }
                const projectAgent = await getAgentForDomainIbGib({
                    ibGib,
                    metaspace: this.metaspace,
                    space,
                });
                if (!projectAgent) {
                    throw new Error(`projectAgent not found for project (${addr}) (E: 8e88748121d24c82552387011863e225)`);
                }
                await projectAgent.setActiveContext({
                    contextIbGib: ibGib,
                });
                // update the location
                await simpleIbGibRouterSingleton.updateCurrentURLPathIbGibAddr({
                    ibGibAddr: this.activeChildInfo.addr,
                    replace: true,
                });

                // update breadcrumb
                await this.setBreadcrumbs();

                // update left panel to ensure we're on the Projects Tab
                const appShellSvc = getAppShellSvc();
                appShellSvc.activateLeftPanelTab({ tabName: 'projects' });

                // update right panel - project chronology
                await appShellSvc.activateRightPanelTab({
                    tabName: "chronologys",
                    ibGibAddr: this.activeChildInfo.addr,
                });

                // update footer panel's input
                while (!appShellSvc.inputComponent) {
                    await delay(100);
                    console.log(`${lc} appShellSvc.inputComponent still falsy. probably just page load. will retry... (I: 2628de248d662dc8184ed73c98bb9225)`)
                }
                if (!this.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo falsy? (E: 1c50943dcd8f59297f8bbe5635bc8a25)`); }
                if (!this.activeProjectTabInfo.component?.ibGibProxy) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component?.ibGibProxy falsy? (E: d54f26a14cbb046aa900dea638257f25)`); }
                await appShellSvc.inputComponent.setContextInfo({
                    info: {
                        agent: projectAgent,
                        placeholderText: CHAT_WITH_AGENT_PLACEHOLDER_PROJECTAGENT,
                        contextProxyIbGib: this.activeProjectTabInfo.component.ibGibProxy,
                        // default to default local user space for now
                        spaceId: undefined,
                    },
                });
            } else {
                console.error(`${lc} ibGib is falsy or not a project ibGib? this is not necessarily an error, I just don't know about this state of things at this point. this "error" is just logged to the console, i.e., wasn't thrown. (E: d5c997bdbf28274ed80b057242768825)`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // /**
    //  * Loads the ibGib if only addr is provided.
    //  *
    //  * Then manages the UI:
    //  *
    //  * - If a tab is already created for the project and active, then does nothing.
    //  * - If it's already created but inactive, then activates tab and loads content
    //  * - if no tab, then creates it, activates it, loads content.
    //  *
    //  * To do this, it creates/hydrates a {@link ProjectTabInfo} and activates
    //  * it.
    //  *
    //  * @see {@link ProjectTabInfo.active}
    //  * @see {@link activeProjectTabInfo}
    //  */
    // private async activateProject({
    //     projectAddr,
    //     projectIbGib,
    // }: {
    //     projectAddr?: IbGibAddr,
    //     projectIbGib?: IbGib_V1,
    // }): Promise<void> {
    //     const lc = `${this.lc}[${this.activateProject.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 2d596a9c36f7e5fac4b8bbc6f0e84d25)`); }

    //         if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: a574f48ef54d75d0997933fbed55eb25)`); }
    //         const { contentEl } = this.elements;

    //         // #region init/validate
    //         if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: d647670e3e2a436862719c5b1f324125)`); }
    //         if (projectIbGib && projectAddr && getIbGibAddr({ ibGib: projectIbGib }) !== projectAddr) { throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (E: 6d12ed6a578cf3c466a6c7acd645b625)`); }
    //         projectAddr ??= getIbGibAddr({ ibGib: projectIbGib });
    //         // #endregion init/validate

    //         // super.activateIbGib({})
    //         /**
    //          * the point of this function is to populate this and make it active
    //          */
    //         const projectTabInfo = await this.getLoadedChildInfo({
    //             addr: projectAddr,
    //             ibGib: projectIbGib,
    //         });

    //         if (projectTabInfo.active) {
    //             // already active?
    //             // debugger; // warning/error...activating an already active tab?
    //             console.warn(`${lc} tab already active (W: 5fc45570f99f8fde3c5a887ca42e0a25)`);
    //             return; /* <<<< returns early */
    //         }

    //         projectIbGib ??= projectTabInfo.component?.ibGib;
    //         if (!projectIbGib) { throw new Error(`(UNEXPECTED) projectIbGib falsy? the projectTabInfo should be fully loaded at this point, which should include a projectComponent instance. That component should have its ibGib value populated. (E: 73323f5cc6ed3bede337e646322c8e25)`); }

    //         // at this point, we are guaranteed to have a non-active
    //         // projectTabInfo, so deactivate the old, and activate the new
    //         const currentlyActive = this.activeProjectTabInfo;
    //         if (currentlyActive) {
    //             currentlyActive.childBtnEl.classList.remove('active');
    //             currentlyActive.active = false;
    //             contentEl.innerHTML = '';
    //         }

    //         // init the agent to listen for context events
    //         const space = await this.metaspace.getLocalUserSpace({ lock: false });
    //         if (!space) { throw new Error(`(UNEXPECTED) couldn't get default local user space? (E: a524ecb58d65b524618a58dad7b07f25)`); }
    //         const projectAgent = await getAgentForDomainIbGib({
    //             ibGib: projectIbGib,
    //             metaspace: this.metaspace,
    //             space,
    //         });
    //         if (!projectAgent) {
    //             throw new Error(`projectAgent not found for project (${projectAddr}) (E: 8e88748121d24c82552387011863e225)`);
    //         }
    //         await projectAgent.setActiveContext({
    //             contextIbGib: projectIbGib,
    //         });

    //         // activate the new tab
    //         projectTabInfo.childBtnEl.classList.add('active');
    //         projectTabInfo.childBtnEl.scrollIntoView({ behavior: 'smooth' });
    //         projectTabInfo.active = true;
    //         if (!this.childInfos.some(x => x.addr === projectTabInfo.addr)) {
    //             this.childInfos.push(projectTabInfo);
    //         }
    //         if (!projectTabInfo.component) { throw new Error(`(UNEXPECTED) projectTabInfo.component falsy? should be populated by this point in code (E: 5d766308dcb6a30e6c262f4633505125)`); }
    //         const componentSvc = await getComponentSvc();
    //         await componentSvc.inject({
    //             parentEl: contentEl,
    //             componentToInject: projectTabInfo.component,
    //         });

    //         // update tab button colors
    //         // projectTabInfo.component.style.getPropertyValue()

    //         // update the location
    //         await simpleIbGibRouterSingleton.updateCurrentURLPathIbGibAddr({
    //             ibGibAddr: projectTabInfo.addr,
    //             replace: true,
    //         });

    //         // update breadcrumb
    //         await this.setBreadcrumbs();

    //         // update left panel to ensure we're on the Projects Tab
    //         const appShellSvc = getAppShellSvc();
    //         appShellSvc.activateLeftPanelTab({ tabName: 'projects' });

    //         // update right panel - project chronology
    //         await appShellSvc.activateRightPanelTab({
    //             tabName: "chronologys",
    //             ibGibAddr: projectTabInfo.addr,
    //         });

    //         // update footer panel's input
    //         while (!appShellSvc.inputComponent) {
    //             await delay(100);
    //             console.log(`${lc} appShellSvc.inputComponent still falsy. probably just page load. will retry... (I: 2628de248d662dc8184ed73c98bb9225)`)
    //         }
    //         if (!this.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo falsy? (E: 1c50943dcd8f59297f8bbe5635bc8a25)`); }
    //         if (!this.activeProjectTabInfo.component?.ibGibProxy) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component?.ibGibProxy falsy? (E: d54f26a14cbb046aa900dea638257f25)`); }
    //         await appShellSvc.inputComponent.setContextInfo({
    //             info: {
    //                 agent: projectAgent,
    //                 placeholderText: CHAT_WITH_AGENT_PLACEHOLDER_PROJECTAGENT,
    //                 contextProxyIbGib: this.activeProjectTabInfo.component.ibGibProxy,
    //                 // default to default local user space for now
    //                 spaceId: undefined,
    //             },
    //         });
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    // protected getLoadedTabInfo({ addr, ibGib, }: { addr: IbGibAddr; ibGib?: IbGib_V1; }): Promise<ProjectTabInfo> {
    //     throw new Error("Method not implemented.");
    // }

    /**
     * @internal
     * gets the project tab info for the given addr.
     *
     * creates and loads the project ibgib component, which itself loads the
     * ibgib internally (or throws) if not already loaded.
     *
     * @returns ProjectTabInfo with fully loaded component and ibgib.
     *
     * @see {@link ProjectTabInfo}
     */
    protected async getLoadedChildInfo({
        addr,
        ibGib,
    }: {
        addr: IbGibAddr,
        ibGib?: IbGib_V1,
    }): Promise<ProjectTabInfo> {
        const lc = `${this.lc}[${this.getLoadedChildInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 8bc42ecb105f4ca9dff6590c1a9c2f25)`); }
            if (!addr) { throw new Error(`(UNEXPECTED) addr falsy? (E: 25e89572d09ae8dd581ba60bde1c9825)`); }
            const tjpGib = getGibInfo({ ibGibAddr: addr }).tjpGib ?? getIbAndGib({ ibGibAddr: addr }).gib;

            const fnCreateAndLoadProjectComponent = async () => {
                const componentSvc = await getComponentSvc();
                const projectComponent = await componentSvc.getComponentInstance({
                    path: PROJECT_COMPONENT_NAME,
                    ibGibAddr: addr,
                    useRegExpPrefilter: true,
                }) as ProjectComponentInstance | undefined;
                if (!projectComponent) {
                    debugger; // error couldn't create component instance for project?
                    throw new Error(`(UNEXPECTED) projectComponent falsy? couldn't create component instance for project? (E: efeee6b003f5b0af9b0fda679593c725)`);
                }
                // await projectComponent.loadIbGib();
                // await projectComponent.initialized;
                if (!projectComponent.ibGib) {
                    debugger; // error couldn't load ibGib for project?
                    throw new Error(`(UNEXPECTED) ibGib falsy? couldn't load ibGib for project? (E: 352f152063a97e67f769babfadfe1e25)`);
                }
                // guaranteed loaded ibGib
                return projectComponent;
            }

            /** the point of this function is to populate this */
            let projectTabInfo: ProjectTabInfo;

            /**
             * filtered for same timeline of addr via tjpGib
             */
            const filtered = this.childInfos.filter(x => {
                const tabGibInfo = getGibInfo({ ibGibAddr: x.addr });
                const tabTjpGib = tabGibInfo.tjpGib ?? getIbAndGib({ ibGibAddr: x.addr }).gib;
                return tabTjpGib === tjpGib;
            });
            if (filtered.length > 0) {
                // already have an existing tab
                // const filtered = this.childInfos.filter(x => x.addr === addr);
                if (filtered.length !== 1) { throw new Error(`(UNEXPECTED) filtered.length !== 1? (E: ef126a918a93f1c13d0c4b41d5194b25)`); }
                projectTabInfo = filtered[0];
                if (projectTabInfo.component) {
                    console.log(`${lc} projectTabInfo.component already truthy. (I: f752651269b2ed7151c78668418a7825)`);
                } else {
                    projectTabInfo.component = await fnCreateAndLoadProjectComponent();
                    // ibGib = projectTabInfo.component!.ibGib!;
                }
            } else {
                // no existing tab, so create new project tab info
                const projectComponent = await fnCreateAndLoadProjectComponent();
                ibGib = projectComponent.ibGib!; // guaranteed in above fn

                // both addr and ibGib guaranteed now
                const tabBtnEl = await this.addChild({ addr, ibGib })
                projectTabInfo = {
                    addr,
                    childBtnEl: tabBtnEl,
                    component: projectComponent,
                    active: false,
                };
            }

            return projectTabInfo;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * creates a new tab element (span atow 03/2025), adds it to the
     * headerTabsEl and returns the new span element.
     *
     * @returns the newly created tab span element
     */
    protected override async addChild({
        addr,
        ibGib,
    }: {
        ibGib: IbGib_V1,
        addr?: IbGibAddr,
    }): Promise<HTMLElement> {
        const lc = `${this.lc}[${this.addChild.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: e6657888d2b42cfdef6df03d89f3e625)`); }

            // #region init/validate
            if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: 9f5ad8d5f35ded4496a68ac6b73ac725)`); }
            const { headerTabsEl } = this.elements;

            addr ??= getIbGibAddr({ ibGib });
            if (addr !== getIbGibAddr({ ibGib })) {
                throw new Error(`(UNEXPECTED) addr !== getIbGibAddr({ibGib})? (E: 1981efb1b691c154670376934336d125)`);
            }
            const tjpAddr = getTjpAddr({ ibGib, defaultIfNone: 'incomingAddr' });
            const { gib: tjpGib } = getIbAndGib({ ibGibAddr: tjpAddr });
            // #endregion init/validate

            // create the tab button element
            const span = document.createElement('span');
            span.id = `projects-tab-button-${addr}`;
            span.classList.add('panel-tab-button');
            // if (activate) { span.classList.add('active'); }
            this.updateTabTitleAndText({ span, ibGib });
            let {
                punctiliarColor,
                punctiliarColorTranslucent,
                tjpColor,
                tjpColorContrast,
                tjpColorTranslucent,
                errorMsg
            } = getDeterministicColorInfo({ ibGib, translucentAlpha: 70 });
            if (!errorMsg) {
                span.style.borderColor = tjpColor ?? punctiliarColor;
                span.style.backgroundColor = tjpColorTranslucent ?? punctiliarColorTranslucent;
                span.style.color = tjpColorContrast ?? getColorStrings(90, tjpGib).at(2) ?? 'red'

                // this.style.setProperty('--ibgib-color', punctiliarColor);
                // this.style.setProperty('--ibgib-color-translucent', punctiliarColor);
                // this.style.setProperty('--tjp-color', tjpColor ?? punctiliarColor);
                // this.style.setProperty('--tjp-color-translucent', tjpColorTranslucent ?? punctiliarColorTranslucent);
            } else {
                // don't set anything
                console.error(`${lc} ${errorMsg} (E: f837c92aa2876b444707f0b229fb8e25)`);
            }

            headerTabsEl.appendChild(span);
            span.addEventListener('click', async (event) => {
                // if (logalot) { console.log(`${lc} activating...`); }
                // await this.activateProject({ projectAddr: addr });
                await this.activateIbGib({ addr });
            });

            if (!this.metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 56ed15004c98e40a95db20144e726825)`); }
            if (!this.metaspace.latestObs) { throw new Error(`(UNEXPECTED) this.metaspace.latestObs falsy? (E: bab9882340fcdc29242045e8c2d2fe25)`); }
            await this.metaspace.latestObs?.subscribe(fnObs({
                next: async (updateInfo: IbGibTimelineUpdateInfo) => {
                    if (updateInfo.tjpAddr !== tjpAddr) { return; /* <<<< returns early */ }
                    if (updateInfo.latestIbGib) {
                        this.updateTabTitleAndText({ span, ibGib: updateInfo.latestIbGib })
                    } else {
                        console.error(`{lc}[next] updateInfo.latestIbGib falsy? (E: a8558bdc53889ee07d8d78178328ae25)`);
                    }
                },
                complete: async () => {
                    console.warn(`${lc}[complete] completed executed? (W: a2df080a4f8ef87df5266888109dfe25)`);
                },
                error: async (error) => {
                    debugger; // error in metaspace.latestObs dispatch?
                    console.error(`${lc}[error] ${extractErrorMsg(error)}`);
                },
            }));

            return span;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected removeTabBtn({ tabInfo, }: { tabInfo: ProjectTabInfo; }): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private updateTabTitleAndText({
        span,
        ibGib,
    }: {
        span: HTMLElement,
        ibGib: IbGib_V1,
    }): void {
        const lc = `[${this.updateTabTitleAndText.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: d1c34e159aecc0bf06f57a759b06a625)`); }

            if (!ibGib.data) { throw new Error(`(UNEXPECTED) ibGib.data falsy? (E: a22dd936f38a779c0d61489c7d7c9125)`); }
            if (!ibGib.data.name) { console.warn(`${lc} ibGib.data.name falsy? (W: genuuid)`); }
            const title = ibGib.data.name ?? 'untitled'
            const desc = ibGib.data.description ?? '';
            span.title = desc ? `${title}\n${desc}` : title;
            const MAX_TAB_TEXT_LENGTH = 12;
            span.textContent = getSaferSubstring({ text: title, length: MAX_TAB_TEXT_LENGTH, });
            if (title.length > MAX_TAB_TEXT_LENGTH) {
                span.textContent += '…';
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    // private async activateTab({
    //     addr,
    //     tabSpan,
    // }: {
    //     addr: IbGibAddr,
    //     tabSpan: HTMLSpanElement,
    // }): Promise<void> {
    //     const lc = `${this.lc}[${this.activateTab.name}]`;
    //     try {
    //         if (logalot) { console.log(`${lc} starting... (I: 3703365ccbfb68df570991962aaf7925)`); }
    //         // if (!this.elementsheaderEl) { throw new Error(`(UNEXPECTED) this.headerEl falsy? (E: b61066b20aa36f902dbe474577abea25)`); }
    //     } catch (error) {
    //         console.error(`${lc} ${extractErrorMsg(error)}`);
    //         throw error;
    //     } finally {
    //         if (logalot) { console.log(`${lc} complete.`); }
    //     }
    // }

    async initElements(): Promise<void> {
        const lc = `${this.lc}[${this.initElements.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 0001223d063c984cd870e9e440725425)`); }

            if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) this.shadowRoot falsy? (E: e2d3077643f8c314fd050706ae64ca25)`); }

            const headerEl = shadowRoot_getElementById<HTMLElement>(this.shadowRoot, 'projects-header');

            // headerTabsEl
            const headerTabsEl = shadowRoot_getElementById<HTMLElement>(this.shadowRoot, 'projects-header-tabs');

            const contentEl = shadowRoot_getElementById<HTMLElement>(this.shadowRoot, 'projects-content');
            const pContent = document.createElement('p');
            pContent.textContent = '[no project loaded...try creating one]';
            pContent.style.lineHeight = `${contentEl.clientHeight}px`;
            pContent.style.textAlign = 'center';
            pContent.style.fontStyle = 'italic';
            contentEl.appendChild(pContent);

            const footerEl = shadowRoot_getElementById<HTMLElement>(this.shadowRoot, 'projects-footer');
            footerEl.style.display = 'none';

            // addBtnEl
            // projects-header-add-btn
            const addBtnEl = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'projects-header-add-btn');
            addBtnEl.addEventListener('click', async (event) => {
                await this.newProject({});
            });

            // ellipsisBtnEl
            const ellipsisBtnEl = shadowRoot_getElementById<HTMLButtonElement>(this.shadowRoot, 'projects-header-ellipsis-btn');
            // ellipsisPopoverEl - when user clicks ellipsis, this popover has the options
            // of what exactly to add
            const ellipsisPopoverEl = shadowRoot_getElementById<HTMLElement>(this.shadowRoot, 'ellipsis-popover');
            const ellipsisPopoverOptions = ellipsisPopoverEl.querySelectorAll('.ellipsis-popover-option');
            ellipsisBtnEl.addEventListener('click', async (event) => {
                ellipsisPopoverEl.style.position = 'absolute';
                ellipsisPopoverEl.style.top = `${ellipsisBtnEl.offsetTop + ellipsisBtnEl.clientHeight}px`;
                ellipsisPopoverEl.style.left = `${ellipsisBtnEl.offsetLeft}px`;
            });
            // Event listeners for popover options
            ellipsisPopoverOptions.forEach(option => {
                option.addEventListener('click', async (event: Event) => {
                    try {
                        const target = event.target as HTMLElement;
                        const optionType = target.getAttribute('data-option');
                        if (optionType) {
                            await this.handleEllipsisPopoverSelected(optionType);
                        }
                    } catch (error) {
                        const emsg = `${lc}[ellipsisPopoverOption] ${extractErrorMsg(error)} (E: 8468587582a85f00f8a71e12282a7825)`;
                        console.error(emsg);
                        alertUser({ msg: emsg, title: 'export failed...' }); // spins off
                    } finally {
                        // Hide popover after selection
                        ellipsisPopoverEl.hidePopover();
                    }
                });
            });

            this.elements = {
                headerEl, headerTabsEl,
                addBtnEl,
                ellipsisBtnEl,
                ellipsisPopoverEl,
                contentEl,
                footerEl,
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * exports the current project. If more than one is open, exports the currently active project.
     *
     * Should this also include exporting the project's agent? As a flag
     */
    private async exportProject({ compress }: { compress: boolean }): Promise<void> {
        const lc = `${this.lc}[${this.exportProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 4912c1a75be42f7cb8cefc88472eea25)`); }

            // if (!this.ibGib) { throw new Error(`(UNEXPECTED) this.ibGib falsy? (E: b50b68bbde884e5928602f77d7579a25)`); }
            if (!this.activeProjectTabInfo) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo falsy? (E: 1e99c827600de57928dd3568adebf825)`); }
            if (!this.activeProjectTabInfo.component) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component falsy? (E: d5c0b80d178860cb484741c808126225)`); }
            if (!this.activeProjectTabInfo.component.ibGib) { throw new Error(`(UNEXPECTED) this.activeProjectTabInfo.component.ibGib falsy? (E: 64e1c88b22044e63d8d5dea8c3932825)`); }
            await this.exportIbGib({
                ibGib: this.activeProjectTabInfo.component.ibGib,
                compress,
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private async importProject(): Promise<void> {
        const lc = `[${this.importProject.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 73e3ca46756816843659c8ae7f438e25)`); }
            throw new Error(`not implemented (yet!!) ...delayed because of thinking about import as basically being the same thing as a merge, which is non-trivial. work is mostly located in ibgib-dynamic-component-bases.mts importibGib, but need to pull out into a helper. that should actually just call the helper, passing in the components this.ibGib (can be overridden in descending concrete component classes, in case this.ibGib isn't what we want) (E: 6741dd74686156ac8878af58253dd825)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Handler for when an option is selected from the add popover.
     */
    private async handleEllipsisPopoverSelected(optionType: string): Promise<void> {
        const lc = `${this.lc}[${this.handleEllipsisPopoverSelected.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... optionType: ${optionType} (I: genuuid)`); }

            // const getActiveTabIbGib: () => IbGib_V1 = () => {
            //     if (!this.activeChildInfo) { throw new Error(`this.activeChildInfo falsy (E: genuuid)`); }
            //     if (!this.activeChildInfo.component) { throw new Error(`this.activeChildInfo.component falsy. (E: genuuid)`); }
            //     const ibGib = this.activeChildInfo.component.ibGib;
            //     if (!ibGib) { throw new Error(`(UNEXPECTED) active tab's component's ibgib falsy? (E: genuuid)`); }
            //     return ibGib;
            // }
            switch (optionType) {
                case 'copy-active-project-address':
                    if (this.activeProjectTabInfo) {
                        copyToClipboard({ data: { text: this.activeProjectTabInfo.addr }, });
                        highlightElement({ el: this.activeProjectTabInfo.childBtnEl, magicHighlightTimingMs: 1_000 }); // spin off so options disappear
                    } else {
                        await alertUser({ title: 'No Project?', msg: `There was no project tab found? This seems like a bug so you should report it please. (E: 249298d98278b3e07fa7261a8d009f25)` });
                    }
                    break;
                case 'export-project':
                    await this.exportProject({ compress: false });
                    break;
                case 'export-project-gzip':
                    await this.exportProject({ compress: true });
                    break;
                case 'import-project':
                    await this.importProject();
                    break;
                default:
                    throw new Error(`(UNEXPECTED) invalid optionType (${optionType})? (E: genuuid)`);
            }
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
            if (logalot) { console.log(`${lc} starting... (I: 5629caed7bb86623facfde3caf202c25)`); }
            // if (!this.elements) { throw new Error(`(UNEXPECTED) this.elements falsy? (E: e141c6a515a92f2e68c58b5dcf2eac25)`); }
            // const {} = this.elements;

            this.metaspace = await getGlobalMetaspace_waitIfNeeded();

            let agent: AgentWitnessAny | undefined = undefined;
            let agents = await getAgents({
                metaspace: this.metaspace,
                type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT,
                spaceId: undefined, // explicitly use default local space just to show this option bc it's early in life
            });
            if (agents.length > 0) {
                agent = agents.at(0)!;
            } else {
                const agentsSvc = getAgentsSvc();
                agent = await agentsSvc.createNewAgent({
                    metaspace: this.metaspace,
                    superSpace: undefined, // uses default local user space as the super space
                    name: `ProjectsAgent-${this.instanceId}`,
                    api: 'gemini',
                    model: GEMINI_DEFAULT_MODEL_STR,
                    availableFunctions: [
                        ...AGENT_AVAILABLE_FUNCTIONS_PROJECTSAGENT,
                    ],
                    initialSystemText: AGENT_INITIAL_SYSTEM_TEXT_PROJECTSAGENT,
                    initialChatText: AGENT_INITIAL_CHAT_TEXT_PROJECTSAGENT,
                    fnGetAPIKey: this.getFnGetAPIKey(),
                    type: AGENT_SPECIAL_IBGIB_TYPE_PROJECTSAGENT,
                    addToAgentsTag: true,
                });
            }

            this.agents = [agent];

            if (!this.agent) { throw new Error(`(UNEXPECTED) agent falsy after createNewAgent? (E: 6ea8e8b7aa551bcf467042dbabab9425)`); }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    private getFnGetAPIKey(): () => Promise<string> {
        const lc = `${this.lc}[${this.getFnGetAPIKey.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 18dc13812e3657d0e2874b72123c6125)`); }

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

    private async setBreadcrumbs(): Promise<void> {
        const lc = `${this.lc}[${this.setBreadcrumbs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: b18e0977f9213dca453689fa75326b25)`); }

            let appShellSvc = getAppShellSvc();
            appShellSvc.initialized.then(async () => {
                try {
                    const { breadcrumbComponent } = appShellSvc;
                    if (!breadcrumbComponent) { throw new Error(`(UNEXPECTED) breadcrumbComponent is falsy? (E: 1d5b0148882b0a7f68aab9198ddf7925)`); }
                    if (!this.meta) { throw new Error(`(UNEXPECTED) this.meta falsy? (E: f85649a6574eb111078faeca6dea5325)`); }
                    await breadcrumbComponent.addBreadcrumb({
                        info: {
                            text: 'projects',
                            type: 'projects',
                            // fnClickAction: () => Promise.resolve(), // do nothing
                        },
                        clear: true,
                    });

                    if (this.activeProjectTabInfo) {
                        const { component: projectComponent } = this.activeProjectTabInfo;
                        if (!projectComponent) {
                            console.error(`${lc} (UNEXPECTED) activeProjectTabInfo truthy but its projectComponent falsy? Not throwing here, but returning early. (E: f21843e57044ec11680c078c3d0bdd25)`);
                            return; /* <<<< returns early */
                        }
                        if (!projectComponent.ibGib) {
                            console.error(`${lc} (UNEXPECTED) activeProjectTabInfo truthy but its projectComponent.ibGib falsy? Not throwing here, but returning early. (E: de3167af997ca496599724198d12ed25)`);
                            return; /* <<<< returns early */
                        }
                        const projectIbGib = projectComponent.ibGib;
                        if (isProjectIbGib_V1(projectIbGib)) {
                            await breadcrumbComponent.addBreadcrumb({
                                info: {
                                    text: projectIbGib.data!.name,
                                    type: 'project',
                                    // in the future this will probably be highlight the project main tab
                                    // fnClickAction: () => Promise.resolve(), // do nothing
                                },
                                clear: false,
                            });
                        } else {
                            // ?
                            debugger; // want to see how we have an active project component ibgib but it's not a project ibgib
                        }
                    }
                } catch (error) {
                    console.error(`${lc} couldn't set breadcrumbs for web1 component. (E: 5d255d9c91fdc126a46884cc74fada25)`);
                }
            });
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

}
