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
    validateResponse
} = require('./response-validator');
const {
    logError,
    logInfo
} = require('../logging/logger');
const {
    ERROR_TYPES
} = require('../logging/error-types');

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15000;
const BASE_RETRY_DELAY_MS = 1000;

function delay(ms) {

    return new Promise(

        resolve => setTimeout(
            resolve,
            ms
        )
    );
}

async function generateResponse({

    systemPrompt,

    userPrompt,

    maxTokens = 500

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
                    `Attempt ${attempt}/${MAX_RETRIES}`
            });

            const completion =
                await Promise.race([

                    openai.chat.completions.create({

                        model: 'gpt-5.5',

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
                            maxTokens
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
                completion
                    .choices?.[0]
                    ?.message
                    ?.content;

            const validatedResponse =
                validateResponse(
                    rawResponse
                );

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
                    `Retrying in ${retryDelay}ms`
            });

            await delay(
                retryDelay
            );
        }
    }
}

module.exports = {
    generateResponse
};
