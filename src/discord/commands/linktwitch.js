/**
 * Title: linktwitch.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: Prompt for the !linktwitch command.
 */

const {
    getTwitchUser
} = require('../../core/services/twitch-service');

const {
    upsertTwitchUser
} = require('../../core/database/twitch-repository');

const {
    ensureEventSubSubscription
} = require('../../twitch/services/eventsub-service');

const {
    getSubscription
} = require('../../core/database/twitch-eventsub-repository');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    logFeature
} = require('../../core/logging/logger');


async function handleLinkTwitch(
    message,
    args
) {

    const channelName =
        args[0];

    if (
        !channelName
    ) {

        logFeature({

            category:
                'TWITCH',

            message:
                'Link attempt failed',

            details: {

                guildId:
                    message.guild.id,

                discordUserId:
                    message.author.id,

                reason:
                    'No channel supplied'
            }
        });

        return {
            message:
                'Unable to locate that Twitch channel.'
        };
    }

    const twitchUser =

        await getTwitchUser(
            channelName
        );

    if (
        !twitchUser
    ) {

        logFeature({

            category:
                'TWITCH',

            message:
                'Link attempt failed',

            details: {

                guildId:
                    message.guild.id,

                discordUserId:
                    message.author.id,

                requestedChannel:
                    channelName,

                reason:
                    'Twitch user not found'
            }
        });

        return {
            message:
                'Unable to locate that Twitch channel.'
        };
    }

    await upsertTwitchUser({

        discordUserId:
            message.author.id,

        discordName:
            message.author.username,

        guildId:
            message.guild.id,

        twitchUserId:
            twitchUser.id,

        twitchLogin:
            twitchUser.login,

        twitchDisplayName:
            twitchUser.display_name,

        twitchProfileImageUrl:
            twitchUser.profile_image_url
    });

    const existingSubscription =

        await getSubscription(
            twitchUser.id
        );

    if (
        !existingSubscription

    ) {
        await ensureEventSubSubscription({
            twitchUserId:
                twitchUser.id
        });
    }
    else {

        logFeature({

            category:
                'TWITCH',

            message:
                'Existing EventSub detected',

            details: {

                guildId:
                    message.guild.id,

                discordUserId:
                    message.author.id,

                twitchUserId:
                    twitchUser.id,

                twitchLogin:
                    twitchUser.login
            }
        });
    }

    await discordLog({

        guildId:
            message.guild.id,

        category:
            'TWITCH',

        details:
            `Twitch account linked for <@${message.author.id}>`,

        status:
            'SUCCESS'
    });

    logFeature({

        category:
            'TWITCH',

        message:
            'Twitch account linked',

        details: {

            guildName:
                message.guild.name,

            guildId:
                message.guild.id,

            discordUserId:
                message.author.id,

            discordUsername:
                message.author.username,

            twitchUserId:
                twitchUser.id,

            twitchLogin:
                twitchUser.login,

            twitchDisplayName:
                twitchUser.display_name
        }
    });

    return {
        message:
            `Twitch account linked: ${twitchUser.display_name}`
    };
}

module.exports = {
    handleLinkTwitch
};
