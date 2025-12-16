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

## UI Architecture: Custom @ibgib component framework

The user interface for `blank-gib` is not built with a conventional framework
like React or Vue. Instead, it uses a custom, data-driven architecture called
`@ibgib/component` (though currently this is rolled into blank-gib). This
framework is built on top of standard Web Components while deeply integreating
with the unique `ibgib` data model and protocol. In particular, components are
linked to a backing ibgib timeline, using the ibgib's tjp address (specifically
the `gib` part, i.e., the `tjpGib`) as the pointer to the genesis of the
timeline. The component subscribes to the metaspace's local pubsub, specifically
listening to timeline updates, reacting accordingly.

### Big Idea

All current approaches to data are disconnected. So the best you can do with a
front-end component framework is a Redux-like approach where you usually have a
local data store and you provide pathing into that store. Slightly better is you
can have a store provider layer. Then your local-only components react to
updates via the lambdas/reducers.

The lone exception - and the reason for its ENORMOUS success - is git itself.
Think of git's coarse branches as the paths and remotes as the components. Now
think of a DLT-based approach to timeline dynamics (like version control
systems), that wasn't built with source code as its only use case, _with each
piece of data as its own timeline_. Now you have a universally-sized distributed
computation addressing system that enables _distributed_ component architecture.

### Framework Parts

The component framework itself consists of three main parts:

1.  **The Component Service (`IbGibComponentService`):** A singleton service that acts as a central registry and router for all components in the application. When the application needs to display a new view, it asks the service to find and create the appropriate component for the given data (`ibGibAddr`).

2.  **The Component Meta (`IbGibDynamicComponentMeta`):** This is a "blueprint" or factory object for a component. It doesn't render any UI itself; instead, it defines the component's custom HTML tag name (e.g., `ibgib-sidepanel`), its routing rules (how it matches a URL or path), and contains the factory method (`createInstance`) to stamp out new instances.

3.  **The Component Instance (`IbGibDynamicComponentInstance`):** This is the component itself - an actual `HTMLElement` web component that gets rendered in the DOM. It contains the UI logic, event handling, and maintains a live link to its corresponding `ibgib` data. It uses a `LiveProxyIbGib` to automatically update the UI when the underlying data changes.

This architecture allows for a highly dynamic and modular UI where components can be loaded, unloaded, and updated in response to changes in the `ibgib` knowledge graph. For a more detailed technical breakdown, see the `README.md` in the `apps/blank-gib/src/extension` directory.
