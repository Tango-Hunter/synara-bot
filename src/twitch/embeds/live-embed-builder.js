/**
 * Title: live-embed-builder.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: Creates Twitch Live Embed.
 */

const {
    EmbedBuilder
} = require('discord.js');


function buildLiveEmbed({

    user,

    streamTitle,

    streamCategory,

    profileImageUrl,

    twitchLogin,

    thumbnailUrl
}) {

    return new EmbedBuilder()

        .setColor(
            0x9146FF
        )

        .setTitle(
            `🔴 ${twitchLogin} IS LIVE NOW - CLICK HERE TO JOIN`
        )

        .setDescription(

            `${user} is now live on Twitch.`
        )

        .addFields(

            {

                name:
                    'Category',

                value:
                    streamCategory || 'Unknown',

                inline:
                    true
            },

            {

                name:
                    'Title',

                value:
                    streamTitle || 'No Title',

                inline:
                    false
            }
        )

        .setThumbnail(
            profileImageUrl
        )

        .setImage(
            thumbnailUrl
        )

        .setURL(
            `https://twitch.tv/${twitchLogin}`
        )

        .setFooter({

            text:
                'SYNARA • Live Stream Detected'
        })

        .setTimestamp();
}

module.exports = {
    buildLiveEmbed
};
