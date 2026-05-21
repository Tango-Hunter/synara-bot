/**
 * Title: openai-config.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized OpenAI configuration.
 */

const openaiConfig = {

    model: 'gpt-5.5',

    timeoutMs: 15000,

    maxRetries: 3,

    baseRetryDelayMs: 1000,

    maxTokens: {

        commands: 200,

        mentions: 500,

        scheduler: 350
    }
};

module.exports = {
    openaiConfig
};
