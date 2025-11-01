import thisHtml from './home.html';
import commonCss from '../web1-common.css';
import thisCss from './home.css';
import stylesCss from '../../../styles.css';
import rootCss from '../../../root.css';

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { Web1ComponentInstanceBase, Web1ComponentMetaBase } from "../web1-component-base-one-file.mjs";

const logalot = GLOBAL_LOG_A_LOT;



const WEB1_COMPONENT_NAME: string = 'web1-home-component';

/**
 * This is the root component for any web1 component. this will take in the
 * given path, see if it's web 1.0 path, and then delegate to the appropriate
 * web1 sub component (home, funding, etc.);
 */
export class Web1ComponentMeta_Home
    extends Web1ComponentMetaBase {
    protected override lc: string = `[${Web1ComponentMeta_Home.name}]`;

    protected getComponentName(): string { return WEB1_COMPONENT_NAME; }
    protected getHtml(): string { return thisHtml; }
    protected getCss(): string[] | undefined {
        return [
            rootCss,
            stylesCss,
            commonCss,
            thisCss
        ];
    }

    componentName: string = this.getComponentName();

    routeRegExp?: RegExp = /apps\/web1\/gib\/home.html/;

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
        customElements.define(this.componentName, Web1ComponentInstance_Home);
    }

}

export class Web1ComponentInstance_Home
    extends Web1ComponentInstanceBase {
    protected override lc: string = `[${Web1ComponentInstance_Home.name}]`;

    /**
     *
     */
    constructor() {
        super();
    }

}
