/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/18/26
 * Description: Runs the correct prompt per command sent.
 */

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
    runStatusCommand
} = require('../commands/status');

const {
    formatCommandResponse
} = require('../../shared/utils/command-formatter');

const {
    logCommand
} = require('../../core/logging/command-logger');

const commandRegistry = {

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

                platform:
                    'Discord'
            });

        await message.reply(

            formatCommandResponse(

                commandConfig.title,

                response
            )
        );

    } catch (error) {

        console.error(

            '[COMMAND EXECUTION ERROR]',

            {

                command: commandName,

                user:
                    message.author.username,

                error:
                    error.message
            }
        );

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
