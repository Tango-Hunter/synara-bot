/**
 * Title: motivational-scheduler.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/23/26
 * Description: Creates Schedule for nightly motivational SYNARA reflections.
 */

const cron = require('node-cron');

const axios = require('axios');

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
    getGuildConfig
} = require('../../core/config/guild-config');

const {
    featureFlags
} = require('../../core/config/feature-flags');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    logInfo,
    logError,
    logFeature
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

        const quoteResponse =
            await axios.get(

                'https://zenquotes.io/api/today'
            );

        const quoteData =
            quoteResponse.data[0];
        const quote =
            quoteData.q;
        const author =
            quoteData.a;

        const userPrompt = `

Generate a short SYNARA reflection inspired by this quote:

${quote}

Requirements:

- Maximum 2 sentences
- Keep under 80 words
- Maintain SYNARA personality
- Emotionally restrained
- Intelligent and observational
- Occasionally dry or analytical
- Avoid sounding inspirational
- Avoid sounding robotic
- Avoid excessive philosophy
- Plain text only
- Do not repeat the quote
`;

        const response =
            await generateResponse({

                systemPrompt,
                userPrompt,
                maxTokens: 120
            });

        const finalResponse =
            response ||

            'Night cycle acknowledged. Reflection data unavailable.';

        const guildIds = [

            '1416462287341883477',
            '1430018484775030919'
        ];

        for (const guildId of guildIds) {

            const guildConfig =

                getGuildConfig(
                    guildId
                );

            if (
                !guildConfig
                ||
                !guildConfig.features
                    ?.motivationalScheduler
            ) {
                continue;
            }

            const channelId =

                guildConfig
                    .schedulers
                    .nightlyChannelId;

            const embed =
                buildEmbed({

                    type:
                        'nightly',
                    title:
                        'Nightly Reflection',
                    description:
`
"${quote}"

— ${author}

${finalResponse}
`
                });

            await sendDiscordMessage({

                channelId,
                embed
            });

            await discordLog({

                guildId,

                category:
                    'NIGHTLY',

                details:
                    'Nightly reflection posted',

                status:
                    'SUCCESS'
            });

            logFeature({

                category:
                    'NIGHTLY',

                message:
                    'Nightly reflection posted',

                details: {

                    guildId,

                    channelId
                }
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
