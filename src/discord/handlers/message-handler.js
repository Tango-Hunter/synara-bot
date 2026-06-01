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
    discordConfig
} = require('../../core/config/discord-config');

const {
    trackMessage
} = require('../../core/observation/observation-manager');

const {
    tryObservation
} = require('../../core/observation/observation-generator');

const {
    recordActivity
} = require('../../core/database/activity-repository');

const {
    observationConfig
} = require('../../core/config/observational-config');

const {
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');

const {
    handleCommands
} = require('./commands');

const {
    handleMention
} = require('./mentions');

const {
    handleCooldown
} = require('./cooldowns');

const {
    handleTriviaReply
} = require('../trivia/trivia-reply-handler');

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

            // Activity Check
            if (
                !observationConfig
                    .ignoredChannels
                    .includes(
                        message.channel.id
                    )
            ) {
                await recordActivity(
                    message.author.id
                );
            }

            trackMessage(message);

            // Trivia
            const handledTrivia =

                await handleTriviaReply(
                    message
                );

            if (
                handledTrivia
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

            tryObservation(
                message
            ).catch(error => {

                logError({

                    type:
                        ERROR_TYPES.SYSTEM_ERROR,
                    source:
                        'observation-system',
                    message:
                        error.message,

                    details: {
                        channel:
                            message.channel.name,
                        user:
                            message.author.username
                    }
                });
            });

        } catch (error) {

            logError({
                
                type:
                    ERROR_TYPES.DISCORD_ERROR,
                source:
                    'message-handler',
                message:
                    error.message,
                details: {
                    user:
                        message.author.username,
                    channel:
                        message.channel.id
                }
            });

            return await message.reply(
                'Signal interference detected.'
            );
        }
    });
}

module.exports = {
    discordMessageHandler
};
