# blank-gib - agent-driven UX via a blank canvas

WIP

## hackathon people

The entry for the [Google Chrome Built-in API Hackathon 2025](https://googlechromeai2025.devpost.com/) is the extension. Please refer to the [extension README.md](/src/extension/README.md) for details in addition to the Build section found below.

I've also created a `hackathon_entry` tag that I believe to be the src at time of submission. _Note however, the build command should first be `npm run build` and not ~~`npm run build:ext`~~, but the tag was made before that correction. It's best to refer to the main branch for documentation if possible._

## src notes

### *.ext.mts, *.web.mts, *.app.mts

* .ext for chrome extension-only (not the app)
* .web.mts - web (not node)
* .app.mts - blank-gib app (not the web extension)

## Build

The build process uses `esbuild` to create two different targets: one for the
web app and one for the browser extension. The build scripts are located in
`apps/blank-gib/build`. The build system itself is in TypeScript, so first the
build systems compiles itself with `tsc`, and then the targets are built with
`esbuild`.

Always refer to the files themselves for the current settings, but the following is a sketch ATOW of those targets.

### `build-app.mts`


* **Entry Point**: `src/index.mts`
* **Output Directory**: `dist`
* **Assets**: `src/index.html`, `src/root.css`, `src/styles.css`, and the `src/assets` directory are copied to the output directory.
* **Dynamic Files**: It creates a directory `dist/apps/web1/gib`.

### `build-ext.mts` (browser extension)

* **Entry Points**:
  * `src/extension/background.mts`
  * `src/extension/sidepanel.mts`
  * `src/extension/content-script.mts`
* **Output Directory**: `dist-ext`
* **Assets**:
  * `src/root.css`
  * `src/extension/styles.css`
  * `src/extension/sidepanel.html`
  * `src/assets`
  * `src/extension/page-analyzer/page-content-extractor.js`
* **Dynamic Files**: It generates the `manifest.json` file by reading the `package.json` version and a template manifest.

### Common Build Logic (`types.mts`)

Both build scripts extend a base `Build` class in `apps/blank-gib/build/src/types.mts`. This class handles the common logic for:

* Copying static assets to the output directory.
* Creating dynamic files (like `manifest.json`).
* Bundling the application using `esbuild`.

## UI Architecture: Custom @ibgib component framework

The user interface for `blank-gib` is not built with a conventional framework like React or Vue. Instead, it uses a custom, data-driven architecture called `@ibgib/component`. This framework is built directly on top of standard Web Components and is deeply integrated with the `ibgib` data model.

### Big Idea

All current approaches to data are disconnected. So the best you can do with a front-end component framework is a Redux-like approach where you usually have a local data store and you provide pathing into that store. Slightly better is you can have a store provider layer. Then your local-only components react to updates via the lambdas/reducers.

The lone exception - and the reason for its ENORMOUS success - is git itself. Think of git's coarse branches as the paths and remotes as the components. Now think of a DLT-based approach to timeline dynamics (like version control systems), that wasn't built with source code as its only use case, _with each piece of data as its own timeline_. Now you have a universally-sized distributed computation addressing system that enables _distributed_ component architecture.

### Framework Parts

The component framework itself consists of three main parts:

1.  **The Component Service (`IbGibComponentService`):** A singleton service that acts as a central registry and router for all components in the application. When the application needs to display a new view, it asks the service to find and create the appropriate component for the given data (`ibGibAddr`).

2.  **The Component Meta (`IbGibDynamicComponentMeta`):** This is a "blueprint" or factory object for a component. It doesn't render any UI itself; instead, it defines the component's custom HTML tag name (e.g., `ibgib-sidepanel`), its routing rules (how it matches a URL or path), and contains the factory method (`createInstance`) to stamp out new instances.

3.  **The Component Instance (`IbGibDynamicComponentInstance`):** This is the component itself - an actual `HTMLElement` web component that gets rendered in the DOM. It contains the UI logic, event handling, and maintains a live link to its corresponding `ibgib` data. It uses a `LiveProxyIbGib` to automatically update the UI when the underlying data changes.

This architecture allows for a highly dynamic and modular UI where components can be loaded, unloaded, and updated in response to changes in the `ibgib` knowledge graph. For a more detailed technical breakdown, see the `README.md` in the `apps/blank-gib/src/extension` directory.
