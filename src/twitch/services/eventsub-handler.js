/**
 * Title: eventsub-handler.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Description: handles eventsub data being sent to Discord.
 */

const {
    createLiveStreamEvent,
    startOfflineCooldown,
    cancelOfflineCooldown
} = require('../../discord/utils/live-stream-event');

const {
    getEnabledUsersByTwitchUserId,
    updateTwitchProfile
} = require('../../core/database/twitch-repository');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    getFeatureFlag
} = require('../../core/database/feature-flags-repository');

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

const {
    logFeature
} = require('../../core/logging/logger');


/*
====================================
STREAM ONLINE
====================================
*/
async function handleStreamOnline(
    payload,
    client
) {

    const twitchUserId =
        payload.event.broadcaster_user_id;

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

    /*
    ====================================
    SYNC TWITCH PROFILE
    ====================================
    */

    await updateTwitchProfile({

        twitchUserId,

        twitchLogin:
            streamData.twitchLogin,

        twitchDisplayName:
            streamData.twitchDisplayName

    });

    for (
        const user
        of users
    ) {

        for (
            const guildId
            of user.guild_ids
        ) {

            const twitchMonitoringEnabled =

                await getFeatureFlag({

                    guildId,

                    featureName:
                        'twitchMonitoring'
                });

            if (
                !twitchMonitoringEnabled
            ) {

                continue;
            }

            const guild =

                client.guilds.cache.get(
                    guildId
                );

            if (
                !guild
            ) {

                continue;
            }

            const serverLeaderId =

                await getGuildSetting({

                    guildId,

                    settingName:
                        'server_leader'
                });

            if (

                serverLeaderId !==

                user.discord_user_id

            ) {

                continue;
            }

            cancelOfflineCooldown(
                guild.id
            );

            // SERVER LEADER EVENT NOTIFICATION
            await createLiveStreamEvent({

                guild,

                twitchLogin:
                    user.twitch_login,

                streamTitle:
                    streamData.title,

                streamCategory:
                    streamData.category
            });
        }
    }

    /*
    ====================================
    LIVE NOTIFICATION LOGIC
    ====================================
    */

    logFeature({

        category:
            'TWITCH',

        message:
            'Stream online detected',

        details: {

            twitchUserId,

            title:
                streamData.title,

            category:
                streamData.category
        }
    });

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

        logFeature({

            category:
                'TWITCH',

            message:
                'Live notifications posted',

            details: {

                discordUserId:
                    user.discord_user_id,

                guildCount:
                    user.guild_ids.length
            }
        });
    }
}

/*
====================================
STREAM OFFLINE
====================================
*/
async function handleStreamOffline(
    payload,
    client
) {

    const twitchUserId =
        payload.event.broadcaster_user_id;

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

        for (
            const guildId
            of user.guild_ids
        ) {

            const twitchMonitoringEnabled =

                await getFeatureFlag({

                    guildId,

                    featureName:
                        'twitchMonitoring'
                });

            if (
                !twitchMonitoringEnabled
            ) {

                continue;
            }

            const guild =

                client.guilds.cache.get(
                    guildId
                );

            if (
                !guild
            ) {

                continue;
            }

            const serverLeaderId =

                await getGuildSetting({

                    guildId,

                    settingName:
                        'server_leader'
                });

            if (

                serverLeaderId !==

                user.discord_user_id

            ) {

                continue;
            }

            startOfflineCooldown({

                guild
            });
        }
    }

    /*
    ====================================
    OFFLINE EMBED REMOVAL
    ====================================
    */

    logFeature({

        category:
            'TWITCH',

        message:
            'Stream offline detected',

        details: {

            twitchUserId
        }
    });

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

/*
====================================
EVENT SUB
====================================
*/
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

module.exports = {
    handleEventSub
};
