/**
 * Title: twitch-live-repository.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: Create, retrieve, and end live status.
 */

const pool = require('../../core/database/postgres');


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

            started_at

        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            TRUE,

            $6
        )

        ON CONFLICT (
            discord_user_id
        )

        DO UPDATE SET

            message_ids = EXCLUDED.message_ids,

            stream_category =
                EXCLUDED.stream_category,

            stream_title =
                EXCLUDED.stream_title,

            thumbnail_url =
                EXCLUDED.thumbnail_url,

            live_now = TRUE,

            started_at =
                EXCLUDED.started_at,

            ended_at = NULL
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

                ended_at = $3

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

async function claimLiveNotification({
    discordUserId,
    startedAt
}) {

    const result =
        await pool.query(

            `
            INSERT INTO twitch_live_status (
                discord_user_id,
                message_ids,
                live_now,
                started_at
            )

            VALUES (
                $1,
                '{}'::jsonb,
                TRUE,
                $2
            )

            ON CONFLICT (
                discord_user_id
            )

            DO UPDATE SET

                live_now = TRUE,

                started_at =
                    EXCLUDED.started_at,

                ended_at = NULL

            WHERE
                twitch_live_status.live_now = FALSE

            RETURNING *;
            `,

            [
                discordUserId,
                startedAt
            ]
        );

    return result.rows[0] || null;
}

async function updateLiveNotificationMessages({
    discordUserId,
    messageIds,
    streamCategory,
    streamTitle,
    thumbnailUrl
}) {

    await pool.query(

        `
        UPDATE twitch_live_status

        SET

            message_ids = $2,

            stream_category = $3,

            stream_title = $4,

            thumbnail_url = $5

        WHERE
            discord_user_id = $1

        AND
            live_now = TRUE
        `,

        [
            discordUserId,
            JSON.stringify(messageIds),
            streamCategory,
            streamTitle,
            thumbnailUrl
        ]
    );
}

/*
====================================
RELEASE LIVE NOTIFICATION CLAIM
====================================

Used when the live state was successfully
claimed but Discord notification delivery
failed.

This resets the live state without recording
a false stream ending.
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

            ended_at = NULL

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
    getActiveLiveStatusByDiscordId,
    markOffline,
    claimLiveNotification,
    updateLiveNotificationMessages,
    releaseLiveNotificationClaim
};
