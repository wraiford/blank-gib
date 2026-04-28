# blank-gib - agent-driven UX via a blank canvas

WIP

## src notes

### *.ext.mts, *.web.mts, *.app.mts

* .ext for chrome extension-only (not the app)
* .web.mts - web (not node)
* .app.mts - blank-gib app (not the web extension)

## Build (Monorepo Policy)

> [!IMPORTANT]
> This project is part of a monorepo. Build and development tasks are centralized in the monorepo root via the `@ibgib/build-gib` orchestrator.

### Development & Build
Run these from the monorepo root:
* `npm run build:blank-gib` - Performs a full clean and build.
* `npm run serve:blank-gib` - Starts the development server with live reload and automatic asset copying.

### Deployment
This application is deployed using **Docker Compose** and **Traefik**. For detailed instructions on local HTTPS setup and production deployment to AWS EC2, see the **[🚀 Deployment & Infrastructure Guide](../../docs/DEPLOYMENT.md)**.

### Legacy Scripts
Individual package scripts have been streamlined to avoid redundancy. Previous scripts are archived in `docs/ARCHIVE_SCRIPTS.md` at the monorepo root.

### How It Works
The build process is orchestrated by `build/src/concrete-build/build-blank-gib.mts` in the monorepo root. It handles:
*   Pre-build cleaning (via the centralized clean tool).
*   Dynamic file generation (versioning, asset manifests).
*   `esbuild` bundling for the web app and extension.
*   Asset management and live watching.
