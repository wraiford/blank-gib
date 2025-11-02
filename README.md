# blank-gib - agent-driven UX via a blank canvas

WIP

## hackathon people

The entry for the [Google Chrome Built-in API Hackathon 2025](https://googlechromeai2025.devpost.com/) is the extension. Please refer to the [extension README.md] for details in addition to the Build section found below.

I've also created a `hackathon_entry` tag that I believe to be the src at time of submission.

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

### `build-app.mts`

This script builds the main web application.

-   **Entry Point**: `src/index.mts`
-   **Output Directory**: `dist`
-   **Assets**: `src/index.html`, `src/root.css`, `src/styles.css`, and the `src/assets` directory are copied to the output directory.
-   **Dynamic Files**: It creates a directory `dist/apps/web1/gib`.

### `build-ext.mts`

This script builds the browser extension.

-   **Entry Points**:
    -   `src/extension/background.mts`
    -   `src/extension/sidepanel.mts`
    -   `src/extension/content-script.mts`
-   **Output Directory**: `dist-ext`
-   **Assets**:
    -   `src/root.css`
    -   `src/extension/styles.css`
    -   `src/extension/sidepanel.html`
    -   `src/assets`
    -   `src/extension/page-analyzer/page-content-extractor.js`
-   **Dynamic Files**: It generates the `manifest.json` file by reading the `package.json` version and a template manifest.

### Common Build Logic (`types.mts`)

Both build scripts extend a base `Build` class in `apps/blank-gib/build/src/types.mts`. This class handles the common logic for:

-   Copying static assets to the output directory.
-   Creating dynamic files (like `manifest.json`).
-   Bundling the application using `esbuild`.

## UI Architecture: The @ibgib/component Framework

The user interface for `blank-gib` is not built with a conventional framework like React or Vue. Instead, it uses a custom, data-driven architecture called `@ibgib/component`. This framework is built directly on top of standard Web Components and is deeply integrated with the `ibgib` data model.

The core philosophy is that every UI component is a visual representation of a specific `ibgib` data structure. The component's state and lifecycle are directly tied to the underlying `ibgib`'s timeline. This in effect is similar to reactive frameworks like Redux, but leverages the unique distributed features of the ibgib protocol.

The framework consists of three main parts:

1.  **The Component Service (`IbGibComponentService`):** A singleton service that acts as a central registry and router for all components in the application. When the application needs to display a new view, it asks the service to find and create the appropriate component for the given data (`ibGibAddr`).

2.  **The Component Meta (`IbGibDynamicComponentMeta`):** This is a "blueprint" or factory object for a component. It doesn't render any UI itself; instead, it defines the component's custom HTML tag name (e.g., `ibgib-sidepanel`), its routing rules (how it matches a URL or path), and contains the factory method (`createInstance`) to stamp out new instances.

3.  **The Component Instance (`IbGibDynamicComponentInstance`):** This is the component itself - an actual `HTMLElement` web component that gets rendered in the DOM. It contains the UI logic, event handling, and maintains a live link to its corresponding `ibgib` data. It uses a `LiveProxyIbGib` to automatically update the UI when the underlying data changes.

This architecture allows for a highly dynamic and modular UI where components can be loaded, unloaded, and updated in response to changes in the `ibgib` knowledge graph. For a more detailed technical breakdown, see the `README.md` in the `apps/blank-gib/src/extension` directory.
