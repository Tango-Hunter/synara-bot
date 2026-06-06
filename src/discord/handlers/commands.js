/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/18/26
 * Description: Runs the correct prompt per command sent.
 */
const {
    runCommandsCommand
} = require('../commands/commands');

const {
    runFactCommand
} = require('../commands/fact');

const {
    runJokeCommand
} = require('../commands/joke');

const {
    handleLeaderboardCommand 
} = require('../commands/leaderboard');

const {
    runMotivateCommand
} = require('../commands/motivate');

const {
    runObserveCommand
} = require('../commands/observe');

const {
    runPointsCommand
} = require('../commands/points');

const {
    runStatusCommand
} = require('../commands/status');

const {
    handleTriviaCommand
 } = require('../commands/trivia');

const {
    handleLinkTwitch
} = require('../commands/linktwitch');

const {
    handleUnlinkTwitch
} = require('../commands/unlinktwitch');

const {
    handleMyTwitch
} = require('../commands/mytwitch');

const {
    handleTwitchStatsCommand 
} = require('../commands/twitchstats');

const {
    formatCommandResponse
} = require('../../shared/utils/command-formatter');

const {
    createTriviaSession
} = require('../trivia/trivia-session-manager');

const {
    logError,
    logCommand
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');

const commandRegistry = {

    '!commands': {
        title: 'COMMANDS',
        execute: runCommandsCommand
    },

    '!fact': {
        title: 'FACT',
        execute: runFactCommand
    },

    '!joke': {
        title: 'HUMOR',
        execute: runJokeCommand
    },

    '!motivate': {
        title: 'MOTIVATION',
        execute: runMotivateCommand
    },

    '!observe': {
        title: 'OBSERVATION',
        execute: runObserveCommand
    },

    '!points': {
        title: 'EFFICIENCY',
        execute: runPointsCommand
    },

    '!status': {
        title: 'STATUS',
        execute: runStatusCommand
    },

    // ===============================
    // Trivia
    // ===============================
    '!trivia': {
        title: 'TRIVIA',
        execute: handleTriviaCommand
    },

    '!leaderboard': {
        title: 'TRIVIA LEADERBOARD',
        execute: handleLeaderboardCommand
    },

    // ===============================
    // Twitch Link Commands
    // ===============================
    '!linktwitch': {
        title:
            'TWITCH',
        execute:
            ({ message, args }) =>
                handleLinkTwitch(
                    message,
                    args
                )
    },

    '!unlinktwitch': {
        title:
            'TWITCH',
        execute:
            ({ message }) =>
                handleUnlinkTwitch(
                    message
                )
    },

    '!mytwitch': {
        title:
            'TWITCH',
        execute:
            ({ message }) =>

                handleMyTwitch(
                    message
                )
    },
    
    '!twitchstats': {
        title: 'TWITCH STATISTICS',
        execute: handleTwitchStatsCommand
    },
};

async function executeCommand(
    message,
    commandConfig,
    commandName,
    args = []
) {

    try {

        await message.channel.sendTyping();

        logCommand({
            command:
                commandName,
            username:
                message.author.username,
            channelId:
                message.channel.id
        });

        const response =
            await commandConfig.execute({

                username:
                    message.author.username,

                userId:
                    message.author.id,

                platform:
                    'Discord',

                message,

                args
            });

        if (
            response.embed
        ) {

            const sentMessage =

                await message.reply({

                    embeds: [
                        response.embed
                    ]
                });

            /*
            ============================
            TRIVIA SESSION CREATION
            ============================
            */

            if (
                response.triviaData
            ) {

                createTriviaSession({

                    channelId:
                        message.channel.id,

                    channel:
                        message.channel,

                    userId:
                        message.author.id,

                    correctAnswer:
                        response.triviaData.correctAnswer,

                    answerMap:
                        response.triviaData.answerMap,

                    messageId:
                        sentMessage.id
                });
            }

            return true;

        } else {

            await message.reply(

                formatCommandResponse(
                    commandConfig.title,
                    response.message
                )
            );
        }

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.DISCORD_ERROR,
            source:
                'commands-handler',
            message:
                error.message,
            details: {
                command:
                    commandName,
                user:
                    message.author.username
            }
        });

        await message.reply(
            'System interruption detected.'
        );
    }
}

async function handleCommands(message) {

    const parts =
        message.content
            .trim()
            .split(/\s+/);

    const commandName =
        parts[0]
            .toLowerCase();

    const args =
        parts.slice(1);

    const commandConfig =
        commandRegistry[
            commandName
        ];

    if (!commandConfig) {
        return false;
    }

    await executeCommand(

        message,
        commandConfig,
        commandName,
        args
    );

    return true;
}

module.exports = {
    handleCommands
};
