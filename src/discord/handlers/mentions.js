/**
 * Title: mentions.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Only sends message if SYNARA was correctly mentioned.
 */

const {
    sanitizeMessage
} = require('../../shared/utils/sanitize-message');

const {
    splitIntoChunks
} = require('../../shared/utils/response-manager');

const {
    sendToN8N
} = require('../../core/services/webhook-service');

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

    let aiResponse =
        await sendToN8N({

            content:
                cleanedMessage,

            username:
                message.author.username
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
