/**
 * Title: twitch-statistics-repository.js
 * Author: Tango Hunter
 * Date Created: 5/31/26
 * Date Modified: 5/31/26
 * Description: Creates and modifies Twitch Statistics.
 */

const pool = require('../../core/database/postgres');

async function updateStatistics({

    discordUserId,

    streamDurationSeconds
}) {

    await pool.query(

        `
        INSERT INTO twitch_statistics (

            discord_user_id,

            total_streams,

            total_stream_duration_seconds,

            longest_stream_duration_seconds,

            last_stream_duration_seconds,

            last_stream_at

        )

        VALUES (

            $1,

            1,

            $2,

            $2,

            $2,

            NOW()
        )

        ON CONFLICT (
            discord_user_id
        )

        DO UPDATE SET

            total_streams =
                twitch_statistics.total_streams + 1,

            total_stream_duration_seconds =

                twitch_statistics
                    .total_stream_duration_seconds

                + $2,

            longest_stream_duration_seconds =

                GREATEST(

                    twitch_statistics
                        .longest_stream_duration_seconds,

                    $2
                ),

            last_stream_duration_seconds =
                $2,

            last_stream_at =
                NOW(),

            updated_at =
                NOW()
        `,
        [

            discordUserId,

            streamDurationSeconds
        ]
    );
}

async function getStatistics(
    discordUserId
) {

    const result =

        await pool.query(

            `
            SELECT *
            FROM twitch_statistics

            WHERE

                discord_user_id = $1
            `,
            [
                discordUserId
            ]
        );

    return result.rows[0] || null;
}

module.exports = {
    updateStatistics,
    getStatistics
};
