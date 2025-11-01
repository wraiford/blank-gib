/**
 * @module storage-helpers.web.mts
 *
 * This is the storage abstraction that wraps indexed db.
 *
 * NOTE:
 *
 * I just want to say that callbacks are not very cool and that much of the
 * ridiculousness of this code is due to this fact.
 *
 * That said, these functions try to ensure db is closed per function via global
 * finally block. With nested promises and callbacks, this is a big f*n mess.
 * But more importantly, this is why there aren't db.close() calls sprinkled
 * throughout each function. But ths assumes that I am wiring up resolve/reject
 * calls correctly through all the paths and this is far from certain.
 */

import { extractErrorMsg } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { ZERO_SPACE_ID } from "@ibgib/core-gib/dist/witness/space/space-constants.mjs";

import { GLOBAL_LOG_A_LOT, ARMY_STORE, BLANK_GIB_DB_NAME } from "../constants.mjs";
import { uint8ArrayToString } from "../helpers.web.mjs";
import { Dirent } from "./storage-types.web.mjs";


let logalot = GLOBAL_LOG_A_LOT;

/**
 * key/value pair interface for working with indexeddb
 */
export interface IndexedDBStorageDatum {
    key: string;
    /**
     * may have to change this to work with binary array buffers.
     */
    value: string | Uint8Array;
}

let initRequestCount: number = 0;

export async function askForPersistStorage(): Promise<void> {
    const lc = `[${askForPersistStorage.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 94b9aca3633e3d4cd3d420329a9c7425)`); }
        const _unusedtesting = await navigator.storage.persist();
        if (navigator.storage?.persist) {
            const alreadyPersisted = await navigator.storage.persisted();
            if (alreadyPersisted) {
                if (logalot) { console.log(`${lc} navigator.storage is already persisted (I: 2e55a7106e6d07715356b5feb5300b25)`); }
            } else {
                if (logalot) { console.log(`${lc} navigator.storage not already persisted. asking navigator.storage for persist... (I: 78086d15e2e94c14a0028c584099d715)`); }
                const persisted = await navigator.storage.persist();
                if (logalot) { console.log(`${lc} navigator.storage persist: ${persisted} (I: 923eb26c2c3240c9b5659c3266388071)`); }
            }
        } else {
            if (logalot) { console.warn(`${lc} navigator.storage.persist not supported. (W: f5a9c3a8f7614d30b9f205f3f6c61b34)`); }
        }

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * initializes db ALWAYS but initializes store given by {@link storeName} ONLY
 * WHEN VERSION IS HIGHER THAN EXISTING VERSION.
 *
 * @see {@link storageCreateStoreIfNotExist}
 */
export async function initializeStorage({
    dbName,
    storeName,
    version,
    logalot = false,
}: {
    dbName: string,
    storeName?: string,
    version?: number,
    logalot?: boolean,
}): Promise<void> {
    const lc = `[${initializeStorage.name}][${dbName}][${storeName ?? 'no store name'}]`;
    const uuid = crypto.randomUUID();
    if (logalot) { console.time(lc + uuid); }
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f35d4e1ba37252f14c8532fb861b1125)`); }

        const prom = new Promise<void>((resolve, reject) => {
            try {
                if (logalot) { console.log(`${lc} starting... (I: 0aeddd9376daa0a044677ce4cf8a4c24)`); }

                // Open a database connection
                if (logalot) { console.timeLog(lc + uuid, 'opening... (I: e748b4ddb445d77cb10a7ba158b49125)') }
                // so when we get here via storageCreateStoreIfNotExist function,
                // the version is going to be a bumped number. so is this what is
                // necessarily triggering the onblocked?
                const openDBRequest = indexedDB.open(dbName, /*version*/version);
                initRequestCount++;
                console.log(`${lc} initRequestCount: ${initRequestCount} (I: 294d5f0b12ffe5512bacebe891824d25)`);
                let storeAlreadyExisted: boolean | undefined = undefined;
                openDBRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                    try {
                        db = (event.target as any).result as IDBDatabase;
                        if (logalot) { console.timeLog(lc + uuid, 'onupgradeneeded... (I: e748b4ddb445d77cb10a7ba158b49125)') }

                        // Create a store if it doesn't exist. note that
                        // db.createObjectStore can only be called within this
                        // onupgradeneeded handler.
                        if (storeName) {
                            if (!db.objectStoreNames.contains(storeName)) {
                                storeAlreadyExisted = false;
                                db.createObjectStore(storeName, { keyPath: 'key' });
                            } else {
                                storeAlreadyExisted = true;
                            }
                        }
                    } catch (error) {
                        console.error(`${lc}[openDBRequest.onupgradeneeded] ${extractErrorMsg(error)} (E: 4a5fa1b0850be47e28bee653da287325)`);
                        reject(error);
                    }
                };

                openDBRequest.onblocked = (event: IDBVersionChangeEvent) => {
                    console.log(`${lc}[openDBRequest.onblocked] openDBRequest blocked...time wasted a bit here. version change event (old -> new):  ${event.oldVersion} -> ${event.newVersion} (I: 9074ebf4afdba54d6f9d41b360b96a25)`);
                    console.dir(event);
                };

                /**
                 * this handler fires independently of upgradeneeded
                 */
                openDBRequest.onsuccess = (ev) => {
                    try {
                        if (logalot) { console.log('init success (I: 297a5a71e405a0b56413af813f248d24)'); }
                        if (logalot) { console.timeLog(lc + uuid, 'onupgradeneeded... (I: e748b4ddb445d77cb10a7ba158b49125)') }
                        db = (ev.target as any).result as IDBDatabase;
                        if (storeName) {
                            storeAlreadyExisted ??= db.objectStoreNames.contains(storeName);
                            if (logalot) { console.log(`${lc} ${dbName} store "${storeName}" ${storeAlreadyExisted ? 'already exists' : 'does not exist'}. (I: db64712bc69c5287b1cf77af1fc13d24)`); }
                        }
                        resolve();
                    } catch (error) {
                        console.error(`${lc}[openDBRequest.onsuccess] ${extractErrorMsg(error)}`);
                        reject(error);
                    }
                };

                openDBRequest.onerror = (event: any) => { // IDBRequestEvent but doesn't compile
                    debugger; // error initializeStorage openDBRequest.onerror
                    console.error(`${lc}[initRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: 74cf09e9fba2dd9e41225e943c331124)`);
                    reject(openDBRequest.error); // same as below?
                    // reject(event.target.error);
                };
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                debugger; // error
                reject(error);
            } finally {
                if (logalot) { console.log(`${lc} complete.`); }
            }
        });
        await prom;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 3f1c18eec567ea63f3927eef0f038925)`); }
            (db as any).close();
            if (logalot) {
                console.log(`${lc} closing db ${dbName} complete. (I: bc3b2f504245d6203dbba6bd65d30325)`);
                console.timeLog(lc + uuid, 'db closed. (I: e748b4ddb445d77cb10a7ba158b49125)')
            }
        }
        if (logalot) {
            console.log(`${lc} complete.`);
            console.timeEnd(lc + uuid);
        }
    }

}

/**
 * wrapper for filtered indexedDB.databases() call basically
 *
 * @returns db info for given dbName
 */
export async function storageGetDBInfo({
    dbName,
    logalot = false,
}: {
    dbName: string,
    logalot?: boolean,
}): Promise<IDBDatabaseInfo | undefined> {
    const lc = `[${storageGetDBInfo.name}]`;

    const uuid = crypto.randomUUID();
    if (logalot) { console.time(lc + uuid); }
    try {
        if (logalot) { console.log(`${lc} starting... (I: 8516795b20529d19eb6923defd7a0f24)`); }
        const dbInfo = (await indexedDB.databases()).filter(x => x.name === dbName).at(0);
        return dbInfo;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
    } finally {
        if (logalot) { console.timeEnd(lc + uuid); }
        if (logalot) { console.log(`${lc} complete.`); }
    }
}


/**
 * wrapper that ensures indexeddb store exists
 */
export async function storageCreateStoreIfNotExist({
    dbName,
    storeName,
    logalot = false,
}: {
    dbName: string,
    storeName: string,
    logalot?: boolean,
}): Promise<void> {
    const lc = `[${storageCreateStoreIfNotExist.name}]`;
    const uuid = crypto.randomUUID();
    if (logalot) { console.time(lc + uuid); }
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 029f7caa8ea5ea08a865f3924c82b624)`); }

        const dbInfo_viaIndexedDBDatabasesFn = (await indexedDB.databases()).filter(x => x.name === dbName).at(0);
        if (!dbInfo_viaIndexedDBDatabasesFn) { throw new Error(`db (${dbName}) does not exist. can't create store (${storeName}) (E: 5b15f7aed6f7068d077b2c7ebcbe8524)`); }

        let storeExists = false;

        if (logalot) { console.timeLog(lc + uuid); }

        await new Promise<void>((resolve, reject) => {
            const openDBRequest = indexedDB.open(dbName);
            openDBRequest.onsuccess = (ev: Event) => {
                db = (ev.target as any).result as IDBDatabase;
                storeExists = db.objectStoreNames?.contains(storeName);
                if (logalot) { console.timeLog(lc + uuid, 'open db request'); }
                resolve();
            };
            openDBRequest.onerror = (event: any) => { // IDBRequestEvent but doesn't compile
                debugger; // error storageCreateStoreIfNotExist openDBRequest.onerror
                console.error(`${lc}[openDBRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: 63695744e9e59ff8019e04ceeb8e2524)`);
                // reject(event.target.error); // same as openDBRequest.error?
                reject(openDBRequest.error);
            };
        });

        if (logalot) { console.timeLog(lc + uuid); }

        if (storeExists) {
            if (logalot) { console.log(`${lc} store ${storeName} already existed. (I: a2263b510c18240fc59fca54e3892324)`); }
            return; /* <<<< returns early */
        }

        // store does not exist, so get the version number, bump it, and in the upgradeneeded handler, create the store
        const dbInfo = await storageGetDBInfo({ dbName, logalot }); // does not need db closed yet
        if (logalot) { console.timeLog(lc + uuid, 'storageGetDBInfo complete'); }
        if (!dbInfo) { throw new Error(`db (${dbName}) does not exist. can't create store (${storeName}) (E: c771db13fa28f67079aad45e1ab7e624)`); }
        const version = dbInfo.version;
        if (!version) { throw new Error(`db (${dbName}) has no version. can't create store (${storeName}) (E: 3d2ec52853ad99f92b19ac5aa7fbfe24)`); }
        const newVersion = version + 1;
        if (logalot) { console.log(`${lc} creating store ${storeName} with version ${newVersion} (I: 312b79f28243c650cf38935114f21e24)`); }
        // we need to manually close db here before calling the inititalizeStorage
        if (db) {
            (db as any).close();
            db = undefined;
        } else {
            throw new Error(`(UNEXPECTED) how did we get here with db falsy? (E: b561784879e19bac54b1c4936aff0c25)`);
        }
        await initializeStorage({ dbName, storeName, version: newVersion, logalot });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error; // why wasn't I rethrowing??
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 3f1c18eec567ea63f3927eef0f038925)`); }
            (db as any).close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: bc3b2f504245d6203dbba6bd65d30325)`); }
        }
        if (logalot) { console.timeLog(lc + uuid); }
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * set key/value item
 * helper for indexeddb storage.
 */
export async function storagePut({
    dbName,
    version,
    storeName,
    key,
    value,
    logalot = false,
}: {
    dbName: string,
    version?: number,
    storeName: string,
    key: string,
    value: string | Uint8Array,
    logalot?: boolean,
}): Promise<void> {
    const lc = `[${storagePut.name}]`;
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: bf7316c244888cb8ead2d3aac1d9f625)`); }

        const prom = new Promise<void>((resolve, reject) => {
            try {
                if (logalot) { console.log(`${lc} starting... (I: 81df59e3961d711ce5d8f2ae3e2f3824)`); }

                const openDBRequest = indexedDB.open(dbName, /*version*/version);
                openDBRequest.onsuccess = (event: any) => { // IDBOpenDBRequestEvent?
                    db = event.target.result as IDBDatabase;
                    try {
                        const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
                        const data: IndexedDBStorageDatum = { key, value };
                        store.put(data);
                        resolve();
                    } catch (error) {
                        console.error(`${lc}[putRequest.onsuccess] ${extractErrorMsg(error)}`);
                        reject(error);
                    }
                };

                openDBRequest.onerror = (event: any) => { // IDBRequestEvent?
                    debugger; // storagePut openDBRequest error
                    // is openDBRequest.error same as event.target.error?
                    console.error(`${lc}[putRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: 7a946d99ede2b248df4dcfea4ac99724)`);
                    reject(openDBRequest.error);
                };
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                reject(error);
            } finally {
                if (logalot) { console.log(`${lc} complete.`); }
            }
        });

        await prom;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 438c6edced94b83a3478c71b08c6c325)`); }
            (db as any).close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: 0d081553b1eb53c65ade2cedb802cf25)`); }
        }
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * get item via key
 * helper for indexeddb storage.
 */
export async function storageGet({
    dbName,
    version,
    storeName,
    key,
    logalot = false,
}: {
    dbName: string,
    version?: number,
    storeName: string,
    key: string,
    logalot?: boolean,
}): Promise<string | undefined> {
    const lc = `[${storageGet.name}]`;
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: f8ba7cd5801918a8580e91b7c90aa525)`); }
        const prom = new Promise<string | undefined>((resolve, reject) => {
            try {
                if (logalot) { console.log(`${lc} starting... (I: 24163c4a11c8712097db45febaf9c724)`); }

                // Retrieve the value later
                const openDBRequest = indexedDB.open(dbName, version);
                openDBRequest.onsuccess = (event: any) => { // IDBOpenDBRequestEvent?
                    db = event.target.result as IDBDatabase;

                    let store: IDBObjectStore;
                    try {
                        store = db.transaction(storeName).objectStore(storeName);
                    } catch (error) {
                        debugger; // error getting objectStore
                        console.error(`${lc}[openDBRequest.onsuccess][objectStore] ${extractErrorMsg(error)}`);
                        reject(error);
                        return; /* <<<< returns early */
                    }

                    // Get the value using the key
                    const getRequest = store.get(key);
                    getRequest.onsuccess = (event: any) => { // IDBRequestEvent?
                        try {
                            let value = (event.target?.result as IndexedDBStorageDatum)?.value ?? undefined;
                            if (!value) {
                                resolve(value);
                                return; /* <<<< returns early */
                            }

                            if (logalot) { console.log('Retrieved value:', value); }
                            if (value instanceof Uint8Array) {
                                resolve(uint8ArrayToString(value as Uint8Array));
                            } else {
                                if (typeof value !== 'string') { throw new Error(`(UNEXPECTED) truthy, non-Uint8Array value is not a string? (E: 6a4ec24e2e5d9848f8b542bc2661dc24)`); }
                                resolve(value);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };

                    getRequest.onerror = (event: any) => {
                        debugger; // storageGet getRequest.onerror
                        const error = getRequest.error;
                        console.error(`${lc}[openDBRequest.onsuccess][getRequest.onerror] ${extractErrorMsg(error)}`);
                        reject(error);
                    };
                };

                openDBRequest.onerror = (event: any) => { // IDBRequestEvent but doesn't compile
                    debugger; // error indexeddb storageGet openDBRequest.onerror
                    // are openDBRequest.error and event.target.error the same?
                    console.error(`${lc}[openDBRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: 074963a908fa9a075f01c73cae829224)`);
                    reject(openDBRequest.error);
                };

            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                reject(error);
            } finally {
                if (logalot) { console.log(`${lc} complete.`); }
            }
        });

        const result = await prom;
        return result;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: a938fc22dfdc76b15f6926bc4d458225)`); }
            (db as any).close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: 18f2ec1557bc83ec4e2c5d5e72264525)`); }
        }
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * checks if db exists. if store is provided, checks to see if that specific
 * store exists in the db's schema.
 *
 * helper for indexeddb storage.
 */
export async function storageDBExists({
    dbName,
    store,
}: {
    dbName: string,
    store?: string,
}): Promise<boolean> {
    const lc = `[${storageDBExists.name}]`;
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 2b4373affa3841220f0b7ca690406624)`); }

        const dbs = await window.indexedDB.databases();
        const dbExists = dbs.some(db => db.name === dbName);
        if (dbExists) {
            if (store) {
                return await new Promise((resolve, reject) => {
                    const openDBRequest = indexedDB.open(dbName);
                    openDBRequest.onsuccess = (event: any) => { // IDBOpenDBRequestEvent?
                        db = event.target.result as IDBDatabase;
                        const storeExists = db.objectStoreNames.contains(store);
                        resolve(storeExists);
                    };
                    openDBRequest.onerror = (event: any) => { // IDBRequestEvent but doesn't compile
                        debugger; // onerror
                        db = openDBRequest.result;
                        const { error } = event.target;
                        console.error(`${lc}[openDBRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: c783fe607451e46c1feae3a81e0f7924)`);
                        reject(error);
                    };
                });
            } else {
                return true;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 8782d9eea285cf9eb638d493a421a625)`); }
            // for some reason, typescript incorrectly thinks db is type
            // "never", so this any cast is necessary
            (db as any).close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: 76a0c5dea2643e2bb84c82c8446a8125)`); }
        }
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * helper function equivalent to rm -rf in our filesystem space
 */
export async function storageRmRF({
    dbName,
    storeName,
    pathToRm,
}: {
    dbName: string;
    storeName: string;
    pathToRm: string;
}): Promise<void> {
    const lc = `[${storageRmRF.name}]`;
    /**
     * turning it off for this function...note that this does not call any other
     * functions in this file that would be affected.
     */
    const logalotInitDebug = logalot;
    // logalot = false;
    if (logalot) { console.log(`${lc} starting... (I: c7e4cb759789ece0a8189d7dfb4d2a24)`); }
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    return new Promise<void>((resolve, reject) => {
        try {
            if (!dbName) { throw new Error(`(UNEXPECTED) dbName falsy? (E: ed336d88c9c4e8d4916b29356dc58324)`); }
            if (!storeName) { throw new Error(`(UNEXPECTED) storeName falsy? (E: ad493bb79b63a192524b14c59a706524)`); }
            if (!pathToRm) { throw new Error(`(UNEXPECTED) pathToRm falsy? (E: 88c9631d93467e17996946882254af24)`); }
            const openDBRequest = indexedDB.open(dbName);

            openDBRequest.onerror = () => {
                debugger; // error
                if (openDBRequest.result) { // Only close if a DB object was obtained
                    (openDBRequest.result as IDBDatabase).close();
                }
                console.error(`${lc}[openDBRequest.onerror] ${extractErrorMsg(openDBRequest.error)} (E: 4c5ab71a765e61b4292008fd4fafe324)`);
                reject(openDBRequest.error);
            };

            openDBRequest.onsuccess = () => {
                db = openDBRequest.result;
                const transaction = db.transaction(storeName, "readwrite");
                const objectStore = transaction.objectStore(storeName);

                // Use IDBKeyRange.lowerBound() for efficiency
                const range = IDBKeyRange.lowerBound(pathToRm);
                const openCursorRequest = objectStore.openCursor(range);

                openCursorRequest.onerror = () => {
                    debugger; // error
                    console.error(`${lc}[openCursorRequest.onerror] ${extractErrorMsg(openCursorRequest.error)} (E: caefdda2bb95f92e9fb8d89ee412b524)`);
                    reject(openCursorRequest.error);
                };

                openCursorRequest.onsuccess = () => {
                    try {
                        let rmCount = 0;
                        // does it matter if the path is a dir vs. a file?
                        const cursor = openCursorRequest.result;
                        if (cursor) {
                            if (cursor.key.toString().startsWith(pathToRm)) {
                                const deleteRequest = cursor.delete();
                                rmCount++;

                                deleteRequest.onerror = () => {
                                    debugger; // error
                                    console.error(`${lc}[deleteRequest.onerror] ${extractErrorMsg(deleteRequest.error)} (E: abc031c53e5387322cd8909b3ada9b24)`);
                                    reject(deleteRequest.error);
                                };
                                cursor.continue();
                            } else {
                                // No more keys starting with dirPath, we can stop
                                if (logalot) { console.log(`${lc} rmCount: ${rmCount} (I: e4bc613a5514c0942484b79267e16724)`); }
                                resolve();
                            }
                        } else {
                            if (logalot) { console.log(`${lc} cursor is falsy, so either we have no more records or had no records to begin with. (I: 9ff3aec6274416501a7baf6dcc5f2624)`); }
                            resolve();
                        }
                    } catch (error) {
                        console.error(`${lc}[openCursorRequest.onsuccess] ${extractErrorMsg(error)}`);
                        reject(error);
                    }
                };
            };
        } catch (error) {
            debugger; // error storageRmDir
            console.error(`${lc} ${extractErrorMsg(error)}`);
            reject(error);
        }
    }).finally(() => {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 39b4ba83de4bdfd541e3384ebab27425)`); }
            db.close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: e4015b9436c4b2bc0ccf0e11e2037925)`); }
        }
        if (logalot) { console.log(`${lc} complete.`); }
        logalot = logalotInitDebug;
    });
}

/**
 * helper function equivalent to readdir in our filesystem space
 */
export async function storageReaddir({
    dbName,
    storeName,
    dirPath,
    withFileTypes = false,
}: {
    dbName: string;
    storeName: string;
    dirPath: string;
    withFileTypes?: boolean;
}): Promise<string[] | Dirent[]> {
    const lc = `[${storageReaddir.name}]`;
    /** db variable outside try block for finally access in order to close it. */
    let db: IDBDatabase | undefined = undefined;
    try {
        const prom = new Promise<string[] | Dirent[]>((resolve, reject) => {
            const openDBRequest = indexedDB.open(dbName);

            openDBRequest.onerror = () => {
                debugger; // error
                // if (openDBRequest.result) { // Only close if a DB object was obtained
                //     (openDBRequest.result as IDBDatabase).close();
                // }
                reject(openDBRequest.error);
            };

            openDBRequest.onsuccess = () => {
                db = openDBRequest.result;
                const transaction = db.transaction(storeName, "readonly");
                const objectStore = transaction.objectStore(storeName);

                const normalizedDirPath = dirPath.endsWith("/") ? dirPath : dirPath + "/";
                const range = IDBKeyRange.lowerBound(normalizedDirPath);
                const openCursorRequest = objectStore.openCursor(range);
                const entries: Set<string> = new Set();
                const dirents: Dirent[] = [];

                openCursorRequest.onerror = () => {
                    debugger; // error
                    console.error(`${lc}[openCursorRequest.onerror] ${extractErrorMsg(openCursorRequest.error)}`);
                    reject(openCursorRequest.error);
                };

                // cursor.continue() repeatedly calls this handler ick
                openCursorRequest.onsuccess = () => {
                    try {
                        const cursor = openCursorRequest.result;
                        if (cursor) {
                            const key = cursor.key.toString();
                            if (key.startsWith(normalizedDirPath) && key !== normalizedDirPath) {
                                const relativePath = key.substring(normalizedDirPath.length);
                                const childSegment = relativePath.split("/")[0];
                                if (withFileTypes) {
                                    // Determine if it's a file or directory
                                    const isDirectory = relativePath.substring(childSegment.length).startsWith("/");
                                    dirents.push({
                                        name: childSegment,
                                        isDirectory: () => isDirectory,
                                        isFile: () => !isDirectory,
                                        isBlockDevice: () => false,
                                        isCharacterDevice: () => false,
                                        isSymbolicLink: () => false,
                                        isFIFO: () => false,
                                        isSocket: () => false,
                                    });
                                } else {
                                    entries.add(childSegment);
                                }
                                cursor.continue();
                            } else if (!key.startsWith(normalizedDirPath)) {
                                resolve(withFileTypes ? dirents : Array.from(entries));
                            } else {
                                cursor.continue();
                            }
                        } else {
                            resolve(withFileTypes ? dirents : Array.from(entries));
                        }
                    } catch (error) {
                        console.error(`${lc}[openCursorRequest.onsuccess] ${extractErrorMsg(error)}`);
                        reject(error);
                    }
                };
            };
        });

        const result = await prom;

        return result;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (db) {
            if (logalot) { console.log(`${lc} closing db ${dbName}... (I: 39b4ba83de4bdfd541e3384ebab27425)`); }
            // for some reason, typescript incorrectly thinks db is type
            // "never", so this any cast is necessary
            (db as any).close();
            if (logalot) { console.log(`${lc} closing db ${dbName} complete. (I: e4015b9436c4b2bc0ccf0e11e2037925)`); }
        }
    }
}


/**
 * init for storage (IndexedDB).
 *
 * this includes init for metaspace.
 */
export async function initBlankGibStorage(): Promise<void> {
    const lc = `[${initBlankGibStorage.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 681fe7a1fcadb7f0659e491411f34f25)`); }

        const dbExists = await storageDBExists({
            dbName: BLANK_GIB_DB_NAME,
        });
        if (!dbExists) {
            await initializeStorage({
                dbName: BLANK_GIB_DB_NAME,
            });
        }
        await storageCreateStoreIfNotExist({
            dbName: BLANK_GIB_DB_NAME,
            storeName: ARMY_STORE,
        });

        await storageCreateStoreIfNotExist({
            dbName: BLANK_GIB_DB_NAME,
            storeName: ZERO_SPACE_ID,
            logalot,
        });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
