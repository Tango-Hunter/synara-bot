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
} = require('../../core/logging/discord-logger');

const {
    logFeature
} = require('../../core/logging/logger');


async function handleUnlinkTwitch(
    message
) {

    await disableNotifications(

        message.author.id
    );

    await discordLog({

        guildId:
            message.guild.id,

        title:
            'Twitch Notification notice',

        category:
            'Twitch',

        details:
            `Twitch notifications disabled for <@${message.author.id}>`,

        status:
            'SUCCESS'
    });

    logFeature({

        category:
            'TWITCH',

        message:
            'Twitch notifications disabled',

        details: {

            guildName:
                message.guild.name,

            guildId:
                message.guild.id,

            discordUserId:
                message.author.id,

            discordUsername:
                message.author.username
        }
    });

    return {
        message:
            'Twitch notifications disabled.'
    };
}

module.exports = {
    handleUnlinkTwitch
};
