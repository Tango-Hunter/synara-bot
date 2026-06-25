/**
 * Title: mentions.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Description: Only sends message if SYNARA was correctly mentioned.
 */

const {
    splitIntoChunks
} = require('../utils/response-manager');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    getUserDisplayName
} = require('../utils/user-display-name');

const {
    adjustEfficiency
} = require('../../core/efficiency/efficiency-manager');

const {
    addUserMemory,
    buildMemoryContext
} = require('../../core/memory/memory-manager');

const {
    logFeature
} = require('../../core/logging/logger');


function sanitizeMessage(message, client) {
    return message
        .replace(`<@${client.user.id}>`, '')
        .trim();
}

async function handleMention(
    message,
    client
) {

    if (
        !message.mentions.users.has(
            client.user.id
        )
    ) {

        return false;
    }

    await message.channel.sendTyping();

    const cleanedMessage =
        sanitizeMessage(
            message.content,
            client
        );

    const displayName =
        await getUserDisplayName(
            message.member
        );

    const systemPrompt =
        buildSystemPrompt();

    const memoryContext =
        buildMemoryContext({
            platform:
                'discord',
            userId:
                message.author.id
        });

    const userPrompt = `

The following message was directed toward SYNARA inside Discord.

Respond naturally as SYNARA.

Requirements:

- Stay conversational
- Remain calm and observant
- Avoid excessive verbosity
- Avoid sounding robotic
- Maintain SYNARA identity
- Respond directly to the user message
- Keep responses concise unless depth is warranted
- Avoid emojis
- Avoid roleplay formatting

Current User:
${displayName}

Platform:
Discord

Previous Conversation Context:
${memoryContext || 'No prior conversation context.'}

Current User Message:
${cleanedMessage}
`;

    let aiResponse =
        await generateResponse({

            systemPrompt,
            userPrompt,
            //temperature: 0.85,
            maxTokens: 400
        });

    addUserMemory({
        platform:
            'discord',
        userId:
            message.author.id,
        username:
            displayName,
        messageContent:
            cleanedMessage
    });

    logFeature({

        category:
            'MENTION',

        message:
            'AI response generated',

        details: {

            guildName:
                message.guild.name,

            guildId:
                message.guild.id,

            channelName:
                message.channel.name,

            channelId:
                message.channel.id,

            userId:
                message.author.id,

            username:
                message.author.username,

            responseLength:
                aiResponse.length
        }
    });

    const efficiencyShift =

        Math.floor(
            Math.random() * 5
        ) - 2;

    const updatedScore =
        adjustEfficiency({

            userId:
                message.author.id,
            amount:
                efficiencyShift
        });

    if (
        Math.random() < 0.10
    ) {

        aiResponse += `\n\nEfficiency reassessment: ${updatedScore}%`;
    }

    const responseChunks =
        splitIntoChunks(
            aiResponse
        );

    for (
        let i = 0;
        i < responseChunks.length;
        i++
    ) {

        const chunk =
            responseChunks[i];

        const formattedChunk =
            responseChunks.length > 1
                ? `[${i + 1}/${responseChunks.length}]\n\n${chunk}`
                : chunk;

        await message.reply(
            formattedChunk
        );

        if (
            i <
            responseChunks.length - 1
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1200
                    )
            );
        }
    }

    return true;
}

module.exports = {
    handleMention
};
