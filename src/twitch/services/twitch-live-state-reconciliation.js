/**
 * Title: twitch-live-state-reconciliation.js
 * Author: Tango Hunter
 * Date Created: 8/29/26
 * Description: Reconciles SYNARA's cached Twitch live state against Twitch Helix when SYNARA starts.
 * Twitch is the definitive source of truth.
 */

const {
    getAllActiveLiveStatuses,
    markOffline,
    updateLiveStreamData
} = require('../database/twitch-live-repository');

const {
    getLiveStreamData
} = require('./twitch-stream-service');

const {
    deleteLiveNotifications
} = require('./stream-notifications');

const {
    updateStatistics
} = require('../database/twitch-statistics-repository');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
RECONCILE LIVE STATE
====================================
*/

async function reconcileTwitchLiveState(
    client
) {

    logFeature({

        category:
            'TWITCH',

        message:
            'Beginning Twitch live-state reconciliation.',

        details: {}

    });


    const activeStatuses =
        await getAllActiveLiveStatuses();


    logFeature({

        category:
            'TWITCH',

        message:
            'Active Twitch live states loaded for reconciliation.',

        details: {

            activeStates:
                activeStatuses.length

        }

    });


    let confirmedLive = 0;

    let finalizedOffline = 0;

    let failed = 0;


    for (
        const status
        of activeStatuses
    ) {

        const {

            discord_user_id:
                discordUserId,

            twitch_user_id:
                twitchUserId,

            started_at:
                databaseStartedAt,

            message_ids:
                messageIds

        } = status;


        try {

            /*
            ====================================
            VERIFY WITH TWITCH
            ====================================

            Twitch is authoritative.
            */

            const streamData =
                await getLiveStreamData(
                    twitchUserId
                );


            /*
            ====================================
            STILL LIVE
            ====================================
            */

            if (
                streamData
            ) {

                const twitchStartedAt =
                    streamData.startedAt
                        || databaseStartedAt;


                await updateLiveStreamData({

                    discordUserId,

                    startedAt:
                        twitchStartedAt,

                    streamCategory:
                        streamData.category,

                    streamTitle:
                        streamData.title,

                    thumbnailUrl:
                        streamData.thumbnailUrl

                });


                confirmedLive++;


                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Startup reconciliation confirmed broadcaster is live.',

                    details: {

                        twitchUserId,

                        discordUserId,

                        databaseStartedAt,

                        twitchStartedAt,

                        title:
                            streamData.title,

                        category:
                            streamData.category

                    }

                });


                continue;

            }


            /*
            ====================================
            TWITCH SAYS OFFLINE
            ====================================
            */

            const finalizedStatus =
                await markOffline({

                    discordUserId,

                    startedAt:
                        databaseStartedAt,

                    endedAt:
                        new Date()

                });


            if (
                !finalizedStatus
            ) {

                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Startup reconciliation could not finalize live state because the session changed.',

                    details: {

                        twitchUserId,

                        discordUserId,

                        databaseStartedAt

                    }

                });


                continue;

            }


            /*
            ====================================
            DELETE OLD NOTIFICATIONS
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

                logError({

                    type:
                        ERROR_TYPES.TWITCH_ERROR,

                    source:
                        'twitch-live-state-reconciliation',

                    message:
                        'Failed to delete stale Twitch live notification messages during startup reconciliation.',

                    details: {

                        twitchUserId,

                        discordUserId,

                        error:
                            error.message,

                        stack:
                            error.stack

                    }

                });

            }


            /*
            ====================================
            UPDATE STATISTICS
            ====================================
            */

            try {

                const durationSeconds =

                    Math.max(

                        0,

                        Math.floor(

                            (

                                Date.now()

                                -

                                new Date(
                                    databaseStartedAt
                                ).getTime()

                            )

                            /

                            1000

                        )

                    );


                await updateStatistics({

                    discordUserId,

                    streamDurationSeconds:
                        durationSeconds

                });

            }

            catch (
                error
            ) {

                logError({

                    type:
                        ERROR_TYPES.TWITCH_ERROR,

                    source:
                        'twitch-live-state-reconciliation',

                    message:
                        'Failed to update Twitch stream statistics during startup reconciliation.',

                    details: {

                        twitchUserId,

                        discordUserId,

                        error:
                            error.message,

                        stack:
                            error.stack

                    }

                });

            }


            finalizedOffline++;


            logFeature({

                category:
                    'TWITCH',

                message:
                    'Startup reconciliation finalized stale offline state.',

                details: {

                    twitchUserId,

                    discordUserId,

                    previousStartedAt:
                        databaseStartedAt,

                    endedAt:
                        finalizedStatus.ended_at

                }

            });

        }

        catch (
            error
        ) {

            failed++;


            logError({

                type:
                    ERROR_TYPES.TWITCH_ERROR,

                source:
                    'twitch-live-state-reconciliation',

                message:
                    'Failed to reconcile Twitch live state.',

                details: {

                    twitchUserId,

                    discordUserId,

                    error:
                        error.message,

                    stack:
                        error.stack

                }

            });

        }

    }


    logFeature({

        category:
            'TWITCH',

        message:
            'Twitch live-state reconciliation completed.',

        details: {

            activeStates:
                activeStatuses.length,

            confirmedLive,

            finalizedOffline,

            failed

        }

    });

}


module.exports = {
    reconcileTwitchLiveState
};
