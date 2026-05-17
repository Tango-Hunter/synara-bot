/**
 * Title: message-handler.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Formats and sends all outgoing messages to discord.
 */

const {
    shouldIgnoreMessage
} = require('../utils/self-protection');

const {
    isAllowedChannel
} = require('../utils/allowed-channels');

const {
    logError
} = require('../../core/logging/logger');

const {
    handleCommands
} = require('./commands');

const {
    handleMention
} = require('./mentions');

const {
    handleCooldown
} = require('./cooldowns');

function discordMessageHandler(client) {

    client.on('messageCreate', async (message) => {

        try {

            // Protection filters
            if (
                shouldIgnoreMessage(
                    message,
                    client
                )
            ) {

                return;
            }

            // Allowed channels only
            if (
                !isAllowedChannel(
                    message.channel.id
                )
            ) {

                return;
            }

            // Commands
            const commandHandled =
                await handleCommands(
                    message
                );

            if (commandHandled) {

                return;
            }

            // Cooldowns
            const cooldownActive =
                await handleCooldown(
                    message
                );

            if (cooldownActive) {

                return;
            }

            // AI Mentions
            await handleMention(
                message,
                client
            );

        } catch (error) {

            logError(
                'MESSAGE HANDLER ERROR',
                {
                    user:
                        message.author.username,

                    channel:
                        message.channel.id,

                    error:
                        error.message
                }
            );

            return await message.reply(
                'Signal interference detected.'
            );
        }
    });
}

module.exports = {
    discordMessageHandler
};
