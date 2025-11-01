import {
    EnhancedGenerateContentResponse, ErrorDetails, FunctionCallPart, FunctionCallingMode,
    FunctionResponsePart, GenerateContentResult, GoogleGenerativeAI, TextPart,
} from '@google/generative-ai';

import { clone, delay, extractErrorMsg, getTimestampInTicks, pretty } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { Ib, IbGibAddr, TransformResult } from '@ibgib/ts-gib/dist/types.mjs';
import { IbGib_V1, IbGibData_V1, IbGibRel8ns_V1 } from '@ibgib/ts-gib/dist/V1/types.mjs';
import { getIbGibAddr } from '@ibgib/ts-gib/dist/helper.mjs';
import { ROOT_ADDR } from '@ibgib/ts-gib/dist/V1/constants.mjs';
import { getGibInfo } from '@ibgib/ts-gib/dist/V1/transforms/transform-helper.mjs';
import { CommentIbGib_V1 } from '@ibgib/core-gib/dist/common/comment/comment-types.mjs';
import { createCommentIbGib, parseCommentIb } from '@ibgib/core-gib/dist/common/comment/comment-helper.mjs';
import { MetaspaceService } from '@ibgib/core-gib/dist/witness/space/metaspace/metaspace-types.mjs';
import { IbGibSpaceAny } from '@ibgib/core-gib/dist/witness/space/space-base-v1.mjs';

import { GLOBAL_LOG_A_LOT } from '../../../constants.mjs';
import { getAllFunctionInfos, getDeprecatedFunctionInfoNames } from '../../../api/api-index.mjs';
import {
    AddTextsOpts, AgentWitnessData_V1, AgentWitnessIbGib_V1, AgentWitnessRel8ns_V1, AgentWitness_V1,
    PromptOneOffOpts,
    getAddlMetadataTextForAgentText,
    parseAddlMetadataTextForAgentText, validateAgentWitnessCommentIbGib
} from '../agent-one-file.mjs';
import {
    getFunctionCallAndResponseParts, isFunctionCallRequestComment,
    isPromptInfoGemini, systemPromptEntriesToSystemInstructionContent,
    textSourceToGeminiRole,
} from './gemini-helpers.mjs';
import { PromptAPIResult_Gemini, PromptInfoEntryGemini, PromptInfoGemini } from './gemini-types.mjs';
import { FUNCTION_INFO_REL8N_NAME, FunctionInfoIbGib_V1 } from '../function-info/function-info-one-file.mjs';
import { agentIbGibDtoToWitness } from './gemini-agent-factory.mjs';
import { getAgentsSvc } from '../agents-service-v1.mjs';
import { GEMINI_BACKUP_MODEL_STR, GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO, GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO_RETRY_DELAY_KEY, GEMINI_ERROR_STATUS_MODEL_OVERLOADED, GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED, GEMINI_MAX_TRY_COUNT } from './gemini-constants.mjs';
import { AGENT_REL8N_NAME, TextSource } from '../agent-constants.mjs';
import { appendToTimeline, getLockScope, mut8Timeline, Rel8nInfo } from '../../../api/timeline/timeline-api.mjs';
import { execInSpaceWithLocking } from '@ibgib/core-gib/dist/witness/space/space-helper.mjs';

const logalot = GLOBAL_LOG_A_LOT;

export class AgentWitnessGemini_V1
    extends AgentWitness_V1<GoogleGenerativeAI, PromptInfoGemini, PromptAPIResult_Gemini> {
    // witness(arg: IbGib_V1): Promise<IbGib_V1 | undefined> {
    //     throw new Error('Method not implemented.');
    // }
    protected lc: string = `[${AgentWitnessGemini_V1.name}]`;

    protected override async validateThis(): Promise<string[]> {
        const lc = `${this.lc}[${this.validateThis.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 641e211473fc54d5a9ebb4ea44944d25)`); }
            const errors = await super.validateThis();

            // todo: refactor this into a non-class-method validation helper function for data
            if (this.data) {
                console.warn(`${lc} do more validation on this concrete class. (W: fb778a84ccca2ebcefd2ca7845543825)`)
                // todo: add validation for available functions
                // todo: add other validation
                // todo: break out data validation and rel8ns validation into separate functions
            } else {
                // this is already done in the super call
                // errors.push(`this.data falsy (E: f5f151e11b12cad814b37ecad7c74a25)`)
            }

            return errors;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }


    /**
     * not implemented at the moment
     */
    protected parseAddlMetadataString<TParseResult>({ ib }: { ib: Ib; }): TParseResult {
        const lc = `${this.lc}[${this.parseAddlMetadataString.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 080daf4b73f8bb52c70bf0a8f329be25)`); }
            throw new Error(`not implemented...i've just converted agent witness to a full witness with context and this was the only abstract method required. wasn't being used previously? so i'm not sure why this is here. (E: 129e816d3698f3867ec54c34fcc9a225)`);
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async addTexts(opts: AddTextsOpts): Promise<CommentIbGib_V1[]> {
        const lc = `${this.lc}[${this.addTexts.name}]`;
        try {
            const agentsSvc = getAgentsSvc();
            /**
             * always update at least in memory latest
             */
            await agentsSvc.updateOrSetLatestAgent({
                agent: this,
                throwIfNewerFound: false,
            });
            const metaspace = this._metaspace;
            if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: fd92a81901a83e2698ab2c3d4e702f25)`); }
            if (opts.infos.length === 0) {
                console.warn(`${lc} opts.infos.length === 0. So we've called addTexts but with an empty array? returning early. (W: 0d42cd3b26aec45874d0e65450b37d25)`)
                return []; /* <<<< returns early */
            }

            const orderedCommentIbGibs_all: CommentIbGib_V1[] = [];
            const orderedCommentIbGibs_system: CommentIbGib_V1[] = [];
            const orderedCommentIbGibs_chat: CommentIbGib_V1[] = [];
            const superSpace = await this.getSuperSpace();
            // const superSpace = await metaspace.getLocalUserSpace({
            //     lock: false,
            //     localSpaceId: this.data!.superSpaceId
            // });

            // just get the slow damn version in place dude.
            for (const info of opts.infos) {
                const { textSrc, isSystem } = info;
                let { text, commentIbGib, } = info;
                if (text && commentIbGib) { throw new Error(`(UNEXPECTED) both text and commentIbGib provided? (E: a3fd590db1a5efc301f3c7e66b322f25)`); }
                if (!text && !commentIbGib) { throw new Error(`(UNEXPECTED) both text and commentIbGib falsy? one or the other is required (E: e08c7c694a17319085adfb75914b2725)`); }
                const addlMetadataText = getAddlMetadataTextForAgentText({ textSrc });
                if (commentIbGib) {
                    if (logalot) { console.log(`${lc} adding existing commentIbGib (I: 72a3f7aafde92f65b168d27605f94625)`); }
                    // we have an existing commentIbGib, but there are a couple
                    // of points to consider:

                    // 1. is the comment valid for use in agent witnesses? does
                    // it have the right metadata? ANSWER: we will validate
                    // after this if..else block

                    // 2. Does the comment (and its dependency graph) exist in
                    // the agent's space? A complication for this is what if the
                    // comment rel8s to some other (especially large) ibgib graph?
                    // or IOW, what if the comment has some potentially huge
                    // dependency graph? ANSWER: todo: check superSpace and/or
                    // add a flag vouching for the dependency graph to exist in
                    // it.

                    // 3. also persist dependency graph in agent's subSpace?
                } else {
                    // just passed in raw text, need to create a new comment ibgib
                    if (logalot) { console.log(`${lc} creating new commentIbGib for text (I: 72a3f7aafde92f65b168d27605f94625)`); }
                    if (!text) { throw new Error(`(UNEXPECTED) text falsy still? at this point it should be guaranteed (E: b2deec458f35f22298ccb664d0685125)`); }
                    const resCreateComment: TransformResult<CommentIbGib_V1> =
                        await createCommentIbGib({
                            text,
                            addlMetadataText,
                            saveInSpace: true,
                            space: superSpace,
                        });
                    commentIbGib = resCreateComment.newIbGib;
                    await metaspace.registerNewIbGib({
                        ibGib: commentIbGib,
                        space: superSpace,
                    });
                    // also persist in agent's subSpace?
                    // const subSpace = await this.getAgentSpace();
                    // await metaspace.persistTransformResult({ resTransform: resCreateComment, space: subSpace });
                    // await metaspace.registerNewIbGib({ ibGib: resCreateComment.newIbGib, space: subSpace });
                }
                if (!commentIbGib) { throw new Error(`(UNEXPECTED) commentIbGib still falsy? we should have just created one if it didn't exist (E: 9370b19aa207234db185cd74b57be525)`); }
                const validationErrors = await validateAgentWitnessCommentIbGib({ ibGib: commentIbGib });
                if (validationErrors.length > 0) { throw new Error(`validation errors with trying to add a commentIbGib. errors: ${validationErrors} (E: beee1893050f9bcf9842c66831595225)`); }
                orderedCommentIbGibs_all.push(commentIbGib);
                if (isSystem) {
                    orderedCommentIbGibs_system.push(commentIbGib);
                } else {
                    orderedCommentIbGibs_chat.push(commentIbGib);
                }

            }

            // we now have all of the comment ibgibs prepared. we need to add these
            // to this agent's rel8ns

            const rel8nInfosToAppend: Rel8nInfo[] = [];
            if (orderedCommentIbGibs_system.length > 0) {
                rel8nInfosToAppend.push({ rel8nName: 'system', ibGibs: orderedCommentIbGibs_system, });
            }
            if (orderedCommentIbGibs_chat.length > 0) {
                rel8nInfosToAppend.push({ rel8nName: 'chat', ibGibs: orderedCommentIbGibs_chat, });
            }

            const newAgentIbGib = await appendToTimeline({
                timeline: this.toIbGibDto(),
                rel8nInfos: rel8nInfosToAppend,
                timelineIndexInfo: {
                    rel8nName: AGENT_REL8N_NAME,
                    type: this.data!.type,
                },
                metaspace,
                space: superSpace,
            }) as AgentWitnessGemini_V1;

            // const resRel8 = await rel8({
            //     type: 'rel8',
            //     src: this.toIbGibDto(),
            //     rel8nsToAddByAddr: {
            //         ['system']: orderedCommentIbGibs_system.map(x => getIbGibAddr({ ibGib: x })),
            //         ['chat']: orderedCommentIbGibs_chat.map(x => getIbGibAddr({ ibGib: x })),
            //     },
            //     dna: true,
            //     nCounter: true,
            // }) as TransformResult<AgentWitnessGemini_V1>;

            // await this._metaspace!.persistTransformResult({
            //     resTransform: resRel8,
            //     space: superSpace,
            // });

            // const newAgentIbGib = resRel8.newIbGib;

            await this.loadIbGibDto(newAgentIbGib);
            await agentsSvc.updateOrSetLatestAgent({
                agent: this,
                throwIfNewerFound: true, // we **just** created what should be the latest, so throw if this isn't the case
            });

            // await metaspace.registerNewIbGib({
            //     ibGib: newAgentIbGib,
            //     space: superSpace,
            // });

            // update special index
            // await updateAgentIndex({
            //     newAgentIbGib,
            //     metaspace,
            //     space: superSpace,
            //     type: this.data!.type,
            // });

            return orderedCommentIbGibs_all;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        }
    }

    override async composePromptInfo(): Promise<PromptInfoGemini> {
        const lc = `${this.lc}[${this.composePromptInfo.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 155774d4811b038034342d5750174325)`); }
            if (!this._metaspace) {
                throw new Error(`this.metaspace falsy (E: 7232a3a1b4348d460ed1375b32677125)`);
            }
            const systemPromptEntries: PromptInfoEntryGemini[] = [];
            for (const commentIbGib of this.commentIbGibs_system) {
                const entry = await this.createPromptInfoEntriesFromGeminiComment({ commentIbGib });
                systemPromptEntries.push(...entry);
            }
            const currentContextTjpAddr =
                this.data?.['@currentContextTjpAddr'] ?? ROOT_ADDR;
            if (currentContextTjpAddr !== ROOT_ADDR) {
                systemPromptEntries.push({
                    src: TextSource.HARDCODED,
                    // text: commentIbGib.data.text,
                    content: {
                        role: textSourceToGeminiRole(TextSource.HARDCODED),
                        parts: [
                            {
                                text: getTextPartForCurrentContextTjpAddr({
                                    currentContextTjpAddr
                                })
                            } satisfies TextPart
                        ],
                    }
                })
            }

            if (this.commentIbGibs_chat.length === 0) { throw new Error(`(UNEXPECTED) this.commentIbGibs_chat.length === 0? why are we composing prompt info? We are assumed at this point to have added at least one comment ibgib to this agent. (E: a4e3d840946ab8e6dc3fde3e25d6b225)`); }
            const chatPromptHistoryParts: PromptInfoEntryGemini[] = [];
            const chatCommentIbGibs_history =
                this.commentIbGibs_chat.length > 1 ? this.commentIbGibs_chat.slice(0, -1) : [];
            for (const commentIbGib of chatCommentIbGibs_history) {
                const entry = await this.createPromptInfoEntriesFromGeminiComment({ commentIbGib });
                chatPromptHistoryParts.push(...entry);
            }

            /**
             * the most recent may be a regular comment or an FCR. if FCR, then
             * there will be two gemini entries and we need to add the first one
             * (functionCall part) to our history.
             */
            let chatPromptCurrent: PromptInfoEntryGemini;
            const chatCommentIbGib_current = this.commentIbGibs_chat.at(-1)!; // guaranteed to have at least one element due to previous commentIbGibs_Chat.length check
            const chatPromptCurrent_rawarray =
                await this.createPromptInfoEntriesFromGeminiComment({ commentIbGib: chatCommentIbGib_current });
            if (chatPromptCurrent_rawarray.length === 1) {
                // regular
                chatPromptCurrent = chatPromptCurrent_rawarray.at(0)!;
            } else if (chatPromptCurrent_rawarray.length === 2) {
                // fcr
                chatPromptHistoryParts.push(chatPromptCurrent_rawarray.at(0)!); // functionCall entry
                chatPromptCurrent = chatPromptCurrent_rawarray.at(1)!; // functionResponse entry;
            } else {
                throw new Error(`(UNEXPECTED) chatPromptCurrent_rawarray.length !== 1 or 2? We expect at this point either a regular text part or a FCR comment which creates two entries. (E: cd59f978479c20e496da4b0eb86c7d25)`);
            }

            const resPromptInfo: PromptInfoGemini = {
                api: 'gemini', // see AgentAPI
                systemPromptEntries,
                chatPromptHistoryParts,
                chatPromptCurrent,
            };

            if (logalot) { console.log(`${lc} resPromptInfo:`, pretty(resPromptInfo), `(I: 8f17a8c45b9a91e20a5c5064d9114a25)`); }

            return resPromptInfo;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected override async callTextAPI(info: PromptInfoGemini): Promise<PromptAPIResult_Gemini> {
        const lc = `${this.lc}[${this.callTextAPI.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 27885f5b14682646542e9658417b2f25)`); }

            if (!isPromptInfoGemini(info)) { throw new Error(`(UNEXPECTED) info.api !== gemini? we are in the gemini concrete class where this is assumed. (E: 9223647ec96fb3f4eaee32c3fc15d925)`); }

            // #region prepare

            if (!this.data) { throw new Error(`(UNEXPECTED) this.data falsy? (E: 09224b6688fdac884ce88f196b68a425)`); }
            const { api, model } = this.data;
            if (api !== 'gemini') { throw new Error(`api not supported: ${api} (E: 7e5c7c17988a666a86e72299630c7f25)`); }

            // todo: refactor gemini-specific code into its own descendant class
            if (logalot) { console.log(`${lc} calling gemini api with model: ${model} (I: 6208942a419e9041bb037384135a0c25)`); }

            const apiKey = await this.fnGetAPIKey();
            if (!apiKey) {
                console.error(`${lc} apiKey falsy. did you set this.fnGetAPIKey (E: d964596b1538c0327209a92e97a54d25)`);
                return {
                    text: 'no api key entered so no LLM chat happening. enter a gemini api key and donate/invest!',
                }; /* <<<< returns early */
            }
            this._genAI ??= new GoogleGenerativeAI(apiKey);

            const functionDeclarations = Array.from(this.availableFunctions.values()).map(
                (x) => ({
                    name: x.nameOrId,
                    description: x.schema?.description,
                    parameters: x.schema?.parameters,
                })
            );

            if (functionDeclarations.some(x => x.parameters === 'undefined')) {
                console.error(`${lc} (UNEXPECTED) function schema parameters not defined for all APIFunctionInfo values. (E: ae7227cdd65c0ab4513c7b282a1e4825)`);
            }

            if (logalot) {
                console.log(`${lc} Gemini functionDeclarations:`);
                console.dir(functionDeclarations);
            }

            // #endregion prepare

            const { systemPromptEntries, chatPromptHistoryParts, chatPromptCurrent } = info;


            /**
             * we may add decompression text parts to the most recent entry
             */
            const chatPromptCurrent_final = clone(chatPromptCurrent) as PromptInfoEntryGemini;
            if (logalot) { console.log(`chatPromptCurrent_final (before decompression): ${pretty(chatPromptCurrent_final)} (I: bbd4c7b9f3225afe9da1761918d0ac25)`) }

            if (logalot) { console.warn(`${lc} skipping decompression for the moment. if we add decompression text when the last comment is a function response part, then we'll error out. Need to rethink compression/decompression with the new function call/response workflow. (W: 7478439f9bbbde30a1eab3c5189ea625)`); }
            // if (this.transientDecompressionPromptText) {
            //     const taggedDecompressionText = taggifyForPrompt({
            //         tagText: CONTEXT_DECOMPRESSION_TAG,
            //         contentText: this.transientDecompressionPromptText,
            //         randomIdLength: 4,
            //     });
            //     const decompressionTextPart: TextPart = {
            //         text: taggedDecompressionText,
            //     };
            //     // we insert the decompression BEFORE the current part, but only
            //     chatPromptCurrent_final.content.parts = [decompressionTextPart, ...chatPromptCurrent_final.content.parts];

            //     // `${taggedDecompressionText}\n${chatPromptCurrent}`;
            //     this.transientDecompressionPromptText = undefined;
            // }

            let result: GenerateContentResult | undefined = undefined;

            /**
             * need to be able to call this function with retries with different
             * models, depending on error code received when generating text.
             *
             * ## driving intent
             *
             * I am getting a 503 error saying the model is overloaded. We need
             * to have a backup model that is hardcoded and updated via source
             * code until we get a more robust model system.
             *
             * @param modelStr to use
             * @param isRetry if true, this indicates this is aleady a retry and should throw if fails
             */
            const fnGoModel = async (modelStr: string) => {
                if (!this._genAI) { throw new Error(`(UNEXPECTED) this._genAI falsy? (E: 503a0d9e3f729de7653ee3565b017b25)`); }
                const genModel = this._genAI.getGenerativeModel({
                    model: modelStr,
                    systemInstruction: systemPromptEntriesToSystemInstructionContent({ systemPromptEntries }),
                    tools: [{ functionDeclarations }],
                    toolConfig: {
                        functionCallingConfig: {
                            // mode: FunctionCallingMode.AUTO, // can be either text or function call, this is the default
                            mode:
                                info.overrideFunctionCallingMode ??
                                FunctionCallingMode.ANY, // MANDATES a function call. If this is not used, the model gets confused, but maybe this will be fixed after we get better function response feedback in place.
                        },
                    },
                });
                /**
                 * We start a "chat", _BUT ONLY TO USE THE HISTORY MECHANISM_.
                 * Really we use this as a one-off, but we do not know how to mimic
                 * the "history" so that the model understands to only respond to
                 * the most recent prompt.
                 */
                const chat = genModel.startChat({
                    history: chatPromptHistoryParts.map(x => x.content),
                });
                result = await chat.sendMessage(chatPromptCurrent.content.parts);
                return result;
            }

            let tryCount = 0;
            let modelStr = model;
            do {
                tryCount++;
                try {
                    result = await fnGoModel(modelStr);
                    break;
                } catch (error) {
                    if (error.status && error.status === GEMINI_ERROR_STATUS_MODEL_OVERLOADED) {
                        // model is overloaded, try using the backup
                        console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model. will try using backup model (${GEMINI_BACKUP_MODEL_STR}) for this next call. error (${error.status}): ${extractErrorMsg(error)} (E: a5cd7d174183518058da57cc6d0d8a25)`);
                        modelStr = GEMINI_BACKUP_MODEL_STR;
                    } else {
                        console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model. error (${error.status}): ${extractErrorMsg(error)} (E: a67d595c8ed313d458369d4d0b3e7f25)`);
                    }
                }
                await delay(2_000); // nothing fancy right now
            } while (!result && tryCount < GEMINI_MAX_TRY_COUNT);
            if (!result) { throw new Error(`couldn't get result from model (E: ede013a53f875d99a96a2e257c7e7125)`); }

            // const result = await genModel.generateContent(finalChatPrompt);
            const enhancedResult = result.response as EnhancedGenerateContentResponse;
            const functionCalls = enhancedResult.functionCalls();

            if (!functionCalls || functionCalls.length === 0) {
                if (logalot) { console.warn(`${lc} no function calls in response, returning text. (W: 3a4b8c940983b9e28e3f04c01a09bb25)`); }
                return { text: result.response.text() };
            }

            if (logalot) {
                console.log(`${lc} Gemini function calls:`);
                console.dir(functionCalls);
            }

            return {
                functionCalls: functionCalls.map(x => JSON.stringify(x, null, 2))
            };

        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    protected async createPromptInfoEntriesFromGeminiComment({
        commentIbGib,
    }: {
        commentIbGib: CommentIbGib_V1,
    }): Promise<PromptInfoEntryGemini[]> {
        const lc = `[${this.createPromptInfoEntriesFromGeminiComment.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 826a9d6b120d96532afbe1f7a22e8d25)`); }

            const validationErrors = await validateAgentWitnessCommentIbGib({ ibGib: commentIbGib });
            if (validationErrors.length > 0) {
                throw new Error(`validation errors with commentIbGib. Cannot create a prompt info entry. errors: ${validationErrors} (E: beee1893050f9bcf9842c66831595225)`);
            }

            // we know we have a valid agent witness comment at this point. So we
            // can pull extract the textSrc, etc., from it.
            let { safeIbCommentMetadataText: addlMetadataText } = parseCommentIb({ ib: commentIbGib.ib });
            if (!addlMetadataText) { throw new Error(`(UNEXPECTED) addlMetaDataText falsy? we just validated the comment ibgib, so there should be the expected shape of the comment.ib. (E: facf5801f9ba158b1526dd09d0e1b325)`); }
            let { textSrc, timestampInTicks, errorMsg, other } = parseAddlMetadataTextForAgentText({ addlMetadataText, ifError: 'warn' });
            if (errorMsg) { throw new Error(`(UNEXPECTED) errorMsg is truthy after parse addl metadata from comment.ib? we just validated the comment ibgib, so there should be the expected shape of the comment.ib. (? (E: 7fd7fac50851916f39ceccbe93446425)`); }
            if (!commentIbGib.data) { throw new Error(`(UNEXPECTED) commentIbGib.data falsy? (E: 8ce54d28219237feddf8f25b5846cc25)`); }
            if (!commentIbGib.data.text) { throw new Error(`(UNEXPECTED) commentIbGib.data.text falsy? (E: 8556fc95c401d1b5441454fceb8f2f25)`); }

            const isFCR = isFunctionCallRequestComment({ ibGib: commentIbGib });
            if (isFCR) {
                // 1. FCR should generate two entries: the function call entry and
                // the function response entry
                // 2. the role of the function call should be "model" and the role for
                // the function response should be "function"
                // 3. The FCR's info ibgibs must be loaded and iterated, with each
                // one containing info for a part of the function call entry and a
                // part for the function response entry.
                const functionInfoIbGibs: FunctionInfoIbGib_V1[] =
                    await this.getFunctionInfoIbGibs({ fcrCommentIbGib: commentIbGib });
                const functionCallParts: FunctionCallPart[] = [];
                const functionResponseParts: FunctionResponsePart[] = [];
                for (let functionInfoIbGib of functionInfoIbGibs) {
                    let { call, response } = getFunctionCallAndResponseParts({ functionInfoIbGib });
                    if (!call) { throw new Error(`(UNEXPECTED) call falsy? (E: 5c8f3bd6de3b300e1c105b9603bb7b25)`); }
                    if (!response) { throw new Error(`(UNEXPECTED) response falsy? (E: d0388c838975c93126c1a6d64f781d25)`); }
                    if (call.functionCall.name !== response.functionResponse.name) {
                        throw new Error(`(UNEXPECTED) functionCall.name !== functionResponse.name? (E: e49f0d60093354db2b6ad17fdf86d425)`);
                    }
                    functionCallParts.push(call);
                    functionResponseParts.push(response);
                }

                // at this point we have a collection of one or more function
                // call parts that correspond to a single chat message that the
                // model generated, so these will be role: "model".  we also
                // have function response parts that directly correspond to
                // those function call parts one-to-one, in order. So we add two entries to the chat:
                // 1. msg with function call entry/entries from role: "model"
                // 2. msg with function response entry/entries from role: "function"

                const functionCallEntry: PromptInfoEntryGemini = {
                    src: TextSource.AI,
                    content: {
                        role: textSourceToGeminiRole('ai'),
                        parts: functionCallParts,
                    },
                };
                const functionResponseEntry: PromptInfoEntryGemini = {
                    src: TextSource.FUNCTION, // throws error: Content with role 'user' can't contain 'functionResponse' part
                    // src: TextSource.AI,
                    content: {
                        // role: textSourceToGeminiRole('function'), // user
                        role: textSourceToGeminiRole(TextSource.FUNCTION), // model?
                        parts: functionResponseParts,
                    },
                };

                return [functionCallEntry, functionResponseEntry];
            } else {
                // non-FCR should just generate a single text part entry
                return [{
                    src: textSrc,
                    // text: commentIbGib.data.text,
                    content: {
                        role: textSourceToGeminiRole(textSrc),
                        parts: [{ text: commentIbGib.data.text } satisfies TextPart],
                    }
                }];
            }


        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    override async promptOneOff(opts: PromptOneOffOpts): Promise<string | undefined> {
        const lc = `${this.lc}[${this.promptOneOff.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }
            const { text, systemInstructions, } = opts;
            if (!text) { throw new Error(`(UNEXPECTED) opts.text falsy? (E: genuuid)`); }

            if (!this.data) { throw new Error(`(UNEXPECTED) this.data falsy? (E: genuuid)`); }
            const { api, model } = this.data;
            if (api !== 'gemini') { throw new Error(`api not supported: ${api} (E: genuuid)`); }

            // todo: refactor gemini-specific code into its own descendant class
            if (logalot) { console.log(`${lc} calling gemini api with model: ${model} (I: genuuid)`); }

            const apiKey = await this.fnGetAPIKey();
            if (!apiKey) {
                console.error(`${lc} apiKey falsy. did you set this.fnGetAPIKey (E: genuuid)`);
                return undefined; /* <<<< returns early */
            }
            this._genAI ??= new GoogleGenerativeAI(apiKey);


            /**
             * need to be able to call this function with retries with different
             * models, depending on error code received when generating text.
             *
             * ## driving intent
             *
             * I am getting a 503 error saying the model is overloaded. We need
             * to have a backup model that is hardcoded and updated via source
             * code until we get a more robust model system.
             *
             * @param modelStr to use
             * @param isRetry if true, this indicates this is aleady a retry and should throw if fails
             */
            const fnGoModel = async (modelStr: string) => {
                if (!this._genAI) { throw new Error(`(UNEXPECTED) this._genAI falsy? (E: genuuid)`); }
                const genModel = this._genAI.getGenerativeModel({
                    model: modelStr,
                    systemInstruction: systemInstructions,
                });
                /**
                 * We start a "chat", _BUT ONLY TO USE THE HISTORY MECHANISM_.
                 * Really we use this as a one-off, but we do not know how to mimic
                 * the "history" so that the model understands to only respond to
                 * the most recent prompt.
                 */
                // const chat = genModel.startChat({
                //     history: chatPromptHistoryParts.map(x => x.content),
                // });
                const result = await genModel.generateContent(text);
                if (result.response) {
                    return result.response.text();
                } else {
                    throw new Error(`not implemented (E: bbf05fe00da23d5b16c223bd200eaa25)`);
                }
            }

            let result: string | undefined = undefined;
            let tryCount = 0;
            let modelStr = model;
            let retryDelayInSeconds = 1;
            do {
                tryCount++;
                retryDelayInSeconds++;
                try {
                    let x: ErrorDetails
                    result = await fnGoModel(modelStr);
                    break;
                } catch (error) {
                    if (error.status && error.status === GEMINI_ERROR_STATUS_MODEL_OVERLOADED) {
                        if (modelStr === GEMINI_BACKUP_MODEL_STR) {
                            // already is the backup model, so we just fail
                            console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model: GEMINI_ERROR_STATUS_MODEL_OVERLOADED ${GEMINI_ERROR_STATUS_MODEL_OVERLOADED}. we are already using the backup model, so SOL here. will try again... error (${error.status}): ${extractErrorMsg(error)} (E: 9bb63cb520b8bd3bb85d2ca20715c825)`);
                        } else {
                            // model is overloaded, try using the backup
                            console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model: GEMINI_ERROR_STATUS_MODEL_OVERLOADED ${GEMINI_ERROR_STATUS_MODEL_OVERLOADED}. will try using backup model (${GEMINI_BACKUP_MODEL_STR}) for this next call. error (${error.status}): ${extractErrorMsg(error)} (E: b07a041bb97ea95b03cd6f9856f01525)`);
                            modelStr = GEMINI_BACKUP_MODEL_STR;
                        }
                    } else if (error.status && error.status === GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED) {
                        // quota exceeded, either try backup or wait for retry
                        if (modelStr === GEMINI_BACKUP_MODEL_STR) {
                            // nothing else to try, wait retry amount if possible
                            let errorDetails: ErrorDetails[] = error.errorDetails;
                            let retryInfo = errorDetails.find(x => x['@type'] === GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO);
                            retryDelayInSeconds = 30;
                            if (retryInfo && retryInfo[GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO_RETRY_DELAY_KEY]) {
                                // get more accurate wait time
                                let retryStr = retryInfo[GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO_RETRY_DELAY_KEY]! as string;
                                // retryStr from testing is in seconds, e.g., "41s". IF it's longer than a minute, I don't know/care (too long)
                                if (retryStr.match(/^\d+s$/)) {
                                    // valid retry str in seconds
                                    retryDelayInSeconds = Number.parseInt(retryStr.substring(0, retryStr.length - 1));
                                    if (Number.isNaN(retryDelayInSeconds)) {
                                        retryDelayInSeconds = 30;
                                    }
                                } else {
                                    retryDelayInSeconds = 30;
                                    console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model: GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED ${GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED}. Could not find valid retryInfo (errorDetails with retry info with a ${GEMINI_ERROR_DETAILS_TYPE_RETRY_INFO_RETRY_DELAY_KEY} with an "s"). So we'll just try waiting ${retryDelayInSeconds} seconds: ${extractErrorMsg(error)} (E: 986d9883fc72bf156f1691183e27ee25)`);
                                }
                            }
                        } else {
                            console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model: GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED ${GEMINI_ERROR_STATUS_RATE_QUOTA_EXCEEDED}. will try using backup model (${GEMINI_BACKUP_MODEL_STR}) for this next call. error (${error.status}): ${extractErrorMsg(error)} (E: 637ed809c659f55738becab83fc01825)`);
                        }
                        modelStr = GEMINI_BACKUP_MODEL_STR;
                    } else {
                        console.error(`${lc}[fnGoModel][${modelStr}] error trying to get result from model. error (${error.status}): ${extractErrorMsg(error)} (E: a67d595c8ed313d458369d4d0b3e7f25)`);
                    }
                }
                if (tryCount > 1) {
                    await delay(retryDelayInSeconds * 1000); // nothing fancy right now
                }
            } while (!result && tryCount < GEMINI_MAX_TRY_COUNT);

            return result;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * Gets the function info ibgibs associated with an {@link fcrCommentIbGib}
     * (Function Call Request IbGib) from this agent's superSpace.
     *
     * Note that these are fully loaded ibgibs based on just the addresses of
     * the FCR.
     *
     * @see {@link getSuperSpace}
     *
     * @returns the array of function info ibgibs that correspond to the FCR
     */
    async getFunctionInfoIbGibs({
        fcrCommentIbGib
    }: {
        /**
         * Function Call Request ibgib that should contain rel8ns to one or more
         * {@link FunctionInfoIbGib_V1}.
         */
        fcrCommentIbGib: CommentIbGib_V1
    }): Promise<FunctionInfoIbGib_V1[]> {
        const lc = `[${this.getFunctionInfoIbGibs.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: 976a684b7ae58cda523b17fc0c62e325)`); }

            let resFunctionInfoIbGibs: FunctionInfoIbGib_V1[] = [];

            // #region prepare
            if (!fcrCommentIbGib) {
                throw new Error(`${lc} fcrCommentIbGib is falsy. (E: a01c80f415ab8737a81b7b2a2f479f25)`);
            }
            if (!fcrCommentIbGib.data) {
                throw new Error(`${lc} fcrCommentIbGib.data is falsy. (E: a03bc3662a8d6f69c1c077605727a025)`);
            }

            const metaspace = this._metaspace;
            if (!metaspace) { throw new Error(`(UNEXPECTED) this.metaspace falsy. (E: 997d071847c5d7e80692f48191244e25)`); }

            const superSpace = await this.getSuperSpace(); // Use getSuperSpace to get the agent's super space.
            if (!superSpace) { throw new Error(`(UNEXPECTED) superSpace falsy? (E: dd1600f15e1e659c01f73991656a3325)`); }
            // #endregion prepare

            const functionInfoAddrs = (fcrCommentIbGib.rel8ns?.[FUNCTION_INFO_REL8N_NAME] ?? []) as IbGibAddr[];
            if (functionInfoAddrs.length === 0) {
                if (logalot) { console.warn(`${lc} no functionInfoAddrs (I: 5f8965e92c305689c11677a1148b7425)`); }
                return []; /* <<<< returns early */
            }

            if (logalot) { console.log(`${lc} functionInfoAddrs: ${functionInfoAddrs} (I: e7b1f5a4576c493326b913e48a505e25)`); }

            // get those ibgibs that correspond to the addrs in a single call
            // using this agent's metaspace.get and the superSpace
            const resGetFunctionInfos = await metaspace.get({
                addrs: functionInfoAddrs,
                space: superSpace,
            });
            if (!resGetFunctionInfos.success || !resGetFunctionInfos.ibGibs || resGetFunctionInfos.ibGibs.length !== functionInfoAddrs.length) {
                throw new Error(`${lc} could not retrieve function info ibgibs. errorMsg: ${resGetFunctionInfos.errorMsg ?? 'unknown error (E: 164246a6661d49f2b21d1b6769139625)'} (E: 0736d824876e420f91c089925191d425)`);
            }
            resFunctionInfoIbGibs = resGetFunctionInfos.ibGibs as FunctionInfoIbGib_V1[];
            if (logalot) { console.log(`${lc} resFunctionInfoIbGibs: ${pretty(resFunctionInfoIbGibs.map(x => getIbGibAddr({ ibGib: x })))} (I: a5661b5c449608f0e8d773135a599a25)`); }

            return resFunctionInfoIbGibs;
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }
    }

    /**
     * loads the dto as expected, then sets the class's properties.
     * @param dto with ibgib props (ib,gib,data,rel8ns)
     */
    override async loadIbGibDto(dto: IbGib_V1<AgentWitnessData_V1, AgentWitnessRel8ns_V1>): Promise<void> {
        const lc = `[${this.loadIbGibDto.name}]`;
        try {
            if (logalot) { console.log(`${lc} starting... (I: cb0b1e9e22fce321ca9a26e7a5d4c825)`); }
            await super.loadIbGibDto(dto);
            if (!this.data) { throw new Error(`(UNEXPECTED) this.data falsy after load dto? (E: 77aecd066b0bbbd0c66e2658519bdb25)`); }

            const metaspace = this._metaspace;
            if (!metaspace) { throw new Error(`(UNEXPECTED) metaspace falsy? (E: e5762b1e3f77f84ca338641edc011225)`); }
            const superSpace = await this.getSuperSpace();
            // const subSpace = await this.getSubSpace(); // unused now, but will be used once we get subspace mechanism going

            // available functions
            // first prune existing available functions...
            // await this.pruneDeprecatedAvailableFunctions_ifApplicable({
            //     dto, metaspace, superSpace,
            // });

            // ...now populate this.availableFunctions
            // we must do this in the timeline lock scope, because if the
            // timeline is updated mid-execution
            const fn = async () => {
                this.availableFunctions = new Map();
                for (const nameOrId of this.data!.availableFunctionNameOrIds) {
                    if (!nameOrId) {
                        throw new Error(`(UNEXPECTED) nameOrId falsy, driven by this.data.availableFunctionNameOrIds? somehow a falsy nameOrId saved? (E: 7b63f177624de2415e1569e96ef8d125)`);
                    }
                    const info = getAllFunctionInfos().get(nameOrId);
                    if (info) {
                        this.availableFunctions.set(nameOrId, info);
                    } else {
                        if (getDeprecatedFunctionInfoNames().includes(nameOrId)) {
                            if (logalot) { console.log(`${lc} function nameOrId (${nameOrId}) found as deprecated. not adding to available functions on agent. (I: 983864ad5cd8af915fb135580e455425)`); }
                        } else {
                            console.error(`no function info in getAllFunctionInfos() found corresponding to nameOrId (${nameOrId}) and this was not found in getDeprecatedFunctionInfoNames(). this is logged here but we're not throwing. (E: db0da9880cf1e414c3f1078d3e9f0b25)`);
                        }
                    }
                }

                // comment ibgibs

                // todo: refactor the following two code blocks with a helper function for DRY (would require a lambda for setting the prop I think but this is a lower priority ATOW 01/2024...do this if I revisit this section of code by necessity)
                // todo: implement caching for comment ibgibs
                const rel8dAddrs_system = this.rel8ns?.system ?? [];
                if (rel8dAddrs_system.length > 0) {
                    const resGet_systemComments = await metaspace.get({
                        addrs: rel8dAddrs_system, space: superSpace,
                    });
                    if (!resGet_systemComments.success || resGet_systemComments.errorMsg) {
                        throw new Error(`couldn't get system comments. error: ${extractErrorMsg(resGet_systemComments.errorMsg ?? 'unknown error (E: c0b4d7aab724bcf58e88ffd496de8825)')} (E: 7925d4b5ec3a8f7a648c109941c38a25)`);
                    } else if ((resGet_systemComments.ibGibs ?? []).length !== rel8dAddrs_system.length) {
                        throw new Error(`(UNEXPECTED) (resGet_systemComments.ibGibs ?? []).length !== rel8dAddrs_system.length, but resGet.success truthy and resGet.errorMsg falsy? (E: 2055553b602e6c2fe49e956a1e423f25)`);
                    } else {
                        this.commentIbGibs_system = resGet_systemComments.ibGibs! as CommentIbGib_V1[];
                    }
                }
                const rel8dAddrs_chat = this.rel8ns?.chat ?? [];
                if (rel8dAddrs_chat.length > 0) {
                    const resGet_chatComments = await metaspace.get({
                        addrs: rel8dAddrs_chat, space: superSpace,
                    });
                    if (!resGet_chatComments.success || resGet_chatComments.errorMsg) {
                        throw new Error(`couldn't get chat comments. error: ${extractErrorMsg(resGet_chatComments.errorMsg ?? 'unknown error (E: c0b4d7aab724bcf58e88ffd496de8825)')} (E: 7925d4b5ec3a8f7a648c109941c38a25)`);
                    } else if ((resGet_chatComments.ibGibs ?? []).length !== rel8dAddrs_chat.length) {
                        throw new Error(`(UNEXPECTED) (resGet_chatComments.ibGibs ?? []).length !== rel8dAddrs_chat.length, but resGet.success truthy and resGet.errorMsg falsy? (E: 2055553b602e6c2fe49e956a1e423f25)`);
                    } else {
                        this.commentIbGibs_chat = resGet_chatComments.ibGibs! as CommentIbGib_V1[];
                    }
                }
            };

            // const lockScope = await getLockScope({ timeline: this });

            await execInSpaceWithLocking({
                scope: 'prune',
                secondsValid: 60,     // Example timeout
                maxDelayMs: 100,       // Example delay
                maxLockAttempts: 1800, // Example attempts
                space: superSpace,
                callerInstanceId: getTimestampInTicks(),
                fn,
            });

            // todo: load subspace artifacts once we get that mechanism going
        } catch (error) {
            console.error(`${lc} ${extractErrorMsg(error)}`);
            throw error;
        } finally {
            if (logalot) { console.log(`${lc} complete.`); }
        }

    }

}

// register the factory function with the agents svc
setTimeout(() => {
    let agentsSvc = getAgentsSvc();
    agentsSvc.registerFactory({
        classname: AgentWitnessGemini_V1.name,
        fnDtoToAgentWitness: async (dto: IbGib_V1) => {
            if (!dto.data) {
                return { applies: false, }
            } else if (!dto.data.classname) {
                return { applies: false, }
            } else if (dto.data.classname === AgentWitnessGemini_V1.name) {
                const agent = await agentIbGibDtoToWitness({
                    agentIbGib: dto as AgentWitnessIbGib_V1,
                });
                return { applies: true, agent };
            } else {
                return { applies: false, }
            }
        },
    })
});


export function getTextPartForCurrentContextTjpAddr({
    currentContextTjpAddr
}: {
    currentContextTjpAddr: string;
}): string {
    const lc = `[${getTextPartForCurrentContextTjpAddr.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: 7edafbba277d57eae51af325cf7eb225)`); }
        const info = getGibInfo({ ibGibAddr: currentContextTjpAddr });
        // if (info.isPrimitive) {
        // do I even care at this point? maybe I'll use primitives as some
        // kind of global variable reference or something...commenting out
        // because maybe YAGNI
        // }
        return `Your current context ibGibAddr is ${currentContextTjpAddr}\nIt is very important that you use THIS context address. THIS context address takes precedence over previous contexts in your system chat history, because those chats may be from previous sessions per the user's POV. If there are any doubts, like if you're saying something and the user is not responding, then this may be the reason. You should call the function to get your context to be sure you are talking in the right one.`;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
