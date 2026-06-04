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


async function handleLinkTwitch(
    message,
    args
) {

    const channelName =
        args[0];

    if (
        !channelName
    ) {

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

    console.log(
        '[LINKTWITCH SUB LOOKUP]',
        twitchUser.id,
        existingSubscription
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

        console.log(

            '[LINKTWITCH] EventSub already exists'
        );
    }

    return {
        message:
            `Twitch account linked: ${twitchUser.display_name}`
    };
}

module.exports = {
    handleLinkTwitch
};
