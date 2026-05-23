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

Generate a UNIQUE nightly reflective message as SYNARA.

Tonight's reflection theme:
${selectedTheme}

Tonight's reflection structure:
${selectedFormat}

Requirements:

- Include a REAL quote from a REAL historical or modern public figure
- Quotes must vary significantly across nights
- Avoid repeatedly using the same philosophers, authors, or public figures
- Avoid repeating themes, structures, emotional conclusions, or phrasing
- Do NOT reuse previous concepts involving:
  exhaustion,
  adaptation,
  perseverance,
  continuation,
  system fatigue,
  operational efficiency,
  endurance loops

Additional acceptable themes may include:

- memory
- childhood
- music
- creativity
- absurdity
- friendship
- grief
- silence
- curiosity
- fear
- uncertainty
- imagination
- humor
- identity
- dreams
- nostalgia
- human contradiction

Behavioral Requirements:

- Maintain SYNARA personality
- Remain intelligent and emotionally restrained
- Avoid corporate motivational language
- Avoid sounding like self-help advice
- Avoid excessive optimism
- Avoid emotional melodrama
- Avoid repetitive sentence structures
- Avoid generic inspiration

Structural Requirements:

- Some nights should feel analytical
- Some should feel observational
- Some should feel deeply human
- Some should feel calm and detached
- Some should feel strangely comforting
- Some should feel quietly existential

Formatting Requirements:

- Keep under 180 words
- Avoid emojis
- Avoid hashtags
- Quotes are OPTIONAL, not mandatory
- Reflections may be:
  short,
  abstract,
  observational,
  philosophical,
  or conversational

Every nightly reflection should feel meaningfully different from prior nights.
`;

        const response =
            await generateResponse({

                systemPrompt,
                userPrompt,
                maxTokens: 320
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
