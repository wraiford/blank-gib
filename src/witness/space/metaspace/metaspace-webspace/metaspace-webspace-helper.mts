import { extractErrorMsg, getTimestamp, getUUID, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { getGib, isPrimitive } from "@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs";
import { GIB } from "@ibgib/ts-gib/dist/V1/constants.mjs";
import { IbGib_V1 } from "@ibgib/ts-gib/dist/V1/types.mjs";
import { IbGibAddr } from "@ibgib/ts-gib/dist/types.mjs";
import { getIbAndGib } from "@ibgib/ts-gib/dist/helper.mjs";
import { SyncSagaInfo, SyncStatusIbGib } from "@ibgib/core-gib/dist/witness/space/outer-space/outer-space-types.mjs";
import { SubscriptionWitness } from "@ibgib/core-gib/dist/common/pubsub/subscription/subscription-types.mjs";
import { fnObs } from "@ibgib/core-gib/dist/common/pubsub/observer/observer-helper.mjs";
import { ErrorIbGib_V1 } from "@ibgib/core-gib/dist/common/error/error-types.mjs";
import { IbGibSpaceAny } from "@ibgib/core-gib/dist/witness/space/space-base-v1.mjs";
import {
    DtoToSpaceFunction, LocalSpaceFactoryFunction, MetaspaceService,
} from "@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs";
import { isSpaceIb, spaceNameIsValid } from "@ibgib/core-gib/dist/witness/space/space-helper.mjs";
import {
    IBGIB_BASE_DIR, IBGIB_BASE_SUBPATH, IBGIB_BIN_SUBPATH,
    IBGIB_DNA_SUBPATH, IBGIB_ENCODING, IBGIB_IBGIBS_SUBPATH, IBGIB_META_SUBPATH
} from "@ibgib/core-gib/dist/witness/space/filesystem-space/filesystem-constants.mjs";
import {
    DEFAULT_LOCAL_SPACE_DESCRIPTION, DEFAULT_LOCAL_SPACE_POLLING_INTERVAL_MS,
    PERSIST_OPTS_AND_RESULTS_IBGIBS_DEFAULT
} from "@ibgib/core-gib/dist/witness/space/space-constants.mjs";
import { SubjectWitness } from "@ibgib/core-gib/dist/common/pubsub/subject/subject-types.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../../constants.mjs";
import { getFnPrompt } from "../../../../common/prompt-functions.web.mjs";
import { WebFilesystemSpace_V1 } from "../../web-filesystem-space/web-filesystem-space-v1.mjs";
import { WebFilesystemSpaceData_V1, WebFilesystemSpaceRel8ns_V1 } from "../../web-filesystem-space/web-filesystem-space-types.mjs";
import { toDto } from "@ibgib/core-gib/dist/common/other/ibgib-helper.mjs";

/**
 * used in verbose logging (across all ibgib libs atow)
 */
const logalot = GLOBAL_LOG_A_LOT;

export const fnCreateNewLocalSpace: LocalSpaceFactoryFunction = async ({
    allowCancel,
    spaceName,
    logalot,
}) => {
    const lc = `[fnCreateNewLocalSpace]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: b05e12810c1d32269b0fa7e965ccfd24)`); }

        if (spaceName && !spaceNameIsValid(spaceName)) {
            throw new Error(`spaceName (${spaceName}) is invalid.  (E: c54aa952ee34102befe5f47681cdf624)`);
            // throw because this is used in RCLI and automated testing...
        }
        if (!spaceName) {

            const promptName: () => Promise<void> = async () => {
                const fnPrompt = getFnPrompt();
                const resName = await fnPrompt({
                    title: 'greetings program', msg: `this website does not use cookies. it's driven by ibgib's innovative protocol, and all of YOUR data is stored in a "local space" on YOUR device. in browsers, this means in IndexedDB.

so give your local space a name like 'phone_alice' or 'web_bob_foo', or leave blank to get a random name. then click ok.
`
                });

                if (resName === '' && !allowCancel) {
                    spaceName = 'space_' + (await getUUID()).slice(0, 10);
                } else {
                    if (resName && spaceNameIsValid(resName)) {
                        spaceName = resName;
                    }
                }
            };

            // ...prompt for name
            await promptName();

            if (!spaceName) { return undefined; /* <<<< returns early */ }
        }

        // ...create in memory with defaults
        const now = new Date();
        const timestamp = getTimestamp(now);
        const timestampMs = now.getMilliseconds();
        const newLocalSpace = new WebFilesystemSpace_V1(/*initialData*/ {
            version: '1',
            uuid: await getUUID(),
            isTjp: true,
            timestamp,
            timestampMs,
            name: spaceName,
            baseDir: IBGIB_BASE_DIR,
            spaceSubPath: spaceName,
            baseSubPath: IBGIB_BASE_SUBPATH,
            binSubPath: IBGIB_BIN_SUBPATH,
            dnaSubPath: IBGIB_DNA_SUBPATH,
            ibgibsSubPath: IBGIB_IBGIBS_SUBPATH,
            metaSubPath: IBGIB_META_SUBPATH,
            encoding: IBGIB_ENCODING,
            persistOptsAndResultIbGibs: PERSIST_OPTS_AND_RESULTS_IBGIBS_DEFAULT,
            validateIbGibAddrsMatchIbGibs: true,
            trace: false,
            description: DEFAULT_LOCAL_SPACE_DESCRIPTION,
            allowPrimitiveArgs: false,
            catchAllErrors: true,
            longPollingIntervalMs: DEFAULT_LOCAL_SPACE_POLLING_INTERVAL_MS,
        } as WebFilesystemSpaceData_V1, /*initialRel8ns*/ undefined);
        if (logalot) { console.log(`${lc} localSpace.ib: ${newLocalSpace.ib} (I: f57802654c5be84eb96d36d477425924)`); }
        if (logalot) { console.log(`${lc} localSpace.gib: ${newLocalSpace.gib} (before sha256v1) (I: 4171271b7c1484e90205824a31067924)`); }
        if (logalot) { console.log(`${lc} localSpace.data: ${pretty(newLocalSpace.data || 'falsy')} (I: 01221a1d7f6f19accf05b17534e3e624)`); }
        if (logalot) { console.log(`${lc} localSpace.rel8ns: ${pretty(newLocalSpace.rel8ns || 'falsy')} (I: 750a7ec2b25b5d344dea900cf14ca524)`); }

        // trying out with tjp, can't remember why didn't have it except for
        // backwards compatability which i'm no longer shooting for (will be
        // able to project old spaces to new ones i believe)
        // newLocalSpace.gib = await getGib({ ibGib: newLocalSpace, hasTjp: false });
        newLocalSpace.gib = await getGib({ ibGib: toDto({ ibGib: newLocalSpace }), hasTjp: true });

        if (newLocalSpace.gib === GIB) { throw new Error(`localSpace.gib not updated correctly. (E: 277f8305ec3fd8dd4b023616c1fa0624)`); }
        if (logalot) { console.log(`${lc} localSpace.gib: ${newLocalSpace.gib} (after sha256v1) (I: d3ab464fdb4500d95a50bf1e7c036524)`); }

        return newLocalSpace as IbGibSpaceAny;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export const fnDtoToSpace_webFilesystem: DtoToSpaceFunction = (spaceDto) => {
    return Promise.resolve(
        WebFilesystemSpace_V1.createFromDto(spaceDto as IbGib_V1<WebFilesystemSpaceData_V1, WebFilesystemSpaceRel8ns_V1>)
    );
}

/**
 * wrapper around metaspace.syncIbGibs
 * @param param0
 * @returns
 */
export async function doSync_awaitAllSagas({
    addr,
    metaspace,
    localSpace,
    syncSpaces,
    sagaReporter,
    verbose,
}: {
    /**
     * the addr whose live dependency graph is going to be built and synced.
     */
    addr: IbGibAddr,
    /**
     * it's meta yo
     */
    metaspace: MetaspaceService,
    /**
     * the space which contains the syncSpace (proxy outer space).
     */
    localSpace: IbGibSpaceAny,
    /**
     * sync space witnesses (not just ibgib dtos)
     */
    syncSpaces: IbGibSpaceAny[],
    sagaReporter: (msg: string, saga: SyncSagaInfo | null) => Promise<void>,
    /**
     * If true, will report more in {@link sagaReporter}
     */
    verbose?: boolean,
}): Promise<SyncSagaInfo[] | undefined> {
    const lc = `[${doSync_awaitAllSagas.name}]`;
    try {
        if (logalot || verbose) { console.log(`${lc} starting... (I: 78bf9e5bea88d9b3827bb991eeedc524)`); }
        const { ib, gib } = getIbAndGib({ ibGibAddr: addr });

        if (isPrimitive({ gib })) { throw new Error(`can't sync primitive ibgib (${addr}) (E: 915b331b00118b5f69e630ef5d2b8d24)`); }
        if (isSpaceIb({ ib })) { throw new Error(`can't sync entire space ibgib (${addr}) (E: bd1b991e35a683df5a79c379c21d3924)`); }
        if (syncSpaces.length === 0) { throw new Error(`syncSpaces required (E: 671b4f4adc6e009ed304419d662b2d24)`); }
        if (syncSpaces.some(x => !x.witness)) { throw new Error(`(UNEXPECTED) syncSpaces.some(x => !x.witness)? sync spaces should all be witnesses (and have a witness function). these are not supposed to be just dtos (with ib, gib, data, rel8ns props). (E: 879c32b69856218f7eeafb89db491524)`); }

        if (verbose) { await sagaReporter('getDependencyGraph starting... (I: 35cb6f89e87d7300b3be4088b4176a24)', null); }

        const dependencyGraph = await metaspace.getDependencyGraph({
            space: localSpace,
            ibGibAddr: addr,
            live: true,
            msBetweenRetries: 1_000,
        });

        if (verbose) {
            await sagaReporter('getDependencyGraph complete. (I: ec9aadd538ac3a61da3873c53852d324)', null);
            await sagaReporter('syncIbGibs spinning off... (I: a15ddf897f8797848b350ad6a2067b24)', null);
        }

        const sagas = await metaspace.syncIbGibs({
            dependencyGraphIbGibs: Object.values(dependencyGraph),
            syncSpaceIbGibs: syncSpaces,
            localSpace,
        }) ?? [];
        if (sagas.length === 0) { throw new Error(`(UNEXPECTED) metaspace.syncIbGibs returned undefined (no sagas)? (E: 4d7faeb9ed95fe4b162f2a1377928b24)`); }
        if (verbose) {
            await sagaReporter('syncIbGibs spin off complete. these are not yet done, it/they are just spun off and going. (I: a958a6b706c9b66933cb82ea7bbfcc24)', sagas.at(0) ?? null);
        }

        let sagaCount = sagas.length;
        let sagaErrorCounter = 0;
        /**
         * using this during debugging...
         */
        const sagaErrorMsgs: string[] = [];
        let sagaCompleteOrErrorCounter = 0;
        let allSagasCompletePromise = new Promise<void>((resolve, reject) => {
            const interval = setInterval(async () => {
                if (sagaCompleteOrErrorCounter === sagaCount) {
                    if (sagaErrorCounter > 0) {
                        reject(`saga had errors: ${sagaErrorMsgs.join('|')} (E: c039232a158cd69669e233a84f9be924)`);
                    }
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });

        const fnIncCompleteOrError = async (saga: SyncSagaInfo) => {
            const lcInner = `${lc}[fnIncCompleteOrError]`;
            if (logalot || verbose) { console.log(`${lcInner} starting... (I: 1c41e7aaab13ecdf4f3608533f38b324)`); }
            try {
                sagaCompleteOrErrorCounter++;
                let updateText: string;
                if (sagaCompleteOrErrorCounter < sagaCount) {
                    updateText = `saga (${saga.sagaId}) complete or errored. ONLY SOME (${sagaCompleteOrErrorCounter}/${sagaCount}) have completed or errored. still more to go...`;
                } else if (sagaCompleteOrErrorCounter === sagaCount) {
                    updateText = `saga (${saga.sagaId}) complete or errored. ALL ${sagaCount} sync sagas COMPLETE OR ERRORED.`;
                } else {
                    debugger; // unexpected error state. sagaCompleteOrErrorCounter > sagaCount
                    updateText = `uhh, there is an error here. we have incremented sagaCompleteOrErrorCounter (${sagaCompleteOrErrorCounter}) to be greater than sagaCount (${sagaCount}) (E: b8e934cfce188f40a93cb90a462c7c24)`;
                }
                if (logalot || verbose) {
                    console.log(`${lc} ${updateText} (I: 519a895d1a7ddc44cf8b4532cf3b6524)`);
                    await sagaReporter(`${lcInner} ${updateText}`, saga);
                }
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                throw error;
            } finally {
                if (logalot || verbose) { console.log(`${lc}[fnIncCompleteOrError] complete. (I: f2be67aa53e59ab2e5a7f89b26b4df24)`); }
            }
        };

        for (let i = 0; i < sagas.length; i++) {
            const saga = sagas[i];
            let subscription: SubscriptionWitness = await saga.syncStatus$.subscribe(fnObs({
                next: async (status: SyncStatusIbGib) => {
                    if (logalot || verbose) {
                        console.log(`${lc} console.dir(status)... (I: e786c4449ebf14be5b2d63a61d22c824)`);
                        console.dir(status);
                    } else {
                        let statusCode = status.data?.statusCode;
                        if (statusCode === "already_synced") {
                            process.stdout.write('.');
                        } else {
                            console.log(statusCode);
                        }
                    }
                },
                complete: async () => {
                    if (logalot || verbose) {
                        console.log(`${lc}[saga complete] triggered for saga (${saga.spaceId}, ${saga.multiSpaceOpId}). (I: 999536aeb555ac9eaac88c98aee71224)`);
                    }
                    await fnIncCompleteOrError(saga);
                    await subscription.unsubscribe();
                },
                error: async (err: string | Error | ErrorIbGib_V1) => {
                    const errorMsg = extractErrorMsg(err);
                    sagaErrorMsgs.push(errorMsg);
                    if (errorMsg.includes('EAI_AGAIN')) {
                        console.error(`this error may be because of no internet connection. ${errorMsg}`)
                    }
                    console.error(`${lc}[error] err: ${errorMsg} (E: 90b11d262194884ae8320ccbf7252124)`);
                    sagaErrorCounter++;
                    await fnIncCompleteOrError(saga);
                    await subscription.unsubscribe();
                    // sagaCompleteOrErrorCounter++;
                }
            }));
        }
        await allSagasCompletePromise;
        return sagas;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot || verbose) { console.log(`${lc} complete.`); }
    }
}
