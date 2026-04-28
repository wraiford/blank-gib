import { getAppShellSvc } from "./ui/shell/app-shell-service.mjs";

/**
 * Early init of UI Shell logic so the burger menu responds immediately.
 * Modules execute after the HTML document has been parsed, so elements are ready.
 */
getAppShellSvc();
