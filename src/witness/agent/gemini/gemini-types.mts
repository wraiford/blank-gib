import { Content, } from "@google/generative-ai";
import type { StartChatParams, ChatSession, FunctionCallingMode, } from "@google/generative-ai";
import { PromptInfo, } from "../agent-one-file.mjs";
import { TextSource } from "../agent-constants.mjs";

export interface PromptInfoEntryGemini {
    /**
     * The source of the text, in terms of our code definition.
     *
     * I say this because the Gemini API only considers "user" and "model" but
     * we keep more information (and more accurate information) than this.
     *
     * For example, the Gemini API expects function responses to be role "user".
     * But we would store this src as {@link TextSource.FUNCTION}
     */
    src: TextSource;
    // /**
    //  * the raw text of an entry
    //  */
    // text?: string;
    /**
     * the shape of the entry that the Gemini API would expect
     */
    content: Content;
};
/**
 * Information required specifically for the Gemini API.
 */
export interface PromptInfoGemini extends PromptInfo {
    /**
     * The system instructions' parts that we'll concatenate into system prompt.
     */
    systemPromptEntries: PromptInfoEntryGemini[];
    /**
     * The history of the chat, i.e., the contents of the chat sans the most
     * recent.
     *
     * NOTE: We will be using this for the gemini api's "chat" function.
     *
     * @see {@link StartChatParams.history}
     */
    chatPromptHistoryParts: PromptInfoEntryGemini[];
    /**
    * The most recent chat message
    *
    * @see {@link ChatSession.sendMessage}
    */
    chatPromptCurrent: PromptInfoEntryGemini;
    /**
     * if truthy, this will override the default function calling mode when
     * prompting the LLM.
     *
     * if falsy, will use the default (FunctionCallingMode.ANY)
     *
     * @see {@link FunctionCallingMode}
     *
     * ## notes
     *
     * I'm adding this for custom prompt. right now, it works better when
     * forcing the model to call a function, but I am now wanting the use case
     * to just ask the model a "normal" chat llm question (for translating some
     * text).
     */
    overrideFunctionCallingMode?: FunctionCallingMode;
}

/**
 * Gemini returns either function calls or raw text atow (01/2025)
 */
export type PromptAPIResult_Gemini =
    | {
        /**
         * raw strings of function calls requested returned by the underlying
         * API's model (right now Gemini)
         */
        functionCalls: string[]
    }
    | { text: string };

/**
 * This is a "kluge" IMO because it wraps the response part to be able to handle
 * all responses of functions. This is a limitation of the Gemini API which requires an
 * object as the response part's value. So if a function returns "undefined" or an array,
 * it throws an error. So this is a wrapper.
 */
export interface FunctionResponsePart_ResponseWrapper {
    value: any | undefined;
}
