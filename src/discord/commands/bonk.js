/**
 * Title: bonk.js
 * Author: Tango Hunter
 * Date Created: 6/11/26
 * Description: Prompt for the !bonk command.
 */

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    getFeatureFlag
} = require('../../core/database/feature-flags-repository');

const {
    recordBonk,
    getBonkCount
} = require('../../core/database/bonk-repository');

const {
    logCommand,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


const bonkCooldowns = new Map();


async function runBonkCommand({
    message
}) {

    const enabled =
        await getFeatureFlag({

            guildId:
                message.guild.id,

            featureName:
                'bonks'
        });

    if (
        !enabled
    ) {
        return {

            message:
                'Bonk functionality is disabled.'
        };
    }

    const target =
        message.mentions.users.first();

    if (
        !target
    ) {
        return {

            message:
                'Specify a user to bonk.'
        };
    }

    if (
        target.bot
    ) {
        return {

            message:
                'SYNARA refuses to participate in inter-bot violence.'
        };
    }

    const cooldownKey =
        `${message.guild.id}-${message.author.id}`;

    const now =
        Date.now();

    const lastBonk =
        bonkCooldowns.get(
            cooldownKey
        );

    if (
        lastBonk

        &&

        now - lastBonk < 30000
    ) {
        return {

            message:
                'Bonk cooldown active. Please wait 30 seconds.'
        };
    }

    bonkCooldowns.set(

        cooldownKey,

        now
    );

    const roll =
        Math.random();

    const selfBonk =
        roll < 0.01;

    const victim =
        selfBonk

            ? message.author

            : target;

    await recordBonk({

        guildId:
            message.guild.id,

        userId:
            victim.id,

        username:
            victim.username,

        received:
            true
    });

    await recordBonk({

        guildId:
            message.guild.id,

        userId:
            message.author.id,

        username:
            message.author.username,

        given:
            true
    });

    const bonkCount =
        await getBonkCount({

            guildId:
                message.guild.id,

            userId:
                victim.id
        });

    logCommand({

        command:
            '!bonk',

        username:
            message.author.username,

        channelId:
            message.channel.id
    });

    // ===============================
    // Self Bonk (1%)
    // ===============================
    if (
        selfBonk
    ) {
        return {
            message:

                `⚠ BONK ERROR\n\nThe bonk packet looped back to sender.\n\n<@${victim.id}> has now been bonked ${bonkCount} times.`
        };
    }

    // ===============================
    // AI Commentary (10%)
    // ===============================
    if (
        roll < 0.11
    ) {

        try {

            const systemPrompt =
                buildSystemPrompt();

            const userPrompt = `

Generate a short bonk commentary as SYNARA.

Requirements:

- Mention that ${message.author.username} bonked ${victim.username}
- Mention that ${victim.username} has now been bonked ${bonkCount} times
- Keep under 100 words
- 1 to 4 short sentences
- Dry humor, observational humor, or light sarcasm
- Do not insult users
- Do not use emojis
- Do not use hashtags
- Treat the bonk as a real recorded event
- Vary the response naturally

Current User:
${message.author.username}

Current Platform:
Discord
`;

            const response =
                await generateResponse({

                    systemPrompt,

                    userPrompt,

                    maxTokens: 180
                });

            return {
                message:
                    response
            };

        } catch (error) {

            logError({

                type:
                    ERROR_TYPES.OPENAI_ERROR,

                source:
                    'bonk-ai-commentary',

                message:
                    error.message,

                details: {

                    guildId:
                        message.guild.id,

                    userId:
                        message.author.id
                }
            });

            return {
                message:

                    `Bonk recorded.\n\nThis interaction has been archived for future embarrassment.\n\n<@${victim.id}> has now been bonked ${bonkCount} times.`
            };
        }
    }

    // ===============================
    // Normal Bonk (89%)
    // ===============================
    return {
        message:

            `<@${message.author.id}> just bonked <@${victim.id}>.\n\nThey have been bonked ${bonkCount} times.`
    };
}

module.exports = {
    runBonkCommand
};
