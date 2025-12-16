import { readdir, open } from 'node:fs/promises';
import { statSync } from 'node:fs';
import * as pathUtils from 'path';
import * as esbuild from 'esbuild';

import { extractErrorMsg, unique } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

import { Build } from './types.mjs';
import * as constants from './constants.mjs';

const lcFile = `[build][build-test.mts]`;

const RESPEC_FILE_REG_EXP = /^.+respec\.mts$/;

class BuildTest extends Build {
    protected lc: string = lcFile;
    protected name: string = 'test';
    protected entryPoints: string[] = []; // dynamically set in getEntryPoints
    protected outdir: string = constants.DIST_DIR; // output to same dir as app
    protected assetPaths: string[] = [];

    constructor() {
        super();
        const lc = `${this.lc}[ctor]`;
        console.log(`${lc} isProd: ${this.isProd}`);
    }

    async getEntryPoints(): Promise<string[]> {
        const lc = `${this.lc}[${this.getEntryPoints.name}]`;
        try {
            console.log(`${lc} starting...`);

            const respecFiles = await this.getRespecFileFullPaths(constants.SRC_DIR, []);
            console.log(`${lc} found ${respecFiles.length} respecFiles: ${respecFiles.join('\n')}`);

            const allEntryPoints = [
                `${constants.SRC_DIR}/respec-gib.node.mts`,
                ...respecFiles
            ];

            console.log(`${lc} all entry points (${allEntryPoints.length})`);

            return allEntryPoints;
        } catch (error) {
            console.error(`${lc} ${(error as Error).message}`);
            throw error;
        }
    }

    async build(): Promise<void> {
        const lc = `${this.lc}[${this.build.name}]`;
        try {
            console.log(`${lc} starting...`);
            this.entryPoints = await this.getEntryPoints();
            await this.bundle(); // only bundle, no assets/dynamic files needed for tests
        } catch (error) {
            console.error(`${lc} ${(error as Error).message}`);
            throw error;
        }
    }

    async bundle(): Promise<void> {
        const lc = `${this.lc}[${this.bundle.name}]`;
        try {
            console.log(`${lc} starting... (isProd: ${this.isProd})`);

            // Common build options
            const options: esbuild.BuildOptions = {
                entryPoints: this.entryPoints,
                outdir: this.outdir,
                bundle: true,
                platform: 'node', // override base build platform
                format: 'esm',
                target: 'esnext',
                loader: { '.html': 'text', '.css': 'text' },
                outExtension: { '.js': '.mjs' },
                keepNames: true,
            };

            // Prod vs. Dev specific options
            if (this.isProd) {
                options.minify = true;
                options.sourcemap = true; // external source maps
            } else {
                options.minify = false;
                options.sourcemap = 'inline'; // inline source maps
            }

            const buildResult = await esbuild.build(options);

            if (buildResult.errors.length > 0) {
                const errorMsgs = buildResult.errors.map(x => `esbuild error: ${x.text} at ${x.location?.file}:${x.location?.line}:${x.location?.column}`).join('\n');
                throw new Error(errorMsgs);
            }
            if (buildResult.warnings.length > 0) {
                const warningMsgs = buildResult.warnings.map(x => `esbuild warning: ${x.text} at ${x.location?.file}:${x.location?.line}:${x.location?.column}`).join('\n');
                console.warn(`${lc} ${warningMsgs}`);
            }
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    async getRespecFileFullPaths(dirPath: string, found: string[]): Promise<string[]> {
        const lc = `[${this.getRespecFileFullPaths.name}][${dirPath}]`;
        try {
            found ??= [];
            const children = await readdir(dirPath);
            const files: string[] = [];
            const dirs: string[] = [];
            children.forEach(name => {
                const fullPath = pathUtils.join(dirPath, name);
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    if (!stat.isSymbolicLink()) { dirs.push(fullPath); }
                } else if (!!name.match(RESPEC_FILE_REG_EXP)) {
                    files.push(fullPath);
                }
            });

            found = found.concat(files);
            for (let i = 0; i < dirs.length; i++) {
                const subfound = await this.getRespecFileFullPaths(dirs[i], found);
                found = found.concat(subfound);
            }

            const uniqueFilepaths = unique(found);
            return uniqueFilepaths;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

}

const buildTest = new BuildTest();
buildTest.build();
