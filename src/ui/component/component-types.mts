// import { ROOT_ADDR } from "@ibgib/ts-gib/dist/V1/constants.mjs";
// import { Gib, Ib, IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";

// import { AgentWitnessAny } from "../../witness/agent/agent-one-file.mjs";
// import { LiveProxyIbGib } from "../../witness/live-proxy-ibgib/live-proxy-ibgib-one-file.mjs";

// /**
//  * @see {@link IbGibDynamicComponentMeta.fnHandleRoute}
//  */
// export type FnHandleRouteType =
//     (arg: { path: string; ibGibAddr?: IbGibAddr | undefined; }) => Promise<boolean>;


// /**
//  * This meta object is what registers with the component service. It decides
//  * if a component matches a given route, and if so, this contains the factory
//  * function to create the ibgib component instance (which will be the actual web
//  * component).
//  *
//  * So this is like a factory class, but contains more so it's lumped in as
//  * "meta".
//  *
//  * @see {@link IbGibDynamicComponentInstance}
//  */
// export interface IbGibDynamicComponentMeta {

//     /**
//      * will be used for web component tag, e.g. <my-custom-component>
//      */
//     componentName: string;

//     /**
//      * Optional regular expression meant to provide a quick, first pass when
//      * determining what component to inject given a certain route.
//      *
//      * NOTE: This is not the final decider of if the component handles the
//      * route. For that, @see {@link fnHandleRoute}
//      */
//     routeRegExp?: RegExp;

//     /**
//      * Optional function that determines if this component should handle a given route.
//      *
//      * If provided **AND IF THE {@link routeRegExp} matches the route path**,
//      * the router will call this function with the route path and the parsed
//      * ibgib address.
//      *
//      * If the component should handle the route, this function will return true,
//      * else false.
//      *
//      * @param {object} arg - Arguments object.
//      * @param {string} arg.path - The route path (from window.location.hash or pathname).
//      * @param {IbGibAddr} [arg.ibGibAddr] - The parsed ibGib address from the route path, if applicable.
//      * @returns {Promise<boolean>} - Promise that resolves to `true` if this component should handle the route, `false` otherwise.
//      *
//      * ## implementation notes
//      *
//      * Since this is an optional property, I define this as a lambda not as a
//      * function proper on the class.
//      */
//     fnHandleRoute?: FnHandleRouteType;

//     /**
//      * Factory function to create an instance of the dynamic component.
//      *
//      * @param {object} arg - Arguments object.
//      * @param {string} arg.path - The route path (from window.location.hash or pathname).
//      * @param {IbGibAddr} [arg.ibGibAddr] - The parsed ibGib address from the route path.
//      * @returns {Promise<IbGibDynamicComponentInstance>} - Promise that resolves to a new instance of the dynamic component.
//      */
//     createInstance(arg: {
//         path: string,
//         ibGibAddr: IbGibAddr,
//     }): Promise<IbGibDynamicComponentInstance>;
// }

// /**
//  * TElements is for the HTML elements of the instance.
//  */
// export interface IbGibDynamicComponentInstance<TIbGib extends IbGib_V1 = IbGib_V1, TElements = any> extends HTMLElement {
//     /**
//      * each instance should have an instance id created in ctor.
//      */
//     get instanceId(): string;

//     /**
//      * Meant for HTMLElements that compose this component
//      */
//     elements: TElements | undefined;

//     /**
//      * ## driving use case
//      * need an empty ctor for document.createElement call. so createInstance
//      * will use this after creation.
//      */
//     initialize(opts: IbGibDynamicComponentInstanceInitOpts): Promise<void>;

//     /**
//      * Reference to the component's meta object that created this component
//      * instance.
//      */
//     meta?: IbGibDynamicComponentMeta;

//     /**
//      * Lifecycle method called after the component's HTML is dynamically loaded
//      * and inserted into the DOM.
//      *
//      * Use this to perform component-specific initialization,
//      * e.g., get element references, attach event listeners, set initial state, etc.
//      *
//      * @returns when component is fully created and initialized
//      */
//     created(): Promise<void>;
//     destroyed(): Promise<void>;
//     destroy(): Promise<void>;

//     /**
//      * Lifecycle method called when the component is about to be dynamically removed
//      * from the DOM (e.g., when switching tabs or navigating away from the component).
//      *
//      * Use this to perform cleanup tasks,
//      * e.g., unregister event listeners, release resources, save state (if needed), etc.
//      *
//      * @returns when component is fully destroyed and cleaned up
//      */
//     disconnected(): Promise<void>;
//     get ib(): Ib;
//     get gib(): Gib;
//     ibGibAddr: IbGibAddr;
//     /**
//      * The proxy witness used for updating the backing ibGib.
//      */
//     ibGibProxy: LiveProxyIbGib<TIbGib> | undefined;
//     /**
//      * Backing ibgib getter via {@link ibGibProxy.ibGib}
//      */
//     get ibGib(): TIbGib | undefined;
// }

// /**
//  * common ctor opts when newing up IbGibDynamicComponentInstanceBase
//  * descendants.
//  *
//  * Extend this interface when adding opts to concrete classes.
//  */
// export interface IbGibDynamicComponentInstanceInitOpts {
//     /**
//      * initial addr that the instance relates to. if you don't have an addr yet,
//      * just pass in {@link ROOT_ADDR} ("ib^gib") which acts like a null object
//      * pattern.
//      */
//     ibGibAddr: IbGibAddr;
//     /**
//      * reference to the meta that creates the instance.
//      */
//     meta: IbGibDynamicComponentMeta;
//     /**
//      * @required The HTML content of the component instance as a string.
//      */
//     html: string;
//     /**
//      * @optional Array of CSS style strings to be loaded with the component.
//      */
//     css?: string[];
// }

// /**
//  * Every component is expected to have a content element and frequently a header
//  * and/or footer (but these are optional)
//  */
// export interface ElementsBase {
//     contentEl: HTMLElement;
//     headerEl?: HTMLElement;
//     footerEl?: HTMLElement;
//     /**
//      * often a spinner or something
//      */
//     busyEl?: HTMLElement;
// }

// /**
//  * for parent components, this is the base info class that backs a child
//  * component.
//  */
// export interface ChildInfoBase<TComponent extends IbGibDynamicComponentInstance<IbGib_V1>> {
//     /**
//      * for tabbed parents, this is the tab button.
//      * for explorer parents, this is the thing you click to expand/collapse.
//      */
//     childBtnEl: HTMLElement;
//     /**
//      * addr of the child
//      */
//     addr: IbGibAddr;
//     /**
//      * true if the child is active on the parent
//      */
//     active: boolean;
//     /**
//      * if set, this is the agent associated with the child component
//      */
//     agent?: AgentWitnessAny;
//     /**
//      * access the ibGib via this component.
//      *
//      * This component wraps an ibgib proxy that automatically stays up-to-date
//      * when new ibgib frames are added to the ibgib's timeline and published to
//      * the metaspace. (via metaspace.registerNewIbGib)
//      */
//     component?: TComponent;
// }
