/**
 * Title: mytwitch.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: Prompt for the !mytwitch command.
 */

const {
    getTwitchUserByDiscordId
} = require('../../core/database/twitch-repository');

const {
    discordLog
} = require('../services/discord-logger');


async function handleMyTwitch(
    message
) {

    const user =

        await getTwitchUserByDiscordId(

            message.author.id
        );

    if (
        !user
    ) {

        return {
            message:
                'No Twitch account linked.'
        };
    }

    await discordLog({

        guildId,

        category:
            'SYSTEM',

        details:
            'Discord logger initialized successfully.',

        status:
            'INFO'
    });

    return {

        message:

`Linked Twitch Account

Channel:
${user.twitch_display_name}

URL:
<https://twitch.tv/${user.twitch_login}>

Notifications:
${user.notifications_enabled ? 'Enabled' : 'Disabled'}`
    };
}

module.exports = {
    handleMyTwitch
};
