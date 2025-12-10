// import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
// import { Ib, IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
// import { IbGib_V1, IbGibRel8ns_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
// import { GIB, IB, ROOT } from "@ibgib/ts-gib/dist/V1/constants.mjs";
// import { WitnessWithContextBase_V1 } from "@ibgib/core-gib/dist/witness/witness-with-context/witness-with-context-base-v1.mjs";
// import { IbGibTimelineUpdateInfo } from "@ibgib/core-gib/dist/common/other/other-types.mjs";
// import { ObservableWitness, } from "@ibgib/core-gib/dist/common/pubsub/observable/observable-types.mjs";
// import { newupSubject } from "@ibgib/core-gib/dist/common/pubsub/subject/subject-helper.mjs";
// import { SubjectWitness } from "@ibgib/core-gib/dist/common/pubsub/subject/subject-types.mjs";

// import { GLOBAL_LOG_A_LOT } from "../../constants.mjs";
// import { WitnessWithContextData_V1, WitnessWithContextRel8ns_V1 } from "@ibgib/core-gib/dist/witness/witness-with-context/witness-with-context-types.mjs";
// import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
// import { getGlobalMetaspace_waitIfNeeded } from "../../helpers.web.mjs";
// import { isSpaceIb } from "@ibgib/core-gib/dist/witness/space/space-helper.mjs";
// import { SpaceId } from "@ibgib/core-gib/dist/witness/space/space-types.mjs";
// import { Factory_V1 } from "@ibgib/ts-gib/dist/V1/factory.mjs";

// const logalot = GLOBAL_LOG_A_LOT;

// /**
//  * Helper ibgib witness for backing ibgib component instances.
//  *
//  * This witness's job is not intrinsically do much of anything, rather, its
//  * focus is to keep up-to-date with changes to a context.
//  *
//  * So this particular witness does not need to care about its own state (its gib
//  * is actually just primitive "gib"). So no calls to loadNewerSelfIfAvailable
//  * should be necessary.
//  *
//  * ## how to use
//  *
//  * ATOW (04/2025) the idea is to have an ibgib component that you want to keep
//  * up-to-date. So you include a backing model proxy ibgib and subscribe to its
//  * events, e.g., {@link LiveProxyIbGib.contextUpdated$}, and then the component
//  * will update its visual elements.
//  *
//  * ## notes on driving intent of this class
//  *
//  * There is quite a bit of plumbing involved with updating ibgibs
//  * when updates are published to the metaspace. This involves subscribing
//  * to the ibgib timeline's latestObs observable on the metaspace, checking if
//  * there are actual new updates, as well as other things.
//  *
//  * Our components, however, since they are web components must descend from
//  * HTMLElement, so we can't descend from WitnessWithContextBase_V1 directly.
//  *
//  * So my hope is that this will be performant enough, and maintainable enough,
//  * to have this backing model for ibgib components.
//  *
//  */
// export class LiveProxyIbGib<TIbGib extends IbGib_V1 = IbGib_V1> extends WitnessWithContextBase_V1 {
//     protected lc: string = ``;

//     ib = this._currentWorkingContextIbGib ? this._currentWorkingContextIbGib.ib : IB;
//     gib = this._currentWorkingContextIbGib ? this._currentWorkingContextIbGib.gib : GIB;
//     data = this._currentWorkingContextIbGib ? this._currentWorkingContextIbGib.data : undefined;
//     rel8ns = this._currentWorkingContextIbGib ? this._currentWorkingContextIbGib.rel8ns : undefined;

//     protected override async loadNewerSelfIfAvailable(): Promise<void> {
//         const lc = `${this.lc}[${this.loadNewerSelfIfAvailable.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
//             // doesn't look like this gets hit right now
//             console.warn(`${lc} does nothing in this class. I just have this warning here because I want to see if this gets executed. (W: genuuid)`)
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }
//     override async loadIbGibDto(dto: IbGib_V1<WitnessWithContextData_V1, WitnessWithContextRel8ns_V1>): Promise<void> {
//         const lc = `${this.lc}[${this.loadIbGibDto.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
//             debugger; // does live proxy ibgib hit here?
//             console.warn(`${lc} does nothing in this class. I just have this warning here because I want to see if this gets executed. (W: genuuid)`)
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     /**
//      * not a "true" witness as I'm thinking right now so I'm not validating this
//      * proxy class. I am keeping the validateArg function though, as that seems
//      * good to me.
//      */
//     protected override async validateThis(): Promise<string[]> {
//         const lc = `${this.lc}[${this.validateThis.name}]`;
//         if (logalot) { console.log(`${lc} elided in this proxy class because this isn't a true witness atow (04/2025) (I: fd223814f169798d9f499d6e9cdc0325)`); }
//         return [];
//     }

//     get ibGib(): TIbGib | undefined {
//         return this._currentWorkingContextIbGib as TIbGib | undefined;
//     }

//     /**
//      * determines the local space in which this proxy ibgib resides.
//      *
//      * set this via passing in a space ibgib for the proxy to witness.
//      */
//     spaceId: SpaceId | undefined;

//     constructor(initialData?: any, initialRel8ns?: IbGibRel8ns_V1) {
//         super(initialData, initialRel8ns);
//     }

//     protected override async initialize(): Promise<void> {
//         const lc = `${this.lc}[${this.initialize.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 1bd72217a5f334effc63f8d51e7b2225)`); }
//             await super.initialize();

//             // init observables event streams
//             this._contextUpdated$ = await newupSubject();
//             this.contextUpdated$ = this._contextUpdated$.asObservable();

//             this._newContextChild$ = await newupSubject();
//             this.newContextChild$ = this._newContextChild$.asObservable();
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }


//     protected parseAddlMetadataString({ ib }: { ib: Ib; }): any {
//         const lc = `${this.lc}[${this.parseAddlMetadataString.name}]`;
//         console.warn(`${lc} not really implemented in this class atow (04/2025). (W: genuuid)`);
//         return {};
//     }

//     /**
//      * @internal
//      *
//      * The first context ibgib frame that this proxy is initialized with,
//      * namely, before any updates happen that produce newer ibgibs in the
//      * timelines. Those will update the {@link _currentWorkingContextIbGib}.
//      */
//     protected _initialContext: TIbGib | undefined;

//     /**
//      * implementation for witnessing. Basically, the first ibgib this proxy
//      * witnesses is its context, i.e., its ibgib.
//      *
//      * ## notes
//      *
//      * ### on "Context" with this Proxy
//      *
//      * "Context" is kinda funny in this way, but it's how I'm reusing existing
//      * plumbing for updating contexts.
//      *
//      * Said another way, usually a "context" is peripheral/ambient compared to
//      * the primary behavior of a witness with context. But in this use case as a
//      * proxy ibgib, "context" is just the actual ibgib.
//      */
//     protected async witnessImpl(arg: IbGib_V1<any, IbGibRel8ns_V1>): Promise<IbGib_V1<any, IbGibRel8ns_V1> | undefined> {
//         const lc = `${this.lc}[${this.witnessImpl.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting...`); }

//             if (isSpaceIb({ ib: arg.ib })) {
//                 // we're setting the local space
//                 if (!arg.data) { throw new Error(`arg has space ib but arg.data is falsy (E: b2af9226c067d5e72f117fa36e239525)`); }
//                 const spaceId: SpaceId = arg.data.uuid as string;
//                 this.spaceId = spaceId;
//                 if (logalot) { console.log(`${lc} spaceId set to the ${spaceId} (I: 018724a5431ba421b71fad36924c5a25)`); }
//                 // return a primitive string
//                 return Factory_V1.primitive({ ib: `spaceId set to ${spaceId}` });
//             } else {
//                 // we're wrapping an ibgib
//                 if (!this._initialContext) {
//                     const space = await this.metaspace?.getLocalUserSpace({ localSpaceId: this.spaceId });
//                     await this.setWrappedIbGib({
//                         ibGib: arg,
//                         space,
//                     });
//                     // return ROOT => default action taken
//                     return ROOT;
//                 } else {
//                     debugger; // error
//                     console.error(`${lc} (UNEXPECTED) context already initialized. returning early without doing anything. NOTE: This error was not thrown, only logged. (E: genuuid)`);
//                 }
//             }
//         } catch (error) {
//             console.error(`${lc} ${error.message}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     _contextUpdated$: SubjectWitness<TIbGib> | undefined;
//     /**
//      * similar to {@link newContextChild$}, but this is triggered when a NEW
//      * context ibgib is published via the metaspace (not its children).
//      *
//      * I believe this happens before the {@link newContextChild$} but don't
//      * quote me.
//      *
//      * ## notes
//      *
//      * * sometimes an ibgib is published on the timeline by the metaspace but it
//      *   is not actually new. So this swallows those old updates to essentially
//      *   be idempotent
//      *
//      * @see {@link _contextUpdated$}
//      * @see {@link newContextChild$}
//      */
//     contextUpdated$: ObservableWitness<TIbGib> | undefined;
//     /**
//      *
//      */
//     _newContextChild$: SubjectWitness<IbGib_V1> | undefined;
//     /**
//      * similar to {@link contextUpdated$}, but this happens when new _children_
//      * are added to the context ibgib, not just when the context ibgib itself is
//      * changed.
//      *
//      * This wraps {@link WitnessWithContextBase_V1.handleNewContextChild}
//      *
//      * @see {@link _newContextChild$}
//      * @see {@link contextUpdated$}
//      */
//     newContextChild$: ObservableWitness<IbGib_V1> | undefined;

//     protected async handleContextUpdate({ update }: { update: IbGibTimelineUpdateInfo; }): Promise<void> {
//         const lc = `${this.lc}[${this.handleContextUpdate.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: c262bcda065c086ffe9e3ac5899abe25)`); }

//             await super.handleContextUpdate({ update });
//             if (!this._contextUpdated$) { throw new Error(`(UNEXPECTED) this._contextUpdated$ falsy? (E: a184df090502bed9649f8df88bd4c125)`); }
//             await this._contextUpdated$.next(this._currentWorkingContextIbGib as TIbGib);

//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     async setWrappedIbGib({
//         ibGib,
//         ibGibAddr,
//         space,
//     }: {
//         ibGib?: IbGib_V1,
//         ibGibAddr?: IbGibAddr,
//         space?: IbGibSpaceAny,
//     }): Promise<void> {
//         const lc = `${this.lc}[${this.setWrappedIbGib.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: a4b0acda259c121801aa701534320125)`); }
//             if (!this.metaspace) {
//                 this.metaspace = await getGlobalMetaspace_waitIfNeeded();
//                 // throw new Error(`(UNEXPECTED) this.metaspace falsy? (E: 60dc3b1eb082dfc266a33cd4cc96a525)`);
//             }

//             // get the ibgib by addr if necessary
//             // initialize the context with the ibgib
//             // NOTE: this.initializeContext says it has the ability to load from
//             // addr, but it doesn't and I'm too "lazy" right now to change that
//             // lib.

//             if (!ibGib) {
//                 if (!ibGibAddr) { throw new Error(`(UNEXPECTED) both ibGib AND ibGibAddr falsy? (E: 6fac98ba2d4cfdec2b7ee974dec74625)`); }

//                 space ??= await this.metaspace.getLocalUserSpace({ lock: false });
//                 if (!space) { throw new Error(`(UNEXPECTED) space falsy? no space provided and couldn't get default local user space? (E: e14d1b7a6586f99453fc571396d4df25)`); }
//                 const resGet = await this.metaspace.get({
//                     addrs: [ibGibAddr],
//                     space,
//                 });

//                 if (!resGet.success || resGet.ibGibs?.length !== 1) {
//                     throw new Error(`${lc} failed to get ibGib(?) (${ibGibAddr}). space.ib: ${space.ib} (E: b38f0a25d92e44c0aa5cc3b038a43c6c)`);
//                 }
//                 ibGib = resGet.ibGibs.at(0)!;
//             }

//             await this.initializeContext({
//                 // arg: ibGib as TIbGib,
//                 contextIbGib: ibGib as TIbGib,
//                 // empty string for rel8nName avoids attempting to rel8 this
//                 // witness to the context...sniff sniff
//                 rel8nName: '',
//             });

//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }

//     protected override async handleNewContextChild({ newChild }: { newChild: IbGib_V1; }): Promise<void> {
//         const lc = `[${this.handleNewContextChild.name}]`;
//         try {
//             if (logalot) { console.log(`${lc} starting... (I: 7e9b6b7a4bb2726e9c717f230dfe1925)`); }
//             // console.error(`${lc} not really an error. newChild: ${pretty(newChild)}`);

//             if (!this._newContextChild$) { throw new Error(`(UNEXPECTED) this._contextUpdated$ falsy? (E: a184df090502bed9649f8df88bd4c125)`); }
//             await this._newContextChild$.next(newChild);
//         } catch (error) {
//             console.error(`${lc} ${extractErrorMsg(error)}`);
//             throw error;
//         } finally {
//             if (logalot) { console.log(`${lc} complete.`); }
//         }
//     }
// }
