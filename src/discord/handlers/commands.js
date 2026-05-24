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
    formatCommandResponse
} = require('../../shared/utils/command-formatter');

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
    }
};

async function executeCommand(
    message,
    commandConfig,
    commandName
) {

    try {

        await message.channel.sendTyping();

        logCommand(

            commandName,
            message.author.username,
            message.channel.id
        );

        const response =
            await commandConfig.execute({

                username:
                    message.author.username,
                userId:
                    message.author.id,
                platform:
                    'Discord'
            });

        if (
            response.embed
        ) {

            await message.reply({
                embeds: [
                    response.embed
                ]
            });

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

    const content =
        message.content
            .toLowerCase()
            .trim();

    const commandConfig =
        commandRegistry[content];

    if (!commandConfig) {
        return false;
    }

    await executeCommand(

        message,
        commandConfig,
        content
    );

    return true;
}

module.exports = {
    handleCommands
};
