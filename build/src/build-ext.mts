import { cp, mkdir, readFile, writeFile } from 'fs/promises';

import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { Build } from './types.mjs';
import * as constants from './constants.mjs';
import { getJson } from './helpers.mjs';

const lcFile = `[build][build-ext.mts]`;

interface Manifest {
    version: string;
    [key: string]: any;
}

class BuildExt extends Build {
    protected lc: string = lcFile;
    protected name: string = 'ext';
    protected entryPoints: string[] = [
        `${constants.SRC_DIR}/extension/background.mts`,
        `${constants.SRC_DIR}/extension/index.sidepanel.ext.mts`,
        `${constants.SRC_DIR}/extension/content-script.mts`,
    ];
    protected outdir: string = constants.DIST_EXT_DIR;
    protected assetPaths: string[] = [
        `${constants.SRC_DIR}/root.css`, // shared root css variables
        `${constants.SRC_DIR}/extension/styles.css`,
        `${constants.SRC_DIR}/extension/index.sidepanel.ext.html`,
        `${constants.SRC_DIR}/assets`,
        `${constants.SRC_DIR}/extension/content-script.css`,
    ];

    constructor() {
        super();
        const lc = `${this.lc}[ctor]`;
        console.log(`${lc} isProd: ${this.isProd}`);
    }

    async createDynamicFiles(): Promise<void> {
        const lc = `${this.lc}[${this.createDynamicFiles.name}]`;
        try {
            console.log(`${lc} starting...`);

            // create outdir if it doesn't exist
            await mkdir(this.outdir, { recursive: true });

            // read manifest, update version, and write to dist
            const manifest = await getJson<Manifest>(`${constants.SRC_DIR}/extension/manifest.json`);
            const packageJson = await constants.getPackageJson();
            manifest.version = packageJson.version;
            await writeFile(`${this.outdir}/manifest.json`, JSON.stringify(manifest, null, 4));

            console.log(`${lc} manifest.json created.`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }
}

const buildExt = new BuildExt();
buildExt.build();
