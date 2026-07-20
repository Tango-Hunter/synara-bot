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
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    getEnabledGuilds
} = require('../../core/database/feature-flags-repository');

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

const qotdDatabase =
    require('../databases/qotd-database.json');


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

            const selectedEntry =

                qotdDatabase[
                    Math.floor(
                        Math.random() *
                        qotdDatabase.length
                    )
                ];

            const {
                question,
                theme,
                tone
            } = selectedEntry;

        const userPrompt = `

A Question of the Day has already been selected.

Theme:
${theme}

Tone:
${tone}

Question:
${question}

Generate ONLY a short SYNARA reflection for this question.

Requirements:

- Maximum 2 sentences
- Keep under 60 words
- Maintain SYNARA personality
- Observational and intelligent
- Occasionally dry or slightly sarcastic
- Avoid sounding inspirational
- Avoid sounding robotic
- Avoid excessive philosophy
- Plain text only
- Do not repeat the question
`;

        const response =
            await generateResponse({

                systemPrompt,
                userPrompt,
                maxTokens: 120
            });

        const guildIds =
            await getEnabledGuilds(
                'qotdScheduler'
            );

        for (
            const guildId of guildIds
        ) {

            const channelId =
                await getGuildSetting({

                    guildId,

                    settingName:
                        'channel_qotd'
                });

            if (
                !channelId
            ) {
                await discordLog({

                    guildId,

                    title:
                        'QOTD',

                    category:
                        'Automated Message',

                    details:
                        'QOTD channel not configured',

                    status:
                        'WARNING'
                });

                continue;
            }

            const embed =
                buildEmbed({

                    type:
                        'qotd',
                    title:
                        'Good Morning',
                    description:
`
**Question of the Day**

${question}

**SYNARA's Reflection**

${response}
`
                    });

                try {
                    await sendDiscordMessage({

                        channelId,

                        embed
                    });
                }

                catch (error) {
                    await discordLog({

                        guildId,

                        title:
                            'QOTD',

                        category:
                            'Automated Message',

                        details:
                            `Failed to post question: ${error.message}`,

                        status:
                            'ERROR'
                    });

                    continue;
                }

                await discordLog({

                    guildId,

                    title:
                        'QOTD',

                    category:
                        'Automated Message',

                    details:
                        'Question of the Day posted',

                    status:
                        'SUCCESS'
                });

                logFeature({

                    category:
                        'QOTD',

                    message:
                        'Question posted',

                    details: {

                        guildId,

                        channelId,

                        theme
                    }
                });
            }

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
    startDailyQuestionScheduler,
    runDailyQuestion
};
