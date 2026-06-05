/**
 * Title: unlinktwitch.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: Prompt for the !unlinktwitch command.
 */

const {
    disableNotifications
} = require('../../core/database/twitch-repository');

const {
    discordLog
} = require(
    '../../core/logging/discord-logger'
);


async function handleUnlinkTwitch(
    message
) {

    await disableNotifications(

        message.author.id
    );

    await discordLog({

        guildId:
            message.guild.id,

        category:
            'TWITCH UNLINK',

        details:
            `Twitch notifications disabled for <@${message.author.id}>`,

        status:
            'SUCCESS'
    });

    return {
        message:
            'Twitch notifications disabled.'
    };
}

module.exports = {
    handleUnlinkTwitch
};
