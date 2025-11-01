import thisHtml from './contact.html';
import commonCss from '../web1-common.css';
import thisCss from './contact.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { Web1ComponentInstanceBase, Web1ComponentMetaBase } from "../web1-component-base-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;


const WEB1_COMPONENT_NAME: string = 'web1-contact-component';
const WEB1_HTML_PATH: string = '/components/web1/contact/contact.html';
/**
 * script paths don't really work atow. I mean they are "loaded", but there is
 * no way that I can tell to get access to the shadow root of the web component.
 * any scripting I need done that requires this reference I am putting in these
 * component instances' code.
 */
const WEB1_SCRIPT_PATHS: string[] = [
    // '/components/web1/web1-common.mjs',
    // '/components/web1/contact/contact.mjs',
];
const WEB1_CSS_PATHS: string[] = [
    '/styles.css',
    '/components/web1/web1-common.css',
    '/components/web1/contact/contact.css',
];

export const ComponentInfoWeb1_Contact = {
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
export class Web1ComponentMeta_Contact
    extends Web1ComponentMetaBase {
    protected override lc: string = `[${Web1ComponentMeta_Contact.name}]`;

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

    routeRegExp?: RegExp = /apps\/web1\/gib\/contact.html/;

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
        customElements.define(this.componentName, Web1ComponentInstance_Contact);
    }

}

export class Web1ComponentInstance_Contact
    extends Web1ComponentInstanceBase {
    protected override lc: string = `[${Web1ComponentInstance_Contact.name}]`;

    /**
     *
     */
    constructor() {
        super();
    }

}
