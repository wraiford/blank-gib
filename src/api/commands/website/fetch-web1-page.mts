import { extractErrorMsg, pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";
import { APIFunctionInfo } from "@ibgib/web-gib/dist/api/api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "@ibgib/web-gib/dist/api/commands/command-constants.mjs";
import { getCommandService } from "@ibgib/web-gib/dist/api/commands/command-service-v1.mjs";
import { CommandDataBase } from "@ibgib/web-gib/dist/api/commands/command-types.mjs";
import { FUNCTION_CALL_EXAMPLES_HEADER } from "@ibgib/web-gib/dist/api/api-constants.mjs";

import { GLOBAL_LOG_A_LOT } from "../../../constants.mjs";
import { GEMINI_SCHEMA_WEB1_PAGE } from "../../../components/web1/web1-constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

// #region constants
const EXAMPLE_INPUT_FETCH_HOME: Partial<FetchWeb1PageOpts> = {
    page: 'home',
    notesToSelf: 'Example of a fetchWeb1Page function call to go to the home page. This is only an example to show the shape of the function call.',
    repromptWithResult: true,
};

const EXAMPLES = [
    // `\`\`\`typescript\n${FUNCTION_CALL_EXAMPLES_HEADER}\n${pretty(EXAMPLE_INPUT_FETCH_HOME)}\n\`\`\``,
    FUNCTION_CALL_EXAMPLES_HEADER,
    pretty(EXAMPLE_INPUT_FETCH_HOME),
].join('\n');
// #endregion constants


/**
 * @interface CommandResultBase - Base interface for command results.
 *
 * ## notes
 *
 * I'm adding this after already having created several existing commands in
 * order to include an errorMsg. I want commands to return info about errors and
 * not re-throw. I am not integrating this with all existing commands at this
 * time though, so there will be some irregularity.
 *
 * I did go ahead and change the code in the command service to return
 * `{errorMsg}` if an exception is thrown.
 */
export interface CommandResultBase {
    /**
     * IIF the command errors out, this will be populated.
     */
    errorMsg?: string;
}

/**
 * @interface FetchWeb1PageOpts - Options for the fetchWeb1Page command.
 * @extends CommandDataBase
 */
export interface FetchWeb1PageOpts extends CommandDataBase<'agent', ['fetchWeb1Page']> {
    /**
     * e.g. "home", "funding", "faq", etc.
     */
    page: string;
}

export interface FetchWeb1PageResult extends CommandResultBase {
    htmlTemplate: string;
    /**
     * Optional additional info about html
     */
    htmlDescription?: string;
    // cssContents: string;
}

/**
 * @interface FetchWeb1PageCommandData - Command data for the fetchWeb1Page command.
 * @extends CommandDataBase
 */
export interface FetchWeb1PageCommandData extends CommandDataBase<'agent', ['fetchWeb1Page']> {
    /**
     * e.g. "home", "funding", "faq", etc.
     */
    page: string;
}

/**
 * Wrapper function to enqueue the fetchWeb1Page command.
 * @param {FetchWeb1PageOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is enqueued.
 */
function fetchWeb1PageViaCmd(opts: FetchWeb1PageOpts): Promise<FetchWeb1PageResult> {
    const commandService = getCommandService();
    const command: FetchWeb1PageCommandData = {
        cmd: 'agent',
        cmdModifiers: ['fetchWeb1Page'],
        page: opts.page,
        repromptWithResult: opts?.repromptWithResult,
        notesToSelf: opts?.notesToSelf,
    };
    return new Promise<FetchWeb1PageResult>((resolve, reject) => {
        commandService.enqueueCommand({ command, resolve, reject });
    });
}

/**
 * Implementation function for the fetchWeb1Page command (atow, does nothing other than resolve).
 * @param {FetchWeb1PageOpts} opts - Options for telling the user something.
 * @returns {Promise<void>} A promise that resolves when the command is executed (immediately).
 */
async function fetchWeb1PageImpl(opts: FetchWeb1PageOpts): Promise<FetchWeb1PageResult> {
    const lc = `[${fetchWeb1PageImpl.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        const { page } = opts;

        if (page === "links") {

            console.warn(`${lc} doing custom "links" web1 page response. (W: 4f9db37ee1e7497e94cec948cc975825)`);

            const pageHtmlPath = `/apps/web1/gib/link-gib/dist/index.html`;
            const htmlTemplate = await fetch(pageHtmlPath).then(res => res.text());

            const linksPath = `/apps/web1/gib/link-gib/dist/links.mjs`;
            const linksSrc = await fetch(linksPath).then(res => res.text());

            const htmlDescription = `For the web 1.0 links page, I use an older site of mine embedded in an iframe. So the htmlTemplate here is the html for that embedded site's index.html. But that really is driven by LinkEntry[] which are in code. Here is the data for those entries... (NOTE: You do not need to run this code. Just read the information in the link entries):\n${linksSrc}`;

            return {
                htmlTemplate,
                htmlDescription,
            }
        } else {
            const pageHtmlPath = `/components/web1/${page}/${page}.html`;
            const htmlTemplate = await fetch(pageHtmlPath).then(res => res.text());
            if (htmlTemplate === undefined) { throw new Error(`htmlTemplate is undefined for path (${pageHtmlPath}) (E: a78ce17f4321318c8b920b5c1e7e7a25)`); }

            return {
                htmlTemplate,
                htmlDescription: `This is the html for the page. Remember to just keep it very terse: one or two *brief* sentences. If there is anything the user wants, they will ask for it later. Let the page itself do the talking.`
            }
        }
    } catch (error) {
        const errorMsg = `${lc} ${extractErrorMsg(error)}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

/**
 * API function info for the fetchWeb1Page command.
 */
export const fetchWeb1PageFunctionInfo: APIFunctionInfo<typeof fetchWeb1PageViaCmd> = {
    nameOrId: 'fetchWeb1Page',
    fnViaCmd: fetchWeb1PageViaCmd,
    functionImpl: fetchWeb1PageImpl,
    cmd: 'agent',
    cmdModifiers: ['fetchWeb1Page'],
    schema: {
        name: 'fetchWeb1Page',
        description: `Use this function to get the HTML of a web 1.0 page. So if a user asks about a certain web 1.0 page, you can use this to retrieve the contents. The one page that doesn't really work is the "links" page which is actually an iframe. This stems from this page being an older page of mine. Just say it contains \n\n${EXAMPLES}`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                page: GEMINI_SCHEMA_WEB1_PAGE,
            },
            required: ['page'],
        },
    },
};
