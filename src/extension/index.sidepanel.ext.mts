import { ROOT_ADDR } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { getComponentSvc } from '@ibgib/web-gib/dist/ui/component/ibgib-component-service.mjs';

import { initIbGibGlobalThis_BlankGibExt } from './helpers.mjs';
import { SidepanelComponentMeta, SIDEPANEL_COMPONENT_NAME } from './component/sidepanel/sidepanel-component-one-file.mjs';
import { RabbitHoleCommentComponentMeta } from './component/rabbit-hole-comment/rabbit-hole-comment-component-one-file.mjs';
import { bootstrapMetaspace } from './bootstrap.ext.mjs';
import { initBlankGibStorage } from "../helpers.web.mjs";

console.log('sidepanel.mts loading...');

document.addEventListener('DOMContentLoaded', async () => {
    await initIbGibGlobalThis_BlankGibExt();

    /** must init storage before init metaspace */
    await initBlankGibStorage();

    await bootstrapMetaspace();

    const componentSvc = await getComponentSvc();

    componentSvc.registerComponentMeta(new SidepanelComponentMeta());
    componentSvc.registerComponentMeta(new RabbitHoleCommentComponentMeta());

    const rootEl = document.getElementById('root');
    if (!rootEl) {
        console.error('Could not find root element');
        return;
    }

    const sidepanelComponent = await componentSvc.getComponentInstance({
        path: SIDEPANEL_COMPONENT_NAME,
        ibGibAddr: ROOT_ADDR, // Use ROOT_ADDR as a default/null address
        useRegExpPrefilter: true,
    });

    if (sidepanelComponent) {
        await componentSvc.inject({
            parentEl: rootEl,
            componentToInject: sidepanelComponent,
        });
    } else {
        console.error('Could not create sidepanel component instance.');
        rootEl.innerHTML = '<p class="error">Error loading sidepanel component.</p>';
    }
});

console.log('sidepanel.mts loaded.');
