/**
 * Title: message-handler.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Description: Formats and sends all outgoing messages to discord.
 */

const {
    shouldIgnoreMessage
} = require('../utils/self-protection');

const {
    discordConfig
} = require('../../core/config/discord-config');

const {
    isIgnoredChannel
} = require('../../core/database/ignored-channels-repository');

const {
    trackMessage
} = require('../../core/observation/observation-manager');

const {
    handleCountingGame
} = require('../interactions/counting-game');

const {
    tryObservation
} = require('../../core/observation/observation-generator');

const {
    recordActivity
} = require('../../core/database/activity-repository');

const {
    logError,
    logFeature
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
} = require('../utils/cooldown-manager');

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
            const ignored =
                await isIgnoredChannel({

                    guildId:
                        message.guild.id,

                    channelId:
                        message.channel.id
                });

            if (
                !ignored
            ) {
                await recordActivity(
                    message.author.id
                );
            }

            // Track Messages
            await trackMessage(message);

            // Track Counting Game
            await handleCountingGame(message);

            // Trivia
            const handledTrivia =
                await handleTriviaReply(
                    message
                );

            if (
                handledTrivia
            ) {

                logFeature({

                    category:
                        'TRIVIA',

                    message:
                        'Trivia response processed',

                    details: {

                        guildId:
                            message.guild.id,

                        channelId:
                            message.channel.id,

                        userId:
                            message.author.id
                    }
                });

                return;
            }

            // Commands
            const commandHandled =
                await handleCommands(
                    message
                );

            if (commandHandled) {

                logFeature({

                    category:
                        'COMMAND',

                    message:
                        'Command processed',

                    details: {

                        guildId:
                            message.guild.id,

                        channelId:
                            message.channel.id,

                        userId:
                            message.author.id,

                        command:
                            message.content.split(' ')[0]
                    }
                });

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
