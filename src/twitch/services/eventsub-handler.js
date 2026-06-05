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
    postLiveNotifications,
    deleteLiveNotifications
} = require('./stream-notifications');

const {
    createOrUpdateLiveStatus,
    getActiveLiveStatusByDiscordId,
    markOffline
} = require('../database/twitch-live-repository');

const {
    updateStatistics
} = require('../database/twitch-statistics-repository');

const {
    getLiveStreamData
} = require('./twitch-stream-service');


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

    const streamData =
        await getLiveStreamData(
            twitchUserId
        );

    if (
        !streamData
    ) {

        return;
    }

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
                    streamData.title,

                streamCategory:
                    streamData.category,
                    
                thumbnailUrl:
                    streamData.thumbnailUrl
            });

        await createOrUpdateLiveStatus({

            discordUserId:
                user.discord_user_id,

            messageIds,

            streamCategory:
                streamData.category,

            streamTitle:
                streamData.title,

            thumbnailUrl:
                streamData.thumbnailUrl,

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

        case 'stream.offline':
            await handleStreamOffline(
                payload,
                client
            );
            break;

        case 'stream.online':
            await handleStreamOnline(
                payload,
                client
            );
            break;
    }
}

async function handleStreamOffline(
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

        const liveStatus =

            await getActiveLiveStatusByDiscordId(

                user.discord_user_id
            );

        if (
            !liveStatus
        ) {

            continue;
        }

        await deleteLiveNotifications({

            client,

            messageIds:
                liveStatus.message_ids
        });

        const durationSeconds =

            Math.floor(

                (

                    Date.now()

                    -

                    new Date(
                        liveStatus.started_at
                    )

                )

                / 1000
            );

        await updateStatistics({

            discordUserId:
                user.discord_user_id,

            streamDurationSeconds:
                durationSeconds
        });

        await markOffline({

            discordUserId:
                user.discord_user_id,

            endedAt:
                new Date()
        });
    }
}

module.exports = {
    handleEventSub
};
