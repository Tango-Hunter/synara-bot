/**
 * Title: mentions.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Only sends message if SYNARA was correctly mentioned.
 */

const {
    sanitizeMessage
} = require('../../shared/utils/sanitize-message');

const {
    splitIntoChunks
} = require('../../shared/utils/response-manager');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    addUserMemory,
    buildMemoryContext
} = require('../../core/memory/memory-manager');

const {
    buildChannelContext
} = require('../services/channel-awareness');

const {
    logInfo
} = require('../../core/logging/logger');

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

    const systemPrompt =
        buildSystemPrompt();

    const memoryContext =
        buildMemoryContext({
            platform:
                'discord',
            userId:
                message.author.id
        });

    const channelContext =
        buildChannelContext({
            guildId:
                message.guild.id,
            channelId:
                message.channel.id
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
${message.author.username}

Platform:
Discord

Previous Conversation Context:
${memoryContext || 'No prior conversation context.'}

${channelContext}

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
            message.author.username,
        messageContent:
            cleanedMessage
    });

    logInfo({

        source:
            'mentions-handler',
        message:
            `AI response generated for ${message.author.username}`
    });

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
