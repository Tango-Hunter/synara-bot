/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Runs the correct prompt per command sent.
 */

const {
    runFactCommand
} = require('../../commands/fact');

const {
    runJokeCommand
} = require('../../commands/joke');

const {
    runMotivateCommand
} = require('../../commands/motivate');

const {
    runObserveCommand
} = require('../../commands/observe');

const {
    runStatusCommand
} = require('../../commands/status');

const {
    formatCommandResponse
} = require('../../utils/command-formatter');

const {
    logCommand
} = require('../../utils/command-logger');

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

    await message.channel.sendTyping();

    logCommand(

        commandName,

        message.author.username,

        message.channel.id
    );

    const response =
        await commandConfig.execute(

            message.author.username
        );

    await message.reply(

        formatCommandResponse(

            commandConfig.title,

            response
        )
    );
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
