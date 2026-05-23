/**
 * Title: post-message.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/23/26
 * Description: Sends automated messages to Discord.
 */

const client = require('../../core/config/discord-client');

async function sendDiscordMessage({

    channelId,
    message,
    embed

}) {

    const channel =
        await client.channels.fetch(
            channelId
        );

    if (!channel) {

        throw new Error(
            'Channel not found.'
        );
    }

    if (
        embed
    ) {

        await channel.send({
            embeds: [embed]
        });

    } else {

        await channel.send(
            message
        );
    }
}

module.exports = {
    sendDiscordMessage
};
