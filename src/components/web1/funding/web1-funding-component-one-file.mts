import thisHtml from './funding.html';
import commonCss from '../web1-common.css';
import thisCss from './funding.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { delay, extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { alertUser, highlightElement } from "@ibgib/web-gib/dist/helpers.web.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { Web1ComponentInstanceBase, Web1ComponentMetaBase } from "../web1-component-base-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;


const WEB1_COMPONENT_NAME: string = 'web1-funding-component';
const WEB1_HTML_PATH: string = '/components/web1/funding/funding.html';
/**
 * script paths don't really work atow. I mean they are "loaded", but there is
 * no way that I can tell to get access to the shadow root of the web component.
 * any scripting I need done that requires this reference I am putting in these
 * component instances' code.
 */
const WEB1_SCRIPT_PATHS: string[] = [
    // '/components/web1/web1-common.mjs',
    // '/components/web1/funding/funding.mjs',
];
const WEB1_CSS_PATHS: string[] = [
    '/styles.css',
    '/components/web1/web1-common.css',
    '/components/web1/funding/funding.css',
];

export const ComponentInfoWeb1_Funding = {
    componentName: WEB1_COMPONENT_NAME,
    htmlPath: WEB1_HTML_PATH,
    scriptPaths: WEB1_SCRIPT_PATHS,
    cssPaths: WEB1_CSS_PATHS,
}

/**
 * This is the root component for any web1 component. this will take in the
 * given path, see if it's web 1.0 path, and then delegate to the appropriate
 * web1 sub component (home, funding, etc.);
 */
export class Web1ComponentMeta_Funding
    extends Web1ComponentMetaBase {
    protected override lc: string = `[${Web1ComponentMeta_Funding.name}]`;

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

    routeRegExp?: RegExp = /apps\/web1\/gib\/funding.html/;

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
        customElements.define(this.componentName, Web1ComponentInstance_Funding);
    }

}

export class Web1ComponentInstance_Funding
    extends Web1ComponentInstanceBase {
    protected override lc: string = `[${Web1ComponentInstance_Funding.name}]`;

    /**
     *
     */
    constructor() {
        super();
    }


    override async created(): Promise<void> {
        const lc = `${this.lc}[${this.created.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 2088bd2d46691df394f9f392934dd325)`); }
            await super.created();

            // init jumpBtn
            const jumpBtn = this.shadowRoot?.getElementById('funding-jump-to-how-btn') as HTMLButtonElement;
            if (jumpBtn) {
                highlightElement({
                    el: jumpBtn,
                    magicHighlightTimingMs: 2000,
                }); // spin off
                const howToFund = this.shadowRoot!.getElementById('how-to-fund') as HTMLElement;
                if (howToFund) {
                    jumpBtn.addEventListener('click', async () => {
                        await highlightElement({
                            el: howToFund,
                            magicHighlightTimingMs: 1000,
                            scrollIntoView: true,
                        });
                    });
                } else {
                    // console.error(`${lc} (unexpected) howToFund falsy? (E: 922a43a96fa58a7268c24e555d11ec25)`);
                    alertUser({ title: 'eek', msg: `how embarassing... can't find the how to fund section? contact me to let me know please... (E: 922a43a96fa58a7268c24e555d11ec25)` });
                }
            } else {
                console.error(`(UNEXPECTED) ? (E: 7eb4b6b49eb4aee6bfd833687d25cf25)`);
            }

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }
}
