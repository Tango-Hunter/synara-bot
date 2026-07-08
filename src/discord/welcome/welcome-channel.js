/**
 * Title: welcome-channel.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Determines the most appropriate channel for SYNARA to post her initial welcome message.
 */

const {
    ChannelType,
    PermissionsBitField
} = require("discord.js");

/*
====================================
CONSTANTS
====================================
*/

const PREFERRED_CHANNEL_NAMES = [

    "welcome",
    "rules",
    "start-here",
    "information",
    "announcements",
    "general"

];

/*
====================================
HELPERS
====================================
*/

function canPost(
    channel,
    clientUser
) {

    if (

        !channel ||

        channel.type !== ChannelType.GuildText ||

        !channel.viewable

    ) {
        return false;
    }

    const permissions =

        channel.permissionsFor(

            clientUser

        );

    if (
        !permissions
    ) {
        return false;
    }

    return (

        permissions.has(

            PermissionsBitField.Flags.ViewChannel

        )

        &&

        permissions.has(

            PermissionsBitField.Flags.SendMessages

        )

        &&

        permissions.has(

            PermissionsBitField.Flags.EmbedLinks

        )
    );
}

/*
====================================
SYSTEM CHANNEL
====================================
*/

function findSystemChannel(
    guild
) {

    const channel =
        guild.systemChannel;

    if (

        canPost(
            channel,
            guild.members.me
        )

    ) {
        return channel;
    }

    return null;
}

/*
====================================
NAMED CHANNELS
====================================
*/

function findNamedChannel(
    guild
) {

    for (

        const name

        of

        PREFERRED_CHANNEL_NAMES

    ) {

        const channel =

            guild.channels.cache.find(

                channel =>

                    channel.type ===
                        ChannelType.GuildText

                    &&

                    channel.name.toLowerCase() ===
                        name

            );

        if (

            canPost(
                channel,
                guild.members.me
            )

        ) {
            return channel;
        }
    }

    return null;
}

/*
====================================
FIRST WRITABLE CHANNEL
====================================
*/

function findFirstWritableChannel(
    guild
) {

    for (

        const channel

        of

        guild.channels.cache

            .filter(

                channel =>

                    channel.type ===
                        ChannelType.GuildText

            )

            .sort(

                (a, b) =>

                    a.position - b.position

            )

            .values()

    ) {

        if (

            canPost(
                channel,
                guild.members.me
            )

        ) {
            return channel;

        }
    }

    return null;
}

/*
====================================
PUBLIC API
====================================
*/

function findWelcomeChannel(
    guild
) {

    return (

        findSystemChannel(
            guild
        )

        ||

        findNamedChannel(
            guild
        )

        ||

        findFirstWritableChannel(
            guild
        )

        ||

        null

    );
}

module.exports = {
    findWelcomeChannel
};
