import thisHtml from './links.html';
import commonCss from '../web1-common.css';
import thisCss from './links.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { Web1ComponentInstanceBase, Web1ComponentMetaBase } from "../web1-component-base-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;

const WEB1_COMPONENT_NAME: string = 'web1-links-component';
const WEB1_HTML_PATH: string = '/components/web1/links/links.html';

const WEB1_SCRIPT_PATHS: string[] = [];
const WEB1_CSS_PATHS: string[] = [
    '/styles.css',
    '/components/web1/web1-common.css',
    '/components/web1/links/links.css',
];

export const ComponentInfoWeb1_Links = {
    componentName: WEB1_COMPONENT_NAME,
    htmlPath: WEB1_HTML_PATH,
    scriptPaths: WEB1_SCRIPT_PATHS,
    cssPaths: WEB1_CSS_PATHS,
}

const LINK_DATA = [
    {
        group: 'motivation',
        links: [
            {
                name: 'graph of version control systems by cellphone technology',
                description: `A profound, surprisingly hard-hitting video by a git instructor who made an absolutely striking graphic, depicting version control systems next to each's cellphone of the day. He looked into git alternatives once a student asked why nothing happened after 2005. <b>A must-watch video, also highlighting Pijul's move into non-source code domain</b> (but still text only).`,
                url: 'https://youtu.be/Ev80GGP5VNc?t=390',
                embedUrl: 'https://www.youtube.com/embed/Ev80GGP5VNc?start=390',
            },
            {
                name: 'git technical debt, or: How do I delete a Git branch locally and remotely?',
                description: `<p>git is one of the greatest, most successful pieces of software. it's also a <a href="https://www.investopedia.com/terms/n/natural_monopoly.asp" target="_blank">natural monopoly</a>.</p>
                    <p>check out these <em>incredible</em> stats as both a measure of git's success, <b>but also its two decades of technical debt</b>. (all atow)
                    <ul>
                      <li>over 11 million views</li>
                      <li>Asked over 14 years, 4 months ago...</li>
                      <li>...and <em>modified 3 months ago</em></li>
                      <li>20,377 upvotes on the question</li>
                      <li>25,884 upvotes on the top answer, <b>which requires an executive summary, two major revisions with the original answer being completely supplanted, and 45 total revisions by 32 users</b></li>
                      <li>Two <em>pages</em> of answers (41 in all and counting atow), composed of...
                        <ul>
                          <li>dozens of less-upvoted questions with 1000s of votes</li>
                          <li>five answers with graphical aides (unheard of)</li>
                        </ul>
                      </li>
                      <li>a whopping 59,933 upvotes in toto</li>
                      <li><b>And the cherry on the grâce, 1 absolutely-unheard-of OP question comment by a 46k-rep member to completely circumvent SO's voting mechanism to jump straight to the "best" answer</b></li>
                    </ul>
                    <p>all of this to do one of the most common actions with the application <em>and it still is a terrible syntax</em>.</p>`,
                url: 'https://stackoverflow.com/questions/2003505/how-do-i-delete-a-git-branch-locally-and-remotely?page=1',
            },
            {
                name: 'Version Control for Data Scientists',
                description: `An interesting talk about how practicing data scientists are actually kluging git as a workaround for versioning data models. Definite code smell.`,
                url: 'https://youtu.be/pah3xJ0tPqI',
                embedUrl: 'https://www.youtube.com/embed/pah3xJ0tPqI',
            },
        ]
    },
    {
        group: 'NPM packages',
        links: [
            {
                name: '@ibgib/web-gib',
                description: 'Framework for creating agentic ibGib web apps. Contains plumbing for ibgib components, agentic framework (currently only Gemini implemented), web-based IndexedDB storage substrate, and more.',
                url: 'https://www.npmjs.com/package/@ibgib/web-gib',
            },
            {
                name: '@ibgib/node-gib',
                description: "Node and server-specific ibGib code, i.e., things that don't run in the browser.",
                url: 'https://www.npmjs.com/package/@ibgib/node-gib',
            },
            {
                name: '@ibgib/encrypt-gib',
                description: `Custom encryption library that uses an ibgib-friendly, custom (unproven and assumed weak) NOVEL hash-based encryption algorithm. AFAICT it should be post quantum secure, but it has not been thoroughly tested/vetted. I like it though, because I can understand all parts, assuming the magic of the underlying hash function.`,
                url: 'https://www.npmjs.com/package/@ibgib/encrypt-gib',
            },
            {
                name: '@ibgib/core-gib',
                description: 'Core functionality like abstract class architecture for witnesses, spaces, etc. Works for both node and the web.',
                url: 'https://www.npmjs.com/package/@ibgib/core-gib',
            },
            {
                name: '@ibgib/ts-gib',
                description: 'Graphing substrate for low-level ibgib protocol DAG.',
                url: 'https://www.npmjs.com/package/@ibgib/ts-gib',
            },
            {
                name: '@ibgib/helper-gib',
                description: 'Utilities used throughout ibgib libs and apps, but not necessarily ibgib-specific. ATOW includes the custom respec-gib testing framework (for more polite developers).',
                url: 'https://www.npmjs.com/package/@ibgib/helper-gib',
            },
        ]
    },
    {
        group: 'social',
        links: [
            {
                name: 'X (Twitter)',
                description: 'Rarely used, but present.',
                url: 'https://x.com/ibgibDOTcom',
            },
            {
                name: 'GitHub',
                description: `NOTE: OUT-OF-DATE --> Dwindling presence because of onset of dogfooding ibgib's B2tFS. The current repo paradigm is too restrictive. The future is in much more robust and powerful "version control" across multiple domains, source code only being one of them.`,
                url: 'https://github.com/wraiford',
            },
            {
                name: 'GitLab',
                description: `NOTE: OUT-OF-DATE --> Dwindling presence because of onset of dogfooding ibgib's B2tFS. The current repo paradigm is too restrictive. The future is in much more robust and powerful "version control" across multiple domains, source code only being one of them.`,
                url: 'https://gitlab.com/ibgib',
            },
        ]
    }
];

export class Web1ComponentMeta_Links
    extends Web1ComponentMetaBase {
    protected override lc: string = `[${Web1ComponentMeta_Links.name}]`;

    protected getComponentName(): string { return WEB1_COMPONENT_NAME; }
    protected getHtml(): string { return thisHtml; }
    protected getCss(): string[] | undefined {
        return [
            rootCss,
            stylesCss,
            commonCss,
            thisCss,
        ];
    }

    componentName: string = this.getComponentName();

    routeRegExp?: RegExp = /apps\/web1\/gib\/links.html/;

    fnHandleRoute = async (arg: {
        path: string;
        ibGibAddr?: IbGibAddr | undefined;
    }) => {
        if (logalot) { console.log(`Web1Component fnHandleRoute: path: ${arg.path}, ibGibAddr: ${arg.ibGibAddr}`); }
        return true;
    }

    constructor() {
        super();
    }
    protected registerCustomElements(): void {
        customElements.define(this.componentName, Web1ComponentInstance_Links);
    }

}

const COPY_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>
`;

export class Web1ComponentInstance_Links
    extends Web1ComponentInstanceBase {
    protected override lc: string = `[${Web1ComponentInstance_Links.name}]`;

    constructor() {
        super();
    }

    override async created(): Promise<void> {
        const lc = `${this.lc}[${this.created.name}]`;
        try {
            await super.created();
            if (logalot) { console.log(`${lc} starting...`); }

            const container = this.shadowRoot?.querySelector('#links-container');
            if (container) {
                this.renderLinks(container);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        }
    }

    private renderLinks(container: Element): void {
        container.innerHTML = '';
        LINK_DATA.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'link-group';

            const h2 = document.createElement('h2');
            h2.textContent = group.group;
            groupEl.appendChild(h2);

            group.links.forEach(link => {
                const entryEl = document.createElement('div');
                entryEl.className = 'link-entry';
                entryEl.onclick = (e) => {
                    // Don't toggle if clicking a button or link
                    if ((e.target as HTMLElement).closest('.copy-button') ||
                        (e.target as HTMLElement).closest('a')) {
                        return;
                    }
                    entryEl.classList.toggle('expanded');
                };

                if ((link as any).embedUrl) {
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    const iframe = document.createElement('iframe');
                    iframe.src = (link as any).embedUrl;
                    iframe.setAttribute('frameborder', '0');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
                    iframe.setAttribute('allowfullscreen', 'true');
                    videoContainer.appendChild(iframe);
                    entryEl.appendChild(videoContainer);
                }

                const headerEl = document.createElement('div');
                headerEl.className = 'link-header';

                const nameEl = document.createElement('span');
                nameEl.className = 'link-name';
                nameEl.textContent = link.name;
                headerEl.appendChild(nameEl);

                const actionsEl = document.createElement('div');
                actionsEl.className = 'link-actions';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-button';
                copyBtn.innerHTML = COPY_ICON_SVG;
                copyBtn.title = 'Copy Link';
                copyBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.copyToClipboard(link.url, copyBtn);
                };
                actionsEl.appendChild(copyBtn);

                headerEl.appendChild(actionsEl);
                entryEl.appendChild(headerEl);

                const urlContainer = document.createElement('div');
                urlContainer.className = 'link-url-container';
                const a = document.createElement('a');
                a.className = 'link-url';
                a.href = link.url;
                a.target = '_blank';
                a.textContent = link.url;
                a.onclick = (e) => e.stopPropagation();
                urlContainer.appendChild(a);
                entryEl.appendChild(urlContainer);

                const descEl = document.createElement('div');
                descEl.className = 'link-description';
                descEl.innerHTML = link.description;
                entryEl.appendChild(descEl);

                groupEl.appendChild(entryEl);
            });

            container.appendChild(groupEl);
        });
    }

    private async copyToClipboard(text: string, button: HTMLButtonElement): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            const originalContent = button.innerHTML;
            button.textContent = 'copied!';
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
}
