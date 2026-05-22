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

Generate a Question of the Day for a Discord community.

The question should feel natural, socially engaging, and varied.

The topic can be:

- entertainment
- gaming
- anime
- nostalgia
- music
- internet culture
- food
- hobbies
- personal experiences
- technology
- hypothetical scenarios
- funny preferences
- life memories
- random curiosity
- creativity
- emotional reflection
- storytelling

Avoid making every question overly philosophical or self-improvement focused.

The goal is to encourage casual community conversation.

After the question:

Add a SHORT and subtle SYNARA reflection.

The reflection should:

- feel observational
- remain concise
- avoid sounding inspirational
- avoid sounding robotic
- avoid excessive depth
- occasionally sound curious
- occasionally sound analytical
- sometimes slightly sarcastic or dry
- Maintain SYNARA personality

Format:

**Question of the Day**

<Question>

**SYNARA's Reflection**

<Short reflection>
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
