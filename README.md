# blank-gib - agent-driven UX via a blank canvas

WIP

## src notes

### *.ext.mts, *.web.mts, *.app.mts

* .ext for chrome extension-only (not the app)
* .web.mts - web (not node)
* .app.mts - blank-gib app (not the web extension)

## Build

The build process uses `esbuild` to create different targets for the web app and the browser extension. The build scripts are located in `apps/blank-gib/build`. This build system is written in TypeScript, so it first compiles itself using `tsc`, and then it uses `esbuild` to build the actual application and extension.

You can create both development and production builds.

### Build Scripts

All build scripts are run from the `apps/blank-gib` directory.

*   **Build the build scripts themselves:**
    *   `npm run build:build-scripts`
    *   You need to run this whenever you make a change to the files in `apps/blank-gib/build/src`.

*   **Application Builds:**
    *   `npm run build:app` (Development): Creates a build with inline source maps and no minification. Ideal for debugging. The output is in the `dist` folder.
    *   `npm run build:app:prod` (Production): Creates a minified build with external source maps. This is optimized for production. The output is in the `dist` folder.

*   **Extension Builds:**
    *   `npm run build:ext` (Development): Creates a development build for the browser extension. The output is in the `dist-ext` folder.
    *   `npm run build:ext:prod` (Production): Creates a minified production build for the browser extension. The output is in the `dist-ext` folder.

### How It Works

The core logic is in the `Build` class (`apps/blank-gib/build/src/types.mts`). This base class handles:
*   Parsing command-line arguments (like `--prod`).
*   Setting up `esbuild` options for development vs. production.
*   Copying static assets.
*   Bundling the code.

The `build-app.mts` and `build-ext.mts` scripts extend this `Build` class to define the specific entry points and asset paths for the application and the extension, respectively. When the `--prod` flag is passed, the base `Build` class automatically adjusts the `esbuild` configuration to create a production-ready build.
