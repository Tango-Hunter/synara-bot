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

async function handleCommands(message) {

    const content =
        message.content
            .toLowerCase()
            .trim();

    // FACT
    if (content === '!fact') {

        await message.channel.sendTyping();

        logCommand(
            '!fact',
            message.author.username,
            message.channel.id
        );

        const response =
            await runFactCommand(
                message.author.username
            );

        await message.reply(
            formatCommandResponse(
                'FACT',
                response
            )
        );

        return true;
    }

    // JOKE
    if (content === '!joke') {

        await message.channel.sendTyping();

        logCommand(
            '!joke',
            message.author.username,
            message.channel.id
        );

        const response =
            await runJokeCommand(
                message.author.username
            );

        await message.reply(
    formatCommandResponse(
        'HUMOR',
        response
    )
);

        return true;
    }

    // MOTIVATIONAL
    if (content === '!motivate') {

        await message.channel.sendTyping();

        logCommand(
            '!motivate',
            message.author.username,
            message.channel.id
        );

        const response =
            await runMotivateCommand(
                message.author.username
            );

        await message.reply(
    formatCommandResponse(
        'MOTIVATION',
        response
    )
);

        return true;
    }

    // OBSERVATION
    if (content === '!observe') {

        await message.channel.sendTyping();

        logCommand(
            '!observe',
            message.author.username,
            message.channel.id
        );

        const response =
            await runObserveCommand(
                message.author.username
            );

        await message.reply(
    formatCommandResponse(
        'OBSERVATION',
        response
    )
);

        return true;
    }

    // STATUS
    if (content === '!status') {

        await message.channel.sendTyping();

        logCommand(
            '!status',
            message.author.username,
            message.channel.id
        );

        const response =
            await runStatusCommand(
                message.author.username
            );

        await message.reply(
    formatCommandResponse(
        'STATUS',
        response
    )
);

        return true;
    }

    return false;
}

module.exports = {
    handleCommands
};
