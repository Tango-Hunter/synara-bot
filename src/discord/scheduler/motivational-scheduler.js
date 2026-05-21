/**
 * Title: motivational-scheduler.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: Creates Schedule for the motivational prompt.
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

async function runNightlyMessage() {

    try {

        logInfo({
            source:
                'motivational-scheduler',
            message:
                'Generating nightly message.'
        });

        const systemPrompt =
            buildSystemPrompt();

        const userPrompt = `

Generate a nightly reflective message as SYNARA.

Requirements:

- Include a REAL quote from a historical or modern public figure
- The quote must feel meaningful and emotionally grounded
- Themes may include:
  resilience,
  growth,
  discipline,
  purpose,
  failure,
  ambition,
  reflection,
  mortality,
  creativity,
  perseverance,
  wisdom,
  human nature
- Avoid fake inspirational language
- Avoid corporate motivational tone
- Avoid excessive optimism
- The response should feel calm, intelligent, and reflective
- Keep under 180 words
- Include a short SYNARA reflection before or after the quote
- Maintain SYNARA personality
- Avoid emojis
- Avoid hashtags
`;

        const response =
            await generateResponse({
                systemPrompt,
                userPrompt,
                maxTokens: 320
            });

        const channelIds =
            discordConfig.channels.nightlyMessages;

        for (const channelId of channelIds) {

            await sendDiscordMessage({
                channelId,
                message: response
            });

            logInfo({
                source:
                    'motivational-scheduler',
                message:
                    `Nightly message posted to ${channelId}`
            });
        }

        logInfo({
            source:
                'motivational-scheduler',
            message:
                'Nightly message posted successfully.'
        });

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.SCHEDULER_ERROR,
            source:
                'motivational-scheduler',
            message:
                error.message
        });
    }
}

function startNightlyMessageScheduler() {

    if (
        !featureFlags.nightlyScheduler
    ) {
        return;
    }

    const schedulerRegistered =
        registerScheduler(
            'nightly-message'
        );
    if (!schedulerRegistered) {
        return;
    }

    cron.schedule(

        schedulerConfig.schedules.nightlyMessage,

        async () => {
            await runNightlyMessage();

        },

        {
            timezone:
                schedulerConfig.timezone
        }
    );

    logInfo({
        source:
            'motivational-scheduler',
        message:
            'Nightly scheduler registered.'
    });
}

module.exports = {
    startNightlyMessageScheduler,
    runNightlyMessage
};
