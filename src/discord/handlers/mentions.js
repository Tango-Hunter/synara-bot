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

User Message:
${cleanedMessage}
`;

    let aiResponse =
        await generateResponse({

            systemPrompt,

            userPrompt,

            temperature: 0.85,

            maxTokens: 400
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
