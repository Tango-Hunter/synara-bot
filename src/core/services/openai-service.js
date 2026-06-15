/**
 * Title: openai-service.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/20/26
 * Description:
 * Centralized OpenAI service with:
 * - timeout protection
 * - retry handling
 * - exponential backoff
 * - graceful fallbacks
 */

const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey:
        process.env.OPENAI_API_KEY
});

const {
    openaiConfig
} = require('../config/openai-config');

const {
    validateResponse
} = require('./response-validator');
const {
    logError,
    logInfo,
    logFeature
} = require('../logging/logger');
const {
    ERROR_TYPES
} = require('../logging/error-types');


const MAX_RETRIES =
    openaiConfig.maxRetries;
const REQUEST_TIMEOUT_MS =
    openaiConfig.timeoutMs;
const BASE_RETRY_DELAY_MS =
    openaiConfig.baseRetryDelayMs;
const MAX_TOKENS =
    openaiConfig.maxTokens.mentions;


function delay(ms) {

    return new Promise(

        resolve => setTimeout(
            resolve,
            ms
        )
    );
}


/*
====================================
RESPONSE GENERATION
====================================
*/
async function generateResponse({

    systemPrompt,
    userPrompt,
    MAX_TOKENS

}) {

    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            logInfo({
                source:
                    'openai-service',
                message:
                    `OpenAI request attempt ${attempt}/${MAX_RETRIES}`
            });

            const completion =
                await Promise.race([

                    openai.chat.completions.create({

                        model:
                            openaiConfig.model,

                        messages: [

                            {
                                role: 'system',
                                content: systemPrompt
                            },

                            {
                                role: 'user',
                                content: userPrompt
                            }
                        ],

                        max_completion_tokens:
                            MAX_TOKENS
                    }),

                    new Promise((_, reject) =>

                        setTimeout(() =>

                            reject(
                                new Error(
                                    'OpenAI request timed out.'
                                )
                            ),

                            REQUEST_TIMEOUT_MS
                        )
                    )
                ]);

            const rawResponse =
                completion?.choices?.[0]?.message?.content
                ||
                '';

            logFeature({

                category:
                    'OPENAI',

                message:
                    'Raw completion metadata',

                details: {

                    finishReason:
                        completion?.choices?.[0]?.finish_reason,

                    contentLength:
                        completion?.choices?.[0]?.message?.content?.length,

                    usage:
                        completion?.usage
                }
            });

            const validatedResponse =
                validateResponse(
                    rawResponse
                );

            logFeature({

                category:
                    'OPENAI',

                message:
                    'Response generated',

                details: {

                    model:
                        openaiConfig.model,

                    attempt
                }
            });

            return validatedResponse;

        } catch (error) {

            logError({

                type:
                    ERROR_TYPES.OPENAI_ERROR,
                source:
                    'openai-service',
                message:
                    error.message,
                details: {
                        attempt
                    }
            });

            const isFinalAttempt =
                attempt === MAX_RETRIES;

            if (isFinalAttempt) {

                logError({

                    type:
                        ERROR_TYPES.OPENAI_ERROR,
                    source:
                        'openai-service',
                    message:
                        'All retry attempts failed.'
                });

                return (
                    'System instability detected. Response generation temporarily unavailable.'
                );
            }

            const retryDelay =
                BASE_RETRY_DELAY_MS *
                Math.pow(
                    2,
                    attempt - 1
                );

            logInfo({

                source:
                    'openai-service',
                message:
                    `Retry scheduled in ${retryDelay}ms`
            });

            await delay(
                retryDelay
            );
        }
    }
}

/*
====================================
IMAGE GENERATION
====================================
*/
async function generateImage({

    prompt
}) {

    try {

        const result =

            await openai.images.generate({

                model:
                    openaiConfig.imageModel,

                prompt,

                size:
                    '1024x1024'
            });

        const imageBase64 =

            result.data?.[0]?.b64_json;

        if (
            !imageBase64
        ) {

            throw new Error(
                'Image generation failed.'
            );
        }

        return Buffer.from(

            imageBase64,

            'base64'
        );

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.OPENAI_ERROR,

            source:
                'openai-service',

            message:
                error.message
        });

        throw error;
    }
}

module.exports = {
    generateResponse,
    generateImage
};
