/**
 * Title: qotd-scheduler.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: Creates Schedule for the Question of the day prompt.
 */

const cron = require('node-cron');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    sendDiscordMessage
} = require('../services/post-message');

const {
    logInfo,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');

async function runDailyQuestion() {

    try {

        console.log(

            '[DAILY QUESTION] Generating question...'
        );

        const systemPrompt =
            buildSystemPrompt();

        const userPrompt = `

Generate a thoughtful Question of the Day as SYNARA.

Requirements:

- Focus on reflection, growth, perspective, behavior, creativity, discipline, relationships, curiosity, or purpose
- Feel intelligent and emotionally grounded
- Avoid sounding corporate or motivational-speaker style
- Avoid excessive length
- Keep under 120 words
- The message should feel conversational and natural
- End with a single thoughtful question
- Avoid emojis
- Maintain SYNARA personality

`;

        const response =
            await generateResponse({

                systemPrompt,

                userPrompt,

                maxTokens: 220
            });

            const channelIds = [
                '1430018485408366740', // Void Army #general
                '1416462288575135746', // Hunter's Lodge #general
            ];

            for (const channelId of channelIds) {

                await sendDiscordMessage({
                    channelId,
                    message: response
                });
            }

        logInfo({
            source:
                'qotd-scheduler',
            message:
                'Question of the day posted successfully.'
        });

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.SCHEDULER_ERROR,
            source:
                'qotd-scheduler',
            message:
                error.message
        });
    }
}

function startDailyQuestionScheduler() {

    cron.schedule(

        '0 8 * * *',

        async () => {
            await runDailyQuestion();

        },

        {
            timezone:
                'America/New_York'
        }
    );

    console.log(
        '[SCHEDULER] Daily Question Scheduler Active'
    );
}

module.exports = {
    startDailyQuestionScheduler
};
