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

async function markOffline({

    discordUserId,

    endedAt
}) {

    await pool.query(

        `
        UPDATE twitch_live_status

        SET

            live_now = FALSE,

            ended_at = $2

        WHERE

            discord_user_id = $1
        `,
        [

            discordUserId,

            endedAt
        ]
    );
}

module.exports = {
    createOrUpdateLiveStatus,
    getLiveStatus,
    markOffline
};
