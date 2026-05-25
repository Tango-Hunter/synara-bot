/**
 * Title: motivational-scheduler.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/23/26
 * Description: Creates Schedule for nightly motivational SYNARA reflections.
 */

const cron = require('node-cron');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    buildEmbed
} = require('../services/embed-builder');

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

const reflectionThemes = [
    'nostalgia',
    'identity',
    'friendship',
    'fear',
    'hope',
    'loneliness',
    'curiosity',
    'music',
    'art',
    'rest',
    'memory',
    'creativity',
    'uncertainty',
    'routine',
    'humor',
    'discipline',
    'loss',
    'human nature',
    'change',
    'dreams',
    'silence',
    'aging',
    'purpose',
    'imagination',
    'ambition',
    'resilience',
    'failure',
    'connection'
];

const reflectionFormats = [
    'short reflection',
    'observational monologue',
    'analytical reflection',
    'quiet philosophical observation',
    'gentle closing message',
    'humanity analysis',
    'reflective commentary',
    'subtle motivational reflection'
];

function getRandomItem(array) {

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];
}

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

        const selectedTheme =
            getRandomItem(
                reflectionThemes
            );

        const selectedFormat =
            getRandomItem(
                reflectionFormats
            );

        const userPrompt = `

Generate a unique nightly reflection as SYNARA.

Theme:
${selectedTheme}

Structure:
${selectedFormat}

Requirements:

- Maintain SYNARA personality
- Intelligent, restrained, reflective tone
- Avoid corporate motivation and self-help language
- Avoid excessive optimism or melodrama
- Include a real quote from a historical or modern public figure
- Vary themes, emotional tone, and sentence structure naturally
- Keep the reflection under 180 words
- Plain text only
- No markdown, hashtags, emojis, or lists

The reflection should feel thoughtful, atmospheric, and distinct from previous nights.
`;

        const response =
            await generateResponse({

                systemPrompt,
                userPrompt,
                maxTokens: 400
            });

        const finalResponse =
            response ||

            'Night cycle acknowledged. Reflection data unavailable.';

        const channelIds =
            discordConfig.channels.nightlyMessages;

        for (const channelId of channelIds) {

            const embed =
                buildEmbed({

                    type:
                        'nightly',
                    title:
                        'Nightly Reflection',
                    description:
                        finalResponse
                });

            await sendDiscordMessage({

                channelId,
                embed
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

    if (
        !schedulerRegistered
    ) {

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
