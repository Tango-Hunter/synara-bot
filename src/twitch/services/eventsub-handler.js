/**
 * Title: eventsub-handler.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: handles eventsub data being sent to Discord.
 */

const {
    getEnabledUsersByTwitchUserId
} = require('../../core/database/twitch-repository');

const {
    postLiveNotifications
} = require('./stream-notifications');

const {
    createOrUpdateLiveStatus
} = require('../database/twitch-live-repository');


async function handleStreamOnline(
    payload,
    client
) {

    const twitchUserId =

        payload.event
            .broadcaster_user_id;

    const users =

        await getEnabledUsersByTwitchUserId(
            twitchUserId
        );

    if (
        users.length === 0
    ) {

        return;
    }

    for (
        const user
        of users
    ) {

        const messageIds =

            await postLiveNotifications({

                client,

                guildIds:
                    user.guild_ids,

                discordUserId:
                    user.discord_user_id,

                twitchLogin:
                    user.twitch_login,

                profileImageUrl:
                    user.twitch_profile_image_url,

                streamTitle:
                    payload.event.title ||
                    'Live on Twitch',

                streamCategory:
                    payload.event.category_name ||
                    'Unknown'
            });

        await createOrUpdateLiveStatus({

            discordUserId:
                user.discord_user_id,

            messageIds,

            streamCategory:
                payload.event.category_name,

            streamTitle:
                payload.event.title,

            thumbnailUrl:
                null,

            startedAt:
                new Date()
        });
    }
}

async function handleEventSub(
    payload,
    client
) {

    switch (

        payload.subscription.type

    ) {

        case 'stream.online':

            await handleStreamOnline(
                payload,
                client
            );

            break;
    }
}

module.exports = {
    handleEventSub
};
