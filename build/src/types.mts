import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'fs/promises';

import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';

const lcFile = `[build][types.mts]`;

export abstract class Build {
    protected lc: string = `${lcFile}[${Build.name}]`;

    /**
     * Name of the build, which will be the output subfolder, e.g., `app`, `ext`
     */
    protected abstract name: string;
    /**
     * Entry points for esbuild.
     */
    protected abstract entryPoints: string[];
    /**
     * Output directory for the build.
     */
    protected abstract outdir: string;
    /**
     * Any static assets that need to be copied. These are relative to the project root.
     */
    protected abstract assetPaths: string[];

    async build(): Promise<void> {
        const lc = `${this.lc}[${this.build.name}]`;
        try {
            console.log(`${lc} starting...`);

            await this.copyAssets();

            await this.createDynamicFiles();

            await this.bundle();

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
        } finally {
            console.log(`${lc} finished.`);
        }
    }

    /**
     * Copies static assets to the output directory.
     */
    async copyAssets(): Promise<void> {
        const lc = `${this.lc}[${this.copyAssets.name}]`;
        try {
            console.log(`${lc} starting...`);

            if (!this.assetPaths || this.assetPaths.length === 0) {
                console.log(`${lc} no assetPaths. skipping.`);
                return;
            }

            // create outdir if it doesn't exist
            await mkdir(this.outdir, { recursive: true });

            // copy asset files
            await Promise.all(this.assetPaths.map(async (assetPath) => {
                const filename = assetPath.substring(assetPath.lastIndexOf('/') + 1);
                const dest = `${this.outdir}/${filename}`;
                console.log(`${lc} copying ${assetPath} to ${dest} `);
                return cp(assetPath, dest, { recursive: true });
            }));
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }

    }

    /**
     * Creates any dynamic files that are needed for the build.
     *
     * This can be overridden by subclasses to create files like manifest.json, etc.
     */
    async createDynamicFiles(): Promise<void> {
        const lc = `${this.lc}[${this.createDynamicFiles.name}]`;
        // default is no-op
        console.log(`${lc} (default no-op)`);
    }

    /**
     * Bundles the application using esbuild.
     */
    async bundle(): Promise<void> {
        const lc = `${this.lc}[${this.bundle.name}]`;
        try {
            console.log(`${lc} starting...`);
            if (!this.entryPoints || this.entryPoints.length === 0) {
                console.log(`${lc} no entryPoints. skipping.`);
                return;
            }
            if (!this.outdir) { throw new Error('outdir required.'); }

            const buildResult = await esbuild.build({
                entryPoints: this.entryPoints,
                outdir: this.outdir,
                bundle: true,
                platform: 'browser',
                format: 'esm',
                target: 'esnext',
                minify: false, // makes debugging easier
                sourcemap: 'inline',
                loader: { '.html': 'text', '.css': 'text' },
                outExtension: { '.js': '.mjs' },
                keepNames: true,
            });

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

}
