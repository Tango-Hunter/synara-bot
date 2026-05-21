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
    registerScheduler
} = require('../../core/scheduler/schedule-guard');

const {
    schedulerConfig
} = require('../../core/config/scheduler-config');

const {
    discordConfig
} = require('../../core/config/discord-config');

const {
    featureFlags
} = require('../../core/config/feature-flags');

const {
    logInfo,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');

async function runDailyQuestion() {

    try {

        logInfo({
            source:
                'qotd-scheduler',
            message:
                'Generating question of the day.'
        });

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

            const channelIds =
                discordConfig.channels.qotd;

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

    if (
        !featureFlags.qotdScheduler
    ) {
        return;
    }

    const schedulerRegistered =
        registerScheduler(
            'daily-question'
        );
    if (!schedulerRegistered) {
        return;
    }

    cron.schedule(

        schedulerConfig.schedules.qotd,

        async () => {
            await runDailyQuestion();

        },

        {
            timezone:
                schedulerConfig.timezone
        }
    );

    logInfo({
        source:
            'qotd-scheduler',
        message:
            'QOTD scheduler registered.'
    });
}

module.exports = {
    startDailyQuestionScheduler
};
