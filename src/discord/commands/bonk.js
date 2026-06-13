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
    styles
} = require('../databases/commentary-styles.json');

const {
    logCommand,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


const bonkCooldowns = new Map();


function getRandomStyle() {
    return styles[
        Math.floor(
            Math.random() *
            styles.length
        )
    ];
}

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

        now - lastBonk < 10000

    ) {

        const cooldownTimer =
            (10 - ((now - lastBonk) / 1000)).toFixed(0);

        return {
            message:
                `Bonk cooldown active. Please wait ${cooldownTimer} seconds.`
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

    const aiCommentary =
        !selfBonk

        &&

        roll < 0.11;

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

    /*
    ===============================
    Self Bonk (1%)
    ===============================
    */
    if (
        selfBonk
    ) {

        return {
            message:

`⚠ **BONK ERROR**

The bonk missed and instead bonked the sender.

<@${victim.id}> has now been bonked ${bonkCount} times.`
        };
    }

    /*
    ===============================
    AI Commentary (10%)
    ===============================
    */
    if (
        aiCommentary
    ) {

        try {

            const systemPrompt =
                buildSystemPrompt();

            const style =
                getRandomStyle();

            const userPrompt = `

You are SYNARA.

A bonk event has occurred.

Bonker:
${message.author.username}

Victim:
${victim.username}

Bonk Count:
${bonkCount}

Commentary Style:
${style}

Requirements:

- Stay in character
- Brief commentary
- 1 to 3 sentences
- Dry humor, analysis, or light sarcasm
- Do not repeat the event details
- Do not restate the bonk count
- Treat the bonk as a recorded event
- Response should have the inflection the commentary style
`;

            const commentary =
                await generateResponse({
                    systemPrompt,
                    userPrompt,
                    maxTokens: 120
                });

            return {
                message:

`

<@${message.author.id}> just bonked <@${victim.id}>.

They have been bonked ${bonkCount} times.

**SYNARA COMMENTARY**

${commentary}`
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

`**BONK**

<@${message.author.id}> just bonked <@${victim.id}>.

They have been bonked ${bonkCount} times.

**SYNARA COMMENTARY**

This interaction has been archived for future analysis.`
            };
        }
    }

    /*
    ===============================
    Normal Bonk (89%)
    ===============================
    */
    return {
        message:

`**BONK**

<@${message.author.id}> just bonked <@${victim.id}>.

They have been bonked ${bonkCount} times.`
    };
}

module.exports = {
    runBonkCommand
};
