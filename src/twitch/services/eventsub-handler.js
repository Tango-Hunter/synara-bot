/**
 * Title: eventsub-handler.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 8/21/26
 * Description: Handles EventSub data being sent to Discord.
 */

const {
    createLiveStreamEvent
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
    claimLiveNotification,
    getActiveLiveStatusByDiscordId,
    markOffline,
    updateLiveNotificationMessages,
    releaseLiveNotificationClaim
} = require('../database/twitch-live-repository');

const {
    updateStatistics
} = require('../database/twitch-statistics-repository');

const {
    getLiveStreamData
} = require('./twitch-stream-service');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
OFFLINE DEBOUNCE
====================================

The timer is keyed by Twitch broadcaster
rather than Discord guild.

This ensures one Twitch stream lifecycle
is shared across every Discord server that
has linked the creator.

Five minutes gives Twitch/console
reconnections time to recover without
creating a second live notification.
*/

const offlineCooldowns =
    new Map();


const OFFLINE_COOLDOWN_MS =
    5 * 60 * 1000;


/*
====================================
CLEAR OFFLINE COOLDOWN
====================================
*/

function clearOfflineCooldown(
    twitchUserId
) {

    const existingTimer =
        offlineCooldowns.get(
            twitchUserId
        );

    if (
        existingTimer
    ) {
        clearTimeout(
            existingTimer
        );

        offlineCooldowns.delete(
            twitchUserId
        );
    }
}


/*
====================================
START OFFLINE COOLDOWN
====================================
*/

function scheduleOfflineCooldown({

    twitchUserId,

    client

}) {

    /*
    Reset an existing timer.

    Multiple offline events therefore
    extend the same five-minute window
    instead of creating multiple cleanup
    operations.
    */

    clearOfflineCooldown(
        twitchUserId
    );

    const timer =

        setTimeout(

            async () => {

                offlineCooldowns.delete(
                    twitchUserId
                );


                try {

                    /*
                    ====================================
                    VERIFY CURRENT TWITCH STATE
                    ====================================
                    */

                    const streamData =

                        await getLiveStreamData(
                            twitchUserId
                        );


                    if (
                        streamData
                    ) {

                        logFeature({

                            category:
                                'TWITCH',

                            message:
                                'Offline cooldown expired but stream is still live.',

                            details: {

                                twitchUserId,

                                title:
                                    streamData.title,

                                category:
                                    streamData.category

                            }
                        });

                        return;
                    }

                    /*
                    ====================================
                    FINALIZE OFFLINE STATE
                    ====================================
                    */

                    await finalizeStreamOffline({

                        twitchUserId,

                        client

                    });
                }

                catch (
                    error
                ) {

                    logError({

                        type:
                            ERROR_TYPES.TWITCH_ERROR,

                        source:
                            'eventsub-handler',

                        message:
                            'Failed to finalize Twitch offline state.',

                        details: {

                            twitchUserId,

                            error:
                                error.message,

                            stack:
                                error.stack

                        }
                    });
                }
            },

            OFFLINE_COOLDOWN_MS
        );

    offlineCooldowns.set(
        twitchUserId,
        timer
    );

    logFeature({

        category:
            'TWITCH',

        message:
            'Stream offline cooldown started.',

        details: {

            twitchUserId,

            cooldownSeconds:
                OFFLINE_COOLDOWN_MS / 1000

        }
    });
}


/*
====================================
FINALIZE STREAM OFFLINE
====================================
*/

async function finalizeStreamOffline({

    twitchUserId,

    client

}) {

    const users =

        await getEnabledUsersByTwitchUserId(

            twitchUserId

        );

    if (
        users.length === 0
    ) {
        return;
    }

    logFeature({

        category:
            'TWITCH',

        message:
            'Stream confirmed offline after cooldown.',

        details: {

            twitchUserId,

            matchedUsers:
                users.length

        }

    });

    for (
        const user
        of users
    ) {

        /*
        ====================================
        GET CURRENT LIVE STATUS
        ====================================
        */

        const liveStatus =

            await getActiveLiveStatusByDiscordId(

                user.discord_user_id

            );


        if (
            !liveStatus
        ) {
            continue;
        }

        /*
        ====================================
        CAPTURE STREAM SESSION
        ====================================
        */

        const streamStartedAt =
            liveStatus.started_at;

        /*
        ====================================
        CALCULATE STREAM DURATION
        ====================================
        */

        const durationSeconds =

            Math.max(

                0,

                Math.floor(

                    (

                        Date.now()

                        -

                        new Date(
                            streamStartedAt
                        ).getTime()

                    )

                    /

                    1000

                )
            );

        /*
        ====================================
        ATOMICALLY MARK THIS STREAM OFFLINE
        ====================================
        */

        const finalizedStatus =

            await markOffline({

                discordUserId:
                    user.discord_user_id,

                startedAt:
                    streamStartedAt,

                endedAt:
                    new Date()

            });

        /*
        ====================================
        STREAM SESSION CHANGED
        ====================================
        */

        if (
            !finalizedStatus
        ) {

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Offline finalization skipped because the active stream session changed.',

                details: {

                    twitchUserId,

                    discordUserId:
                        user.discord_user_id,

                    previousStartedAt:
                        streamStartedAt

                }
            });

            continue;
        }

        /*
        ====================================
        DELETE OLD LIVE NOTIFICATIONS
        ====================================
        */

        try {

            await deleteLiveNotifications({

                client,

                messageIds:
                    finalizedStatus.message_ids

            });
        }

        catch (
            error
        ) {

            /*
            ====================================
            LOG CLEANUP FAILURE
            ====================================
            */
            logError({

                type:
                    ERROR_TYPES.TWITCH_ERROR,

                source:
                    'eventsub-handler',

                message:
                    'Failed to delete Twitch live notification messages.',

                details: {

                    twitchUserId,

                    discordUserId:
                        user.discord_user_id,

                    error:
                        error.message,

                    stack:
                        error.stack

                }
            });
        }

        /*
        ====================================
        UPDATE STREAM STATISTICS
        ====================================
        */

        try {

            await updateStatistics({

                discordUserId:
                    user.discord_user_id,

                streamDurationSeconds:
                    durationSeconds

            });
        }

        catch (
            error
        ) {

            /*
            ====================================
            LOG STATISTICS FAILURE
            ====================================
            */

            logError({

                type:
                    ERROR_TYPES.TWITCH_ERROR,

                source:
                    'eventsub-handler',

                message:
                    'Failed to update Twitch stream statistics.',

                details: {

                    twitchUserId,

                    discordUserId:
                        user.discord_user_id,

                    durationSeconds,

                    error:
                        error.message,

                    stack:
                        error.stack

                }
            });
        }

        /*
        ====================================
        LOG FINAL STATE
        ====================================
        */

        logFeature({

            category:
                'TWITCH',

            message:
                'Twitch live state finalized.',

            details: {

                twitchUserId,

                discordUserId:
                    user.discord_user_id,

                durationSeconds,

                startedAt:
                    streamStartedAt,

                endedAt:
                    finalizedStatus.ended_at

            }
        });
    }
}


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

    const streamStartedAt =
        payload.event.started_at;

    /*
    ====================================
    CANCEL PENDING OFFLINE
    ====================================
    */

    clearOfflineCooldown(
        twitchUserId
    );

    const users =
        await getEnabledUsersByTwitchUserId(
            twitchUserId
        );

    logFeature({

        category:
            'TWITCH',

        message:
            'Repository lookup complete',

        details: {

            twitchUserId,

            matchedUsers:
                users.length,

            guilds:

                users.reduce(

                    (
                        total,
                        user
                    ) =>

                        total +
                        user.guild_ids.length,

                    0

                )
        }
    });


    if (
        users.length === 0
    ) {
        return;
    }


    /*
    ====================================
    GET CURRENT STREAM DATA
    ====================================
    */

    const streamData =

        await getLiveStreamData(

            twitchUserId,

            streamStartedAt

        );


    if (
        !streamData
    ) {

        logFeature({

            category:
                'TWITCH',

            message:
                'Stream online event received but Twitch reports the stream as offline.',

            details: {

                twitchUserId,

                startedAt:
                    streamStartedAt

            }
        });

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

    /*
    ====================================
    SERVER LEADER EVENT
    ====================================
    */

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

            /*
            The live stream event utility is
            separate from the actual Twitch
            live notification state.
            */

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
            'Stream online detected.',

        details: {

            twitchUserId,

            startedAt:
                streamStartedAt,

            title:
                streamData.title,

            category:
                streamData.category

        }
    });

    for (
        const user
        of users
    ) {

        /*
        ====================================
        ATOMIC LIVE CLAIM
        ====================================
        Duplicate stream.online events
        receive null and are ignored.
        */

        const claimed =

            await claimLiveNotification({

                discordUserId:
                    user.discord_user_id,

                startedAt:
                    streamStartedAt

            });

        if (
            !claimed
        ) {

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Duplicate stream.online event ignored.',

                details: {

                    twitchUserId,

                    discordUserId:
                        user.discord_user_id,

                    startedAt:
                        streamStartedAt

                }
            });

            continue;
        }

        try {

            /*
            ====================================
            POST DISCORD NOTIFICATIONS
            ====================================
            */

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

            /*
            ====================================
            SAVE MESSAGE IDS
            ====================================
            */

            await updateLiveNotificationMessages({

                discordUserId:
                    user.discord_user_id,

                messageIds,

                streamCategory:
                    streamData.category,

                streamTitle:
                    streamData.title,

                thumbnailUrl:
                    streamData.thumbnailUrl

            });


            logFeature({

                category:
                    'TWITCH',

                message:
                    'Notification delivery complete.',

                details: {

                    discordUserId:
                        user.discord_user_id,

                    twitchUserId,

                    guildsAttempted:
                        user.guild_ids.length,

                    messagesPosted:
                        Object.keys(
                            messageIds
                        ).length

                }
            });
        }

        catch (
            error
        ) {

            /*
            ====================================
            RELEASE FAILED LIVE CLAIM
            ====================================

            The user should not remain marked
            live if Discord notification delivery
            failed.

            This allows a later stream.online
            delivery to retry.
            */

            await releaseLiveNotificationClaim(

                user.discord_user_id

            );


            logError({

                type:
                    ERROR_TYPES.TWITCH_ERROR,

                source:
                    'eventsub-handler',

                message:
                    'Failed to deliver Twitch live notification.',

                details: {

                    twitchUserId,

                    discordUserId:
                        user.discord_user_id,

                    error:
                        error.message,

                    stack:
                        error.stack

                }
            });
        }
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

    /*
    ====================================
    SCHEDULE OFFLINE TRANSITION
    ====================================
    Twitch/console reconnections can generate
    offline → online transitions very quickly.
    */

    scheduleOfflineCooldown({

        twitchUserId,

        client

    });

    logFeature({

        category:
            'TWITCH',

        message:
            'Stream offline detected. Waiting for cooldown before finalizing.',

        details: {

            twitchUserId,

            cooldownSeconds:
                OFFLINE_COOLDOWN_MS / 1000

        }
    });
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
