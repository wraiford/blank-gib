// /**
//  * @module component-one-file.mts contains all the types, helpers, constants and
//  * classes for the **shell** ui component system. the differentiating factor
//  * between this system and other front end ui frameworks is that this is
//  * ibgib-driven, with especially ibgib addresses driving components' backing
//  * model/data.
//  *
//  * this is not to be confused with "components" that may be dynamically
//  * generated within a blank-canvas environment that the canvas agents will
//  * build. this is for the old-school html shell.
//  *
//  * the ui component system is being built piecemeal as we go.
//  *
//  * ## approach
//  *
//  * there are two basic pieces to a component: the component metadata declaration
//  * and the concrete component instance that that declaration instantiates. these
//  * will be tightly coupled per use-case, with the intention that the meta object
//  * will not need to be a descendant class, whereas the component instance will
//  * most likely be the class that is extended from an abstract base class.
//  *
//  * @see {@link IbGibDynamicComponentMeta}
//  * @see {@link IbGibDynamicComponentInstance}
//  */

// import { extractErrorMsg, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";

// import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
// import { IbGibDynamicComponentInstance, IbGibDynamicComponentMeta } from "./component-types.mjs";

// const logalot = GLOBAL_LOG_A_LOT;
// /**
//  * Service for managing dynamic ibgib-aware components via web components.
//  */
// export class IbGibComponentService {
//     protected lc: string = `[${IbGibComponentService.name}]`;
//     /**
//      * @internal references to component meta's registered with the service.
//      */
//     private _registeredComponentsMeta: IbGibDynamicComponentMeta[] = [];

//     initialized: Promise<void>;

//     constructor() {
//         this.initialized = this.initialize();
//     }

//     private async initialize(): Promise<void> {
//         const lc = `[${this.initialize.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 1cf04e8d768f4b5c55e7c3861e2d2225)`); }
//             console.log(`${lc} does nothing atow (I: 65bb46c88c82b637ad928b8bf1a07225)`)
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * Registers a dynamic ibgib-aware component META object with the service.
//      * @param {IbGibDynamicComponentMeta} componentMeta - The component meta object to register.
//      */
//     registerComponentMeta(componentMeta: IbGibDynamicComponentMeta): void {
//         this._registeredComponentsMeta.push(componentMeta);
//         if (logalot) { console.log(`${this.lc}[registerComponentMeta] component meta registered: ${componentMeta.constructor.name} (I: 88ddcbd0c8caa2342af0e7348f171225)`); }
//     }

//     /**
//      * Unregisters a dynamic ibgib-aware component META object from the service.
//      * @param {IbGibDynamicComponentMeta} componentMeta - The component meta object to unregister.
//      */
//     unregisterComponentMeta(componentMeta: IbGibDynamicComponentMeta): void {
//         this._registeredComponentsMeta = this._registeredComponentsMeta.filter(c => c !== componentMeta);
//         if (logalot) { console.log(`${this.lc}[unregisterComponentMeta] component meta unregistered: ${componentMeta.constructor.name} (I: 4e84b5274de688248984896a90f5cc25)`); }
//     }

//     async getComponentInstance({
//         useRegExpPrefilter,
//         path,
//         ibGibAddr,
//     }: {
//         useRegExpPrefilter: boolean,
//         path: string,
//         ibGibAddr: IbGibAddr,
//     }): Promise<IbGibDynamicComponentInstance | undefined> {
//         const lc = `${this.lc}[${this.getComponentInstance.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 684ef316cbdb4a3b1fdc96096c273b25)`); }

//             let componentToInject: IbGibDynamicComponentInstance | undefined = undefined;

//             // 1. Get registered components from the component service (NEW)
//             const registeredComponents = componentSvc.getRegisteredComponentsMeta();

//             // 2. Filter by routeRegExp (quick filter)
//             const possibleComponentsMeta = useRegExpPrefilter ?
//                 registeredComponents.filter(component => {
//                     const componentMatchesPath = component.routeRegExp ? component.routeRegExp.test(path) : false;
//                     if (logalot) { console.log(`${lc} ${component.componentName} ${component.routeRegExp} componentMatchesPath: ${componentMatchesPath} (I: 3758520e6a4a57f218396c8649283425)`); }
//                     return componentMatchesPath;
//                 }) :
//                 registeredComponents.concat();

//             // 3. Iterate and call fnHandleRoute for finer-grained check
//             for (const componentMeta of possibleComponentsMeta) {
//                 /**
//                  * order of component registration wins right now
//                  */
//                 const componentHandlesPath = componentMeta.fnHandleRoute ?
//                     await componentMeta.fnHandleRoute({ path, ibGibAddr }) :
//                     true;
//                 if (componentHandlesPath) {
//                     componentToInject = await componentMeta.createInstance({
//                         path, ibGibAddr,
//                     });
//                     break; // Stop on first component that handles the route
//                 }
//             }

//             return componentToInject;
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * Injects a dynamic ibgib-aware component into a parent HTML element based on the route path.
//      *
//      * @param {object} arg - Arguments object.
//      * @param {HTMLElement} arg.parentEl - The parent HTML element where the component should be injected.
//      * @param {string} arg.path - The route path to determine which component to load.
//      * @param {IbGibAddr} [arg.ibGibAddr] - Optional ibGib address parsed from the route path.
//      * @returns {Promise<void>} - Promise that resolves when the component is injected and created.
//      */
//     async inject({
//         parentEl,
//         componentToInject,
//     }: {
//         parentEl: HTMLElement,
//         componentToInject: IbGibDynamicComponentInstance,
//     }): Promise<void> {
//         const lc = `${this.lc}[${this.inject.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 6844cf07eaf8a5b1b106784f7db17125)`); }

//             if (!parentEl) { throw new Error(`${lc} parentEl required. (E: 6f4eb2d682856ef47d173b970ec3c825)`); }
//             if (!componentToInject) { throw new Error(`${lc} componentToInject required. (E: decf0b51ad49257ce44fecbcf84c3a25)`); }
//             if (!componentToInject.meta) { throw new Error(`${lc} componentToInject.meta required. (E: f8827c0602ca7b0e030d0b3e2c4a4825)`); }
//             if (!componentToInject.meta.componentName) { throw new Error(`${lc} componentToInject.meta.componentName required. (E: 5dcae244ae32690f7b73ce27a32a3c25)`); }

//             // Clear parent content
//             parentEl.innerHTML = '';

//             // attach the component (web component) to the parent
//             parentEl.appendChild(componentToInject);

//             // right now we're manually fading in/out with this kluge.
//             parentEl.classList.remove('fade-out');
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             parentEl.innerHTML = `<p class="error">Error loading component for route. error:</p><br /><br /><p>${error.message}</p>`;
//             // console.error(`${lc} ${extractErrorMsg(error)}`);
//             // throw error; // Re-throw error for upstream handling
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     getRegisteredComponentsMeta(): readonly IbGibDynamicComponentMeta[] {
//         return [...this._registeredComponentsMeta];
//     }
// }

// /**
//  * Singleton instance of the IbGibComponentService.
//  */
// let componentSvc: IbGibComponentService;
// export async function getComponentSvc(): Promise<IbGibComponentService> {
//     const lc = `[${getComponentSvc.name}]`;
//     try {
//         if (logalot) { console.log(`${lc} starting... (I: 853694c88223381339103a3765129925)`); }

//         if (!componentSvc) {
//             componentSvc = new IbGibComponentService();
//             await componentSvc.initialized;
//         }

//         return componentSvc;
//     } catch (error) {
//         console.error(`${lc} ${extractErrorMsg(error)}`);
//         throw error;
//     } finally {
//         if (logalot) { console.log(`${lc} complete.`); }
//     }
// }
