import { mkdir } from 'fs/promises';

import { Build } from './types.mjs';
import * as constants from './constants.mjs';

const lcFile = `[build][build-app.mts]`;

class BuildApp extends Build {
    protected lc: string = lcFile;
    protected name: string = 'app';
    protected entryPoints: string[] = [`${constants.SRC_DIR}/index.mts`];
    protected outdir: string = constants.DIST_DIR;
    protected assetPaths: string[] = [
        `${constants.SRC_DIR}/index.html`,
        `${constants.SRC_DIR}/root.css`, // shared root css variables
        `${constants.SRC_DIR}/styles.css`,
        `${constants.SRC_DIR}/assets`,
    ];

    async createDynamicFiles(): Promise<void> {
        const lc = `${this.lc}[${this.createDynamicFiles.name}]`;
        try {
            console.log(`${lc} starting...`);
            const linkGibDir = `${this.outdir}/apps/web1/gib`;
            await mkdir(linkGibDir, { recursive: true });
            console.log(`${lc} created dir for link-gib: ${linkGibDir}`);
        } catch (error) {
            console.error(`${lc} ${(error as Error).message}`);
            throw error;
        }
    }

}

const buildApp = new BuildApp();
buildApp.build();
