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

async function handleCommands(message) {

    const content =
        message.content
            .toLowerCase()
            .trim();

    if (content === '!fact') {

        await message.channel.sendTyping();

        const response =
            await runFactCommand(
                message.author.username
            );

        await message.reply(response);

        return true;
    }

    if (content === '!joke') {

        await message.channel.sendTyping();

        const response =
            await runJokeCommand(
                message.author.username
            );

        await message.reply(response);

        return true;
    }

    if (content === '!motivate') {

        await message.channel.sendTyping();

        const response =
            await runMotivateCommand(
                message.author.username
            );

        await message.reply(response);

        return true;
    }

    if (content === '!observe') {

        await message.channel.sendTyping();

        const response =
            await runObserveCommand(
                message.author.username
            );

        await message.reply(response);

        return true;
    }

    if (content === '!status') {

        await message.channel.sendTyping();

        const response =
            await runStatusCommand(
                message.author.username
            );

        await message.reply(response);

        return true;
    }

    return false;
}

module.exports = {
    handleCommands
};
