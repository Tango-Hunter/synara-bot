/**
 * Title: twitch-live-state-reconciliation.js
 * Author: Tango Hunter
 * Date Created: 8/29/26
 * Description: Reconciles SYNARA's cached Twitch live state against Twitch Helix when SYNARA starts.
 *
 * Twitch is the definitive source of truth.
 */

const {
    getAllActiveLiveStatuses,
    markOffline,
    updateLiveStreamData,
    resetLiveSession
} = require('../database/twitch-live-repository');

const {
    getLiveStreamData
} = require('./twitch-stream-service');

const {
    deleteLiveNotifications
} = require('./stream-notifications');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
RECONCILE TWITCH LIVE STATE
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


    /*
    ====================================
    LOAD ACTIVE DATABASE STATES
    ====================================

    Only records currently marked as live
    need reconciliation.

    Twitch will determine whether each
    record is actually still live.
    */

    let activeStatuses;

    try {

        activeStatuses =
            await getAllActiveLiveStatuses();

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
                'Failed to load active Twitch live states.',

            details: {

                error:
                    error.message,

                stack:
                    error.stack

            }

        });

        throw error;

    }


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


    /*
    ====================================
    RECONCILIATION COUNTERS
    ====================================
    */

    let confirmedLive = 0;

    let sessionUpdated = 0;

    let finalizedOffline = 0;

    let failed = 0;


    /*
    ====================================
    PROCESS EACH ACTIVE RECORD
    ====================================
    */

    for (
        const status
        of activeStatuses
    ) {

        const {

            discord_user_id:
                discordUserId,

            twitch_user_id:
                twitchUserId,

            twitch_login:
                twitchLogin,

            twitch_display_name:
                twitchDisplayName,

            guild_ids:
                guildIds,

            started_at:
                databaseStartedAt,

            message_ids:
                messageIds

        } = status;


        try {

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Reconciling Twitch live state.',

                details: {

                    twitchUserId,

                    twitchLogin,

                    discordUserId,

                    guildCount:
                        guildIds?.length || 0,

                    databaseStartedAt,

                    messageCount:
                        messageIds
                            ? Object.keys(
                                messageIds
                            ).length
                            : 0

                }

            });


            /*
            ====================================
            ASK TWITCH
            ====================================

            Twitch is the definitive source
            of truth.

            We intentionally use the normal
            live-state verification service
            here so the same Twitch API logic
            is used throughout SYNARA.
            */

            const streamData =
                await getLiveStreamData(
                    twitchUserId
                );


            /*
            ====================================
            TWITCH CONFIRMS LIVE
            ====================================
            */

            if (
                streamData
            ) {

                const twitchStartedAt =
                    streamData.startedAt
                        || null;


                /*
                ====================================
                COMPARE STREAM SESSIONS
                ====================================

                If Twitch's current started_at
                matches the database, this is
                the same stream session.

                If it differs, the database contains
                a stale session and Twitch has
                established that a new stream has
                started.
                */

                const databaseStartMs =
                    databaseStartedAt
                        ? new Date(
                            databaseStartedAt
                        ).getTime()
                        : null;

                const twitchStartMs =
                    twitchStartedAt
                        ? new Date(
                            twitchStartedAt
                        ).getTime()
                        : null;


                const sameSession =

                    databaseStartMs !== null

                    &&

                    twitchStartMs !== null

                    &&

                    databaseStartMs ===
                        twitchStartMs;


                /*
                ====================================
                SAME SESSION
                ====================================
                */

                if (
                    sameSession
                ) {

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
                            'Startup reconciliation confirmed existing Twitch stream session is still live.',

                        details: {

                            twitchUserId,

                            twitchLogin,

                            discordUserId,

                            startedAt:
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
                NEW TWITCH SESSION
                ====================================

                Twitch says the broadcaster is live,
                but the database contains a different
                session.

                This means SYNARA was offline when
                the previous session ended and/or the
                new session began.

                Twitch wins.

                Before replacing the database state,
                remove any notification messages that
                belong to the stale session.
                */

                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Startup reconciliation detected a new Twitch stream session.',

                    details: {

                        twitchUserId,

                        twitchLogin,

                        discordUserId,

                        databaseStartedAt,

                        twitchStartedAt,

                        title:
                            streamData.title,

                        category:
                            streamData.category

                    }

                });


                /*
                ====================================
                DELETE STALE NOTIFICATIONS
                ====================================
                */

                if (
                    messageIds

                    &&

                    Object.keys(
                        messageIds
                    ).length > 0
                ) {

                    try {

                        await deleteLiveNotifications({

                            client,

                            messageIds

                        });


                        logFeature({

                            category:
                                'TWITCH',

                            message:
                                'Stale Twitch live notifications removed during session reconciliation.',

                            details: {

                                twitchUserId,

                                discordUserId,

                                messageIds

                            }

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
                                'Failed to remove stale Twitch live notifications during session reconciliation.',

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


                /*
                ====================================
                REPLACE DATABASE SESSION
                ====================================

                We use createOrUpdateLiveStatus
                semantics through the existing
                repository function.

                The repository's update path clears
                stale message IDs and replaces the
                session timestamp.
                */

                await resetLiveSession({

                    discordUserId,

                    startedAt:
                        twitchStartedAt
                        || databaseStartedAt,

                    streamCategory:
                        streamData.category,

                    streamTitle:
                        streamData.title,

                    thumbnailUrl:
                        streamData.thumbnailUrl

                });


                sessionUpdated++;


                /*
                ====================================
                IMPORTANT
                ====================================

                We intentionally DO NOT post a new
                live notification here.

                Startup reconciliation is responsible
                for synchronizing persistent state.

                EventSub remains responsible for
                triggering live notification delivery.

                If the stream is already live when
                SYNARA starts, the database now knows
                the correct Twitch session and will not
                be carrying stale session information.
                */


                continue;

            }


            /*
            ====================================
            TWITCH CONFIRMS OFFLINE
            ====================================

            Twitch is offline, therefore the
            database's live state is stale.
            */

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Startup reconciliation found a stale offline Twitch live state.',

                details: {

                    twitchUserId,

                    twitchLogin,

                    discordUserId,

                    databaseStartedAt

                }

            });


            /*
            ====================================
            ATOMICALLY MARK OFFLINE
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


            /*
            ====================================
            SESSION CHANGED
            ====================================

            If markOffline returned no row,
            something changed between the initial
            query and this update.

            Do not overwrite that newer state.
            */

            if (
                !finalizedStatus
            ) {

                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Startup reconciliation did not finalize the state because the active stream session changed.',

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
            DELETE STALE DISCORD NOTIFICATIONS
            ====================================
            */

            if (
                finalizedStatus.message_ids

                &&

                Object.keys(
                    finalizedStatus.message_ids
                ).length > 0
            ) {

                try {

                    await deleteLiveNotifications({

                        client,

                        messageIds:
                            finalizedStatus.message_ids

                    });


                    logFeature({

                        category:
                            'TWITCH',

                        message:
                            'Stale Twitch live notifications removed after startup offline reconciliation.',

                        details: {

                            twitchUserId,

                            discordUserId,

                            messageIds:
                                finalizedStatus.message_ids

                        }

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
                            'Failed to remove stale Twitch live notifications after startup offline reconciliation.',

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


            finalizedOffline++;


            logFeature({

                category:
                    'TWITCH',

                message:
                    'Startup reconciliation finalized stale Twitch live state.',

                details: {

                    twitchUserId,

                    twitchLogin,

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

                    twitchLogin,

                    discordUserId,

                    error:
                        error.message,

                    stack:
                        error.stack

                }

            });

        }

    }


    /*
    ====================================
    FINAL SUMMARY
    ====================================
    */

    logFeature({

        category:
            'TWITCH',

        message:
            'Twitch live-state reconciliation completed.',

        details: {

            activeStates:
                activeStatuses.length,

            confirmedLive,

            sessionUpdated,

            finalizedOffline,

            failed

        }

    });

}


module.exports = {
    reconcileTwitchLiveState
};
