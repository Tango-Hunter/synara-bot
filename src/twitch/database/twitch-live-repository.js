/**
 * Title: twitch-live-repository.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Description: Create, retrieve, reconcile, and end Twitch live status.
 */

const pool =
    require('../../core/database/postgres');


/*
====================================
CREATE OR UPDATE LIVE STATUS
====================================
*/

async function createOrUpdateLiveStatus({

    discordUserId,

    messageIds,

    streamCategory,

    streamTitle,

    thumbnailUrl,

    startedAt

}) {

    await pool.query(

        `
        INSERT INTO twitch_live_status (

            discord_user_id,

            message_ids,

            stream_category,

            stream_title,

            thumbnail_url,

            live_now,

            started_at,

            ended_at,

            updated_at

        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            TRUE,

            $6,

            NULL,

            NOW()

        )

        ON CONFLICT (
            discord_user_id
        )

        DO UPDATE SET

            message_ids =
                EXCLUDED.message_ids,

            stream_category =
                EXCLUDED.stream_category,

            stream_title =
                EXCLUDED.stream_title,

            thumbnail_url =
                EXCLUDED.thumbnail_url,

            live_now = TRUE,

            started_at =
                EXCLUDED.started_at,

            ended_at = NULL,

            updated_at = NOW()
        `,

        [

            discordUserId,

            JSON.stringify(
                messageIds
            ),

            streamCategory,

            streamTitle,

            thumbnailUrl,

            startedAt

        ]

    );

}


/*
====================================
GET LIVE STATUS
====================================
*/

async function getLiveStatus(
    discordUserId
) {

    const result =
        await pool.query(

            `
            SELECT *
            FROM twitch_live_status
            WHERE discord_user_id = $1
            `,

            [
                discordUserId
            ]

        );

    return result.rows[0] || null;
}


/*
====================================
GET ALL ACTIVE LIVE STATUSES
====================================

Returns the Twitch user ID along with
the live status record.

This is used during startup
reconciliation.
*/

async function getAllActiveLiveStatuses() {

    const result =
        await pool.query(

            `
            SELECT

                tls.*,

                tu.twitch_user_id,

                tu.twitch_login,

                tu.twitch_display_name,

                tu.twitch_profile_image_url,

                tu.notifications_enabled,

                tu.guild_ids

            FROM twitch_live_status tls

            INNER JOIN twitch_users tu

                ON tu.discord_user_id =
                    tls.discord_user_id

            WHERE

                tls.live_now = TRUE

            ORDER BY
                tls.started_at ASC
            `

        );

    return result.rows;

}


/*
====================================
GET ACTIVE STATUS BY DISCORD ID
====================================
*/

async function getActiveLiveStatusByDiscordId(
    discordUserId
) {

    const result =
        await pool.query(

            `
            SELECT *

            FROM twitch_live_status

            WHERE

                discord_user_id = $1

            AND

                live_now = TRUE
            `,

            [
                discordUserId
            ]

        );

    return result.rows[0] || null;
}


/*
====================================
CLAIM LIVE NOTIFICATION
====================================

Twitch is the source of truth.

A new stream.online event is considered
a new session when its started_at differs
from the currently stored session.

Returns:

{
    claimed: true,
    reason: 'NEW_SESSION',
    status: ...
}

or:

{
    claimed: false,
    reason: 'DUPLICATE_SESSION',
    status: ...
}
*/

async function claimLiveNotification({

    discordUserId,

    startedAt

}) {

    const existingResult =
        await pool.query(

            `
            SELECT *

            FROM twitch_live_status

            WHERE discord_user_id = $1
            `,

            [
                discordUserId
            ]

        );

    const existing =
        existingResult.rows[0] || null;


    /*
    ====================================
    NO EXISTING RECORD
    ====================================
    */

    if (!existing) {

        const result =
            await pool.query(

                `
                INSERT INTO twitch_live_status (

                    discord_user_id,

                    message_ids,

                    live_now,

                    started_at,

                    updated_at

                )

                VALUES (

                    $1,

                    '{}'::jsonb,

                    TRUE,

                    $2,

                    NOW()

                )

                RETURNING *
                `,

                [
                    discordUserId,
                    startedAt
                ]

            );


        return {

            claimed: true,

            reason:
                'NEW_SESSION',

            status:
                result.rows[0]

        };

    }


    /*
    ====================================
    SAME SESSION
    ====================================
    */

    const existingStartedAt =
        existing.started_at
            ? new Date(
                existing.started_at
            ).getTime()
            : null;

    const incomingStartedAt =
        startedAt
            ? new Date(
                startedAt
            ).getTime()
            : null;


    if (

        existing.live_now === true

        &&

        existingStartedAt ===
            incomingStartedAt

    ) {

        return {

            claimed: false,

            reason:
                'DUPLICATE_SESSION',

            status:
                existing

        };

    }


    /*
    ====================================
    NEW SESSION
    ====================================

    This is the important recovery path.

    If the database says the user is still
    live but Twitch has provided a different
    started_at, Twitch has established that
    this is a new stream session.

    We replace the stale session.
    */

    const result =
        await pool.query(

            `
            UPDATE twitch_live_status

            SET

                message_ids =
                    '{}'::jsonb,

                live_now = TRUE,

                started_at = $2,

                ended_at = NULL,

                stream_category = NULL,

                stream_title = NULL,

                thumbnail_url = NULL,

                updated_at = NOW()

            WHERE

                discord_user_id = $1

            RETURNING *
            `,

            [
                discordUserId,
                startedAt
            ]

        );


    return {

        claimed: true,

        reason:
            'NEW_SESSION',

        previousStatus:
            existing,

        status:
            result.rows[0]

    };

}


/*
====================================
UPDATE LIVE NOTIFICATION MESSAGES
====================================
*/

async function updateLiveNotificationMessages({

    discordUserId,

    messageIds,

    streamCategory,

    streamTitle,

    thumbnailUrl

}) {

    const result =
        await pool.query(

            `
            UPDATE twitch_live_status

            SET

                message_ids = $2,

                stream_category = $3,

                stream_title = $4,

                thumbnail_url = $5,

                updated_at = NOW()

            WHERE

                discord_user_id = $1

            AND

                live_now = TRUE

            RETURNING *
            `,

            [

                discordUserId,

                JSON.stringify(
                    messageIds
                ),

                streamCategory,

                streamTitle,

                thumbnailUrl

            ]

        );


    return result.rows[0] || null;

}


/*
====================================
UPDATE LIVE STREAM DATA
====================================

Used by startup reconciliation when
Twitch confirms the broadcaster is
currently live.

Twitch remains authoritative.
*/

async function updateLiveStreamData({

    discordUserId,

    startedAt,

    streamCategory,

    streamTitle,

    thumbnailUrl

}) {

    const result =
        await pool.query(

            `
            UPDATE twitch_live_status

            SET

                started_at = $2,

                stream_category = $3,

                stream_title = $4,

                thumbnail_url = $5,

                live_now = TRUE,

                ended_at = NULL,

                updated_at = NOW()

            WHERE

                discord_user_id = $1

            AND

                live_now = TRUE

            RETURNING *
            `,

            [

                discordUserId,

                startedAt,

                streamCategory,

                streamTitle,

                thumbnailUrl

            ]

        );


    return result.rows[0] || null;

}


/*
====================================
MARK OFFLINE
====================================
*/

async function markOffline({

    discordUserId,

    startedAt,

    endedAt

}) {

    const result =
        await pool.query(

            `
            UPDATE twitch_live_status

            SET

                live_now = FALSE,

                ended_at = $3,

                updated_at = NOW()

            WHERE

                discord_user_id = $1

            AND

                live_now = TRUE

            AND

                started_at = $2

            RETURNING *
            `,

            [

                discordUserId,

                startedAt,

                endedAt

            ]

        );


    return result.rows[0] || null;

}


/*
====================================
RELEASE LIVE NOTIFICATION CLAIM
====================================

Used when notification delivery fails
after the live state was successfully
claimed.
*/

async function releaseLiveNotificationClaim(
    discordUserId
) {

    await pool.query(

        `
        UPDATE twitch_live_status

        SET

            live_now = FALSE,

            message_ids = '{}'::jsonb,

            stream_category = NULL,

            stream_title = NULL,

            thumbnail_url = NULL,

            started_at = NULL,

            ended_at = NULL,

            updated_at = NOW()

        WHERE

            discord_user_id = $1

        AND

            live_now = TRUE
        `,

        [
            discordUserId
        ]

    );

}


module.exports = {

    createOrUpdateLiveStatus,
    getLiveStatus,
    getAllActiveLiveStatuses,
    getActiveLiveStatusByDiscordId,
    claimLiveNotification,
    updateLiveNotificationMessages,
    updateLiveStreamData,
    markOffline,
    releaseLiveNotificationClaim
};
