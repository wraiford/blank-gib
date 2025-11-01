import { delay, extractErrorMsg, } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { ARMY_STORE, BLANK_GIB_DB_NAME, GLOBAL_LOG_A_LOT } from "../constants.mjs";
import { UIThemeInfo } from "./ui-types.mjs";
import { storageGet } from "../storage/storage-helpers.web.mjs";
import { UI_THEME_INFO_KEY } from "./ui-constants.mjs";

const logalot = GLOBAL_LOG_A_LOT;

/**
 * Shows the fullscreen dialog with the given title, message, and optional prompt.
 *
 * @param {object} details - Options for showing the dialog.
 * @param {string} details.title - Title of the dialog.
 * @param {string} details.message - Message to display in the dialog body.
 * @param {boolean} [details.prompt] - If true, shows a text input for prompting the user.
 * @returns {Promise<string | null>} - A promise that resolves with the text entered by the user (if prompt is true) or null if canceled/dismissed.
 */
export async function showFullscreenDialog(opts: {
    title: string,
    msg: string,
    /**
     * determines if to show the cancel button. does NOT control whether or not
     * we show the input control.
     *
     * so if you want to prompt just for a boolean, just set this to true. If
     * you need actual string input from the user, set {@link showInput} to
     * true.
     *
     * @see {@link showInput}
     */
    prompt?: boolean,
    /**
     * this flag determines if the user input field is shown. If this is truthy,
     * then {@link prompt} will be ignored and always set to `true`.
     *
     * @see {@link prompt}
     */
    showInput?: boolean,
    defaultValue?: string,
    okButtonTitle?: string,
    cancelButtonTitle?: string,
    isPassword?: boolean,
}): Promise<string | undefined> {
    const lc = `[${showFullscreenDialog.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 037b228a2568181cd3eb25dba4e03225)`); }

        // const dialog = document.getElementById(ID_FULLSCREEN_DIALOG) as HTMLDialogElement;
        // const dialogBody = document.getElementById(ID_FULLSCREEN_DIALOG_BODY) as HTMLDialogElement;
        // const titleElement = document.getElementById(ID_FULLSCREEN_DIALOG_TITLE) as HTMLElement;
        // const messageElement = document.getElementById(ID_FULLSCREEN_DIALOG_MESSAGE) as HTMLElement;
        // const promptInput = document.getElementById(ID_FULLSCREEN_DIALOG_PROMPT_INPUT) as HTMLInputElement;
        // const okButton = document.getElementById(ID_FULLSCREEN_DIALOG_OK_BUTTON) as HTMLButtonElement;
        // const cancelButton = document.getElementById(ID_FULLSCREEN_DIALOG_CANCEL_BUTTON) as HTMLButtonElement;

        const dialog = document.getElementById('fullscreen-dialog') as HTMLDialogElement;
        const dialogBody = document.getElementById('fullscreen-dialog-body') as HTMLDialogElement;
        const titleElement = document.getElementById('fullscreen-dialog-title') as HTMLElement;
        const messageElement = document.getElementById('fullscreen-dialog-message') as HTMLElement;
        const promptInput = document.getElementById('fullscreen-dialog-prompt-input') as HTMLInputElement;
        const okButton = document.getElementById('fullscreen-dialog-ok-button') as HTMLButtonElement;
        const cancelButton = document.getElementById('fullscreen-dialog-cancel-button') as HTMLButtonElement;

        if (!dialog || !dialogBody || !titleElement || !messageElement || !promptInput || !okButton || !cancelButton) {
            throw new Error(`(UNEXPECTED) One or more dialog elements not found in DOM (E: 578e37c0271cc57a99e95e780ad18a25)`);
        }

        titleElement.textContent = opts.title || '';
        [...messageElement.childNodes as any].forEach(child => messageElement.removeChild(child));
        // messageElement.innerHTML = '';
        let msgLines = (opts.msg || '').split('\n');
        msgLines.forEach(line => {
            const pLine = document.createElement('p');
            pLine.textContent = line;
            messageElement.appendChild(pLine);
        });
        // messageElement.textContent = opts.msg || '';

        // reset the input classList
        promptInput.classList.remove('collapsed');
        cancelButton.classList.remove('collapsed');
        cancelButton.style.display = 'inline-block';
        okButton.textContent = opts.okButtonTitle || 'OK';

        // Prompt-specific setup
        const onKeypress = (ev: KeyboardEvent) => {
            /**
             * apparently an input has ev.key of 'Enter' but textarea is '\n'
             */
            const isEnter = ev.key === 'Enter' || ev.key === '\n';
            if (isEnter && ev.ctrlKey) { okButton.click(); }
        };

        if (opts.prompt || opts.showInput) {
            promptInput.addEventListener('keypress', onKeypress);
            if (opts.showInput) {
                promptInput.autofocus = true;
                promptInput.value = opts.defaultValue ?? '';
                promptInput.addEventListener('keypress', (ev) => {
                    if (ev.key === 'Enter') { okButton.click(); }
                });
                if (opts.isPassword) {
                    promptInput.type = 'password';
                    promptInput.autocomplete = 'off';
                    promptInput.required = true;
                } else {
                    promptInput.type = 'text';
                    promptInput.autocomplete = 'on';
                    promptInput.required = false;
                    promptInput.attributes['auto-complete'] = 'on';
                }
            } else {
                promptInput.autofocus = false;
                promptInput.classList.add('collapsed');
            }
            cancelButton.textContent = opts.cancelButtonTitle || 'Cancel';
        } else {
            promptInput.classList.add('collapsed');    // Hide prompt input
            cancelButton.style.display = 'none';       // Hide cancel button for alerts
        }

        return new Promise<string | undefined>((resolve) => {
            // handlers

            /** helper used in other handlers */
            const removeEventListeners = () => {
                if (opts.prompt || opts.showInput) {
                    promptInput.removeEventListener('keypress', onKeypress);
                }
                okButton.removeEventListener('click', onOK);
                cancelButton.removeEventListener('click', onCancel);
                dialog.removeEventListener('close', onClose); // Remove dialog-level listener too
            };
            /** user clicks OK or hits "ENTER" in input */
            const onOK = () => {
                removeEventListeners();
                let result = opts.showInput ?
                    promptInput.value ?? '' :
                    true.toString();
                if (promptInput) { promptInput.value = ''; } // Clear input for next time
                dialog.close(result);
                resolve(result);
            };

            /** user actively clicks Cancel */
            const onCancel = () => {
                removeEventListeners();
                if (promptInput) { promptInput.value = ''; } // Clear input for next time
                dialog.close(undefined); // Pass back null for cancel
                resolve(undefined);
            };
            /**
             * Handle dialog.close() without button click (e.g., Esc key)
             *
             * NOTE: this does not trigger when dialog.close() is executed. This
             * is only firing when esc is pressed.
             */
            const onClose = () => {
                removeEventListeners();
                if (promptInput) { promptInput.value = ''; } // Clear input for next time
                dialog.close(undefined);
                resolve(undefined);
            };

            // wire up
            okButton.addEventListener('click', onOK);
            cancelButton.addEventListener('click', onCancel);
            dialog.addEventListener('close', onClose); // e.g. escape key

            // show it
            dialog.showModal();
            delay(1000).then(() => {
                dialogBody.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}

export async function getExistingUIInfo(): Promise<UIThemeInfo | undefined> {
    const lc = `[${getExistingUIInfo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 4c9d7c7f1e8bfcc917d405b842438825)`); }

        let existingUIInfo: UIThemeInfo | undefined = undefined;
        const existingUIInfoAsString = await storageGet({
            dbName: BLANK_GIB_DB_NAME,
            storeName: ARMY_STORE,
            key: UI_THEME_INFO_KEY,
        });
        if (existingUIInfoAsString) {
            try {
                existingUIInfo = JSON.parse(existingUIInfoAsString) as UIThemeInfo;
                if (!existingUIInfo.cssVariableOverrides) { throw new Error(`invalid existing UI info (E: 2fb408362178ce79a57da313d6680d25)`); }
            } catch (error) {
                existingUIInfo = undefined;
            }
        }

        return existingUIInfo;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
