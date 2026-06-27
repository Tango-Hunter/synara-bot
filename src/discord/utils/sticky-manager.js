/**
 * Title: sticky-manager.js
 * Author: Tango Hunter
 * Date Created: 6/27/26
 * Description: Handles sticky message refreshes, cooldowns, and lifecycle management.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    embedThemes
} = require(
    '../../core/config/embed-themes'
);

const {
    getChannelMessage,
    createChannelMessage,
    setChannelMessage,
    deleteChannelMessage
} = require('../../core/database/channel-messages-repository');


/*
====================================
CONFIGURATION
====================================
*/

const STICKY_DELAY = 5 * 60 * 1000;

const pendingRefreshes = new Map();

/*
====================================
BUILD EMBED
====================================
*/

function buildStickyEmbed(

    content

) {

    return new EmbedBuilder()

        .setColor(

            embedThemes.sticky.color

        )

        .setTitle(

            `${embedThemes.sticky.icon} Information`

        )

        .setDescription(

            content

        )

        .setFooter({

            text:

                embedThemes.sticky.footer
        });

}

/*
====================================
QUEUE REFRESH
====================================
*/

function queueRefresh({

    guildId,

    channelId,

    callback

}) {

    const key =

        `${guildId}:${channelId}`;

    const existingTimer =
        pendingRefreshes.get(

            key

        );

    if (

        existingTimer

    ) {

        clearTimeout(

            existingTimer

        );

    }

    const timer =
        setTimeout(

            async () => {

                pendingRefreshes.delete(

                    key

                );

                await callback();

            },

            STICKY_DELAY

        );

    pendingRefreshes.set(

        key,

        timer

    );

}

/*
====================================
CLEAR REFRESH
====================================
*/

function clearRefresh({

    guildId,

    channelId

}) {

    const key =
        `${guildId}:${channelId}`;

    const timer =
        pendingRefreshes.get(

            key

        );

    if (

        timer

    ) {

        clearTimeout(

            timer

        );

        pendingRefreshes.delete(

            key

        );

    }

}

/*
====================================
DELETE DISCORD MESSAGE
====================================
*/

async function deleteDiscordSticky(

    channel,

    discordMessageId

) {

    if (

        !discordMessageId

    ) {

        return;

    }

    try {

        const message =

            await channel.messages.fetch(

                discordMessageId

            );

        if (

            message

        ) {

            await message.delete();

        }

    }

    catch {

        /*
        Message may already
        be gone.

        Ignore.
        */

    }

}

/*
====================================
POST DISCORD MESSAGE
====================================
*/

async function postDiscordSticky({

    channel,

    content

}) {

    const sentMessage =
        await channel.send({

            embeds: [

                buildStickyEmbed(

                    content

                )

            ]

        });

    return sentMessage.id;

}

/*
====================================
REFRESH STICKY
====================================
*/

async function refreshSticky({

    guild,

    channel,

    content,

    authorId

}) {

    let existingMessage =

        await getChannelMessage({

            guildId:
                guild.id,

            channelId:
                channel.id,

            type:
                'STICKY'
        });

    /*
    Delete previous Discord sticky.
    */

    if (

        existingMessage

    ) {

        await deleteDiscordSticky(

            channel,

            existingMessage.discord_message_id

        );

    }

    /*
    Post the new sticky.
    */

    const discordMessageId =

        await postDiscordSticky({

            channel,

            content
        });

    /*
    Existing database row.
    */

    if (

        existingMessage

    ) {

        await setChannelMessage({

            guildId:
                guild.id,

            channelId:
                channel.id,

            type:
                'STICKY',

            content,

            discordMessageId,

            updatedBy:
                authorId
        });

    }

    /*
    New sticky.
    */

    else {

        await createChannelMessage({

            guildId:
                guild.id,

            channelId:
                channel.id,

            type:
                'STICKY',

            content,

            discordMessageId,

            createdBy:
                authorId
        });

    }

}

/*
====================================
DELETE STICKY
====================================
*/

async function deleteSticky({

    guild,

    channel,

    authorId

}) {

    const existingMessage =

        await getChannelMessage({

            guildId:
                guild.id,

            channelId:
                channel.id,

            type:
                'STICKY'
        });

    if (

        !existingMessage

    ) {

        return false;

    }

    clearRefresh({

        guildId:
            guild.id,

        channelId:
            channel.id
    });

    await deleteDiscordSticky(

        channel,

        existingMessage.discord_message_id

    );

    await deleteChannelMessage({

        guildId:
            guild.id,

        channelId:
            channel.id,

        type:
            'STICKY'
    });

    return true;

}

/*
====================================
HANDLE MESSAGE
====================================
*/

async function handleStickyMessage(

    message

) {

    /*
    Ignore bots.
    */

    if (

        message.author.bot

    ) {

        return;

    }

    /*
    Ignore DMs.
    */

    if (

        !message.guild

    ) {

        return;

    }

    const sticky =

        await getChannelMessage({

            guildId:
                message.guild.id,

            channelId:
                message.channel.id,

            type:
                'STICKY'
        });

    if (

        !sticky

    ) {

        return;

    }

    queueRefresh({

        guildId:
            message.guild.id,

        channelId:
            message.channel.id,

        callback:

            async () => {

                await refreshSticky({

                    guild:
                        message.guild,

                    channel:
                        message.channel,

                    content:
                        sticky.content,

                    authorId:
                        sticky.updated_by
                });

            }
    });

}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    handleStickyMessage,
    refreshSticky,
    deleteSticky
};
